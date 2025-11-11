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

const TestNotifications = ({ users = [], language = 'en', colors }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

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
          message: language === 'th' 
            ? `✅ ส่งการแจ้งเตือนทดสอบสำเร็จ ผ่าน ${response.data.channel}` 
            : `✅ Test notification sent successfully via ${response.data.channel}`,
          channel: response.data.channel
        });
      } else {
        throw new Error(response.data.error || 'Failed to send');
      }

    } catch (error) {
      console.error('Test notification error:', error);
      setResult({
        success: false,
        message: language === 'th' 
          ? `❌ ไม่สามารถส่งได้: ${error.message}` 
          : `❌ Failed to send: ${error.message}`
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
          {language === 'th' ? 'ทดสอบการแจ้งเตือน' : 'Test Notifications'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* User Selection */}
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
            {language === 'th' ? 'เลือกผู้ใช้' : 'Select User'}
          </label>
          <Select value={selectedUser || ''} onValueChange={setSelectedUser}>
            <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <SelectValue placeholder={language === 'th' ? 'เลือกผู้ใช้...' : 'Select user...'} />
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
              {selectedUserObj.line_notifications && selectedUserObj.line_messaging_token && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  LINE Enabled
                </Badge>
              )}
              {selectedUserObj.email_notifications && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  <Mail className="w-3 h-3 mr-1" />
                  Email Enabled
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Notification Type Selection */}
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
            {language === 'th' ? 'ประเภทการแจ้งเตือน' : 'Notification Type'}
          </label>
          <Select value={selectedType || ''} onValueChange={setSelectedType}>
            <SelectTrigger style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <SelectValue placeholder={language === 'th' ? 'เลือกประเภท...' : 'Select type...'} />
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
              {language === 'th' ? 'กำลังส่ง...' : 'Sending...'}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {language === 'th' ? 'ส่งการแจ้งเตือนทดสอบ' : 'Send Test Notification'}
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
            {language === 'th' 
              ? '💡 การแจ้งเตือนจะถูกส่งผ่าน LINE หากเปิดใช้งาน มิฉะนั้นจะส่งทางอีเมล ข้อความจะใช้ภาษาตามการตั้งค่าของผู้ใช้'
              : '💡 Notifications will be sent via LINE if enabled, otherwise via email. Messages will use the user\'s language preference'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestNotifications;