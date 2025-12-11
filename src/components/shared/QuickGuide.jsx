import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Shield, Wallet, FileText, Wrench, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function QuickGuide({ user, onDismiss, colors, language = 'en', isOpen, onClose }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
      subtitle: 'Get started with LeaseShield in 4 easy steps',
      step1: 'Upload your lease',
      step1Desc: 'Get instant AI-powered risk analysis',
      step2: 'Track your deposit',
      step2Desc: 'Never miss a return deadline',
      step3: 'Upload evidence',
      step3Desc: 'Store photos, receipts, and documents',
      step4: 'Report maintenance',
      step4Desc: 'Create timestamped maintenance requests',
      dismiss: 'Got it, thanks!'
    },
    th: {
      title: 'คู่มือเริ่มต้น',
      subtitle: 'เริ่มใช้ LeaseShield ใน 4 ขั้นตอนง่ายๆ',
      step1: 'อัปโหลดสัญญาเช่า',
      step1Desc: 'รับการวิเคราะห์ความเสี่ยงด้วย AI ทันที',
      step2: 'ติดตามเงินมัดจำ',
      step2Desc: 'ไม่พลาดกำหนดคืนเงิน',
      step3: 'อัปโหลดหลักฐาน',
      step3Desc: 'เก็บรูปภาพ ใบเสร็จ และเอกสาร',
      step4: 'รายงานการซ่อมบำรุง',
      step4Desc: 'สร้างคำขอซ่อมบำรุงพร้อมประทับเวลา',
      dismiss: 'เข้าใจแล้ว ขอบคุณ!'
    },
    zh: {
      title: '快速指南',
      subtitle: '通过4个简单步骤开始使用LeaseShield',
      step1: '上传您的租约',
      step1Desc: '获得即时AI风险分析',
      step2: '追踪您的押金',
      step2Desc: '永不错过退款截止日期',
      step3: '上传证据',
      step3Desc: '存储照片、收据和文档',
      step4: '报告维护',
      step4Desc: '创建带时间戳的维护请求',
      dismiss: '明白了，谢谢！'
    },
    ja: {
      title: 'クイックガイド',
      subtitle: '4つの簡単なステップでLeaseShieldを始める',
      step1: 'リースをアップロード',
      step1Desc: '即座にAIリスク分析を取得',
      step2: '敷金を追跡',
      step2Desc: '返金期限を逃さない',
      step3: '証拠をアップロード',
      step3Desc: '写真、領収書、書類を保存',
      step4: 'メンテナンスを報告',
      step4Desc: 'タイムスタンプ付きメンテナンスリクエストを作成',
      dismiss: 'わかりました、ありがとう！'
    },
    ko: {
      title: '빠른 가이드',
      subtitle: '4가지 간단한 단계로 LeaseShield 시작하기',
      step1: '임대 계약 업로드',
      step1Desc: '즉시 AI 위험 분석 받기',
      step2: '보증금 추적',
      step2Desc: '환불 기한을 놓치지 마세요',
      step3: '증거 업로드',
      step3Desc: '사진, 영수증 및 문서 저장',
      step4: '유지보수 보고',
      step4Desc: '타임스탬프가 있는 유지보수 요청 생성',
      dismiss: '알겠습니다, 감사합니다!'
    },
    ru: {
      title: 'Краткое руководство',
      subtitle: 'Начните с LeaseShield за 4 простых шага',
      step1: 'Загрузите договор',
      step1Desc: 'Получите мгновенный анализ рисков с ИИ',
      step2: 'Отслеживайте депозит',
      step2Desc: 'Не пропустите срок возврата',
      step3: 'Загрузите доказательства',
      step3Desc: 'Храните фото, чеки и документы',
      step4: 'Сообщите об обслуживании',
      step4Desc: 'Создайте запросы на обслуживание с отметкой времени',
      dismiss: 'Понятно, спасибо!'
    }
  };

  const strings = t[language] || t.en;

  const steps = [
    {
      icon: Shield,
      title: strings.step1,
      description: strings.step1Desc,
      route: createPageUrl('UploadScan'),
      color: '#3B82F6'
    },
    {
      icon: Wallet,
      title: strings.step2,
      description: strings.step2Desc,
      route: createPageUrl('PropertyTracker') + '#deposit',
      color: '#10B981'
    },
    {
      icon: FileText,
      title: strings.step3,
      description: strings.step3Desc,
      route: createPageUrl('EvidenceVault'),
      color: '#8B5CF6'
    },
    {
      icon: Wrench,
      title: strings.step4,
      description: strings.step4Desc,
      route: createPageUrl('PropertyTracker') + '#maintenance',
      color: '#F59E0B'
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={handleDismiss}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(-20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <Card 
        className="border-none shadow-2xl max-w-lg w-full" 
        style={{ 
          backgroundColor: colors.cardBg,
          borderRadius: '16px',
          animation: 'modalSlideIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.title}
              </CardTitle>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {strings.subtitle}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                color: colors.textSecondary,
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
                e.currentTarget.style.color = colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Link key={idx} to={step.route} onClick={handleDismiss}>
                <div
                  className="p-5 rounded-xl transition-all cursor-pointer"
                  style={{
                    backgroundColor: colors.fieldBg,
                    border: `2px solid ${colors.borderColor}`,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = step.color;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 8px 16px ${step.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: step.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: `${step.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <Icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: colors.textPrimary }}>
                    {step.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
                    {step.description}
                  </p>
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: step.color,
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {language === 'th' ? 'เริ่มต้น' : language === 'zh' ? '开始' : language === 'ja' ? '始める' : language === 'ko' ? '시작하기' : language === 'ru' ? 'Начать' : 'Get started'} →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={setDontShowAgain}
            />
            <label
              htmlFor="dont-show-again"
              className="text-sm cursor-pointer select-none"
              style={{ color: colors.textSecondary, fontWeight: '500' }}
            >
              {language === 'th' ? 'ไม่ต้องแสดงอีก' : language === 'zh' ? '不再显示' : language === 'ja' ? '今後表示しない' : language === 'ko' ? '다시 표시 안 함' : language === 'ru' ? 'Больше не показывать' : "Don't show this again"}
            </label>
          </div>
          <Button
            onClick={handleDismiss}
            className="w-full"
            style={{ 
              backgroundColor: '#0C3B2E',
              color: '#FFFFFF',
              fontWeight: '700',
              padding: '12px 32px',
              borderRadius: '12px',
              fontSize: '15px'
            }}
          >
            {strings.dismiss}
          </Button>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}