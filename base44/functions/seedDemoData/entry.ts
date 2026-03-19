
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const SAMPLE_LEASE_EN = `RESIDENTIAL LEASE AGREEMENT - Bangkok

TERMS:
1. DEPOSIT: Tenant shall pay a security deposit equal to THREE (3) months' rent. 
   Landlord may retain deposit for ANY REASON at sole discretion.

2. REPAIRS: Tenant is responsible for ALL REPAIRS regardless of cause.

3. EARLY TERMINATION: Any early termination forfeits ENTIRE deposit with no refund.

4. LATE PAYMENT: Late payment fee of 10% per day (compounding).

5. ENTRY: Landlord may enter premises at ANY TIME without prior notice.

Monthly Rent: 15,000 THB
Deposit: 45,000 THB
Term: 12 months from August 1, 2025`;

Deno.serve(async (req) => {
  try {
    console.log('=== START: Seed Demo Data ===');
    
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();
    
    console.log('Current user:', currentUser?.email, 'Role:', currentUser?.role);
    
    if (currentUser?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }
    
    console.log('Creating demo data for current user:', currentUser.email);
    
    // Create deposit tracker
    console.log('Step 1: Creating deposit tracker...');
    const deposit1 = await base44.asServiceRole.entities.DepositTracker.create({
      created_by: currentUser.email,
      deposit_amount: 45000,
      deposit_paid_date: "2025-08-01",
      expected_return_date: "2026-08-01",
      status: "tracking",
      property_address: "Unit 123, Sample Condo, Sukhumvit",
      notes: "Demo: Standard condo - 3 months deposit"
    });
    console.log('Created deposit:', deposit1.id);
    
    const deposit2 = await base44.asServiceRole.entities.DepositTracker.create({
      created_by: currentUser.email,
      deposit_amount: 30000,
      deposit_paid_date: "2025-07-15",
      expected_return_date: "2026-07-15",
      status: "tracking",
      property_address: "Room 456, Demo Apartment, Ladprao",
      notes: "Demo: Apartment - tracking status"
    });
    console.log('Created deposit:', deposit2.id);
    
    // Create lease
    console.log('Step 2: Creating lease...');
    const lease = await base44.asServiceRole.entities.Lease.create({
      created_by: currentUser.email,
      file_url: "inline://seed-demo-en",
      status: "uploaded",
      language_detected: "en",
      property_address: "Unit 123, Sample Condo, Sukhumvit",
      rent_amount: 15000,
      deposit_amount: 45000,
      start_date: "2025-08-01",
      end_date: "2026-08-01"
    });
    console.log('Created lease:', lease.id);
    
    // AI Analysis
    console.log('Step 3: Running AI analysis...');
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this lease for risks. Extract risky clauses.

Lease text:
${SAMPLE_LEASE_EN}

Return JSON with flags array and risk assessment.`,
      response_json_schema: {
        type: "object",
        properties: {
          risk_score: { type: "integer", minimum: 0, maximum: 100 },
          summary: { type: "string" },
          top_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string" },
                category: { type: "string" },
                description: { type: "string" }
              }
            }
          }
        }
      }
    });
    console.log('AI analysis complete, risk score:', analysis.risk_score);
    
    // Create scan
    console.log('Step 4: Creating lease scan...');
    const scan = await base44.asServiceRole.entities.LeaseScan.create({
      lease_id: lease.id,
      risk_score: analysis.risk_score || 75,
      flags: analysis.top_flags || [],
      summary: analysis.summary || "Demo lease with multiple high-risk clauses requiring attention.",
      scan_preview: analysis,
      scan_full: { flags: analysis.top_flags || [], analysis: "Demo scan" },
      version: "seed-v1"
    });
    console.log('Created scan:', scan.id);
    
    // Update lease status
    await base44.asServiceRole.entities.Lease.update(lease.id, { status: "scanned" });
    
    // Create case - FIXED: Use user_email instead of created_by
    console.log('Step 5: Creating resolve case...');
    const demoCase = await base44.asServiceRole.entities.Case.create({
      user_email: currentUser.email, // FIXED: Changed from created_by to user_email
      lease_id: lease.id,
      status: "pending_review", // Changed from "active" to "pending_review"
      dispute_amount: 18000,
      summary: "Demo: Deposit withheld due to unspecified cleaning fees. Landlord claiming damage without evidence.",
      is_member_at_creation: true,
      success_fee_rate: 10,
      fast_track: true,
      letter_pack: true
    });
    console.log('Created case:', demoCase.id);
    
    console.log('=== SUCCESS: Demo data seeded ===');
    
    return Response.json({ 
      success: true, 
      message: "Demo data created successfully for your account",
      results: {
        users_created: 0,
        deposits_created: 2,
        leases_created: 1,
        scans_created: 1,
        cases_created: 1
      },
      demo_credentials: {
        note: "Demo data created for your current account: " + currentUser.email
      }
    });

  } catch (error) {
    console.error('=== ERROR: Seed Failed ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return Response.json({ 
      error: error.message || 'Unknown error',
      details: error.stack,
      step: 'Check function logs for details'
    }, { status: 500 });
  }
});
