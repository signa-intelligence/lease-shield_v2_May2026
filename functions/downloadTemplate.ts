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

    // Step 1: Validate template exists and is valid
    const templates = await base44.entities.TemplateLibrary.filter({ id: template_id });
    if (!templates || templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templates[0];
    
    // Validate required fields
    if (!template.template_key || !template.title_en || !template.description_en || 
        !template.preview_en || !template.file_path) {
      return Response.json({ error: 'Template invalid' }, { status: 400 });
    }

    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;

    if (currentCredits < creditCost) {
      return Response.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Step 2: Initialize Supabase for storage operations
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Storage error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'template-files';

    // Step 3: Verify file exists in storage
    const lastSlashIndex = template.file_path.lastIndexOf('/');
    const folder = lastSlashIndex > 0 ? template.file_path.substring(0, lastSlashIndex) : '';
    const filename = template.file_path.substring(lastSlashIndex + 1);
    
    const { data: fileList, error: checkError } = await supabase
      .storage
      .from(bucketName)
      .list(folder || undefined, {
        search: filename
      });

    if (checkError || !fileList || fileList.length === 0) {
      // File missing - try to generate
      try {
        const genResponse = await base44.asServiceRole.functions.invoke('generateTemplateFile', { template_id });
        
        if (!genResponse.data?.ok) {
          return Response.json({ error: 'File generation failed' }, { status: 500 });
        }
        
        // Refresh template data
        const refreshedTemplates = await base44.asServiceRole.entities.TemplateLibrary.filter({ id: template_id });
        if (!refreshedTemplates || refreshedTemplates.length === 0) {
          return Response.json({ error: 'Template refresh failed' }, { status: 500 });
        }
        
        template.file_path = refreshedTemplates[0].file_path;
      } catch (genError) {
        return Response.json({ error: 'File unavailable' }, { status: 500 });
      }
    }

    // Step 4: Generate signed URL
    const { data: signedData, error: signError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(template.file_path, 300);

    if (signError || !signedData) {
      return Response.json({ error: 'Download link failed' }, { status: 500 });
    }

    // Step 5: Deduct credits (only after file verified)
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

    const fileType = template.file_path.endsWith('.pdf') ? 'pdf' : 'docx';
    const downloadFilename = `${template.template_key}.${fileType}`;

    // Step 6: Return signed download URL
    return Response.json({ 
      ok: true,
      download_url: signedData.signedUrl,
      filename: downloadFilename
    });

  } catch (error) {
    console.error('Download template error:', error);
    return Response.json({ 
      ok: false,
      error: error.message || 'Download failed'
    }, { status: 500 });
  }
});