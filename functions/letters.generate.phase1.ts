import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// --- Utility functions ---
const safe = (v, d = "") => (v == null ? d : v);
const safeISO = (v, plusDays = 7) => {
  try { 
    if (v) return new Date(v).toISOString().slice(0, 10);
  } catch {}
  return new Date(Date.now() + plusDays * 864e5).toISOString().slice(0, 10);
};
const fill = (tpl, vars) => tpl.replace(/{{\s*([\w.]+)\s*}}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));

// --- Static content bank ---
const SUBJECTS = {
  deposit: {
    subject_en: "Request for clarification on refundable deposit",
    subject_th: "ขอความชัดเจนเกี่ยวกับเงินประกันการเช่า",
    body_en: `Dear {{landlord_name}},

This note summarises the completion of the tenancy for {{property_address}} and requests an update regarding the refundable deposit of {{deposit_amount_thb}} THB. {{contract_ref}}

To reconcile promptly, please provide (1) any proposed deductions with itemised reasons and supporting documents, or (2) confirmation of refund amount and transfer details. If no deductions apply, kindly confirm the return timeline.

We would appreciate a reply by {{request_by_date_iso}} so both sides can close this matter smoothly.

Kind regards,
{{tenant_name}}`,
    body_th: `เรียน {{landlord_name}},

จดหมายฉบับนี้สรุปการสิ้นสุดการเช่าสำหรับ {{property_address}} และขอความคืบหน้าเกี่ยวกับการคืนเงินประกัน {{deposit_amount_thb}} บาท {{contract_ref}}

เพื่อให้ปิดบัญชีได้รวดเร็ว กรุณาแจ้ง (1) รายการหักพร้อมเหตุผลและเอกสารประกอบ หรือ (2) การยืนยันจำนวนเงินที่จะคืนและรายละเอียดการโอน หากไม่มีรายการหัก กรุณาแจ้งกำหนดการโอนคืน

ขอความกรุณาตอบกลับภายใน {{request_by_date_iso}} เพื่อให้ทั้งสองฝ่ายสามารถปิดเรื่องนี้ได้อย่างราบรื่น

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  damages: {
    subject_en: "Request for itemised assessment of damages",
    subject_th: "ขอรายละเอียดการประเมินความเสียหายแบบแยกรายการ",
    body_en: `Dear {{landlord_name}},

This note concerns {{property_address}} and requests an itemised assessment for any claimed damages. {{contract_ref}} If specific items are in question, please share the list, reasons, and supporting documents/quotes.

If no damages apply, please confirm the final refundable amount and transfer details. We aim to reconcile this by {{request_by_date_iso}}; if another timeline is preferable, please advise.

Kind regards,
{{tenant_name}}`,
    body_th: `เรียน {{landlord_name}},

หนังสือนี้เกี่ยวกับ {{property_address}} และขอรับรายละเอียดการประเมินความเสียหายแบบแยกรายการ {{contract_ref}} หากมีรายการที่ต้องตรวจสอบ กรุณาส่งรายชื่อ เหตุผล และเอกสาร/ใบเสนอราคา

หากไม่มีความเสียหาย กรุณายืนยันจำนวนเงินที่จะคืนและรายละเอียดการโอน ตั้งใจปิดเรื่องภายใน {{request_by_date_iso}} หากมีกำหนดการอื่นที่เหมาะสมกว่า กรุณาแจ้งได้

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  early_termination: {
    subject_en: "Request to reconcile early termination under the lease",
    subject_th: "ขอประสานงานการยกเลิกสัญญาก่อนกำหนด",
    body_en: `Dear {{landlord_name}},

This message relates to early termination for {{property_address}}. {{contract_ref}} To close the account properly, please confirm (1) any fees specified by the contract, (2) key/possession handover steps, and (3) the final account date.

Our preference is to complete this by {{request_by_date_iso}}. If an alternative schedule suits you better, please let us know so we can agree a practical plan.

Kind regards,
{{tenant_name}}`,
    body_th: `เรียน {{landlord_name}},

จดหมายนี้เกี่ยวกับการยกเลิกสัญญาก่อนกำหนดของ {{property_address}} {{contract_ref}} เพื่อให้ปิดบัญชีอย่างถูกต้อง กรุณายืนยัน (1) ค่าธรรมเนียมตามสัญญา (ถ้ามี) (2) ขั้นตอนการส่งมอบกุญแจ/ทรัพย์สิน และ (3) วันที่ปิดบัญชี

ต้องการดำเนินการให้เสร็จภายใน {{request_by_date_iso}} หากมีกำหนดการอื่นที่เหมาะสมกว่า กรุณาแจ้งเพื่อจะได้วางแผนร่วมกัน

ขอแสดงความนับถือ
{{tenant_name}}`
  }
};

// --- HTML Template ---
const TEMPLATE = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
@page { size: A4; margin: 20mm 18mm; }
body {
  font-family: Inter, Arial, "Noto Sans Thai", "TH Sarabun New", sans-serif;
  font-size: 12pt;
  line-height: 1.6;
  color: #1A1D1F;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
h1 {
  color: #0C3B2E;
  margin: 0 0 8px;
  font-size: 18pt;
  font-weight: 700;
}
.muted {
  color: #64748b;
  margin: 0 0 20px;
  font-size: 11pt;
}
.body-text {
  white-space: pre-wrap;
  font-family: inherit;
  margin: 20px 0;
}
.body-th {
  font-family: 'Noto Sans Thai', 'TH Sarabun New', sans-serif;
}
hr {
  margin: 30px 0;
  border: 0;
  border-top: 1px solid #E5E7EB;
}
.footer {
  margin-top: 30px;
  padding: 15px;
  background: #F8FAFC;
  border-radius: 8px;
  font-size: 10pt;
  color: #64748b;
}
.footer p {
  margin: 4px 0;
}
.footer strong {
  color: #1A1D1F;
}
</style>
</head>
<body>
<h1>{{subject_en}}</h1>
<p class="muted">{{subject_th}}</p>

<div class="body-text">{{body_en}}</div>

<hr>

<div class="body-text body-th">{{body_th}}</div>

<div class="footer">
<p><strong>Case ID:</strong> {{caseId}}</p>
<p><strong>Property:</strong> {{property_address}}</p>
<p><strong>Contract Reference:</strong> {{contract_ref}}</p>
<p><strong>Response requested by:</strong> {{request_by_date_iso}}</p>
<p><strong>From:</strong> {{tenant_name}} | <strong>To:</strong> {{landlord_name}}</p>
</div>
</body>
</html>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const { caseId, subject, overrides = {} } = payload;
    
    if (!caseId || !subject) {
      return Response.json({ error: 'Missing required fields: caseId, subject' }, { status: 400 });
    }

    // Get subject content
    const content = SUBJECTS[subject];
    if (!content) {
      return Response.json({ error: 'Invalid subject. Use: deposit, damages, or early_termination' }, { status: 400 });
    }

    // Fetch case data using service role
    const cases = await base44.asServiceRole.entities.Case.filter({ id: caseId });
    if (!cases || cases.length === 0) {
      return Response.json({ error: `Case not found: ${caseId}` }, { status: 404 });
    }
    
    const caseData = cases[0];

    // Fetch related lease if available
    let leaseData = null;
    if (caseData.lease_id) {
      try {
        const leases = await base44.asServiceRole.entities.Lease.filter({ id: caseData.lease_id });
        if (leases && leases.length > 0) {
          leaseData = leases[0];
        }
      } catch (e) {
        console.error('Could not fetch lease:', e);
      }
    }

    // Fetch user data for tenant name
    let userData = null;
    if (caseData.user_email) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ email: caseData.user_email });
        if (users && users.length > 0) {
          userData = users[0];
        }
      } catch (e) {
        console.error('Could not fetch user:', e);
      }
    }

    // Build vars with smart fallbacks and overrides
    const vars = {
      caseId: caseId.slice(0, 8), // Short ID for display
      tenant_name: safe(
        overrides.tenant_name, 
        safe(userData?.full_name, safe(caseData.user_email, "Tenant"))
      ),
      landlord_name: safe(
        overrides.landlord_name,
        safe(leaseData?.landlord_name, "Landlord")
      ),
      property_address: safe(
        overrides.property_address,
        safe(leaseData?.property_address, safe(caseData.property_address, "[Property Address]"))
      ),
      contract_ref: safe(
        overrides.contract_ref,
        leaseData?.start_date ? `Lease dated ${new Date(leaseData.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : "Lease Agreement"
      ),
      deposit_amount_thb: safe(
        overrides.deposit_amount_thb,
        safe(caseData.dispute_amount, safe(leaseData?.deposit_amount, "[Amount]"))
      ),
      request_by_date_iso: safe(
        overrides.request_by_date_iso,
        safeISO(caseData.sla?.followup_due, 14)
      ),
      subject_en: content.subject_en,
      subject_th: content.subject_th
    };

    // Fill body templates
    vars.body_en = fill(content.body_en, vars);
    vars.body_th = fill(content.body_th, vars);

    // Generate HTML
    const html = fill(TEMPLATE, vars);

    // Save as HTML file
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const filename = `letter_${subject}_${caseId.slice(0, 8)}_${Date.now()}.html`;
    const file = new File([blob], filename);
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Save to documents using service role
    await base44.asServiceRole.entities.Document.create({
      type: 'letter',
      file_url,
      label: `${content.subject_en} - Case ${caseId.slice(0, 8)}`
    });

    // Update case with new letter URL
    const timeline = caseData.timeline || [];
    timeline.push({
      timestamp: new Date().toISOString(),
      event: `letter_generated_${subject}`,
      actor: 'system',
      meta: { letter_url: file_url, subject }
    });

    const letters = caseData.letters || {};
    letters.v1_url = file_url; // Always store in v1 for now

    await base44.asServiceRole.entities.Case.update(caseId, {
      status: 'ready_drafts',
      timeline,
      letters
    });

    return Response.json({ 
      success: true,
      url: file_url,
      subject: subject,
      caseId: caseId
    });

  } catch (error) {
    console.error('Letter generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});