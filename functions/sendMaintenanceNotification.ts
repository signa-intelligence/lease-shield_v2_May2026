/**
 * LeaseShield Multi-Language Maintenance Notifications
 * Sends notifications in recipient's preferred language + English
 * NO CREDITS USED - notifications are always free
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createMaintenanceRequestFlex } from './lineFlexTemplates.js';

/**
 * Build notification language for recipient
 */
function buildNotificationLanguage(context) {
  const SUPPORTED = ['en', 'th', 'ja', 'zh', 'ko', 'ru'];
  
  const clean = (lang, fallback) => {
    if (!lang) return fallback;
    const cleaned = lang.toLowerCase().trim();
    return SUPPORTED.includes(cleaned) ? cleaned : fallback;
  };

  const { recipientType, tenantLanguage, landlordLanguage } = context;

  // Juristic: Thai with English section
  if (recipientType === 'juristic') {
    return {
      primary: 'th',
      includeBilingual: true,
      secondary: 'en'
    };
  }

  // Landlord: Landlord language with English section
  if (recipientType === 'landlord') {
    const landlordLang = clean(landlordLanguage, 'th');
    return {
      primary: landlordLang,
      includeBilingual: true,
      secondary: 'en'
    };
  }

  // Tenant: Tenant language with optional English
  const tenantLang = clean(tenantLanguage, 'en');
  return {
    primary: tenantLang,
    includeBilingual: tenantLang !== 'en',
    secondary: 'en'
  };
}

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
    const tenantLanguage = user.language || 'en';
    const landlordLanguage = user.landlord_language || 'th';
    const notifications = [];

    console.log('👤 Full user data loaded');
    console.log('🌍 Tenant language:', tenantLanguage);
    console.log('🌍 Landlord language:', landlordLanguage);
    console.log('📧 Landlord email:', user.landlord_email || 'NOT SET');
    console.log('📧 Juristic email:', user.juristic_email || 'NOT SET');

    // Get description text
    const description = maintenanceRequest.description || maintenanceRequest.issue_title || '';

    // Get Resend API key for external emails
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

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
          from: fromName ? `${fromName} <notifications@leaseshield.asia>` : 'Lease Shield <notifications@leaseshield.asia>',
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

    // Create acknowledgment links with role parameter
    const appDomain = Deno.env.get('APP_DOMAIN') || 'app.leaseshield.asia';
    const landlordAcknowledgmentLink = `https://${appDomain}/acknowledge?token=${acknowledgmentToken}&role=landlord`;
    const juristicAcknowledgmentLink = `https://${appDomain}/acknowledge?token=${acknowledgmentToken}&role=juristic`;

    // Get tenant full address for display
    const tenantAddress = [
      user.tenant_address,
      user.tenant_city,
      user.tenant_state,
      user.tenant_zip
    ].filter(Boolean).join(', ') || (language === 'th' ? 'ไม่ได้ระบุ' : 'Not provided');

    // Build language configs for each recipient
    const tenantLang = buildNotificationLanguage({
      recipientType: 'tenant',
      tenantLanguage,
      landlordLanguage
    });

    const landlordLang = buildNotificationLanguage({
      recipientType: 'landlord',
      tenantLanguage,
      landlordLanguage
    });

    const juristicLang = buildNotificationLanguage({
      recipientType: 'juristic',
      tenantLanguage,
      landlordLanguage
    });

    console.log('🌍 Landlord notification language:', landlordLang);
    console.log('🌍 Juristic notification language:', juristicLang);
    console.log('🌍 Tenant notification language:', tenantLang);

    // Prepare landlord notification (using landlord's language + English)
    const landlordSubject = landlordLang.primary === 'th'
      ? `🔧 แจ้งซ่อม: ${maintenanceRequest.issue_title}`
      : landlordLang.primary === 'ja'
      ? `🔧 メンテナンス依頼: ${maintenanceRequest.issue_title}`
      : landlordLang.primary === 'zh'
      ? `🔧 维护请求: ${maintenanceRequest.issue_title}`
      : landlordLang.primary === 'ko'
      ? `🔧 유지보수 요청: ${maintenanceRequest.issue_title}`
      : landlordLang.primary === 'ru'
      ? `🔧 Запрос на обслуживание: ${maintenanceRequest.issue_title}`
      : `🔧 Maintenance Request: ${maintenanceRequest.issue_title}`;

    const landlordHtmlBody = landlordLang.primary === 'th'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 แจ้งซ่อมใหม่</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p>${description.replace(/\n/g, '<br />')}</p>
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
            <a href="${landlordAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
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
          <p>${description.replace(/\n/g, '<br />')}</p>
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
            <a href="${landlordAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ Acknowledge & Update Status
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">Click to confirm you've received this request and update its status</p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 10px; color: #999; text-align: center;">Sent from Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `
      : landlordLang.primary === 'ja'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 メンテナンス依頼 / Maintenance Request</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p>${description.replace(/\n/g, '<br />')}</p>
          <p><strong>カテゴリ / Category:</strong> ${maintenanceRequest.category}</p>
          <p><strong>優先度 / Priority:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>物件住所 / Property:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; color: #666;"><strong>賃借人 / Tenant:</strong> ${user.full_name || 'Unknown'}</p>
          <p style="font-size: 14px; color: #666;"><strong>連絡先 / Contact:</strong> ${user.email}</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${landlordAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ 確認してステータスを更新 / Acknowledge & Update
            </a>
          </div>
          <p style="font-size: 10px; color: #999; text-align: center;">Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `
      : landlordLang.primary === 'zh'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 维护请求 / Maintenance Request</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p>${description.replace(/\n/g, '<br />')}</p>
          <p><strong>类别 / Category:</strong> ${maintenanceRequest.category}</p>
          <p><strong>优先级 / Priority:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>物业地址 / Property:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; color: #666;"><strong>租户 / Tenant:</strong> ${user.full_name || 'Unknown'}</p>
          <p style="font-size: 14px; color: #666;"><strong>联系方式 / Contact:</strong> ${user.email}</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${landlordAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ 确认并更新状态 / Acknowledge & Update
            </a>
          </div>
          <p style="font-size: 10px; color: #999; text-align: center;">Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `
      : landlordLang.primary === 'ko'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 유지보수 요청 / Maintenance Request</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p>${description.replace(/\n/g, '<br />')}</p>
          <p><strong>카테고리 / Category:</strong> ${maintenanceRequest.category}</p>
          <p><strong>우선순위 / Priority:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>부동산 주소 / Property:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; color: #666;"><strong>임차인 / Tenant:</strong> ${user.full_name || 'Unknown'}</p>
          <p style="font-size: 14px; color: #666;"><strong>연락처 / Contact:</strong> ${user.email}</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${landlordAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ 확인 및 상태 업데이트 / Acknowledge & Update
            </a>
          </div>
          <p style="font-size: 10px; color: #999; text-align: center;">Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `
      : landlordLang.primary === 'ru'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 Запрос на обслуживание / Maintenance Request</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p>${description.replace(/\n/g, '<br />')}</p>
          <p><strong>Категория / Category:</strong> ${maintenanceRequest.category}</p>
          <p><strong>Приоритет / Priority:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>Адрес / Property:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 14px; color: #666;"><strong>Арендатор / Tenant:</strong> ${user.full_name || 'Unknown'}</p>
          <p style="font-size: 14px; color: #666;"><strong>Контакт / Contact:</strong> ${user.email}</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${landlordAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ Подтвердить и обновить статус / Acknowledge & Update
            </a>
          </div>
          <p style="font-size: 10px; color: #999; text-align: center;">Lease Shield - www.leaseshield.asia</p>
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
          <p>${description.replace(/\n/g, '<br />')}</p>
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
            <a href="${landlordAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ Acknowledge & Update Status
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">Click to confirm you've received this request and update its status</p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 10px; color: #999; text-align: center;">Sent from Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `;

    // Prepare juristic notification (always Thai + English)
    const juristicSubject = `🔧 แจ้งซ่อม / Maintenance Request: ${maintenanceRequest.issue_title}`;

    const juristicHtmlBody = `
      ? `🔧 แจ้งซ่อม: ${maintenanceRequest.issue_title}`
      : `🔧 Maintenance Request: ${maintenanceRequest.issue_title}`;

    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 แจ้งซ่อม / Maintenance Request</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p>${description.replace(/\n/g, '<br />')}</p>
          <p><strong>หมวดหมู่ / Category:</strong> ${maintenanceRequest.category}</p>
          <p><strong>ระดับความสำคัญ / Priority:</strong> <span style="color: ${maintenanceRequest.priority === 'urgent' ? '#EF4444' : maintenanceRequest.priority === 'high' ? '#F59E0B' : '#3B82F6'};">${maintenanceRequest.priority}</span></p>
          ${maintenanceRequest.property_address ? `<p><strong>ที่อยู่ทรัพย์สิน / Property:</strong> ${maintenanceRequest.property_address}</p>` : ''}
          <p><strong>วันที่แจ้ง / Reported:</strong> ${new Date(maintenanceRequest.reported_date).toLocaleDateString('th-TH')} / ${new Date(maintenanceRequest.reported_date).toLocaleDateString('en-US')}</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>ผู้เช่า / Tenant:</strong> ${user.full_name || 'Unknown'}</p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>อีเมล / Email:</strong> ${user.email}</p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>เบอร์โทร / Phone:</strong> ${user.phone || 'Not provided'}</p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>ที่อยู่ผู้เช่า / Address:</strong> ${tenantAddress}</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${juristicAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ รับทราบและอัปเดตสถานะ / Acknowledge & Update
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">คลิกเพื่อยืนยันว่าคุณได้รับทราบคำขอซ่อมนี้แล้ว / Click to confirm receipt and update status</p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 10px; color: #999; text-align: center;">ส่งจาก Lease Shield / Sent from Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `;

    // REMOVED: Old Thai-only and English-only juristic templates

    // Prepare tenant notification (using tenant's language + English if needed)
    const tenantSubject = tenantLang.primary === 'th' ? '✅ สำเนาคำขอซ่อม' : tenantLang.primary === 'ja' ? '✅ メンテナンス依頼のコピー' : tenantLang.primary === 'zh' ? '✅ 维护请求副本' : tenantLang.primary === 'ko' ? '✅ 유지보수 요청 사본' : tenantLang.primary === 'ru' ? '✅ Копия запроса на обслуживание' : '✅ Maintenance Request Copy';

    const tenantHtmlBody = tenantLang.primary === 'th'
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🔧 แจ้งซ่อมใหม่</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0C3B2E;">${maintenanceRequest.issue_title}</h3>
          <p>${description.replace(/\n/g, '<br />')}</p>
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
            <a href="${juristicAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
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
          <p>${description.replace(/\n/g, '<br />')}</p>
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
            <a href="${juristicAcknowledgmentLink}" style="display: inline-block; background-color: #0C3B2E; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✓ Acknowledge & Update Status
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">Click to confirm you've received this request and update its status</p>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 10px; color: #999; text-align: center;">Sent from Lease Shield - www.leaseshield.asia</p>
        </div>
      </div>
      `;

    // Tenant confirmation
    const tenantSubject = language === 'th' ? '✅ สำเนาคำขอซ่อม' : '✅ Maintenance Request Copy';

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
          <p>${description.replace(/\n/g, '<br />')}</p>
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
          <p>${description.replace(/\n/g, '<br />')}</p>
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
          subject: tenantSubject,
          body: tenantHtmlBody
        });
        console.log('✅ Tenant email sent successfully to:', user.email);
        notifications.push({ recipient: 'tenant', method: 'email', status: 'sent', to: user.email });
      } catch (error) {
        console.error('❌ Failed to send tenant email:', error.message);
        notifications.push({ recipient: 'tenant', method: 'email', status: 'failed', error: error.message, to: user.email });
      }
    } else {
      console.log('⚠️ Tenant email notifications disabled or no email');
      notifications.push({ recipient: 'tenant', method: 'email', status: 'skipped', reason: 'notifications_disabled' });
    }

    // Send to tenant via LINE (confirmation)
    console.log('📤 Attempting to send tenant LINE notification...');
    if (user.line_messaging_token && user.line_notifications !== false) {
      try {
        const flexData = {
          issueTitle: maintenanceRequest.issue_title,
          description: maintenanceRequest.description || '',
          category: maintenanceRequest.category,
          priority: maintenanceRequest.priority,
          propertyAddress: maintenanceRequest.property_address || '',
          reportedDate: new Date(maintenanceRequest.reported_date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US'),
          photoCount: maintenanceRequest.photo_urls?.length || 0,
          tenantName: user.full_name || user.email,
          token: acknowledgmentToken
        };

        const tenantFlexMessage = createMaintenanceRequestFlex({
          ...flexData,
          role: 'tenant'
        }, language);
        
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          userId: user.line_messaging_token,
          flexMessage: tenantFlexMessage
        });
        console.log('✅ Tenant LINE notification sent');
        notifications.push({ recipient: 'tenant', method: 'LINE', status: 'sent' });
      } catch (error) {
        console.error('❌ Failed to send tenant LINE:', error.message);
        notifications.push({ recipient: 'tenant', method: 'LINE', status: 'failed', error: error.message });
      }
    } else {
      console.log('⚠️ Tenant LINE not configured or disabled');
      notifications.push({ recipient: 'tenant', method: 'LINE', status: 'skipped', reason: 'not_configured' });
    }

    // Send to landlord (email) using Resend directly
    console.log('📤 Attempting to send landlord email...');
    if (isValidEmail(user.landlord_email)) {
      try {
        console.log('📧 Sending to landlord via Resend:', user.landlord_email);
        const result = await sendViaResend(
          user.landlord_email.trim(),
          landlordSubject,
          landlordHtmlBody,
          user.full_name || 'Lease Shield Tenant'
        );
        console.log('✅ Landlord email sent successfully via Resend. Message ID:', result.id);
        notifications.push({ recipient: 'landlord', method: 'email', status: 'sent', to: user.landlord_email, messageId: result.id });
      } catch (error) {
        console.error('❌ Failed to send landlord email to', user.landlord_email, ':', error.message);
        notifications.push({ recipient: 'landlord', method: 'email', status: 'failed', error: error.message, to: user.landlord_email });
      }
    } else {
      console.log('⚠️ No valid landlord email configured');
      notifications.push({ recipient: 'landlord', method: 'email', status: 'skipped', reason: 'invalid_or_missing_email' });
    }

    // Send to landlord via LINE (if they have LINE ID stored)
    console.log('📤 Attempting to send landlord LINE notification...');
    if (user.landlord_line && user.landlord_line.trim()) {
      try {
        const flexData = {
          issueTitle: maintenanceRequest.issue_title,
          description: maintenanceRequest.description || '',
          category: maintenanceRequest.category,
          priority: maintenanceRequest.priority,
          propertyAddress: maintenanceRequest.property_address || '',
          reportedDate: new Date(maintenanceRequest.reported_date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US'),
          photoCount: maintenanceRequest.photo_urls?.length || 0,
          tenantName: user.full_name || user.email,
          token: acknowledgmentToken
        };

        const landlordFlexMessage = createMaintenanceRequestFlex({
          ...flexData,
          role: 'landlord'
        }, landlordLang.primary);
        
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          userId: user.landlord_line.trim(),
          flexMessage: landlordFlexMessage
        });
        console.log('✅ Landlord LINE notification sent');
        notifications.push({ recipient: 'landlord', method: 'LINE', status: 'sent', to: user.landlord_line });
      } catch (error) {
        console.error('❌ Failed to send landlord LINE:', error.message);
        notifications.push({ recipient: 'landlord', method: 'LINE', status: 'failed', error: error.message });
      }
    } else {
      console.log('⚠️ Landlord LINE ID not configured');
      notifications.push({ recipient: 'landlord', method: 'LINE', status: 'skipped', reason: 'not_configured' });
    }

    // Send to juristic (email) using Resend directly
    console.log('📤 Attempting to send juristic email...');
    if (isValidEmail(user.juristic_email)) {
      try {
        console.log('📧 Sending to juristic via Resend:', user.juristic_email);
        const result = await sendViaResend(
          user.juristic_email.trim(),
          juristicSubject,
          juristicHtmlBody,
          user.full_name || 'Lease Shield Tenant'
        );
        console.log('✅ Juristic email sent successfully via Resend. Message ID:', result.id);
        notifications.push({ recipient: 'juristic', method: 'email', status: 'sent', to: user.juristic_email, messageId: result.id });
      } catch (error) {
        console.error('❌ Failed to send juristic email to', user.juristic_email, ':', error.message);
        notifications.push({ recipient: 'juristic', method: 'email', status: 'failed', error: error.message, to: user.juristic_email });
      }
    } else {
      console.log('⚠️ No valid juristic email configured');
      notifications.push({ recipient: 'juristic', method: 'email', status: 'skipped', reason: 'invalid_or_missing_email' });
    }

    // Send to juristic via LINE (if they have LINE ID stored)
    console.log('📤 Attempting to send juristic LINE notification...');
    if (user.juristic_line && user.juristic_line.trim()) {
      try {
        const flexData = {
          issueTitle: maintenanceRequest.issue_title,
          description: maintenanceRequest.description || '',
          category: maintenanceRequest.category,
          priority: maintenanceRequest.priority,
          propertyAddress: maintenanceRequest.property_address || '',
          reportedDate: new Date(maintenanceRequest.reported_date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US'),
          photoCount: maintenanceRequest.photo_urls?.length || 0,
          tenantName: user.full_name || user.email,
          token: acknowledgmentToken
        };

        const juristicFlexMessage = createMaintenanceRequestFlex({
          ...flexData,
          role: 'juristic'
        }, juristicLang.primary);
        
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          userId: user.juristic_line.trim(),
          flexMessage: juristicFlexMessage
        });
        console.log('✅ Juristic LINE notification sent');
        notifications.push({ recipient: 'juristic', method: 'LINE', status: 'sent', to: user.juristic_line });
      } catch (error) {
        console.error('❌ Failed to send juristic LINE:', error.message);
        notifications.push({ recipient: 'juristic', method: 'LINE', status: 'failed', error: error.message });
      }
    } else {
      console.log('⚠️ Juristic LINE ID not configured');
      notifications.push({ recipient: 'juristic', method: 'LINE', status: 'skipped', reason: 'not_configured' });
    }

    console.log('📊 Final notification summary:', JSON.stringify(notifications, null, 2));
    console.log('🌍 Language configs used:', {
      tenant: tenantLang,
      landlord: landlordLang,
      juristic: juristicLang
    });

    return Response.json({
      success: true,
      notifications: notifications,
      acknowledgmentLinks: {
        landlord: landlordAcknowledgmentLink,
        juristic: juristicAcknowledgmentLink
      },
      languageConfigs: {
        tenant: tenantLang,
        landlord: landlordLang,
        juristic: juristicLang
      },
      debug: {
        userEmail: user.email,
        landlordEmail: user.landlord_email || 'not_set',
        juristicEmail: user.juristic_email || 'not_set',
        landlordLine: user.landlord_line || 'not_set',
        juristicLine: user.juristic_line || 'not_set',
        userLineToken: user.line_messaging_token || 'not_set',
        lineNotificationsEnabled: user.line_notifications !== false,
        landlordEmailValid: isValidEmail(user.landlord_email),
        juristicEmailValid: isValidEmail(user.juristic_email),
        resendConfigured: !!RESEND_API_KEY,
        emailsSent: notifications.filter(n => n.method === 'email' && n.status === 'sent').length,
        linesSent: notifications.filter(n => n.method === 'LINE' && n.status === 'sent').length,
        totalFailed: notifications.filter(n => n.status === 'failed').length,
        totalSkipped: notifications.filter(n => n.status === 'skipped').length
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