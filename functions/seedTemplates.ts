import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const CANONICAL_TEMPLATES = [
  // Checklists
  {
    template_key: 'pre_signing_checklist',
    title_en: 'Pre-Signing Checklist',
    title_th: 'รายการตรวจสอบก่อนเซ็นสัญญา',
    description_en: 'Essential items to verify before signing your lease agreement',
    description_th: 'รายการสำคัญที่ควรตรวจสอบก่อนลงนามสัญญาเช่า',
    category: 'checklists',
    status: 'active',
    cost_credits: 1,
    sort_order: 1,
    content_en: `Dear {{landlord_name}},

I am writing to request a final walkthrough and documentation review before signing the lease for {{property_address}}.

Please provide:
- Copy of the lease agreement for review
- Proof of ownership or authority to lease
- Current condition documentation with photos
- List of existing damages or wear
- Utility connection procedures and contacts

I look forward to reviewing these materials.

Sincerely,
{{tenant_name}}`,
    content_th: `เรียน {{landlord_name}}

ข้าพเจ้าขอความกรุณาตรวจสอบห้องและเอกสารก่อนลงนามสัญญาเช่าที่ {{property_address}}

กรุณาจัดเตรียม:
- สำเนาสัญญาเช่าเพื่อตรวจสอบ
- หลักฐานกำเนิดหรืออำนาจในการให้เช่า
- เอกสารและภาพถ่ายสภาพห้องปัจจุบัน
- รายการความเสียหายหรือรอยสึกหรอที่มีอยู่
- ขั้นตอนและช่องทางติดต่อสาธารณูปโภค

ขอแสดงความนับถือ
{{tenant_name}}`,
    merge_fields: ['tenant_name', 'landlord_name', 'property_address']
  },
  {
    template_key: 'move_in_condition_checklist',
    title_en: 'Move-In Condition Checklist',
    title_th: 'รายการตรวจสอบสภาพห้องวันรับกุญแจ',
    description_en: 'Document property condition on move-in day',
    description_th: 'บันทึกสภาพห้องในวันรับกุญแจ',
    category: 'checklists',
    status: 'active',
    cost_credits: 1,
    sort_order: 2,
    content_en: `Dear {{landlord_name}},

This letter confirms the property condition inspection for {{property_address}} on {{today_date}}.

I have documented the current condition with photographs and request your acknowledgment of:
- Pre-existing wall marks and scuffs
- Appliance condition and functionality
- Floor and carpet wear patterns
- Bathroom fixtures and fittings condition

Please sign the attached condition report within 7 days.

Sincerely,
{{tenant_name}}`,
    content_th: `เรียน {{landlord_name}}

หนังสือฉบับนี้ยืนยันการตรวจสอบสภาพห้องที่ {{property_address}} ในวันที่ {{today_date}}

ข้าพเจ้าได้บันทึกสภาพปัจจุบันด้วยภาพถ่ายและขอให้ท่านรับทราบ:
- รอยขีดข่วนและรอยเปื้อนที่มีอยู่แล้ว
- สภาพและการทำงานของเครื่องใช้ไฟฟ้า
- รอยสึกของพื้นและพรม
- สภาพของอุปกรณ์ห้องน้ำ

กรุณาลงนามรับทราบรายงานสภาพภายใน 7 วัน

ขอแสดงความนับถือ
{{tenant_name}}`,
    merge_fields: ['tenant_name', 'landlord_name', 'property_address', 'today_date']
  },
  {
    template_key: 'move_out_preparation_checklist',
    title_en: 'Move-Out Preparation Checklist',
    title_th: 'รายการเตรียมตัวก่อนย้ายออก',
    description_en: 'Steps to prepare for smooth move-out and deposit return',
    description_th: 'ขั้นตอนเตรียมตัวเพื่อการย้ายออกและคืนเงินประกันที่ราบรื่น',
    category: 'checklists',
    status: 'active',
    cost_credits: 1,
    sort_order: 3,
    content_en: `Dear {{landlord_name}},

I am preparing to vacate {{property_address}} and request clarification on the move-out process:

Please confirm:
- Required notice period and final date
- Cleaning standards expected
- Repair obligations (if any)
- Deposit return timeline and method
- Final inspection scheduling

Thank you for your assistance.

Sincerely,
{{tenant_name}}`,
    content_th: `เรียน {{landlord_name}}

ข้าพเจ้ากำลังเตรียมย้ายออกจาก {{property_address}} และขอสอบถามขั้นตอนการย้ายออก:

กรุณายืนยัน:
- ระยะเวลาแจ้งล่วงหน้าและวันสุดท้าย
- มาตรฐานการทำความสะอาดที่คาดหวัง
- ภาระหน้าที่ในการซ่อมแซม (ถ้ามี)
- กำหนดเวลาและวิธีการคืนเงินประกัน
- การนัดหมายตรวจสภาพครั้งสุดท้าย

ขอบคุณสำหรับความช่วยเหลือ

ขอแสดงความนับถือ
{{tenant_name}}`,
    merge_fields: ['tenant_name', 'landlord_name', 'property_address']
  },
  {
    template_key: 'notice_intent_to_vacate',
    title_en: 'Notice of Intent to Vacate',
    title_th: 'หนังสือแจ้งความประสงค์ย้ายออก',
    description_en: 'Formal notice of lease termination',
    description_th: 'แจ้งเลิกสัญญาเช่าอย่างเป็นทางการ',
    category: 'checklists',
    status: 'active',
    cost_credits: 1,
    sort_order: 4,
    content_en: `Dear {{landlord_name}},

This letter serves as formal notice of my intent to vacate {{property_address}} as of {{move_out_date}}.

As per our lease agreement dated {{contract_date}}, I am providing the required {{notice_period_days}} days' notice.

Please arrange a final inspection and confirm the deposit return process.

Sincerely,
{{tenant_name}}`,
    content_th: `เรียน {{landlord_name}}

หนังสือฉบับนี้เป็นการแจ้งเลิกสัญญาเช่าที่ {{property_address}} ตั้งแต่วันที่ {{move_out_date}}

ตามสัญญาเช่าลงวันที่ {{contract_date}} ข้าพเจ้าได้แจ้งล่วงหน้า {{notice_period_days}} วันตามที่กำหนด

กรุณานัดหมายตรวจสภาพครั้งสุดท้ายและยืนยันขั้นตอนการคืนเงินประกัน

ขอแสดงความนับถือ
{{tenant_name}}`,
    merge_fields: ['tenant_name', 'landlord_name', 'property_address', 'move_out_date', 'contract_date', 'notice_period_days']
  },
  {
    template_key: 'pre_move_out_inspection_request',
    title_en: 'Request for Pre-Move-Out Inspection',
    title_th: 'คำขอตรวจสภาพก่อนย้ายออก',
    description_en: 'Request walkthrough before final move-out',
    description_th: 'ขอตรวจสภาพก่อนย้ายออกจริง',
    category: 'checklists',
    status: 'active',
    cost_credits: 1,
    sort_order: 5,
    content_en: `Dear {{landlord_name}},

I am scheduled to vacate {{property_address}} on {{move_out_date}} and request a pre-move-out inspection.

This walkthrough will allow me to address any concerns before the final inspection, ensuring a smooth deposit return process.

Please confirm available dates and times for the inspection.

Sincerely,
{{tenant_name}}`,
    content_th: `เรียน {{landlord_name}}

ข้าพเจ้ากำหนดย้ายออกจาก {{property_address}} ในวันที่ {{move_out_date}} และขอตรวจสภาพก่อนย้ายออก

การตรวจสภาพล่วงหน้านี้จะช่วยให้ข้าพเจ้าแก้ไขข้อกังวลก่อนการตรวจสอบครั้งสุดท้าย เพื่อให้กระบวนการคืนเงินประกันราบรื่น

กรุณายืนยันวันและเวลาที่สะดวกสำหรับการตรวจสภาพ

ขอแสดงความนับถือ
{{tenant_name}}`,
    merge_fields: ['tenant_name', 'landlord_name', 'property_address', 'move_out_date']
  },
  // Pre-Signing
  {
    template_key: 'lease_negotiation',
    title_en: 'Pre-Signing Lease Negotiation',
    title_th: 'ขอชี้แจงเงื่อนไขก่อนเซ็นสัญญา',
    description_en: 'Request clarification on lease terms before signing',
    description_th: 'ขอความชัดเจนเกี่ยวกับเงื่อนไขก่อนลงนาม',
    category: 'pre_signing',
    status: 'active',
    cost_credits: 1,
    sort_order: 10,
    content_en: `Dear {{landlord_name}},

I am interested in leasing {{property_address}} and would like clarification on the following terms before signing:

- Deposit amount and refund conditions
- Maintenance and repair responsibilities
- Early termination provisions
- Notice period requirements
- Included utilities and services

I appreciate your time in addressing these points.

Sincerely,
{{tenant_name}}`,
    content_th: `เรียน {{landlord_name}}

ข้าพเจ้าสนใจเช่า {{property_address}} และขอความชัดเจนในเงื่อนไขต่อไปนี้ก่อนลงนาม:

- จำนวนเงินประกันและเงื่อนไขการคืน
- ความรับผิดชอบในการบำรุงรักษาและซ่อมแซม
- ข้อกำหนดการยกเลิกก่อนกำหนด
- ระยะเวลาแจ้งล่วงหน้า
- สาธารณูปโภคและบริการที่รวมอยู่

ขอบคุณสำหรับเวลาของท่านในการชี้แจงประเด็นเหล่านี้

ขอแสดงความนับถือ
{{tenant_name}}`,
    merge_fields: ['tenant_name', 'landlord_name', 'property_address']
  },
  // Initial Resolution
  {
    template_key: 'deposit_return_request',
    title_en: 'Deposit Return Request',
    title_th: 'คำขอคืนเงินประกัน',
    description_en: 'Request full deposit return after lease end',
    description_th: 'ขอคืนเงินประกันหลังสิ้นสุดสัญญาเช่า',
    category: 'initial_resolution',
    status: 'active',
    cost_credits: 1,
    sort_order: 20,
    content_en: `Dear {{landlord_name}},

I vacated {{property_address}} on {{move_out_date}} in good condition. As per our lease agreement, I request the full return of my security deposit of {{deposit_amount}} THB.

The property was left clean and in the same condition as move-in, with only normal wear and tear.

Please confirm the deposit return timeline.

Sincerely,
{{tenant_name}}
{{tenant_address}}`,
    content_th: `เรียน {{landlord_name}}

ข้าพเจ้าได้ย้ายออกจาก {{property_address}} เมื่อวันที่ {{move_out_date}} โดยทิ้งห้องไว้ในสภาพดี ตามสัญญาเช่า ข้าพเจ้าขอคืนเงินประกัน {{deposit_amount}} บาท เต็มจำนวน

ทรัพย์สินถูกทิ้งไว้ในสภาพสะอาดและเหมือนวันรับกุญแจ มีเพียงการสึกหรอตามปกติ

กรุณายืนยันกำหนดเวลาคืนเงินประกัน

ขอแสดงความนับถือ
{{tenant_name}}
{{tenant_address}}`,
    merge_fields: ['tenant_name', 'tenant_address', 'landlord_name', 'property_address', 'move_out_date', 'deposit_amount']
  },
  {
    template_key: 'request_itemised_deductions',
    title_en: 'Request for Itemised Deductions',
    title_th: 'คำขอรายการหักค่าใช้จ่ายแบบแยกรายการ',
    description_en: 'Request detailed breakdown of deposit deductions',
    description_th: 'ขอรายละเอียดการหักเงินประกันแบบแยกรายการ',
    category: 'initial_resolution',
    status: 'active',
    cost_credits: 1,
    sort_order: 21,
    content_en: `Dear {{landlord_name}},

I received notice of deposit deductions for {{property_address}}. I request a detailed, itemised breakdown including:

- Specific items claimed as damages
- Cost estimates or invoices for each item
- Photos or evidence of claimed damages
- Justification for each deduction

I am entitled to a transparent accounting under Thai rental law.

Sincerely,
{{tenant_name}}
{{tenant_address}}`,
    content_th: `เรียน {{landlord_name}}

ข้าพเจ้าได้รับแจ้งการหักเงินประกันสำหรับ {{property_address}} ข้าพเจ้าขอรายละเอียดการหักเงินแบบแยกรายการดังนี้:

- รายการที่อ้างว่าเป็นความเสียหาย
- ใบเสนอราคาหรือใบเสร็จสำหรับแต่ละรายการ
- ภาพถ่ายหรือหลักฐานความเสียหายที่อ้าง
- เหตุผลสำหรับการหักแต่ละรายการ

ข้าพเจ้ามีสิทธิ์ได้รับการบัญชีที่โปร่งใสตามกฎหมายการเช่าไทย

ขอแสดงความนับถือ
{{tenant_name}}
{{tenant_address}}`,
    merge_fields: ['tenant_name', 'tenant_address', 'landlord_name', 'property_address']
  },
  {
    template_key: 'initial_reminder',
    title_en: 'Reminder',
    title_th: 'จดหมายติดตาม',
    description_en: 'Follow-up reminder for pending response',
    description_th: 'จดหมายติดตามสำหรับการตอบกลับที่รอดำเนินการ',
    category: 'initial_resolution',
    status: 'active',
    cost_credits: 1,
    sort_order: 22,
    content_en: `Dear {{landlord_name}},

I am following up on my previous correspondence dated {{previous_letter_date}} regarding {{property_address}}.

I have not yet received a response. Please reply by {{deadline_date}} to allow us to resolve this matter amicably.

I look forward to your prompt reply.

Sincerely,
{{tenant_name}}
{{tenant_address}}`,
    content_th: `เรียน {{landlord_name}}

ข้าพเจ้าขอติดตามจดหมายเมื่อวันที่ {{previous_letter_date}} เกี่ยวกับ {{property_address}}

ข้าพเจ้ายังไม่ได้รับการตอบกลับ กรุณาตอบภายในวันที่ {{deadline_date}} เพื่อให้เราสามารถแก้ไขเรื่องนี้ได้อย่างราบรื่น

ขอแสดงความนับถือ
{{tenant_name}}
{{tenant_address}}`,
    merge_fields: ['tenant_name', 'tenant_address', 'landlord_name', 'property_address', 'previous_letter_date', 'deadline_date']
  },
  // Professional Escalation
  {
    template_key: 'request_for_evidence',
    title_en: 'Request for Evidence',
    title_th: 'คำขอเอกสาร/หลักฐานประกอบ',
    description_en: 'Formal request for supporting documentation',
    description_th: 'ขอเอกสารหรือหลักฐานอย่างเป็นทางการ',
    category: 'professional',
    status: 'active',
    cost_credits: 1,
    sort_order: 30,
    content_en: `Dear {{landlord_name}},

Further to my letter of {{previous_letter_date}} regarding {{property_address}}, I formally request supporting evidence for the claimed deductions:

1. Photographic evidence of alleged damages
2. Invoices or receipts for repair costs
3. Move-in condition report for comparison

Please provide these documents within 7 days. Without proper documentation, I must dispute the deductions under Section 555 of the Thai Civil and Commercial Code.

Sincerely,
{{tenant_name}}
{{tenant_address}}`,
    content_th: `เรียน {{landlord_name}}

อ้างถึงจดหมายของข้าพเจ้าเมื่อวันที่ {{previous_letter_date}} เกี่ยวกับ {{property_address}} ข้าพเจ้าขอหลักฐานประกอบการหักเงินอย่างเป็นทางการ:

1. ภาพถ่ายความเสียหายที่อ้าง
2. ใบเสนอราคาหรือใบเสร็จค่าซ่อมแซม
3. รายงานสภาพห้องวันรับกุญแจเพื่อเปรียบเทียบ

กรุณาจัดส่งเอกสารเหล่านี้ภายใน 7 วัน หากไม่มีเอกสารที่เหมาะสม ข้าพเจ้าจำเป็นต้องโต้แย้งการหักเงินตามมาตรา 555 ประมวลกฎหมายแพ่งและพาณิชย์

ขอแสดงความนับถือ
{{tenant_name}}
{{tenant_address}}`,
    merge_fields: ['tenant_name', 'tenant_address', 'landlord_name', 'property_address', 'previous_letter_date']
  },
  {
    template_key: 'formal_dispute_withholding',
    title_en: 'Formal Dispute of Deposit Withholding',
    title_th: 'หนังสือโต้แย้งการยึดเงินประกันอย่างเป็นทางการ',
    description_en: 'Formal dispute of unjustified deposit retention',
    description_th: 'โต้แย้งการยึดเงินประกันที่ไม่เป็นธรรมอย่างเป็นทางการ',
    category: 'professional',
    status: 'active',
    cost_credits: 1,
    sort_order: 31,
    content_en: `Dear {{landlord_name}},

I formally dispute the withholding of my security deposit of {{deposit_amount}} THB for {{property_address}}.

The claimed deductions are unjustified because:
- No itemised breakdown provided
- No photographic evidence of damages
- Normal wear and tear is not tenant responsibility
- No pre-existing condition report signed

Under Section 555 of the Thai Civil and Commercial Code, deposits must be returned with proper documentation of legitimate deductions only.

I request full deposit return within 14 days, or I will escalate this matter.

Sincerely,
{{tenant_name}}
{{tenant_address}}`,
    content_th: `เรียน {{landlord_name}}

ข้าพเจ้าขอโต้แย้งการยึดเงินประกัน {{deposit_amount}} บาท สำหรับ {{property_address}} อย่างเป็นทางการ

การหักเงินที่อ้างนั้นไม่เป็นธรรมเพราะ:
- ไม่มีรายการหักเงินแบบแยกรายการ
- ไม่มีภาพถ่ายความเสียหาย
- การสึกหรอตามปกติไม่ใช่ความรับผิดชอบของผู้เช่า
- ไม่มีรายงานสภาพก่อนเข้าพักที่ลงนาม

ตามมาตรา 555 ประมวลกฎหมายแพ่งและพาณิชย์ เงินประกันต้องคืนพร้อมเอกสารที่เหมาะสมของการหักที่ชอบด้วยกฎหมายเท่านั้น

ข้าพเจ้าขอคืนเงินประกันเต็มจำนวนภายใน 14 วัน มิฉะนั้นข้าพเจ้าจะยกระดับเรื่องนี้

ขอแสดงความนับถือ
{{tenant_name}}
{{tenant_address}}`,
    merge_fields: ['tenant_name', 'tenant_address', 'landlord_name', 'property_address', 'deposit_amount']
  },
  // Final Measures
  {
    template_key: 'final_opportunity',
    title_en: 'Final Opportunity',
    title_th: 'แจ้งโอกาสครั้งสุดท้ายก่อนดำเนินการต่อ',
    description_en: 'Final notice before legal escalation',
    description_th: 'แจ้งครั้งสุดท้ายก่อนดำเนินการทางกฎหมาย',
    category: 'final',
    status: 'active',
    cost_credits: 1,
    sort_order: 40,
    content_en: `Dear {{landlord_name}},

This is my final notice regarding the withholding of my deposit of {{deposit_amount}} THB for {{property_address}}.

Despite multiple attempts to resolve this matter amicably, I have not received:
- A valid itemised breakdown
- Supporting evidence for deductions
- A satisfactory response

I am providing one final opportunity for full deposit return by {{final_deadline_date}}. 

Failure to comply will leave me no choice but to file a complaint with the Office of the Consumer Protection Board and pursue legal remedies.

Sincerely,
{{tenant_name}}
{{tenant_address}}`,
    content_th: `เรียน {{landlord_name}}

นี่คือการแจ้งครั้งสุดท้ายเกี่ยวกับการยึดเงินประกัน {{deposit_amount}} บาท สำหรับ {{property_address}}

แม้จะพยายามแก้ไขเรื่องนี้อย่างราบรื่นหลายครั้ง ข้าพเจ้ายังไม่ได้รับ:
- รายการหักเงินที่ถูกต้อง
- หลักฐานสนับสนุนการหักเงิน
- คำตอบที่น่าพอใจ

ข้าพเจ้าให้โอกาสสุดท้ายในการคืนเงินประกันเต็มจำนวนภายในวันที่ {{final_deadline_date}}

หากไม่ปฏิบัติตาม ข้าพเจ้าจำเป็นต้องยื่นเรื่องร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองผู้บริโภคและดำเนินการทางกฎหมาย

ขอแสดงความนับถือ
{{tenant_name}}
{{tenant_address}}`,
    merge_fields: ['tenant_name', 'tenant_address', 'landlord_name', 'property_address', 'deposit_amount', 'final_deadline_date']
  },
  {
    template_key: 'notice_of_non_compliance',
    title_en: 'Notice of Non-Compliance',
    title_th: 'หนังสือแจ้งการไม่ปฏิบัติตามสัญญา',
    description_en: 'Formal notice of lease violation by landlord',
    description_th: 'แจ้งการฝ่าฝืนสัญญาโดยเจ้าของบ้านอย่างเป็นทางการ',
    category: 'final',
    status: 'active',
    cost_credits: 1,
    sort_order: 41,
    content_en: `Dear {{landlord_name}},

I am writing to formally notify you of non-compliance with our lease agreement for {{property_address}}.

The following violations have occurred:
{{breach_details}}

Under the Thai Civil and Commercial Code, you are obligated to remedy these issues within 7 days.

Failure to comply will constitute a material breach, and I reserve all rights under the law.

Sincerely,
{{tenant_name}}
{{tenant_address}}`,
    content_th: `เรียน {{landlord_name}}

ข้าพเจ้าขอแจ้งอย่างเป็นทางการถึงการไม่ปฏิบัติตามสัญญาเช่าสำหรับ {{property_address}}

การฝ่าฝืนต่อไปนี้ได้เกิดขึ้น:
{{breach_details}}

ตามประมวลกฎหมายแพ่งและพาณิชย์ ท่านมีหน้าที่แก้ไขปัญหาเหล่านี้ภายใน 7 วัน

หากไม่ปฏิบัติตามจะถือเป็นการละเมิดสัญญาอย่างร้ายแรง และข้าพเจ้าขอสงวนสิทธิ์ทั้งหมดตามกฎหมาย

ขอแสดงความนับถือ
{{tenant_name}}
{{tenant_address}}`,
    merge_fields: ['tenant_name', 'tenant_address', 'landlord_name', 'property_address', 'breach_details']
  },
  {
    template_key: 'settlement_confirmation',
    title_en: 'Settlement Confirmation',
    title_th: 'ยืนยันการตกลง/ชำระเงินเรียบร้อย',
    description_en: 'Confirm agreed settlement terms',
    description_th: 'ยืนยันข้อตกลงการชำระเงิน',
    category: 'final',
    status: 'active',
    cost_credits: 1,
    sort_order: 42,
    content_en: `Dear {{landlord_name}},

This letter confirms our settlement agreement for {{property_address}}.

Agreed terms:
- Settlement amount: {{settlement_amount}} THB
- Payment date: {{settlement_date}}
- Payment method: {{payment_method}}

Upon receipt of payment, this matter will be considered fully resolved.

Sincerely,
{{tenant_name}}
{{tenant_address}}`,
    content_th: `เรียน {{landlord_name}}

หนังสือฉบับนี้ยืนยันข้อตกลงของเราสำหรับ {{property_address}}

เงื่อนไขที่ตกลง:
- จำนวนเงินชำระ: {{settlement_amount}} บาท
- วันที่ชำระเงิน: {{settlement_date}}
- วิธีการชำระเงิน: {{payment_method}}

เมื่อได้รับเงินแล้ว เรื่องนี้จะถือว่าได้รับการแก้ไขเรียบร้อยแล้ว

ขอแสดงความนับถือ
{{tenant_name}}
{{tenant_address}}`,
    merge_fields: ['tenant_name', 'tenant_address', 'landlord_name', 'property_address', 'settlement_amount', 'settlement_date', 'payment_method']
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'super_admin'].includes(user.access_level)) {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 403 });
    }

    // Check if templates already seeded
    const existing = await base44.asServiceRole.entities.TemplateLibrary.list();
    
    if (existing.length > 0) {
      return Response.json({ 
        ok: true, 
        message: 'Templates already exist', 
        count: existing.length,
        action: 'skipped'
      });
    }

    // Seed templates
    const created = [];
    for (const template of CANONICAL_TEMPLATES) {
      const result = await base44.asServiceRole.entities.TemplateLibrary.create({
        ...template,
        seed_version: 'v1.0'
      });
      created.push(result);
    }

    return Response.json({ 
      ok: true, 
      message: 'Templates seeded successfully',
      count: created.length,
      templates: created.map(t => ({ key: t.template_key, title_en: t.title_en }))
    });

  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});