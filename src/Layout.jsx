
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Upload, Shield, FileText, User, Settings, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import LanguageToggle from "./components/shared/LanguageToggle";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Apply theme to body
  React.useEffect(() => {
    if (user?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.theme]);

  const language = user?.language || 'en';
  const isAdmin = user?.role === 'admin';
  const isDarkMode = user?.theme === 'dark';

  const t = {
    en: {
      appName: "LEASE SHIELD",
      home: "Home",
      scan: "Scan",
      repairs: "Repairs",
      deposit: "Deposit",
      evidence: "Evidence",
      admin: "Admin",
      disclaimer: "We are not a law firm and do not provide legal advice.",
      privacyPolicy: "Privacy Policy"
    },
    th: {
      appName: "ลีสชีลด์",
      home: "หน้าหลัก",
      scan: "สแกน",
      repairs: "ซ่อมบำรุง",
      deposit: "เงินมัดจำ",
      evidence: "หลักฐาน",
      admin: "แอดมิน",
      disclaimer: "เราไม่ใช่สำนักงานกฎหมายและไม่ได้ให้คำแนะนำทางกฎหมาย",
      privacyPolicy: "นโยบายความเป็นส่วนตัว"
    }
  };

  const strings = t[language];
  
  const navTabs = [
    {
      key: "home",
      label: strings.home,
      route: createPageUrl("Dashboard"),
      icon: Home,
    },
    {
      key: "scan",
      label: strings.scan,
      route: createPageUrl("UploadScan"),
      icon: Upload,
    },
    {
      key: "maintenance",
      label: strings.repairs,
      route: createPageUrl("MaintenanceTracker"),
      icon: Wrench,
    },
    {
      key: "deposit",
      label: strings.deposit,
      route: createPageUrl("DepositTracker"),
      icon: Shield,
    },
    {
      key: "docs",
      label: strings.evidence,
      route: createPageUrl("DocumentVault"),
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

  // Theme colors
  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    bgGradientStart: '#0f1214',
    bgGradientEnd: '#1A1D1F',
    cardBg: '#2A2D30',
    borderColor: '#3A3D40',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    topBarBg: '#1A1D1F',
    bottomTabBg: '#1A1D1F',
    hoverBg: '#3A3D40'
  } : {
    bg: '#ECEFED',
    bgGradientStart: '#ECEFED',
    bgGradientEnd: '#ECEFED',
    cardBg: '#FFFFFF',
    borderColor: '#ECEFED',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    topBarBg: '#FFFFFF',
    bottomTabBg: '#FFFFFF',
    hoverBg: '#ECEFED'
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.bg }}>
      {/* PWA Meta Tags */}
      <helmet>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={isDarkMode ? '#1A1D1F' : '#0C3B2E'} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LeaseShield" />
        <link rel="apple-touch-icon" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" />
      </helmet>

      <style>{`
        :root {
          --ls-forest: #0C3B2E;
          --ls-gold: #C7A338;
          --ls-charcoal: #1A1D1F;
          --ls-stone: #ECEFED;
          --ls-white: #FFFFFF;
          
          --primary: 166 60% 15%;
          --primary-foreground: 0 0% 100%;
          --accent: 45 55% 50%;
          --accent-foreground: 0 0% 100%;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: ${colors.bg};
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
        }
        
        /* Bottom tabs styling with safe area support */
        .bottom-tabs {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        
        /* Top bar safe area support for notches */
        .top-bar {
          padding-top: env(safe-area-inset-top, 0px);
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

        /* PWA Install prompt styling */
        @media (display-mode: standalone) {
          body {
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
          }
        }

        /* Pulse animation for Most Popular badge */
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 6px 12px rgba(199, 163, 56, 0.4), 0 0 0 4px rgba(199, 163, 56, 0.1);
          }
          50% {
            box-shadow: 0 6px 12px rgba(199, 163, 56, 0.6), 0 0 0 6px rgba(199, 163, 56, 0.2);
          }
        }

        /* Shake animation for errors */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        /* Smooth transitions for theme switching */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        /* Focus visible for accessibility */
        *:focus-visible {
          outline: 2px solid var(--ls-gold);
          outline-offset: 2px;
        }

        /* Better scrollbar styling */
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
      `}</style>

      {/* Top Bar with Logo - FIXED TO TOP with safe area */}
      <div className="top-bar fixed top-0 left-0 right-0 border-b shadow-sm z-40" style={{
        backgroundColor: colors.topBarBg,
        borderBottomColor: colors.borderColor
      }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
              alt="Lease Shield"
              className="h-8 w-8"
            />
            <span className="font-bold text-ls-forest text-lg" style={{ color: isDarkMode ? colors.textPrimary : '#0C3B2E' }}>
              {strings.appName}
            </span>
            {isAdmin && (
              <span className="ml-2 px-2 py-0.5 bg-ls-gold text-white text-xs font-semibold rounded">
                ADMIN
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link to={createPageUrl("Account")}>
              <button
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: location.pathname === createPageUrl("Account") ? '#0C3B2E' : (isDarkMode ? '#353A3D' : '#ECEFED'),
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== createPageUrl("Account")) {
                    e.currentTarget.style.backgroundColor = '#0C3B2E';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== createPageUrl("Account")) {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#ECEFED';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#0C3B2E';
                  }
                }}
              >
                <User 
                  className="w-5 h-5" 
                  style={{ 
                    color: location.pathname === createPageUrl("Account") ? '#FFFFFF' : '#0C3B2E',
                    transition: 'color 0.2s'
                  }}
                />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Added top padding to account for fixed header + safe area */}
      <main className="flex-1 overflow-auto" style={{
        paddingTop: 'calc(64px + env(safe-area-inset-top, 0px))',
        paddingBottom: `calc(76px + env(safe-area-inset-bottom, 0px))`
      }}>
        {children}
      </main>

      {/* Bottom Navigation Tabs */}
      <nav className="bottom-tabs fixed bottom-0 left-0 right-0 border-t shadow-2xl z-50" style={{
        backgroundColor: colors.bottomTabBg,
        borderTopColor: colors.borderColor
      }}>
        <div className={`flex items-center justify-around px-2 py-2 ${isAdmin ? 'overflow-x-auto' : ''}`}>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = isActiveTab(tab.route);
            
            return (
              <Link
                key={tab.key}
                to={tab.route}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  flex: 1,
                  minWidth: '60px',
                  backgroundColor: isActive ? '#0C3B2E' : 'transparent',
                  color: isActive ? '#FFFFFF' : colors.textPrimary,
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.hoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon className="w-5 h-5 mb-1" style={{ animation: isActive ? 'pulse 2s infinite' : 'none' }} />
                <span style={{ fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
