import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AuthGuard from "../components/shared/AuthGuard";
import MissingParams from "../components/report/MissingParams";
import ReportFullInner from "../components/report/ReportFullInner";
import PreviewHarness from "../components/report/PreviewHarness";

export default function ReportFull() {
  const location = useLocation();
  
  // State for param resolution - starts false until useEffect runs
  const [paramsResolved, setParamsResolved] = useState(false);
  const [scanId, setScanId] = useState('');
  const [leaseId, setLeaseId] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [isEditorPreview, setIsEditorPreview] = useState(false);
  const [forensicData, setForensicData] = useState(null);
  const [passedScanFull, setPassedScanFull] = useState(null);

  // Parse params ONLY after mount (window-safe)
  useEffect(() => {
    // Safe access to window after mount
    const urlParams = new URLSearchParams(window.location.search);
    
    // Log raw URL for debugging
    console.log('[REPORTFULL_PARSE]', {
      href: window.location.href,
      search: window.location.search,
      searchEmpty: window.location.search === '',
      allParams: Object.fromEntries(urlParams)
    });
    
    // Resolve scanId with all case variants
    const resolvedScanId = (
      urlParams.get('scanId') || 
      urlParams.get('scanid') || 
      urlParams.get('scan_id') || 
      ''
    ).trim();
    
    // Resolve leaseId with all case variants
    const resolvedLeaseId = (
      urlParams.get('leaseId') || 
      urlParams.get('leaseid') || 
      urlParams.get('lease_id') || 
      ''
    ).trim();
    
    // Debug flags
    const debugFlag = urlParams.get('debug') === '1' || urlParams.get('forensics') === '1';
    
    // Detect editor preview environment
    const editorPreview = 
      (window.location.hostname.includes('app.base44.com') || 
       window.location.hostname.includes('localhost')) &&
      window.location.pathname.includes('/editor/preview');
    
    // Build forensic data for debugging
    const forensic = {
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      isEditorPreview: editorPreview,
      params: {
        scanId: urlParams.get('scanId'),
        scanid: urlParams.get('scanid'),
        scan_id: urlParams.get('scan_id'),
        leaseId: urlParams.get('leaseId'),
        leaseid: urlParams.get('leaseid'),
        lease_id: urlParams.get('lease_id')
      },
      resolved: { 
        scanId: resolvedScanId, 
        leaseId: resolvedLeaseId 
      },
      hasParams: !!(resolvedScanId && resolvedLeaseId)
    };
    
    console.log('[REPORTFULL_RESOLVED]', forensic);
    
    // Set all state at once
    setScanId(resolvedScanId);
    setLeaseId(resolvedLeaseId);
    setShowDebug(debugFlag);
    setIsEditorPreview(editorPreview);
    setForensicData(forensic);
    
    // Mark params as resolved - triggers render with actual content
    setParamsResolved(true);
  }, [location]);

  // LOADING SHELL: Render while params are being resolved (SSR-safe)
  if (!paramsResolved) {
    return (
      <AuthGuard>
        <div 
          className="min-h-screen flex items-center justify-center" 
          style={{ backgroundColor: '#F3F6F5' }}
        >
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2" 
            style={{ borderColor: '#0C3B2E' }}
          />
        </div>
      </AuthGuard>
    );
  }

  // RESOLVED: Render appropriate content based on params
  return (
    <AuthGuard>
      {scanId ? (
        <ReportFullInner 
          scanId={scanId} 
          leaseId={leaseId} 
          showDebug={showDebug} 
          forensicData={forensicData}
        />
      ) : isEditorPreview ? (
        <PreviewHarness forensicData={forensicData} />
      ) : (
        <MissingParams forensicData={forensicData} />
      )}
    </AuthGuard>
  );
}