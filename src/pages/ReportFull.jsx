import React from "react";
import AuthGuard from "../components/shared/AuthGuard";
import MissingParams from "../components/report/MissingParams";
import ReportFullInner from "../components/report/ReportFullInner";

export default function ReportFull() {
  // Read params - ZERO business logic hooks
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = (urlParams.get('scanId') || urlParams.get('scanid') || urlParams.get('scan_id') || '').trim();
  const leaseId = (urlParams.get('leaseId') || urlParams.get('leaseid') || urlParams.get('lease_id') || '').trim();
  const showDebug = urlParams.get('debug') === '1';

  return (
    <AuthGuard>
      {scanId && leaseId ? (
        <ReportFullInner scanId={scanId} leaseId={leaseId} showDebug={showDebug} />
      ) : (
        <MissingParams />
      )}
    </AuthGuard>
  );
}