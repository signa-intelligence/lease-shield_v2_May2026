import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Clock, Calendar } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function DepositAlert({ deposits, language }) {
  const t = {
    en: {
      title: "Deposit Alerts",
      noDeposits: "No Deposits",
      noDepositsDesc: "Track your security deposits to get return reminders",
      daysLeft: "days left",
      overdue: "Overdue",
      returnDate: "Return Date",
      amount: "Amount"
    },
    th: {
      title: "การแจ้งเตือนเงินมัดจำ",
      noDeposits: "ไม่มีเงินมัดจำ",
      noDepositsDesc: "ติดตามเงินมัดจำของคุณเพื่อรับการแจ้งเตือนการคืนเงิน",
      daysLeft: "วันที่เหลือ",
      overdue: "เกินกำหนด",
      returnDate: "วันที่คืน",
      amount: "จำนวนเงิน"
    }
  };

  const strings = t[language] || t.en;

  const activeDeposits = deposits.filter(d => d.status === 'tracking').sort((a, b) => {
    const daysA = differenceInDays(new Date(a.expected_return_date), new Date());
    const daysB = differenceInDays(new Date(b.expected_return_date), new Date());
    return daysA - daysB;
  });

  const urgentDeposits = activeDeposits.filter(d => {
    const daysRemaining = differenceInDays(new Date(d.expected_return_date), new Date());
    return daysRemaining <= 30;
  });

  return (
    <Card className="border-none shadow-xl" style={{
      background: urgentDeposits.length > 0 
        ? 'linear-gradient(135deg, rgba(255, 237, 213, 0.95), rgba(254, 243, 199, 0.95))'
        : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: urgentDeposits.length > 0 
        ? '2px solid rgba(245, 158, 11, 0.4)'
        : '2px solid rgba(199, 163, 56, 0.2)',
      boxShadow: urgentDeposits.length > 0
        ? '0 8px 24px rgba(245, 158, 11, 0.25)'
        : '0 8px 24px rgba(12, 59, 46, 0.15)'
    }}>
      <CardHeader className="border-b" style={{
        background: urgentDeposits.length > 0
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.15))'
          : 'linear-gradient(135deg, rgba(12, 59, 46, 0.05), rgba(199, 163, 56, 0.05))',
        borderBottom: urgentDeposits.length > 0
          ? '2px solid rgba(245, 158, 11, 0.3)'
          : '2px solid rgba(199, 163, 56, 0.2)'
      }}>
        <CardTitle className="flex items-center gap-2">
          <div style={{
            width: '36px',
            height: '36px',
            background: urgentDeposits.length > 0
              ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
              : 'linear-gradient(135deg, #0C3B2E, #1a5241)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: urgentDeposits.length > 0
              ? '0 4px 12px rgba(245, 158, 11, 0.4)'
              : '0 4px 12px rgba(12, 59, 46, 0.3)',
            border: '2px solid rgba(199, 163, 56, 0.3)'
          }}>
            {urgentDeposits.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : (
              <Shield className="w-5 h-5 text-ls-gold" />
            )}
          </div>
          <span style={{
            background: urgentDeposits.length > 0
              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
              : 'linear-gradient(135deg, #0C3B2E, #C7A338)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 'bold',
            fontSize: '20px'
          }}>
            {strings.title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {activeDeposits.length === 0 ? (
          <div className="text-center py-8">
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(12, 59, 46, 0.1), rgba(199, 163, 56, 0.1))',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed rgba(199, 163, 56, 0.3)'
            }}>
              <Shield className="w-8 h-8" style={{ color: '#C7A338', opacity: 0.6 }} />
            </div>
            <h4 className="font-bold mb-1" style={{ color: '#0C3B2E' }}>
              {strings.noDeposits}
            </h4>
            <p className="text-sm" style={{ color: '#1a5241', opacity: 0.8 }}>
              {strings.noDepositsDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgentDeposits.slice(0, 3).map((deposit) => {
              const daysRemaining = differenceInDays(new Date(deposit.expected_return_date), new Date());
              const isOverdue = daysRemaining < 0;
              
              return (
                <div 
                  key={deposit.id}
                  className="p-4 rounded-xl"
                  style={{
                    background: isOverdue
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))'
                      : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(251, 191, 36, 0.08))',
                    border: isOverdue
                      ? '2px solid rgba(239, 68, 68, 0.3)'
                      : '2px solid rgba(245, 158, 11, 0.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg mb-1" style={{ color: '#0C3B2E' }}>
                        ฿{deposit.deposit_amount.toLocaleString()}
                      </p>
                      {deposit.property_address && (
                        <p className="text-xs" style={{ color: '#1a5241', opacity: 0.8 }}>
                          {deposit.property_address}
                        </p>
                      )}
                    </div>
                    <Badge style={{
                      backgroundColor: isOverdue ? '#FEE2E2' : '#FEF3C7',
                      color: isOverdue ? '#DC2626' : '#D97706',
                      border: isOverdue ? '2px solid #FCA5A5' : '2px solid #FCD34D',
                      fontWeight: '700',
                      padding: '4px 10px'
                    }}>
                      <Clock className="w-3 h-3 mr-1" />
                      {isOverdue ? strings.overdue : `${daysRemaining} ${strings.daysLeft}`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#1a5241', opacity: 0.8 }}>
                    <Calendar className="w-3 h-3" />
                    <span className="font-semibold">{strings.returnDate}:</span>
                    {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}