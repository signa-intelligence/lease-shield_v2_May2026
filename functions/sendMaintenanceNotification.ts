import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

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

    console.log('🔍 Starting maintenance notification process...');
    console.log('📧 Authenticated user:', authenticatedUser.email);
    console.log('🔧 Maintenance request ID:', maintenanceRequest.id);

    // Fetch full user data with landlord/juristic contact info
    const users = await base44.asServiceRole.entities.User.filter({ 
      email: authenticatedUser.email 
    });
    
    if (!users || users.length === 0) {
      console.error('❌ User not found in database:', authenticatedUser.email);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    const language = user.language || 'en';
    const notifications = [];

    console.log('👤 Full user data loaded');
    console.log('📧 Landlord email:', user.landlord_email || 'NOT SET');
    console.log('📧 Juristic email:', user.juristic_email || 'NOT SET');
    console.log('📧 User email notifications enabled:', user.email_notifications);

    // Get Resend API key for external emails
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    console.log('🔑 Resend API Key configured:', !!RESEND_API_KEY);

    // Helper function to validate email
    const isValidEmail = (email) => {
      if (!email || typeof email !== 'string') return false;
      const trimmed = email.trim();
      if (trimmed.length === 0) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(trimmed);
    };

    // Helper function to send email via Resend
    const sendViaResend = async (to, subject, htmlBody, fromName) => {
      if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured');
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromName ? `${fromName} <onboarding@resend.dev>` : 'Lease Shield <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: htmlBody,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Resend API error:', data);
        throw new Error(data.message || 'Failed to send via Resend');
      }

      return data;
    };

    // Generate unique acknowledgment token
    const acknowledgmentToken = crypto.randomUUID();

    // Update maintenance request with token
    await base44.asServiceRole.entities.MaintenanceRequest.update(maintenanceRequest.id, {
      acknowledgment_token: acknowledgmentToken
    });
    console.log('🔑 Acknowledgment token generated and saved');

    // Create acknowledgment link
    const appDomain = Deno.env.get('APP_DOMAIN') || 'app.leaseshield.asia';
    const acknowledgmentLink = `https://${appDomain}/acknowledge?token=${acknowledgmentToken}`;
    console.log('🔗 Acknowledgment link:', acknowledgmentLink);

    // Prepare message content
    const subject = language === 'th'
      ? `🔧 แจ้งซ่อม: ${maintenanceRequest.issue_title}`
      : `🔧 Maintenance Request: ${maintenanceRequest.issue_title}`;

    // Get tenant full address for display
    const tenantAddress = [
      user.tenant_address,
      user.tenant_city,
      user.tenant_state,
      user.tenant_zip
    ].filter(Boolean).join(', ') || (language === 'th' ? 'ไม่ได้ระบุ' : 'Not provided');

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
          
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>ผู้เช่า:</strong> ${user.full_name || 'ไม่ทราบชื่อ'}</p>
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
          
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>Tenant:</strong> ${user.full_name || 'Unknown'}</p>
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
            ${isValidEmail(user.landlord_email) || isValidEmail(user.juristic_email)
              ? `คุณจะได้รับการแจ้งเตือนเมื่อ${user.landlord_name || user.juristic_name || 'เจ้าของบ้าน'}รับทราบ` 
              : 'กรุณาเพิ่มข้อมูลติดต่อเจ้าของบ้าน/นิติบุคคลในหน้าบัญชีเพื่อส่งการแจ้งเตือน'}
          </p>
          
          <h3 style="color: #0C3B2E; margin-top: 20px;">${maintenanceRequest.issue_title}</h3>
          <p><strong>รายละเอียด:</strong><br/>${maintenanceRequest.description}</p>
          <p><strong>หมวดหมู่:</strong> ${maintenanceRequest.category}</p>
          <p><strong>ระดับความสำคัญ:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>ที่อยู่:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>วันที่แจ้ง:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('th-TH')}</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="font-size: 12px; color: #666;"><strong>ส่งถึง:</strong></p>
          ${isValidEmail(user.landlord_email) ? `<p style="font-size: 12px; color: #666;">✓ เจ้าของบ้าน: ${user.landlord_name || 'ไม่ทราบชื่อ'} (${user.landlord_email})</p>` : '<p style="font-size: 12px; color: #999;">✗ ยังไม่ได้ตั้งค่าอีเมลเจ้าของบ้าน</p>'}
          ${isValidEmail(user.juristic_email) ? `<p style="font-size: 12px; color: #666;">✓ นิติบุคคล: ${user.juristic_name || 'ไม่ทราบชื่อ'} (${user.juristic_email})</p>` : '<p style="font-size: 12px; color: #999;">✗ ยังไม่ได้ตั้งค่าอีเมลนิติบุคคล</p>'}
          
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
            ${isValidEmail(user.landlord_email) || isValidEmail(user.juristic_email)
              ? `You'll be notified when ${user.landlord_name || user.juristic_name || 'your landlord'} acknowledges it` 
              : 'Please add landlord/juristic contact info in Account page to send notifications'}
          </p>
          
          <h3 style="color: #0C3B2E; margin-top: 20px;">${maintenanceRequest.issue_title}</h3>
          <p><strong>Description:</strong><br/>${maintenanceRequest.description}</p>
          <p><strong>Category:</strong> ${maintenanceRequest.category}</p>
          <p><strong>Priority:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>Address:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>Reported:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('en-US')}</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="font-size: 12px; color: #666;"><strong>Sent to:</strong></p>
          ${isValidEmail(user.landlord_email) ? `<p style="font-size: 12px; color: #666;">✓ Landlord: ${user.landlord_name || 'Unknown'} (${user.landlord_email})</p>` : '<p style="font-size: 12px; color: #999;">✗ Landlord email not configured</p>'}
          ${isValidEmail(user.juristic_email) ? `<p style="font-size: 12px; color: #666;">✓ Juristic: ${user.juristic_name || 'Unknown'} (${user.juristic_email})</p>` : '<p style="font-size: 12px; color: #999;">✗ Juristic email not configured</p>'}
          
          <p style="font-size: 10px; color: #999; text-align: center; margin-top: 20px;">Sent from Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `;

    // Send to user (tenant) - confirmation copy using built-in email
    console.log('📤 Attempting to send tenant confirmation email...');
    if (user.email_notifications !== false && user.email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: language === 'th' ? '✅ สำเนาคำขอซ่อม' : '✅ Maintenance Request Copy',
          body: tenantHtmlBody
        });
        console.log('✅ Tenant email sent successfully to:', user.email);
        notifications.push({ recipient: 'user', method: 'email', status: 'sent', to: user.email });
      } catch (error) {
        console.error('❌ Failed to send tenant email:', error.message);
        notifications.push({ recipient: 'user', method: 'email', status: 'failed', error: error.message, to: user.email });
      }
    } else {
      console.log('⚠️ Tenant email notifications disabled or no email');
      notifications.push({ recipient: 'user', method: 'email', status: 'skipped', reason: 'notifications_disabled' });
    }

    // Send to landlord (email) using Resend directly
    console.log('📤 Attempting to send landlord email...');
    if (isValidEmail(user.landlord_email)) {
      try {
        console.log('📧 Sending to landlord via Resend:', user.landlord_email);
        const result = await sendViaResend(
          user.landlord_email.trim(),
          subject,
          landlordHtmlBody,
          user.full_name || 'Lease Shield Tenant'
        );
        console.log('✅ Landlord email sent successfully via Resend. Message ID:', result.id);
        notifications.push({ recipient: 'landlord', method: 'email', status: 'sent', to: user.landlord_email, messageId: result.id });
      } catch (error) {
        console.error('❌ Failed to send landlord email to', user.landlord_email, ':', error.message);
        console.error('❌ Full error:', error);
        notifications.push({ recipient: 'landlord', method: 'email', status: 'failed', error: error.message, to: user.landlord_email });
      }
    } else {
      console.log('⚠️ No valid landlord email configured for user:', user.email);
      console.log('⚠️ Landlord email value:', user.landlord_email);
      notifications.push({ recipient: 'landlord', method: 'email', status: 'skipped', reason: 'invalid_or_missing_email' });
    }

    // Send to juristic (email) using Resend directly
    console.log('📤 Attempting to send juristic email...');
    if (isValidEmail(user.juristic_email)) {
      try {
        console.log('📧 Sending to juristic via Resend:', user.juristic_email);
        const result = await sendViaResend(
          user.juristic_email.trim(),
          subject,
          landlordHtmlBody,
          user.full_name || 'Lease Shield Tenant'
        );
        console.log('✅ Juristic email sent successfully via Resend. Message ID:', result.id);
        notifications.push({ recipient: 'juristic', method: 'email', status: 'sent', to: user.juristic_email, messageId: result.id });
      } catch (error) {
        console.error('❌ Failed to send juristic email to', user.juristic_email, ':', error.message);
        console.error('❌ Full error:', error);
        notifications.push({ recipient: 'juristic', method: 'email', status: 'failed', error: error.message, to: user.juristic_email });
      }
    } else {
      console.log('⚠️ No valid juristic email configured for user:', user.email);
      console.log('⚠️ Juristic email value:', user.juristic_email);
      notifications.push({ recipient: 'juristic', method: 'email', status: 'skipped', reason: 'invalid_or_missing_email' });
    }

    console.log('📊 Final notification summary:', JSON.stringify(notifications, null, 2));

    return Response.json({
      success: true,
      notifications: notifications,
      acknowledgmentLink: acknowledgmentLink,
      debug: {
        userEmail: user.email,
        landlordEmail: user.landlord_email || 'not_set',
        juristicEmail: user.juristic_email || 'not_set',
        landlordEmailValid: isValidEmail(user.landlord_email),
        juristicEmailValid: isValidEmail(user.juristic_email),
        resendConfigured: !!RESEND_API_KEY,
        emailsSent: notifications.filter(n => n.status === 'sent').length,
        emailsFailed: notifications.filter(n => n.status === 'failed').length,
        emailsSkipped: notifications.filter(n => n.status === 'skipped').length
      }
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in maintenance notification:', error);
    console.error('❌ Error stack:', error.stack);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});