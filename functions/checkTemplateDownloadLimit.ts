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
    const { userEmail, tier } = body;
    
    // Define tier limits
    const tierLimits = {
      'free': 3,
      'lite': 3,
      'explorer': 3, // Alias for free
      'protect': 999,
      'secure': 999
    };
    
    const userTier = tier || 'free';
    const limit = tierLimits[userTier] || tierLimits.free;
    
    // Count downloads for this user
    const downloads = await base44.entities.TemplateDownload.filter({
      user_email: userEmail
    });
    
    const downloadCount = downloads?.length || 0;
    const hasUnlimited = ['protect', 'secure'].includes(userTier);
    
    if (downloadCount >= limit && !hasUnlimited) {
      return Response.json({
        allowed: false,
        limit: limit,
        used: downloadCount,
        remaining: 0,
        message: `Template download limit reached (${downloadCount}/${limit}). Upgrade to Protect for unlimited templates.`
      });
    }
    
    return Response.json({
      allowed: true,
      limit: hasUnlimited ? 999 : limit,
      used: downloadCount,
      remaining: hasUnlimited ? 999 : (limit - downloadCount),
      unlimited: hasUnlimited
    });
    
  } catch (error) {
    console.error('[CHECK_TEMPLATE_LIMIT_ERROR]', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});