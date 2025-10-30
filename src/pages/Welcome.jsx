import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";

export default function Welcome() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';

  const t = {
    en: {
      tagline: "Fair. Transparent. Protected.",
      title: "Protect Your Rental Rights",
      subtitle: "Document everything. Know your rights. Resolve disputes fairly.",
      scanButton: "Scan My Lease",
      howItWorks: "How It Works",
      step1Title: "Scan Your Lease",
      step1Desc: "Upload your rental agreement for instant AI-powered analysis",
      step2Title: "Track Your Deposit",
      step2Desc: "Get automated reminders before your deposit return deadline",
      step3Title: "Build Your Evidence",
      step3Desc: "Document issues with photos, receipts, and communication logs",
      step4Title: "Resolve Disputes",
      step4Desc: "Access professional support if things go wrong"
    },
    th: {
      tagline: "ยุติธรรม โปร่งใส ปลอดภัย",
      title: "ปกป้องสิทธิ์การเช่าของคุณ",
      subtitle: "บันทึกทุกอย่าง รู้สิทธิ์ของคุณ แก้ไขข้อพิพาทอย่างยุติธรรม",
      scanButton: "สแกนสัญญาเช่า",
      howItWorks: "วิธีการทำงาน",
      step1Title: "สแกนสัญญาเช่า",
      step1Desc: "อัปโหลดสัญญาเช่าเพื่อรับการวิเคราะห์ด้วย AI ทันที",
      step2Title: "ติดตามเงินมัดจำ",
      step2Desc: "รับการแจ้งเตือนอัตโนมัติก่อนถึงกำหนดคืนเงินมัดจำ",
      step3Title: "สร้างหลักฐาน",
      step3Desc: "บันทึกปัญหาด้วยรูปภาพ ใบเสร็จ และบันทึกการสื่อสาร",
      step4Title: "แก้ไขข้อพิพาท",
      step4Desc: "เข้าถึงการสนับสนุนจากมืออาชีพหากเกิดปัญหา"
    }
  };

  const strings = t[language];

  const steps = [
    { title: strings.step1Title, desc: strings.step1Desc, icon: FileText },
    { title: strings.step2Title, desc: strings.step2Desc, icon: Shield },
    { title: strings.step3Title, desc: strings.step3Desc, icon: CheckCircle2 },
    { title: strings.step4Title, desc: strings.step4Desc, icon: AlertCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
              alt="Lease Shield"
              className="h-16 w-16"
            />
            <h1 className="text-5xl font-bold text-ls-charcoal">LEASE SHIELD</h1>
          </div>
          <p className="text-xl text-ls-gold font-semibold mb-6">{strings.tagline}</p>
          <h2 className="text-4xl font-bold text-ls-charcoal mb-4">{strings.title}</h2>
          <p className="text-xl text-slate-600 mb-8">{strings.subtitle}</p>
          <Button 
            size="lg" 
            className="bg-ls-forest hover:bg-ls-forest/90 text-white text-lg px-8 py-6"
            onClick={() => navigate(createPageUrl("UploadScan"))}
          >
            <FileText className="w-6 h-6 mr-2" />
            {strings.scanButton}
          </Button>
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center text-ls-charcoal mb-8">{strings.howItWorks}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-12 h-12 bg-ls-forest rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-ls-charcoal mb-2">{step.title}</h4>
                  <p className="text-slate-600 text-sm">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}