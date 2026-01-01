import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ============================================================================
// MULTI-LAYER LEASE RISK ENGINE v2.0
// ============================================================================

// Risk Dimension Patterns (Thailand-specific + Universal)
const RISK_PATTERNS = {
  // LEGALITY DIMENSION (Thailand law violations)
  LEGALITY: [
    {
      id: 'illegal_utility_disconnect',
      severity: 'critical',
      category: 'Legal Rights',
      patterns: [/disconnect.*utilit/i, /cut.*(?:water|electric)/i, /ตัด.*(?:น้ำ|ไฟ)/],
      title_en: 'Illegal Utility Disconnection',
      title_th: 'การตัดสาธารณูปโภคที่ผิดกฎหมาย',
      explanation_en: 'Landlord cannot legally disconnect utilities as a penalty or eviction method in Thailand',
      explanation_th: 'เจ้าของบ้านไม่สามารถตัดสาธารณูปโภคเป็นการลงโทษหรือวิธีขับไล่ได้ตามกฎหมาย',
      recommendation_en: 'Request removal of this clause. Cite Thai Civil and Commercial Code § 538',
      recommendation_th: 'ขอให้ลบข้อกำหนดนี้ อ้างอิง ป.พ.พ. มาตรา 538'
    },
    {
      id: 'unrestricted_landlord_access',
      severity: 'critical',
      category: 'Privacy & Access',
      patterns: [/(?:landlord|owner).*(?:may enter|right to enter).*(?:any time|without notice)/i, /เจ้าของ.*เข้า.*ได้ตลอดเวลา/],
      title_en: 'Unrestricted Landlord Access',
      title_th: 'การเข้าถึงไม่จำกัดของเจ้าของบ้าน',
      explanation_en: 'Entry without reasonable notice violates tenant privacy rights',
      explanation_th: 'การเข้าโดยไม่แจ้งล่วงหน้าละเมิดสิทธิความเป็นส่วนตัวของผู้เช่า',
      recommendation_en: 'Negotiate for 24-48 hour advance notice requirement except emergencies',
      recommendation_th: 'เจรจาให้แจ้งล่วงหน้า 24-48 ชั่วโมง ยกเว้นกรณีฉุกเฉิน'
    },
    {
      id: 'waiver_dispute_rights',
      severity: 'critical',
      category: 'Rights & Legal',
      patterns: [/waive.*(?:right to|claim|dispute)/i, /irrevocably waive/i, /no right to.*court/i, /สละสิทธิ/],
      title_en: 'Waiver of Legal Dispute Rights',
      title_th: 'การสละสิทธิในการฟ้องร้อง',
      explanation_en: 'Clauses forcing tenants to waive legal rights may be unenforceable in Thailand',
      explanation_th: 'ข้อกำหนดที่บังคับให้ผู้เช่าสละสิทธิอาจใช้บังคับไม่ได้ตามกฎหมาย',
      recommendation_en: 'Remove or seek legal advice before agreeing to rights waivers',
      recommendation_th: 'ลบออกหรือปรึกษาทนายก่อนตกลง'
    }
  ],

  // PROCEDURAL UNFAIRNESS
  PROCEDURAL: [
    {
      id: 'auto_renewal_trap',
      severity: 'high',
      category: 'Procedural Fairness',
      patterns: [/auto(?:matic)?.*renew/i, /automatic extension/i, /ต่ออัตโนมัติ/],
      title_en: 'Automatic Renewal Without Affirmative Consent',
      title_th: 'การต่ออายุอัตโนมัติโดยไม่ได้รับความยินยอม',
      explanation_en: 'Lease automatically renews unless tenant opts out, often with restrictive notice requirements',
      explanation_th: 'สัญญาต่ออายุอัตโนมัติหากไม่แจ้งออก มักมีข้อกำหนดการแจ้งที่ซับซ้อน',
      recommendation_en: 'Negotiate for opt-in renewal instead, or ensure notice window is reasonable (60+ days)',
      recommendation_th: 'เจรจาให้เป็นการยืนยันต่ออายุแทน หรือตรวจสอบว่าช่วงแจ้งเป็นธรรม (60+ วัน)'
    },
    {
      id: 'dual_channel_notice',
      severity: 'high',
      category: 'Procedural Fairness',
      patterns: [/(?:email|registered mail|certified).*and.*(?:registered mail|email|certified)/i, /จดหมายลงทะเบียน.*และ/],
      title_en: 'Dual-Channel Notice Requirement',
      title_th: 'ข้อกำหนดการแจ้งผ่านช่องทางคู่',
      explanation_en: 'Requiring multiple delivery channels (e.g., email AND registered mail) creates notice traps',
      explanation_th: 'การกำหนดให้ส่งผ่านหลายช่องทาง (เช่น อีเมล และ ไปรษณีย์ลงทะเบียน) สร้างกับดัก',
      recommendation_en: 'Simplify to single channel OR require confirmation within X days',
      recommendation_th: 'เปลี่ยนเป็นช่องทางเดียว หรือกำหนดให้ยืนยันภายใน X วัน'
    },
    {
      id: 'confirmed_delivery_only',
      severity: 'high',
      category: 'Procedural Fairness',
      patterns: [/valid.*(?:only|upon).*confirm(?:ed)? (?:delivery|receipt)/i, /รับรอง.*การส่ง/],
      title_en: 'Notice Valid Only Upon Confirmed Delivery',
      title_th: 'การแจ้งมีผลเมื่อได้รับการยืนยันเท่านั้น',
      explanation_en: 'Tenant bears risk of postal delays/failures, making timely notice nearly impossible',
      explanation_th: 'ผู้เช่ารับความเสี่ยงจากความล่าช้าของไปรษณีย์ ทำให้แจ้งทันเวลาเป็นไปไม่ได้',
      recommendation_en: 'Change to "effective upon sending" or "X days after sending"',
      recommendation_th: 'เปลี่ยนเป็น "มีผลเมื่อส่ง" หรือ "X วันหลังจากส่ง"'
    }
  ],

  // FINANCIAL DISPROPORTIONALITY
  FINANCIAL: [
    {
      id: 'excessive_deposit',
      severity: 'high',
      category: 'Financial Risk',
      patterns: [/deposit.*(?:equal to|equivalent to).{0,20}(?:3|three|four|4|five|5|six|6)/i],
      title_en: 'Excessive Security Deposit',
      title_th: 'เงินมัดจำสูงเกินไป',
      explanation_en: 'Deposit exceeds typical 2 months rent, tying up excessive capital',
      explanation_th: 'เงินมัดจำเกิน 2 เดือนปกติ ทำให้เงินติดขัด',
      recommendation_en: 'Negotiate to reduce deposit to 1-2 months rent',
      recommendation_th: 'เจรจาลดเงินมัดจำเป็น 1-2 เดือน'
    },
    {
      id: 'deposit_sole_discretion',
      severity: 'high',
      category: 'Financial Risk',
      patterns: [/deposit.*(?:sole discretion|may (?:determine|withhold)|alleged)/i, /มัดจำ.*ตามดุลยพินิจ/],
      title_en: 'Deposit Retention at Sole Discretion',
      title_th: 'การเก็บเงินมัดจำตามดุลยพินิจของเจ้าของบ้าน',
      explanation_en: 'Landlord can withhold deposit for subjective or unproven reasons ("alleged damages")',
      explanation_th: 'เจ้าของบ้านสามารถเก็บเงินมัดจำด้วยเหตุผลที่คลุมเครือหรือไม่พิสูจน์',
      recommendation_en: 'Require itemized damages report with photos before any deduction',
      recommendation_th: 'กำหนดให้มีรายงานความเสียหายพร้อมรูปภาพก่อนหักเงิน'
    },
    {
      id: 'early_termination_forfeiture',
      severity: 'high',
      category: 'Financial Risk',
      patterns: [/early termination.*forfeit/i, /break.*lease.*(?:forfeit|lose) deposit/i, /ยกเลิก.*สูญเสีย.*มัดจำ/],
      title_en: 'Early Termination Full Deposit Forfeiture',
      title_th: 'การยกเลิกก่อนกำหนดทำให้เสียเงินมัดจำทั้งหมด',
      explanation_en: 'Losing entire deposit for early exit is disproportionate to actual landlord damages',
      explanation_th: 'การสูญเสียเงินมัดจำทั้งหมดไม่สมดุลกับความเสียหายจริง',
      recommendation_en: 'Negotiate for prorated penalty (e.g., 1 month rent) or capped at actual re-rental cost',
      recommendation_th: 'เจรจาให้ปรับตามสัดส่วน (เช่น 1 เดือน) หรือจำกัดตามค่าใช้จ่ายจริง'
    },
    {
      id: 'holdover_multiplier_penalty',
      severity: 'critical',
      category: 'Financial Risk',
      patterns: [/holdover.*(?:double|triple|2x|3x)/i, /overstay.*(?:daily|per day).{0,30}(?:฿\s*[3-9]\d{3,}|\d{4,})/i],
      title_en: 'Extreme Holdover Penalty (Daily Multiplier)',
      title_th: 'ค่าปรับพักอาศัยเกินกำหนดสูงมาก (คูณรายวัน)',
      explanation_en: 'Daily penalty at 2-3x normal rent is punitive and disproportionate',
      explanation_th: 'ค่าปรับรายวันที่ 2-3 เท่าของค่าเช่าปกติเป็นการลงโทษที่ไม่สมดุล',
      recommendation_en: 'Cap at 1.5x daily rent OR require 7-day grace period before penalty applies',
      recommendation_th: 'จำกัดที่ 1.5 เท่า หรือกำหนดระยะผ่อนผัน 7 วันก่อนเริ่มคิด'
    },
    {
      id: 'unilateral_rent_increase',
      severity: 'high',
      category: 'Financial Risk',
      patterns: [/rent.*increase.*(?:sole discretion|at renewal|may adjust)/i, /ค่าเช่า.*ปรับ.*ตามต้องการ/],
      title_en: 'Unilateral Rent Increase on Renewal',
      title_th: 'การขึ้นค่าเช่าฝ่ายเดียวเมื่อต่อสัญญา',
      explanation_en: 'Landlord can raise rent to any amount on renewal without negotiation',
      explanation_th: 'เจ้าของบ้านสามารถขึ้นค่าเช่าเท่าใดก็ได้โดยไม่ต้องเจรจา',
      recommendation_en: 'Add rent increase cap (e.g., max 5% per year) or mutual agreement clause',
      recommendation_th: 'เพิ่มเพดานการขึ้นค่าเช่า (เช่น ไม่เกิน 5% ต่อปี) หรือต้องตกลงร่วมกัน'
    },
    {
      id: 'smoking_excessive_fine',
      severity: 'high',
      category: 'Financial Risk',
      patterns: [/smok(?:e|ing).*(?:fine|penalty).{0,30}(?:฿\s*[2-9]\d{4,}|[2-9]\d{4,})/i],
      title_en: 'Excessive Smoking Fine',
      title_th: 'ค่าปรับสูบบุหรี่สูงเกินไป',
      explanation_en: 'Fine exceeds reasonable cleaning/restoration costs',
      explanation_th: 'ค่าปรับสูงเกินต้นทุนทำความสะอาดที่เป็นธรรม',
      recommendation_en: 'Negotiate to reduce fine to actual cleaning cost (typically ฿5,000-10,000)',
      recommendation_th: 'เจรจาลดเหลือค่าทำความสะอาดจริง (ประมาณ 5,000-10,000 บาท)'
    },
    {
      id: 'pets_daily_penalty',
      severity: 'high',
      category: 'Financial Risk',
      patterns: [/pet.*(?:prohibited|not allowed|ban).*(?:penalty|fine).{0,30}(?:฿\s*[2-9]\d{3,}|[2-9]\d{3,}).*(?:per day|daily)/i],
      title_en: 'Pets Prohibited with Daily Fine',
      title_th: 'ห้ามเลี้ยงสัตว์พร้อมค่าปรับรายวัน',
      explanation_en: 'Daily fines for pets accumulate rapidly and are disproportionate',
      explanation_th: 'ค่าปรับรายวันสำหรับสัตว์เลี้ยงสะสมเร็วและไม่สมดุล',
      recommendation_en: 'Remove daily penalty OR allow small pets with one-time deposit',
      recommendation_th: 'ลบค่าปรับรายวัน หรือ อนุญาตสัตว์ขนาดเล็กพร้อมมัดจำครั้งเดียว'
    }
  ],

  // RIGHTS SUPPRESSION
  RIGHTS_SUPPRESSION: [
    {
      id: 'guest_restrictions',
      severity: 'medium',
      category: 'Rights & Usage',
      patterns: [/guest.*(?:prohibited|not allowed|max \d+ (?:hour|day))/i, /visitor.*(?:register|report)/i],
      title_en: 'Extreme Guest Restrictions',
      title_th: 'ข้อจำกัดแขกที่รุนแรง',
      explanation_en: 'Overly restrictive guest policies interfere with normal residential use',
      explanation_th: 'นโยบายแขกที่จำกัดเกินไปขัดขวางการใช้งานที่พักอาศัยปกติ',
      recommendation_en: 'Negotiate for reasonable guest policy (e.g., overnight guests allowed up to 7 days/month)',
      recommendation_th: 'เจรจาให้มีนโยบายแขกที่เป็นธรรม (เช่น อนุญาตแขกค้างคืนได้ถึง 7 วัน/เดือน)'
    }
  ],

  // DISCRETION IMBALANCE
  DISCRETION: [
    {
      id: 'sole_discretion_general',
      severity: 'medium',
      category: 'Fairness & Balance',
      patterns: [/(?:landlord|owner).{0,40}sole discretion/i, /may determine/i, /ตามดุลยพินิจ.*เจ้าของ/],
      title_en: 'Unilateral "Sole Discretion" Power',
      title_th: 'อำนาจ "ดุลยพินิจ" ฝ่ายเดียว',
      explanation_en: 'Grants landlord unchecked authority without tenant input or appeal',
      explanation_th: 'ให้อำนาจเจ้าของบ้านโดยไม่มีการตรวจสอบหรือโอกาสอุทธรณ์',
      recommendation_en: 'Add "acting reasonably" qualifier or dispute resolution mechanism',
      recommendation_th: 'เพิ่มเงื่อนไข "อย่างสมเหตุสมผล" หรือกลไกแก้ไขข้อพิพาท'
    }
  ],

  // ENFORCEMENT ASYMMETRY
  ENFORCEMENT: [
    {
      id: 'abandoned_property_24h',
      severity: 'high',
      category: 'Rights & Legal',
      patterns: [/abandon.*(?:24|twenty-four) hour/i, /property.*deemed abandon.*(?:1|one) day/i],
      title_en: 'Property Deemed Abandoned After 24 Hours',
      title_th: 'ทรัพย์สินถือว่าถูกทิ้งหลัง 24 ชั่วโมง',
      explanation_en: '24-hour abandonment threshold is unreasonable (travel, emergencies)',
      explanation_th: 'เกณฑ์ 24 ชั่วโมงไม่สมเหตุสมผล (การเดินทาง, เหตุฉุกเฉิน)',
      recommendation_en: 'Extend to 7-14 days AND require written notice before disposal',
      recommendation_th: 'ขยายเป็น 7-14 วัน และกำหนดให้แจ้งเป็นลายลักษณ์อักษรก่อนทำลาย'
    }
  ],

  // UTILITY PRICING RISKS
  UTILITY: [
    {
      id: 'utility_pricing_discretion',
      severity: 'medium',
      category: 'Financial Risk',
      patterns: [/utilit(?:y|ies).*(?:as determined|at rate set|mark-up|plus)/i, /ค่าสาธารณูปโภค.*กำหนดโดย/],
      title_en: 'Unilateral Utility Pricing / No Cap',
      title_th: 'ค่าสาธารณูปโภคกำหนดเองโดยไม่มีเพดาน',
      explanation_en: 'Landlord sets utility rates without transparency or cap, enabling price gouging',
      explanation_th: 'เจ้าของบ้านกำหนดอัตราโดยไม่โปร่งใสหรือมีเพดาน เปิดโอกาสเรียกเก็บเกินจริง',
      recommendation_en: 'Require rate disclosure + cap at 110% of government rate OR direct metering',
      recommendation_th: 'กำหนดให้เปิดเผยอัตรา + จำกัดที่ 110% ของอัตรารัฐ หรือให้มีมิเตอร์ตรง'
    }
  ]
};

// Penalty Severity Evaluator
function evaluatePenalty(text, monthlyRent) {
  const penalties = [];
  
  // Daily penalties
  const dailyMatch = text.match(/(?:฿\s*)?(\d{1,3}(?:,\d{3})*)\s*(?:baht|฿)?.*(?:per day|daily|รายวัน)/i);
  if (dailyMatch) {
    const dailyAmount = parseInt(dailyMatch[1].replace(/,/g, ''));
    const annualizedImpact = dailyAmount * 30;
    const severity = monthlyRent > 0 
      ? (dailyAmount / monthlyRent > 0.005 ? 'critical' : 'high')
      : (dailyAmount > 500 ? 'high' : 'medium');
    
    penalties.push({
      type: 'daily',
      amount: dailyAmount,
      severity,
      note: monthlyRent > 0 ? `${((dailyAmount / monthlyRent) * 100).toFixed(1)}% of monthly rent per day` : null
    });
  }

  // Fixed penalties
  const fixedMatch = text.match(/(?:fine|penalty|ค่าปรับ).*(?:฿\s*)?(\d{1,3}(?:,\d{3})*)/i);
  if (fixedMatch && !dailyMatch) {
    const fixedAmount = parseInt(fixedMatch[1].replace(/,/g, ''));
    const severity = monthlyRent > 0
      ? (fixedAmount >= monthlyRent ? 'critical' : fixedAmount >= monthlyRent * 0.5 ? 'high' : 'medium')
      : (fixedAmount > 10000 ? 'high' : 'medium');
    
    penalties.push({
      type: 'fixed',
      amount: fixedAmount,
      severity,
      note: monthlyRent > 0 ? `${((fixedAmount / monthlyRent) * 100).toFixed(0)}% of monthly rent` : null
    });
  }

  // Multiplier penalties
  const multiplierMatch = text.match(/(\d+)x.*rent|(?:double|triple).*rent/i);
  if (multiplierMatch) {
    const multiplier = multiplierMatch[1] ? parseInt(multiplierMatch[1]) : 
      (text.includes('triple') || text.includes('3x') ? 3 : 2);
    
    penalties.push({
      type: 'multiplier',
      multiplier,
      severity: multiplier >= 2 ? 'critical' : 'high'
    });
  }

  return penalties;
}

// Predatory Language Index
function computePredatoryIndex(text) {
  const phrases = [
    { phrase: 'sole discretion', weight: 3 },
    { phrase: 'without notice', weight: 2 },
    { phrase: 'without refund', weight: 2 },
    { phrase: 'irrevocably waive', weight: 4 },
    { phrase: 'alleged', weight: 2 },
    { phrase: 'may terminate immediately', weight: 3 },
    { phrase: 'no right to', weight: 3 },
    { phrase: 'forfeiture', weight: 3 },
    { phrase: 'at landlord discretion', weight: 3 }
  ];

  let score = 0;
  const found = [];
  
  phrases.forEach(({ phrase, weight }) => {
    const regex = new RegExp(phrase, 'gi');
    const matches = text.match(regex);
    if (matches) {
      score += weight * matches.length;
      found.push(phrase);
    }
  });

  return { score, found };
}

// Compound Detection: Tenant Entrapment
function detectTenantEntrapment(clauses) {
  const hasAutoRenewal = clauses.some(c => 
    /auto(?:matic)?.*renew/i.test(c.raw_text) || /ต่ออัตโนมัติ/.test(c.raw_text)
  );
  
  const hasDualChannel = clauses.some(c =>
    /(?:email|registered mail).*and.*(?:registered mail|email)/i.test(c.raw_text)
  );
  
  const hasConfirmedDelivery = clauses.some(c =>
    /valid.*only.*confirm(?:ed)? delivery/i.test(c.raw_text)
  );

  if (hasAutoRenewal && (hasDualChannel || hasConfirmedDelivery)) {
    return {
      detected: true,
      severity: 'critical',
      title_en: 'Tenant Entrapment Pattern Detected',
      title_th: 'พบรูปแบบกับดักผู้เช่า',
      explanation_en: 'Combination of auto-renewal + complex notice requirements creates a trap where tenants are locked into unwanted renewals',
      explanation_th: 'การรวมกันของการต่ออายุอัตโนมัติและข้อกำหนดการแจ้งที่ซับซ้อนสร้างกับดักที่ล็อคผู้เช่าให้ต่อสัญญาที่ไม่ต้องการ',
      recommendation_en: 'CRITICAL: Negotiate to remove auto-renewal OR simplify notice to single email with 60-day window',
      recommendation_th: 'สำคัญมาก: เจรจาเพื่อลบการต่ออายุอัตโนมัติ หรือ ทำให้การแจ้งเป็นอีเมลเดียวกับช่วง 60 วัน',
      contributing_clauses: clauses.filter(c => 
        /auto.*renew|dual.*channel|confirm.*delivery/i.test(c.raw_text)
      ).map(c => c.clause_id)
    };
  }

  return { detected: false };
}

Deno.serve(async (req) => {
  const body = await req.json();
  const requestId = body.requestId || crypto.randomUUID().slice(0, 8);
  const startTime = Date.now();
  const scanId = body.scanId || crypto.randomUUID();
  
  const logStage = (stage, data) => {
    console.log(`[SCAN:${scanId}][REQ:${requestId}] ${stage}:`, { 
      ...data, 
      elapsed: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  };

  try {
    logStage('REQUEST_START', {
      method: req.method,
      hasRequestId: !!body.requestId,
      hasScanId: !!body.scanId
    });

    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized',
        diagnostic: { requestId, errorCategory: 'AUTH_ERROR' }
      }, { status: 401 });
    }

    const { fileUrls, leaseId } = body;
    
    if (!fileUrls || fileUrls.length === 0) {
      return Response.json({ 
        success: false,
        error: 'No file URLs provided',
        diagnostic: { scanId, requestId, errorCategory: 'VALIDATION_ERROR' }
      }, { status: 400 });
    }

    // Update lease status
    if (leaseId) {
      await base44.asServiceRole.entities.Lease.update(leaseId, {
        status: 'processing'
      });
    }
    
    // STEP 1: Extract Clauses (structured extraction)
    logStage('CLAUSE_EXTRACTION_START', { fileCount: fileUrls.length });
    
    const clauseExtractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract all numbered clauses from this lease document. Return a structured list.

For each clause found, provide:
- clause_id: The clause number/identifier (e.g., "3.2", "Clause 5", "Article III")
- title: The clause heading/title (if present, otherwise empty string)
- raw_text: The complete clause text (limit to 500 characters if very long)
- page_number: Page number where found (estimate if unsure)
- language: "th", "en", or "mixed"

Also extract these basic details:
- property_address (string)
- start_date (YYYY-MM-DD or empty)
- end_date (YYYY-MM-DD or empty)
- rent_amount (number, 0 if not found)
- deposit_amount (number, 0 if not found)
- notice_period_days (integer, 0 if not found)
- language_detected ("en", "th", or "mixed")
- rent_due_day (integer 1-31, 0 if not found)
- deposit_due_date (YYYY-MM-DD or empty)
- deposit_return_days (integer, 0 if not found)`,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          clauses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause_id: { type: "string" },
                title: { type: "string" },
                raw_text: { type: "string" },
                page_number: { type: "integer" },
                language: { type: "string", enum: ["en", "th", "mixed"] }
              },
              required: ["clause_id", "raw_text"]
            }
          },
          property_address: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          rent_amount: { type: "number" },
          deposit_amount: { type: "number" },
          language_detected: { type: "string", enum: ["en", "th", "mixed"] },
          notice_period_days: { type: "integer" },
          rent_due_day: { type: "integer" },
          deposit_due_date: { type: "string" },
          deposit_return_days: { type: "integer" }
        },
        required: ["clauses"]
      }
    });

    const clauses = clauseExtractionResult.clauses || [];
    const basicDetails = {
      property_address: clauseExtractionResult.property_address || '',
      start_date: clauseExtractionResult.start_date || '',
      end_date: clauseExtractionResult.end_date || '',
      rent_amount: clauseExtractionResult.rent_amount || 0,
      deposit_amount: clauseExtractionResult.deposit_amount || 0,
      language_detected: clauseExtractionResult.language_detected || 'en',
      notice_period_days: clauseExtractionResult.notice_period_days || 0,
      rent_due_day: clauseExtractionResult.rent_due_day || 0,
      deposit_due_date: clauseExtractionResult.deposit_due_date || '',
      deposit_return_days: clauseExtractionResult.deposit_return_days || 0
    };

    logStage('CLAUSES_EXTRACTED', { 
      clauseCount: clauses.length,
      language: basicDetails.language_detected,
      hasRent: basicDetails.rent_amount > 0
    });

    // STEP 2: Multi-Dimensional Risk Analysis
    logStage('RISK_ANALYSIS_START', {});
    
    const detectedIssues = [];
    const monthlyRent = basicDetails.rent_amount;

    // Run pattern matching across all dimensions
    [...RISK_PATTERNS.LEGALITY, ...RISK_PATTERNS.PROCEDURAL, ...RISK_PATTERNS.FINANCIAL, 
     ...RISK_PATTERNS.RIGHTS_SUPPRESSION, ...RISK_PATTERNS.DISCRETION, 
     ...RISK_PATTERNS.ENFORCEMENT, ...RISK_PATTERNS.UTILITY].forEach(pattern => {
      
      clauses.forEach(clause => {
        const matched = pattern.patterns.some(regex => regex.test(clause.raw_text));
        
        if (matched) {
          // Check for penalty details if financial category
          let penalties = [];
          if (pattern.category === 'Financial Risk') {
            penalties = evaluatePenalty(clause.raw_text, monthlyRent);
          }

          // Use Thai titles if user language is Thai
          const title = user.language === 'th' ? (pattern.title_th || pattern.title_en) : pattern.title_en;
          const explanation = user.language === 'th' ? (pattern.explanation_th || pattern.explanation_en) : pattern.explanation_en;
          const recommendation = user.language === 'th' ? (pattern.recommendation_th || pattern.recommendation_en) : pattern.recommendation_en;

          detectedIssues.push({
            pattern_id: pattern.id,
            title,
            severity: penalties.length > 0 && penalties[0].severity ? penalties[0].severity : pattern.severity,
            category: pattern.category,
            description: explanation,
            evidence: clause.raw_text.substring(0, 300),
            explanation,
            recommendation,
            clause_id: clause.clause_id,
            page_number: clause.page_number,
            penalties: penalties.length > 0 ? penalties : undefined
          });
        }
      });
    });

    // STEP 3: Compound Detection
    const entrapment = detectTenantEntrapment(clauses);
    if (entrapment.detected) {
      const title = user.language === 'th' ? entrapment.title_th : entrapment.title_en;
      const explanation = user.language === 'th' ? entrapment.explanation_th : entrapment.explanation_en;
      const recommendation = user.language === 'th' ? entrapment.recommendation_th : entrapment.recommendation_en;

      detectedIssues.push({
        pattern_id: 'compound_tenant_entrapment',
        title,
        severity: 'critical',
        category: 'Procedural Fairness',
        description: explanation,
        evidence: `Multi-clause pattern: ${entrapment.contributing_clauses.join(', ')}`,
        explanation,
        recommendation,
        clause_id: entrapment.contributing_clauses.join(', '),
        compound: true
      });
    }

    // STEP 4: Predatory Language Scan
    const fullText = clauses.map(c => c.raw_text).join(' ');
    const predatoryIndex = computePredatoryIndex(fullText);
    
    if (predatoryIndex.score >= 8) {
      const severity = predatoryIndex.score >= 15 ? 'high' : 'medium';
      detectedIssues.push({
        pattern_id: 'predatory_language',
        title: user.language === 'th' ? 'ภาษาที่ไม่เป็นธรรม / เอื้อประโยชน์ฝ่ายเดียว' : 'Predatory / Unbalanced Language',
        severity,
        category: 'Fairness & Balance',
        description: user.language === 'th' 
          ? `เอกสารใช้ภาษาที่เอื้อประโยชน์ต่อเจ้าของบ้านอย่างมีนัยสำคัญ พบวลีเสี่ยง: ${predatoryIndex.found.join(', ')}`
          : `Document uses significantly landlord-favoring language. Found: ${predatoryIndex.found.join(', ')}`,
        evidence: predatoryIndex.found.slice(0, 3).join('; '),
        explanation: user.language === 'th' 
          ? 'การใช้ภาษาที่เอื้อประโยชน์ฝ่ายเดียวบ่อยครั้งบ่งบอกถึงเงื่อนไขที่ไม่สมดุล'
          : 'Frequent use of one-sided language often indicates imbalanced terms',
        recommendation: user.language === 'th'
          ? 'ขอให้ปรับภาษาให้สมดุลหรือเพิ่มเงื่อนไข "อย่างสมเหตุสมผล" ในข้อที่มี sole discretion'
          : 'Request balanced language or add "acting reasonably" qualifiers to discretionary clauses',
        predatory_score: predatoryIndex.score
      });
    }

    // STEP 5: Calculate Risk Score
    const severityWeights = { critical: 25, high: 15, medium: 8, low: 3 };
    let rawScore = detectedIssues.reduce((sum, issue) => sum + (severityWeights[issue.severity] || 5), 0);
    const riskScore = Math.min(100, Math.max(0, rawScore));

    // STEP 6: Generate Summary
    const criticalCount = detectedIssues.filter(i => i.severity === 'critical').length;
    const highCount = detectedIssues.filter(i => i.severity === 'high').length;

    let summaryText = '';
    if (user.language === 'th') {
      if (criticalCount >= 3) {
        summaryText = `พบปัญหาร้ายแรง ${criticalCount} รายการและปัญหาสูง ${highCount} รายการ สัญญานี้มีความเสี่ยงสูงมากต่อผู้เช่า ควรตรวจสอบอย่างละเอียดก่อนเซ็น`;
      } else if (highCount >= 5) {
        summaryText = `พบปัญหาสูง ${highCount} รายการ สัญญามีข้อกำหนดหลายข้อที่เอื้อประโยชน์ต่อเจ้าของบ้าน แนะนำให้ขอปรับแก้`;
      } else {
        summaryText = `พบปัญหาบางข้อที่ควรทบทวน แนะนำให้ตรวจสอบก่อนเซ็น`;
      }
    } else {
      if (criticalCount >= 3) {
        summaryText = `Found ${criticalCount} critical and ${highCount} high-risk issues. This lease poses significant risk to the tenant. Review carefully before signing.`;
      } else if (highCount >= 5) {
        summaryText = `Found ${highCount} high-risk issues. Lease contains multiple landlord-favoring terms. Negotiation recommended.`;
      } else {
        summaryText = `Found several issues worth reviewing. Recommend careful review before signing.`;
      }
    }

    logStage('ANALYSIS_COMPLETE', {
      issuesDetected: detectedIssues.length,
      riskScore,
      criticalCount,
      highCount
    });

    // Return result
    return Response.json({
      success: true,
      result: {
        risk_score: riskScore,
        summary: summaryText,
        flags: detectedIssues,
        clauses_extracted: clauses,
        property_address: basicDetails.property_address,
        start_date: basicDetails.start_date,
        end_date: basicDetails.end_date,
        rent_amount: basicDetails.rent_amount,
        deposit_amount: basicDetails.deposit_amount,
        language_detected: basicDetails.language_detected,
        notice_period_days: basicDetails.notice_period_days,
        rent_due_day: basicDetails.rent_due_day,
        deposit_due_date: basicDetails.deposit_due_date,
        deposit_return_days: basicDetails.deposit_return_days
      },
      diagnostic: {
        buildTag: "multi-layer-engine-v2.0",
        scanId,
        requestId,
        filesProcessed: fileUrls.length,
        totalDuration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logStage('ERROR', { error: error.message, stack: error.stack });
    
    if (body.leaseId) {
      await base44.asServiceRole.entities.Lease.update(body.leaseId, {
        status: 'failed'
      });
    }
    
    return Response.json({ 
      success: false,
      error: error.message,
      diagnostic: {
        scanId,
        requestId,
        errorCategory: 'ANALYSIS_ERROR',
        duration: Date.now() - startTime
      }
    }, { status: 500 });
  }
});