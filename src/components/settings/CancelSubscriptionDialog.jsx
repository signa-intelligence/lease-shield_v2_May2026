import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle, Loader2 } from "lucide-react";

export default function CancelSubscriptionDialog({
  open, onClose, user, language, colors, isDarkMode, strings,
  currentPlan, cancelReason, setCancelReason, cancelFeedback, setCancelFeedback,
  cancelling, handleCancelSubscription
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="modal-enter" 
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.borderColor,
          color: colors.textPrimary,
          maxHeight: '90vh',
          width: '95vw',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <DialogHeader style={{ flexShrink: 0, paddingBottom: '12px' }}>
          <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl" style={{ color: colors.textPrimary }}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div>
              {strings.cancelDialogTitle}
              <p className="text-xs sm:text-sm font-normal mt-1" style={{ color: colors.textSecondary }}>
                {strings.cancelDialogDesc}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-4 py-4">
            {currentPlan && (
              <div className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '2px solid #FECACA' }}>
                <p className="font-semibold text-red-900 mb-2 text-sm">{strings.whatYoullLose}:</p>
                <ul className="space-y-1 text-xs sm:text-sm text-red-800">
                  {(language === 'th' ? currentPlan.benefitsTh : language === 'zh' ? currentPlan.benefitsZh : language === 'ja' ? currentPlan.benefitsJa : language === 'ko' ? currentPlan.benefitsKo : language === 'ru' ? currentPlan.benefitsRu : currentPlan.benefits).filter(b => !b.startsWith('Everything') && !b.startsWith('ทุกอย่างใน') && !b.startsWith('Все из') && !b.startsWith('包含') && !b.startsWith('の全て') && !b.startsWith('플랜의 모든')).map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Label htmlFor="cancelReason" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                {strings.cancelReason} <span className="text-red-500">*</span>
              </Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary, minHeight: '44px' }}>
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
              <Label htmlFor="cancelFeedback" className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                {strings.additionalFeedback}
              </Label>
              <Textarea id="cancelFeedback" value={cancelFeedback} onChange={(e) => setCancelFeedback(e.target.value)} placeholder={strings.feedbackPlaceholder} rows={3} className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary, borderRadius: '8px', padding: '10px 12px', fontSize: '14px' }} />
            </div>
            <div className="p-3 rounded-lg text-xs sm:text-sm" style={{ backgroundColor: isDarkMode ? '#2A2D30' : '#F3F4F6', border: `1px solid ${colors.borderColor}` }}>
              <p style={{ color: colors.textSecondary }}>
                {strings.downgradeNote.replace('{date}', user?.plan_renews_at ? new Date(user.plan_renews_at).toLocaleDateString() : '')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}`, paddingTop: '12px' }}>
          <button onClick={() => { onClose(false); setCancelReason(''); setCancelFeedback(''); }} disabled={cancelling} className="btn-interaction" style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', border: 'none', backgroundColor: '#0C3B2E', color: '#FFFFFF', cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.5 : 1, transition: 'all 0.2s', minHeight: '44px' }}>
            {strings.keepSubscription}
          </button>
          <button onClick={handleCancelSubscription} disabled={cancelling || !cancelReason} className="btn-interaction" style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', border: 'none', backgroundColor: '#EF4444', color: '#FFFFFF', cursor: (cancelling || !cancelReason) ? 'not-allowed' : 'pointer', opacity: (cancelling || !cancelReason) ? 0.5 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '44px' }}>
            {cancelling ? (<><Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /><span className="text-xs sm:text-sm">{strings.cancelling}</span></>) : (<span className="text-xs sm:text-sm">{strings.confirmCancel}</span>)}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}