import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createDepositReminderFlex } from './lineFlexTemplates.js';

/**
 * Simple notification sender for overdue deposits with Rich Flex Messages
 * Called from frontend with deposit details
 * 
 * ENHANCED DEBUG VERSION - Shows exactly what's being created and sent
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      console.error('❌ User not authenticated');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 User:', user.email, 'Language:', user.language);

    const { deposit } = await req.json();
    
    if (!deposit) {
      console.error('❌ No deposit data provided');
      return Response.json({ error: 'No deposit data provided' }, { status: 400 });
    }

    console.log('💰 Deposit data:', JSON.stringify(deposit, null, 2));

    const language = user.language || 'en';
    const daysOverdue = deposit.daysOverdue || 0;
    const depositAmount = deposit.deposit_amount || 0;
    const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
    const expectedDate = new Date(deposit.expected_return_date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US');
    
    const subject = language === 'th' 
      ? '🚨 เงินมัดจำเกินกำหนด - Deposit Shield พร้อมช่วย' 
      : '🚨 Deposit Overdue - Deposit Shield Ready';
    
    console.log('📋 Creating Flex message with params:', {
      days: -daysOverdue,
      depositAmount,
      propertyAddress,
      expectedDate,
      urgency: 'critical',
      language
    });
    
    // Create Rich Flex Message
    const flexMessage = createDepositReminderFlex({
      days: -daysOverdue,
      depositAmount,
      propertyAddress,
      expectedDate: expectedDate,
      urgency: 'critical'
    }, language);
    
    console.log('📦 Flex message created:', JSON.stringify(flexMessage, null, 2));
    
    // Fallback plain text for email
    const messageText = language === 'th' ?
      `🚨 แจ้งเตือนด่วน Lease Shield\n\n💰 เงินมัดจำเกินกำหนด ${daysOverdue} วัน\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n💵 จำนวน: ฿${depositAmount.toLocaleString()}\n\n🛡️ Deposit Shield พร้อมช่วยคุณ!\n\n📋 เปิดแอปเพื่อดูรายละเอียดและเปิดคดี\n\nเปิดแอป → https://app.leaseshield.asia/DepositTracker` :
      `🚨 Lease Shield Urgent Alert\n\n💰 Deposit ${daysOverdue} days overdue\n\n🏠 Property: ${propertyAddress}\n💵 Amount: ฿${depositAmount.toLocaleString()}\n\n🛡️ Deposit Shield is ready to help!\n\n📋 Open app to view details and open a case\n\nOpen app → https://app.leaseshield.asia/DepositTracker`;

    const channels = [];
    let anySuccess = false;

    // Send to LINE with Flex Message if enabled
    if (user.line_messaging_token && user.line_notifications) {
      console.log('📱 LINE notifications enabled for user');
      console.log('📤 Sending Flex message to LINE...');
      console.log('🔑 LINE token:', user.line_messaging_token.substring(0, 10) + '...');
      
      try {
        const lineResponse = await base44.functions.invoke('sendLineMessage', {
          userId: user.line_messaging_token,
          flexMessage: flexMessage
        });
        
        console.log('✅ LINE response:', JSON.stringify(lineResponse.data, null, 2));
        
        channels.push('LINE');
        anySuccess = true;
        console.log(`✅ LINE Flex sent to ${user.email}`);
      } catch (lineError) {
        console.error(`❌ LINE failed:`, lineError);
        console.error('LINE error details:', lineError.message);
      }
    } else {
      console.log('⚠️ LINE notifications NOT enabled:', {
        hasToken: !!user.line_messaging_token,
        notificationsEnabled: user.line_notifications
      });
    }

    // Send to Email if enabled (independently)
    if (user.email_notifications) {
      console.log('📧 Email notifications enabled for user');
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
        console.log(`📝 Logged ${channel} notification`);
      } catch (logError) {
        console.error('Failed to log notification:', logError);
      }
    }

    const result = { 
      success: anySuccess,
      channels: channels,
      message: anySuccess 
        ? `Notification sent via ${channels.join(' & ')}` 
        : 'No notification channels enabled'
    };
    
    console.log('🎯 Final result:', JSON.stringify(result, null, 2));

    return Response.json(result);

  } catch (error) {
    console.error('❌ Notification error:', error);
    console.error('Stack:', error.stack);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});