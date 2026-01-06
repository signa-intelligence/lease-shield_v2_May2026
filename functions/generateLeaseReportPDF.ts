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

Deno.serve(async (req) => {
  const { allowed, headers } = corsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (!allowed) return json(403, { error: "CORS_FORBIDDEN", message: "Origin not allowed" }, headers);
  if (req.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" }, headers);

  const correlationId = `pdf-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

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
    const { scanId, scanData, language = "en" } = body || {};

    // (Optional) premium gate — keep simple; remove if it blocks you during testing
    const plan = String(user?.plan_tier || "free").toLowerCase();
    if (plan === "free") {
      return json(403, { error: "UPGRADE_REQUIRED", message: "Upgrade required to generate PDF" }, headers);
    }

    // Resolve scanData if only scanId is provided
    let data = scanData;

    if (!data && scanId) {
      const scans = await svc.entities.LeaseScan.filter({ id: scanId });
      const scan = scans?.[0];

      if (!scan) {
        return json(404, { error: "SCAN_NOT_FOUND", message: `No LeaseScan found for ${scanId}` }, headers);
      }

      // Preferred: canonical payload
      const canonical = scan?.scan_full?.canonical_report?.pdfPayload;
      if (canonical && Array.isArray(canonical.clause_ledger) && canonical.clause_ledger.length > 0) {
        data = canonical;
      } else {
        // Fallback: synthesize from stored ledger/flags
        const ledger =
          Array.isArray(scan?.scan_full?.clause_ledger) ? scan.scan_full.clause_ledger : [];
        const flags =
          Array.isArray(scan?.flags) ? scan.flags : [];

        const review = ledger.map((c) => {
          const hit = flags.find((f) => f?.clause_id && f.clause_id === c.clause_id);
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

        data = {
          lease_address: scan?.scan_full?.key_terms?.property_address || "Lease Agreement",
          generated_date: new Date().toISOString(),
          risk_score: Number(scan?.risk_score || 0),
          summary: scan?.summary || `${flags.length} issues detected`,
          key_terms: scan?.scan_full?.key_terms || {},
          flags,
          clause_review: review,
          clause_ledger: ledger,
          mappings: [],
          missing_clauses: [],
          coverage_summary: {
            total_clauses: ledger.length,
            clauses_reviewed: review.length,
            clauses_flagged: review.filter((r) => r.risk_level && r.risk_level !== "none").length,
          },
        };
      }
    }

    if (!data) {
      return json(
        400,
        { error: "MISSING_REPORT_DATA", message: "Provide scanId or scanData" },
        headers
      );
    }

    // Validate minimum structure (this is what was causing 400s)
    const missing = [];
    if (!Array.isArray(data.clause_ledger) || data.clause_ledger.length === 0) missing.push("clause_ledger");
    if (!Array.isArray(data.flags)) data.flags = [];
    if (!Array.isArray(data.clause_review) || data.clause_review.length !== data.clause_ledger.length) {
      // Force full coverage so PDF never 400s for coverage mismatch
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
      return json(400, { error: "MISSING_REPORT_DATA", missing_fields: missing }, headers);
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

    return json(200, { success: true, pdf_url: upload.file_url, correlationId }, headers);
  } catch (e) {
    console.error("[PDF_ERROR]", correlationId, e?.message || e, e?.stack);
    return json(200, { success: false, error: "PDF_FAILED", message: String(e?.message || "PDF generation failed"), correlationId }, headers);
  }
});