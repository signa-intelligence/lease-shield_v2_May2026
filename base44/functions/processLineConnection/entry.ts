import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, line_user_id } = await req.json();

    if (!token || !line_user_id) {
      return Response.json({ error: 'Missing token or line_user_id' }, { status: 400 });
    }

    // Find connection token using service role (webhook may not have user auth)
    const allTokens = await base44.asServiceRole.entities.LineConnectionToken.filter({
      token: token,
      used: false
    });

    if (allTokens.length === 0) {
      return Response.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    const connectionToken = allTokens[0];

    // Check if expired
    if (new Date() > new Date(connectionToken.expires_at)) {
      return Response.json({ error: 'Link has expired' }, { status: 410 });
    }

    const now = new Date().toISOString();

    // Handle different connection types
    if (connectionToken.connection_type === 'user') {
      // Connect user's own LINE
      const users = await base44.asServiceRole.entities.User.filter({ email: connectionToken.owner_email });

      if (users.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const user = users[0];

      // Check if already connected to different LINE
      if (user.line_user_id && user.line_user_id !== line_user_id) {
        return Response.json({
          error: 'This account is already connected to another LINE account'
        }, { status: 409 });
      }

      // Update user's LINE ID
      await base44.asServiceRole.entities.User.update(user.id, {
        line_user_id: line_user_id,
        line_messaging_token: line_user_id,
        line_notifications: true,
        line_connected_at: now
      });

      console.log(`[LINE_CONNECTED] User: ${connectionToken.owner_email}`);

    } else {
      // Connect landlord or juristic LINE
      if (!connectionToken.deposit_tracker_id) {
        return Response.json({ error: 'No property linked to this token' }, { status: 400 });
      }

      const deposit = await base44.asServiceRole.entities.DepositTracker.get(connectionToken.deposit_tracker_id);

      if (!deposit) {
        return Response.json({ error: 'Property not found' }, { status: 404 });
      }

      const updateData = {};

      if (connectionToken.connection_type === 'landlord') {
        updateData.landlord_line_id = line_user_id;
        updateData.landlord_line_connected_at = now;
      } else if (connectionToken.connection_type === 'juristic') {
        updateData.juristic_line_id = line_user_id;
        updateData.juristic_line_connected_at = now;
      }

      await base44.asServiceRole.entities.DepositTracker.update(deposit.id, updateData);

      console.log(`[LINE_CONNECTED] ${connectionToken.connection_type} for ${connectionToken.owner_email}`);
    }

    // Create timeline event
    try {
      const eventTitle = connectionToken.connection_type === 'user'
        ? 'LINE Notifications Connected'
        : `${connectionToken.connection_type === 'landlord' ? 'Landlord' : 'Juristic Office'} LINE Connected`;

      const eventDesc = connectionToken.connection_type === 'user'
        ? 'Your LINE account has been connected to Lease Shield'
        : `${connectionToken.connection_type === 'landlord' ? 'Landlord' : 'Juristic office'} LINE connected for ${connectionToken.property_address || 'property'}`;

      await base44.asServiceRole.entities.TimelineEvent.create({
        owner_email: connectionToken.owner_email,
        event_type: 'lease_scanned',
        title: eventTitle,
        description: eventDesc,
        event_date: now,
        source: 'system'
      });
    } catch (e) {
      console.warn('Timeline event creation failed (non-critical):', e.message);
    }

    // Mark token as used
    await base44.asServiceRole.entities.LineConnectionToken.update(connectionToken.id, {
      used: true,
      used_at: now,
      connected_line_user_id: line_user_id
    });

    return Response.json({
      success: true,
      connection_type: connectionToken.connection_type,
      property_address: connectionToken.property_address
    });

  } catch (error) {
    console.error('[PROCESS_CONNECTION_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});