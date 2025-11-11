import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createMaintenanceReportedFlex, createMaintenanceStatusFlex } from './lineFlexTemplates.js';
import { createMaintenanceEmail } from './emailTemplates.js';

/**
 * Sends notifications for maintenance requests with Beautiful HTML Emails + LINE Flex
 * - To landlord/juristic when tenant creates request
 * - To tenant when status changes
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { maintenanceId, notifyType } = await req.json();
    
    if (!maintenanceId || !notifyType) {
      return Response.json({ 
        error: 'Missing maintenanceId or notifyType' 
      }, { status: 400 });
    }
    
    console.log(`🔧 Maintenance notification: ${notifyType} for ${maintenanceId}`);
    
    // Get maintenance request
    const maintenance = await base44.asServiceRole.entities.MaintenanceRequest.filter({ id: maintenanceId });
    if (!maintenance || maintenance.length === 0) {
      return Response.json({ error: 'Maintenance request not found' }, { status: 404 });
    }
    
    const request = maintenance[0];
    
    // Get tenant (request creator)
    const tenantUsers = await base44.asServiceRole.entities.User.filter({ email: request.created_by });
    const tenant = tenantUsers[0];
    
    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }
    
    const language = tenant.language || 'en';
    const channels = [];
    
    if (notifyType === 'new_request') {
      // ==========================================
      // NOTIFY LANDLORD & JURISTIC
      // ==========================================
      
      const flexMessage = createMaintenanceReportedFlex({
        issueTitle: request.issue_title,
        description: request.description,
        category: request.category,
        priority: request.priority,
        propertyAddress: request.property_address || tenant.tenant_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
        reportedBy: tenant.full_name || tenant.email
      }, language);
      
      const htmlEmail = createMaintenanceEmail({
        issueTitle: request.issue_title,
        status: 'reported',
        propertyAddress: request.property_address || tenant.tenant_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
        landlordResponse: request.description
      }, language);
      
      const emailSubject = language === 'th' 
        ? `🔧 คำขอซ่อมบำรุงใหม่: ${request.issue_title}`
        : `🔧 New Maintenance Request: ${request.issue_title}`;
      
      // Send to Landlord
      if (tenant.landlord_email) {
        try {
          await base44.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: tenant.landlord_email,
            subject: emailSubject,
            body: htmlEmail
          });
          channels.push('Landlord Email');
          console.log(`✅ HTML Email sent to landlord: ${tenant.landlord_email}`);
        } catch (err) {
          console.error('❌ Failed to email landlord:', err);
        }
      }
      
      // Send to Landlord LINE (if configured)
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
      
      // Send to Juristic Email
      if (tenant.juristic_email) {
        try {
          await base44.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: tenant.juristic_email,
            subject: emailSubject,
            body: htmlEmail
          });
          channels.push('Juristic Email');
          console.log(`✅ HTML Email sent to juristic: ${tenant.juristic_email}`);
        } catch (err) {
          console.error('❌ Failed to email juristic:', err);
        }
      }
      
      // Send to Juristic LINE (if configured)
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
      
      // Log notification
      await base44.asServiceRole.entities.NotificationLog.create({
        user_email: tenant.email,
        notification_type: 'maintenance_update',
        channel: channels.join(', '),
        status: 'sent',
        related_entity_type: 'maintenance',
        related_entity_id: maintenanceId,
        message_preview: `New maintenance request: ${request.issue_title}`
      });
      
    } else if (notifyType === 'status_update') {
      // ==========================================
      // NOTIFY TENANT OF STATUS CHANGE
      // ==========================================
      
      const flexMessage = createMaintenanceStatusFlex({
        issueTitle: request.issue_title,
        oldStatus: request.status,
        newStatus: request.status,
        propertyAddress: request.property_address || tenant.tenant_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A')
      }, language);
      
      const htmlEmail = createMaintenanceEmail({
        issueTitle: request.issue_title,
        status: request.status,
        propertyAddress: request.property_address || tenant.tenant_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
        landlordResponse: request.landlord_response,
        actualCost: request.actual_cost
      }, language);
      
      const emailSubject = language === 'th'
        ? `🔧 อัปเดตการซ่อมบำรุง: ${request.issue_title}`
        : `🔧 Maintenance Update: ${request.issue_title}`;
      
      // Send to Tenant LINE
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
      
      // Send to Tenant Email
      if (tenant.email_notifications) {
        try {
          await base44.integrations.Core.SendEmail({
            from_name: 'Lease Shield',
            to: tenant.email,
            subject: emailSubject,
            body: htmlEmail
          });
          channels.push('Tenant Email');
          console.log(`✅ HTML Email sent to tenant: ${tenant.email}`);
        } catch (err) {
          console.error('❌ Failed to email tenant:', err);
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
        message_preview: `Status update: ${request.status}`
      });
    }
    
    return Response.json({
      success: true,
      channels: channels,
      message: `Notifications sent via ${channels.join(', ')}`
    });
    
  } catch (error) {
    console.error('❌ Maintenance notification error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});