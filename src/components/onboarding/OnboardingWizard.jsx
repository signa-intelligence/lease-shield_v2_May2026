
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
  Wrench // Added Wrench icon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const OnboardingWizard = ({ open, onClose, user, colors, language = 'en' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const t = {
    en: {
      welcome: "Welcome to Lease Shield!",
      welcomeSubtitle: "Let's get you protected in 4 easy steps", // Updated from 3 to 4
      step1Title: "Upload Your Lease",
      step1Desc: "Get instant AI analysis of your rental agreement to identify risks and unfair terms before they become problems.",
      step2Title: "Track Your Deposit",
      step2Desc: "Never lose track of your security deposit. Set up automated reminders so you know exactly when to expect it back.",
      step3Title: "Report Maintenance", // New step title
      step3Desc: "Document and track all maintenance issues with timestamps and photos. Keep landlords accountable.", // New step description
      step4Title: "Store Evidence", // Renamed from step3Title
      step4Desc: "Build a solid paper trail. Upload photos, receipts, and documents to protect yourself if disputes arise.", // Renamed from step3Desc
      finalTitle: "You're All Set!",
      finalDesc: "Lease Shield is now protecting your rental rights. Start with your first action below.",
      next: "Next",
      back: "Back",
      skip: "Skip Tour",
      getStarted: "Get Started",
      uploadLease: "Upload My Lease",
      addDeposit: "Track Deposit",
      reportMaintenance: "Report Issue", // New action button text
      uploadDocs: "Add Evidence",
      stepOf: "Step {current} of {total}"
    },
    th: {
      welcome: "ยินดีต้อนรับสู่ Lease Shield!", // Changed to Lease Shield for consistency
      welcomeSubtitle: "มาเริ่มปกป้องคุณใน 4 ขั้นตอนง่ายๆ", // Updated from 3 to 4
      step1Title: "อัปโหลดสัญญาเช่า",
      step1Desc: "รับการวิเคราะห์ AI ทันทีสำหรับสัญญาเช่าของคุณ เพื่อระบุความเสี่ยงและข้อกำหนดที่ไม่ยุติธรรมก่อนที่จะกลายเป็นปัญหา", // Rephrased for clarity
      step2Title: "ติดตามเงินมัดจำ",
      step2Desc: "ไม่มีทางสูญเสียการติดตามเงินมัดจำของคุณ ตั้งการแจ้งเตือนอัตโนมัติเพื่อให้คุณรู้ว่าเมื่อไหร่จะได้คืน", // Rephrased for clarity
      step3Title: "แจ้งซ่อมบำรุง", // New step title
      step3Desc: "บันทึกและติดตามปัญหาการซ่อมบำรุงทั้งหมดพร้อมเวลาและรูปภาพ ทำให้เจ้าของบ้านรับผิดชอบ", // New step description
      step4Title: "เก็บหลักฐาน", // Renamed from step3Title
      step4Desc: "สร้างร่องรอยเอกสารที่มั่นคง อัปโหลดรูปภาพ ใบเสร็จ และเอกสารเพื่อปกป้องตัวเองหากเกิดข้อพิพาท", // Renamed from step3Desc
      finalTitle: "คุณพร้อมแล้ว!",
      finalDesc: "Lease Shield กำลังปกป้องสิทธิ์การเช่าของคุณแล้ว เริ่มต้นด้วยการดำเนินการแรกของคุณด้านล่าง",
      next: "ถัดไป",
      back: "ย้อนกลับ",
      skip: "ข้ามทัวร์",
      getStarted: "เริ่มต้น",
      uploadLease: "อัปโหลดสัญญาเช่า",
      addDeposit: "ติดตามเงินมัดจำ",
      reportMaintenance: "แจ้งปัญหา", // New action button text
      uploadDocs: "เพิ่มหลักฐาน",
      stepOf: "ขั้นตอนที่ {current} จาก {total}"
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
      icon: Wrench, // New icon for maintenance step
      color: '#F59E0B', // New color for maintenance step
      title: strings.step3Title,
      description: strings.step3Desc,
      action: strings.reportMaintenance,
      route: "PropertyTracker" // Assuming maintenance reporting is part of PropertyTracker
    },
    {
      icon: FileText,
      color: '#10B981',
      title: strings.step4Title, // Updated from step3Title
      description: strings.step4Desc, // Updated from step3Desc
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
        className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0"
        style={{ 
          backgroundColor: colors.cardBg,
          border: 'none',
          overflow: 'hidden'
        }}
      >
        {/* Header with gradient - Fixed at top */}
        <div 
          className="p-4 sm:p-6 md:p-8 relative flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${currentStepData?.color || '#0C3B2E'} 0%, ${currentStepData?.color || '#0C3B2E'}dd 100%)`
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4 text-white" />
          </button>

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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8"> {/* Changed from sm:grid-cols-3 to grid-cols-2 */}
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
                        ? colors.filterBg
                        : 'transparent',
                    border: `2px solid ${isActive ? step.color : isPast ? '#10B981' : colors.borderColor}`,
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
                    <span className="font-semibold text-xs sm:text-sm" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? `ขั้นที่ ${idx + 1}` : `Step ${idx + 1}`}
                    </span>
                  </div>
                  <p className="text-xs font-medium line-clamp-2" style={{ color: colors.textSecondary }}>
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
                  <p className="font-bold text-sm sm:text-base md:text-lg mb-1" style={{ color: colors.textPrimary }}>
                    {currentStepData.action}
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'คลิกเพื่อเริ่ม' : 'Click to start'}
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
              className="text-xs sm:text-sm"
              style={{ 
                opacity: currentStep === 0 ? 0.5 : 1,
                color: colors.textPrimary
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
                className="text-xs sm:text-sm"
                style={{ 
                  borderColor: colors.borderColor,
                  color: colors.textSecondary
                }}
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
