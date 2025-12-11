import React from 'react';
import { Card } from '@/components/ui/card';
import { User, HelpCircle, Globe, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AccountPopup({ isOpen, onClose, colors, language = 'en', onLanguageClick }) {
  if (!isOpen) return null;

  const t = {
    en: {
      accountSettings: 'Account & Settings',
      helpFAQ: 'Help & FAQ',
      languageOption: 'Language',
      upgrade: 'Upgrade'
    },
    th: {
      accountSettings: 'บัญชีและการตั้งค่า',
      helpFAQ: 'ช่วยเหลือและคำถาม',
      languageOption: 'ภาษา',
      upgrade: 'อัปเกรด'
    },
    zh: {
      accountSettings: '账户与设置',
      helpFAQ: '帮助与常见问题',
      languageOption: '语言',
      upgrade: '升级'
    },
    ja: {
      accountSettings: 'アカウントと設定',
      helpFAQ: 'ヘルプとFAQ',
      languageOption: '言語',
      upgrade: 'アップグレード'
    },
    ko: {
      accountSettings: '계정 및 설정',
      helpFAQ: '도움말 및 FAQ',
      languageOption: '언어',
      upgrade: '업그레이드'
    },
    ru: {
      accountSettings: 'Аккаунт и настройки',
      helpFAQ: 'Помощь и FAQ',
      languageOption: 'Язык',
      upgrade: 'Обновление'
    }
  };

  const strings = t[language] || t.en;

  const menuItems = [
    {
      icon: User,
      label: strings.accountSettings,
      route: createPageUrl('Account'),
      color: '#0C3B2E'
    },
    {
      icon: HelpCircle,
      label: strings.helpFAQ,
      route: createPageUrl('FAQ'),
      color: '#3B82F6'
    },
    {
      icon: Globe,
      label: strings.languageOption,
      action: 'language',
      color: '#8B5CF6'
    },
    {
      icon: Star,
      label: strings.upgrade,
      route: createPageUrl('Account') + '?showPlans=true',
      color: '#10B981'
    }
  ];

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998
        }}
        onClick={onClose}
      />
      <Card
        style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          width: '280px',
          maxWidth: 'calc(100vw - 40px)',
          backgroundColor: colors.cardBg,
          borderColor: colors.borderColor,
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          zIndex: 9999,
          padding: '12px'
        }}
      >
        <div className="space-y-2">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            
            if (item.action === 'language') {
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onClose();
                    if (onLanguageClick) onLanguageClick();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                    color: colors.textPrimary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.fieldBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-sm">{item.label}</span>
                </button>
              );
            }

            return (
              <Link key={idx} to={item.route}>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                    color: colors.textPrimary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.fieldBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-sm">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </Card>
    </>
  );
}