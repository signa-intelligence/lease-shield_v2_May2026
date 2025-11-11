import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createMaintenanceEmail } from './emailTemplates.js';
import { createMaintenanceChatFlex } from './lineFlexTemplates.js';

/**
 * Add comment to maintenance request chat
 * Notifies all parties (Tenant, Landlord, Juristic) except the sender
 * Sends Beautiful HTML Email + Rich LINE Flex for chat updates
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { maintenanceId, message, photoUrls, senderType, token } = await req.json();
    
    if (!maintenanceId || !message) {
      return Response.json({ 
        error: 'Missing maintenanceId or message' 
      }, { status: 400 });
    }
    
    console.log(`💬 Adding comment to maintenance ${maintenanceId}`);
    
    let request;
    let sender;
    
    // If token provided (landlord/juristic access), validate it
    if (token) {
      const requests = await base44.asServiceRole.entities.MaintenanceRequest.filter({
        id: maintenanceId,
        acknowledgment_token: token
      });
      
      if (!requests || requests.length === 0) {
        return Response.json({ error: 'Invalid token' }, { status: 403 });
      }
      
      request = requests[0];
      sender = senderType || 'Landlord/Juristic';
    } else {
      // Authenticated user (tenant)
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const requests = await base44.asServiceRole.entities.MaintenanceRequest.filter({
        id: maintenanceId,
        created_by: user.email
      });
      
      if (!requests || requests.length === 0) {
        return Response.json({ error: 'Maintenance request not found' }, { status: 404 });
      }
      
      request = requests[0];
      sender = 'Tenant';
    }
    
    // Add to communication log
    const existingLog = request.communication_log || [];
    const newEntry = {
      date: new Date().toISOString(),
      sender: sender,
      message: message,
      photo_urls: photoUrls || []
    };
    
    const updatedLog = [...existingLog, newEntry];
    
    await base44.asServiceRole.entities.MaintenanceRequest.update(request.id, {
      communication_log: updatedLog
    });
    
    // Get tenant data
    const tenantUsers = await base44.asServiceRole.entities.User.filter({ email: request.created_by });
    const tenant = tenantUsers[0];
    
    if (!tenant) {
      return Response.json({ 
        success: true, 
        message: 'Comment added but tenant not found for notifications' 
      });
    }
    
    const language = tenant.language || 'en';
    const channels = [];
    const propertyAddress = request.property_address || tenant.tenant_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
    
    // ==========================================
    // CREATE BEAUTIFUL NOTIFICATIONS
    // ==========================================
    
    const strings = {
      en: {
        newComment: 'New Comment',
        on: 'on',
        from: 'from',
        viewConversation: 'View Conversation'
      },
      th: {
        newComment: 'ข้อความใหม่',
        on: 'ใน',
        from: 'จาก',
        viewConversation: 'ดูการสนทนา'
      }
    };
    
    const str = strings[language];
    
    const emailSubject = language === 'th'
      ? `💬 ${str.newComment}: ${request.issue_title}`
      : `💬 ${str.newComment}: ${request.issue_title}`;
    
    // Beautiful HTML email for chat updates
    const createChatEmailHtml = (senderName, message, photoUrls) => {
      let photosHtml = '';
      if (photoUrls && photoUrls.length > 0) {
        const photosGrid = photoUrls.map(url => 
          `<img src="${url}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; margin: 5px;" />`
        ).join('');
        photosHtml = `
          <div style="margin: 20px 0;">
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
              ${photosGrid}
            </div>
          </div>`;
      }
      
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #0C3B2E, #047857); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">💬 ${str.newComment}</h2>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6;">
              <h3 style="color: #0C3B2E; margin-top: 0;">${request.issue_title}</h3>
              <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; font-weight: 600;">${str.from} ${senderName}:</p>
                <p style="margin: 0; color: #1a1d1f; font-size: 15px;">${message}</p>
              </div>
              ${photosHtml}
              <div style="text-center; margin-top: 25px;">
                <a href="https://app.leaseshield.asia/PropertyTracker" style="display: inline-block; padding: 12px 24px; background-color: #0C3B2E; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  ${str.viewConversation}
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    };
    
    // Rich LINE Flex Message for chat updates
    const flexMessage = createMaintenanceChatFlex({
      issueTitle: request.issue_title,
      message: message,
      senderName: sender,
      senderType: sender,
      propertyAddress: propertyAddress,
      photoUrls: photoUrls || [],
      timestamp: newEntry.date
    }, language);
    
    const emailHtml = createChatEmailHtml(sender, message, photoUrls);
    
    // ==========================================
    // NOTIFY OTHER PARTIES (not the sender)
    // ==========================================
    
    if (sender === 'Tenant') {
      // Notify Landlord via Email
      if (tenant.landlord_email) {
        try {
          await base44.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: tenant.landlord_email,
            subject: emailSubject,
            body: emailHtml
          });
          channels.push('Landlord Email');
          console.log(`✅ Email sent to landlord: ${tenant.landlord_email}`);
        } catch (err) {
          console.error('❌ Failed to email landlord:', err);
        }
      }
      
      // Notify Landlord via LINE
      if (tenant.landlord_line) {
        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: tenant.landlord_line,
            flexMessage: flexMessage
          });
          channels.push('Landlord LINE');
          console.log(`✅ LINE sent to landlord: ${tenant.landlord_line}`);
        } catch (err) {
          console.error('❌ Failed to send LINE to landlord:', err);
        }
      }
      
      // Notify Juristic via Email
      if (tenant.juristic_email) {
        try {
          await base44.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: tenant.juristic_email,
            subject: emailSubject,
            body: emailHtml
          });
          channels.push('Juristic Email');
          console.log(`✅ Email sent to juristic: ${tenant.juristic_email}`);
        } catch (err) {
          console.error('❌ Failed to email juristic:', err);
        }
      }
      
      // Notify Juristic via LINE
      if (tenant.juristic_line) {
        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: tenant.juristic_line,
            flexMessage: flexMessage
          });
          channels.push('Juristic LINE');
          console.log(`✅ LINE sent to juristic: ${tenant.juristic_line}`);
        } catch (err) {
          console.error('❌ Failed to send LINE to juristic:', err);
        }
      }
    } else {
      // If sender is Landlord/Juristic, notify Tenant
      
      // Notify Tenant via Email
      if (tenant.email_notifications) {
        try {
          await base44.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: tenant.email,
            subject: emailSubject,
            body: emailHtml
          });
          channels.push('Tenant Email');
          console.log(`✅ Email sent to tenant: ${tenant.email}`);
        } catch (err) {
          console.error('❌ Failed to email tenant:', err);
        }
      }
      
      // Notify Tenant via LINE
      if (tenant.line_messaging_token && tenant.line_notifications) {
        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: tenant.line_messaging_token,
            flexMessage: flexMessage
          });
          channels.push('Tenant LINE');
          console.log(`✅ LINE sent to tenant: ${tenant.email}`);
        } catch (err) {
          console.error('❌ Failed to send LINE to tenant:', err);
        }
      }
    }
    
    // Log notification
    await base44.asServiceRole.entities.NotificationLog.create({
      user_email: tenant.email,
      notification_type: 'maintenance_update',
      channel: channels.join(', '),
      status: 'sent',
      related_entity_type: 'maintenance',
      related_entity_id: maintenanceId,
      message_preview: message.substring(0, 200)
    });
    
    console.log(`✅ Comment added and ${channels.length} notification(s) sent: ${channels.join(', ')}`);
    
    return Response.json({
      success: true,
      channels: channels,
      communication_log: updatedLog
    });
    
  } catch (error) {
    console.error('❌ Add comment error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});