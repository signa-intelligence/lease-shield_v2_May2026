// components/report/ReportFullInner.jsx
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Wrench
} from "lucide-react";
import ErrorPanel from "./ErrorPanel";
import { severityPalette, highestSeverity } from "../shared/severityPalette";

const SEVERITY_CONFIG = {
  none: { label: "NO RISK", icon: CheckCircle2, palette: severityPalette.none },
  low: { label: "Low", icon: Info, palette: severityPalette.low },
  medium: { label: "Medium", icon: AlertTriangle, palette: severityPalette.medium },
  high: { label: "High", icon: AlertTriangle, palette: severityPalette.high },
  critical: { label: "Critical", icon: AlertCircle, palette: severityPalette.critical }
};

function defaultRecsFor(category) {
  const c = category || "clause";
  return [
    `Request to narrow or clarify ${c} terms to tenant-favorable language`,
    `Add explicit safeguard for ${c} to prevent overbroad interpretation`
  ];
}

function getRiskLevel(score) {
  if ((score || 0) >= 70) return { level: "high", label: "HIGH RISK", color: "#EF4444", bg: "#FEE2E2" };
  if ((score || 0) >= 40) return { level: "medium", label: "MEDIUM RISK", color: "#F59E0B", bg: "#FEF3C7" };
  return { level: "low", label: "LOW RISK", color: "#10B981", bg: "#D1FAE5" };
}

/**
 * Build a safe fallback canonical_report payload from whatever scan data exists.
 * This is intentionally tolerant of partial/legacy scan shapes.
 */
function buildClientFallbackCanonicalReport({ scan, lease, requestId }) {
  const scanFull = scan?.scan_full || {};
  const canonical = scanFull?.canonical_report || {};

  const clausesExtracted = Array.isArray(scanFull?.clauses_extracted) ? scanFull.clauses_extracted : [];
  const existingClauseLedger =
    (Array.isArray(scanFull?.clause_ledger) ? scanFull.clause_ledger : []) ||
    (Array.isArray(canonical?.clause_ledger) ? canonical.clause_ledger : []);

  const keyTerms = scanFull?.key_terms || {};
  const existingIssues = canonical?.issues || scan?.flags || [];
  const existingRiskScore = canonical?.risk_score || scan?.risk_score || 0;
  const existingSummary = canonical?.summary || scan?.summary || "";

  // Build clause ledger
  let clauseLedger = [];
  if (Array.isArray(existingClauseLedger) && existingClauseLedger.length > 0) {
    clauseLedger = existingClauseLedger.map((c, idx) => ({
      clause_id: c?.clause_id || `CLAUSE-${idx + 1}`,
      heading: c?.heading || c?.title || null,
      full_text: c?.full_text || c?.raw_text || "",
      page: c?.page || c?.page_number || null,
      risk_level: c?.risk_level || "unknown"
    }));
  } else if (Array.isArray(clausesExtracted) && clausesExtracted.length > 0) {
    clauseLedger = clausesExtracted.map((c, idx) => ({
      clause_id: c?.clause_id || `CLAUSE-${idx + 1}`,
      heading: c?.heading || c?.title || null,
      full_text: c?.full_text || c?.raw_text || "",
      page: c?.page || c?.page_number || null,
      risk_level: "unknown"
    }));
  }

  // Build flags from existing issues
  const flags = (existingIssues || []).map((issue, idx) => ({
    clause_id: issue?.clause_id || issue?.clause_refs?.[0]?.clause_id || `ISSUE-${idx + 1}`,
    severity: issue?.severity || "medium",
    category: issue?.category || "Other Risks",
    title: issue?.title || "Issue detected",
    description: issue?.summary || issue?.description || issue?.why_it_matters || "Review required",
    explanation: issue?.why_it_matters || issue?.explanation || "",
    recommendation: Array.isArray(issue?.recommendations)
      ? issue.recommendations.join("\n")
      : (issue?.recommendation || "Review with legal counsel"),
    evidence: issue?.clause_refs?.[0]?.snippet || issue?.evidence || "Evidence not available"
  }));

  const nowIso = new Date().toISOString();

  const pdfPayload = {
    lease_address: keyTerms?.property_address || lease?.property_address || scan?.lease_id || "Lease Agreement",
    generated_date: nowIso,
    risk_score: existingRiskScore,
    summary: existingSummary || `${flags.length} issues detected (client-side fallback)`,
    key_terms: keyTerms,
    flags,
    clause_review: [],
    clause_ledger: clauseLedger,
    mappings: [],
    missing_clauses: [],
    coverage_summary: {
      total_clauses: clauseLedger.length,
      clauses_reviewed: 0,
      clauses_flagged: flags.length
    },
    fallback: true,
    fallback_reason: "client_materialize",
    materialized_at: nowIso,
    requestId
  };

  return {
    status: "ok",
    generatedAt: nowIso,
    pdfPayload,
    clause_ledger: clauseLedger,
    clause_review: [],
    issues: flags,
    fallback: true,
    fallback_reason: "client_materialize"
  };
}

export default function ReportFullInner({ scanId, leaseId, showDebug, forensicData }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbValidation, setDbValidation] = useState(null);
  const [loadSteps, setLoadSteps] = useState([]);
  const [user, setUser] = useState(null);
  const [lease, setLease] = useState(null);
  const [scan, setScan] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [materializing, setMaterializing] = useState(false);
  const materializeAttempted = useRef(false);
  const [showSelfTest, setShowSelfTest] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const startTime = Date.now();
    const steps = [];

    const logStep = (step, data) => {
      const entry = { step, timestamp: Date.now() - startTime, ...(data || {}) };
      steps.push(entry);
      // eslint-disable-next-line no-console
      console.log(`[${requestId}] ${step}:`, data || {});
      if (!cancelled) setLoadSteps((prev) => [...prev, entry]);
    };

    const timeoutId = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error(`[${requestId}] WATCHDOG TIMEOUT at ${Date.now() - startTime}ms`);
      if (!cancelled) {
        setError({
          step: "WATCHDOG",
          code: "TIMEOUT",
          message: "Report load timed out.",
          requestId,
          scanId,
          leaseId,
          elapsedMs: Date.now() - startTime,
          debugData: { steps }
        });
        setLoading(false);
      }
    }, 20000);

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        logStep("INIT", { scanId, leaseId, requestId });

        // STEP 1: user
        logStep("FETCH_USER_START");
        const userRes = await base44.auth.me();
        logStep("FETCH_USER_COMPLETE", { userId: userRes?.id });

        // STEP 2: lease (optional upfront)
        let leaseData = null;
        let leaseIdToUse = leaseId;
        if (leaseIdToUse) {
          logStep("FETCH_LEASE_START", { leaseId: leaseIdToUse });
          const leaseArr = await base44.entities.Lease.filter({ id: leaseIdToUse });
          leaseData = leaseArr?.[0] || null;
          logStep("FETCH_LEASE_COMPLETE", { found: !!leaseData });
        }

        // STEP 3: scan (always by scanId)
        logStep("FETCH_SCAN_START", { scanId });
        const scanArr = await base44.entities.LeaseScan.filter({ id: scanId });
        let scanData = scanArr?.[0] || null;
        logStep("FETCH_SCAN_COMPLETE", { found: !!scanData, returnedId: scanData?.id, lease_id: scanData?.lease_id });

        // If lease was not fetched yet, derive from scan
        if (!leaseData) {
          leaseIdToUse = scanData?.lease_id || leaseIdToUse;
          logStep("FETCH_LEASE_FROM_SCAN_START", { leaseId: leaseIdToUse });
          if (leaseIdToUse) {
            const leaseArr2 = await base44.entities.Lease.filter({ id: leaseIdToUse });
            leaseData = leaseArr2?.[0] || null;
          }
          logStep("FETCH_LEASE_FROM_SCAN_COMPLETE", { found: !!leaseData });
        }

        // STEP 4: validate presence
        logStep("VALIDATE_RECORDS_START");
        const validation = {
          scanFound: !!scanData,
          leaseFound: !!leaseData,
          scanId,
          leaseId
        };

        if (!leaseData) {
          const err = new Error(`LEASE_NOT_FOUND: No lease record for ID ${leaseId}`);
          err.code = "LEASE_NOT_FOUND";
          err.step = "FETCH_LEASE";
          throw err;
        }
        if (!scanData) {
          const err = new Error(`SCAN_NOT_FOUND: No scan record for ID ${scanId}`);
          err.code = "SCAN_NOT_FOUND";
          err.step = "FETCH_SCAN";
          throw err;
        }

        // STEP 5: ensure canonical_report.pdfPayload exists
        logStep("VALIDATE_REPORT_START");
        let canonical = scanData?.scan_full?.canonical_report || null;

        validation.hasCanonical = !!canonical;
        validation.reportStatus = canonical?.status || "unknown";
        validation.hasPdfPayload = !!canonical?.pdfPayload;

        if (!canonical || !canonical.pdfPayload) {
          // Client-side materialize exactly once
          if (!materializeAttempted.current) {
            materializeAttempted.current = true;
            logStep("CLIENT_MATERIALIZE_ATTEMPT", { scanId });

            try {
              if (!cancelled) setMaterializing(true);

              const scanFull = scanData?.scan_full || {};
              const hasSource =
                (Array.isArray(scanFull?.clause_ledger) && scanFull.clause_ledger.length > 0) ||
                (Array.isArray(scanFull?.clauses_extracted) && scanFull.clauses_extracted.length > 0) ||
                (Array.isArray(scanData?.flags) && scanData.flags.length > 0) ||
                !!scanData?.summary;

              if (!hasSource) {
                const err = new Error(
                  "NO_SOURCE_DATA: Scan has no clause_ledger/clauses_extracted/flags/summary to build a report"
                );
                err.code = "NO_SOURCE_DATA";
                err.step = "MATERIALIZE";
                err.debugData = { scanFullKeys: Object.keys(scanFull || {}) };
                throw err;
              }

              const canonicalReport = buildClientFallbackCanonicalReport({
                scan: scanData,
                lease: leaseData,
                requestId
              });

              // Persist fallback to LeaseScan using entities update (no functions)
              await base44.entities.LeaseScan.update(scanId, {
                risk_score: canonicalReport?.pdfPayload?.risk_score || 0,
                flags: canonicalReport?.pdfPayload?.flags || [],
                summary: canonicalReport?.pdfPayload?.summary || "",
                scan_full: {
                  ...scanFull,
                  canonical_report: canonicalReport,
                  materialized_at: new Date().toISOString(),
                  materialized_status: "ok_client"
                }
              });

              logStep("CLIENT_MATERIALIZE_PERSISTED", {
                clauseCount: canonicalReport?.pdfPayload?.clause_ledger?.length || 0,
                flagsCount: canonicalReport?.pdfPayload?.flags?.length || 0
              });

              // Re-fetch scan
              logStep("REFETCH_AFTER_CLIENT_MATERIALIZE");
              const refetched = await base44.entities.LeaseScan.filter({ id: scanId });
              const refetchedScan = refetched?.[0] || null;

              if (!refetchedScan) {
                const err = new Error("REFETCH_FAILED: Scan not found after materialization");
                err.code = "REFETCH_FAILED";
                err.step = "MATERIALIZE";
                throw err;
              }

              scanData = refetchedScan;
              canonical = refetchedScan?.scan_full?.canonical_report || null;

              validation.hasCanonical = !!canonical;
              validation.hasPdfPayload = !!canonical?.pdfPayload;
              validation.isFallback = canonical?.pdfPayload?.fallback || true;
              validation.materialized = true;
              validation.materializeMode = "client";
              logStep("REFETCH_SUCCESS", {
                hasPdfPayload: validation.hasPdfPayload,
                isFallback: validation.isFallback,
                mode: "client"
              });
            } finally {
              if (!cancelled) setMaterializing(false);
            }
          }
        }

        canonical = scanData?.scan_full?.canonical_report || canonical;

        if (!canonical || !canonical.pdfPayload) {
          const err = new Error(`REPORT_NOT_MATERIALIZED: No pdfPayload for scanId ${scanId}`);
          err.code = "REPORT_NOT_MATERIALIZED";
          err.step = "VALIDATE_REPORT";
          err.debugData = {
            hasCanonical: !!canonical,
            hasPdfPayload: !!canonical?.pdfPayload
          };
          throw err;
        }

        // Populate validation details for debug panel
        const pdfPayload = canonical.pdfPayload;
        validation.issuesCount = pdfPayload?.flags?.length || 0;
        validation.clausesTotal = pdfPayload?.clause_ledger?.length || 0;
        validation.clausesReviewed = (pdfPayload?.clause_review || []).length;
        validation.riskScore = pdfPayload?.risk_score || scanData?.risk_score || 0;
        logStep("VALIDATE_REPORT_COMPLETE", validation);
        if (!cancelled) setDbValidation(validation);

        // STEP 6: Build normalized report object for rendering
        logStep("BUILD_REPORT_START");

        const clauseReview = Array.isArray(pdfPayload.clause_review) ? pdfPayload.clause_review : [];
        const clauseLedger = Array.isArray(pdfPayload.clause_ledger) ? pdfPayload.clause_ledger : [];
        const flags = Array.isArray(pdfPayload.flags) ? pdfPayload.flags : [];
        const keyTerms = pdfPayload.key_terms || {};
        const mappings = Array.isArray(pdfPayload.mappings) ? pdfPayload.mappings : [];
        const missingClauses = Array.isArray(pdfPayload.missing_clauses) ? pdfPayload.missing_clauses : [];

        // Unify issues across flags + clause_review
        const byClause = {};
        clauseReview.forEach((r) => {
          if (!r?.risk_level || r.risk_level === "none") return;
          byClause[r.clause_id] = { review: r };
        });
        flags.forEach((f) => {
          const key = f?.clause_id || `flag-${f?.pattern_id || f?.title || Math.random()}`;
          if (!byClause[key]) byClause[key] = {};
          byClause[key].flag = f;
        });

        const unifiedIssuesRaw = Object.entries(byClause).map(([_, pair]) => {
          const r = pair.review;
          const f = pair.flag;
          const clause = clauseLedger.find((c) => c?.clause_id === (r?.clause_id || f?.clause_id));

          const severity = f?.severity || (r?.risk_level || "medium");
          const category = f?.category || (r?.mapped_catalog_ids?.[0] ? r.mapped_catalog_ids[0] : "clause");
          const title = f?.title || clause?.heading || (r?.risk_summary?.substring(0, 80) || "Issue identified");
          const impact = f?.description || r?.risk_summary || "Review required";
          const explanation = f?.explanation || r?.lawyer_view || r?.tenant_view || "";

          let recs = [];
          if (f?.recommendation) {
            recs = String(f.recommendation)
              .split(/[\n•\-–]/g)
              .map((s) => s.trim())
              .filter(Boolean);
          } else {
            if (r?.recommended_change && r.recommended_change !== "No change recommended") recs.push(r.recommended_change);
            if (r?.negotiation_tip && r.negotiation_tip !== "Accept as standard.") recs.push(r.negotiation_tip);
          }
          while (recs.length < 2) {
            defaultRecsFor(category).forEach((x) => {
              if (recs.length < 2) recs.push(x);
            });
          }

          let evidence = String(f?.evidence || clause?.full_text || "").substring(0, 240);
          if (!evidence || evidence.length < 10) evidence = `[Evidence not extracted for ${title}]`;

          return {
            clause_id: r?.clause_id || f?.clause_id || `unknown-${Math.random().toString(36).slice(2, 9)}`,
            category,
            severity,
            title,
            impact,
            explanation,
            recommendations: recs,
            evidence
          };
        });

        const order = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
        unifiedIssuesRaw.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));

        const seen = new Set();
        const unifiedIssues = unifiedIssuesRaw.filter((i) => {
          const key = `${i.clause_id}::${i.severity}::${i.category}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const flagsForDisplay = unifiedIssues.map((i) => ({
          severity: i.severity,
          category: i.category,
          title: i.title,
          description: i.impact,
          explanation: i.explanation,
          recommendation: i.recommendations.join("\n"),
          evidence: i.evidence,
          clause_id: i.clause_id
        }));

        const coverageSummary = canonical
          ? {
              total_clauses: clauseLedger.length,
              clauses_reviewed: clauseReview.length,
              clauses_flagged: clauseReview.filter((r) => r?.risk_level && r.risk_level !== "none").length,
              unmapped_clauses: mappings.filter(
                (m) => Array.isArray(m?.mapped_catalog_ids) && m.mapped_catalog_ids.includes("CAT-UNMAPPED")
              ).length,
              missing_expected_categories: missingClauses.length,
              mapped_count: canonical?.summary?.mapped_count,
              mapped_pct: canonical?.summary?.mapped_pct
            }
          : null;

        const normalized = {
          lease_address: pdfPayload.lease_address || leaseData?.property_address || "Lease Agreement",
          generated_date: pdfPayload.generated_date || new Date().toISOString(),
          risk_score: pdfPayload.risk_score || scanData?.risk_score || 0,
          summary: pdfPayload.summary || scanData?.summary || "",
          key_terms: keyTerms,
          flags: flagsForDisplay,
          clause_review: clauseReview,
          clause_ledger: clauseLedger,
          mappings,
          missing_clauses: missingClauses,
          coverage_summary: pdfPayload.coverage_summary || {},
          coverageSummary,
          isFallback: pdfPayload.fallback || false,
          fallbackReason: pdfPayload.fallback_reason
        };

        logStep("BUILD_REPORT_COMPLETE", { issuesCount: flagsForDisplay.length, clausesTotal: clauseLedger.length });

        if (!cancelled) {
          setUser(userRes);
          setLease(leaseData);
          setScan(scanData);
          setReportData(normalized);
          setLoading(false);
          logStep("RENDER_SUCCESS", { totalElapsed: Date.now() - startTime });
        }
      } catch (err) {
        logStep("ERROR_CAUGHT", {
          step: err?.step || "UNKNOWN",
          code: err?.code || "UNKNOWN",
          message: err?.message,
          elapsed: Date.now() - startTime
        });

        if (!cancelled) {
          setError({
            step: err?.step || "UNKNOWN",
            code: err?.code || "UNKNOWN",
            message: err?.message || "Failed to load report",
            stack: err?.stack,
            requestId,
            scanId,
            leaseId,
            elapsedMs: Date.now() - startTime,
            debugData: err?.debugData || {},
            steps
          });
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [scanId, leaseId]);

  // Compute colors and language (NO HOOKS BELOW)
  const isDarkMode = user?.theme === "dark";
  const language = user?.language || "en";
  const colors = isDarkMode
    ? { bg: "#1A1D1F", cardBg: "#2A2D30", textPrimary: "#ECEFED", textSecondary: "#A8ABAD", borderColor: "#3A3D40" }
    : { bg: "#F8FAFC", cardBg: "#FFFFFF", textPrimary: "#1A1D1F", textSecondary: "#64748b", borderColor: "#E5E7EB" };

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#0C3B2E" }} />
          <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            {materializing ? "Materializing report..." : "Loading report..."}
          </p>
          {materializing && (
            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <Wrench className="w-4 h-4" />
              <span>Building report from scan data</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorPanel error={error} colors={colors} />;
  }

  if (!user || !lease || !scan || !reportData) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Error Loading Report
              </h2>
              <p className="mb-6" style={{ color: colors.textSecondary }}>
                Failed to load report data.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const riskLevel = getRiskLevel(reportData.risk_score);
  const totalClauses = (reportData.clause_ledger || []).length;
  const risksCount = (reportData.clause_review || []).filter((r) => r?.risk_level && r.risk_level !== "none").length;

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const response = await base44.functions.invoke("generateLeaseReportPDF", { scanId, language });
      if (response?.data?.pdf_url) window.open(response.data.pdf_url, "_blank");
      else alert("PDF generation failed.");
    } catch (err) {
      alert("PDF export failed: " + (err?.message || "Unknown error"));
    } finally {
      setExportingPdf(false);
    }
  };

  const t = {
    en: {
      allIssues: "Issues Requiring Attention",
      clauseAnalysis: "Clause-by-Clause Analysis",
      noIssues: "No issues found",
      property: "Property",
      summary: "Summary",
      exportPdf: "Export PDF",
      viewLease: "View Original Lease",
      clauseCoverage: "Clause Coverage"
    },
    th: {
      allIssues: "ปัญหาที่ต้องให้ความสนใจ",
      clauseAnalysis: "การวิเคราะห์ทีละข้อ",
      noIssues: "ไม่พบปัญหา",
      property: "ทรัพย์สิน",
      summary: "สรุป",
      exportPdf: "ส่งออก PDF",
      viewLease: "ดูสัญญาต้นฉบับ",
      clauseCoverage: "ความครอบคลุม"
    }
  };
  const strings = t[language] || t.en;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg, paddingBottom: "100px", fontFamily: 'Noto Sans Thai, Inter, system-ui' }}>
      <div className="max-w-4xl mx-auto">
        {showDebug && (
          <Card className="mb-4 border-2 border-emerald-500" style={{ backgroundColor: "#D1FAE5" }}>
            <CardContent className="p-4">
              <h3 className="font-bold text-emerald-800 mb-2">Forensic Debug Panel</h3>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs font-bold text-emerald-700 mb-1">URL INFO</div>
                  <div className="bg-white p-2 rounded text-xs font-mono">
                    <div>Path: {forensicData?.pathname || "N/A"}</div>
                    <div>Search: {forensicData?.search || "(empty)"}</div>
                    <div>Editor: {String(forensicData?.isEditorPreview)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700 mb-1">PARAMS RESOLVED</div>
                  <div className="bg-white p-2 rounded text-xs font-mono">
                    <div>scanId: {scanId}</div>
                    <div>leaseId: {leaseId}</div>
                  </div>
                </div>
              </div>

              <div className="text-xs font-bold text-emerald-700 mb-1">DB VALIDATION</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                {dbValidation ? JSON.stringify(dbValidation, null, 2) : "Loading..."}
              </pre>

              <div className="text-xs font-bold text-emerald-700 mb-1 mt-3">REPORT DATA</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
{`Risk Score: ${reportData.risk_score}
Total Clauses: ${totalClauses}
Risks: ${risksCount}
Flags: ${(reportData.flags || []).length}
Has PDF Payload: ${!!(scan?.scan_full?.canonical_report?.pdfPayload)}
Materialized Status: ${scan?.scan_full?.materialized_status || "(none)"}`}
              </pre>

              <div className="text-xs font-bold text-emerald-700 mb-1 mt-3">LOAD STEPS</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                {loadSteps.map((s) => `[${s.timestamp}ms] ${s.step}`).join("\n")}
              </pre>

              {/* Diagnostics (Self-Test) */}
              {(() => {
                const selfTest = scan?.scan_full?.self_test;
                if (!selfTest) return null;
                return (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-700">Diagnostics (Self-Test)</div>
                      <Button variant="outline" size="sm" onClick={() => setShowSelfTest(!showSelfTest)}>
                        {showSelfTest ? 'Hide' : 'Show'}
                      </Button>
                    </div>

                    {!selfTest.overall_pass && (
                      <div className="mt-3 p-3 rounded-md border-2 border-red-500 bg-red-50 text-red-800 text-sm">
                        Scan diagnostics failed. This indicates missing coverage or mapping. Please rescan or contact support.
                      </div>
                    )}

                    {showSelfTest && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-2 rounded border bg-white">
                          <div className="font-semibold mb-1">Ledger Integrity</div>
                          <div>clauses_extracted_len: {selfTest.clause_ledger_integrity.clauses_extracted_len}</div>
                          <div>clause_ledger_len: {selfTest.clause_ledger_integrity.clause_ledger_len}</div>
                          <div>pass_same_length: {String(selfTest.clause_ledger_integrity.pass_same_length)}</div>
                        </div>
                        <div className="p-2 rounded border bg-white">
                          <div className="font-semibold mb-1">Multi-Risk Expansion</div>
                          <div>total_risk_items_from_ledger: {selfTest.multi_risk_expansion.total_risk_items_from_ledger}</div>
                          <div>issues_validated_len: {selfTest.multi_risk_expansion.issues_validated_len}</div>
                          <div>pass_equal_counts: {String(selfTest.multi_risk_expansion.pass_equal_counts)}</div>
                        </div>
                        <div className="p-2 rounded border bg-white">
                          <div className="font-semibold mb-1">Recommendations</div>
                          <div>issues_missing_actions: {selfTest.recommendations_guaranteed.issues_missing_actions.length}</div>
                          <div>pass_all_have_actions: {String(selfTest.recommendations_guaranteed.pass_all_have_actions)}</div>
                        </div>
                        <div className="p-2 rounded border bg-white">
                          <div className="font-semibold mb-1">Overall</div>
                          <div>overall_pass: {String(selfTest.overall_pass)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button onClick={handleExportPdf} disabled={exportingPdf} style={{ backgroundColor: "#0C3B2E", color: "#fff" }}>
            {exportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {strings.exportPdf}
              </>
            )}
          </Button>
        </div>

        <Card className="border-none shadow-xl mb-6 overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ backgroundColor: (() => {
            const sev = highestSeverity((reportData.flags||[]).map(f=>f.severity));
            return SEVERITY_CONFIG[sev]?.palette?.border || '#0C3B2E';
          })() }}>
            <div className="text-white">
              <CardTitle className="text-2xl font-bold mb-3">Full Lease Analysis Report</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  className="text-2xl px-4 py-2 font-bold"
                  style={{ backgroundColor: riskLevel.bg, color: riskLevel.color, border: `2px solid ${riskLevel.color}` }}
                >
                  {reportData.risk_score || 0}/100
                </Badge>
                <Badge className="text-lg px-4 py-2 font-bold" style={{ backgroundColor: "#FFFFFF", color: riskLevel.color }}>
                  {riskLevel.label}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {lease.property_address && (
              <div className="mb-4">
                <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.property}:
                </span>
                <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                  {lease.property_address}
                </p>
              </div>
            )}

            <div className="mb-4">
              <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                {strings.summary}:
              </span>
              <p className="mt-1" style={{ color: colors.textPrimary }}>
                {reportData.summary || "No summary available."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              {strings.allIssues} ({(reportData.flags || []).length})
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {(reportData.flags || []).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p style={{ color: colors.textSecondary }}>{strings.noIssues}</p>
              </div>
            ) : (
              (reportData.flags || []).map((flag, idx) => {
                const severityConfig = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.medium;
                const Icon = severityConfig.icon;
                const recText = String(flag.recommendation || "");
                const recLines = recText.split(/[\n•\-–]/g).map((s) => s.trim()).filter(Boolean);

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border-2"
                    style={{ backgroundColor: isDarkMode ? "#353A3D" : "#F8FAFC", borderColor: isDarkMode ? "#3A3D40" : "#E5E7EB" }}
                  >
                    <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                          <Badge className={`border flex items-center gap-1`} style={{
                            backgroundColor: severityConfig.palette.badgeBg,
                            color: severityConfig.palette.badgeText,
                            borderColor: severityConfig.palette.border
                          }}>
                            <Icon className="w-3 h-3" />
                            {severityConfig.label}
                          </Badge>
                        {flag.category && <Badge variant="outline">{flag.category}</Badge>}
                        {flag.clause_id && <Badge variant="outline">{flag.clause_id}</Badge>}
                      </div>
                    </div>

                    <h4 className="text-base font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {flag.title || flag.description}
                    </h4>

                    {flag.description && flag.title && (
                      <p className="text-sm mb-3" style={{ color: colors.textPrimary }}>
                        {flag.description}
                      </p>
                    )}

                    <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#1F2937" : "#F3F4F6" }}>
                      <p className="text-xs font-bold text-gray-600 mb-1">Evidence:</p>
                      <p className="text-sm" style={{ color: colors.textPrimary }}>
                        {flag.evidence}
                      </p>
                    </div>

                    {flag.explanation && (
                      <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#1F2937" : "#FEF3C7" }}>
                        <p className="text-xs font-bold text-amber-700 mb-1">Why this matters:</p>
                        <p className="text-sm" style={{ color: colors.textPrimary }}>
                          {flag.explanation}
                        </p>
                      </div>
                    )}

                    {recLines.length > 0 ? (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#1F2937" : "#ECFDF5" }}>
                        <p className="text-xs font-bold text-emerald-700 mb-2">Recommendations:</p>
                        <ul className="space-y-1">
                          {recLines.map((line, i) => (
                            <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textPrimary }}>
                              <span className="text-emerald-600">•</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      severityConfig.label !== 'NO RISK' && (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#1F2937" : "#FEF3C7" }}>
                          <p className="text-xs font-bold text-amber-700 mb-1">Recommendations unavailable (data error) — rescan recommended</p>
                        </div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-700" />
              {strings.clauseAnalysis} ({totalClauses})
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {(reportData.clause_ledger || []).map((c, idx) => {
              const review = (reportData.clause_review || []).find((r) => r?.clause_id === c?.clause_id) || {};
              const isRisk = review?.risk_level && review.risk_level !== "none";
              const sev = isRisk ? (SEVERITY_CONFIG[review.risk_level] || SEVERITY_CONFIG.medium) : SEVERITY_CONFIG.none;
              const Icon = sev.icon;

              let snippet = String(c?.full_text || "").slice(0, 240);
              if (!snippet || snippet.length < 10) snippet = `[Snippet not extracted for ${c?.heading || c?.clause_id || idx}]`;

              const recs = [];
              if (isRisk) {
                if (review?.recommended_change && review.recommended_change !== "No change recommended") recs.push(review.recommended_change);
                if (review?.negotiation_tip && review.negotiation_tip !== "Accept as standard.") recs.push(review.negotiation_tip);
                const cat = (Array.isArray(review?.mapped_catalog_ids) ? review.mapped_catalog_ids[0] : review.category) || "clause";
                while (recs.length < 2) defaultRecsFor(cat).forEach((x) => { if (recs.length < 2) recs.push(x); });
              }

              return (
                <div
                  key={c?.clause_id || idx}
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: isDarkMode ? "#353A3D" : "#FFFFFF", borderColor: colors.borderColor }}
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={`border flex items-center gap-1`} style={{
                            backgroundColor: SEVERITY_CONFIG[isRisk ? review.risk_level : 'none'].palette.badgeBg,
                            color: SEVERITY_CONFIG[isRisk ? review.risk_level : 'none'].palette.badgeText,
                            borderColor: SEVERITY_CONFIG[isRisk ? review.risk_level : 'none'].palette.border
                          }}>
                        <Icon className="w-3 h-3" />
                        {isRisk ? (String(review.risk_level || "").toUpperCase() + " RISK") : "NO RISK"}
                      </Badge>
                    {review?.mapped_catalog_ids?.[0] && <Badge variant="outline">{review.mapped_catalog_ids[0]}</Badge>}
                    {c?.clause_id && <Badge variant="outline">{c.clause_id}</Badge>}
                  </div>

                  <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {c?.heading || c?.clause_id || `Clause ${idx + 1}`}
                  </h4>

                  <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#1F2937" : "#F3F4F6", fontFamily: 'Noto Sans Thai, Inter, system-ui' }}>
                    <p className="text-xs font-bold text-gray-600 mb-1">Snippet:</p>
                    <p className="text-sm" style={{ color: colors.textPrimary }}>
                      {snippet}
                    </p>
                  </div>

                  <div className="mb-1">
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {isRisk ? "Rationale" : "Rationale"}
                    </p>
                    <p className="text-sm" style={{ color: colors.textPrimary }}>
                      {review?.risk_summary || (isRisk ? "Review required" : "Accept as standard.")}
                    </p>
                  </div>

                  {isRisk ? (
                    recs.length > 0 ? (
                      <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#1F2937" : "#ECFDF5" }}>
                        <p className="text-xs font-bold text-emerald-700 mb-2">Recommendations:</p>
                        <ul className="space-y-1">
                          {recs.map((line, i) => (
                            <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textPrimary }}>
                              <span className="text-emerald-600">•</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? "#1F2937" : "#FEF3C7" }}>
                        <p className="text-xs font-bold text-amber-700">Recommendations unavailable (data error) — rescan recommended</p>
                      </div>
                    )
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {reportData.coverageSummary && (
          <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle>{strings.clauseCoverage}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold" style={{ color: colors.textSecondary }}>Total:</span>{" "}
                  <span style={{ color: colors.textPrimary }}>{reportData.coverageSummary.total_clauses}</span>
                </div>
                <div>
                  <span className="font-semibold" style={{ color: colors.textSecondary }}>Reviewed:</span>{" "}
                  <span style={{ color: colors.textPrimary }}>{reportData.coverageSummary.clauses_reviewed}</span>
                </div>
                <div>
                  <span className="font-semibold" style={{ color: colors.textSecondary }}>Flagged:</span>{" "}
                  <span style={{ color: colors.textPrimary }}>{reportData.coverageSummary.clauses_flagged}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {lease.file_url && (
            <Button variant="outline" onClick={() => window.open(lease.file_url, "_blank")} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              {strings.viewLease}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}