import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, Save, Loader2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NotificationPreferences({ user, onUpdate, colors }) {
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: user?.email_notifications ?? true,
    line_notifications: user?.line_notifications ?? false,
    deposit_alerts: user?.deposit_alerts ?? true,
    lease_notices: user?.lease_notices ?? true,
    rent_reminders: user?.rent_reminders ?? true,
    maintenance_updates: user?.maintenance_updates ?? true,
    case_updates: user?.case_updates ?? true,
    marketing_emails: user?.marketing_emails ?? false
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userTier = user?.plan_tier || 'free';
  const hasLineAccess = ['protect', 'secure'].includes(userTier);

  const strings = {
    en: {
      title: 'Notification Preferences',
      subtitle: 'Control what notifications you receive and when',
      channels: 'Notification Channels',
      email: 'Email Notifications',
      line: 'LINE Notifications',
      types: 'Notification Types',
      depositAlerts: 'Deposit Return Alerts',
      deposit30d: '30 days before return',
      deposit7d: '7 days before return',
      deposit3d: '3 days before return',
      depositOverdue: 'Overdue notifications',
      leaseNotices: 'Lease End Notices',
      lease30d: '30 days before deadline',
      lease7d: '7 days before deadline',
      lease3d: '3 days before deadline',
      lease0d: 'Day of deadline',
      rentReminders: 'Rent Payment Reminders',
      rentReminderDesc: 'Before rent is due',
      maintenanceUpdates: 'Maintenance Updates',
      maintenanceDesc: 'Request status changes',
      caseUpdates: 'Case Updates',
      caseDesc: 'Dispute case progress',
      marketing: 'Marketing & Tips',
      marketingDesc: 'Product updates and tips',
      quietHours: 'Quiet Hours (Do Not Disturb)',
      quietHoursDesc: 'Pause notifications during these hours',
      enable: 'Enable',
      startTime: 'Start Time',
      endTime: 'End Time',
      timezone: 'Timezone',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      allEnabled: 'All notifications enabled',
      someDisabled: 'Some notifications disabled',
      lineNotConnected: 'Connect LINE for instant notifications',
      connectLine: 'Connect LINE',
      premiumFeature: 'Premium Feature',
      requiresPremium: 'Available on Protect and Secure plans'
    },
    th: {
      title: 'การตั้งค่าการแจ้งเตือน',
      subtitle: 'ควบคุมการแจ้งเตือนที่คุณต้องการรับและเวลา',
      channels: 'ช่องทางการแจ้งเตือน',
      email: 'การแจ้งเตือนทางอีเมล',
      line: 'การแจ้งเตือนทาง LINE',
      types: 'ประเภทการแจ้งเตือน',
      depositAlerts: 'การแจ้งเตือนคืนเงินมัดจำ',
      deposit30d: '30 วันก่อนครบกำหนดคืน',
      deposit7d: '7 วันก่อนครบกำหนดคืน',
      deposit3d: '3 วันก่อนครบกำหนดคืน',
      depositOverdue: 'การแจ้งเตือนเกินกำหนด',
      leaseNotices: 'การแจ้งเตือนสัญญาหมดอายุ',
      lease30d: '30 วันก่อนถึงกำหนด',
      lease7d: '7 วันก่อนถึงกำหนด',
      lease3d: '3 วันก่อนถึงกำหนด',
      lease0d: 'วันที่ครบกำหนด',
      rentReminders: 'การเตือนชำระค่าเช่า',
      rentReminderDesc: 'ก่อนถึงกำหนดชำระ',
      maintenanceUpdates: 'อัปเดตการซ่อมบำรุง',
      maintenanceDesc: 'การเปลี่ยนแปลงสถานะคำขอ',
      caseUpdates: 'อัปเดตคดี',
      caseDesc: 'ความคืบหน้าของคดีพิพาท',
      marketing: 'การตลาดและเคล็ดลับ',
      marketingDesc: 'อัปเดตผลิตภัณฑ์และเคล็ดลับ',
      quietHours: 'ช่วงเวลาเงียบ (ห้ามรบกวน)',
      quietHoursDesc: 'หยุดการแจ้งเตือนชั่วคราวในช่วงเวลานี้',
      enable: 'เปิดใช้งาน',
      startTime: 'เวลาเริ่มต้น',
      endTime: 'เวลาสิ้นสุด',
      timezone: 'เขตเวลา',
      saveChanges: 'บันทึกการเปลี่ยนแปลง',
      saving: 'กำลังบันทึก...',
      allEnabled: 'เปิดการแจ้งเตือนทั้งหมด',
      someDisabled: 'ปิดการแจ้งเตือนบางส่วน',
      lineNotConnected: 'เชื่อมต่อ LINE เพื่อรับการแจ้งเตือนทันที',
      connectLine: 'เชื่อมต่อ LINE',
      premiumFeature: 'ฟีเจอร์พรีเมียม',
      requiresPremium: 'ใช้ได้ในแผน Protect และ Secure'
    },
    zh: {
      title: '通知偏好设置',
      subtitle: '控制您接收通知的内容和时间',
      channels: '通知渠道',
      email: '电子邮件通知',
      line: 'LINE通知',
      types: '通知类型',
      depositAlerts: '押金退还提醒',
      deposit30d: '退还前30天',
      deposit7d: '退还前7天',
      deposit3d: '退还前3天',
      depositOverdue: '逾期通知',
      leaseNotices: '租约结束通知',
      lease30d: '截止日期前30天',
      lease7d: '截止日期前7天',
      lease3d: '截止日期前3天',
      lease0d: '截止当天',
      rentReminders: '租金支付提醒',
      rentReminderDesc: '租金到期前',
      maintenanceUpdates: '维护更新',
      maintenanceDesc: '请求状态变更',
      caseUpdates: '案件更新',
      caseDesc: '争议案件进展',
      marketing: '营销和提示',
      marketingDesc: '产品更新和提示',
      quietHours: '免打扰时段',
      quietHoursDesc: '在这些时段暂停通知',
      enable: '启用',
      startTime: '开始时间',
      endTime: '结束时间',
      timezone: '时区',
      saveChanges: '保存更改',
      saving: '保存中...',
      allEnabled: '所有通知已启用',
      someDisabled: '部分通知已禁用',
      lineNotConnected: '连接LINE以获得即时通知',
      connectLine: '连接LINE',
      premiumFeature: '高级功能',
      requiresPremium: '适用于保护版和安全版计划'
    },
    ja: {
      title: '通知設定',
      subtitle: '受信する通知とタイミングを制御',
      channels: '通知チャンネル',
      email: 'メール通知',
      line: 'LINE通知',
      types: '通知タイプ',
      depositAlerts: '敷金返還アラート',
      deposit30d: '返還30日前',
      deposit7d: '返還7日前',
      deposit3d: '返還3日前',
      depositOverdue: '期限超過通知',
      leaseNotices: '賃貸契約終了通知',
      lease30d: '期限30日前',
      lease7d: '期限7日前',
      lease3d: '期限3日前',
      lease0d: '期限当日',
      rentReminders: '家賃支払いリマインダー',
      rentReminderDesc: '家賃期日前',
      maintenanceUpdates: 'メンテナンス更新',
      maintenanceDesc: 'リクエストステータス変更',
      caseUpdates: 'ケース更新',
      caseDesc: '紛争ケース進捗',
      marketing: 'マーケティングとヒント',
      marketingDesc: '製品更新とヒント',
      quietHours: '静音時間（お休みモード）',
      quietHoursDesc: 'この時間帯は通知を一時停止',
      enable: '有効にする',
      startTime: '開始時刻',
      endTime: '終了時刻',
      timezone: 'タイムゾーン',
      saveChanges: '変更を保存',
      saving: '保存中...',
      allEnabled: '全ての通知が有効',
      someDisabled: '一部の通知が無効',
      lineNotConnected: 'LINEを接続して即時通知を受け取る',
      connectLine: 'LINEを接続',
      premiumFeature: 'プレミアム機能',
      requiresPremium: 'プロテクトおよびセキュアプランで利用可能'
    },
    ko: {
      title: '알림 설정',
      subtitle: '받을 알림과 시기 제어',
      channels: '알림 채널',
      email: '이메일 알림',
      line: 'LINE 알림',
      types: '알림 유형',
      depositAlerts: '보증금 반환 알림',
      deposit30d: '반환 30일 전',
      deposit7d: '반환 7일 전',
      deposit3d: '반환 3일 전',
      depositOverdue: '기한 초과 알림',
      leaseNotices: '임대 종료 통지',
      lease30d: '마감일 30일 전',
      lease7d: '마감일 7일 전',
      lease3d: '마감일 3일 전',
      lease0d: '마감일 당일',
      rentReminders: '임대료 지급 알림',
      rentReminderDesc: '임대료 만기일 전',
      maintenanceUpdates: '유지보수 업데이트',
      maintenanceDesc: '요청 상태 변경',
      caseUpdates: '사례 업데이트',
      caseDesc: '분쟁 사례 진행 상황',
      marketing: '마케팅 및 팁',
      marketingDesc: '제품 업데이트 및 팁',
      quietHours: '방해 금지 시간',
      quietHoursDesc: '이 시간 동안 알림 일시 중지',
      enable: '활성화',
      startTime: '시작 시간',
      endTime: '종료 시간',
      timezone: '시간대',
      saveChanges: '변경사항 저장',
      saving: '저장 중...',
      allEnabled: '모든 알림 활성화됨',
      someDisabled: '일부 알림 비활성화됨',
      lineNotConnected: '즉시 알림을 위해 LINE 연결',
      connectLine: 'LINE 연결',
      premiumFeature: '프리미엄 기능',
      requiresPremium: '보호 및 시큐어 플랜에서 사용 가능'
    }
  };

  const str = strings[language] || strings.en;

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(preferences);
    setSaving(false);
  };

  const notificationCategories = [
    {
      key: 'deposit_alerts',
      label: str.depositAlerts,
      description: str.deposit30d + ' • ' + str.deposit7d + ' • ' + str.deposit3d + ' • ' + str.depositOverdue,
      icon: Bell
    },
    {
      key: 'lease_notices',
      label: str.leaseNotices,
      description: str.lease30d + ' • ' + str.lease7d + ' • ' + str.lease3d + ' • ' + str.lease0d,
      icon: Bell
    },
    {
      key: 'rent_reminders',
      label: str.rentReminders,
      description: str.rentReminderDesc,
      icon: Bell,
      requiresPremium: !hasLineAccess
    },
    {
      key: 'maintenance_updates',
      label: str.maintenanceUpdates,
      description: str.maintenanceDesc,
      icon: Bell
    },
    {
      key: 'case_updates',
      label: str.caseUpdates,
      description: str.caseDesc,
      icon: Bell
    },
    {
      key: 'marketing_emails',
      label: str.marketing,
      description: str.marketingDesc,
      icon: Mail
    }
  ];

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Bell className="w-5 h-5 text-ls-forest" />
          {str.title}
        </CardTitle>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          {str.subtitle}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <MessageSquare className="w-4 h-4 text-ls-gold" />
            {str.channels}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <Label className="font-semibold cursor-pointer" style={{ color: colors.textPrimary }}>
                    {str.email}
                  </Label>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {user?.email}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, email_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg" style={{ 
              backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
              opacity: hasLineAccess ? 1 : 0.6
            }}>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold cursor-pointer" style={{ color: colors.textPrimary }}>
                      {str.line}
                    </Label>
                    {!hasLineAccess && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        {str.premiumFeature}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {user?.line_messaging_token ? str.allEnabled : str.lineNotConnected}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.line_notifications && hasLineAccess}
                onCheckedChange={(checked) => setPreferences({ ...preferences, line_notifications: checked })}
                disabled={!hasLineAccess || !user?.line_messaging_token}
              />
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${colors.borderColor}`, paddingTop: '24px' }}>
          <h3 className="font-semibold mb-4" style={{ color: colors.textPrimary }}>
            {str.types}
          </h3>
          <div className="space-y-3">
            {notificationCategories.map(category => {
              const Icon = category.icon;
              const isLocked = category.requiresPremium;
              
              return (
                <div
                  key={category.key}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ 
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    opacity: isLocked ? 0.6 : 1
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-ls-forest" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold cursor-pointer" style={{ color: colors.textPrimary }}>
                          {category.label}
                        </Label>
                        {isLocked && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[category.key] && !isLocked}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, [category.key]: checked })}
                    disabled={isLocked}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-ls-forest hover:bg-ls-forest/90 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {str.saving}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {str.saveChanges}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}