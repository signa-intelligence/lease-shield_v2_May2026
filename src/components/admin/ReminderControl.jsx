import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function ReminderControl({ language, colors }) {
  const t = {
    en: {
      reminderControl: "Reminder Control",
      autoNote: "Reminders run automatically on schedule."
    },
    th: {
      reminderControl: "ควบคุมการแจ้งเตือน",
      autoNote: "การแจ้งเตือนทำงานอัตโนมัติตามกำหนดการ"
    },
    zh: {
      reminderControl: "提醒控制",
      autoNote: "提醒按计划自动运行。"
    },
    ja: {
      reminderControl: "リマインダー制御",
      autoNote: "リマインダーはスケジュールに従って自動的に実行されます。"
    },
    ko: {
      reminderControl: "알림 제어",
      autoNote: "알림은 일정에 따라 자동으로 실행됩니다."
    }
  };

  const strings = t[language] || t.en;

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Bell className="w-5 h-5 text-purple-600" />
          {strings.reminderControl}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          {strings.autoNote}
        </p>
      </CardContent>
    </Card>
  );
}