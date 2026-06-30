/**
 * LeaseShield Maintenance Notifications
 * Sends email notifications to: tenant (confirmation), landlord, juristic
 * Uses Resend for external emails, built-in SendEmail for tenant
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authenticatedUser = await base44.auth.me();

    if (!authenticatedUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maintenanceRequest } = await req.json();

    if (!maintenanceRequest) {
      return Response.json({ error: 'Missing maintenanceRequest data' }, { status: 400 });
    }

    console.log('[MAINT_NOTIFY] Starting for request:', maintenanceRequest.id);
    console.log('[MAINT_NOTIFY] User:', authenticatedUser.email);

    // Fetch full user data with landlord/juristic contact info
    const users = await base44.asServiceRole.entities.User.filter({ 
      email: authenticatedUser.email 
    });
    
    if (!users || users.length === 0) {
      console.error('[MAINT_NOTIFY] User not found:', authenticatedUser.email);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    const language = user.language || 'en';
    const notifications = [];

    console.log('[MAINT_NOTIFY] Landlord email:', user.landlord_email || 'NOT SET');
    console.log('[MAINT_NOTIFY] Juristic email:', user.juristic_email || 'NOT SET');

    const description = maintenanceRequest.description || maintenanceRequest.issue_title || '';
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const isValidEmail = (email) => {
      if (!email || typeof email !== 'string') return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    const sendViaResend = async (to, subject, htmlBody, fromName) => {
      if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromName ? `${fromName} <notifications@leaseshield.asia>` : 'Lease Shield <notifications@leaseshield.asia>',
          to: [to],
          subject,
          html: htmlBody,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Resend API error');
      return data;
    };

    // Generate acknowledgment token
    const acknowledgmentToken = crypto.randomUUID();
    await base44.asServiceRole.entities.MaintenanceRequest.update(maintenanceRequest.id, {
      acknowledgment_token: acknowledgmentToken
    });

    const appDomain = 'app.leaseshield.asia';
    const landlordAckLink = `https://${appDomain}/AcknowledgeMaintenance?token=${acknowledgmentToken}&role=landlord`;
    const juristicAckLink = `https://${appDomain}/AcknowledgeMaintenance?token=${acknowledgmentToken}&role=juristic`;

    const priorityColor = maintenanceRequest.priority === 'urgent' ? '#EF4444' 
      : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6';

    const reportedDateStr = new Date(maintenanceRequest.reported_date).toLocaleDateString('en-US');

    // ═══════════════════════════════════════
    // 1. TENANT CONFIRMATION EMAIL
    // ═══════════════════════════════════════
    console.log('[MAINT_NOTIFY] Sending tenant confirmation...');
    if (user.email_notifications !== false && user.email) {
      const tenantSubject = language === 'th' ? '✅ สำเนาคำขอซ่อม' : '✅ Maintenance Request Confirmation';
      const landlordStatus = isValidEmail(user.landlord_email) ? `✓ Landlord: ${user.landlord_name || ''} (${user.landlord_email})` : '✗ Landlord email not configured';
      const juristicStatus = isValidEmail(user.juristic_email) ? `✓ Juristic: ${user.juristic_name || ''} (${user.juristic_email})` : '✗ Juristic email not configured';
      const hasRecipients = isValidEmail(user.landlord_email) || isValidEmail(user.juristic_email);

      const tenantHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(to right,#0C3B2E,#047857);padding:20px;border-radius:8px 8px 0 0;">
            <h2 style="color:white;margin:0;">✅ ${language === 'th' ? 'สำเนาคำขอซ่อม' : 'Request Confirmation'}</h2>
          </div>
          <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;">
            <p style="background:#D1FAE5;color:#065F46;padding:15px;border-radius:8px;border-left:4px solid #10B981;">
              <strong>✓ ${language === 'th' ? 'คำขอซ่อมของคุณถูกส่งเรียบร้อยแล้ว' : 'Your maintenance request has been submitted successfully'}</strong><br/>
              ${hasRecipients 
                ? (language === 'th' ? 'คุณจะได้รับการแจ้งเตือนเมื่อเจ้าของบ้านรับทราบ' : "You'll be notified when your landlord acknowledges it")
                : (language === 'th' ? 'กรุณาเพิ่มข้อมูลติดต่อเจ้าของบ้าน/นิติบุคคลในหน้าบัญชี' : 'Add landlord/juristic contact info in your Account page to enable notifications')}
            </p>
            <h3 style="color:#0C3B2E;margin-top:20px;">${maintenanceRequest.issue_title}</h3>
            <p>${description.replace(/\n/g, '<br/>')}</p>
            <p><strong>${language === 'th' ? 'หมวดหมู่' : 'Category'}:</strong> ${maintenanceRequest.category}</p>
            <p><strong>${language === 'th' ? 'ความสำคัญ' : 'Priority'}:</strong> <span style="color:${priorityColor};">${maintenanceRequest.priority}</span></p>
            ${maintenanceRequest.property_address ? `<p><strong>${language === 'th' ? 'ที่อยู่' : 'Address'}:</strong> ${maintenanceRequest.property_address}</p>` : ''}
            <p><strong>${language === 'th' ? 'วันที่แจ้ง' : 'Reported'}:</strong> ${reportedDateStr}</p>
            <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">
            <p style="font-size:12px;color:#666;"><strong>${language === 'th' ? 'ส่งถึง' : 'Sent to'}:</strong></p>
            <p style="font-size:12px;color:${isValidEmail(user.landlord_email) ? '#666' : '#999'};">${landlordStatus}</p>
            <p style="font-size:12px;color:${isValidEmail(user.juristic_email) ? '#666' : '#999'};">${juristicStatus}</p>
            <p style="font-size:10px;color:#999;text-align:center;margin-top:20px;">Lease Shield - www.leaseshield.asia</p>
          </div>
        </div>`;

      try {
        await sendViaResend(user.email, tenantSubject, tenantHtml, 'LeaseShield Notifications');
        console.log('[MAINT_NOTIFY] ✅ Tenant email sent to:', user.email);
        notifications.push({ recipient: 'tenant', method: 'email', status: 'sent', to: user.email });
      } catch (error) {
        console.error('[MAINT_NOTIFY] ❌ Tenant email failed:', error.message);
        notifications.push({ recipient: 'tenant', method: 'email', status: 'failed', error: error.message });
      }
    } else {
      notifications.push({ recipient: 'tenant', method: 'email', status: 'skipped', reason: 'disabled' });
    }

    // ═══════════════════════════════════════
    // 2. LANDLORD EMAIL
    // ═══════════════════════════════════════
    console.log('[MAINT_NOTIFY] Sending landlord email...');
    if (isValidEmail(user.landlord_email)) {
      const landlordSubject = `🔧 Maintenance Request: ${maintenanceRequest.issue_title}`;
      const landlordHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(to right,#0C3B2E,#047857);padding:20px;border-radius:8px 8px 0 0;">
            <h2 style="color:white;margin:0;">🔧 New Maintenance Request</h2>
          </div>
          <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;">
            <h3 style="color:#0C3B2E;">${maintenanceRequest.issue_title}</h3>
            <p>${description.replace(/\n/g, '<br/>')}</p>
            <p><strong>Category:</strong> ${maintenanceRequest.category}</p>
            <p><strong>Priority:</strong> <span style="color:${priorityColor};">${maintenanceRequest.priority}</span></p>
            ${maintenanceRequest.property_address ? `<p><strong>Property:</strong> ${maintenanceRequest.property_address}</p>` : ''}
            <p><strong>Reported:</strong> ${reportedDateStr}</p>
            <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">
            <p style="font-size:14px;color:#666;"><strong>Tenant:</strong> ${user.full_name || 'Unknown'}</p>
            <p style="font-size:14px;color:#666;"><strong>Email:</strong> ${user.email}</p>
            <p style="font-size:14px;color:#666;"><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
            <div style="margin:30px 0;text-align:center;">
              <a href="${landlordAckLink}" style="display:inline-block;background-color:#0C3B2E;color:white;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                ✓ Acknowledge & Update Status
              </a>
              <p style="margin-top:10px;font-size:12px;color:#666;">Click to confirm you've received this request</p>
            </div>
            <p style="font-size:10px;color:#999;text-align:center;">Lease Shield - www.leaseshield.asia</p>
          </div>
        </div>`;

      try {
        const result = await sendViaResend(user.landlord_email.trim(), landlordSubject, landlordHtml, 'LeaseShield Notifications');
        console.log('[MAINT_NOTIFY] ✅ Landlord email sent. ID:', result.id);
        notifications.push({ recipient: 'landlord', method: 'email', status: 'sent', to: user.landlord_email, messageId: result.id });
      } catch (error) {
        console.error('[MAINT_NOTIFY] ❌ Landlord email failed:', error.message);
        notifications.push({ recipient: 'landlord', method: 'email', status: 'failed', error: error.message, to: user.landlord_email });
      }
    } else {
      console.log('[MAINT_NOTIFY] ⚠️ No valid landlord email');
      notifications.push({ recipient: 'landlord', method: 'email', status: 'skipped', reason: 'no_email' });
    }

    // ═══════════════════════════════════════
    // 3. JURISTIC / BUILDING MANAGER EMAIL
    // ═══════════════════════════════════════
    console.log('[MAINT_NOTIFY] Sending juristic email...');
    if (isValidEmail(user.juristic_email)) {
      const juristicSubject = `🔧 แจ้งซ่อม / Maintenance Request: ${maintenanceRequest.issue_title}`;
      const juristicHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(to right,#0C3B2E,#047857);padding:20px;border-radius:8px 8px 0 0;">
            <h2 style="color:white;margin:0;">🔧 แจ้งซ่อม / Maintenance Request</h2>
          </div>
          <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;">
            <h3 style="color:#0C3B2E;">${maintenanceRequest.issue_title}</h3>
            <p>${description.replace(/\n/g, '<br/>')}</p>
            <p><strong>หมวดหมู่ / Category:</strong> ${maintenanceRequest.category}</p>
            <p><strong>ระดับความสำคัญ / Priority:</strong> <span style="color:${priorityColor};">${maintenanceRequest.priority}</span></p>
            ${maintenanceRequest.property_address ? `<p><strong>ที่อยู่ / Property:</strong> ${maintenanceRequest.property_address}</p>` : ''}
            <p><strong>วันที่แจ้ง / Reported:</strong> ${reportedDateStr}</p>
            <hr style="margin:20px 0;border:none;border-top:1px solid #ddd;">
            <p style="font-size:14px;color:#666;"><strong>ผู้เช่า / Tenant:</strong> ${user.full_name || 'Unknown'}</p>
            <p style="font-size:14px;color:#666;"><strong>อีเมล / Email:</strong> ${user.email}</p>
            <p style="font-size:14px;color:#666;"><strong>เบอร์โทร / Phone:</strong> ${user.phone || 'Not provided'}</p>
            <div style="margin:30px 0;text-align:center;">
              <a href="${juristicAckLink}" style="display:inline-block;background-color:#0C3B2E;color:white;padding:15px 40px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                ✓ รับทราบ / Acknowledge & Update
              </a>
              <p style="margin-top:10px;font-size:12px;color:#666;">คลิกเพื่อยืนยัน / Click to confirm receipt</p>
            </div>
            <p style="font-size:10px;color:#999;text-align:center;">Lease Shield - www.leaseshield.asia</p>
          </div>
        </div>`;

      try {
        const result = await sendViaResend(user.juristic_email.trim(), juristicSubject, juristicHtml, 'LeaseShield Notifications');
        console.log('[MAINT_NOTIFY] ✅ Juristic email sent. ID:', result.id);
        notifications.push({ recipient: 'juristic', method: 'email', status: 'sent', to: user.juristic_email, messageId: result.id });
      } catch (error) {
        console.error('[MAINT_NOTIFY] ❌ Juristic email failed:', error.message);
        notifications.push({ recipient: 'juristic', method: 'email', status: 'failed', error: error.message, to: user.juristic_email });
      }
    } else {
      console.log('[MAINT_NOTIFY] ⚠️ No valid juristic email');
      notifications.push({ recipient: 'juristic', method: 'email', status: 'skipped', reason: 'no_email' });
    }

    // ═══════════════════════════════════════
    // 4. LINE NOTIFICATIONS (tenant, landlord, juristic)
    // ═══════════════════════════════════════
    const userTier = user.plan_tier || 'free';
    const lineAllowed = ['protect', 'secure'].includes(userTier);

    console.log('[MAINT_NOTIFY] LINE check:', {
      hasLineToken: !!user.line_messaging_token,
      lineNotificationsEnabled: user.line_notifications !== false,
      userTier,
      lineAllowed,
      lineSkipReason: !user.line_messaging_token ? 'NO_LINE_TOKEN' : !lineAllowed ? `TIER_${userTier}_NOT_ELIGIBLE` : user.line_notifications === false ? 'DISABLED_BY_USER' : 'ELIGIBLE'
    });

    // Tenant LINE
    if (user.line_messaging_token && user.line_notifications !== false && lineAllowed) {
      try {
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
          userId: user.line_messaging_token,
          message: `🔧 ${language === 'th' ? 'คำขอซ่อมถูกส่งแล้ว' : 'Maintenance request submitted'}: ${maintenanceRequest.issue_title}`
        });
        console.log('[MAINT_NOTIFY] ✅ Tenant LINE sent');
        notifications.push({ recipient: 'tenant', method: 'LINE', status: 'sent' });
      } catch (error) {
        console.error('[MAINT_NOTIFY] ❌ Tenant LINE failed:', error.message);
        notifications.push({ recipient: 'tenant', method: 'LINE', status: 'failed', error: error.message });
      }
    }

    // Landlord LINE
    if (user.landlord_line && user.landlord_line.trim()) {
      try {
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
          userId: user.landlord_line.trim(),
          message: `🔧 New maintenance request from ${user.full_name || user.email}: ${maintenanceRequest.issue_title}\n\nAcknowledge: ${landlordAckLink}`
        });
        console.log('[MAINT_NOTIFY] ✅ Landlord LINE sent');
        notifications.push({ recipient: 'landlord', method: 'LINE', status: 'sent' });
      } catch (error) {
        console.error('[MAINT_NOTIFY] ❌ Landlord LINE failed:', error.message);
        notifications.push({ recipient: 'landlord', method: 'LINE', status: 'failed', error: error.message });
      }
    }

    // Juristic LINE
    if (user.juristic_line && user.juristic_line.trim()) {
      try {
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
          userId: user.juristic_line.trim(),
          message: `🔧 แจ้งซ่อม / Maintenance: ${maintenanceRequest.issue_title}\nTenant: ${user.full_name || user.email}\n\nAcknowledge: ${juristicAckLink}`
        });
        console.log('[MAINT_NOTIFY] ✅ Juristic LINE sent');
        notifications.push({ recipient: 'juristic', method: 'LINE', status: 'sent' });
      } catch (error) {
        console.error('[MAINT_NOTIFY] ❌ Juristic LINE failed:', error.message);
        notifications.push({ recipient: 'juristic', method: 'LINE', status: 'failed', error: error.message });
      }
    }

    // Tenant LINE via User.line_id (if set and different from line_messaging_token)
    if (user.line_id && user.line_id !== user.line_messaging_token && lineAllowed) {
      try {
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
          userId: user.line_id,
          message: `🔧 ${language === 'th' ? 'คำขอซ่อมถูกส่งแล้ว' : 'Maintenance request submitted'}: ${maintenanceRequest.issue_title}`
        });
        console.log('[MAINT_NOTIFY] ✅ Tenant LINE (line_id) sent');
        notifications.push({ recipient: 'tenant', method: 'LINE_line_id', status: 'sent' });
      } catch (error) {
        console.error('[MAINT_NOTIFY] ❌ Tenant LINE (line_id) failed:', error.message);
        notifications.push({ recipient: 'tenant', method: 'LINE_line_id', status: 'failed', error: error.message });
      }
    }

    // ═══════════════════════════════════════
    // 5. TIMELINE EVENT
    // ═══════════════════════════════════════
    try {
      await base44.asServiceRole.entities.TimelineEvent.create({
        owner_email: user.email,
        lease_id: maintenanceRequest.lease_id || null,
        property_address: maintenanceRequest.property_address || null,
        event_type: 'notification_maintenance_update',
        event_date: new Date().toISOString(),
        title: language === 'th' ? 'แจ้งซ่อม - ส่งแจ้งเตือนแล้ว' : 'Maintenance - Notification Sent',
        description: maintenanceRequest.issue_title,
        source: 'notification',
        source_id: maintenanceRequest.id
      });
    } catch (tlErr) {
      console.error('[MAINT_NOTIFY] Timeline event failed (non-blocking):', tlErr.message);
    }

    const sentCount = notifications.filter(n => n.status === 'sent').length;
    console.log(`[MAINT_NOTIFY] Done. ${sentCount} notifications sent, ${notifications.filter(n => n.status === 'failed').length} failed, ${notifications.filter(n => n.status === 'skipped').length} skipped`);

    return Response.json({
      success: true,
      notifications,
      debug: {
        userEmail: user.email,
        landlordEmail: user.landlord_email || 'not_set',
        juristicEmail: user.juristic_email || 'not_set',
        resendConfigured: !!RESEND_API_KEY,
        sentCount
      }
    });

  } catch (error) {
    console.error('[MAINT_NOTIFY] CRITICAL ERROR:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});