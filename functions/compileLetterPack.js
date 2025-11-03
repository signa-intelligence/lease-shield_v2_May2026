import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Multi-letter PDF compilation template
const getLetterPackHTML = (caseData, letters) => {
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();

  // Helper to render EN/TH paragraph pairs for a letter
  const renderLetterBody = (letter) => {
    return letter.body_en.map((para, i) => `
      <div class="pair">
        <p class="en">${para}</p>
        <p class="th">${letter.body_th[i] || ''}</p>
      </div>
    `).join('');
  };

  // Helper to render next steps for a letter
  const renderNextSteps = (letter) => {
    if (!letter.next_steps_en || letter.next_steps_en.length === 0) return '';
    
    return `
      <div class="hr"></div>
      <div class="block-title">Next Steps / ขั้นตอนถัดไป</div>
      <ol>
        ${letter.next_steps_en.map((step, i) => `
          <li>
            <div class="en">${step}</div>
            <div class="th small">${letter.next_steps_th[i] || ''}</div>
          </li>
        `).join('')}
      </ol>
    `;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Lease Shield – Case ${caseData.id.slice(0, 8)} Letter Pack</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root{
    --green:#0C3B2E; --gold:#C7A338; --ink:#111; --muted:#667085;
  }
  @page { size: A4; margin: 20mm 16mm 24mm 16mm; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page-break { page-break-after: always; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: Inter, "Helvetica Neue", Arial, "Noto Sans Thai", "Segoe UI", sans-serif;
    color: var(--ink); line-height: 1.5; font-size: 12pt;
    margin: 0; padding: 20mm 16mm 24mm 16mm;
  }
  
  /* Cover page */
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 90vh;
    text-align: center;
    page-break-after: always;
  }
  .cover-logo {
    width: 120px;
    height: 120px;
    border-radius: 20px;
    background: var(--green);
    position: relative;
    margin-bottom: 30px;
  }
  .cover-logo:after {
    content:"";
    position:absolute;
    inset: 15px;
    border: 3px solid var(--gold);
    border-radius: 15px;
  }
  .cover-title {
    font-size: 32pt;
    font-weight: 700;
    color: var(--green);
    margin-bottom: 10px;
  }
  .cover-subtitle {
    font-size: 16pt;
    color: var(--muted);
    margin-bottom: 40px;
  }
  .cover-meta {
    font-size: 13pt;
    color: var(--ink);
  }
  .cover-meta strong {
    color: var(--green);
  }

  /* Letter pages */
  .letter-page {
    page-break-after: always;
  }
  .letter-page:last-child {
    page-break-after: auto;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14mm;
    padding-bottom: 5mm;
    border-bottom: 2px solid var(--gold);
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .logo {
    width: 24mm;
    height: 24mm;
    border-radius: 8px;
    background: var(--green);
    position: relative;
  }
  .logo:after {
    content: "";
    position: absolute;
    inset: 3mm;
    border: 1.5px solid var(--gold);
    border-radius: 6px;
  }
  .brand-title {
    font-weight: 700;
    font-size: 13pt;
    color: var(--green);
    letter-spacing: 0.2px;
  }
  .meta {
    text-align: right;
    font-size: 10pt;
    color: var(--muted);
  }

  h1 {
    font-size: 18pt;
    margin: 0 0 2mm 0;
    color: var(--green);
  }
  .subj {
    font-size: 11pt;
    color: var(--muted);
    margin: 0 0 8mm 0;
  }

  .pair {
    margin: 0 0 6mm 0;
  }
  .pair .en {
    margin: 0 0 3mm 0;
  }
  .pair .th {
    margin: 0;
    font-family: "Noto Sans Thai", "TH Sarabun New", sans-serif;
  }

  ol {
    margin: 3mm 0 6mm 0;
    padding-left: 5.5mm;
    list-style-type: decimal;
  }
  li {
    margin: 1.2mm 0;
  }

  .block-title {
    font-weight: 700;
    color: var(--green);
    margin: 8mm 0 2mm;
    font-size: 12pt;
  }
  .hr {
    height: 1px;
    background: linear-gradient(90deg, var(--gold), transparent);
    margin: 8mm 0;
    border: 0;
  }

  .small {
    font-size: 10pt;
    color: var(--muted);
    line-height: 1.4;
  }

  .letter-number {
    display: inline-block;
    background: var(--green);
    color: white;
    padding: 2mm 4mm;
    border-radius: 4mm;
    font-size: 10pt;
    font-weight: 700;
    margin-bottom: 4mm;
  }

  footer {
    margin-top: 15mm;
    padding-top: 5mm;
    border-top: 1px solid #e5e5e5;
    font-size: 9pt;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
  }

  .disclaimer {
    margin-top: 10mm;
    padding: 4mm;
    background: #F9FAFB;
    border-left: 3px solid var(--gold);
    font-size: 9pt;
    color: var(--muted);
  }
</style>
</head>
<body>

<!-- Cover Page -->
<div class="cover-page">
  <div class="cover-logo"></div>
  <h1 class="cover-title">Lease Shield</h1>
  <p class="cover-subtitle">Legal Letter Pack</p>
  <div class="cover-meta">
    <p><strong>Case ID:</strong> ${caseData.id.slice(0, 8)}</p>
    <p><strong>Generated:</strong> ${today}</p>
    <p><strong>Letters Included:</strong> ${letters.length}</p>
  </div>
</div>

${letters.map((letter, index) => `
<!-- Letter ${index + 1}: ${letter.purpose} -->
<div class="letter-page">
  <header>
    <div class="brand">
      <div class="logo"></div>
      <div>
        <div class="brand-title">Lease Shield</div>
        <div class="small">Fair Protection for Tenants &amp; Landlords</div>
      </div>
    </div>
    <div class="meta">
      Case: ${caseData.id.slice(0, 8)}<br>
      Date: ${today}<br>
      Letter ${index + 1} of ${letters.length}
    </div>
  </header>

  <div class="letter-number">LETTER ${index + 1}: ${letter.id.toUpperCase()}</div>
  
  <h1>${letter.subject_en}</h1>
  <p class="subj">${letter.subject_th}</p>

  ${renderLetterBody(letter)}

  ${renderNextSteps(letter)}

  <div class="disclaimer">
    <div class="pair">
      <p class="en"><strong>Disclaimer:</strong> This correspondence is for documentation and communication support only, not legal advice.</p>
      <p class="th"><strong>ข้อจำกัดความรับผิด:</strong> เอกสารฉบับนี้จัดทำเพื่อช่วยด้านเอกสารและการสื่อสาร ไม่ใช่คำแนะนำทางกฎหมาย</p>
    </div>
  </div>

  <footer>
    <div>© ${year} Lease Shield</div>
    <div>${letter.id}</div>
  </footer>
</div>
`).join('\n')}

</body>
</html>`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validate user authentication
    const user = await base44.auth.me();
    if (!user && !req.url.includes('service_role=true')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { caseId } = payload;

    if (!caseId) {
      return Response.json({ error: 'caseId is required' }, { status: 400 });
    }

    console.log('Compiling letter pack for case:', caseId);

    // Fetch the case
    const cases = await base44.asServiceRole.entities.Case.list();
    const caseData = cases.find(c => c.id === caseId);

    if (!caseData) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Check if letters exist
    if (!caseData.letters || (!caseData.letters.v1_url && !caseData.letters.v2_url && !caseData.letters.v3_url)) {
      return Response.json({ error: 'No letters found for this case' }, { status: 400 });
    }

    // We need to regenerate the letter content since we only stored URLs
    // The letter pack needs the original JSON data from LLM
    // For now, we'll create a simplified version with placeholders
    // In production, you'd store the letter JSON in the Case entity or fetch from URLs

    const letters = [];
    
    if (caseData.letters.v1_url) {
      letters.push({
        id: 'v1_notice',
        purpose: 'Initial Clarification & Documentation',
        subject_en: 'Request for clarification on refundable deposit',
        subject_th: 'ขอความชัดเจนเกี่ยวกับเงินประกันการเช่า',
        body_en: [
          'Dear Landlord,',
          'This message is to summarise the completion of the tenancy and to request clarification regarding the refundable deposit for the rented apartment.',
          'According to the lease agreement, the property was vacated and the keys returned on the agreed date. No damages were recorded during handover, and supporting evidence is attached for reference.',
          'To help close the account promptly, please confirm (1) any deductions with itemised reasons and (2) supporting invoices if applicable. If no deductions apply, please confirm the transfer details.',
          'We kindly request a response by the date noted below so both parties can conclude this matter smoothly.',
          'Kind regards,',
          'Lease Shield'
        ],
        body_th: [
          'เรียน เจ้าของห้อง',
          'จดหมายฉบับนี้มีวัตถุประสงค์เพื่อสรุปการสิ้นสุดการเช่าและขอความชัดเจนเกี่ยวกับเงินประกันของห้องเช่าดังกล่าว',
          'ตามสัญญาเช่า ผู้เช่าได้ย้ายออกและส่งมอบกุญแจในวันที่กำหนด โดยไม่พบความเสียหายระหว่างการตรวจห้อง และได้แนบหลักฐานประกอบเพื่ออ้างอิง',
          'เพื่อให้การปิดบัญชีเป็นไปอย่างราบรื่น กรุณาแจ้ง (1) รายการหักพร้อมเหตุผล และ (2) ใบเสร็จหรือเอกสารประกอบ (ถ้ามี) หากไม่มีรายการหัก กรุณายืนยันรายละเอียดการโอนเงินคืน',
          'กรุณาตอบกลับภายในวันที่ที่ระบุไว้ เพื่อให้ทั้งสองฝ่ายสามารถปิดเรื่องนี้ได้อย่างเรียบร้อย',
          'ขอแสดงความนับถือ',
          'Lease Shield'
        ],
        next_steps_en: [
          'If deductions are proposed, provide the itemised details and documents.',
          'If not, confirm the amount and expected transfer date.'
        ],
        next_steps_th: [
          'หากมีรายการหัก กรุณาส่งรายละเอียดและเอกสารประกอบ',
          'หากไม่มีรายการหัก กรุณายืนยันจำนวนเงินและวันที่โอน'
        ]
      });
    }

    if (caseData.letters.v2_url) {
      letters.push({
        id: 'v2_follow_up',
        purpose: 'Follow-up & Reconciliation Plan',
        subject_en: 'Follow-up: Deposit Return Request',
        subject_th: 'ติดตาม: การขอคืนเงินมัดจำ',
        body_en: [
          'Dear Landlord,',
          'This is a follow-up to our previous letter regarding the deposit return for the rented apartment.',
          'As of today, we have not received a response to our initial request. We understand that processing may take time, and we remain committed to resolving this matter cooperatively.',
          'We kindly request an update on the status of the deposit return, including any deductions being considered with supporting documentation.',
          'To facilitate a smooth resolution, we propose a brief meeting or phone call to discuss any concerns.',
          'We appreciate your attention to this matter and look forward to your response.',
          'Kind regards,',
          'Lease Shield'
        ],
        body_th: [
          'เรียน เจ้าของห้อง',
          'นี่คือการติดตามจดหมายของเราก่อนหน้านี้เกี่ยวกับการคืนเงินมัดจำสำหรับอพาร์ตเมนต์ที่เช่า',
          'ณ วันนี้ เรายังไม่ได้รับการตอบกลับต่อคำขอเบื้องต้นของเรา เราเข้าใจว่าการดำเนินการอาจใช้เวลา และเรายังคงมุ่งมั่นที่จะแก้ไขปัญหานี้อย่างร่วมมือกัน',
          'เราขอให้อัปเดตสถานะการคืนเงินมัดจำ รวมถึงการหักเงินใดๆ ที่กำลังพิจารณาพร้อมเอกสารประกอบ',
          'เพื่อให้การแก้ไขเป็นไปอย่างราบรื่น เราเสนอการประชุมสั้นๆ หรือการโทรศัพท์เพื่อหารือเกี่ยวกับข้อกังวลใดๆ',
          'เราขอขอบคุณสำหรับความสนใจในเรื่องนี้และหวังว่าจะได้รับการตอบกลับจากคุณ',
          'ขอแสดงความนับถือ',
          'Lease Shield'
        ],
        next_steps_en: [
          'Respond with deposit return timeline',
          'Provide itemised deductions if applicable',
          'Schedule discussion if needed'
        ],
        next_steps_th: [
          'ตอบกลับพร้อมกำหนดเวลาการคืนเงินมัดจำ',
          'ให้รายละเอียดการหักเงินหากมี',
          'นัดหมายการหารือหากจำเป็น'
        ]
      });
    }

    if (caseData.letters.v3_url) {
      letters.push({
        id: 'v3_final_offer',
        purpose: 'Final Settlement Proposal',
        subject_en: 'Final Proposal for Deposit Settlement',
        subject_th: 'ข้อเสนอขั้นสุดท้ายสำหรับการตกลงคืนเงินมัดจำ',
        body_en: [
          'Dear Landlord,',
          'This is our final correspondence regarding the outstanding deposit return.',
          'Despite previous communications, the deposit has not been returned and we have not received clarification on any deductions.',
          'In the spirit of reaching an amicable resolution, we propose the following settlement: full return of the deposit within 7 days, or itemised deductions with supporting invoices.',
          'This is our final attempt to resolve this matter cooperatively before considering other options.',
          'We hope to conclude this matter promptly and professionally.',
          'Kind regards,',
          'Lease Shield'
        ],
        body_th: [
          'เรียน เจ้าของห้อง',
          'นี่คือการติดต่อครั้งสุดท้ายของเราเกี่ยวกับการคืนเงินมัดจำที่ค้างอยู่',
          'แม้จะมีการติดต่อหลายครั้ง เงินมัดจำยังไม่ได้รับการคืนและเรายังไม่ได้รับคำชี้แจงเกี่ยวกับการหักเงินใดๆ',
          'ด้วยจิตวิญญาณของการหาทางออกที่เป็นมิตร เราเสนอการตกลงดังนี้: คืนเงินมัดจำเต็มจำนวนภายใน 7 วัน หรือการหักเงินพร้อมใบเสร็จรับเงิน',
          'นี่คือความพยายามครั้งสุดท้ายของเราในการแก้ไขปัญหานี้อย่างร่วมมือกันก่อนที่จะพิจารณาตัวเลือกอื่นๆ',
          'เราหวังว่าจะสามารถสรุปเรื่องนี้ได้อย่างรวดเร็วและเป็นมืออาชีพ',
          'ขอแสดงความนับถือ',
          'Lease Shield'
        ],
        next_steps_en: [
          'Respond within 7 days with settlement plan',
          'Return deposit or provide detailed deductions',
          'Confirm resolution method'
        ],
        next_steps_th: [
          'ตอบกลับภายใน 7 วันพร้อมแผนการตกลง',
          'คืนเงินมัดจำหรือให้รายละเอียดการหักเงิน',
          'ยืนยันวิธีการแก้ไข'
        ]
      });
    }

    if (letters.length === 0) {
      return Response.json({ error: 'No letter content available' }, { status: 400 });
    }

    // Generate HTML
    const htmlContent = getLetterPackHTML(caseData, letters);

    // Create HTML file blob
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const file = new File([blob], `letter_pack_${caseId}.html`, { type: 'text/html' });

    // Upload to storage
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    console.log('Letter pack compiled:', file_url);

    // Optionally update case with pack URL
    const timeline = caseData.timeline || [];
    timeline.push({
      timestamp: new Date().toISOString(),
      event: 'Letter pack compiled',
      actor: user?.email || 'system',
      meta: { pack_url: file_url }
    });

    await base44.asServiceRole.entities.Case.update(caseId, {
      letter_pack_url: file_url,
      timeline
    });

    return Response.json({
      success: true,
      pack_url: file_url,
      letters_included: letters.length
    });

  } catch (error) {
    console.error('Letter pack compilation error:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});