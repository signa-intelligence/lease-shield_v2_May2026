import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Shield, Zap, XCircle, Crown, ArrowRight } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

const trackEvent = (eventName, properties) => {
  try {
    base44.analytics.track({ eventName, properties });
  } catch (e) {
    console.log('[Analytics]', eventName, properties);
  }
};

const PLAN_PRICES = { lite: 190, protect: 390, secure: 990, explorer: 0, free: 0 };

const DOWNGRADE_OPTIONS = {
  secure: [
    { key: 'protect', label: 'Protect', price: 390, icon: Shield, color: '#C7A338', features: ['12 Lease Scans/year', 'LINE Notifications', '5GB Storage', 'Full Risk Reports'] },
    { key: 'lite', label: 'Lite', price: 190, icon: Zap, color: '#047857', features: ['6 Lease Scans/year', 'Email Notifications', '1GB Storage'] },
  ],
  protect: [
    { key: 'lite', label: 'Lite', price: 190, icon: Zap, color: '#047857', features: ['6 Lease Scans/year', 'Email Notifications', '1GB Storage'] },
  ],
  lite: [],
};

const REASONS = [
  { value: 'too_expensive', en: 'Too expensive', th: 'แพงเกินไป' },
  { value: 'dont_need', en: "Don't need it anymore", th: 'ไม่ต้องการอีกแล้ว' },
  { value: 'missing_features', en: 'Missing features I need', th: 'ขาดฟีเจอร์ที่ต้องการ' },
  { value: 'found_alternative', en: 'Found a better alternative', th: 'พบทางเลือกที่ดีกว่า' },
  { value: 'technical_issues', en: 'Technical issues or bugs', th: 'มีปัญหาทางเทคนิค' },
  { value: 'poor_support', en: 'Poor customer service', th: 'บริการลูกค้าไม่ดี' },
  { value: 'difficult_to_use', en: 'Difficult to use', th: 'ใช้งานยาก' },
  { value: 'low_value', en: 'Not enough value for price', th: 'คุณค่าไม่คุ้มราคา' },
  { value: 'no_longer_renting', en: 'No longer renting', th: 'ไม่ได้เช่าแล้ว' },
  { value: 'other', en: 'Other', th: 'อื่นๆ' },
];

export default function RetentionModal({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isTh = language === 'th';
  const planTier = ((user?.plan_tier || 'free').toLowerCase() === 'explorer') ? 'free' : (user?.plan_tier || 'free');
  const currentPrice = PLAN_PRICES[planTier] || 0;
  const isDarkMode = user?.theme === 'dark';
  const downgrades = DOWNGRADE_OPTIONS[planTier] || [];

  const colors = isDarkMode ? {
    cardBg: '#2A2D30', textPrimary: '#F9FAFB', textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)', inputBg: '#374151', hoverBg: '#3A3D40'
  } : {
    cardBg: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)', inputBg: '#FFFFFF', hoverBg: '#F1F5F9'
  };

  const handleClose = () => {
    setStep(1);
    setReason('');
    setDetails('');
    setProcessing(false);
    onClose();
  };

  const handleContinue = () => {
    if (!reason) return;
    trackEvent('cancellation_reason_submitted', { reason, current_tier: planTier, monthly_value: currentPrice });
    setStep(2);
  };

  const handleDowngrade = async (tierKey) => {
    haptic.medium();
    setProcessing(true);
    const newPrice = PLAN_PRICES[tierKey] || 0;
    try {
      // Store reason
      await base44.entities.CancellationReason.create({
        user_email: user.email, user_id: user.id, previous_tier: planTier,
        reason, reason_details: details, outcome: `downgraded_to_${tierKey}`,
        new_tier: tierKey, subscription_value: currentPrice, revenue_retained: newPrice
      });
      trackEvent('retention_success', { from_tier: planTier, to_tier: tierKey, reason, revenue_saved: newPrice });
      // Trigger Stripe checkout for new tier (reuse existing handleSubscribe logic via page event)
      window.dispatchEvent(new CustomEvent('retention:downgrade', { detail: { tier: tierKey } }));
      handleClose();
    } catch (e) {
      console.error('[RETENTION] Downgrade failed:', e);
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    haptic.medium();
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('cancelSubscription', { reason, feedback: details });
      if (response.data?.success) {
        await base44.entities.CancellationReason.create({
          user_email: user.email, user_id: user.id, previous_tier: planTier,
          reason, reason_details: details, outcome: 'cancelled',
          subscription_value: currentPrice, revenue_retained: 0
        });
        trackEvent('cancellation_completed', { tier_cancelled: planTier, reason, revenue_lost: currentPrice });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        haptic.success();
        const until = response.data.access_until ? new Date(response.data.access_until).toLocaleDateString() : '';
        alert(isTh ? `ยกเลิกสำเร็จ เข้าถึงได้จนถึง ${until}` : `Cancelled. Access until ${until}.`);
        handleClose();
      } else {
        haptic.error();
        alert(`${isTh ? 'ยกเลิกล้มเหลว' : 'Cancel failed'}: ${response.data?.error || 'Unknown error'}`);
        setProcessing(false);
      }
    } catch (e) {
      haptic.error();
      alert(`${isTh ? 'ยกเลิกล้มเหลว' : 'Cancel failed'}: ${e.response?.data?.error || e.message}`);
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="modal-enter" style={{
        backgroundColor: colors.cardBg, borderColor: colors.borderColor, color: colors.textPrimary,
        maxHeight: '90vh', width: '95vw', maxWidth: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {step === 1 ? (
          <>
            <DialogHeader style={{ flexShrink: 0, paddingBottom: '12px' }}>
              <DialogTitle className="text-xl font-bold text-center" style={{ color: colors.textPrimary }}>
                {isTh ? 'เราเสียใจที่เห็นคุณจากไป' : "We're sorry to see you go"}
              </DialogTitle>
              <p className="text-sm text-center mt-2" style={{ color: colors.textSecondary }}>
                {isTh ? 'ช่วยบอกเราว่าทำไมเพื่อปรับปรุงบริการ' : 'Help us improve by sharing why?'}
              </p>
            </DialogHeader>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {isTh ? 'เหตุผล' : 'Reason'} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary, minHeight: '44px' }}>
                      <SelectValue placeholder={isTh ? 'เลือกเหตุผล...' : 'Select a reason...'} />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                      {REASONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{isTh ? r.th : r.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm" style={{ color: colors.textPrimary }}>
                    {isTh ? 'บอกเราเพิ่มเติม (ไม่บังคับ)' : 'Tell us more (optional)'}
                  </Label>
                  <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={isTh ? 'ช่วยบอกเราว่าเราสามารถทำอะไรได้ดีขึ้น...' : 'Help us understand what we could do better...'} rows={3} className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary, borderRadius: '8px', padding: '10px 12px', fontSize: '14px' }} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}`, paddingTop: '12px' }}>
              <button onClick={handleClose} className="btn-interaction" style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', border: 'none', backgroundColor: '#0C3B2E', color: '#FFFFFF', cursor: 'pointer', minHeight: '44px' }}>
                {isTh ? 'เก็บการสมัครไว้' : 'Keep My Subscription'}
              </button>
              <button onClick={handleContinue} disabled={!reason} className="btn-interaction" style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', border: 'none', backgroundColor: !reason ? '#9CA3AF' : '#EF4444', color: '#FFFFFF', cursor: !reason ? 'not-allowed' : 'pointer', opacity: !reason ? 0.5 : 1, minHeight: '44px' }}>
                {isTh ? 'ดำเนินการต่อ' : 'Continue'}
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader style={{ flexShrink: 0, paddingBottom: '12px' }}>
              <DialogTitle className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {isTh ? 'ก่อนยกเลิก มีตัวเลือกอื่นที่เหมาะกว่าไหม?' : 'Before you cancel, would any of these work better?'}
              </DialogTitle>
            </DialogHeader>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div className="space-y-3 py-4">
                {downgrades.map((tier) => {
                  const Icon = tier.icon;
                  const savings = currentPrice - tier.price;
                  return (
                    <div key={tier.key} className="p-4 rounded-xl border-2" style={{ backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF', borderColor: tier.color }}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tier.color }}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-base" style={{ color: colors.textPrimary }}>{tier.label}</h3>
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">{isTh ? `ประหยัด ฿${savings}/เดือน` : `Save ฿${savings}/mo`}</Badge>
                          </div>
                          <p className="text-sm font-bold mb-2" style={{ color: tier.color }}>฿{tier.price}/{isTh ? 'เดือน' : 'month'}</p>
                          <ul className="space-y-1">
                            {tier.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs" style={{ color: colors.textPrimary }}>
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: tier.color }} />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <button onClick={() => handleDowngrade(tier.key)} disabled={processing} className="btn-interaction" style={{ width: '100%', padding: '12px', backgroundColor: tier.color, color: '#FFFFFF', borderRadius: '8px', fontWeight: '700', fontSize: '14px', border: 'none', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        {isTh ? `เปลี่ยนเป็น ${tier.label}` : `Switch to ${tier.label}`}
                      </button>
                    </div>
                  );
                })}

                {/* Divider */}
                <div style={{ borderTop: `2px dashed ${colors.borderColor}`, margin: '16px 0' }} />

                {/* Cancel completely */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#2A2020' : '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-sm" style={{ color: '#DC2626' }}>
                      {isTh ? 'ยกเลิกการสมัครสมาชิก' : 'Cancel Subscription'}
                    </h3>
                  </div>
                  <p className="text-xs mb-3" style={{ color: '#991B1B' }}>
                    {isTh ? 'สิ้นสุดฟีเจอร์ที่ชำระเงินเมื่อสิ้นสุดรอบบิล' : 'End paid features at billing period end'}
                  </p>
                  <button onClick={handleCancel} disabled={processing} className="btn-interaction" style={{ width: '100%', padding: '10px', backgroundColor: processing ? '#9CA3AF' : '#DC2626', color: '#FFFFFF', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    {isTh ? 'ยกเลิกการสมัครสมาชิก' : 'Cancel My Subscription'}
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}`, paddingTop: '12px' }}>
              <button onClick={() => setStep(1)} disabled={processing} className="btn-interaction" style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.borderColor}`, borderRadius: '8px', fontWeight: '500', fontSize: '13px', cursor: processing ? 'not-allowed' : 'pointer' }}>
                {isTh ? 'กลับ' : 'Go Back'}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}