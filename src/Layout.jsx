import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Upload, Shield, FileText, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const navTabs = [
  {
    key: "home",
    label: "Home",
    route: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    key: "scan",
    label: "Scan",
    route: createPageUrl("UploadScan"),
    icon: Upload,
  },
  {
    key: "deposit",
    label: "Deposit",
    route: createPageUrl("DepositTracker"),
    icon: Shield,
  },
  {
    key: "docs",
    label: "Documents",
    route: createPageUrl("DocumentVault"),
    icon: FileText,
  },
  {
    key: "account",
    label: "Account",
    route: createPageUrl("Account"),
    icon: User,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const isActiveTab = (route) => {
    return location.pathname === route;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <style>{`
        :root {
          --primary: 222.2 47.4% 31.2%;
          --primary-foreground: 210 40% 98%;
          --accent: 160 84.1% 39.4%;
          --accent-foreground: 0 0% 100%;
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-24">
        {children}
      </main>

      {/* Bottom Navigation Tabs */}
      <nav className="bottom-tabs fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50">
        <div className="flex items-center justify-around px-2 py-2 md:py-3">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = isActiveTab(tab.route);
            
            return (
              <Link
                key={tab.key}
                to={tab.route}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 flex-1 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}