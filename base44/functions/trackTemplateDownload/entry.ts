import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({
        ok: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }
    
    const body = await req.json();
    const { userEmail, templateKey, templateName, tier } = body;
    
    // Track the download
    await base44.entities.TemplateDownload.create({
      user_email: userEmail,
      template_key: templateKey,
      template_name: templateName || templateKey,
      downloaded_at: new Date().toISOString(),
      user_tier: tier || 'free'
    });
    
    console.log('[TEMPLATE_DOWNLOAD_TRACKED]', {
      userEmail: userEmail?.substring(0, 3) + '***',
      templateKey,
      tier
    });
    
    return Response.json({
      ok: true
    });
    
  } catch (error) {
    console.error('[TRACK_TEMPLATE_DOWNLOAD_ERROR]', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});