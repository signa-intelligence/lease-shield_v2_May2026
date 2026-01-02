import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ============================================================================
// LEASE SHIELD QA TEST HARNESS
// Regression test suite for multi-engine risk detection
// ============================================================================

// SYNTHETIC TEST LEASES - Each designed to trigger specific rules
const TEST_LEASES = {
  notice_trap: {
    name: "Notice Trap Lease",
    language: "en",
    text: `RENTAL AGREEMENT

Property: 123 Test Street, Bangkok

4. TERMINATION
This lease automatically renews for another 12-month term unless Tenant provides notice. 
Notice must be sent via both registered mail AND email to landlord.
Notice is valid only upon confirmed delivery and landlord written acknowledgment.

5. EARLY TERMINATION
If Tenant terminates early, all deposits are forfeited without refund.`,
    expected_rules: [
      'PROC_AUTO_RENEWAL',
      'PROC_DUAL_CHANNEL_NOTICE',
      'PROC_CONFIRMED_DELIVERY_ONLY',
      'FIN_EARLY_TERM_FORFEITURE',
      'COMPOUND_TENANT_ENTRAPMENT'
    ],
    expected_severity_min: 'high'
  },

  utility_disconnect: {
    name: "Utility Disconnection Lease",
    language: "th",
    text: `สัญญาเช่า

ที่อยู่: 456 ถนนทดสอบ กรุงเทพ

6. การผิดสัญญา
หากผู้เช่าผิดสัญญา เจ้าของบ้านสามารถตัดน้ำและไฟฟ้าได้ทันที โดยไม่ต้องแจ้งล่วงหน้า
เจ้าของบ้านสามารถเข้าอสังหาริมทรัพย์ได้ตลอดเวลาโดยไม่ต้องแจ้งผู้เช่า

7. ค่าสาธารณูปโภค
ค่าไฟและน้ำจะคิดตามอัตราที่เจ้าของกำหนด`,
    expected_rules: [
      'TH_ILLEGAL_UTILITY_DISCONNECT',
      'TH_UNRESTRICTED_ENTRY',
      'FIN_UTILITY_UNREGULATED',
      'PROC_IMMEDIATE_TERMINATION'
    ],
    expected_severity_min: 'critical'
  },

  penalty_multiplier: {
    name: "Penalty Multiplier Lease",
    language: "en",
    text: `LEASE TERMS

8. HOLDOVER
If Tenant remains after lease expiration, Tenant shall pay double the monthly rent per day.

9. PENALTIES
Smoking: Fine of ฿20,000 per incident
Pets: ฿500 per day penalty for unauthorized pets
Late rent: ฿1,000 per day after due date

10. DEPOSIT
Security deposit of three months rent. Landlord may deduct any amounts for alleged damages at landlord's sole discretion.`,
    expected_rules: [
      'FIN_HOLDOVER_MULTIPLIER',
      'FIN_EXCESSIVE_DEPOSIT',
      'FIN_DEPOSIT_SOLE_DISCRETION',
      'COMPOUND_PENALTY_STACK',
      'COMPOUND_DEPOSIT_DISCRETION'
    ],
    expected_severity_min: 'critical'
  },

  rights_suppression: {
    name: "Rights Suppression Lease",
    language: "en",
    text: `TENANT OBLIGATIONS

11. GUESTS
Overnight guests are strictly prohibited. All visitors must be registered and approved by landlord.

12. PROPERTY USE
Tenant shall not cook, hang laundry, or conduct any work-from-home activities.
No alterations, painting, or decorations allowed without written approval.

13. DISPUTES
Tenant irrevocably waives all rights to sue landlord or pursue legal action.
All disputes shall be resolved by landlord determination, which is final.`,
    expected_rules: [
      'RIGHTS_GUEST_RESTRICTIONS',
      'RIGHTS_USE_RESTRICTIONS',
      'TH_COURT_RIGHTS_WAIVER',
      'PWR_SOLE_DISCRETION_ABUSE'
    ],
    expected_severity_min: 'critical'
  },

  missing_safeguards: {
    name: "Missing Safeguards Lease",
    language: "th",
    text: `สัญญาเช่า

ค่าเช่า: ฿15,000 ต่อเดือน
เงินมัดจำ: ฿45,000

14. ทรัพย์สินที่ทิ้งไว้
หากผู้เช่าไม่อยู่เกิน 24 ชั่วโมง ทรัพย์สินจะถือว่าถูกทิ้ง เจ้าของสามารถทำลายได้

15. การต่อสัญญา
ค่าเช่าเมื่อต่อสัญญาจะกำหนดโดยเจ้าของบ้านตามดุลยพินิจแต่เพียงผู้เดียว`,
    expected_rules: [
      'MISSING_DEPOSIT_RETURN_DEADLINE',
      'MISSING_ABANDONED_PROPERTY_SHORT',
      'FIN_UNILATERAL_RENT_INCREASE',
      'FIN_EXCESSIVE_DEPOSIT'
    ],
    expected_severity_min: 'high'
  },

  // Additional regression seeds for broader coverage
  penalty_daily: {
    name: 'Daily Penalty Only',
    language: 'en',
    text: 'Late rent will incur a fee of ฿1,000 per day until paid. Guests overnight incur ฿500 per night.',
    expected_rules: ['COMPOUND_PENALTY_STACK'],
    expected_severity_min: 'high'
  },
  holdover_multiplier: {
    name: 'Holdover Multiplier',
    language: 'en',
    text: 'If tenant remains after expiration, rent becomes double (2x) per day. Unauthorized pets incur ฿500 per day.',
    expected_rules: ['FIN_HOLDOVER_MULTIPLIER','COMPOUND_PENALTY_STACK'],
    expected_severity_min: 'critical'
  },
  utilities_change: {
    name: 'Utilities Pricing Change',
    language: 'en',
    text: 'Utility rates may change without notice at landlord discretion.',
    expected_rules: ['FIN_UTILITY_RATE_CHANGE_NO_NOTICE','FIN_UTILITY_UNREGULATED'],
    expected_severity_min: 'high'
  },
  sublease_ban_termination: {
    name: 'Sublease Ban with Immediate Termination',
    language: 'en',
    text: 'Sublease or assignment is strictly prohibited. Any breach may be terminated immediately without cure.',
    expected_rules: ['RIGHTS_USE_RESTRICTIONS','PROC_IMMEDIATE_TERMINATION'],
    expected_severity_min: 'high'
  },
  short_term_ban: {
    name: 'Short-term Letting Ban',
    language: 'en',
    text: 'Short-term or daily rental is not allowed. Any violation results in a fine of ฿20,000 per incident.',
    expected_rules: ['RIGHTS_USE_RESTRICTIONS'],
    expected_severity_min: 'high'
  },
  abandonment_disposal: {
    name: 'Abandonment Disposal Short Window',
    language: 'en',
    text: 'Property left unattended for 24 hours is deemed abandoned and may be disposed.',
    expected_rules: ['MISSING_ABANDONED_PROPERTY_SHORT'],
    expected_severity_min: 'high'
  },

  extreme_risk_full: {
    name: "Extreme Risk Full Lease (Acceptance Test)",
    language: "mixed",
    text: `RESIDENTIAL LEASE AGREEMENT / สัญญาเช่าที่พักอาศัย

Property: 789 Test Boulevard, Bangkok
Monthly Rent: ฿25,000
Security Deposit: ฿100,000 (4 months)

1. AUTO-RENEWAL
This agreement automatically renews for another 12 months unless Tenant provides 60-day notice via both registered mail AND email. Notice is valid only upon confirmed delivery.

2. UTILITIES & ACCESS
Landlord may disconnect water or electricity if rent is 7 days late.
Landlord may enter property at any time without notice.
Utility rates set by landlord at sole discretion.

3. PENALTIES
- Late rent: ฿1,000 per day
- Smoking: ฿20,000 per incident
- Unauthorized pets: ฿500 per day
- Guests overnight: ฿2,000 per night

4. HOLDOVER
If Tenant stays after lease end, rent becomes triple (3x) the normal rate per day.

5. DEPOSIT
Deposit may be forfeited for any alleged breach at landlord's sole discretion. No itemization required.

6. EARLY TERMINATION
Early termination results in full deposit forfeiture plus one month penalty rent.

7. PROPERTY USE
Prohibited: cooking, laundry drying, work-from-home, commercial activity, guests, pets, subletting, short-term letting, painting, nails, decoration.

8. ABANDONED PROPERTY
Property left unattended for 24 hours deemed abandoned and may be disposed.

9. LANDLORD RIGHTS
Landlord may terminate this lease at any time without cause. Tenant has no right to dispute or legal action.

10. RENT INCREASES
Upon renewal, rent may increase at landlord's sole discretion without cap.`,
    expected_rules: [
      'COMPOUND_TENANT_ENTRAPMENT',
      'TH_ILLEGAL_UTILITY_DISCONNECT',
      'TH_UNRESTRICTED_ENTRY',
      'TH_COURT_RIGHTS_WAIVER',
      'PROC_AUTO_RENEWAL',
      'PROC_DUAL_CHANNEL_NOTICE',
      'PROC_CONFIRMED_DELIVERY_ONLY',
      'PROC_IMMEDIATE_TERMINATION',
      'FIN_EXCESSIVE_DEPOSIT',
      'FIN_DEPOSIT_SOLE_DISCRETION',
      'FIN_EARLY_TERM_FORFEITURE',
      'FIN_HOLDOVER_MULTIPLIER',
      'FIN_UNILATERAL_RENT_INCREASE',
      'FIN_UTILITY_UNREGULATED',
      'PWR_SOLE_DISCRETION_ABUSE',
      'PWR_ASYMMETRIC_TERMINATION',
      'RIGHTS_GUEST_RESTRICTIONS',
      'RIGHTS_USE_RESTRICTIONS',
      'MISSING_ABANDONED_PROPERTY_SHORT',
      'COMPOUND_PENALTY_STACK',
      'COMPOUND_DEPOSIT_DISCRETION',
      'PREDATORY_LANGUAGE_PATTERN'
    ],
    expected_min_issues: 16,
    expected_max_issues: 22,
    expected_risk_score_min: 95
  }
};

// RUN TESTS
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { testKey } = await req.json();
    
    if (testKey && TEST_LEASES[testKey]) {
      // Run single test
      const test = TEST_LEASES[testKey];
      const result = await runTest(test, base44);
      return Response.json({ success: true, test: testKey, result });
    }
    
    // Run all tests
    const results = {};
    for (const [key, test] of Object.entries(TEST_LEASES)) {
      results[key] = await runTest(test, base44);
    }
    
    const summary = {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.passed).length,
      failed: Object.values(results).filter(r => !r.passed).length
    };
    
    return Response.json({ success: true, summary, results });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

async function runTest(test, base44) {
  const startTime = Date.now();
  
  try {
    // Upload synthetic lease as file
    const blob = new Blob([test.text], { type: 'text/plain' });
    const file = new File([blob], `${test.name}.txt`, { type: 'text/plain' });
    
    const uploadResult = await base44.integrations.Core.UploadFile({ file });
    const fileUrl = uploadResult.file_url;
    
    // Call scan engine
    const scanResponse = await base44.functions.invoke('scanLease', {
      fileUrls: [fileUrl],
      requestId: `qa-test-${Date.now()}`
    });
    
    const scanResult = scanResponse.data?.result;
    const flags = scanResult?.flags || [];
    const riskScore = scanResult?.risk_score || 0;
    
    // Validate results
    const detectedRules = flags.map(f => f.rule_id || f.pattern_id);
    const missingRules = test.expected_rules.filter(r => !detectedRules.includes(r));
    const unexpectedRules = detectedRules.filter(r => !test.expected_rules.includes(r));
    
    const passed = missingRules.length === 0 && 
                   (!test.expected_min_issues || flags.length >= test.expected_min_issues) &&
                   (!test.expected_max_issues || flags.length <= test.expected_max_issues) &&
                   (!test.expected_risk_score_min || riskScore >= test.expected_risk_score_min);
    
    return {
      passed,
      test_name: test.name,
      duration_ms: Date.now() - startTime,
      issues_detected: flags.length,
      expected_issues: test.expected_min_issues 
        ? `${test.expected_min_issues}-${test.expected_max_issues || test.expected_min_issues}` 
        : 'N/A',
      risk_score: riskScore,
      expected_risk_score: test.expected_risk_score_min || 'N/A',
      detected_rules: detectedRules,
      missing_rules: missingRules,
      unexpected_rules: unexpectedRules.length > 5 ? `${unexpectedRules.length} extra rules` : unexpectedRules,
      severity_distribution: {
        critical: flags.filter(f => f.severity === 'critical').length,
        high: flags.filter(f => f.severity === 'high').length,
        medium: flags.filter(f => f.severity === 'medium').length,
        low: flags.filter(f => f.severity === 'low').length
      }
    };
    
  } catch (error) {
    return {
      passed: false,
      test_name: test.name,
      error: error.message,
      stack: error.stack,
      duration_ms: Date.now() - startTime
    };
  }
}