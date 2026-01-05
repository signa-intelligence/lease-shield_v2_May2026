import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
// NOTE: NOT using createPageUrl for this page to avoid redirect loops
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  FileText,
  ArrowLeft,
  ExternalLink,
  Download,
  Loader2,
  RefreshCw
} from "lucide-react";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";

const SEVERITY_CONFIG = {
  low: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Low', icon: CheckCircle2 },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium', icon: Info },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High', icon: AlertTriangle },
  critical: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Critical', icon: AlertCircle }
};

function ReportFullContent() {
  const navigate = useNavigate();
  
  // CRITICAL: Refs to prevent infinite loops - persisted across renders
  const redirectAttemptedRef = useRef(false);
  const fetchAttemptCountRef = useRef(0);
  const renderCountRef = useRef(0);
  const navigationLogRef = useRef([]);
  
  // Debug state (only shown with ?debug=1)
  const [debugInfo, setDebugInfo] = useState({ renders: 0, fetches: 0, navigations: [] });
  
  // Increment render count
  renderCountRef.current += 1;
  
  // Parse URL params once
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const scanId = urlParams.get('scanId');
  const leaseId = urlParams.get('leaseId');
  const showDebug = urlParams.get('debug') === '1';
  
  // Log navigation helper
  const logNavigation = (reason) => {
    const entry = { time: new Date().toISOString(), reason };
    navigationLogRef.current.push(entry);
    console.log('[ReportFull] Navigation:', reason);
    if (showDebug) {
      setDebugInfo(prev => ({
        ...prev,
        navigations: [...prev.navigations, entry]
      }));
    }
  };

  // Update debug info on render
  useEffect(() => {
    if (showDebug) {
      setDebugInfo(prev => ({
        ...prev,
        renders: renderCountRef.current,
        fetches: fetchAttemptCountRef.current
      }));
    }
  }, [showDebug]);

  // Fetch user
  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false, // NO RETRY - prevents loop
    staleTime: 60000
  });

  // Fetch lease - ONLY when leaseId is present
  const { data: leaseData, isLoading: leaseLoading, error: leaseError } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: async () => {
      fetchAttemptCountRef.current += 1;
      if (showDebug) {
        setDebugInfo(prev => ({ ...prev, fetches: fetchAttemptCountRef.current }));
      }
      console.log('[ReportFull] Fetching lease:', leaseId);
      const results = await base44.entities.Lease.filter({ id: leaseId });
      return results?.[0] || null;
    },
    enabled: !!leaseId && !!user, // Only fetch if we have both
    retry: false, // NO RETRY
    staleTime: 60000
  });

  // Fetch scan - ONLY when scanId is present
  const { data: scanData, isLoading: scanLoading, error: scanError } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      fetchAttemptCountRef.current += 1;
      if (showDebug) {
        setDebugInfo(prev => ({ ...prev, fetches: fetchAttemptCountRef.current }));
      }
      console.log('[ReportFull] Fetching scan:', scanId);
      const results = await base44.entities.LeaseScan.filter({ id: scanId });
      return results?.[0] || null;
    },
    enabled: !!scanId && !!user, // Only fetch if we have both
    retry: false, // NO RETRY
    staleTime: 60000
  });

  const isDarkMode = user?.theme === 'dark';
  const language = user?.language || 'en';
  
  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  // Check admin for debug panel
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || 
                  user?.access_level === 'admin' || user?.access_level === 'super_admin';

  // CRITICAL: Stable error page component - NO navigation calls
  const renderErrorPage = (title, message, showRetry = true) => (
    <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        {/* Debug Panel - Admin only with ?debug=1 */}
        {showDebug && isAdmin && (
          <Card className="mb-4 border-2 border-red-500" style={{ backgroundColor: '#FEE2E2' }}>
            <CardContent className="p-4">
              <h3 className="font-bold text-red-800 mb-2">🔧 Debug Panel (Admin)</h3>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
{`URL: ${window.location.href}
Params: scanId=${scanId || 'MISSING'}, leaseId=${leaseId || 'MISSING'}
User: ${user?.email || 'NOT LOADED'}
Render Count: ${renderCountRef.current}
Fetch Attempts: ${fetchAttemptCountRef.current}
Redirect Attempted: ${redirectAttemptedRef.current}
Navigation Log:
${navigationLogRef.current.map(n => `  ${n.time}: ${n.reason}`).join('\n')}`}
              </pre>
            </CardContent>
          </Card>
        )}
        
        <Card style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {title}
            </h2>
            <p className="mb-6" style={{ color: colors.textSecondary }}>
              {message}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {showRetry && (
                <Button
                  variant="outline"
                  onClick={() => {
                    logNavigation('Manual retry clicked');
                    window.location.reload();
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
              <Button
                onClick={() => {
                  logNavigation('Go back clicked');
                  haptic.light();
                  navigate('/UploadScan');
                }}
                style={{ backgroundColor: '#0C3B2E', color: '#fff' }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // === STATE CHECKS (in order, with stable error pages) ===

  // 1. Missing required params - STABLE ERROR (no redirect)
  if (!scanId || !leaseId) {
    console.log('[ReportFull] Missing params:', { scanId, leaseId });
    return renderErrorPage(
      'Missing Parameters',
      'This report requires both scanId and leaseId parameters. Please navigate from a valid scan result.',
      false
    );
  }

  // 2. Loading state
  const isLoading = userLoading || leaseLoading || scanLoading;
  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          {showDebug && isAdmin && (
            <Card className="mb-4 border-2 border-amber-500" style={{ backgroundColor: '#FEF3C7' }}>
              <CardContent className="p-4">
                <h3 className="font-bold text-amber-800 mb-2">🔧 Debug Panel - Loading</h3>
                <pre className="text-xs bg-white p-2 rounded">
{`Renders: ${renderCountRef.current}, Fetches: ${fetchAttemptCountRef.current}
userLoading: ${userLoading}, leaseLoading: ${leaseLoading}, scanLoading: ${scanLoading}`}
                </pre>
              </CardContent>
            </Card>
          )}
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#0C3B2E' }} />
            <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              Loading report...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Auth error - STABLE ERROR (no auto-redirect to login)
  if (userError || !user) {
    console.log('[ReportFull] Auth error:', userError?.message);
    return renderErrorPage(
      'Authentication Required',
      'Please log in to view this report.',
      false
    );
  }

  // 4. Data fetch errors - STABLE ERROR
  if (leaseError || scanError) {
    const errorMsg = leaseError?.message || scanError?.message || 'Unknown error';
    console.log('[ReportFull] Fetch error:', errorMsg);
    
    // Check for rate limit
    if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate')) {
      return renderErrorPage(
        'Rate Limited',
        'Too many requests. Please wait 10 seconds and try again.',
        true
      );
    }
    
    return renderErrorPage(
      'Error Loading Report',
      `Failed to load report data: ${errorMsg}`,
      true
    );
  }

  // 5. Data not found - STABLE ERROR (no redirect)
  if (!leaseData || !scanData) {
    console.log('[ReportFull] Data not found:', { hasLease: !!leaseData, hasScan: !!scanData });
    return renderErrorPage(
      'Report Not Found',
      'The requested lease scan could not be found. It may have been deleted or you may not have access.',
      false
    );
  }

  // === SUCCESS: Render the full report ===
  const lease = leaseData;
  const scan = scanData;

  const getRiskLevel = (score) => {
    if (score >= 70) return { level: 'high', label: 'HIGH RISK', color: '#EF4444', bg: '#FEE2E2' };
    if (score >= 40) return { level: 'medium', label: 'MEDIUM RISK', color: '#F59E0B', bg: '#FEF3C7' };
    return { level: 'low', label: 'LOW RISK', color: '#10B981', bg: '#D1FAE5' };
  };

  const riskLevel = getRiskLevel(scan.risk_score || 0);
  const flags = scan.flags || [];
  const scanFull = scan.scan_full || {};

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: '100px' }}>
      <div className="max-w-4xl mx-auto">
        {/* Debug Panel */}
        {showDebug && isAdmin && (
          <Card className="mb-4 border-2 border-emerald-500" style={{ backgroundColor: '#D1FAE5' }}>
            <CardContent className="p-4">
              <h3 className="font-bold text-emerald-800 mb-2">🔧 Debug Panel - Success</h3>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
{`✅ Report loaded successfully
URL: ${window.location.href}
Renders: ${renderCountRef.current}, Fetches: ${fetchAttemptCountRef.current}
Lease: ${lease.id} | Scan: ${scan.id}
Risk Score: ${scan.risk_score}
Flags: ${flags.length}`}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => {
            logNavigation('Back button clicked');
            haptic.light();
            navigate(-1);
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header Card with Risk Score */}
        <Card className="border-none shadow-xl mb-6 overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ backgroundColor: riskLevel.color }}>
            <div className="text-white">
              <CardTitle className="text-2xl font-bold mb-3">Full Lease Analysis Report</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="text-2xl px-4 py-2 font-bold" style={{
                  backgroundColor: riskLevel.bg,
                  color: riskLevel.color,
                  border: `2px solid ${riskLevel.color}`
                }}>
                  {scan.risk_score || 0}/100
                </Badge>
                <Badge className="text-lg px-4 py-2 font-bold" style={{
                  backgroundColor: '#FFFFFF',
                  color: riskLevel.color
                }}>
                  {riskLevel.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {lease.property_address && (
              <div className="mb-4">
                <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Property:</span>
                <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{lease.property_address}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Summary:</span>
              <p className="mt-1" style={{ color: colors.textPrimary }}>{scan.summary || 'No summary available.'}</p>
            </div>
          </CardContent>
        </Card>

        {/* All Issues */}
        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              All Issues Found ({flags.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {flags.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p style={{ color: colors.textSecondary }}>No issues found in this lease.</p>
              </div>
            ) : (
              flags.map((flag, idx) => {
                const severityConfig = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.medium;
                const Icon = severityConfig.icon;
                return (
                  <div key={idx} className="p-4 rounded-xl border-2" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB'
                  }}>
                    <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                      <Badge className={`${severityConfig.color} border flex items-center gap-1`}>
                        <Icon className="w-3 h-3" />
                        {severityConfig.label}
                      </Badge>
                      {flag.category && (
                        <Badge variant="outline">{flag.category}</Badge>
                      )}
                    </div>
                    <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                      {flag.description}
                    </p>
                    {flag.recommendation && (
                      <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                        💡 {flag.recommendation}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Detailed Analysis (if available) */}
        {scanFull.clause_review && Object.keys(scanFull.clause_review).length > 0 && (
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6" style={{ color: '#0C3B2E' }} />
                Detailed Clause Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(scanFull.clause_review).slice(0, 20).map(([clauseId, review], idx) => (
                <div key={idx} className="p-4 rounded-lg border" style={{
                  borderColor: colors.borderColor,
                  backgroundColor: isDarkMode ? '#353A3D' : '#FAFAFA'
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono text-xs">{clauseId}</Badge>
                    {review.tenant_risk_level && (
                      <Badge className={
                        review.tenant_risk_level === 'high' ? 'bg-red-100 text-red-800' :
                        review.tenant_risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-emerald-100 text-emerald-800'
                      }>
                        {review.tenant_risk_level} risk
                      </Badge>
                    )}
                  </div>
                  {review.tenant_summary && (
                    <p className="text-sm" style={{ color: colors.textPrimary }}>{review.tenant_summary}</p>
                  )}
                  {review.tenant_recommendation && (
                    <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                      💡 {review.tenant_recommendation}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {lease.file_url && (
            <Button
              variant="outline"
              onClick={() => window.open(lease.file_url, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Original Lease
            </Button>
          )}
          <Button
            onClick={() => {
              haptic.medium();
              navigate(createPageUrl("Templates"));
            }}
            style={{ backgroundColor: '#0C3B2E', color: '#fff' }}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Letter Templates
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReportFull() {
  return (
    <AuthGuard>
      <ReportFullContent />
    </AuthGuard>
  );
}