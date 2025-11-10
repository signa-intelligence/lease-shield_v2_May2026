import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maintenanceRequest } = await req.json();

    if (!maintenanceRequest) {
      return Response.json({ error: 'Missing maintenanceRequest data' }, { status: 400 });
    }

    const language = user.language || 'en';
    const notifications = [];

    // Generate unique acknowledgment token
    const acknowledgmentToken = crypto.randomUUID();

    // Update maintenance request with token
    await base44.entities.MaintenanceRequest.update(maintenanceRequest.id, {
      acknowledgment_token: acknowledgmentToken
    });

    // Create acknowledgment link
    const appUrl = 'https://app.base44.com/api/apps/auth/leaseshield'; // Replace with actual app URL
    const acknowledgmentLink = `${appUrl}/acknowledge-maintenance?token=${acknowledgmentToken}`;

    // Prepare message content
    const subject = language === 'th'
      ? `🔧 แจ้งซ่อม: ${maintenanceRequest.issue_title}`
      : `🔧 Maintenance Request: ${maintenanceRequest.issue_title}`;

    const messageBody = language === 'th'
      ? `แจ้งซ่อมใหม่\n\nหัวข้อ: ${maintenanceRequest.issue_title}\nรายละเอียด: ${maintenanceRequest.description}\nหมวดหมู่: ${maintenanceRequest.category}\nระดับความสำคัญ: ${maintenanceRequest.priority}\n${maintenanceRequest.property_address ? `ที่อยู่: ${maintenanceRequest.property_address}\n` : ''}\nวันที่แจ้ง: ${new Date(maintenanceRequest.reported_date).toLocaleDateString('th-TH')}\n\nแจ้งโดย: ${user.full_name} (${user.email})`
      : `New Maintenance Request\n\nTitle: ${maintenanceRequest.issue_title}\nDescription: ${maintenanceRequest.description}\nCategory: ${maintenanceRequest.category}\nPriority: ${maintenanceRequest.priority}\n${maintenanceRequest.property_address ? `Address: ${maintenanceRequest.property_address}\n` : ''}\nReported: ${new Date(maintenanceRequest.reported_date).toLocaleDateString('en-US')}\n\nReported by: ${user.full_name} (${user.email})`;

    // HTML body for landlord with acknowledgment button
    const landlordHtmlBody = language === 'th'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 แจ้งซ่อมใหม่</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p><strong>รายละเอียด:</strong><br/>${maintenanceRequest.description}</p>
          <p><strong>หมวดหมู่:</strong> ${maintenanceRequest.category}</p>
          <p><strong>ระดับความสำคัญ:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>ที่อยู่:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>วันที่แจ้ง:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('th-TH')}</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${acknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ รับทราบคำขอซ่อม
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">คลิกเพื่อยืนยันว่าคุณได้รับทราบคำขอซ่อมนี้แล้ว</p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">แจ้งโดย: ${user.full_name} (${user.email})</p>
        </div>
      </div>
      `
      : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 New Maintenance Request</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p><strong>Description:</strong><br/>${maintenanceRequest.description}</p>
          <p><strong>Category:</strong> ${maintenanceRequest.category}</p>
          <p><strong>Priority:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>Address:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>Reported:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('en-US')}</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${acknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ Acknowledge Request
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">Click to confirm you've received this maintenance request</p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">Reported by: ${user.full_name} (${user.email})</p>
        </div>
      </div>
      `;

    // HTML body for tenant (no acknowledgment button)
    const tenantHtmlBody = language === 'th'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 สำเนาคำขอซ่อม</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p><strong>รายละเอียด:</strong><br/>${maintenanceRequest.description}</p>
          <p><strong>หมวดหมู่:</strong> ${maintenanceRequest.category}</p>
          <p><strong>ระดับความสำคัญ:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>ที่อยู่:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>วันที่แจ้ง:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('th-TH')}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">คำขอซ่อมของคุณถูกส่งไปยังเจ้าของบ้านแล้ว คุณจะได้รับการแจ้งเตือนเมื่อเจ้าของบ้านรับทราบ</p>
        </div>
      </div>
      `
      : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 Maintenance Request Copy</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p><strong>Description:</strong><br/>${maintenanceRequest.description}</p>
          <p><strong>Category:</strong> ${maintenanceRequest.category}</p>
          <p><strong>Priority:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>Address:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>Reported:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('en-US')}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">Your maintenance request has been sent to your landlord. You'll be notified when they acknowledge it.</p>
        </div>
      </div>
      `;

    // Send to user (email)
    if (user.email_notifications && user.email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: subject,
          body: tenantHtmlBody
        });
        notifications.push({ recipient: 'user', method: 'email', status: 'sent' });
      } catch (error) {
        notifications.push({ recipient: 'user', method: 'email', status: 'failed', error: error.message });
      }
    }

    // Send to landlord (email) with acknowledgment button
    if (user.landlord_email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.landlord_email,
          subject: subject,
          body: landlordHtmlBody
        });
        notifications.push({ recipient: 'landlord', method: 'email', status: 'sent' });
      } catch (error) {
        notifications.push({ recipient: 'landlord', method: 'email', status: 'failed', error: error.message });
      }
    }

    // Send to juristic (email) - without acknowledgment button
    if (user.juristic_email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.juristic_email,
          subject: subject,
          body: tenantHtmlBody
        });
        notifications.push({ recipient: 'juristic', method: 'email', status: 'sent' });
      } catch (error) {
        notifications.push({ recipient: 'juristic', method: 'email', status: 'failed', error: error.message });
      }
    }

    // Send LINE notification to user if enabled
    if (user.line_notifications && user.line_messaging_token) {
      try {
        await base44.functions.invoke('sendLineMessage', {
          userId: user.line_messaging_token,
          message: messageBody
        });
        notifications.push({ recipient: 'user', method: 'line', status: 'sent' });
      } catch (error) {
        notifications.push({ recipient: 'user', method: 'line', status: 'failed', error: error.message });
      }
    }

    return Response.json({
      success: true,
      notifications: notifications,
      acknowledgmentLink: acknowledgmentLink
    });

  } catch (error) {
    console.error('Maintenance notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});