import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Upload, ArrowRight } from "lucide-react";
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

  const colors = {
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    itemBg: isDarkMode ? '#353A3D' : '#F8FAFC',
    itemHoverBg: isDarkMode ? '#3A3D40' : '#F3F4F6'
  };

  const t = {
    en: {
      recentLeases: "Recent Leases",
      viewAll: "View All",
      noLeases: "No leases yet",
      scanFirst: "Upload your first lease to get started",
      scanned: "Scanned",
      rent: "Rent"
    },
    th: {
      recentLeases: "สัญญาเช่าล่าสุด",
      viewAll: "ดูทั้งหมด",
      noLeases: "ยังไม่มีสัญญาเช่า",
      scanFirst: "อัปโหลดสัญญาเช่าแรกของคุณเพื่อเริ่มต้น",
      scanned: "สแกนแล้ว",
      rent: "ค่าเช่า"
    },
    zh: {
      recentLeases: "最近的租约",
      viewAll: "查看全部",
      noLeases: "暂无租约",
      scanFirst: "上传您的第一份租约以开始",
      scanned: "已扫描",
      rent: "租金"
    },
    ja: {
      recentLeases: "最近の賃貸契約",
      viewAll: "すべて表示",
      noLeases: "賃貸契約なし",
      scanFirst: "最初の賃貸契約をアップロードして開始",
      scanned: "スキャン済み",
      rent: "家賃"
    },
    ko: {
      recentLeases: "최근 임대 계약",
      viewAll: "모두 보기",
      noLeases: "임대 계약 없음",
      scanFirst: "첫 번째 임대 계약을 업로드하여 시작하세요",
      scanned: "스캔됨",
      rent: "임대료"
    },
    ru: {
      recentLeases: "Последние договоры",
      viewAll: "Посмотреть все",
      noLeases: "Договоров пока нет",
      scanFirst: "Загрузите ваш первый договор, чтобы начать",
      scanned: "Отсканировано",
      rent: "Аренда"
    }
  };

  const strings = t[language] || t.en;

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <FileText className="w-5 h-5 text-ls-forest" />
            {strings.recentLeases}
          </CardTitle>
          {leases.length > 0 && (
            <Link to={createPageUrl("UploadScan")}>
              <button
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: '#0C3B2E',
                  border: '1.5px solid #0C3B2E',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
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
                <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {leases.length === 0 ? (
          <div className="text-center py-12">
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(12, 59, 46, 0.1) 0%, rgba(12, 59, 46, 0.05) 100%)'
              }}
            >
              <Upload className="w-10 h-10" style={{ color: colors.textSecondary, opacity: 0.4 }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
              {strings.noLeases}
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {strings.scanFirst}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leases.slice(0, 5).map((lease) => (
              <div
                key={lease.id}
                onClick={() => navigate(createPageUrl("UploadScan") + `?leaseId=${lease.id}`)}
                className="p-4 rounded-xl cursor-pointer"
                style={{
                  backgroundColor: colors.itemBg,
                  border: `1px solid ${colors.borderColor}`,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.itemHoverBg;
                  e.currentTarget.style.borderColor = '#0C3B2E';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.itemBg;
                  e.currentTarget.style.borderColor = colors.borderColor;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold mb-1 truncate" style={{ color: colors.textPrimary }}>
                      {lease.property_address || 'Lease Agreement'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                      <span>{format(new Date(lease.created_date), 'MMM d, yyyy')}</span>
                      {lease.rent_amount && (
                        <>
                          <span>•</span>
                          <span className="font-semibold">{strings.rent}: ฿{lease.rent_amount.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {lease.status === 'scanned' && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {strings.scanned}
                      </Badge>
                    )}
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