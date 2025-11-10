
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Lease Shield – LLM-powered Letters
 * One function: generateLetter (previously generatePhase1Letter but now fully LLM-driven)
 * - Inputs: { subject, caseId?, tenant_name, landlord_name, property_address, contract_ref, deposit_amount, example_item_1, example_item_2, example_item_3, breach_summary, settlement_amount, settlement_date, concerns_list }
 * - Generates .html and .doc files using LLM output
 * - Deducts user credit
 * - Updates associated case (if provided)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const args = await req.json(); // Parse arguments early to get all required fields

    // Check user credits BEFORE generating letter
    const userCredits = user.letter_credits || 0;
    if (userCredits < 1) {
      return Response.json({
        error: 'Insufficient credits. Please purchase credits to generate letters.',
        code: 'insufficient_credits'
      }, { status: 402 }); // 402 Payment Required
    }

    const {
      caseId,
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
      concerns_list
    } = args;

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

    const prompt = `${letterConfig.prompt_en}\n\n${letterConfig.prompt_th}\n\n${contextData}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          letter_en: { type: "string", description: "Full English letter" },
          letter_th: { type: "string", description: "Full Thai letter" }
        },
        required: ["letter_en", "letter_th"]
      }
    });

    if (!response || !response.letter_en || !response.letter_th) {
      throw new Error('Failed to generate letter content from LLM. Please try again.');
    }

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const todayTh = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${letterConfig.name_en} / ${letterConfig.name_th}</title>
  <style>
    body { font-family: 'Sarabun', 'Tahoma', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1a1d1f; }
    .header { border-bottom: 3px solid #0C3B2E; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #0C3B2E; margin-bottom: 5px; }
    .subtitle { color: #64748b; font-size: 14px; }
    .section { margin-bottom: 40px; }
    .section-title { background: #0C3B2E; color: white; padding: 10px 15px; margin-bottom: 20px; font-weight: bold; border-radius: 4px; }
    .content { padding: 0 15px; white-space: pre-wrap; }
    .footer { border-top: 2px solid #E5E7EB; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🛡️ LEASE SHIELD</div>
    <div class="subtitle">Fair. Transparent. Protected.</div>
    <div style="margin-top: 10px; font-size: 14px; color: #64748b;">${today} / ${todayTh}</div>
  </div>

  <div class="section">
    <div class="section-title">📄 ${letterConfig.name_en}</div>
    <div class="content">${response.letter_en}</div>
  </div>

  <div class="section">
    <div class="section-title">📄 ${letterConfig.name_th}</div>
    <div class="content">${response.letter_th}</div>
  </div>

  <div class="footer">
    <p>Generated by Lease Shield | www.leaseshield.com</p>
    <p>This letter is human-screened with AI assistance, tailored to your specific requirements. Please review before sending.</p>
  </div>
</body>
</html>`;

    // File naming
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const baseName = `${subject}_letter_${stamp}`;

    const htmlBlob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const htmlFile = new File([htmlBlob], `${baseName}.html`, { type: 'text/html' });

    const { file_url: htmlUrl } = await base44.integrations.Core.UploadFile({ file: htmlFile });

    const docBlob = new Blob([htmlContent], { type: 'application/msword; charset=utf-8' });
    const docFile = new File([docBlob], `${baseName}.doc`, { type: 'application/msword' });

    const { file_url: docUrl } = await base44.integrations.Core.UploadFile({ file: docFile });

    const docEntry = await base44.entities.Document.create({
      type: 'letter',
      file_url: docUrl, // Primary file should be the .doc
      label: `${letterConfig.name_en} / ${letterConfig.name_th}`,
      html_content: htmlContent // Store HTML content for preview/display
    });

    // DEDUCT 1 CREDIT AFTER successful generation
    await base44.auth.updateMe({
      letter_credits: Math.max(0, userCredits - 1)
    });

    console.log(`✅ Letter generated successfully. Credits remaining: ${userCredits - 1}`);

    if (caseId) {
      try {
        const caseData = await base44.asServiceRole.entities.Case.filter({ id: caseId }); // Use asServiceRole as recommended for entity operations
        if (caseData && caseData.length > 0) {
          const existingCase = caseData[0];
          const existingLetters = existingCase.letters || {};

          // Store the primary URL (doc) and the HTML preview URL
          existingLetters[`${subject}_url`] = docUrl;
          existingLetters[`${subject}_html_url`] = htmlUrl;

          const updatedTimeline = existingCase.timeline || [];
          updatedTimeline.push({
            timestamp: new Date().toISOString(),
            event: `letter_generated_${subject}`,
            actor: user.email,
            meta: { html_url: htmlUrl, doc_url: docUrl, document_id: docEntry.id }
          });

          await base44.asServiceRole.entities.Case.update(caseId, {
            letters: existingLetters,
            timeline: updatedTimeline,
            status: 'ready_for_review' // A general status for generated drafts
          });
        } else {
          console.warn(`Case with ID ${caseId} not found for update after letter generation.`);
        }
      } catch (caseError) {
        console.error(`Failed to update case ${caseId}:`, caseError);
      }
    }

    return Response.json({
      ok: true,
      urls: { html: htmlUrl, doc: docUrl },
      docId: docEntry.id,
      credits_remaining: userCredits - 1,
      case: caseId ? {
        id: caseId,
        status: 'ready_for_review' // Reflect the updated case status
      } : null
    });

  } catch (error) {
    console.error('Letter generation error:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});
