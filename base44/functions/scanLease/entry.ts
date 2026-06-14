import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Free plan scan gate
    if (user.plan_tier === 'free') {
      if (user.free_scan_eligible === false || (user.free_scans_used ?? 0) >= 1) {
        return Response.json({
          success: false,
          code: 'FREE_SCAN_EXHAUSTED',
          error: 'Your free scan has been used. Please upgrade to continue.'
        }, { status: 403 });
      }
    }

    const { fileUrls } = await req.json();
    
    if (!fileUrls || fileUrls.length === 0) {
      return Response.json({ error: 'No file URLs provided' }, { status: 400 });
    }

    console.log('Starting lease scan for user:', user.email);
    console.log('File URLs:', fileUrls.length, 'files');

    const scanResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this rental lease agreement and identify potential issues for the tenant.

INSTRUCTIONS:
1. Read the document carefully
2. Identify unfair or risky clauses
3. Rate the overall risk from 0-100 (0=safe, 100=very risky)
4. For each issue found, provide:
   - title: Brief title
   - severity: low, medium, high, or critical
   - category: Type of issue
   - description: What's wrong
   - evidence: Quote the problematic text
   - explanation: Why this is a problem
   - recommendation: What the tenant should do

5. Extract these details (use empty string if not found):
   - property_address
   - start_date (YYYY-MM-DD format)
   - end_date (YYYY-MM-DD format)
   - rent_amount (number, 0 if not found)
   - deposit_amount (number, 0 if not found)
   - notice_period_days (integer, 0 if not found)
   - language_detected (en, th, or mixed)

6. Write a summary paragraph`,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          risk_score: { 
            type: "integer",
            minimum: 0,
            maximum: 100
          },
          summary: { 
            type: "string" 
          },
          flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                severity: { 
                  type: "string", 
                  enum: ["low", "medium", "high", "critical"] 
                },
                category: { type: "string" },
                description: { type: "string" },
                evidence: { type: "string" },
                explanation: { type: "string" },
                recommendation: { type: "string" }
              },
              required: ["severity", "description"]
            }
          },
          property_address: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          rent_amount: { type: "number" },
          deposit_amount: { type: "number" },
          language_detected: { 
            type: "string",
            enum: ["en", "th", "mixed"]
          },
          notice_period_days: { type: "integer" }
        },
        required: ["risk_score", "summary", "flags"]
      }
    });

    console.log('Analysis complete. Risk score:', scanResult.risk_score);
    console.log('Flags found:', scanResult.flags?.length || 0);

    // Increment free scan usage for Explorer plan users
    if (user.plan_tier === 'free') {
      await base44.auth.updateMe({ free_scans_used: (user.free_scans_used ?? 0) + 1 });
    }

    // Derive scan_tier from user.plan_tier at time of scan
    const validTiers = ['free', 'lite', 'protect', 'secure', 'one_time'];
    const scan_tier = validTiers.includes(user.plan_tier) ? user.plan_tier : 'free';

    return Response.json({
      success: true,
      scan_tier,
      result: scanResult
    });

  } catch (error) {
    console.error('Lease scan error:', error);
    
    let errorMessage = 'Failed to analyze lease';
    
    if (error.message?.includes('timeout')) {
      errorMessage = 'Analysis timed out. Please try with a smaller file or clearer images.';
    } else if (error.message?.includes('schema')) {
      errorMessage = 'Unable to extract information from document. Please ensure it\'s a valid lease agreement.';
    }
    
    return Response.json({ 
      success: false,
      error: errorMessage,
      details: error.message 
    }, { status: 500 });
  }
});