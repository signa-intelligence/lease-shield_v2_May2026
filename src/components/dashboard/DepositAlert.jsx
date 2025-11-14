import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, DollarSign, Home, Shield } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getFeatureCardStyles } from '../shared/featureTheme';

export default function DepositAlert({ deposits, language = 'en' }) {
  const navigate = useNavigate();
  const now = new Date();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isDarkMode = user?.theme === 'dark';
  const theme = getFeatureCardStyles("deposits", isDarkMode);
  
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

  if (urgentDeposits.length === 0) {
    return (
      <Card 
        className="border-none shadow-lg" 
        style={{ 
          background: theme.background,
          borderLeft: `4px solid ${theme.borderLeftColor}`
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: theme.headerColor }}>
            <Calendar className="w-5 h-5 text-emerald-600" />
            {str.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="font-semibold text-emerald-700">{str.noDue}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="border-none shadow-xl" 
      style={{ 
        background: theme.background,
        borderLeft: `4px solid ${theme.borderLeftColor}`
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: theme.headerColor }}>
          <AlertCircle className="w-5 h-5 text-amber-600" />
          {str.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentDeposits.map((deposit) => {
          const isOverdue = deposit.daysRemaining < 0;
          
          return (
            <div
              key={deposit.id}
              className={isOverdue 
                ? "dashboard-card border-red-500 bg-[#FFECEC] dark:bg-[#3A1E1E] dark:border-red-400 hover:shadow-md transition-all p-4"
                : "dashboard-card border-green-600 bg-[#E6FFE9] dark:bg-[#1E3A22] dark:border-green-400 hover:shadow-md transition-all p-4"
              }
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 flex-shrink-0" style={{ color: isOverdue ? '#DC2626' : '#047857' }} />
                    <p className="font-semibold text-sm truncate" style={{ color: isOverdue ? '#DC2626' : '#047857' }}>
                      {deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : language === 'zh' ? '未指定' : language === 'ja' ? '未指定' : language === 'ko' ? '미지정' : 'N/A')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: isOverdue ? '#DC2626' : '#047857' }} />
                    <p className="text-xs font-medium" style={{ color: isOverdue ? '#DC2626' : '#047857' }}>
                      {str.amount}: ฿{deposit.deposit_amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <Badge
                  className="flex-shrink-0"
                  style={{
                    backgroundColor: isOverdue 
                      ? (isDarkMode ? '#5C2C2C' : '#FFB8B8')
                      : (isDarkMode ? '#2E5C39' : '#B8FFCC'),
                    color: isOverdue ? '#DC2626' : '#047857',
                    border: `2px solid ${isOverdue ? '#FF6B6B' : '#4CAF50'}`,
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
                      borderColor: isOverdue ? '#FF6B6B' : '#4CAF50',
                      color: isOverdue ? '#DC2626' : '#047857',
                      backgroundColor: 'transparent'
                    }}
                  >
                    {str.viewDetails}
                  </Button>
                </Link>
                
                {/* 🛡️ DEPOSIT SHIELD - Quick Action for Overdue */}
                {isOverdue && (
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-bold ls-cta-primary"
                    onClick={() => navigate(createPageUrl('ResolveCase') + `?depositId=${deposit.id}&auto=true`)}
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