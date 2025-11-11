import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Test notification sender for admin testing
 * Sends a test notification to a specific user
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Only admins can test notifications
    const currentUser = await base44.auth.me();
    if (!currentUser || (currentUser.role !== 'admin' && !['admin', 'super_admin'].includes(currentUser.access_level))) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userEmail, notificationType } = await req.json();
    
    if (!userEmail || !notificationType) {
      return Response.json({ error: 'Missing userEmail or notificationType' }, { status: 400 });
    }

    // Get user
    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const language = user.language || 'en';
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 30);

    // Generate test message based on type
    let messageText = '';
    let subject = '';

    switch (notificationType) {
      case 'deposit_30d':
        subject = language === 'th' ? 'ทดสอบ: อีก 30 วันถึงกำหนดคืนเงินมัดจำ' : 'Test: Deposit due back in 30 days';
        messageText = language === 'th' ?
          `🔔 [ทดสอบ] แจ้งเตือน Lease Shield\n\nถึงกำหนดคืนเงินมัดจำในอีก 30 วัน\n\n💰 จำนวน: ฿15,000\n🏠 ทรัพย์สิน: คอนโด ABC ห้อง 101\n📅 กำหนดคืน: ${futureDate.toLocaleDateString('th-TH')}\n\n💡 แนะนำ: แนบใบเสร็จและรูปภาพใน Evidence Vault ของคุณ\n\nเปิดแอป → leaseshield.asia` :
          `🔔 [Test] Lease Shield Reminder\n\nYour deposit is due back in 30 days\n\n💰 Amount: ฿15,000\n🏠 Property: ABC Condo Room 101\n📅 Expected: ${futureDate.toLocaleDateString('en-US')}\n\n💡 Tip: Keep receipts and photos in your Evidence Vault\n\nOpen app → leaseshield.asia`;
        break;

      case 'deposit_7d':
        subject = language === 'th' ? 'ทดสอบ: อีก 7 วันครบกำหนดคืนเงินมัดจำ' : 'Test: 7 days until deposit return';
        messageText = language === 'th' ?
          `⚠️ [ทดสอบ] แจ้งเตือนสุดท้าย Lease Shield\n\nอีก 7 วันครบกำหนดคืนเงินมัดจำ\n\n💰 จำนวน: ฿15,000\n🏠 ทรัพย์สิน: คอนโด ABC ห้อง 101\n📅 กำหนดคืน: ${futureDate.toLocaleDateString('th-TH')}\n\n📝 หากยังไม่ได้รับเงิน สามารถสร้างจดหมายร้องขอได้ทันที\n\nเปิดแอป → leaseshield.asia` :
          `⚠️ [Test] Lease Shield Final Reminder\n\n7 days until deposit return\n\n💰 Amount: ฿15,000\n🏠 Property: ABC Condo Room 101\n📅 Expected: ${futureDate.toLocaleDateString('en-US')}\n\n📝 Generate a Deposit Return Request letter if needed\n\nOpen app → leaseshield.asia`;
        break;

      case 'deposit_3d':
        subject = language === 'th' ? 'ทดสอบ: อีก 3 วันครบกำหนดคืนเงินมัดจำ' : 'Test: 3 days until deposit return';
        messageText = language === 'th' ?
          `🚨 [ทดสอบ] เตือนเร่งด่วน Lease Shield\n\nอีก 3 วันครบกำหนดคืนเงินมัดจำ!\n\n💰 จำนวน: ฿15,000\n🏠 ทรัพย์สิน: คอนโด ABC ห้อง 101\n📅 กำหนดคืน: ${futureDate.toLocaleDateString('th-TH')}\n\n⚠️ หากยังไม่ติดต่อเจ้าของบ้าน กรุณาดำเนินการทันที\n\nเปิดแอป → leaseshield.asia` :
          `🚨 [Test] Lease Shield Urgent\n\nOnly 3 days until deposit return!\n\n💰 Amount: ฿15,000\n🏠 Property: ABC Condo Room 101\n📅 Expected: ${futureDate.toLocaleDateString('en-US')}\n\n⚠️ Contact landlord if you haven't already\n\nOpen app → leaseshield.asia`;
        break;

      case 'deposit_overdue':
        subject = language === 'th' ? 'ทดสอบ: ยังไม่ได้รับเงินมัดจำคืน' : 'Test: Deposit Not Returned';
        messageText = language === 'th' ?
          `🚨 [ทดสอบ] แจ้งเตือนด่วน Lease Shield\n\nยังไม่ได้รับเงินมัดจำคืน\n\n💰 จำนวน: ฿15,000\n🏠 ทรัพย์สิน: คอนโด ABC ห้อง 101\n⏰ เกินกำหนด: 5 วัน\n\n📋 แนะนำให้ดำเนินการ:\n1. สร้างจดหมายเตือนคืนเงินมัดจำ\n2. ส่งทางไปรษณีย์ลงทะเบียน\n3. พิจารณาเปิดคดี Resolve\n\nเปิดแอป → leaseshield.asia` :
          `🚨 [Test] Lease Shield Urgent Alert\n\nDeposit not returned\n\n💰 Amount: ฿15,000\n🏠 Property: ABC Condo Room 101\n⏰ Overdue: 5 days\n\n📋 Recommended Actions:\n1. Generate Late Return Reminder letter\n2. Send via registered mail\n3. Consider opening a Resolve case\n\nOpen app → leaseshield.asia`;
        break;

      case 'lease_30d':
        subject = language === 'th' ? 'ทดสอบ: อีก 30 วันถึงกำหนดแจ้งสัญญา' : 'Test: 30 days until lease notice';
        messageText = language === 'th' ?
          `📅 [ทดสอบ] เตือนสัญญาเช่า Lease Shield\n\nอีก 30 วันถึงกำหนดแจ้งต่อหรือยกเลิกสัญญา\n\n🏠 ทรัพย์สิน: คอนโด ABC ห้อง 101\n📆 สัญญาสิ้นสุด: ${futureDate.toLocaleDateString('th-TH')}\n⏰ ต้องแจ้งภายใน: ${futureDate.toLocaleDateString('th-TH')}\n📝 ระยะแจ้ง: 30 วันก่อนหมดสัญญา\n\n💡 ตัดสินใจว่าจะต่อสัญญาหรือยกเลิก และแจ้งเจ้าของบ้านให้ทันเวลา\n\nเปิดแอป → leaseshield.asia` :
          `📅 [Test] Lease Shield Notice Reminder\n\n30 days until lease notice deadline\n\n🏠 Property: ABC Condo Room 101\n📆 Lease ends: ${futureDate.toLocaleDateString('en-US')}\n⏰ Must notify by: ${futureDate.toLocaleDateString('en-US')}\n📝 Notice period: 30 days before end\n\n💡 Decide if you'll renew or terminate, and notify landlord on time\n\nOpen app → leaseshield.asia`;
        break;

      case 'lease_7d':
      case 'lease_3d':
        const days = notificationType === 'lease_7d' ? 7 : 3;
        subject = language === 'th' ? `ทดสอบ: เหลือ ${days} วันต้องแจ้งสัญญา` : `Test: ${days} days to notify`;
        messageText = language === 'th' ?
          `⚠️ [ทดสอบ] แจ้งเตือนด่วน Lease Shield\n\nเหลือ ${days} วันต้องแจ้งเจ้าของบ้าน!\n\n🏠 ทรัพย์สิน: คอนโด ABC ห้อง 101\n📆 สัญญาสิ้นสุด: ${futureDate.toLocaleDateString('th-TH')}\n🚨 ต้องแจ้งภายใน: ${futureDate.toLocaleDateString('th-TH')}\n\n📝 ดำเนินการ:\n1. ตัดสินใจต่อหรือยกเลิก\n2. สร้างจดหมายแจ้งในส่วน Templates\n3. ส่งให้เจ้าของบ้านโดยด่วน\n\nเปิดแอป → leaseshield.asia` :
          `⚠️ [Test] Lease Shield Urgent Reminder\n\n${days} days left to notify landlord!\n\n🏠 Property: ABC Condo Room 101\n📆 Lease ends: ${futureDate.toLocaleDateString('en-US')}\n🚨 Must notify by: ${futureDate.toLocaleDateString('en-US')}\n\n📝 Action Required:\n1. Decide: renew or terminate\n2. Generate notice letter in Templates\n3. Send to landlord urgently\n\nOpen app → leaseshield.asia`;
        break;

      case 'rent_reminder':
        subject = language === 'th' ? 'ทดสอบ: เตือนชำระค่าเช่า' : 'Test: Rent Payment Reminder';
        messageText = language === 'th' ?
          `💰 [ทดสอบ] แจ้งเตือนค่าเช่า Lease Shield\n\nค่าเช่าครบกำหนดในอีก 3 วัน\n\n🏠 ทรัพย์สิน: คอนโด ABC ห้อง 101\n💵 จำนวน: ฿12,000\n📅 วันที่ครบกำหนด: 5 ของเดือน\n\n💡 เตรียมชำระเงินให้ทันเวลา เพื่อไม่ให้เกิดปัญหา\n\nเปิดแอป → leaseshield.asia` :
          `💰 [Test] Lease Shield Rent Reminder\n\nRent due in 3 days\n\n🏠 Property: ABC Condo Room 101\n💵 Amount: ฿12,000\n📅 Due date: 5th of month\n\n💡 Pay on time to avoid issues\n\nOpen app → leaseshield.asia`;
        break;

      default:
        return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Try to send via LINE first, then email
    let channel = '';
    let success = false;

    if (user.line_messaging_token && user.line_notifications) {
      try {
        await base44.asServiceRole.functions.invoke('sendLineMessage', {
          userId: user.line_messaging_token,
          message: messageText
        });
        channel = 'LINE';
        success = true;
        console.log(`✅ Test LINE message sent to ${user.email}`);
      } catch (lineError) {
        console.error(`❌ LINE send failed for ${user.email}:`, lineError);
        // Fall through to email
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
        console.error(`❌ Email send failed for ${user.email}:`, emailError);
        throw new Error('Both LINE and Email delivery failed');
      }
    }

    if (!success) {
      throw new Error('User has no notification channels enabled');
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