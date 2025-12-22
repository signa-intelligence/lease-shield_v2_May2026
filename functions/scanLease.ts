import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import mammoth from 'npm:mammoth@1.6.0';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrls } = await req.json();
    
    if (!fileUrls || fileUrls.length === 0) {
      return Response.json({ error: 'No file URLs provided' }, { status: 400 });
    }

    console.log(`[${requestId}] Starting lease scan for user:`, user.email);
    console.log(`[${requestId}] File URLs:`, fileUrls.length, 'files');
    
    // DIAGNOSTIC: Log file metadata
    for (let i = 0; i < fileUrls.length; i++) {
      const url = fileUrls[i];
      const filename = url.split('/').pop().split('?')[0];
      const isDocx = filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc');
      console.log(`[${requestId}] File ${i + 1}: ${filename} | isDocx: ${isDocx}`);
      
      // Fetch file to check size and type
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        console.log(`[${requestId}] File ${i + 1} size: ${blob.size} bytes | type: ${blob.type}`);
      } catch (err) {
        console.error(`[${requestId}] Failed to fetch file metadata:`, err.message);
      }
    }

    // DOCX EXTRACTION: Pre-process DOCX files to extract text
    const processedFileUrls = [];
    let extractedTextForDiagnostics = '';
    
    for (const url of fileUrls) {
      const filename = url.split('/').pop().split('?')[0];
      const isDocx = filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc');
      
      if (isDocx) {
        console.log(`[${requestId}] DOCX detected: ${filename} | Starting text extraction...`);
        
        try {
          // Download the DOCX file
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch DOCX: HTTP ${response.status}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          console.log(`[${requestId}] DOCX downloaded: ${arrayBuffer.byteLength} bytes`);
          
          // Extract text using mammoth
          const result = await mammoth.extractRawText({ arrayBuffer });
          const extractedText = result.value;
          
          console.log(`[${requestId}] DOCX extraction success | Text length: ${extractedText.length} chars`);
          extractedTextForDiagnostics = extractedText.slice(0, 200); // Store first 200 chars for diagnostics
          
          if (!extractedText || extractedText.trim().length < 50) {
            console.error(`[${requestId}] DOCX extraction returned insufficient text (${extractedText.length} chars)`);
            return Response.json({
              success: false,
              error: 'No readable text found in DOCX file',
              details: 'The Word document appears to be empty or unreadable. Please try converting to PDF or uploading images of the lease pages.',
              diagnostic: {
                requestId,
                filename,
                extractedLength: extractedText.length
              }
            }, { status: 400 });
          }
          
          // For DOCX files, we'll pass the extracted text directly to the LLM
          // (InvokeLLM can't read DOCX directly, so we pre-extract)
          // We'll modify the prompt to include the text
          processedFileUrls.push({ url, isDocx: true, extractedText });
          
        } catch (extractError) {
          console.error(`[${requestId}] DOCX extraction failed:`, extractError);
          return Response.json({
            success: false,
            error: 'Failed to extract text from Word document',
            details: `DOCX parsing error: ${extractError.message}. Please convert to PDF or upload images.`,
            diagnostic: {
              requestId,
              filename,
              error: extractError.message,
              stack: extractError.stack
            }
          }, { status: 400 });
        }
      } else {
        // PDF or image - can be passed directly to InvokeLLM
        processedFileUrls.push({ url, isDocx: false });
      }
    }
    
    console.log(`[${requestId}] File processing complete | Total: ${processedFileUrls.length}`);
    
    // Build prompt and file_urls for LLM
    let finalPrompt = `Analyze this rental lease agreement and identify potential issues for the tenant.

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

6. Write a summary paragraph`;

    // If we have DOCX with extracted text, append it to the prompt
    const docxFiles = processedFileUrls.filter(f => f.isDocx);
    if (docxFiles.length > 0) {
      finalPrompt += '\n\n--- DOCUMENT TEXT (extracted from Word file) ---\n\n';
      docxFiles.forEach((f, idx) => {
        finalPrompt += `\nDocument ${idx + 1}:\n${f.extractedText}\n`;
      });
      console.log(`[${requestId}] Added ${docxFiles.length} DOCX text(s) to prompt | Total prompt length: ${finalPrompt.length} chars`);
    }
    
    // Pass only PDF/image URLs to file_urls (LLM can read these directly)
    const nonDocxUrls = processedFileUrls.filter(f => !f.isDocx).map(f => f.url);
    
    console.log(`[${requestId}] Invoking LLM | PDFs/images: ${nonDocxUrls.length} | DOCX text in prompt: ${docxFiles.length > 0 ? 'YES' : 'NO'}`);
    
    const scanResult = await base44.integrations.Core.InvokeLLM({
      prompt: finalPrompt,
      file_urls: nonDocxUrls.length > 0 ? nonDocxUrls : undefined,
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

    console.log(`[${requestId}] Analysis complete | Risk score: ${scanResult.risk_score} | Flags: ${scanResult.flags?.length || 0}`);

    return Response.json({
      success: true,
      result: scanResult
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Lease scan error:`, error);
    console.error(`[${requestId}] Error stack:`, error.stack);
    
    let errorMessage = 'Failed to analyze lease';
    let errorDetails = error.message;
    
    if (error.message?.includes('timeout')) {
      errorMessage = 'Analysis timed out';
      errorDetails = 'The analysis took too long. Please try with a smaller file or clearer images.';
    } else if (error.message?.includes('schema')) {
      errorMessage = 'Unable to extract information from document';
      errorDetails = 'The document structure could not be parsed. Please ensure it\'s a valid lease agreement.';
    } else if (error.message?.includes('DOCX') || error.message?.includes('Word')) {
      errorMessage = 'Word document processing failed';
      errorDetails = error.message;
    }
    
    return Response.json({ 
      success: false,
      error: errorMessage,
      details: errorDetails,
      diagnostic: {
        requestId,
        errorType: error.name,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
});