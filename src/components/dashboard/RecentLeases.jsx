import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function RecentLeases({ leases, language }) {
  const t = {
    en: {
      title: "Recent Lease Scans",
      noLeases: "No leases scanned yet",
      uploadPrompt: "Upload your first lease to get started",
      scanned: "Scanned",
      uploaded: "Uploaded",
      paid: "Paid"
    },
    th: {
      title: "การสแกนสัญญาเช่าล่าสุด",
      noLeases: "ยังไม่มีการสแกนสัญญาเช่า",
      uploadPrompt: "อัปโหลดสัญญาเช่าแรกของคุณเพื่อเริ่มต้น",
      scanned: "สแกนแล้ว",
      uploaded: "อัปโหลดแล้ว",
      paid: "ชำระเงินแล้ว"
    }
  };

  const strings = t[language] || t.en;

  const getStatusBadge = (status) => {
    const configs = {
      uploaded: { label: strings.uploaded, color: 'bg-blue-100 text-blue-700 border-blue-200' },
      scanned: { label: strings.scanned, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      paid: { label: strings.paid, color: 'bg-purple-100 text-purple-700 border-purple-200' }
    };
    const config = configs[status] || configs.uploaded;
    return <Badge className={`${config.color} border font-semibold`}>{config.label}</Badge>;
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
          <FileText className="w-5 h-5 text-ls-gold" />
          {strings.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {leases.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#C7A338', opacity: 0.5 }} />
            <p className="font-semibold mb-1" style={{ color: '#0C3B2E' }}>{strings.noLeases}</p>
            <p className="text-sm" style={{ color: '#065f46', opacity: 0.8 }}>{strings.uploadPrompt}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leases.slice(0, 5).map((lease) => (
              <div 
                key={lease.id} 
                className="p-4 rounded-xl hover:shadow-md transition-all duration-200"
                style={{
                  background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(236, 239, 237, 0.6))',
                  border: '1px solid rgba(199, 163, 56, 0.15)'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1" style={{ color: '#0C3B2E' }}>
                      {lease.property_address || 'Lease Agreement'}
                    </h4>
                    {lease.rent_amount && (
                      <p className="text-sm font-medium" style={{ color: '#C7A338' }}>
                        ฿{lease.rent_amount.toLocaleString()}/month
                      </p>
                    )}
                  </div>
                  {getStatusBadge(lease.status)}
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: '#065f46', opacity: 0.8 }}>
                  <span>{format(new Date(lease.created_date), 'MMM d, yyyy')}</span>
                  {lease.file_url && (
                    <a 
                      href={lease.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                      style={{ color: '#C7A338' }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}