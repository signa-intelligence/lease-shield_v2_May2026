import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token, line_user_id } = await req.json();
    
    if (!token || !line_user_id) {
      return Response.json({ error: 'token and line_user_id required' }, { status: 400 });
    }
    
    // Find unused token
    const tokens = await base44.asServiceRole.entities.LineConnectionToken.filter({ token: token });
    const connectionToken = tokens.find(t => !t.used);
    
    if (!connectionToken) {
      return Response.json({ error: 'Invalid or already used connection link' }, { status: 404 });
    }
    
    if (new Date() > new Date(connectionToken.expires_at)) {
      return Response.json({ error: 'Connection link has expired' }, { status: 410 });
    }
    
    if (connectionToken.connection_type === 'user') {
      // Connect user's own LINE
      const users = await base44.asServiceRole.entities.User.filter({ email: connectionToken.owner_email });
      const user = users?.[0];
      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      
      if (user.line_user_id && user.line_user_id !== line_user_id) {
        return Response.json({ error: 'Account already connected to another LINE' }, { status: 409 });
      }
      
      await base44.asServiceRole.entities.User.update(user.id, {
        line_user_id: line_user_id,
        line_messaging_token: line_user_id,
        line_notifications: true,
        line_connected_at: new Date().toISOString()
      });
      
      try {
        await base44.asServiceRole.entities.TimelineEvent.create({
          owner_email: connectionToken.owner_email,
          event_type: 'lease_scanned',
          title: 'LINE Notifications Connected',
          description: 'Your LINE account has been connected to Lease Shield',
          event_date: new Date().toISOString(),
          source: 'system'
        });
      } catch (e) { console.warn('Timeline event failed:', e.message); }
      
      console.log(`[LINE_CONNECTED] User: ${connectionToken.owner_email}`);
      
    } else {
      // landlord or juristic
      if (!connectionToken.deposit_tracker_id) {
        return Response.json({ error: 'No property linked to token' }, { status: 400 });
      }
      
      const deposits = await base44.asServiceRole.entities.DepositTracker.filter({ id: connectionToken.deposit_tracker_id });
      const deposit = deposits?.[0];
      if (!deposit) {
        return Response.json({ error: 'Property not found' }, { status: 404 });
      }
      
      const updateData = {};
      if (connectionToken.connection_type === 'landlord') {
        if (deposit.landlord_line_id && deposit.landlord_line_id !== line_user_id) {
          return Response.json({ error: 'Property already connected to another landlord LINE' }, { status: 409 });
        }
        updateData.landlord_line_id = line_user_id;
        updateData.landlord_line_connected_at = new Date().toISOString();
      } else {
        if (deposit.juristic_line_id && deposit.juristic_line_id !== line_user_id) {
          return Response.json({ error: 'Property already connected to another juristic LINE' }, { status: 409 });
        }
        updateData.juristic_line_id = line_user_id;
        updateData.juristic_line_connected_at = new Date().toISOString();
      }
      
      await base44.asServiceRole.entities.DepositTracker.update(deposit.id, updateData);
      
      try {
        const title = connectionToken.connection_type === 'landlord' ? 'Landlord LINE Connected' : 'Juristic LINE Connected';
        await base44.asServiceRole.entities.TimelineEvent.create({
          owner_email: connectionToken.owner_email,
          event_type: 'lease_scanned',
          title: title,
          description: `${title} for ${connectionToken.property_address || 'property'}`,
          event_date: new Date().toISOString(),
          source: 'system'
        });
      } catch (e) { console.warn('Timeline event failed:', e.message); }
      
      console.log(`[LINE_CONNECTED] ${connectionToken.connection_type} for ${connectionToken.owner_email}`);
    }
    
    // Mark token used
    await base44.asServiceRole.entities.LineConnectionToken.update(connectionToken.id, {
      used: true,
      used_at: new Date().toISOString(),
      connected_line_user_id: line_user_id
    });
    
    return Response.json({
      success: true,
      connection_type: connectionToken.connection_type,
      property_address: connectionToken.property_address,
      message: 'LINE connection successful'
    });
    
  } catch (error) {
    console.error('[PROCESS_CONNECTION_ERROR]', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});