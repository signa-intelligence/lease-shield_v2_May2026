import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";
import { jsPDF } from "npm:jspdf@2.5.2";
import { severityPalette } from "./severityPalette.js";

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

// Parse recommendation string into array of 3 recommendations
function parseRecommendations(recString, riskLevel) {
  const rl = String(riskLevel || 'medium').toLowerCase();
  let recs = [];
  
  if (recString) {
    // Split by newlines, bullets, or numbered items
    recs = String(recString)
      .split(/[\n•\-–]|\d+\.\s+/g)
      .map(s => s.trim())
      .filter(s => s.length > 5);
  }
  
  // Default recommendations by risk level
  const defaults = {
    critical: [
      "Demand removal of this clause before signing",
      "This clause may be legally unenforceable - seek legal advice",
      "Document all communications about this clause in writing"
    ],
    high: [
      "Negotiate removal or significant modification of this clause",
      "Seek independent legal review before signing",
      "Request written clarification of landlord's interpretation"
    ],
    medium: [
      "Request clarification of this clause in writing",
      "Propose mutual safeguards to balance both parties' interests",
      "Set clear expectations and document agreements upfront"
    ],
    low: [
      "Review this clause to ensure you understand your obligations",
      "Keep records of any related communications",
      "Monitor for any issues during the tenancy"
    ],
    none: [
      "Standard clause - no action required",
      "Maintain documentation for reference",
      "Review periodically during tenancy"
    ]
  };
  
  const defaultRecs = defaults[rl] || defaults.medium;
  
  // Ensure exactly 3 recommendations
  while (recs.length < 3) {
    const nextDefault = defaultRecs[recs.length];
    if (nextDefault && !recs.includes(nextDefault)) {
      recs.push(nextDefault);
    } else {
      break;
    }
  }
  
  return recs.slice(0, 3);
}

// Build detailed executive summary
function buildExecutiveSummary(riskScore, topRisks, clauses, existingSummary) {
  const score = riskScore || 0;
  const riskyClausesCount = (clauses || []).filter(c => c.risk_level && c.risk_level !== 'none').length;
  const criticalCount = (clauses || []).filter(c => c.risk_level === 'critical').length;
  const highCount = (clauses || []).filter(c => c.risk_level === 'high').length;
  
  // If we have an existing good summary, use it
  if (existingSummary && existingSummary.length > 100) {
    return existingSummary;
  }
  
  // Build comprehensive summary based on risk level
  let summary = '';
  
  if (score >= 70) {
    summary = `HIGH RISK LEASE AGREEMENT (Score: ${score}/100)\n\n`;
    summary += `This lease agreement is HIGH RISK and contains ${riskyClausesCount} clauses that require careful attention before signing. `;
    if (criticalCount > 0) {
      summary += `${criticalCount} clause(s) are rated CRITICAL and may be legally problematic or heavily favor the landlord. `;
    }
    if (highCount > 0) {
      summary += `${highCount} clause(s) are rated HIGH RISK and could significantly impact your rights as a tenant. `;
    }
    summary += `\n\nKey concerns include: `;
    if (topRisks && topRisks.length > 0) {
      summary += topRisks.slice(0, 3).map(r => typeof r === 'string' ? r : r.title).join('; ') + '. ';
    }
    summary += `\n\nRECOMMENDATION: Do NOT sign this lease in its current form. Negotiate removal or modification of high-risk clauses, and consider seeking independent legal advice before proceeding.`;
  } else if (score >= 40) {
    summary = `MEDIUM RISK LEASE AGREEMENT (Score: ${score}/100)\n\n`;
    summary += `This lease agreement contains ${riskyClausesCount} clauses that warrant review and possible negotiation. `;
    summary += `While not immediately dangerous, several provisions could impact your rights during the tenancy. `;
    if (topRisks && topRisks.length > 0) {
      summary += `\n\nAreas requiring attention: ${topRisks.slice(0, 3).map(r => typeof r === 'string' ? r : r.title).join('; ')}. `;
    }
    summary += `\n\nRECOMMENDATION: Review the flagged clauses carefully and consider negotiating modifications before signing. Document all verbal agreements in writing.`;
  } else {
    summary = `LOW RISK LEASE AGREEMENT (Score: ${score}/100)\n\n`;
    summary += `This lease agreement appears to be relatively balanced with ${riskyClausesCount || 'few'} clauses requiring attention. `;
    summary += `The terms are generally standard for rental agreements in this market. `;
    summary += `\n\nRECOMMENDATION: Review all clauses to ensure you understand your obligations. Keep a copy of all documents and maintain records throughout your tenancy.`;
  }
  
  return summary;
}

Deno.serve(async (req) => {
  const { allowed, headers } = corsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (!allowed) return json(403, { error: "CORS_FORBIDDEN", message: "Origin not allowed" }, headers);
  if (req.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" }, headers);

  const correlationId = `pdf-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  let reportData = null;
  console.log('PDF_EXPORT_DEBUG_START', { correlationId, ts: new Date().toISOString() });
  let reportData = null;
  console.log('PDF_EXPORT_DEBUG_START', { correlationId, ts: new Date().toISOString() });
  let reportData = null;
  console.log('PDF_EXPORT_DEBUG_START', { correlationId, ts: new Date().toISOString() });

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

    // Resolve scanData if only scanId is provided
    let data = scanData;
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
        // Process new Cloudflare format
        const clausesRaw = sf.clauses || [];
        const topRisks = sf.summary?.top_risks || [];
        
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
        const execSummary = buildExecutiveSummary(sf.risk_score, topRisks, clausesRaw, sf.summary?.executive_summary);

        data = {
          lease_address: sf.key_terms?.property_address || "Lease Agreement",
          generated_date: new Date().toISOString(),
          risk_score: sf.risk_score || 0,
          summary: execSummary,
          key_terms: sf.key_terms || {},
          flags,
          clause_review,
          clause_ledger: clause_ledger_display,
          coverage_summary: {
            total_clauses: clausesRaw.length,
            clauses_reviewed: clause_review.length,
            clauses_flagged: flags.length,
          },
        };
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
        const summary = issues_validated_rows.length > 0 ? `${issues_validated_rows.length} issues found. Review recommendations before signing.` : 'No major issues detected.';

        data = {
          lease_address: sf.key_terms?.property_address || "Lease Agreement",
          generated_date: new Date().toISOString(),
          risk_score: score,
          summary,
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

    // Generate clause_ledger from clauses if missing (compat with new Cloudflare)
    if ((!data?.clause_ledger || (Array.isArray(data.clause_ledger) && data.clause_ledger.length === 0)) && Array.isArray(data?.clauses)) {
      data.clause_ledger = data.clauses.map((c, idx) => ({
        clause_id: c.clause_id || `clause-${idx + 1}`,
        clause_number: idx + 1,
        heading: c.canonical_name || c.heading || c.title || `Clause ${idx + 1}`,
        text: c.clause_text || c.text || '',
        full_text: c.clause_text || c.full_text || c.text || '',
        risk_level: String(c.risk_level || 'none').toLowerCase(),
        risk_summary: c.explanation || c.risk_summary || '',
        recommended_actions: c.recommended_action ? [c.recommended_action] : (Array.isArray(c.recommended_actions) ? c.recommended_actions : []),
        mapped_catalog_ids: c.canonical_name ? [c.canonical_name] : (Array.isArray(c.mapped_catalog_ids) ? c.mapped_catalog_ids : [])
      }));
    }

    // Validate minimum structure and softly repair
    const missing = [];
    if (!Array.isArray(data.clause_ledger) || data.clause_ledger.length === 0) missing.push("clause_ledger");
    if (!Array.isArray(data.flags)) data.flags = [];
    if (!Array.isArray(data.clause_review) || data.clause_review.length !== data.clause_ledger.length) {
      const flagsByClause = new Map();
      data.flags.forEach((f) => {
        if (!f?.clause_id) return;
        const list = flagsByClause.get(f.clause_id) || [];
        list.push(f);
        flagsByClause.set(f.clause_id, list);
      });
      data.clause_review = data.clause_ledger.map((c) => {
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
      console.error('PDF_EXPORT_ERROR', {
        error_code: 'MISSING_REPORT_DATA',
        missing_fields: missing,
        reportData_keys: reportData ? Object.keys(reportData) : null,
        full_reportData: JSON.stringify(reportData)
      });
      const gotKeys = Object.keys(data || {});
      debugTrace.validation.finalMissing = missing;
      {
        const payload = { error: "MISSING_REPORT_DATA", missing_fields: missing, gotKeys, scanId, correlationId, ...(debug ? { debug_trace: debugTrace } : {}) };
        return json(debug ? 200 : 400, payload, headers);
      }
    }

    // -------- PDF generation --------
    const doc = new jsPDF();
    const thaiOk = await ensureThaiFont(doc);
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

    // Header
    doc.setFillColor(12, 59, 46);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LEASE SHIELD", 14, 19);

    y = 42;
    doc.setTextColor(0, 0, 0);

    addText(data.lease_address || "Lease Agreement", 14, 14, "bold");
    y += 2;
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(`Generated: ${new Date(data.generated_date || Date.now()).toLocaleString()}`, 14, y);
    y += 10;

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
    if (data.summary) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Summary", 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      addText(data.summary, 14, 9);
      y += 6;
    }

    // Flags
    const flags = Array.isArray(data.flags) ? data.flags : [];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Issues (${flags.length})`, 14, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    if (flags.length === 0) {
      doc.text("No issues flagged.", 14, y);
      y += 8;
    } else {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = [...flags].sort((a, b) => (severityOrder[a?.severity] ?? 3) - (severityOrder[b?.severity] ?? 3));

      sorted.slice(0, 50).forEach((f, i) => {
        if (y > pageHeight - 30) { doc.addPage(); y = 20; }
        // Left color bar by severity
        const pp = severityPalette[f.severity] || severityPalette.none;
        const [rr,gg,bb] = pp.border || [12,59,46];
        doc.setFillColor(rr,gg,bb);
        doc.rect(12, y-2, 2, 20, 'F');
        const title = normalizeBullet(f.title || f.description || `Issue ${i + 1}`);
        addText(`${i + 1}. [${String(f.severity || "medium").toUpperCase()}] ${title}`, 16, 9, thaiOk ? 'normal' : "bold");
        doc.setFont(thaiOk ? 'NotoSansThai' : 'helvetica', "normal");
        const rec = normalizeBullet(f.recommendation || "");
        if (rec) addText(`Recommendation: ${rec}`, 16, 8);
        let ev = f.evidence || "";
        if (ev) addText(`Evidence: ${normalizeBullet(String(ev).slice(0, 240))}`, 16, 8);
        y += 3;
      });
    }

    // Clause-by-clause (first N to keep PDF size sane)
    const ledger = data.clause_ledger;
    const review = data.clause_review;

    if (y > pageHeight - 30) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Clause-by-Clause (${ledger.length})`, 14, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    for (let i = 0; i < Math.min(ledger.length, 120); i++) {
      const c = ledger[i];
      const r = review[i] || {};
      if (y > pageHeight - 24) { doc.addPage(); y = 20; }

      addText(`${i + 1}. ${c.heading || c.clause_id || "Clause"}`, 14, 8, "bold");
      addText(`Risk: ${String(r.risk_level || "none").toUpperCase()} — ${r.risk_summary || ""}`, 16, 8);
      const snippet = normalizeBullet(String(c.full_text || "").slice(0, 220));
      if (snippet) addText(`Snippet: ${snippet}`, 16, 8);
      y += 2;
    }

    // Footer disclaimer
    const disclaimer = "Automated review, not legal advice.";
    const totalPages = doc.internal.pages.length - 1;
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(disclaimer, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    const pdfBytes = doc.output("arraybuffer");
    const pdfFile = new File([pdfBytes], `LeaseShield-Report-${Date.now()}.pdf`, { type: "application/pdf" });
    const upload = await svc.integrations.Core.UploadFile({ file: pdfFile });

    return json(200, debug ? { ok: true, pdf_url: upload.file_url, correlationId, debug_trace: debugTrace } : { success: true, pdf_url: upload.file_url, correlationId }, headers);
  } catch (e) {
    console.error("[PDF_ERROR]", correlationId, e?.message || e, e?.stack);
    return json(500, { error: "PDF_FAILED", message: String(e?.message || "PDF generation failed"), correlationId }, headers);
  }
});