import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import ReportFullInner from "../components/report/ReportFullInner";

function ReportFullContent() {
  const navigate = useNavigate();
  
  // Parse URL params with fallbacks (canonical + legacy casing)
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const scanId = (urlParams.get('scanId') || urlParams.get('scanid') || urlParams.get('scan_id') || '').trim();
  const leaseId = (urlParams.get('leaseId') || urlParams.get('leaseid') || urlParams.get('lease_id') || '').trim();
  const showDebug = urlParams.get('debug') === '1';

  const missingParams = !scanId || !leaseId;

  if (missingParams) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2">Missing Parameters</h2>
              <p className="mb-4 text-gray-600">This report requires both scanId and leaseId query parameters.</p>
              <p className="mb-6 text-sm text-gray-500">Example: /ReportFull?scanId=xxx&leaseId=yyy</p>
              <Button onClick={() => navigate('/UploadScan')} style={{ backgroundColor: '#0C3B2E', color: '#fff' }}>
                <ArrowLeft className="w-4 h-4 mr-2" />Back to Scans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <ReportFullInner scanId={scanId} leaseId={leaseId} showDebug={showDebug} />;
}

export default function ReportFull() {
  return (
    <AuthGuard>
      <ReportFullContent />
    </AuthGuard>
  );
}