import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Gift, CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

const TIER_PRICES = { secure: 990, protect: 390, lite: 190, free: 0 };

const TIER_INFO = {
  protect: {
    label: 'Protect', icon: Shield, price: 390, color: '#C7A338',
    features: ['12 Lease Scans/year', 'Full Risk Reports', 'LINE Notifications', '5 Letter Credits', '5GB Storage']
  },
  lite: {
    label: 'Lite', icon: Zap, price: 190, color: '#047857',
    features: ['6 Lease Scans/year', 'Email Notifications', '3 Letter Credits', '1GB Storage']
  },
  free: {
    label: 'Explorer (Free)', icon: Gift, price: 0, color: '#64748b',
    features: ['1 Lease Scan', 'Basic Risk Preview', '100MB Storage']
  }
};

const REASONS = [
  { value: 'too_expensive', en: 'Too expensive', th: 'แพงเกินไป' },
  { value: 'dont_need', en: "Don't need it anymore", th: 'ไม่ต้องการแล้ว' },
  { value: 'missing_features', en: 'Missing features I need', th: 'ขาดฟีเจอร์ที่ต้องการ' },
  { value: 'found_alternative', en: 'Found a better alternative', th: 'พบทางเลือกที่ดีกว่า' },
  { value: 'technical_issues', en: 'Technical issues or bugs', th: 'ปัญหาทางเทคนิค' },
  { value: 'poor_support', en: 'Poor customer service', th: 'บริการลูกค้าไม่ดี' },
  { value: 'difficult_to_use', en: 'Difficult to use', th: 'ใช้งานยาก' },
  { value: 'low_value', en: 'Not enough value for price', th: 'ไม่คุ้มค่ากับราคา' },
  { value: 'no_longer_renting', en: 'Business closed / No longer renting', th: 'ธุรกิจปิด / ไม่ได้เช่าแล้ว' },
  { value: 'other', en: 'Other', th: 'อื่นๆ' }
];

function getDowngradeOptions(currentTier) {
  const order = ['secure', 'protect', 'lite', 'free'];
  const idx = order.indexOf(currentTier);
  if (idx < 0) return [];
  return order.slice(idx + 1).filter(t => TIER_INFO[t]);
}

export default function RetentionModal({ isOpen, onClose, user, onSubscribe, colors, isDarkMode }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  const language = user?.language || 'en';
  const isTh = language === 'th';
  const planTier = ((user?.plan_tier || 'free').toLowerCase() === 'explorer') ? 'free' : (user?.plan_tier || 'free');
  const currentPrice = TIER_PRICES[planTier] || 0;
  const options = getDowngradeOptions(planTier);

  const reset = () => { setStep(1); setReason(''); setDetails(''); setProcessing(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleContinue = () => {
    if (!reason) return;
    base44.analytics.track({
      eventName: 'cancellation_reason_submitted',
      properties: { reason_category: reason, current_tier: planTier }
    });
    setStep(2);
    base44.analytics.track({
      eventName: 'retention_offer_shown',
      properties: { current_tier: planTier, offers_shown: options.join(','), reason_given: reason }
    });
  };

  const handleDowngrade = async (targetTier) => {
    haptic.medium();
    if (targetTier === 'free') {
      // Cancel subscription (downgrade to explorer)
      setProcessing(true);
      try {
        const response = await base44.functions.invoke('cancelSubscription', {
          reason, feedback: details, outcome: 'downgraded_to_explorer'
        });
        if (response.data?.success) {
          base44.analytics.track({
            eventName: 'downgrade_from_cancel_flow',
            properties: { from_tier: planTier, to_tier: 'explorer', reason_given: reason, revenue_retained: 0 }
          });
          base44.analytics.track({
            eventName: 'retention_success',
            properties: { original_intent: 'cancel', outcome: 'downgraded_to_explorer' }
          });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          handleClose();
          const until = response.data.access_until ? new Date(response.data.access_until).toLocaleDateString() : '';
          alert(isTh ? `ลดระดับสำเร็จ เข้าถึงได้จนถึง ${until}` : `Downgrade scheduled. Access until ${until}.`);
        } else {
          alert(response.data?.error || 'Failed');
        }
      } catch (e) {
        alert(e.response?.data?.error || e.message);
      } finally { setProcessing(false); }
    } else {
      // Switch to a lower paid tier via checkout
      base44.analytics.track({
        eventName: 'downgrade_from_cancel_flow',
        properties: { from_tier: planTier, to_tier: targetTier, reason_given: reason, revenue_retained: TIER_PRICES[targetTier] }
      });
      base44.analytics.track({
        eventName: 'retention_success',
        properties: { original_intent: 'cancel', outcome: `downgraded_to_${targetTier}` }
      });
      // Store reason before redirecting
      try {
        await base44.entities.CancellationReason.create({
          user_email: user.email, user_id: user.id, previous_tier: planTier,
          reason, reason_details: details, outcome: `downgraded_to_${targetTier}`,
          new_tier: targetTier, subscription_value: currentPrice, revenue_retained: TIER_PRICES[targetTier]
        });
      } catch (e) { console.error('[RETENTION] Failed to store reason:', e); }
      handleClose();
      onSubscribe(targetTier, user?.billing_interval || 'monthly');
    }
  };

  const handleCancelCompletely = async () => {
    haptic.medium();
    setProcessing(true);
    try {
      const response = await base44.functions.invoke('cancelSubscription', {
        reason, feedback: details, outcome: 'cancelled'
      });
      if (response.data?.success) {
        base44.analytics.track({
          eventName: 'cancellation_completed',
          properties: { tier_cancelled: planTier, reason_given: reason, revenue_lost: currentPrice, scheduled_end_date: response.data.access_until }
        });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        handleClose();
        const until = response.data.access_until ? new Date(response.data.access_until).toLocaleDateString() : '';
        alert(isTh ? `ยกเลิกสำเร็จ เข้าถึงได้จนถึง ${until}` : `Cancelled. Access until ${until}.`);
      } else {
        alert(response.data?.error || 'Failed');
      }
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    } finally { setProcessing(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="modal-enter" style={{
        backgroundColor: colors?.cardBg || '#fff', borderColor: colors?.borderColor || '#e5e7eb',
        color: colors?.textPrimary || '#0f172a', maxHeight: '90vh', width: '95vw', maxWidth: '560px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {step === 1 && (
          <>
            <DialogHeader style={{ flexShrink: 0, paddingBottom: '8px' }}>
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: isDarkMode ? '#374151' : '#FEF3C7' }}>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div>{isTh ? 'เราเสียใจที่เห็นคุณจากไป' : "We're sorry to see you go"}</div>
                  <p className="text-sm font-normal mt-1" style={{ color: colors?.textSecondary }}>
                    {isTh ? 'ช่วยเราปรับปรุงด้วยการบอกเหตุผล' : 'Help us improve by sharing why?'}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: colors?.textPrimary }}>
                    {isTh ? 'เหตุผลในการยกเลิก' : 'Reason for cancelling'} <span className="text-red-500">*</span>
                  </label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger style={{ backgroundColor: colors?.inputBg || '#fff', borderColor: colors?.borderColor, color: colors?.textPrimary, minHeight: '44px' }}>
                      <SelectValue placeholder={isTh ? 'เลือกเหตุผล...' : 'Select a reason...'} />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors?.cardBg, color: colors?.textPrimary }}>
                      {REASONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{isTh ? r.th : r.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm mb-2 block" style={{ color: colors?.textPrimary }}>
                    {isTh ? 'บอกเราเพิ่มเติม (ไม่บังคับ)' : 'Tell us more (optional)'}
                  </label>
                  <Textarea
                    value={details} onChange={(e) => setDetails(e.target.value)}
                    placeholder={isTh ? 'ความคิดเห็นของคุณมีค่ามาก...' : 'Your feedback is valuable...'}
                    rows={3} style={{ backgroundColor: colors?.inputBg || '#fff', borderColor: colors?.borderColor, color: colors?.textPrimary, fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors?.borderColor}`, paddingTop: '12px' }}>
              <button onClick={handleClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `2px solid ${colors?.borderColor}`, backgroundColor: colors?.cardBg, color: colors?.textPrimary, fontWeight: '600', cursor: 'pointer' }}>
                {isTh ? 'กลับ' : 'Go Back'}
              </button>
              <button onClick={handleContinue} disabled={!reason} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: !reason ? '#9CA3AF' : '#0C3B2E', color: '#fff', fontWeight: '700', cursor: !reason ? 'not-allowed' : 'pointer', opacity: !reason ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {isTh ? 'ดำเนินการต่อ' : 'Continue'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader style={{ flexShrink: 0, paddingBottom: '8px' }}>
              <DialogTitle className="text-lg">
                {isTh ? 'ก่อนยกเลิก ลองตัวเลือกเหล่านี้?' : 'Before you cancel, would any of these work better?'}
              </DialogTitle>
            </DialogHeader>
            <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
              <div className="space-y-3 py-2">
                {options.map(tierKey => {
                  const info = TIER_INFO[tierKey];
                  if (!info) return null;
                  const Icon = info.icon;
                  const savings = currentPrice - info.price;
                  return (
                    <div key={tierKey} className="p-4 rounded-xl border-2" style={{
                      backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC',
                      borderColor: isDarkMode ? '#374151' : '#E5E7EB'
                    }}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: info.color }}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold" style={{ color: colors?.textPrimary }}>{info.label}</span>
                            {savings > 0 && (
                              <Badge style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '11px', fontWeight: '700' }}>
                                {isTh ? `ประหยัด ฿${savings}/เดือน` : `Save ฿${savings}/mo`}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-bold mb-2" style={{ color: info.color }}>
                            {info.price > 0 ? `฿${info.price}/${isTh ? 'เดือน' : 'month'}` : (isTh ? 'ฟรี' : 'Free')}
                          </p>
                          <ul className="space-y-1">
                            {info.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs" style={{ color: colors?.textSecondary }}>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDowngrade(tierKey)} disabled={processing}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: info.color, color: '#fff', fontWeight: '700', fontSize: '14px', border: 'none', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isTh ? `เปลี่ยนเป็น ${info.label}` : `Switch to ${info.label}`}
                      </button>
                    </div>
                  );
                })}

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px" style={{ backgroundColor: colors?.borderColor }} />
                  <span className="text-xs font-semibold" style={{ color: colors?.textSecondary }}>
                    {isTh ? 'หรือ' : 'OR'}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: colors?.borderColor }} />
                </div>

                {/* Cancel completely */}
                <div className="p-4 rounded-xl border-2" style={{
                  backgroundColor: isDarkMode ? '#1C1111' : '#FEF2F2',
                  borderColor: isDarkMode ? '#7F1D1D' : '#FECACA'
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-bold" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                      {isTh ? 'ยกเลิกการสมัครสมาชิก' : 'Cancel Subscription'}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                    {isTh ? 'ยุติฟีเจอร์ที่ชำระเงินเมื่อสิ้นสุดรอบการเรียกเก็บเงิน' : 'End paid features at billing period end'}
                  </p>
                  <button
                    onClick={handleCancelCompletely} disabled={processing}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#EF4444', color: '#fff', fontWeight: '700', fontSize: '14px', border: 'none', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isTh ? 'ยกเลิกการสมัครสมาชิก' : 'Cancel My Subscription'}
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors?.borderColor}`, paddingTop: '12px' }}>
              <button onClick={() => setStep(1)} disabled={processing} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `2px solid ${colors?.borderColor}`, backgroundColor: 'transparent', color: colors?.textPrimary, fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                {isTh ? '← กลับ' : '← Back'}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}