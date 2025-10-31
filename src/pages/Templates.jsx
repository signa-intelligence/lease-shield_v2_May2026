
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl }
 from "@/utils";
import { FileCheck, ArrowLeft, Mail, AlertCircle, FileText, Shield, Scale, Clock, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeatureGate, useFeatureAccess } from "../components/shared/FeatureGate";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const TEMPLATES = [
  {
    id: 'deposit_request',
    title: { en: 'Deposit Return Request', th: 'จดหมายขอคืนเงินมัดจำ' },
    description: { en: 'Polite formal letter requesting return of security deposit (EN/TH)', th: 'จดหมายทางการสุภาพขอคืนเงินประกัน (ไทย/EN)' },
    icon: Shield,
    tier: 'lite',
    category: { en: 'Deposit', th: 'เงินมัดจำ' },
    languages: ['en', 'th']
  },
  {
    id: 'deposit_late',
    title: { en: 'Late Deposit Return Reminder', th: 'จดหมายเตือนคืนเงินมัดจำล่าช้า' },
    description: { en: 'Follow-up reminder for overdue deposit return with timeline request', th: 'จดหมายติดตามเงินมัดจำที่เกินกำหนดพร้อมขอกำหนดเวลา' },
    icon: Clock,
    tier: 'lite',
    category: { en: 'Deposit', th: 'เงินมัดจำ' },
    languages: ['en', 'th']
  },
  {
    id: 'repair_dispute',
    title: { en: 'Repair Cost Dispute', th: 'โต้แย้งค่าซ่อมแซม' },
    description: { en: 'Dispute unfair repair charges with evidence references', th: 'โต้แย้งค่าซ่อมแซมที่ไม่ยุติธรรมพร้อมอ้างอิงหลักฐาน' },
    icon: AlertCircle,
    tier: 'protect',
    category: { en: 'Dispute', th: 'ข้อพิพาท' },
    languages: ['en', 'th']
  },
  {
    id: 'pdpa_request',
    title: { en: 'PDPA Data Request', th: 'ขอข้อมูลตาม พ.ร.บ. PDPA' },
    description: { en: 'Request personal data and lease documents under PDPA', th: 'ขอข้อมูลส่วนบุคคลและเอกสารเช่าตาม พ.ร.บ. PDPA' },
    icon: FileText,
    tier: 'protect',
    category: { en: 'Legal', th: 'กฎหมาย' },
    languages: ['en', 'th']
  },
  {
    id: 'pre_move_out',
    title: { en: 'Pre-Move-Out Notice', th: 'แจ้งก่อนย้ายออก' },
    description: { en: 'Formal notice of move-out date and inspection request', th: 'แจ้งวันย้ายออกและขอตรวจสอบอย่างเป็นทางการ' },
    icon: Mail,
    tier: 'lite',
    category: { en: 'Move-Out', th: 'ย้ายออก' },
    languages: ['en', 'th']
  },
  {
    id: 'handover_check',
    title: { en: 'Handover Inspection Checklist', th: 'รายการตรวจสอบการส่งมอบ' },
    description: { en: 'Comprehensive checklist for property handover with photo slots', th: 'รายการตรวจสอบครบถ้วนสำหรับการส่งมอบพร้อมช่องรูปภาพ' },
    icon: ClipboardCheck,
    tier: 'protect',
    category: { en: 'Move-Out', th: 'ย้ายออก' },
    languages: ['en', 'th']
  },
  {
    id: 'contract_clarification',
    title: { en: 'Contract Clarification Request', th: 'ขอชี้แจงสัญญา' },
    description: { en: 'Request clarification on specific lease clauses', th: 'ขอให้ชี้แจงข้อกำหนดเฉพาะในสัญญาเช่า' },
    icon: Scale,
    tier: 'lite',
    category: { en: 'Lease', th: 'สัญญาเช่า' },
    languages: ['en', 'th']
  },
];

export default function Templates() {
  const navigate = useNavigate();
  const { hasAccess: hasTemplatesLite } = useFeatureAccess('templates_lite');
  const { hasAccess: hasTemplatesFull } = useFeatureAccess('templates_full');

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
    bg: '#0C3B2E',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#e2e8f0'
  };


  const t = {
    en: {
      title: "Legal-safe Templates",
      subtitle: "Standard bilingual letters and messages for all situations",
      backToEvidence: "Back to Evidence Vault",
      generateLetter: "Generate Letter",
      planRequired: "PLAN REQUIRED"
    },
    th: {
      title: "เทมเพลตที่ปลอดภัยทางกฎหมาย",
      subtitle: "จดหมายและข้อความสองภาษามาตรฐานสำหรับทุกสถานการณ์",
      backToEvidence: "กลับไปยังคลังหลักฐาน",
      generateLetter: "สร้างจดหมาย",
      planRequired: "ต้องการแผน"
    }
  };

  const strings = t[language];

  const canAccessTemplate = (tier) => {
    if (tier === 'lite') return hasTemplatesLite || hasTemplatesFull;
    if (tier === 'protect') return hasTemplatesFull;
    return true;
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl("DocumentVault"))}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1A1D1F',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: '2px solid #D1D5DB',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#ECEFED'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFFFF'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FileCheck className="w-7 h-7 text-ls-forest" />
              <h1 className="text-2xl md:text-3xl font-bold text-ls-charcoal">{strings.title}</h1>
            </div>
            <p className="text-slate-600">{strings.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            const hasAccess = canAccessTemplate(template.tier);
            
            return (
              <Card 
                key={template.id} 
                className={`border-none shadow-md hover:shadow-lg transition-all duration-300 ${!hasAccess ? 'opacity-60' : ''}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(to bottom right, #0C3B2E, #14532d)',
                        boxShadow: '0 4px 6px rgba(12, 59, 46, 0.2)'
                      }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-ls-charcoal mb-1">
                            {template.title[language] || template.title.en}
                          </h3>
                          <div className="flex gap-2 mb-2">
                            <Badge variant="outline" className="text-xs border-ls-forest text-ls-forest">
                              {template.category[language] || template.category.en}
                            </Badge>
                            {template.languages.map(lang => (
                              <Badge key={lang} variant="outline" className="text-xs border-ls-gold text-ls-gold">
                                {lang.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {template.description[language] || template.description.en}
                      </p>
                      {hasAccess ? (
                        <button
                          onClick={() => navigate(createPageUrl("TemplateForm") + `?templateId=${template.id}`)}
                          style={{
                            backgroundColor: '#0C3B2E',
                            color: '#FFFFFF',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#C7A338'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                        >
                          {strings.generateLetter}
                        </button>
                      ) : (
                        <Badge className="bg-ls-gold/20 text-ls-gold border border-ls-gold/30">
                          {template.tier.toUpperCase()} {strings.planRequired}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
