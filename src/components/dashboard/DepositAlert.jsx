import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, DollarSign, Home, Shield } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DepositAlert({ deposits, language = 'en', colors }) {
  const navigate = useNavigate();
  const now = new Date();
  
  const cardColors = colors || {
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    bg: '#F8FAFC'
  };

  const isDarkMode = cardColors.bg === '#1A1D1F';
  
  const activeDeposits = deposits.filter(d => d.status === 'tracking');
  
  // Find deposits that are overdue or due soon
  const urgentDeposits = activeDeposits
    .map(d => {
      if (!d.expected_return_date) return null;
      const returnDate = new Date(d.expected_return_date);
      const daysRemaining = differenceInDays(returnDate, now);
      return { ...d, daysRemaining };
    })
    .filter(d => d && d.daysRemaining <= 30)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const strings = {
    en: {
      title: "Deposit Alerts",
      noDue: "All deposits on track",
      dueIn: "Due in",
      overdue: "Overdue by",
      days: "days",
      amount: "Amount",
      viewDetails: "View Details",
      openCase: "🛡️ Open Case Now",
      depositShield: "Deposit Shield Ready"
    },
    th: {
      title: "แจ้งเตือนเงินมัดจำ",
      noDue: "เงินมัดจำทั้งหมดอยู่ในระยะ",
      dueIn: "เหลืออีก",
      overdue: "เกินมา",
      days: "วัน",
      amount: "จำนวน",
      viewDetails: "ดูรายละเอียด",
      openCase: "🛡️ เปิดคดีเลย",
      depositShield: "Deposit Shield พร้อมช่วย"
    },
    zh: {
      title: "押金提醒",
      noDue: "所有押金都在正常追踪中",
      dueIn: "还剩",
      overdue: "逾期",
      days: "天",
      amount: "金额",
      viewDetails: "查看详情",
      openCase: "🛡️ 立即开启案件",
      depositShield: "押金盾已准备就绪"
    },
    ja: {
      title: "敷金アラート",
      noDue: "すべての敷金が予定通り",
      dueIn: "あと",
      overdue: "延滞",
      days: "日",
      amount: "金額",
      viewDetails: "詳細を見る",
      openCase: "🛡️ 今すぐケースを開く",
      depositShield: "敷金シールド準備完了"
    },
    ko: {
      title: "보증금 알림",
      noDue: "모든 보증금이 정상 추적 중",
      dueIn: "남은 기간",
      overdue: "연체",
      days: "일",
      amount: "금액",
      viewDetails: "세부 정보 보기",
      openCase: "🛡️ 지금 사례 열기",
      depositShield: "보증금 실드 준비 완료"
    }
  };

  const str = strings[language] || strings.en;

  const getUrgencyColor = (days) => {
    if (days < 0) {
      // Overdue - Red
      return isDarkMode 
        ? { bg: '#7F1D1D', text: '#FCA5A5', border: '#DC2626' }
        : { bg: '#FEE2E2', text: '#DC2626', border: '#DC2626' };
    }
    if (days <= 3) {
      // Critical - Amber
      return isDarkMode
        ? { bg: '#78350F', text: '#FCD34D', border: '#F59E0B' }
        : { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' };
    }
    if (days <= 7) {
      // High - Blue
      return isDarkMode
        ? { bg: '#1E3A8A', text: '#93C5FD', border: '#3B82F6' }
        : { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6' };
    }
    // Medium - Green
    return isDarkMode
      ? { bg: '#064E3B', text: '#6EE7B7', border: '#10B981' }
      : { bg: '#D1FAE5', text: '#047857', border: '#10B981' };
  };

  if (urgentDeposits.length === 0) {
    return (
      <Card className="border-none shadow-lg" style={{ backgroundColor: cardColors.cardBg }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: cardColors.textPrimary }}>
            <Calendar className="w-5 h-5 text-emerald-600" />
            {str.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{
              backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5'
            }}
          >
            <Calendar className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="font-semibold text-emerald-700">{str.noDue}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: cardColors.cardBg }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: cardColors.textPrimary }}>
          <AlertCircle className="w-5 h-5 text-amber-600" />
          {str.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentDeposits.map((deposit) => {
          const urgencyColors = getUrgencyColor(deposit.daysRemaining);
          const isOverdue = deposit.daysRemaining < 0;
          
          return (
            <div
              key={deposit.id}
              className="rounded-lg p-4 border-2 transition-all hover:shadow-md"
              style={{
                backgroundColor: urgencyColors.bg,
                borderColor: urgencyColors.border
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 flex-shrink-0" style={{ color: urgencyColors.text }} />
                    <p className="font-semibold text-sm truncate" style={{ color: urgencyColors.text }}>
                      {deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : language === 'zh' ? '未指定' : language === 'ja' ? '未指定' : language === 'ko' ? '미지정' : 'N/A')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: urgencyColors.text }} />
                    <p className="text-xs font-medium" style={{ color: urgencyColors.text }}>
                      {str.amount}: ฿{deposit.deposit_amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <Badge
                  className="flex-shrink-0"
                  style={{
                    backgroundColor: urgencyColors.bg,
                    color: urgencyColors.text,
                    border: `2px solid ${urgencyColors.border}`,
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}
                >
                  {isOverdue 
                    ? `${str.overdue} ${Math.abs(deposit.daysRemaining)} ${str.days}`
                    : `${str.dueIn} ${deposit.daysRemaining} ${str.days}`
                  }
                </Badge>
              </div>

              <div className="flex gap-2">
                <Link to={createPageUrl("DepositTracker")} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    style={{
                      borderColor: urgencyColors.border,
                      color: urgencyColors.text,
                      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)'
                    }}
                  >
                    {str.viewDetails}
                  </Button>
                </Link>
                
                {/* 🛡️ DEPOSIT SHIELD - Quick Action for Overdue */}
                {isOverdue && (
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-bold"
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none'
                    }}
                    onClick={() => navigate(createPageUrl('ResolveCase') + `?depositId=${deposit.id}&auto=true`)}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#B91C1C';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#DC2626';
                    }}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {str.openCase}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}