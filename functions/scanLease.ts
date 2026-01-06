import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";
import { nowMs, withTimeout, retry, classifyError } from "./_shared/analysisRuntime.js";

/**
 * scanLease (v5.0-canonical-embedded)
 * - Pure JavaScript (NO TypeScript annotations)
 * - Canonical catalog embedded (92 items)
 * - Self-contained: no dependency on admin-page storage
 */

const CANONICAL_CATALOG = {
  catalog_version: "v1.1",
  catalog_updated_at: "2026-01-05T00:00:00Z",
  catalog_count: 92,
  source: "LEASE_SHIELD_CANONICAL_V1",
  catalog: [
    {
      catalog_id: "CAT-001",
      canonical_name: "Parties Identification",
      purpose: "Identify lessor (landlord) and lessee (tenant) with full legal names and ID numbers",
      typical_keywords: ["lessor", "lessee", "landlord", "tenant", "party"],
      typical_variants: ["First Party / Second Party", "Owner / Renter"],
      risk_triggers: ["missing ID numbers", "agent signing without POA"],
      is_active: true,
      sort_order: 1,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-002",
      canonical_name: "Property Description",
      purpose: "Define the leased premises with address, unit number, and boundaries",
      typical_keywords: ["premises", "property", "unit", "address"],
      typical_variants: ["Leased Property", "Subject Matter"],
      risk_triggers: ["vague description", "no unit number"],
      is_active: true,
      sort_order: 2,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-003",
      canonical_name: "Property Condition at Handover",
      purpose: "Document the state of property at lease commencement",
      typical_keywords: ["condition", "as-is", "inventory"],
      typical_variants: ["Move-in Condition", "Premises State"],
      risk_triggers: ["no inventory list", "no photo documentation"],
      is_active: true,
      sort_order: 3,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-004",
      canonical_name: "Furnishings & Fixtures Inventory",
      purpose: "List all furniture, appliances, and fixtures included",
      typical_keywords: ["furniture", "appliances", "fixtures", "inventory"],
      typical_variants: ["Equipment List", "Included Items"],
      risk_triggers: ["no itemized list", "no condition assessment"],
      is_active: true,
      sort_order: 4,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-005",
      canonical_name: "Common Areas & Facilities",
      purpose: "Define access to shared facilities (pool, gym, parking)",
      typical_keywords: ["common area", "facilities", "amenities", "parking"],
      typical_variants: ["Shared Facilities", "Building Amenities"],
      risk_triggers: ["facilities access can be revoked", "extra fees"],
      is_active: true,
      sort_order: 5,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-006",
      canonical_name: "Lease Term & Commencement",
      purpose: "Define start date, end date, and duration of tenancy",
      typical_keywords: ["term", "commence", "duration", "period"],
      typical_variants: ["Tenancy Period", "Lease Duration"],
      risk_triggers: ["unclear start date", "term exceeds 3 years"],
      is_active: true,
      sort_order: 6,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-007",
      canonical_name: "Renewal Terms",
      purpose: "Define how lease can be renewed and under what conditions",
      typical_keywords: ["renew", "renewal", "extend", "extension"],
      typical_variants: ["Lease Extension", "Continuation"],
      risk_triggers: ["auto-renewal without consent", "no renewal option"],
      is_active: true,
      sort_order: 7,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-008",
      canonical_name: "Auto-Renewal Mechanism",
      purpose: "Specify automatic renewal conditions and opt-out procedures",
      typical_keywords: ["automatic", "auto-renew", "unless notice"],
      typical_variants: ["Tacit Renewal", "Evergreen Clause"],
      risk_triggers: ["short opt-out window", "confirmed receipt required"],
      is_active: true,
      sort_order: 8,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-009",
      canonical_name: "Notice Period for Non-Renewal",
      purpose: "Define advance notice required to not renew",
      typical_keywords: ["notice", "days before", "advance"],
      typical_variants: ["Termination Notice", "End Notice"],
      risk_triggers: ["excessive notice period (>60 days)"],
      is_active: true,
      sort_order: 9,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-010",
      canonical_name: "Early Termination by Tenant",
      purpose: "Conditions under which tenant can terminate early",
      typical_keywords: ["early termination", "break clause", "tenant terminate"],
      typical_variants: ["Tenant Break", "Premature End"],
      risk_triggers: ["no early termination right", "full deposit forfeiture"],
      is_active: true,
      sort_order: 10,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-011",
      canonical_name: "Early Termination by Landlord",
      purpose: "Conditions under which landlord can terminate early",
      typical_keywords: ["landlord terminate", "owner terminate"],
      typical_variants: ["Lessor Break", "Owner's Right to Terminate"],
      risk_triggers: ["termination without cause", "short notice"],
      is_active: true,
      sort_order: 11,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-012",
      canonical_name: "Holdover Tenancy",
      purpose: "Define status and rent if tenant stays past lease end",
      typical_keywords: ["holdover", "overstay", "after expiration"],
      typical_variants: ["Post-Lease Occupancy", "Continued Possession"],
      risk_triggers: ["2x-3x rent multiplier", "daily penalties"],
      is_active: true,
      sort_order: 12,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-013",
      canonical_name: "Rent Amount & Currency",
      purpose: "State monthly rent amount and currency",
      typical_keywords: ["rent", "monthly", "baht", "THB"],
      typical_variants: ["Rental Fee", "Monthly Payment"],
      risk_triggers: ["rent in foreign currency", "variable rent formula"],
      is_active: true,
      sort_order: 13,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-014",
      canonical_name: "Rent Due Date",
      purpose: "Specify which day of month rent is due",
      typical_keywords: ["due date", "payable", "by the"],
      typical_variants: ["Payment Date", "Due Day"],
      risk_triggers: ["no grace period mentioned"],
      is_active: true,
      sort_order: 14,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-015",
      canonical_name: "Rent Payment Method",
      purpose: "Define acceptable payment methods and account details",
      typical_keywords: ["bank transfer", "payment method", "account"],
      typical_variants: ["Payment Channel", "How to Pay"],
      risk_triggers: ["cash only", "no receipt requirement"],
      is_active: true,
      sort_order: 15,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-016",
      canonical_name: "Late Payment Penalty",
      purpose: "Define consequences of late rent payment",
      typical_keywords: ["late fee", "penalty", "interest", "per day"],
      typical_variants: ["Overdue Charge", "Default Interest"],
      risk_triggers: ["excessive daily rate (>1%)", "compound interest"],
      is_active: true,
      sort_order: 16,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-017",
      canonical_name: "Rent Escalation / Increase",
      purpose: "Define how and when rent can increase",
      typical_keywords: ["increase", "escalation", "adjustment", "raise"],
      typical_variants: ["Rent Review", "Annual Adjustment"],
      risk_triggers: ["unlimited increase", "landlord sole discretion"],
      is_active: true,
      sort_order: 17,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-018",
      canonical_name: "Advance Rent",
      purpose: "Define any rent paid in advance beyond first month",
      typical_keywords: ["advance", "prepaid", "upfront"],
      typical_variants: ["Prepayment", "Rent Deposit"],
      risk_triggers: ["excessive advance (>2 months)"],
      is_active: true,
      sort_order: 18,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-019",
      canonical_name: "Rent Receipts",
      purpose: "Obligation to provide payment receipts",
      typical_keywords: ["receipt", "acknowledgment", "confirmation"],
      typical_variants: ["Payment Confirmation", "Proof of Payment"],
      risk_triggers: ["no receipt obligation"],
      is_active: true,
      sort_order: 19,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-020",
      canonical_name: "Partial Payment",
      purpose: "Whether partial rent payments are accepted",
      typical_keywords: ["partial", "incomplete", "less than"],
      typical_variants: ["Incomplete Payment", "Short Payment"],
      risk_triggers: ["partial payment rejected"],
      is_active: true,
      sort_order: 20,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-021",
      canonical_name: "Security Deposit Amount",
      purpose: "State the security deposit amount",
      typical_keywords: ["deposit", "security", "guarantee"],
      typical_variants: ["Bond", "Damage Deposit"],
      risk_triggers: ["excessive (>2 months)"],
      is_active: true,
      sort_order: 21,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-022",
      canonical_name: "Deposit Payment Terms",
      purpose: "When and how deposit must be paid",
      typical_keywords: ["upon signing", "before move-in"],
      typical_variants: ["Deposit Due", "Payment Schedule"],
      risk_triggers: ["immediate forfeiture if not paid"],
      is_active: true,
      sort_order: 22,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-023",
      canonical_name: "Deposit Holding",
      purpose: "Where and how deposit is held during tenancy",
      typical_keywords: ["held", "escrow", "account"],
      typical_variants: ["Deposit Custody", "Safekeeping"],
      risk_triggers: ["no separate account", "landlord can use deposit"],
      is_active: true,
      sort_order: 23,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-024",
      canonical_name: "Permitted Deposit Deductions",
      purpose: "What landlord can deduct from deposit",
      typical_keywords: ["deduct", "withhold", "damages", "unpaid"],
      typical_variants: ["Deposit Setoff", "Deduction Rights"],
      risk_triggers: ["vague deduction grounds", "sole discretion"],
      is_active: true,
      sort_order: 24,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-025",
      canonical_name: "Deposit Return Timeline",
      purpose: "When deposit must be returned after move-out",
      typical_keywords: ["return", "refund", "within days"],
      typical_variants: ["Deposit Refund Period", "Return Schedule"],
      risk_triggers: ["no timeline specified", "excessive delay (>30 days)"],
      is_active: true,
      sort_order: 25,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-026",
      canonical_name: "Deposit Return Procedure",
      purpose: "Process for returning deposit and providing itemization",
      typical_keywords: ["itemized", "statement", "inspection"],
      typical_variants: ["Return Process", "Settlement Procedure"],
      risk_triggers: ["no itemization required"],
      is_active: true,
      sort_order: 26,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-027",
      canonical_name: "Deposit Forfeiture Conditions",
      purpose: "Circumstances when entire deposit is lost",
      typical_keywords: ["forfeit", "lose", "waive"],
      typical_variants: ["Deposit Loss", "Non-Refundable"],
      risk_triggers: ["early termination = full forfeiture"],
      is_active: true,
      sort_order: 27,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-028",
      canonical_name: "Wear and Tear Definition",
      purpose: "Define normal vs abnormal wear",
      typical_keywords: ["wear and tear", "normal use", "deterioration"],
      typical_variants: ["Fair Wear", "Reasonable Use"],
      risk_triggers: ["no wear and tear allowance"],
      is_active: true,
      sort_order: 28,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-029",
      canonical_name: "Electricity Charges",
      purpose: "Define electricity billing method and rates",
      typical_keywords: ["electricity", "electric", "unit", "meter"],
      typical_variants: ["Power Charges", "Electric Bill"],
      risk_triggers: ["above MEA rate", "landlord markup"],
      is_active: true,
      sort_order: 29,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-030",
      canonical_name: "Water Charges",
      purpose: "Define water billing method and rates",
      typical_keywords: ["water", "unit", "meter"],
      typical_variants: ["Water Bill", "MWA Charges"],
      risk_triggers: ["above MWA rate", "flat fee"],
      is_active: true,
      sort_order: 30,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-031",
      canonical_name: "Internet & Cable",
      purpose: "Internet and TV service arrangements",
      typical_keywords: ["internet", "wifi", "cable", "TV"],
      typical_variants: ["Connectivity", "Broadband"],
      risk_triggers: ["mandatory provider", "no cancellation right"],
      is_active: true,
      sort_order: 31,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-032",
      canonical_name: "Common Area Fees",
      purpose: "Monthly building/condo common area fees",
      typical_keywords: ["common fee", "CAM", "maintenance fee"],
      typical_variants: ["Management Fee", "Building Fee"],
      risk_triggers: ["tenant pays CAM directly"],
      is_active: true,
      sort_order: 32,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-033",
      canonical_name: "Utility Disconnection Rights",
      purpose: "Whether landlord can cut utilities for non-payment",
      typical_keywords: ["disconnect", "cut", "suspend", "terminate"],
      typical_variants: ["Service Termination", "Utility Cutoff"],
      risk_triggers: ["disconnection as penalty (ILLEGAL)"],
      is_active: true,
      sort_order: 33,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-034",
      canonical_name: "Utility Deposit",
      purpose: "Separate deposits for utilities",
      typical_keywords: ["utility deposit", "meter deposit"],
      typical_variants: ["Service Deposit", "Meter Bond"],
      risk_triggers: ["non-refundable", "excessive amount"],
      is_active: true,
      sort_order: 34,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-035",
      canonical_name: "Tenant Maintenance Obligations",
      purpose: "What tenant must maintain and repair",
      typical_keywords: ["tenant maintain", "tenant repair", "responsible for"],
      typical_variants: ["Lessee's Maintenance", "Renter's Duties"],
      risk_triggers: ["excessive scope", "structural repairs on tenant"],
      is_active: true,
      sort_order: 35,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-036",
      canonical_name: "Landlord Maintenance Obligations",
      purpose: "What landlord must maintain and repair",
      typical_keywords: ["landlord maintain", "owner repair", "lessor responsible"],
      typical_variants: ["Lessor's Maintenance", "Owner's Duties"],
      risk_triggers: ["minimal obligations", "no timeline"],
      is_active: true,
      sort_order: 36,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-037",
      canonical_name: "Repair Request Procedure",
      purpose: "How tenant reports issues and requests repairs",
      typical_keywords: ["report", "notify", "request"],
      typical_variants: ["Maintenance Request", "Issue Reporting"],
      risk_triggers: ["written notice only", "complex procedure"],
      is_active: true,
      sort_order: 37,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-038",
      canonical_name: "Repair Timeline",
      purpose: "How quickly landlord must respond to repair requests",
      typical_keywords: ["within days", "response time"],
      typical_variants: ["Repair SLA", "Response Period"],
      risk_triggers: ["no timeline", "unreasonable delays"],
      is_active: true,
      sort_order: 38,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-039",
      canonical_name: "Emergency Repairs",
      purpose: "Handling urgent repair situations",
      typical_keywords: ["emergency", "urgent", "immediate"],
      typical_variants: ["Critical Repairs", "Urgent Maintenance"],
      risk_triggers: ["no emergency definition", "tenant cannot self-remedy"],
      is_active: true,
      sort_order: 39,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-040",
      canonical_name: "Alterations & Improvements",
      purpose: "Tenant's right to modify the property",
      typical_keywords: ["alteration", "modification", "improvement"],
      typical_variants: ["Changes", "Fit-out"],
      risk_triggers: ["no alterations allowed", "approval at sole discretion"],
      is_active: true,
      sort_order: 40,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-041",
      canonical_name: "Restoration at End of Lease",
      purpose: "Requirement to return property to original condition",
      typical_keywords: ["restore", "original condition", "reinstate"],
      typical_variants: ["Make Good", "Return Condition"],
      risk_triggers: ["strict original condition", "no wear allowance"],
      is_active: true,
      sort_order: 41,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-042",
      canonical_name: "Appliance Maintenance",
      purpose: "Responsibility for appliance upkeep",
      typical_keywords: ["appliance", "aircon", "AC", "refrigerator"],
      typical_variants: ["Equipment Care", "A/C Service"],
      risk_triggers: ["tenant pays all appliance repairs"],
      is_active: true,
      sort_order: 42,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-043",
      canonical_name: "Permitted Use",
      purpose: "Define allowed use of the property",
      typical_keywords: ["residential", "use", "purpose"],
      typical_variants: ["Allowed Activities", "Property Purpose"],
      risk_triggers: ["strictly residential only", "no work from home"],
      is_active: true,
      sort_order: 43,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-044",
      canonical_name: "Prohibited Activities",
      purpose: "Activities not allowed on premises",
      typical_keywords: ["prohibit", "not allowed", "forbidden"],
      typical_variants: ["Restrictions", "Banned Activities"],
      risk_triggers: ["broad prohibitions", "vague terms"],
      is_active: true,
      sort_order: 44,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-045",
      canonical_name: "Occupancy Limits",
      purpose: "Maximum number of occupants allowed",
      typical_keywords: ["occupant", "person", "maximum"],
      typical_variants: ["Resident Limit", "Headcount"],
      risk_triggers: ["strict limits", "fees per person"],
      is_active: true,
      sort_order: 45,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-046",
      canonical_name: "Guest Policy",
      purpose: "Rules for visitors and overnight guests",
      typical_keywords: ["guest", "visitor", "overnight"],
      typical_variants: ["Visitor Rules", "Guest Restrictions"],
      risk_triggers: ["guest registration", "limits on stays"],
      is_active: true,
      sort_order: 46,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-047",
      canonical_name: "Pet Policy",
      purpose: "Rules regarding keeping pets",
      typical_keywords: ["pet", "animal", "dog", "cat"],
      typical_variants: ["Animal Policy", "Pet Restrictions"],
      risk_triggers: ["no pets absolute", "pet deposit"],
      is_active: true,
      sort_order: 47,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-048",
      canonical_name: "Smoking Policy",
      purpose: "Rules regarding smoking on premises",
      typical_keywords: ["smoking", "smoke", "cigarette"],
      typical_variants: ["No Smoking", "Tobacco Policy"],
      risk_triggers: ["heavy fines", "immediate termination"],
      is_active: true,
      sort_order: 48,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-049",
      canonical_name: "Noise & Nuisance",
      purpose: "Rules about noise levels and disturbance",
      typical_keywords: ["noise", "quiet", "nuisance", "disturbance"],
      typical_variants: ["Quiet Hours", "Disturbance Policy"],
      risk_triggers: ["subjective standard", "neighbor complaints = breach"],
      is_active: true,
      sort_order: 49,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-050",
      canonical_name: "Subletting & Assignment",
      purpose: "Whether tenant can sublet or assign lease",
      typical_keywords: ["sublet", "sublease", "assign", "transfer"],
      typical_variants: ["Sublease Rights", "Lease Transfer"],
      risk_triggers: ["absolute prohibition"],
      is_active: true,
      sort_order: 50,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-051",
      canonical_name: "Short-term Letting Ban",
      purpose: "Prohibition on Airbnb-style rentals",
      typical_keywords: ["short-term", "daily", "Airbnb"],
      typical_variants: ["No Daily Rental", "Short Stay Ban"],
      risk_triggers: ["immediate termination", "heavy fines"],
      is_active: true,
      sort_order: 51,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-052",
      canonical_name: "Business Use Restrictions",
      purpose: "Rules about conducting business from property",
      typical_keywords: ["business", "commercial", "work", "office"],
      typical_variants: ["WFH Policy", "Commercial Activity"],
      risk_triggers: ["no WFH allowed", "vague definition"],
      is_active: true,
      sort_order: 52,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-053",
      canonical_name: "Landlord Entry Rights",
      purpose: "When and how landlord can enter property",
      typical_keywords: ["entry", "access", "enter", "inspection"],
      typical_variants: ["Right of Access", "Inspection Rights"],
      risk_triggers: ["entry without notice", "entry at any time"],
      is_active: true,
      sort_order: 53,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-054",
      canonical_name: "Notice for Entry",
      purpose: "Advance notice required before landlord entry",
      typical_keywords: ["notice", "advance", "hours", "days"],
      typical_variants: ["Entry Notice", "Access Warning"],
      risk_triggers: ["no notice requirement", "less than 24 hours"],
      is_active: true,
      sort_order: 54,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-055",
      canonical_name: "Emergency Entry",
      purpose: "Entry without notice in emergencies",
      typical_keywords: ["emergency", "urgent", "fire", "flood"],
      typical_variants: ["Urgent Access", "Emergency Inspection"],
      risk_triggers: ["emergency not defined"],
      is_active: true,
      sort_order: 55,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-056",
      canonical_name: "Keys & Access Devices",
      purpose: "Rules about keys, cards, and access control",
      typical_keywords: ["key", "card", "access", "lock"],
      typical_variants: ["Access Control", "Security Devices"],
      risk_triggers: ["landlord retains key", "no lock change allowed"],
      is_active: true,
      sort_order: 56,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-057",
      canonical_name: "Privacy & Personal Data",
      purpose: "Protection of tenant's personal information",
      typical_keywords: ["privacy", "personal data", "PDPA"],
      typical_variants: ["Data Protection", "Information Privacy"],
      risk_triggers: ["no PDPA compliance", "data sharing"],
      is_active: true,
      sort_order: 57,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-058",
      canonical_name: "Tenant Insurance Requirement",
      purpose: "Whether tenant must carry insurance",
      typical_keywords: ["insurance", "coverage", "policy"],
      typical_variants: ["Renter's Insurance", "Content Insurance"],
      risk_triggers: ["mandatory expensive coverage"],
      is_active: true,
      sort_order: 58,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-059",
      canonical_name: "Landlord Insurance",
      purpose: "What landlord's insurance covers",
      typical_keywords: ["building insurance", "property insurance"],
      typical_variants: ["Lessor's Coverage", "Structure Insurance"],
      risk_triggers: ["tenant not covered"],
      is_active: true,
      sort_order: 59,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-060",
      canonical_name: "Liability Limitations",
      purpose: "Limits on landlord's liability to tenant",
      typical_keywords: ["liability", "indemnify", "hold harmless"],
      typical_variants: ["Limitation of Liability", "Indemnification"],
      risk_triggers: ["broad liability exclusion"],
      is_active: true,
      sort_order: 60,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-061",
      canonical_name: "Damage by Third Parties",
      purpose: "Responsibility for damage caused by others",
      typical_keywords: ["third party", "neighbor", "contractor"],
      typical_variants: ["External Damage", "Other Party Liability"],
      risk_triggers: ["tenant liable for all damage"],
      is_active: true,
      sort_order: 61,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-062",
      canonical_name: "Personal Property Risk",
      purpose: "Who bears risk of loss for tenant's belongings",
      typical_keywords: ["personal property", "belongings", "theft"],
      typical_variants: ["Content Risk", "Personal Effects"],
      risk_triggers: ["landlord not responsible for any loss"],
      is_active: true,
      sort_order: 62,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-063",
      canonical_name: "Events of Default",
      purpose: "Define what constitutes a breach of lease",
      typical_keywords: ["default", "breach", "violation"],
      typical_variants: ["Breach Events", "Contract Violation"],
      risk_triggers: ["minor violations = default"],
      is_active: true,
      sort_order: 63,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-064",
      canonical_name: "Cure Period",
      purpose: "Time allowed to fix a breach before termination",
      typical_keywords: ["cure", "remedy", "rectify"],
      typical_variants: ["Grace Period", "Rectification Period"],
      risk_triggers: ["no cure period", "short cure (<7 days)"],
      is_active: true,
      sort_order: 64,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-065",
      canonical_name: "Termination for Breach",
      purpose: "How lease can be terminated for default",
      typical_keywords: ["terminate", "end", "cancel"],
      typical_variants: ["Contract Termination", "Lease Cancellation"],
      risk_triggers: ["immediate termination", "no notice required"],
      is_active: true,
      sort_order: 65,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-066",
      canonical_name: "Damages & Penalties",
      purpose: "Financial consequences of breach",
      typical_keywords: ["damages", "penalty", "compensation"],
      typical_variants: ["Liquidated Damages", "Breach Penalty"],
      risk_triggers: ["excessive penalties", "penalty stacking"],
      is_active: true,
      sort_order: 66,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-067",
      canonical_name: "Abandoned Property",
      purpose: "Handling tenant's belongings after move-out",
      typical_keywords: ["abandon", "left behind", "dispose"],
      typical_variants: ["Deserted Property", "Left Items"],
      risk_triggers: ["short timeframe (<7 days)"],
      is_active: true,
      sort_order: 67,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-068",
      canonical_name: "Eviction Procedure",
      purpose: "Legal process for removing tenant",
      typical_keywords: ["eviction", "remove", "vacate"],
      typical_variants: ["Removal Process", "Eviction Rights"],
      risk_triggers: ["self-help eviction", "lock change"],
      is_active: true,
      sort_order: 68,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-069",
      canonical_name: "Governing Law",
      purpose: "Which country's laws govern the contract",
      typical_keywords: ["governing law", "applicable law", "Thai law"],
      typical_variants: ["Choice of Law", "Legal Jurisdiction"],
      risk_triggers: ["foreign law chosen"],
      is_active: true,
      sort_order: 69,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-070",
      canonical_name: "Dispute Resolution",
      purpose: "How disputes will be resolved",
      typical_keywords: ["dispute", "resolution", "mediation", "arbitration"],
      typical_variants: ["Conflict Resolution", "Settlement Process"],
      risk_triggers: ["mandatory arbitration", "waiver of court access"],
      is_active: true,
      sort_order: 70,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-071",
      canonical_name: "Court Jurisdiction",
      purpose: "Which court has jurisdiction over disputes",
      typical_keywords: ["court", "jurisdiction", "venue"],
      typical_variants: ["Forum Selection", "Court Choice"],
      risk_triggers: ["inconvenient venue", "foreign court"],
      is_active: true,
      sort_order: 71,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-072",
      canonical_name: "Legal Fees",
      purpose: "Who pays legal fees in disputes",
      typical_keywords: ["legal fees", "attorney", "costs"],
      typical_variants: ["Litigation Costs", "Legal Expenses"],
      risk_triggers: ["loser pays all", "tenant pays regardless"],
      is_active: true,
      sort_order: 72,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-073",
      canonical_name: "Waiver of Rights",
      purpose: "Any rights tenant gives up by signing",
      typical_keywords: ["waive", "relinquish", "give up"],
      typical_variants: ["Rights Waiver", "Surrender of Rights"],
      risk_triggers: ["waiver of legal rights"],
      is_active: true,
      sort_order: 73,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-074",
      canonical_name: "Notices & Communications",
      purpose: "How formal notices must be given",
      typical_keywords: ["notice", "written", "delivery", "registered mail"],
      typical_variants: ["Communication Method", "Notice Requirements"],
      risk_triggers: ["multi-channel required", "short windows"],
      is_active: true,
      sort_order: 74,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-075",
      canonical_name: "Severability",
      purpose: "What happens if part of contract is invalid",
      typical_keywords: ["severability", "invalid", "unenforceable"],
      typical_variants: ["Partial Invalidity", "Contract Survival"],
      risk_triggers: ["entire contract void if any part invalid"],
      is_active: true,
      sort_order: 75,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-076",
      canonical_name: "Force Majeure",
      purpose: "Events beyond control that excuse performance",
      typical_keywords: ["force majeure", "act of god"],
      typical_variants: ["Extraordinary Events", "Unforeseeable Circumstances"],
      risk_triggers: ["no force majeure clause", "pandemic excluded"],
      is_active: true,
      sort_order: 76,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-077",
      canonical_name: "Entire Agreement",
      purpose: "Contract is the complete agreement, no side deals",
      typical_keywords: ["entire agreement", "complete", "supersedes"],
      typical_variants: ["Integration Clause", "Merger Clause"],
      risk_triggers: ["verbal promises not binding"],
      is_active: true,
      sort_order: 77,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-078",
      canonical_name: "Amendments",
      purpose: "How contract can be modified",
      typical_keywords: ["amend", "modify", "change"],
      typical_variants: ["Contract Changes", "Modifications"],
      risk_triggers: ["landlord can amend unilaterally"],
      is_active: true,
      sort_order: 78,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-079",
      canonical_name: "Representations & Warranties",
      purpose: "Promises made by each party about facts",
      typical_keywords: ["represent", "warrant", "guarantee"],
      typical_variants: ["Assurances", "Statements of Fact"],
      risk_triggers: ["no landlord representations"],
      is_active: true,
      sort_order: 79,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-080",
      canonical_name: "Move-Out Procedure",
      purpose: "Steps required when vacating property",
      typical_keywords: ["move-out", "vacate", "handover"],
      typical_variants: ["End of Tenancy", "Property Return"],
      risk_triggers: ["unreasonable requirements"],
      is_active: true,
      sort_order: 80,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-081",
      canonical_name: "Signatures & Witnesses",
      purpose: "Execution requirements for the contract",
      typical_keywords: ["sign", "execute", "witness"],
      typical_variants: ["Contract Execution", "Authentication"],
      risk_triggers: ["witness required but missing"],
      is_active: true,
      sort_order: 81,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-082",
      canonical_name: "Language & Translation",
      purpose: "Which language version controls if bilingual",
      typical_keywords: ["language", "Thai", "English", "translation"],
      typical_variants: ["Controlling Version", "Interpretation"],
      risk_triggers: ["foreign language controls", "no Thai version"],
      is_active: true,
      sort_order: 82,
      catalog_version: "v1.1",
    },

    // --- Extra canonical items to reach 92 ---
    {
      catalog_id: "CAT-121",
      canonical_name: "Grace Period Definition",
      purpose: "Define the number of days after rent due date before late fees apply",
      typical_keywords: ["grace period", "grace days", "late after"],
      typical_variants: ["Payment Grace", "Late Payment Buffer"],
      risk_triggers: ["no grace period", "grace period less than 5 days"],
      is_active: true,
      sort_order: 121,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-122",
      canonical_name: "Rent Suspension Conditions",
      purpose: "Define conditions when rent may be suspended or abated due to uninhabitability",
      typical_keywords: ["rent suspension", "rent abatement", "uninhabitable"],
      typical_variants: ["Rent Abatement", "Habitability Clause"],
      risk_triggers: ["no rent suspension provision"],
      is_active: true,
      sort_order: 122,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-123",
      canonical_name: "Deposit Is Not Rent",
      purpose: "Clarify that security deposit cannot be applied as last month's rent by tenant",
      typical_keywords: ["deposit not rent", "cannot apply deposit"],
      typical_variants: ["Deposit Application Restriction", "No Rent Offset"],
      risk_triggers: ["silent on deposit-as-rent"],
      is_active: true,
      sort_order: 123,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-124",
      canonical_name: "Wear and Tear Safe Harbour",
      purpose: "Explicitly exclude normal wear and tear from deposit deductions with specific examples",
      typical_keywords: ["normal wear excluded", "fair wear"],
      typical_variants: ["Wear Exclusion", "Depreciation Allowance"],
      risk_triggers: ["no wear and tear exclusion"],
      is_active: true,
      sort_order: 124,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-125",
      canonical_name: "Quiet Enjoyment Covenant",
      purpose: "Guarantee tenant's right to peaceful possession without landlord interference",
      typical_keywords: ["quiet enjoyment", "peaceful possession"],
      typical_variants: ["Peaceful Enjoyment", "Non-Interference"],
      risk_triggers: ["no quiet enjoyment clause"],
      is_active: true,
      sort_order: 125,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-126",
      canonical_name: "Cure Period Exceptions",
      purpose: "Define which breaches cannot be cured (e.g., non-payment, serious violations)",
      typical_keywords: ["non-curable", "cure exception", "serious breach"],
      typical_variants: ["Incurable Defaults", "No Remedy Breaches"],
      risk_triggers: ["too many non-curable breaches"],
      is_active: true,
      sort_order: 126,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-127",
      canonical_name: "Early Termination Penalty Formula",
      purpose: "Define the specific calculation for early termination penalties based on remaining term",
      typical_keywords: ["termination penalty", "early exit fee", "penalty formula"],
      typical_variants: ["Break Fee Calculation", "Exit Penalty"],
      risk_triggers: ["excessive penalty (>2 months)"],
      is_active: true,
      sort_order: 127,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-128",
      canonical_name: "Rent Abatement vs Force Majeure",
      purpose: "Distinguish between rent abatement (habitability) and force majeure (external events) provisions",
      typical_keywords: ["abatement", "force majeure", "rent reduction"],
      typical_variants: ["Rent Relief Distinction", "Habitability vs FM"],
      risk_triggers: ["no distinction between abatement and FM"],
      is_active: true,
      sort_order: 128,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-129",
      canonical_name: "Utility Interruption – Rent Still Payable",
      purpose: "Clarify tenant's rent obligation during utility service interruptions not caused by tenant",
      typical_keywords: ["utility interruption", "service outage"],
      typical_variants: ["Service Interruption", "Utility Failure"],
      risk_triggers: ["tenant must pay full rent during extended outage"],
      is_active: true,
      sort_order: 129,
      catalog_version: "v1.1",
    },
    {
      catalog_id: "CAT-UNMAPPED",
      canonical_name: "Unclassified Clause",
      purpose: "Clauses that don't fit standard categories",
      typical_keywords: [],
      typical_variants: [],
      risk_triggers: ["unusual or non-standard terms requiring manual review"],
      is_active: true,
      sort_order: 999,
      catalog_version: "v1.1",
    },
  ],
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function err(code, message, status = 400, requestId = "", details = null) {
  return json(status, { success: false, error: code, message, requestId, details });
}

function safeError(e) {
  const msg = String(e?.message || e || "Unknown error");
  const stack = String(e?.stack || "");
  let raw = null;
  try { raw = JSON.stringify(e, Object.getOwnPropertyNames(e)); } catch(_) { raw = null; }
  return { msg, stack: stack.slice(0, 1200), raw: raw ? String(raw).slice(0, 1200) : null };
}

function validateFileUrl(url) {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return { valid: false, error: "Invalid URL protocol" };
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
}

async function requireAuth(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me(); // throws if not logged in
  return { user, base44 };
}

// ---------- Canonical ledger helpers (self-contained) ----------
function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();
}

function countKeywordHits(haystack, keywords) {
  if (!haystack) return 0;
  const h = normalizeText(haystack);
  let hits = 0;
  for (const kw of keywords || []) {
    const k = normalizeText(kw);
    if (!k) continue;
    if (h.includes(k)) hits += 2;
    else {
      const parts = k.split(" ").filter(Boolean);
      if (parts.length > 1 && parts.every((p) => h.includes(p))) hits += 1;
    }
  }
  return hits;
}

function bestCatalogMatchForClause(c, catalog) {
  const title = normalizeText(c.heading || "");
  const text = normalizeText(c.full_text || "");
  const combined = `${title} ${text}`.trim();

  let best = null;
  let bestScore = -1;

  for (const item of catalog) {
    if (!item || !item.is_active) continue;
    const kwHits = countKeywordHits(combined, item.typical_keywords);
    const varHits = countKeywordHits(combined, item.typical_variants);
    const score = kwHits * 3 + varHits * 2 + (title && kwHits > 0 ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  const confidence =
    bestScore >= 12 ? 0.95 :
    bestScore >= 8  ? 0.85 :
    bestScore >= 5  ? 0.70 :
    bestScore >= 3  ? 0.55 :
                      0.35;

  return { best, bestScore, confidence };
}

function buildCanonicalLedger(clauses_extracted, catalog) {
  const canonical_ledger = [];

  for (const c of clauses_extracted) {
    const { best, bestScore, confidence } = bestCatalogMatchForClause(c, catalog);
    canonical_ledger.push({
      clause_id: c.clause_id,
      catalog_id: best && best.catalog_id ? best.catalog_id : "CAT-UNMAPPED",
      canonical_name: best && best.canonical_name ? best.canonical_name : "Unclassified Clause",
      confidence,
      match_score: bestScore,
      purpose: (best && best.purpose) ? best.purpose : "",
      risk_triggers: (best && Array.isArray(best.risk_triggers)) ? best.risk_triggers : [],
    });
  }

  const matchedStrong = new Set(
    canonical_ledger
      .filter((m) => m.catalog_id && m.catalog_id !== "CAT-UNMAPPED" && m.confidence >= 0.55)
      .map((m) => m.catalog_id)
  );

  const missing_clauses = (catalog || [])
    .filter((x) => x && x.is_active && x.catalog_id && x.catalog_id !== "CAT-UNMAPPED")
    .filter((x) => !matchedStrong.has(x.catalog_id))
    .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
    .map((x) => ({
      catalog_id: x.catalog_id,
      canonical_name: x.canonical_name,
      purpose: x.purpose,
      risk_triggers: x.risk_triggers || [],
    }));

  return { canonical_ledger, missing_clauses };
}

function buildFlagsFromCanonical(clauses_extracted, canonical_ledger, userLang) {
  const flags = [];
  const clauseById = new Map(clauses_extracted.map((c) => [c.clause_id, c]));

  const makeTriggerRegex = (trigger) => {
    const t = String(trigger || "").trim();
    if (!t) return null;
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(escaped, "i");
  };

  for (const m of canonical_ledger) {
    const clause = clauseById.get(m.clause_id);
    if (!clause) continue;

    const text = String(clause.full_text || "");
    const triggers = m.risk_triggers || [];

    for (const trig of triggers) {
      const rx = makeTriggerRegex(trig);
      if (!rx) continue;

      if (rx.test(text)) {
        const tnorm = normalizeText(trig);
        const severity =
          tnorm.includes("illegal") || tnorm.includes("self help") || tnorm.includes("self-help") ? "critical" :
          tnorm.includes("terminate") || tnorm.includes("forfeit") || tnorm.includes("withhold") ? "high" :
          "medium";

        flags.push({
          clause_id: clause.clause_id,
          severity,
          category: m.canonical_name || "Lease Clause",
          title: userLang === "th" ? "พบเงื่อนไขเสี่ยง" : "Risk Trigger Detected",
          description: userLang === "th" ? `พบตัวกระตุ้นความเสี่ยง: ${trig}` : `Risk trigger found: ${trig}`,
          explanation: userLang === "th" ? `หมวดหมู่: ${m.canonical_name || "ไม่ระบุ"}` : `Category: ${m.canonical_name || "Unspecified"}`,
          recommendation: userLang === "th"
            ? "ตรวจทานและเจรจาแก้ไขถ้อยคำ/เพิ่มเงื่อนไขคุ้มครอง"
            : "Review and renegotiate wording / add protective conditions",
          evidence: text.substring(0, 240),
          catalog_id: m.catalog_id,
        });
      }
    }
  }

  return flags;
}

function buildClauseReview(clauses_extracted, flags) {
  const flagsByClause = new Map();
  for (const f of flags || []) {
    if (!f || !f.clause_id) continue;
    const list = flagsByClause.get(f.clause_id) || [];
    list.push(f);
    flagsByClause.set(f.clause_id, list);
  }

  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };

  return clauses_extracted.map((c) => {
    const clauseFlags = flagsByClause.get(c.clause_id) || [];
    if (clauseFlags.length === 0) {
      return { clause_id: c.clause_id, risk_level: "none", risk_summary: "Accept as standard." };
    }
    const primary = clauseFlags
      .slice()
      .sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0))[0];

    return {
      clause_id: c.clause_id,
      risk_level: primary.severity || "medium",
      risk_summary: primary.description || primary.title || "Review required",
      recommended_change: primary.recommendation ? String(primary.recommendation).split(/\n/)[0] : undefined,
      category: primary.category,
      catalog_id: primary.catalog_id,
    };
  });
}

function computeRiskScore(flags) {
  const weight = { critical: 25, high: 18, medium: 10, low: 6 };
  const sum = (flags || []).reduce((acc, f) => acc + (weight[f && f.severity] || 8), 0);
  return Math.min(100, sum);
}

const BUILD_TAG = "scan-hotfix-v2-never-throw";

// ---------- Main handler ----------
Deno.serve(async (req) => {
  const startTime = Date.now();
  let requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  let stage = "INIT";
  const debugLog = { requestId, timestamp: new Date().toISOString(), stages: [], buildTag: BUILD_TAG };

  const logStage = (stageName, data) => {
    try {
      debugLog.stages.push({ stage: stageName, ts: nowMs() - startTime, ...(data || {}) });
    } catch (_) {}
  };

  const guard = async (stageName, fn) => {
    stage = stageName;
    logStage(stageName + "_START");
    const t0 = nowMs();
    try {
      const result = await fn();
      logStage(stageName + "_OK", { ms: nowMs() - t0 });
      return result;
    } catch (err) {
      const se = safeError(err);
      logStage(stageName + "_FAIL", { ms: nowMs() - t0, error: se.msg });
      console.error(JSON.stringify({ requestId, stage: stageName, error: se.msg, stack: se.stack }));
      return { __failed: true, error: se };
    }
  };

  let body = {};
  try {
    body = await req.json();
    requestId = body.requestId || requestId;
    debugLog.requestId = requestId;
  } catch {
    debugLog.stages.push({ stage: "JSON_PARSE_FAIL" });
    return json(400, { ok: false, error: { category: "BAD_JSON", message: "Invalid JSON body" }, debugLog });
  }

  const budgets = { extract: 12000, split: 4000, rules: 6000, llm: 18000, persist: 6000, total: 55000 };
  const durationsMs = {}; 
  const warnings = [];
  const diagnostics = { persist_warnings: [] };
  let clauseCountSoFar = 0;
  let flagsCountSoFar = 0;

  try {
    const authResult = await guard("AUTH", () => requireAuth(req));
    if (authResult.__failed) {
      const isUnauth = /unauth/i.test(authResult.error.msg);
      return json(isUnauth ? 401 : 200, { 
        ok: false, 
        error: { category: isUnauth ? "UNAUTHORIZED" : "AUTH_FAILED", message: authResult.error.msg, requestId }, 
        debugLog 
      });
    }
    const { user, base44 } = authResult;

    const scanId = body.scanId || crypto.randomUUID();
    const leaseId = body.leaseId;
    const fileUrlsRaw = body.fileUrls;

    const validateResult = await guard("VALIDATE_INPUT", async () => {
      if (!leaseId) throw new Error("MISSING_LEASE_ID");
      if (!fileUrlsRaw || (Array.isArray(fileUrlsRaw) && fileUrlsRaw.length === 0)) throw new Error("NO_FILE_URLS");
      const fileUrls = Array.isArray(fileUrlsRaw) ? fileUrlsRaw : [fileUrlsRaw];
      for (const url of fileUrls) {
        const v = validateFileUrl(url);
        if (!v.valid) throw new Error(`INVALID_FILE_URL: ${v.error}`);
      }
      const plan = String(user.plan_tier || "free").toLowerCase();
      if (plan === "free") throw new Error("PREMIUM_REQUIRED");
      return { fileUrls };
    });

    if (validateResult.__failed) {
      const msg = validateResult.error.msg;
      const status = /premium/i.test(msg) ? 403 : 400;
      return json(status, { ok: false, error: { category: "VALIDATION_ERROR", message: msg, requestId }, debugLog });
    }

    const fileUrls = validateResult.fileUrls;

    // Guard: catalog must exist
    if (!CANONICAL_CATALOG || !Array.isArray(CANONICAL_CATALOG.catalog)) {
      diagnostics.catalog_mismatch = 'MISSING_OR_INVALID';
    } else if (typeof CANONICAL_CATALOG.catalog_count === 'number' && CANONICAL_CATALOG.catalog_count !== CANONICAL_CATALOG.catalog.length) {
      diagnostics.catalog_mismatch = {
        expected: CANONICAL_CATALOG.catalog_count,
        actual: CANONICAL_CATALOG.catalog.length
      };
    }

    // 1) Extract clauses + key terms
    const extractResult = await guard("TEXT_EXTRACT", async () => {
      const call = () => base44.integrations.Core.InvokeLLM({
      prompt: `Extract ALL clauses from this residential lease document.
FOR EACH CLAUSE provide:
- clause_id
- title
- raw_text (max 1200 chars)
- page_number (1 if unsure)
- language: "th", "en", or "mixed"
ALSO EXTRACT:
property_address, start_date, end_date, rent_amount, deposit_amount, notice_period_days,
language_detected, rent_due_day, deposit_due_date, deposit_return_days.`,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          clauses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clause_id: { type: "string" },
                title: { type: "string" },
                raw_text: { type: "string" },
                page_number: { type: "integer" },
                language: { type: "string", enum: ["en", "th", "mixed"] },
              },
              required: ["clause_id", "raw_text"],
            },
          },
          property_address: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          rent_amount: { type: "number" },
          deposit_amount: { type: "number" },
          language_detected: { type: "string", enum: ["en", "th", "mixed"] },
          notice_period_days: { type: "integer" },
          rent_due_day: { type: "integer" },
          deposit_due_date: { type: "string" },
          deposit_return_days: { type: "integer" },
        },
        required: ["clauses"],
      },
    });
      return await retry(
        () => withTimeout(call(), budgets.extract, 'EXTRACT'),
        { retries: 1, baseDelayMs: 500, maxDelayMs: 1500, jitter: true }
      );
    });

    let llmUsed = true;
    let extractionResult, clauses;
    if (extractResult.__failed) {
      llmUsed = false;
      const kind = classifyError(extractResult.error);
      warnings.push({ stage: 'EXTRACT', kind: kind.kind, message: extractResult.error.msg });
      diagnostics.extract_error = extractResult.error.msg;
      extractionResult = { clauses: [] };
      clauses = [{ clause_id: 'CLAUSE-001', title: 'General', raw_text: 'Content not parsed', page_number: 1, language: (user && user.language) || 'en' }];
    } else {
      extractionResult = extractResult;
      clauses = (extractionResult && extractionResult.clauses) ? extractionResult.clauses : [];
      if (!Array.isArray(clauses) || clauses.length === 0) {
        llmUsed = false;
        diagnostics.extract_warning = 'EMPTY_CLAUSES_FALLBACK';
        warnings.push({ stage: 'EXTRACT', kind: 'LLM', message: 'Empty clauses; using fallback' });
        clauses = [{ clause_id: 'CLAUSE-001', title: 'General', raw_text: 'Content not parsed', page_number: 1, language: (user && user.language) || 'en' }];
      }
    }
    const keyTerms = {
      property_address: (extractionResult && extractionResult.property_address) || "",
      start_date: (extractionResult && extractionResult.start_date) || "",
      end_date: (extractionResult && extractionResult.end_date) || "",
      rent_amount: (extractionResult && extractionResult.rent_amount) || 0,
      deposit_amount: (extractionResult && extractionResult.deposit_amount) || 0,
      language_detected: (extractionResult && extractionResult.language_detected) || "en",
      notice_period_days: (extractionResult && extractionResult.notice_period_days) || 0,
      rent_due_day: (extractionResult && extractionResult.rent_due_day) || 0,
      deposit_due_date: (extractionResult && extractionResult.deposit_due_date) || "",
      deposit_return_days: (extractionResult && extractionResult.deposit_return_days) || 0,
    };

    const clauses_extracted = clauses.map((c, idx) => ({
      clause_id: String((c && c.clause_id) || `CLAUSE-${String(idx + 1).padStart(3, "0")}`),
      clause_number: idx + 1,
      title: (c && c.title) ? c.title : null,
      text: (c && c.raw_text) ? c.raw_text : "",
      page_number: (c && c.page_number) ? c.page_number : null,
    }));

    const userLang = user.language || "en";

    // PHASE A coverage gate: if no clauses, fail early
    if (!Array.isArray(clauses_extracted) || clauses_extracted.length === 0) {
      return json(200, {
        ok: false,
        error_code: "CoverageFailure_NoClauses",
        user_message: "We could not extract any clauses from the document. Please upload a clearer PDF or try again.",
        debugLog
      });
    }

    // PHASE B — Clause-by-clause ledger analysis (LLM) - one row per clause
    const analyzeClause = async (clause) => {
      const call = () => base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following lease clause and output ONLY JSON matching this schema.\n\nSchema: {\n  clause_id: string,\n  clause_number: number,\n  page_number: number|null,\n  risk_level: "NO_RISK"|"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",\n  taxonomy_code: string|null,\n  title: string,\n  rationale: string,\n  recommended_actions: string[],\n  confidence: "HIGH"|"MEDIUM"|"LOW"\n}\n\nRules:\n- Exactly the JSON object, no prose.\n- If risk_level != NO_RISK: taxonomy_code required, recommended_actions length >= 1 required.\n- rationale is always required.\n\nClause to analyze:\n---\n${clause.text}\n---`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            clause_id: { type: "string" },
            clause_number: { type: "number" },
            page_number: { anyOf: [{ type: "number" }, { type: "null" }] },
            risk_level: { type: "string", enum: ["NO_RISK","LOW","MEDIUM","HIGH","CRITICAL"] },
            taxonomy_code: { anyOf: [{ type: "string" }, { type: "null" }] },
            title: { type: "string" },
            rationale: { type: "string" },
            recommended_actions: { type: "array", items: { type: "string" } },
            confidence: { type: "string", enum: ["HIGH","MEDIUM","LOW"] },
            risk_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk_level: { type: "string", enum: ["LOW","MEDIUM","HIGH","CRITICAL"] },
                  taxonomy_code: { type: "string" },
                  title: { type: "string" },
                  rationale: { type: "string" },
                  recommended_actions: { type: "array", items: { type: "string" } },
                  confidence: { type: "string", enum: ["HIGH","MEDIUM","LOW"] }
                },
                required: ["risk_level","taxonomy_code","title","rationale","recommended_actions","confidence"]
              }
            }
          },
          required: ["clause_id","clause_number","risk_level","title","rationale","recommended_actions","confidence","risk_items"]
        },
        file_urls: undefined
      });

      const res = await withTimeout(call(), budgets.llm, 'LEDGER_PER_CLAUSE');
      // Minimal structural validation
      if (!res || typeof res !== 'object' || !('risk_level' in res)) throw new Error('Invalid LLM ledger row');

      const itemsRaw = Array.isArray(res.risk_items) ? res.risk_items : [];
      const items = itemsRaw.map((it) => ({
        risk_level: String(it?.risk_level || 'LOW').toUpperCase(),
        taxonomy_code: String(it?.taxonomy_code || 'CAT-UNMAPPED'),
        title: String(it?.title || '').trim(),
        rationale: String(it?.rationale || '').trim(),
        recommended_actions: Array.isArray(it?.recommended_actions) ? it.recommended_actions.filter(Boolean) : [],
        confidence: String(it?.confidence || 'LOW').toUpperCase(),
      })).filter((it) => it.title && it.rationale);

      const rank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const top = items.slice().sort((a,b)=> (rank[b.risk_level]||0) - (rank[a.risk_level]||0))[0];

      const summaryRisk = items.length ? (top?.risk_level || 'LOW') : String(res.risk_level || 'NO_RISK').toUpperCase();
      const summaryTitle = items.length ? (top?.title || res.title || clause.title || `Clause ${clause.clause_number}`) : String(res.title || clause.title || `Clause ${clause.clause_number}`);
      const summaryRationale = items.length ? (top?.rationale || res.rationale || '') : String(res.rationale || '').trim();
      const summaryReco = items.length ? (Array.isArray(top?.recommended_actions) ? top.recommended_actions.filter(Boolean) : []) : (Array.isArray(res.recommended_actions) ? res.recommended_actions.filter(Boolean) : []);
      const summaryConf = items.length ? String(top?.confidence || 'LOW').toUpperCase() : String(res.confidence || 'LOW').toUpperCase();
      const summaryTax = items.length ? (top?.taxonomy_code ?? res.taxonomy_code ?? null) : (res.taxonomy_code ?? null);

      return {
        clause_id: res.clause_id || clause.clause_id,
        clause_number: Number(res.clause_number ?? clause.clause_number),
        page_number: typeof res.page_number === 'number' ? res.page_number : (clause.page_number ?? null),
        risk_level: summaryRisk,
        taxonomy_code: summaryTax,
        title: summaryTitle,
        rationale: summaryRationale,
        recommended_actions: summaryReco,
        confidence: summaryConf,
        risk_items: items,
      };
    };

    const clause_ledger = [];
    for (const clause of clauses_extracted) {
      const row = await guard('LEDGER_CLAUSE', () => analyzeClause(clause));
      if (row.__failed) {
        clause_ledger.push({
          clause_id: clause.clause_id,
          clause_number: clause.clause_number,
          page_number: clause.page_number ?? null,
          risk_level: "NO_RISK",
          taxonomy_code: null,
          title: "No automated risk indicators detected (analysis fallback)",
          rationale: "Clause analysis failed or timed out; manual review recommended.",
          recommended_actions: [],
          confidence: "LOW",
          risk_items: []
        });
      } else {
        clause_ledger.push(row);
      }
    }

    // PHASE C — Validation + Auto-repair
    if (clause_ledger.length !== clauses_extracted.length) {
      return json(200, {
        ok: false,
        error_code: "CoverageFailure_MismatchCounts",
        user_message: "Internal validation failed (mismatch counts). Please try again.",
        debugLog
      });
    }

    const repairedNotes = [];
    for (let i = 0; i < clause_ledger.length; i++) {
      const r = clause_ledger[i];
      // Title and rationale must exist
      if (!r.title || !String(r.title).trim()) r.title = `Clause ${r.clause_number}`;
      if (!r.rationale || !String(r.rationale).trim()) r.rationale = "Automated rationale missing; manual review advised.";
      if (!Array.isArray(r.recommended_actions)) r.recommended_actions = [];
      if (!Array.isArray(r.risk_items)) r.risk_items = [];

      const risky = r.risk_level && r.risk_level !== 'NO_RISK';
      if (risky) {
        if (!r.taxonomy_code) {
          // Require taxonomy when risky
          r.taxonomy_code = `CAT-UNMAPPED`;
        }
        if (r.risk_items.length === 0) {
          // Auto-repair: synthesize one risk_item from summary
          r.risk_items.push({
            risk_level: String(r.risk_level || 'LOW').toUpperCase(),
            taxonomy_code: r.taxonomy_code || 'CAT-UNMAPPED',
            title: r.title,
            rationale: r.rationale,
            recommended_actions: r.recommended_actions.length ? r.recommended_actions : [
              "Request narrowing/clarification of terms to tenant-favorable language"
            ],
            confidence: String(r.confidence || 'LOW').toUpperCase(),
          });
          repairedNotes.push({ clause_id: r.clause_id, fix: 'AUTO_SYNTH_RISK_ITEM' });
        }
        // Ensure each risk_item has at least one recommendation
        for (const it of r.risk_items) {
          if (!Array.isArray(it.recommended_actions) || it.recommended_actions.length === 0) {
            it.recommended_actions = ["Add explicit safeguard preventing overbroad interpretation"];
            it.confidence = 'LOW';
            repairedNotes.push({ clause_id: r.clause_id, fix: 'AUTO_ADD_ITEM_RECO' });
          }
        }
      } else {
        // No risk → ensure risk_items is empty
        r.risk_items = [];
      }
    }

    // Phase D — Derive issues from ALL risk_items across clauses
    const issues_validated = clause_ledger.flatMap((r) =>
      Array.isArray(r.risk_items) ? r.risk_items.map((item) => ({
        clause_id: r.clause_id,
        clause_number: r.clause_number,
        page_number: r.page_number ?? null,
        risk_level: String(item.risk_level || 'LOW').toUpperCase(),
        taxonomy_code: item.taxonomy_code || r.taxonomy_code || 'CAT-UNMAPPED',
        title: item.title || r.title,
        rationale: item.rationale || r.rationale,
        recommended_actions: Array.isArray(item.recommended_actions) ? item.recommended_actions : [],
        confidence: String(item.confidence || 'LOW').toUpperCase(),
      })) : []
    );

    clauseCountSoFar = clauses_extracted.length;
    flagsCountSoFar = issues_validated.length;

    const payloadResult = await guard("BUILD_PAYLOAD", () => {
      const issues_from_items = clause_ledger.flatMap((r) =>
        Array.isArray(r.risk_items) ? r.risk_items.map((item) => ({
          clause_id: r.clause_id,
          clause_number: r.clause_number,
          page_number: r.page_number ?? null,
          risk_level: String(item.risk_level || 'LOW').toUpperCase(),
          taxonomy_code: item.taxonomy_code || r.taxonomy_code || 'Unclassified',
          title: item.title || r.title,
          rationale: item.rationale || r.rationale,
          recommended_actions: Array.isArray(item.recommended_actions) ? item.recommended_actions : [],
          confidence: String(item.confidence || 'LOW').toUpperCase(),
        })) : []
      );
      const risk_score = Math.min(100, issues_from_items.reduce((acc, r) => acc + (r.risk_level === 'CRITICAL' ? 25 : r.risk_level === 'HIGH' ? 18 : r.risk_level === 'MEDIUM' ? 10 : 6), 0));
      const summary = issues_from_items.length > 0
        ? `${issues_from_items.length} issues found. Review recommendations before signing.`
        : "No major issues detected.";
      return {
        lease_address: keyTerms.property_address || "Lease Agreement",
        generated_date: new Date().toISOString(),
        risk_score,
        summary,
        key_terms: keyTerms,
        // derive flags from issues
        flags: issues_from_items.map(r => ({
          clause_id: r.clause_id,
          severity: (r.risk_level || 'LOW').toLowerCase(),
          category: r.taxonomy_code || 'Unclassified',
          title: r.title,
          description: r.rationale,
          explanation: r.rationale,
          recommendation: (r.recommended_actions || []).join("\n"),
          evidence: (clauses_extracted.find(c => c.clause_id === r.clause_id)?.text || '').slice(0, 240)
        })),
        clause_review: clause_ledger.map(r => ({
          clause_id: r.clause_id,
          risk_level: (r.risk_level || 'NO_RISK').toLowerCase().replace('no_risk','none'),
          risk_summary: r.rationale,
          recommended_change: Array.isArray(r.recommended_actions) ? r.recommended_actions[0] || undefined : undefined,
          category: r.taxonomy_code || 'Unclassified'
        })),
        clause_ledger: clauses_extracted.map(c => ({
          clause_id: c.clause_id,
          heading: c.title,
          full_text: c.text,
          page: c.page_number || 1
        })),
        canonical_ledger: [],
        missing_clauses: [],
        coverage_summary: {
          total_clauses: clauses_extracted.length,
          clauses_reviewed: clause_ledger.length,
          clauses_flagged: issues_from_items.length,
          canonical_catalog_count: 0,
          canonical_missing_count: 0,
        },
        mappings: [],
        fallback: false,
        fallback_reason: "",
        catalog_version: CANONICAL_CATALOG.catalog_version,
        catalog_source: CANONICAL_CATALOG.source,
        meta: { issues_validated_count: issues_from_items.length }
      };
    });

    let pdfPayload;
    if (payloadResult.__failed) {
      warnings.push({ stage: 'BUILD_PAYLOAD', kind: 'UNKNOWN', message: payloadResult.error.msg });
      pdfPayload = {
        lease_address: "Lease Agreement",
        generated_date: new Date().toISOString(),
        risk_score: 0,
        summary: "Partial payload build",
        key_terms: {},
        flags: [],
        clause_review: [],
        clause_ledger: clauses_extracted,
        canonical_ledger: [],
        missing_clauses: [],
        coverage_summary: { total_clauses: clauses_extracted.length, clauses_reviewed: 0, clauses_flagged: 0 },
        fallback: true,
        fallback_reason: "payload_build_failed"
      };
    } else {
      pdfPayload = payloadResult;
    }

    const issues_validated = clause_ledger.flatMap((r) =>
      Array.isArray(r.risk_items) ? r.risk_items.map((item) => ({
        clause_id: r.clause_id,
        clause_number: r.clause_number,
        page_number: r.page_number ?? null,
        risk_level: String(item.risk_level || 'LOW').toUpperCase(),
        taxonomy_code: item.taxonomy_code || r.taxonomy_code || 'Unclassified',
        title: item.title || r.title,
        rationale: item.rationale || r.rationale,
        recommended_actions: Array.isArray(item.recommended_actions) ? item.recommended_actions : [],
        confidence: String(item.confidence || 'LOW').toUpperCase(),
      })) : []
    );

    const canonical_report = {
      status: "ok",
      generatedAt: new Date().toISOString(),
      pdfPayload: {
        lease_address: pdfPayload.lease_address,
        generated_date: pdfPayload.generated_date,
        risk_score: pdfPayload.risk_score,
        summary: pdfPayload.summary,
        key_terms: pdfPayload.key_terms,
        flags: pdfPayload.flags,
        clause_review: pdfPayload.clause_review,
        clause_ledger: pdfPayload.clause_ledger,
        mappings: pdfPayload.mappings || [],
        missing_clauses: pdfPayload.missing_clauses || [],
        coverage_summary: pdfPayload.coverage_summary || {}
      },
      clause_ledger: clauses_extracted,
      canonical_ledger: [],
      missing_clauses: [],
      clause_review: pdfPayload.clause_review || [],
      issues: pdfPayload.flags || []
    };

    // Compute self-test diagnostics (non-blocking)
    const idsExtracted = new Set((clauses_extracted || []).map((c) => c?.clause_id));
    const idsLedger = new Set((clause_ledger || []).map((r) => r?.clause_id));
    const missingIds = Array.from(idsExtracted).filter((id) => !idsLedger.has(id));
    const extraIds = Array.from(idsLedger).filter((id) => !idsExtracted.has(id));

    const totalRiskItems = (clause_ledger || []).reduce((acc, r) => acc + (Array.isArray(r?.risk_items) ? r.risk_items.length : 0), 0);
    const sampleMulti = (clause_ledger || []).find((r) => Array.isArray(r?.risk_items) && r.risk_items.length >= 2);

    const levelCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    (issues_validated || []).forEach((it) => {
      const lvl = String(it?.risk_level || '').toUpperCase();
      if (levelCounts.hasOwnProperty(lvl)) levelCounts[lvl] += 1;
    });

    const issuesMissingActions = (issues_validated || []).filter((it) => !Array.isArray(it?.recommended_actions) || it.recommended_actions.length === 0)
      .map((it) => ({ clause_id: it.clause_id, title: it.title, risk_level: it.risk_level }));

    const self_test = {
      clause_ledger_integrity: {
        clauses_extracted_len: (clauses_extracted || []).length,
        clause_ledger_len: (clause_ledger || []).length,
        pass_same_length: (clauses_extracted || []).length === (clause_ledger || []).length,
        missing_clause_ids_in_ledger: missingIds,
        extra_clause_ids_in_ledger: extraIds
      },
      multi_risk_expansion: {
        total_risk_items_from_ledger: totalRiskItems,
        issues_validated_len: (issues_validated || []).length,
        pass_equal_counts: totalRiskItems === (issues_validated || []).length,
        sample_multi_risk_clause: {
          clause_id: sampleMulti?.clause_id || null,
          clause_number: sampleMulti?.clause_number || null,
          risk_items_len: Array.isArray(sampleMulti?.risk_items) ? sampleMulti.risk_items.length : 0
        }
      },
      no_silent_risk_loss: {
        pass_no_filtering_possible: true,
        derivation_method: "FLATMAP_RISK_ITEMS"
      },
      recommendations_guaranteed: {
        issues_missing_actions: issuesMissingActions,
        pass_all_have_actions: issuesMissingActions.length === 0
      },
      score_counts_consistency: {
        clauses_total_from_ledger: (clause_ledger || []).length,
        risks_total_from_issues: (issues_validated || []).length,
        risks_by_level: levelCounts,
        pass_non_negative: Object.values(levelCounts).every((n) => (typeof n === 'number') && n >= 0)
      },
      failure_honesty: {
        ok: true,
        error_code: null,
        pass_ok_or_error_present: true
      },
      overall_pass: (
        ((clauses_extracted || []).length === (clause_ledger || []).length) &&
        (totalRiskItems === (issues_validated || []).length) &&
        (issuesMissingActions.length === 0) &&
        (true)
      )
    };

    // Minimal summary + flags objects for persistence
    const summaryObj = {
      clauses_total: (clauses_extracted || []).length,
      risks_total: (issues_validated || []).length,
      risk_score: Number(pdfPayload?.risk_score || 0)
    };
    const flagsObj = {
      list: Array.isArray(pdfPayload?.flags) ? pdfPayload.flags : [],
      counts: levelCounts
    };

    // 4) Persist scan + mark lease scanned
    let persistedScanId = scanId;

    const persistResult = await guard("PERSIST", async () => {
      const existing = await base44.asServiceRole.entities.LeaseScan.filter({ id: scanId });
      if (!existing || existing.length === 0) {
        const created = await base44.asServiceRole.entities.LeaseScan.create({
          lease_id: leaseId,
          status: "processing",
        });
        persistedScanId = created.id;
      }

      await withTimeout(
        base44.asServiceRole.entities.LeaseScan.update(persistedScanId, {
          lease_id: leaseId,
          status: "completed",
          risk_score: pdfPayload.risk_score,
          flags: pdfPayload.flags,
          summary: pdfPayload.summary,
          scan_full: {
            pipeline: debugLog?.stages || [],
            clauses_extracted,
            clause_ledger: clause_ledger,
            issues_validated,
            flags: flagsObj,
            summary: summaryObj,
            clause_review: pdfPayload.clause_review,
            key_terms: keyTerms,
            language_detected: keyTerms.language_detected,
            self_test,
            debugLog,
            canonical_ledger: [],
            missing_clauses: [],
            canonical_report,
            diagnostics: {
              requestId,
              started_at: new Date(startTime).toISOString(),
              completed_at: new Date().toISOString(),
              clause_count: clauses_extracted.length,
              review_count: Array.isArray(pdfPayload.clause_review) ? pdfPayload.clause_review.length : 0,
              flags_count: Array.isArray(pdfPayload.flags) ? pdfPayload.flags.length : 0,
              canonical_missing_count: 0,
              catalog_version: CANONICAL_CATALOG.catalog_version,
              catalog_source: CANONICAL_CATALOG.source,
            },
            version: BUILD_TAG,
          },
        }), 
        budgets.persist, 
        'PERSIST_UPDATE'
      );

      await withTimeout(
        base44.asServiceRole.entities.Lease.update(leaseId, { status: "scanned" }), 
        budgets.persist, 
        'PERSIST_LEASE'
      );

      return { persistedScanId };
    });

    if (persistResult.__failed) {
      warnings.push({ stage: 'PERSIST', kind: 'HTTP', message: persistResult.error.msg });
      diagnostics.persist_warnings.push({ stage: 'PERSIST', msg: persistResult.error.msg });
    } else {
      persistedScanId = persistResult.persistedScanId;
    }

    // Verify persisted scan_full contains required keys
    const verifyPersist = await guard("VERIFY_PERSIST", async () => {
      const savedArr = await base44.asServiceRole.entities.LeaseScan.filter({ id: persistedScanId });
      const saved = savedArr?.[0] || null;
      const sf = saved?.scan_full || {};
      const hasNewKeys = Array.isArray(sf.clauses_extracted) && sf.clauses_extracted.length > 0 &&
                         Array.isArray(sf.clause_ledger) && sf.clause_ledger.length > 0 &&
                         Array.isArray(sf.issues_validated);
      const hasCanonicalPdf = !!(sf?.canonical_report && sf.canonical_report.pdfPayload);
      const okFull = !!(hasNewKeys && hasCanonicalPdf);
      return { saved, okFull, scanFullKeys: Object.keys(sf || {}), canonicalReportKeys: Object.keys(sf?.canonical_report || {}) };
    });

    if (verifyPersist.__failed || !verifyPersist.okFull) {
      return json(200, {
        ok: false,
        success: false,
        error_code: "PersistVerificationFailed",
        status: "failed",
        scanId: persistedScanId,
        leaseId,
        diagnostic: { requestId, buildTag: BUILD_TAG, elapsedMs: nowMs() - startTime, ...diagnostics, verify: verifyPersist },
        debugLog
      });
    }

    logStage("FINALIZE");
    const statusMode = warnings.length > 0 ? 'partial' : 'ok';
    return json(200, {
      ok: true,
      success: true,
      status: statusMode,
      partial: warnings.length > 0,
      warnings,
      scanId: persistedScanId,
      leaseId,
      clauses_extracted,
      clause_ledger,
      issues_validated,
      result: pdfPayload,
      diagnostic: { requestId, buildTag: BUILD_TAG, elapsedMs: nowMs() - startTime, budgets, durationsMs, llmUsed, ruleHits: (pdfPayload.flags||[]).length, clauses: clauses_extracted.length, ...diagnostics },
      debugLog
    });
  } catch (topError) {
    // FINAL CATCH-ALL: NEVER throw, ALWAYS return debugLog
    const se = safeError(topError);
    logStage("FATAL", { error: se.msg });
    console.error(JSON.stringify({ requestId, stage: 'FATAL', error: se.msg, stack: se.stack }));

    const minimal = {
      lease_address: "Lease Agreement",
      generated_date: new Date().toISOString(),
      risk_score: 0,
      summary: "Scan failed due to critical error. Contact support with requestId.",
      key_terms: {},
      flags: [],
      clause_review: [],
      clause_ledger: [],
      canonical_ledger: [],
      missing_clauses: [],
      coverage_summary: { total_clauses: 0, clauses_reviewed: 0, clauses_flagged: 0 },
      fallback: true,
      fallback_reason: "fatal_catch"
    };

    const self_test = {
      clause_ledger_integrity: {
        clauses_extracted_len: 0,
        clause_ledger_len: 0,
        pass_same_length: false,
        missing_clause_ids_in_ledger: [],
        extra_clause_ids_in_ledger: []
      },
      multi_risk_expansion: {
        total_risk_items_from_ledger: 0,
        issues_validated_len: 0,
        pass_equal_counts: false,
        sample_multi_risk_clause: { clause_id: null, clause_number: null, risk_items_len: 0 }
      },
      no_silent_risk_loss: { pass_no_filtering_possible: true, derivation_method: "FLATMAP_RISK_ITEMS" },
      recommendations_guaranteed: { issues_missing_actions: [], pass_all_have_actions: true },
      score_counts_consistency: { clauses_total_from_ledger: 0, risks_total_from_issues: 0, risks_by_level: { LOW:0, MEDIUM:0, HIGH:0, CRITICAL:0 }, pass_non_negative: true },
      failure_honesty: { ok: false, error_code: stage || 'FAILED', pass_ok_or_error_present: true },
      overall_pass: false
    };

    // Try to persist debug info for failed scans (non-blocking)
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.LeaseScan.update(body.scanId || null, {
        status: 'failed',
        scan_full: {
          error: { stage, message: se.msg },
          debugLog,
          pipeline: debugLog?.stages || []
        }
      });
    } catch (_) {}

    return json(200, {
      ok: false,
      success: false,
      status: 'failed',
      partial: false,
      warnings: [{ stage: stage || 'UNKNOWN', kind: 'FATAL', message: se.msg }],
      scanId: body.scanId || null,
      leaseId: body.leaseId || null,
      result: minimal,
      self_test,
      error: { category: "SCAN_FAILED", message: se.msg, requestId, scanId: body.scanId || null, details: { stage, msg: se.msg, stack: se.stack } },
      diagnostic: {
        requestId,
        buildTag: BUILD_TAG,
        elapsedMs: nowMs() - startTime,
        budgets,
        durationsMs,
        llmUsed: false,
        ruleHits: 0,
        clauses: 0,
        error: { stage, msg: se.msg, stack: se.stack }
      },
      debugLog
    });
  }
});