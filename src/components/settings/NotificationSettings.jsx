
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function NotificationSettings({ user, onUpdate }) {
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? true);
  const [lineNotifications, setLineNotifications] = useState(user?.line_notifications ?? false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const hasLineToken = !!user?.line_messaging_token;

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isDarkMode = currentUser?.theme === 'dark';
  const language = currentUser?.language || 'en';

  const colors = isDarkMode ? {
    cardBg: '#2A2D30',
    headerBg: '#353A3D',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    infoBg: '#353A3D'
  } : {
    cardBg: '#FFFFFF',
    headerBg: '#ECEFED',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    infoBg: '#ECEFED'
  };

  const t = {
    en: {
      notifications: "Notifications",
      emailNotifications: "Email Notifications",
      emailDesc: "Deposit reminders and important updates",
      lineNotifications: "LINE Notifications",
      lineDesc: "Get instant deposit reminders via LINE Official Account",
      connected: "Connected",
      notConnected: "Not Connected",
      addOnLine: "Add Lease Shield on LINE",
      instructions: (email) => `After adding, send "connect ${email}" to link your account`,
      savePreferences: "Save Preferences",
      sendTest: "Send Test Message",
      testSuccess: "Test message sent! Check your LINE app 📱",
      testError: "Failed to send. Please try again.",
      sending: "Sending..."
    },
    th: {
      notifications: "การแจ้งเตือน",
      emailNotifications: "การแจ้งเตือนทางอีเมล",
      emailDesc: "การแจ้งเตือนเกี่ยวกับเงินมัดจำและข้อมูลสำคัญ",
      lineNotifications: "การแจ้งเตือนทาง LINE",
      lineDesc: "รับการแจ้งเตือนเกี่ยวกับเงินมัดจำทันทีผ่าน LINE Official Account",
      connected: "เชื่อมต่อแล้ว",
      notConnected: "ยังไม่ได้เชื่อมต่อ",
      addOnLine: "เพิ่ม Lease Shield บน LINE",
      instructions: (email) => `หลังจากเพิ่มแล้ว ส่ง "connect ${email}" เพื่อเชื่อมต่อบัญชี`,
      savePreferences: "บันทึกการตั้งค่า",
      sendTest: "ส่งข้อความทดสอบ",
      testSuccess: "ส่งข้อความทดสอบแล้ว! ตรวจสอบแอป LINE ของคุณ 📱",
      testError: "ส่งไม่สำเร็จ กรุณาลองอีกครั้ง",
      sending: "กำลังส่ง..."
    }
  };

  const strings = t[language];

  const handleSave = () => {
    onUpdate({
      email_notifications: emailNotifications,
      line_notifications: lineNotifications
    });
  };

  const handleLineConnect = () => {
    const lineOfficialAccountId = '@leaseshield'; // Changed from '@071vchfv' to '@leaseshield'
    const addFriendUrl = `https://line.me/R/ti/p/${lineOfficialAccountId}`;
    window.open(addFriendUrl, '_blank');
  };

  const handleSendTest = async () => {
    if (!hasLineToken) return;
    
    setSendingTest(true);
    setTestResult(null);

    try {
      const testMessage = language === 'th' 
        ? `🧪 ข้อความทดสอบ Lease Shield\n\nการแจ้งเตือนทาง LINE ทำงานได้ดี! ✅\n\nคุณจะได้รับการแจ้งเตือนเกี่ยวกับเงินมัดจำที่นี่`
        : `🧪 Lease Shield Test Message\n\nYour LINE notifications are working! ✅\n\nYou'll receive deposit reminders here`;

      await base44.functions.invoke('sendLineMessage', {
        userId: user.line_messaging_token,
        message: testMessage
      });

      setTestResult('success');
      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      console.error('Test message failed:', error);
      setTestResult('error');
      setTimeout(() => setTestResult(null), 5000);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}`, backgroundColor: colors.headerBg }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Bell className="w-5 h-5 text-ls-forest" />
          {strings.notifications}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold" style={{ color: colors.textPrimary }}>{strings.emailNotifications}</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {strings.emailDesc}
              </p>
            </div>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>

        {/* LINE Messaging API */}
        <div className="p-4 rounded-xl border-2" style={{
          backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5',
          borderColor: isDarkMode ? '#10B981' : '#A7F3D0'
        }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LINE</span>
              </div>
              <div>
                <p className="font-semibold" style={{ color: colors.textPrimary }}>{strings.lineNotifications}</p>
                {hasLineToken ? (
                  <Badge className="bg-emerald-100 text-emerald-700 mt-1">{strings.connected}</Badge>
                ) : (
                  <Badge variant="outline" className="mt-1">{strings.notConnected}</Badge>
                )}
              </div>
            </div>
            {hasLineToken && (
              <Switch
                checked={lineNotifications}
                onCheckedChange={setLineNotifications}
              />
            )}
          </div>
          <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
            {strings.lineDesc}
          </p>
          
          {!hasLineToken ? (
            <>
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 mb-2 w-full"
                onClick={handleLineConnect}
              >
                {strings.addOnLine}
              </Button>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {strings.instructions(user?.email)}
              </p>
            </>
          ) : (
            <>
              <Button 
                size="sm"
                variant="outline"
                className="w-full mb-2"
                onClick={handleSendTest}
                disabled={sendingTest}
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: '#10B981',
                  color: '#10B981'
                }}
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.sending}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {strings.sendTest}
                  </>
                )}
              </Button>
              
              {testResult === 'success' && (
                <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 text-sm">
                  ✅ {strings.testSuccess}
                </div>
              )}
              
              {testResult === 'error' && (
                <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-800 text-sm">
                  ❌ {strings.testError}
                </div>
              )}
            </>
          )}
        </div>

        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
          {strings.savePreferences}
        </Button>
      </CardContent>
    </Card>
  );
}
