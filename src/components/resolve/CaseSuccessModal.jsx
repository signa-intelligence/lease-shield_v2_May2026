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
    step1TitleFast: "⚡ Expedited Document Review (1 business day)",
    step1TitleStd: "📋 Document Review (2-3 business days)",
    step1DescFast: "Your case receives priority review by our consultants",
    step1DescStd: "Our consultants will review your case details and evidence",
    step2Title: "Case Assessment",
    step2TitleFast: "Rapid Case Assessment",
    step2Desc: "We'll evaluate your situation and identify possible approaches",
    step3Title: "Action Plan & Templates",
    step3Desc: "You'll receive:",
    step3Items: ["Case assessment", "Suggested strategy options", "Customised template letters", "Next steps guidance"],
    step4Title: "We'll Contact You",
    step4Via: "Via: LINE and Email",
    step4TimelineFast: "Timeline: Within 1 business day",
    step4TimelineStd: "Timeline: Within 2-3 business days",
    keepCaseNumber: "Keep Your Case Number",
    questions: "Questions? Contact us:",
    viewCases: "View My Cases",
    close: "Close",
    footnote: "* Business days exclude weekends and public holidays"
  },
  th: {
    title: "ยื่นคดีสำเร็จ!",
    caseNumber: "หมายเลขคดี",
    nextSteps: "ขั้นตอนต่อไป:",
    step1TitleFast: "⚡ การตรวจสอบเอกสารแบบเร่งด่วน (1 วันทำการ)",
    step1TitleStd: "📋 ตรวจสอบเอกสาร (2-3 วันทำการ)",
    step1DescFast: "คดีของคุณได้รับการตรวจสอบอย่างเร่งด่วนโดยที่ปรึกษา",
    step1DescStd: "ที่ปรึกษาจะตรวจสอบรายละเอียดและหลักฐาน",
    step2Title: "ประเมินคดี",
    step2TitleFast: "การประเมินคดีอย่างรวดเร็ว",
    step2Desc: "เราจะประเมินสถานการณ์และระบุแนวทางที่เป็นไปได้",
    step3Title: "แผนปฏิบัติการและเทมเพลต",
    step3Desc: "คุณจะได้รับ:",
    step3Items: ["การประเมินคดี", "ตัวเลือกกลยุทธ์ที่แนะนำ", "เทมเพลตจดหมายที่กำหนดเอง", "คำแนะนำขั้นตอนต่อไป"],
    step4Title: "เราจะติดต่อคุณ",
    step4Via: "ผ่าน: LINE และอีเมล",
    step4TimelineFast: "ระยะเวลา: ภายใน 1 วันทำการ",
    step4TimelineStd: "ระยะเวลา: ภายใน 2-3 วันทำการ",
    keepCaseNumber: "เก็บหมายเลขคดีของคุณไว้",
    questions: "มีคำถาม? ติดต่อเรา:",
    viewCases: "ดูคดีของฉัน",
    close: "ปิด",
    footnote: "* วันทำการไม่รวมวันหยุดสุดสัปดาห์และวันหยุดนักขัตฤกษ์"
  },
  zh: {
    title: "案件提交成功!",
    caseNumber: "案件编号",
    nextSteps: "接下来会发生什么：",
    step1TitleFast: "⚡ 加急文件审查 (1个工作日)",
    step1TitleStd: "📋 文件审查 (2-3个工作日)",
    step1DescFast: "您的案件将由我们的顾问优先审查",
    step1DescStd: "我们的顾问将审查您的案件详情和证据",
    step2Title: "案件评估",
    step2TitleFast: "快速案件评估",
    step2Desc: "我们将评估您的情况并确定可能的方法",
    step3Title: "行动计划和模板",
    step3Desc: "您将收到：",
    step3Items: ["案件评估", "建议的策略选项", "定制模板信函", "下一步指导"],
    step4Title: "我们将联系您",
    step4Via: "方式：LINE和电子邮件",
    step4TimelineFast: "时间：1个工作日内",
    step4TimelineStd: "时间：2-3个工作日内",
    keepCaseNumber: "请保存您的案件编号",
    questions: "有问题？联系我们：",
    viewCases: "查看我的案件",
    close: "关闭",
    footnote: "* 工作日不包括周末和公共假日"
  },
  ja: {
    title: "ケース送信完了！",
    caseNumber: "ケース番号",
    nextSteps: "次のステップ：",
    step1TitleFast: "⚡ 優先書類審査 (1営業日)",
    step1TitleStd: "📋 書類審査 (2-3営業日)",
    step1DescFast: "ケースはコンサルタントによる優先審査を受けます",
    step1DescStd: "コンサルタントがケースの詳細と証拠を確認します",
    step2Title: "ケース評価",
    step2TitleFast: "迅速なケース評価",
    step2Desc: "状況を評価し、可能なアプローチを特定します",
    step3Title: "行動計画とテンプレート",
    step3Desc: "以下を受け取ります：",
    step3Items: ["ケース評価", "提案された戦略オプション", "カスタマイズされたテンプレートレター", "次のステップガイダンス"],
    step4Title: "ご連絡いたします",
    step4Via: "方法：LINEとメール",
    step4TimelineFast: "期間：1営業日以内",
    step4TimelineStd: "期間：2-3営業日以内",
    keepCaseNumber: "ケース番号を保管してください",
    questions: "ご質問は？お問い合わせ：",
    viewCases: "ケースを見る",
    close: "閉じる",
    footnote: "* 営業日は週末と祝日を除きます"
  },
  ko: {
    title: "사례 제출 완료!",
    caseNumber: "사례 번호",
    nextSteps: "다음 단계:",
    step1TitleFast: "⚡ 긴급 문서 검토 (1영업일)",
    step1TitleStd: "📋 문서 검토 (2-3영업일)",
    step1DescFast: "귀하의 사례는 컨설턴트의 우선 검토를 받습니다",
    step1DescStd: "컨설턴트가 사례 세부 사항과 증거를 검토합니다",
    step2Title: "사례 평가",
    step2TitleFast: "신속 사례 평가",
    step2Desc: "상황을 평가하고 가능한 접근 방식을 파악합니다",
    step3Title: "실행 계획 및 템플릿",
    step3Desc: "다음을 받게 됩니다:",
    step3Items: ["사례 평가", "제안된 전략 옵션", "맞춤 템플릿 레터", "다음 단계 안내"],
    step4Title: "연락 드리겠습니다",
    step4Via: "방법: LINE 및 이메일",
    step4TimelineFast: "기간: 1영업일 이내",
    step4TimelineStd: "기간: 2-3영업일 이내",
    keepCaseNumber: "사례 번호를 보관하세요",
    questions: "질문이 있으신가요? 연락주세요:",
    viewCases: "내 사례 보기",
    close: "닫기",
    footnote: "* 영업일은 주말 및 공휴일을 제외합니다"
  },
  ru: {
    title: "Дело подано успешно!",
    caseNumber: "Номер дела",
    nextSteps: "Что будет дальше:",
    step1TitleFast: "⚡ Ускоренная проверка (1 рабочий день)",
    step1TitleStd: "📋 Проверка документов (2-3 рабочих дня)",
    step1DescFast: "Ваше дело получит приоритетную проверку нашими консультантами",
    step1DescStd: "Наши консультанты рассмотрят детали вашего дела и доказательства",
    step2Title: "Оценка дела",
    step2TitleFast: "Быстрая оценка дела",
    step2Desc: "Мы оценим вашу ситуацию и определим возможные подходы",
    step3Title: "План действий и шаблоны",
    step3Desc: "Вы получите:",
    step3Items: ["Оценку дела", "Предложенные варианты стратегии", "Индивидуальные шаблоны писем", "Руководство по дальнейшим шагам"],
    step4Title: "Мы свяжемся с вами",
    step4Via: "Через: LINE и Email",
    step4TimelineFast: "Срок: в течение 1 рабочего дня",
    step4TimelineStd: "Срок: в течение 2-3 рабочих дней",
    keepCaseNumber: "Сохраните номер вашего дела",
    questions: "Вопросы? Свяжитесь с нами:",
    viewCases: "Мои дела",
    close: "Закрыть",
    footnote: "* Рабочие дни не включают выходные и праздничные дни"
  }
};

const STEPS_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];

export default function CaseSuccessModal({ isOpen, caseNumber, language = 'en', isDarkMode = false, onClose }) {
  const navigate = useNavigate();
  const str = STRINGS[language] || STRINGS.en;

  if (!isOpen) return null;

  // Detect Fast Track vs Standard from case number position 2
  const caseTrack = caseNumber ? caseNumber.charAt(1) : 'S';
  const isFastTrack = caseTrack === 'F';

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
            {isFastTrack ? '⚡' : '✅'} {str.title}
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
            {/* Step 1 - Track-aware */}
            <StepItem
              emoji={STEPS_EMOJIS[0]}
              title={isFastTrack ? str.step1TitleFast : str.step1TitleStd}
              colors={colors}
              highlight={isFastTrack}
              isDarkMode={isDarkMode}
            >
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {isFastTrack ? str.step1DescFast : str.step1DescStd}
              </p>
            </StepItem>

            {/* Step 2 */}
            <StepItem
              emoji={STEPS_EMOJIS[1]}
              title={isFastTrack ? str.step2TitleFast : str.step2Title}
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

            {/* Step 4 - Track-aware timeline */}
            <StepItem
              emoji={STEPS_EMOJIS[3]}
              title={str.step4Title}
              colors={colors}
            >
              <p className="text-sm" style={{ color: colors.textSecondary }}>{str.step4Via}</p>
              <p className="text-sm font-semibold" style={{ color: isFastTrack ? '#EA580C' : colors.textSecondary }}>
                {isFastTrack ? str.step4TimelineFast : str.step4TimelineStd}
              </p>
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

          {/* Business days footnote */}
          <p className="text-xs mb-4" style={{ color: colors.textSecondary }}>
            {str.footnote}
          </p>

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

function StepItem({ emoji, title, children, colors, highlight = false, isDarkMode = false }) {
  return (
    <div className="p-4 rounded-xl" style={{ 
      backgroundColor: highlight 
        ? (isDarkMode ? '#7C2D12' : '#FFF7ED') 
        : colors.stepBg,
      border: highlight ? '1px solid #FDBA74' : 'none'
    }}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-bold mb-1" style={{ color: highlight ? '#EA580C' : colors.textPrimary }}>{title}</p>
          {children}
        </div>
      </div>
    </div>
  );
}