import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  }, [location?.pathname]);

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
    },
    th: {
      appName: "ลีสชีลด์",
      home: "หน้าหลัก",
      scan: "สแกน",
      repairs: "ซ่อมบำรุง",
      deposit: "เงินมัดจำ",
      evidence: "หลักฐาน",
      admin: "แอดมิน",
    }
  };

  const strings = t[language] || t.en;
  
  const navTabs = [
    {
      key: "home",
      label: strings.home,
      route: "/Dashboard",
      icon: Home,
    },
    {
      key: "scan",
      label: strings.scan,
      route: "/UploadScan",
      icon: Upload,
    },
    {
      key: "maintenance",
      label: strings.repairs,
      route: "/MaintenanceTracker",
      icon: Wrench,
    },
    {
      key: "deposit",
      label: strings.deposit,
      route: "/DepositTracker",
      icon: Shield,
    },
    {
      key: "docs",
      label: strings.evidence,
      route: "/DocumentVault",
      icon: FileText,
    },
  ];

  if (isAdmin) {
    navTabs.push({
      key: "admin",
      label: strings.admin,
      route: "/AdminConsole",
      icon: Settings,
    });
  }

  const isActiveTab = (route) => {
    if (!route || !location?.pathname) return false;
    return location.pathname === route;
  };

  const accountRoute = "/Account";
  const isAccountActive = isActiveTab(accountRoute);

  // Theme colors
  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    topBarBg: '#1A1D1F',
    bottomTabBg: '#1A1D1F',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    hoverBg: '#3A3D40'
  } : {
    bg: '#ECEFED',
    topBarBg: '#FFFFFF',
    bottomTabBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#ECEFED',
    hoverBg: '#ECEFED'
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.bg }}>
      <style>{`
        :root {
          --ls-forest: #0C3B2E;
          --ls-gold: #C7A338;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: ${colors.bg};
        }
        
        .bottom-tabs {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        
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

        * {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        *:focus-visible {
          outline: 2px solid var(--ls-gold);
          outline-offset: 2px;
        }
      `}</style>

      {/* Top Bar with Logo */}
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
            <Link to={accountRoute}>
              <button
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isAccountActive ? '#0C3B2E' : (isDarkMode ? '#353A3D' : '#ECEFED'),
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!isAccountActive) {
                    e.currentTarget.style.backgroundColor = '#0C3B2E';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAccountActive) {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#ECEFED';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#0C3B2E';
                  }
                }}
              >
                <User 
                  className="w-5 h-5" 
                  style={{ 
                    color: isAccountActive ? '#FFFFFF' : '#0C3B2E',
                    transition: 'color 0.2s'
                  }}
                />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                <Icon className="w-5 h-5 mb-1" />
                <span style={{ fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}