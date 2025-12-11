import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Shield, Wallet, FileText, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
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
      step1Desc: 'Get instant AI-powered risk analysis of your rental agreement',
      step2: 'Track your deposit',
      step2Desc: 'Never miss a return deadline with automated alerts',
      step3: 'Upload evidence',
      step3Desc: 'Store photos, receipts, and documents securely',
      step4: 'Report maintenance',
      step4Desc: 'Create timestamped maintenance requests',
      next: 'Next',
      skip: 'Skip',
      finish: 'Get Started',
      stepOf: 'Step'
    },
    th: {
      title: 'คู่มือเริ่มต้น',
      step1: 'อัปโหลดสัญญาเช่า',
      step1Desc: 'รับการวิเคราะห์ความเสี่ยงด้วย AI ทันที',
      step2: 'ติดตามเงินมัดจำ',
      step2Desc: 'ไม่พลาดกำหนดคืนเงินด้วยการแจ้งเตือนอัตโนมัติ',
      step3: 'อัปโหลดหลักฐาน',
      step3Desc: 'เก็บรูปภาพ ใบเสร็จ และเอกสารอย่างปลอดภัย',
      step4: 'รายงานการซ่อมบำรุง',
      step4Desc: 'สร้างคำขอซ่อมบำรุงพร้อมประทับเวลา',
      next: 'ถัดไป',
      skip: 'ข้าม',
      finish: 'เริ่มใช้งาน',
      stepOf: 'ขั้นตอน'
    },
    zh: {
      title: '快速指南',
      step1: '上传您的租约',
      step1Desc: '获得即时AI风险分析',
      step2: '追踪您的押金',
      step2Desc: '自动提醒，永不错过退款截止日期',
      step3: '上传证据',
      step3Desc: '安全存储照片、收据和文档',
      step4: '报告维护',
      step4Desc: '创建带时间戳的维护请求',
      next: '下一步',
      skip: '跳过',
      finish: '开始使用',
      stepOf: '步骤'
    },
    ja: {
      title: 'クイックガイド',
      step1: 'リースをアップロード',
      step1Desc: '即座にAIリスク分析を取得',
      step2: '敷金を追跡',
      step2Desc: '自動アラートで返金期限を逃さない',
      step3: '証拠をアップロード',
      step3Desc: '写真、領収書、書類を安全に保存',
      step4: 'メンテナンスを報告',
      step4Desc: 'タイムスタンプ付きメンテナンスリクエストを作成',
      next: '次へ',
      skip: 'スキップ',
      finish: '始める',
      stepOf: 'ステップ'
    },
    ko: {
      title: '빠른 가이드',
      step1: '임대 계약 업로드',
      step1Desc: '즉시 AI 위험 분석 받기',
      step2: '보증금 추적',
      step2Desc: '자동 알림으로 환불 기한을 놓치지 마세요',
      step3: '증거 업로드',
      step3Desc: '사진, 영수증 및 문서를 안전하게 저장',
      step4: '유지보수 보고',
      step4Desc: '타임스탬프가 있는 유지보수 요청 생성',
      next: '다음',
      skip: '건너뛰기',
      finish: '시작하기',
      stepOf: '단계'
    },
    ru: {
      title: 'Краткое руководство',
      step1: 'Загрузите договор',
      step1Desc: 'Получите мгновенный анализ рисков с ИИ',
      step2: 'Отслеживайте депозит',
      step2Desc: 'Не пропустите срок возврата с автоматическими напоминаниями',
      step3: 'Загрузите доказательства',
      step3Desc: 'Храните фото, чеки и документы безопасно',
      step4: 'Сообщите об обслуживании',
      step4Desc: 'Создайте запросы на обслуживание с отметкой времени',
      next: 'Далее',
      skip: 'Пропустить',
      finish: 'Начать',
      stepOf: 'Шаг'
    }
  };

  const strings = t[language] || t.en;

  const steps = [
    {
      icon: Shield,
      title: strings.step1,
      description: strings.step1Desc,
      route: createPageUrl('UploadScan'),
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
    },
    {
      icon: Wallet,
      title: strings.step2,
      description: strings.step2Desc,
      route: createPageUrl('PropertyTracker') + '#deposit',
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    {
      icon: FileText,
      title: strings.step3,
      description: strings.step3Desc,
      route: createPageUrl('EvidenceVault'),
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
    },
    {
      icon: Wrench,
      title: strings.step4,
      description: strings.step4Desc,
      route: createPageUrl('PropertyTracker') + '#maintenance',
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
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
      <Card 
        className="border-none shadow-2xl max-w-md w-full" 
        style={{ 
          backgroundColor: colors.cardBg,
          borderRadius: '20px',
          animation: 'slideIn 0.3s ease-out',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 20px 16px 20px',
          borderBottom: `1px solid ${colors.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              {strings.title}
            </h2>
            <div style={{
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: colors.fieldBg,
              fontSize: '12px',
              fontWeight: '600',
              color: colors.textSecondary
            }}>
              {currentStep + 1}/{steps.length}
            </div>
          </div>
          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent style={{ 
          padding: '32px 24px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: currentStepData.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: `0 8px 16px ${currentStepData.color}30`
          }}>
            <Icon className="w-10 h-10 text-white" />
          </div>

          <h3 className="text-xl font-bold mb-3" style={{ color: colors.textPrimary }}>
            {currentStepData.title}
          </h3>
          
          <p className="text-base leading-relaxed mb-6" style={{ 
            color: colors.textSecondary,
            maxWidth: '320px'
          }}>
            {currentStepData.description}
          </p>

          <div className="flex gap-2 mb-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentStep ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: idx === currentStep ? currentStepData.color : colors.borderColor,
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </CardContent>

        <div style={{
          padding: '16px 20px 20px 20px',
          borderTop: `1px solid ${colors.borderColor}`
        }}>
          <div className="flex items-center gap-3 mb-3">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={setDontShowAgain}
            />
            <label
              htmlFor="dont-show-again"
              className="text-xs cursor-pointer select-none"
              style={{ color: colors.textSecondary, fontWeight: '500' }}
            >
              {language === 'th' ? 'ไม่ต้องแสดงอีก' : language === 'zh' ? '不再显示' : language === 'ja' ? '今後表示しない' : language === 'ko' ? '다시 표시 안 함' : language === 'ru' ? 'Больше не показывать' : "Don't show this again"}
            </label>
          </div>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                style={{
                  borderColor: colors.borderColor,
                  color: colors.textPrimary,
                  fontWeight: '600'
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {language === 'th' ? 'ก่อนหน้า' : language === 'zh' ? '上一步' : language === 'ja' ? '戻る' : language === 'ko' ? '이전' : language === 'ru' ? 'Назад' : 'Back'}
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1"
              style={{
                background: currentStepData.gradient,
                color: '#FFFFFF',
                fontWeight: '700',
                border: 'none'
              }}
            >
              {isLastStep ? strings.finish : strings.next}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}