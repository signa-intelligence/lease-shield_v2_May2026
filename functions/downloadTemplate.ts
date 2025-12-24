import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Download Template - Credit Deduction + Signed URL
 * Atomically deducts credits ONLY after verifying file exists
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id } = await req.json();

    if (!template_id) {
      return Response.json({ error: 'Missing template_id' }, { status: 400 });
    }

    // Fetch template details
    const templates = await base44.entities.TemplateLibrary.filter({ id: template_id });
    if (!templates || templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templates[0];
    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;

    // Check sufficient credits FIRST
    if (currentCredits < creditCost) {
      return Response.json({
        error: 'Insufficient credits',
        required: creditCost,
        available: currentCredits
      }, { status: 402 });
    }

    // Validate file_path exists
    if (!template.file_path) {
      return Response.json({ 
        error: 'Template file not configured',
        message: 'This template is not ready for download. Please contact support.'
      }, { status: 400 });
    }

    // Initialize Supabase client for storage operations
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return Response.json({ error: 'Storage configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'template-files';

    // Extract folder and filename from file_path
    const lastSlashIndex = template.file_path.lastIndexOf('/');
    const folder = lastSlashIndex > 0 ? template.file_path.substring(0, lastSlashIndex) : '';
    const filename = template.file_path.substring(lastSlashIndex + 1);

    // Verify file exists in storage BEFORE deducting credits
    const { data: fileList, error: checkError } = await supabase
      .storage
      .from(bucketName)
      .list(folder || undefined, {
        search: filename
      });

    if (checkError || !fileList || fileList.length === 0) {
      console.error('File verification failed:', checkError, 'Path:', template.file_path);
      return Response.json({ 
        error: 'Template file not found',
        message: 'The template file is missing from storage. Please contact support.',
        file_path: template.file_path
      }, { status: 404 });
    }

    console.log(`✅ File verified: ${template.file_path}`);

    // Generate signed URL (valid for 5 minutes)
    const { data: signedData, error: signError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(template.file_path, 300);

    if (signError || !signedData) {
      console.error('Signed URL generation failed:', signError);
      return Response.json({ 
        error: 'Failed to generate download link',
        message: 'Could not create secure download link. Please try again.'
      }, { status: 500 });
    }

    console.log(`✅ Signed URL generated for: ${template.file_path}`);

    // NOW deduct credits atomically (only after file verification succeeded)
    try {
      await base44.asServiceRole.entities.CreditsLedger.create({
        user_id: user.id,
        user_email: user.email,
        type: 'letters',
        delta: -creditCost,
        reason: 'purchase',
        source_ref: `template_download:${template.template_key}`
      });

      await base44.auth.updateMe({
        letter_credits: Math.max(0, currentCredits - creditCost)
      });

      console.log(`✅ Credits deducted: ${creditCost} from ${user.email}`);
    } catch (creditError) {
      console.error('Credit deduction failed:', creditError);
      return Response.json({ error: 'Credit deduction failed' }, { status: 500 });
    }

    // Log download usage
    try {
      await base44.asServiceRole.entities.LetterUsage.create({
        user_email: user.email,
        template_key: template.template_key,
        recipient_type: 'landlord',
        languages_generated: ['th', 'en'],
        credits_used: creditCost,
        generated_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log usage:', logError);
      // Non-critical, continue
    }

    const fileType = template.file_path.endsWith('.pdf') ? 'pdf' : 'docx';
    const downloadFilename = `${template.template_key}.${fileType}`;

    console.log(`✅ Download authorized: ${downloadFilename} for ${user.email}`);

    // Return signed download URL
    return Response.json({ 
      ok: true,
      download_url: signedData.signedUrl,
      filename: downloadFilename,
      credits_remaining: currentCredits - creditCost,
      template_name: template.title_en || template.title_th
    });

  } catch (error) {
    console.error('Download template error:', error);
    return Response.json({ 
      ok: false,
      error: error.message || 'Download failed'
    }, { status: 500 });
  }
});