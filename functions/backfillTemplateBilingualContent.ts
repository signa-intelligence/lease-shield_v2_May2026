import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PRIORITY_TEMPLATES = {
  pre_signing_checklist: {
    preview_en: `PRE-SIGNING CHECKLIST
Essential items to verify before signing a rental lease agreement.

Key Points:
• Property condition documentation (photos, videos)
• Lease terms review (rent, deposit, duration, utilities)
• Maintenance responsibilities and response times
• Entry notice requirements and privacy terms
• Early termination conditions and penalties
• Move-in/move-out procedures and standards`,
    preview_th: `รายการตรวจสอบก่อนลงนาม
รายการสำคัญที่ต้องตรวจสอบก่อนลงนามสัญญาเช่า

จุดสำคัญ:
• บันทึกสภาพทรัพย์สิน (ภาพถ่าย วิดีโอ)
• ทบทวนเงื่อนไขสัญญา (ค่าเช่า เงินประกัน ระยะเวลา สาธารณูปโภค)
• ความรับผิดชอบการซ่อมบำรุงและเวลาตอบสนอง
• ข้อกำหนดการแจ้งก่อนเข้าห้องและความเป็นส่วนตัว
• เงื่อนไขการยกเลิกก่อนกำหนดและค่าปรับ
• ขั้นตอนการย้ายเข้า/ย้ายออกและมาตรฐาน`,
    document_en: `PRE-SIGNING LEASE CHECKLIST

Use this checklist to protect yourself before signing a rental agreement.

PROPERTY INSPECTION
☐ Take photos/videos of entire property (walls, floors, ceilings, fixtures)
☐ Document any existing damage, stains, or wear
☐ Test all appliances, plumbing, electrical outlets
☐ Check windows, doors, locks for proper function
☐ Note any missing items from inventory list
☐ Request written condition report signed by both parties

LEASE TERMS VERIFICATION
☐ Confirm monthly rent amount: [Amount] THB
☐ Verify security deposit: [Amount] THB ([X] months rent)
☐ Check lease duration: [Start Date] to [End Date]
☐ Understand renewal terms and rent increase policies
☐ Review utilities responsibility (tenant vs. landlord)
☐ Clarify who pays for: water, electricity, internet, gas, garbage

MAINTENANCE & REPAIRS
☐ Define maintenance response times (urgent vs. non-urgent)
☐ Clarify repair request procedures
☐ Identify landlord's maintenance responsibilities
☐ Understand tenant's maintenance obligations
☐ Get emergency contact information

RULES & POLICIES
☐ Entry notice requirements: [Hours] advance notice
☐ Guest/visitor policies
☐ Pet policy (allowed/prohibited, fees, restrictions)
☐ Smoking policy
☐ Noise restrictions and quiet hours
☐ Common area usage rules

EARLY TERMINATION
☐ Notice period required: [Days] days
☐ Early termination penalties or fees
☐ Subletting policy (allowed/prohibited)
☐ Lease transfer possibilities

MOVE-IN/MOVE-OUT
☐ Move-in date and key handover procedure
☐ Move-out inspection process
☐ Property return standards (cleaning, repairs)
☐ Security deposit return timeline: within [Days] days
☐ Deduction policies for damages vs. normal wear

DOCUMENTS TO RECEIVE
☐ Signed lease agreement (your copy)
☐ Receipt for security deposit payment
☐ Receipt for first month's rent
☐ Move-in condition report (signed by both parties)
☐ Property inventory list
☐ Emergency contact information
☐ Building rules/regulations document

CONTACTS
Landlord: [Name], [Phone], [Email]
Property Manager: [Name], [Phone], [Email]
Emergency Maintenance: [Phone]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `รายการตรวจสอบก่อนลงนามสัญญาเช่า

ใช้รายการนี้เพื่อปกป้องตัวเองก่อนลงนามสัญญาเช่า

การตรวจสอบทรัพย์สิน
☐ ถ่ายภาพ/วิดีโอทรัพย์สินทั้งหมด (ผนัง พื้น เพดาน อุปกรณ์ติดตั้ง)
☐ บันทึกความเสียหาย รอยเปื้อน หรือการสึกหรอที่มีอยู่
☐ ทดสอบเครื่องใช้ไฟฟ้า ประปา เต้าเสียบไฟทั้งหมด
☐ ตรวจสอบหน้าต่าง ประตู กุญแจว่าใช้งานได้ปกติ
☐ บันทึกสิ่งของที่ขาดหายจากรายการสิ่งของ
☐ ขอรายงานสภาพเป็นลายลักษณ์อักษรที่ทั้งสองฝ่ายลงนาม

การตรวจสอบเงื่อนไขสัญญา
☐ ยืนยันค่าเช่ารายเดือน: [จำนวนเงิน] บาท
☐ ตรวจสอบเงินประกัน: [จำนวนเงิน] บาท ([X] เดือน)
☐ ตรวจสอบระยะเวลาสัญญา: [วันเริ่ม] ถึง [วันสิ้นสุด]
☐ เข้าใจเงื่อนไขการต่อสัญญาและนโยบายการขึ้นค่าเช่า
☐ ทบทวนความรับผิดชอบค่าสาธารณูปโภค (ผู้เช่า vs. เจ้าของ)
☐ ชี้แจงว่าใครจ่าย: น้ำ ไฟฟ้า อินเทอร์เน็ต แก๊ส ขยะ

การซ่อมบำรุงและซ่อมแซม
☐ กำหนดเวลาตอบสนองการซ่อมบำรุง (เร่งด่วน vs. ไม่เร่งด่วน)
☐ ชี้แจงขั้นตอนการขอซ่อม
☐ ระบุความรับผิดชอบการซ่อมบำรุงของเจ้าของ
☐ เข้าใจภาระผู้เช่าในการดูแลรักษา
☐ รับข้อมูลติดต่อฉุกเฉิน

กฎและนโยบาย
☐ ข้อกำหนดการแจ้งก่อนเข้าห้อง: [จำนวนชั่วโมง] ล่วงหน้า
☐ นโยบายแขก/ผู้มาเยือน
☐ นโยบายสัตว์เลี้ยง (อนุญาต/ห้าม, ค่าธรรมเนียม, ข้อจำกัด)
☐ นโยบายการสูบบุหรี่
☐ ข้อจำกัดเสียงรบกวนและช่วงเวลาเงียบ
☐ กฎการใช้พื้นที่ส่วนกลาง

การยกเลิกก่อนกำหนด
☐ ระยะเวลาแจ้งล่วงหน้า: [จำนวนวัน] วัน
☐ ค่าปรับหรือค่าธรรมเนียมการยกเลิกก่อนกำหนด
☐ นโยบายการให้เช่าช่วง (อนุญาต/ห้าม)
☐ ความเป็นไปได้ในการโอนสัญญา

การย้ายเข้า/ย้ายออก
☐ วันย้ายเข้าและขั้นตอนการรับกุญแจ
☐ กระบวนการตรวจสอบย้ายออก
☐ มาตรฐานการคืนทรัพย์สิน (ทำความสะอาด ซ่อมแซม)
☐ กำหนดเวลาคืนเงินประกัน: ภายใน [จำนวนวัน] วัน
☐ นโยบายการหักเงินสำหรับความเสียหาย vs. การสึกหรอปกติ

เอกสารที่ต้องได้รับ
☐ สัญญาเช่าที่ลงนามแล้ว (สำเนาของคุณ)
☐ ใบเสร็จการชำระเงินประกัน
☐ ใบเสร็จค่าเช่าเดือนแรก
☐ รายงานสภาพย้ายเข้า (ลงนามโดยทั้งสองฝ่าย)
☐ รายการสิ่งของในทรัพย์สิน
☐ ข้อมูลติดต่อฉุกเฉิน
☐ เอกสารกฎ/ระเบียบอาคาร

รายชื่อติดต่อ
เจ้าของบ้าน: [ชื่อ], [โทรศัพท์], [อีเมล]
ผู้จัดการทรัพย์สิน: [ชื่อ], [โทรศัพท์], [อีเมล]
ซ่อมบำรุงฉุกเฉิน: [โทรศัพท์]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  move_in_condition_checklist: {
    preview_en: `MOVE-IN CONDITION CHECKLIST
Document property condition at move-in to protect your security deposit.

Covers:
• Room-by-room inspection guide
• Photo/video documentation tips
• Common issues to note (damage, cleanliness, functionality)
• Joint inspection process with landlord
• Signature requirements`,
    preview_th: `รายการตรวจสอบสภาพเข้าพัก
บันทึกสภาพทรัพย์สินขณะย้ายเข้าเพื่อปกป้องเงินประกัน

ครอบคลุม:
• คู่มือตรวจสอบแต่ละห้อง
• เคล็ดลับการบันทึกภาพ/วิดีโอ
• ปัญหาทั่วไปที่ต้องบันทึก (ความเสียหาย ความสะอาด การทำงาน)
• กระบวนการตรวจสอบร่วมกับเจ้าของบ้าน
• ข้อกำหนดการลงนาม`,
    document_en: `MOVE-IN CONDITION CHECKLIST

Property: [Property Address]
Unit: [Unit Number]
Move-in Date: [Date]
Tenant: [Tenant Name]
Landlord: [Landlord Name]

INSTRUCTIONS
Complete this checklist on move-in day with the landlord present. Take photos/videos of all noted items. Both parties must sign at the end.

LIVING ROOM
☐ Walls (check for: holes, cracks, stains, marks)
☐ Ceiling (check for: water stains, cracks)
☐ Floor (check for: scratches, stains, damage)
☐ Windows (check for: cracks, function, locks)
☐ Doors (check for: damage, function, locks)
☐ Light fixtures (check for: function, damage)
☐ Electrical outlets (check for: function, damage)
☐ Air conditioning (check for: function, cleanliness)
Notes: _________________________________

KITCHEN
☐ Cabinets (check for: damage, cleanliness, function)
☐ Countertops (check for: stains, cracks, burns)
☐ Sink (check for: leaks, stains, drainage)
☐ Faucet (check for: leaks, function)
☐ Stove/cooktop (check for: function, cleanliness)
☐ Refrigerator (check for: function, cleanliness, seals)
☐ Microwave (if provided) (check for: function, cleanliness)
☐ Ventilation/exhaust fan (check for: function)
Notes: _________________________________

BEDROOMS
☐ Walls (check for: holes, cracks, stains)
☐ Ceiling (check for: water stains, cracks)
☐ Floor (check for: scratches, stains)
☐ Closets (check for: doors, shelves, rods, cleanliness)
☐ Windows (check for: function, locks)
☐ Light fixtures (check for: function)
☐ Electrical outlets (check for: function)
☐ Air conditioning (check for: function)
Notes: _________________________________

BATHROOMS
☐ Toilet (check for: leaks, flush function, cracks)
☐ Sink (check for: leaks, drainage, stains)
☐ Shower/bathtub (check for: leaks, drainage, caulking, tiles)
☐ Faucets (check for: leaks, function, hot water)
☐ Mirror (check for: cracks, mounting)
☐ Cabinets (check for: function, damage)
☐ Ventilation (check for: function)
☐ Tiles/walls (check for: cracks, water damage, mold)
Notes: _________________________________

GENERAL PROPERTY
☐ Balcony/patio (check for: safety, cleanliness, damage)
☐ Entry door (check for: locks, peephole, function)
☐ Mailbox (check for: function, keys provided)
☐ Parking space (check for: condition, number)
☐ Storage area (check for: condition, cleanliness)
☐ Overall cleanliness (check for: acceptable standard)
Notes: _________________________________

APPLIANCES & FIXTURES
☐ Water heater (check for: function, temperature)
☐ Washing machine (if provided) (check for: function)
☐ Dryer (if provided) (check for: function)
☐ Other: _______________
Notes: _________________________________

UTILITIES & SERVICES
☐ Electricity working in all areas
☐ Water pressure adequate
☐ Hot water functioning
☐ Internet connection points (if applicable)
☐ TV cable points (if applicable)
☐ Gas connection (if applicable)
Notes: _________________________________

KEYS & ACCESS
☐ Front door keys received: [Quantity]
☐ Mailbox key received: [Yes/No]
☐ Parking remote/card received: [Yes/No]
☐ Building access card received: [Yes/No]
☐ Other keys: _______________

METER READINGS (Record on Move-In)
• Electric Meter: [Reading]
• Water Meter: [Reading]
• Gas Meter (if applicable): [Reading]

SIGNATURES
I confirm that this checklist accurately represents the property condition on move-in date.

Tenant Signature: ___________________ Date: ________
Tenant Name: [Print Name]

Landlord Signature: _________________ Date: ________
Landlord Name: [Print Name]

Photos/Videos: Attached [Yes/No]
Total Photos Taken: _______

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `รายการตรวจสอบสภาพเข้าพัก

ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]
ห้อง: [หมายเลขห้อง]
วันที่เข้าพัก: [วันที่]
ผู้เช่า: [ชื่อผู้เช่า]
เจ้าของบ้าน: [ชื่อเจ้าของบ้าน]

คำแนะนำ
กรอกรายการนี้ในวันย้ายเข้าโดยมีเจ้าของบ้านอยู่ด้วย ถ่ายภาพ/วิดีโอรายการที่บันทึกทั้งหมด ทั้งสองฝ่ายต้องลงนามในตอนท้าย

ห้องนั่งเล่น
☐ ผนัง (ตรวจสอบ: รู รอยแตก รอยเปื้อน รอยขีดข่วน)
☐ เพดาน (ตรวจสอบ: รอยน้ำรั่ว รอยแตก)
☐ พื้น (ตรวจสอบ: รอยขีดข่วน รอยเปื้อน ความเสียหาย)
☐ หน้าต่าง (ตรวจสอบ: รอยแตก การทำงาน กุญแจ)
☐ ประตู (ตรวจสอบ: ความเสียหาย การทำงาน กุญแจ)
☐ โคมไฟ (ตรวจสอบ: การทำงาน ความเสียหาย)
☐ เต้าเสียบไฟ (ตรวจสอบ: การทำงาน ความเสียหาย)
☐ เครื่องปรับอากาศ (ตรวจสอบ: การทำงาน ความสะอาด)
หมายเหตุ: _________________________________

ห้องครัว
☐ ตู้ (ตรวจสอบ: ความเสียหาย ความสะอาด การทำงาน)
☐ เคาน์เตอร์ (ตรวจสอบ: รอยเปื้อน รอยแตก รอยไหม้)
☐ อ่างล้างจาน (ตรวจสอบ: การรั่ว รอยเปื้อน การระบายน้ำ)
☐ ก๊อกน้ำ (ตรวจสอบ: การรั่ว การทำงาน)
☐ เตา/เตาแก๊ส (ตรวจสอบ: การทำงาน ความสะอาด)
☐ ตู้เย็น (ตรวจสอบ: การทำงาน ความสะอาด ยางซีล)
☐ ไมโครเวฟ (ถ้ามี) (ตรวจสอบ: การทำงาน ความสะอาด)
☐ พัดลมระบายอากาศ (ตรวจสอบ: การทำงาน)
หมายเหตุ: _________________________________

ห้องนอน
☐ ผนัง (ตรวจสอบ: รู รอยแตก รอยเปื้อน)
☐ เพดาน (ตรวจสอบ: รอยน้ำรั่ว รอยแตก)
☐ พื้น (ตรวจสอบ: รอยขีดข่วน รอยเปื้อน)
☐ ตู้เสื้อผ้า (ตรวจสอบ: ประตู ชั้นวาง ราวแขวน ความสะอาด)
☐ หน้าต่าง (ตรวจสอบ: การทำงาน กุญแจ)
☐ โคมไฟ (ตรวจสอบ: การทำงาน)
☐ เต้าเสียบไฟ (ตรวจสอบ: การทำงาน)
☐ เครื่องปรับอากาศ (ตรวจสอบ: การทำงาน)
หมายเหตุ: _________________________________

ห้องน้ำ
☐ ชักโครก (ตรวจสอบ: การรั่ว การชักโครก รอยแตก)
☐ อ่างล้างหน้า (ตรวจสอบ: การรั่ว การระบายน้ำ รอยเปื้อน)
☐ ฝักบัว/อ่างอาบน้ำ (ตรวจสอบ: การรั่ว การระบายน้ำ ยาแนว กระเบื้อง)
☐ ก๊อกน้ำ (ตรวจสอบ: การรั่ว การทำงาน น้ำร้อน)
☐ กระจก (ตรวจสอบ: รอยแตก การติดตั้ง)
☐ ตู้ (ตรวจสอบ: การทำงาน ความเสียหาย)
☐ พัดลมระบายอากาศ (ตรวจสอบ: การทำงาน)
☐ กระเบื้อง/ผนัง (ตรวจสอบ: รอยแตก ความเสียหายจากน้ำ รา)
หมายเหตุ: _________________________________

ทั่วไป
☐ ระเบียง/ลานหน้าบ้าน (ตรวจสอบ: ความปลอดภัย ความสะอาด ความเสียหาย)
☐ ประตูทางเข้า (ตรวจสอบ: กุญแจ ช่องมองผ่าน การทำงาน)
☐ ตู้ไปรษณีย์ (ตรวจสอบ: การทำงาน รับกุญแจแล้ว)
☐ ที่จอดรถ (ตรวจสอบ: สภาพ หมายเลข)
☐ พื้นที่เก็บของ (ตรวจสอบ: สภาพ ความสะอาด)
☐ ความสะอาดโดยรวม (ตรวจสอบ: มาตรฐานที่ยอมรับได้)
หมายเหตุ: _________________________________

เครื่องใช้และอุปกรณ์
☐ เครื่องทำน้ำอุ่น (ตรวจสอบ: การทำงาน อุณหภูมิ)
☐ เครื่องซักผ้า (ถ้ามี) (ตรวจสอบ: การทำงาน)
☐ เครื่องอบผ้า (ถ้ามี) (ตรวจสอบ: การทำงาน)
☐ อื่นๆ: _______________
หมายเหตุ: _________________________________

สาธารณูปโภคและบริการ
☐ ไฟฟ้าทำงานในทุกพื้นที่
☐ แรงดันน้ำเพียงพอ
☐ น้ำร้อนทำงาน
☐ จุดต่ออินเทอร์เน็ต (ถ้ามี)
☐ จุดต่อเคเบิลทีวี (ถ้ามี)
☐ การต่อแก๊ส (ถ้ามี)
หมายเหตุ: _________________________________

กุญแจและการเข้าถึง
☐ กุญแจประตูหน้าที่ได้รับ: [จำนวน]
☐ กุญแจตู้ไปรษณีย์ที่ได้รับ: [ใช่/ไม่ใช่]
☐ รีโมท/บัตรที่จอดรถที่ได้รับ: [ใช่/ไม่ใช่]
☐ บัตรผ่านอาคารที่ได้รับ: [ใช่/ไม่ใช่]
☐ กุญแจอื่นๆ: _______________

การอ่านมิเตอร์ (บันทึกเมื่อย้ายเข้า)
• มิเตอร์ไฟฟ้า: [ค่าอ่าน]
• มิเตอร์น้ำ: [ค่าอ่าน]
• มิเตอร์แก๊ส (ถ้ามี): [ค่าอ่าน]

ลายเซ็น
ข้าพเจ้ายืนยันว่ารายการนี้แสดงสภาพทรัพย์สินในวันย้ายเข้าได้อย่างถูกต้อง

ลายเซ็นผู้เช่า: ___________________ วันที่: ________
ชื่อผู้เช่า: [พิมพ์ชื่อ]

ลายเซ็นเจ้าของบ้าน: _________________ วันที่: ________
ชื่อเจ้าของบ้าน: [พิมพ์ชื่อ]

ภาพถ่าย/วิดีโอ: แนบแล้ว [ใช่/ไม่ใช่]
จำนวนภาพถ่ายทั้งหมด: _______

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  move_out_preparation_checklist: {
    preview_en: `MOVE-OUT PREPARATION CHECKLIST
Steps to prepare property for move-out and maximize security deposit return.

Includes:
• Cleaning standards and requirements
• Minor repairs tenants should address
• Final inspection scheduling
• Utilities transfer/closure procedures
• Key and access card return process`,
    preview_th: `รายการเตรียมการย้ายออก
ขั้นตอนเตรียมทรัพย์สินสำหรับย้ายออกและเพิ่มโอกาสได้รับเงินประกันคืน

รวมถึง:
• มาตรฐานและข้อกำหนดการทำความสะอาด
• การซ่อมแซมเล็กน้อยที่ผู้เช่าควรจัดการ
• การนัดหมายตรวจสอบครั้งสุดท้าย
• ขั้นตอนการโอน/ปิดสาธารณูปโภค
• กระบวนการคืนกุญแจและบัตรผ่าน`,
    document_en: `MOVE-OUT PREPARATION CHECKLIST

Complete these tasks before your final move-out inspection to help ensure full security deposit return.

2-4 WEEKS BEFORE MOVE-OUT
☐ Review lease for move-out requirements
☐ Schedule final inspection with landlord (at least [X] days advance)
☐ Notify utility companies of move-out date
☐ Arrange for mail forwarding
☐ Plan furniture removal and cleaning schedule
☐ Take "before cleaning" photos for your records

1 WEEK BEFORE MOVE-OUT
☐ Begin deep cleaning process
☐ Address any minor repairs needed
☐ Test all appliances and fixtures
☐ Confirm final inspection date and time
☐ Prepare forwarding address for deposit return

CLEANING CHECKLIST

Kitchen
☐ Clean inside and outside of all cabinets
☐ Clean oven, stove, and range hood (remove grease)
☐ Clean refrigerator inside and out (remove shelves, defrost)
☐ Clean microwave inside and out
☐ Clean countertops and backsplash
☐ Clean sink and faucet (remove limescale)
☐ Sweep and mop floors
☐ Clean light fixtures and switches

Bathrooms
☐ Scrub toilet (bowl, seat, tank, base)
☐ Clean sink, faucet, and countertop
☐ Clean shower/bathtub (remove soap scum, mold, limescale)
☐ Clean tiles and grout
☐ Clean mirrors
☐ Clean cabinets inside and out
☐ Clean exhaust fan
☐ Sweep and mop floors

Bedrooms & Living Areas
☐ Wipe down all walls (remove marks, handprints)
☐ Clean windows inside and out
☐ Clean window sills and tracks
☐ Vacuum or sweep floors thoroughly
☐ Mop hard floors
☐ Clean light fixtures and ceiling fans
☐ Clean closets (shelves, rods, floors)
☐ Clean air conditioning units/filters

General Areas
☐ Clean balcony/patio (sweep, wipe down)
☐ Clean entry door (both sides)
☐ Wipe down light switches and doorknobs
☐ Remove all nails, hooks, and wall anchors
☐ Fill nail holes with spackling compound
☐ Touch up paint if required by lease
☐ Remove all personal items and trash

MINOR REPAIRS
☐ Replace any burned-out light bulbs
☐ Tighten loose handles, knobs, or fixtures
☐ Replace broken cabinet/closet door stops
☐ Fix dripping faucets (replace washers)
☐ Repair any damage you caused beyond normal wear

UTILITIES & SERVICES
☐ Schedule electric company final reading
☐ Schedule water company final reading
☐ Cancel/transfer internet service
☐ Cancel/transfer cable TV service
☐ Cancel/transfer gas service (if applicable)
☐ Update billing address for final bills

FINAL STEPS
☐ Remove all furniture and belongings
☐ Take "after cleaning" photos of every room
☐ Collect all keys, access cards, remotes
☐ Prepare written list of cleaning/repairs completed
☐ Attend final inspection with landlord
☐ Review condition report together
☐ Address any concerns immediately if possible
☐ Sign move-out inspection form
☐ Return all keys and access items
☐ Confirm deposit return timeline and method
☐ Provide forwarding address and bank details

DEPOSIT RETURN INFORMATION
Deposit Amount Paid: [Amount] THB
Expected Return Date: [Date]
Forwarding Address: [New Address]
Bank Account: [Bank Name], [Account Number]
Contact Phone: [Phone]
Contact Email: [Email]

PROFESSIONAL CLEANING (if required/recommended)
☐ Contact: [Cleaning Company Name]
☐ Cost: [Estimated Amount] THB
☐ Receipt: Obtained [Yes/No]

MOVING COMPANY (if applicable)
☐ Company: [Moving Company Name]
☐ Date: [Move Date]
☐ Contact: [Phone]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `รายการเตรียมการย้ายออก

ทำงานเหล่านี้ให้เสร็จก่อนการตรวจสอบครั้งสุดท้ายเพื่อช่วยให้ได้รับเงินประกันคืนเต็มจำนวน

2-4 สัปดาห์ก่อนย้ายออก
☐ ทบทวนสัญญาสำหรับข้อกำหนดย้ายออก
☐ นัดหมายการตรวจสอบครั้งสุดท้ายกับเจ้าของบ้าน (อย่างน้อย [X] วันล่วงหน้า)
☐ แจ้งบริษัทสาธารณูปโภคถึงวันที่ย้ายออก
☐ จัดการส่งต่อจดหมาย
☐ วางแผนการขนย้ายเฟอร์นิเจอร์และกำหนดการทำความสะอาด
☐ ถ่ายภาพ "ก่อนทำความสะอาด" สำหรับบันทึกของคุณ

1 สัปดาห์ก่อนย้ายออก
☐ เริ่มกระบวนการทำความสะอาดอย่างละเอียด
☐ จัดการกับการซ่อมแซมเล็กน้อยที่จำเป็น
☐ ทดสอบเครื่องใช้และอุปกรณ์ทั้งหมด
☐ ยืนยันวันและเวลาตรวจสอบครั้งสุดท้าย
☐ เตรียมที่อยู่ใหม่สำหรับคืนเงินประกัน

รายการทำความสะอาด

ห้องครัว
☐ ทำความสะอาดตู้ทั้งภายในและภายนอก
☐ ทำความสะอาดเตาอบ เตาแก๊ส และเครื่องดูดควัน (ขจัดคราบไขมัน)
☐ ทำความสะอาดตู้เย็นทั้งภายในและภายนอก (ถอดชั้นวาง ละลายน้ำแข็ง)
☐ ทำความสะอาดไมโครเวฟทั้งภายในและภายนอก
☐ ทำความสะอาดเคาน์เตอร์และแผ่นกันสาด
☐ ทำความสะอาดอ่างล้างจานและก๊อกน้ำ (ขจัดคราบปูนขาว)
☐ กวาดและถูพื้น
☐ ทำความสะอาดโคมไฟและสวิตช์

ห้องน้ำ
☐ ขัดชักโครก (โถ ที่นั่ง ถังน้ำ ฐาน)
☐ ทำความสะอาดอ่างล้างหน้า ก๊อกน้ำ และเคาน์เตอร์
☐ ทำความสะอาดฝักบัว/อ่างอาบน้ำ (ขจัดคราบสบู่ รา ปูนขาว)
☐ ทำความสะอาดกระเบื้องและยาแนว
☐ ทำความสะอาดกระจก
☐ ทำความสะอาดตู้ทั้งภายในและภายนอก
☐ ทำความสะอาดพัดลมระบายอากาศ
☐ กวาดและถูพื้น

ห้องนอนและพื้นที่นั่งเล่น
☐ เช็ดผนังทั้งหมด (ลบรอยขีดข่วน รอยมือ)
☐ ทำความสะอาดหน้าต่างทั้งภายในและภายนอก
☐ ทำความสะอาดขอบหน้าต่างและรางเลื่อน
☐ ดูดฝุ่นหรือกวาดพื้นอย่างละเอียด
☐ ถูพื้นแข็ง
☐ ทำความสะอาดโคมไฟและพัดลมเพดาน
☐ ทำความสะอาดตู้เสื้อผ้า (ชั้นวาง ราวแขวน พื้น)
☐ ทำความสะอาดเครื่องปรับอากาศ/ฟิลเตอร์

พื้นที่ทั่วไป
☐ ทำความสะอาดระเบียง/ลานหน้าบ้าน (กวาด เช็ด)
☐ ทำความสะอาดประตูทางเข้า (ทั้งสองด้าน)
☐ เช็ดสวิตช์ไฟและลูกบิดประตู
☐ ถอดตะปู ขอแขวน และสมอผนังทั้งหมด
☐ อุดรูตะปูด้วยสารซ่อมแซม
☐ ทาสีเก็บงานถ้าสัญญากำหนด
☐ ขนย้ายสิ่งของส่วนตัวและขยะทั้งหมด

การซ่อมแซมเล็กน้อย
☐ เปลี่ยนหลอดไฟที่ไหม้
☐ ขันมือจับ ลูกบิด หรืออุปกรณ์ที่หลวม
☐ เปลี่ยนที่หยุดประตูตู้/ตู้เสื้อผ้าที่หัก
☐ ซ่อมก๊อกน้ำรั่ว (เปลี่ยนแหวนยาง)
☐ ซ่อมความเสียหายที่คุณทำเกินการสึกหรอปกติ

สาธารณูปโภคและบริการ
☐ นัดหมายอ่านมิเตอร์สุดท้ายกับบริษัทไฟฟ้า
☐ นัดหมายอ่านมิเตอร์สุดท้ายกับบริษัทน้ำประปา
☐ ยกเลิก/โอนบริการอินเทอร์เน็ต
☐ ยกเลิก/โอนบริการเคเบิลทีวี
☐ ยกเลิก/โอนบริการแก๊ส (ถ้ามี)
☐ อัปเดตที่อยู่เรียกเก็บเงินสำหรับบิลสุดท้าย

ขั้นตอนสุดท้าย
☐ ขนย้ายเฟอร์นิเจอร์และของใช้ทั้งหมด
☐ ถ่ายภาพ "หลังทำความสะอาด" ของทุกห้อง
☐ รวบรวมกุญแจ บัตรผ่าน รีโมททั้งหมด
☐ เตรียมรายการเป็นลายลักษณ์อักษรของการทำความสะอาด/ซ่อมแซมที่เสร็จสิ้น
☐ เข้าร่วมการตรวจสอบครั้งสุดท้ายกับเจ้าของบ้าน
☐ ทบทวนรายงานสภาพร่วมกัน
☐ จัดการกับข้อกังวลใดๆ ทันทีถ้าเป็นไปได้
☐ ลงนามในแบบฟอร์มตรวจสอบย้ายออก
☐ คืนกุญแจและอุปกรณ์เข้าถึงทั้งหมด
☐ ยืนยันกำหนดเวลาและวิธีการคืนเงินประกัน
☐ ให้ที่อยู่ใหม่และรายละเอียดบัญชีธนาคาร

ข้อมูลคืนเงินประกัน
จำนวนเงินประกันที่ชำระ: [จำนวน] บาท
วันที่คาดว่าจะได้รับคืน: [วันที่]
ที่อยู่ใหม่: [ที่อยู่ใหม่]
บัญชีธนาคาร: [ชื่อธนาคาร], [เลขที่บัญชี]
โทรศัพท์ติดต่อ: [โทรศัพท์]
อีเมลติดต่อ: [อีเมล]

การทำความสะอาดแบบมืออาชีพ (ถ้าต้องการ/แนะนำ)
☐ ติดต่อ: [ชื่อบริษัททำความสะอาด]
☐ ค่าใช้จ่าย: [จำนวนประมาณ] บาท
☐ ใบเสร็จ: ได้รับแล้ว [ใช่/ไม่ใช่]

บริษัทขนย้าย (ถ้ามี)
☐ บริษัท: [ชื่อบริษัทขนย้าย]
☐ วันที่: [วันที่ย้าย]
☐ ติดต่อ: [โทรศัพท์]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  pre_signing_negotiation: {
    preview_en: `PRE-SIGNING LEASE NEGOTIATION
Professional letter template to request amendments to draft lease terms before signing.

Covers:
• Reference to draft lease and agent
• Specific amendment requests (rent, deposit, term, clauses)
• Reasonable justifications
• Request for confirmation by deadline
• Contact information`,
    preview_th: `การเจรจาสัญญาเช่าก่อนลงนาม
แบบฟอร์มจดหมายมืออาชีพเพื่อขอแก้ไขเงื่อนไขร่างสัญญาก่อนลงนาม

ครอบคลุม:
• อ้างอิงถึงร่างสัญญาและตัวแทน
• คำขอแก้ไขเฉพาะ (ค่าเช่า เงินประกัน ระยะเวลา ข้อกำหนด)
• เหตุผลที่สมเหตุสมผล
• ขอการยืนยันภายในกำหนด
• ข้อมูลติดต่อ`,
    document_en: `[Tenant Name]
[Tenant Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Request to Amend Lease Terms Before Signing
Property: [Property Address]

Dear [Landlord Name],

Thank you for providing the draft lease agreement dated [Draft Date] for the property at [Property Address], facilitated by [Agent Name]. I am very interested in proceeding with this tenancy and would like to request the following amendments before signing:

REQUESTED AMENDMENTS:

1. Monthly Rent: [Current Rent] THB → Proposed: [Proposed Rent] THB
2. Security Deposit: [Current Deposit] months → Proposed: [Proposed Deposit] months
3. Lease Term: [Current Term] months → Proposed: [Proposed Term] months
4. Early Termination Clause: Add provision for [Notice Period]-day notice with [Penalty Terms]
5. Maintenance Response Times: [Specify SLA]
6. Entry Notice: Require [Hours]-hour written notice except emergencies
7. Utilities: Clarify tenant vs. landlord responsibility
8. Pet Policy: [Request permission OR confirm prohibition]
9. Deposit Return Timeline: Within [Days] days of move-out

JUSTIFICATION:
[Brief explanation of why these amendments are reasonable]

Please confirm acceptance or propose alternatives by [Deadline Date]. I am available to discuss at [Phone] or [Email].

I look forward to a positive landlord-tenant relationship.

Sincerely,

[Tenant Signature]
[Tenant Name]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `[ชื่อผู้เช่า]
[ที่อยู่ผู้เช่า]
[เมือง, รหัสไปรษณีย์]
[เบอร์โทรศัพท์ผู้เช่า]
[อีเมลผู้เช่า]

[วันที่]

[ชื่อเจ้าของบ้าน]
[ที่อยู่เจ้าของบ้าน]
[เมือง, รหัสไปรษณีย์]

เรื่อง: ขอแก้ไขเงื่อนไขสัญญาเช่าก่อนลงนาม
ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]

เรียน [ชื่อเจ้าของบ้าน]

ขอขอบคุณสำหรับร่างสัญญาเช่าลงวันที่ [วันที่ร่าง] สำหรับทรัพย์สินที่ [ที่อยู่ทรัพย์สิน] ที่ดำเนินการโดย [ชื่อตัวแทน] ข้าพเจ้ามีความสนใจอย่างยิ่งที่จะดำเนินการเช่าต่อไป และขอความกรุณาพิจารณาการแก้ไขเงื่อนไขดังต่อไปนี้ก่อนลงนาม:

การแก้ไขที่ขอ:

1. ค่าเช่ารายเดือน: [ค่าเช่าปัจจุบัน] บาท → เสนอ: [ค่าเช่าที่เสนอ] บาท
2. เงินประกัน: [เงินประกันปัจจุบัน] เดือน → เสนอ: [เงินประกันที่เสนอ] เดือน
3. ระยะเวลาสัญญา: [ระยะเวลาปัจจุบัน] เดือน → เสนอ: [ระยะเวลาที่เสนอ] เดือน
4. ข้อกำหนดการยกเลิกก่อนกำหนด: เพิ่มข้อกำหนดให้แจ้ง [ระยะเวลา] วันพร้อม [เงื่อนไขค่าปรับ]
5. เวลาตอบสนองการซ่อมบำรุง: [ระบุ SLA]
6. การแจ้งก่อนเข้าห้อง: กำหนดให้แจ้งล่วงหน้า [จำนวนชั่วโมง] ชั่วโมงเป็นลายลักษณ์อักษร ยกเว้นฉุกเฉิน
7. สาธารณูปโภค: ระบุชัดเจนความรับผิดชอบผู้เช่า vs. เจ้าของ
8. นโยบายสัตว์เลี้ยง: [ขออนุญาต หรือ ยืนยันห้าม]
9. กำหนดเวลาคืนเงินประกัน: ภายใน [จำนวนวัน] วันหลังย้ายออก

เหตุผล:
[คำอธิบายสั้นๆ ว่าทำไมการแก้ไขเหล่านี้สมเหตุสมผล]

กรุณายืนยันการยอมรับหรือเสนอทางเลือกภายในวันที่ [วันที่กำหนด] ข้าพเจ้าพร้อมหารือที่ [เบอร์โทร] หรือ [อีเมล]

ข้าพเจ้าหวังเป็นอย่างยิ่งว่าจะได้มีความสัมพันธ์ที่ดีระหว่างเจ้าของบ้านและผู้เช่า

ขอแสดงความนับถือ

[ลายเซ็นผู้เช่า]
[ชื่อผู้เช่า]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  notice_intent_to_vacate: {
    preview_en: `NOTICE OF INTENT TO VACATE
Formal notice to landlord of intention to vacate property.

Includes:
• Current lease reference
• Intended move-out date
• Request for final inspection
• Security deposit return details
• Forwarding address and contact`,
    preview_th: `หนังสือแจ้งความประสงค์ย้ายออก
การแจ้งอย่างเป็นทางการถึงเจ้าของบ้านเกี่ยวกับความประสงค์จะย้ายออก

รวมถึง:
• อ้างอิงสัญญาปัจจุบัน
• วันที่ประสงค์จะย้ายออก
• ขอการตรวจสอบครั้งสุดท้าย
• รายละเอียดการคืนเงินประกัน
• ที่อยู่ใหม่และการติดต่อ`,
    document_en: `[Tenant Name]
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

This letter serves as my formal [Notice Period]-day notice of intent to vacate the property at [Property Address], as required under our lease agreement dated [Lease Start Date].

MOVE-OUT DETAILS:
• Intended Move-Out Date: [Move-Out Date]
• Final Rent Paid Through: [Final Rent Date]
• Notice Period: [Notice Period] days (as per lease agreement)

REQUEST FOR FINAL INSPECTION:
I respectfully request a joint final inspection to be scheduled at least [Days] days before move-out. Please confirm available dates and times. I will ensure the property is clean and in good condition per lease terms.

SECURITY DEPOSIT RETURN:
• Deposit Amount Paid: [Deposit Amount] THB (paid [Deposit Payment Date])
• Expected Return Date: [Expected Date]
• Forwarding Address: [New Address], [New City, Postal Code]
• Bank Account: [Bank Name], Account Number: [Account Number], Account Name: [Account Name]

KEY & ACCESS RETURN:
All keys, access cards, and parking remotes will be returned during the final inspection or on [Move-Out Date].

Please confirm receipt of this notice in writing and provide the final inspection schedule at your earliest convenience.

Thank you for your cooperation.

Sincerely,

[Tenant Signature]
[Tenant Name]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `[ชื่อผู้เช่า]
[ที่อยู่ทรัพย์สินปัจจุบัน]
[เมือง, รหัสไปรษณีย์]
[เบอร์โทรศัพท์ผู้เช่า]
[อีเมลผู้เช่า]

[วันที่]

[ชื่อเจ้าของบ้าน]
[ที่อยู่เจ้าของบ้าน]
[เมือง, รหัสไปรษณีย์]

เรื่อง: แจ้งความประสงค์ย้ายออกจากที่เช่า
ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]
วันที่เริ่มสัญญาเช่า: [วันที่เริ่มสัญญา]

เรียน [ชื่อเจ้าของบ้าน]

จดหมายฉบับนี้เป็นการแจ้งล่วงหน้า [ระยะเวลาแจ้ง] วัน ถึงความประสงค์ที่จะย้ายออกจากทรัพย์สินที่ [ที่อยู่ทรัพย์สิน] ตามที่กำหนดในสัญญาเช่าลงวันที่ [วันที่เริ่มสัญญา]

รายละเอียดการย้ายออก:
• วันที่ประสงค์จะย้ายออก: [วันที่ย้ายออก]
• ค่าเช่าชำระถึง: [วันที่ชำระค่าเช่าสุดท้าย]
• ระยะเวลาแจ้งล่วงหน้า: [ระยะเวลา] วัน (ตามสัญญาเช่า)

ขอการตรวจสอบครั้งสุดท้าย:
ข้าพเจ้าขอความกรุณานัดหมายการตรวจสอบร่วมกันอย่างน้อย [จำนวนวัน] วันก่อนวันย้ายออก กรุณายืนยันวันและเวลาที่สะดวก ข้าพเจ้าจะดูแลให้ทรัพย์สินสะอาดและอยู่ในสภาพดีตามเงื่อนไขสัญญา

การคืนเงินประกัน:
• จำนวนเงินประกันที่ชำระ: [จำนวนเงินประกัน] บาท (ชำระเมื่อ [วันที่ชำระ])
• วันที่คาดว่าจะได้รับคืน: [วันที่คาดว่า]
• ที่อยู่สำหรับส่งคืน: [ที่อยู่ใหม่], [เมืองใหม่, รหัสไปรษณีย์]
• บัญชีธนาคาร: [ชื่อธนาคาร], เลขที่บัญชี: [เลขที่บัญชี], ชื่อบัญชี: [ชื่อบัญชี]

การคืนกุญแจและอุปกรณ์:
กุญแจทั้งหมด บัตรผ่านเข้าออก และรีโมทที่จอดรถ จะส่งคืนในวันตรวจสอบครั้งสุดท้ายหรือในวันที่ [วันที่ย้ายออก]

กรุณายืนยันการรับจดหมายฉบับนี้เป็นลายลักษณ์อักษร และแจ้งกำหนดการตรวจสอบครั้งสุดท้ายโดยเร็วที่สุด

ขอขอบคุณสำหรับความร่วมมือ

ขอแสดงความนับถือ

[ลายเซ็นผู้เช่า]
[ชื่อผู้เช่า]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  },

  lease_amendment_request: {
    preview_en: `LEASE AMENDMENT REQUEST
Request to modify existing lease terms during tenancy.

Covers:
• Current lease details
• Specific amendment requests
• Reasons for changes
• Proposed effective date
• Request for written agreement`,
    preview_th: `คำขอแก้ไขสัญญาเช่า
คำขอเพื่อแก้ไขเงื่อนไขสัญญาระหว่างการเช่า

ครอบคลุม:
• รายละเอียดสัญญาปัจจุบัน
• คำขอแก้ไขเฉพาะ
• เหตุผลสำหรับการเปลี่ยนแปลง
• วันที่มีผลที่เสนอ
• ขอข้อตกลงเป็นลายลักษณ์อักษร`,
    document_en: `[Tenant Name]
[Current Property Address]
[City, Postal Code]
[Tenant Phone]
[Tenant Email]

[Date]

[Landlord Name]
[Landlord Address]
[Landlord City, Postal Code]

Re: Request to Amend Lease Agreement
Property: [Property Address]
Current Lease: [Start Date] to [End Date]

Dear [Landlord Name],

I am writing to request an amendment to our current lease agreement for the property at [Property Address].

CURRENT LEASE DETAILS:
• Lease Start Date: [Start Date]
• Lease End Date: [End Date]
• Current Monthly Rent: [Amount] THB
• Current Security Deposit: [Amount] THB

REQUESTED AMENDMENTS:

1. [Amendment 1]
   • Current: [Current Terms]
   • Requested: [New Terms]
   • Reason: [Brief justification]

2. [Amendment 2]
   • Current: [Current Terms]
   • Requested: [New Terms]
   • Reason: [Brief justification]

JUSTIFICATION:
[Provide detailed reasoning for the requested amendments]

PROPOSED EFFECTIVE DATE:
I propose these amendments take effect from [Effective Date].

Please respond by [Deadline Date] with your decision. If you agree, I request that we prepare a written amendment agreement signed by both parties.

I am available to discuss at [Phone] or [Email].

Thank you for your consideration.

Sincerely,

[Tenant Signature]
[Tenant Name]

This document is a communication template for general use. Review and adjust to fit your situation.`,
    document_th: `[ชื่อผู้เช่า]
[ที่อยู่ทรัพย์สินปัจจุบัน]
[เมือง, รหัสไปรษณีย์]
[เบอร์โทรศัพท์ผู้เช่า]
[อีเมลผู้เช่า]

[วันที่]

[ชื่อเจ้าของบ้าน]
[ที่อยู่เจ้าของบ้าน]
[เมือง, รหัสไปรษณีย์]

เรื่อง: ขอแก้ไขสัญญาเช่า
ทรัพย์สิน: [ที่อยู่ทรัพย์สิน]
สัญญาปัจจุบัน: [วันเริ่ม] ถึง [วันสิ้นสุด]

เรียน [ชื่อเจ้าของบ้าน]

ข้าพเจ้าเขียนจดหมายฉบับนี้เพื่อขอแก้ไขสัญญาเช่าปัจจุบันสำหรับทรัพย์สินที่ [ที่อยู่ทรัพย์สิน]

รายละเอียดสัญญาปัจจุบัน:
• วันเริ่มสัญญา: [วันเริ่ม]
• วันสิ้นสุดสัญญา: [วันสิ้นสุด]
• ค่าเช่ารายเดือนปัจจุบัน: [จำนวน] บาท
• เงินประกันปัจจุบัน: [จำนวน] บาท

การแก้ไขที่ขอ:

1. [การแก้ไข 1]
   • ปัจจุบัน: [เงื่อนไขปัจจุบัน]
   • ที่ขอ: [เงื่อนไขใหม่]
   • เหตุผล: [เหตุผลสั้นๆ]

2. [การแก้ไข 2]
   • ปัจจุบัน: [เงื่อนไขปัจจุบัน]
   • ที่ขอ: [เงื่อนไขใหม่]
   • เหตุผล: [เหตุผลสั้นๆ]

เหตุผล:
[แจ้งเหตุผลโดยละเอียดสำหรับการแก้ไขที่ขอ]

วันที่มีผลที่เสนอ:
ข้าพเจ้าเสนอให้การแก้ไขเหล่านี้มีผลตั้งแต่ [วันที่มีผล]

กรุณาตอบกลับภายในวันที่ [วันที่กำหนด] พร้อมการตัดสินใจของท่าน หากท่านเห็นด้วย ข้าพเจ้าขอให้เราเตรียมข้อตกลงแก้ไขเป็นลายลักษณ์อักษรที่ทั้งสองฝ่ายลงนาม

ข้าพเจ้าพร้อมหารือที่ [เบอร์โทร] หรือ [อีเมล]

ขอขอบคุณสำหรับการพิจารณา

ขอแสดงความนับถือ

[ลายเซ็นผู้เช่า]
[ชื่อผู้เช่า]

เอกสารนี้เป็นแบบฟอร์มสำหรับการสื่อสารทั่วไป โปรดตรวจสอบและปรับแก้ให้เหมาะกับสถานการณ์ของคุณ`
  }
};

Deno.serve(async (req) => {
  const step = 'init';
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.access_level !== 'admin' && user.access_level !== 'super_admin')) {
      return Response.json({ 
        ok: false, 
        step: 'auth',
        message: 'Unauthorized - Admin only' 
      }, { status: 403 });
    }

    const { force = false } = await req.json().catch(() => ({}));

    console.log('[TEMPLATE_BACKFILL] Starting backfill...', { force, admin: user.email });
    
    const templates = await base44.asServiceRole.entities.TemplateLibrary.list();
    
    let updatedPreviewEn = 0;
    let updatedPreviewTh = 0;
    let updatedDocEn = 0;
    let updatedDocTh = 0;
    const keysMissing = [];

    for (const template of templates) {
      try {
        const updateData = {};
        let needsUpdate = false;

        // Get existing nested or flat content
        const existingPreview = template.preview_content || {};
        const existingDoc = template.document_content || {};

        const legacyPreviewEn = template.preview_content_en || template.preview_en || '';
        const legacyPreviewTh = template.preview_content_th || template.preview_th || '';
        const legacyDocEn = template.document_content_en || template.document_content || '';
        const legacyDocTh = template.document_content_th || '';

        let previewEn = existingPreview.en || legacyPreviewEn || '';
        let previewTh = existingPreview.th || legacyPreviewTh || '';
        let docEn = existingDoc.en || legacyDocEn || '';
        let docTh = existingDoc.th || legacyDocTh || '';

        // Use priority template content if available
        const priorityContent = PRIORITY_TEMPLATES[template.template_key];

        // Update EN content
        if ((previewEn.trim().length < 50 || force) && priorityContent?.preview_en) {
          previewEn = priorityContent.preview_en;
          updatedPreviewEn++;
          needsUpdate = true;
        }
        if ((docEn.trim().length < 300 || force) && priorityContent?.document_en) {
          docEn = priorityContent.document_en;
          updatedDocEn++;
          needsUpdate = true;
        }

        // Update TH content
        if ((previewTh.trim().length < 50 || force) && priorityContent?.preview_th) {
          previewTh = priorityContent.preview_th;
          updatedPreviewTh++;
          needsUpdate = true;
        }
        if ((docTh.trim().length < 300 || force) && priorityContent?.document_th) {
          docTh = priorityContent.document_th;
          updatedDocTh++;
          needsUpdate = true;
        }

        if (needsUpdate) {
          updateData.preview_content = { en: previewEn, th: previewTh };
          updateData.document_content = { en: docEn, th: docTh };

          const hasEn = previewEn.trim().length >= 50 && docEn.trim().length >= 300;
          const hasTh = previewTh.trim().length >= 50 && docTh.trim().length >= 300;

          updateData.has_english = hasEn;
          updateData.has_thai = hasTh;

          if (hasEn && hasTh) updateData.content_status = 'ready';
          else if (hasEn && !hasTh) updateData.content_status = 'missing_th';
          else if (!hasEn && hasTh) updateData.content_status = 'missing_en';
          else updateData.content_status = 'missing_both';

          await base44.asServiceRole.entities.TemplateLibrary.update(template.id, updateData);
        }

        // Track remaining missing
        const finalHasEn = previewEn.trim().length >= 50 && docEn.trim().length >= 300;
        const finalHasTh = previewTh.trim().length >= 50 && docTh.trim().length >= 300;
        
        if (!finalHasEn || !finalHasTh) {
          keysMissing.push(template.template_key);
        }

      } catch (error) {
        console.error('[TEMPLATE_BACKFILL] Error updating template:', template.template_key, error);
      }
    }

    console.log('[TEMPLATE_BACKFILL] Complete:', {
      total: templates.length,
      updatedPreviewEn,
      updatedPreviewTh,
      updatedDocEn,
      updatedDocTh,
      remainingMissing: keysMissing.length,
      force
    });

    return Response.json({
      ok: true,
      total: templates.length,
      updated_preview_en: updatedPreviewEn,
      updated_preview_th: updatedPreviewTh,
      updated_doc_en: updatedDocEn,
      updated_doc_th: updatedDocTh,
      remaining_missing: keysMissing.length,
      keys_missing: keysMissing
    });

  } catch (error) {
    console.error('[TEMPLATE_BACKFILL] Fatal error:', error);
    return Response.json({
      ok: false,
      step,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});