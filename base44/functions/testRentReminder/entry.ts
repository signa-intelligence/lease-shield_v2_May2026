import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createRentReminderFlex } from './lineFlexTemplates.js';

/**
 * FORCE send rent reminder for testing - IGNORES SCHEDULE
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('💰 FORCE rent reminder test for:', user.email);

    // Find ANY deposit with rent amount set
    const deposits = await base44.entities.DepositTracker.filter({
      created_by: user.email
    });

    const rentDeposit = deposits.find(d => d.rent_amount && d.rent_due_day);

    if (!rentDeposit) {
      return Response.json({
        success: false,
        message: 'No deposits with rent amount and due day configured'
      });
    }

    const language = user.language || 'en';
    
    console.log('📦 Using deposit:', rentDeposit.id);
    console.log('💰 Rent amount:', rentDeposit.rent_amount);
    console.log('📅 Due day:', rentDeposit.rent_due_day);

    // FORCE create Flex message
    const flexMessage = createRentReminderFlex({
      rentAmount: rentDeposit.rent_amount,
      propertyAddress: rentDeposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
      dueDay: rentDeposit.rent_due_day,
      daysUntilDue: rentDeposit.rent_alert_days_before || 3
    }, language);

    const channels = [];

    // Send LINE
    if (user.line_messaging_token && user.line_notifications) {
      try {
        await base44.functions.invoke('sendLineMessage', {
          userId: user.line_messaging_token,
          flexMessage: flexMessage
        });
        channels.push('LINE');
        console.log('✅ LINE rent reminder sent');
      } catch (err) {
        console.error('❌ LINE failed:', err.message);
      }
    }

    // Send Email
    if (user.email_notifications) {
      const subject = language === 'th' 
        ? '💰 เตือนชำระค่าเช่า - Lease Shield' 
        : '💰 Rent Payment Reminder - Lease Shield';
      
      const body = language === 'th'
        ? `💰 เตือนชำระค่าเช่า\n\n🏠 ทรัพย์สิน: ${rentDeposit.property_address || 'ไม่ระบุ'}\n💵 จำนวน: ฿${rentDeposit.rent_amount.toLocaleString()}\n📅 ครบกำหนด: วันที่ ${rentDeposit.rent_due_day} ของเดือน\n⏰ เหลืออีก ${rentDeposit.rent_alert_days_before || 3} วัน\n\nเปิดแอป → https://app.leaseshield.asia/DepositTracker`
        : `💰 Rent Payment Reminder\n\n🏠 Property: ${rentDeposit.property_address || 'N/A'}\n💵 Amount: ฿${rentDeposit.rent_amount.toLocaleString()}\n📅 Due: Day ${rentDeposit.rent_due_day} of the month\n⏰ ${rentDeposit.rent_alert_days_before || 3} days until due\n\nOpen app → https://app.leaseshield.asia/DepositTracker`;

      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Lease Shield',
          to: user.email,
          subject: subject,
          body: body
        });
        channels.push('Email');
        console.log('✅ Email rent reminder sent');
      } catch (err) {
        console.error('❌ Email failed:', err.message);
      }
    }

    // Log
    for (const channel of channels) {
      await base44.entities.NotificationLog.create({
        user_email: user.email,
        notification_type: 'rent_reminder',
        channel: channel,
        status: 'sent',
        related_entity_type: 'deposit',
        related_entity_id: rentDeposit.id,
        message_preview: `Test rent reminder: ฿${rentDeposit.rent_amount} due day ${rentDeposit.rent_due_day}`
      });
    }

    return Response.json({
      success: true,
      channels: channels,
      deposit: {
        amount: rentDeposit.rent_amount,
        due_day: rentDeposit.rent_due_day,
        property: rentDeposit.property_address,
        alert_days_before: rentDeposit.rent_alert_days_before || 3
      },
      message: 'FORCED rent reminder sent (ignores schedule)'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});