import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, FlaskConical, Loader2, Search } from "lucide-react";

export default function PreviewHarness({ forensicData }) {
  const [manualScanId, setManualScanId] = useState('');
  const [manualLeaseId, setManualLeaseId] = useState('');
  const [loadingRecent, setLoadingRecent] = useState(false);

  const handleManualLoad = () => {
    if (!manualScanId || !manualLeaseId) return;
    const targetUrl = `${window.location.origin}/reportfull?scanId=${encodeURIComponent(manualScanId)}&leaseId=${encodeURIComponent(manualLeaseId)}&debug=1`;
    console.log('[PreviewHarness] Redirecting to:', targetUrl);
    window.location.href = targetUrl;
  };

  const handleLoadRecent = async () => {
    setLoadingRecent(true);
    try {
      const user = await base44.auth.me();
      if (!user) {
        alert('Editor preview cannot read your DB session. Paste scanId/leaseId manually or test on production domain.');
        setLoadingRecent(false);
        return;
      }
      
      const scans = await base44.entities.LeaseScan.filter({ created_by: user.email }, '-created_date', 1);
      if (scans && scans.length > 0) {
        const scan = scans[0];
        const leaseId = scan.lease_id;
        const targetUrl = `${window.location.origin}/reportfull?scanId=${encodeURIComponent(scan.id)}&leaseId=${encodeURIComponent(leaseId)}&debug=1`;
        console.log('[PreviewHarness] Auto-load redirecting to:', targetUrl);
        window.location.href = targetUrl;
      } else {
        alert('No scans found for your account');
        setLoadingRecent(false);
      }
    } catch (err) {
      console.error('[PreviewHarness] Load recent failed:', err);
      alert('Editor preview cannot read your DB session. Paste scanId/leaseId manually or test on production domain.');
      setLoadingRecent(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-blue-500 shadow-xl">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FlaskConical className="w-6 h-6" />
              Editor Preview Harness - ReportFull
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Forensic Debug Panel */}
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto">
              <div className="mb-2 text-white font-bold">🔍 FORENSIC DEBUG PANEL</div>
              <div>href: {forensicData.href}</div>
              <div>pathname: {forensicData.pathname}</div>
              <div>search: {forensicData.search || '(empty)'}</div>
              <div className="mt-2 text-yellow-400">isEditorPreview: {String(forensicData.isEditorPreview)}</div>
              <div className="mt-2 text-white">RAW PARAMS:</div>
              <div className="pl-4">
                <div>scanId: {forensicData.params.scanId || '(null)'}</div>
                <div>scanid: {forensicData.params.scanid || '(null)'}</div>
                <div>scan_id: {forensicData.params.scan_id || '(null)'}</div>
                <div>leaseId: {forensicData.params.leaseId || '(null)'}</div>
                <div>leaseid: {forensicData.params.leaseid || '(null)'}</div>
                <div>lease_id: {forensicData.params.lease_id || '(null)'}</div>
              </div>
              <div className="mt-2 text-emerald-400">RESOLVED:</div>
              <div className="pl-4">
                <div>scanId: {forensicData.resolved.scanId || '(empty)'}</div>
                <div>leaseId: {forensicData.resolved.leaseId || '(empty)'}</div>
              </div>
              <div className="mt-2">hasParams: {String(forensicData.hasParams)}</div>
            </div>

            {/* Manual Input Form */}
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Manual Input
              </h3>
              <div className="space-y-3">
                <Input
                  placeholder="Scan ID"
                  value={manualScanId}
                  onChange={(e) => setManualScanId(e.target.value)}
                  className="bg-white"
                />
                <Input
                  placeholder="Lease ID"
                  value={manualLeaseId}
                  onChange={(e) => setManualLeaseId(e.target.value)}
                  className="bg-white"
                />
                <Button 
                  onClick={handleManualLoad} 
                  disabled={!manualScanId || !manualLeaseId}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Load Report
                </Button>
              </div>
            </div>

            {/* Load Recent Scan */}
            <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 bg-emerald-50">
              <h3 className="font-bold text-emerald-900 mb-3">Quick Test</h3>
              <Button 
                onClick={handleLoadRecent}
                disabled={loadingRecent}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loadingRecent ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>Load Most Recent Scan (Auto-Redirect)</>
                )}
              </Button>
              <p className="text-xs text-emerald-700 mt-1">
                Queries DB for your latest scan, then redirects to /reportfull with params
              </p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <div className="font-bold mb-1">Editor Preview Mode Detected</div>
                <div>This harness only appears in Base44 editor preview. In production, missing params show standard error.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}