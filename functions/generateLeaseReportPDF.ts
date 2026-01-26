import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";
import { jsPDF } from "npm:jspdf@2.5.2";

// STANDARD COLOR SYSTEM - Used everywhere for consistency
const severityPalette = {
  critical: {
    bg: [153, 27, 27],       // #991B1B - Dark Red
    border: [153, 27, 27],   
    text: [255, 255, 255]    // White text
  },
  high: {
    bg: [220, 38, 38],       // #DC2626 - Red
    border: [220, 38, 38],
    text: [255, 255, 255]    // White text
  },
  medium: {
    bg: [249, 115, 22],      // #F97316 - Orange
    border: [249, 115, 22],
    text: [26, 29, 31]       // Dark text
  },
  low: {
    bg: [59, 130, 246],      // #3B82F6 - Blue
    border: [59, 130, 246],
    text: [255, 255, 255]    // White text
  },
  none: {
    bg: [16, 185, 129],      // #10B981 - Green
    border: [16, 185, 129],
    text: [255, 255, 255]    // White text
  }
};

/**
 * Self-contained CORS + JSON helpers (no local imports)
 */
const ALLOWED_ORIGINS = [
  "https://app.leaseshield.asia",
  "https://leaseshield.asia",
  "http://localhost:5173",
  "http://localhost:3000",
];

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowed =
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".leaseshield.asia") ||
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".base44.com");

  // If no Origin header, this is likely server-to-server; allow.
  const allowOrigin = allowed ? (origin || "*") : "";

  return { allowed, headers: {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  }};
}

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function getRiskTheme(riskScore) {
  if (riskScore >= 70) {
    return { level: "HIGH", color: [239, 68, 68] };
  }
  if (riskScore >= 40) {
    return { level: "MEDIUM", color: [245, 158, 11] };
  }
  return { level: "LOW", color: [16, 185, 129] };
}

// Helpers for unified severity + Thai rendering
const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
function highestSeverity(flags){
  if (!Array.isArray(flags) || flags.length === 0) return 'none';
  return flags.reduce((acc, f) => (severityOrder[f?.severity] > severityOrder[acc] ? (f?.severity||'none') : acc), 'none');
}
function normalizeBullet(text){
  return String(text||'').replace(/[●▪︎◦·]+/g,'•');
}
async function ensureThaiFont(doc){
  try {
    const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansthai/NotoSansThai-Regular.ttf';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(fontUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i=0;i<bytes.length;i+=chunk){
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i+chunk));
    }
    const b64 = btoa(binary);
    doc.addFileToVFS('NotoSansThai-Regular.ttf', b64);
    doc.addFont('NotoSansThai-Regular.ttf', 'NotoSansThai', 'normal');
    return true;
  } catch(_) { return false; }
}

// Parse recommendation string into array of complete sentences
function parseRecommendations(recString, riskLevel) {
  const rl = String(riskLevel || 'medium').toLowerCase();
  let recs = [];
  
  if (recString) {
    // Split by newlines or bullets, ensuring we keep complete sentences
    recs = String(recString)
      .split(/\n+|(?:^|\n)\s*[•\-–]\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }
  
  // Default recommendations by risk level
  const defaults = {
    critical: [
      "Use Lease Shield's negotiation letter templates to address this clause.",
      "Draft a negotiation request using our Letter Templates.",
      "Document all communications about this clause in writing."
    ],
    high: [
      "Negotiate this clause - view our recommended letter templates.",
      "Use our Letter Templates to request modifications.",
      "Request written clarification of landlord's interpretation."
    ],
    medium: [
      "Request clarification of this clause in writing.",
      "Propose mutual safeguards to balance both parties' interests.",
      "Set clear expectations and document agreements upfront."
    ],
    low: [
      "Review this clause to ensure you understand your obligations.",
      "Keep records of any related communications.",
      "Monitor for any issues during the tenancy."
    ],
    none: [
      "Standard clause - no action required.",
      "Maintain documentation for reference.",
      "Review periodically during tenancy."
    ]
  };
  
  const defaultRecs = defaults[rl] || defaults.medium;
  
  // Ensure exactly 3 recommendations
  while (recs.length < 3 && recs.length < defaultRecs.length) {
    const nextDefault = defaultRecs[recs.length];
    if (nextDefault && !recs.includes(nextDefault)) {
      recs.push(nextDefault);
    } else {
      break;
    }
  }
  
  return recs.slice(0, 3);
}

// Build detailed executive summary - returns structured object
function buildExecutiveSummary(riskScore, topRisks, clauses, existingSummary) {
  try {
    const score = riskScore || 0;
    const riskyClausesCount = (clauses || []).filter(c => c.risk_level && c.risk_level !== 'none').length;
    const criticalCount = (clauses || []).filter(c => c.risk_level === 'critical').length;
    const highCount = (clauses || []).filter(c => c.risk_level === 'high').length;
    
    // Build comprehensive summary object based on risk level
    let summary = {};
  
  if (score >= 70) {
    summary.riskHeadline = `HIGH RISK LEASE AGREEMENT (Score: ${score}/100)`;
    summary.introSummary = `This lease agreement is exceptionally HIGH RISK and contains ${riskyClausesCount} clauses that require careful attention before signing. `;
    if (criticalCount > 0) {
      summary.introSummary += `${criticalCount} clause(s) are rated CRITICAL and may be legally problematic or heavily favor the landlord while stripping the tenant of basic protections. `;
    }
    if (highCount > 0) {
      summary.introSummary += `${highCount} clause(s) are rated HIGH RISK and could significantly impact your rights as a tenant. `;
    }
    summary.keyConcerns = `Key concerns include: ${topRisks && topRisks.length > 0 ? topRisks.slice(0, 3).map(r => typeof r === 'string' ? r : r.title).join('; ') : 'N/A'}.`;
    summary.detailedAnalysis = `This lease contains several provisions that significantly favor the landlord, reducing fundamental tenant protections. Critical issues may include excessive property use restrictions, harsh deposit return conditions, or unfair dispute resolution clauses. These terms may not align with consumer protection laws or basic fairness principles.`;
    summary.recommendedNextSteps = [
      "Identify all problematic clauses and document your concerns",
      "Use LeaseShield's expert services to review and negotiate",
      "Prepare documentation using LeaseShield's letter templates",
      "Consider alternative properties if landlord refuses to negotiate"
    ];
    summary.timelineRecommendations = [
      "Within 24 hours: Review all critical and high-risk clauses in detail",
      "Within 48 hours: Use LeaseShield's Letter Templates to draft negotiation proposals",
      "Within 72 hours: Contact LeaseShield for negotiation support or schedule meeting with landlord"
    ];
    summary.warningRecommendation = `⚠️ RECOMMENDATION: Do NOT sign this lease in its current form. Contact LeaseShield for expert review and use our Letter Templates to negotiate removal or modification of high-risk clauses.`;
  } else if (score >= 40) {
    summary.riskHeadline = `MEDIUM RISK LEASE AGREEMENT (Score: ${score}/100)`;
    summary.introSummary = `This lease agreement contains ${riskyClausesCount} clauses that warrant review and possible negotiation. While not immediately dangerous, several provisions could impact your rights during the tenancy.`;
    summary.keyConcerns = `Areas requiring attention: ${topRisks && topRisks.length > 0 ? topRisks.slice(0, 3).map(r => typeof r === 'string' ? r : r.title).join('; ') : 'N/A'}.`;
    summary.detailedAnalysis = `Review this lease thoroughly to understand potential areas of concern. Proactive communication and minor adjustments can prevent future disputes.`;
    summary.recommendedNextSteps = [
      "Request clarification of any ambiguous clauses in writing",
      "Propose mutual safeguards to balance both parties' interests",
      "Document all agreements and communications with the landlord"
    ];
    summary.timelineRecommendations = [
      "Within 24 hours: Highlight clauses for clarification",
      "Within 48 hours: Prepare questions for your landlord",
      "Within 72 hours: Discuss potential modifications before signing"
    ];
    summary.warningRecommendation = `RECOMMENDATION: Carefully review and consider negotiating modifications before signing. Document all verbal agreements in writing.`;
  } else {
    summary.riskHeadline = `LOW RISK LEASE AGREEMENT (Score: ${score}/100)`;
    summary.introSummary = `This lease agreement appears to be relatively balanced with ${riskyClausesCount || 'few'} clauses requiring attention. The terms are generally standard for rental agreements in this market.`;
    summary.keyConcerns = `No major key concerns identified.`;
    summary.detailedAnalysis = `This lease generally aligns with standard rental practices and provides a fair balance of tenant and landlord responsibilities. Minor clarifications may still be beneficial.`;
    summary.recommendedNextSteps = [
      "Review all clauses to ensure you understand your obligations",
      "Keep a copy of all documents and maintain records throughout your tenancy",
      "Monitor for any issues during the tenancy"
    ];
    summary.timelineRecommendations = [
      "Prior to signing: Read the entire lease carefully",
      "After signing: Store a digital and physical copy securely",
      "Throughout tenancy: Refer back to the lease for rights and responsibilities"
    ];
    summary.warningRecommendation = `RECOMMENDATION: Review all clauses to ensure you understand your obligations. Keep a copy of all documents and maintain records throughout your tenancy.`;
  }
  
  return summary;
  } catch (error) {
    console.error('[buildExecutiveSummary_ERROR]', error);
    // Return safe fallback to prevent 502
    return {
      riskHeadline: `Risk Score: ${riskScore || 0}/100`,
      introSummary: 'Lease analysis completed. Review clauses carefully.',
      keyConcerns: 'See detailed analysis below.',
      detailedAnalysis: 'This lease requires careful review of all provisions.',
      recommendedNextSteps: ['Review all clauses carefully', 'Consult with legal advisor if needed', 'Document all agreements in writing'],
      timelineRecommendations: ['Before signing: Review entire lease', 'After signing: Keep copies of all documents'],
      warningRecommendation: 'RECOMMENDATION: Review carefully before signing.'
    };
  }
}

// Transform new Cloudflare format to expected PDF format
function transformCloudflareData(rawData) {
  console.log('TRANSFORM_START', {
    has_clauses: Array.isArray(rawData?.clauses),
    clauses_count: rawData?.clauses?.length || 0,
    has_risk_score: typeof rawData?.risk_score === 'number',
    risk_score: rawData?.risk_score
  });

  const clausesRaw = rawData.clauses || [];
  const topRisks = rawData.summary?.top_risks || [];
  
  // Build flags from clauses with risk
  const flags = clausesRaw
    .filter(c => c.risk_level && c.risk_level !== 'none')
    .map((c, idx) => {
      const recs = parseRecommendations(c.recommended_action || c.recommendation, c.risk_level);
      return {
        clause_id: c.clause_id || c.catalog_id || `clause-${idx}`,
        severity: String(c.risk_level || 'medium').toLowerCase(),
        category: c.canonical_name || 'Clause Review',
        title: c.canonical_name || c.title || `Clause ${idx + 1}`,
        description: c.explanation || c.risk_summary || '',
        explanation: c.explanation || '',
        recommendation: recs.join("\n"),
        evidence: (c.clause_text || c.text || '').slice(0, 240)
      };
    });

  // Build clause review for all clauses
  const clause_review = clausesRaw.map((c, idx) => ({
    clause_id: c.clause_id || c.catalog_id || `clause-${idx}`,
    risk_level: String(c.risk_level || 'none').toLowerCase(),
    risk_summary: c.explanation || c.risk_summary || '',
    recommended_change: c.recommended_action || c.recommendation || ''
  }));

  // Build clause ledger display
  const clause_ledger_display = clausesRaw.map((c, idx) => ({
    clause_id: c.clause_id || c.catalog_id || `clause-${idx}`,
    heading: c.canonical_name || c.title || `Clause ${idx + 1}`,
    full_text: c.clause_text || c.text || '',
    page: 1
  }));

  // Build detailed executive summary
  const execSummary = buildExecutiveSummary(rawData.risk_score, topRisks, clausesRaw, rawData.summary?.executive_summary);

  const transformed = {
    lease_address: rawData.key_terms?.property_address || rawData.lease_address || "Lease Agreement",
    generated_date: new Date().toISOString(),
    risk_score: rawData.risk_score || 0,
    summary: execSummary,
    key_terms: rawData.key_terms || {},
    flags,
    clause_review,
    clause_ledger: clause_ledger_display,
    coverage_summary: {
      total_clauses: clausesRaw.length,
      clauses_reviewed: clause_review.length,
      clauses_flagged: flags.length,
    },
  };

  console.log('TRANSFORM_COMPLETE', {
    clause_ledger_length: transformed.clause_ledger.length,
    flags_count: flags.length,
    risk_score: transformed.risk_score
  });

  return transformed;
}

Deno.serve(async (req) => {
  const { allowed, headers } = corsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (!allowed) return json(403, { error: "CORS_FORBIDDEN", message: "Origin not allowed" }, headers);
  if (req.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" }, headers);

  const correlationId = `pdf-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  let reportData = null;
  const startTime = Date.now();
  console.log('[PDF_START]', { correlationId, ts: new Date().toISOString() });
  
  // Timeout handler to prevent indefinite hangs
  const timeoutId = setTimeout(() => {
    console.error('[PDF_TIMEOUT]', { correlationId, elapsed: Date.now() - startTime });
  }, 25000); // 25 second timeout

  try {

  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole ?? base44;

    // Auth check (self-contained)
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      return json(401, { error: "UNAUTHORIZED" }, headers);
    }

    const body = await req.json().catch(() => ({}));
    console.log('[PDF_BODY_RECEIVED]', { 
      correlationId,
      hasScanId: !!body?.scanId, 
      hasScanData: !!body?.scanData,
      scanDataType: typeof body?.scanData,
      scanDataKeys: body?.scanData ? Object.keys(body.scanData).slice(0, 10) : null
    });
    const { scanId, scanData, language = "en", debug = false } = body || {};

    // Build initial debug trace (no sensitive clause content)
    const debugTrace = {
      requestId: correlationId,
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
      scanIdReceived: scanId,
      ownership: { checked: false, allowed: false },
      dbFetch: { table: 'LeaseScan', fieldPath: 'LeaseScan.scan_full', found: null },
      record: { keys: [], scan_full: { exists: false, type: null, keys: [], parsed: false } },
      existence: { clause_ledger: false, clauses: false, meta: false },
      size: { scan_full_bytes: null, clause_ledger_len: 0, clauses_len: 0 },
      fallback: { attempted: false, source: null, builtCount: 0, error: null },
      validation: { finalMissing: [] },
      exceptions: []
    };

    // Auth required
    if (!scanId) {
      console.error('PDF_EXPORT_ERROR', {
        error_code: 'BAD_REQUEST',
        missing_fields: ['scanId'],
        reportData_keys: reportData ? Object.keys(reportData) : null,
        full_reportData: JSON.stringify(reportData)
      });
      {
        const payload = { error: "BAD_REQUEST", message: "scanId is required", ...(debug ? { debug_trace: debugTrace } : {}) };
        return json(debug ? 200 : 400, payload, headers);
      }
    }

    // Premium gate removed - allow all users to export PDF

    // Resolve scanData - TRANSFORM IMMEDIATELY if provided
    let data = null;
    
    if (scanData) {
      console.log('PDF_EXPORT_USING_PROVIDED_SCANDATA', {
        correlationId,
        has_clauses: Array.isArray(scanData?.clauses),
        has_clause_ledger: Array.isArray(scanData?.clause_ledger),
        clauses_count: scanData?.clauses?.length || 0,
        clause_ledger_count: scanData?.clause_ledger?.length || 0
      });
      
      // Check if scanData has new Cloudflare format (clauses array)
      if (Array.isArray(scanData.clauses) && !Array.isArray(scanData.clause_ledger)) {
        console.log('TRANSFORMING_CLOUDFLARE_FORMAT', { correlationId });
        data = transformCloudflareData(scanData);
      } else if (Array.isArray(scanData.clause_ledger)) {
        // Already in expected format
        data = scanData;
      } else {
        console.error('PDF_EXPORT_ERROR: INVALID_SCANDATA_FORMAT', {
          correlationId,
          has_clauses: Array.isArray(scanData?.clauses),
          has_clause_ledger: Array.isArray(scanData?.clause_ledger)
        });
        return json(400, { 
          error: "INVALID_SCANDATA_FORMAT", 
          message: "scanData must have either 'clauses' or 'clause_ledger' array",
          correlationId 
        }, headers);
      }
    }
    
    reportData = data;
    console.log('PDF_EXPORT_DEBUG_DATA', {
      correlationId,
      timestamp: new Date().toISOString(),
      has_reportData: !!reportData,
      reportData_type: typeof reportData,
      reportData_keys: reportData ? Object.keys(reportData) : null,
      has_clause_ledger: reportData?.clause_ledger !== undefined,
      clause_ledger_type: typeof (reportData?.clause_ledger),
      clause_ledger_length: Array.isArray(reportData?.clause_ledger) ? reportData.clause_ledger.length : null,
      has_clauses: reportData?.clauses !== undefined,
      clauses_type: typeof (reportData?.clauses),
      clauses_length: Array.isArray(reportData?.clauses) ? reportData.clauses.length : null,
      reportData_preview: reportData ? JSON.stringify(reportData).substring(0, 500) : null
    });
    // debugTrace initialized above

    if (!data && scanId) {
      const scans = await svc.entities.LeaseScan.filter({ id: scanId });
      const scan = scans?.[0];

      debugTrace.dbFetch.found = !!scan;
      debugTrace.record.keys = Object.keys(scan || {});

      if (!scan) {
        console.error('PDF_EXPORT_ERROR', {
          error_code: 'SCAN_NOT_FOUND',
          missing_fields: [],
          reportData_keys: reportData ? Object.keys(reportData) : null,
          full_reportData: JSON.stringify(reportData)
        });
        {
          const payload = { error: "SCAN_NOT_FOUND", message: `No LeaseScan found for ${scanId}`, ...(debug ? { debug_trace: debugTrace } : {}) };
          return json(debug ? 200 : 404, payload, headers);
        }
      }

      if (scan.id !== scanId) {
        console.error('PDF_EXPORT_ERROR', {
          error_code: 'BAD_REQUEST_ID_MISMATCH',
          missing_fields: [],
          reportData_keys: reportData ? Object.keys(reportData) : null,
          full_reportData: JSON.stringify(reportData)
        });
        {
          const payload = { error: "BAD_REQUEST", message: "Requested scanId does not match record id", ...(debug ? { debug_trace: debugTrace } : {}) };
          return json(debug ? 200 : 400, payload, headers);
        }
      }

      // Ownership check (403 if user does not own and not admin-like)
      const userRole = (user?.role || user?.access_level || '').toLowerCase();
      const isAdminLike = ['admin', 'super_admin', 'va'].includes(userRole);
      if (!isAdminLike && scan.created_by && scan.created_by !== user.email) {
        debugTrace.ownership = { checked: true, allowed: false };
        console.error('PDF_EXPORT_ERROR', {
          error_code: 'FORBIDDEN',
          missing_fields: [],
          reportData_keys: reportData ? Object.keys(reportData) : null,
          full_reportData: JSON.stringify(reportData)
        });
        {
          const payload = { error: "FORBIDDEN", message: "You do not have access to this scan" };
          return json(debug ? 200 : 403, debug ? { ...payload, debug_trace: debugTrace } : payload, headers);
        }
      }

      let sf = scan?.scan_full ?? {};
      debugTrace.record.scan_full.exists = !!(scan?.scan_full);
      debugTrace.record.scan_full.type = typeof (scan?.scan_full);
      if (typeof sf === 'string') {
        try {
          sf = JSON.parse(sf);
          debugTrace.record.scan_full.parsed = true;
        } catch (e) {
          debugTrace.record.scan_full.parsed = false;
        }
      }
      if (sf && typeof sf === 'object') {
        try { debugTrace.record.scan_full.keys = Object.keys(sf); } catch(_) {}
      }
      try {
        debugTrace.size.scan_full_bytes = typeof scan?.scan_full === 'string' ? scan.scan_full.length : JSON.stringify(sf).length;
      } catch(_) { debugTrace.size.scan_full_bytes = null; }
      debugTrace.existence.clause_ledger = Array.isArray(sf?.clause_ledger);
      debugTrace.existence.clauses = Array.isArray(sf?.clauses);
      debugTrace.existence.meta = !!sf?.meta;
      debugTrace.size.clause_ledger_len = Array.isArray(sf?.clause_ledger) ? sf.clause_ledger.length : 0;
      debugTrace.size.clauses_len = Array.isArray(sf?.clauses) ? sf.clauses.length : 0;
      
      // NEW FORMAT: Cloudflare worker returns { risk_score, summary, clauses, meta }
      const hasNewFormat = Array.isArray(sf.clauses) && typeof sf.risk_score === 'number';
      // Fallback: build clause_ledger from clauses when missing
      if ((!Array.isArray(sf.clause_ledger) || sf.clause_ledger.length === 0) && Array.isArray(sf.clauses)) {
        try {
          debugTrace.fallback.attempted = true;
          debugTrace.fallback.source = 'clauses→clause_ledger';
          sf.clause_ledger = sf.clauses.map((c, idx) => ({
            clause_id: c.clause_id || c.catalog_id || `clause-${idx + 1}`,
            title: c.canonical_name || c.title || `Clause ${idx + 1}`,
            full_text: c.clause_text || c.text || '',
            page_number: c.page_number || 1,
            risk_tags: Array.isArray(c.risk_tags) ? c.risk_tags : (c.risk_level ? [String(c.risk_level).toLowerCase()] : [])
          }));
          debugTrace.fallback.builtCount = sf.clause_ledger.length;
        } catch (e) {
          debugTrace.fallback.error = String(e?.message || e);
        }
      }
      
      if (hasNewFormat) {
        console.log('TRANSFORMING_DB_CLOUDFLARE_FORMAT', { correlationId, clauses_count: sf.clauses.length });
        data = transformCloudflareData(sf);
      } else {
        // LEGACY FORMAT: Old pipeline with clause_ledger, issues_validated, etc.
        const clause_ledger_rows = Array.isArray(sf.clause_ledger) ? sf.clause_ledger : [];
        const issues_validated_rows = Array.isArray(sf.issues_validated)
          ? sf.issues_validated
          : clause_ledger_rows.filter((r) => r?.risk_level && r.risk_level !== 'NO_RISK');
        const clauses_extracted_rows = Array.isArray(sf.clauses_extracted) ? sf.clauses_extracted : [];

        // Build flags from issues_validated
        const flags = issues_validated_rows.map((r) => {
          const src = clauses_extracted_rows.find(c => c?.clause_id === r.clause_id);
          const recs = parseRecommendations(
            Array.isArray(r.recommended_actions) ? r.recommended_actions.join("\n") : '',
            r.risk_level
          );
          return {
            clause_id: r.clause_id,
            severity: String(r.risk_level || 'LOW').toLowerCase(),
            category: r.taxonomy_code || 'Unclassified',
            title: r.title || (src?.title) || `Clause ${r.clause_number}`,
            description: r.rationale || '',
            explanation: r.rationale || '',
            recommendation: recs.join("\n"),
            evidence: (src?.text || '').slice(0, 240)
          };
        });

        const clause_review = clause_ledger_rows.map((r) => ({
          clause_id: r.clause_id,
          risk_level: String(r.risk_level || 'NO_RISK').toLowerCase().replace('no_risk','none'),
          risk_summary: r.rationale || '',
          recommended_change: Array.isArray(r.recommended_actions) ? r.recommended_actions[0] || '' : ''
        }));

        const clause_ledger_display = clause_ledger_rows.map((r) => {
          const src = clauses_extracted_rows.find(c => c?.clause_id === r.clause_id);
          return {
            clause_id: r.clause_id,
            heading: src?.title || r.title || `Clause ${r.clause_number}`,
            full_text: src?.text || '',
            page: src?.page_number || 1
          };
        });

        const score = Math.min(100, issues_validated_rows.reduce((acc, row) => acc + (row.risk_level === 'CRITICAL' ? 25 : row.risk_level === 'HIGH' ? 18 : row.risk_level === 'MEDIUM' ? 10 : 6), 0));
        const topRisksLegacy = issues_validated_rows.slice(0, 3).map(r => r.title || 'Issue');
        const summaryObj = buildExecutiveSummary(score, topRisksLegacy, clause_ledger_rows, null);

        data = {
          lease_address: sf.key_terms?.property_address || "Lease Agreement",
          generated_date: new Date().toISOString(),
          risk_score: score,
          summary: summaryObj,
          key_terms: sf.key_terms || {},
          flags,
          clause_review,
          clause_ledger: clause_ledger_display,
          coverage_summary: {
            total_clauses: clause_ledger_rows.length,
            clauses_reviewed: clause_review.length,
            clauses_flagged: issues_validated_rows.length,
          },
        };
      }
    }

    reportData = data;

    console.log('PDF_EXPORT_FINAL_DATA_CHECK', {
      correlationId,
      has_data: !!data,
      has_clause_ledger: Array.isArray(data?.clause_ledger),
      clause_ledger_length: data?.clause_ledger?.length || 0,
      has_flags: Array.isArray(data?.flags),
      flags_length: data?.flags?.length || 0
    });

    if (!data) {
      console.error('PDF_EXPORT_ERROR', {
        error_code: 'MISSING_REPORT_DATA',
        missing_fields: ['clause_ledger'],
        reportData_keys: reportData ? Object.keys(reportData) : null,
        full_reportData: JSON.stringify(reportData)
      });
      const gotKeys = Object.keys((typeof debugRead === 'object' ? (await (async()=>{ try { return (await (await svc.entities.LeaseScan.filter({ id: scanId })))[0]?.scan_full || {}; } catch { return {}; } })()) : {}) || {});
      debugTrace.validation.finalMissing = ["clause_ledger"];
      const payload = { error: "MISSING_REPORT_DATA", missing_fields: ["clause_ledger"], gotKeys, scanId, correlationId, ...(debug ? { debug_trace: debugTrace } : {}) };
      return json(debug ? 200 : 400, payload, headers);
    }

    // Validate minimum structure with better error handling
    console.log('PDF_EXPORT_VALIDATION_CHECK', {
      correlationId,
      has_data: !!data,
      data_keys: data ? Object.keys(data) : [],
      has_clause_ledger: Array.isArray(data?.clause_ledger),
      clause_ledger_length: data?.clause_ledger?.length || 0,
      has_clauses: Array.isArray(data?.clauses),
      clauses_length: data?.clauses?.length || 0,
      has_flags: Array.isArray(data?.flags),
      flags_length: data?.flags?.length || 0
    });

    const missing = [];
    
    // Check if we have clause_ledger OR clauses
    if (!Array.isArray(data.clause_ledger) || data.clause_ledger.length === 0) {
      // Try to build clause_ledger from clauses if missing
      if (Array.isArray(data.clauses) && data.clauses.length > 0) {
        console.log('PDF_EXPORT_BUILDING_CLAUSE_LEDGER', { 
          correlationId,
          clauses_count: data.clauses.length 
        });
        
        data.clause_ledger = data.clauses.map((c, idx) => ({
          clause_id: c.clause_id || `clause-${idx + 1}`,
          heading: c.canonical_name || c.title || `Clause ${idx + 1}`,
          full_text: c.clause_text || c.text || '',
          page: c.page_number || 1
        }));
      } else {
        missing.push("clause_ledger");
      }
    }
    
    // Ensure flags array exists
    if (!Array.isArray(data.flags)) data.flags = [];
    
    // Build or repair clause_review
    if (!Array.isArray(data.clause_review) || data.clause_review.length !== data.clause_ledger?.length) {
      const flagsByClause = new Map();
      data.flags.forEach((f) => {
        if (!f?.clause_id) return;
        const list = flagsByClause.get(f.clause_id) || [];
        list.push(f);
        flagsByClause.set(f.clause_id, list);
      });
      data.clause_review = (data.clause_ledger || []).map((c) => {
        const hit = (flagsByClause.get(c.clause_id) || [])[0];
        if (hit) {
          return {
            clause_id: c.clause_id,
            risk_level: hit.severity || "medium",
            risk_summary: hit.description || hit.title || "Review required",
            recommended_change: hit.recommendation || "",
          };
        }
        return { clause_id: c.clause_id, risk_level: "none", risk_summary: "Accept as standard." };
      });
    }
    
    if (missing.length > 0) {
      console.error('PDF_EXPORT_VALIDATION_FAILED', {
        correlationId,
        missing_fields: missing,
        data_structure: {
          has_clause_ledger: !!data?.clause_ledger,
          clause_ledger_length: data?.clause_ledger?.length || 0,
          has_clauses: !!data?.clauses,
          clauses_length: data?.clauses?.length || 0,
          data_keys: Object.keys(data || {})
        }
      });
      
      const gotKeys = Object.keys(data || {});
      debugTrace.validation.finalMissing = missing;
      const payload = { 
        error: "MISSING_REPORT_DATA", 
        missing_fields: missing, 
        gotKeys, 
        scanId, 
        correlationId,
        debug_info: {
          clause_ledger_exists: !!data?.clause_ledger,
          clauses_exists: !!data?.clauses,
          suggestion: "Check if scan data has 'clauses' or 'clause_ledger' array"
        },
        ...(debug ? { debug_trace: debugTrace } : {}) 
      };
      return json(debug ? 200 : 400, payload, headers);
    }

    // -------- PDF generation --------
    console.log('[PDF_GENERATION_START]', { correlationId, elapsed: Date.now() - startTime });
    const doc = new jsPDF();
    console.log('[PDF_JSPDF_INITIALIZED]', { correlationId });
    const thaiOk = await ensureThaiFont(doc);
    console.log('[PDF_FONT_LOADED]', { correlationId, thaiOk });
    if (thaiOk) { try { doc.setFont('NotoSansThai','normal'); } catch(_) {} }
    else { try { doc.setFont('helvetica', 'normal'); } catch(_) {} }
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    const addText = (text, x, size, style = "normal", maxWidth = pageWidth - 40) => {
      doc.setFont(thaiOk ? 'NotoSansThai' : 'helvetica', style);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(String(text || ""), maxWidth);
      for (const line of lines) {
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        doc.text(line, x, y);
        y += size * 0.55;
      }
      return y;
    };

    // Header with logo
    doc.setFillColor(12, 59, 46);
    doc.rect(0, 0, pageWidth, 30, "F");

    // Text-only header (logo fetching removed to prevent CPU timeout)
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LEASE SHIELD", 14, 19);

    y = 42;
    doc.setTextColor(0, 0, 0);

    addText("Lease Agreement", 14, 14, "bold");
    y += 2;
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(`Generated: ${new Date(data.generated_date || Date.now()).toLocaleString()}`, 14, y);
    y += 6;
    
    // Property Address
    if (data.lease_address && data.lease_address !== "Lease Agreement") {
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Property Address:", 14, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      addText(data.lease_address, 14, 9);
      y += 4;
    }
    y += 4;

    // Risk banner uses highest severity across flags
    const highest = highestSeverity(data.flags);
    const pal = severityPalette[highest] || severityPalette.none;
    const [r,g,b] = pal.border || [12,59,46];
    doc.setFillColor(r,g,b);
    doc.roundedRect(14, y, pageWidth - 28, 18, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(thaiOk ? 'NotoSansThai' : 'helvetica', "bold");
    doc.setFontSize(11);
    const label = highest==='none' ? 'LOW' : String(highest||'low').toUpperCase();
    doc.text(`Risk: ${label}   Score: ${Number(data.risk_score || 0)}/100`, 18, y + 12);
    y += 26;

    doc.setTextColor(0, 0, 0);
    // Render comprehensive summary
    if (data.summary && typeof data.summary === 'object') {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Summary", 14, y);
      y += 6;
      
      // Risk headline
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      addText(data.summary.riskHeadline, 14, 10, "bold");
      y += 2;
      
      // Intro summary
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      addText(data.summary.introSummary, 14, 9);
      y += 2;
      
      // Key concerns
      doc.setFont("helvetica", "bold");
      addText(data.summary.keyConcerns, 14, 9, "bold");
      y += 4;
      
      // Detailed Analysis
      doc.setFont("helvetica", "bold");
      addText("Detailed Analysis:", 14, 9, "bold");
      y += 2;
      doc.setFont("helvetica", "normal");
      addText(data.summary.detailedAnalysis, 14, 9);
      y += 6;

      // Recommended Next Steps
      if (data.summary.recommendedNextSteps && Array.isArray(data.summary.recommendedNextSteps) && data.summary.recommendedNextSteps.length > 0) {
        doc.setFont("helvetica", "bold");
        addText("Recommended Next Steps:", 14, 9, "bold");
        y += 2;
        doc.setFont("helvetica", "normal");
        data.summary.recommendedNextSteps.forEach((step, idx) => {
          addText(`${idx + 1}. ${step}`, 16, 9);
        });
        y += 6;
      }

      // Timeline Recommendations
      if (data.summary.timelineRecommendations && Array.isArray(data.summary.timelineRecommendations) && data.summary.timelineRecommendations.length > 0) {
        doc.setFont("helvetica", "bold");
        addText("Timeline Recommendations:", 14, 9, "bold");
        y += 2;
        doc.setFont("helvetica", "normal");
        data.summary.timelineRecommendations.forEach((item) => {
          addText(`• ${item}`, 16, 9);
        });
        y += 6;
      }
      
      // Warning Recommendation Box
      if (data.summary.warningRecommendation) {
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        const warningPal = severityPalette.high;
        const [wr, wg, wb] = warningPal.bg;
        doc.setFillColor(wr, wg, wb);
        const warningTextLines = doc.splitTextToSize(data.summary.warningRecommendation, pageWidth - 32);
        const warningBoxHeight = (warningTextLines.length * 9 * 0.55) + 10;
        doc.roundedRect(14, y, pageWidth - 28, warningBoxHeight, 3, 3, "F"); 
        doc.setTextColor(255, 255, 255);
        doc.setFont(thaiOk ? 'NotoSansThai' : 'helvetica', "bold");
        doc.setFontSize(9);
        let currentWarningY = y + 5;
        for (const line of warningTextLines) {
          doc.text(line, pageWidth / 2, currentWarningY, { align: "center" });
          currentWarningY += 9 * 0.55;
        }
        doc.setTextColor(0, 0, 0);
        y += warningBoxHeight + 10;
      }
    } else if (typeof data.summary === 'string') {
      // Fallback for old string format
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Summary", 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      addText(data.summary, 14, 9);
      y += 6;
    }

    // Document Templates Section
    if (y > pageHeight - 30) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Document Templates", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    addText("Visit app.leaseshield.asia/templates to access negotiation letter templates", 14, 9);
    y += 10;

    // Clause-by-Clause Analysis (ALL clauses in original order)
    const ledger = data.clause_ledger;
    const review = data.clause_review;

    if (y > pageHeight - 30) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Clause-by-Clause Analysis (${ledger.length})`, 14, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    ledger.slice(0, 120).forEach((c, displayIdx) => {
      const r = review[displayIdx] || {};
      
      if (y > pageHeight - 30) { doc.addPage(); y = 20; }

      // Risk level badge with color
      const sev = String(r.risk_level || 'none').toLowerCase();
      const pal = severityPalette[sev] || severityPalette.none;
      const [rr, gg, bb] = pal.bg;
      const [tr, tg, tb] = pal.text;
      
      doc.setFillColor(rr, gg, bb);
      doc.roundedRect(14, y - 2, 28, 6, 1, 1, "F");
      doc.setTextColor(tr, tg, tb);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(sev.toUpperCase(), 15, y + 2);
      
      // Clause title
      doc.setTextColor(0, 0, 0);
      doc.setFont(thaiOk ? 'NotoSansThai' : 'helvetica', "bold");
      doc.setFontSize(9);
      y += 8;
      addText(`${displayIdx + 1}. ${c.heading || c.clause_id || "Clause"}`, 14, 9, "bold");
      
      // Explanation
      if (r.risk_summary) {
        doc.setFont(thaiOk ? 'NotoSansThai' : 'helvetica', "normal");
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        addText(r.risk_summary, 16, 8);
      }
      
      // Recommendations (parse from clause data)
      const flag = data.flags?.find(f => f.clause_id === c.clause_id);
      if (flag?.recommendation) {
        const recs = parseRecommendations(flag.recommendation, sev);
        if (recs.length > 0) {
          doc.setTextColor(40, 40, 40);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.text("RECOMMENDATIONS:", 16, y);
          y += 4;
          doc.setFont("helvetica", "normal");
          recs.forEach((rec) => {
            if (y > pageHeight - 30) { doc.addPage(); y = 20; }
            const recText = normalizeBullet(rec);
            // Use full width for recommendations to prevent mid-sentence breaks
            addText(`• ${recText}`, 18, 7, "normal", pageWidth - 46);
          });
        }
      }
      
      y += 4;
    });

    // Footer disclaimer
    const disclaimer = "Automated review, not legal advice.";
    const totalPages = doc.internal.pages.length - 1;
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(disclaimer, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    console.log('[PDF_CONTENT_RENDERED]', { correlationId, elapsed: Date.now() - startTime });
    const pdfBytes = doc.output("arraybuffer");
    console.log('[PDF_BYTES_CREATED]', { correlationId, size: pdfBytes.byteLength, elapsed: Date.now() - startTime });
    
    // Generate professional filename
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let propertyIdentifier = 'Report';
    
    if (data.lease_address && data.lease_address !== 'Lease Agreement') {
      // Clean property address for filename
      propertyIdentifier = data.lease_address
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 30); // Limit length
    } else if (scanId) {
      propertyIdentifier = scanId.substring(0, 8);
    }
    
    const filename = `Lease_Shield_Report_${propertyIdentifier}_${today}.pdf`;
    
    const pdfFile = new File([pdfBytes], filename, { type: "application/pdf" });
    console.log('[PDF_UPLOADING]', { correlationId, filename, size: pdfBytes.byteLength });
    const upload = await svc.integrations.Core.UploadFile({ file: pdfFile });
    console.log('[PDF_UPLOAD_COMPLETE]', { correlationId, url: upload?.file_url });

    clearTimeout(timeoutId);
    console.log('[PDF_SUCCESS]', { correlationId, elapsed: Date.now() - startTime, url: upload.file_url });
    return json(200, debug ? { ok: true, pdf_url: upload.file_url, filename, correlationId, debug_trace: debugTrace } : { success: true, pdf_url: upload.file_url, filename, correlationId }, headers);
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("[PDF_FATAL_ERROR]", { 
      correlationId, 
      elapsed: Date.now() - startTime,
      error: e?.message || e, 
      stack: e?.stack,
      line: e?.lineNumber,
      name: e?.name
    });
    return json(500, { error: "PDF_FAILED", message: String(e?.message || "PDF generation failed"), correlationId, stack: e?.stack?.substring(0, 500) }, headers);
  }
});