import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

//////////////////////
// Helpers & Copy  //
//////////////////////
const SUBJECTS = new Set(["deposit","damages","early_termination"]);
const esc = (s="") => String(s).replace(/[<&>"]/g, m => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[m]));
const isoDate = (v) => { try { return new Date(v).toISOString().slice(0,10); } catch { return new Date().toISOString().slice(0,10); } };
const safeISO = (v, plusDays=7) => v ? isoDate(v) : isoDate(Date.now() + plusDays * 864e5);
const fill = (tpl, vars) => tpl.replace(/{{\s*([\w.]+)\s*}}/g, (_, k) => (vars[k] ?? ""));

const COPY = {
  deposit: {
    subject_en: "Request for clarification on refundable deposit",
    subject_th: "ขอความชัดเจนเกี่ยวกับเงินประกันการเช่า",
    paragraphs_en: [
      "Dear {{landlord_name}},",
      "This letter concerns {{property_address}}. We kindly request an update regarding the refundable security deposit of {{deposit_amount}} THB under {{contract_ref}}.",
      "To reconcile promptly, please provide either (1) any proposed deductions with itemised reasons and supporting documents, or (2) confirmation of the refund amount and transfer details. If no deductions apply, please confirm the return timeline.",
      "We would appreciate a reply by {{request_by_date_iso}} so both sides can close this matter smoothly.",
      "Kind regards,",
      "{{tenant_name}}"
    ],
    paragraphs_th: [
      "เรียน {{landlord_name}},",
      "หนังสือนี้เกี่ยวกับ {{property_address}} จึงขอความคืบหน้าเกี่ยวกับการคืนเงินประกันจำนวน {{deposit_amount}} บาท ภายใต้ {{contract_ref}}",
      "เพื่อให้ปิดบัญชีได้รวดเร็ว กรุณาแจ้ง (1) รายการหักพร้อมเหตุผลและเอกสารประกอบ หรือ (2) การยืนยันจำนวนเงินที่จะคืนและรายละเอียดการโอน หากไม่มีรายการหัก กรุณาแจ้งกำหนดการโอนคืน",
      "ขอความกรุณาตอบกลับภายใน {{request_by_date_iso}} เพื่อให้ทั้งสองฝ่ายสามารถปิดเรื่องนี้ได้อย่างราบรื่น",
      "ขอแสดงความนับถือ",
      "{{tenant_name}}"
    ]
  },
  damages: {
    subject_en: "Request for itemised assessment of damages",
    subject_th: "ขอรายละเอียดการประเมินความเสียหายแบบแยกรายการ",
    paragraphs_en: [
      "Dear {{landlord_name}},",
      "This letter relates to {{property_address}}. If there are any claimed damages under {{contract_ref}}, please provide an itemised assessment with reasons and supporting documents/quotes.",
      "If no damages apply, please confirm the final refundable amount and transfer details. Our target to reconcile is {{request_by_date_iso}}; please advise if another timeline is preferable.",
      "Kind regards,",
      "{{tenant_name}}"
    ],
    paragraphs_th: [
      "เรียน {{landlord_name}},",
      "หนังสือนี้เกี่ยวกับ {{property_address}} หากมีการเรียกร้องค่าเสียหายภายใต้ {{contract_ref}} กรุณาส่งรายละเอียดแบบแยกรายการพร้อมเหตุผลและเอกสาร/ใบเสนอราคา",
      "หากไม่มีความเสียหาย กรุณายืนยันจำนวนเงินที่จะคืนและรายละเอียดการโอน ตั้งใจปิดเรื่องภายใน {{request_by_date_iso}} หากมีกำหนดอื่นที่เหมาะสมกว่า กรุณาแจ้ง",
      "ขอแสดงความนับถือ",
      "{{tenant_name}}"
    ]
  },
  early_termination: {
    subject_en: "Request to reconcile early termination under the lease",
    subject_th: "ขอประสานงานการยกเลิกสัญญาก่อนกำหนด",
    paragraphs_en: [
      "Dear {{landlord_name}},",
      "This letter concerns early termination for {{property_address}} under {{contract_ref}}. To close the account properly, please confirm (1) any fees specified by the contract, (2) key/possession handover steps, and (3) the final account date.",
      "Our preference is to complete this by {{request_by_date_iso}}. If an alternative schedule suits you better, please let us know so we can agree on a practical plan.",
      "Kind regards,",
      "{{tenant_name}}"
    ],
    paragraphs_th: [
      "เรียน {{landlord_name}},",
      "หนังสือนี้เกี่ยวกับการยกเลิกสัญญาก่อนกำหนดของ {{property_address}} ภายใต้ {{contract_ref}} เพื่อให้ปิดบัญชีอย่างถูกต้อง กรุณายืนยัน (1) ค่าธรรมเนียมตามสัญญา (ถ้ามี) (2) ขั้นตอนการส่งมอบกุญแจ/ทรัพย์สิน และ (3) วันที่ปิดบัญชี",
      "ต้องการดำเนินการให้เสร็จภายใน {{request_by_date_iso}} หากมีกำหนดการอื่นที่เหมาะสมกว่า กรุณาแจ้งเพื่อจะได้วางแผนร่วมกัน",
      "ขอแสดงความนับถือ",
      "{{tenant_name}}"
    ]
  }
};

const TEMPLATE = `<!doctype html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm 18mm; }
  body { font-family: Inter, Arial, "Noto Sans Thai", "TH Sarabun New", sans-serif; color:#1A1D1F; font-size:12pt; line-height:1.65; }
  .wrap { max-width: 820px; margin: 0 auto; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
  .brand { font-weight:700; color:#0C3B2E; font-size:16pt; letter-spacing:0.3px; }
  .meta { font-size:10.5pt; color:#475569; border:1px solid #E5E7EB; border-radius:8px; padding:10px 12px; }
  .meta div { margin:3px 0; }
  h1.en { font-size:18pt; margin:8px 0 2px; color:#0C3B2E; }
  h2.th { font-size:15pt; margin:0 0 14px; color:#0C3B2E; font-family:"Noto Sans Thai","TH Sarabun New",sans-serif; }
  .section { margin: 14px 0; }
  p { margin: 6px 0 10px; }
  .th { font-family:"Noto Sans Thai","TH Sarabun New",sans-serif; }
  hr { border:0; border-top:1px solid #E5E7EB; margin:18px 0; }
  .footer { margin-top:18px; padding:12px; background:#F8FAFC; border:1px solid #E5E7EB; border-radius:8px; font-size:10.5pt; color:#475569; }
  .muted { color:#64748B; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="brand">LEASE SHIELD</div>
      <div class="meta">
        <div><strong>Date:</strong> {{today_iso}}</div>
        <div><strong>Case ID:</strong> {{caseId}}</div>
        <div><strong>Property:</strong> {{property_address}}</div>
      </div>
    </div>

    <h1 class="en">{{subject_en}}</h1>
    <h2 class="th">{{subject_th}}</h2>

    <div class="section">
      {{paragraphs_en}}
    </div>

    <hr>

    <div class="section th">
      {{paragraphs_th}}
    </div>

    <div class="footer">
      <div><strong>Contract:</strong> {{contract_ref}}</div>
      <div><strong>Requested reply by:</strong> {{request_by_date_iso}}</div>
      <div><strong>From:</strong> {{tenant_name}} <span class="muted">→</span> <strong>To:</strong> {{landlord_name}}</div>
    </div>
  </div>
</body>
</html>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const args = await req.json();
    
    // Validate subject
    const subjectRaw = (args?.subject || "deposit").toLowerCase();
    if (!SUBJECTS.has(subjectRaw)) {
      return Response.json({ 
        ok: false, 
        error: 'Invalid subject. Use: deposit, damages, or early_termination' 
      }, { status: 400 });
    }

    // Determine mode
    const mode = args?.caseId ? "case" : "standalone";
    
    // Fetch case data if in case mode
    let fromCase = {};
    let leaseData = null;
    let userData = null;

    if (mode === "case") {
      const cases = await base44.asServiceRole.entities.Case.filter({ id: args.caseId });
      if (!cases || cases.length === 0) {
        return Response.json({ 
          ok: false, 
          error: `Case not found: ${args.caseId}` 
        }, { status: 404 });
      }
      fromCase = cases[0];

      // Fetch related lease
      if (fromCase.lease_id) {
        try {
          const leases = await base44.asServiceRole.entities.Lease.filter({ id: fromCase.lease_id });
          if (leases && leases.length > 0) leaseData = leases[0];
        } catch (e) {
          console.error('Could not fetch lease:', e);
        }
      }

      // Fetch related user
      if (fromCase.user_email) {
        try {
          const users = await base44.asServiceRole.entities.User.filter({ email: fromCase.user_email });
          if (users && users.length > 0) userData = users[0];
        } catch (e) {
          console.error('Could not fetch user:', e);
        }
      }
    }

    // Helper to get values with fallback chain
    const pick = (k, d = "") => {
      if (args?.[k] != null) return esc(String(args[k]));
      if (fromCase?.[k] != null) return esc(String(fromCase[k]));
      if (leaseData?.[k] != null) return esc(String(leaseData[k]));
      return d;
    };

    // Build vars
    const vars = {
      caseId: mode === "case" ? String(args.caseId).slice(0, 8) : `standalone-${Date.now()}`,
      today_iso: isoDate(new Date()),
      tenant_name: pick("tenant_name") || userData?.full_name || fromCase?.user_email || "Tenant",
      landlord_name: pick("landlord_name") || "Landlord",
      property_address: pick("property_address") || "",
      contract_ref: pick("contract_ref") || (
        leaseData?.start_date 
          ? `Lease dated ${new Date(leaseData.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` 
          : "Lease Agreement"
      ),
      deposit_amount: pick("deposit_amount") || fromCase?.dispute_amount || leaseData?.deposit_amount || "",
      request_by_date_iso: safeISO(args?.request_by_date_iso || fromCase?.sla?.followup_due, 14)
    };

    // Standalone mode validation
    if (mode === "standalone" && (!args.tenant_name || !args.landlord_name)) {
      return Response.json({ 
        ok: false,
        error: 'Missing required fields: tenant_name, landlord_name' 
      }, { status: 400 });
    }

    // Compose paragraphs
    const cp = COPY[subjectRaw];
    const paragraphs_en = cp.paragraphs_en.map(s => `<p>${fill(esc(s), vars)}</p>`).join("");
    const paragraphs_th = cp.paragraphs_th.map(s => `<p>${fill(esc(s), vars)}</p>`).join("");

    const html = fill(TEMPLATE, {
      ...vars,
      subject_en: cp.subject_en,
      subject_th: cp.subject_th,
      paragraphs_en,
      paragraphs_th
    });

    // Build UTF-8 safe content for Word
    const UTF8_BOM = "\uFEFF";
    const htmlUtf8 = UTF8_BOM + html;

    // File naming
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseName = `LS-${vars.caseId}-${subjectRaw}-${stamp}`;

    // Save .doc (Word format with UTF-8)
    const docBlob = new Blob([htmlUtf8], { type: 'application/msword; charset=utf-8' });
    const docFile = new File([docBlob], `${baseName}.doc`);
    const { file_url: docUrl } = await base44.integrations.Core.UploadFile({ file: docFile });

    // Save .html for browser preview
    const htmlBlob = new Blob([htmlUtf8], { type: 'text/html; charset=utf-8' });
    const htmlFile = new File([htmlBlob], `${baseName}.html`);
    const { file_url: htmlUrl } = await base44.integrations.Core.UploadFile({ file: htmlFile });

    // Save to Document entity for vault
    const doc = await base44.entities.Document.create({
      type: 'letter',
      file_url: docUrl,
      label: `${cp.subject_en}${mode === "case" ? ` - Case ${vars.caseId}` : ''}`,
      html_content: html
    });

    // Update case if in case mode
    if (mode === "case") {
      const timeline = fromCase.timeline || [];
      timeline.push({
        timestamp: new Date().toISOString(),
        event: `letter_generated_${subjectRaw}`,
        actor: 'system',
        meta: { 
          html_url: htmlUrl, 
          doc_url: docUrl,
          subject: subjectRaw 
        }
      });

      const letters = fromCase.letters || {};
      letters[`${subjectRaw}_url`] = docUrl;           // Primary = Word file
      letters[`${subjectRaw}_html_url`] = htmlUrl;     // HTML preview
      letters.v1_url = docUrl;                          // Legacy compatibility

      await base44.asServiceRole.entities.Case.update(args.caseId, {
        status: 'ready_drafts',
        timeline,
        letters
      });
    }

    // Return success response
    return Response.json({ 
      ok: true,
      mode,
      subject: subjectRaw,
      urls: {
        doc: docUrl,
        html: htmlUrl
      },
      docId: doc.id,
      case: mode === "case" ? {
        id: fromCase.id,
        status: 'ready_drafts'
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