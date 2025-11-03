
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const LETTER_WRITER_SYSTEM_PROMPT = `SYSTEM:
You are "Lease Shield Letter Writer", assisting both tenants and landlords with clear, neutral correspondence for Thai rental disputes.

RULES:
- Your letters must be courteous, factual, and completely neutral.
- Write in English with a Thai mirror translation for every paragraph.
- Each paragraph in English must have its Thai equivalent directly below it.
- Keep tone calm, respectful, and professional — never accusatory or legalistic.
- Avoid any mention of courts, threats, or escalation. Focus on communication and resolution.
- Assume these letters are documentation support, **not legal advice**.

STRUCTURE:
- 3 letters total:
  1️⃣ Initial Clarification & Documentation  
  2️⃣ Follow-up & Reconciliation Plan  
  3️⃣ Final Settlement Proposal  
- Each letter: 180–280 English words mirrored in Thai.  
- Use numbered lists for documents or requested items.  
- Close with a cooperative, polite sign-off.  
- Never include real addresses, phone numbers, or personal names.

OUTPUT FORMAT:
Return STRICT JSON. No text outside the JSON.

JSON SCHEMA:
{
  "caseId": "string",
  "letters": [
    {
      "id": "v1_notice",
      "purpose": "Initial clarification & documentation",
      "subject_en": "string",
      "subject_th": "string",
      "body_en": ["para1", "para2", "..."],
      "body_th": ["ย่อหน้า1", "ย่อหน้า2", "..."],
      "placeholders": {
        "tenant_name": "string",
        "landlord_name": "string",
        "property_address": "string",
        "contract_ref": "string|null",
        "deposit_amount_thb": "number|null",
        "billing_items": ["string"],
        "request_by_date_iso": "YYYY-MM-DD",
        "attachments": ["Lease.pdf","Photos.zip","Messages.pdf"]
      },
      "next_steps_en": ["step1","step2"],
      "next_steps_th": ["ขั้นตอน1","ขั้นตอน2"]
    },
    {
      "id": "v2_follow_up",
      "purpose": "Polite follow-up & proposed reconciliation plan",
      // ...
    },
    {
      "id": "v3_final_offer",
      "purpose": "Final amicable settlement proposal before escalation",
      // ...
    }
  ]
}

VARIABLES PROVIDED:
tenant_name, landlord_name, property_address, contract_ref,
deposit_amount_thb, dispute_type, facts[], request_by_date_iso,
attachments[], tone ("standard" | "softer" | "firmer").

STYLE:
- Default tone = "standard".
- "softer" adds empathy, "firmer" adds structure and clarity.
- Never assume guilt; emphasize cooperation and understanding.
- All output must be bilingual (EN/TH).`;

// HTML template for rendering letters
const getLetterHTML = (letter, caseId) => {
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  
  // Helper to safely render arrays
  const renderList = (items, className) => {
    if (!items || items.length === 0) return '';
    return items.map((item, i) => `
      <li>
        <div class="${className}">${item}</div>
      </li>
    `).join('');
  };

  // Helper to render EN/TH paragraph pairs
  const renderParagraphs = (bodyEn, bodyTh) => {
    return bodyEn.map((para, i) => `
      <div class="pair">
        <p class="en">${para}</p>
        <p class="th">${bodyTh[i] || ''}</p>
      </div>
    `).join('');
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${letter.subject_en}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root{
    --green:#0C3B2E; --gold:#C7A338; --ink:#111; --muted:#667085;
  }
  @page { size: A4; margin: 22mm 18mm 24mm 18mm; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
  * { box-sizing: border-box; }
  body {
    font-family: Inter, "Helvetica Neue", Arial, "Noto Sans Thai", "Segoe UI", sans-serif;
    color: var(--ink); line-height: 1.5; font-size: 12.2pt;
    margin: 0; padding: 22mm 18mm 24mm 18mm;
  }
  header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 14mm; }
  .brand { display:flex; align-items:center; gap:10px; }
  .logo {
    width: 28mm; height: 28mm; border-radius: 8px;
    background: var(--green); position: relative;
  }
  .logo:after{
    content:""; position:absolute; inset:4mm; border:1.8px solid var(--gold); border-radius:6px;
  }
  .brand-title { font-weight:700; font-size: 14pt; color: var(--green); letter-spacing: .2px; }
  .meta { text-align:right; font-size: 10.5pt; color: var(--muted); }

  h1 { font-size: 16pt; margin: 0 0 2mm 0; color: var(--green); }
  .subj { font-size: 11.5pt; color: var(--muted); margin: 0 0 8mm 0; }

  .pair { margin: 0 0 6mm 0; }
  .pair .en { margin: 0 0 3mm 0; }
  .pair .th { margin: 0; font-family: "Noto Sans Thai", "TH Sarabun New", sans-serif; }

  ul { margin: 3mm 0 6mm 0; padding-left: 5.5mm; list-style-type: decimal; }
  li { margin: 1.2mm 0; }

  .block-title { font-weight: 700; color: var(--green); margin: 8mm 0 2mm; font-size: 13pt; }
  .hr { height:1px; background: linear-gradient(90deg, var(--gold), transparent); margin: 8mm 0; border:0; }

  footer {
    margin-top: 15mm; padding-top: 5mm; border-top: 1px solid #e5e5e5;
    font-size: 9.8pt; color: var(--muted); display:flex; justify-content:space-between;
  }
  .badge { color: var(--gold); font-weight:600; }
  .small { font-size: 10.5pt; color: var(--muted); line-height: 1.4; }

  .signoff { margin-top: 10mm; }
  .sigline { margin-top: 2mm; }
</style>
</head>
<body>

<header>
  <div class="brand">
    <div class="logo"></div>
    <div>
      <div class="brand-title">Lease Shield</div>
      <div class="small">Fair Protection for Tenants &amp; Landlords</div>
    </div>
  </div>
  <div class="meta">
    Case: ${caseId.slice(0, 8)}<br>
    Date: ${today}<br>
  </div>
</header>

<main>
  <h1>${letter.subject_en}</h1>
  <p class="subj">${letter.subject_th}</p>

  ${renderParagraphs(letter.body_en, letter.body_th)}

  ${letter.next_steps_en && letter.next_steps_en.length > 0 ? `
    <div class="block-title">Next Steps / ขั้นตอนถัดไป</div>
    <ul>
      ${letter.next_steps_en.map((step, i) => `
        <li>
          <div class="en">${step}</div>
          <div class="th small">${letter.next_steps_th[i] || ''}</div>
        </li>
      `).join('')}
    </ul>
  ` : ''}

  <div class="hr"></div>
  <div class="block-title">Context / ข้อมูลอ้างอิง</div>
  
  ${letter.placeholders.tenant_name ? `
  <div class="pair">
    <p class="en"><strong>Tenant</strong>: ${letter.placeholders.tenant_name}</p>
    <p class="th"><strong>ผู้เช่า</strong>: ${letter.placeholders.tenant_name}</p>
  </div>` : ''}
  
  ${letter.placeholders.landlord_name ? `
  <div class="pair">
    <p class="en"><strong>Landlord</strong>: ${letter.placeholders.landlord_name}</p>
    <p class="th"><strong>เจ้าของห้อง</strong>: ${letter.placeholders.landlord_name}</p>
  </div>` : ''}
  
  ${letter.placeholders.property_address ? `
  <div class="pair">
    <p class="en"><strong>Property</strong>: ${letter.placeholders.property_address}</p>
    <p class="th"><strong>ทรัพย์สิน</strong>: ${letter.placeholders.property_address}</p>
  </div>` : ''}
  
  ${letter.placeholders.contract_ref ? `
  <div class="pair">
    <p class="en"><strong>Contract</strong>: ${letter.placeholders.contract_ref}</p>
    <p class="th"><strong>สัญญา</strong>: ${letter.placeholders.contract_ref}</p>
  </div>` : ''}
  
  ${letter.placeholders.deposit_amount_thb ? `
  <div class="pair">
    <p class="en"><strong>Deposit Amount</strong>: ฿${letter.placeholders.deposit_amount_thb.toLocaleString()}</p>
    <p class="th"><strong>จำนวนเงินประกัน</strong>: ฿${letter.placeholders.deposit_amount_thb.toLocaleString()}</p>
  </div>` : ''}
  
  ${letter.placeholders.billing_items && letter.placeholders.billing_items.length > 0 ? `
  <div class="pair">
    <p class="en"><strong>Billing Items</strong>: ${letter.placeholders.billing_items.join(', ')}</p>
    <p class="th"><strong>รายการค่าใช้จ่าย</strong>: ${letter.placeholders.billing_items.join(', ')}</p>
  </div>` : ''}
  
  ${letter.placeholders.attachments && letter.placeholders.attachments.length > 0 ? `
  <div class="pair">
    <p class="en"><strong>Attachments</strong>: ${letter.placeholders.attachments.join(', ')}</p>
    <p class="th"><strong>ไฟล์แนบ</strong>: ${letter.placeholders.attachments.join(', ')}</p>
  </div>` : ''}
  
  ${letter.placeholders.request_by_date_iso ? `
  <div class="pair">
    <p class="en"><strong>Response Requested By</strong>: ${letter.placeholders.request_by_date_iso}</p>
    <p class="th"><strong>ขอความคืบหน้าภายใน</strong>: ${letter.placeholders.request_by_date_iso}</p>
  </div>` : ''}

  <div class="signoff">
    <div class="pair">
      <p class="en">Kind regards,<br><strong>Lease Shield</strong></p>
      <p class="th">ขอแสดงความนับถือ<br><strong>Lease Shield</strong></p>
    </div>
    <div class="sigline small en">This correspondence is for documentation and communication support only, not legal advice.</div>
    <div class="sigline small th">เอกสารฉบับนี้จัดทำเพื่อช่วยด้านเอกสารและการสื่อสาร ไม่ใช่คำแนะนำทางกฎหมาย</div>
  </div>
</main>

<footer>
  <div>© ${year} Lease Shield</div>
  <div class="badge">${letter.id}</div>
</footer>

</body>
</html>`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validate user authentication
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { 
      caseId,
      tenant_name = "Tenant",
      landlord_name = "Landlord", 
      property_address = "the rented apartment",
      contract_ref = "Residential Lease Agreement",
      deposit_amount_thb,
      dispute_type = "deposit",
      facts = [],
      request_by_date_iso,
      attachments = [],
      tone = "standard"
    } = payload;

    if (!caseId) {
      return Response.json({ error: 'caseId is required' }, { status: 400 });
    }

    console.log('Generating letters for case:', caseId);

    // Build the prompt for letter generation
    const userPrompt = JSON.stringify({
      caseId,
      tenant_name,
      landlord_name,
      property_address,
      contract_ref,
      deposit_amount_thb,
      dispute_type,
      facts,
      request_by_date_iso: request_by_date_iso || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      attachments,
      tone
    });

    // Call LLM to generate letter pack
    console.log('Calling LLM with payload...');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${LETTER_WRITER_SYSTEM_PROMPT}

PAYLOAD:
${userPrompt}`,
      response_json_schema: {
        type: "object",
        properties: {
          caseId: { type: "string" },
          letters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                purpose: { type: "string" },
                subject_en: { type: "string" },
                subject_th: { type: "string" },
                body_en: { type: "array", items: { type: "string" } },
                body_th: { type: "array", items: { type: "string" } },
                placeholders: { type: "object" },
                next_steps_en: { type: "array", items: { type: "string" } },
                next_steps_th: { type: "array", items: { type: "string" } }
              },
              required: ["id", "purpose", "subject_en", "subject_th", "body_en", "body_th"]
            }
          }
        },
        required: ["caseId", "letters"]
      }
    });

    console.log('LLM response received, letters generated:', result.letters?.length);

    if (!result.letters || result.letters.length === 0) {
      throw new Error('Failed to generate letters');
    }

    // Save each letter as HTML and upload
    const letterUrls = {};
    for (const letter of result.letters) {
      // Generate HTML
      const htmlContent = getLetterHTML(letter, caseId);

      // Create HTML file blob
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const file = new File([blob], `${letter.id}_${caseId}.html`, { type: 'text/html' });

      // Upload to storage
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Save as Document
      const doc = await base44.entities.Document.create({
        type: 'letter',
        file_url,
        label: `${letter.purpose} - Case ${caseId.slice(0, 8)}`
      });

      letterUrls[letter.id] = doc.file_url;
      console.log(`Letter ${letter.id} saved:`, doc.id);
    }

    // Update the case with letter URLs, letter data, and change status
    const cases = await base44.entities.Case.list();
    const existingCase = cases.find(c => c.id === caseId);
    
    if (existingCase) {
      const timeline = existingCase.timeline || [];
      timeline.push({
        timestamp: new Date().toISOString(),
        event: 'Letters generated',
        actor: user.email,
        meta: { letter_count: result.letters.length }
      });

      // CRITICAL: Store the letter JSON data for later compilation
      await base44.entities.Case.update(caseId, {
        status: 'ready_drafts',
        letters: {
          v1_url: letterUrls['v1_notice'],
          v2_url: letterUrls['v2_follow_up'],
          v3_url: letterUrls['v3_final_offer'],
          // Store the actual letter data
          letters_data: result.letters
        },
        timeline
      });

      console.log('Case updated with letter URLs and data');

      // Send notification to tenant
      const tenant = await base44.entities.User.list().then(users => 
        users.find(u => u.email === existingCase.user_email)
      );

      if (tenant) {
        const language = tenant.language || 'en';
        const subject = language === 'th' ? 
          'จดหมายของคุณพร้อมแล้ว' : 
          'Your Letters Are Ready';
        const body = language === 'th' ?
          `สวัสดี ${tenant.full_name},\n\nจดหมายสำหรับคดี #${caseId.slice(0, 8)} สร้างเสร็จแล้ว\n\nคุณสามารถตรวจสอบ ดาวน์โหลด และพิมพ์ได้ที่แดชบอร์ด\n\nจดหมายอยู่ในรูปแบบ HTML ที่พร้อมพิมพ์และส่งให้เจ้าของบ้าน\n\n— ทีม Lease Shield` :
          `Hi ${tenant.full_name},\n\nYour letters for Case #${caseId.slice(0, 8)} are ready.\n\nYou can review, download, and print them from your dashboard.\n\nLetters are in print-ready HTML format for sending to your landlord.\n\n— The Lease Shield Team`;

        await base44.integrations.Core.SendEmail({
          to: tenant.email,
          subject,
          body
        });

        console.log('Notification sent to tenant');
      }
    }

    // Return the full letter pack
    return Response.json({
      success: true,
      caseId,
      letters: result.letters,
      letterUrls
    });

  } catch (error) {
    console.error('Letter generation error:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});
