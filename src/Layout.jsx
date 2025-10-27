import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Upload, Shield, FileText, User, Settings } from "lucide-react";
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
      key: "deposit",
      label: language === 'th' ? "เงินมัดจำ" : "Deposit",
      route: createPageUrl("DepositTracker"),
      icon: Shield,
    },
    {
      key: "docs",
      label: language === 'th' ? "เอกสาร" : "Documents",
      route: createPageUrl("DocumentVault"),
      icon: FileText,
    },
    {
      key: "account",
      label: language === 'th' ? "บัญชี" : "Account",
      route: createPageUrl("Account"),
      icon: User,
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
    <div className="min-h-screen flex flex-col bg-ls-stone">
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
        
        @media (min-width: 768px) {
          .bottom-tabs {
            max-width: 600px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 24px;
            margin-bottom: 16px;
          }
        }
      `}</style>

      {/* Top Bar with Logo */}
      <div className="bg-white border-b border-ls-stone shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
              alt="Lease Shield"
              className="h-8 w-8"
            />
            <span className="font-bold text-ls-forest text-lg">
              {language === 'th' ? 'ลีสชีลด์' : 'LEASE SHIELD'}
            </span>
            {isAdmin && (
              <span className="ml-2 px-2 py-0.5 bg-ls-gold text-white text-xs font-semibold rounded">
                ADMIN
              </span>
            )}
          </div>
          <LanguageToggle />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-24">
        {children}
      </main>

      {/* Bottom Navigation Tabs */}
      <nav className="bottom-tabs fixed bottom-0 left-0 right-0 bg-white border-t border-ls-stone shadow-2xl z-50">
        <div className={`flex items-center justify-around px-2 py-2 md:py-3 ${isAdmin ? 'overflow-x-auto' : ''}`}>
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
                  color: isActive ? '#FFFFFF' : '#1A1D1F',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#ECEFED';
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

      {/* Disclaimer Footer */}
      <div className="fixed bottom-20 md:bottom-24 left-0 right-0 bg-ls-charcoal/95 backdrop-blur-sm text-white py-2 px-4 text-center z-40">
        <p className="text-xs opacity-90">
          {language === 'th' 
            ? "เราไม่ใช่สำนักงานกฎหมายและไม่ได้ให้คำแนะนำทางกฎหมาย" 
            : "We are not a law firm and do not provide legal advice."}
        </p>
      </div>
    </div>
  );
}