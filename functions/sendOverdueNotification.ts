import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createDepositReminderFlex } from './lineFlexTemplates.js';
import { createDepositReminderEmail } from './emailTemplates.js';

/**
 * Send overdue deposit notification with Beautiful HTML Email + Rich LINE Flex
 * Triggered manually from Dashboard when deposits are overdue
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deposit } = await req.json();
    
    if (!deposit || !deposit.daysOverdue) {
      return Response.json({ error: 'Missing deposit data' }, { status: 400 });
    }

    const language = user.language || 'en';
    const channels = [];

    const depositAmount = deposit.deposit_amount || 0;
    const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
    const expectedDate = deposit.expected_return_date 
      ? new Date(deposit.expected_return_date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')
      : 'N/A';
    const daysOverdue = Math.abs(deposit.daysOverdue);

    // Create Beautiful LINE Flex Message
    const flexMessage = createDepositReminderFlex({
      days: -daysOverdue,
      depositAmount,
      propertyAddress,
      expectedDate,
      urgency: 'critical'
    }, language);

    // Create Beautiful HTML Email
    const htmlEmail = createDepositReminderEmail({
      days: -daysOverdue,
      depositAmount,
      propertyAddress,
      expectedDate,
      urgency: 'critical'
    }, language);

    const emailSubject = language === 'th'
      ? `🚨 เงินมัดจำเกินกำหนด ${daysOverdue} วัน`
      : `🚨 Deposit Overdue by ${daysOverdue} Days`;

    // Send to LINE if enabled
    if (user.line_messaging_token && user.line_notifications) {
      try {
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          userId: user.line_messaging_token,
          flexMessage: flexMessage
        });
        channels.push('LINE');
        console.log('✅ LINE Flex sent');
      } catch (err) {
        console.error('❌ LINE failed:', err);
      }
    }

    // Send to Email if enabled
    if (user.email_notifications) {
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Lease Shield',
          to: user.email,
          subject: emailSubject,
          body: htmlEmail
        });
        channels.push('Email');
        console.log('✅ HTML Email sent');
      } catch (err) {
        console.error('❌ Email failed:', err);
      }
    }

    // Log notification
    await base44.asServiceRole.entities.NotificationLog.create({
      user_email: user.email,
      notification_type: 'overdue_deposit',
      channel: channels.join(', '),
      status: 'sent',
      related_entity_type: 'deposit',
      related_entity_id: deposit.id,
      message_preview: `Overdue by ${daysOverdue} days: ฿${depositAmount.toLocaleString()}`
    });

    console.log(`✅ Overdue notification sent via: ${channels.join(', ')}`);

    return Response.json({ 
      success: true,
      channels: channels,
      message: `Notification sent via ${channels.join(' & ')}`
    });

  } catch (error) {
    console.error('❌ Overdue notification error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});