import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Lease Shield – Save Multi-Language Letter Pack (STEP 2: Save Only - NO Credit Deduction)
 * Saves all language variants of the reviewed letter
 * Credits were already deducted during generation
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const args = await req.json();

    const {
      subject,
      reviewedLetters, // Now an object: { en: "...", th: "...", ko: "...", etc. }
      languagePack, // { primary: 'ko', allLanguages: ['ko', 'en', 'th'] }
      recipientType = 'tenant',
      tenant_name,
      landlord_name,
      property_address,
      caseId
    } = args;

    // Validate required fields
    if (!subject || !reviewedLetters || !languagePack) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('💾 Saving multi-language letter pack');
    console.log('🌍 Languages:', languagePack.allLanguages);

    const SUBJECT_NAMES = {
      lease_negotiation: { name_en: "Pre-Signing Lease Review", name_th: "ทบทวนสัญญาก่อนลงนาม" },
      deposit: { name_en: "Deposit Return Request", name_th: "จดหมายขอคืนเงินมัดจำ" },
      deductions: { name_en: "Request for Itemised Deductions", name_th: "ขอรายละเอียดการหักเงิน" },
      reminder: { name_en: "Friendly Reminder", name_th: "จดหมายเตือนแบบมิตร" },
      dispute: { name_en: "Formal Dispute of Withholding", name_th: "จดหมายคัดค้านการระงับเงิน" },
      early_termination: { name_en: "Early Termination Reconciliation", name_th: "ประสานยุติสัญญาก่อนกำหนด" },
      condition_dispute: { name_en: "Property Condition Dispute", name_th: "โต้แย้งสภาพทรัพย์สิน" },
      evidence: { name_en: "Request for Evidence", name_th: "ขอหลักฐานประกอบ" },
      final_opportunity: { name_en: "Final Opportunity", name_th: "โอกาสสุดท้าย" },
      non_compliance: { name_en: "Notice of Non-Compliance", name_th: "แจ้งไม่ปฏิบัติตามสัญญา" },
      settlement: { name_en: "Settlement Confirmation", name_th: "ยืนยันการตกลงชำระเงิน" }
    };

    const letterConfig = SUBJECT_NAMES[subject] || { name_en: "Legal Letter", name_th: "จดหมายทางกฎหมาย" };

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const todayTh = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    // Get tenant data from user profile
    const tenantFullAddress = [
      user.tenant_address,
      user.tenant_city,
      user.tenant_state,
      user.tenant_zip
    ].filter(Boolean).join(', ');

    // Replace placeholders in letter content
    const replacePlaceholders = (content) => {
      return content
        .replace(/\[Your Address\]/gi, user.tenant_address || '[Your Address]')
        .replace(/\[City, State, Zip Code\]/gi, 
          [user.tenant_city, user.tenant_state, user.tenant_zip].filter(Boolean).join(', ') || '[City, State, Zip Code]')
        .replace(/\[Email Address\]/gi, user.email || '[Email Address]')
        .replace(/\[Date\]/gi, today);
    };

    const languageLabels = {
      en: 'English',
      th: 'ไทย (Thai)',
      ja: '日本語 (Japanese)',
      zh: '中文 (Chinese)',
      ko: '한국어 (Korean)',
      ru: 'Русский (Russian)'
    };

    /**
     * Convert LetterDocument to HTML
     */
    function letterDocToHTML(letterDoc) {
      if (!letterDoc || !letterDoc.blocks) {
        return '<p>No content</p>';
      }

      let html = '';
      
      letterDoc.blocks.forEach(block => {
        if (block.type === 'date') {
          html += `<div style="text-align: right; margin-bottom: 30px; font-size: 10pt; color: #666;">${block.value}</div>`;
        } else if (block.type === 'recipient') {
          html += '<div style="margin-bottom: 25px;">';
          block.lines?.forEach(line => {
            if (line) html += `${line}<br/>`;
          });
          html += '</div>';
        } else if (block.type === 'subject') {
          html += `<div style="font-weight: bold; margin-bottom: 25px;">${block.value}</div>`;
        } else if (block.type === 'paragraph') {
          html += `<p style="margin-bottom: 20px; text-align: justify; line-height: 1.7;">${block.value}</p>`;
        } else if (block.type === 'bullets') {
          html += '<ul style="margin: 20px 0; padding-left: 20px;">';
          block.items?.forEach(item => {
            if (item) html += `<li style="margin-bottom: 15px; line-height: 1.7;">${item}</li>`;
          });
          html += '</ul>';
        } else if (block.type === 'closing') {
          html += `<p style="margin-top: 25px; margin-bottom: 20px;">${block.value}</p>`;
        } else if (block.type === 'signature') {
          html += '<div style="margin-top: 40px; line-height: 1.4;">';
          block.lines?.forEach(line => {
            if (line) html += `${line}<br/>`;
          });
          html += '</div>';
        }
      });

      return html;
    }

    // Build combined HTML with all languages
    let languageSections = '';
    languagePack.allLanguages.forEach(langCode => {
      const letterData = reviewedLetters[langCode];
      
      // Check if it's a LetterDocument structure or raw text
      const letterHTML = letterData?.blocks 
        ? letterDocToHTML(letterData)
        : `<div class="content">${replacePlaceholders(letterData || '')}</div>`;
      
      languageSections += `
  <div class="section">
    <div class="section-title">📄 ${languageLabels[langCode] || langCode.toUpperCase()}</div>
    ${letterHTML}
  </div>`;
    });

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${letterConfig.name_en} - Multi-Language Pack</title>
  <style>
    body { font-family: 'Sarabun', 'Tahoma', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1a1d1f; }
    .header { border-bottom: 3px solid #0C3B2E; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #0C3B2E; margin-bottom: 5px; }
    .subtitle { color: #64748b; font-size: 14px; }
    .info-badge { display: inline-block; background: #E0F2FE; color: #0369A1; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-top: 10px; }
    .section { margin-bottom: 40px; page-break-inside: avoid; }
    .section-title { background: #0C3B2E; color: white; padding: 10px 15px; margin-bottom: 20px; font-weight: bold; border-radius: 4px; }
    .content { padding: 0 15px; white-space: pre-wrap; }
    .footer { border-top: 2px solid #E5E7EB; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #E5E7EB;">
    <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">${today} / ${todayTh}</div>
    <div style="font-size: 11px; color: #94a3b8;">
      📦 ${languagePack.allLanguages.map(l => l.toUpperCase()).join(' • ')}
    </div>
  </div>

${languageSections}

  <div class="footer">
    <p style="font-size: 11px; color: #94a3b8;">Multi-language letter pack - ${languagePack.allLanguages.length} languages included</p>
  </div>
</body>
</html>`;

    // File naming with language pack info
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const langSuffix = languagePack.allLanguages.join('_');
    const baseName = `${subject}_${recipientType}_${langSuffix}_${stamp}`;

    const htmlBlob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const htmlFile = new File([htmlBlob], `${baseName}.html`, { type: 'text/html' });

    const { file_url: htmlUrl } = await base44.integrations.Core.UploadFile({ file: htmlFile });

    const docBlob = new Blob([htmlContent], { type: 'application/msword; charset=utf-8' });
    const docFile = new File([docBlob], `${baseName}.doc`, { type: 'application/msword' });

    const { file_url: docUrl } = await base44.integrations.Core.UploadFile({ file: docFile });

    // Create document entry
    const docEntry = await base44.entities.Document.create({
      type: 'letter',
      file_url: docUrl,
      label: `${letterConfig.name_en} [${languagePack.allLanguages.map(l => l.toUpperCase()).join(', ')}]`,
      html_content: htmlContent
    });

    console.log(`✅ Multi-language letter pack saved successfully`);
    console.log(`📦 Saved ${languagePack.allLanguages.length} languages: ${languagePack.allLanguages.join(', ')}`);

    // Update case if provided
    if (caseId) {
      try {
        const caseData = await base44.asServiceRole.entities.Case.filter({ id: caseId });
        if (caseData && caseData.length > 0) {
          const existingCase = caseData[0];
          const existingLetters = existingCase.letters || {};

          existingLetters[`${subject}_url`] = docUrl;
          existingLetters[`${subject}_html_url`] = htmlUrl;

          const updatedTimeline = existingCase.timeline || [];
          updatedTimeline.push({
            timestamp: new Date().toISOString(),
            event: `letter_saved_${subject}`,
            actor: user.email,
            meta: { 
              html_url: htmlUrl, 
              doc_url: docUrl, 
              document_id: docEntry.id, 
              reviewed: true,
              languages: languagePack.allLanguages,
              recipient_type: recipientType
            }
          });

          await base44.asServiceRole.entities.Case.update(caseId, {
            letters: existingLetters,
            timeline: updatedTimeline,
            status: 'ready_for_review'
          });
        }
      } catch (caseError) {
        console.error(`Failed to update case ${caseId}:`, caseError);
      }
    }

    return Response.json({
      ok: true,
      urls: { html: htmlUrl, doc: docUrl },
      docId: docEntry.id,
      languages: languagePack.allLanguages,
      recipientType: recipientType,
      case: caseId ? {
        id: caseId,
        status: 'ready_for_review'
      } : null,
      message: `Saved ${languagePack.allLanguages.length}-language pack for ${recipientType}`
    });

  } catch (error) {
    console.error('Save reviewed letter error:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});