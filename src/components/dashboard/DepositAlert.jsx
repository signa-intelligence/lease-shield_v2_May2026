import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, DollarSign, Home, Shield } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DepositAlert({ deposits, language = 'en' }) {
  const navigate = useNavigate();
  const now = new Date();
  
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
    }
  };

  const str = strings[language];

  const getUrgencyColor = (days) => {
    if (days < 0) return { bg: '#FEE2E2', text: '#DC2626', border: '#DC2626' }; // Overdue - Red
    if (days <= 3) return { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' }; // Critical - Amber
    if (days <= 7) return { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6' }; // High - Blue
    return { bg: '#D1FAE5', text: '#047857', border: '#10B981' }; // Medium - Green
  };

  if (urgentDeposits.length === 0) {
    return (
      <Card className="border-none shadow-lg" style={{ backgroundColor: '#FFFFFF' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
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
    <Card className="border-none shadow-xl" style={{ backgroundColor: '#FFFFFF' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          {str.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentDeposits.map((deposit) => {
          const colors = getUrgencyColor(deposit.daysRemaining);
          const isOverdue = deposit.daysRemaining < 0;
          
          return (
            <div
              key={deposit.id}
              className="rounded-lg p-4 border-2 transition-all hover:shadow-md"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 flex-shrink-0" style={{ color: colors.text }} />
                    <p className="font-semibold text-sm truncate" style={{ color: colors.text }}>
                      {deposit.property_address || (language === 'th' ? 'ไม่ระบุ' : 'N/A')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: colors.text }} />
                    <p className="text-xs font-medium" style={{ color: colors.text }}>
                      {str.amount}: ฿{deposit.deposit_amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <Badge
                  className="flex-shrink-0"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    border: `2px solid ${colors.border}`,
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
                      borderColor: colors.border,
                      color: colors.text
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