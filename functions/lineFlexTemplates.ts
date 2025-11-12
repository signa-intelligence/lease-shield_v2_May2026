
/**
 * LINE Flex Message Templates for LeaseShield
 * Beautiful, interactive notification cards with proper branding
 */

export const createDepositReminderFlex = (data, language = 'en') => {
  const { days, depositAmount, propertyAddress, expectedDate, urgency } = data;
  
  const colors = {
    low: '#10B981',
    medium: '#F59E0B', 
    high: '#EF4444',
    critical: '#DC2626'
  };
  
  const color = colors[urgency] || '#3B82F6';
  
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
  
  return {
    altText: `🛡️ ${str.title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🛡️',
                size: 'xl',
                weight: 'bold'
              },
              {
                type: 'text',
                text: str.title,
                weight: 'bold',
                size: 'lg',
                color: '#FFFFFF',
                flex: 1,
                margin: 'md'
              }
            ]
          },
          {
            type: 'text',
            text: str.subtitle,
            color: '#FFFFFF',
            size: 'sm',
            margin: 'sm'
          }
        ],
        backgroundColor: color,
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.amount,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: `฿${depositAmount?.toLocaleString() || '0'}`,
                    weight: 'bold',
                    size: 'lg',
                    color: '#0C3B2E',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm'
              },
              {
                type: 'separator',
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.property,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: propertyAddress || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end',
                    wrap: true
                  }
                ],
                spacing: 'sm',
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.expected,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: expectedDate || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm',
                margin: 'md'
              }
            ],
            margin: 'lg',
            spacing: 'sm'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `💡 ${str.tip}`,
                size: 'xs',
                color: '#6B7280',
                wrap: true
              }
            ],
            margin: 'xl',
            paddingAll: '12px',
            backgroundColor: '#F9FAFB',
            cornerRadius: 'md'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: str.action,
              uri: 'https://app.leaseshield.asia/DepositTracker'
            },
            style: 'primary',
            color: '#0C3B2E',
            height: 'sm'
          }
        ],
        paddingAll: '12px'
      },
      styles: {
        footer: {
          separator: false
        }
      }
    }
  };
};

export const createLeaseNoticeFlex = (data, language = 'en') => {
  const { days, propertyAddress, leaseEndDate, noticeDeadline, noticePeriod } = data;
  
  const urgency = days === 0 ? 'critical' : days <= 3 ? 'critical' : days <= 7 ? 'high' : days <= 30 ? 'medium' : 'low';
  const colors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444', 
    critical: '#DC2626'
  };
  
  const color = colors[urgency];
  
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
  
  return {
    altText: `📅 ${str.title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '📅',
                size: 'xl',
                weight: 'bold'
              },
              {
                type: 'text',
                text: str.title,
                weight: 'bold',
                size: 'lg',
                color: '#FFFFFF',
                flex: 1,
                margin: 'md'
              }
            ]
          },
          {
            type: 'text',
            text: str.subtitle,
            color: '#FFFFFF',
            size: 'sm',
            margin: 'sm'
          }
        ],
        backgroundColor: color,
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.property,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: propertyAddress || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end',
                    wrap: true
                  }
                ],
                spacing: 'sm'
              },
              {
                type: 'separator',
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.leaseEnds,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: leaseEndDate || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm',
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.deadline,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: noticeDeadline || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
                    weight: 'bold',
                    size: 'sm',
                    color: color,
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm',
                margin: 'md'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.period,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: `${noticePeriod || 30} ${language === 'th' ? 'วัน' : 'days'}`,
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm',
                margin: 'md'
              }
            ],
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `💡 ${str.tip}`,
                size: 'xs',
                color: '#6B7280',
                wrap: true
              }
            ],
            margin: 'xl',
            paddingAll: '12px',
            backgroundColor: '#FEF3C7',
            cornerRadius: 'md'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: str.action,
              uri: 'https://app.leaseshield.asia/Templates'
            },
            style: 'primary',
            color: '#0C3B2E',
            height: 'sm'
          }
        ],
        paddingAll: '12px'
      },
      styles: {
        footer: {
          separator: false
        }
      }
    }
  };
};

export const createRentReminderFlex = (data, language = 'en') => {
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
  
  return {
    altText: `💰 ${str.title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '💰',
                size: 'xl',
                weight: 'bold'
              },
              {
                type: 'text',
                text: str.title,
                weight: 'bold',
                size: 'lg',
                color: '#FFFFFF',
                flex: 1,
                margin: 'md'
              }
            ]
          },
          {
            type: 'text',
            text: str.subtitle,
            color: '#FFFFFF',
            size: 'sm',
            margin: 'sm'
          }
        ],
        backgroundColor: '#C7A338',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.amount,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: `฿${rentAmount?.toLocaleString() || '0'}`,
                    weight: 'bold',
                    size: 'lg',
                    color: '#C7A338',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm'
              },
              {
                type: 'separator',
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.property,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: propertyAddress || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end',
                    wrap: true
                  }
                ],
                spacing: 'sm',
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.dueDate,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: `${dueDay}${language === 'en' ? (dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th') : ''} ${language === 'en' ? 'of month' : 'ของเดือน'}`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#C7A338',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm',
                margin: 'md'
              }
            ],
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `💡 ${str.tip}`,
                size: 'xs',
                color: '#6B7280',
                wrap: true
              }
            ],
            margin: 'xl',
            paddingAll: '12px',
            backgroundColor: '#FEF3C7',
            cornerRadius: 'md'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: str.action,
              uri: 'https://app.leaseshield.asia/DepositTracker'
            },
            style: 'primary',
            color: '#C7A338',
            height: 'sm'
          }
        ],
        paddingAll: '12px'
      },
      styles: {
        footer: {
          separator: false
        }
      }
    }
  };
};

export const createMaintenanceRequestFlex = (data, language = 'en') => {
  const { issueTitle, description, category, priority, propertyAddress, reportedDate, photoCount, tenantName, role } = data;
  
  const priorityColors = {
    urgent: '#DC2626',
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#3B82F6'
  };
  
  const color = priorityColors[priority] || '#F59E0B';
  
  const strings = {
    en: {
      title: role === 'landlord' ? '🔧 Maintenance Request' : '🔧 Maintenance Request', // Titles are currently the same for landlord/tenant, but allows for future differentiation
      subtitle: role === 'landlord' ? `From your tenant` : 'New request submitted',
      issue: 'Issue',
      category: 'Category',
      priority: 'Priority',
      property: 'Property',
      reported: 'Reported',
      tenant: 'Tenant',
      photos: 'Photos attached',
      action: role === 'landlord' ? 'View & Respond' : 'View Request',
      tip: priority === 'urgent' ? 'Urgent - Please respond ASAP' : priority === 'high' ? 'High priority - respond soon' : 'Please review and respond'
    },
    th: {
      title: role === 'landlord' ? '🔧 แจ้งซ่อม' : '🔧 แจ้งซ่อม', // Titles are currently the same for landlord/tenant, but allows for future differentiation
      subtitle: role === 'landlord' ? `จากผู้เช่าของคุณ` : 'ส่งคำขอใหม่แล้ว',
      issue: 'ปัญหา',
      category: 'ประเภท',
      priority: 'ความสำคัญ',
      property: 'ทรัพย์สิน',
      reported: 'รายงานเมื่อ',
      tenant: 'ผู้เช่า',
      photos: 'มีรูปภาพ',
      action: role === 'landlord' ? 'ดูและตอบกลับ' : 'ดูคำขอ',
      tip: priority === 'urgent' ? 'เร่งด่วน - กรุณาตอบกลับด่วน' : priority === 'high' ? 'ความสำคัญสูง - ตอบกลับเร็วๆ นี้' : 'กรุณาตรวจสอบและตอบกลับ'
    }
  };
  
  const str = strings[language];
  
  return {
    altText: `🔧 ${issueTitle}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🔧',
                size: 'xl',
                weight: 'bold'
              },
              {
                type: 'text',
                text: str.title,
                weight: 'bold',
                size: 'lg',
                color: '#FFFFFF',
                flex: 1,
                margin: 'md'
              }
            ]
          },
          {
            type: 'text',
            text: str.subtitle,
            color: '#FFFFFF',
            size: 'sm',
            margin: 'sm'
          }
        ],
        backgroundColor: color,
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.issue,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: issueTitle,
                    weight: 'bold',
                    size: 'md',
                    color: '#0C3B2E',
                    flex: 3,
                    align: 'end',
                    wrap: true
                  }
                ],
                spacing: 'sm'
              },
              {
                type: 'separator',
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.category,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: category || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm',
                margin: 'lg'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.priority,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: priority.toUpperCase(),
                    size: 'sm',
                    color: color,
                    weight: 'bold',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm',
                margin: 'md'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.tenant,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: tenantName || (language === 'th' ? 'ไม่ระบุ' : 'N/A'),
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm',
                margin: 'md'
              },
              ...(propertyAddress ? [{
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: str.property,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: propertyAddress,
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end',
                    wrap: true
                  }
                ],
                spacing: 'sm',
                margin: 'md'
              }] : []),
              ...(photoCount > 0 ? [{
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '📸',
                    size: 'sm',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: `${photoCount} ${str.photos}`,
                    size: 'sm',
                    color: '#6366F1',
                    weight: 'bold',
                    flex: 1,
                    margin: 'sm'
                  }
                ],
                margin: 'lg'
              }] : [])
            ],
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: description.length > 100 ? description.substring(0, 100) + '...' : description,
                size: 'xs',
                color: '#6B7280',
                wrap: true
              }
            ],
            margin: 'xl',
            paddingAll: '12px',
            backgroundColor: '#F9FAFB',
            cornerRadius: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `💡 ${str.tip}`,
                size: 'xs',
                color: '#DC2626',
                wrap: true,
                weight: 'bold'
              }
            ],
            margin: 'md',
            paddingAll: '12px',
            backgroundColor: priority === 'urgent' || priority === 'high' ? '#FEE2E2' : '#FEF3C7',
            cornerRadius: 'md'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: str.action,
              uri: `https://app.leaseshield.asia/acknowledge?token=${data.token}&role=${role}`
            },
            style: 'primary',
            color: '#0C3B2E',
            height: 'sm'
          }
        ],
        paddingAll: '12px'
      },
      styles: {
        footer: {
          separator: false
        }
      }
    }
  };
};
