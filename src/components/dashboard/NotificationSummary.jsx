import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, Mail, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { differenceInHours } from 'date-fns';

export default function NotificationSummary({ language = 'en', colors }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myLogs = [] } = useQuery({
    queryKey: ['myNotificationLogs'],
    queryFn: () => base44.entities.NotificationLog.filter({ user_email: user?.email }, '-created_date', 10),
    enabled: !!user,
  });

  const strings = {
    en: {
      title: 'My Notifications',
      recent: 'Recent Alerts',
      allCaughtUp: 'All caught up!',
      noNotifications: 'No notifications yet',
      via: 'via',
      hoursAgo: 'hours ago',
      justNow: 'just now',
      types: {
        '30d_deposit': 'Deposit in 30 days',
        '7d_deposit': 'Deposit in 7 days',
        '3d_deposit': 'Deposit in 3 days',
        'overdue_deposit': 'Deposit overdue',
        '30d_notice': 'Notice in 30 days',
        '7d_notice': 'Notice in 7 days',
        '3d_notice': 'Notice in 3 days',
        '0d_notice': 'Notice today',
        'rent_reminder': 'Rent due soon'
      }
    },
    th: {
      title: 'การแจ้งเตือนของฉัน',
      recent: 'การแจ้งเตือนล่าสุด',
      allCaughtUp: 'อัปเดตแล้วทั้งหมด!',
      noNotifications: 'ยังไม่มีการแจ้งเตือน',
      via: 'ผ่าน',
      hoursAgo: 'ชั่วโมงที่แล้ว',
      justNow: 'เมื่อสักครู่',
      types: {
        '30d_deposit': 'มัดจำใน 30 วัน',
        '7d_deposit': 'มัดจำใน 7 วัน',
        '3d_deposit': 'มัดจำใน 3 วัน',
        'overdue_deposit': 'มัดจำเกินกำหนด',
        '30d_notice': 'แจ้งใน 30 วัน',
        '7d_notice': 'แจ้งใน 7 วัน',
        '3d_notice': 'แจ้งใน 3 วัน',
        '0d_notice': 'แจ้งวันนี้',
        'rent_reminder': 'ครบกำหนดเร็วๆ นี้'
      }
    },
    zh: {
      title: '我的通知',
      recent: '最近的提醒',
      allCaughtUp: '已全部查看！',
      noNotifications: '暂无通知',
      via: '通过',
      hoursAgo: '小时前',
      justNow: '刚刚',
      types: {
        '30d_deposit': '30天后的押金',
        '7d_deposit': '7天后的押金',
        '3d_deposit': '3天后的押金',
        'overdue_deposit': '押金逾期',
        '30d_notice': '30天后通知',
        '7d_notice': '7天后通知',
        '3d_notice': '3天后通知',
        '0d_notice': '今天通知',
        'rent_reminder': '租金即将到期'
      }
    },
    ja: {
      title: 'マイ通知',
      recent: '最近のアラート',
      allCaughtUp: 'すべて確認済み！',
      noNotifications: '通知はまだありません',
      via: '経由',
      hoursAgo: '時間前',
      justNow: 'たった今',
      types: {
        '30d_deposit': '30日後の敷金',
        '7d_deposit': '7日後の敷金',
        '3d_deposit': '3日後の敷金',
        'overdue_deposit': '敷金延滞',
        '30d_notice': '30日後の通知',
        '7d_notice': '7日後の通知',
        '3d_notice': '3日後の通知',
        '0d_notice': '今日の通知',
        'rent_reminder': '家賃まもなく期限'
      }
    },
    ko: {
      title: '내 알림',
      recent: '최근 알림',
      allCaughtUp: '모두 확인했습니다！',
      noNotifications: '아직 알림 없음',
      via: '경유',
      hoursAgo: '시간 전',
      justNow: '방금',
      types: {
        '30d_deposit': '30일 후 보증금',
        '7d_deposit': '7일 후 보증금',
        '3d_deposit': '3일 후 보증금',
        'overdue_deposit': '보증금 연체',
        '30d_notice': '30일 후 통지',
        '7d_notice': '7일 후 통지',
        '3d_notice': '3일 후 통지',
        '0d_notice': '오늘 통지',
        'rent_reminder': '임대료 곧 만료'
      }
    }
  };

  const str = t[language] || t.en;

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
            {str.recentLeases}
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
                {str.viewAll}
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
              {str.noLeases}
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {str.scanFirst}
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
                          <span className="font-semibold">{str.rent}: ฿{lease.rent_amount.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {lease.status === 'scanned' && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {str.scanned}
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