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
    },
    zh: {
      recentActivity: "最近活动",
      noActivity: "无最近活动",
      newUser: "新用户注册",
      newLease: "租约已上传",
      newCase: "案件已开启",
      caseResolved: "案件已解决",
      subscribed: "新订阅"
    },
    ja: {
      recentActivity: "最近のアクティビティ",
      noActivity: "最近のアクティビティはありません",
      newUser: "新規ユーザー登録",
      newLease: "賃貸契約アップロード済み",
      newCase: "ケース開設",
      caseResolved: "ケース解決済み",
      subscribed: "新規サブスクリプション"
    },
    ko: {
      recentActivity: "최근 활동",
      noActivity: "최근 활동 없음",
      newUser: "신규 사용자 등록",
      newLease: "임대 계약 업로드됨",
      newCase: "사례 개설",
      caseResolved: "사례 해결됨",
      subscribed: "신규 구독"
    }
  };

  const t = strings[language] || strings.en;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registered':
        return { icon: User, color: '#3B82F6', bgColor: '#EFF6FF' };
      case 'lease_uploaded':
        return { icon: FileText, color: '#8B5CF6', bgColor: '#F5F3FF' };
      case 'case_opened':
        return { icon: Scale, color: '#F59E0B', bgColor: '#FFFBEB' };
      case 'case_resolved':
        return { icon: Scale, color: '#10B981', bgColor: '#F0FDF4' };
      case 'subscription':
        return { icon: Shield, color: '#C7A338', bgColor: '#FFFBEB' };
      default:
        return { icon: Clock, color: '#64748B', bgColor: '#F8FAFC' };
    }
  };

  const getActivityLabel = (type) => {
    const labels = {
      en: {
        user_registered: 'New User Registered',
        lease_uploaded: 'Lease Uploaded',
        case_opened: 'Case Opened',
        case_resolved: 'Case Resolved'
      },
      th: {
        user_registered: 'ผู้ใช้ใหม่ลงทะเบียน',
        lease_uploaded: 'อัปโหลดสัญญาเช่า',
        case_opened: 'เปิดคดี',
        case_resolved: 'แก้ไขคดี'
      },
      zh: {
        user_registered: '新用户注册',
        lease_uploaded: '租约已上传',
        case_opened: '案件已开启',
        case_resolved: '案件已解决'
      },
      ja: {
        user_registered: '新規ユーザー登録',
        lease_uploaded: '賃貸契約アップロード',
        case_opened: 'ケース開設',
        case_resolved: 'ケース解決'
      },
      ko: {
        user_registered: '신규 사용자 등록',
        lease_uploaded: '임대 계약 업로드',
        case_opened: '사례 개설',
        case_resolved: '사례 해결'
      }
    };
    return labels[language]?.[type] || labels.en?.[type] || type;
  };

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg" style={{ color: colors.textPrimary }}>
          <Clock className="w-5 h-5 text-ls-forest" />
          {t.recentActivity}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: colors.textSecondary }}>{t.noActivity}</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-x-hidden">
            {activities.map((activity, index) => {
              const { icon: Icon, color, bgColor } = getActivityIcon(activity.type);
              
              return (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: bgColor }}
                  >
                    <Icon className="w-4 h-4" style={{ color: color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-1" style={{ color: colors.textPrimary }}>
                      {getActivityLabel(activity.type)}
                    </p>
                    <p className="text-xs break-words line-clamp-2" style={{ 
                      color: colors.textSecondary,
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}>
                      {activity.description}
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}