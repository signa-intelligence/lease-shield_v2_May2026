
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, FileText, Globe, Mail, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function PrivacyPolicy() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#f8f8f8', // Using a light gray for light mode background
    cardBg: '#FFFFFF',
    textPrimary: '#0C3B2E', // Darker text for light mode
    textSecondary: '#6B7280', // Slightly lighter secondary text
    borderColor: '#E5E7EB' // Light border for light mode
  };

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: January 2025",
      sections: [
        {
          icon: FileText,
          title: "1. Information We Collect",
          content: `We collect the following information to provide our lease analysis services:

• Personal Information: Name, email address, phone number, and country
• Lease Documents: PDF files and images of rental agreements you upload
• Deposit Information: Security deposit amounts, dates, and property addresses
• Supporting Documents: Receipts, photos, videos, and correspondence related to your rental
• Account Data: Subscription status, plan tier, and payment information
• Usage Data: How you interact with our services

All data collection is limited to what is necessary to provide our services to you.`
        },
        {
          icon: Lock,
          title: "2. How We Use Your Information",
          content: `Your information is used exclusively for:

• AI-Powered Lease Analysis: Analyzing your lease agreements for risks and unfair clauses
• Deposit Tracking: Monitoring security deposit return dates and sending reminders
• Document Storage: Maintaining your rental documentation in a secure vault
• Communication: Sending notifications, reminders, and service updates
• Service Improvement: Understanding usage patterns to enhance our platform
• Legal Compliance: Meeting our obligations under Thai law and PDPA

We do NOT sell your personal information or lease documents to third parties.`
        },
        {
          icon: Shield,
          title: "3. Data Storage & Security",
          content: `Your data security is our top priority:

• Encryption: All files are encrypted at rest and in transit using industry-standard protocols
• Secure Infrastructure: Data stored on Base44/Supabase cloud infrastructure (AWS Singapore region)
• Access Controls: Only you can access your lease documents and personal data
• Authentication: Multi-layer authentication protects your account
• Regular Backups: Automatic backups ensure your data is never lost
• ISO 27001 Compliant: Our infrastructure meets international security standards

We implement technical and organizational measures to protect against unauthorized access, alteration, disclosure, or destruction of your data.`
        },
        {
          icon: Globe,
          title: "4. Data Sharing & Third Parties",
          content: `We work with trusted service providers:

• Base44/Supabase: Cloud storage and database infrastructure (Data Processor)
• Stripe: Payment processing for subscriptions (PCI-DSS compliant)
• LINE Messaging API: Optional notifications (only if you enable)
• OpenAI: AI analysis of lease documents (anonymized, no personal identifiers sent)

All third parties are contractually bound to protect your data and use it only for specified purposes.

We may disclose information if required by law, court order, or to protect our legal rights.`
        },
        {
          icon: FileText,
          title: "5. Your Rights Under PDPA",
          content: `As a data subject in Thailand, you have the right to:

• Access: Request a copy of all personal data we hold about you
• Rectification: Correct inaccurate or incomplete information
• Erasure: Request deletion of your data (right to be forgotten)
• Restriction: Limit how we process your data
• Portability: Receive your data in a machine-readable format
• Object: Opt-out of certain data processing activities
• Withdraw Consent: Revoke consent at any time

To exercise these rights, contact us at privacy@leaseshield.asia or use the "Export My Data" feature in your Account settings.`
        },
        {
          icon: AlertCircle,
          title: "6. Data Retention",
          content: `We retain your information for:

• Active Accounts: As long as your account remains active
• Lease Documents: Until you delete them or close your account
• Transaction Records: 7 years (as required by Thai tax law)
• Marketing Data: Until you unsubscribe

After account closure, we securely delete your data within 30 days, except where we must retain it for legal compliance.`
        },
        {
          icon: Mail,
          title: "7. Cookies & Tracking",
          content: `We use essential cookies to:

• Maintain your login session
• Remember your language preference
• Ensure proper website functionality

We do NOT use third-party advertising cookies or sell your browsing data.`
        },
        {
          icon: Shield,
          title: "8. International Data Transfers",
          content: `Your data is primarily stored in Singapore (AWS Asia-Pacific region). If we transfer data outside Thailand, we ensure:

• Adequate protection mechanisms are in place
• Transfers comply with PDPA requirements
• Standard contractual clauses are used where necessary`
        },
        {
          icon: FileText,
          title: "9. Changes to This Policy",
          content: `We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of significant changes via:

• Email notification to your registered address
• In-app notification banner
• Updated "Last Modified" date at the top of this page

Continued use of our services after changes constitutes acceptance of the updated policy.`
        },
        {
          icon: Mail,
          title: "10. Contact Us",
          content: `For privacy-related questions or to exercise your rights:

• Email: privacy@leaseshield.asia
• Data Protection Officer: dpo@leaseshield.asia
• Address: Lease Shield, Bangkok, Thailand

We will respond to all requests within 30 days as required by PDPA.`
        }
      ]
    },
    th: {
      title: "นโยบายความเป็นส่วนตัว",
      lastUpdated: "อัปเดตล่าสุด: มกราคม 2568",
      sections: [
        {
          icon: FileText,
          title: "1. ข้อมูลที่เรารวบรวม",
          content: `เรารวบรวมข้อมูลต่อไปนี้เพื่อให้บริการวิเคราะห์สัญญาเช่า:

• ข้อมูลส่วนบุคคล: ชื่อ อีเมล เบอร์โทรศัพท์ และประเทศ
• เอกสารสัญญาเช่า: ไฟล์ PDF และรูปภาพของสัญญาเช่าที่คุณอัปโหลด
• ข้อมูลเงินมัดจำ: จำนวนเงินมัดจำ วันที่ และที่อยู่ทรัพย์สิน
• เอกสารสนับสนุน: ใบเสร็จ รูปภาพ วิดีโอ และจดหมายที่เกี่ยวข้องกับการเช่า
• ข้อมูลบัญชี: สถานะการสมัครสมาชิก แผน และข้อมูลการชำระเงิน
• ข้อมูลการใช้งาน: วิธีที่คุณใช้บริการของเรา

การรวบรวมข้อมูลจำกัดเฉพาะสิ่งที่จำเป็นในการให้บริการแก่คุณ`
        },
        {
          icon: Lock,
          title: "2. วิธีที่เราใช้ข้อมูลของคุณ",
          content: `ข้อมูลของคุณใช้เฉพาะสำหรับ:

• การวิเคราะห์สัญญาด้วย AI: วิเคราะห์สัญญาเช่าของคุณเพื่อหาความเสี่ยงและข้อกำหนดที่ไม่เป็นธรรม
• การติดตามเงินมัดจำ: ตรวจสอบวันที่คืนเงินมัดจำและส่งการแจ้งเตือน
• การจัดเก็บเอกสาร: เก็บรักษาเอกสารการเช่าของคุณในตู้นิรภัย
• การสื่อสาร: ส่งการแจ้งเตือน การเตือนความจำ และการอัปเดตบริการ
• การปรับปรุงบริการ: ทำความเข้าใจรูปแบบการใช้งานเพื่อพัฒนาแพลตฟอร์ม
• การปฏิบัติตามกฎหมาย: ปฏิบัติตามพ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล

เราไม่ขายข้อมูลส่วนบุคคลหรือสัญญาเช่าของคุณให้บุคคลที่สาม`
        },
        {
          icon: Shield,
          title: "3. การจัดเก็บและความปลอดภัยของข้อมูล",
          content: `ความปลอดภัยของข้อมูลคือสิ่งสำคัญที่สุดของเรา:

• การเข้ารหัส: ไฟล์ทั้งหมดเข้ารหัสทั้งขณะจัดเก็บและส่งผ่าน
• โครงสร้างที่ปลอดภัย: ข้อมูลจัดเก็บบน Base44/Supabase (AWS สิงคโปร์)
• การควบคุมการเข้าถึง: เฉพาะคุณเท่านั้นที่เข้าถึงเอกสารและข้อมูลของคุณได้
• การยืนยันตัวตน: การยืนยันตัวตนหลายชั้นป้องกันบัญชีของคุณ
• การสำรองข้อมูล: สำรองข้อมูลอัตโนมัติเพื่อไม่ให้ข้อมูลสูญหาย
• มาตรฐาน ISO 27001: โครงสร้างของเราตรงตามมาตรฐานความปลอดภัยระดับสากล

เราใช้มาตรการทางเทคนิคและองค์กรเพื่อป้องกันการเข้าถึง การแก้ไข การเปิดเผย หรือการทำลายข้อมูลโดยไม่ได้รับอนุญาต`
        },
        {
          icon: Globe,
          title: "4. การแบ่งปันข้อมูลและบุคคลที่สาม",
          content: `เราทำงานร่วมกับผู้ให้บริการที่เชื่อถือได้:

• Base44/Supabase: โครงสร้างคลาวด์และฐานข้อมูล (ผู้ประมวลผลข้อมูล)
• Stripe: การประมวลผลการชำระเงิน (ปฏิบัติตาม PCI-DSS)
• LINE Messaging API: การแจ้งเตือนแบบเลือกใช้
• OpenAI: การวิเคราะห์สัญญาด้วย AI (ไม่มีข้อมูลระบุตัวตน)

บุคคลที่สามทั้งหมดมีข้อผูกพันตามสัญญาในการปกป้องข้อมูลของคุณ

เราอาจเปิดเผยข้อมูลหากกฎหมายกำหนด คำสั่งศาล หรือเพื่อปกป้องสิทธิ์ทางกฎหมายของเรา`
        },
        {
          icon: FileText,
          title: "5. สิทธิของคุณภายใต้ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล",
          content: `ในฐานะเจ้าของข้อมูลในประเทศไทย คุณมีสิทธิ์:

• เข้าถึง: ขอสำเนาข้อมูลส่วนบุคคลทั้งหมดที่เราเก็บรักษา
• แก้ไข: แก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่สมบูรณ์
• ลบ: ขอให้ลบข้อมูลของคุณ (สิทธิที่จะถูกลืม)
• จำกัด: จำกัดวิธีที่เราประมวลผลข้อมูลของคุณ
• โอนย้าย: รับข้อมูลของคุณในรูปแบบที่อ่านด้วยเครื่องได้
• คัดค้าน: ปฏิเสธกิจกรรมการประมวลผลข้อมูลบางอย่าง
• ถอนความยินยอม: เพิกถอนความยินยอมได้ตลอดเวลา

ติดต่อ privacy@leaseshield.asia หรือใช้ฟีเจอร์ "ส่งออกข้อมูล" ในการตั้งค่าบัญชีของคุณ`
        },
        {
          icon: AlertCircle,
          title: "6. การเก็บรักษาข้อมูล",
          content: `เราเก็บรักษาข้อมูลของคุณสำหรับ:

• บัญชีที่ใช้งาน: ตราบใดที่บัญชีของคุณยังใช้งานอยู่
• เอกสารสัญญาเช่า: จนกว่าคุณจะลบหรือปิดบัญชี
• บันทึกธุรกรรม: 7 ปี (ตามที่กฎหมายภาษีไทยกำหนด)
• ข้อมูลการตลาด: จนกว่าคุณจะยกเลิกการสมัคร

หลังจากปิดบัญชี เราจะลบข้อมูลของคุณอย่างปลอดภัยภายใน 30 วัน ยกเว้นกรณีที่เราต้องเก็บไว้เพื่อปฏิบัติตามกฎหมาย`
        },
        {
          icon: Mail,
          title: "7. คุกกี้และการติดตาม",
          content: `เราใช้คุกกี้ที่จำเป็นเพื่อ:

• รักษาเซสชันการเข้าสู่ระบบของคุณ
• จดจำการตั้งค่าภาษาของคุณ
• รับประกันการทำงานของเว็บไซต์

เราไม่ใช้คุกกี้โฆษณาจากบุคคลที่สามหรือขายข้อมูลการเรียกดูของคุณ`
        },
        {
          icon: Shield,
          title: "8. การโอนข้อมูลระหว่างประเทศ",
          content: `ข้อมูลของคุณจัดเก็บหลักในสิงคโปร์ (AWS เอเชียแปซิฟิก) หากเราโอนข้อมูลออกนอกประเทศไทย เรารับประกัน:

• มีกลไกการปกป้องที่เพียงพอ
• การโอนปฏิบัติตามข้อกำหนด พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล
• ใช้ข้อกำหนดสัญญามาตรฐานเมื่อจำเป็น`
        },
        {
          icon: FileText,
          title: "9. การเปลี่ยนแปลงนโยบายนี้",
          content: `เราอาจอัปเดตนโยบายความเป็นส่วนตัวนี้เพื่อสะท้อนการเปลี่ยนแปลงในแนวปฏิบัติหรือข้อกำหนดทางกฎหมาย เราจะแจ้งให้คุณทราบถึงการเปลี่ยนแปลงที่สำคัญผ่าน:

• อีเมลไปยังที่อยู่ที่ลงทะเบียนไว้
• แบนเนอร์แจ้งเตือนในแอป
• วันที่ "แก้ไขล่าสุด" ที่อัปเดตด้านบนหน้านี้

การใช้บริการของเราต่อไปหลังจากการเปลี่ยนแปลงถือเป็นการยอมรับนโยบายที่อัปเดต`
        },
        {
          icon: Mail,
          title: "10. ติดต่อเรา",
          content: `สำหรับคำถามเกี่ยวกับความเป็นส่วนตัวหรือการใช้สิทธิ์ของคุณ:

• อีเมล: privacy@leaseshield.asia
• เจ้าหน้าที่คุ้มครองข้อมูล: dpo@leaseshield.asia
• ที่อยู่: Lease Shield, กรุงเทพฯ ประเทศไทย

เราจะตอบคำขอทั้งหมดภายใน 30 วันตามที่ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคลกำหนด`
        }
      ]
    }
  };

  const strings = content[language];

  return (
    <div className="min-h-screen p-4 md:p-6" style={{
      backgroundColor: colors.bg,
      paddingBottom: '160px'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#0C3B2E',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(12, 59, 46, 0.2)'
            }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
              <p className="text-slate-600" style={{ color: colors.textSecondary }}>{strings.lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mb-6 border-none shadow-lg" style={{
          backgroundColor: isDarkMode ? '#2A2D30' : '#ECEFED',
          borderLeft: '4px solid #C7A338'
        }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-ls-gold flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                  {language === 'th' 
                    ? 'เราจริงจังกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายวิธีที่เรารวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562'
                    : 'We take your privacy seriously. This policy explains how we collect, use, and protect your personal data in compliance with the Personal Data Protection Act (PDPA) B.E. 2562.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-6">
          {strings.sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader className="border-b" style={{
                  backgroundColor: isDarkMode ? '#2A2D30' : '#ECEFED',
                  borderColor: colors.borderColor
                }}>
                  <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <Icon className="w-5 h-5 text-ls-forest" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: colors.textSecondary }}>
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Notice - IMPROVED VISIBILITY */}
        <Card className="mt-8 border-none shadow-xl" style={{
          background: 'linear-gradient(to bottom right, #0C3B2E, #047857)'
        }}>
          <CardContent className="p-8 text-center">
            <Shield className="w-10 h-10 text-ls-gold mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-3">
              {language === 'th' ? 'ข้อมูลของคุณปลอดภัยกับเรา' : 'Your Data is Safe With Us'}
            </p>
            <p className="text-white text-base leading-relaxed mb-4">
              {language === 'th' 
                ? 'หากคุณมีคำถามหรือข้อกังวลใดๆ โปรดติดต่อเราที่' 
                : 'If you have any questions or concerns, please contact us at'}
            </p>
            <a 
              href="mailto:privacy@leaseshield.asia"
              className="inline-block px-6 py-3 bg-white text-ls-forest font-bold rounded-lg hover:bg-ls-stone transition-colors"
            >
              privacy@leaseshield.asia
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
