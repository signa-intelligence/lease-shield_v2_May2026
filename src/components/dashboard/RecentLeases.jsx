import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function RecentLeases({ leases, language }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteLeaseMutation = useMutation({
    mutationFn: (leaseId) => base44.entities.Lease.delete(leaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      alert(language === 'th' 
        ? 'ไม่สามารถลบสัญญาเช่าได้ กรุณาลองอีกครั้ง' 
        : 'Failed to delete lease. Please try again.');
    }
  });

  const handleDelete = (e, leaseId) => {
    e.stopPropagation();
    if (window.confirm(language === 'th' 
      ? 'คุณแน่ใจหรือไม่ว่าต้องการลบสัญญาเช่านี้?' 
      : 'Are you sure you want to delete this lease?')) {
      deleteLeaseMutation.mutate(leaseId);
    }
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    leaseCardBg: '#353A3D',
    leaseCardHover: '#3A3D40'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    leaseCardBg: '#FFFFFF',
    leaseCardHover: '#F9FAFB'
  };

  const t = {
    en: {
      recentScans: "Recent Scans",
      viewAll: "View All",
      noScans: "No Scans Yet",
      noScansDesc: "Upload your first lease to get started",
      uploadLease: "Upload Lease",
      riskScore: "Risk Score",
      scanned: "Scanned"
    },
    th: {
      recentScans: "การสแกนล่าสุด",
      viewAll: "ดูทั้งหมด",
      noScans: "ยังไม่มีการสแกน",
      noScansDesc: "อัปโหลดสัญญาเช่าแรกของคุณเพื่อเริ่มต้น",
      uploadLease: "อัปโหลดสัญญาเช่า",
      riskScore: "คะแนนความเสี่ยง",
      scanned: "สแกนเมื่อ"
    }
  };

  const strings = t[language] || t.en;

  const getStatusColor = (status) => {
    const colors = {
      uploaded: 'bg-amber-100 text-amber-800 border-amber-200',
      scanned: 'bg-blue-100 text-blue-800 border-blue-200',
      paid: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader className="flex flex-row items-center justify-between" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <FileText className="w-5 h-5 text-blue-600" />
          {strings.recentScans}
        </CardTitle>
        {leases.length > 0 && (
          <button
            onClick={() => navigate(createPageUrl("UploadScan"))}
            style={{
              color: '#3B82F6',
              fontSize: '14px',
              fontWeight: '600',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = isDarkMode ? '#3A3D40' : '#F3F4F6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            {strings.viewAll} →
          </button>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {leases.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{
              backgroundColor: isDarkMode ? '#3A3D40' : '#F3F4F6'
            }}>
              <FileText className="w-8 h-8" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            </div>
            <p className="font-semibold mb-2" style={{ color: colors.textPrimary }}>{strings.noScans}</p>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{strings.noScansDesc}</p>
            <button
              onClick={() => navigate(createPageUrl("UploadScan"))}
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563EB'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3B82F6'}
            >
              {strings.uploadLease}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {leases.slice(0, 5).map((lease) => (
              <div
                key={lease.id}
                onClick={() => navigate(createPageUrl("LeaseDetails") + `?leaseId=${lease.id}`)}
                className="p-4 rounded-lg border-2 cursor-pointer transition-all"
                style={{
                  backgroundColor: colors.leaseCardBg,
                  borderColor: colors.borderColor
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.leaseCardHover;
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.leaseCardBg;
                  e.currentTarget.style.borderColor = colors.borderColor;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold" style={{ color: colors.textPrimary }}>
                        {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                      </h4>
                    </div>
                    {lease.rent_amount && (
                      <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                        ฿{lease.rent_amount.toLocaleString()}/month
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                      <Calendar className="w-3 h-3" />
                      {strings.scanned}: {format(new Date(lease.created_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={`${getStatusColor(lease.status)} border`}>
                      {lease.status}
                    </Badge>
                    <button
                      onClick={(e) => handleDelete(e, lease.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                      style={{ color: '#EF4444' }}
                      disabled={deleteLeaseMutation.isPending}
                      title={language === 'th' ? 'ลบสัญญาเช่า' : 'Delete lease'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}