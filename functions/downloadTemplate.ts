import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Download Template - Supports both GET (302 redirect) and POST (JSON response)
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
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    step = 'method_check';
    const isGET = req.method === 'GET';
    const isPOST = req.method === 'POST';
    
    if (!isGET && !isPOST) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Method Not Allowed - use GET or POST', code: 'METHOD_NOT_ALLOWED' }),
        { status: 405, headers: corsHeaders }
      );
    }

    step = 'extract_template_key';
    let template_key;
    
    if (isGET) {
      const url = new URL(req.url);
      template_key = url.searchParams.get('template_key');
    } else {
      try {
        const rawBody = await req.text();
        const body = rawBody ? JSON.parse(rawBody) : {};
        template_key = body.template_key;
      } catch (parseError) {
        return new Response(
          JSON.stringify({ ok: false, error: `Body parse error: ${parseError.message}`, code: 'PARSE_ERROR' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    if (!template_key) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing template_key', code: 'MISSING_TEMPLATE_KEY' }),
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
        JSON.stringify({ ok: false, error: `Auth error: ${authError.message}`, code: 'AUTH_ERROR' }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (!user || !user.email) {
      return new Response(
        JSON.stringify({ ok: false, error: 'User not authenticated', code: 'UNAUTHORIZED' }),
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
        JSON.stringify({ ok: false, error: `Template fetch error: ${fetchError.message}`, code: 'FETCH_ERROR' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!templates || templates.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: `Template not found: ${template_key}`, code: 'NOT_FOUND' }),
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
          error: `Insufficient credits: need ${creditCost}, have ${currentCredits}`,
          code: 'INSUFFICIENT_CREDITS'
        }),
        { status: 402, headers: corsHeaders }
      );
    }

    step = 'storage_init';
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Storage config missing', code: 'CONFIG_ERROR' }),
        { status: 500, headers: corsHeaders }
      );
    }

    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (storageError) {
      return new Response(
        JSON.stringify({ ok: false, error: `Storage init error: ${storageError.message}`, code: 'STORAGE_ERROR' }),
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
              error: 'File generation returned not ok',
              code: 'GENERATION_FAILED',
              details: genResponse?.data 
            }),
            { status: 500, headers: corsHeaders }
          );
        }

        filePath = genResponse.data.file_path;
        
        if (!filePath) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Generated file has no path', code: 'NO_FILE_PATH' }),
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
            error: `Generation failed: ${genError.message}`,
            code: 'GENERATION_ERROR',
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
            error: `Signed URL creation failed: ${urlError?.message || 'no URL returned'}`,
            code: 'URL_CREATION_FAILED'
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      signedUrl = urlData.signedUrl;
    } catch (urlError) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `URL error: ${urlError.message}`,
          code: 'URL_ERROR',
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
            error: `URL not accessible: ${headCheck.status} ${headCheck.statusText}`,
            code: 'URL_NOT_ACCESSIBLE'
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    } catch (checkError) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `URL check failed: ${checkError.message}`,
          code: 'URL_CHECK_FAILED'
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
          error: `Credit deduction failed: ${creditError.message}`,
          code: 'CREDIT_DEDUCTION_FAILED',
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

    console.log('[DOWNLOAD] Success:', { user: user.email, template: template_key, method: req.method });

    // Return based on method
    if (isGET) {
      // GET: Return 302 redirect to signed URL
      return new Response(null, {
        status: 302,
        headers: {
          'Location': signedUrl,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      // POST: Return JSON response
      return new Response(
        JSON.stringify({ ok: true, url: signedUrl, filename }),
        { status: 200, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('[DOWNLOAD] Unexpected error at step:', step, error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message || 'Unknown error',
        code: 'INTERNAL_ERROR',
        step,
        name: error.name || 'Error',
        stack: (error.stack || '').slice(0, 1200)
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});