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
      background: 'linear-gradient(135deg, #0C3B2E 0%, #1a5241 50%, #C7A338 100%)',
      backgroundAttachment: 'fixed'
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
            border-radius: 24px 24px 0 0;
            margin-bottom: 0;
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

        /* Glassmorphism effect */
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        /* Shine animation for gold accents */
        @keyframes shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .gold-shine {
          background: linear-gradient(
            90deg,
            #C7A338 0%,
            #FFD700 50%,
            #C7A338 100%
          );
          background-size: 200% auto;
          animation: shine 3s linear infinite;
        }
      `}</style>

      {/* Top Bar - REDESIGNED with glass effect */}
      <div className="fixed top-0 left-0 right-0 z-40 glass-card" style={{
        borderBottom: '2px solid rgba(199, 163, 56, 0.2)',
        boxShadow: '0 4px 16px rgba(12, 59, 46, 0.15)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: '44px',
              height: '44px',
              background: 'linear-gradient(135deg, #0C3B2E, #1a5241)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(12, 59, 46, 0.4), inset 0 2px 4px rgba(255,255,255,0.1)',
              border: '2px solid rgba(199, 163, 56, 0.3)'
            }}>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
                alt="Lease Shield"
                className="h-7 w-7"
              />
            </div>
            <div>
              <span className="font-bold text-ls-forest text-lg" style={{
                textShadow: '0 2px 4px rgba(199, 163, 56, 0.2)'
              }}>
                {language === 'th' ? 'ลีสชีลด์' : 'LEASE SHIELD'}
              </span>
              {isAdmin && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded" style={{
                  background: 'linear-gradient(135deg, #C7A338, #FFD700)',
                  color: '#0C3B2E',
                  boxShadow: '0 2px 6px rgba(199, 163, 56, 0.4)'
                }}>
                  ADMIN
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link to={createPageUrl("Account")}>
              <button
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: location.pathname === createPageUrl("Account") 
                    ? 'linear-gradient(135deg, #0C3B2E, #1a5241)' 
                    : 'rgba(12, 59, 46, 0.1)',
                  border: location.pathname === createPageUrl("Account")
                    ? '2px solid #C7A338'
                    : '2px solid rgba(12, 59, 46, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                  boxShadow: location.pathname === createPageUrl("Account")
                    ? '0 4px 12px rgba(199, 163, 56, 0.4)'
                    : '0 2px 6px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== createPageUrl("Account")) {
                    e.target.style.background = 'linear-gradient(135deg, #0C3B2E, #1a5241)';
                    e.target.style.borderColor = '#C7A338';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== createPageUrl("Account")) {
                    e.target.style.background = 'rgba(12, 59, 46, 0.1)';
                    e.target.style.borderColor = 'rgba(12, 59, 46, 0.2)';
                  }
                }}
              >
                <User 
                  className="w-5 h-5" 
                  style={{ 
                    color: location.pathname === createPageUrl("Account") ? '#C7A338' : '#0C3B2E',
                    transition: 'color 0.3s'
                  }}
                />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content with subtle pattern overlay */}
      <main className="flex-1 overflow-auto relative" style={{
        paddingTop: '64px',
        paddingBottom: `calc(${isAdmin ? '130px' : '126px'} + env(safe-area-inset-bottom, 0px))`
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(199, 163, 56, 0.05) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </main>

      {/* Bottom Navigation Tabs - REDESIGNED */}
      <nav className="bottom-tabs fixed bottom-0 left-0 right-0 z-50 glass-card" style={{
        borderTop: '2px solid rgba(199, 163, 56, 0.3)',
        boxShadow: '0 -4px 24px rgba(12, 59, 46, 0.2)',
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
                  padding: '10px 12px',
                  borderRadius: '14px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  flex: 1,
                  minWidth: '60px',
                  background: isActive 
                    ? 'linear-gradient(135deg, #0C3B2E 0%, #1a5241 100%)'
                    : 'transparent',
                  color: isActive ? '#C7A338' : '#0C3B2E',
                  textDecoration: 'none',
                  boxShadow: isActive ? '0 4px 12px rgba(12, 59, 46, 0.3)' : 'none',
                  border: isActive ? '2px solid rgba(199, 163, 56, 0.4)' : '2px solid transparent',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(12, 59, 46, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #C7A338, #FFD700, #C7A338)',
                    backgroundSize: '200% auto',
                    animation: 'shine 2s linear infinite'
                  }} />
                )}
                <Icon className="w-5 h-5 mb-1" style={{ 
                  filter: isActive ? 'drop-shadow(0 2px 4px rgba(199, 163, 56, 0.4))' : 'none'
                }} />
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: isActive ? '700' : '600',
                  whiteSpace: 'nowrap',
                  textShadow: isActive ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                }}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Disclaimer - REDESIGNED */}
        <div style={{
          position: 'absolute',
          bottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
          left: '8px',
          right: '8px',
          padding: '10px 16px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(12, 59, 46, 0.05), rgba(199, 163, 56, 0.05))',
          border: '1px solid rgba(199, 163, 56, 0.3)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
        }}>
          <p style={{
            fontSize: '10px',
            fontWeight: '600',
            margin: 0,
            color: '#0C3B2E',
            letterSpacing: '0.3px'
          }}>
            {language === 'th' 
              ? "เราไม่ใช่สำนักงานกฎหมายและไม่ได้ให้คำแนะนำทางกฎหมาย" 
              : "We are not a law firm and do not provide legal advice."}
            {" • "}
            <Link 
              to={createPageUrl("PrivacyPolicy")}
              style={{
                color: '#C7A338',
                textDecoration: 'none',
                fontWeight: '700',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
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