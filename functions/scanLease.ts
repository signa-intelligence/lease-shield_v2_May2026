import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

/* =========================
   RESPONSE HELPERS
========================= */
function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
function err(code, message, status = 400, requestId = "") {
  return json(status, { success: false, error: code, message, requestId });
}
function validateFileUrl(url) {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return { valid: false, error: "Invalid URL protocol" };
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
}
async function requireAuth(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me(); // throws if not logged in
  return { user, base44 };
}

/* =========================
   CANONICAL CATALOG INTEGRATION
   - Always builds 92-row ledger + reviews from canonical catalog
========================= */
const CANONICAL_SOURCE = "LEASE_SHIELD_CANONICAL_V1";

function normalizeText(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

async function tryFetchCatalogFromEntity(base44, entityName) {
  // returns {source, catalog_version, catalog_updated_at, catalog:[...]} or null
  try {
    const entity = base44.asServiceRole.entities?.[entityName];
    if (!entity?.filter) return null;

    // Try common field patterns
    let rows = [];
    try {
      rows = await entity.filter({ source: CANONICAL_SOURCE });
    } catch (_) {
      // Some Base44 schemas don’t like unknown keys; fallback to fetching all
      rows = await entity.filter({});
    }

    if (!rows || rows.length === 0) return null;

    // Pick the most recent row that actually contains a catalog array
    const candidates = rows
      .filter((r) => Array.isArray(r.catalog) && r.catalog.length > 0)
      .sort((a, b) => String(b.catalog_updated_at || "").localeCompare(String(a.catalog_updated_at || "")));

    return candidates[0] || null;
  } catch (_) {
    return null;
  }
}

async function loadCanonicalCatalog(base44) {
  // Try a few likely entity names (silent). No external modules.
  const entityNames = [
    "CanonicalClauseCatalog",
    "CanonicalCatalog",
    "LeaseCanonicalCatalog",
    "LeaseClauseCatalog",
    "ClauseCatalog",
  ];

  for (const name of entityNames) {
    const found = await tryFetchCatalogFromEntity(base44, name);
    if (found) return found;
  }

  // Hard-fail. You said you want canonical, not mock.
  throw new Error(
    `Canonical catalog not found in DB. Expected an entity containing {source:"${CANONICAL_SOURCE}", catalog:[...]}.`
  );
}

function scoreMatch(canonItem, clauseTextNorm) {
  let score = 0;
  const kws = canonItem.typical_keywords || [];
  const vars = canonItem.typical_variants || [];

  for (const k of kws) {
    const kk = String(k || "").toLowerCase();
    if (kk && clauseTextNorm.includes(kk)) score += 2;
  }
  for (const v of vars) {
    const vv = String(v || "").toLowerCase();
    if (vv && clauseTextNorm.includes(vv)) score += 3;
  }

  const cn = String(canonItem.canonical_name || "").toLowerCase();
  if (cn && clauseTextNorm.includes(cn)) score += 4;

  return score;
}

function buildCanonicalLedger(catalogObj, clauses_extracted) {
  const extracted = (clauses_extracted || []).map((c) => ({
    ...c,
    _textNorm: normalizeText(`${c.heading || ""} ${c.full_text || ""}`),
  }));

  const canon = [...(catalogObj.catalog || [])]
    .filter((x) => x && x.is_active)
    .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));

  const ledger = [];

  for (const item of canon) {
    let best = null;
    let bestScore = 0;

    for (const c of extracted) {
      const s = scoreMatch(item, c._textNorm);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }

    const matched = !!(best && bestScore >= 3); // threshold (tune later)

    ledger.push({
      catalog_id: item.catalog_id,
      canonical_name: item.canonical_name,
      purpose: item.purpose || "",
      sort_order: item.sort_order || 999,
      matched,
      match_score: matched ? bestScore : 0,
      clause_id: matched ? best.clause_id : null,
      snippet: matched ? String(best.full_text || "").slice(0, 280) : "",
      text_full: matched ? String(best.full_text || "") : "",
      risk_triggers: Array.isArray(item.risk_triggers) ? item.risk_triggers : [],
    });
  }

  return ledger;
}

function evaluateCanonicalRisks(ledger, userLang) {
  const flags = [];
  const clause_review = [];

  const addFlag = (row, severity, titleEn, titleTh, recEn, recTh, descEn, descTh) => {
    flags.push({
      clause_id: row.clause_id || row.catalog_id,
      severity,
      category: row.canonical_name,
      title: userLang === "th" ? titleTh : titleEn,
      description: userLang === "th" ? (descTh || titleTh) : (descEn || titleEn),
      recommendation: userLang === "th" ? recTh : recEn,
      evidence: String(row.snippet || row.text_full || "").slice(0, 240),
      catalog_id: row.catalog_id,
    });
  };

  for (const row of ledger) {
    const t = normalizeText(row.text_full);

    let risk_level = "none";
    let risk_summary = "Accept as standard.";
    let recommended_change = undefined;

    // Missing clause => medium by default (makes coverage failures visible)
    if (!row.matched) {
      risk_level = "medium";
      risk_summary = "Clause missing or not found in document. Manual verification recommended.";
      recommended_change = "Request this clause be added or confirm it exists elsewhere in the lease.";

      addFlag(
        row,
        "medium",
        `Missing clause: ${row.canonical_name}`,
        `ไม่พบข้อกำหนด: ${row.canonical_name}`,
        "Request this clause be added or confirm it exists elsewhere in the lease.",
        "ขอเพิ่มข้อกำหนดนี้ หรือยืนยันว่ามีอยู่ในส่วนอื่นของสัญญา",
        `The lease may omit protections/definitions usually expected for ${row.canonical_name}.`,
        `สัญญาอาจขาดข้อคุ้มครอง/คำจำกัดความที่ควรมีในหัวข้อ ${row.canonical_name}`
      );
    } else {
      // Trigger matching V1: token hits against clause text
      for (const trig of row.risk_triggers || []) {
        const trigNorm = normalizeText(trig);
        if (!trigNorm) continue;

        // Skip "missing ..." triggers: handled by missing clause logic
        if (trigNorm.startsWith("missing")) continue;

        const tokens = trigNorm.split(" ").filter((w) => w.length >= 4);
        const hit = tokens.length ? tokens.some((tok) => t.includes(tok)) : false;

        if (hit) {
          const sev =
            trigNorm.includes("illegal") ? "critical"
            : trigNorm.includes("terminate") ? "high"
            : trigNorm.includes("forfeit") ? "high"
            : trigNorm.includes("sole discretion") ? "high"
            : "medium";

          risk_level = sev === "critical" ? "high" : "high";
          risk_summary = `Triggered: ${trig}`;
          recommended_change = "Negotiate this term; request explicit limits, timelines, and objective criteria.";

          addFlag(
            row,
            sev,
            `${row.canonical_name}: ${trig}`,
            `${row.canonical_name}: ${trig}`,
            "Negotiate this term; request explicit limits, timelines, and objective criteria.",
            "เจรจาเงื่อนไขนี้ ขอให้ระบุข้อจำกัด กำหนดเวลา และเกณฑ์ที่ชัดเจน",
            `Risk trigger detected for ${row.canonical_name}.`,
            `ตรวจพบเงื่อนไขเสี่ยงในหัวข้อ ${row.canonical_name}`
          );

          break;
        }
      }
    }

    clause_review.push({
      catalog_id: row.catalog_id,
      canonical_name: row.canonical_name,
      clause_id: row.clause_id,
      risk_level,
      risk_summary,
      recommended_change,
      matched: row.matched,
      snippet: row.snippet,
    });
  }

  const risk_score = Math.min(
    100,
    flags.reduce((acc, f) => acc + (f.severity === "critical" ? 20 : f.severity === "high" ? 15 : 8), 0)
  );

  return { flags, clause_review, risk_score };
}

/* =========================
   MAIN
========================= */
Deno.serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return err("BAD_JSON", "Invalid JSON body", 400, "");
  }

  const requestId = body.requestId || `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const startTime = Date.now();

  try {
    const { user, base44 } = await requireAuth(req);

    const scanId = body.scanId || crypto.randomUUID();
    const leaseId = body.leaseId;
    const fileUrlsRaw = body.fileUrls;

    if (!leaseId) return err("MISSING_LEASE_ID", "leaseId is required", 400, requestId);
    if (!fileUrlsRaw || (Array.isArray(fileUrlsRaw) && fileUrlsRaw.length === 0)) {
      return err("VALIDATION_ERROR", "No file URLs provided", 400, requestId);
    }

    const fileUrls = Array.isArray(fileUrlsRaw) ? fileUrlsRaw : [fileUrlsRaw];
    for (const url of fileUrls) {
      const v = validateFileUrl(url);
      if (!v.valid) return err("INVALID_FILE_URL", v.error, 400, requestId);
    }

    // Premium gate (keep your rule)
    const plan = (user.plan_tier || "free").toLowerCase();
    if (plan === "free") return err("PREMIUM_REQUIRED", "Upgrade required to scan", 403, requestId);

    const userLang = user.language || "en";

    // 0) Load canonical catalog (required)
    const canonicalCatalog = await loadCanonicalCatalog(base44);

    // 1) Extract clauses + key terms
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract ALL clauses from this residential lease document.
FOR EACH CLAUSE provide:
- clause_id
- title
- raw_text (max 600 chars)
- page_number (1 if unsure)
- language: "th", "en", or "mixed"
ALSO EXTRACT: property_address, start_date, end_date, rent_amount, deposit_amount, notice_period_days, language_detected, rent_due_day, deposit_due_date, deposit_return_days.`,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          clauses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause_id: { type: "string" },
                title: { type: "string" },
                raw_text: { type: "string" },
                page_number: { type: "integer" },
                language: { type: "string", enum: ["en", "th", "mixed"] },
              },
              required: ["clause_id", "raw_text"],
            },
          },
          property_address: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          rent_amount: { type: "number" },
          deposit_amount: { type: "number" },
          language_detected: { type: "string", enum: ["en", "th", "mixed"] },
          notice_period_days: { type: "integer" },
          rent_due_day: { type: "integer" },
          deposit_due_date: { type: "string" },
          deposit_return_days: { type: "integer" },
        },
        required: ["clauses"],
      },
    });

    const clauses = extractionResult?.clauses || [];

    const keyTerms = {
      property_address: extractionResult.property_address || "",
      start_date: extractionResult.start_date || "",
      end_date: extractionResult.end_date || "",
      rent_amount: extractionResult.rent_amount || 0,
      deposit_amount: extractionResult.deposit_amount || 0,
      language_detected: extractionResult.language_detected || "en",
      notice_period_days: extractionResult.notice_period_days || 0,
      rent_due_day: extractionResult.rent_due_day || 0,
      deposit_due_date: extractionResult.deposit_due_date || "",
      deposit_return_days: extractionResult.deposit_return_days || 0,
    };

    const clauses_extracted = clauses.map((c, idx) => ({
      clause_id: String(c.clause_id || `CLAUSE-${String(idx + 1).padStart(3, "0")}`),
      heading: c.title || null,
      full_text: c.raw_text || "",
      page: c.page_number || 1,
    }));

    // 2) Canonical ledger + risk evaluation (THIS replaces mock-lease heuristics)
    const clause_ledger = buildCanonicalLedger(canonicalCatalog, clauses_extracted);
    const { flags, clause_review, risk_score } = evaluateCanonicalRisks(clause_ledger, userLang);

    // 3) Payload (canonical-driven)
    const pdfPayload = {
      lease_address: keyTerms.property_address || "Lease Agreement",
      generated_date: new Date().toISOString(),
      risk_score,
      summary: flags.length > 0
        ? `${flags.length} issues found. Review recommendations before signing.`
        : "No major issues detected.",
      key_terms: keyTerms,
      flags,
      clause_review,     // canonical 92
      clause_ledger,     // canonical 92
      clauses_extracted, // raw extraction (debug)
      coverage_summary: {
        catalog_total: clause_ledger.length,
        matched: clause_ledger.filter((r) => r.matched).length,
        missing: clause_ledger.filter((r) => !r.matched).length,
        flags_count: flags.length,
      },
      fallback: false,
      fallback_reason: "Canonical-driven scanLease using LEASE_SHIELD_CANONICAL_V1 catalog.",
    };

    const canonical_report = {
      pdfPayload,
      clause_ledger,
      clause_review,
      issues: flags,
      status: "ok",
      catalog_version: canonicalCatalog.catalog_version || null,
      catalog_updated_at: canonicalCatalog.catalog_updated_at || null,
      source: canonicalCatalog.source || CANONICAL_SOURCE,
    };

    // 4) Persist scan + mark lease scanned
    let persistedScanId = scanId;

    const existing = await base44.asServiceRole.entities.LeaseScan.filter({ id: scanId });
    if (!existing || existing.length === 0) {
      const created = await base44.asServiceRole.entities.LeaseScan.create({
        lease_id: leaseId,
        status: "processing",
      });
      persistedScanId = created.id;
    }

    await base44.asServiceRole.entities.LeaseScan.update(persistedScanId, {
      lease_id: leaseId,
      status: "completed",
      risk_score,
      flags,
      summary: pdfPayload.summary,
      scan_full: {
        clauses_extracted,
        clause_ledger,
        clause_review,
        key_terms: keyTerms,
        language_detected: keyTerms.language_detected,
        canonical_report,
        diagnostics: {
          requestId,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          clause_count: clauses_extracted.length,
          canonical_count: clause_ledger.length,
          review_count: clause_review.length,
          flags_count: flags.length,
        },
        version: "v5.0-canonical-ledger",
      },
    });

    await base44.asServiceRole.entities.Lease.update(leaseId, { status: "scanned" });

    return json(200, {
      success: true,
      scanId: persistedScanId,
      leaseId,
      result: pdfPayload,
      diagnostic: { requestId, elapsedMs: Date.now() - startTime },
    });
  } catch (e) {
    const msg = String(e?.message || e);
    if (/unauth/i.test(msg)) return err("UNAUTHORIZED", "Unauthorized", 401, requestId);
    return err("SCAN_FAILED", msg, 500, requestId);
  }
});