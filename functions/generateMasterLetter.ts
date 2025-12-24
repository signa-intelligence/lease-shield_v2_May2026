import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * LEASE SHIELD MASTER LETTER GENERATOR
 * Single enforced letter structure for ALL templates
 * Templates define ONLY bullet content - layout is fixed
 */

// MASTER LETTER LAYOUT - ENFORCED
const MASTER_LAYOUT = {
  sections: [
    'date',
    'recipient_block',
    'subject',
    'opening',
    'body_intro',
    'bullets',
    'closing',
    'signature'
  ]
};

// BULLET LIBRARIES PER TEMPLATE
const TEMPLATE_BULLETS = {
  pre_signing_negotiation: {
    min: 3,
    max: 6,
    bullets: {
      en: [
        "Early Termination: The lease requires [X] months notice for early termination with penalties. I request clarification on the penalty structure and whether there are provisions for job relocation or other unavoidable circumstances.",
        "Landlord Access: The clause permits landlord entry with [X] hours notice. I request this be increased to a minimum of 24-48 hours except in genuine emergencies, with 'emergency' clearly defined in writing.",
        "Deposit Handling: The lease does not specify the deposit return timeline or deduction procedures. I request written confirmation that deposits will be returned within [X] days with an itemized list of any deductions, supported by receipts.",
        "Utility Charges: Utility rates are variable and subject to unilateral change. I request either fixed rates for the lease term or a written commitment to provide 30 days' notice before any rate adjustments.",
        "Repair Responsibility: The lease does not clearly define which repairs are landlord vs tenant responsibility. I request clarification on maintenance obligations, particularly for appliances, plumbing, and structural issues.",
        "Rent Increase Terms: The lease permits rent increases without clear limitations. I request a written cap on annual increases or confirmation that any increase requires 60+ days written notice and mutual agreement."
      ],
      th: [
        "การยกเลิกก่อนกำหนด: สัญญาเช่ากำหนดให้แจ้งล่วงหน้า [X] เดือนสำหรับการยกเลิกก่อนกำหนด พร้อมค่าปรับ ข้าพเจ้าขอความชัดเจนเกี่ยวกับโครงสร้างค่าปรับและว่ามีข้อกำหนดสำหรับการย้ายงานหรือสถานการณ์ที่หลีกเลี่ยงไม่ได้อื่นๆ หรือไม่",
        "การเข้าถึงของเจ้าของบ้าน: ข้อกำหนดอนุญาตให้เจ้าของบ้านเข้าได้โดยแจ้งล่วงหน้า [X] ชั่วโมง ข้าพเจ้าขอให้เพิ่มเป็นอย่างน้อย 24-48 ชั่วโมง ยกเว้นกรณีฉุกเฉินจริงๆ โดยมีคำจำกัดความของ 'กรณีฉุกเฉิน' ที่ชัดเจนเป็นลายลักษณ์อักษร",
        "การจัดการเงินมัดจำ: สัญญาไม่ระบุระยะเวลาการคืนเงินมัดจำหรือขั้นตอนการหัก ข้าพเจ้าขอการยืนยันเป็นลายลักษณ์อักษรว่าเงินมัดจำจะถูกคืนภายใน [X] วันพร้อมรายการแยกของการหักใดๆ ที่สนับสนุนด้วยใบเสร็จ",
        "ค่าสาธารณูปโภค: อัตราค่าสาธารณูปโภคเป็นตัวแปรและสามารถเปลี่ยนแปลงได้ฝ่ายเดียว ข้าพเจ้าขออัตราคงที่สำหรับระยะเวลาเช่าหรือคำมั่นสัญญาเป็นลายลักษณ์อักษรที่จะให้การแจ้งล่วงหน้า 30 วันก่อนการปรับอัตราใดๆ",
        "ความรับผิดชอบในการซ่อมแซม: สัญญาไม่ได้กำหนดอย่างชัดเจนว่าการซ่อมแซมใดเป็นความรับผิดชอบของเจ้าของบ้าน vs ผู้เช่า ข้าพเจ้าขอความชัดเจนเกี่ยวกับภาระหน้าที่การบำรุงรักษา โดยเฉพาะสำหรับเครื่องใช้ ระบบประปา และปัญหาโครงสร้าง",
        "เงื่อนไขการเพิ่มค่าเช่า: สัญญาอนุญาตให้เพิ่มค่าเช่าโดยไม่มีข้อจำกัดที่ชัดเจน ข้าพเจ้าขอขีดจำกัดเป็นลายลักษณ์อักษรสำหรับการเพิ่มรายปีหรือการยืนยันว่าการเพิ่มใดๆ ต้องการการแจ้งล่วงหน้าเป็นลายลักษณ์อักษร 60+ วันและข้อตกลงร่วมกัน"
      ]
    }
  },
  utilities_charges: {
    min: 3,
    max: 6,
    bullets: {
      en: [
        "Rate Variability: Current utility charges are variable and subject to change without notice. I request fixed rates for the duration of the lease or a contractual commitment to 30 days' written notice before any rate adjustment.",
        "Billing Method: The lease does not specify how utility charges are calculated or billed. I request clarification on whether charges are based on actual meter readings, fixed rates, or estimates, with monthly billing statements provided.",
        "Proof of Actual Costs: There is no requirement for the landlord to provide proof of actual utility costs. I request that all utility charges be supported by copies of official utility bills or meter readings.",
        "Notice Period for Changes: The lease permits utility rate changes without adequate notice. I request a minimum 30-day written notice for any utility rate adjustments, with justification provided."
      ],
      th: [
        "ความผันแปรของอัตรา: ค่าสาธารณูปโภคปัจจุบันเป็นตัวแปรและสามารถเปลี่ยนแปลงได้โดยไม่แจ้งล่วงหน้า ข้าพเจ้าขออัตราคงที่ตลอดระยะเวลาเช่าหรือคำมั่นสัญญาตามสัญญาที่จะแจ้งล่วงหน้า 30 วันเป็นลายลักษณ์อักษรก่อนการปรับอัตราใดๆ",
        "วิธีการเรียกเก็บเงิน: สัญญาไม่ระบุวิธีการคำนวณหรือเรียกเก็บค่าสาธารณูปโภค ข้าพเจ้าขอความชัดเจนว่าค่าใช้จ่ายคำนวณจากการอ่านมิเตอร์จริง อัตราคงที่ หรือการประมาณการ พร้อมงบการเรียกเก็บรายเดือน",
        "หลักฐานต้นทุนจริง: ไม่มีข้อกำหนดให้เจ้าของบ้านจัดหาหลักฐานต้นทุนสาธารณูปโภคจริง ข้าพเจ้าขอให้ค่าสาธารณูปโภคทั้งหมดได้รับการสนับสนุนด้วยสำเนาบิลสาธารณูปโภคอย่างเป็นทางการหรือการอ่านมิเตอร์",
        "ระยะเวลาแจ้งล่วงหน้าสำหรับการเปลี่ยนแปลง: สัญญาอนุญาตให้มีการเปลี่ยนแปลงอัตราสาธารณูปโภคโดยไม่แจ้งล่วงหน้าอย่างเพียงพอ ข้าพเจ้าขอการแจ้งล่วงหน้าเป็นลายลักษณ์อักษรขั้นต่ำ 30 วันสำหรับการปรับอัตราสาธารณูปโภคใดๆ พร้อมเหตุผล"
      ]
    }
  },
  landlord_access: {
    min: 3,
    max: 4,
    bullets: {
      en: [
        "Notice Period: The lease permits landlord entry with [X] hours notice. I request this be extended to a minimum of 24-48 hours for all non-emergency visits, to allow adequate preparation time.",
        "Emergency Definition: The term 'emergency' is not clearly defined. I request a written definition specifying that emergencies are limited to situations posing immediate danger to life, property, or safety (e.g., fire, flood, gas leak).",
        "Tenant Presence: There is no requirement for tenant presence during landlord visits. I request written confirmation that I or my designated representative have the right to be present during all property access, except in genuine emergencies.",
        "Entry Log: I request that all landlord entries be logged with date, time, and purpose, with this log accessible to me for record-keeping purposes."
      ],
      th: [
        "ระยะเวลาแจ้งล่วงหน้า: สัญญาอนุญาตให้เจ้าของบ้านเข้าได้โดยแจ้งล่วงหน้า [X] ชั่วโมง ข้าพเจ้าขอให้ขยายเป็นอย่างน้อย 24-48 ชั่วโมงสำหรับการเยี่ยมชมที่ไม่ใช่กรณีฉุกเฉินทั้งหมด เพื่อให้มีเวลาเตรียมความพร้อมอย่างเพียงพอ",
        "คำจำกัดความของกรณีฉุกเฉิน: คำว่า 'กรณีฉุกเฉิน' ไม่ได้ถูกกำหนดอย่างชัดเจน ข้าพเจ้าขอคำจำกัดความเป็นลายลักษณ์อักษรระบุว่ากรณีฉุกเฉินถูกจำกัดเฉพาะสถานการณ์ที่เป็นอันตรายโดยตรงต่อชีวิต ทรัพย์สิน หรือความปลอดภัย (เช่น ไฟไหม้ น้ำท่วม แก๊สรั่ว)",
        "การมีอยู่ของผู้เช่า: ไม่มีข้อกำหนดสำหรับการมีอยู่ของผู้เช่าระหว่างการเยี่ยมชมของเจ้าของบ้าน ข้าพเจ้าขอการยืนยันเป็นลายลักษณ์อักษรว่าข้าพเจ้าหรือตัวแทนที่ได้รับมอบหมายมีสิทธิ์ที่จะอยู่ระหว่างการเข้าถึงทรัพย์สินทั้งหมด ยกเว้นในกรณีฉุกเฉินจริงๆ",
        "บันทึกการเข้า: ข้าพเจ้าขอให้มีการบันทึกการเข้าของเจ้าของบ้านทั้งหมดพร้อมวันที่ เวลา และวัตถุประสงค์ โดยบันทึกนี้สามารถเข้าถึงได้สำหรับข้าพเจ้าเพื่อวัตถุประสงค์ในการเก็บบันทึก"
      ]
    }
  }
};

// FIXED OPENING PARAGRAPH
const OPENING_PARAGRAPH = {
  en: "I am writing to clarify certain terms in the proposed lease agreement before proceeding with signing. As a prospective tenant who values clear communication and mutual understanding, I would appreciate your written response to the following points.",
  th: "ข้าพเจ้าเขียนเพื่อขอความชัดเจนเกี่ยวกับข้อกำหนดบางประการในสัญญาเช่าที่เสนอก่อนดำเนินการลงนาม ในฐานะผู้เช่าที่คาดหวังซึ่งให้ความสำคัญกับการสื่อสารที่ชัดเจนและความเข้าใจร่วมกัน ข้าพเจ้าจะขอบคุณสำหรับการตอบกลับเป็นลายลักษณ์อักษรของท่านต่อประเด็นดังต่อไปนี้"
};

// FIXED BODY INTRO
const BODY_INTRO = {
  en: "Based on a review of the proposed lease agreement, I would like to raise the following points for clarification or amendment prior to signing:",
  th: "จากการตรวจสอบสัญญาเช่าที่เสนอ ข้าพเจ้าขอยกประเด็นดังต่อไปนี้เพื่อขอความชัดเจนหรือการแก้ไขก่อนการลงนาม:"
};

// FIXED CLOSING
const CLOSING_PARAGRAPH = {
  en: "I would appreciate your written confirmation on the above points and am happy to discuss these matters further at your earliest convenience. I look forward to reaching a mutually agreeable arrangement.",
  th: "ข้าพเจ้าจะขอบคุณสำหรับการยืนยันเป็นลายลักษณ์อักษรของท่านในประเด็นข้างต้น และยินดีที่จะหารือเรื่องเหล่านี้เพิ่มเติมในโอกาสแรกที่สะดวกของท่าน ข้าพเจ้าหวังว่าจะบรรลุข้อตกลงที่เป็นที่ยอมรับร่วมกัน"
};

/**
 * Build complete letter following master layout
 */
function buildMasterLetter(params, langCode) {
  const {
    tenant_name,
    tenant_address,
    tenant_email,
    tenant_phone,
    landlord_name,
    landlord_address,
    property_address,
    template_key,
    bullets
  } = params;

  const today = new Date().toLocaleDateString(
    langCode === 'th' ? 'th-TH' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  const signOff = langCode === 'th' ? 'ขอแสดงความนับถือ' : 'Sincerely';
  const subjectPrefix = langCode === 'th' ? 'เรื่อง' : 'Subject';

  // Build signature block
  let signature = `${signOff},\n\n${tenant_name}`;
  if (tenant_address) signature += `\n${tenant_address}`;
  if (tenant_phone) signature += `\n${tenant_phone}`;
  if (tenant_email) signature += `\n${tenant_email}`;

  // Assemble letter
  const letter = `${today}

${landlord_name}
${landlord_address || property_address}

${subjectPrefix}: ${langCode === 'th' ? 'ขอชี้แจงและแก้ไขเงื่อนไขสัญญาเช่า' : 'Request to Clarify and Amend Lease Terms'} – ${property_address}

${langCode === 'th' ? `เรียน ${landlord_name}` : `Dear ${landlord_name}`},

${OPENING_PARAGRAPH[langCode]}

${BODY_INTRO[langCode]}

${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n\n')}

${CLOSING_PARAGRAPH[langCode]}

${signature}`;

  return letter;
}

/**
 * Select bullets from template library
 */
function selectBullets(templateKey, langCode, scanData = null) {
  const template = TEMPLATE_BULLETS[templateKey];
  if (!template) {
    throw new Error(`Unknown template: ${templateKey}`);
  }

  const availableBullets = template.bullets[langCode] || template.bullets['en'];
  
  // If scan data exists, prioritize relevant bullets
  // For now, use default selection
  const count = Math.min(template.max, Math.max(template.min, availableBullets.length));
  
  return availableBullets.slice(0, count);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userCredits = user.letter_credits || 0;
    if (userCredits < 1) {
      return Response.json({
        error: 'Insufficient credits',
        code: 'insufficient_credits'
      }, { status: 402 });
    }

    const args = await req.json();
    const {
      template_key,
      tenant_name,
      tenant_address,
      tenant_email,
      tenant_phone,
      landlord_name,
      landlord_address,
      property_address,
      recipientType = 'landlord',
      includeTenantCopy = false,
      includeThaiCopy = false,
      includeLandlordCopy = false,
      scan_data = null
    } = args;

    console.log('🏛️ Master Letter Generator - Template:', template_key);

    // Build language pack
    const languagePack = {
      primary: recipientType === 'juristic' ? 'th' : (user.language || 'en'),
      allLanguages: recipientType === 'juristic' ? ['th', 'en'] : 
        (() => {
          const langs = new Set([user.language || 'en', 'en']);
          if (includeThaiCopy) langs.add('th');
          if (includeTenantCopy && user.language) langs.add(user.language);
          if (includeLandlordCopy && user.landlord_language) langs.add(user.landlord_language);
          return Array.from(langs);
        })()
    };

    console.log('🌍 Languages:', languagePack.allLanguages);

    // Generate letters for all languages
    const generatedLetters = {};
    
    for (const langCode of languagePack.allLanguages) {
      const bullets = selectBullets(template_key, langCode, scan_data);
      
      const letter = buildMasterLetter({
        tenant_name,
        tenant_address,
        tenant_email,
        tenant_phone,
        landlord_name,
        landlord_address,
        property_address,
        template_key,
        bullets
      }, langCode);

      generatedLetters[langCode] = letter;
      console.log(`✅ Generated ${langCode} letter`);
    }

    // Deduct 1 credit
    await base44.auth.updateMe({
      letter_credits: Math.max(0, userCredits - 1)
    });

    console.log(`✅ Master letter generated - ${languagePack.allLanguages.length} languages`);
    console.log(`💳 1 credit deducted - ${userCredits - 1} remaining`);

    return Response.json({
      ok: true,
      letter_content: generatedLetters,
      language_pack: languagePack,
      template_key,
      credits_remaining: userCredits - 1
    });

  } catch (error) {
    console.error('Master letter generation error:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});