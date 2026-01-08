export default {
  async fetch(req, env) {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (req.method !== "POST") {
      return json({ ok: false, step: "METHOD", error_code: "POST_ONLY", message: "POST only" });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, step: "BODY_PARSE", error_code: "INVALID_JSON", message: "Body must be JSON" });
    }

    const { leaseId = null, fileUrl = null, language = "en" } = body || {};
    if (!fileUrl) {
      return json({ ok: false, step: "VALIDATION", error_code: "MISSING_FILE_URL", message: "fileUrl required", leaseId });
    }
    if (!env.OPENAI_API_KEY) {
      return json({ ok: false, step: "CONFIG", error_code: "MISSING_OPENAI_API_KEY", message: "OPENAI_API_KEY not set", leaseId });
    }

    // Detect file type
    const isPdf = fileUrl.toLowerCase().includes('.pdf');
    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(fileUrl);

    const systemPrompt = `You are an expert legal analyst specializing in residential lease agreements. Analyze the lease document thoroughly and extract ALL significant clauses (minimum 8-15 clauses).

For EACH clause, provide:
1. Exact text excerpt from the lease (max 200 characters)
2. Canonical name (e.g., "Rent Amount", "Security Deposit", "Termination Notice")
3. Risk level: none, low, medium, high, or critical
4. Plain English explanation - what this clause means for the tenant
5. Recommended action - specific steps the tenant should take

Focus on tenant-risky clauses like:
- Early termination penalties
- Deposit forfeiture conditions
- Late payment fees
- Rent increase clauses
- Landlord entry rights
- Subletting restrictions
- Maintenance responsibilities
- Notice period requirements

Return ONLY valid JSON in this EXACT format:
{
  "risk_score": 0-100,
  "summary": {
    "executive_summary": "2-3 sentence overview of lease quality",
    "top_risks": [
      {"title": "Risk name", "severity": "high", "why": "Brief explanation"}
    ]
  },
  "clauses": [
    {
      "clause_id": "unique_id",
      "canonical_name": "Clause Title",
      "clause_text": "exact text from lease",
      "risk_level": "none|low|medium|high|critical",
      "explanation": "Plain English explanation for tenant",
      "recommended_action": "Specific action tenant should take"
    }
  ],
  "meta": {
    "text_length": 5000,
    "chunks": 1
  }
}`;

    let userContent;
    
    if (isImage && !isPdf) {
      // Use Vision API for images
      userContent = [
        { type: "text", text: "Analyze this residential lease document thoroughly. Extract ALL significant clauses (minimum 8-15). Document may be in Thai, English, or both." },
        { type: "image_url", image_url: { url: fileUrl } }
      ];
    } else {
      // For PDFs, include URL in text prompt (OpenAI will fetch and parse it)
      userContent = `Analyze the lease document at this URL: ${fileUrl}

Extract ALL significant clauses (minimum 8-15). Document may be in Thai, English, or both. For each clause, provide risk_level, explanation, and recommended_action.`;
    }

    // Call OpenAI
    let res;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
          temperature: 0.2
        })
      });
    } catch (e) {
      return json({
        ok: false,
        step: "OPENAI_FETCH",
        error_code: "FETCH_FAILED",
        message: e.message,
        retryable: true,
        leaseId
      });
    }

    if (!res.ok) {
      const err = await res.text();
      return json({
        ok: false,
        step: "OPENAI_HTTP",
        error_code: `HTTP_${res.status}`,
        message: err.substring(0, 400),
        retryable: res.status >= 500 || res.status === 429,
        leaseId
      });
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      return json({
        ok: false,
        step: "PARSE_RESPONSE",
        error_code: "BAD_JSON",
        message: e.message,
        retryable: true,
        leaseId
      });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return json({
        ok: false,
        step: "EXTRACT_CONTENT",
        error_code: "NO_CONTENT",
        message: "Empty response from OpenAI",
        retryable: true,
        leaseId
      });
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // Try extract from markdown code block
      const match = content.match(/```json\s*(\{[\s\S]*\})\s*```/);
      if (match) {
        try {
          result = JSON.parse(match[1]);
        } catch {
          return json({
            ok: false,
            step: "PARSE_JSON",
            error_code: "INVALID_JSON",
            message: "Could not parse AI response",
            retryable: true,
            leaseId,
            debugLog: { preview: content.substring(0, 400) }
          });
        }
      } else {
        return json({
          ok: false,
          step: "PARSE_JSON",
          error_code: "INVALID_JSON",
          message: e.message,
          retryable: true,
          leaseId,
          debugLog: { preview: content.substring(0, 400) }
        });
      }
    }

    // Validate and normalize
    if (!result || typeof result !== 'object') result = {};
    if (typeof result.risk_score !== 'number') result.risk_score = 50;
    if (!result.summary) result.summary = {};
    if (!result.summary.executive_summary) {
      result.summary.executive_summary = "Lease analysis complete. Review clauses below for details.";
    }
    if (!Array.isArray(result.summary.top_risks)) {
      result.summary.top_risks = [{ title: "Analysis incomplete", severity: "medium", why: "Retry scan" }];
    }
    if (!Array.isArray(result.clauses)) result.clauses = [];

    // Filter and validate clauses
    result.clauses = result.clauses
      .filter(c => c && typeof c === 'object' && c.canonical_name && c.risk_level)
      .map((c, idx) => ({
        clause_id: c.clause_id || `clause-${idx + 1}`,
        canonical_name: c.canonical_name,
        clause_text: c.clause_text || '',
        risk_level: c.risk_level,
        explanation: c.explanation || 'Review required',
        recommended_action: c.recommended_action || 'Consult with landlord for clarification'
      }));

    if (result.clauses.length === 0) {
      return json({
        ok: false,
        step: "VALIDATION",
        error_code: "NO_CLAUSES_EXTRACTED",
        message: "Could not extract clauses. File may be corrupted, scanned image, or not a lease document.",
        retryable: true,
        leaseId,
        debugLog: { fileUrl, contentPreview: content.substring(0, 400) }
      });
    }

    // Calculate text length estimate
    const estimatedTextLength = result.clauses.reduce((sum, c) => sum + (c.clause_text?.length || 0), 0);

    // Success response
    return json({
      ok: true,
      scanId: `scan-${Date.now()}`,
      leaseId,
      scan_full: {
        risk_score: result.risk_score,
        summary: result.summary,
        clauses: result.clauses,
        meta: {
          text_length: estimatedTextLength,
          chunks: 1,
          warnings: result.clauses.length < 8 ? ['Fewer clauses than expected'] : []
        }
      }
    });
  }
};

function json(o) {
  return new Response(JSON.stringify(o), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}