import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { haptic } from "../shared/HapticFeedback";
import { Shield, Zap, Crown, CheckCircle2, XCircle, Loader2, ChevronRight, Gift, AlertTriangle, Database, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const EXPLORER_LIMIT_BYTES = 100 * 1024 * 1024; // 100MB

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

const TIER_MONTHLY_VALUE = { explorer: 0, free: 0, lite: 190, protect: 390, secure: 990 };

const REASON_OPTIONS = [
  { value: "too_expensive", en: "Too expensive", th: "แพงเกินไป" },
  { value: "dont_need", en: "Don't need it anymore", th: "ไม่ต้องการอีกต่อไป" },
  { value: "missing_features", en: "Missing features I need", th: "ขาดฟีเจอร์ที่ต้องการ" },
  { value: "found_alternative", en: "Found a better alternative", th: "พบทางเลือกที่ดีกว่า" },
  { value: "technical_issues", en: "Technical issues or bugs", th: "ปัญหาทางเทคนิค" },
  { value: "poor_support", en: "Poor customer service", th: "บริการลูกค้าไม่ดี" },
  { value: "difficult_to_use", en: "Difficult to use", th: "ใช้งานยาก" },
  { value: "low_value", en: "Not enough value for price", th: "คุณค่าไม่คุ้มราคา" },
  { value: "no_longer_renting", en: "No longer renting", th: "ไม่ได้เช่าอีกต่อไป" },
  { value: "other", en: "Other", th: "อื่นๆ" },
];

const DOWNGRADE_TIERS = {
  secure: [
    { key: "protect", label: "Protect", price: 390, icon: Shield, color: "#C7A338",
      features: ["12 Scans/year", "Full Risk Reports", "LINE Notifications", "5 Letter Credits"],
      featuresTh: ["12 สแกน/ปี", "รายงานความเสี่ยงเต็ม", "แจ้งเตือน LINE", "5 เครดิตจดหมาย"] },
    { key: "lite", label: "Lite", price: 190, icon: Zap, color: "#047857",
      features: ["6 Scans/year", "Email Notifications", "3 Letter Credits", "1GB Storage"],
      featuresTh: ["6 สแกน/ปี", "แจ้งเตือนอีเมล", "3 เครดิตจดหมาย", "พื้นที่ 1GB"] },
    { key: "explorer", label: "Explorer", price: 0, icon: Gift, color: "#64748b",
      features: ["1 Scan (lifetime)", "Basic Risk Preview", "100MB Storage"],
      featuresTh: ["1 สแกน (ตลอดชีพ)", "ดูความเสี่ยงเบื้องต้น", "พื้นที่ 100MB"] },
  ],
  protect: [
    { key: "lite", label: "Lite", price: 190, icon: Zap, color: "#047857",
      features: ["6 Scans/year", "Email Notifications", "3 Letter Credits", "1GB Storage"],
      featuresTh: ["6 สแกน/ปี", "แจ้งเตือนอีเมล", "3 เครดิตจดหมาย", "พื้นที่ 1GB"] },
    { key: "explorer", label: "Explorer", price: 0, icon: Gift, color: "#64748b",
      features: ["1 Scan (lifetime)", "Basic Risk Preview", "100MB Storage"],
      featuresTh: ["1 สแกน (ตลอดชีพ)", "ดูความเสี่ยงเบื้องต้น", "พื้นที่ 100MB"] },
  ],
  lite: [
    { key: "explorer", label: "Explorer", price: 0, icon: Gift, color: "#64748b",
      features: ["1 Scan (lifetime)", "Basic Risk Preview", "100MB Storage"],
      featuresTh: ["1 สแกน (ตลอดชีพ)", "ดูความเสี่ยงเบื้องต้น", "พื้นที่ 100MB"] },
  ],
};

export default function CancellationModal({ 
  isOpen, onClose, user, language, colors, isDarkMode,
  onDowngrade, onCancel, queryClient, refetchUser
}) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [processing, setProcessing] = useState(false);
  const [storageUsageBytes, setStorageUsageBytes] = useState(0);
  const [storageLoading, setStorageLoading] = useState(false);
  const [pendingExplorerTier, setPendingExplorerTier] = useState(null);

  // Fetch storage usage when modal opens
  useEffect(() => {
    if (isOpen && user?.email) {
      setStorageLoading(true);
      base44.functions.invoke('checkStorageQuota', { fileSize: 1 })
        .then(res => {
          setStorageUsageBytes(res.data?.currentUsage || 0);
        })
        .catch(() => setStorageUsageBytes(0))
        .finally(() => setStorageLoading(false));
    }
  }, [isOpen, user?.email]);

  const lang = language || "en";
  const planTier = ((user?.plan_tier || "free").toLowerCase() === "explorer") ? "free" : (user?.plan_tier || "free");
  const currentValue = TIER_MONTHLY_VALUE[planTier] || 0;
  const downgradeOptions = DOWNGRADE_TIERS[planTier] || [];

  const t = lang === "th" ? {
    step1Title: "เราเสียใจที่เห็นคุณจากไป",
    step1Sub: "ช่วยเราปรับปรุงโดยบอกเหตุผลของคุณ",
    selectReason: "เลือกเหตุผล...",
    tellMore: "บอกเราเพิ่มเติม (ไม่บังคับ)",
    continue: "ดำเนินการต่อ",
    step2Title: "ก่อนยกเลิก ลองพิจารณาตัวเลือกเหล่านี้",
    switchTo: "เปลี่ยนเป็น",
    savePerMonth: "ประหยัด ฿{amount}/เดือน",
    cancelSub: "ยกเลิกการสมัครสมาชิก",
    cancelDesc: "สิ้นสุดฟีเจอร์เมื่อครบรอบการเรียกเก็บเงิน",
    cancelBtn: "ยกเลิกการสมัครสมาชิกของฉัน",
    processing: "กำลังดำเนินการ...",
    goBack: "กลับ",
    free: "ฟรี",
  } : {
    step1Title: "We're sorry to see you go",
    step1Sub: "Help us improve by sharing why?",
    selectReason: "Select a reason...",
    tellMore: "Tell us more (optional)",
    continue: "Continue",
    step2Title: "Before you cancel, would any of these work better?",
    switchTo: "Switch to",
    savePerMonth: "Save ฿{amount}/month",
    cancelSub: "Cancel Subscription",
    cancelDesc: "End paid features at billing period end",
    cancelBtn: "Cancel My Subscription",
    processing: "Processing...",
    goBack: "Go Back",
    free: "Free",
  };

  const handleClose = () => {
    setStep(1);
    setReason("");
    setDetails("");
    setProcessing(false);
    setPendingExplorerTier(null);
    onClose();
  };

  const isOverExplorerLimit = storageUsageBytes > EXPLORER_LIMIT_BYTES;

  const handleContinueToStep2 = () => {
    if (!reason) return;
    base44.analytics.track({
      eventName: "cancellation_reason_submitted",
      properties: { reason_category: reason, current_tier: planTier, monthly_value: currentValue }
    });
    base44.analytics.track({
      eventName: "retention_offer_shown",
      properties: { offers_shown: downgradeOptions.map(o => o.key), reason_given: reason, current_tier: planTier }
    });
    setStep(2);
  };

  const handleDowngrade = async (tier) => {
    haptic.medium();

    // If downgrading to Explorer and over storage limit, show warning step first
    if (tier.key === "explorer" && isOverExplorerLimit && step !== 3) {
      setPendingExplorerTier(tier);
      setStep(3);
      return;
    }

    setProcessing(true);
    const newValue = TIER_MONTHLY_VALUE[tier.key] || 0;

    // Track downgrade from cancel flow
    base44.analytics.track({
      eventName: "downgrade_from_cancel_flow",
      properties: { from_tier: planTier, to_tier: tier.key, reason_given: reason, revenue_retained: newValue }
    });

    // Store cancellation reason
    try {
      await base44.entities.CancellationReason.create({
        user_email: user.email, user_id: user.id, previous_tier: planTier,
        reason, reason_details: details,
        outcome: `downgraded_to_${tier.key}`, new_tier: tier.key,
        subscription_value_lost: currentValue, subscription_value_retained: newValue,
      });
    } catch (e) { console.error("[CANCEL_MODAL] Failed to store reason:", e); }

    // Track retention success
    base44.analytics.track({
      eventName: "retention_success",
      properties: { original_intent: "cancel", outcome: "downgraded", from_tier: planTier, to_tier: tier.key, revenue_saved: newValue }
    });

    if (tier.key === "explorer") {
      // Cancel subscription (downgrade to free)
      try {
        const response = await base44.functions.invoke("cancelSubscription", {
          reason, feedback: details || `Downgraded to Explorer from cancel flow`
        });
        if (response.data?.success) {
          refetchUser?.();
          queryClient?.invalidateQueries({ queryKey: ["currentUser"] });
          haptic.success();
          const until = response.data.access_until ? new Date(response.data.access_until).toLocaleDateString() : "";
          alert(lang === "th" ? `ลดระดับสำเร็จ เข้าถึงได้จนถึง ${until}` : `Downgrade successful. Access until ${until}.`);
          handleClose();
        } else {
          haptic.error();
          alert(response.data?.error || "Failed");
        }
      } catch (e) {
        haptic.error();
        alert(e.response?.data?.error || e.message);
      }
    } else {
      // Switch to paid tier via checkout
      if (onDowngrade) onDowngrade(tier.key, reason, details);
      handleClose();
    }
    setProcessing(false);
  };

  const handleCancelCompletely = async () => {
    haptic.medium();
    setProcessing(true);

    // Store reason
    try {
      await base44.entities.CancellationReason.create({
        user_email: user.email, user_id: user.id, previous_tier: planTier,
        reason, reason_details: details, outcome: "cancelled",
        subscription_value_lost: currentValue, subscription_value_retained: 0,
      });
    } catch (e) { console.error("[CANCEL_MODAL] Failed to store reason:", e); }

    // Track cancellation completed
    base44.analytics.track({
      eventName: "cancellation_completed",
      properties: { tier_cancelled: planTier, reason_given: reason, revenue_lost: currentValue }
    });

    try {
      const response = await base44.functions.invoke("cancelSubscription", {
        reason, feedback: details
      });
      if (response.data?.success) {
        refetchUser?.();
        queryClient?.invalidateQueries({ queryKey: ["currentUser"] });
        haptic.success();
        const until = response.data.access_until ? new Date(response.data.access_until).toLocaleDateString() : "";
        alert(lang === "th" ? `ยกเลิกสำเร็จ เข้าถึงได้จนถึง ${until}` : `Cancelled. Access until ${until}.`);
        handleClose();
      } else {
        haptic.error();
        alert(response.data?.error || "Failed");
      }
    } catch (e) {
      haptic.error();
      alert(e.response?.data?.error || e.message);
    }
    setProcessing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="modal-enter" style={{
        backgroundColor: colors.cardBg, borderColor: colors.borderColor, color: colors.textPrimary,
        maxHeight: "90vh", width: "95vw", maxWidth: "560px", display: "flex", flexDirection: "column", overflow: "hidden"
      }}>
        {step === 3 ? (
          /* STEP 3: STORAGE WARNING */
          <>
            <DialogHeader style={{ flexShrink: 0, paddingBottom: "12px" }}>
              <DialogTitle className="text-center" style={{ color: colors.textPrimary }}>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: isDarkMode ? "#2A2020" : "#FFF7ED" }}>
                  <AlertTriangle className="w-8 h-8" style={{ color: "#F59E0B" }} />
                </div>
                <div className="text-xl font-bold mb-1">
                  {lang === "th" ? "พื้นที่จัดเก็บเกินขีดจำกัด" : "Storage Limit Warning"}
                </div>
                <p className="text-sm font-normal" style={{ color: colors.textSecondary }}>
                  {lang === "th"
                    ? `คุณใช้ ${formatBytes(storageUsageBytes)} แต่แผน Explorer มีพื้นที่เพียง 100MB`
                    : `You're using ${formatBytes(storageUsageBytes)} but Explorer only includes 100MB`}
                </p>
              </DialogTitle>
            </DialogHeader>
            <div style={{ overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
              <div className="space-y-4 py-3">
                {/* Storage meter */}
                <div className="p-4 rounded-xl" style={{
                  backgroundColor: isDarkMode ? "#2A2020" : "#FEF2F2",
                  border: "2px solid #F59E0B"
                }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="w-5 h-5" style={{ color: "#F59E0B" }} />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                          {lang === "th" ? "พื้นที่ปัจจุบัน" : "Current Usage"}
                        </span>
                        <span className="text-xs font-bold" style={{ color: "#EF4444" }}>
                          {formatBytes(storageUsageBytes)} / 100 MB
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full" style={{ backgroundColor: isDarkMode ? "#374151" : "#E5E7EB" }}>
                        <div className="h-full rounded-full" style={{
                          width: `${Math.min(100, (storageUsageBytes / EXPLORER_LIMIT_BYTES) * 100)}%`,
                          backgroundColor: "#EF4444",
                          maxWidth: "100%"
                        }} />
                      </div>
                      <p className="text-xs mt-1 font-semibold" style={{ color: "#EF4444" }}>
                        {Math.round(((storageUsageBytes - EXPLORER_LIMIT_BYTES) / (1024 * 1024)))}MB {lang === "th" ? "เกินขีดจำกัด" : "over limit"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* What happens */}
                <div className="p-4 rounded-xl" style={{
                  backgroundColor: isDarkMode ? "#1E293B" : "#FFF7ED",
                  border: `1px solid ${isDarkMode ? "#F59E0B30" : "#FDE68A"}`
                }}>
                  <p className="font-bold text-sm mb-2" style={{ color: colors.textPrimary }}>
                    {lang === "th" ? "หากคุณลดระดับ:" : "If you downgrade:"}
                  </p>
                  <ul className="space-y-2 text-xs" style={{ color: colors.textSecondary }}>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                      {lang === "th" ? "ไฟล์ทั้งหมดยังเข้าถึงได้ 30 วัน" : "All files stay accessible for 30 days"}
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                      {lang === "th" ? "การอัปโหลดใหม่จะถูกบล็อก" : "New uploads will be blocked"}
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                      {lang === "th" ? "หลัง 30 วัน ไฟล์เก่าจะถูกเก็บถาวร" : "After 30 days, excess files may be archived"}
                    </li>
                  </ul>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {/* Option 1: Manage files */}
                  <button
                    onClick={() => {
                      haptic.light();
                      handleClose();
                      window.location.href = createPageUrl("EvidenceVault");
                    }}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: "10px",
                      backgroundColor: "#0C3B2E", color: "#FFFFFF",
                      fontWeight: "700", fontSize: "14px", border: "none",
                      cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    {lang === "th" ? "จัดการไฟล์เพื่อลดพื้นที่" : "Manage Files to Free Up Space"}
                  </button>

                  {/* Option 2: Downgrade anyway with grace period */}
                  <button
                    onClick={() => {
                      if (pendingExplorerTier) {
                        // Re-call handleDowngrade - step is already 3 so it won't loop
                        handleDowngrade(pendingExplorerTier);
                      }
                    }}
                    disabled={processing}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: "10px",
                      backgroundColor: processing ? "#9CA3AF" : "#F59E0B", color: "#FFFFFF",
                      fontWeight: "600", fontSize: "13px", border: "none",
                      cursor: processing ? "not-allowed" : "pointer",
                      opacity: processing ? 0.6 : 1,
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                    }}
                  >
                    {processing
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.processing}</>
                      : (lang === "th" ? "ลดระดับต่อไป (30 วันเก็บไฟล์)" : "Downgrade Anyway (30-day grace period)")}
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}` }}>
              <button onClick={() => { setStep(2); setPendingExplorerTier(null); }} disabled={processing}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "transparent", color: colors.textSecondary, fontWeight: "500", fontSize: "13px", border: `1px solid ${colors.borderColor}`, cursor: "pointer" }}
              >
                {t.goBack}
              </button>
            </div>
          </>
        ) : step === 1 ? (
          <>
            <DialogHeader style={{ flexShrink: 0, paddingBottom: "12px" }}>
              <DialogTitle className="text-center" style={{ color: colors.textPrimary }}>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: isDarkMode ? "#2A2020" : "#FEF2F2" }}>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-xl font-bold mb-1">{t.step1Title}</div>
                <p className="text-sm font-normal" style={{ color: colors.textSecondary }}>{t.step1Sub}</p>
              </DialogTitle>
            </DialogHeader>
            <div style={{ overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
              <div className="space-y-4 py-3">
                <div>
                  <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {lang === "th" ? "เหตุผล" : "Reason"} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg || colors.fieldBg, borderColor: colors.borderColor, color: colors.textPrimary, minHeight: "48px" }}>
                      <SelectValue placeholder={t.selectReason} />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                      {REASON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{lang === "th" ? opt.th : opt.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm" style={{ color: colors.textSecondary }}>{t.tellMore}</Label>
                  <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="mt-2"
                    style={{ backgroundColor: colors.inputBg || colors.fieldBg, borderColor: colors.borderColor, color: colors.textPrimary, borderRadius: "8px", padding: "10px 12px", fontSize: "14px" }}
                  />
                </div>
              </div>
            </div>
            <div className="pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}` }}>
              <button onClick={handleContinueToStep2} disabled={!reason}
                style={{ width: "100%", padding: "14px", borderRadius: "10px", backgroundColor: !reason ? "#9CA3AF" : "#0C3B2E", color: "#FFF", fontWeight: "700", fontSize: "15px", border: "none", cursor: !reason ? "not-allowed" : "pointer", opacity: !reason ? 0.5 : 1, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {t.continue} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader style={{ flexShrink: 0, paddingBottom: "8px" }}>
              <DialogTitle className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {t.step2Title}
              </DialogTitle>
            </DialogHeader>
            <div style={{ overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
              <div className="space-y-3 py-3">
                {/* Retention offers shown - tracked in handleContinueToStep2 */}

                {downgradeOptions.map((tier) => {
                  const Icon = tier.icon;
                  const savings = currentValue - tier.price;
                  const feats = lang === "th" ? tier.featuresTh : tier.features;
                  return (
                    <div key={tier.key} className="p-4 rounded-xl border-2" style={{
                      backgroundColor: isDarkMode ? "#1E293B" : "#F8FAFC", borderColor: tier.color + "40"
                    }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tier.color }}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold" style={{ color: colors.textPrimary }}>{tier.label}</span>
                            <span className="font-bold" style={{ color: tier.color }}>
                              {tier.price === 0 ? t.free : `฿${tier.price}/mo`}
                            </span>
                            {savings > 0 && (
                              <Badge className="text-xs bg-emerald-100 text-emerald-700">
                                {t.savePerMonth.replace("{amount}", savings)}
                              </Badge>
                            )}
                          </div>
                          <ul className="space-y-0.5 mb-3">
                            {feats.map((f, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs" style={{ color: colors.textSecondary }}>
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: tier.color }} /> {f}
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => handleDowngrade(tier)} disabled={processing}
                            style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: tier.color, color: "#FFF", fontWeight: "600", fontSize: "13px", border: "none", cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.6 : 1, transition: "all 0.2s" }}
                          >
                            {processing ? t.processing : `${t.switchTo} ${tier.label}`}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Divider */}
                <div style={{ height: "1px", backgroundColor: colors.borderColor, margin: "8px 0" }} />

                {/* Cancel completely */}
                <div className="p-4 rounded-xl border-2" style={{
                  backgroundColor: isDarkMode ? "#2A1F1F" : "#FEF2F2", borderColor: "#EF4444"
                }}>
                  <div className="mb-3">
                    <p className="font-bold text-sm" style={{ color: "#EF4444" }}>{t.cancelSub}</p>
                    <p className="text-xs" style={{ color: isDarkMode ? "#FCA5A5" : "#991B1B" }}>{t.cancelDesc}</p>
                  </div>
                  <button onClick={handleCancelCompletely} disabled={processing}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: processing ? "#9CA3AF" : "#EF4444", color: "#FFF", fontWeight: "700", fontSize: "14px", border: "none", cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.6 : 1, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.processing}</> : t.cancelBtn}
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}` }}>
              <button onClick={() => setStep(1)} disabled={processing}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "transparent", color: colors.textSecondary, fontWeight: "500", fontSize: "13px", border: `1px solid ${colors.borderColor}`, cursor: "pointer" }}
              >
                {t.goBack}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}