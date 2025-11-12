import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Upload,
  Wallet,
  FileText,
  Shield,
  Bell,
  User,
  Sparkles,
  Trophy,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const OnboardingChecklist = ({ user, leases, deposits, documents, cases, colors, language = 'en' }) => {
  const t = {
    en: {
      title: "Getting Started",
      subtitle: "Complete these steps to maximize your protection",
      progress: "Progress",
      completed: "Completed!",
      tasks: {
        uploadLease: "Upload your first lease",
        uploadLeaseDesc: "Get AI risk analysis",
        trackDeposit: "Track a security deposit",
        trackDepositDesc: "Never lose your money",
        uploadDoc: "Upload evidence",
        uploadDocDesc: "Build your paper trail",
        setupProfile: "Complete your profile",
        setupProfileDesc: "Add contact details",
        enableNotifications: "Enable notifications",
        enableNotificationsDesc: "Stay informed",
        openCase: "Open your first case",
        openCaseDesc: "Get professional help"
      },
      actions: {
        start: "Start",
        continue: "Continue",
        done: "Done"
      },
      allDone: "All Set!",
      allDoneDesc: "You've completed the essentials. Keep adding more to increase your protection score!",
      earnedBadge: "You earned a badge!"
    },
    th: {
      title: "เริ่มต้นใช้งาน",
      subtitle: "ทำตามขั้นตอนเหล่านี้เพื่อเพิ่มการป้องกันสูงสุด",
      progress: "ความคืบหน้า",
      completed: "เสร็จสมบูรณ์!",
      tasks: {
        uploadLease: "อัปโหลดสัญญาเช่าแรก",
        uploadLeaseDesc: "รับการวิเคราะห์ความเสี่ยงจาก AI",
        trackDeposit: "ติดตามเงินมัดจำ",
        trackDepositDesc: "ไม่มีทางเสียเงิน",
        uploadDoc: "อัปโหลดหลักฐาน",
        uploadDocDesc: "สร้างร่องรอยเอกสาร",
        setupProfile: "กรอกโปรไฟล์ให้ครบ",
        setupProfileDesc: "เพิ่มรายละเอียดการติดต่อ",
        enableNotifications: "เปิดการแจ้งเตือน",
        enableNotificationsDesc: "รับข้อมูลอยู่เสมอ",
        openCase: "เปิดคดีแรก",
        openCaseDesc: "รับความช่วยเหลือจากผู้เชี่ยวชาญ"
      },
      actions: {
        start: "เริ่ม",
        continue: "ดำเนินการต่อ",
        done: "เสร็จแล้ว"
      },
      allDone: "พร้อมแล้ว!",
      allDoneDesc: "คุณทำสิ่งสำคัญเสร็จแล้ว! เพิ่มเติมต่อไปเพื่อเพิ่มคะแนนการป้องกัน!",
      earnedBadge: "คุณได้รับตรา!"
    }
  };

  const strings = t[language];

  const tasks = [
    {
      id: 'upload_lease',
      label: strings.tasks.uploadLease,
      description: strings.tasks.uploadLeaseDesc,
      icon: Upload,
      color: '#3B82F6',
      completed: leases.length > 0,
      route: "UploadScan",
      points: 25
    },
    {
      id: 'track_deposit',
      label: strings.tasks.trackDeposit,
      description: strings.tasks.trackDepositDesc,
      icon: Wallet,
      color: '#C7A338',
      completed: deposits.length > 0,
      route: "PropertyTracker",
      points: 20
    },
    {
      id: 'upload_doc',
      label: strings.tasks.uploadDoc,
      description: strings.tasks.uploadDocDesc,
      icon: FileText,
      color: '#10B981',
      completed: documents.length >= 3,
      route: "DocumentVault",
      points: 15
    },
    {
      id: 'setup_profile',
      label: strings.tasks.setupProfile,
      description: strings.tasks.setupProfileDesc,
      icon: User,
      color: '#8B5CF6',
      completed: user?.phone && user?.tenant_address,
      route: "Account",
      points: 10
    },
    {
      id: 'enable_notifications',
      label: strings.tasks.enableNotifications,
      description: strings.tasks.enableNotificationsDesc,
      icon: Bell,
      color: '#F59E0B',
      completed: user?.email_notifications || user?.line_notifications,
      route: "Account",
      points: 10
    }
  ];

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
  const isAllComplete = completedTasks === totalTasks;

  return (
    <Card 
      className="border-none shadow-xl overflow-hidden"
      style={{ backgroundColor: colors.cardBg }}
    >
      <CardHeader
        className="pb-4"
        style={{
          background: isAllComplete
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
          borderBottom: `1px solid ${colors.borderColor}`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {isAllComplete ? (
                <Trophy className="w-6 h-6 text-white" />
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-white text-xl mb-1">
                {isAllComplete ? strings.allDone : strings.title}
              </CardTitle>
              <p className="text-white/80 text-sm">
                {isAllComplete ? strings.allDoneDesc : strings.subtitle}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-white/90 text-sm mb-2">
            <span>{strings.progress}</span>
            <span className="font-bold">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          {tasks.map((task) => {
            const TaskIcon = task.icon;
            
            return (
              <div
                key={task.id}
                className="flex items-start gap-4 p-4 rounded-xl transition-all"
                style={{
                  backgroundColor: task.completed 
                    ? `${task.color}10`
                    : colors.filterBg,
                  border: `2px solid ${task.completed ? task.color + '40' : colors.borderColor}`
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: task.completed ? task.color : colors.borderColor }}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <TaskIcon className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                        {task.label}
                      </h4>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {task.description}
                      </p>
                    </div>
                    {task.completed && (
                      <Badge
                        className="flex-shrink-0"
                        style={{
                          backgroundColor: `${task.color}20`,
                          color: task.color,
                          border: `1px solid ${task.color}40`,
                          fontSize: '10px'
                        }}
                      >
                        +{task.points}
                      </Badge>
                    )}
                  </div>
                  
                  {!task.completed && (
                    <Link to={createPageUrl(task.route)}>
                      <button
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        style={{
                          backgroundColor: task.color,
                          color: '#FFFFFF'
                        }}
                      >
                        {strings.actions.start}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isAllComplete && (
          <div 
            className="mt-6 p-4 rounded-xl text-center animate-pulse"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            }}
          >
            <Trophy className="w-12 h-12 text-white mx-auto mb-3" />
            <p className="text-white font-bold text-lg">
              {strings.earnedBadge}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;