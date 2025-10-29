import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";

export default function DepositAlert({ deposits, language }) {
  const t = {
    en: {
      title: "Deposit Alerts",
      noDeposits: "No deposits tracked",
      trackPrompt: "Start tracking your security deposits",
      daysLeft: "days left",
      overdue: "overdue",
      returned: "returned"
    },
    th: {
      title: "แจ้งเตือนเงินมัดจำ",
      noDeposits: "ไม่มีเงินมัดจำที่ติดตาม",
      trackPrompt: "เริ่มติดตามเงินประกันของคุณ",
      daysLeft: "วันเหลือ",
      overdue: "เกินกำหนด",
      returned: "คืนแล้ว"
    }
  };

  const strings = t[language] || t.en;

  const activeDeposits = deposits
    .filter(d => d.status === 'tracking')
    .sort((a, b) => {
      const aDays = differenceInDays(new Date(a.expected_return_date), new Date());
      const bDays = differenceInDays(new Date(b.expected_return_date), new Date());
      return aDays - bDays;
    });

  const getUrgencyColor = (daysRemaining) => {
    if (daysRemaining < 0) return '#EF4444';
    if (daysRemaining <= 7) return '#F59E0B';
    if (daysRemaining <= 30) return '#EAB308';
    return '#10B981';
  };

  return (
    <Card className="border-none shadow-lg" style={{
      background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.98), rgba(236, 239, 237, 0.98))',
      border: '1px solid rgba(199, 163, 56, 0.2)'
    }}>
      <CardHeader className="border-b" style={{
        background: 'linear-gradient(to right, rgba(199, 163, 56, 0.1), rgba(199, 163, 56, 0.05))',
        borderBottom: '1px solid rgba(199, 163, 56, 0.2)'
      }}>
        <CardTitle className="flex items-center gap-2" style={{ color: '#0C3B2E' }}>
          <AlertTriangle className="w-5 h-5 text-ls-gold" />
          {strings.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {activeDeposits.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: '#C7A338', opacity: 0.5 }} />
            <p className="font-semibold mb-1" style={{ color: '#0C3B2E' }}>{strings.noDeposits}</p>
            <p className="text-sm" style={{ color: '#065f46', opacity: 0.8 }}>{strings.trackPrompt}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDeposits.slice(0, 3).map((deposit) => {
              const daysRemaining = differenceInDays(new Date(deposit.expected_return_date), new Date());
              const urgencyColor = getUrgencyColor(daysRemaining);
              
              return (
                <div 
                  key={deposit.id}
                  className="p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(236, 239, 237, 0.6))',
                    border: `1px solid ${urgencyColor}40`,
                    borderLeft: `4px solid ${urgencyColor}`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg" style={{ color: '#0C3B2E' }}>
                      ฿{deposit.deposit_amount.toLocaleString()}
                    </span>
                    <Badge 
                      style={{
                        backgroundColor: `${urgencyColor}20`,
                        color: urgencyColor,
                        border: `1px solid ${urgencyColor}40`,
                        fontWeight: '600'
                      }}
                    >
                      {daysRemaining < 0 
                        ? `${Math.abs(daysRemaining)} ${strings.overdue}` 
                        : `${daysRemaining} ${strings.daysLeft}`}
                    </Badge>
                  </div>
                  {deposit.property_address && (
                    <p className="text-sm mb-1" style={{ color: '#065f46' }}>{deposit.property_address}</p>
                  )}
                  <p className="text-xs" style={{ color: '#065f46', opacity: 0.7 }}>
                    Return: {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}