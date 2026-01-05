import React from "react";
import AuthGuard from "../components/shared/AuthGuard";
import MissingParams from "../components/report/MissingParams";
import ReportFullInner from "../components/report/ReportFullInner";
import PreviewHarness from "../components/report/PreviewHarness";

export default function ReportFull() {
  // FORENSIC PARAM PARSING - all variants
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = (urlParams.get('scanId') || urlParams.get('scanid') || urlParams.get('scan_id') || '').trim();
  const leaseId = (urlParams.get('leaseId') || urlParams.get('leaseid') || urlParams.get('lease_id') || '').trim();
  const showDebug = urlParams.get('debug') === '1' || urlParams.get('forensics') === '1';

  // DETECT EDITOR PREVIEW
  const isEditorPreview = typeof window !== 'undefined' && 
    (window.location.hostname.includes('app.base44.com') || window.location.hostname.includes('localhost')) &&
    window.location.pathname.includes('/editor/preview');

  // FORENSIC DEBUG DATA (always computed, conditionally rendered)
  const forensicData = {
    href: typeof window !== 'undefined' ? window.location.href : '',
    pathname: typeof window !== 'undefined' ? window.location.pathname : '',
    search: typeof window !== 'undefined' ? window.location.search : '',
    isEditorPreview,
    params: {
      scanId: urlParams.get('scanId'),
      scanid: urlParams.get('scanid'),
      scan_id: urlParams.get('scan_id'),
      leaseId: urlParams.get('leaseId'),
      leaseid: urlParams.get('leaseid'),
      lease_id: urlParams.get('lease_id')
    },
    resolved: { scanId, leaseId },
    hasParams: !!(scanId && leaseId)
  };

  return (
    <AuthGuard>
      {scanId && leaseId ? (
        <ReportFullInner scanId={scanId} leaseId={leaseId} showDebug={showDebug} forensicData={forensicData} />
      ) : isEditorPreview ? (
        <PreviewHarness forensicData={forensicData} />
      ) : (
        <MissingParams forensicData={forensicData} />
      )}
    </AuthGuard>
  );
}