import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Download Template - Base44 Function
 * Called via: await base44.functions.invoke('downloadTemplate', { template_key })
 * Returns: { ok: true, signedUrl, filename } OR { ok: false, code, message }
 */

Deno.serve(async (req) => {
  const VERSION = 'v2025-12-25-03';
  
  const baseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json'
  };

  let step = 'init';

  try {
    const method = req.method.toUpperCase();

    // OPTIONS (CORS preflight)
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: baseHeaders
      });
    }

    // Only POST allowed (Base44 SDK uses POST for function invocation)
    if (method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Method ${method} not allowed. This function must be called via base44.functions.invoke()`,
          code: 'METHOD_NOT_ALLOWED',
          version: VERSION
        }),
        { 
          status: 405,
          headers: { ...baseHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    step = 'extract_template_key';
    let template_key;
    try {
      const rawBody = await req.text();
      const body = rawBody ? JSON.parse(rawBody) : {};
      template_key = body.template_key;
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Body parse error: ${parseError.message}`, 
          code: 'PARSE_ERROR' 
        }),
        { 
          status: 400, 
          headers: { ...baseHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!template_key) {
      return Response.json({ 
        ok: false, 
        code: 'MISSING_TEMPLATE_KEY',
        message: 'Missing template_key parameter'
      }, { status: 400, headers: baseHeaders });
    }

    step = 'auth';
    let base44, user;
    try {
      base44 = createClientFromRequest(req);
      user = await base44.auth.me();
    } catch (authError) {
      return Response.json({ 
        ok: false, 
        code: 'AUTH_ERROR',
        message: `Auth error: ${authError.message}`
      }, { status: 401, headers: baseHeaders });
    }

    if (!user || !user.email) {
      return Response.json({ 
        ok: false, 
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      }, { status: 401, headers: baseHeaders });
    }

    step = 'fetch_template';
    let templates;
    try {
      templates = await base44.asServiceRole.entities.TemplateLibrary.filter({ template_key });
    } catch (fetchError) {
      return Response.json({ 
        ok: false, 
        code: 'FETCH_ERROR',
        message: `Template fetch error: ${fetchError.message}`
      }, { status: 500, headers: baseHeaders });
    }

    if (!templates || templates.length === 0) {
      return Response.json({ 
        ok: false, 
        code: 'NOT_FOUND',
        message: `Template not found: ${template_key}`
      }, { status: 404, headers: baseHeaders });
    }

    const template = templates[0];

    step = 'check_credits';
    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;

    if (currentCredits < creditCost) {
      return Response.json({ 
        ok: false, 
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits: need ${creditCost}, have ${currentCredits}`
      }, { status: 402, headers: baseHeaders });
    }

    step = 'storage_init';
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ 
        ok: false, 
        code: 'CONFIG_ERROR',
        message: 'Storage configuration missing'
      }, { status: 500, headers: baseHeaders });
    }

    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (storageError) {
      return Response.json({ 
        ok: false, 
        code: 'STORAGE_ERROR',
        message: `Storage init error: ${storageError.message}`
      }, { status: 500, headers: baseHeaders });
    }

    const bucketName = 'template-files';
    let filePath = template.file_path;

    step = 'ensure_file_exists';
    if (!filePath) {
      step = 'generate_file';
      try {
        const genResponse = await base44.asServiceRole.functions.invoke('generateTemplateFile', {
          template_id: template.id
        });

        if (!genResponse?.data?.ok) {
          return Response.json({ 
            ok: false, 
            code: 'GENERATION_FAILED',
            message: 'File generation failed',
            details: genResponse?.data 
          }, { status: 500, headers: baseHeaders });
        }

        filePath = genResponse.data.file_path;
        
        if (!filePath) {
          return Response.json({ 
            ok: false, 
            code: 'NO_FILE_PATH',
            message: 'Generated file has no path'
          }, { status: 500, headers: baseHeaders });
        }

        try {
          await base44.asServiceRole.entities.TemplateLibrary.update(template.id, {
            file_path: filePath
          });
        } catch (updateError) {
          console.warn('Failed to update template file_path:', updateError);
        }
      } catch (genError) {
        return Response.json({ 
          ok: false, 
          code: 'GENERATION_ERROR',
          message: `Generation error: ${genError.message}`
        }, { status: 500, headers: baseHeaders });
      }
    }

    step = 'create_signed_url';
    let signedUrl;
    try {
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl(filePath, 600);

      if (urlError || !urlData?.signedUrl) {
        return Response.json({ 
          ok: false, 
          code: 'URL_CREATION_FAILED',
          message: `Signed URL creation failed: ${urlError?.message || 'no URL returned'}`
        }, { status: 500, headers: baseHeaders });
      }

      signedUrl = urlData.signedUrl;
    } catch (urlError) {
      return Response.json({ 
        ok: false, 
        code: 'URL_ERROR',
        message: `URL error: ${urlError.message}`
      }, { status: 500, headers: baseHeaders });
    }

    step = 'url_access_check';
    try {
      const headCheck = await fetch(signedUrl, { method: 'HEAD' });
      if (!headCheck.ok) {
        return Response.json({ 
          ok: false, 
          code: 'URL_NOT_ACCESSIBLE',
          message: `URL not accessible: ${headCheck.status}`
        }, { status: 500, headers: baseHeaders });
      }
    } catch (checkError) {
      return Response.json({ 
        ok: false, 
        code: 'URL_CHECK_FAILED',
        message: `URL check failed: ${checkError.message}`
      }, { status: 500, headers: baseHeaders });
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
      return Response.json({ 
        ok: false, 
        code: 'CREDIT_DEDUCTION_FAILED',
        message: `Credit deduction failed: ${creditError.message}`
      }, { status: 402, headers: baseHeaders });
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
    
    console.log('[DOWNLOAD] Success:', { 
      user: user.email, 
      template: template_key,
      filename,
      signedUrlHost: new URL(signedUrl).host
    });

    // Return JSON with signed URL for browser download
    return Response.json({ 
      ok: true, 
      signedUrl, 
      filename
    }, { status: 200, headers: baseHeaders });

  } catch (error) {
    console.error('[DOWNLOAD] Unexpected error at step:', step, error);
    return Response.json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error.message || 'Unknown error',
      step
    }, { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    });
  }
});