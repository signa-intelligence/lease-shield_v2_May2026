import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, DollarSign, MapPin, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function RecentLeases({ leases, language }) {
  const t = {
    en: {
      title: "Recent Leases",
      noLeases: "No leases yet",
      noLeasesDesc: "Upload your first lease agreement to get started",
      scanned: "Scanned",
      uploaded: "Uploaded",
      paid: "Paid"
    },
    th: {
      title: "สัญญาเช่าล่าสุด",
      noLeases: "ยังไม่มีสัญญาเช่า",
      noLeasesDesc: "อัปโหลดสัญญาเช่าแรกของคุณเพื่อเริ่มต้น",
      scanned: "สแกนแล้ว",
      uploaded: "อัปโหลดแล้ว",
      paid: "ชำระแล้ว"
    }
  };

  const strings = t[language] || t.en;

  const getStatusColor = (status) => {
    const colors = {
      uploaded: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
      scanned: { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' },
      paid: { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' }
    };
    return colors[status] || colors.uploaded;
  };

  return (
    <Card className="border-none shadow-xl" style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '2px solid rgba(199, 163, 56, 0.2)',
      boxShadow: '0 8px 24px rgba(12, 59, 46, 0.15)'
    }}>
      <CardHeader className="border-b" style={{
        background: 'linear-gradient(135deg, rgba(12, 59, 46, 0.05), rgba(199, 163, 56, 0.05))',
        borderBottom: '2px solid rgba(199, 163, 56, 0.2)'
      }}>
        <CardTitle className="flex items-center gap-2">
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #0C3B2E, #1a5241)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(12, 59, 46, 0.3)',
            border: '2px solid rgba(199, 163, 56, 0.3)'
          }}>
            <FileText className="w-5 h-5 text-ls-gold" />
          </div>
          <span style={{
            background: 'linear-gradient(135deg, #0C3B2E, #C7A338)',
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
        {leases.length === 0 ? (
          <div className="text-center py-12">
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              background: 'linear-gradient(135deg, rgba(12, 59, 46, 0.1), rgba(199, 163, 56, 0.1))',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed rgba(199, 163, 56, 0.3)'
            }}>
              <FileText className="w-10 h-10" style={{ color: '#C7A338', opacity: 0.6 }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#0C3B2E' }}>
              {strings.noLeases}
            </h3>
            <p style={{ color: '#1a5241', opacity: 0.8 }}>
              {strings.noLeasesDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leases.slice(0, 5).map((lease) => {
              const statusColors = getStatusColor(lease.status);
              return (
                <div 
                  key={lease.id} 
                  className="p-4 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(236, 239, 237, 0.8))',
                    border: '2px solid rgba(199, 163, 56, 0.15)',
                    boxShadow: '0 4px 12px rgba(12, 59, 46, 0.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.borderColor = 'rgba(199, 163, 56, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderColor = 'rgba(199, 163, 56, 0.15)';
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold mb-1" style={{
                        color: '#0C3B2E',
                        fontSize: '16px'
                      }}>
                        {lease.property_address || 'Lease Agreement'}
                      </h4>
                      {lease.rent_amount && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: '#1a5241' }}>
                          <DollarSign className="w-4 h-4" style={{ color: '#C7A338' }} />
                          <span className="font-semibold">฿{lease.rent_amount.toLocaleString()}/month</span>
                        </div>
                      )}
                    </div>
                    <Badge style={{
                      backgroundColor: statusColors.bg,
                      color: statusColors.text,
                      border: `2px solid ${statusColors.border}`,
                      fontWeight: '700',
                      padding: '4px 12px'
                    }}>
                      {strings[lease.status] || lease.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: '#1a5241', opacity: 0.8 }}>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(lease.created_date), 'MMM d, yyyy')}
                    </div>
                    {lease.language_detected && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Lang:</span>
                        {lease.language_detected.toUpperCase()}
                      </div>
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