
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, CheckCircle2, XCircle, Loader2, MessageCircle, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NOTIFICATION_TYPES = [
  { 
    key: 'deposit_30d', 
    label: 'Deposit 30-day Reminder',
    labelTh: 'เตือนเงินมัดจำ 30 วัน',
    description: 'Sent 30 days before deposit return',
    channel: 'both'
  },
  { 
    key: 'deposit_7d', 
    label: 'Deposit 7-day Warning',
    labelTh: 'เตือนเงินมัดจำ 7 วัน',
    description: 'Sent 7 days before deposit return',
    channel: 'both'
  },
  { 
    key: 'deposit_3d', 
    label: 'Deposit 3-day Urgent',
    labelTh: 'เตือนเงินมัดจำ 3 วัน (เร่งด่วน)',
    description: 'Sent 3 days before deposit return',
    channel: 'both'
  },
  { 
    key: 'deposit_overdue', 
    label: 'Deposit Overdue Alert',
    labelTh: 'แจ้งเตือนเงินมัดจำเกินกำหนด',
    description: 'Sent when deposit not returned',
    channel: 'both'
  },
  { 
    key: 'lease_30d', 
    label: 'Lease Notice 30-day',
    labelTh: 'เตือนแจ้งสัญญา 30 วัน',
    description: '30 days before notice deadline',
    channel: 'both'
  },
  { 
    key: 'lease_7d', 
    label: 'Lease Notice 7-day',
    labelTh: 'เตือนแจ้งสัญญา 7 วัน',
    description: '7 days before notice deadline',
    channel: 'both'
  },
  { 
    key: 'lease_3d', 
    label: 'Lease Notice 3-day Final',
    labelTh: 'เตือนแจ้งสัญญา 3 วัน (สุดท้าย)',
    description: '3 days before notice deadline',
    channel: 'both'
  },
  { 
    key: 'rent_reminder', 
    label: 'Rent Payment Reminder',
    labelTh: 'เตือนชำระค่าเช่า',
    description: 'Sent before rent due date',
    channel: 'both'
  },
];

export default function TestNotifications({ users = [], language = 'en', colors }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const t = {
    en: {
      testNotifications: "Test Notifications",
      testNotificationsDesc: "Send test notifications to users",
      selectUser: "Select User",
      selectUserPlaceholder: "Choose a user...",
      notificationType: "Notification Type", // Kept from original, as it's used
      selectTypePlaceholder: "Select type...", // Kept from original, as it's used
      sendTest: "Send Test", // Updated to shorter version from outline
      sending: "Sending...",
      successMessage: "Test notification sent successfully via", // Kept from original, as it's used
      errorMessage: "Failed to send:", // Kept from original, as it's used
      infoText: 'Notifications will be sent via LINE if enabled, otherwise via email. Messages will use the user\'s language preference', // Kept from original, as it's used
      lineConnected: "LINE Connected",
      lineNotConnected: "LINE Not Connected",
      emailEnabled: "Email Enabled",
      emailDisabled: "Email Disabled"
    },
    th: {
      testNotifications: "ทดสอบการแจ้งเตือน",
      testNotificationsDesc: "ส่งการแจ้งเตือนทดสอบไปยังผู้ใช้",
      selectUser: "เลือกผู้ใช้",
      selectUserPlaceholder: "เลือกผู้ใช้...",
      notificationType: "ประเภทการแจ้งเตือน",
      selectTypePlaceholder: "เลือกประเภท...",
      sendTest: "ส่งทดสอบ",
      sending: "กำลังส่ง...",
      successMessage: "ส่งการแจ้งเตือนทดสอบสำเร็จ ผ่าน",
      errorMessage: "ไม่สามารถส่งได้:",
      infoText: "การแจ้งเตือนจะถูกส่งผ่าน LINE หากเปิดใช้งาน มิฉะนั้นจะส่งทางอีเมล ข้อความจะใช้ภาษาตามการตั้งค่าของผู้ใช้",
      lineConnected: "เชื่อมต่อ LINE แล้ว",
      lineNotConnected: "ไม่ได้เชื่อมต่อ LINE",
      emailEnabled: "เปิดอีเมล",
      emailDisabled: "ปิดอีเมล"
    },
    zh: {
      testNotifications: "测试通知",
      testNotificationsDesc: "向用户发送测试通知",
      selectUser: "选择用户",
      selectUserPlaceholder: "选择用户...",
      notificationType: "通知类型",
      selectTypePlaceholder: "选择类型...",
      sendTest: "发送测试",
      sending: "发送中...",
      successMessage: "测试通知成功发送通过",
      errorMessage: "发送失败：",
      infoText: "如果启用，通知将通过LINE发送，否则通过电子邮件。消息将使用用户的语言偏好",
      lineConnected: "LINE已连接",
      lineNotConnected: "LINE未连接",
      emailEnabled: "电子邮件已启用",
      emailDisabled: "电子邮件已禁用"
    },
    ja: {
      testNotifications: "通知テスト",
      testNotificationsDesc: "ユーザーにテスト通知を送信",
      selectUser: "ユーザーを選択",
      selectUserPlaceholder: "ユーザーを選択...",
      notificationType: "通知タイプ",
      selectTypePlaceholder: "タイプを選択...",
      sendTest: "テスト送信",
      sending: "送信中...",
      successMessage: "テスト通知が正常に送信されました",
      errorMessage: "送信失敗：",
      infoText: "有効な場合、通知はLINE経由で送信されます。それ以外の場合はメールで送信されます。メッセージはユーザーの言語設定を使用します",
      lineConnected: "LINE接続済み",
      lineNotConnected: "LINE未接続",
      emailEnabled: "メール有効",
      emailDisabled: "メール無効"
    },
    ko: {
      testNotifications: "알림 테스트",
      testNotificationsDesc: "사용자에게 테스트 알림 보내기",
      selectUser: "사용자 선택",
      selectUserPlaceholder: "사용자 선택...",
      notificationType: "알림 유형",
      selectTypePlaceholder: "유형 선택...",
      sendTest: "테스트 보내기",
      sending: "전송 중...",
      successMessage: "테스트 알림이 성공적으로 전송되었습니다",
      errorMessage: "전송 실패：",
      infoText: "활성화된 경우 LINE을 통해 알림이 전송되고, 그렇지 않으면 이메일을 통해 전송됩니다. 메시지는 사용자의 언어 기본 설정을 사용합니다",
      lineConnected: "LINE 연결됨",
      lineNotConnected: "LINE 연결 안됨",
      emailEnabled: "이메일 활성화됨",
      emailDisabled: "이메일 비활성화됨"
    }
  };

  const str = t[language] || t.en;

  const handleSendTest = async () => {
    if (!selectedUser || !selectedType) {
      setResult({ success: false, message: 'Please select user and notification type' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const user = users.find(u => u.email === selectedUser);
      if (!user) throw new Error('User not found');

      // Call the test notification function
      const response = await base44.functions.invoke('testNotification', {
        userEmail: user.email,
        notificationType: selectedType
      });

      if (response.data.success) {
        setResult({
          success: true,
          message: `✅ ${str.successMessage} ${response.data.channel}`,
          channel: response.data.channel
        });
      } else {
        throw new Error(response.data.error || 'Failed to send');
      }

    } catch (error) {
      console.error('Test notification error:', error);
      setResult({
        success: false,
        message: `❌ ${str.errorMessage} ${error.message}`
      });
    } finally {
      setSending(false);
    }
  };

  const selectedTypeObj = NOTIFICATION_TYPES.find(t => t.key === selectedType);
  const selectedUserObj = users.find(u => u.email === selectedUser);

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Bell className="w-5 h-5 text-blue-600" />
          {str.testNotifications}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* User Selection */}
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
            {str.selectUser}
          </label>
          <Select value={selectedUser || ''} onValueChange={setSelectedUser}>
            <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <SelectValue placeholder={str.selectUserPlaceholder} />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: colors.cardBg }}>
              {users.map(user => (
                <SelectItem key={user.email} value={user.email}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: colors.textPrimary }}>{user.full_name || user.email}</span>
                    {user.line_notifications && user.line_messaging_token && (
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    )}
                    {user.email_notifications && (
                      <Mail className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedUserObj && (
            <div className="mt-2 flex gap-2">
              {selectedUserObj.line_notifications && selectedUserObj.line_messaging_token ? (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {str.lineConnected}
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-700 text-xs">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {str.lineNotConnected}
                </Badge>
              )}
              {selectedUserObj.email_notifications ? (
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  <Mail className="w-3 h-3 mr-1" />
                  {str.emailEnabled}
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-700 text-xs">
                  <Mail className="w-3 h-3 mr-1" />
                  {str.emailDisabled}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Notification Type Selection */}
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
            {str.notificationType}
          </label>
          <Select value={selectedType || ''} onValueChange={setSelectedType}>
            <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <SelectValue placeholder={str.selectTypePlaceholder} />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: colors.cardBg }}>
              {NOTIFICATION_TYPES.map(type => (
                <SelectItem key={type.key} value={type.key}>
                  <div>
                    <div style={{ color: colors.textPrimary }}>
                      {language === 'th' ? type.labelTh : type.label}
                    </div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>
                      {type.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendTest}
          disabled={!selectedUser || !selectedType || sending}
          className="w-full"
          style={{
            backgroundColor: sending ? colors.borderColor : '#3B82F6',
            color: '#FFFFFF'
          }}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {str.sending}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {str.sendTest}
            </>
          )}
        </Button>

        {/* Result Display */}
        {result && (
          <div
            className="p-4 rounded-lg flex items-start gap-3"
            style={{
              backgroundColor: result.success 
                ? (colors.cardBg === '#FFFFFF' ? '#ECFDF5' : '#064E3B20')
                : (colors.cardBg === '#FFFFFF' ? '#FEE2E2' : '#7F1D1D20'),
              border: `1px solid ${result.success ? '#10B981' : '#EF4444'}`
            }}
          >
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ 
                color: result.success ? '#047857' : '#DC2626' 
              }}>
                {result.message}
              </p>
              {result.channel && (
                <div className="mt-2 flex gap-2">
                  {result.channel === 'LINE' && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      via LINE
                    </Badge>
                  )}
                  {result.channel === 'Email' && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      <Mail className="w-3 h-3 mr-1" />
                      via Email
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div
          className="p-3 rounded-lg text-xs"
          style={{
            backgroundColor: colors.cardBg === '#FFFFFF' ? '#F3F4F6' : '#374151',
            border: `1px solid ${colors.borderColor}`
          }}
        >
          <p style={{ color: colors.textSecondary }}>
            💡 {str.infoText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
