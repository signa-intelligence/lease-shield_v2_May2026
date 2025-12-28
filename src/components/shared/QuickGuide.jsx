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
      step1: 'Upload your lease',
      step1Desc: 'Get instant risk analysis from a structured lease scan.',
      step2: 'Add the tenancy',
      step2Desc: 'Store tenancy details and create a secure record for both landlord and tenant.',
      step3: 'Deposit Tracker',
      step3Desc: 'Monitor deposit amounts, deadlines, and status to support fair handling for both tenants and landlords.',
      step4: 'Upload move-in evidence',
      step4Desc: 'Store time-stamped condition records to protect both parties from unfair damage claims.',
      step5: '24/7 assistance',
      step5Desc: 'Get help from Lisa, your Lease Shield assistant, or access guidance and FAQs anytime.',
      next: 'Next',
      back: 'Back',
      finish: 'Get Started',
      dontShowAgain: "Don't show this again"
    },
    th: {
      title: 'คู่มือเริ่มต้น',
      step1: 'อัปโหลดสัญญาเช่า',
      step1Desc: 'รับการวิเคราะห์ความเสี่ยงจากการสแกนสัญญาที่มีโครงสร้าง',
      step2: 'เพิ่มข้อมูลการเช่า',
      step2Desc: 'จัดเก็บรายละเอียดการเช่าและสร้างบันทึกที่ปลอดภัยสำหรับทั้งเจ้าของและผู้เช่า',
      step3: 'ติดตามเงินมัดจำ',
      step3Desc: 'ติดตามจำนวนเงินมัดจำ กำหนดเวลา และสถานะเพื่อสนับสนุนการจัดการที่เป็นธรรมสำหรับทั้งผู้เช่าและเจ้าของ',
      step4: 'อัปโหลดหลักฐานก่อนเข้าอยู่',
      step4Desc: 'จัดเก็บบันทึกสภาพที่มีประทับเวลาเพื่อปกป้องทั้งสองฝ่ายจากการเรียกร้อนค่าเสียหายที่ไม่เป็นธรรม',
      step5: 'ความช่วยเหลือตลอด 24/7',
      step5Desc: 'รับความช่วยเหลือจาก Lisa ผู้ช่วย Lease Shield ของคุณ หรือเข้าถึงคำแนะนำและ FAQ ได้ทุกเมื่อ',
      next: 'ถัดไป',
      back: 'ก่อนหน้า',
      finish: 'เริ่มใช้งาน',
      dontShowAgain: 'ไม่ต้องแสดงอีก'
    },
    zh: {
      title: '快速指南',
      step1: '上传您的租约',
      step1Desc: '从结构化租约扫描获得即时风险分析',
      step2: '添加租赁信息',
      step2Desc: '存储租赁详细信息并为房东和租户创建安全记录',
      step3: '押金追踪器',
      step3Desc: '监控押金金额、截止日期和状态，以支持租户和房东的公平处理',
      step4: '上传入住证据',
      step4Desc: '存储带时间戳的状况记录，以保护双方免受不公平损坏索赔',
      step5: '24/7 协助',
      step5Desc: '从Lisa（您的Lease Shield助手）获得帮助，或随时访问指导和FAQ',
      next: '下一步',
      back: '上一步',
      finish: '开始使用',
      dontShowAgain: '不再显示'
    },
    ja: {
      title: 'クイックガイド',
      step1: 'リースをアップロード',
      step1Desc: '構造化されたリーススキャンから即座にリスク分析を取得',
      step2: '賃貸情報を追加',
      step2Desc: '賃貸の詳細を保存し、家主とテナントの両方に安全な記録を作成',
      step3: '敷金トラッカー',
      step3Desc: '敷金の金額、期限、ステータスを監視して、テナントと家主の両方の公平な取り扱いをサポート',
      step4: '入居時の証拠をアップロード',
      step4Desc: 'タイムスタンプ付きの状態記録を保存して、両当事者を不当な損害請求から保護',
      step5: '24時間365日のサポート',
      step5Desc: 'Lisa（Lease Shieldアシスタント）からヘルプを受けるか、いつでもガイダンスとFAQにアクセス',
      next: '次へ',
      back: '戻る',
      finish: '始める',
      dontShowAgain: '今後表示しない'
    },
    ko: {
      title: '빠른 가이드',
      step1: '임대 계약 업로드',
      step1Desc: '구조화된 임대 계약 스캔에서 즉시 위험 분석 받기',
      step2: '임대 정보 추가',
      step2Desc: '임대 세부정보를 저장하고 집주인과 세입자 모두를 위한 안전한 기록 생성',
      step3: '보증금 추적기',
      step3Desc: '보증금 금액, 마감일 및 상태를 모니터링하여 세입자와 집주인 모두의 공정한 처리 지원',
      step4: '입주 증거 업로드',
      step4Desc: '타임스탬프가 있는 상태 기록을 저장하여 양 당사자를 부당한 손해 청구로부터 보호',
      step5: '24/7 지원',
      step5Desc: 'Lisa(Lease Shield 어시스턴트)로부터 도움을 받거나 언제든지 안내 및 FAQ에 액세스',
      next: '다음',
      back: '이전',
      finish: '시작하기',
      dontShowAgain: '다시 표시 안 함'
    },
    ru: {
      title: 'Краткое руководство',
      step1: 'Загрузите договор',
      step1Desc: 'Получите мгновенный анализ рисков из структурированного сканирования договора',
      step2: 'Добавьте информацию об аренде',
      step2Desc: 'Сохраните детали аренды и создайте безопасную запись для арендодателя и арендатора',
      step3: 'Трекер депозита',
      step3Desc: 'Отслеживайте суммы депозитов, сроки и статус для поддержки справедливого обращения как с арендаторами, так и с арендодателями',
      step4: 'Загрузите доказательства при въезде',
      step4Desc: 'Сохраняйте записи состояния с временными метками, чтобы защитить обе стороны от несправедливых претензий на возмещение ущерба',
      step5: 'Помощь 24/7',
      step5Desc: 'Получайте помощь от Lisa, вашего помощника Lease Shield, или получайте доступ к руководству и FAQ в любое время',
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
          backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
          borderRadius: '16px',
          boxShadow: isDarkMode ? '0px 8px 24px rgba(0,0,0,0.6)' : '0px 8px 24px rgba(0,0,0,0.12)',
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
            color: isDarkMode ? '#ECEFED' : '#063F2C',
            margin: 0
          }}>
            {strings.title}
          </h2>
          <div style={{
            fontFamily: 'Inter',
            fontWeight: '500',
            fontSize: '13px',
            color: isDarkMode ? '#A8ABAD' : '#6B7280'
          }}>
            {currentStep + 1} of {steps.length}
          </div>
          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#A8ABAD' : '#6B7280',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = isDarkMode ? '#ECEFED' : '#111827'}
            onMouseLeave={(e) => e.currentTarget.style.color = isDarkMode ? '#A8ABAD' : '#6B7280'}
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
            backgroundColor: isDarkMode ? '#0C3B2E' : '#063F2C',
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
            color: isDarkMode ? '#ECEFED' : '#063F2C',
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
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: idx === currentStep ? (isDarkMode ? '#C7A338' : '#063F2C') : (isDarkMode ? '#4B5563' : '#D7D7D7'),
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
                accentColor: isDarkMode ? '#C7A338' : '#063F2C'
              }}
            />
            <span style={{
              fontFamily: 'Inter',
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
                  fontFamily: 'Inter',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: isDarkMode ? '#ECEFED' : '#063F2C',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '12px',
                  transition: 'background-color 0.2s',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#3A3D40' : '#F3F4F6'}
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
                backgroundColor: isDarkMode ? '#0C3B2E' : '#063F2C',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 24px',
                borderRadius: '12px',
                transition: 'background-color 0.2s',
                minHeight: '48px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#0a2f25' : '#084D38'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#0C3B2E' : '#063F2C'}
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