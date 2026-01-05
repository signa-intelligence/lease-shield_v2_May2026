// CANONICAL CLAUSE CATALOG - Thailand Residential Lease Standard
// This is the authoritative taxonomy for lease clause mapping

export const CANONICAL_CLAUSE_CATALOG = [
  // === PARTIES & PROPERTY (CAT-001 to CAT-005) ===
  {
    id: "CAT-001",
    canonical_name: "Parties Identification",
    purpose: "Identify lessor (landlord) and lessee (tenant) with full legal names and ID numbers",
    typical_keywords: ["lessor", "lessee", "landlord", "tenant", "party", "ผู้ให้เช่า", "ผู้เช่า"],
    typical_variants: ["First Party / Second Party", "Owner / Renter"],
    risk_triggers: ["missing ID numbers", "agent signing without POA", "corporate entity without authorized signatory"]
  },
  {
    id: "CAT-002",
    canonical_name: "Property Description",
    purpose: "Define the leased premises with address, unit number, and boundaries",
    typical_keywords: ["premises", "property", "unit", "address", "ทรัพย์สิน", "ห้องพัก", "ที่อยู่"],
    typical_variants: ["Leased Property", "Subject Matter"],
    risk_triggers: ["vague description", "no unit number", "no chanote/title reference"]
  },
  {
    id: "CAT-003",
    canonical_name: "Property Condition at Handover",
    purpose: "Document the state of property at lease commencement",
    typical_keywords: ["condition", "as-is", "inventory", "สภาพ", "รายการทรัพย์สิน"],
    typical_variants: ["Move-in Condition", "Premises State"],
    risk_triggers: ["no inventory list", "no photo documentation requirement", "as-is without inspection period"]
  },
  {
    id: "CAT-004",
    canonical_name: "Furnishings & Fixtures Inventory",
    purpose: "List all furniture, appliances, and fixtures included",
    typical_keywords: ["furniture", "appliances", "fixtures", "inventory", "เฟอร์นิเจอร์", "เครื่องใช้ไฟฟ้า"],
    typical_variants: ["Equipment List", "Included Items"],
    risk_triggers: ["no itemized list", "no condition assessment", "no photos"]
  },
  {
    id: "CAT-005",
    canonical_name: "Common Areas & Facilities",
    purpose: "Define access to shared facilities (pool, gym, parking)",
    typical_keywords: ["common area", "facilities", "amenities", "parking", "พื้นที่ส่วนกลาง", "สิ่งอำนวยความสะดวก"],
    typical_variants: ["Shared Facilities", "Building Amenities"],
    risk_triggers: ["facilities access can be revoked", "extra fees for amenities", "no guaranteed parking"]
  },

  // === LEASE TERM (CAT-006 to CAT-012) ===
  {
    id: "CAT-006",
    canonical_name: "Lease Term & Commencement",
    purpose: "Define start date, end date, and duration of tenancy",
    typical_keywords: ["term", "commence", "duration", "period", "ระยะเวลา", "เริ่มต้น", "สิ้นสุด"],
    typical_variants: ["Tenancy Period", "Lease Duration"],
    risk_triggers: ["unclear start date", "term exceeds 3 years without registration"]
  },
  {
    id: "CAT-007",
    canonical_name: "Renewal Terms",
    purpose: "Define how lease can be renewed and under what conditions",
    typical_keywords: ["renew", "renewal", "extend", "extension", "ต่อสัญญา", "ขยายเวลา"],
    typical_variants: ["Lease Extension", "Continuation"],
    risk_triggers: ["auto-renewal without consent", "renewal at landlord's sole discretion", "no renewal option"]
  },
  {
    id: "CAT-008",
    canonical_name: "Auto-Renewal Mechanism",
    purpose: "Specify automatic renewal conditions and opt-out procedures",
    typical_keywords: ["automatic", "auto-renew", "unless notice", "อัตโนมัติ", "ต่ออายุโดยอัตโนมัติ"],
    typical_variants: ["Tacit Renewal", "Evergreen Clause"],
    risk_triggers: ["short opt-out window", "multi-channel notice required", "confirmed receipt required"]
  },
  {
    id: "CAT-009",
    canonical_name: "Notice Period for Non-Renewal",
    purpose: "Define advance notice required to not renew",
    typical_keywords: ["notice", "days before", "advance", "แจ้งล่วงหน้า", "ก่อนสิ้นสุด"],
    typical_variants: ["Termination Notice", "End Notice"],
    risk_triggers: ["excessive notice period (>60 days)", "complex notice requirements"]
  },
  {
    id: "CAT-010",
    canonical_name: "Early Termination by Tenant",
    purpose: "Conditions under which tenant can terminate early",
    typical_keywords: ["early termination", "break clause", "tenant terminate", "ยกเลิกก่อนกำหนด"],
    typical_variants: ["Tenant Break", "Premature End"],
    risk_triggers: ["no early termination right", "full deposit forfeiture", "remaining rent liability"]
  },
  {
    id: "CAT-011",
    canonical_name: "Early Termination by Landlord",
    purpose: "Conditions under which landlord can terminate early",
    typical_keywords: ["landlord terminate", "owner terminate", "เจ้าของยกเลิก"],
    typical_variants: ["Lessor Break", "Owner's Right to Terminate"],
    risk_triggers: ["termination without cause", "short notice", "no relocation compensation"]
  },
  {
    id: "CAT-012",
    canonical_name: "Holdover Tenancy",
    purpose: "Define status and rent if tenant stays past lease end",
    typical_keywords: ["holdover", "overstay", "after expiration", "พักอาศัยเกิน", "หลังสิ้นสุดสัญญา"],
    typical_variants: ["Post-Lease Occupancy", "Continued Possession"],
    risk_triggers: ["2x-3x rent multiplier", "daily penalties", "immediate eviction right"]
  },

  // === RENT & PAYMENT (CAT-013 to CAT-020) ===
  {
    id: "CAT-013",
    canonical_name: "Rent Amount & Currency",
    purpose: "State monthly rent amount and currency",
    typical_keywords: ["rent", "monthly", "baht", "THB", "ค่าเช่า", "รายเดือน", "บาท"],
    typical_variants: ["Rental Fee", "Monthly Payment"],
    risk_triggers: ["rent in foreign currency", "variable rent formula"]
  },
  {
    id: "CAT-014",
    canonical_name: "Rent Due Date",
    purpose: "Specify which day of month rent is due",
    typical_keywords: ["due date", "payable", "by the", "ครบกำหนด", "ชำระภายใน"],
    typical_variants: ["Payment Date", "Due Day"],
    risk_triggers: ["no grace period mentioned", "due on weekends/holidays"]
  },
  {
    id: "CAT-015",
    canonical_name: "Rent Payment Method",
    purpose: "Define acceptable payment methods and account details",
    typical_keywords: ["bank transfer", "payment method", "account", "โอนเงิน", "บัญชี"],
    typical_variants: ["Payment Channel", "How to Pay"],
    risk_triggers: ["cash only", "no receipt requirement", "account can change without notice"]
  },
  {
    id: "CAT-016",
    canonical_name: "Late Payment Penalty",
    purpose: "Define consequences of late rent payment",
    typical_keywords: ["late fee", "penalty", "interest", "per day", "ค่าปรับ", "ดอกเบี้ย", "ต่อวัน"],
    typical_variants: ["Overdue Charge", "Default Interest"],
    risk_triggers: ["excessive daily rate (>1%)", "compound interest", "immediate termination right"]
  },
  {
    id: "CAT-017",
    canonical_name: "Rent Escalation / Increase",
    purpose: "Define how and when rent can increase",
    typical_keywords: ["increase", "escalation", "adjustment", "raise", "ขึ้นค่าเช่า", "ปรับขึ้น"],
    typical_variants: ["Rent Review", "Annual Adjustment"],
    risk_triggers: ["unlimited increase", "landlord sole discretion", "no cap percentage"]
  },
  {
    id: "CAT-018",
    canonical_name: "Advance Rent",
    purpose: "Define any rent paid in advance beyond first month",
    typical_keywords: ["advance", "prepaid", "upfront", "ล่วงหน้า", "จ่ายล่วงหน้า"],
    typical_variants: ["Prepayment", "Rent Deposit"],
    risk_triggers: ["excessive advance (>2 months)", "non-refundable advance"]
  },
  {
    id: "CAT-019",
    canonical_name: "Rent Receipts",
    purpose: "Obligation to provide payment receipts",
    typical_keywords: ["receipt", "acknowledgment", "confirmation", "ใบเสร็จ", "หลักฐาน"],
    typical_variants: ["Payment Confirmation", "Proof of Payment"],
    risk_triggers: ["no receipt obligation", "verbal acknowledgment only"]
  },
  {
    id: "CAT-020",
    canonical_name: "Partial Payment",
    purpose: "Whether partial rent payments are accepted",
    typical_keywords: ["partial", "incomplete", "less than", "บางส่วน", "ไม่ครบ"],
    typical_variants: ["Incomplete Payment", "Short Payment"],
    risk_triggers: ["partial payment rejected", "partial = full breach"]
  },

  // === SECURITY DEPOSIT (CAT-021 to CAT-028) ===
  {
    id: "CAT-021",
    canonical_name: "Security Deposit Amount",
    purpose: "State the security deposit amount",
    typical_keywords: ["deposit", "security", "guarantee", "เงินมัดจำ", "เงินประกัน"],
    typical_variants: ["Bond", "Damage Deposit"],
    risk_triggers: ["excessive (>2 months)", "multiple deposits (key deposit, etc.)"]
  },
  {
    id: "CAT-022",
    canonical_name: "Deposit Payment Terms",
    purpose: "When and how deposit must be paid",
    typical_keywords: ["upon signing", "before move-in", "ก่อนเข้าพัก", "เมื่อลงนาม"],
    typical_variants: ["Deposit Due", "Payment Schedule"],
    risk_triggers: ["immediate forfeiture if not paid", "no receipt required"]
  },
  {
    id: "CAT-023",
    canonical_name: "Deposit Holding",
    purpose: "Where and how deposit is held during tenancy",
    typical_keywords: ["held", "escrow", "account", "เก็บรักษา", "บัญชี"],
    typical_variants: ["Deposit Custody", "Safekeeping"],
    risk_triggers: ["no separate account", "landlord can use deposit", "no interest accrual"]
  },
  {
    id: "CAT-024",
    canonical_name: "Permitted Deposit Deductions",
    purpose: "What landlord can deduct from deposit",
    typical_keywords: ["deduct", "withhold", "damages", "unpaid", "หัก", "ค้างชำระ", "ความเสียหาย"],
    typical_variants: ["Deposit Setoff", "Deduction Rights"],
    risk_triggers: ["vague deduction grounds", "sole discretion", "alleged damages"]
  },
  {
    id: "CAT-025",
    canonical_name: "Deposit Return Timeline",
    purpose: "When deposit must be returned after move-out",
    typical_keywords: ["return", "refund", "within days", "คืน", "ภายใน"],
    typical_variants: ["Deposit Refund Period", "Return Schedule"],
    risk_triggers: ["no timeline specified", "excessive delay (>30 days)", "conditions precedent"]
  },
  {
    id: "CAT-026",
    canonical_name: "Deposit Return Procedure",
    purpose: "Process for returning deposit and providing itemization",
    typical_keywords: ["itemized", "statement", "inspection", "รายการ", "ตรวจสอบ"],
    typical_variants: ["Return Process", "Settlement Procedure"],
    risk_triggers: ["no itemization required", "no tenant presence at inspection"]
  },
  {
    id: "CAT-027",
    canonical_name: "Deposit Forfeiture Conditions",
    purpose: "Circumstances when entire deposit is lost",
    typical_keywords: ["forfeit", "lose", "waive", "ริบ", "สูญเสีย"],
    typical_variants: ["Deposit Loss", "Non-Refundable"],
    risk_triggers: ["early termination = full forfeiture", "any breach = forfeiture"]
  },
  {
    id: "CAT-028",
    canonical_name: "Wear and Tear Definition",
    purpose: "Define normal vs abnormal wear",
    typical_keywords: ["wear and tear", "normal use", "deterioration", "สึกหรอ", "การใช้งานปกติ"],
    typical_variants: ["Fair Wear", "Reasonable Use"],
    risk_triggers: ["no wear and tear allowance", "subjective standard"]
  },

  // === UTILITIES & SERVICES (CAT-029 to CAT-034) ===
  {
    id: "CAT-029",
    canonical_name: "Electricity Charges",
    purpose: "Define electricity billing method and rates",
    typical_keywords: ["electricity", "electric", "unit", "meter", "ไฟฟ้า", "หน่วย", "มิเตอร์"],
    typical_variants: ["Power Charges", "Electric Bill"],
    risk_triggers: ["above MEA rate", "no rate disclosure", "landlord markup"]
  },
  {
    id: "CAT-030",
    canonical_name: "Water Charges",
    purpose: "Define water billing method and rates",
    typical_keywords: ["water", "unit", "meter", "น้ำประปา", "หน่วย"],
    typical_variants: ["Water Bill", "MWA Charges"],
    risk_triggers: ["above MWA rate", "flat fee regardless of usage", "no meter reading"]
  },
  {
    id: "CAT-031",
    canonical_name: "Internet & Cable",
    purpose: "Internet and TV service arrangements",
    typical_keywords: ["internet", "wifi", "cable", "TV", "อินเทอร์เน็ต"],
    typical_variants: ["Connectivity", "Broadband"],
    risk_triggers: ["mandatory provider", "no cancellation right", "included but quality not guaranteed"]
  },
  {
    id: "CAT-032",
    canonical_name: "Common Area Fees",
    purpose: "Monthly building/condo common area fees",
    typical_keywords: ["common fee", "CAM", "maintenance fee", "ค่าส่วนกลาง"],
    typical_variants: ["Management Fee", "Building Fee"],
    risk_triggers: ["tenant pays CAM directly", "CAM increases passed through"]
  },
  {
    id: "CAT-033",
    canonical_name: "Utility Disconnection Rights",
    purpose: "Whether landlord can cut utilities for non-payment",
    typical_keywords: ["disconnect", "cut", "suspend", "terminate", "ตัด", "ระงับ"],
    typical_variants: ["Service Termination", "Utility Cutoff"],
    risk_triggers: ["disconnection as penalty (ILLEGAL in Thailand)", "no cure period"]
  },
  {
    id: "CAT-034",
    canonical_name: "Utility Deposit",
    purpose: "Separate deposits for utilities",
    typical_keywords: ["utility deposit", "meter deposit", "เงินมัดจำมิเตอร์"],
    typical_variants: ["Service Deposit", "Meter Bond"],
    risk_triggers: ["non-refundable", "excessive amount", "no return timeline"]
  },

  // === MAINTENANCE & REPAIRS (CAT-035 to CAT-042) ===
  {
    id: "CAT-035",
    canonical_name: "Tenant Maintenance Obligations",
    purpose: "What tenant must maintain and repair",
    typical_keywords: ["tenant maintain", "tenant repair", "responsible for", "ผู้เช่าดูแล", "รับผิดชอบ"],
    typical_variants: ["Lessee's Maintenance", "Renter's Duties"],
    risk_triggers: ["excessive scope", "structural repairs on tenant", "HVAC on tenant"]
  },
  {
    id: "CAT-036",
    canonical_name: "Landlord Maintenance Obligations",
    purpose: "What landlord must maintain and repair",
    typical_keywords: ["landlord maintain", "owner repair", "lessor responsible", "เจ้าของดูแล"],
    typical_variants: ["Lessor's Maintenance", "Owner's Duties"],
    risk_triggers: ["minimal obligations", "no timeline for repairs", "no emergency response"]
  },
  {
    id: "CAT-037",
    canonical_name: "Repair Request Procedure",
    purpose: "How tenant reports issues and requests repairs",
    typical_keywords: ["report", "notify", "request", "แจ้ง", "ขอ"],
    typical_variants: ["Maintenance Request", "Issue Reporting"],
    risk_triggers: ["written notice only", "complex procedure", "no acknowledgment required"]
  },
  {
    id: "CAT-038",
    canonical_name: "Repair Timeline",
    purpose: "How quickly landlord must respond to repair requests",
    typical_keywords: ["within days", "response time", "ภายใน", "ระยะเวลา"],
    typical_variants: ["Repair SLA", "Response Period"],
    risk_triggers: ["no timeline", "unreasonable delays allowed", "no emergency provision"]
  },
  {
    id: "CAT-039",
    canonical_name: "Emergency Repairs",
    purpose: "Handling urgent repair situations",
    typical_keywords: ["emergency", "urgent", "immediate", "ฉุกเฉิน", "เร่งด่วน"],
    typical_variants: ["Critical Repairs", "Urgent Maintenance"],
    risk_triggers: ["no emergency definition", "tenant cannot self-remedy", "no reimbursement"]
  },
  {
    id: "CAT-040",
    canonical_name: "Alterations & Improvements",
    purpose: "Tenant's right to modify the property",
    typical_keywords: ["alteration", "modification", "improvement", "ดัดแปลง", "ปรับปรุง"],
    typical_variants: ["Changes", "Fit-out"],
    risk_triggers: ["no alterations allowed", "approval at sole discretion", "must restore at end"]
  },
  {
    id: "CAT-041",
    canonical_name: "Restoration at End of Lease",
    purpose: "Requirement to return property to original condition",
    typical_keywords: ["restore", "original condition", "reinstate", "คืนสภาพ", "สภาพเดิม"],
    typical_variants: ["Make Good", "Return Condition"],
    risk_triggers: ["strict original condition", "no wear allowance", "professional restoration required"]
  },
  {
    id: "CAT-042",
    canonical_name: "Appliance Maintenance",
    purpose: "Responsibility for appliance upkeep",
    typical_keywords: ["appliance", "aircon", "AC", "refrigerator", "เครื่องใช้ไฟฟ้า", "แอร์"],
    typical_variants: ["Equipment Care", "A/C Service"],
    risk_triggers: ["tenant pays all appliance repairs", "no age/depreciation consideration"]
  },

  // === USE & OCCUPANCY (CAT-043 to CAT-052) ===
  {
    id: "CAT-043",
    canonical_name: "Permitted Use",
    purpose: "Define allowed use of the property",
    typical_keywords: ["residential", "use", "purpose", "พักอาศัย", "วัตถุประสงค์"],
    typical_variants: ["Allowed Activities", "Property Purpose"],
    risk_triggers: ["strictly residential only", "no work from home"]
  },
  {
    id: "CAT-044",
    canonical_name: "Prohibited Activities",
    purpose: "Activities not allowed on premises",
    typical_keywords: ["prohibit", "not allowed", "forbidden", "ห้าม", "ไม่อนุญาต"],
    typical_variants: ["Restrictions", "Banned Activities"],
    risk_triggers: ["broad prohibitions", "vague terms", "immediate termination trigger"]
  },
  {
    id: "CAT-045",
    canonical_name: "Occupancy Limits",
    purpose: "Maximum number of occupants allowed",
    typical_keywords: ["occupant", "person", "maximum", "ผู้อยู่อาศัย", "สูงสุด"],
    typical_variants: ["Resident Limit", "Headcount"],
    risk_triggers: ["strict limits", "registration required", "fees per person"]
  },
  {
    id: "CAT-046",
    canonical_name: "Guest Policy",
    purpose: "Rules for visitors and overnight guests",
    typical_keywords: ["guest", "visitor", "overnight", "แขก", "ผู้มาเยือน", "ค้างคืน"],
    typical_variants: ["Visitor Rules", "Guest Restrictions"],
    risk_triggers: ["guest registration", "limits on overnight stays", "guest fees"]
  },
  {
    id: "CAT-047",
    canonical_name: "Pet Policy",
    purpose: "Rules regarding keeping pets",
    typical_keywords: ["pet", "animal", "dog", "cat", "สัตว์เลี้ยง", "สุนัข", "แมว"],
    typical_variants: ["Animal Policy", "Pet Restrictions"],
    risk_triggers: ["no pets absolute", "pet deposit", "breed restrictions", "fines"]
  },
  {
    id: "CAT-048",
    canonical_name: "Smoking Policy",
    purpose: "Rules regarding smoking on premises",
    typical_keywords: ["smoking", "smoke", "cigarette", "บุหรี่", "สูบบุหรี่"],
    typical_variants: ["No Smoking", "Tobacco Policy"],
    risk_triggers: ["heavy fines", "immediate termination", "balcony included"]
  },
  {
    id: "CAT-049",
    canonical_name: "Noise & Nuisance",
    purpose: "Rules about noise levels and disturbance",
    typical_keywords: ["noise", "quiet", "nuisance", "disturbance", "เสียง", "รบกวน"],
    typical_variants: ["Quiet Hours", "Disturbance Policy"],
    risk_triggers: ["subjective standard", "neighbor complaints = breach", "no warning"]
  },
  {
    id: "CAT-050",
    canonical_name: "Subletting & Assignment",
    purpose: "Whether tenant can sublet or assign lease",
    typical_keywords: ["sublet", "sublease", "assign", "transfer", "ให้เช่าช่วง", "โอนสิทธิ"],
    typical_variants: ["Sublease Rights", "Lease Transfer"],
    risk_triggers: ["absolute prohibition", "consent at sole discretion"]
  },
  {
    id: "CAT-051",
    canonical_name: "Short-term Letting Ban",
    purpose: "Prohibition on Airbnb-style rentals",
    typical_keywords: ["short-term", "daily", "Airbnb", "รายวัน", "ระยะสั้น"],
    typical_variants: ["No Daily Rental", "Short Stay Ban"],
    risk_triggers: ["immediate termination", "heavy fines", "criminal referral"]
  },
  {
    id: "CAT-052",
    canonical_name: "Business Use Restrictions",
    purpose: "Rules about conducting business from property",
    typical_keywords: ["business", "commercial", "work", "office", "ธุรกิจ", "ทำงาน"],
    typical_variants: ["WFH Policy", "Commercial Activity"],
    risk_triggers: ["no WFH allowed", "vague definition of business", "registration requirement"]
  },

  // === ACCESS & PRIVACY (CAT-053 to CAT-057) ===
  {
    id: "CAT-053",
    canonical_name: "Landlord Entry Rights",
    purpose: "When and how landlord can enter property",
    typical_keywords: ["entry", "access", "enter", "inspection", "เข้า", "ตรวจสอบ"],
    typical_variants: ["Right of Access", "Inspection Rights"],
    risk_triggers: ["entry without notice", "entry at any time", "no consent required"]
  },
  {
    id: "CAT-054",
    canonical_name: "Notice for Entry",
    purpose: "Advance notice required before landlord entry",
    typical_keywords: ["notice", "advance", "hours", "days", "แจ้งล่วงหน้า", "ชั่วโมง"],
    typical_variants: ["Entry Notice", "Access Warning"],
    risk_triggers: ["no notice requirement", "less than 24 hours", "emergency too broadly defined"]
  },
  {
    id: "CAT-055",
    canonical_name: "Emergency Entry",
    purpose: "Entry without notice in emergencies",
    typical_keywords: ["emergency", "urgent", "fire", "flood", "ฉุกเฉิน", "ไฟไหม้", "น้ำท่วม"],
    typical_variants: ["Urgent Access", "Emergency Inspection"],
    risk_triggers: ["emergency not defined", "landlord determines emergency"]
  },
  {
    id: "CAT-056",
    canonical_name: "Keys & Access Devices",
    purpose: "Rules about keys, cards, and access control",
    typical_keywords: ["key", "card", "access", "lock", "กุญแจ", "บัตร"],
    typical_variants: ["Access Control", "Security Devices"],
    risk_triggers: ["landlord retains key", "no lock change allowed", "duplicate key requirement"]
  },
  {
    id: "CAT-057",
    canonical_name: "Privacy & Personal Data",
    purpose: "Protection of tenant's personal information",
    typical_keywords: ["privacy", "personal data", "PDPA", "ความเป็นส่วนตัว", "ข้อมูลส่วนบุคคล"],
    typical_variants: ["Data Protection", "Information Privacy"],
    risk_triggers: ["no PDPA compliance", "data sharing with third parties", "surveillance"]
  },

  // === INSURANCE & LIABILITY (CAT-058 to CAT-062) ===
  {
    id: "CAT-058",
    canonical_name: "Tenant Insurance Requirement",
    purpose: "Whether tenant must carry insurance",
    typical_keywords: ["insurance", "coverage", "policy", "ประกันภัย", "กรมธรรม์"],
    typical_variants: ["Renter's Insurance", "Content Insurance"],
    risk_triggers: ["mandatory expensive coverage", "landlord as beneficiary only"]
  },
  {
    id: "CAT-059",
    canonical_name: "Landlord Insurance",
    purpose: "What landlord's insurance covers",
    typical_keywords: ["building insurance", "property insurance", "ประกันอาคาร"],
    typical_variants: ["Lessor's Coverage", "Structure Insurance"],
    risk_triggers: ["tenant not covered", "no disclosure of coverage"]
  },
  {
    id: "CAT-060",
    canonical_name: "Liability Limitations",
    purpose: "Limits on landlord's liability to tenant",
    typical_keywords: ["liability", "indemnify", "hold harmless", "รับผิด", "ชดใช้"],
    typical_variants: ["Limitation of Liability", "Indemnification"],
    risk_triggers: ["broad liability exclusion", "tenant indemnifies all", "no negligence exception"]
  },
  {
    id: "CAT-061",
    canonical_name: "Damage by Third Parties",
    purpose: "Responsibility for damage caused by others",
    typical_keywords: ["third party", "neighbor", "contractor", "บุคคลภายนอก"],
    typical_variants: ["External Damage", "Other Party Liability"],
    risk_triggers: ["tenant liable for all damage", "no force majeure exception"]
  },
  {
    id: "CAT-062",
    canonical_name: "Personal Property Risk",
    purpose: "Who bears risk of loss for tenant's belongings",
    typical_keywords: ["personal property", "belongings", "theft", "ทรัพย์สินส่วนตัว", "ขโมย"],
    typical_variants: ["Content Risk", "Personal Effects"],
    risk_triggers: ["landlord not responsible for any loss", "no security obligation"]
  },

  // === DEFAULT & REMEDIES (CAT-063 to CAT-068) ===
  {
    id: "CAT-063",
    canonical_name: "Events of Default",
    purpose: "Define what constitutes a breach of lease",
    typical_keywords: ["default", "breach", "violation", "ผิดสัญญา", "ละเมิด"],
    typical_variants: ["Breach Events", "Contract Violation"],
    risk_triggers: ["minor violations = default", "subjective triggers", "no materiality threshold"]
  },
  {
    id: "CAT-064",
    canonical_name: "Cure Period",
    purpose: "Time allowed to fix a breach before termination",
    typical_keywords: ["cure", "remedy", "rectify", "แก้ไข", "เยียวยา"],
    typical_variants: ["Grace Period", "Rectification Period"],
    risk_triggers: ["no cure period", "short cure (<7 days)", "non-curable breaches too broad"]
  },
  {
    id: "CAT-065",
    canonical_name: "Termination for Breach",
    purpose: "How lease can be terminated for default",
    typical_keywords: ["terminate", "end", "cancel", "ยกเลิก", "สิ้นสุด"],
    typical_variants: ["Contract Termination", "Lease Cancellation"],
    risk_triggers: ["immediate termination", "no notice required", "no cure opportunity"]
  },
  {
    id: "CAT-066",
    canonical_name: "Damages & Penalties",
    purpose: "Financial consequences of breach",
    typical_keywords: ["damages", "penalty", "compensation", "ค่าเสียหาย", "ค่าปรับ"],
    typical_variants: ["Liquidated Damages", "Breach Penalty"],
    risk_triggers: ["excessive penalties", "penalty stacking", "no actual damage requirement"]
  },
  {
    id: "CAT-067",
    canonical_name: "Abandoned Property",
    purpose: "Handling tenant's belongings after move-out",
    typical_keywords: ["abandon", "left behind", "dispose", "ทิ้ง", "ทอดทิ้ง"],
    typical_variants: ["Deserted Property", "Left Items"],
    risk_triggers: ["short timeframe (<7 days)", "immediate disposal", "no storage obligation"]
  },
  {
    id: "CAT-068",
    canonical_name: "Eviction Procedure",
    purpose: "Legal process for removing tenant",
    typical_keywords: ["eviction", "remove", "vacate", "ขับไล่", "ย้ายออก"],
    typical_variants: ["Removal Process", "Eviction Rights"],
    risk_triggers: ["self-help eviction", "lock change", "utility cutoff", "belongings removal"]
  },

  // === LEGAL & DISPUTE (CAT-069 to CAT-075) ===
  {
    id: "CAT-069",
    canonical_name: "Governing Law",
    purpose: "Which country's laws govern the contract",
    typical_keywords: ["governing law", "applicable law", "Thai law", "กฎหมายที่ใช้บังคับ"],
    typical_variants: ["Choice of Law", "Legal Jurisdiction"],
    risk_triggers: ["foreign law chosen", "no governing law specified"]
  },
  {
    id: "CAT-070",
    canonical_name: "Dispute Resolution",
    purpose: "How disputes will be resolved",
    typical_keywords: ["dispute", "resolution", "mediation", "arbitration", "ข้อพิพาท", "ไกล่เกลี่ย"],
    typical_variants: ["Conflict Resolution", "Settlement Process"],
    risk_triggers: ["mandatory arbitration", "landlord chooses forum", "waiver of court access"]
  },
  {
    id: "CAT-071",
    canonical_name: "Court Jurisdiction",
    purpose: "Which court has jurisdiction over disputes",
    typical_keywords: ["court", "jurisdiction", "venue", "ศาล", "เขตอำนาจ"],
    typical_variants: ["Forum Selection", "Court Choice"],
    risk_triggers: ["inconvenient venue", "foreign court", "waiver of jurisdiction objection"]
  },
  {
    id: "CAT-072",
    canonical_name: "Legal Fees",
    purpose: "Who pays legal fees in disputes",
    typical_keywords: ["legal fees", "attorney", "costs", "ค่าทนาย", "ค่าใช้จ่าย"],
    typical_variants: ["Litigation Costs", "Legal Expenses"],
    risk_triggers: ["loser pays all", "tenant pays regardless", "landlord's fees from deposit"]
  },
  {
    id: "CAT-073",
    canonical_name: "Waiver of Rights",
    purpose: "Any rights tenant gives up by signing",
    typical_keywords: ["waive", "relinquish", "give up", "สละสิทธิ", "ยกเลิกสิทธิ"],
    typical_variants: ["Rights Waiver", "Surrender of Rights"],
    risk_triggers: ["waiver of legal rights", "class action waiver", "jury waiver"]
  },
  {
    id: "CAT-074",
    canonical_name: "Notices & Communications",
    purpose: "How formal notices must be given",
    typical_keywords: ["notice", "written", "delivery", "registered mail", "แจ้ง", "ลงทะเบียน"],
    typical_variants: ["Communication Method", "Notice Requirements"],
    risk_triggers: ["multi-channel required", "confirmed receipt required", "short windows"]
  },
  {
    id: "CAT-075",
    canonical_name: "Severability",
    purpose: "What happens if part of contract is invalid",
    typical_keywords: ["severability", "invalid", "unenforceable", "แยกส่วน", "ใช้บังคับไม่ได้"],
    typical_variants: ["Partial Invalidity", "Contract Survival"],
    risk_triggers: ["entire contract void if any part invalid", "no severability clause"]
  },

  // === SPECIAL PROVISIONS (CAT-076 to CAT-082) ===
  {
    id: "CAT-076",
    canonical_name: "Force Majeure",
    purpose: "Events beyond control that excuse performance",
    typical_keywords: ["force majeure", "act of god", "เหตุสุดวิสัย", "ภัยธรรมชาติ"],
    typical_variants: ["Extraordinary Events", "Unforeseeable Circumstances"],
    risk_triggers: ["no force majeure clause", "tenant still liable during FM", "pandemic excluded"]
  },
  {
    id: "CAT-077",
    canonical_name: "Entire Agreement",
    purpose: "Contract is the complete agreement, no side deals",
    typical_keywords: ["entire agreement", "complete", "supersedes", "ข้อตกลงทั้งหมด"],
    typical_variants: ["Integration Clause", "Merger Clause"],
    risk_triggers: ["verbal promises not binding", "no amendment process"]
  },
  {
    id: "CAT-078",
    canonical_name: "Amendments",
    purpose: "How contract can be modified",
    typical_keywords: ["amend", "modify", "change", "แก้ไข", "เปลี่ยนแปลง"],
    typical_variants: ["Contract Changes", "Modifications"],
    risk_triggers: ["landlord can amend unilaterally", "no written amendment required"]
  },
  {
    id: "CAT-079",
    canonical_name: "Representations & Warranties",
    purpose: "Promises made by each party about facts",
    typical_keywords: ["represent", "warrant", "guarantee", "รับรอง", "รับประกัน"],
    typical_variants: ["Assurances", "Statements of Fact"],
    risk_triggers: ["no landlord representations", "tenant warrants everything"]
  },
  {
    id: "CAT-080",
    canonical_name: "Move-Out Procedure",
    purpose: "Steps required when vacating property",
    typical_keywords: ["move-out", "vacate", "handover", "ย้ายออก", "ส่งมอบ"],
    typical_variants: ["End of Tenancy", "Property Return"],
    risk_triggers: ["unreasonable requirements", "professional cleaning mandatory", "no joint inspection"]
  },
  {
    id: "CAT-081",
    canonical_name: "Signatures & Witnesses",
    purpose: "Execution requirements for the contract",
    typical_keywords: ["sign", "execute", "witness", "ลงนาม", "พยาน"],
    typical_variants: ["Contract Execution", "Authentication"],
    risk_triggers: ["witness required but missing", "POA not attached"]
  },
  {
    id: "CAT-082",
    canonical_name: "Language & Translation",
    purpose: "Which language version controls if bilingual",
    typical_keywords: ["language", "Thai", "English", "translation", "ภาษา", "แปล"],
    typical_variants: ["Controlling Version", "Interpretation"],
    risk_triggers: ["foreign language controls", "no Thai version", "translation discrepancies"]
  },

  // === UNMAPPED CATCH-ALL ===
  {
    id: "CAT-UNMAPPED",
    canonical_name: "Unclassified Clause",
    purpose: "Clauses that don't fit standard categories",
    typical_keywords: [],
    typical_variants: [],
    risk_triggers: ["unusual or non-standard terms requiring manual review"]
  }
];

// Export function to get catalog
export function getCanonicalCatalog() {
  return CANONICAL_CLAUSE_CATALOG;
}

// Deno serve endpoint
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  
  return Response.json({
    success: true,
    catalog: CANONICAL_CLAUSE_CATALOG,
    total_categories: CANONICAL_CLAUSE_CATALOG.length
  });
});