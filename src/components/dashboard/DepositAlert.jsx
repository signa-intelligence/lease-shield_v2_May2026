import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function DepositAlert({ deposits }) {
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

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          Deposit Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {deposits.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No deposits being tracked</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deposits.slice(0, 3).map((deposit) => {
              const StatusIcon = getStatusIcon(deposit.status);
              const daysRemaining = getDaysRemaining(deposit.expected_return_date);
              
              return (
                <div key={deposit.id} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200">
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
                    <span>Return: {format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}</span>
                    {deposit.status === 'tracking' && (
                      <span className={daysRemaining < 30 ? 'text-amber-600 font-medium' : ''}>
                        {daysRemaining} days
                      </span>
                    )}
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