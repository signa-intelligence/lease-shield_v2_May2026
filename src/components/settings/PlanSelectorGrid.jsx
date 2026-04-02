import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { PLAN_DETAILS, PRICING } from "./PlanDetails";

export default function PlanSelectorGrid({
  planTier, isFreePlan, billingPeriod, subscribing, colors, isDarkMode, language, strings,
  handleSubscribe, handleDowngradeOrCancel, haptic, isScheduledForCancellation
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {PLAN_DETAILS.map((plan) => {
        const Icon = plan.icon;
        const isFreeplanLocal = plan.key === 'free';
        const isCurrentPlan = isFreeplanLocal ? isFreePlan : planTier === plan.key;
        const isSecureTierLocal = plan.key === 'secure';
        const isLiteTierLocal = plan.key === 'lite';
        const isSubscribingForPlan = subscribing[plan.key];
        const pricingData = PRICING[plan.key];
        const hasPricing = !isFreeplanLocal && pricingData;

        const cardBorderColor = isCurrentPlan
          ? '#10B981'
          : isSecureTierLocal ? '#0C3B2E'
          : isLiteTierLocal ? '#047857'
          : plan.popular ? '#C7A338'
          : colors.borderColor;

        const cardBg = isCurrentPlan
          ? (isDarkMode ? '#1A2E27' : '#F0FDF4')
          : isSecureTierLocal ? (isDarkMode ? '#1A2E27' : '#F0FDF4')
          : isLiteTierLocal ? (isDarkMode ? '#1C2D28' : '#F0FDF9')
          : plan.popular ? (isDarkMode ? '#2D2520' : '#FFFBEB')
          : colors.cardBg;

        return (
          <div
            key={plan.key}
            className={`card-interactive relative border-2 ${!isCurrentPlan && plan.popular ? 'border-amber-400 shadow-lg' : ''} ${isSecureTierLocal ? 'shadow-xl' : ''}`}
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorderColor,
              borderWidth: isCurrentPlan || isSecureTierLocal ? '3px' : '2px',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '580px'
            }}
          >
            {/* Top badge */}
            <div style={{ height: '24px', marginBottom: '12px' }}>
              {isCurrentPlan ? (
                <Badge className="text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px', backgroundColor: '#10B981' }}>
                  ✓ {strings.currentPlanBadge}
                </Badge>
              ) : plan.popular ? (
                <Badge className="bg-amber-500 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                  ⭐ {strings.mostPopular}
                </Badge>
              ) : isSecureTierLocal ? (
                <Badge className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white text-xs font-bold w-full justify-center whitespace-nowrap" style={{ padding: '4px 8px' }}>
                  👑 {language === 'th' ? 'พรีเมียม' : language === 'zh' ? '高级版' : language === 'ja' ? 'プレミアム' : language === 'ko' ? '프리미엄' : language === 'ru' ? 'ПРЕМИУМ' : 'PREMIUM'}
                </Badge>
              ) : null}
            </div>

            {/* Plan name */}
            <div className="text-center" style={{ height: '100px', marginBottom: '12px' }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: (isSecureTierLocal || isLiteTierLocal) ? (isSecureTierLocal ? '#0C3B2E' : '#047857') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon className="w-6 h-6" style={{ color: (isSecureTierLocal || isLiteTierLocal) ? '#FFFFFF' : plan.bgColor }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: isSecureTierLocal ? '#0C3B2E' : colors.textPrimary }}>
                  {plan.label}
                </h3>
              </div>
              <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                {language === 'th' ? plan.taglineTh : language === 'zh' ? plan.taglineZh : language === 'ja' ? plan.taglineJa : language === 'ko' ? plan.taglineKo : language === 'ru' ? plan.taglineRu : plan.tagline}
              </p>
              <p className="text-xs line-clamp-2" style={{ color: colors.textSecondary }}>
                {language === 'th' ? plan.descriptionTh : language === 'zh' ? plan.descriptionZh : language === 'ja' ? plan.descriptionJa : language === 'ko' ? plan.descriptionKo : language === 'ru' ? plan.descriptionRu : plan.description}
              </p>
            </div>

            {/* Pricing */}
            <div className="text-center" style={{ height: '140px', marginBottom: '12px' }}>
              {isFreeplanLocal ? (
                <>
                  <div className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                    {language === 'th' ? 'สำรวจ' : language === 'zh' ? '探索' : language === 'ja' ? '探索' : language === 'ko' ? '탐색' : language === 'ru' ? 'Обзор' : 'Explorer'}
                  </div>
                  <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>{strings.noCreditCard}</p>
                </>
              ) : hasPricing ? (
                <>
                  <div className="mb-2">
                    <div className="text-3xl font-bold" style={{ color: isSecureTierLocal ? '#0C3B2E' : '#C7A338' }}>
                      ฿{Math.round(plan.priceAnnual / 12)}
                    </div>
                    <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {language === 'th' ? '/ เดือน' : language === 'zh' ? '/ 月' : language === 'ja' ? '/ 月' : language === 'ko' ? '/ 월' : language === 'ru' ? '/ месяц' : '/ month'}
                    </div>
                  </div>
                  <div className="pt-2" style={{ borderTop: `1px solid ${colors.borderColor}` }}>
                    <p className="text-xs font-semibold" style={{ color: '#10B981' }}>{strings.discountSubtext}</p>
                  </div>
                </>
              ) : (
                <div className="text-sm font-semibold" style={{ color: '#EF4444' }}>
                  {language === 'th' ? 'ราคาไม่พร้อมใช้งานชั่วคราว' : 'Pricing temporarily unavailable'}
                </div>
              )}
            </div>

            {/* Benefits */}
            <div style={{ flex: 1, marginBottom: '12px' }}>
              <ul className="space-y-2">
                {(language === 'th' ? plan.benefitsTh : language === 'zh' ? plan.benefitsZh : language === 'ja' ? plan.benefitsJa : language === 'ko' ? plan.benefitsKo : language === 'ru' ? plan.benefitsRu : plan.benefits).map((benefit, idx) => {
                  const isBold = benefit.startsWith('Everything in') || benefit.startsWith('ทุกอย่างใน') || benefit.startsWith('Все из') || benefit.startsWith('包含') || benefit.startsWith('の全て') || benefit.startsWith('플랜의 모든');
                  return (
                    <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: colors.textPrimary }}>
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#0C3B2E' }} />
                      <span style={{ fontWeight: isBold ? 'bold' : 'normal' }}>{benefit}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* CTA Button */}
            <div className="mt-auto">
              {isCurrentPlan ? (
                <Button disabled className="w-full h-10 text-sm" style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF', cursor: 'not-allowed', border: '2px solid #10B981', opacity: 0.9 }}>
                  ✓ {strings.currentPlanBadge}
                </Button>
              ) : isFreeplanLocal && !isFreePlan ? (
                <Button
                  onClick={() => { if (!isScheduledForCancellation) { haptic.medium(); handleDowngradeOrCancel(); } }}
                  disabled={isScheduledForCancellation}
                  className="w-full h-10 text-sm btn-interaction"
                  style={{
                    backgroundColor: isScheduledForCancellation ? (isDarkMode ? '#374151' : '#F3F4F6') : 'transparent',
                    color: isScheduledForCancellation ? '#F59E0B' : '#EF4444',
                    cursor: isScheduledForCancellation ? 'not-allowed' : 'pointer',
                    border: isScheduledForCancellation ? '2px solid #F59E0B' : '2px solid #EF4444',
                    fontWeight: '600',
                    opacity: isScheduledForCancellation ? 0.8 : 1
                  }}
                >
                  {isScheduledForCancellation
                    ? (language === 'th' ? '⏳ รอการยกเลิก' : language === 'zh' ? '⏳ 取消中' : language === 'ja' ? '⏳ キャンセル保留中' : language === 'ko' ? '⏳ 취소 대기 중' : language === 'ru' ? '⏳ Отмена запланирована' : '⏳ Cancellation Pending')
                    : strings.downgradeToFree}
                </Button>
              ) : !hasPricing && !isFreeplanLocal ? (
                <Button disabled className="w-full h-10 text-sm" style={{ backgroundColor: '#9CA3AF', color: '#FFFFFF', cursor: 'not-allowed', opacity: 0.6 }}>
                  {language === 'th' ? 'ไม่พร้อมใช้งานชั่วคราว' : 'Temporarily Unavailable'}
                </Button>
              ) : !isFreeplanLocal ? (
                <Button onClick={() => { haptic.medium(); handleSubscribe(plan.key, 'annual'); }} disabled={isSubscribingForPlan} className="w-full h-10 btn-interaction" style={{ backgroundColor: isSubscribingForPlan ? '#9CA3AF' : (isSecureTierLocal ? '#0C3B2E' : isLiteTierLocal ? '#047857' : plan.popular ? '#C7A338' : '#0C3B2E'), color: '#FFFFFF', cursor: isSubscribingForPlan ? 'not-allowed' : 'pointer', opacity: isSubscribingForPlan ? 0.7 : 1, fontSize: isSecureTierLocal ? '14px' : '13px', fontWeight: isSecureTierLocal ? '700' : '600' }}>
                  {isSubscribingForPlan ? strings.processing : (plan.key === 'lite' ? strings.save17OnLite : plan.key === 'protect' ? strings.save17OnProtect : plan.key === 'secure' ? strings.save17OnSecure : `${strings.startPlan} ${plan.label}`)}
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}