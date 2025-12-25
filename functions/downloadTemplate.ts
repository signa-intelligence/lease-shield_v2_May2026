import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Download Template - Returns binary DOCX file
 * Comprehensive error handling with step tracking
 */

Deno.serve(async (req) => {
  let step = 'init';
  const corsHeaders = {
    'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
    'Access-Control-Allow-Credentials': 'true'
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
        { error: true, step, message: 'Method Not Allowed - use POST', allowed: 'POST' },
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    step = 'parse_body';
    let body;
    try {
      const rawBody = await req.text();
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return Response.json(
        { error: true, step, message: 'Invalid JSON body', details: parseError.message },
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const template_id = body.template_id;
    const template_key = body.template_key;

    if (!template_id && !template_key) {
      return Response.json(
        { error: true, step, message: 'Missing template_id or template_key in request body' },
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    step = 'auth';
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json(
        { error: true, step, message: 'Unauthorized - user not authenticated' },
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    step = 'fetch_template';
    const query = template_id ? { id: template_id } : { template_key };
    const templates = await base44.asServiceRole.entities.TemplateLibrary.filter(query);

    if (!templates || templates.length === 0) {
      return Response.json(
        { error: true, step, message: 'Template not found', query },
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const template = templates[0];

    if (!template.template_key) {
      return Response.json(
        { error: true, step, message: 'Template missing template_key field' },
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    step = 'check_credits';
    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;

    if (currentCredits < creditCost) {
      return Response.json(
        { error: true, step, message: `Insufficient credits: need ${creditCost}, have ${currentCredits}` },
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    step = 'resolve_file';
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: true, step, message: 'Storage configuration missing' },
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'template-files';
    let fileData;

    if (template.file_path) {
      step = 'download_file';
      const { data: downloadData, error: downloadError } = await supabase
        .storage
        .from(bucketName)
        .download(template.file_path);

      if (downloadData && !downloadError) {
        fileData = downloadData;
      }
    }

    // If file not found, generate it
    if (!fileData) {
      step = 'generate_docx';
      try {
        const genResponse = await base44.asServiceRole.functions.invoke('generateTemplateFile', {
          template_id: template.id
        });

        if (!genResponse?.data?.ok) {
          return Response.json(
            { error: true, step, message: 'Template file generation failed', details: genResponse?.data },
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        step = 'read_file';
        const filePath = genResponse.data.file_path || template.file_path;
        const { data: retryData, error: retryError } = await supabase
          .storage
          .from(bucketName)
          .download(filePath);

        if (retryError || !retryData) {
          return Response.json(
            { error: true, step, message: 'File unavailable after generation', retryError: retryError?.message },
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        fileData = retryData;
      } catch (genError) {
        return Response.json(
          { error: true, step, message: 'Generation exception', details: genError.message },
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!fileData) {
      return Response.json(
        { error: true, step: 'file_check', message: 'No file data available' },
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { error: true, step, message: 'Credit deduction failed', details: creditError.message },
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log usage (non-blocking)
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

    step = 'return_binary';
    const fileType = template.file_path?.endsWith('.pdf') ? 'pdf' : 'docx';
    const filename = `LeaseShield_${template.template_key}.${fileType}`;
    const contentType = fileType === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    console.log('[DOWNLOAD] Success:', { filename, user: user.email, template: template.template_key });

    return new Response(fileData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('[DOWNLOAD] Crash at step:', step, error);
    return Response.json(
      {
        error: true,
        step,
        message: error.message || 'Unknown error',
        name: error.name,
        stack: (error.stack || '').slice(0, 800)
      },
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});