import React from "react";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Contextual Help Icon - links directly to specific FAQ question
 * 
 * Usage:
 * <ContextualHelp category="ai-scanner" question="how-scanner-works" />
 * <ContextualHelp category="deposits" question="deposit-tracking-how" size="sm" />
 */
export default function ContextualHelp({ 
  category, 
  question, 
  size = "md",
  className = "",
  tooltip = "Help"
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const containerSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-8 h-8"
  };

  const faqUrl = question 
    ? `${createPageUrl("FAQ")}?category=${category}&q=${question}`
    : `${createPageUrl("FAQ")}?category=${category}`;

  return (
    <Link 
      to={faqUrl}
      className={`inline-flex items-center justify-center rounded-full transition-all hover:scale-110 ${containerSizes[size]} ${className}`}
      style={{
        backgroundColor: 'rgba(12,59,46,0.1)',
      }}
      title={tooltip}
    >
      <HelpCircle 
        className={`${sizeClasses[size]} text-[#0C3B2E] opacity-70 hover:opacity-100 transition-opacity`}
      />
    </Link>
  );
}

/**
 * Feature-specific help shortcuts
 */
export const HelpLinks = {
  // AI Scanner
  scanner: { category: "ai-scanner", question: "how-upload-scan" },
  scannerLanguages: { category: "ai-scanner", question: "supported-languages" },
  scannerAccuracy: { category: "ai-scanner", question: "scan-accuracy" },
  
  // Deposits
  deposits: { category: "deposits-moveout", question: "how-track-deposit-return" },
  depositNotReturned: { category: "deposits-moveout", question: "get-deposit-back" },
  
  // Maintenance
  maintenance: { category: "maintenance", question: "how-log-track-maintenance" },
  landlordNotResponding: { category: "maintenance", question: "who-receives-report" },
  
  // Evidence
  evidence: { category: "evidence-vault", question: "what-upload-evidence" },
  storageLimit: { category: "evidence-vault", question: "evidence-timestamped" },
  
  // Disputes
  resolve: { category: "cases-disputes", question: "open-case-for" },
  resolveCost: { category: "cases-disputes", question: "after-submit-case" },
  
  // LINE
  connectLine: { category: "communication", question: "connect-line-tenant" },
  landlordLine: { category: "communication", question: "landlord-line" },
  notifications: { category: "communication", question: "what-notifications" },
  
  // Billing
  changePlan: { category: "billing", question: "upgrade-plan" },
  cancelSubscription: { category: "billing", question: "cancel-subscription" },
  letterCredits: { category: "billing", question: "paid-features" },
  
  // Privacy
  dataSecurity: { category: "privacy-security", question: "data-protection" },
  deleteAccount: { category: "privacy-security", question: "delete-data" }
};

/**
 * Quick help button with predefined link
 * 
 * Usage:
 * <QuickHelp link="scanner" />
 * <QuickHelp link="deposits" size="sm" />
 */
export function QuickHelp({ link, size = "md", className = "" }) {
  const helpConfig = HelpLinks[link];
  
  if (!helpConfig) {
    console.warn(`QuickHelp: Unknown link "${link}"`);
    return null;
  }
  
  return (
    <ContextualHelp 
      category={helpConfig.category}
      question={helpConfig.question}
      size={size}
      className={className}
    />
  );
}