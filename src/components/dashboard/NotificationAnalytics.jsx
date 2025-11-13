
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, TrendingUp, TrendingDown, MessageCircle, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { differenceInDays, subDays, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function NotificationAnalytics({ language = 'en', colors }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['myNotificationLogs'],
    queryFn: () => base44.entities.NotificationLog.filter({ user_email: user?.email }, '-created_date', 100),
    enabled: !!user,
  });

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
    }
  };

  const str = strings[language] || strings.en;

  // Filter last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentLogs = logs.filter(log => new Date(log.created_date) >= thirtyDaysAgo);

  if (recentLogs.length === 0) {
    return (
      <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
        <CardContent className="p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: colors.textSecondary }} />
          <p style={{ color: colors.textSecondary }}>{str.noData}</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const totalSent = recentLogs.length;
  const successCount = recentLogs.filter(l => l.status === 'sent').length;
  const successRate = Math.round((successCount / totalSent) * 100);

  // Channel breakdown
  const channelData = [
    {
      name: 'LINE',
      value: recentLogs.filter(l => l.channel === 'LINE').length,
      color: '#10B981'
    },
    {
      name: 'Email',
      value: recentLogs.filter(l => l.channel === 'Email').length,
      color: '#3B82F6'
    }
  ].filter(d => d.value > 0);

  // Type breakdown
  const typeBreakdown = recentLogs.reduce((acc, log) => {
    acc[log.notification_type] = (acc[log.notification_type] || 0) + 1;
    return acc;
  }, {});

  const topType = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1])[0];

  // Daily trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayLogs = recentLogs.filter(log => {
      const logDate = startOfDay(new Date(log.created_date));
      return logDate.getTime() === dayStart.getTime();
    });

    return {
      date: date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { weekday: 'short' }),
      count: dayLogs.length
    };
  });

  const avgDaily = Math.round(last7Days.reduce((sum, d) => sum + d.count, 0) / 7);
  const todayCount = last7Days[last7Days.length - 1]?.count || 0;
  const trend = todayCount >= avgDaily ? 'up' : 'down';

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Bell className="w-5 h-5 text-blue-600" />
          {str.title}
        </CardTitle>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          {str.last30Days}
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.borderColor}`
            }}
          >
            <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>
              {str.totalSent}
            </p>
            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
              {totalSent}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className="text-xs" style={{ color: trend === 'up' ? '#10B981' : '#EF4444' }}>
                {avgDaily}/day avg
              </span>
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.borderColor}`
            }}
          >
            <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>
              {str.successRate}
            </p>
            <p className="text-2xl font-bold" style={{ color: successRate >= 90 ? '#10B981' : '#EAB308' }}>
              {successRate}%
            </p>
            <div className="flex items-center gap-1 mt-1">
              {successRate >= 90 ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-600" />
              )}
              <span className="text-xs" style={{ color: successRate >= 90 ? '#10B981' : '#EAB308' }}>
                {successCount}/{totalSent}
              </span>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
            {str.trend}
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={last7Days}>
              <XAxis
                dataKey="date"
                stroke={colors.textSecondary}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke={colors.textSecondary}
                style={{ fontSize: '12px' }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: '8px',
                  color: colors.textPrimary
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
              {str.byChannel}
            </p>
            <div className="space-y-2">
              {channelData.map((channel) => (
                <div key={channel.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {channel.name === 'LINE' ? (
                      <MessageCircle className="w-4 h-4" style={{ color: channel.color }} />
                    ) : (
                      <Mail className="w-4 h-4" style={{ color: channel.color }} />
                    )}
                    <span className="text-sm" style={{ color: colors.textPrimary }}>
                      {channel.name}
                    </span>
                  </div>
                  <Badge style={{
                    backgroundColor: `${channel.color}20`,
                    color: channel.color,
                    border: `1px solid ${channel.color}40`
                  }}>
                    {channel.value}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
              {str.mostCommon}
            </p>
            {topType && (
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.borderColor}`
                }}
              >
                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {topType[0].replace(/_/g, ' ')}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#3B82F6' }}>
                  {topType[1]}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
