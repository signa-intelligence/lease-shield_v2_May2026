import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function RecentLeases({ leases, language }) {
  const navigate = useNavigate();
  
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
    itemBg: '#353A3D'
  } : {
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    itemBg: '#F8FAFC'
  };

  const t = {
    en: {
      recentLeases: "Recent Leases",
      viewAll: "View All",
      noLeases: "No leases yet",
      uploadLease: "Upload your first lease to get started"
    },
    th: {
      recentLeases: "สัญญาเช่าล่าสุด",
      viewAll: "ดูทั้งหมด",
      noLeases: "ยังไม่มีสัญญาเช่า",
      uploadLease: "อัปโหลดสัญญาเช่าแรกของคุณเพื่อเริ่มต้น"
    }
  };

  const strings = t[language] || t.en;

  const handleLeaseClick = (leaseId) => {
    // Navigate to UploadScan with leaseId param so it opens the modal
    navigate(createPageUrl("UploadScan") + `?leaseId=${leaseId}`);
  };

  return (
    <Card className="border-none shadow-lg h-full flex flex-col" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader className="flex flex-row items-center justify-between pb-4" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <FileText className="w-5 h-5 text-ls-forest" />
          {strings.recentLeases}
        </CardTitle>
        <Link to={createPageUrl("UploadScan")}>
          <button
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              border: '2px solid #0C3B2E',
              backgroundColor: 'transparent',
              color: '#0C3B2E',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0C3B2E';
              e.target.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#0C3B2E';
            }}
          >
            {strings.viewAll}
          </button>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {leases.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>{strings.noLeases}</p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.uploadLease}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leases.slice(0, 3).map((lease) => (
              <div
                key={lease.id}
                className="p-4 rounded-xl border transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: colors.itemBg,
                  borderColor: colors.borderColor
                }}
                onClick={() => handleLeaseClick(lease.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0C3B2E';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.borderColor;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 flex-shrink-0 text-ls-forest" />
                      <h4 className="font-bold text-sm truncate" style={{ color: colors.textPrimary }}>
                        {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                      </h4>
                    </div>
                    {lease.rent_amount && (
                      <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                        ฿{lease.rent_amount.toLocaleString()}/{language === 'th' ? 'เดือน' : 'month'}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? 'อัปโหลด' : 'Uploaded'} {format(new Date(lease.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge className={`flex-shrink-0 ${
                    lease.status === 'scanned' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    lease.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    'bg-amber-100 text-amber-800 border-amber-200'
                  } border text-xs`}>
                    {lease.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}