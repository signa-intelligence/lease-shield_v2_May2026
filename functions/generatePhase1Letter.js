
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Lease Shield – 10 Letters (3 Tiers)
 * One function: generatePhase1Letter
 * - Inputs: { subject, caseId?, request_by_date_iso?, ...overrides }
 * - Saves clean .doc (primary) + .html preview
 */

const SUBJECTS = new Set([
  "deposit", "deductions", "reminder",
  "dispute", "early_termination", "condition_dispute", "evidence",
  "final_opportunity", "non_compliance", "settlement"
]);

const mapKey = (s="") => ({
  deposit: "L1", deductions: "L2", reminder: "L3",
  dispute: "P1", early_termination: "P2", condition_dispute: "P3", evidence: "P4",
  final_opportunity: "S1", non_compliance: "S2", settlement: "S3"
}[s.toLowerCase()] || "");

// Tier access control - Progressive access model
const LETTER_ACCESS = {
  lite: ["deposit", "deductions", "reminder"],
  protect: ["deposit", "deductions", "reminder", "dispute", "early_termination", "condition_dispute", "evidence"],
  secure: ["deposit", "deductions", "reminder", "dispute", "early_termination", "condition_dispute", "evidence", "final_opportunity", "non_compliance", "settlement"]
};

// --- helpers
const esc = (s="") => String(s).replace(/[<&>"]/g, m => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[m]));

// --- format helper to DD-MM-YYYY
const fmtDate = (d) => {
  try {
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth()+1).padStart(2, '0')}-${now.getFullYear()}`;
  }
};
const later = (days=7) => fmtDate(Date.now() + days * 864e5);

const fill = (tpl, vars) => tpl.replace(/{{\s*([\w.]+)\s*}}/g, (_, k) => (vars[k] ?? ""));

// --- content library
const LETTER_TEMPLATES = {
  L1: {
    enSubject: "Request for Return of Security Deposit",
    thSubject: "ขอคืนเงินประกันการเช่า",
    enBody: `Dear {{landlord_name}},

I hope you're well. I'm writing about the wrap-up of my tenancy at {{property_address}} and next steps to return the security deposit of {{deposit_amount}} THB under {{contract_ref}}. Now that I've moved out and returned the keys, could we confirm the refund process? The place was left tidy and in good order, with utilities cleared, so I'm not expecting significant deductions. If there's anything you'd like me to clarify, I'm happy to help—photos, meter shots, cleaning receipts—whatever makes this simple for both of us.

To keep things transparent, could you please let me know: (1) whether any deductions are being considered and for what, (2) the refund amount, and (3) when/how the transfer will be made. If there are deductions, a short itemised note or supporting receipt is more than enough. Clear records protect both sides and avoid back-and-forth later.

If it's workable, I'd appreciate an update by {{request_by_date}} so we can close the account neatly. If you prefer a different date or method, just say—happy to accommodate.

Thank you again. I appreciate your cooperation and want to leave things on a good note.

Warm regards,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

ขอรบกวนสอบถามขั้นตอนและกำหนดเวลาการคืนเงินประกันจำนวน {{deposit_amount}} บาท สำหรับที่พัก {{property_address}} ตามสัญญา {{contract_ref}} ขณะนี้ได้ย้ายออกและส่งมอบกุญแจเรียบร้อยแล้ว ห้องอยู่ในสภาพดีและไม่มีค่าใช้จ่ายค้างชำระ

เพื่อความชัดเจน กรุณาแจ้ง (1) รายการหัก (ถ้ามี) พร้อมเหตุผลสั้น ๆ หรือหลักฐานประกอบ (2) จำนวนเงินที่จะคืน และ (3) วันที่/วิธีการโอน หากสะดวก รบกวนอัปเดตภายใน {{request_by_date}} หากต้องการข้อมูลเพิ่มเติม ยินดีจัดส่งทันที

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  L2: {
    enSubject: "Request for Itemised Deductions or Damage Report",
    thSubject: "ขอรายละเอียดการหักเงิน/ความเสียหายแบบแยกรายการ",
    enBody: `Dear {{landlord_name}},

Thanks for your note regarding potential deductions from the deposit for {{property_address}}. To make sure we're aligned, could you please share an itemised breakdown—what's being charged, why, and the amounts involved—together with any supporting receipts or quotes. Clear documentation helps both sides evaluate the costs fairly and keeps the record tidy.

I recognise normal wear-and-tear is to be expected; I'm only asking about items beyond that. If any point isn't clear, a brief explanation is perfect. Once I've reviewed the list, I'll respond quickly so we can wrap this up without delay.

If it's convenient, please send the breakdown by {{request_by_date}}. I appreciate your cooperation.

Kind regards,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

ตามที่แจ้งเรื่องการหักเงินประกันของ {{property_address}} รบกวนขอรายการหักแบบแยกรายการ พร้อมเหตุผลและเอกสารประกอบ (เช่น ใบเสร็จหรือใบเสนอราคา) เพื่อความโปร่งใสและเป็นธรรมต่อทั้งสองฝ่าย ข้าพเจ้าทราบดีว่ามีการสึกหรอตามการใช้งานปกติ จึงขอข้อมูลเฉพาะส่วนที่เกินกว่าปกติเท่านั้น

กรุณาส่งรายละเอียดภายใน {{request_by_date}} หากต้องการข้อมูลจากฝั่งข้าพเจ้าเพิ่มเติม แจ้งได้ทันที

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  L3: {
    enSubject: "Friendly Reminder: Deposit Follow-Up",
    thSubject: "ติดตามการคืนเงินประกัน",
    enBody: `Dear {{landlord_name}},

Just a quick check-in regarding the deposit for {{property_address}} under {{contract_ref}}. If you're able, could you confirm the refund amount and transfer date? If deductions are still being reviewed, an estimate or brief status is fine for now.

If {{request_by_date}} works for you as a target, great; otherwise please suggest a date that does. Thanks again for your help.

Best regards,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

ขอติดตามความคืบหน้าการคืนเงินประกันสำหรับ {{property_address}} หากยังอยู่ระหว่างตรวจสอบ สามารถแจ้งสถานะคร่าว ๆ ได้ หากสะดวกตั้งเป้าหมายภายใน {{request_by_date}} จะช่วยให้ปิดบัญชีได้เรียบร้อยขึ้น ขอบคุณมากสำหรับความร่วมมือ

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  P1: { // Formerly S1
    enSubject: "Formal Dispute of Withholding",
    thSubject: "หนังสือคัดค้านการหัก/ระงับคืนเงิน",
    enBody: `Dear {{landlord_name}},

I'm writing to formally dispute the withholding of all or part of the deposit for {{property_address}} under {{contract_ref}}. Based on the handover condition and records I have, the proposed deductions don't appear to be supported by clear evidence or fall outside normal wear-and-tear.

Please share: (1) an itemised list, (2) basis for each amount (invoice/quote), and (3) photos/notes indicating when and how the damage occurred. If a contractor's estimate is used, please include scope and rates.

I'd prefer to settle this directly. If we can't align, we could consider an independent estimate or release undisputed funds first. Kindly confirm your position by {{request_by_date}}.

Regards,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

ขอคัดค้านการระงับ/หักเงินประกันของ {{property_address}} โดยขอให้ชี้แจงรายการ ค่าใช้จ่าย และหลักฐานสนับสนุนอย่างชัดเจน หากไม่สามารถตกลงกันได้ ขอเสนอให้คืนส่วนที่ไม่มีข้อโต้แย้งก่อน และทบทวนส่วนที่เหลือร่วมกัน โดยโปรดแจ้งจุดยืนภายใน {{request_by_date}}

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  P2: { // Formerly S2
    enSubject: "Early Termination Reconciliation",
    thSubject: "ประสานงานยุติสัญญาก่อนกำหนด",
    enBody: `Dear {{landlord_name}},

This concerns the early termination at {{property_address}} under {{contract_ref}}. Please confirm: (1) any contractual fees, (2) key/possession handover steps, (3) meter/common-fee cut-offs, and (4) the final account (including the deposit). I can provide meter photos and move-out condition.

I'd like to complete this by {{request_by_date}} if possible; I'm flexible on timing.

Thank you,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

เรื่องการยุติสัญญาก่อนกำหนดของ {{property_address}} กรุณายืนยันค่าธรรมเนียมตามสัญญา ขั้นตอนส่งมอบกุญแจ วันที่ตัดยอดค่าสาธารณูปโภค/ค่าส่วนกลาง และใบสรุปยอดบัญชีสุดท้าย (รวมเงินประกัน) หากสะดวก ขอปิดบัญชีภายใน {{request_by_date}}

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  P3: { // Formerly S3
    enSubject: "Notice of Property Condition Dispute",
    thSubject: "หนังสือโต้แย้งสภาพทรัพย์สิน",
    enBody: `Dear {{landlord_name}},

After reviewing your assessment alongside my move-out photos and the check-in inventory, I don't agree that the listed items exceed fair wear-and-tear. For example: {{example_item_1}}, {{example_item_2}}, {{example_item_3}}. Costs also appear disproportionate to scope.

I'm open to reasonable evidence and alternative quotes. Please share itemised estimates or invoices so we can resolve this quickly.

Best,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

จากการตรวจสอบเอกสารและภาพถ่าย เห็นว่ารายการที่ระบุเป็นการสึกหรอตามการใช้งานปกติ หากมีหลักฐานหรือใบเสนอราคาที่ชัดเจน กรุณาส่งมาเพื่อพิจารณา ยินดีหาข้อยุติร่วมกันโดยเร็ว

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  P4: { // Formerly S4
    enSubject: "Request for Evidence or Supporting Documents",
    thSubject: "ขอหลักฐาน/เอกสารประกอบ",
    enBody: `Dear {{landlord_name}},

To complete the review for {{property_address}}, please provide supporting records for each item—receipts, work orders, photos, or contractor quotes. A concise bundle is perfect. I'll respond within two working days after receipt.

Regards,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

เพื่อพิจารณาอย่างครบถ้วน รบกวนส่งหลักฐานสำหรับแต่ละรายการ เช่น ใบเสร็จ ใบสั่งงาน รูปถ่าย หรือใบเสนอราคา เมื่อได้รับแล้วจะรีบตอบกลับภายใน 2 วันทำการ

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  S1: { // Formerly S5
    enSubject: "Final Opportunity Before Formal Action",
    thSubject: "โอกาสสุดท้ายก่อนดำเนินการต่อ",
    enBody: `Dear {{landlord_name}},

One last follow-up regarding the unresolved deposit for {{property_address}} under {{contract_ref}}. If we can confirm either the refund or an evidence-based itemised deduction by {{request_by_date}}, I'll consider the matter closed. Otherwise I'll seek external advice on next steps.

Sincerely,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

ขอติดตามเป็นครั้งสุดท้าย หากสามารถยืนยันยอดคืนหรือรายการหักพร้อมหลักฐานภายใน {{request_by_date}} จะถือว่าเสร็จสิ้น มิฉะนั้นอาจจำเป็นต้องพิจารณาดำเนินการต่อไป

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  S2: { // Formerly S6
    enSubject: "Notice of Non-Compliance (Breach of Obligations)",
    thSubject: "หนังสือแจ้งไม่ปฏิบัติตาม/ผิดสัญญา",
    enBody: `Dear {{landlord_name}},

This notice relates to {{contract_ref}} for {{property_address}}. The following appears non-compliant: {{breach_summary}}. Please remedy or clarify by {{request_by_date}}. I'm open to context; the goal is a practical, fair outcome.

Regards,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

ขอแจ้งกรณีไม่ปฏิบัติตามที่ปรากฏใน {{contract_ref}} สำหรับ {{property_address}} ได้แก่ {{breach_summary}} กรุณาแก้ไขหรือชี้แจงภายใน {{request_by_date}}

ขอแสดงความนับถือ
{{tenant_name}}`
  },
  S3: { // Formerly S7
    enSubject: "Confirmation of Settlement / Deposit Transfer",
    thSubject: "ยืนยันการชำระ/คืนเงินสำเร็จ",
    enBody: `Dear {{landlord_name}},

Thank you for confirming the transfer relating to {{property_address}}. I acknowledge receipt of {{settlement_amount}} THB on {{settlement_date}} and consider the deposit matter resolved under {{contract_ref}}.

Kind regards,
{{tenant_name}}`,
    thBody: `เรียน {{landlord_name}},

ขอขอบคุณที่ยืนยันการโอนสำหรับ {{property_address}} ได้รับเงินจำนวน {{settlement_amount}} บาท เมื่อวันที่ {{settlement_date}} ถือว่าเสร็จสิ้นตาม {{contract_ref}}

ขอแสดงความนับถือ
{{tenant_name}}`
  }
};

const TEMPLATE = `<!doctype html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style>
@page { size: A4; margin: 20mm 18mm; }
body { font-family: Inter, Arial, "Noto Sans Thai", "TH Sarabun New", sans-serif; color: #1A1D1F; font-size: 12pt; line-height: 1.65; }
.wrap { max-width: 820px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.brand { font-weight: 700; color: #0C3B2E; font-size: 16pt; letter-spacing: 0.3px; }
.meta { font-size: 10.5pt; color: #475569; border: 1px solid #E5E7EB; border-radius: 8px; padding: 10px 12px; }
.meta div { margin: 3px 0; }
h1.en { font-size: 18pt; margin: 8px 0 2px; color: #0C3B2E; }
h2.th { font-size: 15pt; margin: 0 0 14px; color: #0C3B2E; font-family: "Noto Sans Thai", "TH Sarabun New", sans-serif; }
.section { margin: 14px 0; }
p { margin: 6px 0 10px; }
.th { font-family: "Noto Sans Thai", "TH Sarabun New", sans-serif; }
hr { border: 0; border-top: 1px solid #E5E7EB; margin: 18px 0; }
.footer { margin-top: 18px; padding: 12px; background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 10.5pt; color: #475569; }
.muted { color: #64748B; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="brand">LEASE SHIELD</div>
    <div class="meta">
      <div><strong>Date:</strong> {{today_date}}</div>
      <div><strong>Case ID:</strong> {{caseId}}</div>
      <div><strong>Property:</strong> {{property_address}}</div>
    </div>
  </div>
  <h1 class="en">{{enSubject}}</h1>
  <h2 class="th">{{thSubject}}</h2>
  <div class="section">{{enHtml}}</div>
  <hr>
  <div class="section th">{{thHtml}}</div>
  <div class="footer">
    <div><strong>Contract:</strong> {{contract_ref}}</div>
    <div><strong>Requested reply by:</strong> {{request_by_date}}</div>
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
    const key = mapKey(subjectRaw);
    
    if (!key) {
      return Response.json({ 
        ok: false, 
        error: 'Invalid subject. Use: deposit, deductions, reminder, dispute, early_termination, condition_dispute, evidence, final_opportunity, non_compliance, or settlement' 
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

    // === DROP-IN ACCESS GATE ===
    const resolveTier = () => {
      // Priority: explicit arg -> case.plan -> user.plan -> default 'lite'
      const explicit = (args?.tier || args?.plan || "").toString().toLowerCase();
      if (explicit && LETTER_ACCESS[explicit]) return explicit;

      const caseTier =
        (fromCase?.plan?.toLowerCase && fromCase.plan.toLowerCase()) ||
        (fromCase?.subscription?.tier?.toLowerCase && fromCase.subscription.tier.toLowerCase()) ||
        (fromCase?.account?.tier?.toLowerCase && fromCase.account.tier.toLowerCase());

      if (caseTier && LETTER_ACCESS[caseTier]) return caseTier;

      // User tier from userData
      const userTier = (userData?.plan_tier || "").toLowerCase();
      if (userTier && LETTER_ACCESS[userTier]) return userTier;

      return "lite";
    };

    const tier = resolveTier();
    console.log(`🔐 Resolved tier: ${tier} for subject: ${subjectRaw}`);

    // Validate subject is in allowed list
    if (!LETTER_ACCESS.secure.includes(subjectRaw)) {
      return Response.json({ 
        ok: false, 
        error: `Unknown letter subject: ${subjectRaw}` 
      }, { status: 400 });
    }

    // Enforce tier access
    if (!LETTER_ACCESS[tier].includes(subjectRaw)) {
      // Determine which tier is needed
      let needed = "secure";
      if (LETTER_ACCESS.lite.includes(subjectRaw)) {
        needed = "lite";
      } else if (LETTER_ACCESS.protect.includes(subjectRaw)) {
        needed = "protect";
      }

      console.log(`❌ Access denied: tier=${tier}, subject=${subjectRaw}, needed=${needed}`);

      return Response.json({
        ok: false,
        error: `Your ${tier.toUpperCase()} plan does not include '${subjectRaw}'. Upgrade to ${needed.toUpperCase()} to use this letter.`,
        code: "LETTER_UPGRADE_REQUIRED",
        tierCurrent: tier,
        tierNeeded: needed,
        subject: subjectRaw
      }, { status: 403 });
    }

    console.log(`✅ Access granted: tier=${tier}, subject=${subjectRaw}`);

    // === END ACCESS GATE ===

    // Helper to get values with fallback chain
    const get = (k, d = "") => {
      const val = args?.[k] ?? fromCase?.[k] ?? leaseData?.[k] ?? d;
      return val ? esc(String(val)) : d;
    };

    // Build vars
    const vars = {
      caseId: mode === "case" ? String(args.caseId).slice(0, 8) : `standalone-${Date.now()}`,
      today_date: fmtDate(new Date()),
      request_by_date: args?.request_by_date_iso ? fmtDate(args.request_by_date_iso) : (fromCase?.sla?.followup_due ? fmtDate(fromCase.sla.followup_due) : later(7)),
      tenant_name: get("tenant_name") || userData?.full_name || fromCase?.user_email || "Tenant",
      landlord_name: get("landlord_name") || "Landlord",
      property_address: get("property_address") || "",
      contract_ref: get("contract_ref") || (
        leaseData?.start_date 
          ? `Lease dated ${new Date(leaseData.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` 
          : "Lease Agreement"
      ),
      deposit_amount: get("deposit_amount") || fromCase?.dispute_amount || leaseData?.deposit_amount || "",
      example_item_1: get("example_item_1") || "",
      example_item_2: get("example_item_2") || "",
      example_item_3: get("example_item_3") || "",
      breach_summary: get("breach_summary") || "",
      settlement_amount: get("settlement_amount") || "",
      settlement_date: get("settlement_date") ? fmtDate(get("settlement_date")) : ""
    };

    // Standalone mode validation
    if (mode === "standalone" && (!args.tenant_name || !args.landlord_name)) {
      return Response.json({ 
        ok: false,
        error: 'Missing required fields: tenant_name, landlord_name' 
      }, { status: 400 });
    }

    // Get letter template
    const letter = LETTER_TEMPLATES[key];
    
    // Convert body text to HTML paragraphs
    const enHtml = fill(esc(letter.enBody), vars)
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean)
      .map(p => `<p>${p}</p>`)
      .join("");
      
    const thHtml = fill(esc(letter.thBody), vars)
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean)
      .map(p => `<p>${p}</p>`)
      .join("");

    // Build final HTML
    const html = fill(TEMPLATE, {
      ...vars,
      enSubject: letter.enSubject,
      thSubject: letter.thSubject,
      enHtml,
      thHtml
    });

    // Build UTF-8 safe content for Word
    const UTF8_BOM = "\uFEFF";
    const htmlUtf8 = UTF8_BOM + html;

    // File naming
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseName = `LS-${vars.caseId}-${key}-${stamp}`;

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
      label: `${letter.enSubject}${mode === "case" ? ` - Case ${vars.caseId}` : ''}`,
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
          subject: subjectRaw,
          letter_key: key,
          tier: tier
        }
      });

      const letters = fromCase.letters || {};
      letters[`${subjectRaw}_url`] = docUrl;           // Primary = Word file
      letters[`${subjectRaw}_html_url`] = htmlUrl;     // HTML preview

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
      letter_key: key,
      tier: tier,
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
