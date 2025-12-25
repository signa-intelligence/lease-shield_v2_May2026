import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Download Template - Streams file directly
 * Deducts credits ONLY after verifying file exists
 */

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id } = await req.json();

    if (!template_id) {
      return Response.json({ error: 'Missing template_id' }, { status: 400 });
    }

    // Step 1: Validate template
    const templates = await base44.entities.TemplateLibrary.filter({ id: template_id });
    if (!templates || templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templates[0];
    
    if (!template.template_key || !template.file_path) {
      return Response.json({ error: 'Template invalid' }, { status: 400 });
    }

    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;

    if (currentCredits < creditCost) {
      return Response.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Step 2: Fetch file from storage
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Storage configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'template-files';

    // Try to download file
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucketName)
      .download(template.file_path);

    // If file doesn't exist, generate it
    if (downloadError || !fileData) {
      console.log('[DOWNLOAD] File missing, generating:', template.file_path);
      
      try {
        const genResponse = await base44.asServiceRole.functions.invoke('generateTemplateFile', { template_id });
        
        if (!genResponse.data?.ok) {
          return Response.json({ error: 'File generation failed' }, { status: 500 });
        }
        
        // Retry download after generation
        const { data: retryData, error: retryError } = await supabase
          .storage
          .from(bucketName)
          .download(template.file_path);
        
        if (retryError || !retryData) {
          return Response.json({ error: 'File unavailable after generation' }, { status: 500 });
        }
        
        // Use the newly generated file
        fileData = retryData;
      } catch (genError) {
        console.error('[DOWNLOAD] Generation error:', genError);
        return Response.json({ error: 'File unavailable' }, { status: 500 });
      }
    }

    // Step 3: Deduct credits (only after file verified)
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
    } catch (creditError) {
      console.error('[DOWNLOAD] Credit deduction failed:', creditError);
      return Response.json({ error: 'Credit deduction failed' }, { status: 500 });
    }

    // Log usage
    try {
      await base44.asServiceRole.entities.LetterUsage.create({
        user_email: user.email,
        template_key: template.template_key,
        recipient_type: 'landlord',
        languages_generated: ['th', 'en'],
        credits_used: creditCost,
        generated_at: new Date().toISOString()
      });
    } catch {}

    // Step 4: Return file directly as binary stream
    const fileType = template.file_path.endsWith('.pdf') ? 'pdf' : 'docx';
    const downloadFilename = `LEASESHIELD_${template.template_key}.${fileType}`;
    const contentType = fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    console.log('[DOWNLOAD] Streaming file:', downloadFilename);

    return new Response(fileData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('[DOWNLOAD] Error:', error);
    return Response.json({ 
      error: error.message || 'Download failed'
    }, { status: 500 });
  }
});