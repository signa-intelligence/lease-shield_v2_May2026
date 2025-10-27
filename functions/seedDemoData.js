import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const SAMPLE_LEASE_EN = `RESIDENTIAL LEASE AGREEMENT - Bangkok

PARTIES:
Landlord: Mr. Property Owner
Tenant: Demo Tenant

PROPERTY: Unit 123, Sample Condo, Sukhumvit Road, Bangkok

TERMS:
1. DEPOSIT: Tenant shall pay a security deposit equal to THREE (3) months' rent. 
   Landlord may retain deposit for ANY REASON at sole discretion.

2. REPAIRS: Tenant is responsible for ALL REPAIRS regardless of cause, including 
   structural damage, water leaks, and electrical issues.

3. EARLY TERMINATION: Any early termination by tenant forfeits ENTIRE deposit 
   with no refund or prorating.

4. LATE PAYMENT: Late payment fee of 10% per day (compounding) on any overdue amount.

5. ENTRY: Landlord may enter premises at ANY TIME without prior notice.

6. DISPUTES: All disputes shall be handled solely at landlord's chosen forum. 
   Tenant waives right to independent arbitration.

7. MAINTENANCE: Tenant pays for all maintenance including air conditioning, 
   plumbing, and building common areas.

Monthly Rent: 15,000 THB
Deposit: 45,000 THB
Term: 12 months from August 1, 2025

(Sample text for demo purposes)`;

const SAMPLE_LEASE_TH = `สัญญาเช่าที่พักอาศัย - กรุงเทพมหานคร

คู่สัญญา:
ผู้ให้เช่า: คุณเจ้าของอาคาร
ผู้เช่า: ผู้เช่าเดโม

ทรัพย์สิน: ห้องเลขที่ 456 คอนโดตัวอย่าง ถนนลาดพร้าว กรุงเทพฯ

ข้อตกลง:
1. เงินมัดจำ: ผู้เช่าต้องชำระเงินมัดจำเท่ากับค่าเช่า 3 เดือน 
   ผู้ให้เช่าสามารถหักเงินมัดจำได้ด้วยเหตุผลใดก็ได้ตามดุลยพินิจแต่เพียงผู้เดียว

2. การซ่อมแซม: ผู้เช่ารับผิดชอบค่าซ่อมแซมทั้งหมดไม่ว่ากรณีใด 
   รวมถึงความเสียหายโครงสร้าง น้ำรั่ว และระบบไฟฟ้า

3. การยกเลิกก่อนกำหนด: หากยกเลิกก่อนครบกำหนด ริบเงินมัดจำทั้งหมด 
   ไม่คืนเงินหรือคิดตามสัดส่วน

4. ค่าปรับชำระล่าช้า: ค่าปรับ 10% ต่อวัน (ทบต้น) สำหรับยอดค้างชำระ

5. การเข้าห้อง: ผู้ให้เช่าสามารถเข้าห้องได้ตลอดเวลาโดยไม่ต้องแจ้งล่วงหน้า

6. ข้อพิพาท: ข้อพิพาททั้งหมดให้ดำเนินการเฉพาะที่ศาลตามที่ผู้ให้เช่ากำหนด
   ผู้เช่าสละสิทธิ์การอนุญาโตตุลาการอิสระ

7. การบำรุงรักษา: ผู้เช่าชำระค่าบำรุงรักษาทั้งหมด รวมถึงแอร์ 
   ประปา และส่วนกลางของอาคาร

ค่าเช่ารายเดือน: 10,000 บาท
เงินมัดจำ: 30,000 บาท
ระยะเวลา: 12 เดือน เริ่ม 15 กรกฎาคม 2568

(ข้อความตัวอย่างสำหรับการสาธิต)`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();
    
    // Only admins can seed data
    if (currentUser?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const results = {
      users: [],
      deposits: [],
      leases: [],
      scans: [],
      cases: [],
      documents: []
    };

    // A) Create two demo users
    const userEn = await base44.asServiceRole.entities.User.create({
      full_name: "Demo Tenant EN",
      email: `demo.en.${Date.now()}@leaseshield.asia`,
      country: "Thailand",
      language: "en",
      subscription_status: "active",
      plan_tier: "protect"
    });
    results.users.push(userEn);

    const userTh = await base44.asServiceRole.entities.User.create({
      full_name: "ผู้เช่าเดโม TH",
      email: `demo.th.${Date.now()}@leaseshield.asia`,
      country: "Thailand",
      language: "th",
      subscription_status: "active",
      plan_tier: "lite"
    });
    results.users.push(userTh);

    // B) Seed deposit trackers
    const depositEn = await base44.asServiceRole.entities.DepositTracker.create({
      created_by: userEn.email,
      deposit_amount: 45000,
      deposit_paid_date: "2025-08-01",
      expected_return_date: "2026-08-01",
      status: "tracking",
      property_address: "Unit 123, Sample Condo, Sukhumvit",
      notes: "Seed: Standard condo - 3 months deposit"
    });
    results.deposits.push(depositEn);

    const depositTh = await base44.asServiceRole.entities.DepositTracker.create({
      created_by: userTh.email,
      deposit_amount: 30000,
      deposit_paid_date: "2025-07-15",
      expected_return_date: "2026-07-15",
      status: "tracking",
      property_address: "ห้อง 456 คอนโดตัวอย่าง ลาดพร้าว",
      notes: "Seed: Apartment - 3 เดือน"
    });
    results.deposits.push(depositTh);

    // C) Seed lease scans from inline text
    // English lease
    const leaseEn = await base44.asServiceRole.entities.Lease.create({
      created_by: userEn.email,
      file_url: "inline://seed-demo-en",
      status: "uploaded",
      language_detected: "en",
      property_address: "Unit 123, Sample Condo, Sukhumvit",
      rent_amount: 15000,
      deposit_amount: 45000,
      start_date: "2025-08-01",
      end_date: "2026-08-01"
    });
    results.leases.push(leaseEn);

    // Analyze English lease
    const analysisEn = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You analyze Thai/English residential leases for fairness and compliance.
Extract risky/illegal/unfair clauses, missing protections.

Analyze this lease:
${SAMPLE_LEASE_EN}`,
      response_json_schema: {
        type: "object",
        properties: {
          flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                evidence: { type: "string" },
                explanation: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          },
          missing_items: { type: "array", items: { type: "string" } },
          key_terms: {
            type: "object",
            properties: {
              deposit_amount: { type: "number" },
              rent_amount: { type: "number" },
              start_date: { type: "string" },
              end_date: { type: "string" }
            }
          }
        }
      }
    });

    const scoreEn = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `From flags JSON, return { "risk_score":0..100, "summary":"<=180 chars", "top_flags":[...] }
Flags: ${JSON.stringify(analysisEn.flags)}`,
      response_json_schema: {
        type: "object",
        properties: {
          risk_score: { type: "integer", minimum: 0, maximum: 100 },
          summary: { type: "string" },
          top_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string" },
                category: { type: "string" },
                description: { type: "string" }
              }
            }
          }
        }
      }
    });

    const scanEn = await base44.asServiceRole.entities.LeaseScan.create({
      lease_id: leaseEn.id,
      risk_score: scoreEn.risk_score,
      flags: scoreEn.top_flags || [],
      summary: scoreEn.summary,
      scan_preview: scoreEn,
      scan_full: analysisEn,
      version: "seed-v1"
    });
    results.scans.push(scanEn);

    await base44.asServiceRole.entities.Lease.update(leaseEn.id, { status: "scanned" });

    // Thai lease
    const leaseTh = await base44.asServiceRole.entities.Lease.create({
      created_by: userTh.email,
      file_url: "inline://seed-demo-th",
      status: "uploaded",
      language_detected: "th",
      property_address: "ห้อง 456 คอนโดตัวอย่าง ลาดพร้าว",
      rent_amount: 10000,
      deposit_amount: 30000,
      start_date: "2025-07-15",
      end_date: "2026-07-15"
    });
    results.leases.push(leaseTh);

    const analysisTh = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `คุณวิเคราะห์สัญญาเช่าที่พักอาศัยภาษาไทย/อังกฤษเพื่อหาความเป็นธรรมและการปฏิบัติตามกฎหมาย
สกัดข้อกำหนดที่มีความเสี่ยง/ผิดกฎหมาย/ไม่เป็นธรรม และการคุ้มครองที่ขาดหายไป

วิเคราะห์สัญญาเช่านี้:
${SAMPLE_LEASE_TH}`,
      response_json_schema: {
        type: "object",
        properties: {
          flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                evidence: { type: "string" },
                explanation: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          },
          missing_items: { type: "array", items: { type: "string" } },
          key_terms: {
            type: "object",
            properties: {
              deposit_amount: { type: "number" },
              rent_amount: { type: "number" },
              start_date: { type: "string" },
              end_date: { type: "string" }
            }
          }
        }
      }
    });

    const scoreTh = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `จากข้อมูล flags JSON คืนค่า { "risk_score":0..100, "summary":"<=180 อักษร", "top_flags":[...] }
Flags: ${JSON.stringify(analysisTh.flags)}`,
      response_json_schema: {
        type: "object",
        properties: {
          risk_score: { type: "integer", minimum: 0, maximum: 100 },
          summary: { type: "string" },
          top_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string" },
                category: { type: "string" },
                description: { type: "string" }
              }
            }
          }
        }
      }
    });

    const scanTh = await base44.asServiceRole.entities.LeaseScan.create({
      lease_id: leaseTh.id,
      risk_score: scoreTh.risk_score,
      flags: scoreTh.top_flags || [],
      summary: scoreTh.summary,
      scan_preview: scoreTh,
      scan_full: analysisTh,
      version: "seed-v1"
    });
    results.scans.push(scanTh);

    await base44.asServiceRole.entities.Lease.update(leaseTh.id, { status: "scanned" });

    // D) Seed Resolve cases
    const caseEn = await base44.asServiceRole.entities.Case.create({
      created_by: userEn.email,
      lease_id: leaseEn.id,
      status: "active",
      dispute_amount: 18000,
      summary: "Deposit withheld due to unspecified cleaning fees. Landlord claiming damage without evidence.",
      is_member_at_creation: true,
      success_fee_rate: 10,
      fast_track: true,
      letter_pack: true
    });
    results.cases.push(caseEn);

    const caseTh = await base44.asServiceRole.entities.Case.create({
      created_by: userTh.email,
      lease_id: leaseTh.id,
      status: "pending",
      dispute_amount: 12000,
      summary: "หักเงินมัดจำด้วยเหตุผลไม่ชัดเจน ผู้ให้เช่าอ้างค่าทำความสะอาดโดยไม่มีหลักฐาน",
      is_member_at_creation: false,
      success_fee_rate: 15,
      fast_track: false,
      letter_pack: false
    });
    results.cases.push(caseTh);

    return Response.json({ 
      success: true, 
      message: "Demo data seeded successfully",
      results: {
        users_created: results.users.length,
        deposits_created: results.deposits.length,
        leases_created: results.leases.length,
        scans_created: results.scans.length,
        cases_created: results.cases.length
      },
      demo_credentials: {
        en: { email: userEn.email, password: "Demo credentials - check email" },
        th: { email: userTh.email, password: "Demo credentials - check email" }
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});