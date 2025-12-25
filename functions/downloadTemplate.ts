import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const LOG_PREFIX = '[DOWNLOAD_TEMPLATE_DEBUG]';

Deno.serve(async (req) => {
  const VERSION = 'v2025-12-25-04-DEBUG';
  
  const baseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json'
  };

  let step = 'init';

  try {
    console.log(LOG_PREFIX, 'Function invoked', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
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
      console.log(LOG_PREFIX, 'Authenticated user:', {
        id: user?.id,
        email: user?.email,
        letter_credits: user?.letter_credits
      });
    } catch (authError) {
      console.error(LOG_PREFIX, 'Auth error:', authError);
      return Response.json({ 
        error: true,
        step: 'auth',
        message: authError.message,
        stack: authError.stack
      }, { status: 500, headers: baseHeaders });
    }

    if (!user || !user.email) {
      console.error(LOG_PREFIX, 'User not authenticated');
      return Response.json({ 
        error: true,
        step: 'auth',
        message: 'User not authenticated'
      }, { status: 401, headers: baseHeaders });
    }

    step = 'fetch_template';
    let templates;
    try {
      console.log(LOG_PREFIX, 'Fetching template with key:', template_key);
      templates = await base44.asServiceRole.entities.TemplateLibrary.filter({ template_key });
      console.log(LOG_PREFIX, 'Template fetch result:', {
        count: templates?.length,
        found: templates?.length > 0
      });
    } catch (fetchError) {
      console.error(LOG_PREFIX, 'Template fetch error:', fetchError);
      return Response.json({ 
        error: true,
        step: 'fetch_template',
        message: fetchError.message,
        stack: fetchError.stack
      }, { status: 500, headers: baseHeaders });
    }

    if (!templates || templates.length === 0) {
      console.error(LOG_PREFIX, 'Template not found:', template_key);
      return Response.json({ 
        error: true,
        step: 'fetch_template',
        message: `Template not found: ${template_key}`
      }, { status: 404, headers: baseHeaders });
    }

    const template = templates[0];
    console.log(LOG_PREFIX, 'Template data:', {
      id: template.id,
      template_key: template.template_key,
      file_path: template.file_path,
      cost_credits: template.cost_credits
    });

    step = 'check_credits';
    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;
    console.log(LOG_PREFIX, 'Credit check:', { creditCost, currentCredits });

    if (currentCredits < creditCost) {
      console.error(LOG_PREFIX, 'Insufficient credits');
      return Response.json({ 
        error: true,
        step: 'check_credits',
        message: `Insufficient credits: need ${creditCost}, have ${currentCredits}`
      }, { status: 402, headers: baseHeaders });
    }

    step = 'storage_init';
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
    console.log(LOG_PREFIX, 'Storage config:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlHost: supabaseUrl ? new URL(supabaseUrl).host : 'none'
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error(LOG_PREFIX, 'Storage configuration missing');
      return Response.json({ 
        error: true,
        step: 'storage_init',
        message: 'Storage configuration missing'
      }, { status: 500, headers: baseHeaders });
    }

    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log(LOG_PREFIX, 'Supabase client created');
    } catch (storageError) {
      console.error(LOG_PREFIX, 'Storage init error:', storageError);
      return Response.json({ 
        error: true,
        step: 'storage_init',
        message: storageError.message,
        stack: storageError.stack
      }, { status: 500, headers: baseHeaders });
    }

    const bucketName = 'template-files';
    let filePath = template.file_path;
    console.log(LOG_PREFIX, 'File path from template:', filePath);
    console.log(LOG_PREFIX, 'Bucket name:', bucketName);

    step = 'ensure_file_exists';
    if (!filePath) {
      console.log(LOG_PREFIX, 'No file_path, attempting generation');
      step = 'generate_file';
      try {
        const genResponse = await base44.asServiceRole.functions.invoke('generateTemplateFile', {
          template_id: template.id
        });
        console.log(LOG_PREFIX, 'Generation response:', genResponse?.data);

        if (!genResponse?.data?.ok) {
          console.error(LOG_PREFIX, 'Generation failed:', genResponse?.data);
          return Response.json({ 
            error: true,
            step: 'generate_file',
            message: 'File generation failed',
            details: genResponse?.data
          }, { status: 500, headers: baseHeaders });
        }

        filePath = genResponse.data.file_path;
        console.log(LOG_PREFIX, 'Generated file_path:', filePath);
        
        if (!filePath) {
          console.error(LOG_PREFIX, 'Generated file has no path');
          return Response.json({ 
            error: true,
            step: 'generate_file',
            message: 'Generated file has no path'
          }, { status: 500, headers: baseHeaders });
        }

        try {
          await base44.asServiceRole.entities.TemplateLibrary.update(template.id, {
            file_path: filePath
          });
          console.log(LOG_PREFIX, 'Updated template with file_path');
        } catch (updateError) {
          console.warn(LOG_PREFIX, 'Failed to update template file_path:', updateError);
        }
      } catch (genError) {
        console.error(LOG_PREFIX, 'Generation error:', genError);
        return Response.json({ 
          error: true,
          step: 'generate_file',
          message: genError.message,
          stack: genError.stack
        }, { status: 500, headers: baseHeaders });
      }
    } else {
      console.log(LOG_PREFIX, 'File path exists, skipping generation');
    }

    step = 'create_signed_url';
    let signedUrl;
    try {
      console.log(LOG_PREFIX, 'Creating signed URL for:', { bucketName, filePath });
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl(filePath, 600);

      console.log(LOG_PREFIX, 'Signed URL result:', {
        hasData: !!urlData,
        hasUrl: !!urlData?.signedUrl,
        error: urlError?.message
      });

      if (urlError || !urlData?.signedUrl) {
        console.error(LOG_PREFIX, 'Signed URL creation failed:', urlError);
        return Response.json({ 
          error: true,
          step: 'create_signed_url',
          message: urlError?.message || 'No URL returned',
          details: { urlError, urlData }
        }, { status: 500, headers: baseHeaders });
      }

      signedUrl = urlData.signedUrl;
      console.log(LOG_PREFIX, 'Signed URL created:', {
        url: signedUrl.substring(0, 100) + '...',
        host: new URL(signedUrl).host
      });
    } catch (urlError) {
      console.error(LOG_PREFIX, 'URL creation exception:', urlError);
      return Response.json({ 
        error: true,
        step: 'create_signed_url',
        message: urlError.message,
        stack: urlError.stack
      }, { status: 500, headers: baseHeaders });
    }

    step = 'url_access_check';
    try {
      console.log(LOG_PREFIX, 'Verifying URL accessibility');
      const headCheck = await fetch(signedUrl, { method: 'HEAD' });
      console.log(LOG_PREFIX, 'HEAD check result:', {
        status: headCheck.status,
        ok: headCheck.ok,
        contentType: headCheck.headers.get('content-type')
      });
      
      if (!headCheck.ok) {
        console.error(LOG_PREFIX, 'URL not accessible:', headCheck.status);
        return Response.json({ 
          error: true,
          step: 'url_access_check',
          message: `URL not accessible: ${headCheck.status}`
        }, { status: 500, headers: baseHeaders });
      }
    } catch (checkError) {
      console.error(LOG_PREFIX, 'URL check exception:', checkError);
      return Response.json({ 
        error: true,
        step: 'url_access_check',
        message: checkError.message,
        stack: checkError.stack
      }, { status: 500, headers: baseHeaders });
    }

    step = 'deduct_credit';
    try {
      console.log(LOG_PREFIX, 'Deducting credits:', { creditCost, from: currentCredits });
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
      console.log(LOG_PREFIX, 'Credits deducted successfully');
    } catch (creditError) {
      console.error(LOG_PREFIX, 'Credit deduction error:', creditError);
      return Response.json({ 
        error: true,
        step: 'deduct_credit',
        message: creditError.message,
        stack: creditError.stack
      }, { status: 500, headers: baseHeaders });
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
      console.log(LOG_PREFIX, 'Usage logged');
    } catch (logError) {
      console.warn(LOG_PREFIX, 'Usage logging failed:', logError);
    }

    step = 'success';
    const fileType = filePath.endsWith('.pdf') ? 'pdf' : 'docx';
    const filename = `LeaseShield_${template_key}.${fileType}`;
    
    console.log(LOG_PREFIX, 'SUCCESS - Returning signed URL:', { 
      user: user.email, 
      template: template_key,
      filename,
      signedUrlHost: new URL(signedUrl).host,
      signedUrlLength: signedUrl.length
    });

    // Return JSON with signed URL for browser download
    return Response.json({ 
      ok: true, 
      signedUrl, 
      filename
    }, { status: 200, headers: baseHeaders });

  } catch (error) {
    console.error(LOG_PREFIX, 'UNEXPECTED ERROR at step:', step, error);
    console.error(LOG_PREFIX, 'Error stack:', error.stack);
    return Response.json({
      error: true,
      step,
      message: error.message || 'Unknown error',
      stack: error.stack || ''
    }, { 
      status: 500, 
      headers: baseHeaders
    });
  }
});