import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Upload,
  Wallet,
  FileText,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Wrench
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const OnboardingWizard = ({ open, onClose, user, isDarkMode = false, language = 'en' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const t = {
    en: {
      welcome: "Welcome to Lease Shield!",
      welcomeSubtitle: "Let's get your rental fully protected in a few minutes.",
      step1Title: "Scan your lease",
      step1Desc: "Upload your rental agreement so we can highlight risks and important dates.",
      step1Action: "Upload lease",
      step1Later: "I'll do this later",
      step2Title: "Add your property and deposit",
      step2Desc: "Tell us where you live, how much deposit you paid, and when your lease ends.",
      step2Action: "Add property & deposit",
      step3Title: "Set your rent reminders",
      step3Desc: "Choose your rent due date and when you want Lease Shield to remind you.",
      step3Action: "Save reminders",
      step4Title: "Upload move-in evidence",
      step4Desc: "Add photos of your unit, condition and meter readings so you have proof later.",
      step4Action: "Upload evidence",
      step4Progress: "{uploaded} of {target} photos uploaded",
      step5Title: "Know where to get help",
      step5Desc: "If a dispute starts, you can submit a case through Lease Shield and get professional support at member or public rates.",
      step5Action: "View cases & Resolve options",
      next: "Next",
      back: "Back",
      skip: "Skip Tour",
      getStarted: "Get Started",
      stepOf: "Step {current} of {total}"
    },
    th: {
      welcome: "ยินดีต้อนรับสู่ Lease Shield!",
      welcomeSubtitle: "มาปกป้องสัญญาเช่าของคุณให้ครบถ้วนภายในไม่กี่นาที",
      step1Title: "สแกนสัญญาเช่า",
      step1Desc: "อัปโหลดสัญญาเช่าของคุณเพื่อให้เราช่วยตรวจจุดเสี่ยงและวันที่สำคัญ",
      step1Action: "อัปโหลดสัญญา",
      step1Later: "ทำทีหลัง",
      step2Title: "เพิ่มทรัพย์สินและเงินมัดจำ",
      step2Desc: "บอกเราว่าคุณอยู่ที่ไหน จ่ายเงินมัดจำเท่าไหร่ และสัญญาเช่าสิ้นสุดเมื่อไหร่",
      step2Action: "เพิ่มทรัพย์สินและเงินมัดจำ",
      step3Title: "ตั้งค่าการแจ้งเตือนค่าเช่า",
      step3Desc: "เลือกวันครบกำหนดค่าเช่าและเวลาที่คุณต้องการให้ Lease Shield แจ้งเตือนคุณ",
      step3Action: "บันทึกการแจ้งเตือน",
      step4Title: "อัปโหลดหลักฐานการเข้าพัก",
      step4Desc: "เพิ่มรูปภาพห้องของคุณ สภาพห้อง และเลขมิเตอร์เพื่อให้คุณมีหลักฐานในภายหลัง",
      step4Action: "อัปโหลดหลักฐาน",
      step4Progress: "อัปโหลดแล้ว {uploaded} จาก {target} รูป",
      step5Title: "รู้ว่าจะขอความช่วยเหลือได้ที่ไหน",
      step5Desc: "หากเกิดข้อพิพาท คุณสามารถส่งคดีผ่าน Lease Shield และรับการสนับสนุนจากผู้เชี่ยวชาญในอัตราสมาชิกหรืออัตราทั่วไป",
      step5Action: "ดูตัวเลือกคดีและการแก้ไข",
      next: "ถัดไป",
      back: "ย้อนกลับ",
      skip: "ข้ามทัวร์",
      getStarted: "เริ่มต้น",
      stepOf: "ขั้นตอนที่ {current} จาก {total}"
    },
    zh: {
      welcome: "欢迎来到租约盾！",
      welcomeSubtitle: "让我们通过4个简单步骤保护您",
      step1Title: "上传您的租约",
      step1Desc: "获得即时AI分析，识别风险和不公平条款，防患于未然。",
      step2Title: "追踪您的押金",
      step2Desc: "永远不会失去对押金的追踪。设置自动提醒，准确知道何时能收回押金。",
      step3Title: "报告维护问题",
      step3Desc: "记录和追踪所有维护问题，包括时间戳和照片。让房东负起责任。",
      step4Title: "存储证据",
      step4Desc: "建立完整的文件记录。上传照片、收据和文件，以便在发生争议时保护自己。",
      finalTitle: "一切就绪！",
      finalDesc: "租约盾现在正在保护您的租赁权利。从下面的第一个操作开始。",
      next: "下一步",
      back: "返回",
      skip: "跳过教程",
      getStarted: "开始使用",
      uploadLease: "上传我的租约",
      addDeposit: "追踪押金",
      reportMaintenance: "报告问题",
      uploadDocs: "添加证据",
      stepOf: "第 {current} 步，共 {total} 步"
    },
    ja: {
      welcome: "リースシールドへようこそ！",
      welcomeSubtitle: "4つの簡単なステップで保護を開始しましょう",
      step1Title: "賃貸契約をアップロード",
      step1Desc: "AIによる即座の分析で、問題になる前にリスクや不公平な条項を特定します。",
      step2Title: "敷金を追跡",
      step2Desc: "敷金の追跡を見失うことはありません。自動リマインダーを設定して、いつ返金されるか正確に把握します。",
      step3Title: "メンテナンスを報告",
      step3Desc: "タイムスタンプと写真で全てのメンテナンス問題を記録・追跡。家主に責任を持たせましょう。",
      step4Title: "証拠を保存",
      step4Desc: "確かな記録を構築します。写真、領収書、書類をアップロードして、紛争が発生した場合に備えます。",
      finalTitle: "準備完了！",
      finalDesc: "リースシールドがあなたの賃貸権を保護しています。以下の最初のアクションから始めましょう。",
      next: "次へ",
      back: "戻る",
      skip: "ツアーをスキップ",
      getStarted: "始める",
      uploadLease: "賃貸契約をアップロード",
      addDeposit: "敷金を追跡",
      reportMaintenance: "問題を報告",
      uploadDocs: "証拠を追加",
      stepOf: "ステップ {current} / {total}"
    },
    ko: {
      welcome: "리스실드에 오신 것을 환영합니다!",
      welcomeSubtitle: "4가지 간단한 단계로 보호를 시작하세요",
      step1Title: "임대 계약 업로드",
      step1Desc: "AI 즉시 분석으로 문제가 되기 전에 위험과 불공정한 조건을 식별합니다.",
      step2Title: "보증금 추적",
      step2Desc: "보증금 추적을 놓치지 마세요. 자동 알림을 설정하여 언제 돌려받을지 정확히 알 수 있습니다.",
      step3Title: "유지보수 보고",
      step3Desc: "타임스탬프와 사진으로 모든 유지보수 문제를 기록하고 추적하세요. 집주인에게 책임을 물으세요.",
      step4Title: "증거 저장",
      step4Desc: "탄탄한 서류 기록을 만드세요. 분쟁이 발생할 경우를 대비해 사진, 영수증, 문서를 업로드하세요.",
      finalTitle: "모두 준비되었습니다!",
      finalDesc: "리스실드가 이제 귀하의 임대 권리를 보호하고 있습니다. 아래의 첫 번째 작업부터 시작하세요.",
      next: "다음",
      back: "뒤로",
      skip: "투어 건너뛰기",
      getStarted: "시작하기",
      uploadLease: "임대 계약 업로드",
      addDeposit: "보증금 추적",
      reportMaintenance: "문제 보고",
      uploadDocs: "증거 추가",
      stepOf: "{total}단계 중 {current}단계"
    },
    ru: {
      welcome: "Добро пожаловать в Lease Shield!",
      welcomeSubtitle: "Давайте полностью защитим ваш договор аренды за несколько минут.",
      step1Title: "Сканируйте договор аренды",
      step1Desc: "Загрузите свой договор, и мы подсветим риски и важные даты.",
      step1Action: "Загрузить договор",
      step1Later: "Сделаю позже",
      step2Title: "Добавьте вашу недвижимость и депозит",
      step2Desc: "Расскажите, где вы живете, сколько внесли депозит и когда заканчивается договор.",
      step2Action: "Добавить недвижимость и депозит",
      step3Title: "Установите напоминания об аренде",
      step3Desc: "Выберите дату платежа и когда Lease Shield должен вам напомнить.",
      step3Action: "Сохранить напоминания",
      step4Title: "Загрузите доказательства при заселении",
      step4Desc: "Добавьте фото вашей квартиры, её состояния и показаний счётчиков, чтобы иметь доказательства позже.",
      step4Action: "Загрузить доказательства",
      step4Progress: "Загружено {uploaded} из {target} фото",
      step5Title: "Знайте, где получить помощь",
      step5Desc: "Если начнется спор, вы можете подать дело через Lease Shield и получить профессиональную поддержку по тарифам участника или публичным.",
      step5Action: "Посмотреть дела и опции Resolve",
      next: "Далее",
      back: "Назад",
      skip: "Пропустить",
      getStarted: "Начать",
      stepOf: "Шаг {current} из {total}"
    }
  };

  const strings = t[language] || t.en;

  const steps = [
    {
      icon: Upload,
      color: '#3B82F6',
      title: strings.step1Title,
      description: strings.step1Desc,
      action: strings.step1Action,
      route: "UploadScan"
    },
    {
      icon: Wallet,
      color: '#C7A338',
      title: strings.step2Title,
      description: strings.step2Desc,
      action: strings.step2Action,
      route: "PropertyTracker"
    },
    {
      icon: Bell,
      color: '#F59E0B',
      title: strings.step3Title,
      description: strings.step3Desc,
      action: strings.step3Action,
      route: "PropertyTracker"
    },
    {
      icon: FileText,
      color: '#10B981',
      title: strings.step4Title,
      description: strings.step4Desc,
      action: strings.step4Action,
      route: "EvidenceVault"
    },
    {
      icon: Shield,
      color: '#DC2626',
      title: strings.step5Title,
      description: strings.step5Desc,
      action: strings.step5Action,
      route: "Cases"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleActionClick = (route) => {
    onClose();
    navigate(createPageUrl(route));
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData?.icon || Shield;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0 bg-white dark:bg-gray-800"
        style={{ 
          border: 'none',
          overflow: 'hidden'
        }}
        hideCloseButton={true}
      >
        {/* Header with gradient - Fixed at top */}
        <div 
          className="p-4 sm:p-6 md:p-8 relative flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${currentStepData?.color || '#0C3B2E'} 0%, ${currentStepData?.color || '#0C3B2E'}dd 100%)`
          }}
        >
          <div className="text-center">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              {currentStepData?.title || strings.welcome}
            </h2>
            <p className="text-white/90 text-sm sm:text-base md:text-lg px-2">
              {currentStepData?.description || strings.welcomeSubtitle}
            </p>
          </div>

          {/* Progress */}
          <div className="mt-4 sm:mt-6">
            <div className="flex justify-between text-white/80 text-xs sm:text-sm mb-2">
              <span>{strings.stepOf.replace('{current}', currentStep + 1).replace('{total}', steps.length)}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;

              return (
                <div
                  key={idx}
                  className="p-3 sm:p-4 rounded-xl transition-all cursor-pointer"
                  style={{
                    backgroundColor: isActive 
                      ? `${step.color}15`
                      : isPast
                        ? (isDarkMode ? '#374151' : '#F8FAFC')
                        : 'transparent',
                    border: `2px solid ${isActive ? step.color : isPast ? '#10B981' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)')}`,
                    opacity: isActive ? 1 : 0.7
                  }}
                  onClick={() => setCurrentStep(idx)}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isPast ? '#10B981' : step.color }}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-50">
                      {language === 'th' ? `ขั้นที่ ${idx + 1}` : language === 'zh' ? `第 ${idx + 1} 步` : language === 'ja' ? `ステップ ${idx + 1}` : language === 'ko' ? `${idx + 1}단계` : language === 'ru' ? `Шаг ${idx + 1}` : `Step ${idx + 1}`}
                    </span>
                  </div>
                  <p className="text-xs font-medium line-clamp-2 text-gray-600 dark:text-gray-400">
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleActionClick(currentStepData.route)}
            className="w-full mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl border-2 border-dashed transition-all active:scale-95"
            style={{
              backgroundColor: `${currentStepData.color}10`,
              borderColor: `${currentStepData.color}40`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: currentStepData.color }}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm sm:text-base md:text-lg mb-1 text-gray-900 dark:text-gray-50">
                    {currentStepData.action}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {language === 'th' ? 'คลิกเพื่อเริ่ม' : language === 'zh' ? '点击开始' : language === 'ja' ? 'クリックして開始' : language === 'ko' ? '시작하려면 클릭' : language === 'ru' ? 'Нажмите, чтобы начать' : 'Click to start'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: currentStepData.color }} />
            </div>
          </button>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              size="sm"
              className="text-xs sm:text-sm text-gray-900 dark:text-gray-50"
              style={{ 
                opacity: currentStep === 0 ? 0.5 : 1
              }}
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {strings.back}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                size="sm"
                className="text-xs sm:text-sm border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
              >
                {strings.skip}
              </Button>
              <Button
                onClick={handleNext}
                size="sm"
                className="text-xs sm:text-sm"
                style={{
                  backgroundColor: currentStepData.color,
                  color: '#FFFFFF'
                }}
              >
                {currentStep === steps.length - 1 ? strings.getStarted : strings.next}
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;