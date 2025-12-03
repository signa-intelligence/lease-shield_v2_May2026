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
  scanner: { category: "ai-scanner", question: "how-scanner-works" },
  scannerLanguages: { category: "ai-scanner", question: "supported-languages" },
  scannerAccuracy: { category: "ai-scanner", question: "scan-accuracy" },
  
  // Deposits
  deposits: { category: "deposits", question: "deposit-tracking-how" },
  depositNotReturned: { category: "deposits", question: "deposit-not-returned" },
  
  // Maintenance
  maintenance: { category: "maintenance", question: "report-maintenance" },
  landlordNotResponding: { category: "maintenance", question: "landlord-not-responding" },
  
  // Evidence
  evidence: { category: "evidence", question: "what-to-store" },
  storageLimit: { category: "evidence", question: "storage-limit" },
  
  // Disputes
  resolve: { category: "disputes", question: "resolve-service" },
  resolveCost: { category: "disputes", question: "resolve-cost" },
  
  // LINE
  connectLine: { category: "communication", question: "connect-line" },
  landlordLine: { category: "communication", question: "landlord-line" },
  notifications: { category: "communication", question: "notification-types" },
  
  // Billing
  changePlan: { category: "billing", question: "change-plan" },
  cancelSubscription: { category: "billing", question: "cancel-subscription" },
  letterCredits: { category: "billing", question: "letter-credits" },
  
  // Privacy
  dataSecurity: { category: "privacy-security", question: "data-security" },
  deleteAccount: { category: "privacy-security", question: "delete-account" }
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