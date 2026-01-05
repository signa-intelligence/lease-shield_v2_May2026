import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { handleCors, ensureAllowedOrigin } from './http.js';

// ============================================================================
// CANONICAL CLAUSE CATALOG - Thailand Residential Lease Standard v1.1
// This is the authoritative source of truth for lease clause taxonomy
// ============================================================================

const CATALOG_VERSION = "v1.1";
const CATALOG_UPDATED_AT = "2026-01-05T00:00:00Z";

const CANONICAL_CLAUSE_CATALOG = [
  // === PARTIES & PROPERTY (CAT-001 to CAT-005) ===
  {
    catalog_id: "CAT-001",
    canonical_name: "Parties Identification",
    purpose: "Identify lessor (landlord) and lessee (tenant) with full legal names and ID numbers",
    typical_keywords: ["lessor", "lessee", "landlord", "tenant", "party", "ผู้ให้เช่า", "ผู้เช่า"],
    typical_variants: ["First Party / Second Party", "Owner / Renter"],
    risk_triggers: ["missing ID numbers", "agent signing without POA", "corporate entity without authorized signatory"],
    is_active: true,
    sort_order: 1
  },
  {
    catalog_id: "CAT-002",
    canonical_name: "Property Description",
    purpose: "Define the leased premises with address, unit number, and boundaries",
    typical_keywords: ["premises", "property", "unit", "address", "ทรัพย์สิน", "ห้องพัก", "ที่อยู่"],
    typical_variants: ["Leased Property", "Subject Matter"],
    risk_triggers: ["vague description", "no unit number", "no chanote/title reference"],
    is_active: true,
    sort_order: 2
  },
  {
    catalog_id: "CAT-003",
    canonical_name: "Property Condition at Handover",
    purpose: "Document the state of property at lease commencement",
    typical_keywords: ["condition", "as-is", "inventory", "สภาพ", "รายการทรัพย์สิน"],
    typical_variants: ["Move-in Condition", "Premises State"],
    risk_triggers: ["no inventory list", "no photo documentation requirement", "as-is without inspection period"],
    is_active: true,
    sort_order: 3
  },
  {
    catalog_id: "CAT-004",
    canonical_name: "Furnishings & Fixtures Inventory",
    purpose: "List all furniture, appliances, and fixtures included",
    typical_keywords: ["furniture", "appliances", "fixtures", "inventory", "เฟอร์นิเจอร์", "เครื่องใช้ไฟฟ้า"],
    typical_variants: ["Equipment List", "Included Items"],
    risk_triggers: ["no itemized list", "no condition assessment", "no photos"],
    is_active: true,
    sort_order: 4
  },
  {
    catalog_id: "CAT-005",
    canonical_name: "Common Areas & Facilities",
    purpose: "Define access to shared facilities (pool, gym, parking)",
    typical_keywords: ["common area", "facilities", "amenities", "parking", "พื้นที่ส่วนกลาง", "สิ่งอำนวยความสะดวก"],
    typical_variants: ["Shared Facilities", "Building Amenities"],
    risk_triggers: ["facilities access can be revoked", "extra fees for amenities", "no guaranteed parking"],
    is_active: true,
    sort_order: 5
  },

  // === LEASE TERM (CAT-006 to CAT-012) ===
  {
    catalog_id: "CAT-006",
    canonical_name: "Lease Term & Commencement",
    purpose: "Define start date, end date, and duration of tenancy",
    typical_keywords: ["term", "commence", "duration", "period", "ระยะเวลา", "เริ่มต้น", "สิ้นสุด"],
    typical_variants: ["Tenancy Period", "Lease Duration"],
    risk_triggers: ["unclear start date", "term exceeds 3 years without registration"],
    is_active: true,
    sort_order: 6
  },
  {
    catalog_id: "CAT-007",
    canonical_name: "Renewal Terms",
    purpose: "Define how lease can be renewed and under what conditions",
    typical_keywords: ["renew", "renewal", "extend", "extension", "ต่อสัญญา", "ขยายเวลา"],
    typical_variants: ["Lease Extension", "Continuation"],
    risk_triggers: ["auto-renewal without consent", "renewal at landlord's sole discretion", "no renewal option"],
    is_active: true,
    sort_order: 7
  },
  {
    catalog_id: "CAT-008",
    canonical_name: "Auto-Renewal Mechanism",
    purpose: "Specify automatic renewal conditions and opt-out procedures",
    typical_keywords: ["automatic", "auto-renew", "unless notice", "อัตโนมัติ", "ต่ออายุโดยอัตโนมัติ"],
    typical_variants: ["Tacit Renewal", "Evergreen Clause"],
    risk_triggers: ["short opt-out window", "multi-channel notice required", "confirmed receipt required"],
    is_active: true,
    sort_order: 8
  },
  {
    catalog_id: "CAT-009",
    canonical_name: "Notice Period for Non-Renewal",
    purpose: "Define advance notice required to not renew",
    typical_keywords: ["notice", "days before", "advance", "แจ้งล่วงหน้า", "ก่อนสิ้นสุด"],
    typical_variants: ["Termination Notice", "End Notice"],
    risk_triggers: ["excessive notice period (>60 days)", "complex notice requirements"],
    is_active: true,
    sort_order: 9
  },
  {
    catalog_id: "CAT-010",
    canonical_name: "Early Termination by Tenant",
    purpose: "Conditions under which tenant can terminate early",
    typical_keywords: ["early termination", "break clause", "tenant terminate", "ยกเลิกก่อนกำหนด"],
    typical_variants: ["Tenant Break", "Premature End"],
    risk_triggers: ["no early termination right", "full deposit forfeiture", "remaining rent liability"],
    is_active: true,
    sort_order: 10
  },
  {
    catalog_id: "CAT-011",
    canonical_name: "Early Termination by Landlord",
    purpose: "Conditions under which landlord can terminate early",
    typical_keywords: ["landlord terminate", "owner terminate", "เจ้าของยกเลิก"],
    typical_variants: ["Lessor Break", "Owner's Right to Terminate"],
    risk_triggers: ["termination without cause", "short notice", "no relocation compensation"],
    is_active: true,
    sort_order: 11
  },
  {
    catalog_id: "CAT-012",
    canonical_name: "Holdover Tenancy",
    purpose: "Define status and rent if tenant stays past lease end",
    typical_keywords: ["holdover", "overstay", "after expiration", "พักอาศัยเกิน", "หลังสิ้นสุดสัญญา"],
    typical_variants: ["Post-Lease Occupancy", "Continued Possession"],
    risk_triggers: ["2x-3x rent multiplier", "daily penalties", "immediate eviction right"],
    is_active: true,
    sort_order: 12
  },

  // === RENT & PAYMENT (CAT-013 to CAT-020) ===
  {
    catalog_id: "CAT-013",
    canonical_name: "Rent Amount & Currency",
    purpose: "State monthly rent amount and currency",
    typical_keywords: ["rent", "monthly", "baht", "THB", "ค่าเช่า", "รายเดือน", "บาท"],
    typical_variants: ["Rental Fee", "Monthly Payment"],
    risk_triggers: ["rent in foreign currency", "variable rent formula"],
    is_active: true,
    sort_order: 13
  },
  {
    catalog_id: "CAT-014",
    canonical_name: "Rent Due Date",
    purpose: "Specify which day of month rent is due",
    typical_keywords: ["due date", "payable", "by the", "ครบกำหนด", "ชำระภายใน"],
    typical_variants: ["Payment Date", "Due Day"],
    risk_triggers: ["no grace period mentioned", "due on weekends/holidays"],
    is_active: true,
    sort_order: 14
  },
  {
    catalog_id: "CAT-015",
    canonical_name: "Rent Payment Method",
    purpose: "Define acceptable payment methods and account details",
    typical_keywords: ["bank transfer", "payment method", "account", "โอนเงิน", "บัญชี"],
    typical_variants: ["Payment Channel", "How to Pay"],
    risk_triggers: ["cash only", "no receipt requirement", "account can change without notice"],
    is_active: true,
    sort_order: 15
  },
  {
    catalog_id: "CAT-016",
    canonical_name: "Late Payment Penalty",
    purpose: "Define consequences of late rent payment",
    typical_keywords: ["late fee", "penalty", "interest", "per day", "ค่าปรับ", "ดอกเบี้ย", "ต่อวัน"],
    typical_variants: ["Overdue Charge", "Default Interest"],
    risk_triggers: ["excessive daily rate (>1%)", "compound interest", "immediate termination right"],
    is_active: true,
    sort_order: 16
  },
  {
    catalog_id: "CAT-017",
    canonical_name: "Rent Escalation / Increase",
    purpose: "Define how and when rent can increase",
    typical_keywords: ["increase", "escalation", "adjustment", "raise", "ขึ้นค่าเช่า", "ปรับขึ้น"],
    typical_variants: ["Rent Review", "Annual Adjustment"],
    risk_triggers: ["unlimited increase", "landlord sole discretion", "no cap percentage"],
    is_active: true,
    sort_order: 17
  },
  {
    catalog_id: "CAT-018",
    canonical_name: "Advance Rent",
    purpose: "Define any rent paid in advance beyond first month",
    typical_keywords: ["advance", "prepaid", "upfront", "ล่วงหน้า", "จ่ายล่วงหน้า"],
    typical_variants: ["Prepayment", "Rent Deposit"],
    risk_triggers: ["excessive advance (>2 months)", "non-refundable advance"],
    is_active: true,
    sort_order: 18
  },
  {
    catalog_id: "CAT-019",
    canonical_name: "Rent Receipts",
    purpose: "Obligation to provide payment receipts",
    typical_keywords: ["receipt", "acknowledgment", "confirmation", "ใบเสร็จ", "หลักฐาน"],
    typical_variants: ["Payment Confirmation", "Proof of Payment"],
    risk_triggers: ["no receipt obligation", "verbal acknowledgment only"],
    is_active: true,
    sort_order: 19
  },
  {
    catalog_id: "CAT-020",
    canonical_name: "Partial Payment",
    purpose: "Whether partial rent payments are accepted",
    typical_keywords: ["partial", "incomplete", "less than", "บางส่วน", "ไม่ครบ"],
    typical_variants: ["Incomplete Payment", "Short Payment"],
    risk_triggers: ["partial payment rejected", "partial = full breach"],
    is_active: true,
    sort_order: 20
  },

  // === SECURITY DEPOSIT (CAT-021 to CAT-028) ===
  {
    catalog_id: "CAT-021",
    canonical_name: "Security Deposit Amount",
    purpose: "State the security deposit amount",
    typical_keywords: ["deposit", "security", "guarantee", "เงินมัดจำ", "เงินประกัน"],
    typical_variants: ["Bond", "Damage Deposit"],
    risk_triggers: ["excessive (>2 months)", "multiple deposits (key deposit, etc.)"],
    is_active: true,
    sort_order: 21
  },
  {
    catalog_id: "CAT-022",
    canonical_name: "Deposit Payment Terms",
    purpose: "When and how deposit must be paid",
    typical_keywords: ["upon signing", "before move-in", "ก่อนเข้าพัก", "เมื่อลงนาม"],
    typical_variants: ["Deposit Due", "Payment Schedule"],
    risk_triggers: ["immediate forfeiture if not paid", "no receipt required"],
    is_active: true,
    sort_order: 22
  },
  {
    catalog_id: "CAT-023",
    canonical_name: "Deposit Holding",
    purpose: "Where and how deposit is held during tenancy",
    typical_keywords: ["held", "escrow", "account", "เก็บรักษา", "บัญชี"],
    typical_variants: ["Deposit Custody", "Safekeeping"],
    risk_triggers: ["no separate account", "landlord can use deposit", "no interest accrual"],
    is_active: true,
    sort_order: 23
  },
  {
    catalog_id: "CAT-024",
    canonical_name: "Permitted Deposit Deductions",
    purpose: "What landlord can deduct from deposit",
    typical_keywords: ["deduct", "withhold", "damages", "unpaid", "หัก", "ค้างชำระ", "ความเสียหาย"],
    typical_variants: ["Deposit Setoff", "Deduction Rights"],
    risk_triggers: ["vague deduction grounds", "sole discretion", "alleged damages"],
    is_active: true,
    sort_order: 24
  },
  {
    catalog_id: "CAT-025",
    canonical_name: "Deposit Return Timeline",
    purpose: "When deposit must be returned after move-out",
    typical_keywords: ["return", "refund", "within days", "คืน", "ภายใน"],
    typical_variants: ["Deposit Refund Period", "Return Schedule"],
    risk_triggers: ["no timeline specified", "excessive delay (>30 days)", "conditions precedent"],
    is_active: true,
    sort_order: 25
  },
  {
    catalog_id: "CAT-026",
    canonical_name: "Deposit Return Procedure",
    purpose: "Process for returning deposit and providing itemization",
    typical_keywords: ["itemized", "statement", "inspection", "รายการ", "ตรวจสอบ"],
    typical_variants: ["Return Process", "Settlement Procedure"],
    risk_triggers: ["no itemization required", "no tenant presence at inspection"],
    is_active: true,
    sort_order: 26
  },
  {
    catalog_id: "CAT-027",
    canonical_name: "Deposit Forfeiture Conditions",
    purpose: "Circumstances when entire deposit is lost",
    typical_keywords: ["forfeit", "lose", "waive", "ริบ", "สูญเสีย"],
    typical_variants: ["Deposit Loss", "Non-Refundable"],
    risk_triggers: ["early termination = full forfeiture", "any breach = forfeiture"],
    is_active: true,
    sort_order: 27
  },
  {
    catalog_id: "CAT-028",
    canonical_name: "Wear and Tear Definition",
    purpose: "Define normal vs abnormal wear",
    typical_keywords: ["wear and tear", "normal use", "deterioration", "สึกหรอ", "การใช้งานปกติ"],
    typical_variants: ["Fair Wear", "Reasonable Use"],
    risk_triggers: ["no wear and tear allowance", "subjective standard"],
    is_active: true,
    sort_order: 28
  },

  // === UTILITIES & SERVICES (CAT-029 to CAT-034) ===
  {
    catalog_id: "CAT-029",
    canonical_name: "Electricity Charges",
    purpose: "Define electricity billing method and rates",
    typical_keywords: ["electricity", "electric", "unit", "meter", "ไฟฟ้า", "หน่วย", "มิเตอร์"],
    typical_variants: ["Power Charges", "Electric Bill"],
    risk_triggers: ["above MEA rate", "no rate disclosure", "landlord markup"],
    is_active: true,
    sort_order: 29
  },
  {
    catalog_id: "CAT-030",
    canonical_name: "Water Charges",
    purpose: "Define water billing method and rates",
    typical_keywords: ["water", "unit", "meter", "น้ำประปา", "หน่วย"],
    typical_variants: ["Water Bill", "MWA Charges"],
    risk_triggers: ["above MWA rate", "flat fee regardless of usage", "no meter reading"],
    is_active: true,
    sort_order: 30
  },
  {
    catalog_id: "CAT-031",
    canonical_name: "Internet & Cable",
    purpose: "Internet and TV service arrangements",
    typical_keywords: ["internet", "wifi", "cable", "TV", "อินเทอร์เน็ต"],
    typical_variants: ["Connectivity", "Broadband"],
    risk_triggers: ["mandatory provider", "no cancellation right", "included but quality not guaranteed"],
    is_active: true,
    sort_order: 31
  },
  {
    catalog_id: "CAT-032",
    canonical_name: "Common Area Fees",
    purpose: "Monthly building/condo common area fees",
    typical_keywords: ["common fee", "CAM", "maintenance fee", "ค่าส่วนกลาง"],
    typical_variants: ["Management Fee", "Building Fee"],
    risk_triggers: ["tenant pays CAM directly", "CAM increases passed through"],
    is_active: true,
    sort_order: 32
  },
  {
    catalog_id: "CAT-033",
    canonical_name: "Utility Disconnection Rights",
    purpose: "Whether landlord can cut utilities for non-payment",
    typical_keywords: ["disconnect", "cut", "suspend", "terminate", "ตัด", "ระงับ"],
    typical_variants: ["Service Termination", "Utility Cutoff"],
    risk_triggers: ["disconnection as penalty (ILLEGAL in Thailand)", "no cure period"],
    is_active: true,
    sort_order: 33
  },
  {
    catalog_id: "CAT-034",
    canonical_name: "Utility Deposit",
    purpose: "Separate deposits for utilities",
    typical_keywords: ["utility deposit", "meter deposit", "เงินมัดจำมิเตอร์"],
    typical_variants: ["Service Deposit", "Meter Bond"],
    risk_triggers: ["non-refundable", "excessive amount", "no return timeline"],
    is_active: true,
    sort_order: 34
  },

  // === MAINTENANCE & REPAIRS (CAT-035 to CAT-042) ===
  {
    catalog_id: "CAT-035",
    canonical_name: "Tenant Maintenance Obligations",
    purpose: "What tenant must maintain and repair",
    typical_keywords: ["tenant maintain", "tenant repair", "responsible for", "ผู้เช่าดูแล", "รับผิดชอบ"],
    typical_variants: ["Lessee's Maintenance", "Renter's Duties"],
    risk_triggers: ["excessive scope", "structural repairs on tenant", "HVAC on tenant"],
    is_active: true,
    sort_order: 35
  },
  {
    catalog_id: "CAT-036",
    canonical_name: "Landlord Maintenance Obligations",
    purpose: "What landlord must maintain and repair",
    typical_keywords: ["landlord maintain", "owner repair", "lessor responsible", "เจ้าของดูแล"],
    typical_variants: ["Lessor's Maintenance", "Owner's Duties"],
    risk_triggers: ["minimal obligations", "no timeline for repairs", "no emergency response"],
    is_active: true,
    sort_order: 36
  },
  {
    catalog_id: "CAT-037",
    canonical_name: "Repair Request Procedure",
    purpose: "How tenant reports issues and requests repairs",
    typical_keywords: ["report", "notify", "request", "แจ้ง", "ขอ"],
    typical_variants: ["Maintenance Request", "Issue Reporting"],
    risk_triggers: ["written notice only", "complex procedure", "no acknowledgment required"],
    is_active: true,
    sort_order: 37
  },
  {
    catalog_id: "CAT-038",
    canonical_name: "Repair Timeline",
    purpose: "How quickly landlord must respond to repair requests",
    typical_keywords: ["within days", "response time", "ภายใน", "ระยะเวลา"],
    typical_variants: ["Repair SLA", "Response Period"],
    risk_triggers: ["no timeline", "unreasonable delays allowed", "no emergency provision"],
    is_active: true,
    sort_order: 38
  },
  {
    catalog_id: "CAT-039",
    canonical_name: "Emergency Repairs",
    purpose: "Handling urgent repair situations",
    typical_keywords: ["emergency", "urgent", "immediate", "ฉุกเฉิน", "เร่งด่วน"],
    typical_variants: ["Critical Repairs", "Urgent Maintenance"],
    risk_triggers: ["no emergency definition", "tenant cannot self-remedy", "no reimbursement"],
    is_active: true,
    sort_order: 39
  },
  {
    catalog_id: "CAT-040",
    canonical_name: "Alterations & Improvements",
    purpose: "Tenant's right to modify the property",
    typical_keywords: ["alteration", "modification", "improvement", "ดัดแปลง", "ปรับปรุง"],
    typical_variants: ["Changes", "Fit-out"],
    risk_triggers: ["no alterations allowed", "approval at sole discretion", "must restore at end"],
    is_active: true,
    sort_order: 40
  },
  {
    catalog_id: "CAT-041",
    canonical_name: "Restoration at End of Lease",
    purpose: "Requirement to return property to original condition",
    typical_keywords: ["restore", "original condition", "reinstate", "คืนสภาพ", "สภาพเดิม"],
    typical_variants: ["Make Good", "Return Condition"],
    risk_triggers: ["strict original condition", "no wear allowance", "professional restoration required"],
    is_active: true,
    sort_order: 41
  },
  {
    catalog_id: "CAT-042",
    canonical_name: "Appliance Maintenance",
    purpose: "Responsibility for appliance upkeep",
    typical_keywords: ["appliance", "aircon", "AC", "refrigerator", "เครื่องใช้ไฟฟ้า", "แอร์"],
    typical_variants: ["Equipment Care", "A/C Service"],
    risk_triggers: ["tenant pays all appliance repairs", "no age/depreciation consideration"],
    is_active: true,
    sort_order: 42
  },

  // === USE & OCCUPANCY (CAT-043 to CAT-052) ===
  {
    catalog_id: "CAT-043",
    canonical_name: "Permitted Use",
    purpose: "Define allowed use of the property",
    typical_keywords: ["residential", "use", "purpose", "พักอาศัย", "วัตถุประสงค์"],
    typical_variants: ["Allowed Activities", "Property Purpose"],
    risk_triggers: ["strictly residential only", "no work from home"],
    is_active: true,
    sort_order: 43
  },
  {
    catalog_id: "CAT-044",
    canonical_name: "Prohibited Activities",
    purpose: "Activities not allowed on premises",
    typical_keywords: ["prohibit", "not allowed", "forbidden", "ห้าม", "ไม่อนุญาต"],
    typical_variants: ["Restrictions", "Banned Activities"],
    risk_triggers: ["broad prohibitions", "vague terms", "immediate termination trigger"],
    is_active: true,
    sort_order: 44
  },
  {
    catalog_id: "CAT-045",
    canonical_name: "Occupancy Limits",
    purpose: "Maximum number of occupants allowed",
    typical_keywords: ["occupant", "person", "maximum", "ผู้อยู่อาศัย", "สูงสุด"],
    typical_variants: ["Resident Limit", "Headcount"],
    risk_triggers: ["strict limits", "registration required", "fees per person"],
    is_active: true,
    sort_order: 45
  },
  {
    catalog_id: "CAT-046",
    canonical_name: "Guest Policy",
    purpose: "Rules for visitors and overnight guests",
    typical_keywords: ["guest", "visitor", "overnight", "แขก", "ผู้มาเยือน", "ค้างคืน"],
    typical_variants: ["Visitor Rules", "Guest Restrictions"],
    risk_triggers: ["guest registration", "limits on overnight stays", "guest fees"],
    is_active: true,
    sort_order: 46
  },
  {
    catalog_id: "CAT-047",
    canonical_name: "Pet Policy",
    purpose: "Rules regarding keeping pets",
    typical_keywords: ["pet", "animal", "dog", "cat", "สัตว์เลี้ยง", "สุนัข", "แมว"],
    typical_variants: ["Animal Policy", "Pet Restrictions"],
    risk_triggers: ["no pets absolute", "pet deposit", "breed restrictions", "fines"],
    is_active: true,
    sort_order: 47
  },
  {
    catalog_id: "CAT-048",
    canonical_name: "Smoking Policy",
    purpose: "Rules regarding smoking on premises",
    typical_keywords: ["smoking", "smoke", "cigarette", "บุหรี่", "สูบบุหรี่"],
    typical_variants: ["No Smoking", "Tobacco Policy"],
    risk_triggers: ["heavy fines", "immediate termination", "balcony included"],
    is_active: true,
    sort_order: 48
  },
  {
    catalog_id: "CAT-049",
    canonical_name: "Noise & Nuisance",
    purpose: "Rules about noise levels and disturbance",
    typical_keywords: ["noise", "quiet", "nuisance", "disturbance", "เสียง", "รบกวน"],
    typical_variants: ["Quiet Hours", "Disturbance Policy"],
    risk_triggers: ["subjective standard", "neighbor complaints = breach", "no warning"],
    is_active: true,
    sort_order: 49
  },
  {
    catalog_id: "CAT-050",
    canonical_name: "Subletting & Assignment",
    purpose: "Whether tenant can sublet or assign lease",
    typical_keywords: ["sublet", "sublease", "assign", "transfer", "ให้เช่าช่วง", "โอนสิทธิ"],
    typical_variants: ["Sublease Rights", "Lease Transfer"],
    risk_triggers: ["absolute prohibition", "consent at sole discretion"],
    is_active: true,
    sort_order: 50
  },
  {
    catalog_id: "CAT-051",
    canonical_name: "Short-term Letting Ban",
    purpose: "Prohibition on Airbnb-style rentals",
    typical_keywords: ["short-term", "daily", "Airbnb", "รายวัน", "ระยะสั้น"],
    typical_variants: ["No Daily Rental", "Short Stay Ban"],
    risk_triggers: ["immediate termination", "heavy fines", "criminal referral"],
    is_active: true,
    sort_order: 51
  },
  {
    catalog_id: "CAT-052",
    canonical_name: "Business Use Restrictions",
    purpose: "Rules about conducting business from property",
    typical_keywords: ["business", "commercial", "work", "office", "ธุรกิจ", "ทำงาน"],
    typical_variants: ["WFH Policy", "Commercial Activity"],
    risk_triggers: ["no WFH allowed", "vague definition of business", "registration requirement"],
    is_active: true,
    sort_order: 52
  },

  // === ACCESS & PRIVACY (CAT-053 to CAT-057) ===
  {
    catalog_id: "CAT-053",
    canonical_name: "Landlord Entry Rights",
    purpose: "When and how landlord can enter property",
    typical_keywords: ["entry", "access", "enter", "inspection", "เข้า", "ตรวจสอบ"],
    typical_variants: ["Right of Access", "Inspection Rights"],
    risk_triggers: ["entry without notice", "entry at any time", "no consent required"],
    is_active: true,
    sort_order: 53
  },
  {
    catalog_id: "CAT-054",
    canonical_name: "Notice for Entry",
    purpose: "Advance notice required before landlord entry",
    typical_keywords: ["notice", "advance", "hours", "days", "แจ้งล่วงหน้า", "ชั่วโมง"],
    typical_variants: ["Entry Notice", "Access Warning"],
    risk_triggers: ["no notice requirement", "less than 24 hours", "emergency too broadly defined"],
    is_active: true,
    sort_order: 54
  },
  {
    catalog_id: "CAT-055",
    canonical_name: "Emergency Entry",
    purpose: "Entry without notice in emergencies",
    typical_keywords: ["emergency", "urgent", "fire", "flood", "ฉุกเฉิน", "ไฟไหม้", "น้ำท่วม"],
    typical_variants: ["Urgent Access", "Emergency Inspection"],
    risk_triggers: ["emergency not defined", "landlord determines emergency"],
    is_active: true,
    sort_order: 55
  },
  {
    catalog_id: "CAT-056",
    canonical_name: "Keys & Access Devices",
    purpose: "Rules about keys, cards, and access control",
    typical_keywords: ["key", "card", "access", "lock", "กุญแจ", "บัตร"],
    typical_variants: ["Access Control", "Security Devices"],
    risk_triggers: ["landlord retains key", "no lock change allowed", "duplicate key requirement"],
    is_active: true,
    sort_order: 56
  },
  {
    catalog_id: "CAT-057",
    canonical_name: "Privacy & Personal Data",
    purpose: "Protection of tenant's personal information",
    typical_keywords: ["privacy", "personal data", "PDPA", "ความเป็นส่วนตัว", "ข้อมูลส่วนบุคคล"],
    typical_variants: ["Data Protection", "Information Privacy"],
    risk_triggers: ["no PDPA compliance", "data sharing with third parties", "surveillance"],
    is_active: true,
    sort_order: 57
  },

  // === INSURANCE & LIABILITY (CAT-058 to CAT-062) ===
  {
    catalog_id: "CAT-058",
    canonical_name: "Tenant Insurance Requirement",
    purpose: "Whether tenant must carry insurance",
    typical_keywords: ["insurance", "coverage", "policy", "ประกันภัย", "กรมธรรม์"],
    typical_variants: ["Renter's Insurance", "Content Insurance"],
    risk_triggers: ["mandatory expensive coverage", "landlord as beneficiary only"],
    is_active: true,
    sort_order: 58
  },
  {
    catalog_id: "CAT-059",
    canonical_name: "Landlord Insurance",
    purpose: "What landlord's insurance covers",
    typical_keywords: ["building insurance", "property insurance", "ประกันอาคาร"],
    typical_variants: ["Lessor's Coverage", "Structure Insurance"],
    risk_triggers: ["tenant not covered", "no disclosure of coverage"],
    is_active: true,
    sort_order: 59
  },
  {
    catalog_id: "CAT-060",
    canonical_name: "Liability Limitations",
    purpose: "Limits on landlord's liability to tenant",
    typical_keywords: ["liability", "indemnify", "hold harmless", "รับผิด", "ชดใช้"],
    typical_variants: ["Limitation of Liability", "Indemnification"],
    risk_triggers: ["broad liability exclusion", "tenant indemnifies all", "no negligence exception"],
    is_active: true,
    sort_order: 60
  },
  {
    catalog_id: "CAT-061",
    canonical_name: "Damage by Third Parties",
    purpose: "Responsibility for damage caused by others",
    typical_keywords: ["third party", "neighbor", "contractor", "บุคคลภายนอก"],
    typical_variants: ["External Damage", "Other Party Liability"],
    risk_triggers: ["tenant liable for all damage", "no force majeure exception"],
    is_active: true,
    sort_order: 61
  },
  {
    catalog_id: "CAT-062",
    canonical_name: "Personal Property Risk",
    purpose: "Who bears risk of loss for tenant's belongings",
    typical_keywords: ["personal property", "belongings", "theft", "ทรัพย์สินส่วนตัว", "ขโมย"],
    typical_variants: ["Content Risk", "Personal Effects"],
    risk_triggers: ["landlord not responsible for any loss", "no security obligation"],
    is_active: true,
    sort_order: 62
  },

  // === DEFAULT & REMEDIES (CAT-063 to CAT-068) ===
  {
    catalog_id: "CAT-063",
    canonical_name: "Events of Default",
    purpose: "Define what constitutes a breach of lease",
    typical_keywords: ["default", "breach", "violation", "ผิดสัญญา", "ละเมิด"],
    typical_variants: ["Breach Events", "Contract Violation"],
    risk_triggers: ["minor violations = default", "subjective triggers", "no materiality threshold"],
    is_active: true,
    sort_order: 63
  },
  {
    catalog_id: "CAT-064",
    canonical_name: "Cure Period",
    purpose: "Time allowed to fix a breach before termination",
    typical_keywords: ["cure", "remedy", "rectify", "แก้ไข", "เยียวยา"],
    typical_variants: ["Grace Period", "Rectification Period"],
    risk_triggers: ["no cure period", "short cure (<7 days)", "non-curable breaches too broad"],
    is_active: true,
    sort_order: 64
  },
  {
    catalog_id: "CAT-065",
    canonical_name: "Termination for Breach",
    purpose: "How lease can be terminated for default",
    typical_keywords: ["terminate", "end", "cancel", "ยกเลิก", "สิ้นสุด"],
    typical_variants: ["Contract Termination", "Lease Cancellation"],
    risk_triggers: ["immediate termination", "no notice required", "no cure opportunity"],
    is_active: true,
    sort_order: 65
  },
  {
    catalog_id: "CAT-066",
    canonical_name: "Damages & Penalties",
    purpose: "Financial consequences of breach",
    typical_keywords: ["damages", "penalty", "compensation", "ค่าเสียหาย", "ค่าปรับ"],
    typical_variants: ["Liquidated Damages", "Breach Penalty"],
    risk_triggers: ["excessive penalties", "penalty stacking", "no actual damage requirement"],
    is_active: true,
    sort_order: 66
  },
  {
    catalog_id: "CAT-067",
    canonical_name: "Abandoned Property",
    purpose: "Handling tenant's belongings after move-out",
    typical_keywords: ["abandon", "left behind", "dispose", "ทิ้ง", "ทอดทิ้ง"],
    typical_variants: ["Deserted Property", "Left Items"],
    risk_triggers: ["short timeframe (<7 days)", "immediate disposal", "no storage obligation"],
    is_active: true,
    sort_order: 67
  },
  {
    catalog_id: "CAT-068",
    canonical_name: "Eviction Procedure",
    purpose: "Legal process for removing tenant",
    typical_keywords: ["eviction", "remove", "vacate", "ขับไล่", "ย้ายออก"],
    typical_variants: ["Removal Process", "Eviction Rights"],
    risk_triggers: ["self-help eviction", "lock change", "utility cutoff", "belongings removal"],
    is_active: true,
    sort_order: 68
  },

  // === LEGAL & DISPUTE (CAT-069 to CAT-075) ===
  {
    catalog_id: "CAT-069",
    canonical_name: "Governing Law",
    purpose: "Which country's laws govern the contract",
    typical_keywords: ["governing law", "applicable law", "Thai law", "กฎหมายที่ใช้บังคับ"],
    typical_variants: ["Choice of Law", "Legal Jurisdiction"],
    risk_triggers: ["foreign law chosen", "no governing law specified"],
    is_active: true,
    sort_order: 69
  },
  {
    catalog_id: "CAT-070",
    canonical_name: "Dispute Resolution",
    purpose: "How disputes will be resolved",
    typical_keywords: ["dispute", "resolution", "mediation", "arbitration", "ข้อพิพาท", "ไกล่เกลี่ย"],
    typical_variants: ["Conflict Resolution", "Settlement Process"],
    risk_triggers: ["mandatory arbitration", "landlord chooses forum", "waiver of court access"],
    is_active: true,
    sort_order: 70
  },
  {
    catalog_id: "CAT-071",
    canonical_name: "Court Jurisdiction",
    purpose: "Which court has jurisdiction over disputes",
    typical_keywords: ["court", "jurisdiction", "venue", "ศาล", "เขตอำนาจ"],
    typical_variants: ["Forum Selection", "Court Choice"],
    risk_triggers: ["inconvenient venue", "foreign court", "waiver of jurisdiction objection"],
    is_active: true,
    sort_order: 71
  },
  {
    catalog_id: "CAT-072",
    canonical_name: "Legal Fees",
    purpose: "Who pays legal fees in disputes",
    typical_keywords: ["legal fees", "attorney", "costs", "ค่าทนาย", "ค่าใช้จ่าย"],
    typical_variants: ["Litigation Costs", "Legal Expenses"],
    risk_triggers: ["loser pays all", "tenant pays regardless", "landlord's fees from deposit"],
    is_active: true,
    sort_order: 72
  },
  {
    catalog_id: "CAT-073",
    canonical_name: "Waiver of Rights",
    purpose: "Any rights tenant gives up by signing",
    typical_keywords: ["waive", "relinquish", "give up", "สละสิทธิ", "ยกเลิกสิทธิ"],
    typical_variants: ["Rights Waiver", "Surrender of Rights"],
    risk_triggers: ["waiver of legal rights", "class action waiver", "jury waiver"],
    is_active: true,
    sort_order: 73
  },
  {
    catalog_id: "CAT-074",
    canonical_name: "Notices & Communications",
    purpose: "How formal notices must be given",
    typical_keywords: ["notice", "written", "delivery", "registered mail", "แจ้ง", "ลงทะเบียน"],
    typical_variants: ["Communication Method", "Notice Requirements"],
    risk_triggers: ["multi-channel required", "confirmed receipt required", "short windows"],
    is_active: true,
    sort_order: 74
  },
  {
    catalog_id: "CAT-075",
    canonical_name: "Severability",
    purpose: "What happens if part of contract is invalid",
    typical_keywords: ["severability", "invalid", "unenforceable", "แยกส่วน", "ใช้บังคับไม่ได้"],
    typical_variants: ["Partial Invalidity", "Contract Survival"],
    risk_triggers: ["entire contract void if any part invalid", "no severability clause"],
    is_active: true,
    sort_order: 75
  },

  // === SPECIAL PROVISIONS (CAT-076 to CAT-082) ===
  {
    catalog_id: "CAT-076",
    canonical_name: "Force Majeure",
    purpose: "Events beyond control that excuse performance",
    typical_keywords: ["force majeure", "act of god", "เหตุสุดวิสัย", "ภัยธรรมชาติ"],
    typical_variants: ["Extraordinary Events", "Unforeseeable Circumstances"],
    risk_triggers: ["no force majeure clause", "tenant still liable during FM", "pandemic excluded"],
    is_active: true,
    sort_order: 76
  },
  {
    catalog_id: "CAT-077",
    canonical_name: "Entire Agreement",
    purpose: "Contract is the complete agreement, no side deals",
    typical_keywords: ["entire agreement", "complete", "supersedes", "ข้อตกลงทั้งหมด"],
    typical_variants: ["Integration Clause", "Merger Clause"],
    risk_triggers: ["verbal promises not binding", "no amendment process"],
    is_active: true,
    sort_order: 77
  },
  {
    catalog_id: "CAT-078",
    canonical_name: "Amendments",
    purpose: "How contract can be modified",
    typical_keywords: ["amend", "modify", "change", "แก้ไข", "เปลี่ยนแปลง"],
    typical_variants: ["Contract Changes", "Modifications"],
    risk_triggers: ["landlord can amend unilaterally", "no written amendment required"],
    is_active: true,
    sort_order: 78
  },
  {
    catalog_id: "CAT-079",
    canonical_name: "Representations & Warranties",
    purpose: "Promises made by each party about facts",
    typical_keywords: ["represent", "warrant", "guarantee", "รับรอง", "รับประกัน"],
    typical_variants: ["Assurances", "Statements of Fact"],
    risk_triggers: ["no landlord representations", "tenant warrants everything"],
    is_active: true,
    sort_order: 79
  },
  {
    catalog_id: "CAT-080",
    canonical_name: "Move-Out Procedure",
    purpose: "Steps required when vacating property",
    typical_keywords: ["move-out", "vacate", "handover", "ย้ายออก", "ส่งมอบ"],
    typical_variants: ["End of Tenancy", "Property Return"],
    risk_triggers: ["unreasonable requirements", "professional cleaning mandatory", "no joint inspection"],
    is_active: true,
    sort_order: 80
  },
  {
    catalog_id: "CAT-081",
    canonical_name: "Signatures & Witnesses",
    purpose: "Execution requirements for the contract",
    typical_keywords: ["sign", "execute", "witness", "ลงนาม", "พยาน"],
    typical_variants: ["Contract Execution", "Authentication"],
    risk_triggers: ["witness required but missing", "POA not attached"],
    is_active: true,
    sort_order: 81
  },
  {
    catalog_id: "CAT-082",
    canonical_name: "Language & Translation",
    purpose: "Which language version controls if bilingual",
    typical_keywords: ["language", "Thai", "English", "translation", "ภาษา", "แปล"],
    typical_variants: ["Controlling Version", "Interpretation"],
    risk_triggers: ["foreign language controls", "no Thai version", "translation discrepancies"],
    is_active: true,
    sort_order: 82
  },

  // === LEASE SHIELD ENHANCED CLAUSES v1.1 (CAT-121 to CAT-129) ===
  {
    catalog_id: "CAT-121",
    canonical_name: "Grace Period Definition",
    purpose: "Define the number of days after rent due date before late fees apply",
    typical_keywords: ["grace period", "grace days", "late after", "ระยะผ่อนผัน", "วันผ่อนผัน"],
    typical_variants: ["Payment Grace", "Late Payment Buffer", "Due Date Extension"],
    risk_triggers: ["no grace period", "grace period less than 5 days", "grace period applies only on landlord discretion"],
    is_active: true,
    sort_order: 121
  },
  {
    catalog_id: "CAT-122",
    canonical_name: "Rent Suspension Conditions",
    purpose: "Define conditions when rent may be suspended or abated due to uninhabitability",
    typical_keywords: ["rent suspension", "rent abatement", "uninhabitable", "cannot occupy", "ระงับค่าเช่า", "อยู่ไม่ได้"],
    typical_variants: ["Rent Abatement", "Habitability Clause", "Rent Relief"],
    risk_triggers: ["no rent suspension provision", "tenant must pay rent even if uninhabitable", "landlord sole discretion on habitability"],
    is_active: true,
    sort_order: 122
  },
  {
    catalog_id: "CAT-123",
    canonical_name: "Deposit Is Not Rent",
    purpose: "Clarify that security deposit cannot be applied as last month's rent by tenant",
    typical_keywords: ["deposit not rent", "cannot apply deposit", "last month rent", "มัดจำไม่ใช่ค่าเช่า", "ห้ามหักมัดจำ"],
    typical_variants: ["Deposit Application Restriction", "No Rent Offset", "Deposit Purpose"],
    risk_triggers: ["silent on deposit-as-rent", "allows tenant to use deposit for rent", "ambiguous deposit terms"],
    is_active: true,
    sort_order: 123
  },
  {
    catalog_id: "CAT-124",
    canonical_name: "Wear and Tear Safe Harbour",
    purpose: "Explicitly exclude normal wear and tear from deposit deductions with specific examples",
    typical_keywords: ["normal wear excluded", "fair wear", "reasonable deterioration", "safe harbour", "การสึกหรอปกติ", "ยกเว้น"],
    typical_variants: ["Wear Exclusion", "Depreciation Allowance", "Natural Deterioration"],
    risk_triggers: ["no wear and tear exclusion", "all damage deductible", "wear and tear not defined"],
    is_active: true,
    sort_order: 124
  },
  {
    catalog_id: "CAT-125",
    canonical_name: "Quiet Enjoyment Covenant",
    purpose: "Guarantee tenant's right to peaceful possession without landlord interference",
    typical_keywords: ["quiet enjoyment", "peaceful possession", "no interference", "สิทธิครอบครอง", "ไม่รบกวน"],
    typical_variants: ["Peaceful Enjoyment", "Non-Interference", "Possession Rights"],
    risk_triggers: ["no quiet enjoyment clause", "landlord unlimited access", "frequent inspections permitted"],
    is_active: true,
    sort_order: 125
  },
  {
    catalog_id: "CAT-126",
    canonical_name: "Cure Period Exceptions",
    purpose: "Define which breaches cannot be cured (e.g., non-payment, serious violations)",
    typical_keywords: ["non-curable", "cure exception", "immediate termination", "serious breach", "ไม่สามารถแก้ไข", "ละเมิดร้ายแรง"],
    typical_variants: ["Incurable Defaults", "No Remedy Breaches", "Automatic Termination Events"],
    risk_triggers: ["too many non-curable breaches", "minor breaches listed as non-curable", "no cure period at all"],
    is_active: true,
    sort_order: 126
  },
  {
    catalog_id: "CAT-127",
    canonical_name: "Early Termination Penalty Formula",
    purpose: "Define the specific calculation for early termination penalties based on remaining term",
    typical_keywords: ["termination penalty", "early exit fee", "penalty formula", "months remaining", "ค่าปรับยกเลิก", "สูตรคำนวณ"],
    typical_variants: ["Break Fee Calculation", "Exit Penalty", "Termination Damages"],
    risk_triggers: ["excessive penalty (>2 months)", "full remaining rent as penalty", "no sliding scale", "penalty increases over time"],
    is_active: true,
    sort_order: 127
  },
  {
    catalog_id: "CAT-128",
    canonical_name: "Rent Abatement vs Force Majeure",
    purpose: "Distinguish between rent abatement (habitability) and force majeure (external events) provisions",
    typical_keywords: ["abatement", "force majeure", "rent reduction", "external event", "ลดค่าเช่า", "เหตุสุดวิสัย"],
    typical_variants: ["Rent Relief Distinction", "Habitability vs FM", "Abatement Triggers"],
    risk_triggers: ["no distinction between abatement and FM", "FM excludes rent relief", "tenant bears all FM risk"],
    is_active: true,
    sort_order: 128
  },
  {
    catalog_id: "CAT-129",
    canonical_name: "Utility Interruption – Rent Still Payable",
    purpose: "Clarify tenant's rent obligation during utility service interruptions not caused by tenant",
    typical_keywords: ["utility interruption", "service outage", "rent during outage", "ไฟฟ้าดับ", "น้ำไม่ไหล", "ค่าเช่าระหว่าง"],
    typical_variants: ["Service Interruption", "Utility Failure", "Outage Rent Terms"],
    risk_triggers: ["tenant must pay full rent during extended outage", "no abatement for utility failure", "landlord not responsible for utilities"],
    is_active: true,
    sort_order: 129
  },

  // === UNMAPPED CATCH-ALL ===
  {
    catalog_id: "CAT-UNMAPPED",
    canonical_name: "Unclassified Clause",
    purpose: "Clauses that don't fit standard categories",
    typical_keywords: [],
    typical_variants: [],
    risk_triggers: ["unusual or non-standard terms requiring manual review"],
    is_active: true,
    sort_order: 999
  }
];

// Add version to each entry
const VERSIONED_CATALOG = CANONICAL_CLAUSE_CATALOG.map(entry => ({
  ...entry,
  catalog_version: CATALOG_VERSION
}));

Deno.serve(async (req) => {
  const pre = handleCors(req);
  if (pre) return pre;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return Response.json({
      success: true,
      catalog_version: CATALOG_VERSION,
      catalog_updated_at: CATALOG_UPDATED_AT,
      catalog_count: VERSIONED_CATALOG.length,
      catalog: VERSIONED_CATALOG
    });
    
  } catch (error) {
    console.error('[GET_CANONICAL_LEDGER_ERROR]', error.message);
    return Response.json({ error: 'Failed to retrieve catalog' }, { status: 500 });
  }
});

// Export for use in other functions
export { CANONICAL_CLAUSE_CATALOG, VERSIONED_CATALOG, CATALOG_VERSION, CATALOG_UPDATED_AT };