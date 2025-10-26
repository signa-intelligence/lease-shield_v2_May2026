
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CheckCircle2, Wallet, Bell } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DepositAlert({ deposits, language = 'en' }) {
  const navigate = useNavigate();

  const t = {
    en: {
      title: "Deposit Tracking",
      noDeposits: "No deposits being tracked",
      trackDeposit: "Track a Deposit",
      dueWithin: "deposit due within 30 days", // Used for singular
      deposits: "deposits", // Used for plural noun
      remindersEnabled: "Automated reminders enabled for all tracked deposits",
      return: "Return",
      days: "days",
      overdue: "Overdue",
      dayReminder: "7-day reminder scheduled",
      viewAll: "View All Deposits"
    },
    th: {
      title: "ติดตามเงินมัดจำ",
      noDeposits: "ไม่มีเงินมัดจำที่กำลังติดตาม",
      trackDeposit: "ติดตามเงินมัดจำ",
      dueWithin: "เงินมัดจำครบกำหนดภายใน 30 วัน", // Used for singular
      deposits: "รายการ", // Used for plural noun
      remindersEnabled: "เปิดใช้งานการแจ้งเตือนอัตโนมัติสำหรับเงินมัดจำทั้งหมด",
      return: "คืน",
      days: "วัน",
      overdue: "เกินกำหนด",
      dayReminder: "กำหนดการแจ้งเตือน 7 วัน",
      viewAll: "ดูเงินมัดจำทั้งหมด"
    }
  };

  const strings = t[language];

  const getStatusIcon = (status) => {
    const icons = {
      tracking: Clock,
      returned: CheckCircle2,
      dispute: AlertTriangle
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      tracking: "text-blue-600 bg-blue-50",
      returned: "text-emerald-600 bg-emerald-50",
      dispute: "text-red-600 bg-red-50"
    };
    return colors[status] || "text-slate-600 bg-slate-50";
  };

  const getDaysRemaining = (date) => {
    return differenceInDays(new Date(date), new Date());
  };

  const urgentDeposits = deposits.filter(d => {
    const days = getDaysRemaining(d.expected_return_date);
    return d.status === 'tracking' && days <= 30;
  });

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          {strings.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {deposits.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-3">{strings.noDeposits}</p>
            <Button size="sm" onClick={() => navigate(createPageUrl("DepositTracker"))}>
              {strings.trackDeposit}
            </Button>
          </div>
        ) : (
          <>
            {urgentDeposits.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    {urgentDeposits.length} {urgentDeposits.length > 1 ? strings.deposits : strings.dueWithin}
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  {strings.remindersEnabled}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {deposits.slice(0, 3).map((deposit) => {
                const StatusIcon = getStatusIcon(deposit.status);
                const daysRemaining = getDaysRemaining(deposit.expected_return_date);
                const isUrgent = daysRemaining <= 30 && deposit.status === 'tracking';
                
                return (
                  <div 
                    key={deposit.id} 
                    className={`p-4 rounded-xl hover:bg-slate-100 transition-colors duration-200 cursor-pointer ${
                      isUrgent ? 'bg-amber-50 border-2 border-amber-300' : 'bg-slate-50'
                    }`}
                    onClick={() => navigate(createPageUrl("DepositTracker"))}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(deposit.status).split(' ')[0]}`} />
                        <span className="font-semibold text-slate-900">
                          ฿{deposit.deposit_amount.toLocaleString()}
                        </span>
                      </div>
                      <Badge className={getStatusColor(deposit.status)}>
                        {deposit.status}
                      </Badge>
                    </div>
                    {deposit.property_address && (
                      <p className="text-sm text-slate-600 mb-2">{deposit.property_address}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{strings.return}: {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}</span>
                      {deposit.status === 'tracking' && (
                        <span className={daysRemaining < 30 ? 'text-amber-600 font-medium' : ''}>
                          {daysRemaining > 0 ? `${daysRemaining} ${strings.days}` : strings.overdue}
                        </span>
                      )}
                    </div>
                    {isUrgent && daysRemaining === 7 && (
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <p className="text-xs text-amber-700 flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          {strings.dayReminder}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {deposits.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => navigate(createPageUrl("DepositTracker"))}
              >
                {strings.viewAll}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
