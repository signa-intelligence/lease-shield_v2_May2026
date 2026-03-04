import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Zap, Shield } from "lucide-react";

// ✅ COMPREHENSIVE FEATURE GATES - ALIGNED WITH MARKETING COPY
const FEATURE_GATES = {
  // ============================================
  // FREE TIER (Trial/Discovery)
  // ============================================
  scan_preview: ['explorer', 'lite', 'protect', 'secure'],
  basic_document_vault: ['explorer', 'lite', 'protect', 'secure'],
  maintenance_tracker_basic: ['explorer', 'lite', 'protect', 'secure'],
  deposit_tracker_readonly: ['explorer', 'lite', 'protect', 'secure'],
  storage_100mb: ['explorer'],
  max_3_files: ['explorer'],
  scan_limit_1_lifetime: ['explorer'],
  
  // ============================================
  // LITE TIER (Essential Protection)
  // ============================================
  full_report: ['lite', 'protect', 'secure'],
  email_notifications: ['lite', 'protect', 'secure'],
  scan_limit_6_per_year: ['lite'],
  risk_flags_5_max: ['lite'],
  letter_credits_3: ['lite', 'protect', 'secure'], // Templates available to all paid tiers
  storage_1gb: ['lite'],
  maintenance_tracker_full: ['lite', 'protect', 'secure'],
  deposit_tracker_full: ['lite', 'protect', 'secure'],
  
  // ============================================
  // PROTECT TIER (Complete Prevention Suite)
  // ============================================
  scan_limit_12_per_year: ['protect'],
  full_risk_reports: ['protect', 'secure'],
  line_notifications: ['protect', 'secure'],
  letter_credits_5: ['protect', 'secure'],
  storage_5gb: ['protect'],
  rent_payment_alerts: ['protect', 'secure'],
  automated_reminders: ['protect', 'secure'],
  deposit_shield_automation: ['protect', 'secure'],
  
  // ============================================
  // SECURE TIER (Premium Protection)
  // ============================================
  scans_50_per_year: ['secure'],
  advanced_reminders: ['secure'],
  letter_credits_50_per_year: ['secure'],
  storage_20gb: ['secure'],
  priority_case_queue: ['secure'],
  priority_scanning: ['secure'],
  premium_support: ['secure'],
  ai_letter_generation: ['secure'],
  
  // ============================================
  // LEGACY/COMPATIBILITY GATES
  // ============================================
  deposit_shield: ['protect', 'secure'],
  rent_alerts_auto: ['protect', 'secure'],
  templates_lite: ['lite', 'protect', 'secure'],
  templates_full: ['protect', 'secure'],
  line_notify_enabled: ['protect', 'secure'],
  priority_queue: ['secure'],
  priority_support: ['secure'],
  resolve_member_price: ['lite', 'protect', 'secure']
};

export function useFeatureAccess(featureName) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const allowedTiers = FEATURE_GATES[featureName] || [];
  const userTier = user?.plan_tier || 'explorer';
  const hasAccess = allowedTiers.includes(userTier);
  
  return { hasAccess, userTier };
}

export function FeatureGate({ feature, children, fallback }) {
  const { hasAccess, userTier } = useFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Premium Feature</h3>
        <p className="text-sm text-slate-600 mb-4">
          This feature is available on {FEATURE_GATES[feature]?.map(t => t.toUpperCase()).join(', ')} plans
        </p>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
          <Crown className="w-4 h-4 mr-2" />
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlanBadge({ tier }) {
  const configs = {
    explorer: { label: 'Explorer', color: 'bg-gray-100 text-gray-700', icon: null },
    lite: { label: 'Lite', color: 'bg-blue-100 text-blue-700', icon: Zap },
    protect: { label: 'Protect', color: 'bg-emerald-100 text-emerald-700', icon: Shield },
    secure: { label: 'Secure', color: 'bg-purple-100 text-purple-700', icon: Crown }
  };

  const config = configs[tier] || configs.explorer;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}