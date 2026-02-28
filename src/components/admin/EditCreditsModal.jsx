import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, FileText, Scale, Search as SearchIcon, RotateCcw, Zap, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const TIER_DEFAULTS = {
  free:    { scans: 1,      letters: 0,  cases: 0 },
  lite:    { scans: 10,     letters: 3,  cases: 0 },
  protect: { scans: 50,     letters: 10, cases: 0 },
  secure:  { scans: 999999, letters: 50, cases: 1 },
};

export default function EditCreditsModal({ open, onClose, user, onSave }) {
  const [manualOverride, setManualOverride] = useState(false);
  const [letterCredits, setLetterCredits] = useState("");
  const [scanCredits, setScanCredits] = useState("");
  const [caseCredits, setCaseCredits] = useState("");
  const [planTier, setPlanTier] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['userUsageStats', user?.email],
    queryFn: async () => {
      if (!user?.email) return { scans: 0, letters: 0, cases: 0 };
      const [leases, letterUsages, cases] = await Promise.all([
        base44.entities.Lease.filter({ owner_email: user.email }),
        base44.entities.LetterUsage.filter({ user_email: user.email }),
        base44.entities.Case.filter({ user_email: user.email }),
      ]);
      return {
        scans: leases?.length || 0,
        letters: letterUsages?.length || 0,
        cases: cases?.length || 0,
      };
    },
    enabled: open && !!user?.email,
    staleTime: 30000,
  });

  useEffect(() => {
    if (user) {
      setManualOverride(user.manual_tier_override || false);
      setLetterCredits(user.manual_letter_credits ?? "");
      setScanCredits(user.manual_scan_credits ?? "");
      setCaseCredits(user.manual_case_credits ?? "");
      setPlanTier(user.plan_tier || "free");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user.id, {
        manual_tier_override: manualOverride,
        manual_letter_credits: letterCredits === "" ? null : parseInt(letterCredits),
        manual_scan_credits: scanCredits === "" ? null : parseInt(scanCredits),
        manual_case_credits: caseCredits === "" ? 0 : parseInt(caseCredits),
        plan_tier: planTier,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const addCredits = (type, amount) => {
    if (type === 'scan') setScanCredits(prev => String((parseInt(prev) || 0) + amount));
    if (type === 'letter') setLetterCredits(prev => String((parseInt(prev) || 0) + amount));
    if (type === 'case') setCaseCredits(prev => String((parseInt(prev) || 0) + amount));
  };

  const resetToTierDefaults = () => {
    const defaults = TIER_DEFAULTS[planTier] || TIER_DEFAULTS.free;
    setScanCredits(String(defaults.scans));
    setLetterCredits(String(defaults.letters));
    setCaseCredits(String(defaults.cases));
  };

  if (!user) return null;

  const defaults = TIER_DEFAULTS[planTier] || TIER_DEFAULTS.free;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Manage Credits</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <Badge variant="outline" className="text-xs">{user.plan_tier || "free"}</Badge>
            {user.stripe_subscription_id
              ? <Badge className="bg-green-100 text-green-700 text-xs">Stripe</Badge>
              : <Badge className="bg-amber-100 text-amber-700 text-xs">No Stripe</Badge>
            }
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Usage Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-lg font-bold text-blue-700">{usageStats?.scans ?? '—'}</p>
              <p className="text-[10px] font-semibold text-blue-600">Scans Used</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-lg font-bold text-purple-700">{usageStats?.letters ?? '—'}</p>
              <p className="text-[10px] font-semibold text-purple-600">Letters Used</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-lg font-bold text-emerald-700">{usageStats?.cases ?? '—'}</p>
              <p className="text-[10px] font-semibold text-emerald-600">Cases Filed</p>
            </div>
          </div>

          {/* Plan Tier */}
          <div>
            <Label className="text-sm font-semibold">Plan Tier</Label>
            <select
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            >
              <option value="free">Free (Explorer)</option>
              <option value="lite">Lite</option>
              <option value="protect">Protect</option>
              <option value="secure">Secure</option>
            </select>
          </div>

          {/* Manual Override Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <p className="text-sm font-semibold">Manual Override Mode</p>
              <p className="text-xs text-muted-foreground">Bypass Stripe subscription checks</p>
            </div>
            <Switch checked={manualOverride} onCheckedChange={setManualOverride} />
          </div>

          {manualOverride ? (
            <div className="space-y-4 p-3 rounded-lg border-2 border-amber-200 bg-amber-50">
              <p className="text-xs font-semibold text-amber-700">
                ⚠️ Manual credits active — Stripe checks bypassed
              </p>

              {/* Scan Credits */}
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  📄 Scan Credits
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1">Number of lease scans user can perform</p>
                <Input
                  type="number"
                  min={0}
                  value={scanCredits}
                  onChange={(e) => setScanCredits(e.target.value)}
                  placeholder="e.g., 999999 for unlimited"
                  className="mt-1"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-muted-foreground">
                    Current: <strong>{user.available_scans ?? 0}</strong> scans
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Tier default: {defaults.scans === 999999 ? '∞' : defaults.scans}
                  </p>
                </div>
              </div>

              <div className="border-t border-amber-200" />

              {/* Letter Credits */}
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  ✉️ Letter Credits
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1">Number of letter templates user can download</p>
                <Input
                  type="number"
                  min={0}
                  value={letterCredits}
                  onChange={(e) => setLetterCredits(e.target.value)}
                  placeholder="e.g., 50 for Secure tier"
                  className="mt-1"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-muted-foreground">
                    Current: <strong>{user.letter_credits ?? 0}</strong> letters
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Tier default: {defaults.letters}
                  </p>
                </div>
              </div>

              <div className="border-t border-amber-200" />

              {/* Case Credits */}
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  ⚖️ Resolve Case Credits
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1">Free case submissions (normally ฿3,500 each)</p>
                <Input
                  type="number"
                  min={0}
                  value={caseCredits}
                  onChange={(e) => setCaseCredits(e.target.value)}
                  placeholder="e.g., 1 for Secure tier"
                  className="mt-1"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-muted-foreground">
                    Current: <strong>{user.manual_case_credits ?? 0}</strong> free cases
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Tier default: {defaults.cases}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-amber-200 pt-3">
                <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Quick Actions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => addCredits('scan', 10)}>
                    <Plus className="w-3 h-3" /> 10 Scans
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => addCredits('letter', 10)}>
                    <Plus className="w-3 h-3" /> 10 Letters
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => addCredits('case', 1)}>
                    <Plus className="w-3 h-3" /> 1 Case
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => setScanCredits("999999")}>
                    ∞ Scans
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-amber-700 border-amber-300" onClick={resetToTierDefaults}>
                    <RotateCcw className="w-3 h-3" /> Tier Defaults
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border bg-gray-50 text-center">
              <p className="text-sm text-muted-foreground">
                Manual override disabled. User follows tier defaults from Stripe subscription.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Enable override above to manually set credits.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}