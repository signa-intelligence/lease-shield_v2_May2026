import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Shield, Wallet, FileText, Wrench, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickGuide({ user, onDismiss, colors, language = 'en' }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
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
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
              {strings.title}
            </CardTitle>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {strings.subtitle}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Link key={idx} to={step.route}>
                <div
                  className="p-4 rounded-lg transition-all cursor-pointer"
                  style={{
                    backgroundColor: colors.fieldBg,
                    border: `2px solid ${colors.borderColor}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = step.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${step.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: step.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1" style={{ color: colors.textPrimary }}>
                        {step.title}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {step.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.textSecondary }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            style={{ color: colors.textSecondary }}
          >
            {strings.dismiss}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}