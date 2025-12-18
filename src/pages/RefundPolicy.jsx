import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, Mail, Calendar } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import AuthGuard from "../components/shared/AuthGuard";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

function RefundPolicyContent() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    fieldBg: '#374151'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    fieldBg: '#F8FAFC'
  };

  const t = {
    en: {
      title: "Refund & Subscription Policy",
      effective: "Effective Date: 01/12/2025",
      governingLaw: "Governing Law: Thailand",
      section1Title: "1. General",
      section1Content: "Lease Shield provides subscription-based services and one-time lease scan credits. All charges are billed in Thai Baht (THB) unless otherwise stated.\n\nBy subscribing or purchasing scan credits, you agree to this Refund & Subscription Policy.",
      section2Title: "2. No General Refunds",
      section2Intro: "All payments are final and non-refundable, including:",
      section2Items: [
        "Subscription fees (monthly or annual)",
        "Unused subscription time",
        "Unused scan credits",
        "Partial billing periods",
        "Change of mind or dissatisfaction",
        "Inability to use the service",
        "Account inactivity"
      ],
      section3Title: "3. Billing Error Exceptions Only",
      section3Intro: "Refunds are issued only for verified billing errors:",
      section3Items: [
        "Duplicate charges",
        "Charges made after cancellation completed before renewal",
        "Incorrect amounts charged versus checkout",
        "Unauthorized charges"
      ],
      section3Note: "Billing issues must be reported within 14 days of the charge.",
      section4Title: "4. Subscriptions & Cancellations",
      section4Items: [
        "Subscriptions may be cancelled at any time via the account page",
        "Cancellation prevents future renewals only",
        "No prorated refunds are provided",
        "Access continues until the end of the current billing period"
      ],
      section4Note: "Failure to cancel before renewal does not qualify for a refund.",
      section5Title: "5. One-Time Lease Scans",
      section5Items: [
        "One-time scans are non-refundable once processing begins",
        "Results depend on uploaded documents",
        "Disagreement with scan outcomes does not qualify for a refund"
      ],
      section6Title: "6. Service Availability",
      section6Intro: "No refunds or credits are provided for:",
      section6Items: [
        "Temporary downtime or maintenance",
        "Internet, device, or browser issues",
        "Third-party service interruptions"
      ],
      section7Title: "7. Chargebacks",
      section7Content: "Chargebacks initiated without contacting Lease Shield first may result in account suspension or termination.",
      section8Title: "8. Legal Rights",
      section8Content: "This policy does not override mandatory consumer rights under applicable law.",
      section9Title: "9. Contact",
      billing: "Billing & subscriptions:",
      privacy: "Privacy & data requests:",
      supportEmail: "support@leaseshield.asia",
      privacyEmail: "privacy@leaseshield.asia"
    },
    th: {
      title: "นโยบายการคืนเงินและการสมัครสมาชิก",
      effective: "มีผลตั้งแต่: 01/12/2025",
      governingLaw: "กฎหมายที่ใช้บังคับ: ประเทศไทย",
      section1Title: "1. ทั่วไป",
      section1Content: "Lease Shield ให้บริการแบบสมัครสมาชิกและเครดิตการสแกนสัญญาเช่าแบบครั้งเดียว ค่าใช้จ่ายทั้งหมดเรียกเก็บเป็นเงินบาทไทย (THB) เว้นแต่จะระบุไว้เป็นอย่างอื่น\n\nโดยการสมัครสมาชิกหรือซื้อเครดิตการสแกน คุณยอมรับนโยบายการคืนเงินและการสมัครสมาชิกนี้",
      section2Title: "2. ไม่มีการคืนเงินทั่วไป",
      section2Intro: "การชำระเงินทั้งหมดเป็นการชำระขั้นสุดท้ายและไม่สามารถคืนเงินได้ รวมถึง:",
      section2Items: [
        "ค่าสมัครสมาชิก (รายเดือนหรือรายปี)",
        "เวลาการสมัครสมาชิกที่ไม่ได้ใช้",
        "เครดิตการสแกนที่ไม่ได้ใช้",
        "ระยะเวลาการเรียกเก็บเงินบางส่วน",
        "การเปลี่ยนใจหรือความไม่พอใจ",
        "ไม่สามารถใช้บริการได้",
        "บัญชีไม่ได้ใช้งาน"
      ],
      section3Title: "3. ข้อยกเว้นสำหรับข้อผิดพลาดในการเรียกเก็บเงินเท่านั้น",
      section3Intro: "การคืนเงินจะดำเนินการเฉพาะข้อผิดพลาดการเรียกเก็บเงินที่ตรวจสอบแล้ว:",
      section3Items: [
        "การเรียกเก็บเงินซ้ำ",
        "การเรียกเก็บเงินหลังจากยกเลิกเสร็จสมบูรณ์ก่อนการต่ออายุ",
        "จำนวนเงินที่เรียกเก็บไม่ถูกต้องเมื่อเทียบกับการชำระเงิน",
        "การเรียกเก็บเงินโดยไม่ได้รับอนุญาต"
      ],
      section3Note: "ปัญหาการเรียกเก็บเงินต้องรายงานภายใน 14 วันหลังจากการเรียกเก็บ",
      section4Title: "4. การสมัครสมาชิกและการยกเลิก",
      section4Items: [
        "สามารถยกเลิกการสมัครสมาชิกได้ทุกเมื่อผ่านหน้าบัญชี",
        "การยกเลิกป้องกันการต่ออายุในอนาคตเท่านั้น",
        "ไม่มีการคืนเงินตามสัดส่วน",
        "การเข้าถึงยังคงมีจนถึงสิ้นสุดระยะเวลาเรียกเก็บเงินปัจจุบัน"
      ],
      section4Note: "ความล้มเหลวในการยกเลิกก่อนการต่ออายุไม่มีสิทธิ์ได้รับการคืนเงิน",
      section5Title: "5. การสแกนสัญญาเช่าครั้งเดียว",
      section5Items: [
        "การสแกนครั้งเดียวไม่สามารถคืนเงินได้เมื่อเริ่มการประมวลผล",
        "ผลลัพธ์ขึ้นอยู่กับเอกสารที่อัปโหลด",
        "ความไม่เห็นด้วยกับผลการสแกนไม่มีสิทธิ์ได้รับการคืนเงิน"
      ],
      section6Title: "6. ความพร้อมใช้งานของบริการ",
      section6Intro: "ไม่มีการคืนเงินหรือเครดิตสำหรับ:",
      section6Items: [
        "เวลาหยุดชั่วคราวหรือการบำรุงรักษา",
        "ปัญหาอินเทอร์เน็ต อุปกรณ์ หรือเบราว์เซอร์",
        "การหยุดชะงักของบริการบุคคลที่สาม"
      ],
      section7Title: "7. การยกเลิกการชำระเงิน",
      section7Content: "การยกเลิกการชำระเงินที่เริ่มต้นโดยไม่ติดต่อ Lease Shield ก่อนอาจส่งผลให้บัญชีถูกระงับหรือยกเลิก",
      section8Title: "8. สิทธิ์ทางกฎหมาย",
      section8Content: "นโยบายนี้ไม่ลบล้างสิทธิ์ของผู้บริโภคตามกฎหมายที่บังคับใช้",
      section9Title: "9. ติดต่อ",
      billing: "การเรียกเก็บเงินและการสมัครสมาชิก:",
      privacy: "คำขอความเป็นส่วนตัวและข้อมูล:",
      supportEmail: "support@leaseshield.asia",
      privacyEmail: "privacy@leaseshield.asia"
    }
  };

  const strings = t[language] || t.en;

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24 page-transition" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={strings.title}
          subtitle={strings.effective}
          icon={Shield}
          iconColor="#0C3B2E"
          isDarkMode={isDarkMode}
        />

        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-6 space-y-6">
            <div className="p-4 rounded-lg" style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#F0FDF4',
              border: `2px solid ${isDarkMode ? '#10B981' : '#86EFAC'}`
            }}>
              <p className="text-sm font-semibold" style={{ color: isDarkMode ? '#10B981' : '#047857' }}>
                {strings.governingLaw}
              </p>
            </div>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                {strings.section1Title}
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: colors.textSecondary }}>
                {strings.section1Content}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <AlertCircle className="w-5 h-5 text-red-600" />
                {strings.section2Title}
              </h2>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                {strings.section2Intro}
              </p>
              <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                {strings.section2Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
                {strings.section3Title}
              </h2>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                {strings.section3Intro}
              </p>
              <ul className="space-y-2 text-sm mb-3" style={{ color: colors.textSecondary }}>
                {strings.section3Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {strings.section3Note}
              </p>
              <a 
                href="mailto:support@leaseshield.asia"
                className="text-sm font-bold underline mt-2 inline-block"
                style={{ color: '#0C3B2E' }}
              >
                📧 support@leaseshield.asia
              </a>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
                {strings.section4Title}
              </h2>
              <ul className="space-y-2 text-sm mb-3" style={{ color: colors.textSecondary }}>
                {strings.section4Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {strings.section4Note}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
                {strings.section5Title}
              </h2>
              <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                {strings.section5Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
                {strings.section6Title}
              </h2>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                {strings.section6Intro}
              </p>
              <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                {strings.section6Items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
                {strings.section7Title}
              </h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {strings.section7Content}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
                {strings.section8Title}
              </h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {strings.section8Content}
              </p>
            </section>

            <section className="p-4 rounded-lg" style={{
              backgroundColor: isDarkMode ? '#1F2937' : '#F0FDF4',
              border: `2px solid ${colors.borderColor}`
            }}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Mail className="w-5 h-5 text-ls-forest" />
                {strings.section9Title}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {strings.billing}
                  </p>
                  <a 
                    href="mailto:support@leaseshield.asia"
                    className="text-sm font-bold underline"
                    style={{ color: '#0C3B2E' }}
                  >
                    support@leaseshield.asia
                  </a>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {strings.privacy}
                  </p>
                  <a 
                    href="mailto:privacy@leaseshield.asia"
                    className="text-sm font-bold underline"
                    style={{ color: '#0C3B2E' }}
                  >
                    privacy@leaseshield.asia
                  </a>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RefundPolicy() {
  return (
    <AuthGuard>
      <RefundPolicyContent />
    </AuthGuard>
  );
}