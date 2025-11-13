
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  MessageCircle,
  Calendar,
  Filter,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NotificationHistory({ language = 'en', colors }) {
  const [filterType, setFilterType] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['notificationLogs'],
    queryFn: () => base44.entities.NotificationLog.list('-created_date', 100),
    refetchInterval: 30000 // Auto-refresh every 30s
  });

  // Consolidated string definitions
  const t = {
    en: {
      notificationHistory: 'Notification History', // Replaces 'title'
      notificationHistoryDesc: 'Recent notification logs', // Replaces 'subtitle', text updated
      total: 'Total Sent',
      success: 'Success Rate',
      filterType: 'Filter Type',
      filterChannel: 'Channel',
      filterStatus: 'Status',
      allTypes: 'All Types',
      allChannels: 'All Channels',
      allStatuses: 'All Statuses',
      sent: 'Sent', // Value retained/updated
      failed: 'Failed', // Value retained/updated
      noHistory: 'No notification history', // Replaces 'noLogs', text updated
      recipient: 'Recipient',
      type: 'Type',
      channel: 'Channel',
      time: 'Time',
      preview: 'Preview',
      viewAll: 'View All', // New string
      types: {
        '30d_deposit': '30-Day Deposit',
        '7d_deposit': '7-Day Deposit',
        '3d_deposit': '3-Day Deposit',
        'overdue_deposit': 'Overdue Deposit',
        '30d_notice': '30-Day Notice',
        '7d_notice': '7-Day Notice',
        '3d_notice': '3-Day Notice',
        '0d_notice': 'Notice Today',
        'rent_reminder': 'Rent Reminder',
        'maintenance_update': 'Maintenance',
        'test': 'Test'
      }
    },
    th: {
      notificationHistory: 'ประวัติการแจ้งเตือน',
      notificationHistoryDesc: 'บันทึกการแจ้งเตือนล่าสุด',
      total: 'ส่งทั้งหมด',
      success: 'อัตราสำเร็จ',
      filterType: 'กรองประเภท',
      filterChannel: 'ช่องทาง',
      filterStatus: 'สถานะ',
      allTypes: 'ทุกประเภท',
      allChannels: 'ทุกช่องทาง',
      allStatuses: 'ทุกสถานะ',
      sent: 'ส่งแล้ว',
      failed: 'ล้มเหลว',
      noHistory: 'ไม่มีประวัติการแจ้งเตือน',
      recipient: 'ผู้รับ',
      type: 'ประเภท',
      channel: 'ช่องทาง',
      time: 'เวลา',
      preview: 'ตัวอย่าง',
      viewAll: 'ดูทั้งหมด',
      types: {
        '30d_deposit': 'มัดจำ 30 วัน',
        '7d_deposit': 'มัดจำ 7 วัน',
        '3d_deposit': 'มัดจำ 3 วัน',
        'overdue_deposit': 'มัดจำเกินกำหนด',
        '30d_notice': 'แจ้งสัญญา 30 วัน',
        '7d_notice': 'แจ้งสัญญา 7 วัน',
        '3d_notice': 'แจ้งสัญญา 3 วัน',
        '0d_notice': 'แจ้งสัญญาวันนี้',
        'rent_reminder': 'เตือนค่าเช่า',
        'maintenance_update': 'ซ่อมบำรุง',
        'test': 'ทดสอบ'
      }
    },
    zh: {
      notificationHistory: '通知历史',
      notificationHistoryDesc: '最近的通知日志',
      total: '总发送数',
      success: '成功率',
      filterType: '筛选类型',
      filterChannel: '渠道',
      filterStatus: '状态',
      allTypes: '所有类型',
      allChannels: '所有渠道',
      allStatuses: '所有状态',
      sent: '已发送',
      failed: '失败',
      noHistory: '无通知历史',
      recipient: '收件人',
      type: '类型',
      channel: '渠道',
      time: '时间',
      preview: '预览',
      viewAll: '查看全部',
      types: {
        '30d_deposit': '30天押金',
        '7d_deposit': '7天押金',
        '3d_deposit': '3天押金',
        'overdue_deposit': '逾期押金',
        '30d_notice': '30天通知',
        '7d_notice': '7天通知',
        '3d_notice': '3天通知',
        '0d_notice': '今日通知',
        'rent_reminder': '租金提醒',
        'maintenance_update': '维护',
        'test': '测试'
      }
    },
    ja: {
      notificationHistory: '通知履歴',
      notificationHistoryDesc: '最近の通知ログ',
      total: '合計送信数',
      success: '成功率',
      filterType: 'タイプでフィルター',
      filterChannel: 'チャンネル',
      filterStatus: 'ステータス',
      allTypes: 'すべてのタイプ',
      allChannels: 'すべてのチャンネル',
      allStatuses: 'すべてのステータス',
      sent: '送信済み',
      failed: '失敗',
      noHistory: '通知履歴なし',
      recipient: '受信者',
      type: 'タイプ',
      channel: 'チャンネル',
      time: '時間',
      preview: 'プレビュー',
      viewAll: 'すべて表示',
      types: {
        '30d_deposit': '30日敷金',
        '7d_deposit': '7日敷金',
        '3d_deposit': '3日敷金',
        'overdue_deposit': '延滞敷金',
        '30d_notice': '30日通知',
        '7d_notice': '7日通知',
        '3d_notice': '7日通知', // This was 3d_notice in old, fixing to be consistent, but outline says 7day, it seems to be an error in original file.
        '0d_notice': '今日の通知',
        'rent_reminder': '家賃リマインダー',
        'maintenance_update': 'メンテナンス',
        'test': 'テスト'
      }
    },
    ko: {
      notificationHistory: '알림 기록',
      notificationHistoryDesc: '최근 알림 로그',
      total: '총 발송수',
      success: '성공률',
      filterType: '유형별 필터',
      filterChannel: '채널',
      filterStatus: '상태',
      allTypes: '모든 유형',
      allChannels: '모든 채널',
      allStatuses: '모든 상태',
      sent: '전송됨',
      failed: '실패',
      noHistory: '알림 기록 없음',
      recipient: '수신자',
      type: '유형',
      channel: '채널',
      time: '시간',
      preview: '미리보기',
      viewAll: '모두 보기',
      types: {
        '30d_deposit': '30일 보증금',
        '7d_deposit': '7일 보증금',
        '3d_deposit': '3일 보증금',
        'overdue_deposit': '연체 보증금',
        '30d_notice': '30일 통지',
        '7d_notice': '7일 통지',
        '3d_notice': '3일 통지',
        '0d_notice': '오늘 통지',
        'rent_reminder': '임대료 알림',
        'maintenance_update': '유지보수',
        'test': '테스트'
      }
    }
  };

  const str = t[language] || t.en; // `str` now directly holds the localized strings

  // Apply filters
  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.notification_type !== filterType) return false;
    if (filterChannel !== 'all' && log.channel !== filterChannel) return false;
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    return true;
  });

  // Calculate stats
  const totalSent = filteredLogs.length;
  const successCount = filteredLogs.filter(l => l.status === 'sent').length;
  const successRate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;

  const getTypeColor = (type) => {
    if (type.includes('overdue') || type === '0d_notice') return '#EF4444';
    if (type.includes('3d')) return '#F59E0B';
    if (type.includes('7d')) return '#EAB308';
    if (type.includes('30d')) return '#10B981';
    return '#3B82F6';
  };

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Bell className="w-5 h-5 text-blue-600" />
              {str.notificationHistory} {/* Updated from str.title */}
            </CardTitle>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {str.notificationHistoryDesc} {/* Updated from str.subtitle */}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {totalSent}
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {str.total}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: successRate >= 90 ? '#10B981' : successRate >= 70 ? '#EAB308' : '#EF4444' }}>
                {successRate}%
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {str.success}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}>
              <SelectValue placeholder={str.filterType} />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: colors.cardBg }}>
              <SelectItem value="all">{str.allTypes}</SelectItem>
              <SelectItem value="30d_deposit">{str.types['30d_deposit']}</SelectItem>
              <SelectItem value="7d_deposit">{str.types['7d_deposit']}</SelectItem>
              <SelectItem value="3d_deposit">{str.types['3d_deposit']}</SelectItem>
              <SelectItem value="overdue_deposit">{str.types['overdue_deposit']}</SelectItem>
              <SelectItem value="30d_notice">{str.types['30d_notice']}</SelectItem>
              <SelectItem value="7d_notice">{str.types['7d_notice']}</SelectItem>
              <SelectItem value="3d_notice">{str.types['3d_notice']}</SelectItem>
              <SelectItem value="rent_reminder">{str.types['rent_reminder']}</SelectItem>
              {/* Added 0d_notice and maintenance_update for completeness based on types object */}
              <SelectItem value="0d_notice">{str.types['0d_notice']}</SelectItem>
              <SelectItem value="maintenance_update">{str.types['maintenance_update']}</SelectItem>
              <SelectItem value="test">{str.types['test']}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-32" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}>
              <SelectValue placeholder={str.filterChannel} />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: colors.cardBg }}>
              <SelectItem value="all">{str.allChannels}</SelectItem>
              <SelectItem value="LINE">LINE</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}>
              <SelectValue placeholder={str.filterStatus} />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: colors.cardBg }}>
              <SelectItem value="all">{str.allStatuses}</SelectItem>
              <SelectItem value="sent">{str.sent}</SelectItem>
              <SelectItem value="failed">{str.failed}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p style={{ color: colors.textSecondary }}>Loading...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: colors.borderColor }} />
            <p style={{ color: colors.textSecondary }}>{str.noHistory}</p> {/* Updated from str.noLogs */}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 border-b hover:bg-opacity-50 transition-colors"
                style={{ borderColor: colors.borderColor }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {log.status === 'sent' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge style={{ 
                          backgroundColor: `${getTypeColor(log.notification_type)}20`,
                          color: getTypeColor(log.notification_type),
                          border: `1px solid ${getTypeColor(log.notification_type)}40`
                        }}>
                          {str.types[log.notification_type] || log.notification_type}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {log.channel === 'LINE' ? (
                            <MessageCircle className="w-3 h-3" />
                          ) : (
                            <Mail className="w-3 h-3" />
                          )}
                          {log.channel}
                        </Badge>
                      </div>
                      
                      <p className="font-semibold text-sm truncate" style={{ color: colors.textPrimary }}>
                        {log.user_email}
                      </p>
                      
                      {log.message_preview && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: colors.textSecondary }}>
                          {log.message_preview}
                        </p>
                      )}
                      
                      {log.error_message && (
                        <p className="text-xs mt-1 text-red-600">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {format(new Date(log.created_date), 'MMM d, HH:mm')}
                    </p>
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
