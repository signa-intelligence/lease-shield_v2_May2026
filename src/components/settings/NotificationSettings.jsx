import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LineConnectionFlow from './LineConnectionFlow';

export default function NotificationSettings({ user, onUpdate, colors }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: (data) => { // Added data parameter to onSuccess
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      if (onUpdate) onUpdate(data); // Pass data to onUpdate
    },
  });

  const language = user?.language || 'en';

  const strings = {
    en: {
      title: 'Notification Settings',
      subtitle: 'Manage how you receive alerts',
      emailNotifications: 'Email Notifications',
      emailDesc: 'Receive alerts via email',
      lineNotifications: 'LINE Notifications',
      lineDesc: 'Instant alerts via LINE app',
      premiumFeature: 'Premium Feature',
      enabled: 'Enabled',
      disabled: 'Disabled'
    },
    th: {
      title: 'การตั้งค่าการแจ้งเตือน',
      subtitle: 'จัดการวิธีที่คุณรับการแจ้งเตือน',
      emailNotifications: 'การแจ้งเตือนทางอีเมล',
      emailDesc: 'รับการแจ้งเตือนทางอีเมล',
      lineNotifications: 'การแจ้งเตือนทาง LINE',
      lineDesc: 'การแจ้งเตือนทันทีผ่านแอป LINE',
      premiumFeature: 'ฟีเจอร์พรีเมียม',
      enabled: 'เปิดใช้งาน',
      disabled: 'ปิดใช้งาน'
    },
    zh: {
      title: '通知设置',
      subtitle: '管理您接收提醒的方式',
      emailNotifications: '电子邮件通知',
      emailDesc: '通过电子邮件接收提醒',
      lineNotifications: 'LINE通知',
      lineDesc: '通过LINE应用即时提醒',
      premiumFeature: '高级功能',
      enabled: '已启用',
      disabled: '已禁用'
    },
    ja: {
      title: '通知設定',
      subtitle: 'アラートの受信方法を管理',
      emailNotifications: 'メール通知',
      emailDesc: 'メールでアラートを受信',
      lineNotifications: 'LINE通知',
      lineDesc: 'LINEアプリで即時アラート',
      premiumFeature: 'プレミアム機能',
      enabled: '有効',
      disabled: '無効'
    },
    ko: {
      title: '알림 설정',
      subtitle: '알림 수신 방법 관리',
      emailNotifications: '이메일 알림',
      emailDesc: '이메일로 알림 받기',
      lineNotifications: 'LINE 알림',
      lineDesc: 'LINE 앱으로 즉시 알림',
      premiumFeature: '프리미엄 기능',
      enabled: '활성화됨',
      disabled: '비활성화됨'
    }
  };

  const str = strings[language] || strings.en;

  const toggleEmail = () => {
    updateMutation.mutate({ email_notifications: !user?.email_notifications });
  };

  const toggleLine = () => {
    if (user?.line_messaging_token) {
      updateMutation.mutate({ line_notifications: !user?.line_notifications });
    }
  };
  
  // TIER CHECK: LINE notifications require Protect or Secure
  const userTier = user?.plan_tier || 'free';
  const lineAllowed = ['protect', 'secure'].includes(userTier);

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
        <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
          <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Bell className="w-5 h-5 text-blue-600" />
            {str.title}
          </CardTitle>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {str.subtitle}
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Email Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg" style={{
            backgroundColor: colors.bg,
            border: `1px solid ${colors.borderColor}`
          }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold" style={{ color: colors.textPrimary }}>
                  {str.emailNotifications}
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {str.emailDesc}
                </p>
              </div>
            </div>
            <Switch
              checked={user?.email_notifications !== false}
              onCheckedChange={toggleEmail}
            />
          </div>
          
          {/* LINE Toggle - TIER GATED */}
          {!lineAllowed && (
            <div className="p-4 rounded-lg border-2 border-dashed" style={{
              backgroundColor: colors.bg,
              borderColor: '#C7A338'
            }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {str.lineNotifications}
                  </p>
                  <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                    {language === 'th' 
                      ? 'ต้องการแผน Protect หรือ Secure เพื่อเปิดใช้งานการแจ้งเตือน LINE'
                      : language === 'zh'
                        ? '需要 Protect 或 Secure 计划才能启用 LINE 通知'
                        : language === 'ja'
                          ? 'LINE通知を有効にするには、ProtectまたはSecureプランが必要です'
                          : language === 'ko'
                            ? 'LINE 알림을 활성화하려면 Protect 또는 Secure 플랜이 필요합니다'
                            : language === 'ru'
                              ? 'Для включения уведомлений LINE требуется тариф Protect или Secure'
                              : 'Requires Protect or Secure tier to enable LINE notifications'}
                  </p>
                  <a
                    href="/account?showPlans=true"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#C7A338',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#C7A338'}
                  >
                    {language === 'th' ? 'อัปเกรด' : language === 'zh' ? '升级' : language === 'ja' ? 'アップグレード' : language === 'ko' ? '업그레이드' : language === 'ru' ? 'Обновить' : 'Upgrade Now'}
                  </a>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LINE Connection Flow as separate card - ONLY show if tier allows */}
      {lineAllowed && <LineConnectionFlow user={user} onUpdate={onUpdate} colors={colors} />}
    </div>
  );
}