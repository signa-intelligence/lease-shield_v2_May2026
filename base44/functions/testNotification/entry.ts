import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createDepositReminderFlex, createLeaseNoticeFlex, createRentReminderFlex } from './lineFlexTemplates.js';

/**
 * Test notification sender for admin testing
 * Sends rich LINE Flex Messages or email fallback
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const currentUser = await base44.auth.me();
    if (!currentUser || (currentUser.role !== 'admin' && !['admin', 'super_admin'].includes(currentUser.access_level))) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userEmail, notificationType } = await req.json();
    
    if (!userEmail || !notificationType) {
      return Response.json({ error: 'Missing userEmail or notificationType' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const language = user.language || 'en';
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 30);

    let messageText = '';
    let subject = '';
    let flexMessage = null;

    switch (notificationType) {
      case 'deposit_30d':
        subject = language === 'th' ? 'ทดสอบ: อีก 30 วันถึงกำหนดคืนเงินมัดจำ' : 'Test: Deposit due in 30 days';
        flexMessage = createDepositReminderFlex({
          days: 30,
          depositAmount: 15000,
          propertyAddress: language === 'th' ? 'คอนโด ABC ห้อง 101' : 'ABC Condo Room 101',
          expectedDate: futureDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US'),
          urgency: 'medium'
        }, language);
        
        messageText = language === 'th' ?
          `🔔 [ทดสอบ] แจ้งเตือน Lease Shield\n\nถึงกำหนดคืนเงินมัดจำในอีก 30 วัน\n\n💰 จำนวน: ฿15,000\n🏠 ทรัพย์สิน: คอนโด ABC ห้อง 101\n📅 กำหนดคืน: ${futureDate.toLocaleDateString('th-TH')}\n\nเปิดแอป → app.leaseshield.asia` :
          `🔔 [Test] Lease Shield Reminder\n\nDeposit due in 30 days\n\n💰 Amount: ฿15,000\n🏠 Property: ABC Condo Room 101\n📅 Expected: ${futureDate.toLocaleDateString('en-US')}\n\nOpen app → app.leaseshield.asia`;
        break;

      case 'deposit_7d':
        subject = language === 'th' ? 'ทดสอบ: อีก 7 วันครบกำหนด' : 'Test: 7 days until return';
        flexMessage = createDepositReminderFlex({
          days: 7,
          depositAmount: 15000,
          propertyAddress: language === 'th' ? 'คอนโด ABC ห้อง 101' : 'ABC Condo Room 101',
          expectedDate: futureDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US'),
          urgency: 'high'
        }, language);
        
        messageText = language === 'th' ?
          `⚠️ [ทดสอบ] Lease Shield\n\nอีก 7 วัน\n\n💰 ฿15,000\n🏠 คอนโด ABC\n\nเปิดแอป → app.leaseshield.asia` :
          `⚠️ [Test] Lease Shield\n\n7 days\n\n💰 ฿15,000\n🏠 ABC Condo\n\nOpen app → app.leaseshield.asia`;
        break;

      case 'deposit_3d':
        subject = language === 'th' ? 'ทดสอบ: อีก 3 วัน!' : 'Test: 3 days!';
        flexMessage = createDepositReminderFlex({
          days: 3,
          depositAmount: 15000,
          propertyAddress: language === 'th' ? 'คอนโด ABC ห้อง 101' : 'ABC Condo Room 101',
          expectedDate: futureDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US'),
          urgency: 'critical'
        }, language);
        
        messageText = language === 'th' ?
          `🚨 [ทดสอบ] เร่งด่วน!\n\nอีก 3 วัน!\n\n💰 ฿15,000\n\nเปิดแอป → app.leaseshield.asia` :
          `🚨 [Test] Urgent!\n\n3 days!\n\n💰 ฿15,000\n\nOpen app → app.leaseshield.asia`;
        break;

      case 'deposit_overdue':
        subject = language === 'th' ? 'ทดสอบ: เกินกำหนด' : 'Test: Overdue';
        flexMessage = createDepositReminderFlex({
          days: -5,
          depositAmount: 15000,
          propertyAddress: language === 'th' ? 'คอนโด ABC ห้อง 101' : 'ABC Condo Room 101',
          expectedDate: futureDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US'),
          urgency: 'critical'
        }, language);
        
        messageText = language === 'th' ?
          `🚨 [ทดสอบ] เกินกำหนด 5 วัน\n\n💰 ฿15,000\n\nพิจารณาเปิดคดี` :
          `🚨 [Test] 5 days overdue\n\n💰 ฿15,000\n\nConsider opening case`;
        break;

      case 'lease_30d':
      case 'lease_7d':
      case 'lease_3d':
        const days = notificationType === 'lease_30d' ? 30 : notificationType === 'lease_7d' ? 7 : 3;
        subject = language === 'th' ? `ทดสอบ: เหลือ ${days} วัน` : `Test: ${days} days`;
        
        flexMessage = createLeaseNoticeFlex({
          days,
          propertyAddress: language === 'th' ? 'คอนโด ABC ห้อง 101' : 'ABC Condo Room 101',
          leaseEndDate: futureDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US'),
          noticeDeadline: futureDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US'),
          noticePeriod: 30
        }, language);
        
        messageText = language === 'th' ?
          `📅 [ทดสอบ] เหลือ ${days} วัน\n\nต้องแจ้งสัญญา\n\nเปิดแอป → app.leaseshield.asia` :
          `📅 [Test] ${days} days\n\nNotify landlord\n\nOpen app → app.leaseshield.asia`;
        break;

      case 'rent_reminder':
        subject = language === 'th' ? 'ทดสอบ: เตือนค่าเช่า' : 'Test: Rent reminder';
        flexMessage = createRentReminderFlex({
          rentAmount: 12000,
          propertyAddress: language === 'th' ? 'คอนโด ABC ห้อง 101' : 'ABC Condo Room 101',
          dueDay: 5,
          daysUntilDue: 3
        }, language);
        
        messageText = language === 'th' ?
          `💰 [ทดสอบ] เตือนค่าเช่า\n\nครบกำหนดใน 3 วัน\n\n฿12,000\n\nเปิดแอป → app.leaseshield.asia` :
          `💰 [Test] Rent reminder\n\nDue in 3 days\n\n฿12,000\n\nOpen app → app.leaseshield.asia`;
        break;

      default:
        return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    let channel = '';
    let success = false;

    if (user.line_messaging_token && user.line_notifications && flexMessage) {
      try {
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
          userId: user.line_messaging_token,
          flexMessage: flexMessage
        });
        channel = 'LINE';
        success = true;
        console.log(`✅ Test LINE Flex sent to ${user.email}`);
      } catch (lineError) {
        console.error(`❌ LINE failed:`, lineError);
      }
    }

    if (!success && user.email_notifications) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Lease Shield',
          to: user.email,
          subject: subject,
          body: messageText
        });
        channel = 'Email';
        success = true;
        console.log(`✅ Test email sent to ${user.email}`);
      } catch (emailError) {
        console.error(`❌ Email failed:`, emailError);
        throw new Error('Both LINE and Email failed');
      }
    }

    if (!success) {
      throw new Error('No notification channels enabled');
    }

    return Response.json({ 
      success: true,
      channel: channel,
      userEmail: user.email,
      notificationType: notificationType,
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});