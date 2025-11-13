import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
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

    console.log('🔍 Starting comprehensive AI lease scan for:', user.email);
    console.log('📄 Analyzing', fileUrls.length, 'file(s)');

    const scanResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert Thai rental law advisor and lease analyst. Analyze this rental lease agreement comprehensively.

CRITICAL EXTRACTION TASKS:

1. KEY LEASE DETAILS - Extract these EXACT values:
   - property_address: Full property address including unit number, building name, city
   - start_date: Lease start date in YYYY-MM-DD format
   - end_date: Lease end date in YYYY-MM-DD format
   - rent_amount: Monthly rent amount as a NUMBER (THB)
   - deposit_amount: Security deposit as a NUMBER (THB)
   - notice_period_days: How many days before lease end must tenant notify landlord (as INTEGER)
   - language_detected: "en" for English, "th" for Thai, "mixed" if both languages present

2. COMPREHENSIVE CLAUSE IDENTIFICATION - Identify and extract:
   
   A. PAYMENT TERMS:
      - Payment due date (day of month)
      - Late payment penalties
      - Utility payment responsibilities
      - Service charges and common area fees
      - Payment methods accepted
   
   B. DEPOSIT & REFUND TERMS:
      - Deposit amount and conditions
      - Refund timeline after move-out
      - Deductions allowed from deposit
      - Interest on deposit (if any)
      - Conditions for full refund
   
   C. TERMINATION & RENEWAL:
      - Early termination penalties
      - Notice period for non-renewal
      - Automatic renewal clauses
      - Lease break conditions
      - Subletting restrictions
   
   D. MAINTENANCE & REPAIRS:
      - Who is responsible for what repairs
      - Response time requirements
      - Tenant's repair obligations
      - Landlord's maintenance duties
   
   E. TENANT RIGHTS & RESTRICTIONS:
      - Guest policies
      - Pet policies
      - Modification/decoration rights
      - Access rights (landlord entry)
      - Privacy protections

3. RISK ASSESSMENT - Calculate a risk score (0-100):
   - 0-25: Low risk - Fair and tenant-friendly terms
   - 26-50: Medium risk - Some concerning clauses
   - 51-75: High risk - Multiple unfavorable terms
   - 76-100: Critical risk - Potentially exploitative contract

4. FLAG IDENTIFICATION - For EACH problematic clause, provide:
   - title: Clear, actionable title (e.g., "Excessive Late Fee", "No Deposit Interest")
   - severity: "low", "medium", "high", or "critical"
   - category: Type of issue (e.g., "payment", "deposit", "termination", "maintenance", "privacy")
   - description: What the clause says and why it's concerning
   - evidence: Direct quote from the lease (exact text)
   - explanation: Legal/practical implications for tenant
   - recommendation: Specific action tenant should take
   - clause_reference: Section/article number if available

5. COMMON RED FLAGS TO DETECT:
   - Excessive deposits (>3 months rent)
   - Unreasonable late fees (>10% per month)
   - Short notice periods (<30 days)
   - No deposit refund timeline
   - Landlord can enter without notice
   - Tenant liable for all repairs
   - Automatic renewal without notice
   - Unclear termination penalties
   - No written receipt requirements
   - Utility overcharges
   - Prohibited modifications without criteria
   - Excessive cleaning fees
   - Deposit non-refundable clauses
   - Waiver of tenant rights

6. SUMMARY - Write a 2-3 sentence summary covering:
   - Overall lease fairness
   - Main concerns (if any)
   - Recommendation (proceed/negotiate/avoid)

Be thorough, accurate, and tenant-protective. If information is unclear or missing, note it as a flag.`,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          risk_score: { 
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Overall risk score from 0 (safe) to 100 (very risky)"
          },
          summary: { 
            type: "string",
            description: "2-3 sentence summary of lease analysis"
          },
          property_address: { 
            type: "string",
            description: "Full property address"
          },
          start_date: { 
            type: "string",
            description: "Lease start date in YYYY-MM-DD format"
          },
          end_date: { 
            type: "string",
            description: "Lease end date in YYYY-MM-DD format"
          },
          rent_amount: { 
            type: "number",
            description: "Monthly rent amount in THB"
          },
          deposit_amount: { 
            type: "number",
            description: "Security deposit amount in THB"
          },
          notice_period_days: { 
            type: "integer",
            description: "Notice period in days before lease end"
          },
          language_detected: { 
            type: "string",
            enum: ["en", "th", "mixed"],
            description: "Primary language of the lease"
          },
          key_clauses: {
            type: "object",
            description: "Extracted key clauses from the lease",
            properties: {
              payment_terms: {
                type: "object",
                properties: {
                  due_date: { type: "string" },
                  late_fee: { type: "string" },
                  utilities_responsibility: { type: "string" },
                  service_charges: { type: "string" }
                }
              },
              deposit_terms: {
                type: "object",
                properties: {
                  refund_timeline: { type: "string" },
                  allowed_deductions: { type: "string" },
                  interest_on_deposit: { type: "string" }
                }
              },
              termination_terms: {
                type: "object",
                properties: {
                  early_termination_penalty: { type: "string" },
                  renewal_terms: { type: "string" },
                  subletting_allowed: { type: "string" }
                }
              },
              maintenance_terms: {
                type: "object",
                properties: {
                  tenant_responsibilities: { type: "string" },
                  landlord_responsibilities: { type: "string" },
                  response_time: { type: "string" }
                }
              }
            }
          },
          flags: {
            type: "array",
            description: "List of problematic clauses and concerns",
            items: {
              type: "object",
              properties: {
                title: { 
                  type: "string",
                  description: "Clear title of the issue"
                },
                severity: { 
                  type: "string", 
                  enum: ["low", "medium", "high", "critical"],
                  description: "Severity level of the issue"
                },
                category: { 
                  type: "string",
                  description: "Category: payment, deposit, termination, maintenance, privacy, etc."
                },
                description: { 
                  type: "string",
                  description: "What the problematic clause says"
                },
                evidence: { 
                  type: "string",
                  description: "Direct quote from lease document"
                },
                explanation: { 
                  type: "string",
                  description: "Why this is problematic for tenant"
                },
                recommendation: { 
                  type: "string",
                  description: "Specific action tenant should take"
                },
                clause_reference: {
                  type: "string",
                  description: "Section/article number if available"
                }
              },
              required: ["title", "severity", "category", "description", "explanation", "recommendation"]
            }
          },
          missing_protections: {
            type: "array",
            description: "Important protections that are missing from this lease",
            items: {
              type: "object",
              properties: {
                protection: { type: "string" },
                importance: { type: "string", enum: ["low", "medium", "high"] },
                why_it_matters: { type: "string" }
              }
            }
          },
          positive_aspects: {
            type: "array",
            description: "Tenant-friendly clauses or good terms",
            items: {
              type: "string"
            }
          },
          overall_recommendation: {
            type: "string",
            enum: ["proceed", "negotiate", "avoid"],
            description: "Overall recommendation: proceed (sign as-is), negotiate (request changes), avoid (don't sign)"
          }
        },
        required: ["risk_score", "summary", "flags", "property_address", "start_date", "end_date", "rent_amount", "deposit_amount", "language_detected"]
      }
    });

    console.log('✅ AI Analysis complete');
    console.log('📊 Risk Score:', scanResult.risk_score);
    console.log('🚩 Flags identified:', scanResult.flags?.length || 0);
    console.log('💰 Rent:', scanResult.rent_amount, 'Deposit:', scanResult.deposit_amount);
    console.log('📅 Lease period:', scanResult.start_date, 'to', scanResult.end_date);
    console.log('⏰ Notice period:', scanResult.notice_period_days, 'days');
    console.log('🗣️ Language:', scanResult.language_detected);
    console.log('💡 Recommendation:', scanResult.overall_recommendation);

    return Response.json({
      success: true,
      result: scanResult
    });

  } catch (error) {
    console.error('❌ Lease scan error:', error);
    
    let errorMessage = 'Failed to analyze lease';
    
    if (error.message?.includes('timeout')) {
      errorMessage = 'Analysis timed out. Please try with a smaller file or clearer images.';
    } else if (error.message?.includes('schema')) {
      errorMessage = 'Unable to extract information from document. Please ensure it\'s a valid lease agreement.';
    } else if (error.message?.includes('file')) {
      errorMessage = 'Unable to read file. Please ensure the file is a valid PDF, image, or Word document.';
    }
    
    return Response.json({ 
      success: false,
      error: errorMessage,
      details: error.message 
    }, { status: 500 });
  }
});