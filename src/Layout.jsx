import React, { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Upload, Shield, FileText, User, Settings, Wrench, Scale, Search, Calendar, Menu } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { haptic } from "./components/shared/HapticFeedback";
import LisaEnhanced from "./components/shared/LisaEnhanced";
import LisaFAB from "./components/shared/LisaFAB";
import MobileMenuDrawer from "./components/shared/MobileMenuDrawer";
import LanguageSelector from "./components/shared/LanguageSelector";
import QuickGuide from "./components/shared/QuickGuide";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import GlobalErrorBoundary from "./components/shared/GlobalErrorBoundary";


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

// Enhanced global error handlers with more detail
if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[GLOBAL ERROR]', {
      message,
      source,
      lineno,
      colno,
      error,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });
    return false;
  };

  window.onunhandledrejection = (event) => {
    console.error('[UNHANDLED PROMISE REJECTION]', {
      reason: event.reason,
      promise: event.promise,
      stack: event.reason?.stack,
      timestamp: new Date().toISOString()
    });
  };
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const mainContentRef = useRef(null);
  const queryClient = useQueryClient();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = React.useState(false);
  const [showLisa, setShowLisa] = React.useState(false);
  const [showQuickGuide, setShowQuickGuide] = React.useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  // Handle language from URL parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam && user) {
      const supportedLanguages = ['en', 'th', 'zh', 'ja', 'ko', 'ru'];
      
      if (supportedLanguages.includes(langParam) && user.language !== langParam) {
        base44.auth.updateMe({ language: langParam })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          })
          .catch(err => console.error('Failed to update language:', err));
      }
    }
  }, [user]);

  React.useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Listen for Quick Guide open event
  React.useEffect(() => {
    const handleOpenQuickGuide = () => {
      setShowQuickGuide(true);
    };
    window.addEventListener('openQuickGuide', handleOpenQuickGuide);
    return () => window.removeEventListener('openQuickGuide', handleOpenQuickGuide);
  }, []);

  // Auto-show Quick Guide if not dismissed
  React.useEffect(() => {
    if (user && !user.quick_guide_dismissed) {
      setShowQuickGuide(true);
    }
  }, [user]);

  React.useEffect(() => {
    if (user?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.theme]);

  // Block all PWA install prompts
  React.useEffect(() => {
    const blockInstallPrompt = (e) => {
      e.preventDefault();
      window.__ls_blocked_pwa = true;
    };
    window.addEventListener('beforeinstallprompt', blockInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', blockInstallPrompt);
  }, []);

  React.useEffect(() => {
    // SERVICE WORKER DISABLED: Platform cannot serve /service-worker.js with correct MIME type
    // This prevents the "unsupported MIME type text/html" console error
    // To re-enable, the platform must serve /service-worker.js as application/javascript
    console.log('[Layout] Service Worker registration disabled (platform limitation)');

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
      { name: 'apple-mobile-web-app-title', content: 'Lease Shield' },
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

    // Favicon setup with cache busting
    const faviconUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png';
    const cacheBust = `?v=${Date.now()}`;

    // Remove any existing favicons first to avoid conflicts
    document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove());

    // Standard favicon (most widely supported)
    const faviconStandard = document.createElement('link');
    faviconStandard.rel = 'icon';
    faviconStandard.type = 'image/png';
    faviconStandard.href = faviconUrl + cacheBust;
    document.head.appendChild(faviconStandard);

    // 32x32 favicon
    const favicon32 = document.createElement('link');
    favicon32.rel = 'icon';
    favicon32.type = 'image/png';
    favicon32.sizes = '32x32';
    favicon32.href = faviconUrl + cacheBust;
    document.head.appendChild(favicon32);

    // 16x16 favicon
    const favicon16 = document.createElement('link');
    favicon16.rel = 'icon';
    favicon16.type = 'image/png';
    favicon16.sizes = '16x16';
    favicon16.href = faviconUrl + cacheBust;
    document.head.appendChild(favicon16);

    // Shortcut icon (legacy support)
    const faviconShortcut = document.createElement('link');
    faviconShortcut.rel = 'shortcut icon';
    faviconShortcut.href = faviconUrl + cacheBust;
    document.head.appendChild(faviconShortcut);

    // Apple touch icon
    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = faviconUrl + cacheBust;
    document.head.appendChild(appleIcon);
  }, []);

  const language = user?.language || 'en';

  // Admin access: only admin, va, or super_admin roles
  const userRole = user?.role?.toLowerCase();
  const accessLevel = user?.access_level?.toLowerCase();

  const isAdmin = 
    userRole === 'admin' || 
    userRole === 'super_admin' || 
    userRole === 'va' ||
    accessLevel === 'admin' || 
    accessLevel === 'super_admin' || 
    accessLevel === 'va';

  const isDarkMode = user?.theme === 'dark';

  const t = {
    en: {
      appName: "LEASE SHIELD",
      home: "Home",
      scan: "Scan",
      property: "Property",
      cases: "Cases",
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
      cases: "คดี",
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
      cases: "案件",
      evidence: "证据",
      admin: "管理",
      search: "搜索",
      timeline: "时间线",
      upgrade: "升级",
      tagline: "公平 • 透明 • 保护"
    },
    ru: {
      appName: "ЛИС ЩИТ",
      home: "Главная",
      scan: "Сканировать",
      property: "Недвижимость",
      cases: "Дела",
      evidence: "Доказательства",
      admin: "Админ",
      search: "Поиск",
      timeline: "Хронология",
      upgrade: "Обновить",
      tagline: "Справедливо • Прозрачно • Защищено"
    },
    ja: {
      appName: "リースシールド",
      home: "ホーム",
      scan: "スキャン",
      property: "物件",
      cases: "ケース",
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
      cases: "사례",
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
      key: "cases",
      label: strings.cases,
      route: createPageUrl("Cases"),
      icon: Scale,
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
    hoverBg: '#3A3D40',
    fieldBg: '#374151'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    borderColor: 'rgba(12,59,46,0.08)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    topBarBg: '#FFFFFF',
    bottomTabBg: '#FFFFFF',
    hoverBg: '#F1F5F9',
    fieldBg: '#F8FAFC'
  };

  return (
    <GlobalErrorBoundary>
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: colors.bg,
      position: 'relative',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* SECURITY FIX: Add Content Security Policy */}
      <meta 
        httpEquiv="Content-Security-Policy" 
        content="default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://qtrypzzcjebvfcihiynt.supabase.co https://api.stripe.com https://api.resend.com; frame-src https://checkout.stripe.com;" 
      />
      
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
          box-shadow: ${isDarkMode ? '0 -4px 24px rgba(0,0,0,0.5)' : '0 -4px 16px rgba(0,0,0,0.08)'};
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
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
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
                {userRole === 'super_admin' || accessLevel === 'super_admin' ? 'SUPER ADMIN' : userRole === 'admin' || accessLevel === 'admin' ? 'ADMIN' : 'VA'}
              </span>
            )}
          </div>
          {/* Mobile: Search + Quick Guide + Menu */}
          <div className="flex items-center gap-2 flex-shrink-0 md:hidden">
            <Link to={createPageUrl("Search")}>
              <button
                aria-label={strings.search || "Search"}
                onClick={() => haptic.light()}
                className="btn-interaction"
                style={{
                  minWidth: '48px',
                  minHeight: '48px',
                  padding: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isActiveTab(createPageUrl("Search")) ? '#0C3B2E' : (isDarkMode ? '#374151' : '#F3F4F6'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s'
                }}>
                  <Search 
                    className="w-5 h-5" 
                    style={{ 
                      color: isActiveTab(createPageUrl("Search")) ? '#FFFFFF' : (isDarkMode ? '#F9FAFB' : '#0C3B2E'),
                      transition: 'color 0.2s'
                    }}
                  />
                </div>
              </button>
            </Link>
            <button
              aria-label="Quick Guide"
              onClick={() => {
                haptic.light();
                const quickGuideEvent = new CustomEvent('openQuickGuide');
                window.dispatchEvent(quickGuideEvent);
              }}
              className="btn-interaction"
              style={{
                minWidth: '48px',
                minHeight: '48px',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.2s'
              }}>
                <svg 
                  className="w-5 h-5" 
                  style={{ 
                    color: isDarkMode ? '#F9FAFB' : '#0C3B2E',
                    transition: 'color 0.2s'
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="8" r="0.5" fill="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            </button>
            <button
              aria-label="Menu"
              onClick={() => {
                haptic.light();
                setShowMobileMenu(true);
              }}
              className="btn-interaction"
              style={{
                minWidth: '48px',
                minHeight: '48px',
                padding: '8px',
                marginRight: '4px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: showMobileMenu ? '#0C3B2E' : (isDarkMode ? '#374151' : '#F3F4F6'),
                border: showMobileMenu ? '2px solid #CFAF6A' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: showMobileMenu ? '0 0 0 4px rgba(207,175,106,0.15)' : (isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)'),
                transition: 'all 0.2s'
              }}>
                <Menu 
                  className="w-5 h-5" 
                  style={{ 
                    color: showMobileMenu ? '#FFFFFF' : (isDarkMode ? '#F9FAFB' : '#0C3B2E'),
                    transition: 'color 0.2s'
                  }}
                />
              </div>
            </button>
          </div>

          {/* Desktop/Tablet: Keep all icons */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0" style={{ marginRight: '4px' }}>
            <div style={{
              width: '1px',
              height: '24px',
              backgroundColor: colors.borderColor,
              opacity: 0.5
            }} />
            <Link to={createPageUrl("Search")}>
              <button
                aria-label={strings.search || "Search"}
                onClick={() => haptic.light()}
                className="btn-interaction"
                style={{
                  minWidth: '48px',
                  minHeight: '48px',
                  padding: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isActiveTab(createPageUrl("Search")) ? '#0C3B2E' : (isDarkMode ? '#374151' : '#F3F4F6'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s'
                }}>
                  <Search 
                    className="w-5 h-5" 
                    style={{ 
                      color: isActiveTab(createPageUrl("Search")) ? '#FFFFFF' : (isDarkMode ? '#F9FAFB' : '#0C3B2E'),
                      transition: 'color 0.2s'
                    }}
                  />
                </div>
              </button>
            </Link>
            <button
              aria-label="Quick Guide"
              onClick={() => {
                haptic.light();
                const quickGuideEvent = new CustomEvent('openQuickGuide');
                window.dispatchEvent(quickGuideEvent);
              }}
              className="btn-interaction"
              style={{
                minWidth: '48px',
                minHeight: '48px',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.2s'
              }}>
                <svg 
                  className="w-5 h-5" 
                  style={{ 
                    color: isDarkMode ? '#F9FAFB' : '#0C3B2E',
                    transition: 'color 0.2s'
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="8" r="0.5" fill="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            </button>
            <button
              aria-label="Menu"
              onClick={() => {
                haptic.light();
                setShowMobileMenu(true);
              }}
              className="btn-interaction"
              style={{
                minWidth: '48px',
                minHeight: '48px',
                padding: '8px',
                marginRight: '4px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: showMobileMenu ? '#0C3B2E' : (isDarkMode ? '#374151' : '#F3F4F6'),
                border: showMobileMenu ? '2px solid #CFAF6A' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: showMobileMenu ? '0 0 0 4px rgba(207,175,106,0.15)' : (isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)'),
                transition: 'all 0.2s'
              }}>
                <Menu 
                  className="w-5 h-5" 
                  style={{ 
                    color: showMobileMenu ? '#FFFFFF' : (isDarkMode ? '#F9FAFB' : '#0C3B2E'),
                    transition: 'color 0.2s'
                  }}
                />
              </div>
            </button>
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
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="bottom-tabs fixed bottom-0 left-0 right-0 border-t" 
        style={{
          backgroundColor: colors.bottomTabBg,
          borderTopColor: colors.borderColor,
          zIndex: 50
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
                className="ripple-container"
                onClick={(e) => {
                  haptic.light();
                  createRipple(e, e.currentTarget);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: language === 'ru' ? '6px 4px 8px 4px' : '8px 10px',
                  borderRadius: '12px',
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                  flex: 1,
                  minWidth: language === 'ru' ? '56px' : '60px',
                  maxWidth: language === 'ru' ? '85px' : '90px',
                  backgroundColor: isActive ? '#0C3B2E' : 'transparent',
                  textDecoration: 'none',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <Icon 
                  className={`w-5 h-5 mb-1 ${isActive ? 'tab-select' : ''}`} 
                  style={{ 
                    color: isActive ? '#FFFFFF' : colors.textPrimary,
                    transition: 'all 0.2s ease'
                  }} 
                />
                <span style={{ 
                  fontSize: language === 'ru' ? '10px' : '11px', 
                  fontWeight: '600', 
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  color: isActive ? '#FFFFFF' : colors.textPrimary,
                  transition: 'all 0.2s ease',
                  opacity: isActive ? 1 : 0.9,
                  wordBreak: 'break-word'
                }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
        </nav>

        <LisaEnhanced 
          language={language} 
          isDarkMode={isDarkMode}
          isOpen={showLisa}
          onClose={() => setShowLisa(false)}
        />

        <LisaFAB 
          onClick={() => setShowLisa(true)}
          isDarkMode={isDarkMode}
        />

        <MobileMenuDrawer
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          colors={colors}
          language={language}
          user={user}
          onLanguageClick={() => {
            setShowMobileMenu(false);
            setShowLanguageSelector(true);
          }}
        />

        <LanguageSelector
          isOpen={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
          colors={colors}
          currentLanguage={language}
        />

        <QuickGuide
          user={user}
          colors={colors}
          language={language}
          isOpen={showQuickGuide}
          onClose={() => setShowQuickGuide(false)}
          onDismiss={() => setShowQuickGuide(false)}
        />
        </div>
        </GlobalErrorBoundary>
        );
        }