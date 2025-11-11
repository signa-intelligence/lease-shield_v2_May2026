import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Simple notification sender for overdue deposits
 * Called from frontend with deposit details
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deposit } = await req.json();
    
    if (!deposit) {
      return Response.json({ error: 'No deposit data provided' }, { status: 400 });
    }

    const language = user.language || 'en';
    const daysOverdue = deposit.daysOverdue || 0;
    const depositAmount = deposit.deposit_amount || 0;
    const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
    
    const subject = language === 'th' 
      ? '🚨 เงินมัดจำเกินกำหนด - Deposit Shield พร้อมช่วย' 
      : '🚨 Deposit Overdue - Deposit Shield Ready';
    
    // Fixed URL: Use correct Base44 page name format (PascalCase)
    const caseUrl = `https://app.leaseshield.asia/ResolveCase?depositId=${deposit.id}&auto=true`;
    
    const messageText = language === 'th' ?
      `🚨 แจ้งเตือนด่วน Lease Shield\n\n💰 เงินมัดจำเกินกำหนด ${daysOverdue} วัน\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n💵 จำนวน: ฿${depositAmount.toLocaleString()}\n\n🛡️ Deposit Shield พร้อมช่วยคุณ!\n\n📋 คลิกเพื่อเปิดคดีอัตโนมัติ\nข้อมูลเงินมัดจำจะถูกกรอกให้อัตโนมัติ\n\nเปิดแอป → ${caseUrl}` :
      `🚨 Lease Shield Urgent Alert\n\n💰 Deposit ${daysOverdue} days overdue\n\n🏠 Property: ${propertyAddress}\n💵 Amount: ฿${depositAmount.toLocaleString()}\n\n🛡️ Deposit Shield is ready to help!\n\n📋 Click to auto-open case\nDeposit data will be pre-filled\n\nOpen app → ${caseUrl}`;

    const channels = [];
    let anySuccess = false;

    // Send to LINE if enabled
    if (user.line_messaging_token && user.line_notifications) {
      try {
        await base44.functions.invoke('sendLineMessage', {
          userId: user.line_messaging_token,
          message: messageText
        });
        channels.push('LINE');
        anySuccess = true;
        console.log(`✅ LINE sent to ${user.email}`);
      } catch (lineError) {
        console.error(`❌ LINE failed:`, lineError);
      }
    }

    // Send to Email if enabled (independently)
    if (user.email_notifications) {
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Lease Shield',
          to: user.email,
          subject: subject,
          body: messageText
        });
        channels.push('Email');
        anySuccess = true;
        console.log(`✅ Email sent to ${user.email}`);
      } catch (emailError) {
        console.error(`❌ Email failed:`, emailError);
      }
    }

    // Log the notification for each channel
    for (const channel of channels) {
      try {
        await base44.entities.NotificationLog.create({
          user_email: user.email,
          notification_type: 'overdue_deposit',
          channel: channel,
          status: 'sent',
          related_entity_type: 'deposit',
          related_entity_id: deposit.id,
          message_preview: messageText.substring(0, 200)
        });
      } catch (logError) {
        console.error('Failed to log notification:', logError);
      }
    }

    return Response.json({ 
      success: anySuccess,
      channels: channels,
      message: anySuccess 
        ? `Notification sent via ${channels.join(' & ')}` 
        : 'No notification channels enabled'
    });

  } catch (error) {
    console.error('❌ Notification error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});