
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Test LINE notifications - Admin only
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { notificationType } = await req.json();

    // Check if LINE token is set in environment
    const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (!channelAccessToken) {
      return Response.json({ 
        error: 'LINE_CHANNEL_ACCESS_TOKEN not set in Base44 secrets.\n\n' +
               'Go to: Base44 Dashboard → Settings → Secrets\n' +
               'Add: LINE_CHANNEL_ACCESS_TOKEN with your token from LINE Developers Console' 
      }, { status: 500 });
    }

    // Check if user has connected LINE
    if (!user.line_messaging_token) {
      return Response.json({ 
        error: '❌ LINE Not Connected\n\n' +
               '📱 To connect LINE:\n\n' +
               '1. Open LINE app\n' +
               '2. Add @leaseshield as friend (scan QR code from LINE Developers Console)\n' +
               '3. Send message: connect ' + user.email + '\n' +
               '4. Wait for confirmation\n' +
               '5. Try test notification again\n\n' +
               '⚠️ You must complete step 3 (send "connect ' + user.email + '") for this to work!'
      }, { status: 400 });
    }

    const language = user.language || 'en';
    let messageText = '';

    // Sample data for notifications
    const sampleDeposit = {
      amount: 45000,
      property: 'Unit 123, Sample Condo, Sukhumvit',
      expectedDate: '5 Aug 2025'
    };

    const sampleRent = {
      amount: 15000,
      dueDate: '1 Nov 2025',
      daysUntil: 3
    };

    const sampleLease = {
      property: 'Unit 123, Sample Condo, Sukhumvit',
      endDate: '31 Dec 2025',
      noticeDeadline: '1 Nov 2025',
      noticePeriodDays: 60
    };

    switch (notificationType) {
      case 'first_add':
        // Message sent when user first adds @leaseshield bot (before account connection)
        messageText = `🎉 Welcome to Lease Shield / ยินดีต้อนรับสู่ Lease Shield!

✅ Prevent rental problems before they happen
✅ ป้องกันปัญหาการเช่าก่อนที่จะเกิดขึ้น

📱 What we offer / บริการของเรา:
• Lease analysis / วิเคราะห์สัญญาเช่า
• Deposit protection & reminders / ปกป้องเงินมัดจำและแจ้งเตือน
• Maintenance tracker / ติดตามการซ่อมบำรุง
• Evidence vault / ที่เก็บหลักฐาน

🔗 Sign up at app.leaseshield.asia
ลงทะเบียนที่ app.leaseshield.asia
or visit our website www.leaseshield.asia
หรือเยี่ยมชมเว็บไซต์ของเรา www.leaseshield.asia

💡 Type "help" anytime for commands
   พิมพ์ "help" เพื่อดูคำสั่ง`;
        break;

      case '30day':
        messageText = language === 'th' ?
          `🔔 แจ้งเตือน Lease Shield\n\nถึงกำหนดคืนเงินมัดจำในอีก 30 วัน\n\n` +
          `💰 จำนวน: ฿${sampleDeposit.amount.toLocaleString()}\n` +
          `🏠 ทรัพย์สิน: ${sampleDeposit.property}\n` +
          `📅 กำหนดคืน: ${sampleDeposit.expectedDate}\n\n` +
          `💡 แนะนำ: แนบใบเสร็จและรูปภาพใน Evidence Vault ของคุณ` :
          
          `🔔 Lease Shield Reminder\n\nYour deposit is due back in 30 days\n\n` +
          `💰 Amount: ฿${sampleDeposit.amount.toLocaleString()}\n` +
          `🏠 Property: ${sampleDeposit.property}\n` +
          `📅 Expected: ${sampleDeposit.expectedDate}\n\n` +
          `💡 Tip: Keep receipts and photos in your Evidence Vault`;
        break;

      case '7day':
        messageText = language === 'th' ?
          `⚠️ แจ้งเตือนสุดท้าย Lease Shield\n\nอีก 7 วันครบกำหนดคืนเงินมัดจำ\n\n` +
          `💰 จำนวน: ฿${sampleDeposit.amount.toLocaleString()}\n` +
          `🏠 ทรัพย์สิน: ${sampleDeposit.property}\n` +
          `📅 กำหนดคืน: ${sampleDeposit.expectedDate}\n\n` +
          `📝 หากยังไม่ได้รับเงิน สามารถสร้างจดหมายร้องขอได้ทันที` :
          
          `⚠️ Lease Shield Final Reminder\n\n7 days until deposit return deadline\n\n` +
          `💰 Amount: ฿${sampleDeposit.amount.toLocaleString()}\n` +
          `🏠 Property: ${sampleDeposit.property}\n` +
          `📅 Expected: ${sampleDeposit.expectedDate}\n\n` +
          `📝 Generate a Deposit Return Request letter if needed`;
        break;

      case 'overdue':
        messageText = language === 'th' ?
          `🚨 แจ้งเตือนด่วน Lease Shield\n\nยังไม่ได้รับเงินมัดจำคืน\n\n` +
          `💰 จำนวน: ฿${sampleDeposit.amount.toLocaleString()}\n` +
          `🏠 ทรัพย์สิน: ${sampleDeposit.property}\n` +
          `⏰ เกินกำหนด: 1 วัน\n\n` +
          `📋 แนะนำให้ดำเนินการ:\n` +
          `1. สร้างจดหมายเตือนคืนเงินมัดจำ\n` +
          `2. ส่งทางไปรษณีย์ลงทะเบียน\n` +
          `3. พิจารณาเปิดคดี Resolve` :
          
          `🚨 Lease Shield Urgent Alert\n\nDeposit not returned\n\n` +
          `💰 Amount: ฿${sampleDeposit.amount.toLocaleString()}\n` +
          `🏠 Property: ${sampleDeposit.property}\n` +
          `⏰ Overdue: 1 day\n\n` +
          `📋 Recommended Actions:\n` +
          `1. Generate Late Return Reminder letter\n` +
          `2. Send via registered mail\n` +
          `3. Consider opening a Resolve case`;
        break;

      case 'rent':
        messageText = language === 'th' ?
          `💰 เตือนชำระค่าเช่า Lease Shield\n\nค่าเช่าครบกำหนดในอีก ${sampleRent.daysUntil} วัน\n\n` +
          `💵 จำนวน: ฿${sampleRent.amount.toLocaleString()}\n` +
          `📅 ครบกำหนด: ${sampleRent.dueDate}\n` +
          `🏠 ทรัพย์สิน: ${sampleDeposit.property}\n\n` +
          `💡 เตรียมชำระเงินให้พร้อมเพื่อหลีกเลี่ยงค่าปรับ` :
          
          `💰 Lease Shield Rent Reminder\n\nRent due in ${sampleRent.daysUntil} days\n\n` +
          `💵 Amount: ฿${sampleRent.amount.toLocaleString()}\n` +
          `📅 Due Date: ${sampleRent.dueDate}\n` +
          `🏠 Property: ${sampleDeposit.property}\n\n` +
          `💡 Prepare payment to avoid late fees`;
        break;

      case 'notice_30d':
        messageText = language === 'th' ?
          `📅 เตือนสัญญาเช่า Lease Shield\n\nอีก 30 วันถึงกำหนดแจ้งต่อหรือยกเลิกสัญญา\n\n` +
          `🏠 ทรัพย์สิน: ${sampleLease.property}\n` +
          `📆 สัญญาสิ้นสุด: ${sampleLease.endDate}\n` +
          `⏰ ต้องแจ้งภายใน: ${sampleLease.noticeDeadline}\n` +
          `📝 ระยะแจ้ง: ${sampleLease.noticePeriodDays} วันก่อนหมดสัญญา\n\n` +
          `💡 ตัดสินใจว่าจะต่อสัญญาหรือยกเลิก และแจ้งเจ้าของบ้านให้ทันเวลา\n\n` +
          `✅ แจ้งเจ้าของบ้านเรียบร้อยแล้ว? ส่ง "stop" เพื่อหยุดการแจ้งเตือน` :
          
          `📅 Lease Shield Notice Reminder\n\n30 days until lease notice deadline\n\n` +
          `🏠 Property: ${sampleLease.property}\n` +
          `📆 Lease ends: ${sampleLease.endDate}\n` +
          `⏰ Must notify by: ${sampleLease.noticeDeadline}\n` +
          `📝 Notice period: ${sampleLease.noticePeriodDays} days before end\n\n` +
          `💡 Decide if you'll renew or terminate, and notify landlord on time\n\n` +
          `✅ Already notified landlord? Send "stop" to disable reminders`;
        break;

      case 'notice_7d':
        messageText = language === 'th' ?
          `⚠️ แจ้งเตือนด่วน Lease Shield\n\nเหลือ 7 วันต้องแจ้งเจ้าของบ้าน!\n\n` +
          `🏠 ทรัพย์สิน: ${sampleLease.property}\n` +
          `📆 สัญญาสิ้นสุด: ${sampleLease.endDate}\n` +
          `🚨 ต้องแจ้งภายใน: ${sampleLease.noticeDeadline}\n\n` +
          `📝 ดำเนินการ:\n` +
          `1. ตัดสินใจต่อหรือยกเลิก\n` +
          `2. สร้างจดหมายแจ้งในส่วน Templates\n` +
          `3. ส่งให้เจ้าของบ้านโดยด่วน\n\n` +
          `✅ แจ้งเรียบร้อยแล้ว? ส่ง "stop"` :
          
          `⚠️ Lease Shield Urgent Reminder\n\n7 days left to notify landlord!\n\n` +
          `🏠 Property: ${sampleLease.property}\n` +
          `📆 Lease ends: ${sampleLease.endDate}\n` +
          `🚨 Must notify by: ${sampleLease.noticeDeadline}\n\n` +
          `📝 Action Required:\n` +
          `1. Decide: renew or terminate\n` +
          `2. Generate notice letter in Templates\n` +
          `3. Send to landlord urgently\n\n` +
          `✅ Already notified? Send "stop"`;
        break;

      case 'notice_3d':
        messageText = language === 'th' ?
          `🚨 คำเตือนสุดท้าย Lease Shield\n\nเหลือเพียง 3 วัน!\n\n` +
          `🏠 ทรัพย์สิน: ${sampleLease.property}\n` +
          `📆 สัญญาสิ้นสุด: ${sampleLease.endDate}\n` +
          `🔴 ต้องแจ้งภายใน: ${sampleLease.noticeDeadline}\n\n` +
          `⚠️ หากไม่แจ้ง สัญญาอาจต่ออัตโนมัติหรือไม่สามารถต่อได้\n\n` +
          `แจ้งเจ้าของบ้านทันที!\n\n` +
          `✅ แจ้งแล้ว? ส่ง "stop"` :
          
          `🚨 Lease Shield Final Warning\n\nOnly 3 days left!\n\n` +
          `🏠 Property: ${sampleLease.property}\n` +
          `📆 Lease ends: ${sampleLease.endDate}\n` +
          `🔴 Must notify by: ${sampleLease.noticeDeadline}\n\n` +
          `⚠️ If you don't notify, lease may auto-renew or you can't extend\n\n` +
          `Contact landlord immediately!\n\n` +
          `✅ Notified? Send "stop"`;
        break;

      case 'notice_today':
        messageText = language === 'th' ?
          `🔴 วันนี้คือกำหนด! Lease Shield\n\nต้องแจ้งเจ้าของบ้าน วันนี้!\n\n` +
          `🏠 ทรัพย์สิน: ${sampleLease.property}\n` +
          `📆 สัญญาสิ้นสุด: ${sampleLease.endDate}\n` +
          `🔴 กำหนดแจ้ง: วันนี้\n\n` +
          `แจ้งเจ้าของบ้านทันที หรืออาจพลาดสิทธิ์!\n\n` +
          `✅ แจ้งแล้ว? ส่ง "stop"` :
          
          `🔴 Deadline Today! Lease Shield\n\nMust notify landlord TODAY!\n\n` +
          `🏠 Property: ${sampleLease.property}\n` +
          `📆 Lease ends: ${sampleLease.endDate}\n` +
          `🔴 Notice deadline: TODAY\n\n` +
          `Contact landlord immediately or risk losing your rights!\n\n` +
          `✅ Notified? Send "stop"`;
        break;

      case 'welcome':
        messageText = language === 'th' ?
          `🎉 ยินดีต้อนรับสู่ Lease Shield!\n\n` +
          `✅ บัญชี LINE ของคุณเชื่อมต่อสำเร็จแล้ว\n\n` +
          `คุณจะได้รับการแจ้งเตือนสำหรับ:\n` +
          `📅 เงินมัดจำครบกำหนด\n` +
          `💰 การชำระค่าเช่า\n` +
          `🔧 สถานะการซ่อมบำรุง\n` +
          `📋 การอัปเดตคดี\n\n` +
          `📱 บันทึกแอปลงหน้าจอหลัก:\n` +
          `1. เปิด app.leaseshield.asia\n` +
          `2. iPhone: แตะ Share → Add to Home Screen\n` +
          `3. Android: แตะ Menu (⋮) → Install app\n\n` +
          `🚀 เริ่มใช้งานเลย: app.leaseshield.asia` :
          
          `🎉 Welcome to Lease Shield!\n\n` +
          `✅ Your LINE account is now connected\n\n` +
          `You'll receive notifications for:\n` +
          `📅 Deposit return deadlines\n` +
          `💰 Rent payment reminders\n` +
          `🔧 Maintenance updates\n` +
          `📋 Case status changes\n\n` +
          `📱 Save app to home screen:\n` +
          `1. Open app.leaseshield.asia\n` +
          `2. iPhone: Tap Share → Add to Home Screen\n` +
          `3. Android: Tap Menu (⋮) → Install app\n\n` +
          `🚀 Get started: app.leaseshield.asia`;
        break;

      default:
        return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Send via LINE API directly
    console.log('Sending to LINE user:', user.line_messaging_token);
    
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        to: user.line_messaging_token,
        messages: [{
          type: 'text',
          text: messageText
        }]
      })
    });

    const responseText = await response.text();
    console.log('LINE API response status:', response.status);
    console.log('LINE API response body:', responseText);

    if (!response.ok) {
      // Parse error details
      let errorDetail = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetail = errorJson.message || responseText;
      } catch (e) {
        // Keep raw text if not JSON
      }

      if (response.status === 400) {
        return Response.json({ 
          error: '❌ LINE Connection Invalid\n\n' +
                 'Your LINE connection is not working. This usually means:\n\n' +
                 '1. You haven\'t added @leaseshield as a friend on LINE\n' +
                 '2. You haven\'t sent the "connect" command yet\n' +
                 '3. Your LINE account was disconnected\n\n' +
                 '📱 To fix:\n' +
                 '1. Open LINE app\n' +
                 '2. Search and add @leaseshield\n' +
                 '3. Send: connect ' + user.email + '\n' +
                 '4. Wait for confirmation message\n' +
                 '5. Try again\n\n' +
                 'LINE Error: ' + errorDetail
        }, { status: 400 });
      }
      
      if (response.status === 401 || response.status === 403) {
        return Response.json({ 
          error: '🔑 LINE Token Invalid\n\nYour LINE_CHANNEL_ACCESS_TOKEN is wrong or expired.\n\n' +
                 'Get a new token from LINE Developers Console and update it in Base44 secrets.'
        }, { status: 500 });
      }
      
      return Response.json({ 
        error: `LINE API error (${response.status}): ${errorDetail}` 
      }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      type: notificationType,
      message: 'Test notification sent successfully! Check your LINE app.'
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
