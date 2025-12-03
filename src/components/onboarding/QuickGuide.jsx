import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Home, FileText, Wallet, FolderOpen, Wrench, Scale, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK_GUIDE_STEPS = [
  {
    title: "Welcome to Your Dashboard",
    icon: Home,
    bullets: [
      "This is your home base – see your protection score, active leases, deposits, and any urgent alerts at a glance",
      "Quick action buttons let you upload a lease, track a deposit, or report a maintenance issue",
      "Your protection score shows how well-documented your rental situation is"
    ]
  },
  {
    title: "Upload & Scan Your Lease",
    icon: FileText,
    bullets: [
      "Upload photos or PDF of your lease agreement for instant AI analysis",
      "The scan identifies key terms, risks, and important dates (rent due, notice periods, lease end)",
      "Get a risk score and recommendations before you sign or during your tenancy"
    ]
  },
  {
    title: "Track Your Deposit",
    icon: Wallet,
    bullets: [
      "Add your security deposit amount, payment date, and expected return date",
      "Receive automated reminders as your move-out date approaches",
      "Document any deductions or disputes to protect your refund"
    ]
  },
  {
    title: "Store Evidence in the Vault",
    icon: FolderOpen,
    bullets: [
      "Upload photos, videos, receipts, and documents as timestamped evidence",
      "Use this for move-in/move-out condition, repairs, and any landlord communications",
      "Everything is organized and ready if you ever need to prove something"
    ]
  },
  {
    title: "Report Maintenance Issues",
    icon: Wrench,
    bullets: [
      "Log any repair requests with photos, descriptions, and timestamps",
      "Track landlord responses and resolution status",
      "Build a documented history if issues are ignored"
    ]
  },
  {
    title: "Get Help Resolving Disputes",
    icon: Scale,
    bullets: [
      "If your landlord withholds your deposit or violates the lease, submit a case",
      "Our team reviews your evidence and helps draft professional letters and messages",
      "Get clearer next steps and guidance based on your situation"
    ]
  },
  {
    title: "Stay Notified",
    icon: Bell,
    bullets: [
      "Connect LINE or enable email alerts for rent reminders, deposit deadlines, and case updates",
      "Never miss a critical date or message",
      "View your full notification history in Timeline"
    ]
  }
];

const TRANSLATIONS = {
  en: {
    intro: "LeaseShield is a rental protection app for tenants that helps you document your lease, track deposits, store evidence, and resolve disputes with landlords.",
    back: "Back",
    next: "Next",
    getStarted: "Get Started",
    stepOf: "of",
    quickGuide: "Quick Guide"
  },
  th: {
    intro: "LeaseShield คือแอปคุ้มครองผู้เช่าที่ช่วยคุณจัดการสัญญาเช่า ติดตามเงินมัดจำ เก็บหลักฐาน และแก้ไขข้อพิพาทกับเจ้าของบ้าน",
    back: "ย้อนกลับ",
    next: "ถัดไป",
    getStarted: "เริ่มต้นใช้งาน",
    stepOf: "จาก",
    quickGuide: "คู่มือเริ่มต้น"
  },
  zh: {
    intro: "LeaseShield 是一款租户保护应用，帮助您管理租约、追踪押金、存储证据，并解决与房东的纠纷。",
    back: "返回",
    next: "下一步",
    getStarted: "开始使用",
    stepOf: "/",
    quickGuide: "快速指南"
  },
  ja: {
    intro: "LeaseShield はテナント保護アプリで、賃貸契約の管理、敷金の追跡、証拠の保存、オーナーとの紛争解決をサポートします。",
    back: "戻る",
    next: "次へ",
    getStarted: "始める",
    stepOf: "/",
    quickGuide: "クイックガイド"
  },
  ko: {
    intro: "LeaseShield는 임차인 보호 앱으로 임대 계약 관리, 보증금 추적, 증거 저장, 집주인과의 분쟁 해결을 도와줍니다.",
    back: "뒤로",
    next: "다음",
    getStarted: "시작하기",
    stepOf: "/",
    quickGuide: "빠른 가이드"
  },
  ru: {
    intro: "LeaseShield — приложение для защиты арендаторов, которое помогает управлять договорами аренды, отслеживать депозиты, хранить доказательства и разрешать споры с арендодателями.",
    back: "Назад",
    next: "Далее",
    getStarted: "Начать",
    stepOf: "из",
    quickGuide: "Краткое руководство"
  }
};

export default function QuickGuide({ open, onClose, language = 'en', isDarkMode = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const strings = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  if (!open) return null;

  const step = QUICK_GUIDE_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === QUICK_GUIDE_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem('leaseshield_quick_guide_done', 'true');
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          maxHeight: '90vh',
          animation: 'modalEnter 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div 
          className="relative p-6 pb-4"
          style={{
            background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)'
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70 mb-1">
                {strings.quickGuide} • {currentStep + 1} {strings.stepOf} {QUICK_GUIDE_STEPS.length}
              </p>
              <h2 className="text-xl font-bold text-white">
                {step.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / QUICK_GUIDE_STEPS.length) * 100}%`,
              backgroundColor: '#C7A338'
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {isFirstStep && (
            <p 
              className="text-sm mb-6 pb-4 border-b"
              style={{
                color: isDarkMode ? '#9CA3AF' : '#6B7280',
                borderColor: isDarkMode ? '#374151' : '#E5E7EB'
              }}
            >
              {strings.intro}
            </p>
          )}

          <ul className="space-y-4">
            {step.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: '#0C3B2E' }}
                >
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: isDarkMode ? '#E5E7EB' : '#374151' }}
                >
                  {bullet}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div 
          className="p-4 flex items-center justify-between border-t"
          style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
        >
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep}
            className="gap-2"
            style={{
              opacity: isFirstStep ? 0.5 : 1,
              borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
              color: isDarkMode ? '#E5E7EB' : '#374151'
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            {strings.back}
          </Button>

          {/* Step indicators */}
          <div className="flex gap-1.5">
            {QUICK_GUIDE_STEPS.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: index === currentStep 
                    ? '#0C3B2E' 
                    : index < currentStep 
                      ? '#C7A338' 
                      : (isDarkMode ? '#4B5563' : '#D1D5DB')
                }}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            className="gap-2"
            style={{
              backgroundColor: isLastStep ? '#C7A338' : '#0C3B2E',
              color: '#FFFFFF'
            }}
          >
            {isLastStep ? strings.getStarted : strings.next}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}