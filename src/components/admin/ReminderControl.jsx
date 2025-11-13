
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Play, CheckCircle2, Clock, Loader2, AlertTriangle, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ReminderControl({ language, colors }) { // Updated function declaration and prop destructuring
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleRunReminders = async () => {
    setRunning(true);
    try {
      const response = await base44.functions.invoke('checkAllReminders', {});
      
      setLastResult({
        success: true,
        notifications_sent: response.data.notifications_sent || 0,
        details: response.data.details || [],
        timestamp: response.data.timestamp || new Date().toISOString()
      });
    } catch (error) {
      console.error('Reminder check failed:', error);
      setLastResult({
        success: false,
        error: error.message
      });
    } finally {
      setRunning(false);
    }
  };

  // The new 't' object, merging original translations with new keys from the outline.
  // All original keys that don't have a direct semantic replacement from the outline are preserved.
  const t = {
    en: {
      reminderControl: "Reminder Control", // New from outline, replaces 'title'
      reminderControlDesc: "Manually trigger reminder checks", // New from outline, replaces 'description'
      checkAll: "Check All Reminders", // New from outline, replaces 'runNow'
      checking: "Checking...", // New from outline, replaces 'running'
      lastRun: "Last run", // New from outline, same as old 'lastRun'
      never: "Never", // New from outline, can be used instead of 'notRunYet' if applicable
      
      // Preserve original keys not directly replaced by the outline's new keys
      notificationsSent: 'Notifications Sent',
      success: 'Success',
      failed: 'Failed',
      notRunYet: 'Not run yet', // Kept for safety, though 'never' is provided
      depositReminders: 'Deposit Reminders', // 'checkDeposits' from outline doesn't fit this context
      leaseNotices: 'Lease Notices',
      rentReminders: 'Rent Reminders',
      setupCron: 'Production Setup',
      cronInstructions: 'For production, set up a daily cron job to call this endpoint automatically',
      viewLogs: 'Check function logs for details'
    },
    th: {
      reminderControl: "ควบคุมการแจ้งเตือน",
      reminderControlDesc: "เรียกการตรวจสอบแจ้งเตือนด้วยตนเอง",
      checkAll: "ตรวจสอบทั้งหมด",
      checking: "กำลังตรวจสอบ...",
      lastRun: "ครั้งล่าสุด",
      never: "ไม่เคย",

      notificationsSent: 'การแจ้งเตือนที่ส่ง',
      success: 'สำเร็จ',
      failed: 'ล้มเหลว',
      notRunYet: 'ยังไม่ได้รัน',
      depositReminders: 'เตือนเงินมัดจำ',
      leaseNotices: 'แจ้งเตือนสัญญา',
      rentReminders: 'เตือนค่าเช่า',
      setupCron: 'การตั้งค่าสำหรับการใช้งานจริง',
      cronInstructions: 'สำหรับการใช้งานจริง ตั้งค่า cron job รายวันเพื่อเรียกใช้อัตโนมัติ',
      viewLogs: 'ตรวจสอบ function logs สำหรับรายละเอียด'
    },
    zh: {
      reminderControl: "提醒控制",
      reminderControlDesc: "手动触发提醒检查",
      checkAll: "检查所有提醒",
      checking: "检查中...",
      lastRun: "上次运行",
      never: "从未",

      notificationsSent: '已发送通知',
      success: '成功',
      failed: '失败',
      notRunYet: '尚未运行',
      depositReminders: '押金提醒',
      leaseNotices: '租约通知',
      rentReminders: '租金提醒',
      setupCron: '生产设置',
      cronInstructions: '对于生产环境，设置每日cron作业以自动调用此端点',
      viewLogs: '检查功能日志以获取详细信息'
    },
    ja: {
      reminderControl: "リマインダー制御",
      reminderControlDesc: "リマインダーチェックを手動でトリガー",
      checkAll: "すべてのリマインダーをチェック",
      checking: "チェック中...",
      lastRun: "最終実行",
      never: "なし",

      notificationsSent: '送信された通知',
      success: '成功',
      failed: '失敗',
      notRunYet: 'まだ実行されていません',
      depositReminders: '敷金リマインダー',
      leaseNotices: '賃貸契約通知',
      rentReminders: '家賃リマインダー',
      setupCron: '本番設定',
      cronInstructions: '本番環境では、このエンドポイントを自動的に呼び出すように毎日のcronジョブを設定してください',
      viewLogs: '詳細については機能ログを確認してください'
    },
    ko: {
      reminderControl: "알림 제어",
      reminderControlDesc: "수동으로 알림 확인 트리거",
      checkAll: "모든 알림 확인",
      checking: "확인 중...",
      lastRun: "마지막 실행",
      never: "안함",

      notificationsSent: '발송된 알림',
      success: '성공',
      failed: '실패',
      notRunYet: '아직 실행되지 않음',
      depositReminders: '보증금 알림',
      leaseNotices: '임대 통지',
      rentReminders: '임대료 알림',
      setupCron: '프로덕션 설정',
      cronInstructions: '프로덕션의 경우 이 엔드포인트를 자동으로 호출하도록 일일 cron 작업을 설정하세요',
      viewLogs: '세부 정보는 기능 로그를 확인하세요'
    }
  };

  const strings = t[language] || t.en; // Updated variable name and source for translations

  const categorizeNotifications = () => {
    if (!lastResult?.details) return { deposit: 0, lease: 0, rent: 0 };
    
    const categories = {
      deposit: lastResult.details.filter(n => 
        n.type.includes('deposit')
      ).length,
      lease: lastResult.details.filter(n => 
        n.type.includes('notice')
      ).length,
      rent: lastResult.details.filter(n => 
        n.type === 'rent_reminder'
      ).length
    };
    
    return categories;
  };

  const notificationBreakdown = categorizeNotifications();

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Bell className="w-5 h-5 text-purple-600" />
          {strings.reminderControl} {/* Updated from str.title */}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            {strings.reminderControlDesc} {/* Updated from str.description */}
          </p>
          
          <Button
            onClick={handleRunReminders}
            disabled={running}
            className="w-full"
            style={{
              backgroundColor: running ? colors.borderColor : '#7C3AED',
              color: '#FFFFFF'
            }}
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {strings.checking} {/* Updated from str.running */}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {strings.checkAll} {/* Updated from str.runNow */}
              </>
            )}
          </Button>
        </div>

        {lastResult && (
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: lastResult.success 
                ? (colors.cardBg === '#FFFFFF' ? '#F0FDF4' : '#064E3B20')
                : (colors.cardBg === '#FFFFFF' ? '#FEF2F2' : '#7F1D1D20'),
              borderColor: lastResult.success ? '#10B981' : '#EF4444'
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {lastResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold" style={{ 
                  color: lastResult.success ? '#047857' : '#DC2626' 
                }}>
                  {strings.success} {/* Updated from str.success */}
                </span>
              </div>
              <Badge className="bg-slate-100 text-slate-700 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(lastResult.timestamp).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US')}
              </Badge>
            </div>

            {lastResult.success && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.cardBg }}>
                    <p className="text-2xl font-bold text-blue-600">{notificationBreakdown.deposit}</p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{strings.depositReminders}</p> {/* Updated from str.depositReminders */}
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.cardBg }}>
                    <p className="text-2xl font-bold text-emerald-600">{notificationBreakdown.lease}</p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{strings.leaseNotices}</p> {/* Updated from str.leaseNotices */}
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: colors.cardBg }}>
                    <p className="text-2xl font-bold text-amber-600">{notificationBreakdown.rent}</p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{strings.rentReminders}</p> {/* Updated from str.rentReminders */}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ 
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`
                }}>
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {strings.notificationsSent} {/* Updated from str.notificationsSent */}
                  </span>
                  <span className="text-xl font-bold text-purple-600">
                    {lastResult.notifications_sent}
                  </span>
                </div>
              </div>
            )}

            {!lastResult.success && lastResult.error && (
              <p className="text-sm text-red-600 mt-2">
                {lastResult.error}
              </p>
            )}
          </div>
        )}

        <div
          className="p-4 rounded-lg text-xs"
          style={{
            backgroundColor: colors.cardBg === '#FFFFFF' ? '#EFF6FF' : '#1E3A8A20',
            border: `1px solid ${colors.cardBg === '#FFFFFF' ? '#BFDBFE' : '#3B82F6'}`
          }}
        >
          <div className="flex items-start gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                {strings.setupCron} {/* Updated from str.setupCron */}
              </p>
              <p style={{ color: colors.textSecondary }}>
                {strings.cronInstructions} {/* Updated from str.cronInstructions */}
              </p>
              <p className="mt-2 text-blue-600 font-mono text-xs">
                Dashboard → Code → Functions → checkAllReminders
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
