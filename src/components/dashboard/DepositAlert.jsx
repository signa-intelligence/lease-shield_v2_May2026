import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function DepositAlert({ deposits, language }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isDarkMode = user?.theme === 'dark';

  const colors = {
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    urgentBg: isDarkMode ? '#3A2626' : '#FEF2F2',
    safeBg: isDarkMode ? '#1E4435' : '#ECFDF5'
  };

  const t = {
    en: {
      depositAlerts: "Deposit Alerts",
      urgentReturn: "Urgent Return",
      daysRemaining: "days remaining",
      allClear: "All Clear",
      depositsTracked: "All deposits tracked properly",
      dueDate: "Due",
      viewDetails: "View Details"
    },
    th: {
      depositAlerts: "การแจ้งเตือนเงินมัดจำ",
      urgentReturn: "ครบกำหนดเร็วๆ นี้",
      daysRemaining: "วันที่เหลือ",
      allClear: "ทุกอย่างปลอดภัย",
      depositsTracked: "เงินมัดจำทั้งหมดถูกติดตามอย่างถูกต้อง",
      dueDate: "ครบกำหนด",
      viewDetails: "ดูรายละเอียด"
    }
  };

  const strings = t[language];

  const now = new Date();
  const urgentDeposits = deposits
    .filter(d => {
      if (!d.expected_return_date || d.status !== 'tracking') return false;
      const daysRemaining = differenceInDays(new Date(d.expected_return_date), now);
      return daysRemaining <= 30 && daysRemaining > 0;
    })
    .sort((a, b) => new Date(a.expected_return_date) - new Date(b.expected_return_date));

  return (
    <Card 
      className="border-none" 
      style={{ 
        backgroundColor: colors.cardBg,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '16px'
      }}
    >
      <CardHeader className="pb-4" style={{ 
        borderBottom: `1px solid ${colors.borderColor}`,
        backgroundColor: isDarkMode ? '#353A3D' : '#F9FAFB',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px'
      }}>
        <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Shield className="w-5 h-5 text-ls-gold" />
          {strings.depositAlerts}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {urgentDeposits.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
              }}
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
              {strings.allClear}
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {strings.depositsTracked}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgentDeposits.slice(0, 3).map((deposit) => {
              const daysRemaining = differenceInDays(new Date(deposit.expected_return_date), now);
              const isVeryUrgent = daysRemaining <= 7;

              return (
                <Link key={deposit.id} to={createPageUrl("DepositTracker")}>
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: isVeryUrgent ? colors.urgentBg : colors.safeBg,
                      border: `2px solid ${isVeryUrgent ? '#EF4444' : '#10B981'}`,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`w-4 h-4 ${isVeryUrgent ? 'text-red-600' : 'text-amber-600'}`} />
                          <span className="text-xs font-semibold" style={{ 
                            color: isVeryUrgent ? '#DC2626' : '#D97706' 
                          }}>
                            {strings.urgentReturn}
                          </span>
                        </div>
                        <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                          {deposit.property_address || 'Deposit'}
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          ฿{deposit.deposit_amount?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${isVeryUrgent ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'} mb-1`}>
                          <Calendar className="w-3 h-3 mr-1" />
                          {daysRemaining} {strings.daysRemaining}
                        </Badge>
                        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                          {strings.dueDate}: {format(new Date(deposit.expected_return_date), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}