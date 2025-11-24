import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Build language pack for letter generation
 */
function buildLanguagePack(context) {
  const SUPPORTED = ['en', 'th', 'ja', 'zh', 'ko', 'ru'];
  
  const clean = (lang, fallback) => {
    if (!lang) return fallback;
    const cleaned = lang.toLowerCase().trim();
    return SUPPORTED.includes(cleaned) ? cleaned : fallback;
  };

  const {
    recipientType,
    tenantLanguage,
    landlordLanguage,
    includeTenantCopy,
    includeThaiCopy,
    includeLandlordCopy
  } = context;

  // Juristic: Always TH + EN
  if (recipientType === 'juristic') {
    return {
      primary: 'th',
      allLanguages: ['th', 'en']
    };
  }

  // Landlord letters
  if (recipientType === 'landlord') {
    const landlordLang = clean(landlordLanguage, 'th');
    const tenantLang = clean(tenantLanguage, 'en');
    
    const langs = new Set();
    langs.add(landlordLang);
    langs.add('en');

    if (includeTenantCopy) langs.add(tenantLang);
    if (includeThaiCopy && landlordLang !== 'th') langs.add('th');

    return {
      primary: landlordLang,
      allLanguages: Array.from(langs)
    };
  }

  // Tenant letters
  const tenantLang = clean(tenantLanguage, 'en');
  const landlordLang = clean(landlordLanguage, 'th');
  
  const langs = new Set();
  langs.add(tenantLang);
  langs.add('en');

  if (includeLandlordCopy && landlordLanguage) langs.add(landlordLang);
  if (includeThaiCopy && tenantLang !== 'th') langs.add('th');

  return {
    primary: tenantLang,
    allLanguages: Array.from(langs)
  };
}

/**
 * Get LLM prompt for specific language
 */
function getPromptForLanguage(langCode, letterConfig, contextData) {
  const prompts = {
    en: letterConfig.prompt_en,
    th: letterConfig.prompt_th,
    ja: `Draft a professional formal letter in Japanese for a tenant disputing deposit or rental issues. Use polite business Japanese (keigo). ${letterConfig.prompt_en}`,
    zh: `Draft a professional formal letter in Simplified Chinese for a tenant disputing deposit or rental issues. Use formal business Chinese. ${letterConfig.prompt_en}`,
    ko: `Draft a professional formal letter in Korean for a tenant disputing deposit or rental issues. Use formal business Korean with proper honorifics. ${letterConfig.prompt_en}`,
    ru: `Draft a professional formal letter in Russian for a tenant disputing deposit or rental issues. Use formal business Russian. ${letterConfig.prompt_en}`
  };

  const basePrompt = prompts[langCode] || prompts['en'];
  return `${basePrompt}\n\nContext:\n${contextData}\n\nGenerate a complete, professional letter in ${langCode.toUpperCase()} only.`;
}

/**
 * Lease Shield – Multi-Language Letter Generator (STEP 1: Generate & Deduct Credits)
 * Generates letters in multiple languages based on recipient type
 * ONE credit = ONE pack (all languages included)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const args = await req.json();

    // Check user credits BEFORE generating
    const userCredits = user.letter_credits || 0;
    if (userCredits < 1) {
      return Response.json({
        error: 'Insufficient credits. Please purchase credits to generate letters.',
        code: 'insufficient_credits'
      }, { status: 402 });
    }

    const {
      subject,
      tenant_name,
      landlord_name,
      property_address,
      contract_ref,
      deposit_amount,
      example_item_1,
      example_item_2,
      example_item_3,
      breach_summary,
      settlement_amount,
      settlement_date,
      concerns_list,
      // Multi-language params
      recipientType = 'tenant',
      includeTenantCopy = false,
      includeThaiCopy = false,
      includeLandlordCopy = false
    } = args;

    console.log('🌍 Multi-language generation started');
    console.log('📋 Recipient type:', recipientType);
    console.log('🔤 Tenant language:', user.language || 'en');
    console.log('🔤 Landlord language:', user.landlord_language || 'th');

    const SUBJECT_TEMPLATES = {
      lease_negotiation: {
        name_en: "Pre-Signing Lease Review",
        name_th: "ทบทวนสัญญาก่อนลงนาม",
        prompt_en: "Draft a professional but friendly letter from a prospective tenant to a landlord, requesting clarification on concerning lease terms BEFORE signing. The tenant has had the lease analyzed and wants to understand or negotiate certain clauses. Maintain a cooperative tone since both parties want the rental to succeed.",
        prompt_th: "เขียนจดหมายเป็นทางการแต่เป็นมิตรจากผู้เช่าที่กำลังจะเป็น ถึงเจ้าของบ้าน เพื่อขอชี้แจงข้อกำหนดในสัญญาเช่าที่น่ากังวล ก่อนที่จะลงนาม ผู้เช่าได้วิเคราะห์สัญญาแล้วและต้องการทำความเข้าใจหรือเจรจาข้อกำหนดบางข้อ ใช้น้ำเสียงที่ร่วมมือเนื่องจากทั้งสองฝ่ายต้องการให้การเช่าสำเร็จ"
      },
      deposit: {
        name_en: "Deposit Return Request",
        name_th: "จดหมายขอคืนเงินมัดจำ",
        prompt_en: "Draft a polite, formal letter requesting return of security deposit after lease end. Professional but friendly tone. Reference relevant tenant protection laws in Thailand.",
        prompt_th: "เขียนจดหมายขอคืนเงินมัดจำอย่างสุภาพและเป็นทางการหลังสิ้นสุดสัญญาเช่า ใช้น้ำเสียงมืออาชีพแต่เป็นมิตร อ้างอิงกฎหมายคุ้มครองผู้เช่าในประเทศไทยที่เกี่ยวข้อง"
      },
      deductions: {
        name_en: "Request for Itemised Deductions",
        name_th: "ขอรายละเอียดการหักเงิน",
        prompt_en: "Draft a formal letter requesting detailed breakdown of deposit deductions with receipts and evidence. Cite Thai tenant rights requiring itemized lists and proof of actual costs.",
        prompt_th: "เขียนจดหมายทางการขอรายละเอียดการหักเงินมัดจำพร้อมใบเสร็จและหลักฐาน อ้างอิงสิทธิผู้เช่าตามกฎหมายไทยที่กำหนดให้มีรายการแยกละเอียดและหลักฐานต้นทุนจริง"
      },
      reminder: {
        name_en: "Friendly Reminder",
        name_th: "จดหมายเตือนแบบมิตร",
        prompt_en: "Draft a polite follow-up reminder about pending deposit return. Maintain friendly tone while establishing timeline expectations. Reference previous communication.",
        prompt_th: "เขียนจดหมายเตือนติดตามอย่างสุภาพเกี่ยวกับเงินมัดจำที่ยังไม่ได้คืน รักษาน้ำเสียงที่เป็นมิตรในขณะที่กำหนดความคาดหวังเรื่องระยะเวลา อ้างอิงการติดต่อครั้งก่อน"
      },
      dispute: {
        name_en: "Formal Dispute of Withholding",
        name_th: "จดหมายคัดค้านการระงับเงิน",
        prompt_en: "Draft a formal dispute letter challenging unfair deposit withholding. Assert tenant rights under Thai law with specific legal references. Firm but professional tone. Mention intention to escalate if needed.",
        prompt_th: "เขียนจดหมายคัดค้านอย่างเป็นทางการต่อการระงับเงินมัดจำที่ไม่เป็นธรรม ยืนยันสิทธิผู้เช่าตามกฎหมายไทยพร้อมอ้างอิงกฎหมายเฉพาะเจาะจง ใช้น้ำเสียงเด็ดขาดแต่มืออาชีพ กล่าวถึงเจตนาที่จะยกระดับหากจำเป็น"
      },
      early_termination: {
        name_en: "Early Termination Reconciliation",
        name_th: "ประสานยุติสัญญาก่อนกำหนด",
        prompt_en: "Draft a formal letter coordinating early lease termination. Clarify obligations under Thai contract law for early termination penalties and deposit return. Professional and solution-oriented.",
        prompt_th: "เขียนจดหมายทางการเพื่อประสานการยุติสัญญาเช่าก่อนกำหนด ชี้แจงภาระหน้าที่ตามกฎหมายสัญญาไทยสำหรับค่าปรับการยกเลิกก่อนกำหนดและการคืนเงินมัดจำ มืออาชีพและมุ่งเน้นการแก้ไข"
      },
      condition_dispute: {
        name_en: "Property Condition Dispute",
        name_th: "โต้แย้งสภาพทรัพย์สิน",
        prompt_en: "Draft a formal letter disputing claimed property damages. Reference move-in condition documentation and normal wear-and-tear standards under Thai rental law. Assert right to fair assessment.",
        prompt_th: "เขียนจดหมายทางการโต้แย้งการเรียกร้องค่าเสียหายทรัพย์สิน อ้างอิงเอกสารสภาพเมื่อย้ายเข้าและมาตรฐานความเสียหายตามปกติตามกฎหมายเช่าไทย ยืนยันสิทธิในการประเมินอย่างเป็นธรรม"
      },
      evidence: {
        name_en: "Request for Evidence",
        name_th: "ขอหลักฐานประกอบ",
        prompt_en: "Draft a formal letter demanding supporting evidence for damage claims. Cite Thai law requirements for landlords to provide receipts, photos, and repair quotes. Set deadline for response.",
        prompt_th: "เขียนจดหมายทางการเรียกร้องหลักฐานสำหรับการเรียกร้องค่าเสียหาย อ้างอิงข้อกำหนดตามกฎหมายไทยที่เจ้าของบ้านต้องให้ใบเสร็จ รูปภาพ และใบเสนอราคาซ่อม กำหนดเวลาสำหรับการตอบกลับ"
      },
      final_opportunity: {
        name_en: "Final Opportunity",
        name_th: "โอกาสสุดท้าย",
        prompt_en: "Draft a firm 'final opportunity' letter before formal legal action. Reference all previous attempts at resolution. Cite specific Thai tenant protection laws. Mention intent to file with authorities or seek legal remedies. Serious but professional tone.",
        prompt_th: "เขียนจดหมาย 'โอกาสสุดท้าย' อย่างเด็ดขาดก่อนดำเนินการทางกฎหมาย อ้างอิงความพยายามแก้ไขทั้งหมดก่อนหน้านี้ อ้างกฎหมายคุ้มครองผู้เช่าไทยโดยเฉพาะ กล่าวถึงเจตนาที่จะยื่นเรื่องกับหน่วยงานหรือแสวงหาทางเยียวยาทางกฎหมาย น้ำเสียงจริงจังแต่มืออาชีพ"
      },
      non_compliance: {
        name_en: "Notice of Non-Compliance",
        name_th: "แจ้งไม่ปฏิบัติตามสัญญา",
        prompt_en: "Draft a formal notice of landlord's breach of lease terms or Thai rental law. List specific violations with legal references. Demand immediate corrective action or face legal consequences. Very formal, legal tone.",
        prompt_th: "เขียนหนังสือแจ้งอย่างเป็นทางการเกี่ยวกับการฝ่าฝืนข้อกำหนดสัญญาหรือกฎหมายเช่าไทยของเจ้าของบ้าน ระบุการละเมิดเฉพาะพร้อมอ้างอิงกฎหมาย เรียกร้องให้แก้ไขทันทีหรือเผชิญผลทางกฎหมาย น้ำเสียงเป็นทางการและเป็นกฎหมายมาก"
      },
      settlement: {
        name_en: "Settlement Confirmation",
        name_th: "ยืนยันการตกลงชำระเงิน",
        prompt_en: "Draft a formal settlement confirmation letter after successful deposit return. Acknowledge receipt of funds, confirm full resolution of dispute, and release landlord from further claims. Professional and conclusive.",
        prompt_th: "เขียนจดหมายยืนยันการชำระเงินอย่างเป็นทางการหลังจากคืนเงินมัดจำสำเร็จ รับทราบการรับเงิน ยืนยันการแก้ไขข้อพิพาทอย่างสมบูรณ์ และปล่อยเจ้าของบ้านจากการเรียกร้องเพิ่มเติม มืออาชีพและเป็นการสรุป"
      }
    };

    if (!SUBJECT_TEMPLATES[subject]) {
      return Response.json({ error: 'Invalid subject' }, { status: 400 });
    }

    const letterConfig = SUBJECT_TEMPLATES[subject];

    // Build language pack based on recipient type
    const languagePack = buildLanguagePack({
      recipientType,
      tenantLanguage: user.language || 'en',
      landlordLanguage: user.landlord_language || 'th',
      includeTenantCopy,
      includeThaiCopy,
      includeLandlordCopy
    });

    console.log('🌍 Language pack:', languagePack);

    let contextData = `Tenant: ${tenant_name || 'N/A'}\nLandlord: ${landlord_name || 'N/A'}`;
    if (property_address) contextData += `\nProperty: ${property_address}`;
    if (contract_ref) contextData += `\nContract: ${contract_ref}`;
    if (deposit_amount) contextData += `\nDeposit: ฿${deposit_amount}`;
    if (concerns_list) contextData += `\n\nConcerns to Address:\n${concerns_list}`;
    if (example_item_1) contextData += `\n\nExample Disputed Items:\n- ${example_item_1}`;
    if (example_item_2) contextData += `\n- ${example_item_2}`;
    if (example_item_3) contextData += `\n- ${example_item_3}`;
    if (breach_summary) contextData += `\n\nBreach Summary:\n${breach_summary}`;
    if (settlement_amount) contextData += `\nSettlement Amount: ฿${settlement_amount}`;
    if (settlement_date) contextData += `\nSettlement Date: ${settlement_date}`;

    // Generate letters for all required languages
    const generatedLetters = {};
    
    for (const langCode of languagePack.allLanguages) {
      console.log(`📝 Generating letter in: ${langCode}`);
      
      const promptForLang = getPromptForLanguage(langCode, letterConfig, contextData);
      
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: promptForLang,
          response_json_schema: {
            type: "object",
            properties: {
              letter: { type: "string", description: `Full letter in ${langCode}` }
            },
            required: ["letter"]
          }
        });

        generatedLetters[langCode] = response.letter;
        console.log(`✅ Generated ${langCode} letter (${response.letter.length} chars)`);
      } catch (err) {
        console.error(`❌ Failed to generate ${langCode} letter:`, err.message);
        
        // Fallback to English if not English
        if (langCode !== 'en' && generatedLetters['en']) {
          console.warn(`⚠️ Using English as fallback for ${langCode}`);
          generatedLetters[langCode] = generatedLetters['en'];
        } else {
          throw new Error(`Failed to generate ${langCode} letter: ${err.message}`);
        }
      }
    }

    // Validate we have at least English and primary
    if (!generatedLetters['en'] || !generatedLetters[languagePack.primary]) {
      throw new Error('Failed to generate required letter languages. Please try again.');
    }

    // DEDUCT 1 CREDIT for the entire pack (not per language)
    await base44.auth.updateMe({
      letter_credits: Math.max(0, userCredits - 1)
    });

    console.log(`✅ Multi-language letter pack generated successfully`);
    console.log(`💳 1 credit deducted for ${languagePack.allLanguages.length} languages`);
    console.log(`📊 Credits remaining: ${userCredits - 1}`);

    // Log usage
    try {
      await base44.entities.LetterUsage.create({
        user_email: user.email,
        template_key: subject,
        recipient_type: recipientType,
        languages_generated: languagePack.allLanguages,
        credits_used: 1,
        generated_at: new Date().toISOString()
      });
    } catch (logErr) {
      console.error('⚠️ Failed to log letter usage:', logErr.message);
    }

    // Return the generated content for user review
    return Response.json({
      ok: true,
      letter_content: generatedLetters,
      language_pack: languagePack,
      subject: subject,
      recipientType: recipientType,
      letterConfig: {
        name_en: letterConfig.name_en,
        name_th: letterConfig.name_th
      },
      credits_remaining: userCredits - 1,
      message: `Letter pack generated in ${languagePack.allLanguages.length} languages. 1 credit deducted.`
    });

  } catch (error) {
    console.error('Letter generation error:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});