/**
 * analyzeLease — Downloads PDF, extracts text, calls OpenAI for clause analysis.
 * 
 * PERF FIX (2026-03-19): Reduced logging to stay within CPU time limits.
 * v1.1.0: Image file rejection
 * v1.0.0: Initial version
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import PDFParser from 'npm:pdf-parse@1.1.1/lib/pdf-parse.js';

function extractAddressFromText(text) {
  const patterns = [
    /(?:property|premises|address|located at)[:\s]+([^\n]{10,150})/i,
    /(\d+[\/\-\s]?\d*\s+[A-Za-z\s,]+(?:Road|Street|Avenue|Lane|Drive|Soi|Thanon)[^\n]{0,50})/i,
  ];
  for (const p of patterns) { const m = text.match(p); if (m) return m[1]?.trim(); }
  return null;
}

function extractDateFromText(text, type = 'start') {
  const p = type === 'start'
    ? /(?:commence|start|from)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    : /(?:end|expire|until)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
  const m = text.match(p);
  return m ? m[1] : null;
}

function extractRentFromText(text) {
  const patterns = [
    /(?:rent|rental)[:\s]+(?:THB|฿|USD|\$)?\s*([\d,]+)/i,
    /(?:monthly payment)[:\s]+(?:THB|฿|USD|\$)?\s*([\d,]+)/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { const v = parseFloat(m[1].replace(/,/g, '')); if (!isNaN(v)) return v; }
  }
  return null;
}

function extractDepositFromText(text) {
  const patterns = [
    /(?:deposit|security)[:\s]+(?:THB|฿|USD|\$)?\s*([\d,]+)/i,
    /(?:guarantee)[:\s]+(?:THB|฿|USD|\$)?\s*([\d,]+)/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { const v = parseFloat(m[1].replace(/,/g, '')); if (!isNaN(v)) return v; }
  }
  return null;
}

function extractRentDayFromText(text) {
  const patterns = [
    /(?:due on|payable on)[:\s]+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?/i,
    /(?:rent)[^\n]{0,50}(\d{1,2})(?:st|nd|rd|th)?\s+(?:of each month|day)/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { const d = parseInt(m[1]); if (d >= 1 && d <= 31) return d; }
  }
  return null;
}

Deno.serve(async (req) => {
  const cid = `analyze-${Date.now()}`;

  try {
    const T0 = Date.now();
    const base44 = createClientFromRequest(req);

    // GUARD 1: Require authenticated session
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (!user) {
      return Response.json({ ok: false, step: 'AUTH', error_code: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }
    const isAdmin = (user.role || '').toLowerCase() === 'admin';

    const bodyText = await req.text();
    let payload = {};
    try { payload = JSON.parse(bodyText || '{}'); } catch (_) { payload = {}; }

    const { fileUrl = null, leaseId = null, scanId: inputScanId = null, language = 'en', scanMode = 'full' } = payload;
    const isPreviewMode = scanMode === 'preview';

    console.log(`[ANALYZE_START] ${cid}`, { leaseId, scanMode, hasFile: !!fileUrl });

    if (!fileUrl || !leaseId) {
      return Response.json({ ok: false, step: 'INPUT_VALIDATION', error_code: 'MISSING_PARAMS', message: 'fileUrl and leaseId are required' });
    }

    // GUARD 2: Ownership validation — lease and (if provided) scan must belong to the caller (or caller is admin)
    const svcGuard = base44.asServiceRole || base44;
    const lease = await svcGuard.entities.Lease.get(leaseId).catch(() => null);
    if (!lease) {
      return Response.json({ ok: false, step: 'OWNERSHIP', error_code: 'LEASE_NOT_FOUND', message: 'Lease not found' }, { status: 404 });
    }
    const ownsLease = lease.created_by_id === user.id || lease.owner_email === user.email;
    if (!ownsLease && !isAdmin) {
      return Response.json({ ok: false, step: 'OWNERSHIP', error_code: 'FORBIDDEN', message: 'You do not have access to this lease' }, { status: 403 });
    }
    if (inputScanId) {
      const scanRecord = await svcGuard.entities.LeaseScan.get(inputScanId).catch(() => null);
      if (!scanRecord) {
        return Response.json({ ok: false, step: 'OWNERSHIP', error_code: 'SCAN_NOT_FOUND', message: 'Scan not found' }, { status: 404 });
      }
      const ownsScan = scanRecord.created_by_id === user.id || scanRecord.owner_email === user.email;
      if (!ownsScan && !isAdmin) {
        return Response.json({ ok: false, step: 'OWNERSHIP', error_code: 'FORBIDDEN', message: 'You do not have access to this scan' }, { status: 403 });
      }
    }

    // GUARD 3: Restrict fileUrl to trusted storage domain (SSRF protection)
    let parsedUrl;
    try { parsedUrl = new URL(fileUrl); } catch (_) {
      return Response.json({ ok: false, step: 'URL_VALIDATION', error_code: 'INVALID_URL', message: 'fileUrl is not a valid URL' }, { status: 400 });
    }
    const TRUSTED_FILE_HOSTS = ['qtrypzzcjebvfcihiynt.supabase.co', 'base44.app'];
    const hostOk = parsedUrl.protocol === 'https:' && TRUSTED_FILE_HOSTS.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith('.' + h));
    if (!hostOk) {
      return Response.json({ ok: false, step: 'URL_VALIDATION', error_code: 'UNTRUSTED_FILE_SOURCE', message: 'fileUrl must point to app storage' }, { status: 403 });
    }

    // File type check — reject images
    const urlPath = fileUrl.split('?')[0];
    const ext = urlPath.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'].includes(ext)) {
      return Response.json({ ok: false, step: 'FILE_TYPE_VALIDATION', error_code: 'IMAGE_NOT_SUPPORTED', message: 'Image files (JPG/PNG) are not yet supported. Please upload a PDF file.' });
    }

    // Download PDF
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      return Response.json({ ok: false, step: 'PDF_DOWNLOAD', error_code: 'DOWNLOAD_FAILED', message: `Failed to download PDF: ${pdfResponse.statusText}` });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const contentType = pdfResponse.headers.get('content-type') || '';

    if (contentType.startsWith('image/')) {
      return Response.json({ ok: false, step: 'FILE_TYPE_VALIDATION', error_code: 'IMAGE_NOT_SUPPORTED', message: 'Image files are not supported. Please upload a PDF.' });
    }

    // Extract text
    const pdfData = await PDFParser(new Uint8Array(pdfBuffer));
    const pdfText = pdfData.text || '';
    console.log(`[TIMING] PDF download+parse: ${Date.now() - T0}ms`);
    console.log(`[ANALYZE_PDF] ${cid} textLen=${pdfText.length} pages=${pdfData.numpages}`);

    if (pdfText.length < 100) {
      return Response.json({ ok: false, step: 'PDF_EXTRACTION', error_code: 'TEXT_TOO_SHORT', message: 'Extracted text is too short - PDF may be empty or image-based' });
    }

    // OpenAI analysis
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return Response.json({ ok: false, step: 'CONFIG', error_code: 'MISSING_API_KEY', message: 'OpenAI API key not configured' });
    }

    const langMap = { en: 'English', th: 'Thai', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ru: 'Russian' };
    const langName = langMap[language] || 'English';

    const systemPrompt = isPreviewMode
      ? `You are a lease analysis expert. Analyze this lease document and provide a risk assessment with executive summary and top risks.

CRITICAL: Respond entirely in ${langName}. JSON keys must remain in English.

Return a valid JSON object:
{
  "key_terms": {
    "property_address": "string or null",
    "lease_start_date": "YYYY-MM-DD or null",
    "lease_end_date": "YYYY-MM-DD or null",
    "monthly_rent": number or null,
    "security_deposit": number or null,
    "rent_due_day": number or null
  },
  "risk_score": number (0-100),
  "summary": {
    "executive_summary": "string",
    "top_risks": [{"title": "string", "severity": "low|medium|high|critical", "why": "string"}]
  },
  "preview_mode": true,
  "upgrade_message": "Upgrade to see full clause-by-clause analysis with detailed recommendations",
  "clauses": []
}
DO NOT omit key_terms. Return ONLY valid JSON.`
      : `You are a lease analysis expert specialising in Thai residential rental law. Your role is to protect the tenant by giving an accurate, balanced assessment.

CRITICAL: Respond entirely in ${langName}. JSON keys must remain in English.
CRITICAL: Analyse EVERY clause. Do not skip any.
CRITICAL: Return ONLY valid JSON. No commentary outside the JSON object.

SEVERITY DEFINITIONS — apply these consistently:

CRITICAL: The clause is potentially illegal under Thai law, exposes the tenant to severe financial loss with no recourse, or removes fundamental tenant rights entirely. Action required before signing.

HIGH: The clause significantly favours the landlord with little or no offsetting tenant protection. Meaningful financial or legal risk to the tenant. Worth negotiating.

MEDIUM: The clause is standard but contains terms the tenant should understand and clarify before signing. Some landlord-favouring language but not unusual.

LOW: The clause is balanced, standard, or contains sufficient protections for both parties. No significant concern.

BIDIRECTIONAL CLAUSE ASSESSMENT — mandatory rule:
Before assigning severity to any clause, you must identify BOTH (a) any tenant risks and (b) any tenant protections within that same clause. A clause that contains strong tenant protections such as compensation requirements, cure periods, mutual rights, or deposit return obligations must have those protections factored into the final severity rating. A clause is not HIGH simply because it addresses a sensitive topic such as termination or deposit — it is HIGH only if, after weighing both sides, the net effect significantly disadvantages the tenant.

TERMINATION CLAUSES: If a termination clause requires the landlord to pay compensation to the tenant for early termination without cause, includes a cure period before the landlord can terminate, and grants the tenant a break right with reasonable notice, the net severity should be MEDIUM or LOW unless there are additional unfair terms present.

DEPOSIT CLAUSES: If a deposit clause specifies a 30-day return window, prohibits deduction for normal wear and tear, requires an itemised deduction statement, and penalises the landlord for late return, the net severity should be LOW.

OVERALL RISK SCORE (0-100): The score must reflect the net tenant risk after accounting for protections. A well-drafted balanced lease should score below 35. A lease with no critical or high clauses should not score above 40.

RECOMMENDATION — mandatory rule:
Give exactly ONE recommendation per clause, a single sentence of specific, actionable advice grounded in that clause's actual terms, referencing the specific number, date, condition, or party named in the clause_text. Do not pad with multiple generic points. For LOW risk clauses, state that no action is needed rather than inventing advice.

BANNED PHRASES, never use these or close variants: "Negotiate this clause - view our recommended letter templates", "Use our Letter Templates to request modifications", "Request written clarification of landlord's interpretation".

Return this JSON object:
{
  "key_terms": {
    "property_address": "string or null",
    "lease_start_date": "YYYY-MM-DD or null",
    "lease_end_date": "YYYY-MM-DD or null",
    "monthly_rent": number or null,
    "security_deposit": number or null,
    "rent_due_day": number or null
  },
  "risk_score": number (0-100),
  "summary": {
    "executive_summary": "string",
    "top_risks": [{"title": "string", "severity": "low|medium|high|critical", "why": "string"}]
  },
  "clauses": [
    {
      "clause_id": "clause-N",
      "canonical_name": "string",
      "clause_text": "string",
      "risk_level": "low|medium|high|critical",
      "analysis": "string",
      "recommendation": "string",
      "page_number": number
    }
  ]
}`;

    console.log(`[TIMING] Pre-OpenAI: ${Date.now() - T0}ms`);
    const aiStart = Date.now();
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this lease document:\n\n${pdfText.substring(0, 50000)}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      return Response.json({ ok: false, step: 'OPENAI_API', error_code: 'API_ERROR', message: `OpenAI API error: ${errText}` });
    }

    const completion = await openaiResponse.json();
    const analysisResult = JSON.parse(completion.choices[0].message.content);
    console.log(`[TIMING] OpenAI: ${Date.now() - aiStart}ms`);
    console.log(`[ANALYZE_OPENAI_OK] ${cid} clauses=${analysisResult.clauses?.length || 0} risk=${analysisResult.risk_score}`);

    // Preview mode fallback for key_terms
    if (isPreviewMode && (!analysisResult.key_terms || Object.keys(analysisResult.key_terms).length === 0)) {
      analysisResult.key_terms = {
        property_address: extractAddressFromText(pdfText) || "Address not found in document",
        lease_start_date: extractDateFromText(pdfText, 'start') || null,
        lease_end_date: extractDateFromText(pdfText, 'end') || null,
        monthly_rent: extractRentFromText(pdfText) || null,
        security_deposit: extractDepositFromText(pdfText) || null,
        rent_due_day: extractRentDayFromText(pdfText) || null
      };
    }

    // Validate clause IDs
    const clauses = analysisResult.clauses || [];
    clauses.forEach((c, idx) => {
      if (!c.clause_id || !/^clause-\d+$/.test(c.clause_id)) {
        c.clause_id = `clause-${idx + 1}`;
      }
    });

    if (!analysisResult.missingCriticalClauses) {
      analysisResult.missingCriticalClauses = [];
    }

    // Agent deposit risk flag
    const depositHolderPatterns = [
      /deposit\s+(?:is\s+)?held\s+by\s+(?:the\s+)?(?:landlord|owner|lessor)/i,
      /landlord\s+(?:shall\s+)?(?:hold|retain|keep)\s+(?:the\s+)?(?:security\s+)?deposit/i,
      /owner\s+(?:shall\s+)?(?:hold|retain|keep)\s+(?:the\s+)?(?:security\s+)?deposit/i,
      /เงินประกัน.*(?:ผู้ให้เช่า|เจ้าของ)/i,
      /ผู้ให้เช่า.*(?:รับ|เก็บ|ถือ).*เงินประกัน/i
    ];

    const combinedText = pdfText.toLowerCase() + ' ' + clauses.map(c => (c.clause_text || '').toLowerCase()).join(' ');
    const depositHolderSpecified = depositHolderPatterns.some(p => p.test(combinedText));

    if (!depositHolderSpecified) {
      const flagTexts = {
        en: { title: 'Deposit Holder Not Specified', desc: 'Your lease does not confirm who holds your deposit. If paid to an agent, there is no guarantee the landlord receives it.' },
        th: { title: 'ไม่ระบุผู้ถือเงินประกัน', desc: 'สัญญาเช่าไม่ได้ระบุว่าใครเป็นผู้ถือเงินประกัน หากจ่ายให้ตัวแทน ไม่มีการรับประกันว่าเจ้าของจะได้รับเงิน' },
        zh: { title: '未指定押金持有人', desc: '您的租约未确认谁持有您的押金。如果支付给中介，无法保证房东会收到。' },
        ja: { title: '敷金の保管者が未指定', desc: '賃貸契約書に敷金の保管者が明記されていません。' },
        ko: { title: '보증금 보유자 미지정', desc: '임대차 계약서에 보증금 보유자가 명시되어 있지 않습니다.' },
        ru: { title: 'Держатель депозита не указан', desc: 'В договоре не указано, кто хранит депозит.' }
      };
      const f = flagTexts[language] || flagTexts.en;
      if (!analysisResult.flags) analysisResult.flags = [];
      analysisResult.flags.push({ severity: 'high', category: 'Deposit', description: f.desc, title: f.title });
      if (analysisResult.summary?.top_risks) {
        analysisResult.summary.top_risks.push({ title: f.title, severity: 'high', why: f.desc });
      }
    }

    // Build scan_full
    const scanFull = {
      risk_score: analysisResult.risk_score || 0,
      summary: analysisResult.summary || { executive_summary: "Lease analysis complete.", top_risks: [] },
      key_terms: analysisResult.key_terms || {},
      clauses,
      flags: analysisResult.flags || [],
      missingCriticalClauses: analysisResult.missingCriticalClauses || [],
      missingClauseCount: (analysisResult.missingCriticalClauses || []).length,
      preview_mode: isPreviewMode,
      upgrade_message: isPreviewMode ? analysisResult.upgrade_message : undefined,
      meta: { text_length: pdfText.length, chunks: 1, warnings: [] }
    };

    // Update scan record in DB
    const svc = base44.asServiceRole || base44;
    let targetScanId = inputScanId;

    if (!targetScanId) {
      const newScan = await svc.entities.LeaseScan.create({ lease_id: leaseId, status: 'processing' });
      targetScanId = newScan.id;
    }

    await svc.entities.LeaseScan.update(targetScanId, {
      scan_full: scanFull,
      risk_score: scanFull.risk_score,
      summary: scanFull.summary?.executive_summary || "Lease analysis complete.",
      status: 'completed'
    });

    console.log(`[TIMING] TOTAL: ${Date.now() - T0}ms`);
    console.log(`[ANALYZE_DONE] ${cid} scanId=${targetScanId}`);

    return Response.json({
      ok: true, scanId: targetScanId, leaseId, scan_full: scanFull
    });

  } catch (error) {
    console.error(`[ANALYZE_ERROR] ${cid}`, error.message, error.stack);
    return Response.json({
      ok: false, step: 'FUNCTION_CRASH', error_code: 'UNHANDLED_EXCEPTION',
      message: String(error?.message || error)
    });
  }
});