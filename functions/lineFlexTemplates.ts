/**
 * LINE Flex Message Templates
 * Rich, interactive notification templates for better UX
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
      subtitle: `Your deposit return is ${days > 0 ? `in ${days} days` : 'overdue'}`,
      amount: 'Amount',
      property: 'Property',
      expected: 'Expected Return',
      action: days > 0 ? 'View Tracker' : 'Open Case',
      tip: days === 30 ? 'Keep all receipts ready' : days === 7 ? 'Contact landlord soon' : days <= 3 ? 'Take action now!' : 'Consider legal action'
    },
    th: {
      title: days === 30 ? 'เตือน 30 วันคืนเงินมัดจำ' : days === 7 ? 'แจ้งเตือน 7 วัน' : days === 3 ? 'เร่งด่วน: เหลือ 3 วัน' : 'เงินมัดจำเกินกำหนด',
      subtitle: `เงินมัดจำ${days > 0 ? `ครบกำหนดใน ${days} วัน` : 'เกินกำหนดแล้ว'}`,
      amount: 'จำนวน',
      property: 'ทรัพย์สิน',
      expected: 'กำหนดคืน',
      action: days > 0 ? 'เปิดแอป' : 'เปิดคดี',
      tip: days === 30 ? 'เก็บใบเสร็จไว้' : days === 7 ? 'ติดต่อเจ้าของบ้าน' : days <= 3 ? 'ดำเนินการเลย!' : 'พิจารณาดำเนินคดี'
    }
  };
  
  const str = strings[language];
  
  return {
    altText: str.title,
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
                    size: 'md',
                    color: '#0C3B2E',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm'
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
                    text: propertyAddress || 'N/A',
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end',
                    wrap: true
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
                    text: str.expected,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: expectedDate,
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
                color: '#8B8B8B',
                wrap: true
              }
            ],
            margin: 'lg',
            paddingAll: '12px',
            backgroundColor: '#F7F7F7',
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
              uri: 'https://app.leaseshield.asia/deposit-tracker'
            },
            style: 'primary',
            color: '#0C3B2E',
            height: 'sm'
          }
        ],
        paddingAll: '12px'
      }
    }
  };
};

export const createLeaseNoticeFlex = (data, language = 'en') => {
  const { days, propertyAddress, leaseEndDate, noticeDeadline, noticePeriod } = data;
  
  const urgency = days <= 3 ? 'critical' : days <= 7 ? 'high' : days <= 30 ? 'medium' : 'low';
  const colors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444', 
    critical: '#DC2626'
  };
  
  const color = colors[urgency];
  
  const strings = {
    en: {
      title: days === 30 ? '30-Day Notice Reminder' : days === 7 ? '7-Day Notice Warning' : days === 3 ? 'Urgent: 3 Days Left' : 'Today: Must Notify!',
      subtitle: `${days > 0 ? `${days} days until` : 'TODAY is'} notice deadline`,
      property: 'Property',
      leaseEnds: 'Lease Ends',
      deadline: 'Notice By',
      period: 'Notice Period',
      action: 'View Templates',
      tip: days === 30 ? 'Decide: renew or move out' : days === 7 ? 'Generate notice letter' : days <= 3 ? 'Send letter TODAY' : 'Must notify landlord NOW'
    },
    th: {
      title: days === 30 ? 'เตือน 30 วันแจ้งสัญญา' : days === 7 ? 'แจ้งเตือน 7 วัน' : days === 3 ? 'เร่งด่วน: เหลือ 3 วัน' : 'วันนี้: ต้องแจ้ง!',
      subtitle: `${days > 0 ? `อีก ${days} วัน` : 'วันนี้'}ถึงกำหนดแจ้ง`,
      property: 'ทรัพย์สิน',
      leaseEnds: 'สัญญาสิ้นสุด',
      deadline: 'แจ้งภายใน',
      period: 'ระยะแจ้ง',
      action: 'ดูเทมเพลต',
      tip: days === 30 ? 'ตัดสินใจ: ต่อหรือย้าย' : days === 7 ? 'สร้างจดหมายแจ้ง' : days <= 3 ? 'ส่งจดหมายวันนี้' : 'ต้องแจ้งเจ้าของบ้านเลย'
    }
  };
  
  const str = strings[language];
  
  return {
    altText: str.title,
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
                    text: propertyAddress || 'N/A',
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
                    text: leaseEndDate,
                    size: 'sm',
                    color: '#1A1D1F',
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
                    text: str.deadline,
                    color: '#8B8B8B',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: noticeDeadline,
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
                    text: `${noticePeriod} days`,
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
                color: '#8B8B8B',
                wrap: true
              }
            ],
            margin: 'lg',
            paddingAll: '12px',
            backgroundColor: '#F7F7F7',
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
              uri: 'https://app.leaseshield.asia/templates'
            },
            style: 'primary',
            color: '#0C3B2E',
            height: 'sm'
          }
        ],
        paddingAll: '12px'
      }
    }
  };
};

export const createRentReminderFlex = (data, language = 'en') => {
  const { rentAmount, propertyAddress, dueDay, daysUntilDue } = data;
  
  const strings = {
    en: {
      title: 'Rent Payment Reminder',
      subtitle: `Due in ${daysUntilDue} days`,
      amount: 'Monthly Rent',
      property: 'Property',
      dueDate: 'Due Date',
      action: 'Set Reminder',
      tip: 'Pay on time to maintain good records'
    },
    th: {
      title: 'เตือนชำระค่าเช่า',
      subtitle: `ครบกำหนดใน ${daysUntilDue} วัน`,
      amount: 'ค่าเช่ารายเดือน',
      property: 'ทรัพย์สิน',
      dueDate: 'วันครบกำหนด',
      action: 'ตั้งการแจ้งเตือน',
      tip: 'ชำระตรงเวลาเพื่อรักษาบันทึกที่ดี'
    }
  };
  
  const str = strings[language];
  
  return {
    altText: str.title,
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
                text: '💵',
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
                    size: 'md',
                    color: '#0C3B2E',
                    flex: 2,
                    align: 'end'
                  }
                ],
                spacing: 'sm'
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
                    text: propertyAddress || 'N/A',
                    size: 'sm',
                    color: '#1A1D1F',
                    flex: 2,
                    align: 'end',
                    wrap: true
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
                color: '#8B8B8B',
                wrap: true
              }
            ],
            margin: 'lg',
            paddingAll: '12px',
            backgroundColor: '#FFF7ED',
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
              uri: 'https://app.leaseshield.asia/deposit-tracker'
            },
            style: 'primary',
            color: '#C7A338',
            height: 'sm'
          }
        ],
        paddingAll: '12px'
      }
    }
  };
};

export const createMaintenanceReminderFlex = (data, language = 'en') => {
  const { issueTitle, category, status, daysOpen } = data;
  
  const strings = {
    en: {
      title: 'Maintenance Update',
      subtitle: `${status} - ${daysOpen} days open`,
      issue: 'Issue',
      category: 'Category',
      status: 'Status',
      action: 'View Request',
      tip: 'Keep photo evidence updated'
    },
    th: {
      title: 'อัปเดตการซ่อมบำรุง',
      subtitle: `${status} - เปิดไว้ ${daysOpen} วัน`,
      issue: 'ปัญหา',
      category: 'ประเภท',
      status: 'สถานะ',
      action: 'ดูคำขอ',
      tip: 'เก็บหลักฐานภาพไว้'
    }
  };
  
  const str = strings[language];
  
  return {
    altText: str.title,
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
        backgroundColor: '#3B82F6',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: issueTitle,
            weight: 'bold',
            size: 'md',
            color: '#1A1D1F',
            wrap: true,
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
                text: category,
                size: 'sm',
                color: '#1A1D1F',
                flex: 2,
                align: 'end'
              }
            ],
            spacing: 'sm',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `💡 ${str.tip}`,
                size: 'xs',
                color: '#8B8B8B',
                wrap: true
              }
            ],
            margin: 'lg',
            paddingAll: '12px',
            backgroundColor: '#EFF6FF',
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
              uri: 'https://app.leaseshield.asia/maintenance-tracker'
            },
            style: 'primary',
            color: '#3B82F6',
            height: 'sm'
          }
        ],
        paddingAll: '12px'
      }
    }
  };
};