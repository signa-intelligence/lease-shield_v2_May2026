import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Download Template - Returns signed URL (not binary stream)
 * Guaranteed JSON responses with step tracking
 */

Deno.serve(async (req) => {
  let step = 'init';
  const corsHeaders = {
    'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  try {
    step = 'handle_options';
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
      return new Response(
        JSON.stringify({ ok: false, step, message: 'Method Not Allowed - use POST' }),
        { status: 405, headers: corsHeaders }
      );
    }

    step = 'parse_body';
    let body;
    try {
      const rawBody = await req.text();
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseError) {
      return new Response(
        JSON.stringify({ ok: false, step, message: `Body parse error: ${parseError.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    const template_key = body.template_key;
    if (!template_key) {
      return new Response(
        JSON.stringify({ ok: false, step, message: 'Missing template_key in body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    step = 'auth';
    let base44, user;
    try {
      base44 = createClientFromRequest(req);
      user = await base44.auth.me();
    } catch (authError) {
      return new Response(
        JSON.stringify({ ok: false, step, message: `Auth error: ${authError.message}` }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (!user || !user.email) {
      return new Response(
        JSON.stringify({ ok: false, step, message: 'User not authenticated' }),
        { status: 401, headers: corsHeaders }
      );
    }

    step = 'fetch_template';
    let templates;
    try {
      templates = await base44.asServiceRole.entities.TemplateLibrary.filter({ 
        template_key 
      });
    } catch (fetchError) {
      return new Response(
        JSON.stringify({ ok: false, step, message: `Template fetch error: ${fetchError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!templates || templates.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, step, message: `Template not found: ${template_key}` }),
        { status: 404, headers: corsHeaders }
      );
    }

    const template = templates[0];

    step = 'check_credits';
    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;

    if (currentCredits < creditCost) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          step, 
          message: `Insufficient credits: need ${creditCost}, have ${currentCredits}` 
        }),
        { status: 402, headers: corsHeaders }
      );
    }

    step = 'storage_init';
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ ok: false, step, message: 'Storage config missing' }),
        { status: 500, headers: corsHeaders }
      );
    }

    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (storageError) {
      return new Response(
        JSON.stringify({ ok: false, step, message: `Storage init error: ${storageError.message}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    const bucketName = 'template-files';
    let filePath = template.file_path;

    // Check if file exists, generate if not
    step = 'check_file_exists';
    if (!filePath) {
      step = 'generate_file';
      try {
        const genResponse = await base44.asServiceRole.functions.invoke('generateTemplateFile', {
          template_id: template.id
        });

        if (!genResponse?.data?.ok) {
          return new Response(
            JSON.stringify({ 
              ok: false, 
              step, 
              message: 'File generation returned not ok',
              details: genResponse?.data 
            }),
            { status: 500, headers: corsHeaders }
          );
        }

        filePath = genResponse.data.file_path;
        
        if (!filePath) {
          return new Response(
            JSON.stringify({ ok: false, step, message: 'Generated file has no path' }),
            { status: 500, headers: corsHeaders }
          );
        }

        // Update template
        try {
          await base44.asServiceRole.entities.TemplateLibrary.update(template.id, {
            file_path: filePath
          });
        } catch (updateError) {
          console.warn('Failed to update template file_path:', updateError);
        }
      } catch (genError) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            step, 
            message: `Generation failed: ${genError.message}`,
            stack: (genError.stack || '').slice(0, 600)
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    step = 'create_signed_url';
    let signedUrl;
    try {
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl(filePath, 600); // 10 min expiry

      if (urlError || !urlData?.signedUrl) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            step, 
            message: `Signed URL creation failed: ${urlError?.message || 'no URL returned'}` 
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      signedUrl = urlData.signedUrl;
    } catch (urlError) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          step, 
          message: `URL error: ${urlError.message}`,
          stack: (urlError.stack || '').slice(0, 600)
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    step = 'url_access_check';
    try {
      const headCheck = await fetch(signedUrl, { method: 'HEAD' });
      if (!headCheck.ok) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            step, 
            message: `URL not accessible: ${headCheck.status} ${headCheck.statusText}` 
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    } catch (checkError) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          step, 
          message: `URL check failed: ${checkError.message}` 
        }),
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
        source_ref: `template_download:${template_key}`
      });

      await base44.asServiceRole.entities.User.update(user.id, {
        letter_credits: Math.max(0, currentCredits - creditCost)
      });
    } catch (creditError) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          step, 
          message: `Credit deduction failed: ${creditError.message}`,
          stack: (creditError.stack || '').slice(0, 600)
        }),
        { status: 402, headers: corsHeaders }
      );
    }

    // Log usage (non-critical)
    try {
      await base44.asServiceRole.entities.LetterUsage.create({
        user_email: user.email,
        template_key: template_key,
        recipient_type: 'landlord',
        languages_generated: ['th', 'en'],
        credits_used: creditCost,
        generated_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Usage logging failed:', logError);
    }

    step = 'success';
    const fileType = filePath.endsWith('.pdf') ? 'pdf' : 'docx';
    const filename = `LeaseShield_${template_key}.${fileType}`;

    console.log('[DOWNLOAD] Success:', { user: user.email, template: template_key });

    return new Response(
      JSON.stringify({ ok: true, url: signedUrl, filename }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[DOWNLOAD] Unexpected error at step:', step, error);
    return new Response(
      JSON.stringify({
        ok: false,
        step,
        message: error.message || 'Unknown error',
        name: error.name || 'Error',
        stack: (error.stack || '').slice(0, 1200)
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});