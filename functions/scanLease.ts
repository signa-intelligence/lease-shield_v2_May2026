import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const body = await req.json();
  const requestId = body.requestId || crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  
  const logStage = (stage, data) => {
    console.log(`[${requestId}] ${stage}:`, { ...data, elapsed: Date.now() - startTime });
  };

  try {
    logStage('REQUEST_START', {
      method: req.method,
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent')
    });

    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      logStage('AUTH_FAILED', { reason: 'No user authenticated' });
      return Response.json({ 
        success: false,
        error: 'AUTH_ERROR',
        details: 'Unauthorized',
        diagnostic: { requestId, errorCategory: 'AUTH_ERROR' }
      }, { status: 401 });
    }

    logStage('AUTH_SUCCESS', { userEmail: user.email });

    const { fileUrls } = body;
    
    if (!fileUrls || fileUrls.length === 0) {
      logStage('VALIDATION_FAILED', { reason: 'No file URLs provided' });
      return Response.json({ 
        success: false,
        error: 'BACKEND_VALIDATION_ERROR',
        details: 'No file URLs provided',
        diagnostic: { requestId, errorCategory: 'BACKEND_VALIDATION_ERROR' }
      }, { status: 400 });
    }

    logStage('FILE_URLS_RECEIVED', { count: fileUrls.length });
    
    // DIAGNOSTIC: Fetch and validate file metadata
    const fileMetadata = [];
    for (let i = 0; i < fileUrls.length; i++) {
      const url = fileUrls[i];
      const filename = url.split('/').pop().split('?')[0];
      
      try {
        const fetchStart = Date.now();
        const response = await fetch(url);
        const blob = await response.blob();
        const fetchDuration = Date.now() - fetchStart;
        
        const metadata = {
          index: i + 1,
          filename,
          size: blob.size,
          type: blob.type,
          fetchDuration,
          url: url.substring(0, 100) + '...'
        };
        
        fileMetadata.push(metadata);
        logStage(`FILE_${i + 1}_METADATA`, metadata);
        
        // Validate file
        if (blob.size === 0) {
          throw new Error(`File ${i + 1} has zero bytes`);
        }
        
        if (blob.size > 10 * 1024 * 1024) {
          throw new Error(`File ${i + 1} exceeds 10MB limit`);
        }
        
        // Check for PDF signature
        const slice = blob.slice(0, 5);
        const buffer = await slice.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const header = String.fromCharCode(...bytes);
        
        if (header !== '%PDF-' && blob.type !== 'image/png' && blob.type !== 'image/jpeg') {
          logStage(`FILE_${i + 1}_WARNING`, {
            reason: 'Not a PDF and not an image',
            header,
            type: blob.type
          });
        }
        
      } catch (err) {
        logStage(`FILE_${i + 1}_FETCH_FAILED`, {
          error: err.message
        });
        return Response.json({ 
          success: false,
          error: 'UPLOAD_FAILED',
          details: `Failed to fetch file ${i + 1}: ${err.message}`,
          diagnostic: { 
            requestId, 
            errorCategory: 'UPLOAD_FAILED',
            fileMetadata
          }
        }, { status: 400 });
      }
    }
    
    logStage('ALL_FILES_VALIDATED', { totalFiles: fileMetadata.length });
    logStage('LLM_ANALYSIS_START', { fileCount: fileUrls.length });
    
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

    const analysisDuration = Date.now() - startTime;
    
    logStage('LLM_ANALYSIS_SUCCESS', {
      duration: analysisDuration,
      riskScore: scanResult.risk_score,
      flagsCount: scanResult.flags?.length || 0,
      hasPropertyAddress: !!scanResult.property_address,
      hasDates: !!(scanResult.start_date && scanResult.end_date)
    });

    return Response.json({
      success: true,
      result: scanResult,
      diagnostic: {
        buildTag: "android-fix-v2",
        requestId,
        filesProcessed: fileUrls.length,
        totalDuration: analysisDuration,
        fileMetadata
      }
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    logStage('ERROR_CAUGHT', {
      error: error.message,
      stack: error.stack,
      duration: totalDuration
    });
    
    // Categorize error
    let errorCategory = 'ANALYSIS_ERROR';
    let errorMessage = 'Failed to analyze lease';
    let errorDetails = error.message;
    
    if (error.message?.includes('timeout') || totalDuration > 60000) {
      errorCategory = 'REQUEST_TIMEOUT';
      errorMessage = 'Analysis timed out';
      errorDetails = 'The analysis took too long. Please try with a smaller file or clearer images.';
    } else if (error.message?.includes('schema') || error.message?.includes('JSON')) {
      errorCategory = 'BACKEND_VALIDATION_ERROR';
      errorMessage = 'Unable to extract information from document';
      errorDetails = 'The document structure could not be parsed. Please ensure it\'s a valid lease agreement.';
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorCategory = 'NETWORK_ERROR';
      errorMessage = 'Network error during analysis';
      errorDetails = error.message;
    } else if (error.message?.includes('UPLOAD_FAILED') || error.message?.includes('FILE_')) {
      errorCategory = 'UPLOAD_FAILED';
      errorMessage = 'File upload or validation failed';
      errorDetails = error.message;
    }
    
    logStage('ERROR_RESPONSE', {
      category: errorCategory,
      message: errorMessage,
      duration: totalDuration
    });
    
    return Response.json({ 
      success: false,
      error: errorMessage,
      details: errorDetails,
      diagnostic: {
        requestId,
        errorCategory,
        errorType: error.name,
        timestamp: new Date().toISOString(),
        duration: totalDuration
      }
    }, { status: 500 });
  }
});