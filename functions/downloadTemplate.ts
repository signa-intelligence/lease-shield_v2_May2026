import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Download Template - Credit Deduction + Signed URL
 * Atomically deducts credits ONLY after verifying file exists
 */

Deno.serve(async (req) => {
  const debugLog = {
    timestamp: new Date().toISOString(),
    steps: []
  };
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id } = await req.json();
    debugLog.template_id = template_id;
    debugLog.user_email = user.email;

    if (!template_id) {
      return Response.json({ error: 'Missing template_id' }, { status: 400 });
    }

    // Step 1: Validate template exists and is valid
    debugLog.steps.push('fetch_template');
    const templates = await base44.entities.TemplateLibrary.filter({ id: template_id });
    if (!templates || templates.length === 0) {
      debugLog.error = 'template_not_found';
      console.error('[DOWNLOAD]', debugLog);
      return Response.json({ error: 'Template not found', details: debugLog }, { status: 404 });
    }

    const template = templates[0];
    debugLog.template_key = template.template_key;
    debugLog.file_path = template.file_path;
    
    // Validate required fields
    if (!template.template_key || !template.title_en || !template.description_en || 
        !template.preview_en || !template.file_path) {
      debugLog.error = 'template_invalid';
      debugLog.missing_fields = {
        template_key: !template.template_key,
        title_en: !template.title_en,
        description_en: !template.description_en,
        preview_en: !template.preview_en,
        file_path: !template.file_path
      };
      console.error('[DOWNLOAD]', debugLog);
      return Response.json({ error: 'Template invalid', details: debugLog }, { status: 400 });
    }

    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;
    debugLog.credits_required = creditCost;
    debugLog.credits_available = currentCredits;

    if (currentCredits < creditCost) {
      debugLog.error = 'insufficient_credits';
      console.error('[DOWNLOAD]', debugLog);
      return Response.json({ error: 'Insufficient credits', details: debugLog }, { status: 402 });
    }

    // Step 2: Initialize Supabase for storage operations
    debugLog.steps.push('init_storage');
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      debugLog.error = 'missing_storage_config';
      console.error('[DOWNLOAD]', debugLog);
      return Response.json({ error: 'Storage error', details: debugLog }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'template-files';
    debugLog.bucket = bucketName;

    // Step 3: Verify file exists in storage
    debugLog.steps.push('verify_file');
    const lastSlashIndex = template.file_path.lastIndexOf('/');
    const folder = lastSlashIndex > 0 ? template.file_path.substring(0, lastSlashIndex) : '';
    const filename = template.file_path.substring(lastSlashIndex + 1);
    debugLog.folder = folder || '(root)';
    debugLog.filename = filename;
    
    const { data: fileList, error: checkError } = await supabase
      .storage
      .from(bucketName)
      .list(folder || undefined, {
        search: filename
      });

    debugLog.file_exists = !checkError && fileList && fileList.length > 0;
    
    if (checkError || !fileList || fileList.length === 0) {
      debugLog.steps.push('file_missing_attempt_generate');
      debugLog.check_error = checkError?.message;
      
      // File missing - try to generate
      try {
        const genResponse = await base44.asServiceRole.functions.invoke('generateTemplateFile', { template_id });
        
        if (!genResponse.data?.ok) {
          debugLog.error = 'generation_failed';
          debugLog.generation_response = genResponse.data;
          console.error('[DOWNLOAD]', debugLog);
          return Response.json({ error: 'File generation failed', details: debugLog }, { status: 500 });
        }
        
        debugLog.steps.push('file_generated');
        
        // Refresh template data
        const refreshedTemplates = await base44.asServiceRole.entities.TemplateLibrary.filter({ id: template_id });
        if (!refreshedTemplates || refreshedTemplates.length === 0) {
          debugLog.error = 'refresh_failed';
          console.error('[DOWNLOAD]', debugLog);
          return Response.json({ error: 'Template refresh failed', details: debugLog }, { status: 500 });
        }
        
        template.file_path = refreshedTemplates[0].file_path;
        debugLog.file_path_after_gen = template.file_path;
      } catch (genError) {
        debugLog.error = 'generation_error';
        debugLog.generation_error = genError.message;
        console.error('[DOWNLOAD]', debugLog);
        return Response.json({ error: 'File unavailable', details: debugLog }, { status: 500 });
      }
    }

    // Step 4: Generate signed URL
    debugLog.steps.push('generate_signed_url');
    const { data: signedData, error: signError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(template.file_path, 300);

    if (signError || !signedData) {
      debugLog.error = 'signed_url_failed';
      debugLog.sign_error = signError?.message;
      console.error('[DOWNLOAD]', debugLog);
      return Response.json({ error: 'Download link failed', details: debugLog }, { status: 500 });
    }

    debugLog.signed_url_generated = true;
    debugLog.url_preview = signedData.signedUrl.substring(0, 80) + '...';

    // Step 5: Deduct credits (only after file verified)
    debugLog.steps.push('deduct_credits');
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
      
      debugLog.credit_deducted = true;
      debugLog.new_balance = currentCredits - creditCost;
    } catch (creditError) {
      debugLog.error = 'credit_deduction_failed';
      debugLog.credit_error = creditError.message;
      console.error('[DOWNLOAD]', debugLog);
      return Response.json({ error: 'Credit deduction failed', details: debugLog }, { status: 500 });
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
    const downloadFilename = `LEASESHIELD_${template.template_key}.${fileType}`;
    debugLog.filename = downloadFilename;

    // Step 6: Return signed download URL
    debugLog.steps.push('success');
    console.log('[DOWNLOAD] Success:', debugLog);
    
    return Response.json({ 
      ok: true,
      download_url: signedData.signedUrl,
      filename: downloadFilename,
      debug: debugLog
    });

  } catch (error) {
    debugLog.error = 'unexpected_error';
    debugLog.error_message = error.message;
    debugLog.error_stack = error.stack;
    console.error('[DOWNLOAD] Error:', debugLog);
    
    return Response.json({ 
      ok: false,
      error: error.message || 'Download failed',
      details: debugLog
    }, { status: 500 });
  }
});