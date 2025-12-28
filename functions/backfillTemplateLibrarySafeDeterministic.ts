import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Complete template content for all 15 templates - AUTHORITATIVE SOURCE
const COMPLETE_TEMPLATES = {
  pre_signing_checklist: {
    preview_en: `PRE-SIGNING CHECKLIST
Essential items to verify before signing a rental lease agreement.

Key Points:
• Property condition documentation (photos, videos)
• Lease terms review (rent, deposit, duration, utilities)
• Maintenance responsibilities and response times
• Entry notice requirements and privacy terms`,
    preview_th: `รายการตรวจสอบก่อนลงนาม
รายการสำคัญที่ต้องตรวจสอบก่อนลงนามสัญญาเช่า

จุดสำคัญ:
• บันทึกสภาพทรัพย์สิน (ภาพถ่าย วิดีโอ)
• ทบทวนเงื่อนไขสัญญา (ค่าเช่า เงินประกัน ระยะเวลา)
• ความรับผิดชอบการซ่อมบำรุงและเวลาตอบสนอง`,
    document_en: `PRE-SIGNING LEASE CHECKLIST

Use this checklist before signing your rental agreement.

PROPERTY INSPECTION
☐ Take photos/videos of walls, floors, ceilings, fixtures
☐ Document existing damage, stains, or wear
☐ Test appliances, plumbing, electrical outlets
☐ Check windows, doors, locks

LEASE TERMS
☐ Monthly Rent: [Rent Amount] THB
☐ Security Deposit: [Deposit Amount] THB
☐ Lease Duration: [Lease Start Date] to [Lease End Date]
☐ Utilities responsibility (tenant vs. landlord)

MAINTENANCE & REPAIRS
☐ Response times for urgent vs. non-urgent repairs
☐ Repair request procedures
☐ Emergency contact information

RULES & POLICIES
☐ Entry notice: [Hours] advance notice required
☐ Pet policy
☐ Noise restrictions

MOVE-IN/MOVE-OUT
☐ Move-in date: [Date]
☐ Security deposit return timeline: within [Days] days

DOCUMENTS TO RECEIVE
☐ Signed lease agreement (your copy)
☐ Receipt for security deposit
☐ Move-in condition report

Contact: [Landlord Name], [Phone], [Email]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `รายการตรวจสอบก่อนลงนามสัญญาเช่า

ใช้รายการนี้ก่อนลงนามสัญญาเช่า

การตรวจสอบทรัพย์สิน
☐ ถ่ายภาพ/วิดีโอผนัง พื้น เพดาน อุปกรณ์
☐ บันทึกความเสียหายที่มีอยู่
☐ ทดสอบเครื่องใช้ไฟฟ้า ประปา เต้าเสียบ
☐ ตรวจสอบหน้าต่าง ประตู กุญแจ

เงื่อนไขสัญญา
☐ ค่าเช่ารายเดือน: [Rent Amount] บาท
☐ เงินประกัน: [Deposit Amount] บาท
☐ ระยะเวลา: [Lease Start Date] ถึง [Lease End Date]
☐ ความรับผิดชอบสาธารณูปโภค

การซ่อมบำรุง
☐ เวลาตอบสนองการซ่อม
☐ ขั้นตอนการขอซ่อม
☐ ติดต่อฉุกเฉิน

กฎและนโยบาย
☐ การแจ้งก่อนเข้าห้อง: [Hours] ชั่วโมง
☐ นโยบายสัตว์เลี้ยง
☐ ข้อจำกัดเสียง

เอกสารที่ต้องได้รับ
☐ สัญญาลงนาม (สำเนา)
☐ ใบเสร็จเงินประกัน
☐ รายงานสภาพย้ายเข้า

ติดต่อ: [Landlord Name], [Phone], [Email]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  move_in_condition_checklist: {
    preview_en: `MOVE-IN CONDITION CHECKLIST
Document property condition at move-in to protect deposit.

Covers:
• Room-by-room inspection guide
• Photo/video documentation tips
• Joint inspection with landlord`,
    preview_th: `รายการตรวจสอบสภาพเข้าพัก
บันทึกสภาพขณะย้ายเข้าเพื่อปกป้องเงินประกัน

ครอบคลุม:
• คู่มือตรวจสอบแต่ละห้อง
• การบันทึกภาพ/วิดีโอ`,
    document_en: `MOVE-IN CONDITION CHECKLIST

Property: [Property Address]
Move-in Date: [Date]
Tenant: [Tenant Full Name]
Landlord: [Landlord Name]

Complete this checklist with landlord present. Take photos of all items.

LIVING ROOM
☐ Walls (holes, cracks, stains)
☐ Floor (scratches, damage)
☐ Windows (cracks, locks)
☐ Air conditioning

KITCHEN
☐ Cabinets
☐ Countertops
☐ Sink and faucet
☐ Appliances

BEDROOMS
☐ Walls and ceiling
☐ Closets
☐ Windows

BATHROOMS
☐ Toilet
☐ Sink
☐ Shower/bathtub
☐ Tiles

UTILITIES
☐ Electricity working
☐ Water pressure
☐ Hot water

KEYS RECEIVED
☐ Front door: [Quantity]
☐ Mailbox key
☐ Parking access

SIGNATURES
Tenant: ___________ Date: ______
Landlord: __________ Date: ______

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `รายการตรวจสอบสภาพเข้าพัก

ทรัพย์สิน: [Property Address]
วันที่: [Date]
ผู้เช่า: [Tenant Full Name]
เจ้าของ: [Landlord Name]

กรอกรายการนี้โดยมีเจ้าของบ้านอยู่ด้วย

ห้องนั่งเล่น
☐ ผนัง (รู รอยแตก)
☐ พื้น (รอยขีดข่วน)
☐ หน้าต่าง
☐ เครื่องปรับอากาศ

ห้องครัว
☐ ตู้
☐ เคาน์เตอร์
☐ อ่างล้างจาน
☐ เครื่องใช้

ห้องนอน
☐ ผนังและเพดาน
☐ ตู้เสื้อผ้า
☐ หน้าต่าง

ห้องน้ำ
☐ ชักโครก
☐ อ่างล้างหน้า
☐ ฝักบัว
☐ กระเบื้อง

สาธารณูปโภค
☐ ไฟฟ้า
☐ แรงดันน้ำ
☐ น้ำร้อน

กุญแจที่ได้รับ
☐ ประตูหน้า: [Quantity]
☐ ตู้ไปรษณีย์
☐ ที่จอดรถ

ลายเซ็น
ผู้เช่า: ___________ วันที่: ______
เจ้าของ: __________ วันที่: ______

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  move_out_preparation_checklist: {
    preview_en: `MOVE-OUT PREPARATION
Steps to prepare property for move-out and maximize deposit return.

Includes:
• Cleaning standards
• Minor repairs checklist
• Final inspection scheduling`,
    preview_th: `การเตรียมย้ายออก
ขั้นตอนเตรียมทรัพย์สินและเพิ่มโอกาสได้เงินประกันคืน

รวม:
• มาตรฐานความสะอาด
• รายการซ่อมแซม`,
    document_en: `MOVE-OUT PREPARATION CHECKLIST

Complete before final inspection.

2-4 WEEKS BEFORE
☐ Review lease move-out requirements
☐ Schedule final inspection
☐ Plan furniture removal

CLEANING CHECKLIST
Kitchen:
☐ Clean cabinets inside/out
☐ Clean oven and stove
☐ Clean refrigerator
☐ Mop floors

Bathrooms:
☐ Scrub toilet
☐ Clean sink and shower
☐ Clean tiles

Bedrooms/Living:
☐ Wipe walls
☐ Clean windows
☐ Vacuum floors

MINOR REPAIRS
☐ Replace burned light bulbs
☐ Fill nail holes
☐ Fix dripping faucets

FINAL STEPS
☐ Remove all belongings
☐ Take "after cleaning" photos
☐ Return all keys
☐ Provide forwarding address

Deposit Return:
Amount: [Deposit Amount] THB
Address: [New Address]
Bank: [Bank Name], Account: [Account Number]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `รายการเตรียมย้ายออก

ทำก่อนตรวจสอบครั้งสุดท้าย

2-4 สัปดาห์ก่อน
☐ ทบทวนข้อกำหนดย้ายออก
☐ นัดตรวจสอบ
☐ วางแผนขนย้าย

การทำความสะอาด
ห้องครัว:
☐ ทำความสะอาดตู้
☐ ทำความสะอาดเตาอบ
☐ ทำความสะอาดตู้เย็น
☐ ถูพื้น

ห้องน้ำ:
☐ ขัดชักโครก
☐ ทำความสะอาดอ่าง
☐ ทำความสะอาดกระเบื้อง

ห้องนอน:
☐ เช็ดผนัง
☐ ทำความสะอาดหน้าต่าง
☐ ดูดฝุ่น

ซ่อมแซมเล็กน้อย
☐ เปลี่ยนหลอดไฟ
☐ อุดรูตะปู
☐ ซ่อมก๊อกรั่ว

ขั้นตอนสุดท้าย
☐ ขนของทั้งหมด
☐ ถ่ายภาพหลังทำความสะอาด
☐ คืนกุญแจ
☐ ให้ที่อยู่ใหม่

คืนเงินประกัน:
จำนวน: [Deposit Amount] บาท
ที่อยู่: [New Address]
ธนาคาร: [Bank Name], บัญชี: [Account Number]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  pre_signing_negotiation: {
    preview_en: `PRE-SIGNING NEGOTIATION
Request amendments to draft lease before signing.

Covers:
• Specific amendment requests
• Justifications
• Deadline for response`,
    preview_th: `การเจรจาก่อนลงนาม
ขอแก้ไขร่างสัญญาก่อนลงนาม

ครอบคลุม:
• คำขอแก้ไข
• เหตุผล
• กำหนดตอบกลับ`,
    document_en: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Request to Amend Lease Terms
Property: [Property Address]

Dear [Landlord Name],

Thank you for the draft lease dated [Date]. I am interested in proceeding and request the following amendments:

REQUESTED CHANGES:
1. Monthly Rent: [Current Amount] → [Proposed Amount] THB
2. Security Deposit: [Current] → [Proposed] months
3. Lease Term: [Current] → [Proposed] months
4. Early Termination: [Notice Period] days notice

JUSTIFICATION:
[Brief explanation]

Please respond by [Deadline Date]. I am available at [Phone] or [Email].

Sincerely,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: ขอแก้ไขเงื่อนไขสัญญา
ทรัพย์สิน: [Property Address]

เรียน [Landlord Name]

ขอบคุณสำหรับร่างสัญญาลงวันที่ [Date] ข้าพเจ้าสนใจและขอแก้ไข:

การแก้ไขที่ขอ:
1. ค่าเช่า: [Current Amount] → [Proposed Amount] บาท
2. เงินประกัน: [Current] → [Proposed] เดือน
3. ระยะเวลา: [Current] → [Proposed] เดือน
4. ยกเลิกก่อนกำหนด: แจ้ง [Notice Period] วัน

เหตุผล:
[คำอธิบาย]

กรุณาตอบภายใน [Deadline Date] ติดต่อ [Phone] หรือ [Email]

ขอแสดงความนับถือ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  notice_intent_to_vacate: {
    preview_en: `NOTICE TO VACATE
Formal notice of intention to vacate property.

Includes:
• Move-out date
• Final inspection request
• Deposit return details`,
    preview_th: `หนังสือแจ้งย้ายออก
แจ้งความประสงค์ย้ายออก

รวม:
• วันที่ย้ายออก
• ขอตรวจสอบ
• รายละเอียดคืนเงิน`,
    document_en: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Notice of Intent to Vacate
Property: [Property Address]

Dear [Landlord Name],

This is my [Notice Period]-day notice of intent to vacate [Property Address].

MOVE-OUT DETAILS:
• Move-Out Date: [Move-out Date]
• Final Rent Paid Through: [Date]
• Notice Period: [Notice Period] days

FINAL INSPECTION:
Please schedule joint inspection at least [Days] days before move-out.

DEPOSIT RETURN:
• Amount Paid: [Deposit Amount] THB
• Forwarding Address: [New Address]
• Bank: [Bank Name], Account: [Account Number]

All keys will be returned during final inspection.

Sincerely,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: แจ้งความประสงค์ย้ายออก
ทรัพย์สิน: [Property Address]

เรียน [Landlord Name]

นี่คือการแจ้ง [Notice Period] วันถึงความประสงค์ย้ายออกจาก [Property Address]

รายละเอียด:
• วันย้ายออก: [Move-out Date]
• ชำระค่าเช่าถึง: [Date]
• แจ้งล่วงหน้า: [Notice Period] วัน

การตรวจสอบ:
กรุณานัดตรวจสอบอย่างน้อย [Days] วันก่อน

คืนเงินประกัน:
• จำนวน: [Deposit Amount] บาท
• ที่อยู่ใหม่: [New Address]
• ธนาคาร: [Bank Name], บัญชี: [Account Number]

จะคืนกุญแจเมื่อตรวจสอบ

ขอแสดงความนับถือ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  lease_amendment_request: {
    preview_en: `LEASE AMENDMENT REQUEST
Request to modify existing lease terms.

Covers:
• Current terms
• Requested changes
• Effective date`,
    preview_th: `คำขอแก้ไขสัญญา
ขอแก้ไขเงื่อนไขสัญญาเช่า

ครอบคลุม:
• เงื่อนไขปัจจุบัน
• การเปลี่ยนแปลงที่ขอ
• วันมีผล`,
    document_en: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Request to Amend Lease
Property: [Property Address]
Current Lease: [Lease Start Date] to [Lease End Date]

Dear [Landlord Name],

I request amendment to our lease agreement.

CURRENT TERMS:
• Start: [Lease Start Date]
• End: [Lease End Date]
• Rent: [Rent Amount] THB

REQUESTED CHANGES:
1. [Change Description]
   Current: [Current Terms]
   Requested: [New Terms]
   Reason: [Justification]

PROPOSED EFFECTIVE DATE: [Date]

Please respond by [Deadline Date].

Contact: [Phone], [Email]

Sincerely,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: ขอแก้ไขสัญญาเช่า
ทรัพย์สิน: [Property Address]
สัญญา: [Lease Start Date] ถึง [Lease End Date]

เรียน [Landlord Name]

ข้าพเจ้าขอแก้ไขสัญญาเช่า

เงื่อนไขปัจจุบัน:
• เริ่ม: [Lease Start Date]
• สิ้นสุด: [Lease End Date]
• ค่าเช่า: [Rent Amount] บาท

การเปลี่ยนแปลงที่ขอ:
1. [Change Description]
   ปัจจุบัน: [Current Terms]
   ขอ: [New Terms]
   เหตุผล: [Justification]

วันมีผล: [Date]

กรุณาตอบภายใน [Deadline Date]

ติดต่อ: [Phone], [Email]

ขอแสดงความนับถือ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  deposit_return_request: {
    preview_en: `DEPOSIT RETURN REQUEST
Request for security deposit return after move-out.

Includes:
• Move-out confirmation
• Condition verification
• Payment details`,
    preview_th: `คำขอคืนเงินประกัน
ขอคืนเงินประกันหลังย้ายออก

รวม:
• ยืนยันย้ายออก
• ตรวจสอบสภาพ
• รายละเอียดชำระ`,
    document_en: `[Tenant Full Name]
[New Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Security Deposit Return Request
Property: [Property Address]

Dear [Landlord Name],

I moved out on [Move-out Date] and request return of my security deposit.

DEPOSIT DETAILS:
• Amount Paid: [Deposit Amount] THB
• Date Paid: [Date]
• Move-out Date: [Move-out Date]
• Final Inspection: [Date]

PROPERTY CONDITION:
Property was cleaned and returned in good condition per lease agreement. No damage beyond normal wear.

PAYMENT REQUEST:
Please return deposit within [Days] days to:
• Bank: [Bank Name]
• Account: [Account Number]
• Name: [Account Name]

Or mail check to: [New Address]

Contact: [Phone], [Email]

Sincerely,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[New Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: ขอคืนเงินประกัน
ทรัพย์สิน: [Property Address]

เรียน [Landlord Name]

ข้าพเจ้าย้ายออกเมื่อ [Move-out Date] และขอคืนเงินประกัน

รายละเอียด:
• จำนวน: [Deposit Amount] บาท
• ชำระเมื่อ: [Date]
• ย้ายออก: [Move-out Date]
• ตรวจสอบ: [Date]

สภาพทรัพย์สิน:
ทรัพย์สินทำความสะอาดและคืนในสภาพดีตามสัญญา ไม่มีความเสียหายเกินปกติ

การชำระ:
กรุณาคืนภายใน [Days] วันไปที่:
• ธนาคาร: [Bank Name]
• บัญชี: [Account Number]
• ชื่อ: [Account Name]

หรือส่งไปรษณีย์: [New Address]

ติดต่อ: [Phone], [Email]

ขอแสดงความนับถือ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  maintenance_request: {
    preview_en: `MAINTENANCE REQUEST
Request for property repairs or maintenance.

Includes:
• Issue description
• Urgency level
• Access arrangements`,
    preview_th: `คำขอซ่อมบำรุง
ขอซ่อมแซมหรือบำรุงรักษา

รวม:
• อธิบายปัญหา
• ระดับความเร่งด่วน
• การเข้าถึง`,
    document_en: `[Tenant Full Name]
[Property Address]
[Unit No.]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Maintenance Request
Property: [Property Address], Unit: [Unit No.]

Dear [Landlord Name],

I request maintenance for the following issue:

ISSUE DESCRIPTION:
[Detailed description of problem]

LOCATION: [Specific area/room]
URGENCY: [Low / Medium / High / Emergency]
DISCOVERED: [Date]

This issue affects: [Impact on living conditions]

ACCESS:
I am available for repair access:
• Dates: [Available dates]
• Times: [Available times]
• Phone: [Phone]

Please confirm receipt and estimated repair date.

Thank you,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Unit No.]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: คำขอซ่อมบำรุง
ทรัพย์สิน: [Property Address], ห้อง: [Unit No.]

เรียน [Landlord Name]

ข้าพเจ้าขอซ่อมบำรุงปัญหาต่อไปนี้:

อธิบายปัญหา:
[รายละเอียดปัญหา]

สถานที่: [พื้นที่/ห้อง]
ความเร่งด่วน: [ต่ำ / ปานกลาง / สูง / ฉุกเฉิน]
พบเมื่อ: [Date]

ปัญหานี้กระทบ: [ผลกระทบ]

การเข้าถึง:
ข้าพเจ้าพร้อมให้เข้าซ่อม:
• วันที่: [Available dates]
• เวลา: [Available times]
• โทร: [Phone]

กรุณายืนยันและแจ้งกำหนดซ่อม

ขอขอบคุณ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  noise_complaint: {
    preview_en: `NOISE COMPLAINT
Report excessive noise disturbance.

Includes:
• Incident details
• Dates and times
• Resolution request`,
    preview_th: `รายงานเสียงรบกวน
รายงานเสียงดังรบกวน

รวม:
• รายละเอียดเหตุการณ์
• วันและเวลา
• ขอแก้ไข`,
    document_en: `[Tenant Full Name]
[Property Address]
[Unit No.]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Noise Complaint
Property: [Property Address], Unit: [Unit No.]

Dear [Landlord Name],

I am experiencing excessive noise disturbance.

DETAILS:
• Source: Unit [Unit No.] / [Description]
• Type: [Music / Voices / Construction / Other]
• Frequency: [Daily / Weekly / Occasional]

INCIDENTS:
1. Date: [Date], Time: [Time], Duration: [Hours]
2. Date: [Date], Time: [Time], Duration: [Hours]

This violates the quiet hours policy ([Hours] to [Hours]).

IMPACT:
[Effect on sleep / work / daily life]

REQUEST:
Please address this issue with the resident/source.

Contact: [Phone], [Email]

Sincerely,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Unit No.]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: รายงานเสียงรบกวน
ทรัพย์สิน: [Property Address], ห้อง: [Unit No.]

เรียน [Landlord Name]

ข้าพเจ้าประสบปัญหาเสียงดังรบกวน

รายละเอียด:
• แหล่งที่มา: ห้อง [Unit No.] / [Description]
• ประเภท: [เพลง / เสียงพูด / ก่อสร้าง / อื่นๆ]
• ความถี่: [ทุกวัน / ทุกสัปดาห์ / บางครั้ง]

เหตุการณ์:
1. วันที่: [Date], เวลา: [Time], ระยะเวลา: [Hours]
2. วันที่: [Date], เวลา: [Time], ระยะเวลา: [Hours]

ละเมิดเวลาเงียบ ([Hours] ถึง [Hours])

ผลกระทบ:
[ผลต่อการนอน / งาน / ชีวิต]

ขอ:
กรุณาแก้ไขปัญหากับผู้อยู่อาศัย

ติดต่อ: [Phone], [Email]

ขอแสดงความนับถือ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  rent_payment_confirmation: {
    preview_en: `RENT PAYMENT CONFIRMATION
Confirm rent payment details.

Includes:
• Payment amount
• Payment method
• Receipt request`,
    preview_th: `ยืนยันการชำระค่าเช่า
ยืนยันรายละเอียดการชำระ

รวม:
• จำนวนเงิน
• วิธีชำระ
• ขอใบเสร็จ`,
    document_en: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Rent Payment Confirmation
Property: [Property Address]

Dear [Landlord Name],

This confirms my rent payment.

PAYMENT DETAILS:
• Amount: [Rent Amount] THB
• Period: [Month Year]
• Date Paid: [Date]
• Method: [Bank Transfer / Cash / Check]
• Reference: [Transaction Number]

RECEIPT REQUEST:
Please provide receipt confirming payment.

Payment made to:
• Bank: [Bank Name]
• Account: [Account Number]
• Name: [Account Name]

Contact: [Phone], [Email]

Thank you,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: ยืนยันชำระค่าเช่า
ทรัพย์สิน: [Property Address]

เรียน [Landlord Name]

นี่คือยืนยันการชำระค่าเช่า

รายละเอียด:
• จำนวน: [Rent Amount] บาท
• ระยะเวลา: [Month Year]
• วันที่: [Date]
• วิธี: [โอนธนาคาร / เงินสด / เช็ค]
• อ้างอิง: [Transaction Number]

ขอใบเสร็จ:
กรุณาออกใบเสร็จยืนยัน

ชำระไปที่:
• ธนาคาร: [Bank Name]
• บัญชี: [Account Number]
• ชื่อ: [Account Name]

ติดต่อ: [Phone], [Email]

ขอขอบคุณ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  lease_renewal_request: {
    preview_en: `LEASE RENEWAL REQUEST
Request to renew existing lease.

Includes:
• Current terms
• Proposed new terms
• Renewal preferences`,
    preview_th: `คำขอต่อสัญญา
ขอต่อสัญญาเช่า

รวม:
• เงื่อนไขปัจจุบัน
• เงื่อนไขใหม่ที่เสนอ
• ความต้องการ`,
    document_en: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Lease Renewal Request
Property: [Property Address]
Current Lease: [Lease Start Date] to [Lease End Date]

Dear [Landlord Name],

I would like to renew my lease.

CURRENT TERMS:
• Rent: [Current Rent] THB/month
• Deposit: [Deposit Amount] THB
• End Date: [Lease End Date]

RENEWAL PROPOSAL:
• Start: [New Start Date]
• Duration: [Months/Years]
• Proposed Rent: [Amount] THB/month

I have been a reliable tenant and kept the property in good condition. I request renewal under current terms or with reasonable adjustment.

Please confirm by [Date] so I can plan accordingly.

Contact: [Phone], [Email]

Sincerely,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: ขอต่อสัญญาเช่า
ทรัพย์สิน: [Property Address]
สัญญา: [Lease Start Date] ถึง [Lease End Date]

เรียน [Landlord Name]

ข้าพเจ้าต้องการต่อสัญญาเช่า

เงื่อนไขปัจจุบัน:
• ค่าเช่า: [Current Rent] บาท/เดือน
• เงินประกัน: [Deposit Amount] บาท
• สิ้นสุด: [Lease End Date]

ข้อเสนอต่อสัญญา:
• เริ่ม: [New Start Date]
• ระยะเวลา: [Months/Years]
• ค่าเช่าเสนอ: [Amount] บาท/เดือน

ข้าพเจ้าเป็นผู้เช่าที่ดีและดูแลทรัพย์สินเป็นอย่างดี ขอต่อสัญญาตามเงื่อนไขปัจจุบันหรือปรับเปลี่ยนที่เหมาะสม

กรุณายืนยันภายใน [Date]

ติดต่อ: [Phone], [Email]

ขอแสดงความนับถือ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  property_damage_report: {
    preview_en: `PROPERTY DAMAGE REPORT
Report damage discovered in rental property.

Includes:
• Damage description
• Date discovered
• Photos/documentation`,
    preview_th: `รายงานความเสียหาย
รายงานความเสียหายที่พบ

รวม:
• อธิบายความเสียหาย
• วันที่พบ
• ภาพ/เอกสาร`,
    document_en: `[Tenant Full Name]
[Property Address]
[Unit No.]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Property Damage Report
Property: [Property Address], Unit: [Unit No.]

Dear [Landlord Name],

I report the following property damage.

DAMAGE DETAILS:
• Location: [Specific area/room]
• Description: [Detailed description]
• Date Discovered: [Date]
• Cause: [Natural wear / Accident / Unknown]

URGENCY: [Low / Medium / High]

This damage [was/was not] present at move-in per condition checklist dated [Date].

DOCUMENTATION:
Photos attached: [Yes/No]
Number of photos: [Quantity]

REPAIR REQUEST:
[Immediate repair needed / Can wait / Information only]

Please inspect and advise on repair timeline.

Contact: [Phone], [Email]

Sincerely,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Unit No.]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: รายงานความเสียหาย
ทรัพย์สิน: [Property Address], ห้อง: [Unit No.]

เรียน [Landlord Name]

ข้าพเจ้ารายงานความเสียหายต่อไปนี้

รายละเอียด:
• สถานที่: [พื้นที่/ห้อง]
• อธิบาย: [รายละเอียด]
• พบเมื่อ: [Date]
• สาเหตุ: [สึกหรอปกติ / อุบัติเหตุ / ไม่ทราบ]

ความเร่งด่วน: [ต่ำ / ปานกลาง / สูง]

ความเสียหายนี้ [มี/ไม่มี] ตั้งแต่ย้ายเข้าตามรายการลงวันที่ [Date]

เอกสาร:
ภาพแนบ: [ใช่/ไม่]
จำนวนภาพ: [Quantity]

ขอซ่อม:
[ซ่อมด่วน / รอได้ / แจ้งเพื่อทราบ]

กรุณาตรวจสอบและแจ้งกำหนดซ่อม

ติดต่อ: [Phone], [Email]

ขอแสดงความนับถือ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  early_termination_request: {
    preview_en: `EARLY TERMINATION REQUEST
Request to end lease before expiration.

Includes:
• Termination reason
• Proposed end date
• Settlement terms`,
    preview_th: `คำขอยกเลิกก่อนกำหนด
ขอยกเลิกสัญญาก่อนหมดอายุ

รวม:
• เหตุผลยกเลิก
• วันสิ้นสุดที่เสนอ
• เงื่อนไขชำระ`,
    document_en: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Early Lease Termination Request
Property: [Property Address]
Current Lease: [Lease Start Date] to [Lease End Date]

Dear [Landlord Name],

I request early termination of my lease.

TERMINATION DETAILS:
• Current End Date: [Lease End Date]
• Requested End Date: [New End Date]
• Reason: [Job relocation / Personal / Financial / Other]

SETTLEMENT PROPOSAL:
I understand the lease early termination clause and propose:
• Notice Period: [Days] days
• Penalty Payment: [Amount] THB (per lease terms)
• Final Rent Through: [Date]

I will ensure property is cleaned and returned in good condition. Final inspection can be scheduled [Days] days before move-out.

DEPOSIT:
Security deposit: [Deposit Amount] THB
Request return after deducting any agreed penalties.

Please confirm acceptance and final settlement amount.

Contact: [Phone], [Email]

Sincerely,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: ขอยกเลิกสัญญาก่อนกำหนด
ทรัพย์สิน: [Property Address]
สัญญา: [Lease Start Date] ถึง [Lease End Date]

เรียน [Landlord Name]

ข้าพเจ้าขอยกเลิกสัญญาก่อนกำหนด

รายละเอียด:
• สิ้นสุดปัจจุบัน: [Lease End Date]
• ขอสิ้นสุด: [New End Date]
• เหตุผล: [ย้ายงาน / ส่วนตัว / การเงิน / อื่นๆ]

ข้อเสนอชำระ:
ข้าพเจ้าเข้าใจข้อกำหนดยกเลิกก่อนกำหนดและเสนอ:
• แจ้งล่วงหน้า: [Days] วัน
• ค่าปรับ: [Amount] บาท (ตามสัญญา)
• ชำระค่าเช่าถึง: [Date]

จะทำความสะอาดและคืนสภาพดี ตรวจสอบได้ [Days] วันก่อนย้าย

เงินประกัน:
เงินประกัน: [Deposit Amount] บาท
ขอคืนหลังหักค่าปรับที่ตกลง

กรุณายืนยันและแจ้งจำนวนชำระสุดท้าย

ติดต่อ: [Phone], [Email]

ขอแสดงความนับถือ
[Tenant Full Name]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  pet_permission_request: {
    preview_en: `PET PERMISSION REQUEST
Request permission to keep pet in rental.

Includes:
• Pet details
• Responsibility agreement
• Additional deposit offer`,
    preview_th: `คำขออนุญาตเลี้ยงสัตว์
ขออนุญาตเลี้ยงสัตว์ในที่เช่า

รวม:
• รายละเอียดสัตว์
• ข้อตกลงความรับผิดชอบ
• เงินประกันเพิ่ม`,
    document_en: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

Re: Pet Permission Request
Property: [Property Address]

Dear [Landlord Name],

I request permission to keep a pet.

PET DETAILS:
• Type: [Dog / Cat / Other]
• Breed: [Breed Name]
• Name: [Pet Name]
• Age: [Age]
• Weight: [Weight] kg
• Vaccinations: Current
• Training: [House-trained / Crate-trained]

RESPONSIBILITY:
I agree to:
• Clean any pet-related damage
• Keep pet quiet and well-behaved
• Properly dispose of waste
• Not disturb neighbors
• Follow all building pet rules

ADDITIONAL DEPOSIT:
I offer additional pet deposit: [Amount] THB

References:
• Previous landlord: [Name], [Phone]
• Veterinarian: [Name], [Phone]

Please advise if permission is granted and any additional requirements.

Contact: [Phone], [Email]

Sincerely,
[Tenant Full Name]

This document is a general communication template. Review and adjust to fit your situation.`,
    document_th: `[Tenant Full Name]
[Property Address]
[Phone]
[Email]

[Date]

[Landlord Name]
[Landlord Address]

เรื่อง: ขออนุญาตเลี้ยงสัตว์
ทรัพย์สิน: [Property Address]

เรียน [Landlord Name]

ข้าพเจ้าขออนุญาตเลี้ยงสัตว์

รายละเอียดสัตว์:
• ประเภท: [สุนัข / แมว / อื่นๆ]
• สายพันธุ์: [Breed Name]
• ชื่อ: [Pet Name]
• อายุ: [Age]
• น้ำหนัก: [Weight] กก.
• ฉีดวัคซีน: ครบ
• การฝึก: [ฝึกแล้ว]

ความรับผิดชอบ:
ข้าพเจ้าตกลง:
• ทำความสะอาดความเสียหายจากสัตว์
• ดูแลไม่ให้เสียงดัง
• กำจัดของเสียอย่างเหมาะสม
• ไม่รบกวนเพื่อนบ้าน
• ปฏิบัติตามกฎอาคาร

เงินประกันเพิ่ม:
เสนอเงินประกันสัตว์: [Amount] บาท

อ้างอิง:
• เจ้าของเดิม: [Name], [Phone]
• สัตวแพทย์: [Name], [Phone]

กรุณาแจ้งผลและข้อกำหนดเพิ่มเติม

ติดต่อ: [Phone], [Email]

ขอแสดงความนับถือ
[Tenant Full Name]

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

    console.log('[TEMPLATE_BACKFILL_SAFE] Starting deterministic backfill...', { admin: user.email });
    
    const templates = await base44.asServiceRole.entities.TemplateLibrary.list();
    
    let updatedCount = 0;
    const fillDetails = {};
    const keysMissing = [];

    for (const template of templates) {
      try {
        const contentSource = COMPLETE_TEMPLATES[template.template_key];
        if (!contentSource) {
          console.log(`[TEMPLATE_BACKFILL_SAFE] No content source for: ${template.template_key}`);
          continue;
        }

        // Extract existing nested content
        const existingPreview = typeof template.preview_content === 'object' ? template.preview_content : {};
        const existingDocument = typeof template.document_content === 'object' ? template.document_content : {};
        
        const previewEn = typeof existingPreview.en === 'string' ? existingPreview.en : '';
        const previewTh = typeof existingPreview.th === 'string' ? existingPreview.th : '';
        const docEn = typeof existingDocument.en === 'string' ? existingDocument.en : '';
        const docTh = typeof existingDocument.th === 'string' ? existingDocument.th : '';

        // Determine what needs filling
        const needsPreviewEn = previewEn.trim().length < 50;
        const needsPreviewTh = previewTh.trim().length < 50;
        const needsDocEn = docEn.trim().length < 300;
        const needsDocTh = docTh.trim().length < 300;

        if (needsPreviewEn || needsPreviewTh || needsDocEn || needsDocTh) {
          const updatedPreview = { ...existingPreview };
          const updatedDocument = { ...existingDocument };
          const filled = [];

          if (needsPreviewEn && contentSource.preview_en) {
            updatedPreview.en = contentSource.preview_en;
            filled.push('preview_en');
          }
          if (needsPreviewTh && contentSource.preview_th) {
            updatedPreview.th = contentSource.preview_th;
            filled.push('preview_th');
          }
          if (needsDocEn && contentSource.document_en) {
            updatedDocument.en = contentSource.document_en;
            filled.push('document_en');
          }
          if (needsDocTh && contentSource.document_th) {
            updatedDocument.th = contentSource.document_th;
            filled.push('document_th');
          }

          if (filled.length > 0) {
            await base44.asServiceRole.entities.TemplateLibrary.update(template.id, {
              preview_content: updatedPreview,
              document_content: updatedDocument
            });
            updatedCount++;
            fillDetails[template.template_key] = filled;
          }
        }

        // Track remaining missing
        const finalPreview = typeof template.preview_content === 'object' ? template.preview_content : {};
        const finalDoc = typeof template.document_content === 'object' ? template.document_content : {};
        const finalPreviewEn = typeof finalPreview.en === 'string' ? finalPreview.en : '';
        const finalPreviewTh = typeof finalPreview.th === 'string' ? finalPreview.th : '';
        const finalDocEn = typeof finalDoc.en === 'string' ? finalDoc.en : '';
        const finalDocTh = typeof finalDoc.th === 'string' ? finalDoc.th : '';
        
        if (finalPreviewEn.trim().length < 50 || finalPreviewTh.trim().length < 50 || 
            finalDocEn.trim().length < 300 || finalDocTh.trim().length < 300) {
          keysMissing.push(template.template_key);
        }

      } catch (error) {
        console.error('[TEMPLATE_BACKFILL_SAFE] Error updating template:', template.template_key, error);
      }
    }

    console.log('[TEMPLATE_BACKFILL_SAFE] Complete:', {
      total: templates.length,
      updatedCount,
      remainingMissing: keysMissing.length,
      fillDetails
    });

    return Response.json({
      ok: true,
      total: templates.length,
      updated_count: updatedCount,
      remaining_missing: keysMissing.length,
      keys_missing: keysMissing,
      fill_details: fillDetails
    });

  } catch (error) {
    console.error('[TEMPLATE_BACKFILL_SAFE] Fatal error:', error);
    return Response.json({
      ok: false,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});