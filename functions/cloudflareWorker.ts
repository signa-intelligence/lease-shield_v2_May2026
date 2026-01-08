// Cloudflare Worker for lease scanning - PRODUCTION VERSION
// Extracts text from PDFs and analyzes with OpenAI

const OPENAI_API_KEY = 'YOUR_KEY_HERE'; // IMPORTANT: Set this as Cloudflare Worker secret

// Extract text from PDF buffer
async function extractPdfText(pdfBuffer) {
  try {
    const pdfText = String.fromCharCode.apply(null, new Uint8Array(pdfBuffer));
    
    // Extract text content from PDF streams
    const streamMatches = pdfText.match(/stream[\s\S]*?endstream/g) || [];
    let extractedText = '';
    
    for (const match of streamMatches) {
      const content = match
        .replace(/^stream\s*/, '')
        .replace(/\s*endstream$/, '')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      extractedText += content + '\n';
    }
    
    // Also extract text from TJ/Tj operators (more reliable)
    const textOperators = pdfText.match(/\((.*?)\)\s*(Tj|TJ)/g) || [];
    for (const op of textOperators) {
      const text = op.match(/\((.*?)\)/)?.[1] || '';
      extractedText += text.replace(/\\[nrt]/g, ' ') + ' ';
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

// Analyze lease text with OpenAI
async function analyzeWithOpenAI(text, language = 'en') {
  const prompt = `You are an expert legal analyst specializing in residential lease agreements. Analyze this lease text and provide detailed clause-by-clause analysis.

LEASE TEXT:
${text.substring(0, 12000)}${text.length > 12000 ? '\n\n...(text truncated for analysis)' : ''}

Return ONLY valid JSON with this exact structure:
{
  "clauses": [
    {
      "clause_id": "unique_id",
      "canonical_name": "Clause Title",
      "clause_text": "exact excerpt from lease (max 200 chars)",
      "risk_level": "none|low|medium|high|critical",
      "explanation": "Plain English explanation for tenant",
      "recommended_action": "Specific action tenant should take"
    }
  ],
  "summary": {
    "executive_summary": "2-3 sentence overview",
    "top_risks": [
      {"title": "Risk name", "severity": "high", "why": "Why it's risky"}
    ]
  },
  "risk_score": 0-100
}

IMPORTANT: 
- Extract ALL clauses (minimum 5, typically 10-20)
- Be specific with recommendations
- Risk levels: none (standard), low (minor concern), medium (needs attention), high (serious issue), critical (deal-breaker)`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a legal analyst. Always return valid JSON only, no markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${error}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  return JSON.parse(content);
}

// Main worker handler
export default {
  async fetch(request) {
    // CORS headers
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    try {
      // [1] PARSE REQUEST
      const body = await request.json();
      const { leaseId, fileUrl, language = 'en' } = body;

      if (!leaseId || !fileUrl) {
        return new Response(JSON.stringify({
          ok: false,
          step: 'VALIDATION',
          error_code: 'MISSING_PARAMS',
          message: 'leaseId and fileUrl required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      console.log('[WORKER] Starting scan:', { leaseId, fileUrl: fileUrl.substring(0, 80) });

      // [2] DOWNLOAD FILE
      let docResponse;
      try {
        docResponse = await fetch(fileUrl);
        if (!docResponse.ok) throw new Error(`HTTP ${docResponse.status}`);
      } catch (err) {
        return new Response(JSON.stringify({
          ok: false,
          step: 'DOWNLOAD',
          error_code: 'FETCH_FAILED',
          message: `Failed to download: ${err.message}`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const contentType = docResponse.headers.get('content-type') || '';
      const isPdf = contentType.includes('pdf') || fileUrl.toLowerCase().endsWith('.pdf');

      console.log('[WORKER] Downloaded:', { contentType, isPdf });

      // [3] EXTRACT TEXT
      let extractedText = '';
      
      if (isPdf) {
        const arrayBuffer = await docResponse.arrayBuffer();
        extractedText = await extractPdfText(arrayBuffer);
        
        if (!extractedText || extractedText.length < 100) {
          return new Response(JSON.stringify({
            ok: false,
            step: 'EXTRACT',
            error_code: 'EMPTY_TEXT',
            message: 'Could not extract readable text from PDF',
            debug: { textLength: extractedText?.length || 0 }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      } else {
        extractedText = await docResponse.text();
      }

      console.log('[WORKER] Extracted text:', extractedText.length, 'chars');

      // [4] ANALYZE WITH OPENAI
      const analysis = await analyzeWithOpenAI(extractedText, language);

      console.log('[WORKER] Analysis complete:', {
        clauses: analysis.clauses?.length,
        riskScore: analysis.risk_score
      });

      // [5] BUILD RESPONSE
      const scanResult = {
        clauses: analysis.clauses || [],
        summary: analysis.summary || {},
        risk_score: analysis.risk_score || 0,
        meta: {
          text_length: extractedText.length,
          chunks: 1
        },
        debug: {
          warnings: analysis.clauses?.length === 0 ? ['No clauses extracted'] : []
        }
      };

      return new Response(JSON.stringify({
        ok: true,
        scan_full: scanResult
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (error) {
      console.error('[WORKER] Unhandled error:', error);
      return new Response(JSON.stringify({
        ok: false,
        step: 'UNHANDLED',
        error_code: 'EXCEPTION',
        message: error.message,
        stack: error.stack
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};