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


function toSeverity(riskLevel) {
  const rl = String(riskLevel || "").toLowerCase();
  if (rl === "critical") return "critical";
  if (rl === "high") return "high";
  if (rl === "medium") return "medium";
  if (rl === "low") return "low";
  if (rl === "none" || rl === "no_risk") return "none";
  return "medium";
}


function safeArray(x) {
  return Array.isArray(x) ? x : [];
}


function deriveIssuesValidatedFromLedger(ledger) {
  const l = safeArray(ledger);
  const hasRiskItems = l.some((c) => Array.isArray(c?.risk_items) && c.risk_items.length > 0);


  if (hasRiskItems) {
    return l.flatMap((c) =>
      safeArray(c.risk_items).map((r) => ({
        clause_id: c.clause_id,
        clause_number: c.clause_number,
        page_number: c.page_number,
        risk_level: r.risk_level,
        taxonomy_code: r.taxonomy_code,
        title: r.title,
        rationale: r.rationale,
        recommended_actions: safeArray(r.recommended_actions),
        confidence: r.confidence
      }))
    );
  }


  // legacy-ish: one risk per clause
  return l
    .filter((c) => c?.risk_level && String(c.risk_level).toUpperCase() !== "NO_RISK")
    .map((c) => ({
      clause_id: c.clause_id,
      clause_number: c.clause_number,
      page_number: c.page_number,
      risk_level: c.risk_level,
      taxonomy_code: c.taxonomy_code || "Unclassified",
      title: c.title || c.heading || `Clause ${c.clause_number || ""}`.trim(),
      rationale: c.rationale || c.risk_summary || "",
      recommended_actions: safeArray(c.recommended_actions),
      confidence: c.confidence || "LOW"
    }));
}


/**
 * MATERIALIZE RESOLUTION:
 * Prefer scan_full.* (new), then scan_full.canonical_report.pdfPayload (legacy report),
 * then scan_full.canonical_report.* (legacy objects).
 *
 * Returns a "pdfPayload-like" object that this component already expects downstream.
 */
function resolvePdfPayload({ scanData, leaseData, requestId }) {
  const scanFull = scanData?.scan_full || {};
  const canonical = scanFull?.canonical_report || {};
  const canonicalPdf = canonical?.pdfPayload || null;


  // NEW PIPELINE (preferred)
  const clausesExtracted =
    scanFull?.clauses_extracted ??
    canonical?.clauses_extracted ??
    [];
  const clauseLedger =
    scanFull?.clause_ledger ??
    canonical?.clause_ledger ??
    [];
  let issuesValidated =
    scanFull?.issues_validated ??
    canonical?.issues_validated ??
    [];


  // If we have a canonical pdfPayload, we can build from it even if scan_full keys are missing.
  if ((!safeArray(clauseLedger).length || !safeArray(issuesValidated).length) && canonicalPdf) {
    const pdfLedger = safeArray(canonicalPdf.clause_ledger);
    const pdfFlags = safeArray(canonicalPdf.flags);


    // If ledger is missing, use the pdf ledger
    const resolvedLedger = safeArray(clauseLedger).length ? clauseLedger : pdfLedger;


    // issues_validated: if missing, derive from ledger risk_items or fallback to pdf flags
    let resolvedIssues = safeArray(issuesValidated);
    if (!resolvedIssues.length && safeArray(resolvedLedger).length) {
      resolvedIssues = deriveIssuesValidatedFromLedger(resolvedLedger);
    }
    if (!resolvedIssues.length && pdfFlags.length) {
      // map pdf flags to issues_validated-ish
      resolvedIssues = pdfFlags.map((f) => ({
        clause_id: f.clause_id,
        clause_number: null,
        page_number: null,
        risk_level: f.severity,
        taxonomy_code: f.category || "Unclassified",
        title: f.title || "Issue detected",
        rationale: f.description || f.explanation || "",
        recommended_actions: String(f.recommendation || "")
          .split(/[\n•\-–]/g)
          .map((s) => s.trim())
          .filter(Boolean),
        confidence: "LOW"
      }));
    }


    // Build a pdfPayload-like shape
    const nowIso = new Date().toISOString();
    return {
      lease_address:
        canonicalPdf.lease_address ||
        scanFull?.key_terms?.property_address ||
        leaseData?.property_address ||
        scanData?.lease_id ||
        "Lease Agreement",
      generated_date: canonicalPdf.generated_date || nowIso,
      risk_score: canonicalPdf.risk_score || scanData?.risk_score || 0,
      summary: canonicalPdf.summary || scanData?.summary || "",
      key_terms: canonicalPdf.key_terms || scanFull?.key_terms || {},
      // IMPORTANT: downstream code expects flags[]; we will rebuild flags from issues_validated
      // so risks + recs always exist.
      flags: [],
      clause_review: safeArray(canonicalPdf.clause_review),
      clause_ledger: resolvedLedger,
      mappings: safeArray(canonicalPdf.mappings),
      missing_clauses: safeArray(canonicalPdf.missing_clauses),
      coverage_summary: canonicalPdf.coverage_summary || {},
      fallback: true,
      fallback_reason: "client_materialize_from_canonical_pdf",
      materialized_at: nowIso,
      requestId,
      __resolved: {
        clauses_extracted: safeArray(clausesExtracted),
        clause_ledger: safeArray(resolvedLedger),
        issues_validated: safeArray(resolvedIssues),
        flags: scanFull?.flags || canonical?.flags || {},
        summaryObj: scanFull?.summary || canonical?.summary || null,
        usedCanonicalPdf: true
      }
    };
  }


  // If we have new pipeline objects, derive issues if needed
  if (!safeArray(issuesValidated).length && safeArray(clauseLedger).length) {
    issuesValidated = deriveIssuesValidatedFromLedger(clauseLedger);
  }


  const nowIso = new Date().toISOString();
  return {
    lease_address:
      scanFull?.key_terms?.property_address ||
      leaseData?.property_address ||
      scanData?.lease_id ||
      "Lease Agreement",
    generated_date: nowIso,
    risk_score: scanData?.risk_score || 0,
    summary: scanData?.summary || "",
    key_terms: scanFull?.key_terms || {},
    flags: [],
    clause_review: [],
    clause_ledger: safeArray(clauseLedger),
    mappings: [],
    missing_clauses: [],
    coverage_summary: {
      total_clauses: safeArray(clauseLedger).length,
      clauses_reviewed: 0,
      clauses_flagged: safeArray(issuesValidated).length
    },
    fallback: false,
    requestId,
    __resolved: {
      clauses_extracted: safeArray(clausesExtracted),
      clause_ledger: safeArray(clauseLedger),
      issues_validated: safeArray(issuesValidated),
      flags: scanFull?.flags || canonical?.flags || {},
      summaryObj: scanFull?.summary || canonical?.summary || null,
      usedCanonicalPdf: false
    }
  };
}


function issuesValidatedToFlags(issuesValidated, clauseLedger) {
  const ledger = safeArray(clauseLedger);
  const byId = new Map(ledger.map((c) => [c?.clause_id, c]));
  return safeArray(issuesValidated).map((i, idx) => {
    const sev = toSeverity(i?.risk_level);
    const clause = byId.get(i?.clause_id);
    const evidence =
      String(i?.rationale || "").slice(0, 240) ||
      String(clause?.text || clause?.full_text || "").slice(0, 240) ||
      `[Evidence not extracted for ${i?.title || `Issue ${idx + 1}`}]`;


    const recs = safeArray(i?.recommended_actions).filter(Boolean);
    const category = i?.taxonomy_code || "Other Risks";


    const ensureRecs = [...recs];
    while (ensureRecs.length < 2) {
      defaultRecsFor(category).forEach((x) => {
        if (ensureRecs.length < 2) ensureRecs.push(x);
      });
    }


    return {
      clause_id: i?.clause_id || `unknown-${Math.random().toString(36).slice(2, 9)}`,
      severity: sev === "no_risk" ? "none" : sev,
      category,
      title: i?.title || "Issue detected",
      description: i?.rationale || "Review required",
      explanation: "",
      recommendation: ensureRecs.join("\n"),
      evidence
    };
  });
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
  const [showDebugAdmin, setShowDebugAdmin] = useState(false);


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


        // STEP 2: lease
        logStep("FETCH_LEASE_START", { leaseId });
        const leaseArr = await base44.entities.Lease.filter({ id: leaseId });
        const leaseData = leaseArr?.[0] || null;
        logStep("FETCH_LEASE_COMPLETE", { found: !!leaseData });


        // STEP 3: scan
        logStep("FETCH_SCAN_START", { scanId });
        const scanArr = await base44.entities.LeaseScan.filter({ id: scanId });
        let scanData = scanArr?.[0] || null;
        logStep("FETCH_SCAN_COMPLETE", { found: !!scanData });


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


        // STEP 5: MATERIALIZE - Cloudflare SSoT
        logStep("MATERIALIZE_START", {});
        if (!cancelled) setMaterializing(true);
        const scanFull = scanData?.scan_full ?? null;
        const scanFullKeys = scanFull ? Object.keys(scanFull) : [];
        console.log('[MATERIALIZE] scan_full keys:', scanFullKeys);
        validation.scanFullKeys = scanFullKeys;
        if (!scanFull) {
          const err = new Error('NO_SOURCE_DATA');
          err.code = 'NO_SOURCE_DATA';
          err.step = 'MATERIALIZE';
          throw err;
        }
        if (!cancelled) setMaterializing(false);
        if (!cancelled) setDbValidation(validation);
        if (!cancelled) {
          setUser(userRes);
          setLease(leaseData);
          setScan(scanData);
          setReportData(scanFull);
          setLoading(false);
          logStep('RENDER_SUCCESS', { totalElapsed: Date.now() - startTime });
        }
        return;

        // STEP 6: Build normalized report object for rendering (keep rest of file unchanged)
        logStep("BUILD_REPORT_START");


        // We will feed downstream logic with a "pdfPayload-like" structure
        const normalizedPdfPayload = {
          ...pdfPayload,
          flags: derivedFlags,
          clause_review: [], // not required; downstream unifies using flags anyway
          clause_ledger: resolvedLedger
        };


        const clauseReview = Array.isArray(normalizedPdfPayload.clause_review) ? normalizedPdfPayload.clause_review : [];
        const clauseLedger = Array.isArray(normalizedPdfPayload.clause_ledger) ? normalizedPdfPayload.clause_ledger : [];
        const flags = Array.isArray(normalizedPdfPayload.flags) ? normalizedPdfPayload.flags : [];
        const keyTerms = normalizedPdfPayload.key_terms || {};
        const mappings = Array.isArray(normalizedPdfPayload.mappings) ? normalizedPdfPayload.mappings : [];
        const missingClauses = Array.isArray(normalizedPdfPayload.missing_clauses) ? normalizedPdfPayload.missing_clauses : [];


        // Unify issues across flags + clause_review (existing logic kept)
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


          let evidence = String(f?.evidence || clause?.full_text || clause?.text || "").substring(0, 240);
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


        const coverageSummary = {
          total_clauses: clauseLedger.length,
          clauses_reviewed: clauseReview.length,
          clauses_flagged: flagsForDisplay.length,
          unmapped_clauses: 0,
          missing_expected_categories: missingClauses.length
        };


        const normalized = {
          lease_address: normalizedPdfPayload.lease_address || leaseData?.property_address || "Lease Agreement",
          generated_date: normalizedPdfPayload.generated_date || new Date().toISOString(),
          risk_score: normalizedPdfPayload.risk_score || scanData?.risk_score || 0,
          summary: normalizedPdfPayload.summary || scanData?.summary || "",
          key_terms: keyTerms,
          flags: flagsForDisplay,
          clause_review: clauseReview,
          clause_ledger: clauseLedger,
          mappings,
          missing_clauses: missingClauses,
          coverage_summary: normalizedPdfPayload.coverage_summary || {},
          coverageSummary,
          isFallback: normalizedPdfPayload.fallback || false,
          fallbackReason: normalizedPdfPayload.fallback_reason
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
        if (!cancelled) {
          setMaterializing(false);
          setLoading(false);
        }
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

  // Cloudflare SSoT view model
const sf = reportData || {};
  const meta = sf.meta || {};
  const topRisks = Array.isArray(sf.summary?.top_risks) ? sf.summary.top_risks : [];
  const clauses = Array.isArray(sf.clauses) ? sf.clauses : [];
  const textTooShort = (meta.text_length || 0) < 500;


  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{ backgroundColor: colors.bg, paddingBottom: "100px", fontFamily: "Noto Sans Thai, Inter, system-ui" }}
    >
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
                        {showSelfTest ? "Hide" : "Show"}
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


        {/* Admin/Dev Debug Accordion (visible to admin/dev) */}
        {(() => {
          const role = (user?.role || user?.access_level || '').toLowerCase();
          const isAdminLike = ['admin','super_admin','va'].includes(role) || showDebug;
          if (!isAdminLike) return null;
          const nonNoneRiskCount = clauses.filter(c => (c?.risk_level || 'none') !== 'none').length;
          return (
            <Card className="mb-4 border-2" style={{ borderColor: colors.borderColor, backgroundColor: isDarkMode ? '#14221c' : '#F0FDF4' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold" style={{ color: colors.textPrimary }}>Admin Debug</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowDebugAdmin(v => !v)}> {showDebugAdmin ? 'Hide' : 'Show'} </Button>
                </div>
                {showDebugAdmin && (
                  <div className="mt-3 text-sm" style={{ color: colors.textPrimary }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      <div>text_length: <strong>{meta.text_length || 0}</strong></div>
                      <div>chunks: <strong>{meta.chunks || 0}</strong></div>
                      <div>clauses.length: <strong>{clauses.length}</strong></div>
                      <div>nonNoneRiskCount: <strong>{nonNoneRiskCount}</strong></div>
                      <div>top_risks.length: <strong>{topRisks.length}</strong></div>
                      <div>risk_score: <strong>{sf.risk_score ?? 0}</strong></div>
                    </div>
                    <div className="mb-3">
                      <div className="font-semibold mb-1">Top Risks (first 2)</div>
                      <ul className="list-disc pl-5">
                        {topRisks.slice(0,2).map((r,i)=>(<li key={i}><strong>{r.title}</strong> — {r.severity}: {r.why}</li>))}
                        {topRisks.length === 0 && <li>—</li>}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Clauses (first 2)</div>
                      <ul className="list-disc pl-5">
                        {clauses.slice(0,2).map((c,i)=>(<li key={c.clause_id || i}><strong>{c.title || `Clause ${c.clause_id || i+1}`}</strong> — risk_level: {c.risk_level || 'none'}</li>))}
                        {clauses.length === 0 && <li>—</li>}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Existing JSX BELOW — unchanged */}
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
          <CardHeader
            style={{
              backgroundColor: (() => {
                const sev = highestSeverity((reportData.flags || []).map((f) => f.severity));
                return SEVERITY_CONFIG[sev]?.palette?.border || "#0C3B2E";
              })()
            }}
          >
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
            {/* Error banner if extraction failed / empty */}
            {(clauses.length === 0 || textTooShort) && (
              <div className="mb-4 p-4 rounded-lg border-2" style={{ backgroundColor: isDarkMode ? '#3A2626' : '#FEF2F2', borderColor: '#EF4444' }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: '#B91C1C' }}>Extraction failed / empty text</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      text_length={meta.text_length || 0}, chunks={meta.chunks || 0}
                    </p>
                    {Array.isArray(sf.debug?.warnings) && sf.debug.warnings.length > 0 && (
                      <ul className="list-disc pl-6 mt-2 text-sm" style={{ color: colors.textSecondary }}>
                        {sf.debug.warnings.map((w, i) => (<li key={i}>{String(w)}</li>))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Property */}
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

            {/* Executive summary */}
            <div className="mb-6">
              <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                {strings.summary}:
              </span>
              <p className="mt-1" style={{ color: colors.textPrimary }}>
                {sf.summary?.executive_summary || 'No summary available.'}
              </p>
            </div>

            {/* Top risks */}
            {topRisks.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-2" style={{ color: colors.textPrimary }}>Top Risks</h3>
                <div className="grid gap-3">
                  {topRisks.map((r, idx) => (
                    <div key={idx} className="p-4 rounded-lg border" style={{ borderColor: colors.borderColor }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold" style={{ color: colors.textPrimary }}>{r.title}</div>
                        <span className="text-xs px-2 py-1 rounded-full" style={{
                          backgroundColor: ({ low:'#E0F2FE', med:'#FEF3C7', high:'#FEE2E2', critical:'#FECACA' }[r.severity] || '#E5E7EB'),
                          color: ({ low:'#0369A1', med:'#92400E', high:'#B91C1C', critical:'#991B1B' }[r.severity] || colors.textSecondary)
                        }}>{r.severity}</span>
                      </div>
                      <div className="text-sm" style={{ color: colors.textSecondary }}>
                        {r.why}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clauses table */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold" style={{ color: colors.textPrimary }}>Clauses</h3>
              <div className="text-sm" style={{ color: colors.textSecondary }}>
                text_length: {meta.text_length || 0} • chunks: {meta.chunks || 0} • count: {clauses.length}
              </div>
            </div>
            <div className="overflow-x-auto border rounded-lg" style={{ borderColor: colors.borderColor }}>
              <table className="min-w-full text-sm">
                <thead style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                  <tr>
                    <th className="text-left p-3">Title</th>
                    <th className="text-left p-3">Risk</th>
                    <th className="text-left p-3">Plain English</th>
                    <th className="text-left p-3">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {clauses.map((c, i) => (
                    <tr key={c.clause_id || i} className="border-t" style={{ borderColor: colors.borderColor }}>
                      <td className="align-top p-3" style={{ color: colors.textPrimary }}>
                        <div className="font-semibold">{c.title || `Clause ${c.clause_id || i+1}`}</div>
                      </td>
                      <td className="align-top p-3">
                        <span className="text-xs px-2 py-1 rounded-full" style={{
                          backgroundColor: ({ none:'#E5E7EB', low:'#E0F2FE', med:'#FEF3C7', high:'#FEE2E2', critical:'#FECACA' }[c.risk_level] || '#E5E7EB'),
                          color: ({ none:'#374151', low:'#0369A1', med:'#92400E', high:'#B91C1C', critical:'#991B1B' }[c.risk_level] || colors.textSecondary)
                        }}>{c.risk_level || 'none'}</span>
                      </td>
                      <td className="align-top p-3" style={{ color: colors.textSecondary }}>
                        {c.plain_english || c.risk_summary || '—'}
                      </td>
                      <td className="align-top p-3" style={{ color: colors.textSecondary }}>
                        {c.recommendation?.fix || '—'}
                      </td>
                    </tr>
                  ))}
                  {clauses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center" style={{ color: colors.textSecondary }}>No clauses parsed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>


        {/* The rest of your JSX is unchanged and will work with reportData.flags and reportData.clause_ledger */}
        {/* ... (KEEP YOUR EXISTING JSX BELOW EXACTLY AS YOU HAVE IT) ... */}


      </div>
    </div>
  );
}