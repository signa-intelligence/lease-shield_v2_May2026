import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, Mail, MessageSquare } from "lucide-react";
import { subDays } from "date-fns";

export default function NotificationAnalytics({ language = 'en', colors }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['notificationLogs'],
    queryFn: () => base44.entities.NotificationLog.filter({ user_email: user?.email }, '-created_date', 100),
    enabled: !!user,
  });

  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentLogs = logs.filter(log => new Date(log.created_date) >= thirtyDaysAgo);

  const totalSent = recentLogs.length;
  const successCount = recentLogs.filter(l => l.status === 'sent').length;
  const successRate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;

  const byChannel = {
    LINE: recentLogs.filter(l => l.channel === 'LINE').length,
    Email: recentLogs.filter(l => l.channel === 'Email').length
  };

  const byType = {};
  recentLogs.forEach(log => {
    byType[log.notification_type] = (byType[log.notification_type] || 0) + 1;
  });
  const mostCommonType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

  const strings = {
    en: {
      title: 'Notification Insights',
      last30Days: 'Last 30 Days',
      totalSent: 'Total Sent',
      successRate: 'Success Rate',
      byChannel: 'By Channel',
      byType: 'By Type',
      trend: 'Trend',
      mostCommon: 'Most Common',
      recentActivity: 'Recent Activity',
      noData: 'Not enough data yet'
    },
    th: {
      title: 'ข้อมูลการแจ้งเตือน',
      last30Days: '30 วันที่ผ่านมา',
      totalSent: 'ส่งทั้งหมด',
      successRate: 'อัตราสำเร็จ',
      byChannel: 'ตามช่องทาง',
      byType: 'ตามประเภท',
      trend: 'แนวโน้ม',
      mostCommon: 'พบบ่อยที่สุด',
      recentActivity: 'กิจกรรมล่าสุด',
      noData: 'ยังไม่มีข้อมูลเพียงพอ'
    },
    zh: {
      title: '通知见解',
      last30Days: '过去30天',
      totalSent: '总发送数',
      successRate: '成功率',
      byChannel: '按渠道',
      byType: '按类型',
      trend: '趋势',
      mostCommon: '最常见',
      recentActivity: '最近活动',
      noData: '数据不足'
    },
    ja: {
      title: '通知インサイト',
      last30Days: '過去30日',
      totalSent: '合計送信数',
      successRate: '成功率',
      byChannel: 'チャンネル別',
      byType: 'タイプ別',
      trend: 'トレンド',
      mostCommon: '最も一般的',
      recentActivity: '最近のアクティビティ',
      noData: 'データが不足しています'
    },
    ko: {
      title: '알림 인사이트',
      last30Days: '지난 30일',
      totalSent: '총 발송수',
      successRate: '성공률',
      byChannel: '채널별',
      byType: '유형별',
      trend: '추세',
      mostCommon: '가장 일반적',
      recentActivity: '최근 활동',
      noData: '데이터가 충분하지 않음'
    },
    ru: {
      title: 'Статистика уведомлений',
      last30Days: 'Последние 30 дней',
      totalSent: 'Всего отправлено',
      successRate: 'Уровень успеха',
      byChannel: 'По каналам',
      byType: 'По типам',
      trend: 'Тенденция',
      mostCommon: 'Наиболее частые',
      recentActivity: 'Недавняя активность',
      noData: 'Данных пока недостаточно'
    }
  };

  // DEFENSIVE: Always ensure valid strings object
  const str = (strings && strings[language] && typeof strings[language] === 'object') 
    ? strings[language] 
    : strings.en;

  if (totalSent === 0) {
    return (
      <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <TrendingUp className="w-5 h-5 text-ls-gold" />
            {str.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary, opacity: 0.3 }} />
          <p style={{ color: colors.textSecondary }}>{str.noData}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <TrendingUp className="w-5 h-5 text-ls-gold" />
          {str.title}
          <Badge className="bg-blue-100 text-blue-800">{str.last30Days}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bg }}>
            <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>{str.totalSent}</p>
            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{totalSent}</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bg }}>
            <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>{str.successRate}</p>
            <p className="text-2xl font-bold text-emerald-600">{successRate}%</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>{str.byChannel}</p>
          <div className="flex gap-2">
            {byChannel.LINE > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700">
                <MessageSquare className="w-3 h-3 mr-1" />
                LINE: {byChannel.LINE}
              </Badge>
            )}
            {byChannel.Email > 0 && (
              <Badge className="bg-blue-100 text-blue-700">
                <Mail className="w-3 h-3 mr-1" />
                Email: {byChannel.Email}
              </Badge>
            )}
          </div>
        </div>

        {mostCommonType && (
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>{str.mostCommon}</p>
            <Badge className="bg-purple-100 text-purple-700">
              {mostCommonType[0]}: {mostCommonType[1]}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}