import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

// MASTER HOTFIX: scanLease must never crash, never 500, JS only, single responsibility
// Phases: 1) LLM extraction (20s timeout) 2) Regex risk detection (local only) 3) Safe persistence

Deno.serve(async (req) => {
  const startTime = Date.now();
  const debugLog = { stage: "INIT", warnings: [], stages: [] };
  const log = (stage, data) => {
    try {
      debugLog.stage = stage;
      debugLog.stages.push({ stage, ts: Date.now() - startTime, ...(data || {}) });
    } catch (_) {}
  };

  const json = (status, body) => new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

  const safeBody = async () => {
    try { return await req.json(); } catch { return {}; }
  };

  try {
    log("PARSE_BODY");
    const body = await safeBody();
    const scanIdInput = body.scanId || null;
    const leaseId = body.leaseId || null;
    const fileUrlsRaw = body.fileUrls || body.file_urls || null;

    // Auth
    log("AUTH_START");
    let base44, user;
    try {
      base44 = createClientFromRequest(req);
      user = await base44.auth.me();
      log("AUTH_OK", { userId: user?.id || null });
    } catch (e) {
      const msg = String(e?.message || e || "Unauthorized");
      console.error(JSON.stringify({ stage: "AUTH", message: msg, stack: String(e?.stack || "") }));
      log("AUTH_FAIL", { message: msg });
      return json(200, {
        success: false,
        status: "partial",
        error: "UNAUTHORIZED",
        debugLog,
      });
    }

    // Validate
    log("VALIDATE");
    if (!leaseId) {
      return json(200, { success: false, status: "partial", error: "MISSING_LEASE_ID", debugLog });
    }
    const fileUrls = Array.isArray(fileUrlsRaw) ? fileUrlsRaw : (fileUrlsRaw ? [fileUrlsRaw] : []);
    if (fileUrls.length === 0) {
      return json(200, { success: false, status: "partial", error: "NO_FILE_URLS", debugLog });
    }

    // PHASE 1 – Clause Extraction (LLM) with 20s timeout, no retries beyond 1
    log("EXTRACT_START");
    let clauses = [];
    let extractionFailed = false;
    let extractionTimedOut = false;

    const extractionCall = async () => {
      // Minimal prompt: only clauses
      return await base44.integrations.Core.InvokeLLM({
        prompt: "Extract clauses from the lease. Return JSON {clauses:[{clause_id,title,raw_text,page_number}]}.",
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
                  page_number: { type: "integer" }
                },
                required: ["clause_id", "raw_text"]
              }
            }
          },
          required: ["clauses"]
        }
      });
    };

    const timeoutMs = 20000;
    let extracted = null;
    try {
      extracted = await Promise.race([
        extractionCall(),
        new Promise((resolve, reject) => setTimeout(() => { extractionTimedOut = true; reject(new Error("TIMEOUT")); }, timeoutMs))
      ]);
    } catch (e) {
      const msg = String(e?.message || e);
      extractionFailed = true;
      log("EXTRACT_FAIL", { message: msg, timeout: extractionTimedOut });
      debugLog.warnings.push("EXTRACTION_FAILED");
    }

    if (!extractionFailed && extracted && Array.isArray(extracted.clauses)) {
      clauses = extracted.clauses.map((c, i) => ({
        clause_id: String(c?.clause_id || `CLAUSE-${i + 1}`),
        heading: c?.title || null,
        full_text: c?.raw_text || "",
        page: Number(c?.page_number || 1)
      }));
      if (clauses.length === 0) extractionFailed = true;
    }

    if (extractionFailed) {
      if (extractionTimedOut) debugLog.warnings.push("EXTRACTION_TIMEOUT");
      // Fallback clause per spec
      clauses = [{ clause_id: "UNKNOWN", heading: "Unparsed Lease", full_text: "Extraction failed", page: 1 }];
    }

    // PHASE 2 – Risk Detection (LOCAL ONLY, regex-based)
    log("RISK_START");
    let flags = [];

    const patterns = [
      { key: "deposit_forfeiture", rx: /(forfeit|forfeiture|confiscate).*deposit|deposit.*(forfeit|non[- ]?refundable)/i, title: "Deposit forfeiture" },
      { key: "unlimited_landlord_access", rx: /(landlord|lessor).*(enter|access|inspection).*(any time|at any time|without notice|without prior notice)/i, title: "Unlimited landlord access" },
      { key: "unilateral_termination", rx: /(landlord|lessor).*(terminate|cancel|end).*(sole discretion|without cause|any time)/i, title: "Unilateral landlord termination" },
      { key: "penalties_gt_rent", rx: /((penalt(y|ies)|fine|fee).*(per day|per month|%|percent))|(\b(2x|two times|3x|three times|twice)\b.*rent)/i, title: "Penalties exceeding rent" },
      { key: "waiver_of_rights", rx: /(waive|waiver).*(rights|right|claim|liability)/i, title: "Waiver of tenant rights" },
      { key: "short_term_ban", rx: /(short[- ]?term|daily|airbnb|nightly).*(rent|letting|sublet|lease|rental)|\bno\s+(daily|short[- ]?term)\s+(rental|letting)\b/i, title: "Short-term letting ban" },
      { key: "no_repair_obligation", rx: /(landlord|lessor).*(no obligation|not responsible|not liable).*(repair|maintenance|fix)/i, title: "Landlord no repair obligation" },
      { key: "automatic_renewal", rx: /(auto|automatic).*(renew|renewal)|renew.*(automatically|unless\s+notice)/i, title: "Automatic renewal" }
    ];

    const scanText = (txt) => String(txt || "");

    for (const c of clauses) {
      const text = `${scanText(c.heading)}\n${scanText(c.full_text)}`;
      for (const p of patterns) {
        if (p.rx.test(text)) {
          flags.push({ clause_id: c.clause_id, key: p.key, title: p.title, description: p.title });
        }
      }
    }

    let clause_review = [];
    if (flags.length === 0) {
      debugLog.warnings.push("NO_RISK_DETECTED");
      clause_review = clauses.map((c) => ({ clause_id: c.clause_id, risk_level: "none", risk_summary: "No risk detected" }));
    } else {
      const flagged = new Set(flags.map(f => f.clause_id));
      clause_review = clauses.map((c) => ({ clause_id: c.clause_id, risk_level: flagged.has(c.clause_id) ? "medium" : "none", risk_summary: flagged.has(c.clause_id) ? "Pattern risk detected" : "No risk detected" }));
    }

    const risk_score = Math.min(100, flags.length * 12);

    // PHASE 3 – Persistence (SAFE)
    log("PERSIST_START");
    let persisted = true;
    let persistedScanId = scanIdInput || null;
    let persistError = null;

    try {
      if (persistedScanId) {
        try {
          await base44.asServiceRole.entities.LeaseScan.update(persistedScanId, {
            lease_id: leaseId,
            status: "completed",
            risk_score,
            flags,
            scan_full: {
              pipeline: debugLog.stages,
              summary: { clause_count: clauses.length, flags: flags.length }
            }
          });
        } catch (e) {
          // If update failed, fall back to create
          const created = await base44.asServiceRole.entities.LeaseScan.create({
            lease_id: leaseId,
            status: "completed",
            risk_score,
            flags,
            scan_full: {
              pipeline: debugLog.stages,
              summary: { clause_count: clauses.length, flags: flags.length }
            }
          });
          persistedScanId = created?.id || persistedScanId;
        }
      } else {
        const created = await base44.asServiceRole.entities.LeaseScan.create({
          lease_id: leaseId,
          status: "completed",
          risk_score,
          flags,
          scan_full: {
            pipeline: debugLog.stages,
            summary: { clause_count: clauses.length, flags: flags.length }
          }
        });
        persistedScanId = created?.id || null;
      }

      // Best-effort mark lease as scanned
      try { await base44.asServiceRole.entities.Lease.update(leaseId, { status: "scanned" }); } catch (_) {}
    } catch (e) {
      persisted = false;
      persistError = String(e?.message || e || "DB write failed");
      console.error(JSON.stringify({ stage: "PERSIST", message: persistError, stack: String(e?.stack || "") }));
      log("PERSIST_FAIL", { message: persistError });
    }

    // Respond per contract
    if (!extractionFailed && persisted) {
      log("DONE", { elapsedMs: Date.now() - startTime });
      return json(200, {
        success: true,
        scanId: persistedScanId,
        status: "completed",
        risk_score,
        flags,
        clause_review,
        debugLog,
      });
    }

    const errorCode = extractionFailed && extractionTimedOut
      ? "EXTRACTION_TIMEOUT"
      : extractionFailed
        ? "EXTRACTION_FAILED"
        : (!persisted ? "DB_WRITE_FAILED" : "RULE_ENGINE_FAILED");

    log("PARTIAL", { error: errorCode, elapsedMs: Date.now() - startTime });
    return json(200, {
      success: false,
      status: "partial",
      error: errorCode,
      persisted,
      scanId: persistedScanId,
      risk_score,
      flags,
      clause_review,
      debugLog,
    });
  } catch (fatal) {
    const msg = String(fatal?.message || fatal || "FATAL");
    console.error(JSON.stringify({ stage: "FATAL", message: msg, stack: String(fatal?.stack || "") }));
    debugLog.warnings.push("FATAL");
    debugLog.stage = "FATAL";
    return json(200, {
      success: false,
      status: "partial",
      error: "FATAL",
      debugLog,
    });
  }
});