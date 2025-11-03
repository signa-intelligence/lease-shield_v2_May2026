
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function DepositAlert({ deposits, language }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    urgentBg: '#3A2626',
    alertBg: '#353A3D'
  } : {
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    urgentBg: '#FEE2E2',
    alertBg: '#FFF7ED'
  };

  const now = new Date();
  const urgentDeposits = deposits.filter(d => {
    const daysRemaining = differenceInDays(new Date(d.expected_return_date), now);
    return daysRemaining <= 30 && daysRemaining > 0 && d.status === 'tracking';
  }).sort((a, b) => {
    const daysA = differenceInDays(new Date(a.expected_return_date), now);
    const daysB = differenceInDays(new Date(b.expected_return_date), now);
    return daysA - daysB;
  });

  const t = {
    en: {
      depositAlerts: "Deposit Alerts",
      daysRemaining: "days remaining",
      noAlerts: "No Urgent Alerts",
      allGood: "All deposits are well tracked"
    },
    th: {
      depositAlerts: "การแจ้งเตือนเงินมัดจำ",
      daysRemaining: "วันคงเหลือ",
      noAlerts: "ไม่มีการแจ้งเตือนเร่งด่วน",
      allGood: "เงินมัดจำทั้งหมดได้รับการติดตามอย่างดี"
    }
  };

  const strings = t[language] || t.en;

  return (
    <Card className="border-none shadow-lg h-full flex flex-col" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader className="pb-4" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          {strings.depositAlerts}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {urgentDeposits.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>{strings.noAlerts}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.allGood}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgentDeposits.map((deposit) => {
              const daysRemaining = differenceInDays(new Date(deposit.expected_return_date), now);
              const isVeryUrgent = daysRemaining <= 7;
              
              return (
                <div
                  key={deposit.id}
                  className="p-4 rounded-xl border-l-4"
                  style={{
                    backgroundColor: isVeryUrgent ? colors.urgentBg : colors.alertBg,
                    borderLeftColor: isVeryUrgent ? '#EF4444' : '#F59E0B'
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-sm mb-1" style={{ color: colors.textPrimary }}>
                        ฿{deposit.deposit_amount.toLocaleString()}
                      </p>
                      {deposit.property_address && (
                        <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                          {deposit.property_address}
                        </p>
                      )}
                    </div>
                    <Badge className={`flex-shrink-0 text-xs ${
                      isVeryUrgent 
                        ? 'bg-red-100 text-red-800 border-red-200' 
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    } border`}>
                      {daysRemaining} {strings.daysRemaining}
                    </Badge>
                  </div>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'คืนเงิน' : 'Return'}: {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}
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
