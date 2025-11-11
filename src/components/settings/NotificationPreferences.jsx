import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Save, 
  AlertCircle,
  Shield,
  Calendar,
  DollarSign,
  Wrench,
  Scale,
  Mail,
  MessageCircle,
  Moon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NotificationPreferences({ user, onUpdate, colors }) {
  const [preferences, setPreferences] = useState(
    user?.notification_preferences || {
      deposit_30d: true,
      deposit_7d: true,
      deposit_3d: true,
      deposit_overdue: true,
      lease_30d: true,
      lease_7d: true,
      lease_3d: true,
      lease_0d: true,
      rent_reminder: true,
      maintenance_updates: true,
      case_updates: true,
      marketing: false
    }
  );

  const [quietHours, setQuietHours] = useState(
    user?.quiet_hours || {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  );

  const [timezone, setTimezone] = useState(user?.notification_timezone || 'Asia/Bangkok');
  const [hasChanges, setHasChanges] = useState(false);

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setHasChanges(false);
      if (onUpdate) onUpdate();
    }
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

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
    }
  };

  const str = strings[language];

  const notificationCategories = [
    {
      title: str.depositAlerts,
      icon: Shield,
      color: '#10B981',
      items: [
        { key: 'deposit_30d', label: str.deposit30d },
        { key: 'deposit_7d', label: str.deposit7d },
        { key: 'deposit_3d', label: str.deposit3d },
        { key: 'deposit_overdue', label: str.depositOverdue }
      ]
    },
    {
      title: str.leaseNotices,
      icon: Calendar,
      color: '#3B82F6',
      items: [
        { key: 'lease_30d', label: str.lease30d },
        { key: 'lease_7d', label: str.lease7d },
        { key: 'lease_3d', label: str.lease3d },
        { key: 'lease_0d', label: str.lease0d }
      ]
    },
    {
      title: str.rentReminders,
      icon: DollarSign,
      color: '#C7A338',
      items: [
        { key: 'rent_reminder', label: str.rentReminderDesc }
      ]
    },
    {
      title: str.maintenanceUpdates,
      icon: Wrench,
      color: '#F59E0B',
      items: [
        { key: 'maintenance_updates', label: str.maintenanceDesc }
      ]
    },
    {
      title: str.caseUpdates,
      icon: Scale,
      color: '#8B5CF6',
      items: [
        { key: 'case_updates', label: str.caseDesc }
      ]
    },
    {
      title: str.marketing,
      icon: Mail,
      color: '#64748b',
      items: [
        { key: 'marketing', label: str.marketingDesc }
      ]
    }
  ];

  const togglePreference = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const toggleChannel = (channel) => {
    const updateData = channel === 'email' 
      ? { email_notifications: !user?.email_notifications }
      : { line_notifications: !user?.line_notifications };
    
    updateMutation.mutate(updateData);
  };

  const handleSave = () => {
    updateMutation.mutate({
      notification_preferences: preferences,
      quiet_hours: quietHours,
      notification_timezone: timezone
    });
  };

  const enabledCount = Object.values(preferences).filter(v => v === true).length;
  const totalCount = Object.keys(preferences).length;
  const hasLineAccess = user?.plan_tier === 'protect' || user?.plan_tier === 'secure';

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 mb-1" style={{ color: colors.textPrimary }}>
              <Bell className="w-5 h-5 text-blue-600" />
              {str.title}
            </CardTitle>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {str.subtitle}
            </p>
          </div>
          <Badge className={enabledCount === totalCount ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
            {enabledCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Channels */}
        <div>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <MessageCircle className="w-4 h-4" />
            {str.channels}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{
              backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
              border: `1px solid ${colors.borderColor}`
            }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>{str.email}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{user?.email}</p>
                </div>
              </div>
              <Switch
                checked={user?.email_notifications !== false}
                onCheckedChange={() => toggleChannel('email')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg" style={{
              backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
              border: `1px solid ${colors.borderColor}`
            }}>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>{str.line}</p>
                    {!hasLineAccess && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        {str.premiumFeature}
                      </Badge>
                    )}
                  </div>
                  {user?.line_messaging_token ? (
                    <p className="text-xs text-emerald-600">{language === 'th' ? 'เชื่อมต่อแล้ว' : 'Connected'}</p>
                  ) : (
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {hasLineAccess ? str.lineNotConnected : str.requiresPremium}
                    </p>
                  )}
                </div>
              </div>
              <Switch
                checked={user?.line_notifications === true}
                onCheckedChange={() => toggleChannel('line')}
                disabled={!user?.line_messaging_token || !hasLineAccess}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Bell className="w-4 h-4" />
            {str.types}
          </h3>
          <div className="space-y-4">
            {notificationCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.title}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: category.color }} />
                    </div>
                    <h4 className="font-semibold" style={{ color: colors.textPrimary }}>
                      {category.title}
                    </h4>
                  </div>
                  <div className="space-y-2 ml-11">
                    {category.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-2">
                        <Label
                          htmlFor={item.key}
                          className="text-sm cursor-pointer"
                          style={{ color: colors.textPrimary }}
                        >
                          {item.label}
                        </Label>
                        <Switch
                          id={item.key}
                          checked={preferences[item.key] !== false}
                          onCheckedChange={() => togglePreference(item.key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Moon className="w-4 h-4" />
            {str.quietHours}
          </h3>
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
              border: `1px solid ${colors.borderColor}`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold" style={{ color: colors.textPrimary }}>{str.enable}</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{str.quietHoursDesc}</p>
              </div>
              <Switch
                checked={quietHours.enabled}
                onCheckedChange={(checked) => {
                  setQuietHours(prev => ({ ...prev, enabled: checked }));
                  setHasChanges(true);
                }}
              />
            </div>
            {quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: colors.textPrimary }}>{str.startTime}</Label>
                  <Select
                    value={quietHours.start}
                    onValueChange={(value) => {
                      setQuietHours(prev => ({ ...prev, start: value }));
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{ color: colors.textPrimary }}>{str.endTime}</Label>
                  <Select
                    value={quietHours.end}
                    onValueChange={(value) => {
                      setQuietHours(prev => ({ ...prev, end: value }));
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timezone */}
        <div>
          <Label style={{ color: colors.textPrimary }}>{str.timezone}</Label>
          <Select
            value={timezone}
            onValueChange={(value) => {
              setTimezone(value);
              setHasChanges(true);
            }}
          >
            <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Bangkok">Bangkok (GMT+7)</SelectItem>
              <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
              <SelectItem value="Asia/Hong_Kong">Hong Kong (GMT+8)</SelectItem>
              <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
              <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-4 border-t" style={{ borderColor: colors.borderColor }}>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  {str.saving}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {str.saveChanges}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}