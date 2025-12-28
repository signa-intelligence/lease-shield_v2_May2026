import React from 'react';
import { X, User, HelpCircle, Globe, Users, TrendingUp, LogOut, ChevronRight, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { haptic } from './HapticFeedback';

export default function MobileMenuDrawer({ isOpen, onClose, colors, language = 'en', user, onLanguageClick }) {
  const t = {
    en: {
      menu: 'Menu',
      accountSettings: 'Account & Settings',
      helpFAQ: 'Help & FAQ',
      languageOption: 'Language',
      referralProgram: 'Referral Program',
      upgradePlan: 'Upgrade Plan',
      insights: 'Insights',
      logout: 'Logout'
    },
    th: {
      menu: 'เมนู',
      accountSettings: 'บัญชีและการตั้งค่า',
      helpFAQ: 'ช่วยเหลือและคำถาม',
      languageOption: 'ภาษา',
      referralProgram: 'โปรแกรมแนะนำเพื่อน',
      upgradePlan: 'อัปเกรดแผน',
      insights: 'ข้อมูลเชิงลึก',
      logout: 'ออกจากระบบ'
    },
    zh: {
      menu: '菜单',
      accountSettings: '账户与设置',
      helpFAQ: '帮助与常见问题',
      languageOption: '语言',
      referralProgram: '推荐计划',
      upgradePlan: '升级计划',
      insights: '洞察',
      logout: '登出'
    },
    ja: {
      menu: 'メニュー',
      accountSettings: 'アカウントと設定',
      helpFAQ: 'ヘルプとFAQ',
      languageOption: '言語',
      referralProgram: '紹介プログラム',
      upgradePlan: 'プランをアップグレード',
      insights: 'インサイト',
      logout: 'ログアウト'
    },
    ko: {
      menu: '메뉴',
      accountSettings: '계정 및 설정',
      helpFAQ: '도움말 및 FAQ',
      languageOption: '언어',
      referralProgram: '추천 프로그램',
      upgradePlan: '플랜 업그레이드',
      insights: '인사이트',
      logout: '로그아웃'
    },
    ru: {
      menu: 'Меню',
      accountSettings: 'Аккаунт и настройки',
      helpFAQ: 'Помощь и FAQ',
      languageOption: 'Язык',
      referralProgram: 'Реферальная программа',
      upgradePlan: 'Повысить план',
      insights: 'Аналитика',
      logout: 'Выйти'
    }
  };

  const strings = t[language] || t.en;

  const handleLogout = async () => {
    haptic.medium();
    onClose();
    await base44.auth.logout();
  };

  // Determine next tier for upgrade
  const getUpgradeRoute = () => {
    const tier = user?.plan_tier || 'free';
    const planMap = {
      'free': 'lite',
      'lite': 'protect',
      'protect': 'secure',
      'secure': null // Already at highest
    };
    
    const nextTier = planMap[tier];
    if (!nextTier) {
      return createPageUrl('Account'); // Manage subscription page
    }
    return createPageUrl('Account') + `?showPlans=true&highlight=${nextTier}`;
  };

  // Check if user is admin/super_admin/va
  const accessLevel = user?.access_level || 'user';
  const userRole = user?.role || 'user';
  const isAdminOrVA = ['admin', 'super_admin', 'va'].includes(accessLevel) || ['admin', 'super_admin', 'va'].includes(userRole);

  const menuItems = [
    {
      icon: User,
      label: strings.accountSettings,
      route: createPageUrl('Account'),
      color: '#063F2C'
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
      icon: Users,
      label: strings.referralProgram,
      route: createPageUrl('Account') + '#refer-friends',
      color: '#10B981'
    },
    ...(isAdminOrVA ? [{
      icon: BarChart3,
      label: strings.insights,
      route: createPageUrl('Analytics'),
      color: '#6B7280'
    }] : []),
    {
      icon: TrendingUp,
      label: strings.upgradePlan,
      route: createPageUrl('Account') + '#plans',
      color: '#CFAF6A'
    },
    {
      icon: LogOut,
      label: strings.logout,
      action: 'logout',
      color: '#EF4444'
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(320px, 85vw)',
          backgroundColor: colors.cardBg,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: `1px solid ${colors.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {strings.menu}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close Menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.fieldBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px'
          }}
        >
          <div className="space-y-2">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isLogout = item.action === 'logout';

              if (item.action === 'language') {
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      haptic.light();
                      onClose();
                      if (onLanguageClick) onLanguageClick();
                    }}
                    style={{
                      width: '100%',
                      padding: '16px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.15s',
                      color: colors.textPrimary
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.fieldBg;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="font-semibold text-sm flex-1 text-left">{item.label}</span>
                    <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  </button>
                );
              }

              if (item.action === 'logout') {
                return (
                  <button
                    key={idx}
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '16px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.15s',
                      color: colors.textPrimary,
                      marginTop: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FEE2E2';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="font-semibold text-sm flex-1 text-left">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link key={idx} to={item.route}>
                  <button
                    onClick={() => {
                      haptic.light();
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      padding: '16px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.15s',
                      color: colors.textPrimary
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.fieldBg;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="font-semibold text-sm flex-1 text-left">{item.label}</span>
                    <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  </button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Signa Intelligence Attribution */}
        <div style={{
          padding: '16px',
          borderTop: `1px solid ${colors.borderColor}`,
          textAlign: 'center',
          flexShrink: 0
        }}>
          <p style={{
            fontSize: '11px',
            color: colors.textSecondary,
            fontWeight: '400'
          }}>
            Developed by{' '}
            <a
              href="https://www.signaintelligence.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: colors.textSecondary,
                textDecoration: 'underline',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.target.style.color = '#0C3B2E'}
              onMouseLeave={(e) => e.target.style.color = colors.textSecondary}
            >
              Signa Intelligence
            </a>
          </p>
        </div>
      </div>
    </>
  );
}