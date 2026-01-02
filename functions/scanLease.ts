import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ============================================================================
// LEASE SHIELD MULTI-ENGINE RISK DETECTION SYSTEM v2.1
// Complete coverage with schema validation and compound detection
// ============================================================================

// RISK ISSUE SCHEMA - Enforced at output (strict)
// Required fields:
// id, rule_id, category, severity, title, summary, why_it_matters,
// recommendations[] (len>=1), clause_refs[] (each has clause_id, page, snippet)
function validateRiskIssue(issue, ruleId, meta) {
  const errors = [];

  const reqStr = (v) => typeof v === 'string' && v.trim().length > 0;
  const reqArr = (v) => Array.isArray(v) && v.length > 0;

  if (!reqStr(issue.id)) errors.push('missing id');
  if (!reqStr(issue.rule_id)) errors.push('missing rule_id');
  if (!reqStr(issue.category)) errors.push('missing category');
  if (!['critical', 'high', 'medium', 'low'].includes(issue.severity)) errors.push('invalid severity');
  if (!reqStr(issue.title)) errors.push('missing title');
  if (!reqStr(issue.summary)) errors.push('missing summary');
  if (!reqStr(issue.why_it_matters)) errors.push('missing why_it_matters');
  if (!reqArr(issue.recommendations)) errors.push('missing recommendations');
  if (!reqArr(issue.clause_refs)) errors.push('missing clause_refs');
  else {
    issue.clause_refs.forEach((c, idx) => {
      if (!reqStr(c.clause_id) || typeof c.page !== 'number' || !reqStr(c.snippet)) {
        errors.push(`invalid clause_ref[${idx}]`);
      }
    });
  }

  if (errors.length > 0) {
    console.error('[IssueEmitRejected]', {
      event: 'IssueEmitRejected',
      rule_id: ruleId,
      leaseId: meta?.leaseId,
      scanId: meta?.scanId,
      missing_fields: errors,
      payload_preview: JSON.stringify(issue).substring(0, 400)
    });
    return false;
  }
  return true;
}

// Safety emit wrapper: maps legacy fields -> strict schema and applies defaults
function emitIssue(draft, meta) {
  const safe = (v, fallback = '') => (typeof v === 'string' ? v.trim() : '') || fallback;
  const recs = Array.isArray(draft.recommendations)
    ? draft.recommendations.filter((r) => typeof r === 'string' && r.trim().length > 0)
    : (safe(draft.recommendation, '').split('\n').map(s => s.replace(/^•\s*/, '').trim()).filter(Boolean));

  const clauseRef = draft.clause_refs && Array.isArray(draft.clause_refs) && draft.clause_refs.length > 0
    ? draft.clause_refs
    : [{
        clause_id: safe(draft.clause_id, 'UNKNOWN'),
        page: typeof draft.page_number === 'number' ? draft.page_number : (Number(draft.page_number) || 1),
        snippet: safe(draft.evidence, safe(draft.evidence_snippet, 'Evidence not available'))
      }];

  const issue = {
    id: draft.id || crypto.randomUUID(),
    rule_id: safe(draft.rule_id, 'UNKNOWN_RULE'),
    category: safe(draft.category, 'Other Risks'),
    severity: ['critical','high','medium','low'].includes(draft.severity) ? draft.severity : 'medium',
    title: safe(draft.title, 'Issue Detected'),
    summary: safe(draft.summary, safe(draft.description, 'Summary not provided')),
    why_it_matters: safe(draft.why_it_matters, safe(draft.explanation, 'Impact not provided')),
    recommendations: recs.length > 0 ? recs : ['Request clarification and amend this clause.'],
    clause_refs: clauseRef,
    // Legacy fields preserved for UI/PDF compatibility
    description: safe(draft.description, safe(draft.summary, '')),
    explanation: safe(draft.explanation, safe(draft.why_it_matters, '')),
    recommendation: recs.join('\n'),
    evidence: clauseRef[0]?.snippet,
    clause_id: clauseRef[0]?.clause_id,
    page_number: clauseRef[0]?.page,
    original_language: draft.original_language || draft.language || 'en',
    penalties: draft.penalties
  };

  return validateRiskIssue(issue, issue.rule_id, meta) ? issue : null;
}

// PENALTY PARSER
function parsePenalties(text, monthlyRent = 0) {
  const penalties = [];
  
  // Daily penalties - EN + TH
  const dailyPatterns = [
    /(?:฿\s*)?(\d{1,3}(?:,\d{3})*)\s*(?:baht|บาท)?.*(?:per day|daily|วันละ|ต่อวัน|รายวัน)/gi,
    /(?:per day|daily|วันละ|ต่อวัน).*(?:฿\s*)?(\d{1,3}(?:,\d{3})*)/gi
  ];
  
  dailyPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > 50) {
        let severity = 'high';
        if (monthlyRent > 0 && (amount / monthlyRent > 0.005)) {
          severity = 'critical';
        }
        penalties.push({
          type: 'daily',
          amount,
          severity,
          context: match[0].substring(0, 150)
        });
      }
    });
  });

  // Fixed penalties
  const fixedPatterns = [
    /(?:fine|penalty|charge|fee|ค่าปรับ|ค่าธรรมเนียม).{0,40}(?:฿\s*)?(\d{1,3}(?:,\d{3})*)/gi,
    /(?:฿\s*)?(\d{1,3}(?:,\d{3})*)\s*(?:baht|บาท).{0,40}(?:fine|penalty|charge|ค่าปรับ)/gi
  ];
  
  fixedPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > 1000 && !match[0].toLowerCase().includes('per day') && !match[0].includes('วันละ')) {
        let severity = 'medium';
        if (monthlyRent > 0) {
          const ratio = amount / monthlyRent;
          if (ratio >= 1.0) severity = 'critical';
          else if (ratio >= 0.5) severity = 'high';
        } else if (amount >= 20000) {
          severity = 'high';
        }
        penalties.push({
          type: 'fixed',
          amount,
          severity,
          context: match[0].substring(0, 150)
        });
      }
    });
  });

  // Multipliers
  const multiplierPatterns = [
    /(?:double|twice|two times|2x|สอง\s*เท่า).*(?:rent|ค่าเช่า)/gi,
    /(?:triple|three times|3x|สาม\s*เท่า).*(?:rent|ค่าเช่า)/gi,
    /(?:rent|ค่าเช่า).*(?:double|twice|2x|สอง\s*เท่า)/gi,
    /(?:rent|ค่าเช่า).*(?:triple|3x|สาม\s*เท่า)/gi
  ];
  
  multiplierPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      const multiplier = text.match(/three|triple|3x|สาม/i) ? 3 : 2;
      penalties.push({
        type: 'multiplier',
        multiplier,
        severity: 'critical',
        context: text.match(pattern)?.[0]?.substring(0, 150) || 'multiplier detected'
      });
    }
  });

  // Forfeiture
  if (/forfeit|forfeiture|ริบ|ริบเงิน/i.test(text)) {
    penalties.push({
      type: 'forfeiture',
      severity: /any.*reason|ทุก.*กรณี/i.test(text) ? 'critical' : 'high',
      context: text.match(/forfeit.*|ริบ.*/i)?.[0]?.substring(0, 150) || 'forfeiture clause'
    });
  }

  return penalties;
}

// ENGINE 1: LEGALITY (Thailand-specific)
const LEGALITY_RULES = [
  {
    rule_id: 'TH_ILLEGAL_UTILITY_DISCONNECT',
    patterns: [
      /(?:disconnect|cut|stop|suspend|terminate|ตัด|หยุด|ระงับ).*(?:water|electric|power|utility|น้ำ|ไฟ|ไฟฟ้า|สาธารณูปโภค)/i,
      /(?:water|electric|power|utility|น้ำ|ไฟ|ไฟฟ้า|สาธารณูปโภค).*(?:disconnect|cut|stop|ตัด|หยุด)/i
    ],
    severity: 'critical',
    category: 'Legal Rights',
    title_en: 'Illegal Utility Disconnection Clause',
    title_th: 'ข้อกำหนดการตัดสาธารณูปโภคที่ผิดกฎหมาย',
    description_en: 'Landlord reserves right to disconnect utilities (water/electricity) as penalty or enforcement method',
    description_th: 'เจ้าของบ้านสงวนสิทธิตัดสาธารณูปโภค (น้ำ/ไฟ) เป็นการลงโทษหรือบังคับใช้',
    explanation_en: 'Under Thai law (Civil & Commercial Code § 538), landlords cannot use utility disconnection as an eviction or penalty method. This violates tenant rights and consumer protection laws.',
    explanation_th: 'ภายใต้กฎหมายไทย (ป.พ.พ. มาตรา 538) เจ้าของบ้านไม่สามารถใช้การตัดสาธารณูปโภคเป็นวิธีขับไล่หรือลงโทษ ซึ่งละเมิดสิทธิผู้เช่าและกฎหมายคุ้มครองผู้บริโภค',
    recommendation_en: '• Demand immediate removal of this clause\n• Reference Thai Civil & Commercial Code § 538\n• This clause is unenforceable and illegal\n• Utility disconnection requires court order only',
    recommendation_th: '• เรียกร้องให้ลบข้อกำหนดนี้ทันที\n• อ้างอิง ป.พ.พ. มาตรา 538\n• ข้อกำหนดนี้บังคับใช้ไม่ได้และผิดกฎหมาย\n• การตัดสาธารณูปโภคต้องมีคำสั่งศาลเท่านั้น'
  },
  {
    rule_id: 'TH_UNRESTRICTED_ENTRY',
    patterns: [
      /(?:landlord|owner|lessor|เจ้าของ|ผู้ให้เช่า).*(?:may enter|right to enter|can access|เข้า|เข้าได้).*(?:any time|without notice|at will|ตลอดเวลา|โดยไม่แจ้ง|ไม่ต้องแจ้ง)/i,
      /(?:entry|access|การเข้า).*(?:without|โดยไม่).*(?:notice|permission|consent|แจ้ง|อนุญาต|ยินยอม)/i
    ],
    severity: 'critical',
    category: 'Privacy & Access',
    title_en: 'Unrestricted Landlord Entry Without Notice',
    title_th: 'เจ้าของบ้านเข้าได้โดยไม่แจ้งล่วงหน้า',
    description_en: 'Landlord may enter property at any time without advance notice or tenant consent',
    description_th: 'เจ้าของบ้านสามารถเข้าอสังหาริมทรัพย์ได้ตลอดเวลาโดยไม่แจ้งล่วงหน้าหรือได้รับความยินยอมจากผู้เช่า',
    explanation_en: 'This violates tenant privacy rights and peaceful enjoyment. Standard practice requires 24-48 hours advance written notice except for genuine emergencies.',
    explanation_th: 'สิ่งนี้ละเมิดสิทธิความเป็นส่วนตัวและการอยู่อาศัยอย่างสงบ แนวปฏิบัติมาตรฐานต้องแจ้งล่วงหน้าเป็นลายลักษณ์อักษร 24-48 ชั่วโมง ยกเว้นกรณีฉุกเฉินจริง',
    recommendation_en: '• Require 24-48 hour advance written notice\n• Exception only for genuine emergencies (fire, flood, gas leak)\n• Define "emergency" explicitly in writing\n• Tenant may refuse entry if notice not given',
    recommendation_th: '• กำหนดให้แจ้งล่วงหน้าเป็นลายลักษณ์อักษร 24-48 ชั่วโมง\n• ยกเว้นเฉพาะกรณีฉุกเฉินจริง (ไฟไหม้ น้ำท่วม แก๊สรั่ว)\n• ระบุคำว่า "ฉุกเฉิน" อย่างชัดเจนเป็นลายลักษณ์อักษร\n• ผู้เช่าสามารถปฏิเสธการเข้าหากไม่ได้แจ้งล่วงหน้า'
  },
  {
    rule_id: 'TH_COURT_RIGHTS_WAIVER',
    patterns: [
      /(?:waive|renounce|relinquish|give up|สละ|สละสิทธิ|ยกเลิก).*(?:right|สิทธิ).*(?:sue|court|legal action|dispute|claim|ฟ้อง|ศาล|ดำเนินคดี|ข้อพิพาท)/i,
      /(?:irrevocably|forever|permanently|ตลอดไป|อย่างถาวร).*(?:waive|สละ)/i,
      /no.*(?:right|สิทธิ).*(?:to sue|to court|ฟ้อง|ศาล)/i
    ],
    severity: 'critical',
    category: 'Rights & Legal',
    title_en: 'Waiver of Court Access / Legal Rights',
    title_th: 'การสละสิทธิเข้าถึงศาล / สิทธิทางกฎหมาย',
    description_en: 'Tenant forced to waive rights to sue, access courts, or pursue legal dispute resolution',
    description_th: 'ผู้เช่าถูกบังคับให้สละสิทธิฟ้องร้อง เข้าถึงศาล หรือดำเนินการแก้ไขข้อพิพาททางกฎหมาย',
    explanation_en: 'Such waivers are likely unenforceable and violate constitutional access to justice. No party can contract away fundamental legal rights.',
    explanation_th: 'การสละสิทธิดังกล่าวน่าจะบังคับใช้ไม่ได้และละเมิดการเข้าถึงความยุติธรรมตามรัฐธรรมนูญ ไม่มีฝ่ายใดสามารถทำสัญญาสละสิทธิทางกฎหมายพื้นฐานได้',
    recommendation_en: '• Remove this clause entirely — it is unenforceable\n• Seek legal advice if landlord insists\n• Consider mediation clause instead (optional, not mandatory)\n• Document your objection in writing',
    recommendation_th: '• ลบข้อกำหนดนี้ออกทั้งหมด — บังคับใช้ไม่ได้\n• ปรึกษาทนายหากเจ้าของบ้านยืนยัน\n• พิจารณาข้อกำหนดการไกล่เกลี่ยแทน (ทางเลือก ไม่บังคับ)\n• บันทึกการคัดค้านของคุณเป็นลายลักษณ์อักษร'
  }
];

// ENGINE 2: PROCEDURAL TRAPS
const PROCEDURAL_RULES = [
  {
    rule_id: 'PROC_AUTO_RENEWAL',
    patterns: [
      /(?:auto|automatic)(?:ally|matically)?.*(?:renew|extend|continue|ต่ออายุ|ต่อสัญญา)/i,
      /(?:renew|extend|ต่ออายุ).*(?:auto|automatic|อัตโนมัติ)/i,
      /(?:unless|except|เว้นแต่).*(?:notice|notification|terminate|แจ้ง|ยกเลิก)/i
    ],
    severity: 'high',
    category: 'Procedural Fairness',
    title_en: 'Automatic Renewal Without Affirmative Consent',
    title_th: 'การต่ออายุอัตโนมัติโดยไม่ได้รับความยินยอมอย่างชัดแจ้ง',
    description_en: 'Lease automatically renews for another term unless tenant provides notice to terminate',
    description_th: 'สัญญาต่ออายุอัตโนมัติอีกระยะหนึ่งเว้นแต่ผู้เช่าจะแจ้งยกเลิก',
    explanation_en: 'This shifts the burden to the tenant to actively opt-out, enabling unwanted renewals and making it difficult to leave. Combined with complex notice requirements, this becomes a procedural trap.',
    explanation_th: 'สิ่งนี้เปลี่ยนภาระให้ผู้เช่าต้องแจ้งออกอย่างแข็งขัน ทำให้เกิดการต่อสัญญาที่ไม่ต้องการและทำให้ออกยาก เมื่อรวมกับข้อกำหนดการแจ้งที่ซับซ้อน จะกลายเป็นกับดักขั้นตอน',
    recommendation_en: '• Change to opt-in renewal requiring both parties to agree in writing\n• OR ensure notice window is 60+ days before renewal\n• Add mutual confirmation step\n• Simplify notice procedure',
    recommendation_th: '• เปลี่ยนเป็นต้องยืนยันต่อสัญญาโดยทั้งสองฝ่ายตกลงเป็นลายลักษณ์อักษร\n• หรือให้แน่ใจว่าช่วงแจ้งล่วงหน้า 60+ วันก่อนต่อสัญญา\n• เพิ่มขั้นตอนยืนยันร่วมกัน\n• ทำให้ขั้นตอนการแจ้งง่ายขึ้น'
  },
  {
    rule_id: 'PROC_DUAL_CHANNEL_NOTICE',
    patterns: [
      /(?:notice|notification|แจ้ง).{0,50}(?:email|mail|จดหมาย).{0,30}(?:and|plus|และ).{0,30}(?:registered|certified|courier|EMS|ลงทะเบียน)/i,
      /(?:registered|certified|ลงทะเบียน).{0,30}(?:and|และ).{0,30}(?:email|อีเมล)/i
    ],
    severity: 'high',
    category: 'Procedural Fairness',
    title_en: 'Dual-Channel Notice Requirement (Email AND Registered Mail)',
    title_th: 'ข้อกำหนดการแจ้งผ่านช่องทางคู่ (อีเมล และ ไปรษณีย์ลงทะเบียน)',
    description_en: 'Tenant must send notice via multiple channels simultaneously (e.g., email AND registered mail)',
    description_th: 'ผู้เช่าต้องส่งการแจ้งผ่านหลายช่องทางพร้อมกัน (เช่น อีเมล และ ไปรษณีย์ลงทะเบียน)',
    explanation_en: 'This creates a procedural trap where missing one channel can invalidate the entire notice, even if the landlord received it through the other channel. Unreasonably burdensome.',
    explanation_th: 'สิ่งนี้สร้างกับดักขั้นตอนที่การพลาดช่องทางหนึ่งสามารถทำให้การแจ้งทั้งหมดใช้ไม่ได้ แม้ว่าเจ้าของบ้านจะได้รับผ่านช่องทางอื่น เป็นภาระที่ไม่สมเหตุสมผล',
    recommendation_en: '• Simplify to single channel (email OR mail, tenant choice)\n• OR allow either/or instead of both\n• Notice valid when sent, not when received\n• Require landlord to provide confirmation email address',
    recommendation_th: '• ทำให้เป็นช่องทางเดียว (อีเมล หรือ จดหมาย ให้ผู้เช่าเลือก)\n• หรือให้เลือกอย่างใดอย่างหนึ่งแทนทั้งสองอย่าง\n• การแจ้งมีผลเมื่อส่ง ไม่ใช่เมื่อได้รับ\n• กำหนดให้เจ้าของบ้านให้ที่อยู่อีเมลยืนยัน'
  },
  {
    rule_id: 'PROC_CONFIRMED_DELIVERY_ONLY',
    patterns: [
      /(?:notice|termination|notification|การแจ้ง).{0,40}(?:valid|effective|complete|มีผล|สมบูรณ์).{0,40}(?:only upon|when|เมื่อ).{0,40}(?:confirmed|actual|verified|receipt|ยืนยัน|ได้รับ)/i,
      /(?:effective|valid|มีผล).{0,30}(?:upon|when|เมื่อ).{0,30}(?:confirm|receipt|ยืนยัน)/i
    ],
    severity: 'high',
    category: 'Procedural Fairness',
    title_en: 'Notice Valid Only Upon Confirmed Delivery',
    title_th: 'การแจ้งมีผลเมื่อได้รับการยืนยันการส่งเท่านั้น',
    description_en: 'Notice not valid until landlord confirms receipt, putting delivery risk entirely on tenant',
    description_th: 'การแจ้งไม่มีผลจนกว่าเจ้าของบ้านจะยืนยันรับ ทำให้ความเสี่ยงการส่งอยู่กับผู้เช่าทั้งหมด',
    explanation_en: 'Tenant bears all postal/courier failures and landlord delays. Landlord could delay confirmation intentionally. Makes timely notice nearly impossible.',
    explanation_th: 'ผู้เช่ารับความเสี่ยงจากความล้มเหลวของไปรษณีย์/คูเรียร์และความล่าช้าของเจ้าของบ้านทั้งหมด เจ้าของบ้านอาจล่าช้าการยืนยันโดยจงใจ ทำให้การแจ้งทันเวลาเป็นไปไม่ได้',
    recommendation_en: '• Change to "effective X days after sending via tracked mail"\n• Remove confirmation requirement\n• Use tracking number as proof of delivery, not landlord confirmation\n• Add email backup receipt',
    recommendation_th: '• เปลี่ยนเป็น "มีผล X วันหลังจากส่งผ่านไปรษณีย์ที่ติดตามได้"\n• ลบข้อกำหนดการยืนยัน\n• ใช้หมายเลขติดตามเป็นหลักฐานการส่ง ไม่ใช่การยืนยันของเจ้าของบ้าน\n• เพิ่มใบเสร็จอีเมลสำรอง'
  },
  {
    rule_id: 'PROC_IMMEDIATE_TERMINATION',
    patterns: [
      /(?:terminate|cancel|end|ยกเลิก|สิ้นสุด).*(?:immediate|instantly|at once|ทันที)/i,
      /(?:immediate|instant|ทันที).*(?:termination|cancellation|การยกเลิก)/i,
      /without.*(?:cure period|opportunity to remedy|notice|โอกาสแก้ไข|แจ้งล่วงหน้า)/i
    ],
    severity: 'high',
    category: 'Procedural Fairness',
    title_en: 'Immediate Termination Without Cure Period',
    title_th: 'การยกเลิกทันทีโดยไม่มีช่วงเวลาแก้ไข',
    description_en: 'Landlord can terminate lease immediately for breach without giving tenant time to fix the issue',
    description_th: 'เจ้าของบ้านสามารถยกเลิกสัญญาทันทีสำหรับการละเมิดโดยไม่ให้เวลาผู้เช่าแก้ไขปัญหา',
    explanation_en: 'No cure period prevents tenant from correcting minor violations like late rent payment or noise complaints. Disproportionately harsh.',
    explanation_th: 'ไม่มีช่วงเวลาแก้ไขทำให้ผู้เช่าไม่สามารถแก้ไขการละเมิดเล็กน้อยเช่นการชำระค่าเช่าล่าช้าหรือการร้องเรียนเรื่องเสียง รุนแรงเกินไปอย่างไม่สมส่วน',
    recommendation_en: '• Add 7-14 day cure period for most breaches\n• Allow immediate termination only for severe violations (illegal activity, safety hazard)\n• Define what constitutes "material breach" requiring no cure period\n• Require written notice of breach first',
    recommendation_th: '• เพิ่มช่วงเวลาแก้ไข 7-14 วันสำหรับการละเมิดส่วนใหญ่\n• อนุญาตให้ยกเลิกทันทีเฉพาะการละเมิดร้ายแรง (กิจกรรมผิดกฎหมาย อันตรายต่อความปลอดภัย)\n• กำหนดว่าอะไรคือ "การละเมิดสำคัญ" ที่ไม่ต้องมีช่วงเวลาแก้ไข\n• กำหนดให้มีการแจ้งการละเมิดเป็นลายลักษณ์อักษรก่อน'
  }
];

// ENGINE 3: FINANCIAL EXPOSURE
const FINANCIAL_RULES = [
  {
    rule_id: 'FIN_EXCESSIVE_DEPOSIT',
    patterns: [
      /(?:deposit|security|มัดจำ|ประกัน).{0,50}(?:equal|equivalent|เท่ากับ|เทียบเท่า).{0,50}(?:3|three|4|four|5|five|6|six|สาม|สี่|ห้า|หก).{0,20}(?:month|เดือน)/i,
      /(?:3|4|5|6|สาม|สี่|ห้า|หก).{0,20}(?:month|เดือน).{0,30}(?:deposit|security|มัดจำ)/i
    ],
    severity: 'high',
    category: 'Financial Risk',
    title_en: 'Excessive Security Deposit (3+ Months)',
    title_th: 'เงินมัดจำสูงเกินไป (3+ เดือน)',
    description_en: 'Security deposit exceeds standard 1-2 months rent, requiring excessive upfront capital',
    description_th: 'เงินมัดจำเกินมาตรฐาน 1-2 เดือน ต้องการเงินทุนล่วงหน้าสูงเกินไป',
    explanation_en: 'Deposits above 2 months create financial hardship for tenants and increase forfeiture risk. Standard practice in Thailand is 1-2 months maximum.',
    explanation_th: 'เงินมัดจำเกิน 2 เดือนสร้างความยากลำบากทางการเงินสำหรับผู้เช่าและเพิ่มความเสี่ยงการริบเงิน แนวปฏิบัติมาตรฐานในไทยคือสูงสุด 1-2 เดือน',
    recommendation_en: '• Negotiate to reduce to 1-2 months rent maximum\n• Request installment payment option\n• Ensure deposit held in separate escrow account\n• Get written confirmation of deposit amount',
    recommendation_th: '• เจรจาลดเหลือสูงสุด 1-2 เดือน\n• ขอตัวเลือกผ่อนชำระ\n• ให้แน่ใจว่าเงินมัดจำฝากในบัญชีแยกต่างหาก\n• รับการยืนยันจำนวนเงินมัดจำเป็นลายลักษณ์อักษร'
  },
  {
    rule_id: 'FIN_DEPOSIT_SOLE_DISCRETION',
    patterns: [
      /(?:deposit|security|มัดจำ).{0,50}(?:forfeit|retain|withhold|deduct|ริบ|เก็บ|หัก).{0,50}(?:sole discretion|landlord.{0,30}determin|at.{0,20}discretion|ดุลยพินิจ|ตามที่เห็นสมควร)/i,
      /(?:damages|ความเสียหาย).{0,30}(?:alleged|claimed|กล่าวอ้าง)/i,
      /(?:deduct|withhold|หัก|เก็บ).{0,30}(?:as.*(?:landlord|owner)|ตามที่เจ้าของ).{0,30}(?:sees fit|deems|เห็นสมควร)/i
    ],
    severity: 'high',
    category: 'Financial Risk',
    title_en: 'Deposit Forfeiture at Sole Discretion',
    title_th: 'การริบเงินมัดจำตามดุลยพินิจของเจ้าของบ้าน',
    description_en: 'Landlord can withhold deposit based on subjective judgment or unproven "alleged" damages',
    description_th: 'เจ้าของบ้านสามารถเก็บเงินมัดจำตามดุลยพินิจหรือความเสียหายที่ "กล่าวอ้าง" โดยไม่พิสูจน์',
    explanation_en: 'No objective standard means tenant cannot challenge withholding. "Alleged" damages need not be proven. Creates arbitrary forfeiture risk.',
    explanation_th: 'ไม่มีมาตรฐานที่เป็นกลางหมายความว่าผู้เช่าไม่สามารถโต้แย้งการเก็บเงิน ความเสียหายที่ "กล่าวอ้าง" ไม่จำเป็นต้องพิสูจน์ สร้างความเสี่ยงการริบเงินโดยพลการ',
    recommendation_en: '• Require itemized list with photos/receipts before any deduction\n• Set maximum deduction limits per item type\n• Add neutral dispute resolution mechanism\n• Specify "reasonable wear and tear" exclusion',
    recommendation_th: '• กำหนดให้มีรายการแยกรายการพร้อมรูปภาพ/ใบเสร็จก่อนหักเงิน\n• กำหนดวงเงินหักสูงสุดต่อประเภทรายการ\n• เพิ่มกลไกระงับข้อพิพาทที่เป็นกลาง\n• ระบุการยกเว้น "การสึกหรอตามปกติ"'
  },
  {
    rule_id: 'FIN_EARLY_TERM_FORFEITURE',
    patterns: [
      /(?:early|premature|ก่อน).{0,30}(?:termination|cancellation|end|ยกเลิก|สิ้นสุด).{0,50}(?:forfeit|lose|ริบ|สูญเสีย).{0,30}(?:deposit|มัดจำ)/i,
      /(?:break|terminate|cancel|ยกเลิก).{0,30}(?:lease|contract|สัญญา).{0,50}(?:forfeit|ริบ)/i
    ],
    severity: 'high',
    category: 'Financial Risk',
    title_en: 'Full Deposit Forfeiture for Early Termination',
    title_th: 'การริบเงินมัดจำทั้งหมดเมื่อยกเลิกก่อนกำหนด',
    description_en: 'Tenant loses entire deposit if terminating lease early, regardless of circumstances or landlord damages',
    description_th: 'ผู้เช่าเสียเงินมัดจำทั้งหมดหากยกเลิกสัญญาเช่าก่อนกำหนด ไม่ว่าสถานการณ์หรือความเสียหายของเจ้าของบ้าน',
    explanation_en: 'Disproportionate penalty — actual landlord damages (re-rental costs) rarely equal full deposit. No allowance for valid reasons (job relocation, family emergency).',
    explanation_th: 'ค่าปรับที่ไม่สมส่วน — ความเสียหายจริงของเจ้าของบ้าน (ต้นทุนการหาผู้เช่าใหม่) ไม่ค่อยเท่ากับเงินมัดจำทั้งหมด ไม่มีการอนุญาตให้มีเหตุผลที่ถูกต้อง (การย้ายงาน ฉุกเฉินครอบครัว)',
    recommendation_en: '• Cap penalty at 1 month rent OR actual documented re-rental costs\n• Add prorated penalty based on remaining lease term\n• Allow termination for valid reasons with reduced penalty\n• Require landlord to mitigate damages (actively seek new tenant)',
    recommendation_th: '• จำกัดค่าปรับที่ 1 เดือน หรือต้นทุนการหาผู้เช่าใหม่จริงที่มีเอกสาร\n• เพิ่มค่าปรับตามสัดส่วนตามระยะเวลาสัญญาที่เหลือ\n• อนุญาตให้ยกเลิกเพราะเหตุผลที่ถูกต้องโดยมีค่าปรับลดลง\n• กำหนดให้เจ้าของบ้านลดความเสียหาย (หาผู้เช่าใหม่อย่างแข็งขัน)'
  },
  {
    rule_id: 'FIN_HOLDOVER_MULTIPLIER',
    patterns: [
      /(?:holdover|overstay|remain|stay|พักอาศัยเกิน|อยู่เกิน).{0,50}(?:2x|double|twice|3x|triple|three times|200%|300%|สอง\s*เท่า|สาม\s*เท่า)/i,
      /(?:after|past|beyond|เกิน|หลัง).{0,30}(?:expir|end|term|สิ้นสุด).{0,50}(?:double|triple|2x|3x|สอง\s*เท่า|สาม\s*เท่า)/i
    ],
    severity: 'critical',
    category: 'Financial Risk',
    title_en: 'Extreme Holdover Penalty (2-3× Rent Multiplier)',
    title_th: 'ค่าปรับพักอาศัยเกินกำหนดสุดโต่ง (คูณ 2-3 เท่า)',
    description_en: 'Daily rent increases to 2-3× normal rate if tenant stays past lease end date',
    description_th: 'ค่าเช่ารายวันเพิ่มเป็น 2-3 เท่าหากผู้เช่าพักอาศัยเกินวันสิ้นสุดสัญญา',
    explanation_en: 'Punitive multiplier penalty is excessive and likely unenforceable. Designed to extract money, not compensate actual damages.',
    explanation_th: 'ค่าปรับที่เป็นการลงโทษมีมากเกินไปและน่าจะบังคับใช้ไม่ได้ ออกแบบมาเพื่อเรียกเก็บเงิน ไม่ใช่ชดเชยความเสียหายจริง',
    recommendation_en: '• Cap at 1.5× daily rent maximum\n• Add 7-day grace period before penalty applies\n• Require good faith effort to vacate\n• Consider reasonable holdover provisions (30 days max)',
    recommendation_th: '• จำกัดสูงสุด 1.5 เท่าของค่าเช่ารายวัน\n• เพิ่มช่วงผ่อนผัน 7 วันก่อนใช้ค่าปรับ\n• กำหนดให้มีความพยายามอย่างจริงใจในการย้ายออก\n• พิจารณาข้อกำหนดการพักอาศัยเกินที่เป็นธรรม (สูงสุด 30 วัน)'
  },
  {
    rule_id: 'FIN_UNILATERAL_RENT_INCREASE',
    patterns: [
      /(?:rent|ค่าเช่า).{0,50}(?:increase|raise|adjust|ขึ้น|เพิ่ม|ปรับ).{0,50}(?:sole discretion|at.*discretion|as.*determin|ดุลยพินิจ|ตามต้องการ)/i,
      /(?:renewal|ต่อสัญญา).{0,50}(?:rent|ค่าเช่า).{0,50}(?:set by|determin.*by|กำหนดโดย).{0,30}(?:landlord|owner|เจ้าของ)/i
    ],
    severity: 'high',
    category: 'Financial Risk',
    title_en: 'Unilateral Rent Increase on Renewal',
    title_th: 'การปรับค่าเช่าฝ่ายเดียวเมื่อต่อสัญญา',
    description_en: 'Landlord can set new rent at any amount upon renewal without negotiation or cap',
    description_th: 'เจ้าของบ้านสามารถกำหนดค่าเช่าใหม่ในจำนวนเท่าใดก็ได้เมื่อต่อสัญญาโดยไม่ต้องเจรจาหรือมีเพดาน',
    explanation_en: 'No protection against unreasonable rent increases forces tenant to accept any amount or lose housing. Combined with auto-renewal, this is particularly abusive.',
    explanation_th: 'ไม่มีการป้องกันการขึ้นค่าเช่าที่ไม่สมเหตุสมผลบังคับให้ผู้เช่ายอมรับจำนวนเงินใดๆ หรือสูญเสียที่พักอาศัย เมื่อรวมกับการต่ออายุอัตโนมัติ นี่เป็นการใช้ในทางที่ผิดโดยเฉพาะ',
    recommendation_en: '• Add annual increase cap (e.g., max 5-10% per year)\n• Require mutual agreement for increases >10%\n• Link to local market rates or inflation index\n• Provide 60-90 days advance notice of increase',
    recommendation_th: '• เพิ่มเพดานการขึ้นค่าเช่าต่อปี (เช่น สูงสุด 5-10% ต่อปี)\n• กำหนดให้ตกลงร่วมกันสำหรับการเพิ่มขึ้น >10%\n• ผูกกับอัตราตลาดท้องถิ่นหรือดัชนีเงินเฟ้อ\n• แจ้งล่วงหน้า 60-90 วันเกี่ยวกับการเพิ่มขึ้น'
  },
  {
    rule_id: 'FIN_UTILITY_UNREGULATED',
    patterns: [
      /(?:utility|electric|water|สาธารณูปโภค|ไฟ|น้ำ).{0,50}(?:as.*determin|at.*rate.*set|mark.*up|plus|ตามที่กำหนด|บวก)/i,
      /(?:landlord|owner|เจ้าของ).{0,30}(?:rate|price|อัตรา|ราคา).{0,30}(?:utility|electric|water|ไฟ|น้ำ)/i
    ],
    severity: 'medium',
    category: 'Financial Risk',
    title_en: 'Unregulated Utility Pricing / Markup Allowed',
    title_th: 'ค่าสาธารณูปโภคไม่มีการควบคุม / อนุญาตให้มีมาร์คอัป',
    description_en: 'Landlord can set utility rates without transparency, regulatory cap, or advance notice',
    description_th: 'เจ้าของบ้านสามารถกำหนดอัตราค่าสาธารณูปโภคโดยไม่โปร่งใส ไม่มีเพดานตามกฎระเบียบ หรือแจ้งล่วงหน้า',
    explanation_en: 'Enables price gouging on utilities beyond actual cost. Tenants have no recourse as they cannot verify against government rates.',
    explanation_th: 'เปิดโอกาสให้เรียกเก็บค่าสาธารณูปโภคเกินต้นทุนจริง ผู้เช่าไม่มีทางแก้ไขเนื่องจากไม่สามารถตรวจสอบกับอัตรารัฐบาล',
    recommendation_en: '• Require disclosure of utility rates in advance\n• Cap at 110% of government/MEA/MWA rate\n• OR install direct meters in tenant name\n• Provide monthly utility statements with unit costs',
    recommendation_th: '• กำหนดให้เปิดเผยอัตราค่าสาธารณูปโภคล่วงหน้า\n• จำกัดที่ 110% ของอัตรารัฐ/MEA/MWA\n• หรือติดตั้งมิเตอร์ตรงในชื่อผู้เช่า\n• ให้ใบแจ้งค่าสาธารณูปโภครายเดือนพร้อมต้นทุนต่อหน่วย'
  }
];

// ENGINE 4: POWER IMBALANCE
const POWER_IMBALANCE_RULES = [
  {
    rule_id: 'PWR_SOLE_DISCRETION_ABUSE',
    patterns: [
      /(?:landlord|owner|lessor|เจ้าของ).{0,50}(?:sole|absolute|complete|exclusive|แต่เพียงผู้เดียว|สมบูรณ์).{0,30}(?:discretion|authority|power|ดุลยพินิจ|อำนาจ)/i,
      /(?:at|ตาม).{0,20}(?:landlord|owner|เจ้าของ).{0,30}(?:discretion|determination|sole|ดุลยพินิจ|การตัดสินใจ)/i
    ],
    severity: 'medium',
    category: 'Fairness & Balance',
    title_en: 'Broad "Sole Discretion" Powers',
    title_th: 'อำนาจ "ดุลยพินิจแต่เพียงผู้เดียว" ที่กว้างเกินไป',
    description_en: 'Multiple clauses grant landlord unchecked discretionary authority without reasonableness standard',
    description_th: 'หลายข้อกำหนดให้อำนาจดุลยพินิจแก่เจ้าของบ้านโดยไม่มีการตรวจสอบและไม่มีมาตรฐานความสมเหตุสมผล',
    explanation_en: 'No accountability or reasonableness standard for landlord decisions. Creates power imbalance and enables arbitrary enforcement.',
    explanation_th: 'ไม่มีความรับผิดชอบหรือมาตรฐานความสมเหตุสมผลสำหรับการตัดสินใจของเจ้าของบ้าน สร้างความไม่สมดุลของอำนาจและเปิดโอกาสให้บังคับใช้โดยพลการ',
    recommendation_en: '• Add "acting reasonably" qualifier to all discretionary powers\n• Require written justification for discretionary decisions\n• Add dispute resolution for unreasonable discretion\n• Make key decisions mutual (require tenant agreement)',
    recommendation_th: '• เพิ่มคำว่า "ทำอย่างสมเหตุสมผล" ในอำนาจดุลยพินิจทั้งหมด\n• กำหนดให้มีเหตุผลเป็นลายลักษณ์อักษรสำหรับการตัดสินใจโดยใช้ดุลยพินิจ\n• เพิ่มการระงับข้อพิพาทสำหรับดุลยพินิจที่ไม่สมเหตุสมผล\n• ทำให้การตัดสินใจสำคัญเป็นร่วมกัน (ต้องมีความยินยอมจากผู้เช่า)'
  },
  {
    rule_id: 'PWR_ASYMMETRIC_TERMINATION',
    patterns: [
      /(?:landlord|owner|เจ้าของ).{0,30}(?:may|can|right to|สามารถ|สิทธิ).{0,30}(?:terminate|cancel|end|ยกเลิก).{0,50}(?:any time|without cause|for any reason|ตลอดเวลา|โดยไม่มีเหตุผล)/i
    ],
    severity: 'medium',
    category: 'Fairness & Balance',
    title_en: 'Asymmetric Termination Rights (Landlord Only)',
    title_th: 'สิทธิยกเลิกแบบไม่สมดุล (เจ้าของบ้านเท่านั้น)',
    description_en: 'Landlord can terminate without cause while tenant faces penalties for same action',
    description_th: 'เจ้าของบ้านสามารถยกเลิกโดยไม่มีเหตุผล ในขณะที่ผู้เช่าต้องเผชิญค่าปรับสำหรับการกระทำเดียวกัน',
    explanation_en: 'One-sided power creates housing instability for tenant while landlord has complete flexibility. Fundamentally unfair.',
    explanation_th: 'อำนาจฝ่ายเดียวสร้างความไม่มั่นคงในที่พักอาศัยสำหรับผู้เช่า ในขณะที่เจ้าของบ้านมีความยืดหยุ่นอย่างสมบูรณ์ ไม่ยุติธรรมโดยพื้นฐาน',
    recommendation_en: '• Make termination rights mutual and equal\n• Require equal notice period for both parties\n• Add relocation compensation if landlord terminates early\n• Limit landlord termination to sale, renovation, or personal use only',
    recommendation_th: '• ทำให้สิทธิยกเลิกเป็นร่วมกันและเท่าเทียมกัน\n• กำหนดช่วงแจ้งที่เท่าเทียมกันสำหรับทั้งสองฝ่าย\n• เพิ่มค่าชดเชยการย้ายถิ่นหากเจ้าของบ้านยกเลิกก่อนกำหนด\n• จำกัดการยกเลิกของเจ้าของบ้านเฉพาะการขาย การปรับปรุง หรือการใช้ส่วนตัวเท่านั้น'
  }
];

// ENGINE 5: RIGHTS SUPPRESSION
const RIGHTS_SUPPRESSION_RULES = [
  {
    rule_id: 'RIGHTS_GUEST_RESTRICTIONS',
    patterns: [
      /(?:guest|visitor|แขก|ผู้มาเยือน).{0,50}(?:prohibit|not.*allow|forbidden|ban|ห้าม|ไม่อนุญาต)/i,
      /(?:overnight|stay|พักค้าง).{0,30}(?:guest|แขก).{0,30}(?:not.*permit|prohibit|forbid|ห้าม)/i,
      /(?:visitor|แขก).{0,30}(?:register|report|approval|ลงทะเบียน|รายงาน|อนุญาต)/i
    ],
    severity: 'medium',
    category: 'Rights & Usage',
    title_en: 'Extreme Guest/Visitor Restrictions',
    title_th: 'ข้อจำกัดแขก/ผู้มาเยือนที่รุนแรง',
    description_en: 'Prohibits or severely restricts tenant ability to have guests or overnight visitors',
    description_th: 'ห้ามหรือจำกัดความสามารถของผู้เช่าในการมีแขกหรือผู้มาเยือนค้างคืนอย่างรุนแรง',
    explanation_en: 'Interferes with normal residential use and tenant privacy. Unreasonably restricts social activities and family visits.',
    explanation_th: 'แทรกแซงการใช้งานที่พักอาศัยปกติและความเป็นส่วนตัวของผู้เช่า จำกัดกิจกรรมทางสังคมและการเยี่ยมเยียนครอบครัวอย่างไม่สมเหตุสมผล',
    recommendation_en: '• Allow reasonable overnight guests (e.g., up to 7 days/month)\n• Remove registration/approval requirements\n• Limit to safety/security concerns only\n• Respect tenant privacy rights',
    recommendation_th: '• อนุญาตแขกค้างคืนที่เป็นธรรม (เช่น ถึง 7 วัน/เดือน)\n• ลบข้อกำหนดการลงทะเบียน/การขออนุญาต\n• จำกัดเฉพาะความกังวลด้านความปลอดภัย/การรักษาความปลอดภัยเท่านั้น\n• เคารพสิทธิความเป็นส่วนตัวของผู้เช่า'
  },
  {
    rule_id: 'RIGHTS_USE_RESTRICTIONS',
    patterns: [
      /(?:prohibit|ban|not.*allow|ห้าม|ไม่อนุญาต).{0,50}(?:cook|laundry|hang|dry|work|business|ทำอาหาร|ซักผ้า|ตาก|ทำงาน)/i,
      /(?:no|not|ห้าม).{0,30}(?:alterations|decorat|paint|nail|ดัดแปลง|ตกแต่ง|ทาสี|ตะปู)/i
    ],
    severity: 'medium',
    category: 'Rights & Usage',
    title_en: 'Excessive Property Use Restrictions',
    title_th: 'ข้อจำกัดการใช้งานอสังหาริมทรัพย์ที่มากเกินไป',
    description_en: 'Restricts normal residential activities beyond reasonable bounds (cooking, laundry, decoration, work-from-home)',
    description_th: 'จำกัดกิจกรรมที่พักอาศัยปกติเกินกว่าขอบเขตที่สมเหตุสมผล (ทำอาหาร ซักผ้า การตกแต่ง การทำงานจากที่บ้าน)',
    explanation_en: 'Unreasonable restrictions interfere with livability and modern lifestyle. Particularly problematic for work-from-home bans in post-COVID era.',
    explanation_th: 'ข้อจำกัดที่ไม่สมเหตุสมผลขัดขวางการอยู่อาศัยและไลฟ์สไตล์สมัยใหม่ มีปัญหาโดยเฉพาะสำหรับการห้ามทำงานจากที่บ้านในยุคหลัง COVID',
    recommendation_en: '• Allow normal residential activities\n• Limit restrictions to safety/structural concerns\n• Clarify what modifications require approval\n• Allow work-from-home unless commercial activity',
    recommendation_th: '• อนุญาตกิจกรรมที่พักอาศัยปกติ\n• จำกัดข้อจำกัดเฉพาะความกังวลด้านความปลอดภัย/โครงสร้าง\n• ชี้แจงว่าการดัดแปลงใดต้องได้รับอนุมัติ\n• อนุญาตทำงานจากที่บ้านเว้นแต่เป็นกิจกรรมเชิงพาณิชย์'
  }
];

// ENGINE 6: MISSING SAFEGUARDS
const MISSING_SAFEGUARDS_RULES = [
  {
    rule_id: 'MISSING_DEPOSIT_RETURN_DEADLINE',
    check: (keyTerms) => !keyTerms.deposit_return_days || keyTerms.deposit_return_days === 0,
    severity: 'medium',
    category: 'Financial Risk',
    title_en: 'No Deposit Return Timeframe Specified',
    title_th: 'ไม่ระบุกรอบเวลาคืนเงินมัดจำ',
    description_en: 'Lease does not specify when deposit must be returned after move-out',
    description_th: 'สัญญาไม่ระบุว่าต้องคืนเงินมัดจำเมื่อใดหลังย้ายออก',
    explanation_en: 'No deadline allows indefinite deposit retention. Standard practice is 30 days after move-out with itemized deduction list.',
    explanation_th: 'ไม่มีกำหนดเวลาอนุญาตให้เก็บเงินมัดจำไว้ไม่จำกัดเวลา แนวปฏิบัติมาตรฐานคือ 30 วันหลังย้ายออกพร้อมรายการหักเงินแยกรายการ',
    recommendation_en: '• Add specific timeframe (e.g., 30 days after move-out)\n• Require itemized deduction list within 14 days\n• Include interest penalty for late return (e.g., 1% per month)\n• Specify return method (bank transfer preferred)',
    recommendation_th: '• เพิ่มกรอบเวลาที่เฉพาะเจาะจง (เช่น 30 วันหลังย้ายออก)\n• กำหนดให้มีรายการหักเงินแยกรายการภายใน 14 วัน\n• รวมดอกเบี้ยสำหรับการคืนช้า (เช่น 1% ต่อเดือน)\n• ระบุวิธีการคืน (โอนเงินผ่านธนาคารเป็นที่ต้องการ)'
  },
  {
    rule_id: 'MISSING_ABANDONED_PROPERTY_SHORT',
    patterns: [
      /(?:abandon|left|ทิ้ง|ทอดทิ้ง).{0,50}(?:24|twenty-four|48|forty-eight|1|one|2|two).{0,30}(?:hour|day|ชั่วโมง|วัน)/i,
      /(?:deemed|consider|ถือว่า).{0,30}(?:abandon|ทิ้ง).{0,30}(?:24|48|1|2)/i
    ],
    severity: 'high',
    category: 'Rights & Legal',
    title_en: 'Property Deemed Abandoned After 24-48 Hours',
    title_th: 'ทรัพย์สินถือว่าถูกทิ้งหลัง 24-48 ชั่วโมง',
    description_en: 'Extremely short timeframe before property deemed abandoned and can be disposed',
    description_th: 'กรอบเวลาสั้นมากก่อนที่ทรัพย์สินจะถือว่าถูกทิ้งและสามารถทำลาย',
    explanation_en: 'Unreasonable — does not account for travel, emergencies, hospitalization, or business trips. Can result in loss of valuable belongings.',
    explanation_th: 'ไม่สมเหตุสมผล — ไม่คำนึงถึงการเดินทาง ฉุกเฉิน การเข้าโรงพยาบาล หรือการเดินทางเพื่อธุรกิจ อาจส่งผลให้สูญเสียทรัพย์สินมีค่า',
    recommendation_en: '• Extend to minimum 7-14 days\n• Require written notice before disposal\n• Allow tenant to recover belongings without penalty\n• Specify storage period and costs',
    recommendation_th: '• ขยายเป็นอย่างน้อย 7-14 วัน\n• กำหนดให้แจ้งเป็นลายลักษณ์อักษรก่อนทำลาย\n• อนุญาตให้ผู้เช่ารับของคืนโดยไม่มีค่าปรับ\n• ระบุระยะเวลาจัดเก็บและค่าใช้จ่าย'
  }
];

// COMPOUND PATTERN DETECTION
function detectCompoundRisks(clauses, keyTerms, userLang) {
  const compounds = [];
  const fullText = clauses.map(c => c.raw_text).join(' ');
  
  // COMPOUND 1: Tenant Entrapment Pattern
  const hasAutoRenewal = /auto(?:matic)?.*renew|renew.*auto|ต่ออายุ.*อัตโนมัติ/i.test(fullText);
  const hasDualChannel = /(?:email.*and.*mail|mail.*and.*email|registered.*and.*email)/i.test(fullText);
  const hasConfirmedDelivery = /(?:valid|effective|มีผล).*(?:only upon|when|เมื่อ).*(?:confirm|receipt|ยืนยัน)/i.test(fullText);

  if (hasAutoRenewal && (hasDualChannel || hasConfirmedDelivery)) {
    compounds.push({
      id: crypto.randomUUID(),
      rule_id: 'COMPOUND_TENANT_ENTRAPMENT',
      severity: 'critical',
      category: 'Procedural Fairness',
      title: userLang === 'th' 
        ? '🚨 รูปแบบกับดักผู้เช่า: การต่ออายุอัตโนมัติ + กับดักการแจ้ง'
        : '🚨 Tenant Entrapment Pattern: Auto-Renewal + Notice Trap',
      description: userLang === 'th'
        ? 'การรวมกันของการต่ออายุอัตโนมัติและข้อกำหนดการแจ้งที่ซับซ้อนสร้างกับดักขั้นตอนที่ล็อคผู้เช่าให้ต่อสัญญาที่ไม่ต้องการ'
        : 'Combination of automatic renewal + complex notice requirements creates procedural trap locking tenants into unwanted renewals',
      explanation: userLang === 'th'
        ? 'การออกแบบนี้มีจุดมุ่งหมายโดยเฉพาะเพื่อทำให้ผู้เช่าหลุดพ้นเป็นไปไม่ได้ แม้ว่าพวกเขาจะพยายามแจ้งอย่างจริงใจก็ตาม ความล้มเหลวทางเทคนิคใดๆ (ช่องทางเดียวล้มเหลว การยืนยันล่าช้า) = ต่อสัญญาโดยอัตโนมัติ'
        : 'This design specifically aims to make tenant exit impossible even with good-faith notice attempts. Any technical failure (one channel fails, confirmation delayed) = automatic renewal',
      recommendation: userLang === 'th'
        ? '• สำคัญมาก: ลบการต่ออายุอัตโนมัติทั้งหมด — ต้องมีการยืนยันร่วมกันเป็นลายลักษณ์อักษร\n• หรือทำให้การแจ้งเป็นอีเมลเดียวกับช่วง 60+ วัน\n• การแจ้งมีผลเมื่อส่ง ไม่ใช่เมื่อได้รับยืนยัน\n• เพิ่มข้อกำหนดการตกลงร่วมกันสำหรับการต่อสัญญา',
      compound: true,
      evidence: 'Multi-clause pattern detected'
    });
  }

  // COMPOUND 2: Penalty Stack Risk
  const penaltyClauses = clauses.filter(c => {
    const penalties = parsePenalties(c.raw_text, keyTerms.rent_amount);
    return penalties.length > 0;
  });
  
  if (penaltyClauses.length >= 3) {
    const hasMultiplier = penaltyClauses.some(c => /2x|3x|double|triple|สอง.*เท่า|สาม.*เท่า/i.test(c.raw_text));
    compounds.push({
      id: crypto.randomUUID(),
      rule_id: 'COMPOUND_PENALTY_STACK',
      severity: hasMultiplier ? 'critical' : 'high',
      category: 'Financial Risk',
      title: userLang === 'th'
        ? '⚠️ การซ้อนค่าปรับ: หลายค่าปรับที่ซ้อนกัน'
        : '⚠️ Penalty Stack: Multiple Compounding Fines',
      description: userLang === 'th'
        ? `พบข้อกำหนดค่าปรับ ${penaltyClauses.length} ข้อที่สามารถซ้อนกันเป็นภาระทางการเงินสูง`
        : `Found ${penaltyClauses.length} penalty clauses that can compound into severe financial burden`,
      explanation: userLang === 'th'
        ? 'การละเมิดครั้งเดียวอาจทริกเกอร์ค่าปรับหลายรายการพร้อมกัน (รายวัน + ถาวร + ริบ) ความสะสมนี้สามารถเกินความเสียหายจริงอย่างรวดเร็ว'
        : 'Single violation can trigger multiple penalties simultaneously (daily + fixed + forfeiture). This accumulation can quickly exceed actual damages',
      recommendation: userLang === 'th'
        ? '• จำกัดค่าปรับรวมสูงสุด\n• ป้องกันการซ้อนค่าปรับสำหรับการละเมิดครั้งเดียว\n• กำหนดให้เลือกค่าปรับที่มากที่สุดแทนการรวม\n• เพิ่มเพดานค่าปรับรวมที่ % ของค่าเช่า',
      compound: true,
      evidence: `${penaltyClauses.length} penalty clauses detected`
    });
  }

  // COMPOUND 3: Deposit Discretion Abuse
  const depositClauses = clauses.filter(c => 
    /deposit|security|มัดจำ|ประกัน/i.test(c.raw_text) &&
    (/sole discretion|at.*discretion|alleged|ดุลยพินิจ|กล่าวอ้าง/i.test(c.raw_text))
  );
  
  if (depositClauses.length > 0 && keyTerms.deposit_amount > 0) {
    compounds.push({
      id: crypto.randomUUID(),
      rule_id: 'COMPOUND_DEPOSIT_DISCRETION',
      severity: 'high',
      category: 'Financial Risk',
      title: userLang === 'th'
        ? '💰 การใช้ดุลยพินิจในการคืนเงินมัดจำในทางที่ผิด'
        : '💰 Deposit Discretion Abuse',
      description: userLang === 'th'
        ? 'เงินมัดจำจำนวนมากรวมกับอำนาจดุลยพินิจแต่เพียงผู้เดียวในการหักเงินสร้างความเสี่ยงการสูญเสียสูง'
        : 'Large deposit combined with sole discretion deduction power creates high forfeiture risk',
      explanation: userLang === 'th'
        ? `ด้วยเงินมัดจำ ฿${keyTerms.deposit_amount.toLocaleString()} และไม่มีมาตรฐานที่เป็นกลาง เจ้าของบ้านสามารถเก็บเงินจำนวนมากโดยพลการสำหรับ "ความเสียหายที่กล่าวอ้าง"`,
      explanation: `With ฿${keyTerms.deposit_amount.toLocaleString()} deposit and no objective standard, landlord can arbitrarily retain large sums for "alleged damages"`,
      recommendation: userLang === 'th'
        ? '• ลดเงินมัดจำเหลือ 1-2 เดือน\n• กำหนดให้มีรายการแยกรายการพร้อมรูปภาพก่อนหักเงิน\n• เพิ่มกลไกระงับข้อพิพาทที่เป็นกลาง\n• กำหนดวงเงินหักสูงสุดต่อประเภทความเสียหาย',
      compound: true,
      evidence: `Deposit ฿${keyTerms.deposit_amount.toLocaleString()} + discretion clause`
    });
  }

  return compounds;
}

// PREDATORY LANGUAGE INDEX
function analyzePredatoryLanguage(text, userLang) {
  const lexicon = [
    { phrase: /sole discretion|แต่เพียงผู้เดียว|ดุลยพินิจแต่เพียงผู้เดียว/gi, weight: 3 },
    { phrase: /absolute discretion|ดุลยพินิจสมบูรณ์/gi, weight: 4 },
    { phrase: /without notice|โดยไม่แจ้ง|ไม่ต้องแจ้ง/gi, weight: 2 },
    { phrase: /without refund|ไม่คืนเงิน/gi, weight: 2 },
    { phrase: /irrevocably|ตลอดไป|อย่างถาวร/gi, weight: 4 },
    { phrase: /waive|สละสิทธิ/gi, weight: 3 },
    { phrase: /alleged|claimed|กล่าวอ้าง/gi, weight: 2 },
    { phrase: /may terminate immediately|ยกเลิกทันที/gi, weight: 3 },
    { phrase: /forfeit|forfeiture|ริบ|ริบเงิน/gi, weight: 3 },
    { phrase: /no right to|ไม่มีสิทธิ/gi, weight: 3 },
    { phrase: /without compensation|โดยไม่ชดเชย/gi, weight: 3 },
    { phrase: /at landlord.{0,20}determination|ตามที่เจ้าของกำหนด/gi, weight: 2 }
  ];

  let score = 0;
  const found = [];
  
  lexicon.forEach(({ phrase, weight }) => {
    const matches = text.match(phrase);
    if (matches) {
      score += weight * matches.length;
      found.push({ phrase: matches[0], count: matches.length });
    }
  });

  if (score >= 8) {
    const severity = score >= 15 ? 'high' : 'medium';
    return {
      id: crypto.randomUUID(),
      rule_id: 'PREDATORY_LANGUAGE_PATTERN',
      severity,
      category: 'Fairness & Balance',
      title: userLang === 'th' 
        ? 'รูปแบบภาษาที่ไม่เป็นธรรม/เอื้อประโยชน์ฝ่ายเดียว'
        : 'Predatory/One-Sided Language Pattern',
      description: userLang === 'th'
        ? `เอกสารใช้ภาษาที่เอื้อประโยชน์ต่อเจ้าของบ้านอย่างมีนัยสำคัญ (คะแนน: ${score})`
        : `Document uses significantly landlord-favoring language throughout (score: ${score})`,
      explanation: userLang === 'th'
        ? 'การใช้ภาษาฝ่ายเดียวบ่อยครั้งบ่งชี้ถึงความไม่สมดุลของอำนาจที่เป็นระบบ พบวลีที่เป็นการลงโทษหลายรายการโดยไม่มีการป้องกันที่สมดุล'
        : 'Frequent one-sided language indicates structural power imbalance. Multiple punitive phrases without balanced protections',
      recommendation: userLang === 'th'
        ? '• ขอให้ใช้ภาษาที่สมดุลตลอดทั้งเอกสาร\n• เพิ่มคำว่า "อย่างสมเหตุสมผล" ในอำนาจดุลยพินิจ\n• ให้แน่ใจว่าผู้เช่ามีการป้องกันที่เทียบเท่า\n• ขอให้ทนายทบทวนก่อนเซ็น'
        : '• Request balanced language throughout\n• Add "acting reasonably" qualifiers\n• Ensure tenant has equivalent protections\n• Have lawyer review before signing',
      predatory_score: score,
      evidence: found.slice(0, 5).map(f => `${f.phrase} (${f.count}×)`).join(', ')
    });
  }
  
  return null;
}

// MAIN SCAN FUNCTION
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
    logStage('ENGINE_START', { version: 'v2.1-multi-engine-validated' });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      logStage('AUTH_FAILED', {});
      return Response.json({ 
        success: false,
        error: 'Unauthorized',
        diagnostic: { requestId, errorCategory: 'AUTH_ERROR' }
      }, { status: 401 });
    }

    const { fileUrls, leaseId } = body;
    
    if (!fileUrls || fileUrls.length === 0) {
      logStage('VALIDATION_FAILED', { reason: 'no_files' });
      return Response.json({ 
        success: false,
        error: 'No file URLs provided',
        diagnostic: { scanId, requestId, errorCategory: 'VALIDATION_ERROR' }
      }, { status: 400 });
    }

    logStage('CLAUSE_EXTRACTION_START', { fileCount: fileUrls.length });
    
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract ALL clauses from this residential lease document.

FOR EACH CLAUSE provide:
- clause_id: identifier (e.g., "3.2", "Section 5") or generate "CLAUSE-nnn"
- title: heading/title (empty if none)
- raw_text: complete clause text (max 600 chars)
- page_number: estimated page (1 if unsure)
- language: "th", "en", or "mixed"

ALSO EXTRACT:
- property_address (string, empty if not found)
- start_date (YYYY-MM-DD, empty if not found)
- end_date (YYYY-MM-DD, empty if not found)
- rent_amount (number, 0 if not found)
- deposit_amount (number, 0 if not found)
- notice_period_days (integer, 0 if not found)
- language_detected ("en", "th", or "mixed")
- rent_due_day (integer 1-31, 0 if not found)
- deposit_due_date (YYYY-MM-DD, empty if not found)
- deposit_return_days (integer days after lease end, 0 if not found)

Be thorough.`,
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

    const clauses = extractionResult.clauses || [];
    const keyTerms = {
      property_address: extractionResult.property_address || '',
      start_date: extractionResult.start_date || '',
      end_date: extractionResult.end_date || '',
      rent_amount: extractionResult.rent_amount || 0,
      deposit_amount: extractionResult.deposit_amount || 0,
      language_detected: extractionResult.language_detected || 'en',
      notice_period_days: extractionResult.notice_period_days || 0,
      rent_due_day: extractionResult.rent_due_day || 0,
      deposit_due_date: extractionResult.deposit_due_date || '',
      deposit_return_days: extractionResult.deposit_return_days || 0
    };

    logStage('CLAUSES_EXTRACTED', { count: clauses.length, language: keyTerms.language_detected });

    // MULTI-ENGINE DETECTION
    logStage('RISK_ANALYSIS_START', { engines: 6 });
    
    const detectedIssues = [];
    const invalidIssues = [];
    const userLang = user.language || 'en';
    const monthlyRent = keyTerms.rent_amount;

    // Run all engines
    const allRules = [
      ...LEGALITY_RULES,
      ...PROCEDURAL_RULES,
      ...FINANCIAL_RULES,
      ...POWER_IMBALANCE_RULES,
      ...RIGHTS_SUPPRESSION_RULES
    ];

    allRules.forEach(rule => {
      clauses.forEach(clause => {
        const matched = rule.patterns.some(pattern => pattern.test(clause.raw_text));
        if (matched) {
          const penalties = parsePenalties(clause.raw_text, monthlyRent);
          const maxSeverity = penalties.length > 0 
            ? penalties.reduce((max, p) => {
                const order = { critical: 3, high: 2, medium: 1, low: 0 };
                return (order[p.severity] || 0) > (order[max] || 0) ? p.severity : max;
              }, rule.severity)
            : rule.severity;

          const emitted = emitIssue({
            rule_id: rule.rule_id,
            severity: maxSeverity,
            category: rule.category,
            title: userLang === 'th' ? rule.title_th : rule.title_en,
            summary: userLang === 'th' ? rule.description_th : rule.description_en,
            why_it_matters: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
            recommendations: (userLang === 'th' ? rule.recommendation_th : rule.recommendation_en)
              .split('\n').map(s => s.replace(/^•\s*/, '')).filter(Boolean),
            clause_refs: [{
              clause_id: clause.clause_id,
              page: clause.page_number || 1,
              snippet: clause.raw_text.substring(0, 300)
            }],
            original_language: clause.language,
            penalties: penalties.length > 0 ? penalties : undefined
          }, { leaseId, scanId });

          if (emitted) detectedIssues.push(emitted);
        }
      });
    });

    // Missing safeguards
    MISSING_SAFEGUARDS_RULES.forEach(rule => {
      if (rule.check && rule.check(keyTerms)) {
        const issue = {
          id: crypto.randomUUID(),
          rule_id: rule.rule_id,
          severity: rule.severity,
          category: rule.category,
          title: userLang === 'th' ? rule.title_th : rule.title_en,
          description: userLang === 'th' ? rule.description_th : rule.description_en,
          explanation: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
          recommendation: userLang === 'th' ? rule.recommendation_th : rule.recommendation_en,
          evidence: 'Not explicitly stated in lease',
          missing_safeguard: true
        };
        
        if (validateRiskIssue(issue, rule.rule_id)) {
          detectedIssues.push(issue);
        } else {
          invalidIssues.push({ rule_id: rule.rule_id, reason: 'schema_validation_failed' });
        }
      }
      
      if (rule.patterns) {
        clauses.forEach(clause => {
          const matched = rule.patterns.some(pattern => pattern.test(clause.raw_text));
          if (matched) {
            const issue = {
              id: crypto.randomUUID(),
              rule_id: rule.rule_id,
              severity: rule.severity,
              category: rule.category,
              title: userLang === 'th' ? rule.title_th : rule.title_en,
              description: userLang === 'th' ? rule.description_th : rule.description_en,
              explanation: userLang === 'th' ? rule.explanation_th : rule.explanation_en,
              recommendation: userLang === 'th' ? rule.recommendation_th : rule.recommendation_en,
              evidence: clause.raw_text.substring(0, 300),
              clause_id: clause.clause_id,
              page_number: clause.page_number,
              original_language: clause.language
            };
            
            if (validateRiskIssue(issue, rule.rule_id)) {
              detectedIssues.push(issue);
            } else {
              invalidIssues.push({ rule_id: rule.rule_id, reason: 'schema_validation_failed' });
            }
          }
        });
      }
    });

    // Compound patterns
    logStage('COMPOUND_DETECTION_START', {});
    const compoundRisks = detectCompoundRisks(clauses, keyTerms, userLang);
    compoundRisks.forEach(risk => {
      if (validateRiskIssue(risk, risk.rule_id)) {
        detectedIssues.push(risk);
      } else {
        invalidIssues.push({ rule_id: risk.rule_id, reason: 'schema_validation_failed' });
      }
    });

    // Predatory language
    logStage('PREDATORY_LANGUAGE_START', {});
    const fullText = clauses.map(c => c.raw_text).join(' ');
    const predatoryRisk = analyzePredatoryLanguage(fullText, userLang);
    if (predatoryRisk) {
      if (validateRiskIssue(predatoryRisk, predatoryRisk.rule_id)) {
        detectedIssues.push(predatoryRisk);
      } else {
        invalidIssues.push({ rule_id: predatoryRisk.rule_id, reason: 'schema_validation_failed' });
      }
    }

    // Deduplication
    const uniqueIssues = [];
    const seen = new Set();
    detectedIssues.forEach(issue => {
      const key = `${issue.rule_id}-${issue.clause_id || 'global'}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueIssues.push(issue);
      }
    });

    logStage('DEDUPLICATION', { before: detectedIssues.length, after: uniqueIssues.length, invalid: invalidIssues.length });

    // Risk score
    const severityWeights = { critical: 25, high: 15, medium: 8, low: 3 };
    let rawScore = uniqueIssues.reduce((sum, issue) => sum + (severityWeights[issue.severity] || 5), 0);
    const riskScore = Math.min(100, Math.max(0, rawScore));

    const criticalCount = uniqueIssues.filter(i => i.severity === 'critical').length;
    const highCount = uniqueIssues.filter(i => i.severity === 'high').length;
    const mediumCount = uniqueIssues.filter(i => i.severity === 'medium').length;

    // Summary
    let summary = '';
    if (userLang === 'th') {
      if (criticalCount >= 3) {
        summary = `พบปัญหาร้ายแรง ${criticalCount} รายการ, สูง ${highCount} รายการ และปานกลาง ${mediumCount} รายการ สัญญานี้มีความเสี่ยงสูงมากต่อผู้เช่า`;
      } else if (highCount >= 5) {
        summary = `พบปัญหาสูง ${highCount} รายการและปานกลาง ${mediumCount} รายการ สัญญามีข้อกำหนดหลายข้อที่เอื้อประโยชน์ต่อเจ้าของบ้าน`;
      } else {
        summary = `พบปัญหา ${uniqueIssues.length} รายการที่ควรทบทวน`;
      }
    } else {
      if (criticalCount >= 3) {
        summary = `Found ${criticalCount} critical, ${highCount} high-risk, and ${mediumCount} medium-risk issues. This lease poses significant risk to tenant.`;
      } else if (highCount >= 5) {
        summary = `Found ${highCount} high-risk and ${mediumCount} medium-risk issues. Lease contains multiple landlord-favoring terms.`;
      } else {
        summary = `Found ${uniqueIssues.length} issues worth reviewing.`;
      }
    }

    logStage('DETERMINISTIC_ANALYSIS_COMPLETE', {
      totalIssues: uniqueIssues.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      riskScore,
      invalidIssues: invalidIssues.length
    });

    // ========================================================================
    // PHASE 7: LLM "THAI LEASE LAWYER" AUGMENTATION LAYER
    // ========================================================================
    logStage('LLM_LAWYER_START', {});
    
    const detectedRuleIds = uniqueIssues.map(i => i.rule_id);
    const clausesText = clauses.map((c, idx) => 
      `[${c.clause_id}] (Page ${c.page_number || '?'})\n${c.raw_text}\n`
    ).join('\n---\n');

    const llmPrompt = `You are a Thai lease lawyer expert analyzing a residential lease for tenant risks.

CONTEXT:
- Jurisdiction: Thailand
- Property Type: Residential
- Lease Language: ${keyTerms.language_detected}
- UI Language: ${userLang}

KEY TERMS EXTRACTED:
- Monthly Rent: ${keyTerms.rent_amount ? '฿' + keyTerms.rent_amount.toLocaleString() : 'Unknown'}
- Deposit: ${keyTerms.deposit_amount ? '฿' + keyTerms.deposit_amount.toLocaleString() : 'Unknown'}
- Lease Period: ${keyTerms.start_date || '?'} to ${keyTerms.end_date || '?'}
- Notice Period: ${keyTerms.notice_period_days || 0} days
- Deposit Return: ${keyTerms.deposit_return_days || 0} days

ALREADY FLAGGED BY RULES:
${detectedRuleIds.join(', ')}

YOUR TASK:
1) Review ALL clauses below for additional risks NOT caught by the rules engine
2) Validate rule-flagged issues - can you upgrade/downgrade severity based on context?
3) Check for missing safeguards that should be present

COVERAGE CHECKLIST (check all):
- Notice traps (multi-channel, confirmed delivery, strict windows)
- Auto-renewal entrapment
- Utility disconnection threats
- Penalty disproportionality (daily, multiplier, fixed)
- Deposit discretion/forfeiture/vague breach
- Landlord access/privacy violations
- Abandonment/disposal clauses (<7 days)
- Short-term letting/sublease/commercial bans
- Missing safeguards (deposit deadline, inventory, dispute mechanism)
- Enforcement asymmetry

CRITICAL RULES:
- Output ONLY issues with direct evidence from the lease text
- Every issue MUST include evidence_snippet (1-3 lines of exact lease text)
- If you cannot cite evidence_snippet, DO NOT propose the issue
- Output in ${userLang === 'th' ? 'Thai' : 'English'}
- If legality is uncertain, say "potentially unenforceable" not "illegal"

LEASE CLAUSES:
${clausesText}

OUTPUT FORMAT:
{
  "additional_issues": [
    {
      "rule_id": "LLM_UNIQUE_IDENTIFIER",
      "severity": "critical|high|medium|low",
      "confidence": "high|medium|low",
      "category": "Procedural Fairness|Financial Risk|Rights & Legal|Privacy & Access|Rights & Usage|Fairness & Balance",
      "title": "Issue title",
      "description": "What this clause does",
      "explanation": "Why this matters to tenant",
      "recommendation": "• Bullet 1\\n• Bullet 2\\n• Bullet 3",
      "evidence_snippet": "Exact lease text (1-3 lines)",
      "clause_id": "clause reference",
      "page_number": page number,
      "is_new": true
    }
  ],
  "severity_adjustments": [
    {
      "rule_id": "EXISTING_RULE_ID",
      "new_severity": "critical|high|medium|low",
      "justification": "Why severity should change",
      "confidence": "high|medium|low"
    }
  ],
  "missing_safeguards": [
    {
      "rule_id": "LLM_MISSING_SAFEGUARD_ID",
      "severity": "high|medium|low",
      "confidence": "high|medium",
      "category": "Financial Risk",
      "title": "Missing protection title",
      "description": "What is missing",
      "explanation": "Why absence creates risk",
      "recommendation": "• What to add\\n• How to add it",
      "evidence_snippet": "Context showing absence (optional, can be 'Not stated in lease')",
      "missing_safeguard": true
    }
  ]
}`;

    let llmResult;
    try {
      llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            additional_issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  rule_id: { type: "string" },
                  severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  explanation: { type: "string" },
                  recommendation: { type: "string" },
                  evidence_snippet: { type: "string" },
                  clause_id: { type: "string" },
                  page_number: { type: "integer" },
                  is_new: { type: "boolean" }
                },
                required: ["rule_id", "severity", "title", "description", "explanation", "recommendation", "evidence_snippet"]
              }
            },
            severity_adjustments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  rule_id: { type: "string" },
                  new_severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  justification: { type: "string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] }
                },
                required: ["rule_id", "new_severity", "justification"]
              }
            },
            missing_safeguards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  rule_id: { type: "string" },
                  severity: { type: "string", enum: ["high", "medium", "low"] },
                  confidence: { type: "string", enum: ["high", "medium"] },
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  explanation: { type: "string" },
                  recommendation: { type: "string" },
                  evidence_snippet: { type: "string" },
                  missing_safeguard: { type: "boolean" }
                },
                required: ["rule_id", "severity", "title", "description", "explanation", "recommendation"]
              }
            }
          },
          required: ["additional_issues", "severity_adjustments", "missing_safeguards"]
        }
      });
    } catch (error) {
      logStage('LLM_LAWYER_ERROR', { error: error.message });
      llmResult = { additional_issues: [], severity_adjustments: [], missing_safeguards: [] };
    }

    const llmIssues = llmResult.additional_issues || [];
    const llmAdjustments = llmResult.severity_adjustments || [];
    const llmMissing = llmResult.missing_safeguards || [];

    logStage('LLM_LAWYER_COMPLETE', {
      newIssues: llmIssues.length,
      adjustments: llmAdjustments.length,
      missingSafeguards: llmMissing.length
    });

    // Apply severity adjustments (only HIGH/MEDIUM confidence)
    llmAdjustments.forEach(adj => {
      if (adj.confidence !== 'high' && adj.confidence !== 'medium') return;
      
      const issue = uniqueIssues.find(i => i.rule_id === adj.rule_id);
      if (issue) {
        logStage('SEVERITY_ADJUSTED', {
          rule_id: adj.rule_id,
          from: issue.severity,
          to: adj.new_severity,
          reason: adj.justification
        });
        issue.severity = adj.new_severity;
        issue.severity_adjusted = true;
        issue.adjustment_reason = adj.justification;
      }
    });

    // Add LLM-detected issues (HIGH/MEDIUM confidence only)
    const llmValidIssues = [];
    llmIssues.forEach(llmIssue => {
      // Filter by confidence
      if (llmIssue.confidence === 'low') {
        logStage('LLM_ISSUE_LOW_CONFIDENCE', { rule_id: llmIssue.rule_id });
        return;
      }

      // Require evidence_snippet
      if (!llmIssue.evidence_snippet || llmIssue.evidence_snippet.trim().length < 10) {
        logStage('LLM_ISSUE_NO_EVIDENCE', { rule_id: llmIssue.rule_id });
        invalidIssues.push({ 
          rule_id: llmIssue.rule_id, 
          reason: 'missing_evidence_snippet' 
        });
        return;
      }

      // Convert to standard format
      const standardIssue = {
        id: crypto.randomUUID(),
        rule_id: llmIssue.rule_id,
        severity: llmIssue.severity,
        category: llmIssue.category,
        title: llmIssue.title,
        description: llmIssue.description,
        explanation: llmIssue.explanation,
        recommendation: llmIssue.recommendation,
        evidence: llmIssue.evidence_snippet,
        clause_id: llmIssue.clause_id,
        page_number: llmIssue.page_number,
        original_language: keyTerms.language_detected,
        llm_detected: true,
        confidence: llmIssue.confidence
      };

      // Validate schema
      if (validateRiskIssue(standardIssue, llmIssue.rule_id)) {
        llmValidIssues.push(standardIssue);
      } else {
        invalidIssues.push({ 
          rule_id: llmIssue.rule_id, 
          reason: 'schema_validation_failed' 
        });
      }
    });

    // Add missing safeguards from LLM
    llmMissing.forEach(missing => {
      if (missing.confidence === 'low') return;

      const standardIssue = {
        id: crypto.randomUUID(),
        rule_id: missing.rule_id,
        severity: missing.severity,
        category: missing.category || 'Financial Risk',
        title: missing.title,
        description: missing.description,
        explanation: missing.explanation,
        recommendation: missing.recommendation,
        evidence: missing.evidence_snippet || 'Not explicitly stated in lease',
        missing_safeguard: true,
        llm_detected: true,
        confidence: missing.confidence
      };

      if (validateRiskIssue(standardIssue, missing.rule_id)) {
        llmValidIssues.push(standardIssue);
      } else {
        invalidIssues.push({ 
          rule_id: missing.rule_id, 
          reason: 'schema_validation_failed' 
        });
      }
    });

    // Merge LLM issues with rule-based issues
    const combinedIssues = [...uniqueIssues, ...llmValidIssues];

    // Final deduplication by rule_id + clause_id
    const finalIssues = [];
    const finalSeen = new Set();
    combinedIssues.forEach(issue => {
      const key = `${issue.rule_id}-${issue.clause_id || 'global'}`;
      if (!finalSeen.has(key)) {
        finalSeen.add(key);
        finalIssues.push(issue);
      }
    });

    logStage('LLM_MERGE_COMPLETE', {
      ruleBasedIssues: uniqueIssues.length,
      llmNewIssues: llmValidIssues.length,
      finalTotal: finalIssues.length
    });

    // Recalculate risk score with merged issues
    const finalRawScore = finalIssues.reduce((sum, issue) => sum + (severityWeights[issue.severity] || 5), 0);
    const finalRiskScore = Math.min(100, Math.max(0, finalRawScore));

    const finalCriticalCount = finalIssues.filter(i => i.severity === 'critical').length;
    const finalHighCount = finalIssues.filter(i => i.severity === 'high').length;
    const finalMediumCount = finalIssues.filter(i => i.severity === 'medium').length;

    // Update summary with final counts
    if (userLang === 'th') {
      if (finalCriticalCount >= 3) {
        summary = `พบปัญหาร้ายแรง ${finalCriticalCount} รายการ, สูง ${finalHighCount} รายการ และปานกลาง ${finalMediumCount} รายการ สัญญานี้มีความเสี่ยงสูงมากต่อผู้เช่า`;
      } else if (finalHighCount >= 5) {
        summary = `พบปัญหาสูง ${finalHighCount} รายการและปานกลาง ${finalMediumCount} รายการ สัญญามีข้อกำหนดหลายข้อที่เอื้อประโยชน์ต่อเจ้าของบ้าน`;
      } else {
        summary = `พบปัญหา ${finalIssues.length} รายการที่ควรทบทวน`;
      }
    } else {
      if (finalCriticalCount >= 3) {
        summary = `Found ${finalCriticalCount} critical, ${finalHighCount} high-risk, and ${finalMediumCount} medium-risk issues. This lease poses significant risk to tenant.`;
      } else if (finalHighCount >= 5) {
        summary = `Found ${finalHighCount} high-risk and ${finalMediumCount} medium-risk issues. Lease contains multiple landlord-favoring terms.`;
      } else {
        summary = `Found ${finalIssues.length} issues worth reviewing.`;
      }
    }

    logStage('FINAL_ANALYSIS_COMPLETE', {
      totalIssues: finalIssues.length,
      critical: finalCriticalCount,
      high: finalHighCount,
      medium: finalMediumCount,
      riskScore: finalRiskScore,
      invalidIssues: invalidIssues.length,
      llmContribution: llmValidIssues.length
    });

    return Response.json({
      success: true,
      result: {
        risk_score: finalRiskScore,
        summary,
        flags: finalIssues,
        property_address: keyTerms.property_address,
        start_date: keyTerms.start_date,
        end_date: keyTerms.end_date,
        rent_amount: keyTerms.rent_amount,
        deposit_amount: keyTerms.deposit_amount,
        language_detected: keyTerms.language_detected,
        notice_period_days: keyTerms.notice_period_days,
        rent_due_day: keyTerms.rent_due_day,
        deposit_due_date: keyTerms.deposit_due_date,
        deposit_return_days: keyTerms.deposit_return_days
      },
      validation: {
        valid_issues: finalIssues.length,
        invalid_issues: invalidIssues.length,
        invalid_details: invalidIssues
      },
      llm_layer: {
        new_issues_proposed: llmIssues.length,
        new_issues_validated: llmValidIssues.length,
        severity_adjustments: llmAdjustments.length,
        missing_safeguards: llmMissing.length
      },
      debug: {
        clauses_extracted: clauses.length,
        rule_based_issues: uniqueIssues.length,
        llm_issues: llmValidIssues.length,
        severity_distribution: { 
          critical: finalCriticalCount, 
          high: finalHighCount, 
          medium: finalMediumCount 
        },
        risk_score_deterministic: rawScore,
        risk_score_final: finalRiskScore,
        engines_run: ['LEGALITY', 'PROCEDURAL', 'FINANCIAL', 'POWER_IMBALANCE', 'RIGHTS_SUPPRESSION', 'MISSING_SAFEGUARDS', 'COMPOUND', 'PREDATORY_LANGUAGE', 'LLM_LAWYER']
      },
      diagnostic: {
        buildTag: "multi-engine-v2.1-validated",
        scanId,
        requestId,
        filesProcessed: fileUrls.length,
        totalDuration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logStage('ERROR', { error: error.message, stack: error.stack });
    
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