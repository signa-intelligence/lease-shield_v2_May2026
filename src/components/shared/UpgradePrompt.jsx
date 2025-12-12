import React from 'react';
import { Crown, X, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { haptic } from './HapticFeedback';
import { getUpgradeRoute } from './UpgradeHelper';

/**
 * Reusable upgrade prompt component
 * Shows across the app for Free and Lite users
 */
export default function UpgradePrompt({
  title,
  description,
  benefits = [],
  targetPlan = 'secure', // deprecated - now auto-determined
  currentUserTier = 'free', // NEW: pass current user tier
  onUpgrade,
  onDismiss,
  compact = false,
  showDismiss = true,
  language = 'en',
  isDarkMode = false
}) {
  const upgradeRoute = getUpgradeRoute(currentUserTier, language);
  const colors = isDarkMode ? {
    bg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)'
  } : {
    bg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)'
  };

  const strings = {
    en: {
      upgradeNow: 'Upgrade Now',
      dismiss: 'Maybe later'
    },
    th: {
      upgradeNow: 'อัปเกรดเลย',
      dismiss: 'ภายหลัง'
    },
    zh: {
      upgradeNow: '立即升级',
      dismiss: '稍后再说'
    },
    ja: {
      upgradeNow: '今すぐアップグレード',
      dismiss: '後で'
    },
    ko: {
      upgradeNow: '지금 업그레이드',
      dismiss: '나중에'
    },
    ru: {
      upgradeNow: 'Обновить сейчас',
      dismiss: 'Позже'
    }
  };

  const str = strings[language] || strings.en;

  return (
    <Card
      className="border-2 shadow-lg relative overflow-hidden"
      style={{
        borderColor: '#CFAF6A',
        backgroundColor: colors.bg,
        backgroundImage: isDarkMode 
          ? 'linear-gradient(135deg, rgba(207,175,106,0.05) 0%, rgba(6,63,44,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(207,175,106,0.08) 0%, rgba(6,63,44,0.08) 100%)'
      }}
    >
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        {showDismiss && onDismiss && (
          <button
            onClick={() => {
              haptic.light();
              onDismiss();
            }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-all"
            style={{ zIndex: 10 }}
          >
            <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
          </button>
        )}

        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #CFAF6A 0%, #D9BC7E 100%)',
              boxShadow: '0 4px 12px rgba(207,175,106,0.3)'
            }}
          >
            <Crown className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className={`font-bold mb-1 ${compact ? 'text-sm' : 'text-base'}`} style={{ color: colors.textPrimary }}>
              {title}
            </h3>
            <p className={`mb-3 ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: colors.textSecondary }}>
              {description}
            </p>

            {benefits.length > 0 && (
              <ul className="space-y-1 mb-4">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: colors.textPrimary }}>
                    <span style={{ color: '#10B981' }}>✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}

            <Button
              onClick={() => {
                haptic.medium();
                if (onUpgrade) {
                  onUpgrade();
                } else if (upgradeRoute) {
                  window.location.href = upgradeRoute;
                }
              }}
              className="w-full btn-interaction"
              style={{
                backgroundColor: '#063F2C',
                color: '#FFFFFF',
                border: '2px solid #CFAF6A',
                borderRadius: '8px',
                padding: compact ? '8px 16px' : '10px 20px',
                fontSize: compact ? '13px' : '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                minHeight: '44px'
              }}
            >
              <Crown className="w-4 h-4" />
              {str.upgradeNow}
              <ArrowRight className="w-4 h-4" />
            </Button>

            {showDismiss && onDismiss && (
              <button
                onClick={() => {
                  haptic.light();
                  onDismiss();
                }}
                className="w-full text-center mt-2 text-xs font-medium"
                style={{ color: colors.textSecondary }}
              >
                {str.dismiss}
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}