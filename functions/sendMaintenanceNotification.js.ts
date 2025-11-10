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
    await base44.asServiceRole.entities.MaintenanceRequest.update(maintenanceRequest.id, {
      acknowledgment_token: acknowledgmentToken
    });

    // Create acknowledgment link (updated to use actual app domain)
    const appDomain = Deno.env.get('APP_DOMAIN') || 'app.leaseshield.asia';
    const acknowledgmentLink = `https://${appDomain}/acknowledge?token=${acknowledgmentToken}`;

    // Prepare message content
    const subject = language === 'th'
      ? `🔧 แจ้งซ่อม: ${maintenanceRequest.issue_title}`
      : `🔧 Maintenance Request: ${maintenanceRequest.issue_title}`;

    const messageBody = language === 'th'
      ? `แจ้งซ่อมใหม่\n\nหัวข้อ: ${maintenanceRequest.issue_title}\nรายละเอียด: ${maintenanceRequest.description}\nหมวดหมู่: ${maintenanceRequest.category}\nระดับความสำคัญ: ${maintenanceRequest.priority}\n${maintenanceRequest.property_address ? `ที่อยู่: ${maintenanceRequest.property_address}\n` : ''}\nวันที่แจ้ง: ${new Date(maintenanceRequest.reported_date).toLocaleDateString('th-TH')}\n\nแจ้งโดย: ${user.full_name} (${user.email})`
      : `New Maintenance Request\n\nTitle: ${maintenanceRequest.issue_title}\nDescription: ${maintenanceRequest.description}\nCategory: ${maintenanceRequest.category}\nPriority: ${maintenanceRequest.priority}\n${maintenanceRequest.property_address ? `Address: ${maintenanceRequest.property_address}\n` : ''}\nReported: ${new Date(maintenanceRequest.reported_date).toLocaleDateString('en-US')}\n\nReported by: ${user.full_name} (${user.email})`;

    // Get tenant full address for display
    const tenantAddress = [
      user.tenant_address,
      user.tenant_city,
      user.tenant_state,
      user.tenant_zip
    ].filter(Boolean).join(', ') || 'Not provided';

    // HTML body for landlord/juristic with acknowledgment button
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
          ${maintenanceRequest.property_address ? `<p><strong>ที่อยู่ทรัพย์สิน:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>วันที่แจ้ง:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('th-TH')}</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>ผู้เช่า:</strong> ${user.full_name}</p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>อีเมล:</strong> ${user.email}</p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>เบอร์โทร:</strong> ${user.phone || 'ไม่ได้ระบุ'}</p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>ที่อยู่ผู้เช่า:</strong> ${tenantAddress}</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${acknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ รับทราบและอัปเดตสถานะ
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">คลิกเพื่อยืนยันว่าคุณได้รับทราบคำขอซ่อมนี้แล้ว และอัปเดตสถานะ</p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 10px; color: #999; text-align: center;">ส่งจาก Lease Shield - www.leaseshield.asia</p>
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
          ${maintenanceRequest.property_address ? `<p><strong>Property Address:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>Reported:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('en-US')}</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>Tenant:</strong> ${user.full_name}</p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>Tenant Address:</strong> ${tenantAddress}</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${acknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ Acknowledge & Update Status
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">Click to confirm you've received this request and update its status</p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 10px; color: #999; text-align: center;">Sent from Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `;

    // HTML body for tenant (confirmation copy - no acknowledgment button)
    const tenantHtmlBody = language === 'th'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">✅ สำเนาคำขอซ่อม</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="background: #D1FAE5; color: #065F46; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981;">
            <strong>✓ คำขอซ่อมของคุณถูกส่งเรียบร้อยแล้ว</strong><br/>
            คุณจะได้รับการแจ้งเตือนเมื่อ${user.landlord_name || 'เจ้าของบ้าน'}รับทราบ
          </p>
          
          <h3 style="color: #0C3B2E; margin-top: 20px;">${maintenanceRequest.issue_title}</h3>
          <p><strong>รายละเอียด:</strong><br/>${maintenanceRequest.description}</p>
          <p><strong>หมวดหมู่:</strong> ${maintenanceRequest.category}</p>
          <p><strong>ระดับความสำคัญ:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>ที่อยู่:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>วันที่แจ้ง:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('th-TH')}</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="font-size: 12px; color: #666;"><strong>ส่งถึง:</strong></p>
          ${user.landlord_name ? `<p style="font-size: 12px; color: #666;">• เจ้าของบ้าน: ${user.landlord_name} ${user.landlord_email ? `(${user.landlord_email})` : ''}</p>` : ''}
          ${user.juristic_name ? `<p style="font-size: 12px; color: #666;">• นิติบุคคล: ${user.juristic_name} ${user.juristic_email ? `(${user.juristic_email})` : ''}</p>` : ''}
          
          <p style="font-size: 10px; color: #999; text-align: center; margin-top: 20px;">ส่งจาก Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `
      : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">✅ Request Copy</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="background: #D1FAE5; color: #065F46; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981;">
            <strong>✓ Your maintenance request has been sent successfully</strong><br/>
            You'll be notified when ${user.landlord_name || 'your landlord'} acknowledges it
          </p>
          
          <h3 style="color: #0C3B2E; margin-top: 20px;">${maintenanceRequest.issue_title}</h3>
          <p><strong>Description:</strong><br/>${maintenanceRequest.description}</p>
          <p><strong>Category:</strong> ${maintenanceRequest.category}</p>
          <p><strong>Priority:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>Address:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>Reported:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('en-US')}</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="font-size: 12px; color: #666;"><strong>Sent to:</strong></p>
          ${user.landlord_name ? `<p style="font-size: 12px; color: #666;">• Landlord: ${user.landlord_name} ${user.landlord_email ? `(${user.landlord_email})` : ''}</p>` : ''}
          ${user.juristic_name ? `<p style="font-size: 12px; color: #666;">• Juristic: ${user.juristic_name} ${user.juristic_email ? `(${user.juristic_email})` : ''}</p>` : ''}
          
          <p style="font-size: 10px; color: #999; text-align: center; margin-top: 20px;">Sent from Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `;

    // Send to user (tenant) - confirmation copy
    if (user.email_notifications !== false && user.email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: language === 'th' ? '✅ สำเนาคำขอซ่อม' : '✅ Maintenance Request Copy',
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

    // Send to juristic (email) - with acknowledgment button
    if (user.juristic_email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.juristic_email,
          subject: subject,
          body: landlordHtmlBody
        });
        notifications.push({ recipient: 'juristic', method: 'email', status: 'sent' });
      } catch (error) {
        notifications.push({ recipient: 'juristic', method: 'email', status: 'failed', error: error.message });
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