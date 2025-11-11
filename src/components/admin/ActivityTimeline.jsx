
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, FileText, Scale, Shield } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ActivityTimeline({ activities = [], colors, language }) {
  const strings = {
    en: {
      recentActivity: "Recent Activity",
      noActivity: "No recent activity",
      newUser: "New User Registered",
      newLease: "Lease Uploaded",
      newCase: "Case Opened",
      caseResolved: "Case Resolved",
      subscribed: "New Subscription"
    },
    th: {
      recentActivity: "กิจกรรมล่าสุด",
      noActivity: "ไม่มีกิจกรรมล่าสุด",
      newUser: "ผู้ใช้ใหม่ลงทะเบียน",
      newLease: "อัปโหลดสัญญาเช่า",
      newCase: "เปิดคดี",
      caseResolved: "แก้ไขคดีแล้ว",
      subscribed: "สมัครสมาชิกใหม่"
    }
  };

  const t = strings[language];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registered':
        return { icon: User, color: '#3B82F6', bg: '#EFF6FF' };
      case 'lease_uploaded':
        return { icon: FileText, color: '#8B5CF6', bg: '#F5F3FF' };
      case 'case_opened':
        return { icon: Scale, color: '#F59E0B', bg: '#FFFBEB' };
      case 'case_resolved':
        return { icon: Scale, color: '#10B981', bg: '#F0FDF4' };
      case 'subscription':
        return { icon: Shield, color: '#C7A338', bg: '#FFFBEB' };
      default:
        return { icon: Clock, color: '#64748B', bg: '#F8FAFC' };
    }
  };

  const getActivityLabel = (type) => {
    switch (type) {
      case 'user_registered':
        return t.newUser;
      case 'lease_uploaded':
        return t.newLease;
      case 'case_opened':
        return t.newCase;
      case 'case_resolved':
        return t.caseResolved;
      case 'subscription':
        return t.subscribed;
      default:
        return type;
    }
  };

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: colors.textPrimary }}>
          <Clock className="w-5 h-5 text-ls-forest" />
          {t.recentActivity}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const { icon: Icon, color, bg } = getActivityIcon(activity.type);
              const isDark = colors.bg === '#1A1D1F';
              
              return (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isDark ? color + '30' : bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                      {getActivityLabel(activity.type)}
                    </p>
                    <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                      {activity.description}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary, opacity: 0.3 }} />
            <p style={{ color: colors.textSecondary }}>{t.noActivity}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
