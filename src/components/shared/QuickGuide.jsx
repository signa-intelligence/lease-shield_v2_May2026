import React, { useState, useEffect } from 'react';
import { X, Shield, Home, Wallet, Camera, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { haptic } from './HapticFeedback';

export default function QuickGuide({ user, onDismiss, colors, language = 'en', isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();

  // Listen for manual open events from Info button
  useEffect(() => {
    const handleOpenGuide = () => {
      setCurrentStep(0);
    };
    window.addEventListener('openQuickGuide', handleOpenGuide);
    return () => window.removeEventListener('openQuickGuide', handleOpenGuide);
  }, []);

  // Lock body scroll when guide is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDarkMode = user?.theme === 'dark';

  const handleDismiss = async () => {
    if (dontShowAgain && user) {
      try {
        await base44.auth.updateMe({ quick_guide_dismissed: true });
      } catch (error) {
        console.error('Failed to save Quick Guide preference:', error);
      }
    }
    if (onClose) onClose();
    if (onDismiss) onDismiss();
  };

  const t = {
    en: {
      title: 'Quick Guide',
      skipTour: 'Skip Tour',
      step1: 'Understand Your Lease',
      step1Desc: 'Get instant AI analysis of your rental agreement. Identify high-risk clauses and important obligations before signing.',
      step2: 'Everything Tracked Automatically',
      step2Desc: 'Deposit, rent schedule, and key dates are extracted and organized automatically. Just review for accuracy—creating a reliable record for both parties.',
      step3: 'Track Your Deposit',
      step3Desc: 'Monitor deposit amounts, return deadlines, and required documentation. Automated reminders ensure proper handling and transparent record-keeping.',
      step4: 'Document Property Condition',
      step4Desc: 'Upload time-stamped photos and videos at move-in and move-out. Create clear condition records that protect both landlords and tenants from disputes.',
      step5: 'Handle Issues Professionally',
      step5Desc: 'Use structured letter templates for repairs, lease negotiations, or deposit returns. Professional communication helps resolve issues faster without expensive legal costs.',
      next: 'Next',
      back: 'Back',
      finish: 'Get Started',
      dontShowAgain: "Don't show this again"
    },
    th: {
      title: 'คู่มือเริ่มต้น',
      skipTour: 'ข้ามทัวร์',
      step1: 'เข้าใจสัญญาเช่าของคุณ',
      step1Desc: 'รับการวิเคราะห์ AI ทันทีของสัญญาเช่าของคุณ ระบุข้อกำหนดที่มีความเสี่ยงสูงและภาระผูกพันสำคัญก่อนลงนาม',
      step2: 'ติดตามทุกอย่างอัตโนมัติ',
      step2Desc: 'เงินมัดจำ ตารางค่าเช่า และวันที่สำคัญจะถูกดึงและจัดระเบียบอัตโนมัติ ตรวจสอบความถูกต้อง—สร้างบันทึกที่เชื่อถือได้สำหรับทั้งสองฝ่าย',
      step3: 'ติดตามเงินมัดจำของคุณ',
      step3Desc: 'ติดตามจำนวนเงินมัดจำ กำหนดคืน และเอกสารที่จำเป็น การแจ้งเตือนอัตโนมัติช่วยให้การจัดการถูกต้องและโปร่งใส',
      step4: 'บันทึกสภาพทรัพย์สิน',
      step4Desc: 'อัปโหลดรูปและวิดีโอที่มีประทับเวลาตอนเข้าและออก สร้างบันทึกสภาพที่ชัดเจนเพื่อปกป้องทั้งเจ้าของและผู้เช่าจากข้อพิพาท',
      step5: 'จัดการปัญหาอย่างมืออาชีพ',
      step5Desc: 'ใช้เทมเพลตจดหมายสำหรับการซ่อม การเจรจาสัญญา หรือการคืนเงินมัดจำ การสื่อสารอย่างมืออาชีพช่วยแก้ปัญหาเร็วขึ้นโดยไม่ต้องเสียค่าทนายแพง',
      next: 'ถัดไป',
      back: 'ก่อนหน้า',
      finish: 'เริ่มใช้งาน',
      dontShowAgain: 'ไม่ต้องแสดงอีก'
    },
    zh: {
      title: '快速指南',
      skipTour: '跳过导览',
      step1: '了解您的租约',
      step1Desc: '获得租赁协议的即时AI分析。在签署前识别高风险条款和重要义务。',
      step2: '自动跟踪所有内容',
      step2Desc: '押金、租金计划和关键日期会自动提取和整理。只需检查准确性—为双方创建可靠记录。',
      step3: '追踪您的押金',
      step3Desc: '监控押金金额、退还期限和所需文件。自动提醒确保正确处理和透明记录。',
      step4: '记录房产状况',
      step4Desc: '在入住和退房时上传带时间戳的照片和视频。创建清晰的状况记录，保护房东和租户免受纠纷。',
      step5: '专业处理问题',
      step5Desc: '使用结构化的信件模板进行维修、租约谈判或押金退还。专业沟通有助于更快解决问题，无需昂贵的法律费用。',
      next: '下一步',
      back: '上一步',
      finish: '开始使用',
      dontShowAgain: '不再显示'
    },
    ja: {
      title: 'クイックガイド',
      skipTour: 'ツアーをスキップ',
      step1: 'リースを理解する',
      step1Desc: '賃貸契約のAI分析を即座に取得。署名前に高リスク条項と重要な義務を特定。',
      step2: 'すべて自動追跡',
      step2Desc: '敷金、家賃スケジュール、重要な日付は自動的に抽出・整理されます。正確性を確認するだけ—両者に信頼できる記録を作成。',
      step3: '敷金を追跡',
      step3Desc: '敷金額、返還期限、必要書類を監視。自動リマインダーにより適切な処理と透明な記録管理を確保。',
      step4: '物件状態を記録',
      step4Desc: '入居時と退去時にタイムスタンプ付きの写真とビデオをアップロード。紛争から家主とテナント両方を保護する明確な状態記録を作成。',
      step5: '問題を専門的に処理',
      step5Desc: '修理、リース交渉、敷金返還用の構造化されたレターテンプレートを使用。専門的なコミュニケーションにより、高額な法的費用なしで問題をより早く解決。',
      next: '次へ',
      back: '戻る',
      finish: '始める',
      dontShowAgain: '今後表示しない'
    },
    ko: {
      title: '빠른 가이드',
      skipTour: '투어 건너뛰기',
      step1: '임대 계약 이해하기',
      step1Desc: '임대 계약의 즉각적인 AI 분석을 받으세요. 서명 전에 고위험 조항과 중요한 의무를 식별하세요.',
      step2: '모든 것이 자동으로 추적됨',
      step2Desc: '보증금, 임대료 일정 및 주요 날짜가 자동으로 추출되고 정리됩니다. 정확성만 검토하면 됩니다—양 당사자를 위한 신뢰할 수 있는 기록을 생성합니다.',
      step3: '보증금 추적',
      step3Desc: '보증금 금액, 반환 기한 및 필요한 서류를 모니터링합니다. 자동 알림이 적절한 처리와 투명한 기록 유지를 보장합니다.',
      step4: '부동산 상태 기록',
      step4Desc: '입주 및 퇴거 시 타임스탬프가 있는 사진과 비디오를 업로드하세요. 분쟁으로부터 집주인과 세입자 모두를 보호하는 명확한 상태 기록을 만드세요.',
      step5: '문제를 전문적으로 처리',
      step5Desc: '수리, 임대 협상 또는 보증금 반환을 위한 구조화된 편지 템플릿을 사용하세요. 전문적인 커뮤니케이션은 비싼 법적 비용 없이 문제를 더 빨리 해결하는 데 도움이 됩니다.',
      next: '다음',
      back: '이전',
      finish: '시작하기',
      dontShowAgain: '다시 표시 안 함'
    },
    ru: {
      title: 'Краткое руководство',
      skipTour: 'Пропустить тур',
      step1: 'Поймите свой договор',
      step1Desc: 'Получите мгновенный AI-анализ договора аренды. Определите рискованные пункты и важные обязательства до подписания.',
      step2: 'Все отслеживается автоматически',
      step2Desc: 'Депозит, график аренды и ключевые даты извлекаются и организуются автоматически. Просто проверьте точность—создание надежной записи для обеих сторон.',
      step3: 'Отслеживайте депозит',
      step3Desc: 'Следите за суммой депозита, сроками возврата и необходимыми документами. Автоматические напоминания обеспечивают правильную обработку и прозрачный учет.',
      step4: 'Документируйте состояние недвижимости',
      step4Desc: 'Загружайте фото и видео с временными метками при въезде и выезде. Создавайте четкие записи состояния, защищающие арендодателей и арендаторов от споров.',
      step5: 'Решайте вопросы профессионально',
      step5Desc: 'Используйте структурированные шаблоны писем для ремонта, переговоров по аренде или возврата депозита. Профессиональная коммуникация помогает быстрее решать проблемы без дорогих юридических расходов.',
      next: 'Далее',
      back: 'Назад',
      finish: 'Начать',
      dontShowAgain: 'Больше не показывать'
    }
  };

  const strings = t[language] || t.en;

  const steps = [
    {
      icon: Shield,
      title: strings.step1,
      description: strings.step1Desc,
      route: createPageUrl('UploadScan')
    },
    {
      icon: Home,
      title: strings.step2,
      description: strings.step2Desc,
      route: createPageUrl('PropertyTracker')
    },
    {
      icon: Wallet,
      title: strings.step3,
      description: strings.step3Desc,
      route: createPageUrl('PropertyTracker') + '#deposit'
    },
    {
      icon: Camera,
      title: strings.step4,
      description: strings.step4Desc,
      route: createPageUrl('EvidenceVault')
    },
    {
      icon: FileText,
      title: strings.step5,
      description: strings.step5Desc,
      route: createPageUrl('Templates')
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    haptic.light();
    if (currentStep >= steps.length - 1) {
      // Final slide - close modal and go to dashboard
      handleFinish();
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    haptic.light();
    setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    haptic.light();
    handleDismiss();
  };

  const handleFinish = () => {
    haptic.medium();
    handleDismiss();
    const dashboardPath = createPageUrl('Dashboard');
    if (window.location.pathname !== dashboardPath) {
      navigate(dashboardPath);
    }
  };

  const Icon = currentStepData.icon;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        cursor: 'pointer'
      }}
      onClick={(e) => {
        e.stopPropagation();
        handleSkip();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSkip();
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          width: '360px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '80vh',
          backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '2px solid #C7A338',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease-out',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: '600',
            fontSize: '16px',
            color: isDarkMode ? '#ECEFED' : '#063F2C',
            margin: 0
          }}>
            {strings.title}
          </h2>
          <div style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: '500',
            fontSize: '13px',
            color: isDarkMode ? '#A8ABAD' : '#6B7280'
          }}>
            {currentStep + 1} of {steps.length}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSkip();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSkip();
            }}
            style={{
              background: isDarkMode ? '#374151' : '#F3F4F6',
              border: 'none',
              borderRadius: '50%',
              color: isDarkMode ? '#ECEFED' : '#374151',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              zIndex: 10000,
              flexShrink: 0
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '8px 24px 28px 24px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          overflowY: 'auto'
        }}>
          {/* Icon */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#C7A338',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(199, 163, 56, 0.25)'
          }}>
            <Icon className="w-9 h-9 text-white" />
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: '700',
            fontSize: '22px',
            color: '#0F4229',
            marginBottom: '12px',
            lineHeight: '1.3'
          }}>
            {currentStepData.title}
          </h3>

          {/* Subtitle */}
          <p style={{
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: '400',
            fontSize: '15px',
            color: isDarkMode ? '#D1D5DB' : '#444444',
            lineHeight: '1.5',
            maxWidth: '260px',
            margin: '0 auto 24px auto'
          }}>
            {currentStepData.description}
          </p>

          {/* Progress Dots */}
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentStep ? '10px' : '8px',
                  height: idx === currentStep ? '10px' : '8px',
                  borderRadius: '50%',
                  backgroundColor: idx === currentStep ? '#C7A338' : '#D1D5DB',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 24px 24px'
        }}>
          {/* Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: isDarkMode ? '#C7A338' : '#063F2C'
              }}
            />
            <span style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: '400',
              fontSize: '13px',
              color: isDarkMode ? '#A8ABAD' : '#6B7280'
            }}>
              {strings.dontShowAgain}
            </span>
          </label>

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {!isFirstStep && (
              <button
                onClick={handleBack}
                style={{
                  flex: 1,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#0F4229',
                  background: 'white',
                  border: '2px solid #0F4229',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0F4229';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#0F4229';
                }}
              >
                ← {strings.back}
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                flex: isFirstStep ? 1 : 2,
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontWeight: '600',
                fontSize: '14px',
                color: '#FFFFFF',
                backgroundColor: '#0F4229',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 24px',
                borderRadius: '12px',
                transition: 'background-color 0.2s',
                minHeight: '48px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0a2f1e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0F4229'}
            >
              {isLastStep ? strings.finish : `${strings.next} →`}
            </button>
          </div>
          
          {(!user?.plan_tier || user.plan_tier === 'free') && (
            <p className="text-xs text-center mt-3" style={{ 
              color: '#6B7280',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              <a 
                href={createPageUrl("Account") + '?showPlans=true'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  haptic.light();
                  handleDismiss();
                  navigate(createPageUrl("Account") + '?showPlans=true');
                }}
                className="font-semibold underline"
                style={{ 
                  color: '#CFAF6A',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}
              >
                {language === 'th' ? 'อัปเกรดเพื่อการปกป้องเต็มรูปแบบ →' : 
                 language === 'zh' ? '升级以获得全面保护 →' : 
                 language === 'ja' ? 'フル保護にアップグレード →' : 
                 language === 'ko' ? '전체 보호를 위해 업그레이드 →' : 
                 language === 'ru' ? 'Обновите для полной защиты →' : 
                 'Upgrade for full protection →'}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}