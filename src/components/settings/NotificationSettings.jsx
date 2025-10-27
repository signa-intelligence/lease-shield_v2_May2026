import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NotificationSettings({ user, onUpdate }) {
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? true);
  const [lineNotifications, setLineNotifications] = useState(user?.line_notifications ?? false);
  const hasLineToken = !!user?.line_notify_token;

  const handleSave = () => {
    onUpdate({
      email_notifications: emailNotifications,
      line_notifications: lineNotifications
    });
  };

  const handleLineConnect = () => {
    // TODO: Implement LINE OAuth flow when credentials are available
    alert('LINE Notify integration coming soon!');
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-slate-900">Email Notifications</p>
              <p className="text-sm text-slate-600">
                Deposit reminders and important updates
              </p>
            </div>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>

        {/* LINE Notify */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LINE</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">LINE Notify</p>
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
          <p className="text-sm text-slate-600 mb-3">
            Get instant deposit reminders via LINE messaging
          </p>
          {!hasLineToken && (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleLineConnect}
            >
              Connect LINE Notify
            </Button>
          )}
        </div>

        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}