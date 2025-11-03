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
      ...
    },
    {
      "id": "v3_final_offer",
      "purpose": "Final amicable settlement proposal before escalation",
      ...
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

    // Save each letter as a Document entity and get URLs
    const letterUrls = {};
    for (const letter of result.letters) {
      const letterText = `Subject (EN): ${letter.subject_en}\nSubject (TH): ${letter.subject_th}\n\n` +
        `=== ENGLISH VERSION ===\n\n${letter.body_en.join('\n\n')}` +
        `\n\n=== THAI VERSION (ไทย) ===\n\n${letter.body_th.join('\n\n')}` +
        `\n\n=== NEXT STEPS ===\n\nEnglish:\n${letter.next_steps_en.map((s, i) => `${i + 1}. ${s}`).join('\n')}` +
        `\n\nThai:\n${letter.next_steps_th.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

      // Create a text file blob
      const blob = new Blob([letterText], { type: 'text/plain' });
      const file = new File([blob], `${letter.id}_${caseId}.txt`, { type: 'text/plain' });

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

    // Update the case with letter URLs and change status
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

      await base44.entities.Case.update(caseId, {
        status: 'ready_drafts',
        letters: {
          v1_url: letterUrls['v1_notice'],
          v2_url: letterUrls['v2_follow_up'],
          v3_url: letterUrls['v3_final_offer']
        },
        timeline
      });

      console.log('Case updated with letter URLs');

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
          `สวัสดี ${tenant.full_name},\n\nจดหมายสำหรับคดี #${caseId.slice(0, 8)} สร้างเสร็จแล้ว\n\nคุณสามารถตรวจสอบและดาวน์โหลดได้ที่แดชบอร์ด\n\n— ทีม Lease Shield` :
          `Hi ${tenant.full_name},\n\nYour letters for Case #${caseId.slice(0, 8)} are ready.\n\nYou can review and download them from your dashboard.\n\n— The Lease Shield Team`;

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