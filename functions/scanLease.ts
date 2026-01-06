import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import pdfParse from 'npm:pdf-parse@1.1.1';
import mammoth from 'npm:mammoth@1.6.0';
import { Buffer } from 'node:buffer';

// Text-only, chunked lease scan pipeline (no vision, no file attachments)
// - Extracts plain text from PDF/DOCX
// - Splits into 8k-char chunks and performs two phases:
//   Phase 1: Clause extraction per chunk (text-only LLM)
//   Phase 2: Clause analysis per clause (text-only LLM)
// - Persists ONLY on success with complete scan_full; never writes placeholders

const MAX_CHARS_PER_CHUNK = 8000;

function json(status, body) {
  let payload;
  try {
    if (body && body.ok === true) {
      const { scanId, leaseId, debugLog, ...rest } = body;
      payload = {
        ok: true,
        scanId: scanId ?? null,
        leaseId: leaseId ?? null,
        result: rest || {},
        debugLog: debugLog ?? null,
      };
    } else if (body && body.ok === false) {
      const { error_code, step, message, retryable, debugLog } = body;
      payload = {
        ok: false,
        error_code: error_code || 'UNKNOWN_ERROR',
        step: step || body?.stage || 'unspecified',
        message: (typeof message === 'string' ? message : String(message || '')),
        retryable: typeof retryable === 'boolean' ? retryable : true,
        debugLog: debugLog ?? null,
      };
    } else {
      payload = {
        ok: false,
        error_code: 'INVALID_RESPONSE',
        step: 'response_build',
        message: 'Handler returned an invalid shape',
        retryable: true,
        debugLog: body?.debugLog ?? null,
      };
    }
  } catch (e) {
    payload = {
      ok: false,
      error_code: 'RESPONSE_NORMALIZE_ERROR',
      step: 'response_build',
      message: String(e?.message || e),
      retryable: true,
      debugLog: body?.debugLog ?? null,
    };
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function requireAuth(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) throw new Error('UNAUTHORIZED');
  return { base44, user };
}

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    const i = p.lastIndexOf('.')
    return i >= 0 ? p.slice(i + 1) : '';
  } catch {
    return '';
  }
}

function guessMime(contentType, url) {
  const ct = (contentType || '').toLowerCase();
  if (ct) return ct;
  const ext = extFromUrl(url);
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'txt') return 'text/plain';
  if (['png','jpg','jpeg','webp','gif'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return 'application/octet-stream';
}

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FETCH_FAIL ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || '';
  return { arrayBuffer, contentType };
}

async function extractTextFromUrl(url) {
  // Download and extract text depending on MIME
  const { arrayBuffer, contentType } = await fetchBytes(url);
  const mime = guessMime(contentType, url);
  const u8 = new Uint8Array(arrayBuffer);
  const mode = mime.includes('pdf')
    ? 'pdf_text'
    : mime.includes('wordprocessingml')
    ? 'docx_text'
    : mime.startsWith('text/')
    ? 'plain_text'
    : 'binary_unknown';

  if (mode === 'pdf_text') {
    const buf = Buffer.from(u8);
    const parsed = await pdfParse(buf);
    return { text: (parsed?.text || '').trim(), mime, extraction_mode: 'pdf_text' };
  }
  if (mode === 'docx_text') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: (result?.value || '').trim(), mime, extraction_mode: 'docx_text' };
  }
  if (mode === 'plain_text') {
    const dec = new TextDecoder('utf-8');
    const text = dec.decode(u8).trim();
    return { text, mime, extraction_mode: 'plain_text' };
  }
  // Images or unknown binaries → no OCR fallback allowed; return empty
  return { text: '', mime, extraction_mode: 'binary_unknown' };
}

function chunkText(str, maxLen = MAX_CHARS_PER_CHUNK) {
  const s = String(str || '');
  const chunks = [];
  for (let i = 0; i < s.length; i += maxLen) {
    chunks.push(s.slice(i, i + maxLen));
  }
  return chunks;
}

function normalizeClauseSignature(c) {
  const title = (c?.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const text = (c?.text || c?.raw_text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return `${title}__${text.slice(0, 160)}`; // deterministic lightweight signature
}

async function llmExtractClauses(base44, textChunk) {
  // TEXT-ONLY LLM call. No files, no images, no attachments.
  const prompt = `You are a precise contract parser.
From the following lease text, extract an ordered list of clauses.
Return ONLY JSON per this schema:
{
  "clauses": [
    {
      "clause_id": string,          // deterministic, if missing create using an incremental format like "CLAUSE-001"
      "clause_number": number,      // the visible/implicit number if present; otherwise a running index starting at 1
      "title": string|null,         // may be null/empty if not present
      "text": string,               // the exact clause text excerpt (<= 1200 chars)
      "page_number": number|null    // if not known, null
    }
  ]
}
Rules:
- Do not include analysis, risks, or taxonomy. Extraction only.
- Keep text concise but faithful (<=1200 chars per clause).
- Preserve order as found in the input text.
- If numbering not explicit, assign incrementally starting at 1 within this chunk.

LEASE TEXT CHUNK START:\n\n${textChunk}\n\nLEASE TEXT CHUNK END.`;

  const schema = {
    type: 'object',
    properties: {
      clauses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            clause_id: { type: 'string' },
            clause_number: { type: 'number' },
            title: { anyOf: [ { type: 'string' }, { type: 'null' } ] },
            text: { type: 'string' },
            page_number: { anyOf: [ { type: 'number' }, { type: 'null' } ] },
          },
          required: ['clause_id','clause_number','text']
        }
      }
    },
    required: ['clauses']
  };

  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: false,
    response_json_schema: schema,
  });
  const clauses = Array.isArray(res?.clauses) ? res.clauses : [];
  return clauses.map((c, idx) => ({
    clause_id: String(c?.clause_id || `CLAUSE-${String(idx + 1).padStart(3,'0')}`),
    clause_number: Number(c?.clause_number ?? idx + 1),
    title: c?.title ? String(c.title) : null,
    text: String(c?.text || ''),
    page_number: (typeof c?.page_number === 'number') ? c.page_number : null,
  }));
}

async function llmAnalyzeClause(base44, clause) {
  // TEXT-ONLY LLM analysis of a single clause
  const prompt = `Analyze the following lease clause and output ONLY JSON matching this schema.\n\nSchema: {\n  clause_id: string,\n  clause_number: number,\n  page_number: number|null,\n  risk_level: "NO_RISK"|"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",\n  taxonomy_code: string|null,\n  title: string,\n  rationale: string,\n  recommended_actions: string[],\n  confidence: "HIGH"|"MEDIUM"|"LOW",\n  risk_items: [\n    {\n      risk_level: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",\n      taxonomy_code: string,\n      title: string,\n      rationale: string,\n      recommended_actions: string[],\n      confidence: "HIGH"|"MEDIUM"|"LOW"\n    }\n  ]\n}\nRules:\n- Exactly the JSON object, no extra prose.\n- If risk_level != NO_RISK: taxonomy_code required and at least 1 recommended_actions.\n- rationale is always required.\n\nCLAUSE:\nID: ${clause.clause_id}\nNUMBER: ${clause.clause_number}\nPAGE: ${clause.page_number ?? 'n/a'}\nTITLE: ${clause.title || 'n/a'}\nTEXT:\n---\n${clause.text}\n---`;

  const schema = {
    type: 'object',
    properties: {
      clause_id: { type: 'string' },
      clause_number: { type: 'number' },
      page_number: { anyOf: [ { type: 'number' }, { type: 'null' } ] },
      risk_level: { type: 'string', enum: ['NO_RISK','LOW','MEDIUM','HIGH','CRITICAL'] },
      taxonomy_code: { anyOf: [ { type: 'string' }, { type: 'null' } ] },
      title: { type: 'string' },
      rationale: { type: 'string' },
      recommended_actions: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'string', enum: ['HIGH','MEDIUM','LOW'] },
      risk_items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            risk_level: { type: 'string', enum: ['LOW','MEDIUM','HIGH','CRITICAL'] },
            taxonomy_code: { type: 'string' },
            title: { type: 'string' },
            rationale: { type: 'string' },
            recommended_actions: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string', enum: ['HIGH','MEDIUM','LOW'] },
          },
          required: ['risk_level','taxonomy_code','title','rationale','recommended_actions','confidence']
        }
      }
    },
    required: ['clause_id','clause_number','risk_level','title','rationale','recommended_actions','confidence','risk_items']
  };

  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: false,
    response_json_schema: schema,
  });

  // Minimal normalization and guarantees
  const riskItems = Array.isArray(res?.risk_items) ? res.risk_items : [];
  const normalizedItems = riskItems
    .map((it) => ({
      risk_level: String(it?.risk_level || 'LOW').toUpperCase(),
      taxonomy_code: String(it?.taxonomy_code || 'CAT-UNMAPPED'),
      title: String(it?.title || clause.title || `Clause ${clause.clause_number}`),
      rationale: String(it?.rationale || res?.rationale || ''),
      recommended_actions: Array.isArray(it?.recommended_actions) ? it.recommended_actions.filter(Boolean) : [],
      confidence: String(it?.confidence || 'LOW').toUpperCase(),
    }))
    .filter((it) => it.title && it.rationale);

  const rank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const top = normalizedItems.slice().sort((a,b)=> (rank[b.risk_level]||0) - (rank[a.risk_level]||0))[0];

  const summaryRisk = normalizedItems.length ? (top?.risk_level || 'LOW') : String(res?.risk_level || 'NO_RISK').toUpperCase();
  const summaryTitle = normalizedItems.length ? (top?.title || res?.title || clause.title || `Clause ${clause.clause_number}`) : String(res?.title || clause.title || `Clause ${clause.clause_number}`);
  const summaryRationale = normalizedItems.length ? (top?.rationale || res?.rationale || '') : String(res?.rationale || '').trim();
  const summaryReco = normalizedItems.length ? (Array.isArray(top?.recommended_actions) ? top.recommended_actions.filter(Boolean) : []) : (Array.isArray(res?.recommended_actions) ? res.recommended_actions.filter(Boolean) : []);
  const summaryConf = normalizedItems.length ? String(top?.confidence || 'LOW').toUpperCase() : String(res?.confidence || 'LOW').toUpperCase();
  const summaryTax = normalizedItems.length ? (top?.taxonomy_code ?? res?.taxonomy_code ?? null) : (res?.taxonomy_code ?? null);

  const row = {
    clause_id: String(res?.clause_id || clause.clause_id),
    clause_number: Number(res?.clause_number ?? clause.clause_number),
    page_number: (typeof res?.page_number === 'number') ? res.page_number : (clause.page_number ?? null),
    risk_level: summaryRisk,
    taxonomy_code: summaryTax,
    title: summaryTitle,
    rationale: summaryRationale || 'Automated rationale missing; manual review advised.',
    recommended_actions: Array.isArray(summaryReco) ? summaryReco : [],
    confidence: summaryConf,
    risk_items: normalizedItems,
  };

  if (row.risk_level !== 'NO_RISK' && (!row.risk_items || row.risk_items.length === 0)) {
    row.risk_items = [{
      risk_level: row.risk_level,
      taxonomy_code: row.taxonomy_code || 'CAT-UNMAPPED',
      title: row.title,
      rationale: row.rationale,
      recommended_actions: row.recommended_actions.length ? row.recommended_actions : ['Request clarification or add protective language.'],
      confidence: row.confidence || 'LOW'
    }];
  }

  return row;
}

function buildFlagsFromIssues(issues, clauses) {
  const byId = new Map((clauses||[]).map(c => [c.clause_id, c]));
  const sevMap = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low', NO_RISK: 'low' };
  return (issues||[]).map((r) => ({
    clause_id: r.clause_id,
    severity: sevMap[r.risk_level] || 'medium',
    category: r.taxonomy_code || 'Unclassified',
    title: r.title || 'Risk',
    description: r.rationale || r.title || 'Review required',
    explanation: r.rationale || '',
    recommendation: Array.isArray(r.recommended_actions) ? r.recommended_actions.join('\n') : '',
    evidence: String(byId.get(r.clause_id)?.text || '').slice(0, 240)
  }));
}

function computeSummary(issues) {
  const n = (issues||[]).length;
  return n > 0 ? `${n} issues found. Review recommendations before signing.` : 'No major issues detected.';
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  const debugLog = {
    startedAt: new Date(startedAt).toISOString(),
    mime: [],
    extraction_mode: 'text_only',
    extract: { chunks_total: 0, chunks_succeeded: 0, chunks_failed: 0, retries_used: 0, elapsedMs: 0 },
    timings: {},
    pipeline: []
  };

  const time = (label, t0) => { debugLog.timings[label] = Date.now() - t0; };
  const stage = (name, meta={}) => debugLog.pipeline.push({ stage: name, at: new Date().toISOString(), ...meta });

  try {
    // Parse body
    const body = await req.json().catch(() => ({}));
    const scanId = body?.scanId || null;
    const leaseId = body?.leaseId || null;
    const rawFileUrls = body?.fileUrls || body?.file_url || body?.fileURL || [];
    const fileUrls = Array.isArray(rawFileUrls) ? rawFileUrls : [rawFileUrls].filter(Boolean);

    if (!leaseId) return { ok: false, error_code: 'MISSING_LEASE_ID', step: 'input', message: 'leaseId is required', retryable: false, scanId, leaseId, debugLog };
    if (!fileUrls || fileUrls.length === 0) return { ok: false, error_code: 'NO_FILE_URLS', step: 'input', message: 'fileUrls are required', retryable: false, scanId, leaseId, debugLog };

    // Auth
    const tAuth = Date.now();
    const { base44, user } = await requireAuth(req);
    time('AUTH', tAuth);

    // TEXT EXTRACTION (no OCR fallback)
    stage('FETCH_AND_EXTRACT_START');
    const tExtract = Date.now();

    let combinedText = '';
    for (const url of fileUrls) {
      try {
        const info = await extractTextFromUrl(url);
        debugLog.mime.push({ url, detected: info.mime, extraction_mode: info.extraction_mode });
        if (info.text) {
          combinedText += (combinedText ? '\n\n--- FILE BREAK ---\n\n' : '') + info.text;
        }
      } catch (e) {
        debugLog.mime.push({ url, detected: 'error', extraction_mode: 'error', err: String(e?.message || e) });
      }
    }

    time('TEXT_EXTRACT', tExtract);
    stage('FETCH_AND_EXTRACT_DONE', { total_len: combinedText.length });

    if (!combinedText || combinedText.length < 300) {
      return { ok: false, error_code: 'TEXT_EXTRACTION_EMPTY', step: 'extract', message: 'Extracted text too short', retryable: true, scanId, leaseId, debugLog };
    }

    // PHASE 1: Chunk + extract clauses (TEXT-ONLY)
    stage('CLAUSE_EXTRACT_START');
    const tC1 = Date.now();

    const chunks = chunkText(combinedText, MAX_CHARS_PER_CHUNK);
    debugLog.extract.chunks_total = chunks.length;

    const extracted = [];
    const seen = new Set();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const part = await llmExtractClauses(base44, chunk);
        for (const c of part) {
          const sig = normalizeClauseSignature(c);
          if (!sig || seen.has(sig)) continue;
          seen.add(sig);
          extracted.push({
            clause_id: c.clause_id,
            clause_number: extracted.length + 1, // deterministic re-index across all chunks
            title: c.title || null,
            text: c.text || '',
            page_number: typeof c.page_number === 'number' ? c.page_number : null,
          });
        }
        debugLog.extract.chunks_succeeded += 1;
      } catch (e) {
        debugLog.extract.chunks_failed += 1;
        return { ok: false, error_code: 'LLM_EXTRACT_FAILED', step: 'extract', message: String(e?.message || e), retryable: true, scanId, leaseId, debugLog };
      }
    }

    debugLog.extract.elapsedMs = Date.now() - tC1;
    time('CLAUSE_EXTRACT', tC1);
    stage('CLAUSE_EXTRACT_DONE', { clauses_extracted: extracted.length });

    if (!extracted.length) {
      return { ok: false, error_code: 'TEXT_EXTRACTION_EMPTY', step: 'extract', message: 'No clauses extracted', retryable: true, scanId, leaseId, debugLog };
    }

    // PHASE 2: Analyze each clause (TEXT-ONLY)
    stage('CLAUSE_ANALYZE_START');
    const tC2 = Date.now();

    const clause_ledger = [];
    for (const clause of extracted) {
      try {
        const row = await llmAnalyzeClause(base44, clause);
        clause_ledger.push(row);
      } catch (e) {
        return json(200, { ok: false, error_code: 'LLM_ANALYZE_FAILED', retryable: true, message: String(e?.message || e), debugLog });
      }
    }

    time('CLAUSE_ANALYZE', tC2);
    stage('CLAUSE_ANALYZE_DONE', { ledger_rows: clause_ledger.length });

    if (clause_ledger.length !== extracted.length) {
      return json(200, { ok: false, error_code: 'CoverageFailure_MismatchCounts', retryable: true, debugLog });
    }

    // Derive issues and flags
    const issues_validated = clause_ledger.flatMap((r) => Array.isArray(r?.risk_items) ? r.risk_items.map((item) => ({
      clause_id: r.clause_id,
      clause_number: r.clause_number,
      page_number: r.page_number ?? null,
      risk_level: String(item.risk_level || 'LOW').toUpperCase(),
      taxonomy_code: item.taxonomy_code || r.taxonomy_code || 'Unclassified',
      title: item.title || r.title,
      rationale: item.rationale || r.rationale,
      recommended_actions: Array.isArray(item.recommended_actions) ? item.recommended_actions : [],
      confidence: String(item.confidence || 'LOW').toUpperCase(),
    })) : []);

    const flags = buildFlagsFromIssues(issues_validated, extracted);
    const summary = computeSummary(issues_validated);

    const risk_score = Math.min(
      100,
      issues_validated.reduce((acc, r) => acc + (r.risk_level === 'CRITICAL' ? 25 : r.risk_level === 'HIGH' ? 18 : r.risk_level === 'MEDIUM' ? 10 : 6), 0)
    );

    // WRITE ONCE (end) — update existing scan or create new with full scan_full
    stage('PERSIST_START');
    const tPersist = Date.now();

    let targetScanId = scanId;
    let existing = null;
    if (targetScanId) {
      const arr = await (await requireAuth(req)).base44.asServiceRole.entities.LeaseScan.filter({ id: targetScanId });
      existing = arr?.[0] || null;
    }

    let persisted = null;
    if (existing) {
      persisted = await (await requireAuth(req)).base44.asServiceRole.entities.LeaseScan.update(targetScanId, {
        lease_id: leaseId,
        status: 'completed',
        risk_score,
        flags,
        summary,
        scan_full: {
          clauses_extracted: extracted,
          clause_ledger,
          issues_validated,
          flags,
          summary,
          debugLog,
          pipeline: debugLog.pipeline,
          version: 'text-only-v1'
        },
      });
    } else {
      const created = await (await requireAuth(req)).base44.asServiceRole.entities.LeaseScan.create({
        lease_id: leaseId,
        status: 'completed',
        risk_score,
        flags,
        summary,
        scan_full: {
          clauses_extracted: extracted,
          clause_ledger,
          issues_validated,
          flags,
          summary,
          debugLog,
          pipeline: debugLog.pipeline,
          version: 'text-only-v1'
        },
      });
      targetScanId = created.id;
      persisted = created;
    }

    time('PERSIST', tPersist);
    stage('PERSIST_DONE', { scanId: targetScanId });

    // POST-WRITE VERIFY
    stage('VERIFY_START');
    const tVerify = Date.now();
    const savedArr = await (await requireAuth(req)).base44.asServiceRole.entities.LeaseScan.filter({ id: targetScanId });
    const saved = savedArr?.[0] || null;
    const sf = saved?.scan_full || {};
    const okCounts = Array.isArray(sf?.clauses_extracted) && Array.isArray(sf?.clause_ledger) && sf.clauses_extracted.length > 0 && sf.clauses_extracted.length === sf.clause_ledger.length;
    time('VERIFY', tVerify);
    stage('VERIFY_DONE', { okCounts });

    if (!okCounts) {
      return json(200, { ok: false, error_code: 'PersistVerificationFailed', retryable: false, scanId: targetScanId, debugLog });
    }

    // Optionally mark lease scanned (kept for compatibility)
    try {
      await (await requireAuth(req)).base44.asServiceRole.entities.Lease.update(leaseId, { status: 'scanned' });
    } catch { /* non-blocking */ }

    return json(200, {
      ok: true,
      success: true,
      status: 'ok',
      scanId: targetScanId,
      leaseId,
      risk_score,
      summary,
      flags,
      clauses_extracted: extracted,
      clause_ledger,
      issues_validated,
      debugLog,
    });
  } catch (e) {
    return json(200, {
      ok: false,
      error_code: 'SCAN_FATAL',
      retryable: true,
      message: String(e?.message || e),
      debugLog
    });
  }
});