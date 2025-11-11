/**
 * Beautiful HTML Email Templates for LeaseShield
 * Responsive, branded, and bilingual
 */

const COLORS = {
  forest: '#0C3B2E',
  forestLight: '#047857',
  gold: '#C7A338',
  goldLight: '#D4B451',
  white: '#FFFFFF',
  offWhite: '#ECEFED',
  lightGray: '#F3F4F6',
  text: '#1A1D1F',
  textLight: '#64748b',
  green: '#10B981',
  blue: '#3B82F6',
  red: '#EF4444',
  orange: '#F59E0B'
};

// Base email wrapper
const emailWrapper = (content, language = 'en') => {
  const footer = language === 'th'
    ? 'ส่งจาก Lease Shield - www.leaseshield.asia'
    : 'Sent from Lease Shield - www.leaseshield.asia';
  
  return `
<!DOCTYPE html>
<html lang="${language === 'th' ? 'th' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Lease Shield Notification</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB; padding: 20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: ${COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${content}
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; background-color: ${COLORS.offWhite};">
              <p style="margin: 0; font-size: 12px; color: ${COLORS.textLight};">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Header component
const emailHeader = (icon, title, subtitle, color = COLORS.forest) => `
<tr>
  <td style="padding: 30px; background: linear-gradient(135deg, ${color} 0%, ${COLORS.forestLight} 100%);">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center">
          <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
          <h1 style="margin: 0 0 8px 0; color: ${COLORS.white}; font-size: 24px; font-weight: 700; text-align: center;">${title}</h1>
          <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; text-align: center;">${subtitle}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
`;

// Info row component
const infoRow = (label, value, icon = null) => `
<tr>
  <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.lightGray};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="width: 40%; color: ${COLORS.textLight}; font-size: 14px; font-weight: 600;">
          ${icon ? `<span style="margin-right: 8px;">${icon}</span>` : ''}${label}
        </td>
        <td style="width: 60%; color: ${COLORS.text}; font-size: 14px; font-weight: 700; text-align: right;">
          ${value}
        </td>
      </tr>
    </table>
  </td>
</tr>
`;

// Tip box component
const tipBox = (text, bgColor = '#F0FDF4', textColor = '#047857') => `
<tr>
  <td style="padding: 16px; background-color: ${bgColor}; border-radius: 8px; border-left: 4px solid ${textColor};">
    <p style="margin: 0; font-size: 13px; color: ${textColor}; font-weight: 600;">
      💡 ${text}
    </p>
  </td>
</tr>
`;

// Button component
const button = (text, url, color = COLORS.forest) => `
<tr>
  <td align="center" style="padding: 20px 0;">
    <a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: ${color}; color: ${COLORS.white}; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      ${text}
    </a>
  </td>
</tr>
`;

// ========================================
// DEPOSIT REMINDER TEMPLATE
// ========================================
export const createDepositReminderEmail = (data, language = 'en') => {
  const { days, depositAmount, propertyAddress, expectedDate, urgency } = data;
  
  const urgencyColors = {
    low: COLORS.green,
    medium: COLORS.orange,
    high: COLORS.red,
    critical: COLORS.red
  };
  
  const color = urgencyColors[urgency] || COLORS.blue;
  
  const strings = {
    en: {
      title: days === 30 ? '30-Day Deposit Reminder' : days === 7 ? '7-Day Warning' : days === 3 ? 'Urgent: 3 Days Left' : 'Deposit Overdue',
      subtitle: days > 0 ? `Deposit due in ${days} days` : `${Math.abs(days)} days overdue`,
      amount: 'Amount',
      property: 'Property',
      expected: days > 0 ? 'Expected Return' : 'Was Due',
      action: days > 0 ? 'Open Tracker' : 'View Details',
      tip: days === 30 ? 'Keep all receipts ready' : days === 7 ? 'Contact landlord soon' : days === 3 ? 'Take action now!' : 'Consider opening a case'
    },
    th: {
      title: days === 30 ? 'เตือน 30 วันคืนเงินมัดจำ' : days === 7 ? 'แจ้งเตือน 7 วัน' : days === 3 ? 'เร่งด่วน: เหลือ 3 วัน' : 'เงินมัดจำเกินกำหนด',
      subtitle: days > 0 ? `ครบกำหนดใน ${days} วัน` : `เกินกำหนด ${Math.abs(days)} วัน`,
      amount: 'จำนวน',
      property: 'ทรัพย์สิน',
      expected: days > 0 ? 'กำหนดคืน' : 'ควรคืนวันที่',
      action: days > 0 ? 'เปิดแอป' : 'ดูรายละเอียด',
      tip: days === 30 ? 'เก็บใบเสร็จไว้' : days === 7 ? 'ติดต่อเจ้าของบ้าน' : days === 3 ? 'ดำเนินการเลย!' : 'พิจารณาเปิดคดี'
    }
  };
  
  const str = strings[language];
  
  const content = `
    ${emailHeader('🛡️', str.title, str.subtitle, color)}
    <tr>
      <td style="padding: 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${infoRow(str.amount, `฿${depositAmount?.toLocaleString() || '0'}`, '💰')}
          ${infoRow(str.property, propertyAddress || (language === 'th' ? 'ไม่ระบุ' : 'N/A'), '🏠')}
          ${infoRow(str.expected, expectedDate, '📅')}
          <tr><td style="height: 20px;"></td></tr>
          ${tipBox(str.tip, urgency === 'critical' ? '#FEF2F2' : '#F0FDF4', urgency === 'critical' ? COLORS.red : COLORS.green)}
        </table>
      </td>
    </tr>
    ${button(str.action, 'https://app.leaseshield.asia/PropertyTracker', color)}
  `;
  
  return emailWrapper(content, language);
};

// ========================================
// LEASE NOTICE REMINDER TEMPLATE
// ========================================
export const createLeaseNoticeEmail = (data, language = 'en') => {
  const { days, propertyAddress, leaseEndDate, noticeDeadline, noticePeriod } = data;
  
  const urgency = days === 0 ? 'critical' : days <= 3 ? 'critical' : days <= 7 ? 'high' : 'medium';
  const urgencyColors = {
    medium: COLORS.green,
    high: COLORS.orange,
    critical: COLORS.red
  };
  
  const color = urgencyColors[urgency];
  
  const strings = {
    en: {
      title: days === 0 ? 'TODAY: Must Notify!' : days === 3 ? '3 Days to Notify' : days === 7 ? '7-Day Notice Warning' : '30-Day Notice Reminder',
      subtitle: days === 0 ? 'Deadline is TODAY' : `${days} days until deadline`,
      property: 'Property',
      leaseEnds: 'Lease Ends',
      deadline: 'Notify By',
      period: 'Notice Period',
      action: days === 0 ? 'Act Now!' : 'View Templates',
      tip: days === 0 ? 'Send letter TODAY!' : days <= 3 ? 'Generate notice now' : days <= 7 ? 'Prepare notice letter' : 'Decide: renew or move'
    },
    th: {
      title: days === 0 ? 'วันนี้: ต้องแจ้ง!' : days === 3 ? 'เหลือ 3 วัน' : days === 7 ? 'เตือน 7 วัน' : 'เตือน 30 วันแจ้งสัญญา',
      subtitle: days === 0 ? 'วันนี้คือกำหนด' : `อีก ${days} วันถึงกำหนด`,
      property: 'ทรัพย์สิน',
      leaseEnds: 'สัญญาสิ้นสุด',
      deadline: 'แจ้งภายใน',
      period: 'ระยะแจ้ง',
      action: days === 0 ? 'ดำเนินการเลย!' : 'ดูเทมเพลต',
      tip: days === 0 ? 'ส่งจดหมายวันนี้!' : days <= 3 ? 'สร้างจดหมายเลย' : days <= 7 ? 'เตรียมจดหมาย' : 'ตัดสินใจ: ต่อหรือย้าย'
    }
  };
  
  const str = strings[language];
  
  const content = `
    ${emailHeader('📅', str.title, str.subtitle, color)}
    <tr>
      <td style="padding: 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${infoRow(str.property, propertyAddress || (language === 'th' ? 'ไม่ระบุ' : 'N/A'), '🏠')}
          ${infoRow(str.leaseEnds, leaseEndDate, '📆')}
          ${infoRow(str.deadline, noticeDeadline, '⏰')}
          ${infoRow(str.period, `${noticePeriod} ${language === 'th' ? 'วัน' : 'days'}`, '📋')}
          <tr><td style="height: 20px;"></td></tr>
          ${tipBox(str.tip, days === 0 ? '#FEF2F2' : '#FFFBEB', days === 0 ? COLORS.red : COLORS.orange)}
        </table>
      </td>
    </tr>
    ${button(str.action, 'https://app.leaseshield.asia/Templates', color)}
  `;
  
  return emailWrapper(content, language);
};

// ========================================
// RENT REMINDER TEMPLATE
// ========================================
export const createRentReminderEmail = (data, language = 'en') => {
  const { rentAmount, propertyAddress, dueDay, daysUntilDue } = data;
  
  const strings = {
    en: {
      title: 'Rent Payment Due',
      subtitle: `Due in ${daysUntilDue} days`,
      amount: 'Monthly Rent',
      property: 'Property',
      dueDate: 'Due Date',
      action: 'View Tracker',
      tip: 'Pay on time to maintain good records'
    },
    th: {
      title: 'ครบกำหนดชำระค่าเช่า',
      subtitle: `ครบกำหนดใน ${daysUntilDue} วัน`,
      amount: 'ค่าเช่ารายเดือน',
      property: 'ทรัพย์สิน',
      dueDate: 'วันครบกำหนด',
      action: 'เปิดแอป',
      tip: 'ชำระตรงเวลาเพื่อรักษาบันทึกที่ดี'
    }
  };
  
  const str = strings[language];
  
  const content = `
    ${emailHeader('💰', str.title, str.subtitle, COLORS.gold)}
    <tr>
      <td style="padding: 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${infoRow(str.amount, `฿${rentAmount?.toLocaleString() || '0'}`, '💵')}
          ${infoRow(str.property, propertyAddress || (language === 'th' ? 'ไม่ระบุ' : 'N/A'), '🏠')}
          ${infoRow(str.dueDate, `${language === 'en' ? 'Day' : 'วันที่'} ${dueDay}`, '📅')}
          <tr><td style="height: 20px;"></td></tr>
          ${tipBox(str.tip, '#FFFBEB', COLORS.gold)}
        </table>
      </td>
    </tr>
    ${button(str.action, 'https://app.leaseshield.asia/PropertyTracker', COLORS.gold)}
  `;
  
  return emailWrapper(content, language);
};

// ========================================
// MAINTENANCE NOTIFICATION TEMPLATE
// ========================================
export const createMaintenanceEmail = (data, language = 'en') => {
  const { issueTitle, status, propertyAddress, landlordResponse, actualCost } = data;
  
  const statusColors = {
    reported: COLORS.blue,
    acknowledged: COLORS.orange,
    in_progress: '#8B5CF6',
    completed: COLORS.green,
    rejected: COLORS.red
  };
  
  const color = statusColors[status] || COLORS.blue;
  
  const statusLabels = {
    en: {
      reported: 'Reported',
      acknowledged: 'Acknowledged',
      in_progress: 'In Progress',
      completed: 'Completed',
      rejected: 'Rejected'
    },
    th: {
      reported: 'รายงานแล้ว',
      acknowledged: 'รับทราบแล้ว',
      in_progress: 'กำลังดำเนินการ',
      completed: 'เสร็จสิ้น',
      rejected: 'ถูกปฏิเสธ'
    }
  };
  
  const strings = {
    en: {
      title: 'Maintenance Update',
      subtitle: 'Status changed',
      issue: 'Issue',
      property: 'Property',
      newStatus: 'New Status',
      cost: 'Cost',
      response: 'Response',
      action: 'View Details'
    },
    th: {
      title: 'อัปเดตการซ่อมบำรุง',
      subtitle: 'เปลี่ยนสถานะแล้ว',
      issue: 'ปัญหา',
      property: 'ทรัพย์สิน',
      newStatus: 'สถานะใหม่',
      cost: 'ค่าใช้จ่าย',
      response: 'ข้อความ',
      action: 'ดูรายละเอียด'
    }
  };
  
  const str = strings[language];
  const statusLabel = statusLabels[language][status] || status;
  
  let responseRow = '';
  if (landlordResponse) {
    responseRow = `
    <tr>
      <td style="padding: 16px; background-color: ${COLORS.lightGray}; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: ${COLORS.textLight}; font-weight: 600;">💬 ${str.response}:</p>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text};">${landlordResponse}</p>
      </td>
    </tr>
    `;
  }
  
  const content = `
    ${emailHeader('🔧', str.title, str.subtitle, color)}
    <tr>
      <td style="padding: 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${infoRow(str.issue, issueTitle, '🔧')}
          ${infoRow(str.property, propertyAddress || (language === 'th' ? 'ไม่ระบุ' : 'N/A'), '🏠')}
          ${infoRow(str.newStatus, statusLabel, '📊')}
          ${actualCost ? infoRow(str.cost, `฿${parseFloat(actualCost).toLocaleString()}`, '💵') : ''}
          <tr><td style="height: 16px;"></td></tr>
          ${responseRow}
        </table>
      </td>
    </tr>
    ${button(str.action, 'https://app.leaseshield.asia/PropertyTracker', color)}
  `;
  
  return emailWrapper(content, language);
};