import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

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
    if (!fileUrlsRaw || (Array.isArray(fileUrlsRaw) && fileUrlsRaw.length === 0))
      return err("VALIDATION_ERROR", "No file URLs provided", 400, requestId);

    const fileUrls = Array.isArray(fileUrlsRaw) ? fileUrlsRaw : [fileUrlsRaw];

    for (const url of fileUrls) {
      const v = validateFileUrl(url);
      if (!v.valid) return err("INVALID_FILE_URL", v.error, 400, requestId);
    }

    // Premium gate (keep your rule)
    const plan = (user.plan_tier || "free").toLowerCase();
    if (plan === "free") return err("PREMIUM_REQUIRED", "Upgrade required to scan", 403, requestId);

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

    // 2) Very basic flags (fallback)
    const userLang = user.language || "en";
    const flags = [];
    for (const clause of clauses) {
      const text = clause.raw_text || "";
      if (/forfeit.*deposit|ริบ.*มัดจำ/i.test(text)) {
        flags.push({
          clause_id: clause.clause_id,
          severity: "high",
          category: "Financial Risk",
          title: userLang === "th" ? "การริบเงินมัดจำ" : "Deposit Forfeiture",
          description: userLang === "th" ? "พบข้อกำหนดการริบเงินมัดจำ" : "Deposit forfeiture clause detected",
          explanation: userLang === "th" ? "เสี่ยงเสียเงินมัดจำ" : "Risk of losing deposit",
          recommendation: userLang === "th" ? "เจรจาให้มีเงื่อนไขชัดเจน" : "Negotiate clear conditions",
          evidence: text.substring(0, 240),
        });
      }
      if (/withheld for any reason|without itemisation|no time limit/i.test(text)) {
        flags.push({
          clause_id: clause.clause_id,
          severity: "high",
          category: "Deposit",
          title: userLang === "th" ? "มัดจำถูกหักแบบไม่จำกัด" : "Unlimited Deposit Withholding",
          description: userLang === "th" ? "ผู้ให้เช่าสามารถหักมัดจำได้โดยไม่ต้องแจกแจง" : "Landlord can withhold deposit without itemisation/time limit",
          explanation: userLang === "th" ? "เสี่ยงเสียมัดจำโดยโต้แย้งยาก" : "High risk of unfair deposit deductions",
          recommendation: userLang === "th" ? "เพิ่มเงื่อนไขต้องแจกแจงและกำหนดเวลาคืนมัดจำ" : "Require itemised deductions + strict return timeline",
          evidence: text.substring(0, 240),
        });
      }
    }

    const risk_score = Math.min(100, flags.length * 15);

    // 3) Build payload with FULL coverage (risk-aware)
const flagsByClause = new Map();
flags.forEach(f => {
  if (!f.clause_id) return;
  const list = flagsByClause.get(f.clause_id) || [];
  list.push(f);
  flagsByClause.set(f.clause_id, list);
});

const clause_review = clauses_extracted.map((c) => {
  const clauseFlags = flagsByClause.get(c.clause_id) || [];

  if (clauseFlags.length === 0) {
    return {
      clause_id: c.clause_id,
      risk_level: "none",
      risk_summary: "Accept as standard.",
    };
  }

  // Highest severity wins
  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
  const primary = clauseFlags.sort(
    (a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
  )[0];

  return {
    clause_id: c.clause_id,
    risk_level: primary.severity || "medium",
    risk_summary: primary.description || primary.title || "Review required",
    recommended_change: primary.recommendation
      ? String(primary.recommendation).split(/\n/)[0]
      : undefined,
    category: primary.category,
  };
});

    const pdfPayload = {
      lease_address: keyTerms.property_address || "Lease Agreement",
      generated_date: new Date().toISOString(),
      risk_score,
      summary: flags.length > 0 ? `${flags.length} issues found. Review recommendations before signing.` : "No major issues detected.",
      key_terms: keyTerms,
      flags,
      clause_review,
      clause_ledger: clauses_extracted,
      mappings: [],
      missing_clauses: [],
      coverage_summary: {
        total_clauses: clauses_extracted.length,
        clauses_reviewed: clause_review.length,
        clauses_flagged: clause_review.filter((r) => r.risk_level && r.risk_level !== "none").length,
      },
      fallback: true,
      fallback_reason: "Self-contained scanLease (no external modules).",
    };

    const canonical_report = { pdfPayload, clause_ledger: clauses_extracted, clause_review, issues: flags, status: "ok" };

    // 4) Persist scan + mark lease scanned
    let persistedScanId = scanId;

    const existing = await base44.asServiceRole.entities.LeaseScan.filter({ id: scanId });
    if (!existing || existing.length === 0) {
      const created = await base44.asServiceRole.entities.LeaseScan.create({ lease_id: leaseId, status: "processing" });
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
        clause_ledger: clauses_extracted,
        clause_review,
        key_terms: keyTerms,
        language_detected: keyTerms.language_detected,
        canonical_report,
        diagnostics: {
          requestId,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          clause_count: clauses_extracted.length,
          review_count: clause_review.length,
          flags_count: flags.length,
        },
        version: "v4.2-self-contained",
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
    // auth.me() throws when unauthenticated
    const msg = String(e?.message || e);
    if (/unauth/i.test(msg)) return err("UNAUTHORIZED", "Unauthorized", 401, requestId);
    return err("SCAN_FAILED", msg, 500, requestId);
  }
});