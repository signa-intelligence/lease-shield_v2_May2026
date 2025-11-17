
import React, { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Upload, Shield, FileText, User, Settings, Wrench, Scale, Search, Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import LanguageToggle from "./components/shared/LanguageToggle";
import { haptic } from "./components/shared/HapticFeedback";

// Animation utilities inlined
const animationKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes ripple {
    to { transform: scale(4); opacity: 0; }
  }
  .btn-press-feedback:active {
    transform: scale(0.97);
    transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .card-hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .card-hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.12);
  }
  .ripple-container {
    position: relative;
    overflow: hidden;
  }
  .ripple {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.6);
    width: 20px;
    height: 20px;
    margin-top: -10px;
    margin-left: -10px;
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  }
`;

const createRipple = (event, element) => {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  element.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const mainContentRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  React.useEffect(() => {
    if (user?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.theme]);

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    const link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
    }

    const metaTags = [
      { name: 'theme-color', content: '#0C3B2E' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'LeaseShield' },
    ];

    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png';
      document.head.appendChild(appleIcon);
    }
  }, []);

  const language = user?.language || 'en';
  const accessLevel = user?.access_level || 'user';
  const role = user?.role || '';
  
  const isAdmin = 
    ['admin', 'super_admin', 'va'].includes(role) || 
    ['admin', 'super_admin', 'va'].includes(accessLevel);

  const isDarkMode = user?.theme === 'dark';

  const t = {
    en: {
      appName: "LEASE SHIELD",
      home: "Home",
      scan: "Scan",
      property: "Property",
      evidence: "Evidence",
      admin: "Admin",
      search: "Search",
      timeline: "Timeline",
      upgrade: "Upgrade",
      tagline: "Fair. Transparent. Protected."
    },
    th: {
      appName: "ลีสชีลด์",
      home: "หน้าหลัก",
      scan: "สแกน",
      property: "ทรัพย์สิน",
      evidence: "หลักฐาน",
      admin: "แอดมิน",
      search: "ค้นหา",
      timeline: "ไทม์ไลน์",
      upgrade: "อัปเกรด",
      tagline: "ยุติธรรม • โปร่งใส • ปลอดภัย"
    },
    zh: {
      appName: "租约盾",
      home: "主页",
      scan: "扫描",
      property: "房产",
      evidence: "证据",
      admin: "管理",
      search: "搜索",
      timeline: "时间线",
      upgrade: "升级",
      tagline: "公平 • 透明 • 保护"
    },
    ja: {
      appName: "リースシールド",
      home: "ホーム",
      scan: "スキャン",
      property: "物件",
      evidence: "証拠",
      admin: "管理",
      search: "検索",
      timeline: "タイムライン",
      upgrade: "アップグレード",
      tagline: "公正 • 透明 • 保護"
    },
    ko: {
      appName: "리스실드",
      home: "홈",
      scan: "스캔",
      property: "부동산",
      evidence: "증거",
      admin: "관리",
      search: "검색",
      timeline: "타임라인",
      upgrade: "업그레이드",
      tagline: "공정 • 투명 • 보호"
    }
  };

  const strings = t[language] || t.en;
  
  const navTabs = [
    {
      key: "home",
      label: strings.home,
      route: createPageUrl("Dashboard"),
      icon: Home,
    },
    {
      key: "timeline",
      label: strings.timeline,
      route: createPageUrl("Timeline"),
      icon: Calendar,
    },
    {
      key: "property",
      label: strings.property,
      route: createPageUrl("PropertyTracker"),
      icon: Shield,
    },
    {
      key: "docs",
      label: strings.evidence,
      route: createPageUrl("EvidenceVault"),
      icon: FileText,
    },
  ];

  if (isAdmin) {
    navTabs.push({
      key: "admin",
      label: strings.admin,
      route: createPageUrl("AdminConsole"),
      icon: Settings,
    });
  }

  if (user && (!user.plan_tier || user.plan_tier === 'free')) {
    navTabs.push({
      key: 'upgrade',
      label: strings.upgrade,
      route: createPageUrl('Account') + '?highlight=plans',
      icon: Star,
    });
  }

  const isActiveTab = (route) => {
    return location.pathname === route;
  };

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    borderColor: 'rgba(255,255,255,0.1)',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    topBarBg: '#1F2937',
    bottomTabBg: '#1F2937',
    hoverBg: '#3A3D40'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    borderColor: 'rgba(12,59,46,0.08)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    topBarBg: '#FFFFFF',
    bottomTabBg: '#FFFFFF',
    hoverBg: '#F1F5F9'
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: colors.bg,
      position: 'relative',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <style>{`
        :root {
          --ls-forest: #0C3B2E;
          --ls-gold: #C7A338;
          --ls-charcoal: #1A1D1F;
          --ls-stone: #F3F6F5;
          --ls-white: #FFFFFF;
          
          --primary: 166 60% 15%;
          --primary-foreground: 0 0% 100%;
          --accent: 45 55% 50%;
          --accent-foreground: 0 0% 100%;
        }
        
        * {
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: ${colors.bg};
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
        }
        
        .bottom-tabs {
          padding-bottom: max(env(safe-area-inset-bottom, 0px), 12px);
        }
        
        .top-bar {
          padding-top: env(safe-area-inset-top, 0px);
          height: auto;
          min-height: 64px;
          box-shadow: ${isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.04)'};
        }
        
        .main-content {
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          width: 100%;
        }

        @media (min-width: 768px) {
          .bottom-tabs {
            max-width: 600px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 24px;
            margin-bottom: 16px;
            padding-bottom: 0;
            box-shadow: ${isDarkMode ? '0 -4px 24px rgba(0,0,0,0.5)' : '0 -4px 16px rgba(0,0,0,0.08)'};
          }
        }

        @media (display-mode: standalone) {
          body {
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 6px 12px rgba(199, 163, 56, 0.4), 0 0 0 4px rgba(199, 163, 56, 0.1);
          }
          50% {
            box-shadow: 0 6px 12px rgba(199, 163, 56, 0.6), 0 0 0 6px rgba(199, 163, 56, 0.2);
          }
        }
        
        *:focus-visible {
          outline: 2px solid var(--ls-gold);
          outline-offset: 2px;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#2A2D30' : '#F3F4F6'};
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#4B5563' : '#D1D5DB'};
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#6B7280' : '#9CA3AF'};
        }

        /* Animation utilities */
        ${animationKeyframes}

        /* New styles for btn-interaction */
        .btn-interaction {
          transition: background-color 0.2s, color 0.2s, transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
        }
        /* Specific hover state for buttons that are not currently active */
        .btn-interaction:not(.is-active):hover {
            background-color: var(--ls-forest) !important;
        }
        .btn-interaction:not(.is-active):hover svg {
            color: #FFFFFF !important;
        }
        .btn-interaction:active {
            transform: scale(0.97);
        }

        /* New styles for page-transition */
        .page-transition {
          animation: fadeIn 0.4s ease-out;
        }

        /* New styles for bottom tab interaction */
        .ripple-container {
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ripple-container:not(.is-active):hover {
            background-color: ${colors.hoverBg};
        }
        .ripple-container:active {
            transform: scale(0.97); /* Replicate btn-press-feedback effect */
        }
      `}</style>

      {/* Top Bar */}
      <div className="top-bar fixed top-0 left-0 right-0 border-b z-50" style={{
        backgroundColor: colors.topBarBg,
        borderBottomColor: colors.borderColor
      }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {isDarkMode ? (
              <div className="h-10 px-3 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center md:hidden">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/8a29b56f1_LeaseShieldmainlogowobkg.png"
                  alt="Lease Shield"
                  className="h-8 w-auto flex-shrink-0"
                />
              </div>
            ) : (
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/8a29b56f1_LeaseShieldmainlogowobkg.png"
                alt="Lease Shield"
                className="h-10 w-auto md:hidden flex-shrink-0"
              />
            )}
            {isDarkMode ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
                  alt="Lease Shield"
                  className="h-9 w-9 flex-shrink-0"
                />
                <span className="font-bold text-base truncate" style={{ color: '#F9FAFB' }}>
                  {strings.appName || "LEASE SHIELD"}
                </span>
              </div>
            ) : (
              <>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
                  alt="Lease Shield"
                  className="hidden md:block h-12 w-12 flex-shrink-0"
                />
                <span className="font-bold text-base sm:text-lg truncate hidden md:block" style={{ color: '#0C3B2E' }}>
                  {strings.appName || "LEASE SHIELD"}
                </span>
              </>
            )}
            {isAdmin && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-ls-gold text-white text-xs font-semibold rounded flex-shrink-0">
                {accessLevel === 'super_admin' ? 'SUPER ADMIN' : accessLevel === 'admin' ? 'ADMIN' : role === 'admin' ? 'ADMIN' : 'VA'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link to={createPageUrl("Search")}>
              <button
                aria-label={strings.search || "Search"}
                onClick={() => haptic.light()}
                className={`btn-interaction ${isActiveTab(createPageUrl("Search")) ? 'is-active' : ''}`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isActiveTab(createPageUrl("Search")) ? '#0C3B2E' : (isDarkMode ? '#374151' : '#F3F4F6'),
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)'
                }}
              >
                <Search 
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  style={{ 
                    color: isActiveTab(createPageUrl("Search")) ? '#FFFFFF' : (isDarkMode ? '#F9FAFB' : '#0C3B2E'),
                    transition: 'color 0.2s'
                  }}
                />
              </button>
            </Link>
            <LanguageToggle />
            {user && (!user.plan_tier || user.plan_tier === 'free') && (
              <Link to={createPageUrl("Account") + '?highlight=plans'}>
                <button
                  aria-label="Upgrade"
                  onClick={() => haptic.light()}
                  className="btn-interaction"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 9999,
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    border: '2px solid #C7A338',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(12,59,46,0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {strings.upgrade}
                </button>
              </Link>
            )}
            <Link to={createPageUrl("Account")}>
              <button
                aria-label="Account Settings"
                onClick={() => haptic.light()}
                className={`btn-interaction ${isActiveTab(createPageUrl("Account")) ? 'is-active' : ''}`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isActiveTab(createPageUrl("Account")) ? '#0C3B2E' : (isDarkMode ? '#374151' : '#F3F4F6'),
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)'
                }}
              >
                <User 
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  style={{ 
                    color: isActiveTab(createPageUrl("Account")) ? '#FFFFFF' : (isDarkMode ? '#F9FAFB' : '#0C3B2E'),
                    transition: 'color 0.2s'
                  }}
                />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main 
        ref={mainContentRef} 
        className="main-content flex-1 page-transition" 
        style={{
          marginTop: '64px',
          paddingBottom: '80px',
          width: '100%',
          maxWidth: '100vw'
        }}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="bottom-tabs fixed bottom-0 left-0 right-0 border-t" 
        style={{
          backgroundColor: colors.bottomTabBg,
          borderTopColor: colors.borderColor,
          zIndex: 50,
          boxShadow: isDarkMode ? '0 -4px 24px rgba(0,0,0,0.5)' : '0 -4px 16px rgba(0,0,0,0.08)'
        }}
      >
        <div className="flex items-center justify-around px-2 py-2" style={{
          minHeight: '68px'
        }}>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.key === 'upgrade' 
              ? location.pathname + location.search === tab.route 
              : location.pathname === tab.route;
            
            return (
              <Link
                key={tab.key}
                to={tab.route}
                className={`ripple-container ${isActive ? 'is-active' : ''}`}
                onClick={(e) => {
                  haptic.light();
                  createRipple(e, e.currentTarget);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 10px',
                  borderRadius: '12px',
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                  flex: 1,
                  minWidth: '60px',
                  maxWidth: '90px',
                  backgroundColor: isActive ? '#0C3B2E' : 'transparent',
                  textDecoration: 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Icon 
                  className={`w-5 h-5 mb-1 ${isActive ? 'tab-select' : ''}`} 
                  style={{ 
                    animation: isActive ? 'pulse 2s infinite' : 'none',
                    color: isActive ? '#FFFFFF' : colors.textPrimary,
                    transition: 'all 0.2s ease'
                  }} 
                />
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: '600', 
                  whiteSpace: 'nowrap',
                  color: isActive ? '#FFFFFF' : colors.textPrimary,
                  transition: 'all 0.2s ease',
                  opacity: isActive ? 1 : 0.9
                }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
