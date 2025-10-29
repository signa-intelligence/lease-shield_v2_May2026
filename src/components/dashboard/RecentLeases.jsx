import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecentLeases({ leases, language = 'en' }) {
  const t = {
    en: {
      title: "Recent Leases",
      viewAll: "View All",
      noLeases: "No leases uploaded yet",
      uploadFirst: "Upload Your First Lease",
      uploaded: "Uploaded",
      month: "month"
    },
    th: {
      title: "สัญญาเช่าล่าสุด",
      viewAll: "ดูทั้งหมด",
      noLeases: "ยังไม่มีการอัปโหลดสัญญาเช่า",
      uploadFirst: "อัปโหลดสัญญาเช่าแรกของคุณ",
      uploaded: "อัปโหลดแล้ว",
      month: "เดือน"
    }
  };

  const strings = t[language];

  const getStatusIcon = (status) => {
    const icons = {
      uploaded: Clock,
      scanned: CheckCircle2,
      paid: CheckCircle2
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      uploaded: "bg-amber-100 text-amber-800",
      scanned: "bg-blue-100 text-blue-800",
      paid: "bg-emerald-100 text-emerald-800"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {strings.title}
          </CardTitle>
          <Link to={createPageUrl("UploadScan")}>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              {strings.viewAll}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {leases.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">{strings.noLeases}</p>
            <Link to={createPageUrl("UploadScan")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {strings.uploadFirst}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leases.slice(0, 4).map((lease) => {
              const StatusIcon = getStatusIcon(lease.status);
              
              return (
                <div key={lease.id} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200 cursor-pointer">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-900 truncate">
                          {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                        </span>
                      </div>
                      {lease.rent_amount && (
                        <p className="text-sm text-slate-600">
                          ฿{lease.rent_amount.toLocaleString()}/{strings.month}
                        </p>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(lease.status)} flex-shrink-0`}>
                      {lease.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{strings.uploaded} {format(new Date(lease.created_date), 'MMM d, yyyy')}</span>
                    {lease.start_date && lease.end_date && (
                      <span className="truncate ml-2">
                        {format(new Date(lease.start_date), 'MMM yyyy')} - {format(new Date(lease.end_date), 'MMM yyyy')}
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