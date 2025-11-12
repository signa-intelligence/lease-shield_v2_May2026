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
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const OnboardingWizard = ({ open, onClose, user, colors, language = 'en' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const t = {
    en: {
      welcome: "Welcome to Lease Shield!",
      welcomeSubtitle: "Let's get you protected in 3 easy steps",
      step1Title: "Upload Your Lease",
      step1Desc: "Get instant AI analysis of your rental agreement to identify risks and unfair terms before they become problems.",
      step2Title: "Track Your Deposit",
      step2Desc: "Never lose track of your security deposit. Set up automated reminders so you know exactly when to expect it back.",
      step3Title: "Store Evidence",
      step3Desc: "Build a solid paper trail. Upload photos, receipts, and documents to protect yourself if disputes arise.",
      finalTitle: "You're All Set!",
      finalDesc: "Lease Shield is now protecting your rental rights. Start with your first action below.",
      next: "Next",
      back: "Back",
      skip: "Skip Tour",
      getStarted: "Get Started",
      uploadLease: "Upload My Lease",
      addDeposit: "Track Deposit",
      uploadDocs: "Add Evidence",
      stepOf: "Step {current} of {total}"
    },
    th: {
      welcome: "ยินดีต้อนรับสู่ Lease Shield!",
      welcomeSubtitle: "มาเริ่มปกป้องคุณใน 3 ขั้นตอนง่ายๆ",
      step1Title: "อัปโหลดสัญญาเช่า",
      step1Desc: "รับการวิเคราะห์ AI ทันทีสำหรับสัญญาเช่าของคุณ เพื่อระบุความเสี่ยงและข้อกำหนดที่ไม่ยุติธรรมก่อนที่จะกลายเป็นปัญหา",
      step2Title: "ติดตามเงินมัดจำ",
      step2Desc: "ไม่มีทางสูญเสียการติดตามเงินมัดจำของคุณ ตั้งการแจ้งเตือนอัตโนมัติเพื่อให้คุณรู้ว่าเมื่อไหร่จะได้คืน",
      step3Title: "เก็บหลักฐาน",
      step3Desc: "สร้างร่องรอยเอกสารที่มั่นคง อัปโหลดรูปภาพ ใบเสร็จ และเอกสารเพื่อปกป้องตัวเองหากเกิดข้อพิพาท",
      finalTitle: "คุณพร้อมแล้ว!",
      finalDesc: "Lease Shield กำลังปกป้องสิทธิ์การเช่าของคุณแล้ว เริ่มต้นด้วยการดำเนินการแรกของคุณด้านล่าง",
      next: "ถัดไป",
      back: "ย้อนกลับ",
      skip: "ข้ามทัวร์",
      getStarted: "เริ่มต้น",
      uploadLease: "อัปโหลดสัญญาเช่า",
      addDeposit: "ติดตามเงินมัดจำ",
      uploadDocs: "เพิ่มหลักฐาน",
      stepOf: "ขั้นตอน {current} จาก {total}"
    }
  };

  const strings = t[language];

  const steps = [
    {
      icon: Upload,
      color: '#3B82F6',
      title: strings.step1Title,
      description: strings.step1Desc,
      action: strings.uploadLease,
      route: "UploadScan"
    },
    {
      icon: Wallet,
      color: '#C7A338',
      title: strings.step2Title,
      description: strings.step2Desc,
      action: strings.addDeposit,
      route: "PropertyTracker"
    },
    {
      icon: FileText,
      color: '#10B981',
      title: strings.step3Title,
      description: strings.step3Desc,
      action: strings.uploadDocs,
      route: "DocumentVault"
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
        className="max-w-2xl"
        style={{ 
          backgroundColor: colors.cardBg,
          border: 'none',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Header with gradient */}
        <div 
          className="p-8 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${currentStepData?.color || '#0C3B2E'} 0%, ${currentStepData?.color || '#0C3B2E'}dd 100%)`
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="text-center mb-6">
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Icon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentStepData?.title || strings.welcome}
            </h2>
            <p className="text-white/90 text-lg">
              {currentStepData?.description || strings.welcomeSubtitle}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-white/80 text-sm mb-2">
              <span>{strings.stepOf.replace('{current}', currentStep + 1).replace('{total}', steps.length)}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl transition-all cursor-pointer"
                  style={{
                    backgroundColor: isActive 
                      ? `${step.color}15`
                      : isPast
                        ? colors.filterBg
                        : 'transparent',
                    border: `2px solid ${isActive ? step.color : isPast ? '#10B981' : colors.borderColor}`,
                    opacity: isActive ? 1 : 0.7
                  }}
                  onClick={() => setCurrentStep(idx)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: isPast ? '#10B981' : step.color }}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <StepIcon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? `ขั้นที่ ${idx + 1}` : `Step ${idx + 1}`}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleActionClick(currentStepData.route)}
            className="w-full mb-4 p-6 rounded-xl border-2 border-dashed transition-all hover:scale-105"
            style={{
              backgroundColor: `${currentStepData.color}10`,
              borderColor: `${currentStepData.color}40`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: currentStepData.color }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg mb-1" style={{ color: colors.textPrimary }}>
                    {currentStepData.action}
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'คลิกเพื่อเริ่ม' : 'Click to start'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6" style={{ color: currentStepData.color }} />
            </div>
          </button>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              style={{ 
                opacity: currentStep === 0 ? 0.5 : 1,
                color: colors.textPrimary
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {strings.back}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                style={{ 
                  borderColor: colors.borderColor,
                  color: colors.textSecondary
                }}
              >
                {strings.skip}
              </Button>
              <Button
                onClick={handleNext}
                style={{
                  backgroundColor: currentStepData.color,
                  color: '#FFFFFF'
                }}
              >
                {currentStep === steps.length - 1 ? strings.getStarted : strings.next}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;