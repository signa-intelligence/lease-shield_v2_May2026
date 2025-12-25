import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Download Template - Returns binary file stream
 * Deducts credits ONLY after file verified and ready to stream
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
    'Access-Control-Allow-Credentials': 'true'
  };

  try {
    if (req.method !== 'POST') {
      return Response.json(
        { error: 'Method Not Allowed', allowed: 'POST' }, 
        { status: 405, headers: corsHeaders }
      );
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' }, 
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const template_id = body.template_id || body.template_key;

    if (!template_id) {
      return Response.json(
        { error: 'Missing template_id or template_key' }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // Step 1: Validate template
    const templates = await base44.asServiceRole.entities.TemplateLibrary.filter({ 
      id: template_id 
    });
    
    if (!templates || templates.length === 0) {
      return Response.json(
        { error: 'Template not found' }, 
        { status: 404, headers: corsHeaders }
      );
    }

    const template = templates[0];
    
    if (!template.template_key || !template.file_path) {
      return Response.json(
        { error: 'Template invalid - missing required fields' }, 
        { status: 400, headers: corsHeaders }
      );
    }

    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;

    if (currentCredits < creditCost) {
      return Response.json(
        { error: `Insufficient credits - need ${creditCost}, have ${currentCredits}` }, 
        { status: 402, headers: corsHeaders }
      );
    }

    // Step 2: Fetch file from storage
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: 'Storage configuration error' }, 
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'template-files';

    let fileData;
    
    // Try to download file
    const { data: initialData, error: downloadError } = await supabase
      .storage
      .from(bucketName)
      .download(template.file_path);

    // If file doesn't exist, generate it
    if (downloadError || !initialData) {
      console.log('[DOWNLOAD] File missing, generating:', template.file_path);
      
      try {
        const genResponse = await base44.asServiceRole.functions.invoke(
          'generateTemplateFile', 
          { template_id }
        );
        
        if (!genResponse.data?.ok) {
          return Response.json(
            { error: 'File generation failed', details: genResponse.data }, 
            { status: 500, headers: corsHeaders }
          );
        }
        
        // Retry download after generation
        const { data: retryData, error: retryError } = await supabase
          .storage
          .from(bucketName)
          .download(template.file_path);
        
        if (retryError || !retryData) {
          return Response.json(
            { error: 'File unavailable after generation' }, 
            { status: 500, headers: corsHeaders }
          );
        }
        
        fileData = retryData;
      } catch (genError) {
        console.error('[DOWNLOAD] Generation error:', genError);
        return Response.json(
          { error: 'File generation exception', message: genError.message }, 
          { status: 500, headers: corsHeaders }
        );
      }
    } else {
      fileData = initialData;
    }

    // Step 3: Deduct credits (only after file verified and ready)
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
      console.error('[DOWNLOAD] Credit deduction failed:', creditError);
      return Response.json(
        { error: 'Credit deduction failed', message: creditError.message }, 
        { status: 500, headers: corsHeaders }
      );
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
    } catch (usageError) {
      console.warn('[DOWNLOAD] Usage logging failed:', usageError);
    }

    // Step 4: Return file as binary stream
    const fileType = template.file_path.endsWith('.pdf') ? 'pdf' : 'docx';
    const downloadFilename = `LeaseShield_${template.template_key}.${fileType}`;
    const contentType = fileType === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    console.log('[DOWNLOAD] Streaming file:', downloadFilename);

    return new Response(fileData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Cache-Control': 'no-store',
        'Content-Length': fileData.size?.toString() || ''
      }
    });

  } catch (error) {
    console.error('[DOWNLOAD] Unexpected error:', error);
    return Response.json({ 
      error: 'Download failed',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
});