import React, { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { haptic } from "../shared/HapticFeedback";

export default function FeatureTour({ user, isDarkMode = false, onComplete, language = 'en' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();

  const completeTourMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({ has_seen_tour: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      if (onComplete) onComplete();
    }
  });

  useEffect(() => {
    if (user && !user.has_seen_tour && user.onboarding_completed) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, [user]);

  const t = {
    en: {
      skipTour: "Skip Tour",
      next: "Next",
      back: "Back",
      finish: "Got It!",
      stepOf: "Step {current} of {total}",
      steps: [
        {
          title: "Scan your lease",
          description: "Start here – upload your lease to see risks and important dates."
        },
        {
          title: "Track your deposit",
          description: "Track your deposit and see when it should be returned."
        },
        {
          title: "Set rent reminders",
          description: "Set monthly rent reminders so you never pay late."
        },
        {
          title: "Store evidence",
          description: "Store photos, videos and documents so you have proof if there's a dispute."
        },
        {
          title: "Get help when needed",
          description: "When things go wrong, submit a case here for professional help."
        }
      ]
    },
    th: {
      skipTour: "ข้ามทัวร์",
      next: "ถัดไป",
      back: "ย้อนกลับ",
      finish: "เข้าใจแล้ว!",
      stepOf: "ขั้นที่ {current} จาก {total}",
      steps: [
        {
          title: "สแกนสัญญาเช่าของคุณ",
          description: "เริ่มที่นี่ – อัปโหลดสัญญาเช่าเพื่อดูความเสี่ยงและวันที่สำคัญ"
        },
        {
          title: "ติดตามเงินมัดจำของคุณ",
          description: "ติดตามเงินมัดจำและดูว่าควรจะได้คืนเมื่อไหร่"
        },
        {
          title: "ตั้งค่าการแจ้งเตือนค่าเช่า",
          description: "ตั้งการแจ้งเตือนค่าเช่ารายเดือนเพื่อไม่ให้จ่ายสาย"
        },
        {
          title: "เก็บหลักฐาน",
          description: "เก็บรูปภาพ วิดีโอ และเอกสารเพื่อให้คุณมีหลักฐานหากเกิดข้อพิพาท"
        },
        {
          title: "รับความช่วยเหลือเมื่อจำเป็น",
          description: "เมื่อเกิดปัญหา ส่งคดีที่นี่เพื่อรับความช่วยเหลือจากผู้เชี่ยวชาญ"
        }
      ]
    },
    zh: {
      skipTour: "跳过教程",
      next: "下一步",
      back: "返回",
      finish: "知道了！",
      stepOf: "第 {current} 步，共 {total} 步",
      steps: [
        {
          title: "扫描租约",
          description: "从这里开始 – 上传租约以查看风险和关键日期。"
        },
        {
          title: "追踪押金",
          description: "追踪您的押金并查看何时应退还。"
        },
        {
          title: "设置租金提醒",
          description: "设置自动租金提醒，这样您就不会错过付款。"
        },
        {
          title: "存储证据",
          description: "存储照片、视频和文档，以便在以后发生争议时有证据。"
        },
        {
          title: "解决纠纷",
          description: "出现问题时，在此提交案件以获得会员或公开价格的专业帮助。"
        }
      ]
    },
    ja: {
      skipTour: "ツアーをスキップ",
      next: "次へ",
      back: "戻る",
      finish: "わかりました！",
      stepOf: "ステップ {current} / {total}",
      steps: [
        {
          title: "賃貸契約をスキャン",
          description: "ここから始めましょう – 賃貸契約をアップロードしてリスクと重要な日付を確認します。"
        },
        {
          title: "敷金を追跡",
          description: "敷金を追跡し、いつ返却されるべきかを確認します。"
        },
        {
          title: "家賃リマインダーを設定",
          description: "自動家賃リマインダーを設定して、支払いを見逃さないようにします。"
        },
        {
          title: "証拠を保存",
          description: "後で紛争が発生した場合に証拠があるように、写真、ビデオ、書類を保存します。"
        },
        {
          title: "紛争を解決",
          description: "問題が発生した場合は、ここでケースを提出して、会員価格または公開価格で専門家の支援を受けてください。"
        }
      ]
    },
    ko: {
      skipTour: "투어 건너뛰기",
      next: "다음",
      back: "뒤로",
      finish: "알겠습니다！",
      stepOf: "{total}단계 중 {current}단계",
      steps: [
        {
          title: "임대 계약 스캔",
          description: "여기서 시작하세요 – 임대 계약을 업로드하여 위험과 주요 날짜를 확인하세요."
        },
        {
          title: "보증금 추적",
          description: "보증금을 추적하고 언제 반환되어야 하는지 확인하세요."
        },
        {
          title: "임대료 알림 설정",
          description: "자동 임대료 알림을 설정하여 결제를 놓치지 마세요."
        },
        {
          title: "증거 저장",
          description: "나중에 분쟁이 발생할 경우 증거가 있도록 사진, 비디오 및 문서를 저장하세요."
        },
        {
          title: "분쟁 해결",
          description: "문제가 발생하면 여기에서 사례를 제출하여 회원 또는 공개 요금으로 전문가의 도움을 받으세요."
        }
      ]
    },
    ru: {
      skipTour: "Пропустить",
      next: "Далее",
      back: "Назад",
      finish: "Понятно!",
      stepOf: "Шаг {current} из {total}",
      steps: [
        {
          title: "Сканируйте ваш договор аренды",
          description: "Начните здесь – загрузите договор, чтобы увидеть риски и важные даты."
        },
        {
          title: "Отслеживайте ваш депозит",
          description: "Отслеживайте депозит и узнайте, когда его должны вернуть."
        },
        {
          title: "Установите напоминания об аренде",
          description: "Установите ежемесячные напоминания об аренде, чтобы не платить с опозданием."
        },
        {
          title: "Храните доказательства",
          description: "Храните фото, видео и документы, чтобы иметь доказательства в случае спора."
        },
        {
          title: "Получите помощь при необходимости",
          description: "Если что-то пойдет не так, подайте дело здесь для профессиональной помощи."
        }
      ]
    }
  };

  const strings = t[language] || t.en;
  const steps = strings.steps;

  if (!isVisible || user.onboarding_banner_dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        style={{
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        <button
          onClick={() => {
            haptic.light();
            completeTourMutation.mutate();
            setIsVisible(false);
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {strings.stepOf.replace('{current}', currentStep + 1).replace('{total}', steps.length)}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-50">
            {steps[currentStep].title}
          </h3>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
            {steps[currentStep].description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              haptic.light();
              if (currentStep > 0) {
                setCurrentStep(currentStep - 1);
              }
            }}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                haptic.light();
                completeTourMutation.mutate();
                setIsVisible(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              {strings.skipTour}
            </button>
            <button
              onClick={() => {
                haptic.medium();
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                } else {
                  completeTourMutation.mutate();
                  setIsVisible(false);
                }
              }}
              className="px-6 py-2 rounded-lg font-semibold text-sm text-white flex items-center gap-2 transition-all"
              style={{
                background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)'
              }}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {strings.finish}
                </>
              ) : (
                <>
                  {strings.next}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}