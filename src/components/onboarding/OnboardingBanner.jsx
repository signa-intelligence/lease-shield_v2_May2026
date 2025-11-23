import React from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { haptic } from "../shared/HapticFeedback";

export default function OnboardingBanner({ user, colors, language, onStartSetup }) {
  const queryClient = useQueryClient();

  const dismissBannerMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({ onboarding_banner_dismissed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const handleDismiss = () => {
    haptic.light();
    dismissBannerMutation.mutate();
  };

  const t = {
    en: {
      welcome: "Welcome to Lease Shield",
      subtitle: "Let's get your rental fully protected in a few minutes.",
      startSetup: "Start setup",
      skipForNow: "Skip for now"
    },
    th: {
      welcome: "ยินดีต้อนรับสู่ Lease Shield",
      subtitle: "มาปกป้องสัญญาเช่าของคุณให้ครบถ้วนภายในไม่กี่นาที",
      startSetup: "เริ่มตั้งค่า",
      skipForNow: "ข้ามตอนนี้"
    },
    zh: {
      welcome: "欢迎来到租约盾",
      subtitle: "让我们在几分钟内全面保护您的租赁。",
      startSetup: "开始设置",
      skipForNow: "暂时跳过"
    },
    ja: {
      welcome: "リースシールドへようこそ",
      subtitle: "数分で賃貸を完全に保護しましょう。",
      startSetup: "セットアップを開始",
      skipForNow: "今はスキップ"
    },
    ko: {
      welcome: "리스실드에 오신 것을 환영합니다",
      subtitle: "몇 분 안에 임대를 완전히 보호하세요.",
      startSetup: "설정 시작",
      skipForNow: "나중에"
    },
    ru: {
      welcome: "Добро пожаловать в Lease Shield",
      subtitle: "Давайте полностью защитим ваш договор аренды за несколько минут.",
      startSetup: "Начать настройку",
      skipForNow: "Пропустить пока"
    }
  };

  const strings = t[language] || t.en;

  return (
    <div
      className="mb-6 rounded-2xl shadow-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
        border: '2px solid rgba(199, 163, 56, 0.3)'
      }}
    >
      <div className="p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">
              {strings.welcome}
            </h2>
            <p className="text-white/90 text-sm mb-4">
              {strings.subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  haptic.medium();
                  onStartSetup();
                }}
                className="px-5 py-2.5 bg-white text-forest rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg"
                style={{ color: '#0C3B2E' }}
              >
                {strings.startSetup}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-white/90 text-sm font-medium hover:text-white transition-all"
              >
                {strings.skipForNow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}