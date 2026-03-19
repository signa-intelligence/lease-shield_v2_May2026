import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createDepositReminderFlex } from './lineFlexTemplates.js';

/**
 * VERSION 3.0 - MEGA DEBUG MODE
 * Simple notification sender for overdue deposits with Rich Flex Messages
 */

Deno.serve(async (req) => {
  console.log('🚀🚀🚀 VERSION 3.0 - FUNCTION STARTING 🚀🚀🚀');
  
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      console.error('❌ User not authenticated');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('='.repeat(60));
    console.log('OVERDUE NOTIFICATION DEBUG v3.0');
    console.log('='.repeat(60));
    console.log('👤 User:', user.email);
    console.log('🌐 Language:', user.language);
    console.log('📱 LINE enabled:', user.line_notifications);
    console.log('🔑 Has LINE token:', !!user.line_messaging_token);

    const { deposit } = await req.json();
    
    if (!deposit) {
      console.error('❌ No deposit data');
      return Response.json({ error: 'No deposit data' }, { status: 400 });
    }

    console.log('💰 DEPOSIT DATA:');
    console.log(JSON.stringify(deposit, null, 2));

    const language = user.language || 'en';
    const daysOverdue = deposit.daysOverdue || 0;
    const depositAmount = deposit.deposit_amount || 0;
    const propertyAddress = deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A');
    const expectedDate = new Date(deposit.expected_return_date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US');
    
    console.log('📊 COMPUTED VALUES:');
    console.log('- Days overdue:', daysOverdue);
    console.log('- Days param (negated):', -daysOverdue);
    console.log('- Amount:', depositAmount);
    console.log('- Address:', propertyAddress);
    console.log('- Expected date:', expectedDate);
    
    const subject = language === 'th' 
      ? '🚨 เงินมัดจำเกินกำหนด - Deposit Shield พร้อมช่วย' 
      : '🚨 Deposit Overdue - Deposit Shield Ready';
    
    console.log('🎨 CREATING FLEX MESSAGE...');
    console.log('Parameters:', {
      days: -daysOverdue,
      depositAmount,
      propertyAddress,
      expectedDate,
      urgency: 'critical',
      language
    });
    
    const flexMessage = createDepositReminderFlex({
      days: -daysOverdue,
      depositAmount,
      propertyAddress,
      expectedDate: expectedDate,
      urgency: 'critical'
    }, language);
    
    console.log('📦 FLEX MESSAGE CREATED:');
    console.log(JSON.stringify(flexMessage, null, 2));
    console.log('Has altText?', !!flexMessage.altText);
    console.log('Has contents?', !!flexMessage.contents);
    console.log('Contents type:', flexMessage.contents?.type);
    
    const messageText = language === 'th' ?
      `🚨 แจ้งเตือนด่วน Lease Shield\n\n💰 เงินมัดจำเกินกำหนด ${daysOverdue} วัน\n\n🏠 ทรัพย์สิน: ${propertyAddress}\n💵 จำนวน: ฿${depositAmount.toLocaleString()}\n\n🛡️ Deposit Shield พร้อมช่วยคุณ!\n\n📋 เปิดแอปเพื่อดูรายละเอียดและเปิดคดี\n\nเปิดแอป → https://app.leaseshield.asia/DepositTracker` :
      `🚨 Lease Shield Urgent Alert\n\n💰 Deposit ${daysOverdue} days overdue\n\n🏠 Property: ${propertyAddress}\n💵 Amount: ฿${depositAmount.toLocaleString()}\n\n🛡️ Deposit Shield is ready to help!\n\n📋 Open app to view details and open a case\n\nOpen app → https://app.leaseshield.asia/DepositTracker`;

    const channels = [];
    let anySuccess = false;

    if (user.line_messaging_token && user.line_notifications) {
      console.log('📱 ATTEMPTING LINE SEND...');
      console.log('Token (first 15 chars):', user.line_messaging_token.substring(0, 15));
      
      try {
        console.log('🔄 Calling base44.functions.invoke(sendLineMessage)...');
        
        const lineResponse = await base44.functions.invoke('sendLineMessage', {
          userId: user.line_messaging_token,
          flexMessage: flexMessage
        });
        
        console.log('✅ LINE RESPONSE RECEIVED:');
        console.log('Status:', lineResponse.status);
        console.log('Data:', JSON.stringify(lineResponse.data, null, 2));
        
        channels.push('LINE');
        anySuccess = true;
        console.log('✅✅✅ LINE FLEX SENT SUCCESSFULLY ✅✅✅');
      } catch (lineError) {
        console.error('❌❌❌ LINE SEND FAILED ❌❌❌');
        console.error('Error:', lineError.message);
        console.error('Stack:', lineError.stack);
      }
    } else {
      console.log('⚠️ LINE SKIPPED - Not enabled or no token');
    }

    if (user.email_notifications) {
      console.log('📧 Sending email...');
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Lease Shield',
          to: user.email,
          subject: subject,
          body: messageText
        });
        channels.push('Email');
        anySuccess = true;
        console.log('✅ Email sent');
      } catch (emailError) {
        console.error('❌ Email failed:', emailError);
      }
    }

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
        console.log(`📝 Logged ${channel}`);
      } catch (logError) {
        console.error('Log failed:', logError);
      }
    }

    const result = { 
      success: anySuccess,
      channels: channels,
      message: anySuccess 
        ? `Notification sent via ${channels.join(' & ')}` 
        : 'No channels enabled',
      version: '3.0'
    };
    
    console.log('🎯 RESULT:', JSON.stringify(result, null, 2));
    console.log('='.repeat(60));

    return Response.json(result);

  } catch (error) {
    console.error('💥💥💥 FATAL ERROR 💥💥💥');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ 
      success: false,
      error: error.message,
      version: '3.0'
    }, { status: 500 });
  }
});