import React, { useState } from 'react';
import { X, Shield, Home, Wallet, FileText, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { haptic } from './HapticFeedback';

export default function QuickGuide({ user, onDismiss, colors, language = 'en', isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

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
      step1: 'Upload your lease',
      step1Desc: 'Get instant AI-powered risk analysis of your rental agreement.',
      step2: 'Add your property',
      step2Desc: 'Store your property details and create a secure record of your tenancy.',
      step3: 'Track your deposit',
      step3Desc: 'Never lose your money again. We track all deposit deadlines automatically.',
      step4: 'Upload move-in evidence',
      step4Desc: 'Protect yourself from unfair charges with time-stamped condition records.',
      step5: 'Get help anytime',
      step5Desc: 'Chat with Lisa, your rental-law assistant, or browse FAQs instantly.',
      next: 'Next',
      back: 'Back',
      finish: 'Get Started',
      dontShowAgain: "Don't show this again"
    },
    th: {
      title: 'คู่มือเริ่มต้น',
      step1: 'อัปโหลดสัญญาเช่า',
      step1Desc: 'รับการวิเคราะห์ความเสี่ยงด้วย AI ทันที',
      step2: 'เพิ่มข้อมูลทรัพย์สิน',
      step2Desc: 'จัดเก็บรายละเอียดทรัพย์สินและสร้างบันทึกการเช่าที่ปลอดภัย',
      step3: 'ติดตามเงินมัดจำ',
      step3Desc: 'ไม่สูญเสียเงินของคุณอีกต่อไป เราติดตามกำหนดเวลาทั้งหมดโดยอัตโนมัติ',
      step4: 'อัปโหลดหลักฐานก่อนเข้าอยู่',
      step4Desc: 'ปกป้องตัวเองจากค่าใช้จ่ายที่ไม่เป็นธรรมด้วยบันทึกสภาพที่มีประทับเวลา',
      step5: 'รับความช่วยเหลือทุกเมื่อ',
      step5Desc: 'สนทนากับ Lisa ผู้ช่วยด้านกฎหมายการเช่า หรือค้นหา FAQ ได้ทันที',
      next: 'ถัดไป',
      back: 'ก่อนหน้า',
      finish: 'เริ่มใช้งาน',
      dontShowAgain: 'ไม่ต้องแสดงอีก'
    },
    zh: {
      title: '快速指南',
      step1: '上传您的租约',
      step1Desc: '获得即时AI风险分析',
      step2: '添加您的房产',
      step2Desc: '存储您的房产详细信息并创建安全的租赁记录',
      step3: '追踪您的押金',
      step3Desc: '再也不会丢失您的钱。我们自动追踪所有押金截止日期',
      step4: '上传入住证据',
      step4Desc: '用带时间戳的状况记录保护自己免受不公平收费',
      step5: '随时获得帮助',
      step5Desc: '与Lisa（您的租赁法律助手）聊天，或即时浏览FAQ',
      next: '下一步',
      back: '上一步',
      finish: '开始使用',
      dontShowAgain: '不再显示'
    },
    ja: {
      title: 'クイックガイド',
      step1: 'リースをアップロード',
      step1Desc: '即座にAIリスク分析を取得',
      step2: '物件を追加',
      step2Desc: '物件の詳細を保存し、安全な賃貸記録を作成',
      step3: '敷金を追跡',
      step3Desc: 'もうお金を失うことはありません。すべての敷金期限を自動追跡',
      step4: '入居時の証拠をアップロード',
      step4Desc: 'タイムスタンプ付きの状態記録で不当な請求から身を守る',
      step5: 'いつでもヘルプを受ける',
      step5Desc: 'Lisa（賃貸法アシスタント）とチャット、またはFAQを即座に参照',
      next: '次へ',
      back: '戻る',
      finish: '始める',
      dontShowAgain: '今後表示しない'
    },
    ko: {
      title: '빠른 가이드',
      step1: '임대 계약 업로드',
      step1Desc: '즉시 AI 위험 분석 받기',
      step2: '부동산 추가',
      step2Desc: '부동산 세부정보를 저장하고 안전한 임대 기록 생성',
      step3: '보증금 추적',
      step3Desc: '더 이상 돈을 잃지 마세요. 모든 보증금 마감일을 자동 추적합니다',
      step4: '입주 증거 업로드',
      step4Desc: '타임스탬프가 있는 상태 기록으로 부당한 요금으로부터 자신을 보호하세요',
      step5: '언제든지 도움받기',
      step5Desc: 'Lisa（임대법 도우미）와 채팅하거나 FAQ를 즉시 찾아보세요',
      next: '다음',
      back: '이전',
      finish: '시작하기',
      dontShowAgain: '다시 표시 안 함'
    },
    ru: {
      title: 'Краткое руководство',
      step1: 'Загрузите договор',
      step1Desc: 'Получите мгновенный анализ рисков с ИИ',
      step2: 'Добавьте недвижимость',
      step2Desc: 'Сохраните данные недвижимости и создайте безопасную запись аренды',
      step3: 'Отслеживайте депозит',
      step3Desc: 'Больше не теряйте деньги. Мы автоматически отслеживаем все сроки депозита',
      step4: 'Загрузите доказательства при въезде',
      step4Desc: 'Защитите себя от несправедливых обвинений с помощью записей состояния с отметкой времени',
      step5: 'Получайте помощь в любое время',
      step5Desc: 'Общайтесь с Lisa, вашим помощником по законам об аренде, или просматривайте FAQ мгновенно',
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
      icon: FileText,
      title: strings.step4,
      description: strings.step4Desc,
      route: createPageUrl('EvidenceVault')
    },
    {
      icon: HelpCircle,
      title: strings.step5,
      description: strings.step5Desc,
      route: createPageUrl('Dashboard')
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    haptic.light();
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep(currentStep + 1);
    }
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
    if (currentStepData.route) {
      navigate(currentStepData.route);
    }
    handleDismiss();
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={handleSkip}
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
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0px 8px 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease-out',
          fontFamily: 'Inter, -apple-system, sans-serif'
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
            fontFamily: 'Inter',
            fontWeight: '600',
            fontSize: '16px',
            color: '#063F2C',
            margin: 0
          }}>
            {strings.title}
          </h2>
          <div style={{
            fontFamily: 'Inter',
            fontWeight: '500',
            fontSize: '13px',
            color: '#6B7280'
          }}>
            {currentStep + 1} of {steps.length}
          </div>
          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
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
            backgroundColor: '#063F2C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            flexShrink: 0
          }}>
            <Icon className="w-9 h-9 text-white" />
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: 'Inter',
            fontWeight: '600',
            fontSize: '20px',
            color: '#063F2C',
            marginBottom: '12px',
            lineHeight: '1.3'
          }}>
            {currentStepData.title}
          </h3>

          {/* Subtitle */}
          <p style={{
            fontFamily: 'Inter',
            fontWeight: '400',
            fontSize: '15px',
            color: '#444444',
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
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: idx === currentStep ? '#063F2C' : '#D7D7D7',
                  transition: 'background-color 0.2s ease'
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
                accentColor: '#063F2C'
              }}
            />
            <span style={{
              fontFamily: 'Inter',
              fontWeight: '400',
              fontSize: '13px',
              color: '#6B7280'
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
                  fontFamily: 'Inter',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#063F2C',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '12px',
                  transition: 'background-color 0.2s',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ← {strings.back}
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                flex: isFirstStep ? 1 : 2,
                fontFamily: 'Inter',
                fontWeight: '600',
                fontSize: '14px',
                color: '#FFFFFF',
                backgroundColor: '#063F2C',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 24px',
                borderRadius: '12px',
                transition: 'background-color 0.2s',
                minHeight: '48px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#084D38'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#063F2C'}
            >
              {isLastStep ? strings.finish : `${strings.next} →`}
            </button>
          </div>
          
          {(!user?.plan_tier || user.plan_tier === 'free') && (
            <p className="text-xs text-center mt-3" style={{ color: '#6B7280' }}>
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
                style={{ color: '#CFAF6A' }}
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