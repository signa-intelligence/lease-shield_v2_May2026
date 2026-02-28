import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, MessageSquare, ClipboardList, Eye } from "lucide-react";

const STRINGS = {
  en: {
    title: "Case Submitted Successfully!",
    caseNumber: "Case Number",
    nextSteps: "What Happens Next:",
    step1Title: "Document Review (2-3 business days)",
    step1Desc: "Our consultants will review your case details and evidence",
    step2Title: "Case Assessment",
    step2Desc: "We'll evaluate your situation and identify possible approaches",
    step3Title: "Action Plan & Templates",
    step3Desc: "You'll receive:",
    step3Items: [
      "Case assessment",
      "Suggested strategy options",
      "Customised template letters",
      "Next steps guidance"
    ],
    step4Title: "We'll Contact You",
    step4Via: "Via: LINE and Email",
    step4Timeline: "Timeline: Within 2-3 business days",
    keepCaseNumber: "Keep Your Case Number",
    questions: "Questions? Contact us:",
    viewCases: "View My Cases",
    close: "Close"
  },
  th: {
    title: "ยื่นคดีสำเร็จ!",
    caseNumber: "หมายเลขคดี",
    nextSteps: "ขั้นตอนต่อไป:",
    step1Title: "ตรวจสอบเอกสาร (2-3 วันทำการ)",
    step1Desc: "ที่ปรึกษาจะตรวจสอบรายละเอียดและหลักฐาน",
    step2Title: "ประเมินคดี",
    step2Desc: "เราจะประเมินสถานการณ์และระบุแนวทางที่เป็นไปได้",
    step3Title: "แผนปฏิบัติการและเทมเพลต",
    step3Desc: "คุณจะได้รับ:",
    step3Items: [
      "การประเมินคดี",
      "ตัวเลือกกลยุทธ์ที่แนะนำ",
      "เทมเพลตจดหมายที่กำหนดเอง",
      "คำแนะนำขั้นตอนต่อไป"
    ],
    step4Title: "เราจะติดต่อคุณ",
    step4Via: "ผ่าน: LINE และอีเมล",
    step4Timeline: "ระยะเวลา: ภายใน 2-3 วันทำการ",
    keepCaseNumber: "เก็บหมายเลขคดีของคุณไว้",
    questions: "มีคำถาม? ติดต่อเรา:",
    viewCases: "ดูคดีของฉัน",
    close: "ปิด"
  },
  zh: {
    title: "案件提交成功!",
    caseNumber: "案件编号",
    nextSteps: "接下来会发生什么：",
    step1Title: "文件审查 (2-3个工作日)",
    step1Desc: "我们的顾问将审查您的案件详情和证据",
    step2Title: "案件评估",
    step2Desc: "我们将评估您的情况并确定可能的方法",
    step3Title: "行动计划和模板",
    step3Desc: "您将收到：",
    step3Items: ["案件评估", "建议的策略选项", "定制模板信函", "下一步指导"],
    step4Title: "我们将联系您",
    step4Via: "方式：LINE和电子邮件",
    step4Timeline: "时间：2-3个工作日内",
    keepCaseNumber: "请保存您的案件编号",
    questions: "有问题？联系我们：",
    viewCases: "查看我的案件",
    close: "关闭"
  },
  ja: {
    title: "ケース送信完了！",
    caseNumber: "ケース番号",
    nextSteps: "次のステップ：",
    step1Title: "書類審査 (2-3営業日)",
    step1Desc: "コンサルタントがケースの詳細と証拠を確認します",
    step2Title: "ケース評価",
    step2Desc: "状況を評価し、可能なアプローチを特定します",
    step3Title: "行動計画とテンプレート",
    step3Desc: "以下を受け取ります：",
    step3Items: ["ケース評価", "提案された戦略オプション", "カスタマイズされたテンプレートレター", "次のステップガイダンス"],
    step4Title: "ご連絡いたします",
    step4Via: "方法：LINEとメール",
    step4Timeline: "期間：2-3営業日以内",
    keepCaseNumber: "ケース番号を保管してください",
    questions: "ご質問は？お問い合わせ：",
    viewCases: "ケースを見る",
    close: "閉じる"
  },
  ko: {
    title: "사례 제출 완료!",
    caseNumber: "사례 번호",
    nextSteps: "다음 단계:",
    step1Title: "문서 검토 (영업일 2-3일)",
    step1Desc: "컨설턴트가 사례 세부 사항과 증거를 검토합니다",
    step2Title: "사례 평가",
    step2Desc: "상황을 평가하고 가능한 접근 방식을 파악합니다",
    step3Title: "실행 계획 및 템플릿",
    step3Desc: "다음을 받게 됩니다:",
    step3Items: ["사례 평가", "제안된 전략 옵션", "맞춤 템플릿 레터", "다음 단계 안내"],
    step4Title: "연락 드리겠습니다",
    step4Via: "방법: LINE 및 이메일",
    step4Timeline: "기간: 영업일 2-3일 이내",
    keepCaseNumber: "사례 번호를 보관하세요",
    questions: "질문이 있으신가요? 연락주세요:",
    viewCases: "내 사례 보기",
    close: "닫기"
  },
  ru: {
    title: "Дело подано успешно!",
    caseNumber: "Номер дела",
    nextSteps: "Что будет дальше:",
    step1Title: "Проверка документов (2-3 рабочих дня)",
    step1Desc: "Наши консультанты рассмотрят детали вашего дела и доказательства",
    step2Title: "Оценка дела",
    step2Desc: "Мы оценим вашу ситуацию и определим возможные подходы",
    step3Title: "План действий и шаблоны",
    step3Desc: "Вы получите:",
    step3Items: ["Оценку дела", "Предложенные варианты стратегии", "Индивидуальные шаблоны писем", "Руководство по дальнейшим шагам"],
    step4Title: "Мы свяжемся с вами",
    step4Via: "Через: LINE и Email",
    step4Timeline: "Срок: в течение 2-3 рабочих дней",
    keepCaseNumber: "Сохраните номер вашего дела",
    questions: "Вопросы? Свяжитесь с нами:",
    viewCases: "Мои дела",
    close: "Закрыть"
  }
};

const STEPS_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];

export default function CaseSuccessModal({ isOpen, caseNumber, language = 'en', isDarkMode = false, onClose }) {
  const navigate = useNavigate();
  const str = STRINGS[language] || STRINGS.en;

  if (!isOpen) return null;

  const colors = isDarkMode ? {
    overlay: 'rgba(0,0,0,0.7)',
    bg: '#1F2937',
    cardBg: '#111827',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: 'rgba(255,255,255,0.1)',
    stepBg: '#374151',
    accentBg: '#064E3B',
    accentText: '#10B981',
    noteBg: '#1E3A5F',
    noteText: '#60A5FA'
  } : {
    overlay: 'rgba(0,0,0,0.5)',
    bg: '#FFFFFF',
    cardBg: '#F8FAFC',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    stepBg: '#F1F5F9',
    accentBg: '#ECFDF5',
    accentText: '#059669',
    noteBg: '#EFF6FF',
    noteText: '#2563EB'
  };

  const handleViewCases = () => {
    navigate(createPageUrl("Cases"));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: colors.overlay }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: colors.bg }}
      >
        {/* Header */}
        <div className="p-6 text-center" style={{ 
          background: isDarkMode 
            ? 'linear-gradient(135deg, #064E3B 0%, #1F2937 100%)' 
            : 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
        }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{
            backgroundColor: isDarkMode ? '#10B981' : '#059669'
          }}>
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            ✅ {str.title}
          </h2>
          <div className="inline-block px-4 py-2 rounded-lg mt-1" style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            border: `2px solid ${colors.accentText}`
          }}>
            <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
              {str.caseNumber}:
            </span>{' '}
            <span className="text-lg font-bold" style={{ color: colors.accentText }}>
              {caseNumber}
            </span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-6">
          <h3 className="text-base font-bold mb-4" style={{ color: colors.textPrimary }}>
            {str.nextSteps}
          </h3>

          <div className="space-y-4">
            {/* Step 1 */}
            <StepItem
              emoji={STEPS_EMOJIS[0]}
              title={str.step1Title}
              colors={colors}
            >
              <p className="text-sm" style={{ color: colors.textSecondary }}>{str.step1Desc}</p>
            </StepItem>

            {/* Step 2 */}
            <StepItem
              emoji={STEPS_EMOJIS[1]}
              title={str.step2Title}
              colors={colors}
            >
              <p className="text-sm" style={{ color: colors.textSecondary }}>{str.step2Desc}</p>
            </StepItem>

            {/* Step 3 */}
            <StepItem
              emoji={STEPS_EMOJIS[2]}
              title={str.step3Title}
              colors={colors}
            >
              <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{str.step3Desc}</p>
              <ul className="space-y-1">
                {str.step3Items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                    <span style={{ color: colors.accentText }}>•</span> {item}
                  </li>
                ))}
              </ul>
            </StepItem>

            {/* Step 4 */}
            <StepItem
              emoji={STEPS_EMOJIS[3]}
              title={str.step4Title}
              colors={colors}
            >
              <p className="text-sm" style={{ color: colors.textSecondary }}>{str.step4Via}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{str.step4Timeline}</p>
            </StepItem>
          </div>

          {/* Divider */}
          <div className="my-5 border-t" style={{ borderColor: colors.border }} />

          {/* Important Note */}
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: colors.noteBg }}>
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 flex-shrink-0" style={{ color: colors.noteText }} />
              <div>
                <p className="text-sm font-bold" style={{ color: colors.noteText }}>
                  📋 {str.keepCaseNumber}: <span className="font-mono">{caseNumber}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <p className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              {str.questions}
            </p>
            <div className="space-y-1">
              <p className="text-sm flex items-center gap-2" style={{ color: colors.textSecondary }}>
                <Mail className="w-4 h-4" /> support@leaseshield.asia
              </p>
              <p className="text-sm flex items-center gap-2" style={{ color: colors.textSecondary }}>
                <MessageSquare className="w-4 h-4" /> LINE: @leaseshield
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleViewCases}
              className="w-full"
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px',
                minHeight: '52px'
              }}
            >
              <Eye className="w-5 h-5 mr-2" />
              {str.viewCases}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
              style={{
                borderColor: colors.border,
                color: colors.textSecondary,
                padding: '14px',
                fontSize: '16px',
                borderRadius: '12px',
                minHeight: '52px'
              }}
            >
              {str.close}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ emoji, title, children, colors }) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: colors.stepBg }}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-bold mb-1" style={{ color: colors.textPrimary }}>{title}</p>
          {children}
        </div>
      </div>
    </div>
  );
}