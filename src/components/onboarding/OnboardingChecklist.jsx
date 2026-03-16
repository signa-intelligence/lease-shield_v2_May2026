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
  ChevronRight,
  Wrench,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getFeatureCardStyles } from "@/components/shared/featureTheme";

const OnboardingChecklist = ({ user, leases = [], deposits = [], documents = [], cases = [], maintenanceRequests = [], isDarkMode = false, language = 'en' }) => {

  // Debug log to verify props are being passed correctly
  console.log('[ONBOARDING_CHECKLIST_PROPS]', {
    leasesCount: leases?.length || 0,
    depositsCount: deposits?.length || 0,
    documentsCount: documents?.length || 0,
    maintenanceCount: maintenanceRequests?.length || 0,
    hasPhone: !!user?.phone,
    hasTenantAddress: !!user?.tenant_address,
    hasEmailNotif: !!user?.email_notifications,
    hasLineNotif: !!user?.line_notifications
  });

  const leasesTheme = getFeatureCardStyles("leases", isDarkMode);
  const depositsTheme = getFeatureCardStyles("deposits", isDarkMode);
  const maintenanceTheme = getFeatureCardStyles("maintenance", isDarkMode);
  const notificationsTheme = getFeatureCardStyles("notifications", isDarkMode);

  const taskThemeMap = {
    upload_lease: leasesTheme,
    track_deposit: depositsTheme,
    verify_deposit: depositsTheme,
    report_maintenance: maintenanceTheme,
    upload_doc: depositsTheme,
    setup_profile: notificationsTheme,
    enable_notifications: notificationsTheme,
  };

  const t = {
    en: {
      title: "Getting Started",
      subtitle: "Complete these steps to maximize your protection",
      progress: "Progress",
      completed: "Completed!",
      tasks: {
        uploadLease: "Upload your first lease",
        uploadLeaseDesc: "Get risk analysis",
        trackDeposit: "Track a security deposit",
        trackDepositDesc: "Never lose your money",
        verifyDeposit: "⚠️ Verify who receives your deposit",
        verifyDepositDesc: "Confirm your deposit receipt names the landlord directly.",
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
      tasks: {
        uploadLease: "อัปโหลดสัญญาเช่าแรก",
        uploadLeaseDesc: "รับการวิเคราะห์ความเสี่ยง",
        trackDeposit: "ติดตามเงินมัดจำ",
        trackDepositDesc: "ไม่พลาดเงินของคุณ",
        verifyDeposit: "⚠️ ตรวจสอบว่าใครรับเงินมัดจำ",
        verifyDepositDesc: "ยืนยันว่าใบเสร็จเงินมัดจำระบุชื่อเจ้าของบ้านโดยตรง",
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
      tasks: {
        uploadLease: "上传您的第一份租约",
        uploadLeaseDesc: "获得风险分析",
        trackDeposit: "追踪押金",
        trackDepositDesc: "永不丢失您的钱",
        verifyDeposit: "⚠️ 确认谁收取您的押金",
        verifyDepositDesc: "确认押金收据上直接列明房东姓名。",
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
      tasks: {
        uploadLease: "最初の賃貸契約をアップロード",
        uploadLeaseDesc: "リスク分析を取得",
        trackDeposit: "敷金を追跡",
        trackDepositDesc: "お金を失わないように",
        verifyDeposit: "⚠️ 敷金の受取人を確認",
        verifyDepositDesc: "敷金の領収書に大家の名前が直接記載されていることを確認してください。",
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
      tasks: {
        uploadLease: "첫 번째 임대 계약 업로드",
        uploadLeaseDesc: "위험 분석 받기",
        trackDeposit: "보증금 추적",
        trackDepositDesc: "돈을 잃지 마세요",
        verifyDeposit: "⚠️ 보증금 수령인 확인",
        verifyDepositDesc: "보증금 영수증에 집주인 이름이 직접 기재되어 있는지 확인하세요.",
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
      tasks: {
        uploadLease: "Загрузите ваш первый договор",
        uploadLeaseDesc: "Получите анализ рисков",
        trackDeposit: "Отслеживайте залог",
        trackDepositDesc: "Не потеряйте свои деньги",
        verifyDeposit: "⚠️ Проверьте, кто получает ваш залог",
        verifyDepositDesc: "Убедитесь, что в квитанции на залог указано имя арендодателя.",
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

  // Safely check array lengths with fallbacks
  const hasLeases = Array.isArray(leases) && leases.length > 0;
  const hasDeposits = Array.isArray(deposits) && deposits.length > 0;
  const hasMaintenanceRequests = Array.isArray(maintenanceRequests) && maintenanceRequests.length > 0;
  const hasDocuments = Array.isArray(documents) && documents.length >= 3;
  const hasProfile = !!(user?.phone && user?.tenant_address);
  const hasNotifications = !!(user?.email_notifications || user?.line_notifications);

  const tasks = [
    {
      id: 'upload_lease',
      label: strings.tasks.uploadLease,
      description: strings.tasks.uploadLeaseDesc,
      icon: Upload,
      completed: hasLeases,
      route: "UploadScan",
      points: 25
    },
    {
      id: 'track_deposit',
      label: strings.tasks.trackDeposit,
      description: strings.tasks.trackDepositDesc,
      icon: Wallet,
      completed: hasDeposits,
      route: "PropertyTracker",
      points: 20
    },
    {
      id: 'report_maintenance',
      label: strings.tasks.reportMaintenance,
      description: strings.tasks.reportMaintenanceDesc,
      icon: Wrench,
      completed: hasMaintenanceRequests,
      route: "PropertyTracker",
      points: 15
    },
    {
      id: 'upload_doc',
      label: strings.tasks.uploadDoc,
      description: strings.tasks.uploadDocDesc,
      icon: FileText,
      completed: hasDocuments,
      route: "EvidenceVault",
      points: 15
    },
    {
      id: 'setup_profile',
      label: strings.tasks.setupProfile,
      description: strings.tasks.setupProfileDesc,
      icon: User,
      completed: hasProfile,
      route: "Account",
      points: 10
    },
    {
      id: 'enable_notifications',
      label: strings.tasks.enableNotifications,
      description: strings.tasks.enableNotificationsDesc,
      icon: Bell,
      completed: hasNotifications,
      route: "Account?section=notifications",
      points: 10
    }
  ];

  const actionableTasks = tasks.filter(t => !t.isWarning);
  const completedTasks = actionableTasks.filter(t => t.completed).length;
  const totalTasks = actionableTasks.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
  const isAllComplete = completedTasks === totalTasks;

  return (
    <Card 
      className="border-none shadow-xl overflow-hidden bg-white dark:bg-gray-800"
    >
      <CardHeader
        className="pb-4"
        style={{
          background: isAllComplete
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
          borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(12,59,46,0.08)'
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
            const theme = taskThemeMap[task.id] || leasesTheme;
            const isWarningItem = task.isWarning || task.highImportance;
            
            return (
              <div
                key={task.id}
                className="flex items-start gap-4 p-4 rounded-xl transition-all"
                style={{
                  backgroundColor: isWarningItem
                    ? (isDarkMode ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB')
                    : task.completed 
                      ? (isDarkMode ? `${theme.iconBg}40` : `${theme.iconBg}80`)
                      : (isDarkMode ? '#374151' : '#F8FAFC'),
                  border: isWarningItem
                    ? '2px solid #D97706'
                    : `2px solid ${task.completed ? theme.borderColor : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)')}`
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: isWarningItem ? '#D97706' : theme.iconBg,
                    color: isWarningItem ? '#FFFFFF' : theme.iconColor
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
                      <h4 className="font-bold text-sm" style={{
                        color: isWarningItem ? '#D97706' : (isDarkMode ? '#F9FAFB' : '#111827')
                      }}>
                        {task.label}
                      </h4>
                      <p className="text-xs" style={{
                        color: isWarningItem ? (isDarkMode ? '#FCD34D' : '#92400E') : (isDarkMode ? '#9CA3AF' : '#4B5563'),
                        lineHeight: '1.5'
                      }}>
                        {task.description}
                      </p>
                    </div>
                    {isWarningItem && (
                      <Badge
                        className="flex-shrink-0"
                        style={{
                          backgroundColor: '#D97706',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: '700'
                        }}
                      >
                        MEDIUM
                      </Badge>
                    )}
                    {!isWarningItem && task.completed && (
                      <Badge
                        className="flex-shrink-0"
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#C7A338',
                          border: '1px solid #C7A338',
                          fontSize: '10px',
                          fontWeight: '700'
                        }}
                      >
                        +{task.points}
                      </Badge>
                    )}
                  </div>
                  
                  {!task.completed && !isWarningItem && (
                    <Link to={createPageUrl(task.route)}>
                      <button
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        style={{
                          backgroundColor: theme.buttonBg,
                          color: theme.buttonText
                        }}
                      >
                        {task.id === 'upload_lease' ? (language === 'en' ? 'Start Lease Scan' : strings.actions.start)
                          : task.id === 'track_deposit' ? (language === 'en' ? 'Start Deposit Tracking' : strings.actions.start)
                          : task.id === 'report_maintenance' ? (language === 'en' ? 'Start Property Tracking' : strings.actions.start)
                          : task.id === 'upload_doc' ? (language === 'en' ? 'Start Evidence Upload' : strings.actions.start)
                          : strings.actions.start}
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