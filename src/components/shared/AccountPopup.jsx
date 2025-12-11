import React from 'react';
import { Card } from '@/components/ui/card';
import { User, HelpCircle, Globe, Star, ChevronRight } from 'lucide-react';
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
          backgroundColor: 'rgba(0,0,0,0.1)',
          zIndex: 9998,
          animation: 'fadeIn 0.15s ease-out'
        }}
        onClick={onClose}
      />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Card
        style={{
          position: 'fixed',
          top: '75px',
          right: '20px',
          width: '300px',
          maxWidth: 'calc(100vw - 40px)',
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.borderColor}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          zIndex: 9999,
          padding: '8px',
          borderRadius: '16px',
          animation: 'slideDown 0.2s ease-out'
        }}
      >
        <div className="space-y-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isUpgrade = item.label.toLowerCase().includes('upgrade') || item.label.toLowerCase().includes('อัปเกรด');
            
            if (item.action === 'language') {
              return (
                <React.Fragment key={idx}>
                  <button
                    onClick={() => {
                      onClose();
                      if (onLanguageClick) onLanguageClick();
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s',
                      color: colors.textPrimary
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.fieldBg;
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="font-semibold text-sm flex-1">{item.label}</span>
                    <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  </button>
                  {idx < menuItems.length - 1 && (
                    <div style={{
                      height: '1px',
                      backgroundColor: colors.borderColor,
                      margin: '4px 12px'
                    }} />
                  )}
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={idx}>
                <Link to={item.route}>
                  <button
                    onClick={onClose}
                    style={{
                      width: '100%',
                      padding: '14px 12px',
                      borderRadius: '12px',
                      backgroundColor: isUpgrade ? `${item.color}10` : 'transparent',
                      border: isUpgrade ? `2px solid ${item.color}30` : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s',
                      color: colors.textPrimary
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isUpgrade ? `${item.color}20` : colors.fieldBg;
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isUpgrade ? `${item.color}10` : 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: isUpgrade ? item.color : `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon className="w-5 h-5" style={{ color: isUpgrade ? 'white' : item.color }} />
                    </div>
                    <span className={`text-sm flex-1 ${isUpgrade ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                    <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  </button>
                </Link>
                {idx < menuItems.length - 1 && (
                  <div style={{
                    height: '1px',
                    backgroundColor: colors.borderColor,
                    margin: '4px 12px'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>
    </>
  );
}