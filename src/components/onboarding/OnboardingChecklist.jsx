import React, { useState } from "react";
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
  ChevronRight,
  Wrench,
  ChevronDown,
  ChevronUp,
  X,
  EyeOff
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getFeatureCardStyles } from "@/components/shared/featureTheme";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { haptic } from "../shared/HapticFeedback";

const OnboardingChecklist = ({ user, leases, deposits, documents, cases, maintenanceRequests = [], isDarkMode = false, language = 'en' }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const queryClient = useQueryClient();

  const leasesTheme = getFeatureCardStyles("leases", isDarkMode);
  const depositsTheme = getFeatureCardStyles("deposits", isDarkMode);
  const maintenanceTheme = getFeatureCardStyles("maintenance", isDarkMode);
  const notificationsTheme = getFeatureCardStyles("notifications", isDarkMode);

  const taskThemeMap = {
    upload_lease: leasesTheme,
    track_deposit: depositsTheme,
    report_maintenance: maintenanceTheme,
    upload_doc: depositsTheme,
    setup_profile: notificationsTheme,
    enable_notifications: notificationsTheme,
  };

  const hideChecklistMutation = useMutation({
    mutationFn: async () => {
      const hideUntil = new Date();
      hideUntil.setDate(hideUntil.getDate() + 7);
      await base44.auth.updateMe({ 
        onboarding_checklist_hidden_until: hideUntil.toISOString() 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const handleHideFor7Days = () => {
    haptic.light();
    hideChecklistMutation.mutate();
  };

  // Check if checklist is hidden
  if (user?.onboarding_checklist_hidden_until) {
    const hiddenUntil = new Date(user.onboarding_checklist_hidden_until);
    if (hiddenUntil > new Date()) {
      return null; // Don't render if hidden
    }
  }

  const t = {
    en: {
      title: "Getting Started",
      subtitle: "Complete these steps to maximize your protection",
      progress: "Progress",
      completed: "Completed!",
      hideFor7Days: "Hide for 7 days",
      collapse: "Collapse",
      expand: "Expand",
      tasks: {
        uploadLease: "Upload your first lease",
        uploadLeaseDesc: "Get AI risk analysis",
        trackDeposit: "Track a security deposit",
        trackDepositDesc: "Never lose your money",
        reportMaintenance: "Report a maintenance issue",
        reportMaintenanceDesc: "Track repairs and hold landlords accountable",
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
      hideFor7Days: "ซ่อน 7 วัน",
      collapse: "ยุบ",
      expand: "ขยาย",
      tasks: {
        uploadLease: "อัปโหลดสัญญาเช่าแรก",
        uploadLeaseDesc: "รับการวิเคราะห์ความเสี่ยงจาก AI",
        trackDeposit: "ติดตามเงินมัดจำ",
        trackDepositDesc: "ไม่พลาดเงินของคุณ",
        reportMaintenance: "แจ้งปัญหาการซ่อมบำรุง",
        reportMaintenanceDesc: "ติดตามการซ่อมและทำให้เจ้าของบ้านรับผิดชอบ",
        uploadDoc: "อัปโหลดหลักฐาน",
        uploadDocDesc: "สร้างหลักฐานที่แข็งแกร่ง",
        setupProfile: "กรอกโปรไฟล์ให้ครบ",
        setupProfileDesc: "เพิ่มข้อมูลติดต่อ",
        enableNotifications: "เปิดการแจ้งเตือน",
        enableNotificationsDesc: "รับข้อมูลตลอดเวลา",
        openCase: "เปิดคดีแรก",
        openCaseDesc: "รับความช่วยเหลือจากผู้เชี่ยวชาญ"
      },
      actions: {
        start: "เริ่ม",
        continue: "ดำเนินการต่อ",
        done: "เสร็จแล้ว"
      },
      allDone: "พร้อมแล้ว!",
      allDoneDesc: "คุณทำสิ่งสำคัญเสร็จแล้ว เพิ่มเติมต่อไปเพื่อเพิ่มคะแนนการป้องกัน!",
      earnedBadge: "คุณได้รับตราแล้ว!"
    },
    zh: {
      title: "入门指南",
      subtitle: "完成这些步骤以最大化您的保护",
      progress: "进度",
      completed: "已完成！",
      hideFor7Days: "隐藏7天",
      collapse: "折叠",
      expand: "展开",
      tasks: {
        uploadLease: "上传您的第一份租约",
        uploadLeaseDesc: "获得AI风险分析",
        trackDeposit: "追踪押金",
        trackDepositDesc: "永不丢失您的钱",
        reportMaintenance: "报告维护问题",
        reportMaintenanceDesc: "追踪维修并让房东负责",
        uploadDoc: "上传证据",
        uploadDocDesc: "建立文件记录",
        setupProfile: "完善您的个人资料",
        setupProfileDesc: "添加联系方式",
        enableNotifications: "启用通知",
        enableNotificationsDesc: "保持信息畅通",
        openCase: "开启您的第一个案件",
        openCaseDesc: "获得专业帮助"
      },
      actions: {
        start: "开始",
        continue: "继续",
        done: "完成"
      },
      allDone: "全部完成！",
      allDoneDesc: "您已完成基本步骤。继续添加更多以提高您的保护分数！",
      earnedBadge: "您获得了徽章！"
    },
    ja: {
      title: "はじめに",
      subtitle: "これらのステップを完了して保護を最大化しましょう",
      progress: "進捗",
      completed: "完了！",
      hideFor7Days: "7日間非表示",
      collapse: "折りたたむ",
      expand: "展開",
      tasks: {
        uploadLease: "最初の賃貸契約をアップロード",
        uploadLeaseDesc: "AIリスク分析を取得",
        trackDeposit: "敷金を追跡",
        trackDepositDesc: "お金を失わないように",
        reportMaintenance: "メンテナンス問題を報告",
        reportMaintenanceDesc: "修理を追跡し、家主に責任を持たせる",
        uploadDoc: "証拠をアップロード",
        uploadDocDesc: "記録を構築",
        setupProfile: "プロフィールを完成",
        setupProfileDesc: "連絡先を追加",
        enableNotifications: "通知を有効にする",
        enableNotificationsDesc: "情報を受け取る",
        openCase: "最初のケースを開く",
        openCaseDesc: "専門家の助けを得る"
      },
      actions: {
        start: "開始",
        continue: "続ける",
        done: "完了"
      },
      allDone: "すべて完了！",
      allDoneDesc: "基本を完了しました。保護スコアを上げるためにさらに追加してください！",
      earnedBadge: "バッジを獲得しました！"
    },
    ko: {
      title: "시작하기",
      subtitle: "이 단계를 완료하여 보호를 극대화하세요",
      progress: "진행 상황",
      completed: "완료!",
      hideFor7Days: "7일간 숨기기",
      collapse: "접기",
      expand: "펼치기",
      tasks: {
        uploadLease: "첫 번째 임대 계약 업로드",
        uploadLeaseDesc: "AI 위험 분석 받기",
        trackDeposit: "보증금 추적",
        trackDepositDesc: "돈을 잃지 마세요",
        reportMaintenance: "유지보수 문제 보고",
        reportMaintenanceDesc: "수리를 추적하고 집주인에게 책임을 묻기",
        uploadDoc: "증거 업로드",
        uploadDocDesc: "서류 기록 구축",
        setupProfile: "프로필 완성",
        setupProfileDesc: "연락처 추가",
        enableNotifications: "알림 활성화",
        enableNotificationsDesc: "정보 받기",
        openCase: "첫 번째 사례 열기",
        openCaseDesc: "전문가 도움 받기"
      },
      actions: {
        start: "시작",
        continue: "계속",
        done: "완료"
      },
      allDone: "모두 완료!",
      allDoneDesc: "필수 사항을 완료했습니다. 보호 점수를 높이려면 더 추가하세요!",
      earnedBadge: "배지를 획득했습니다!"
    },
    ru: {
      title: "Начало работы",
      subtitle: "Выполните эти шаги для максимальной защиты",
      progress: "Прогресс",
      completed: "Завершено!",
      hideFor7Days: "Скрыть на 7 дней",
      collapse: "Свернуть",
      expand: "Развернуть",
      tasks: {
        uploadLease: "Загрузите ваш первый договор",
        uploadLeaseDesc: "Получите AI-анализ рисков",
        trackDeposit: "Отслеживайте залог",
        trackDepositDesc: "Не потеряйте свои деньги",
        reportMaintenance: "Сообщите о проблеме",
        reportMaintenanceDesc: "Отслеживайте ремонт и привлекайте арендодателей к ответственности",
        uploadDoc: "Загрузите доказательства",
        uploadDocDesc: "Создайте базу документов",
        setupProfile: "Заполните профиль",
        setupProfileDesc: "Добавьте контакты",
        enableNotifications: "Включите уведомления",
        enableNotificationsDesc: "Будьте в курсе",
        openCase: "Откройте первое дело",
        openCaseDesc: "Получите помощь экспертов"
      },
      actions: {
        start: "Начать",
        continue: "Продолжить",
        done: "Готово"
      },
      allDone: "Всё готово!",
      allDoneDesc: "Вы выполнили основные шаги. Продолжайте добавлять данные для повышения уровня защиты!",
      earnedBadge: "Вы получили значок!"
    }
  };

  const strings = t[language] || t.en;

  const tasks = [
    {
      id: 'upload_lease',
      label: strings.tasks.uploadLease,
      description: strings.tasks.uploadLeaseDesc,
      icon: Upload,
      completed: leases.length > 0,
      route: "UploadScan",
      points: 25
    },
    {
      id: 'track_deposit',
      label: strings.tasks.trackDeposit,
      description: strings.tasks.trackDepositDesc,
      icon: Wallet,
      completed: deposits.length > 0,
      route: "PropertyTracker",
      points: 20
    },
    {
      id: 'report_maintenance',
      label: strings.tasks.reportMaintenance,
      description: strings.tasks.reportMaintenanceDesc,
      icon: Wrench,
      completed: maintenanceRequests.length > 0,
      route: "PropertyTracker",
      points: 15
    },
    {
      id: 'upload_doc',
      label: strings.tasks.uploadDoc,
      description: strings.tasks.uploadDocDesc,
      icon: FileText,
      completed: documents.length >= 3,
      route: "EvidenceVault",
      points: 15
    },
    {
      id: 'setup_profile',
      label: strings.tasks.setupProfile,
      description: strings.tasks.setupProfileDesc,
      icon: User,
      completed: user?.phone && user?.tenant_address,
      route: "Account",
      points: 10
    },
    {
      id: 'enable_notifications',
      label: strings.tasks.enableNotifications,
      description: strings.tasks.enableNotificationsDesc,
      icon: Bell,
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
      className="border-none shadow-xl overflow-hidden bg-white dark:bg-gray-800"
    >
      <CardHeader
        className="pb-4 cursor-pointer"
        onClick={() => {
          haptic.light();
          setIsExpanded(!isExpanded);
        }}
        style={{
          background: isAllComplete
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
          borderBottom: isExpanded ? (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(12,59,46,0.08)') : 'none'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              {isAllComplete ? (
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-white text-base sm:text-lg mb-1">
                {isAllComplete ? strings.allDone : strings.title}
              </CardTitle>
              <p className="text-white/80 text-xs sm:text-sm line-clamp-1">
                {isAllComplete ? strings.allDoneDesc : strings.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="text-white font-bold text-sm">
              {completedTasks}/{totalTasks}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-white" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 sm:p-6">
          <div 
            className="space-y-3 overflow-y-auto"
            style={{
              maxHeight: totalTasks > 6 ? '400px' : 'none'
            }}
          >
          {tasks.map((task) => {
            const TaskIcon = task.icon;
            const theme = taskThemeMap[task.id] || leasesTheme;
            
            return (
              <div
                key={task.id}
                className="flex items-start gap-4 p-4 rounded-xl transition-all"
                style={{
                  backgroundColor: task.completed 
                    ? (isDarkMode ? `${theme.iconBg}40` : `${theme.iconBg}80`)
                    : (isDarkMode ? '#374151' : '#F8FAFC'),
                  border: `2px solid ${task.completed ? theme.borderColor : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)')}`
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: theme.iconBg,
                    color: theme.iconColor
                  }}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <TaskIcon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-50">
                        {task.label}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {task.description}
                      </p>
                    </div>
                    {task.completed && (
                      <Badge
                        className="flex-shrink-0"
                        style={{
                          backgroundColor: isDarkMode ? `${theme.iconBg}40` : `${theme.iconBg}30`,
                          color: theme.metricColor,
                          border: `1px solid ${theme.borderColor}`,
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
                          backgroundColor: theme.buttonBg,
                          color: theme.buttonText
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

          {isAllComplete && (
            <div 
              className="mt-4 p-4 rounded-xl text-center"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              }}
            >
              <Trophy className="w-10 h-10 text-white mx-auto mb-2" />
              <p className="text-white font-bold text-base">
                {strings.earnedBadge}
              </p>
            </div>
          )}

          {/* Hide for 7 Days Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleHideFor7Days();
            }}
            className="mt-4 w-full px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
              color: isDarkMode ? '#D1D5DB' : '#6B7280',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)'}`
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isDarkMode ? '#4B5563' : '#E5E7EB';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
            }}
          >
            <EyeOff className="w-4 h-4" />
            {strings.hideFor7Days}
          </button>
        </CardContent>
      )}
    </Card>
  );
};

export default OnboardingChecklist;