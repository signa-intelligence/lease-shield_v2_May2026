import React, { useState } from 'react';
import { Crown, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { haptic } from './HapticFeedback';

/**
 * Bottom banner for free and lite users
 * Shows subtle upgrade prompt
 */
export default function UpgradeBanner({ user, language = 'en', isDarkMode = false }) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  // Only show for free and lite users
  const userTier = user?.plan_tier?.toLowerCase() || 'free';
  if (userTier !== 'free' && userTier !== 'lite') return null;
  if (dismissed) return null;

  const strings = {
    en: {
      message: 'Unlock full LeaseShield protection',
      cta: 'Upgrade'
    },
    th: {
      message: 'ปลดล็อกการปกป้องแบบเต็มรูปแบบ',
      cta: 'อัปเกรด'
    },
    zh: {
      message: '解锁完整的LeaseShield保护',
      cta: '升级'
    },
    ja: {
      message: '完全なLeaseShield保護をロック解除',
      cta: 'アップグレード'
    },
    ko: {
      message: '전체 LeaseShield 보호 잠금 해제',
      cta: '업그레이드'
    },
    ru: {
      message: 'Разблокируйте полную защиту LeaseShield',
      cta: 'Обновить'
    }
  };

  const str = strings[language] || strings.en;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: 0,
        right: 0,
        zIndex: 40,
        padding: '0 16px',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          borderRadius: '12px',
          border: `2px solid #CFAF6A`,
          boxShadow: isDarkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.12)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'auto'
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #CFAF6A 0%, #D9BC7E 100%)',
            boxShadow: '0 2px 8px rgba(207,175,106,0.3)'
          }}
        >
          <Crown className="w-5 h-5 text-white" />
        </div>

        <p className="flex-1 text-sm font-semibold" style={{ color: isDarkMode ? '#F9FAFB' : '#0F172A' }}>
          {str.message}
        </p>

        <button
          onClick={() => {
            haptic.medium();
            navigate(createPageUrl("Account") + '?showPlans=true');
          }}
          className="btn-interaction"
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: '#063F2C',
            color: '#FFFFFF',
            border: '2px solid #CFAF6A',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          {str.cta}
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            haptic.light();
            setDismissed(true);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: isDarkMode ? '#9CA3AF' : '#6B7280',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}