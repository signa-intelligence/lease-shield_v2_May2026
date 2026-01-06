import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

// ---------------------------
// Self-contained helpers
// ---------------------------
function json(resBody, status = 200) {
  return new Response(JSON.stringify(resBody), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function err(code, message, status = 400, requestId = "") {
  return json(
    {
      success: false,
      error: code,
      message,
      diagnostic: { requestId },
    },
    status
  );
}

async function requireAuth(req) {
  const base44 = createClientFromRequest(req);
  // Base44 SDK typically exposes auth.me() server-side
  const user = await base44.auth.me().catch(() => null);
  if (!user) throw new Error("UNAUTHORIZED");
  return { user, base44 };
}

async function safeLog(event, data) {
  // Keep logging simple + deployment-safe
  console.log(`[${event}]`, data || {});
}

// Minimal URL validator: allow https URLs only (Base44 file URLs are https)
function validateFileUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return { valid: false, error: "Only https URLs allowed" };
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
}

// Soft rate-limit placeholder (no shared module, no state)
// If you want real RL later: store counters in an entity.
async function enforceRateLimit() {
  return { remaining: 999999 };
}

// ---------------------------
// MAIN
// ---------------------------
Deno.serve(async (req) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return err("INVALID_JSON", "Request body must be valid JSON", 400, "");
  }

  const requestId = body.requestId || `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const startTime = Date.now();
  const scanId = body.scanId || crypto.randomUUID();
  const stages = [];

  const logStage = (stage, data) => {
    const entry = {
      stage,
      ts: new Date().toISOString(),
      ms: Date.now() - startTime,
      ...data,
    };
    stages.push(entry);
    console.log(`[SCAN:${scanId}][REQ:${requestId}] ${stage}`, entry);
  };

  try {
    logStage("ENGINE_START", { version: "scanLease-selfcontained-v1" });

    // AUTH
    const { user, base44 } = await requireAuth(req);

    // Rate limit (soft)
    const rl = await enforceRateLimit();
    await safeLog("SCAN_RATE_LIMIT", { remaining: rl.remaining, userId: user.id });

    // Tier gate
    const userTier = (user.plan_tier || "free").toLowerCase();
    if (userTier === "free") {
      return json(
        {
          success: false,
          error: "PREMIUM_REQUIRED",
          message: "Upgrade required to scan",
          diagnostic: { requestId },
        },
        403
      );
    }

    const scanLimits = {
      free: { limit: 1, period: "lifetime" },
      lite: { limit: 6, period: "year" },
      protect: { limit: 12, period: "year" },
      secure: { limit: 999999, period: "year" },
    };
    const tierLimit = scanLimits[userTier] || scanLimits.free;

    // Validate quota using leases list
    const leases = await base44.entities.Lease.filter({ created_by: user.email }).catch(() => []);
    let scannedCount = 0;

    if (tierLimit.period === "lifetime") {
      scannedCount = leases.filter((l) => l.status === "scanned" || l.status === "paid").length;
    } else {
      const thisYear = new Date().getFullYear();
      scannedCount = leases.filter((l) => {
        if (!l.created_date) return false;
        const leaseYear = new Date(l.created_date).getFullYear();
        return leaseYear === thisYear && (l.status === "scanned" || l.status === "paid");
      }).length;
    }

    if (scannedCount >= tierLimit.limit) {
      return json(
        {
          success: false,
          error: "QUOTA_EXCEEDED",
          message: "Scan quota exceeded for your plan tier",
          diagnostic: { requestId, scannedCount, limit: tierLimit.limit },
        },
        403
      );
    }

    const { fileUrls, leaseId } = body;

    if (!leaseId) return err("MISSING_LEASE_ID", "leaseId is required", 400, requestId);

    if (!fileUrls || (Array.isArray(fileUrls) && fileUrls.length === 0)) {
      return err("VALIDATION_ERROR", "No file URLs provided", 400, requestId);
    }

    const urlArray = Array.isArray(fileUrls) ? fileUrls : [fileUrls];

    // Validate file URLs + size best-effort
    for (const url of urlArray) {
      const v = validateFileUrl(url);
      if (!v.valid) return err("INVALID_FILE_URL", v.error, 400, requestId);

      try {
        const headRes = await fetch(url, { method: "HEAD" });
        const sizeHeader = headRes.headers.get("content-length");
        if (sizeHeader && parseInt(sizeHeader, 10) > 10 * 1024 * 1024) {
          return err("FILE_TOO_LARGE", "File too large. Maximum size: 10MB", 400, requestId);
        }
      } catch {
        // ignore HEAD errors
      }
    }

    // ---------------------------
    // STEP 1: Extract clauses + key terms via LLM
    // ---------------------------
    logStage("CLAUSE_EXTRACTION_START", { fileCount: urlArray.length });

    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract ALL clauses from this residential lease document.
FOR EACH CLAUSE provide:
- clause_id: identifier (e.g., "3.2", "Section 5") or generate "CLAUSE-nnn"
- title: heading/title (empty if none)
- raw_text: complete clause text (max 600 chars)
- page_number: estimated page (1 if unsure)
- language: "th", "en", or "mixed"
ALSO EXTRACT:
- property_address (string, empty if not found)
- start_date (YYYY-MM-DD, empty if not found)
- end_date (YYYY-MM-DD, empty if not found)
- rent_amount (number, 0 if not found)
- deposit_amount (number, 0 if not found)
- notice_period_days (integer, 0 if not found)
- language_detected ("en", "th", or "mixed")
- rent_due_day (integer 1-31, 0 if not found)
- deposit_due_date (YYYY-MM-DD, empty if not found)
- deposit_return_days (integer days after lease end, 0 if not found)
Be thorough.`,
      file_urls: urlArray,
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
      property_address: extractionResult?.property_address || "",
      start_date: extractionResult?.start_date || "",
      end_date: extractionResult?.end_date || "",
      rent_amount: extractionResult?.rent_amount || 0,
      deposit_amount: extractionResult?.deposit_amount || 0,
      language_detected: extractionResult?.language_detected || "en",
      notice_period_days: extractionResult?.notice_period_days || 0,
      rent_due_day: extractionResult?.rent_due_day || 0,
      deposit_due_date: extractionResult?.deposit_due_date || "",
      deposit_return_days: extractionResult?.deposit_return_days || 0,
    };

    logStage("CLAUSES_EXTRACTED", { count: clauses.length, language: keyTerms.language_detected });

    const clauses_extracted = clauses.map((c, idx) => ({
      clause_id: String(c.clause_id || `CLAUSE-${String(idx + 1).padStart(3, "0")}`),
      heading: c.title || null,
      full_text: c.raw_text || "",
      page: c.page_number || 1,
    }));

    // Fallback simple patterns (only used if canonical fails)
    const simpleIssues = [];
    const userLang = (user.language || "en").toLowerCase();

    for (const clause of clauses) {
      const text = clause.raw_text || "";
      if (/disconnect.*utility|cut.*water|ตัด.*น้ำ|ตัด.*ไฟ/i.test(text)) {
        simpleIssues.push({
          severity: "critical",
          category: "Legal Rights",
          title: userLang === "th" ? "การตัดสาธารณูปโภค" : "Utility Disconnection",
          description: userLang === "th" ? "พบข้อกำหนดการตัดสาธารณูปโภค" : "Utility disconnection clause detected",
          explanation: userLang === "th" ? "อาจผิดกฎหมาย" : "May be illegal",
          recommendation: userLang === "th" ? "ขอให้ลบข้อกำหนดนี้" : "Request removal of this clause",
          evidence: text.substring(0, 240),
          clause_id: clause.clause_id || "",
        });
      }

      if (/forfeit.*deposit|ริบ.*มัดจำ/i.test(text)) {
        simpleIssues.push({
          severity: "high",
          category: "Financial Risk",
          title: userLang === "th" ? "การริบเงินมัดจำ" : "Deposit Forfeiture",
          description: userLang === "th" ? "พบข้อกำหนดการริบเงินมัดจำ" : "Deposit forfeiture clause detected",
          explanation: userLang === "th" ? "ความเสี่ยงการสูญเสียเงินมัดจำ" : "Risk of losing deposit",
          recommendation: userLang === "th" ? "เจรจาให้มีเงื่อนไขที่ชัดเจน" : "Negotiate for clear conditions",
          evidence: text.substring(0, 240),
          clause_id: clause.clause_id || "",
        });
      }
    }

    const simpleRiskScore = Math.min(100, simpleIssues.length * 15);

    // ---------------------------
    // STEP 2: Canonical generator (optional)
    // ---------------------------
    logStage("CANONICAL_GENERATOR_START", {});
    let canonicalReport = null;
    let canonicalError = null;

    try {
      const canonicalResult = await base44.asServiceRole.functions.invoke("clauseLedgerScan", {
        fileUrls: urlArray,
        leaseId,
        scanId,
      });

      if (canonicalResult?.data?.success && canonicalResult.data.result?.pdfPayload) {
        canonicalReport = canonicalResult.data.result;
        logStage("CANONICAL_GENERATOR_OK", {
          clauses: canonicalReport.pdfPayload?.clause_ledger?.length || 0,
          flags: canonicalReport.pdfPayload?.flags?.length || 0,
        });
      } else {
        throw new Error(canonicalResult?.data?.error || "Canonical scan returned non-success");
      }
    } catch (e) {
      canonicalError = { message: e?.message || String(e) };
      logStage("CANONICAL_GENERATOR_FAILED", canonicalError);
    }

    // ---------------------------
    // STEP 3: Build final payload (ALWAYS)
    // ---------------------------
    let pdfPayload;
    let status = "ok";
    let canonical_report;

    if (canonicalReport?.pdfPayload && Array.isArray(canonicalReport.pdfPayload.clause_ledger)) {
      pdfPayload = canonicalReport.pdfPayload;
      canonical_report = canonicalReport;
      status = "ok";
    } else {
      // Build fallback payload
      const fallbackFlags = (simpleIssues || []).map((i, idx) => ({
        clause_id: i.clause_id || `CLAUSE-${String(idx + 1).padStart(3, "0")}`,
        severity: i.severity || "medium",
        category: i.category || "Other",
        title: i.title || "Issue detected",
        description: i.description || "Review required",
        explanation: i.explanation || "",
        recommendation: i.recommendation || "Review with legal counsel",
        evidence: i.evidence || "",
      }));

      const fallbackLedger = clauses_extracted.map((c) => ({
        clause_id: c.clause_id,
        heading: c.heading,
        full_text: c.full_text,
        page: c.page,
      }));

      pdfPayload = {
        lease_address: keyTerms.property_address || "Lease Agreement",
        generated_date: new Date().toISOString(),
        risk_score: simpleRiskScore,
        summary: `${fallbackFlags.length} issues detected (fallback mode)`,
        key_terms: keyTerms,
        flags: fallbackFlags,
        clause_review: [], // filled below
        clause_ledger: fallbackLedger,
        mappings: [],
        missing_clauses: [],
        coverage_summary: {},
        fallback: true,
        fallback_reason: canonicalError ? `Generator failed: ${canonicalError.message}` : "Canonical payload missing",
      };

      canonical_report = {
        pdfPayload,
        status: "failed",
        error: canonicalError,
      };
      status = "failed";
    }

    // ---------------------------
    // STEP 4: Enforce full coverage review + coverage summary
    // ---------------------------
    const ledger = Array.isArray(pdfPayload.clause_ledger) ? pdfPayload.clause_ledger : [];
    const flags = Array.isArray(pdfPayload.flags) ? pdfPayload.flags : [];

    // Build review so ReportFull can render every clause
    const flagsByClause = new Map();
    for (const f of flags) {
      if (!f?.clause_id) continue;
      const arr = flagsByClause.get(f.clause_id) || [];
      arr.push(f);
      flagsByClause.set(f.clause_id, arr);
    }

    const fullReview = ledger.map((c) => {
      const hit = (flagsByClause.get(c.clause_id) || [])[0];
      if (hit) {
        return {
          clause_id: c.clause_id,
          risk_level: hit.severity || "medium",
          risk_summary: hit.description || hit.title || "Review required",
          recommended_change: String(hit.recommendation || "").split(/\n/)[0] || undefined,
          negotiation_tip: undefined,
          category: hit.category,
        };
      }
      return { clause_id: c.clause_id, risk_level: "none" };
    });

    const coverage = {
      total_clauses: ledger.length,
      clauses_reviewed: fullReview.length,
      clauses_flagged: fullReview.filter((r) => r.risk_level && r.risk_level !== "none").length,
    };

    pdfPayload.clause_review = fullReview;
    pdfPayload.coverage_summary = coverage;

    // ---------------------------
    // STEP 5: Persist LeaseScan (idempotent)
    // ---------------------------
    logStage("PERSIST_START", {});
    let persistedScanId = scanId;

    // Ensure scan exists
    const existing = await base44.asServiceRole.entities.LeaseScan.filter({ id: scanId }).catch(() => []);
    if (!existing || existing.length === 0) {
      const created = await base44.asServiceRole.entities.LeaseScan.create({
        lease_id: leaseId,
        status: "processing",
      });
      persistedScanId = created.id;
    }

    await base44.asServiceRole.entities.LeaseScan.update(persistedScanId, {
      lease_id: leaseId,
      status: "ok",
      risk_score: pdfPayload.risk_score || 0,
      flags: pdfPayload.flags || [],
      summary: pdfPayload.summary || "",
      scan_full: {
        clauses_extracted,
        clause_ledger: pdfPayload.clause_ledger,
        clause_review: pdfPayload.clause_review,
        key_terms: keyTerms,
        language_detected: keyTerms.language_detected,
        canonical_report: { ...canonical_report, pdfPayload },
        pipeline: stages,
        diagnostics: {
          requestId,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          clause_count: ledger.length,
          review_count: fullReview.length,
          flags_count: flags.length,
        },
        version: "scanLease-selfcontained-v1",
      },
    });

    logStage("PERSIST_OK", { persistedScanId, clauses: ledger.length, flags: flags.length });

    return json({
      success: true,
      needsMaterialization: false,
      result: {
        risk_score: pdfPayload.risk_score || 0,
        summary: pdfPayload.summary || "",
        clauses_extracted,
        clause_ledger: pdfPayload.clause_ledger,
        clause_review: pdfPayload.clause_review,
        flags: pdfPayload.flags || [],
        property_address: keyTerms.property_address,
        start_date: keyTerms.start_date,
        end_date: keyTerms.end_date,
        rent_amount: keyTerms.rent_amount,
        deposit_amount: keyTerms.deposit_amount,
        language_detected: keyTerms.language_detected,
        coverage_summary: pdfPayload.coverage_summary,
        canonical_status: status,
        has_pdf_payload: true,
      },
      diagnostic: {
        scanId: persistedScanId,
        requestId,
        totalDuration: Date.now() - startTime,
        pipelineSteps: stages.length,
      },
    });
  } catch (e) {
    if (e?.message === "UNAUTHORIZED") {
      return err("UNAUTHORIZED", "Unauthorized", 401, requestId);
    }

    console.error("[SCAN_ERROR]", e?.message || e, e?.stack || "");
    return json(
      {
        success: false,
        error: "SCAN_FAILED",
        message: "Scan failed. Please try again.",
        details: e?.message || String(e),
        diagnostic: { requestId, scanId, duration: Date.now() - startTime },
      },
      500
    );
  }
});