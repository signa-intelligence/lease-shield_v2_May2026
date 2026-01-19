import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, Mail, CheckCircle2, Clock, AlertCircle, Eye, X } from 'lucide-react';
import { differenceInHours } from 'date-fns';

export default function NotificationSummary({ language = 'en', isDarkMode = false }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['myNotificationLogs'],
    queryFn: () => base44.entities.NotificationLog.filter({ user_email: user?.email, is_dismissed: { $ne: true } }, '-created_date', 10),
    enabled: !!user,
  });

  const handleMarkAsRead = async (notificationId) => {
    try {
      await base44.entities.NotificationLog.update(notificationId, { is_read: true });
      refetchLogs();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      await base44.entities.NotificationLog.update(notificationId, { is_dismissed: true });
      refetchLogs();
    } catch (error) {
      console.error('Failed to dismiss:', error);
    }
  };

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
    },
    ru: {
      title: 'Мои уведомления',
      recent: 'Последние уведомления',
      allCaughtUp: 'Всё просмотрено!',
      noNotifications: 'Уведомлений пока нет',
      via: 'через',
      hoursAgo: 'ч. назад',
      justNow: 'только что',
      types: {
        '30d_deposit': 'Депозит через 30 дней',
        '7d_deposit': 'Депозит через 7 дней',
        '3d_deposit': 'Депозит через 3 дня',
        'overdue_deposit': 'Депозит просрочен',
        '30d_notice': 'Уведомление через 30 дней',
        '7d_notice': 'Уведомление через 7 дней',
        '3d_notice': 'Уведомление через 3 дня',
        '0d_notice': 'Уведомление сегодня',
        'rent_reminder': 'Срок аренды скоро'
      }
    }
  };

  const str = strings[language] || strings.en;

  const getTypeColor = (type) => {
    if (type.includes('overdue') || type === '0d_notice') return '#EF4444';
    if (type.includes('3d')) return '#F59E0B';
    if (type.includes('7d')) return '#EAB308';
    if (type.includes('30d')) return '#10B981';
    return '#3B82F6';
  };

  const getTimeAgo = (date) => {
    const hours = differenceInHours(new Date(), new Date(date));
    if (hours < 1) return str.justNow;
    return `${hours} ${str.hoursAgo}`;
  };

  const recentLogs = myLogs.slice(0, 5);

  return (
    <Card className="border-none shadow-xl bg-white dark:bg-gray-800">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
          <Bell className="w-5 h-5 text-blue-600" />
          {str.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {recentLogs.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-600" />
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              {str.allCaughtUp}
            </p>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
              {str.noNotifications}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${getTypeColor(log.notification_type)}20`
                      }}
                    >
                      {log.status === 'sent' ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: getTypeColor(log.notification_type) }} />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-50">
                        {str.types[log.notification_type] || log.notification_type}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {log.channel === 'LINE' ? (
                            <MessageCircle className="w-3 h-3" />
                          ) : (
                            <Mail className="w-3 h-3" />
                          )}
                          {str.via} {log.channel}
                        </Badge>
                        <span className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(log.created_date)}
                        </span>
                      </div>
                      {/* Mark as Read / Dismiss buttons */}
                      <div className="flex items-center gap-2 mt-2">
                        {!log.is_read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(log.id)}
                            className="h-7 px-2 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismiss(log.id)}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
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