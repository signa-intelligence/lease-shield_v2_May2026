import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Download Template - Returns download URL (not binary stream)
 * Step-tracked error handling with guaranteed JSON responses
 */

Deno.serve(async (req) => {
  let step = 'init';
  const corsHeaders = {
    'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    step = 'method_check';
    if (req.method !== 'POST') {
      return Response.json(
        { ok: false, step, message: 'Method Not Allowed - use POST' },
        { status: 405, headers: corsHeaders }
      );
    }

    step = 'parse_body';
    let body;
    try {
      const rawBody = await req.text();
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return Response.json(
        { ok: false, step, message: 'Invalid JSON body', error: parseError.message },
        { status: 400, headers: corsHeaders }
      );
    }

    const template_key = body.template_key || body.template_id;
    if (!template_key) {
      return Response.json(
        { ok: false, step, message: 'Missing template_key in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    step = 'auth';
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json(
        { ok: false, step, message: 'Unauthorized - user not authenticated' },
        { status: 401, headers: corsHeaders }
      );
    }

    step = 'fetch_template';
    const templates = await base44.asServiceRole.entities.TemplateLibrary.filter({ 
      template_key 
    });

    if (!templates || templates.length === 0) {
      return Response.json(
        { ok: false, step, message: `Template not found: ${template_key}` },
        { status: 404, headers: corsHeaders }
      );
    }

    const template = templates[0];

    step = 'check_credits';
    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;

    if (currentCredits < creditCost) {
      return Response.json(
        { ok: false, step, message: `Insufficient credits: need ${creditCost}, have ${currentCredits}` },
        { status: 402, headers: corsHeaders }
      );
    }

    step = 'storage_config';
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { ok: false, step, message: 'Storage configuration missing' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'template-files';
    let filePath = template.file_path;

    // If no file_path or file doesn't exist, generate it
    if (!filePath) {
      step = 'generate_missing_file';
      try {
        const genResponse = await base44.asServiceRole.functions.invoke('generateTemplateFile', {
          template_id: template.id
        });

        if (!genResponse?.data?.ok || !genResponse?.data?.file_path) {
          return Response.json(
            { ok: false, step, message: 'File generation failed', details: genResponse?.data },
            { status: 500, headers: corsHeaders }
          );
        }

        filePath = genResponse.data.file_path;
        
        // Update template with new file_path
        await base44.asServiceRole.entities.TemplateLibrary.update(template.id, {
          file_path: filePath
        });
      } catch (genError) {
        return Response.json(
          { ok: false, step, message: 'File generation exception', error: genError.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    step = 'verify_file_exists';
    const { data: fileList, error: listError } = await supabase
      .storage
      .from(bucketName)
      .list(filePath.split('/').slice(0, -1).join('/'));

    const fileName = filePath.split('/').pop();
    const fileExists = fileList?.some(f => f.name === fileName);

    if (!fileExists) {
      // Try to generate it
      step = 'generate_on_verify';
      try {
        const genResponse = await base44.asServiceRole.functions.invoke('generateTemplateFile', {
          template_id: template.id
        });

        if (!genResponse?.data?.ok) {
          return Response.json(
            { ok: false, step, message: 'File not found and generation failed' },
            { status: 500, headers: corsHeaders }
          );
        }

        filePath = genResponse.data.file_path;
      } catch {
        return Response.json(
          { ok: false, step, message: 'File not found in storage and generation failed' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    step = 'generate_signed_url';
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(filePath, 600); // 10 minutes

    if (signedError || !signedData?.signedUrl) {
      return Response.json(
        { ok: false, step, message: 'Failed to create download URL', error: signedError?.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const downloadUrl = signedData.signedUrl;

    step = 'url_access_check';
    try {
      const headResponse = await fetch(downloadUrl, { method: 'HEAD' });
      if (!headResponse.ok) {
        return Response.json(
          { ok: false, step, message: `Download URL not accessible: ${headResponse.status}` },
          { status: 500, headers: corsHeaders }
        );
      }
    } catch (checkError) {
      return Response.json(
        { ok: false, step, message: 'URL accessibility check failed', error: checkError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    step = 'deduct_credit';
    try {
      await base44.asServiceRole.entities.CreditsLedger.create({
        user_id: user.id,
        user_email: user.email,
        type: 'letters',
        delta: -creditCost,
        reason: 'purchase',
        source_ref: `template_download:${template.template_key}`
      });

      await base44.asServiceRole.entities.User.update(user.id, {
        letter_credits: Math.max(0, currentCredits - creditCost)
      });
    } catch (creditError) {
      return Response.json(
        { ok: false, step, message: 'Credit deduction failed', error: creditError.message },
        { status: 402, headers: corsHeaders }
      );
    }

    // Log usage
    step = 'log_usage';
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

    step = 'success';
    const fileType = filePath.endsWith('.pdf') ? 'pdf' : 'docx';
    const filename = `LeaseShield_${template.template_key}.${fileType}`;

    console.log('[DOWNLOAD] Success:', { user: user.email, template: template.template_key, filename });

    return Response.json(
      { ok: true, url: downloadUrl, filename },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[DOWNLOAD] Crash at step:', step, error);
    return Response.json(
      {
        ok: false,
        step,
        message: error.message || 'Unknown error',
        name: error.name || 'Error',
        stack: (error.stack || '').slice(0, 1200)
      },
      { status: 500, headers: corsHeaders }
    );
  }
});