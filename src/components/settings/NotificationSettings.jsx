import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function NotificationSettings({ user, onUpdate }) {
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? true);
  const [lineNotifications, setLineNotifications] = useState(user?.line_notifications ?? false);
  const hasLineToken = !!user?.line_messaging_token;

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isDarkMode = currentUser?.theme === 'dark';

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

  const handleSave = () => {
    onUpdate({
      email_notifications: emailNotifications,
      line_notifications: lineNotifications
    });
  };

  const handleLineConnect = () => {
    const lineOfficialAccountId = '@071vchfv';
    const addFriendUrl = `https://line.me/R/ti/p/${lineOfficialAccountId}`;
    window.open(addFriendUrl, '_blank');
  };

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}`, backgroundColor: colors.headerBg }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Bell className="w-5 h-5 text-ls-forest" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold" style={{ color: colors.textPrimary }}>Email Notifications</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Deposit reminders and important updates
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
                <p className="font-semibold" style={{ color: colors.textPrimary }}>LINE Notifications</p>
                {hasLineToken ? (
                  <Badge className="bg-emerald-100 text-emerald-700 mt-1">Connected</Badge>
                ) : (
                  <Badge variant="outline" className="mt-1">Not Connected</Badge>
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
            Get instant deposit reminders via LINE Official Account
          </p>
          {!hasLineToken && (
            <>
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 mb-2"
                onClick={handleLineConnect}
              >
                Add Lease Shield on LINE
              </Button>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                After adding, send "connect {user?.email}" to link your account
              </p>
            </>
          )}
        </div>

        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}