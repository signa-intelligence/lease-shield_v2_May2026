import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createRentReminderFlex } from './lineFlexTemplates.js';

/**
 * Test rent reminder - sends immediately for testing
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 Testing rent reminder for:', user.email);

    // Find a deposit with rent alerts enabled
    const deposits = await base44.entities.DepositTracker.filter({
      created_by: user.email,
      rent_alerts_enabled: true
    });

    if (deposits.length === 0) {
      return Response.json({
        success: false,
        message: 'No deposits with rent alerts enabled'
      });
    }

    const deposit = deposits[0];
    const language = user.language || 'en';
    
    console.log('📦 Using deposit:', deposit.id);
    console.log('💰 Rent amount:', deposit.rent_amount);
    console.log('📅 Due day:', deposit.rent_due_day);

    // Create Flex message
    const flexMessage = createRentReminderFlex({
      rentAmount: deposit.rent_amount,
      propertyAddress: deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
      dueDay: deposit.rent_due_day,
      daysUntilDue: deposit.rent_alert_days_before || 3
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
        console.log('✅ LINE sent');
      } catch (err) {
        console.error('❌ LINE failed:', err);
      }
    }

    // Send Email
    if (user.email_notifications) {
      const subject = language === 'th' 
        ? '💰 เตือนชำระค่าเช่า' 
        : '💰 Rent Payment Reminder';
      
      const body = language === 'th'
        ? `💰 เตือนชำระค่าเช่า\n\n🏠 ทรัพย์สิน: ${deposit.property_address}\n💵 จำนวน: ฿${deposit.rent_amount.toLocaleString()}\n📅 ครบกำหนด: วันที่ ${deposit.rent_due_day} ของเดือน\n\nเปิดแอป → https://app.leaseshield.asia/DepositTracker`
        : `💰 Rent Payment Reminder\n\n🏠 Property: ${deposit.property_address}\n💵 Amount: ฿${deposit.rent_amount.toLocaleString()}\n📅 Due: ${deposit.rent_due_day} of the month\n\nOpen app → https://app.leaseshield.asia/DepositTracker`;

      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Lease Shield',
          to: user.email,
          subject: subject,
          body: body
        });
        channels.push('Email');
        console.log('✅ Email sent');
      } catch (err) {
        console.error('❌ Email failed:', err);
      }
    }

    // Log
    for (const channel of channels) {
      await base44.entities.NotificationLog.create({
        user_email: user.email,
        notification_type: 'test',
        channel: channel,
        status: 'sent',
        related_entity_type: 'deposit',
        related_entity_id: deposit.id,
        message_preview: 'Test rent reminder'
      });
    }

    return Response.json({
      success: true,
      channels: channels,
      deposit: {
        amount: deposit.rent_amount,
        due_day: deposit.rent_due_day,
        property: deposit.property_address
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});