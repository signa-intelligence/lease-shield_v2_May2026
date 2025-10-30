import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Zap, Shield } from "lucide-react";

const FEATURE_GATES = {
  // Free tier
  scan_preview: ['free', 'lite', 'protect', 'secure'],
  basic_document_vault: ['free', 'lite', 'protect', 'secure'],
  storage_100mb: ['free'],
  max_3_files: ['free'],
  
  // Lite tier
  full_report: ['lite', 'protect', 'secure'],
  templates_lite: ['lite', 'protect', 'secure'],
  email_notifications: ['lite', 'protect', 'secure'],
  scan_limit_5: ['lite'],
  storage_1gb: ['lite'],
  
  // Protect tier
  deposit_shield: ['protect', 'secure'],
  rent_alerts_auto: ['protect', 'secure'],
  templates_full: ['protect', 'secure'],
  line_notify_enabled: ['protect', 'secure'],
  unlimited_scans: ['protect', 'secure'],
  storage_5gb: ['protect'],
  
  // Secure tier
  priority_queue: ['secure'],
  storage_20gb: ['secure'],
  priority_support: ['secure'],
  
  // Legacy support
  resolve_member_price: ['lite', 'protect', 'secure']
};

export function useFeatureAccess(featureName) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const allowedTiers = FEATURE_GATES[featureName] || [];
  const hasAccess = user?.plan_tier && allowedTiers.includes(user.plan_tier);
  
  return { hasAccess, userTier: user?.plan_tier };
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
    free: { label: 'Free', color: 'bg-gray-100 text-gray-700', icon: null },
    lite: { label: 'Lite', color: 'bg-blue-100 text-blue-700', icon: Zap },
    protect: { label: 'Protect', color: 'bg-emerald-100 text-emerald-700', icon: Shield },
    secure: { label: 'Secure', color: 'bg-purple-100 text-purple-700', icon: Crown }
  };

  const config = configs[tier] || configs.free;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}