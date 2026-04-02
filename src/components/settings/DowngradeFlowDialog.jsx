import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

export default function DowngradeFlowDialog({
  isOpen, onClose, user, language, colors, isDarkMode,
  strings, isLitePlan, planTier, currentPlan,
  handleSubscribe, handleCancelSubscription: cancelSub,
  refetchUser, queryClient,
}) {
  const isCancellationPending = user?.subscription_status === 'canceling';

  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleClose = () => {
    setStep(1);
    setReason("");
    setFeedback("");
    setCancelling(false);
    onClose();
  };

  const handleSwitchToLite = () => {
    haptic.medium();
    handleClose();
    const currentBillingInterval = user?.billing_interval || "monthly";
    handleSubscribe("lite", currentBillingInterval);
  };

  const handleContinueToFree = () => {
    haptic.light();
    setStep(2);
  };

  const handleConfirmDowngradeToFree = async () => {
    if (!reason) {
      alert(language === "th" ? "กรุณาเลือกเหตุผล" : "Please select a reason");
      return;
    }
    haptic.medium();
    setCancelling(true);
    try {
      const { base44 } = await import("@/api/base44Client");

      // Store cancellation reason for analytics
      try {
        await base44.entities.CancellationReason.create({
          user_email: user?.email,
          user_id: user?.id,
          previous_tier: planTier,
          reason,
          reason_details: feedback || "User chose to downgrade to free plan",
          outcome: "downgraded_to_explorer",
          new_tier: "explorer",
          subscription_value: planTier === "lite" ? 190 : planTier === "protect" ? 390 : planTier === "secure" ? 990 : 0,
          revenue_retained: 0,
        });
      } catch (e) {
        console.error("[DOWNGRADE] Failed to store reason:", e);
      }

      const response = await base44.functions.invoke("cancelSubscription", {
        reason,
        feedback: feedback || "User chose to downgrade to free plan",
      });
      if (response.data?.success) {
        refetchUser?.();
        queryClient?.invalidateQueries({ queryKey: ["currentUser"] });
        haptic.success();
        const until = response.data.access_until
          ? new Date(response.data.access_until).toLocaleDateString()
          : "";
        alert(
          language === "th"
            ? `ลดระดับสำเร็จ เข้าถึงได้จนถึง ${until}`
            : `Downgrade successful. Access until ${until}.`
        );
        handleClose();
      } else if (response.data?.error) {
        haptic.error();
        alert(
          `${language === "th" ? "ลดระดับล้มเหลว" : "Downgrade failed"}: ${response.data.error}`
        );
      }
    } catch (error) {
      haptic.error();
      alert(
        `${language === "th" ? "ลดระดับล้มเหลว" : "Downgrade failed"}: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setCancelling(false);
    }
  };

  // If cancellation is already pending, show info instead of downgrade flow
  if (isCancellationPending) {
    const periodEndDate = user?.plan_renews_at
      ? new Date(user.plan_renews_at).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;
    const tierLabel = (user?.plan_tier || 'explorer').charAt(0).toUpperCase() + (user?.plan_tier || 'explorer').slice(1);

    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="modal-enter" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor, color: colors.textPrimary, maxWidth: '500px', width: '95vw' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center" style={{ color: colors.textPrimary }}>
              {language === 'th' ? '⏳ กำลังรอการยกเลิก' : language === 'zh' ? '⏳ 取消处理中' : language === 'ja' ? '⏳ キャンセル保留中' : language === 'ko' ? '⏳ 취소 대기 중' : language === 'ru' ? '⏳ Отмена запланирована' : '⏳ Cancellation Pending'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#2A2500' : '#FFF8E1', border: '2px solid #F59E0B' }}>
              <p className="text-sm mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th'
                  ? `แผน ${tierLabel} ของคุณจะสิ้นสุดในวันที่`
                  : `Your ${tierLabel} plan will end on`}{' '}
                <strong>{periodEndDate || '—'}</strong>.
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {language === 'th'
                  ? 'คุณยังคงเข้าถึงฟีเจอร์ทั้งหมดได้จนถึงวันนั้น หลังจากนั้นจะเปลี่ยนเป็น Explorer (ฟรี)'
                  : 'You still have full access to all features until then. After that, you\'ll be moved to Explorer (Free).'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="btn-interaction w-full"
              style={{ padding: '12px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', border: 'none', backgroundColor: '#0C3B2E', color: '#FFFFFF', cursor: 'pointer', minHeight: '44px' }}
            >
              {language === 'th' ? 'เข้าใจแล้ว' : 'Got it'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        className="modal-enter"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.borderColor,
          color: colors.textPrimary,
          maxHeight: "90vh",
          width: "95vw",
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {step === 1 ? (
          <>
            <DialogHeader style={{ flexShrink: 0, paddingBottom: "12px" }}>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-center" style={{ color: colors.textPrimary }}>
                {strings.keepProtectionActive}
              </DialogTitle>
              <p className="text-sm sm:text-base text-center mt-2" style={{ color: colors.textSecondary }}>
                {strings.retentionCopy}
              </p>
            </DialogHeader>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px", WebkitOverflowScrolling: "touch" }}>
              <div className="space-y-4 py-4">
                {/* Switch to Lite — only if user is NOT on Lite */}
                {!isLitePlan && (
                  <div className="p-5 sm:p-6 rounded-xl border-2 shadow-lg" style={{
                    backgroundColor: isDarkMode ? "#1E3A5F" : "#EFF6FF",
                    borderColor: "#3B82F6",
                  }}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1" style={{ color: isDarkMode ? "#93C5FD" : "#1D4ED8" }}>
                          Lite {language === "th" ? "- แผนที่เหมาะสมที่สุด" : language === "zh" ? "- 最适合大多数人" : language === "ja" ? "- ほとんどの人に最適" : language === "ko" ? "- 대부분에게 가장 적합" : language === "ru" ? "- Подходит для большинства" : "- Best fit for most"}
                        </h3>
                        <p className="text-sm mb-3" style={{ color: isDarkMode ? "#BFDBFE" : "#2563EB" }}>
                          {language === "th" ? "เพียง ฿190/เดือน - รักษาการป้องกันหลักและประหยัด 81% จากแผนปัจจุบัน" : language === "zh" ? "仅฿190/月 - 保持核心保护并比当前计划节省81%" : language === "ja" ? "わずか฿190/月 - コア保護を維持し、現在のプランから81%節約" : language === "ko" ? "월 ฿190만 - 핵심 보호 유지 및 현재 플랜에서 81% 절약" : language === "ru" ? "Всего ฿190/месяц - сохраните основную защиту и экономьте 81% от текущего плана" : "Only ฿190/month - keep core protections and save 81% from current plan"}
                        </p>
                        <ul className="space-y-1 text-xs sm:text-sm mb-4" style={{ color: isDarkMode ? "#BFDBFE" : "#2563EB" }}>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{language === "th" ? "6 การสแกนสัญญาต่อปี" : language === "zh" ? "每年6次租约扫描" : language === "ja" ? "年6回のリーススキャン" : language === "ko" ? "연간 6회 임대 계약 스캔" : language === "ru" ? "6 сканирований договоров/год" : "6 Lease Scans/year"}</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{language === "th" ? "การแจ้งเตือนทางอีเมล" : language === "zh" ? "电子邮件通知" : language === "ja" ? "メール通知" : language === "ko" ? "이메일 알림" : language === "ru" ? "Email уведомления" : "Email Notifications"}</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{language === "th" ? "ติดตามเงินมัดจำและการซ่อมบำรุง" : language === "zh" ? "押金和维护追踪" : language === "ja" ? "敷金とメンテナンス追跡" : language === "ko" ? "보증금 및 유지보수 추적" : language === "ru" ? "Отслеживание депозита и обслуживания" : "Deposit & Maintenance Tracking"}</li>
                        </ul>
                      </div>
                    </div>
                    <button
                      onClick={handleSwitchToLite}
                      className="btn-interaction"
                      style={{ width: "100%", padding: "14px 20px", backgroundColor: "#3B82F6", color: "#FFFFFF", borderRadius: "10px", fontWeight: "700", fontSize: "16px", border: "none", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(59,130,246,0.4)" }}
                      onMouseEnter={(e) => { e.target.style.backgroundColor = "#2563EB"; e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 6px 16px rgba(59,130,246,0.5)"; }}
                      onMouseLeave={(e) => { e.target.style.backgroundColor = "#3B82F6"; e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 12px rgba(59,130,246,0.4)"; }}
                    >
                      {strings.switchToLite}
                    </button>
                  </div>
                )}

                {/* Continue to Free — prominent if on Lite, subtle otherwise */}
                <div className="text-center pt-2">
                  <button
                    onClick={handleContinueToFree}
                    className="btn-interaction"
                    style={{
                      padding: isLitePlan ? "14px 20px" : "8px 16px",
                      backgroundColor: isLitePlan ? "#EF4444" : "transparent",
                      color: isLitePlan ? "#FFFFFF" : colors.textSecondary,
                      border: "none",
                      fontWeight: isLitePlan ? "700" : "500",
                      fontSize: isLitePlan ? "15px" : "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textDecoration: isLitePlan ? "none" : "underline",
                      borderRadius: "10px",
                      width: isLitePlan ? "100%" : "auto",
                    }}
                    onMouseEnter={(e) => { if (isLitePlan) e.target.style.backgroundColor = "#DC2626"; else e.target.style.color = colors.textPrimary; }}
                    onMouseLeave={(e) => { if (isLitePlan) e.target.style.backgroundColor = "#EF4444"; else e.target.style.color = colors.textSecondary; }}
                  >
                    {strings.continueToFree}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* STEP 2: REASON + CONFIRMATION FOR FREE */}
            <DialogHeader style={{ flexShrink: 0, paddingBottom: "12px" }}>
              <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl" style={{ color: colors.textPrimary }}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div>
                  {strings.confirmDowngradeTitle}
                  <p className="text-xs sm:text-sm font-normal mt-1" style={{ color: colors.textSecondary }}>
                    {strings.confirmDowngradeWarning}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px", WebkitOverflowScrolling: "touch" }}>
              <div className="space-y-4 py-4">
                {currentPlan && (
                  <div className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: "#FEE2E2", border: "2px solid #FECACA" }}>
                    <p className="font-semibold text-red-900 mb-2 text-sm">{strings.whatYoullLose}:</p>
                    <ul className="space-y-1 text-xs sm:text-sm text-red-800">
                      {(language === "th" ? currentPlan.benefitsTh : language === "zh" ? currentPlan.benefitsZh : language === "ja" ? currentPlan.benefitsJa : language === "ko" ? currentPlan.benefitsKo : language === "ru" ? currentPlan.benefitsRu : currentPlan.benefits)
                        .filter((b) => !b.startsWith("Everything") && !b.startsWith("ทุกอย่างใน") && !b.startsWith("Все из") && !b.startsWith("包含") && !b.startsWith("の全て") && !b.startsWith("플랜의 모든"))
                        .slice(0, 4)
                        .map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.reasonForDowngrade} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg || colors.fieldBg, borderColor: colors.borderColor, color: colors.textPrimary, minHeight: "44px" }}>
                      <SelectValue placeholder={strings.selectReason} />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                      <SelectItem value="too_expensive">{strings.reasonTooExpensive}</SelectItem>
                      <SelectItem value="not_using">{strings.reasonNotUsingEnough}</SelectItem>
                      <SelectItem value="found_alternative">{strings.reasonFoundAlternative}</SelectItem>
                      <SelectItem value="missing_features">{strings.reasonMissingFeatures}</SelectItem>
                      <SelectItem value="technical_issues">{strings.reasonTechnicalIssues}</SelectItem>
                      <SelectItem value="other">{strings.reasonOther}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm" style={{ color: colors.textPrimary }}>{strings.additionalFeedback}</Label>
                  <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={strings.feedbackPlaceholder} rows={3} className="mt-2" style={{ backgroundColor: colors.inputBg || colors.fieldBg, borderColor: colors.borderColor, color: colors.textPrimary, borderRadius: "8px", padding: "10px 12px", fontSize: "14px" }} />
                </div>
                <div className="p-3 rounded-lg text-xs sm:text-sm" style={{ backgroundColor: isDarkMode ? "#2A2D30" : "#F3F4F6", border: `1px solid ${colors.borderColor}` }}>
                  <p style={{ color: colors.textSecondary }}>
                    {strings.downgradeNote.replace("{date}", user?.plan_renews_at ? new Date(user.plan_renews_at).toLocaleDateString() : "")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}`, paddingTop: "12px" }}>
              <button onClick={() => { setStep(1); setReason(""); setFeedback(""); }} disabled={cancelling} className="btn-interaction" style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", border: `2px solid ${colors.borderColor}`, backgroundColor: colors.cardBg, color: colors.textPrimary, cursor: cancelling ? "not-allowed" : "pointer", opacity: cancelling ? 0.5 : 1, transition: "all 0.2s", minHeight: "44px" }}
                onMouseEnter={(e) => !cancelling && (e.target.style.backgroundColor = colors.hoverBg || colors.fieldBg)}
                onMouseLeave={(e) => !cancelling && (e.target.style.backgroundColor = colors.cardBg)}
              >
                {strings.goBack}
              </button>
              <button onClick={handleConfirmDowngradeToFree} disabled={cancelling || !reason} className="btn-interaction" style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", border: "none", backgroundColor: "#EF4444", color: "#FFFFFF", cursor: (cancelling || !reason) ? "not-allowed" : "pointer", opacity: (cancelling || !reason) ? 0.5 : 1, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", minHeight: "44px" }}
                onMouseEnter={(e) => (!cancelling && reason) && (e.target.style.backgroundColor = "#DC2626")}
                onMouseLeave={(e) => (!cancelling && reason) && (e.target.style.backgroundColor = "#EF4444")}
              >
                {cancelling ? (<><Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /><span className="text-xs sm:text-sm">{strings.cancelling}</span></>) : (<span className="text-xs sm:text-sm">{strings.confirmDowngradeBtn}</span>)}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}