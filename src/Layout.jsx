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

  // Register Service Worker
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.log('SW registration failed:', err));
    }
  }, []);

  const language = user?.language || 'en';
  const isAdmin = user?.role === 'admin';
  
  const navTabs = [
    {
      key: "home",
      label: language === 'th' ? "หน้าหลัก" : "Home",
      route: createPageUrl("Dashboard"),
      icon: Home,
    },
    {
      key: "scan",
      label: language === 'th' ? "สแกน" : "Scan",
      route: createPageUrl("UploadScan"),
      icon: Upload,
    },
    {
      key: "maintenance",
      label: language === 'th' ? "ซ่อมบำรุง" : "Repairs",
      route: createPageUrl("MaintenanceTracker"),
      icon: Wrench,
    },
    {
      key: "deposit",
      label: language === 'th' ? "เงินมัดจำ" : "Deposit",
      route: createPageUrl("DepositTracker"),
      icon: Shield,
    },
    {
      key: "docs",
      label: language === 'th' ? "หลักฐาน" : "Evidence",
      route: createPageUrl("DocumentVault"),
      icon: FileText,
    },
  ];

  if (isAdmin) {
    navTabs.push({
      key: "admin",
      label: "Admin",
      route: createPageUrl("AdminConsole"),
      icon: Settings,
    });
  }

  const isActiveTab = (route) => {
    return location.pathname === route;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #0C3B2E 0%, #065f46 50%, #047857 100%)'
    }}>
      {/* PWA Meta Tags */}
      <helmet>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0C3B2E" />
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
          --ls-cream: #F5F1E8;
          
          --primary: 166 60% 15%;
          --primary-foreground: 0 0% 100%;
          --accent: 45 55% 50%;
          --accent-foreground: 0 0% 100%;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
        }
        
        /* Bottom tabs styling with safe area support */
        .bottom-tabs {
          padding-bottom: env(safe-area-inset-bottom, 0px);
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
      `}</style>

      {/* Top Bar - Premium Gold Header */}
      <div className="fixed top-0 left-0 right-0 z-40" style={{
        background: 'linear-gradient(to right, #C7A338, #d4af37)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
              alt="Lease Shield"
              className="h-8 w-8"
            />
            <span style={{
              fontWeight: 'bold',
              color: '#0C3B2E',
              fontSize: '18px',
              letterSpacing: '0.5px'
            }}>
              {language === 'th' ? 'ลีสชีลด์' : 'LEASE SHIELD'}
            </span>
            {isAdmin && (
              <span className="ml-2 px-2 py-0.5 bg-ls-forest text-white text-xs font-semibold rounded">
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
                  backgroundColor: location.pathname === createPageUrl("Account") ? '#0C3B2E' : 'rgba(12, 59, 46, 0.2)',
                  border: '2px solid rgba(12, 59, 46, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== createPageUrl("Account")) {
                    e.target.style.backgroundColor = 'rgba(12, 59, 46, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== createPageUrl("Account")) {
                    e.target.style.backgroundColor = 'rgba(12, 59, 46, 0.2)';
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

      {/* Main Content - Less padding, more content area */}
      <main className="flex-1 overflow-auto" style={{
        paddingTop: '64px',
        paddingBottom: `calc(${isAdmin ? '130px' : '126px'} + env(safe-area-inset-bottom, 0px))`
      }}>
        {children}
      </main>

      {/* Bottom Navigation - Dark Forest Green with Gold Accents */}
      <nav className="bottom-tabs fixed bottom-0 left-0 right-0 z-50" style={{
        background: 'linear-gradient(to top, #0C3B2E 0%, #0a2f25 100%)',
        borderTop: '2px solid rgba(199, 163, 56, 0.3)',
        boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
        paddingBottom: `calc(46px + env(safe-area-inset-bottom, 0px))`
      }}>
        <div className={`flex items-center justify-around px-2 pt-2 ${isAdmin ? 'overflow-x-auto' : ''}`} style={{
          paddingBottom: '8px'
        }}>
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
                  backgroundColor: isActive ? 'rgba(199, 163, 56, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(199, 163, 56, 0.4)' : '1px solid transparent',
                  color: isActive ? '#C7A338' : '#ECEFED',
                  textDecoration: 'none',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(199, 163, 56, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '30px',
                    height: '3px',
                    backgroundColor: '#C7A338',
                    borderRadius: '0 0 3px 3px'
                  }}/>
                )}
                <Icon className="w-5 h-5 mb-1" />
                <span style={{ fontSize: '12px', fontWeight: isActive ? '600' : '500', whiteSpace: 'nowrap' }}>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Disclaimer - Premium Dark Style */}
        <div style={{
          position: 'absolute',
          bottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
          left: '8px',
          right: '8px',
          padding: '8px 16px',
          textAlign: 'center',
          background: 'linear-gradient(to right, rgba(12, 59, 46, 0.8), rgba(6, 95, 70, 0.8))',
          border: '1px solid rgba(199, 163, 56, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: '500',
            margin: 0,
            color: '#ECEFED',
            opacity: 0.9
          }}>
            {language === 'th' 
              ? "เราไม่ใช่สำนักงานกฎหมายและไม่ได้ให้คำแนะนำทางกฎหมาย" 
              : "We are not a law firm and do not provide legal advice."}
            {" • "}
            <Link 
              to={createPageUrl("PrivacyPolicy")}
              style={{
                color: '#C7A338',
                textDecoration: 'underline',
                fontWeight: '600'
              }}
            >
              {language === 'th' ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}
            </Link>
          </p>
        </div>
      </nav>
    </div>
  );
}