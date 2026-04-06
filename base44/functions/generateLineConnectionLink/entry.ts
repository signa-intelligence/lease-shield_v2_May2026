import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { connection_type, deposit_tracker_id } = await req.json();
    
    if (!['user', 'landlord', 'juristic'].includes(connection_type)) {
      return Response.json({ error: 'Invalid connection type' }, { status: 400 });
    }
    
    // Tier restriction for landlord/juristic
    if (connection_type === 'landlord' || connection_type === 'juristic') {
      const tier = (user.plan_tier || '').toLowerCase();
      if (tier !== 'protect' && tier !== 'secure') {
        return Response.json({ error: 'Protect or Secure tier required for landlord/juristic LINE' }, { status: 403 });
      }
    }
    
    let propertyAddress = null;
    
    if (connection_type !== 'user' && deposit_tracker_id) {
      const deposits = await base44.entities.DepositTracker.filter({ id: deposit_tracker_id });
      const deposit = deposits?.[0];
      if (!deposit || deposit.owner_email !== user.email) {
        return Response.json({ error: 'Property not found or access denied' }, { status: 404 });
      }
      propertyAddress = deposit.property_address;
    }
    
    // Generate UUID token
    const token = crypto.randomUUID();
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await base44.entities.LineConnectionToken.create({
      owner_email: user.email,
      token: token,
      connection_type: connection_type,
      property_address: propertyAddress,
      deposit_tracker_id: deposit_tracker_id || null,
      expires_at: expiresAt.toISOString(),
      used: false
    });
    
    // LINE OA add-friend URL with token encoded in LIFF state
    const lineOaId = '@leaseshield';
    const connectionUrl = `https://line.me/R/ti/p/${encodeURIComponent(lineOaId)}?oat_content=qr&token=${token}`;
    
    console.log(`[LINE_LINK] Generated ${connection_type} link for ${user.email}`);
    console.log(`[LINE_LINK] Token: ${token}`);
    
    return Response.json({
      success: true,
      connection_url: connectionUrl,
      token: token,
      expires_at: expiresAt.toISOString(),
      connection_type: connection_type,
      property_address: propertyAddress
    });
    
  } catch (error) {
    console.error('[GENERATE_LINK_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});