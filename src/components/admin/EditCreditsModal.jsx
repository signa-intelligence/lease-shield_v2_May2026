import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, FileText, Search, Briefcase } from "lucide-react";

export default function EditCreditsModal({ open, onClose, user, onSave }) {
  const [manualOverride, setManualOverride] = useState(false);
  const [letterCredits, setLetterCredits] = useState("");
  const [scanCredits, setScanCredits] = useState("");
  const [caseCredits, setCaseCredits] = useState("");
  const [planTier, setPlanTier] = useState("");
  const [saving, setSaving] = useState(false);

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

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Credits</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Current Status */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Tier: {user.plan_tier || "free"}</Badge>
            <Badge variant="outline">Letters: {user.letter_credits ?? 0}</Badge>
            <Badge variant="outline">Scans: {user.available_scans ?? 0}</Badge>
            {user.stripe_subscription_id && (
              <Badge className="bg-green-100 text-green-700">Stripe linked</Badge>
            )}
            {!user.stripe_subscription_id && (
              <Badge className="bg-amber-100 text-amber-700">No Stripe</Badge>
            )}
          </div>

          {/* Plan Tier */}
          <div>
            <Label className="text-sm font-semibold">Plan Tier</Label>
            <select
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md text-sm"
            >
              <option value="free">Free</option>
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

          {manualOverride && (
            <div className="space-y-4 p-3 rounded-lg border-2 border-amber-200 bg-amber-50">
              <p className="text-xs font-semibold text-amber-700">
                Manual credits active — Stripe checks bypassed
              </p>

              <div>
                <Label className="text-sm flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Letter Credits
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={letterCredits}
                  onChange={(e) => setLetterCredits(e.target.value)}
                  placeholder="Empty = use existing letter_credits"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> Scan Credits
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={scanCredits}
                  onChange={(e) => setScanCredits(e.target.value)}
                  placeholder="Empty = use existing available_scans"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Free Case Credits
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={caseCredits}
                  onChange={(e) => setCaseCredits(e.target.value)}
                  placeholder="e.g. 1 for Secure annual"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Secure annual = 1 free case/year
                </p>
              </div>
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