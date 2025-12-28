import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Complete bilingual content for 6 templates
const TEMPLATE_CONTENT = {
  request_for_evidence: {
    preview_en: `Request for Evidence — Formal request for supporting documentation behind deposit deductions. Includes checklists for photos, invoices, repairs, utilities, keys, communications, and payment proof. Sets a clear deadline and asks for return of any undisputed portion.`,
    preview_th: `คำขอหลักฐานประกอบ — ขอเอกสารสนับสนุนรายการหักเงินประกันอย่างเป็นทางการ ระบุรายการหลักฐานที่ต้องส่ง (ภาพ ใบเสร็จ การซ่อม มิเตอร์ กุญแจ การสื่อสาร) พร้อมกำหนดเส้นตาย และขอคืนเงินส่วนที่ไม่มีหลักฐานทันที`,
    document_en: `Request for Evidence
[Tenant Name]
[New Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]
[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Formal Request for Evidence
Property: [Property Address]
Deposit in Dispute: [Deposit Amount] THB

Dear [Landlord Name],

Further to your claims regarding deductions from my security deposit, I request that you provide supporting documents and evidence for the items and charges you are asserting. This will help both parties review the matter clearly and fairly.

EVIDENCE REQUESTED:

1. PROPERTY CONDITION DOCUMENTATION:
☐ Signed move-in condition report (if jointly completed)
☐ Move-in photos/videos (dated [Move-In Date])
☐ Move-out photos/videos (dated [Move-Out Date])
☐ Photos showing the specific damage alleged to be tenant-caused
☐ Move-in inventory list (if applicable)
☐ Move-out inventory comparison (if applicable)

2. REPAIR & MAINTENANCE DOCUMENTATION:
☐ Invoices/receipts from contractors (not estimates only)
☐ Receipts for completed repair work with dates
☐ Quotes/estimates obtained (if applicable)
☐ Proof of payment to service providers (if available)
☐ Before/after photos of repairs (if available)
☐ Itemised breakdown of labour and materials

3. CLEANING DOCUMENTATION:
☐ Professional cleaning receipts/invoices (if claimed)
☐ Photos showing the specific issues alleged
☐ Any cleaning standard referenced in the lease (if applicable)

4. KEY & ACCESS DOCUMENTATION:
☐ Key/access replacement receipts/invoices (if claimed)
☐ Proof of replacement cost
☐ Record of keys/access items not returned (if claimed)

5. UTILITY & METER DOCUMENTATION:
☐ Move-in meter readings (electric, water, gas) with dates (if available)
☐ Move-out meter readings with dates (if available)
☐ Outstanding utility bills (if claimed)

6. WRITTEN COMMUNICATIONS:
☐ Relevant email correspondence during tenancy
☐ Relevant LINE/SMS messages during tenancy
☐ Maintenance request records (if any)
☐ Lease agreement copy

7. FINANCIAL RECORDS:
☐ Deposit payment receipt dated [Deposit Date]
☐ Rent payment history (if relevant)
☐ Any other relevant financial transactions

DELIVERY REQUIREMENTS:
Please provide the requested evidence by [Deadline Date] via:
• Preferred: Email to [Email]
• Alternative: LINE to [LINE ID]
• Alternative: Registered mail to [New Address]

For digital files, please ensure:
• Photos are high resolution and clear
• Documents are legible (PDF or image format)
• All pages of multi-page documents are included

DEADLINE & NEXT STEPS:
If complete evidence is not provided by [Deadline Date], I will treat the unsupported items as not agreed and will request return of the deposit amount that is not supported by documentation.

PARTIAL EVIDENCE:
If you can only provide evidence for some deductions, please return the portion of my deposit for which there is no supporting evidence while we discuss the remaining items.

Sincerely,

[Tenant Signature]
[Tenant Name]
CC: [Property Management Company, if applicable]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `คำขอหลักฐานประกอบ
[ชื่อผู้เช่า]
[ที่อยู่ใหม่]
[เมือง, รหัสไปรษณีย์]
[โทรศัพท์ผู้เช่า]
[อีเมลผู้เช่า]
[วันที่]

[ชื่อเจ้าของบ้าน]
[ที่อยู่เจ้าของบ้าน]
[เมือง, รหัสไปรษณีย์]

เรื่อง: ขอเอกสารและหลักฐานประกอบรายการหักเงินประกัน
ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]
เงินประกันที่มีข้อโต้แย้ง: [จำนวนเงินประกัน] บาท

เรียน [ชื่อเจ้าของบ้าน]

ตามที่ท่านแจ้งว่าจะมีการหักเงินจากเงินประกัน ข้าพเจ้าขอให้ท่านจัดส่งเอกสารและหลักฐานประกอบสำหรับรายการและค่าใช้จ่ายที่ท่านอ้าง เพื่อให้ทั้งสองฝ่ายสามารถพิจารณาข้อมูลได้อย่างชัดเจนและเป็นธรรม

หลักฐานที่ขอรับ:

1) เอกสารสภาพทรัพย์สิน:
☐ รายงานสภาพห้อง/ทรัพย์สินตอนเข้าอยู่ (ถ้ามีการทำร่วมกัน)
☐ ภาพถ่าย/วิดีโอตอนเข้าอยู่ (ลงวันที่ [วันที่เข้าอยู่])
☐ ภาพถ่าย/วิดีโอตอนย้ายออก (ลงวันที่ [วันที่ย้ายออก])
☐ ภาพที่ชี้ชัดความเสียหายตามที่อ้างว่าเกิดจากผู้เช่า
☐ รายการทรัพย์สิน/อุปกรณ์ตอนเข้าอยู่ (ถ้ามี)
☐ รายการเปรียบเทียบทรัพย์สินตอนย้ายออก (ถ้ามี)

2) เอกสารการซ่อมแซมและบำรุงรักษา:
☐ ใบแจ้งหนี้/ใบเสร็จจากผู้รับเหมา (ไม่ใช่เพียงการประเมินอย่างเดียว)
☐ หลักฐานการซ่อมเสร็จพร้อมวันที่
☐ ใบเสนอราคา/ใบประเมิน (ถ้ามี)
☐ หลักฐานการชำระเงินให้ผู้ให้บริการ (ถ้ามี)
☐ รูปก่อน–หลังการซ่อม (ถ้ามี)
☐ รายละเอียดค่าแรงและวัสดุ

3) เอกสารการทำความสะอาด:
☐ ใบเสร็จ/ใบแจ้งหนี้ค่าทำความสะอาด (หากอ้างค่าใช้จ่าย)
☐ ภาพประกอบประเด็นที่อ้าง
☐ มาตรฐาน/เงื่อนไขความสะอาดในสัญญาเช่า (ถ้ามี)

4) เอกสารกุญแจและการเข้าออก:
☐ ใบเสร็จทำกุญแจ/บัตร/รีโมท (หากอ้างค่าใช้จ่าย)
☐ หลักฐานค่าใช้จ่ายในการทำใหม่/เปลี่ยน
☐ บันทึกจำนวนกุญแจ/อุปกรณ์ที่อ้างว่าไม่ได้คืน (ถ้ามี)

5) เอกสารค่าสาธารณูปโภคและมิเตอร์:
☐ ตัวเลขมิเตอร์ตอนเข้าอยู่ (ไฟ/น้ำ/แก๊ส) พร้อมวันที่ (ถ้ามี)
☐ ตัวเลขมิเตอร์ตอนย้ายออกพร้อมวันที่ (ถ้ามี)
☐ ใบแจ้งหนี้ค้างชำระ (หากอ้าง)

6) เอกสารการสื่อสาร:
☐ อีเมลที่เกี่ยวข้องระหว่างการเช่า
☐ ข้อความ LINE/SMS ที่เกี่ยวข้อง
☐ บันทึกการแจ้งซ่อม/การขอแก้ไข (ถ้ามี)
☐ สำเนาสัญญาเช่า

7) เอกสารการเงิน:
☐ หลักฐานการชำระเงินประกัน (ลงวันที่ [วันที่ชำระเงินประกัน])
☐ ประวัติการชำระค่าเช่า (หากเกี่ยวข้อง)
☐ ธุรกรรมทางการเงินอื่น ๆ ที่เกี่ยวข้อง

วิธีการส่งเอกสาร:
กรุณาจัดส่งภายในวันที่ [กำหนดวัน] ผ่านช่องทางใดช่องทางหนึ่ง:
• อีเมล: [อีเมล]
• LINE: [LINE ID]
• ไปรษณีย์/ลงทะเบียน: [ที่อยู่ใหม่]

หมายเหตุสำหรับไฟล์ดิจิทัล:
• รูปภาพความละเอียดสูงและชัดเจน
• เอกสารอ่านได้ชัด (PDF หรือรูปภาพ)
• หากเอกสารหลายหน้า กรุณาส่งครบทุกหน้า

กำหนดเวลาและขั้นตอนถัดไป:
หากไม่สามารถส่งหลักฐานได้ครบถ้วนภายในวันที่ [กำหนดวัน] ข้าพเจ้าจะถือว่ารายการที่ไม่มีหลักฐานยังไม่เป็นที่ตกลง และจะขอคืนเงินประกันในส่วนที่ไม่มีเอกสารรองรับ

กรณีส่งได้เพียงบางส่วน:
หากท่านมีหลักฐานเพียงบางรายการ กรุณาคืนเงินประกันในส่วนที่ไม่มีหลักฐานประกอบในระหว่างที่หารือรายการที่เหลือ

ขอแสดงความนับถือ

[ลายเซ็นผู้เช่า]
[ชื่อผู้เช่า]
สำเนา: [บริษัทบริหารอาคาร/ตัวแทน (ถ้ามี)]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  property_condition_dispute: {
    preview_en: `Property Condition Dispute — Disputes alleged damage and proposed deductions. Lists move-in evidence, item-by-item disputes, and practical resolution options (joint review, neutral re-inspection, quote comparison). Sets a response deadline.`,
    preview_th: `โต้แย้งข้อกล่าวอ้างสภาพทรัพย์สิน — โต้แย้งความเสียหายที่ถูกกล่าวอ้างและการหักเงิน ระบุหลักฐานตอนเข้าอยู่ รายการโต้แย้งเป็นข้อ ๆ และแนวทางแก้ไข (ตรวจร่วม/ตรวจซ้ำ/เทียบใบเสนอราคา) พร้อมกำหนดเส้นตายให้ตอบกลับ`,
    document_en: `Property Condition Dispute
[Tenant Name]
[New Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]
[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Dispute of Property Condition Allegations
Property: [Property Address]

Dear [Landlord Name],

I am writing in response to your message dated [Claim Date] regarding the condition of the property at [Property Address]. I respectfully disagree with certain allegations and I dispute the proposed deductions as currently presented.

MOVE-IN CONDITION EVIDENCE:
At move-in on [Move-In Date], I documented the property's condition with:
• Condition report completed with [Landlord/Agent Name] dated [Report Date] (if applicable)
• Photos and/or videos taken on [Move-In Date]
• Witness present: [Witness Name] (if applicable)

This documentation indicates that some items being described as "tenant-caused damage" were already present at move-in or fall within reasonable use.

DISPUTED ITEMS (EDIT AS NEEDED):
1) [Item/Area 1 — e.g., "Living room wall scuff"]
   • Your Claim: [Landlord's claim]
   • My Position: [Pre-existing / reasonable wear / not tenant-caused]
   • Evidence: [Move-in photo/video reference, date, link or file name]

2) [Item/Area 2 — e.g., "Kitchen cabinet hinge"]
   • Your Claim: [Landlord's claim]
   • My Position: [Pre-existing / reasonable wear / not tenant-caused]
   • Evidence: [Reference]

3) [Item/Area 3]
   • Your Claim: [Landlord's claim]
   • My Position: [Your position]
   • Evidence: [Reference]

PROPOSED RESOLUTION OPTIONS:
To resolve this fairly and efficiently, I propose one of the following:
• Option 1: Joint review of move-in vs. move-out photos/videos together
• Option 2: Joint re-inspection at the property with notes agreed in writing
• Option 3: A neutral third-party inspection/assessment agreed by both parties
• Option 4: Compare your quotes with additional quotes for the same work

I am prepared to address any reasonable, well-supported items. At the same time, I cannot agree to deductions for items that were pre-existing, represent normal use, are not supported by evidence, or are not clearly explained.

REQUEST:
Please pause finalising deposit deductions until we complete one of the resolution options above. Please respond by [Deadline Date] with your preferred option and your available dates/times.

Sincerely,

[Tenant Signature]
[Tenant Name]

Enclosures (if applicable):
• Move-in report
• Move-in photos/videos
• Move-out photos/videos

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `หนังสือโต้แย้งข้อกล่าวอ้างสภาพทรัพย์สิน
[ชื่อผู้เช่า]
[ที่อยู่ใหม่]
[เมือง, รหัสไปรษณีย์]
[โทรศัพท์ผู้เช่า]
[อีเมลผู้เช่า]
[วันที่]

[ชื่อเจ้าของบ้าน]
[ที่อยู่เจ้าของบ้าน]
[เมือง, รหัสไปรษณีย์]

เรื่อง: โต้แย้งข้อกล่าวอ้างเกี่ยวกับสภาพทรัพย์สินและรายการหักเงิน
ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]

เรียน [ชื่อเจ้าของบ้าน]

ตามที่ท่านแจ้งเมื่อวันที่ [วันที่แจ้ง/วันที่กล่าวอ้าง] เกี่ยวกับสภาพทรัพย์สินที่ [ที่อยู่ทรัพย์สิน] ข้าพเจ้าขอเรียนว่าไม่เห็นด้วยกับข้อกล่าวอ้างบางส่วน และขอโต้แย้งรายการหักเงินตามที่นำเสนอในขณะนี้

หลักฐานสภาพทรัพย์สินตอนเข้าอยู่:
ในวันที่เข้าอยู่ [วันที่เข้าอยู่] ข้าพเจ้าได้บันทึกสภาพทรัพย์สินไว้ดังนี้:
• รายงานสภาพห้อง/ทรัพย์สินที่ทำร่วมกับ [ชื่อเจ้าของบ้าน/ตัวแทน] ลงวันที่ [วันที่รายงาน] (ถ้ามี)
• ภาพถ่ายและ/หรือวิดีโอถ่ายไว้วันที่ [วันที่เข้าอยู่]
• พยาน: [ชื่อพยาน] (ถ้ามี)

จากหลักฐานดังกล่าว มีบางรายการที่ถูกระบุว่าเป็น "ความเสียหายจากผู้เช่า" แต่ปรากฏว่าเป็นสภาพที่มีอยู่ก่อนแล้ว หรืออยู่ในขอบเขตการใช้งานตามปกติ

รายการที่โต้แย้ง (ปรับแก้ตามความเหมาะสม):
1) [รายการ/พื้นที่ 1 — เช่น "รอยที่ผนังห้องนั่งเล่น"]
   • ข้อกล่าวอ้างของท่าน: [ข้อความกล่าวอ้าง]
   • ข้อชี้แจงของข้าพเจ้า: [มีอยู่ก่อน / การใช้งานปกติ / ไม่ได้เกิดจากผู้เช่า]
   • หลักฐาน: [อ้างอิงภาพ/วิดีโอตอนเข้าอยู่ วันที่ ลิงก์/ชื่อไฟล์]

2) [รายการ/พื้นที่ 2 — เช่น "บานพับตู้ครัว"]
   • ข้อกล่าวอ้างของท่าน: [ข้อความกล่าวอ้าง]
   • ข้อชี้แจงของข้าพเจ้า: [มีอยู่ก่อน / การใช้งานปกติ / ไม่ได้เกิดจากผู้เช่า]
   • หลักฐาน: [อ้างอิง]

3) [รายการ/พื้นที่ 3]
   • ข้อกล่าวอ้างของท่าน: [ข้อความกล่าวอ้าง]
   • ข้อชี้แจงของข้าพเจ้า: [ข้อชี้แจง]
   • หลักฐาน: [อ้างอิง]

แนวทางเสนอเพื่อแก้ไขข้อโต้แย้ง:
เพื่อให้แก้ไขได้อย่างเป็นธรรมและรวดเร็ว ข้าพเจ้าขอเสนอหนึ่งในทางเลือกต่อไปนี้:
• ทางเลือก 1: ตรวจเปรียบเทียบภาพ/วิดีอตอนเข้าอยู่และตอนย้ายออกร่วมกัน
• ทางเลือก 2: ตรวจร่วมที่ทรัพย์สิน และสรุปบันทึกเป็นลายลักษณ์อักษร
• ทางเลือก 3: ให้มีผู้ตรวจ/ผู้ประเมินที่เป็นกลางที่ทั้งสองฝ่ายเห็นชอบ
• ทางเลือก 4: เปรียบเทียบใบเสนอราคาจากหลายแหล่งสำหรับงานเดียวกัน

ข้าพเจ้ายินดีรับผิดชอบรายการที่สมเหตุสมผลและมีข้อมูลประกอบชัดเจน อย่างไรก็ดี ข้าพเจ้าไม่สามารถยอมรับการหักเงินสำหรับรายการที่เป็นสภาพเดิม การใช้งานตามปกติ รายการที่ไม่มีหลักฐานประกอบ หรือรายการที่อธิบายไม่ชัดเจน

คำขอ:
ขอให้ท่านชะลอการสรุปรายการหักเงินประกัน จนกว่าเราจะดำเนินการตามแนวทางข้อใดข้อหนึ่งข้างต้น โปรดตอบกลับภายในวันที่ [กำหนดวัน] พร้อมแจ้งแนวทางที่ท่านเลือกและวัน/เวลาที่สะดวก

ขอแสดงความนับถือ

[ลายเซ็นผู้เช่า]
[ชื่อผู้เช่า]

เอกสารแนบ (ถ้ามี):
• รายงานสภาพตอนเข้าอยู่
• ภาพ/วิดีอตอนเข้าอยู่
• ภาพ/วิดีอตอนย้ายออก

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  pre_move_out_inspection_request: {
    preview_en: `Request for Pre Move-Out Inspection — Requests a joint inspection before handover. Offers three date/time options, proposes a checklist, asks for written confirmation of what will be considered, and requests handover details (keys, meters, deposit timeline).`,
    preview_th: `ขอตรวจสภาพก่อนย้ายออก — ขอให้ตรวจร่วมก่อนส่งมอบ เสนอวัน/เวลา 3 ตัวเลือก ระบุรายการตรวจ (ห้อง ครัว ห้องน้ำ ระบบ) ขอให้ยืนยันเป็นลายลักษณ์อักษร และขอข้อมูลขั้นตอนส่งมอบ (กุญแจ มิเตอร์ กำหนดคืนเงินประกัน)`,
    document_en: `Request for Pre-Move-Out Inspection
[Tenant Name]
[Current Property Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]
[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Request for Pre Move-Out Inspection
Property: [Property Address]
Move-Out Date: [Move-Out Date]

Dear [Landlord Name],

As I prepare to vacate the property at [Property Address] on [Move-Out Date], I would like to request a joint pre move-out inspection. The purpose is to align on property condition before final handover and to avoid misunderstandings for both parties.

PROPOSED INSPECTION DATES:
Please confirm your availability for one of the following:
• Option 1: [Date 1] at [Time 1]
• Option 2: [Date 2] at [Time 2]
• Option 3: [Date 3] at [Time 3]

If none of these work, please suggest alternatives at least [Days] days before move-out.

INSPECTION CHECKLIST (SUGGESTED):
I propose we use a joint checklist covering:
• All rooms (walls, floors, ceilings, fixtures)
• Kitchen (appliances, cabinets, sink, counters)
• Bathrooms (toilet, shower, tiles, plumbing)
• Windows, doors, locks
• Electrical and plumbing (visible issues, switches, outlets)
• Cleanliness / basic readiness for handover
• Any maintenance items already reported during tenancy

WRITTEN CONFIRMATION:
Please confirm in writing:
1) We will document findings in a short written note (or checklist) agreed at the inspection
2) Any items identified will be clearly described (location, photo if needed)
3) I will have an opportunity to address reasonable items before final move-out where practical

HANDOVER PROCEDURES:
Please also advise:
• Key/access return process (quantity: [Number])
• Utility meter reading process (electric, water, gas)
• Utility account closure/transfer steps (if applicable)
• Final handover time on [Move-Out Date]
• Deposit return process and expected timeline

FORWARDING ADDRESS / CONTACT:
[New Address]
[New City, Postal Code]
[Contact Phone]
[Contact Email]

I look forward to your confirmation and to completing the inspection together.

Sincerely,

[Tenant Signature]
[Tenant Name]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `คำขอตรวจสภาพก่อนย้ายออก
[ชื่อผู้เช่า]
[ที่อยู่ปัจจุบันของทรัพย์สิน]
[เมือง, รหัสไปรษณีย์]
[โทรศัพท์ผู้เช่า]
[อีเมลผู้เช่า]
[วันที่]

[ชื่อเจ้าของบ้าน]
[ที่อยู่เจ้าของบ้าน]
[เมือง, รหัสไปรษณีย์]

เรื่อง: ขอทำการตรวจสภาพก่อนย้ายออก
ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]
วันที่ย้ายออก: [วันที่ย้ายออก]

เรียน [ชื่อเจ้าของบ้าน]

เนื่องจากข้าพเจ้ามีกำหนดย้ายออกจากทรัพย์สินที่ [ที่อยู่ทรัพย์สิน] ในวันที่ [วันที่ย้ายออก] ข้าพเจ้าขอทำการตรวจสภาพร่วมกันก่อนย้ายออก เพื่อให้ทั้งสองฝ่ายเข้าใจตรงกันเกี่ยวกับสภาพทรัพย์สินก่อนส่งมอบ และเพื่อลดความเข้าใจคลาดเคลื่อน

วัน/เวลาที่เสนอสำหรับการตรวจ:
กรุณายืนยันวันเวลาที่สะดวกจากตัวเลือกต่อไปนี้:
• ตัวเลือก 1: [วันที่ 1] เวลา [เวลา 1]
• ตัวเลือก 2: [วันที่ 2] เวลา [เวลา 2]
• ตัวเลือก 3: [วันที่ 3] เวลา [เวลา 3]

หากไม่สะดวกตามตัวเลือกข้างต้น กรุณาเสนอวันอื่นล่วงหน้าอย่างน้อย [จำนวนวัน] วันก่อนวันย้ายออก

รายการตรวจ (ข้อเสนอ):
ขอให้ตรวจร่วมโดยใช้รายการตรวจครอบคลุม:
• ทุกห้อง (ผนัง พื้น เพดาน อุปกรณ์ติดตั้ง)
• ครัว (เครื่องใช้ไฟฟ้า ตู้ ซิงก์ เคาน์เตอร์)
• ห้องน้ำ (โถสุขภัณฑ์ ฝักบัว กระเบื้อง ระบบประปา)
• หน้าต่าง ประตู กลอน/ล็อก
• ระบบไฟและประปาที่ตรวจเห็นได้ (สวิตช์ ปลั๊ก จุดรั่ว/ซึมที่มองเห็น)
• ความสะอาด/ความพร้อมเบื้องต้นก่อนส่งมอบ
• รายการซ่อมบำรุงที่เคยแจ้งไว้ระหว่างการเช่า (ถ้ามี)

ขอให้ยืนยันเป็นลายลักษณ์อักษร:
1) จะมีการบันทึกผลการตรวจเป็นโน้ตสั้น ๆ หรือเช็กลิสต์ที่เห็นพ้องร่วมกัน
2) รายการที่พบจะระบุรายละเอียดชัดเจน (ตำแหน่ง/จุด/ภาพถ่ายหากจำเป็น)
3) ข้าพเจ้าจะมีโอกาสแก้ไข/ดำเนินการกับรายการที่สมเหตุสมผลก่อนวันย้ายออกเท่าที่ทำได้

ขั้นตอนส่งมอบ:
กรุณาแจ้งรายละเอียดเพิ่มเติมเกี่ยวกับ:
• ขั้นตอนคืนกุญแจ/บัตร/รีโมท (จำนวน: [จำนวน])
• ขั้นตอนอ่านมิเตอร์ (ไฟ/น้ำ/แก๊ส)
• การปิดหรือโอนบัญชีค่าสาธารณูปโภค (ถ้ามี)
• เวลาส่งมอบสุดท้ายในวันที่ [วันที่ย้ายออก]
• ขั้นตอนและกรอบเวลาในการคืนเงินประกัน

ที่อยู่สำหรับติดต่อ/จัดส่งหลังย้ายออก:
[ที่อยู่ใหม่]
[เมืองใหม่, รหัสไปรษณีย์]
[โทรศัพท์ติดต่อ]
[อีเมลติดต่อ]

ขอขอบคุณ และหวังว่าจะได้รับการยืนยันจากท่านเพื่อดำเนินการตรวจร่วมกัน

ขอแสดงความนับถือ

[ลายเซ็นผู้เช่า]
[ชื่อผู้เช่า]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  notice_to_vacate: {
    preview_en: `Notice to Vacate — Provides notice period and move-out date, requests a joint inspection, provides forwarding details, and requests deposit return method. Includes placeholders for bank info and key return.`,
    preview_th: `แจ้งความประสงค์ย้ายออก — แจ้งระยะเวลาแจ้งล่วงหน้าและวันย้ายออก ขอวันตรวจร่วม แจ้งที่อยู่ติดต่อหลังย้ายออก และขอคืนเงินประกันตามช่องทางที่ตกลง พร้อมข้อมูลบัญชีธนาคารและการคืนกุญแจ/บัตร`,
    document_en: `Notice to Vacate
[Tenant Name]
[Current Property Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]
[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Notice of Intent to Vacate
Property: [Property Address]
Lease Start Date: [Lease Start Date]

Dear [Landlord Name],

This letter is to provide my [Notice Period]-day notice of my intent to vacate the property at [Property Address], based on our lease agreement dated [Lease Start Date].

MOVE-OUT DETAILS:
• Intended Move-Out Date: [Move-Out Date]
• Final Rent Paid Through: [Final Rent Date]
• Notice Period: [Notice Period] days (per the lease)

REQUEST FOR FINAL INSPECTION:
I request a joint final inspection to be scheduled at least [Days] days before move-out. Please confirm available dates and times. I will aim to leave the property clean and in good condition consistent with the lease.

SECURITY DEPOSIT RETURN:
• Deposit Amount Paid: [Deposit Amount] THB (paid [Deposit Payment Date])
• Preferred Return Method: Bank transfer
• Bank Name: [Bank Name]
• Account Number: [Account Number]
• Account Name: [Account Name]
• Forwarding Address: [New Address], [New City, Postal Code]

If you believe any deductions are needed, please share an itemised breakdown with the supporting documents you are relying on (for example, clear photos and receipts/invoices), so both parties can review the basis.

KEY & ACCESS RETURN:
All keys, access cards, and parking remotes will be returned during the final inspection or on [Move-Out Date]. Quantity: [Number].

Please confirm receipt of this notice in writing and provide the proposed final inspection schedule.

Thank you for your cooperation.

Sincerely,

[Tenant Signature]
[Tenant Name]
[Contact Phone]
[Contact Email]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `หนังสือแจ้งความประสงค์ย้ายออก
[ชื่อผู้เช่า]
[ที่อยู่ปัจจุบันของทรัพย์สิน]
[เมือง, รหัสไปรษณีย์]
[โทรศัพท์ผู้เช่า]
[อีเมลผู้เช่า]
[วันที่]

[ชื่อเจ้าของบ้าน]
[ที่อยู่เจ้าของบ้าน]
[เมือง, รหัสไปรษณีย์]

เรื่อง: แจ้งความประสงค์ย้ายออก
ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]
วันเริ่มสัญญา: [วันเริ่มสัญญาเช่า]

เรียน [ชื่อเจ้าของบ้าน]

หนังสือฉบับนี้จัดทำขึ้นเพื่อแจ้งล่วงหน้า [จำนวนวันแจ้งล่วงหน้า] วัน ว่าข้าพเจ้ามีความประสงค์จะย้ายออกจากทรัพย์สินที่ [ที่อยู่ทรัพย์สิน] โดยอ้างอิงตามสัญญาเช่าลงวันที่ [วันเริ่มสัญญาเช่า]

รายละเอียดการย้ายออก:
• วันที่ตั้งใจย้ายออก: [วันที่ย้ายออก]
• ชำระค่าเช่าถึงวันที่: [วันที่ชำระถึง]
• ระยะเวลาแจ้งล่วงหน้า: [จำนวนวันแจ้งล่วงหน้า] วัน (ตามสัญญา)

ขอนัดตรวจร่วมก่อนส่งมอบ:
ข้าพเจ้าขอให้นัดตรวจร่วม (ตรวจสภาพครั้งสุดท้าย) ล่วงหน้าอย่างน้อย [จำนวนวัน] วันก่อนวันย้ายออก กรุณาแจ้งวันและเวลาที่สะดวก ข้าพเจ้าจะจัดเตรียมทรัพย์สินให้สะอาดและอยู่ในสภาพดีตามเงื่อนไขสัญญา

การคืนเงินประกัน:
• จำนวนเงินประกันที่ชำระ: [จำนวนเงินประกัน] บาท (ชำระวันที่ [วันที่ชำระเงินประกัน])
• วิธีการคืนที่ต้องการ: โอนเงินผ่านธนาคาร
• ธนาคาร: [ชื่อธนาคาร]
• เลขที่บัญชี: [เลขที่บัญชี]
• ชื่อบัญชี: [ชื่อบัญชี]
• ที่อยู่ติดต่อหลังย้ายออก: [ที่อยู่ใหม่], [เมืองใหม่, รหัสไปรษณีย์]

หากท่านเห็นว่ามีรายการที่ต้องหักเงินประกัน กรุณาจัดส่งรายละเอียดเป็นรายการ (itemised) พร้อมเอกสารประกอบที่ท่านใช้พิจารณา (เช่น ภาพถ่ายที่ชัดเจน และใบเสร็จ/ใบแจ้งหนี้) เพื่อให้ทั้งสองฝ่ายตรวจสอบได้ตรงกัน

การคืนกุญแจ/อุปกรณ์เข้าออก:
ข้าพเจ้าจะคืนกุญแจ บัตรเข้าออก และรีโมทที่เกี่ยวข้องในวันตรวจร่วม หรือในวันที่ [วันที่ย้ายออก] จำนวน: [จำนวน]

กรุณายืนยันว่าได้รับหนังสือแจ้งฉบับนี้ และแจ้งกำหนดการตรวจร่วมตามความสะดวก

ขอขอบคุณสำหรับความร่วมมือ

ขอแสดงความนับถือ

[ลายเซ็นผู้เช่า]
[ชื่อผู้เช่า]
[โทรศัพท์ติดต่อ]
[อีเมลติดต่อ]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  deposit_withholding_dispute_formal: {
    preview_en: `Formal Deposit Withholding Dispute — Final written escalation requesting either full return or a complete evidence pack by a deadline. Includes timeline, clear options, and practical next steps (mediation/complaint channels) without legal citations.`,
    preview_th: `หนังสือโต้แย้งการระงับคืนเงินประกัน — แจ้งข้อโต้แย้งอย่างเป็นทางการ ขอให้คืนเต็มจำนวนหรือส่งชุดหลักฐานครบถ้วนภายในกำหนด ระบุไทม์ไลน์ ทางเลือกในการปิดเรื่อง และขั้นตอนถัดไป (ช่องทางร้องเรียน/ไกล่เกลี่ย) โดยไม่อ้างกฎหมายหรือมาตรา`,
    document_en: `Formal Dispute of Unfair Deposit Withholding
[Tenant Name]
[New Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]
[Date]

SENT VIA: [Registered Mail / Email / Both]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: FINAL NOTICE — Security Deposit Withholding Dispute
Property: [Property Address]
Deposit Amount: [Deposit Amount] THB

Dear [Landlord Name],

This is my final written notice regarding the continued withholding of my security deposit. As of today, I have not received the deposit return, or a complete and clearly supported breakdown that both parties can review.

TIMELINE OF EVENTS:
• Lease End Date: [Lease End Date]
• Move-Out Date: [Move-Out Date]
• Keys Returned: [Handover Date]
• First Deposit Return Request: [First Request Date]
• Follow-up Request(s): [Second Request Date]
• Days Since Move-Out: [Number] days

WHAT I AM REQUESTING:
By [Final Deadline Date] (within [Days] days), please do one of the following:

OPTION 1 — FULL RETURN:
Return the full deposit amount of [Deposit Amount] THB to:
• Bank Name: [Bank Name]
• Account Number: [Account Number]
• Account Name: [Account Name]

OPTION 2 — COMPLETE DOCUMENTED DEDUCTIONS:
Provide a complete "evidence pack" covering every deduction you claim, including:
1) Itemised table of deductions (item/area, reason, amount, date)
2) Clear photos of the issue claimed (and move-in comparison if available)
3) Invoices/receipts or written quotes supporting each amount
4) Short explanation for each item so the basis is clear
5) Return of any portion not supported by documents while the remainder is discussed

PROPERTY CONDITION / HANDOVER:
I vacated the property on [Move-Out Date]. Supporting information I can provide (if needed) includes:
• Move-out photos/videos dated [Move-Out Date]
• Cleaning receipt dated [Date] (if applicable)
• Confirmation of key return on [Handover Date]

NEXT STEPS IF NOT RESOLVED:
If I do not receive either (a) full deposit return or (b) a complete evidence pack by [Final Deadline Date], I will proceed to raise this through formal dispute resolution channels and/or consumer complaint/mediation routes that are available for rental disputes.

SETTLEMENT OFFER (VALID UNTIL [Final Deadline Date]):
To close this amicably, I will accept:
• Full return of [Deposit Amount] THB by [Final Deadline Date], OR
• Documented deductions with supporting documents + immediate return of the remainder.

Please confirm in writing how you will proceed.

Sincerely,

[Tenant Signature]
[Tenant Name]
Date: [Date]

CC: [Property Management Company, if applicable]

Enclosures (if applicable):
• Timeline of correspondence
• Copy of lease agreement
• Deposit payment receipt
• Move-in and move-out evidence links/files

PROOF OF DELIVERY:
• Registered Mail Tracking: [Tracking Number]
• Email Sent: [Date/Time]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `หนังสือโต้แย้งการระงับคืนเงินประกัน (อย่างเป็นทางการ)
[ชื่อผู้เช่า]
[ที่อยู่ใหม่]
[เมือง, รหัสไปรษณีย์]
[โทรศัพท์ผู้เช่า]
[อีเมลผู้เช่า]
[วันที่]

ส่งทาง: [ไปรษณีย์ลงทะเบียน / อีเมล / ทั้งสองช่องทาง]

[ชื่อเจ้าของบ้าน]
[ที่อยู่เจ้าของบ้าน]
[เมือง, รหัสไปรษณีย์]

เรื่อง: หนังสือแจ้งครั้งสุดท้าย — โต้แย้งการระงับคืนเงินประกัน
ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]
จำนวนเงินประกัน: [จำนวนเงินประกัน] บาท

เรียน [ชื่อเจ้าของบ้าน]

หนังสือฉบับนี้เป็นหนังสือแจ้งเป็นลายลักษณ์อักษรครั้งสุดท้ายเกี่ยวกับการที่เงินประกันยังไม่ได้รับการคืน ณ วันที่จัดทำหนังสือ ข้าพเจ้ายังไม่ได้รับเงินประกันคืน หรือยังไม่ได้รับรายละเอียด/เอกสารประกอบที่ครบถ้วนและตรวจสอบได้สำหรับรายการหักเงินที่ท่านอ้าง

ไทม์ไลน์เหตุการณ์:
• วันสิ้นสุดสัญญา: [วันสิ้นสุดสัญญา]
• วันย้ายออก: [วันที่ย้ายออก]
• วันที่คืนกุญแจ: [วันที่ส่งมอบ/คืนกุญแจ]
• วันที่ขอคืนเงินประกันครั้งแรก: [วันที่ขอครั้งแรก]
• วันที่ติดตามครั้งถัดไป: [วันที่ขอครั้งที่สอง]
• จำนวนวันนับจากย้ายออก: [จำนวน] วัน

คำขอให้ดำเนินการ:
ภายในวันที่ [กำหนดเส้นตายสุดท้าย] (ภายใน [จำนวนวัน] วัน) กรุณาดำเนินการอย่างใดอย่างหนึ่งต่อไปนี้:

ทางเลือก 1 — คืนเต็มจำนวน:
โอนคืนเงินประกันจำนวน [จำนวนเงินประกัน] บาท ไปยัง:
• ธนาคาร: [ชื่อธนาคาร]
• เลขที่บัญชี: [เลขที่บัญชี]
• ชื่อบัญชี: [ชื่อบัญชี]

ทางเลือก 2 — ส่งรายละเอียดการหักเงินพร้อมเอกสารประกอบครบถ้วน:
จัดส่ง "ชุดเอกสารประกอบ" สำหรับทุกรายการหักเงินที่ท่านอ้าง ซึ่งควรรวมถึง:
1) ตารางรายการหักเงินแบบแยกรายการ (รายการ/พื้นที่ เหตุผล จำนวนเงิน วันที่)
2) ภาพถ่ายที่ชัดเจนของประเด็นที่อ้าง (และภาพเปรียบเทียบตอนเข้าอยู่ หากมี)
3) ใบเสร็จ/ใบแจ้งหนี้ หรือใบเสนอราคาที่รองรับจำนวนเงินแต่ละรายการ
4) คำอธิบายสั้น ๆ ของแต่ละรายการเพื่อให้ตรวจสอบได้ตรงกัน
5) คืนเงินในส่วนที่ไม่มีเอกสารรองรับในระหว่างที่หารือรายการที่เหลือ

สภาพทรัพย์สิน/การส่งมอบ:
ข้าพเจ้าย้ายออกในวันที่ [วันที่ย้ายออก] และสามารถจัดส่งข้อมูลประกอบ (หากจำเป็น) เช่น:
• ภาพถ่าย/วิดีอตอนย้ายออก ลงวันที่ [วันที่ย้ายออก]
• ใบเสร็จทำความสะอาด ลงวันที่ [วันที่] (ถ้ามี)
• หลักฐานการคืนกุญแจในวันที่ [วันที่คืนกุญแจ]

ขั้นตอนถัดไปหากยังไม่สามารถยุติได้:
หากภายในวันที่ [กำหนดเส้นตายสุดท้าย] ข้าพเจ้าไม่ได้รับ (ก) เงินประกันคืนเต็มจำนวน หรือ (ข) ชุดเอกสารประกอบครบถ้วน ข้าพเจ้าจะดำเนินการยกระดับผ่านช่องทางการระงับข้อพิพาท/ไกล่เกลี่ย/ช่องทางร้องเรียนของผู้บริโภคที่มีอยู่สำหรับข้อพิพาทการเช่า

ข้อเสนอเพื่อยุติเรื่องโดยสมัครใจ (ใช้ได้ถึง [กำหนดเส้นตายสุดท้าย]):
เพื่อให้ยุติเรื่องโดยสันติ ข้าพเจ้ายินดีรับ:
• คืนเงินประกันเต็มจำนวน [จำนวนเงินประกัน] บาท ภายในวันที่ [กำหนดเส้นตายสุดท้าย] หรือ
• รายการหักเงินที่มีเอกสารรองรับครบถ้วน + คืนเงินส่วนที่เหลือทันที

กรุณายืนยันเป็นลายลักษณ์อักษรว่าท่านจะดำเนินการตามทางเลือกใด

ขอแสดงความนับถือ

[ลายเซ็นผู้เช่า]
[ชื่อผู้เช่า]
วันที่: [วันที่]

สำเนา: [บริษัทบริหารอาคาร/ตัวแทน (ถ้ามี)]

เอกสารแนบ (ถ้ามี):
• ไทม์ไลน์การติดต่อสื่อสาร
• สำเนาสัญญาเช่า
• หลักฐานการชำระเงินประกัน
• ลิงก์/ไฟล์หลักฐานตอนเข้าอยู่และตอนย้ายออก

หลักฐานการจัดส่ง:
• เลขติดตามไปรษณีย์ลงทะเบียน: [Tracking Number]
• ส่งอีเมลเมื่อ: [วัน/เวลา]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  deposit_itemised_deductions: {
    preview_en: `Request for Itemised Deductions — Requests a full item-by-item table for any deposit deductions with photos and invoices/quotes. Clarifies examples of normal use vs. claimed damage. Sets a deadline and asks to return any undisputed portion.`,
    preview_th: `ขอรายละเอียดรายการหักเงินประกันแบบแยกรายการ — ขอให้ทำตารางรายการหักเงินพร้อมหลักฐาน (ภาพ ใบเสร็จ/ใบแจ้งหนี้/ใบเสนอราคา) อธิบายรายการใช้งานปกติที่ไม่ควรถูกหัก กำหนดเส้นตาย และขอคืนเงินส่วนที่ไม่เป็นข้อโต้แย้ง`,
    document_en: `Request for Itemised Deductions and Evidence
[Tenant Name]
[New Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]
[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Request for Itemised Security Deposit Deductions
Property: [Property Address]

Dear [Landlord Name],

Thank you for your communication dated [Communication Date] indicating that deductions may be made from my security deposit of [Deposit Amount] THB. To review this properly, please provide a complete itemised breakdown with supporting documents for each claimed deduction.

REQUIRED INFORMATION:
Please provide the breakdown in the following format:

| Item/Area | Reason for Deduction | Evidence (Photo/Video) | Invoice/Receipt/Quote | Amount (THB) | Date |
|----------|-----------------------|-------------------------|------------------------|--------------|------|
| [Example: Kitchen cabinet] | [Example: Broken hinge] | [Example: Photos attached] | [Example: Repair invoice] | [Example: 500] | [Example: Date] |

For each deduction, please include:
1) Specific item or area of the property
2) Clear reason for the deduction and what is being claimed
3) Supporting evidence (clear photos)
4) Copy of invoice/receipt or written quote supporting the amount
5) Amount charged (matching the supporting document)
6) Date work was completed or the quote was obtained

CLARIFICATION (NORMAL USE):
For clarity, routine use and minor marks that occur over time may not be appropriate to charge as "damage". Examples that are often treated as normal use include:
• Minor scuffs or marks from regular living
• Paint fading due to age or sunlight
• Minor scratches from ordinary furniture movement
• Worn seals/caulking due to age
• General wear in high-use areas

UNDISPUTED BALANCE:
If some deductions are documented and agreed but others are not, please return the undisputed portion of the deposit immediately to:
• Bank Name: [Bank Name]
• Account Number: [Account Number]
• Account Name: [Account Name]

DEADLINE:
Please provide the complete itemised breakdown by [Deadline Date]. If I do not receive this information by the deadline, I will request that the deposit be returned and that any unsupported deductions be removed from consideration.

I am available to discuss at [Phone] or [Email].

Sincerely,

[Tenant Signature]
[Tenant Name]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `คำขอรายละเอียดรายการหักเงินประกันแบบแยกรายการและเอกสารประกอบ
[ชื่อผู้เช่า]
[ที่อยู่ใหม่]
[เมือง, รหัสไปรษณีย์]
[โทรศัพท์ผู้เช่า]
[อีเมลผู้เช่า]
[วันที่]

[ชื่อเจ้าของบ้าน]
[ที่อยู่เจ้าของบ้าน]
[เมือง, รหัสไปรษณีย์]

เรื่อง: ขอรายละเอียดรายการหักเงินประกันแบบแยกรายการ
ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]

เรียน [ชื่อเจ้าของบ้าน]

ตามที่ท่านแจ้งเมื่อวันที่ [วันที่ติดต่อ] ว่าจะมีการหักเงินจากเงินประกันจำนวน [จำนวนเงินประกัน] บาท เพื่อให้สามารถตรวจสอบได้อย่างเหมาะสม กรุณาจัดส่งรายละเอียดรายการหักเงินแบบแยกรายการ พร้อมเอกสารประกอบสำหรับแต่ละรายการ

ข้อมูลที่ขอให้จัดส่ง:
กรุณาจัดทำรายละเอียดในรูปแบบตารางดังนี้:

| รายการ/พื้นที่ | เหตุผลการหักเงิน | หลักฐาน (ภาพ/วิดีโอ) | ใบเสร็จ/ใบแจ้งหนี้/ใบเสนอราคา | จำนวนเงิน (บาท) | วันที่ |
|---------------|-------------------|------------------------|----------------------------------|------------------|------|
| [ตัวอย่าง: ตู้ครัว] | [ตัวอย่าง: บานพับชำรุด] | [ตัวอย่าง: ภาพแนบ] | [ตัวอย่าง: ใบแจ้งหนี้ซ่อม] | [ตัวอย่าง: 500] | [ตัวอย่าง: วันที่] |

สำหรับแต่ละรายการ กรุณาระบุ:
1) รายการหรือพื้นที่ที่ชัดเจน
2) เหตุผลและรายละเอียดของสิ่งที่อ้าง
3) หลักฐานประกอบ (ภาพถ่ายที่ชัดเจน)
4) ใบเสร็จ/ใบแจ้งหนี้ หรือใบเสนอราคาที่รองรับจำนวนเงิน
5) จำนวนเงินที่เรียกเก็บ (สอดคล้องกับเอกสารประกอบ)
6) วันที่ซ่อมเสร็จ หรือวันที่ออกใบเสนอราคา

คำชี้แจง (การใช้งานตามปกติ):
เพื่อความชัดเจน การใช้งานตามปกติและร่องรอยเล็กน้อยที่เกิดขึ้นตามเวลา อาจไม่เหมาะสมที่จะถือเป็น "ความเสียหาย" ตัวอย่างที่มักถือเป็นการใช้งานทั่วไป เช่น:
• รอยเล็กน้อยจากการอยู่อาศัยตามปกติ
• สีซีดจางตามอายุหรือแสงแดด
• รอยขีดข่วนเล็กน้อยจากการขยับเฟอร์นิเจอร์ตามปกติ
• ยาแนว/ซิลิโคนเสื่อมตามอายุ
• การสึกหรอตามการใช้งานในพื้นที่ที่ใช้บ่อย

เงินส่วนที่ไม่เป็นข้อโต้แย้ง:
หากบางรายการมีเอกสารครบถ้วนและเห็นพ้องกันแล้ว แต่บางรายการยังไม่ชัดเจน กรุณาคืนเงินประกันในส่วนที่ไม่เป็นข้อโต้แย้งโดยทันทีไปยัง:
• ธนาคาร: [ชื่อธนาคาร]
• เลขที่บัญชี: [เลขที่บัญชี]
• ชื่อบัญชี: [ชื่อบัญชี]

กำหนดเวลา:
กรุณาจัดส่งรายละเอียดครบถ้วนภายในวันที่ [กำหนดวัน] หากไม่สามารถจัดส่งได้ภายในกำหนด ข้าพเจ้าจะขอให้พิจารณาคืนเงินประกัน และไม่นำรายการที่ไม่มีเอกสารรองรับมาพิจารณาหักเงิน

สามารถติดต่อเพื่อหารือได้ที่ [โทรศัพท์] หรือ [อีเมล]

ขอแสดงความนับถือ

[ลายเซ็นผู้เช่า]
[ชื่อผู้เช่า]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.access_level !== 'admin' && user.access_level !== 'super_admin')) {
      return Response.json({ 
        ok: false, 
        message: 'Unauthorized - Admin only' 
      }, { status: 403 });
    }

    console.log('[SEED_SIX] Starting bilingual seed for 6 templates...', { admin: user.email });
    
    const templates = await base44.asServiceRole.entities.TemplateLibrary.list();
    const results = [];
    let updatedCount = 0;

    for (const [template_key, content] of Object.entries(TEMPLATE_CONTENT)) {
      try {
        const existing = templates.find(t => t.template_key === template_key);
        
        if (!existing) {
          console.log(`[SEED_SIX] Template not found: ${template_key}`);
          results.push({
            template_key,
            status: 'not_found',
            message: 'Template does not exist in database'
          });
          continue;
        }

        // Build nested objects (ALWAYS objects, never strings)
        const updateData = {
          preview_content: {
            en: content.preview_en,
            th: content.preview_th
          },
          document_content: {
            en: content.document_en,
            th: content.document_th
          },
          has_english: true,
          has_thai: true,
          content_status: 'ready'
        };

        await base44.asServiceRole.entities.TemplateLibrary.update(existing.id, updateData);
        updatedCount++;

        results.push({
          template_key,
          status: 'updated',
          preview_en_length: content.preview_en.length,
          preview_th_length: content.preview_th.length,
          document_en_length: content.document_en.length,
          document_th_length: content.document_th.length
        });

        console.log(`[SEED_SIX] Updated: ${template_key} - pEN:${content.preview_en.length} pTH:${content.preview_th.length} dEN:${content.document_en.length} dTH:${content.document_th.length}`);

      } catch (error) {
        console.error(`[SEED_SIX] Error updating ${template_key}:`, error);
        results.push({
          template_key,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('[SEED_SIX] Complete:', {
      total: Object.keys(TEMPLATE_CONTENT).length,
      updatedCount
    });

    return Response.json({
      ok: true,
      message: `Successfully seeded ${updatedCount} of 6 templates`,
      updated_count: updatedCount,
      results
    });

  } catch (error) {
    console.error('[SEED_SIX] Fatal error:', error);
    return Response.json({
      ok: false,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});