import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connection_type, deposit_tracker_id } = await req.json();

    // Validate connection type
    if (!['user', 'landlord', 'juristic'].includes(connection_type)) {
      return Response.json({ error: 'Invalid connection type' }, { status: 400 });
    }

    // Check tier restrictions for landlord/juristic
    if ((connection_type === 'landlord' || connection_type === 'juristic') &&
        user.plan_tier !== 'protect' && user.plan_tier !== 'secure') {
      return Response.json({
        error: 'LINE notifications for landlord and juristic require Protect or Secure tier'
      }, { status: 403 });
    }

    let propertyAddress = null;

    // Get property details if landlord/juristic connection
    if (connection_type !== 'user' && deposit_tracker_id) {
      const deposit = await base44.entities.DepositTracker.get(deposit_tracker_id);
      if (!deposit || deposit.owner_email !== user.email) {
        return Response.json({ error: 'Property not found' }, { status: 404 });
      }
      propertyAddress = deposit.property_address;
    }

    // Generate unique token
    const token = crypto.randomUUID();

    // Create connection token (expires in 7 days)
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

    // Generate LINE OA friend URL with token encoded
    // Users will add the OA, then type "link <token>" to connect
    const lineOAUrl = 'https://line.me/R/ti/p/@leaseshield';
    const connectionUrl = `${lineOAUrl}?token=${token}`;

    console.log(`[LINE_LINK] Generated for ${user.email} - ${connection_type} - token: ${token}`);

    return Response.json({
      success: true,
      connection_url: connectionUrl,
      line_oa_url: lineOAUrl,
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