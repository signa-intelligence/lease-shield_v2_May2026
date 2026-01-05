import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ============================================================================
// CANONICAL CLAUSE CATALOG - Thailand Residential Lease Standard v1.1
// This is the authoritative source of truth for lease clause taxonomy
// ============================================================================

const CATALOG_VERSION = "v1.1";
const CATALOG_UPDATED_AT = "2026-01-05T00:00:00Z";

const CANONICAL_CLAUSE_CATALOG = [
  // === PARTIES & PROPERTY (CAT-001 to CAT-005) ===
  { catalog_id: "CAT-001", canonical_name: "Parties Identification", purpose: "Identify lessor (landlord) and lessee (tenant) with full legal names and ID numbers", typical_keywords: ["lessor", "lessee", "landlord", "tenant", "party"], typical_variants: ["First Party / Second Party", "Owner / Renter"], risk_triggers: ["missing ID numbers", "agent signing without POA"], is_active: true, sort_order: 1 },
  { catalog_id: "CAT-002", canonical_name: "Property Description", purpose: "Define the leased premises with address, unit number, and boundaries", typical_keywords: ["premises", "property", "unit", "address"], typical_variants: ["Leased Property", "Subject Matter"], risk_triggers: ["vague description", "no unit number"], is_active: true, sort_order: 2 },
  { catalog_id: "CAT-003", canonical_name: "Property Condition at Handover", purpose: "Document the state of property at lease commencement", typical_keywords: ["condition", "as-is", "inventory"], typical_variants: ["Move-in Condition", "Premises State"], risk_triggers: ["no inventory list", "no photo documentation"], is_active: true, sort_order: 3 },
  { catalog_id: "CAT-004", canonical_name: "Furnishings & Fixtures Inventory", purpose: "List all furniture, appliances, and fixtures included", typical_keywords: ["furniture", "appliances", "fixtures", "inventory"], typical_variants: ["Equipment List", "Included Items"], risk_triggers: ["no itemized list", "no condition assessment"], is_active: true, sort_order: 4 },
  { catalog_id: "CAT-005", canonical_name: "Common Areas & Facilities", purpose: "Define access to shared facilities (pool, gym, parking)", typical_keywords: ["common area", "facilities", "amenities", "parking"], typical_variants: ["Shared Facilities", "Building Amenities"], risk_triggers: ["facilities access can be revoked", "extra fees"], is_active: true, sort_order: 5 },

  // === LEASE TERM (CAT-006 to CAT-012) ===
  { catalog_id: "CAT-006", canonical_name: "Lease Term & Commencement", purpose: "Define start date, end date, and duration of tenancy", typical_keywords: ["term", "commence", "duration", "period"], typical_variants: ["Tenancy Period", "Lease Duration"], risk_triggers: ["unclear start date", "term exceeds 3 years"], is_active: true, sort_order: 6 },
  { catalog_id: "CAT-007", canonical_name: "Renewal Terms", purpose: "Define how lease can be renewed and under what conditions", typical_keywords: ["renew", "renewal", "extend", "extension"], typical_variants: ["Lease Extension", "Continuation"], risk_triggers: ["auto-renewal without consent", "no renewal option"], is_active: true, sort_order: 7 },
  { catalog_id: "CAT-008", canonical_name: "Auto-Renewal Mechanism", purpose: "Specify automatic renewal conditions and opt-out procedures", typical_keywords: ["automatic", "auto-renew", "unless notice"], typical_variants: ["Tacit Renewal", "Evergreen Clause"], risk_triggers: ["short opt-out window", "confirmed receipt required"], is_active: true, sort_order: 8 },
  { catalog_id: "CAT-009", canonical_name: "Notice Period for Non-Renewal", purpose: "Define advance notice required to not renew", typical_keywords: ["notice", "days before", "advance"], typical_variants: ["Termination Notice", "End Notice"], risk_triggers: ["excessive notice period (>60 days)"], is_active: true, sort_order: 9 },
  { catalog_id: "CAT-010", canonical_name: "Early Termination by Tenant", purpose: "Conditions under which tenant can terminate early", typical_keywords: ["early termination", "break clause", "tenant terminate"], typical_variants: ["Tenant Break", "Premature End"], risk_triggers: ["no early termination right", "full deposit forfeiture"], is_active: true, sort_order: 10 },
  { catalog_id: "CAT-011", canonical_name: "Early Termination by Landlord", purpose: "Conditions under which landlord can terminate early", typical_keywords: ["landlord terminate", "owner terminate"], typical_variants: ["Lessor Break", "Owner's Right to Terminate"], risk_triggers: ["termination without cause", "short notice"], is_active: true, sort_order: 11 },
  { catalog_id: "CAT-012", canonical_name: "Holdover Tenancy", purpose: "Define status and rent if tenant stays past lease end", typical_keywords: ["holdover", "overstay", "after expiration"], typical_variants: ["Post-Lease Occupancy", "Continued Possession"], risk_triggers: ["2x-3x rent multiplier", "daily penalties"], is_active: true, sort_order: 12 },

  // === RENT & PAYMENT (CAT-013 to CAT-020) ===
  { catalog_id: "CAT-013", canonical_name: "Rent Amount & Currency", purpose: "State monthly rent amount and currency", typical_keywords: ["rent", "monthly", "baht", "THB"], typical_variants: ["Rental Fee", "Monthly Payment"], risk_triggers: ["rent in foreign currency", "variable rent formula"], is_active: true, sort_order: 13 },
  { catalog_id: "CAT-014", canonical_name: "Rent Due Date", purpose: "Specify which day of month rent is due", typical_keywords: ["due date", "payable", "by the"], typical_variants: ["Payment Date", "Due Day"], risk_triggers: ["no grace period mentioned"], is_active: true, sort_order: 14 },
  { catalog_id: "CAT-015", canonical_name: "Rent Payment Method", purpose: "Define acceptable payment methods and account details", typical_keywords: ["bank transfer", "payment method", "account"], typical_variants: ["Payment Channel", "How to Pay"], risk_triggers: ["cash only", "no receipt requirement"], is_active: true, sort_order: 15 },
  { catalog_id: "CAT-016", canonical_name: "Late Payment Penalty", purpose: "Define consequences of late rent payment", typical_keywords: ["late fee", "penalty", "interest", "per day"], typical_variants: ["Overdue Charge", "Default Interest"], risk_triggers: ["excessive daily rate (>1%)", "compound interest"], is_active: true, sort_order: 16 },
  { catalog_id: "CAT-017", canonical_name: "Rent Escalation / Increase", purpose: "Define how and when rent can increase", typical_keywords: ["increase", "escalation", "adjustment", "raise"], typical_variants: ["Rent Review", "Annual Adjustment"], risk_triggers: ["unlimited increase", "landlord sole discretion"], is_active: true, sort_order: 17 },
  { catalog_id: "CAT-018", canonical_name: "Advance Rent", purpose: "Define any rent paid in advance beyond first month", typical_keywords: ["advance", "prepaid", "upfront"], typical_variants: ["Prepayment", "Rent Deposit"], risk_triggers: ["excessive advance (>2 months)"], is_active: true, sort_order: 18 },
  { catalog_id: "CAT-019", canonical_name: "Rent Receipts", purpose: "Obligation to provide payment receipts", typical_keywords: ["receipt", "acknowledgment", "confirmation"], typical_variants: ["Payment Confirmation", "Proof of Payment"], risk_triggers: ["no receipt obligation"], is_active: true, sort_order: 19 },
  { catalog_id: "CAT-020", canonical_name: "Partial Payment", purpose: "Whether partial rent payments are accepted", typical_keywords: ["partial", "incomplete", "less than"], typical_variants: ["Incomplete Payment", "Short Payment"], risk_triggers: ["partial payment rejected"], is_active: true, sort_order: 20 },

  // === SECURITY DEPOSIT (CAT-021 to CAT-028) ===
  { catalog_id: "CAT-021", canonical_name: "Security Deposit Amount", purpose: "State the security deposit amount", typical_keywords: ["deposit", "security", "guarantee"], typical_variants: ["Bond", "Damage Deposit"], risk_triggers: ["excessive (>2 months)"], is_active: true, sort_order: 21 },
  { catalog_id: "CAT-022", canonical_name: "Deposit Payment Terms", purpose: "When and how deposit must be paid", typical_keywords: ["upon signing", "before move-in"], typical_variants: ["Deposit Due", "Payment Schedule"], risk_triggers: ["immediate forfeiture if not paid"], is_active: true, sort_order: 22 },
  { catalog_id: "CAT-023", canonical_name: "Deposit Holding", purpose: "Where and how deposit is held during tenancy", typical_keywords: ["held", "escrow", "account"], typical_variants: ["Deposit Custody", "Safekeeping"], risk_triggers: ["no separate account", "landlord can use deposit"], is_active: true, sort_order: 23 },
  { catalog_id: "CAT-024", canonical_name: "Permitted Deposit Deductions", purpose: "What landlord can deduct from deposit", typical_keywords: ["deduct", "withhold", "damages", "unpaid"], typical_variants: ["Deposit Setoff", "Deduction Rights"], risk_triggers: ["vague deduction grounds", "sole discretion"], is_active: true, sort_order: 24 },
  { catalog_id: "CAT-025", canonical_name: "Deposit Return Timeline", purpose: "When deposit must be returned after move-out", typical_keywords: ["return", "refund", "within days"], typical_variants: ["Deposit Refund Period", "Return Schedule"], risk_triggers: ["no timeline specified", "excessive delay (>30 days)"], is_active: true, sort_order: 25 },
  { catalog_id: "CAT-026", canonical_name: "Deposit Return Procedure", purpose: "Process for returning deposit and providing itemization", typical_keywords: ["itemized", "statement", "inspection"], typical_variants: ["Return Process", "Settlement Procedure"], risk_triggers: ["no itemization required"], is_active: true, sort_order: 26 },
  { catalog_id: "CAT-027", canonical_name: "Deposit Forfeiture Conditions", purpose: "Circumstances when entire deposit is lost", typical_keywords: ["forfeit", "lose", "waive"], typical_variants: ["Deposit Loss", "Non-Refundable"], risk_triggers: ["early termination = full forfeiture"], is_active: true, sort_order: 27 },
  { catalog_id: "CAT-028", canonical_name: "Wear and Tear Definition", purpose: "Define normal vs abnormal wear", typical_keywords: ["wear and tear", "normal use", "deterioration"], typical_variants: ["Fair Wear", "Reasonable Use"], risk_triggers: ["no wear and tear allowance"], is_active: true, sort_order: 28 },

  // === UTILITIES & SERVICES (CAT-029 to CAT-034) ===
  { catalog_id: "CAT-029", canonical_name: "Electricity Charges", purpose: "Define electricity billing method and rates", typical_keywords: ["electricity", "electric", "unit", "meter"], typical_variants: ["Power Charges", "Electric Bill"], risk_triggers: ["above MEA rate", "landlord markup"], is_active: true, sort_order: 29 },
  { catalog_id: "CAT-030", canonical_name: "Water Charges", purpose: "Define water billing method and rates", typical_keywords: ["water", "unit", "meter"], typical_variants: ["Water Bill", "MWA Charges"], risk_triggers: ["above MWA rate", "flat fee"], is_active: true, sort_order: 30 },
  { catalog_id: "CAT-031", canonical_name: "Internet & Cable", purpose: "Internet and TV service arrangements", typical_keywords: ["internet", "wifi", "cable", "TV"], typical_variants: ["Connectivity", "Broadband"], risk_triggers: ["mandatory provider", "no cancellation right"], is_active: true, sort_order: 31 },
  { catalog_id: "CAT-032", canonical_name: "Common Area Fees", purpose: "Monthly building/condo common area fees", typical_keywords: ["common fee", "CAM", "maintenance fee"], typical_variants: ["Management Fee", "Building Fee"], risk_triggers: ["tenant pays CAM directly"], is_active: true, sort_order: 32 },
  { catalog_id: "CAT-033", canonical_name: "Utility Disconnection Rights", purpose: "Whether landlord can cut utilities for non-payment", typical_keywords: ["disconnect", "cut", "suspend", "terminate"], typical_variants: ["Service Termination", "Utility Cutoff"], risk_triggers: ["disconnection as penalty (ILLEGAL)"], is_active: true, sort_order: 33 },
  { catalog_id: "CAT-034", canonical_name: "Utility Deposit", purpose: "Separate deposits for utilities", typical_keywords: ["utility deposit", "meter deposit"], typical_variants: ["Service Deposit", "Meter Bond"], risk_triggers: ["non-refundable", "excessive amount"], is_active: true, sort_order: 34 },

  // === MAINTENANCE & REPAIRS (CAT-035 to CAT-042) ===
  { catalog_id: "CAT-035", canonical_name: "Tenant Maintenance Obligations", purpose: "What tenant must maintain and repair", typical_keywords: ["tenant maintain", "tenant repair", "responsible for"], typical_variants: ["Lessee's Maintenance", "Renter's Duties"], risk_triggers: ["excessive scope", "structural repairs on tenant"], is_active: true, sort_order: 35 },
  { catalog_id: "CAT-036", canonical_name: "Landlord Maintenance Obligations", purpose: "What landlord must maintain and repair", typical_keywords: ["landlord maintain", "owner repair", "lessor responsible"], typical_variants: ["Lessor's Maintenance", "Owner's Duties"], risk_triggers: ["minimal obligations", "no timeline"], is_active: true, sort_order: 36 },
  { catalog_id: "CAT-037", canonical_name: "Repair Request Procedure", purpose: "How tenant reports issues and requests repairs", typical_keywords: ["report", "notify", "request"], typical_variants: ["Maintenance Request", "Issue Reporting"], risk_triggers: ["written notice only", "complex procedure"], is_active: true, sort_order: 37 },
  { catalog_id: "CAT-038", canonical_name: "Repair Timeline", purpose: "How quickly landlord must respond to repair requests", typical_keywords: ["within days", "response time"], typical_variants: ["Repair SLA", "Response Period"], risk_triggers: ["no timeline", "unreasonable delays"], is_active: true, sort_order: 38 },
  { catalog_id: "CAT-039", canonical_name: "Emergency Repairs", purpose: "Handling urgent repair situations", typical_keywords: ["emergency", "urgent", "immediate"], typical_variants: ["Critical Repairs", "Urgent Maintenance"], risk_triggers: ["no emergency definition", "tenant cannot self-remedy"], is_active: true, sort_order: 39 },
  { catalog_id: "CAT-040", canonical_name: "Alterations & Improvements", purpose: "Tenant's right to modify the property", typical_keywords: ["alteration", "modification", "improvement"], typical_variants: ["Changes", "Fit-out"], risk_triggers: ["no alterations allowed", "approval at sole discretion"], is_active: true, sort_order: 40 },
  { catalog_id: "CAT-041", canonical_name: "Restoration at End of Lease", purpose: "Requirement to return property to original condition", typical_keywords: ["restore", "original condition", "reinstate"], typical_variants: ["Make Good", "Return Condition"], risk_triggers: ["strict original condition", "no wear allowance"], is_active: true, sort_order: 41 },
  { catalog_id: "CAT-042", canonical_name: "Appliance Maintenance", purpose: "Responsibility for appliance upkeep", typical_keywords: ["appliance", "aircon", "AC", "refrigerator"], typical_variants: ["Equipment Care", "A/C Service"], risk_triggers: ["tenant pays all appliance repairs"], is_active: true, sort_order: 42 },

  // === USE & OCCUPANCY (CAT-043 to CAT-052) ===
  { catalog_id: "CAT-043", canonical_name: "Permitted Use", purpose: "Define allowed use of the property", typical_keywords: ["residential", "use", "purpose"], typical_variants: ["Allowed Activities", "Property Purpose"], risk_triggers: ["strictly residential only", "no work from home"], is_active: true, sort_order: 43 },
  { catalog_id: "CAT-044", canonical_name: "Prohibited Activities", purpose: "Activities not allowed on premises", typical_keywords: ["prohibit", "not allowed", "forbidden"], typical_variants: ["Restrictions", "Banned Activities"], risk_triggers: ["broad prohibitions", "vague terms"], is_active: true, sort_order: 44 },
  { catalog_id: "CAT-045", canonical_name: "Occupancy Limits", purpose: "Maximum number of occupants allowed", typical_keywords: ["occupant", "person", "maximum"], typical_variants: ["Resident Limit", "Headcount"], risk_triggers: ["strict limits", "fees per person"], is_active: true, sort_order: 45 },
  { catalog_id: "CAT-046", canonical_name: "Guest Policy", purpose: "Rules for visitors and overnight guests", typical_keywords: ["guest", "visitor", "overnight"], typical_variants: ["Visitor Rules", "Guest Restrictions"], risk_triggers: ["guest registration", "limits on stays"], is_active: true, sort_order: 46 },
  { catalog_id: "CAT-047", canonical_name: "Pet Policy", purpose: "Rules regarding keeping pets", typical_keywords: ["pet", "animal", "dog", "cat"], typical_variants: ["Animal Policy", "Pet Restrictions"], risk_triggers: ["no pets absolute", "pet deposit"], is_active: true, sort_order: 47 },
  { catalog_id: "CAT-048", canonical_name: "Smoking Policy", purpose: "Rules regarding smoking on premises", typical_keywords: ["smoking", "smoke", "cigarette"], typical_variants: ["No Smoking", "Tobacco Policy"], risk_triggers: ["heavy fines", "immediate termination"], is_active: true, sort_order: 48 },
  { catalog_id: "CAT-049", canonical_name: "Noise & Nuisance", purpose: "Rules about noise levels and disturbance", typical_keywords: ["noise", "quiet", "nuisance", "disturbance"], typical_variants: ["Quiet Hours", "Disturbance Policy"], risk_triggers: ["subjective standard", "neighbor complaints = breach"], is_active: true, sort_order: 49 },
  { catalog_id: "CAT-050", canonical_name: "Subletting & Assignment", purpose: "Whether tenant can sublet or assign lease", typical_keywords: ["sublet", "sublease", "assign", "transfer"], typical_variants: ["Sublease Rights", "Lease Transfer"], risk_triggers: ["absolute prohibition"], is_active: true, sort_order: 50 },
  { catalog_id: "CAT-051", canonical_name: "Short-term Letting Ban", purpose: "Prohibition on Airbnb-style rentals", typical_keywords: ["short-term", "daily", "Airbnb"], typical_variants: ["No Daily Rental", "Short Stay Ban"], risk_triggers: ["immediate termination", "heavy fines"], is_active: true, sort_order: 51 },
  { catalog_id: "CAT-052", canonical_name: "Business Use Restrictions", purpose: "Rules about conducting business from property", typical_keywords: ["business", "commercial", "work", "office"], typical_variants: ["WFH Policy", "Commercial Activity"], risk_triggers: ["no WFH allowed", "vague definition"], is_active: true, sort_order: 52 },

  // === ACCESS & PRIVACY (CAT-053 to CAT-057) ===
  { catalog_id: "CAT-053", canonical_name: "Landlord Entry Rights", purpose: "When and how landlord can enter property", typical_keywords: ["entry", "access", "enter", "inspection"], typical_variants: ["Right of Access", "Inspection Rights"], risk_triggers: ["entry without notice", "entry at any time"], is_active: true, sort_order: 53 },
  { catalog_id: "CAT-054", canonical_name: "Notice for Entry", purpose: "Advance notice required before landlord entry", typical_keywords: ["notice", "advance", "hours", "days"], typical_variants: ["Entry Notice", "Access Warning"], risk_triggers: ["no notice requirement", "less than 24 hours"], is_active: true, sort_order: 54 },
  { catalog_id: "CAT-055", canonical_name: "Emergency Entry", purpose: "Entry without notice in emergencies", typical_keywords: ["emergency", "urgent", "fire", "flood"], typical_variants: ["Urgent Access", "Emergency Inspection"], risk_triggers: ["emergency not defined"], is_active: true, sort_order: 55 },
  { catalog_id: "CAT-056", canonical_name: "Keys & Access Devices", purpose: "Rules about keys, cards, and access control", typical_keywords: ["key", "card", "access", "lock"], typical_variants: ["Access Control", "Security Devices"], risk_triggers: ["landlord retains key", "no lock change allowed"], is_active: true, sort_order: 56 },
  { catalog_id: "CAT-057", canonical_name: "Privacy & Personal Data", purpose: "Protection of tenant's personal information", typical_keywords: ["privacy", "personal data", "PDPA"], typical_variants: ["Data Protection", "Information Privacy"], risk_triggers: ["no PDPA compliance", "data sharing"], is_active: true, sort_order: 57 },

  // === INSURANCE & LIABILITY (CAT-058 to CAT-062) ===
  { catalog_id: "CAT-058", canonical_name: "Tenant Insurance Requirement", purpose: "Whether tenant must carry insurance", typical_keywords: ["insurance", "coverage", "policy"], typical_variants: ["Renter's Insurance", "Content Insurance"], risk_triggers: ["mandatory expensive coverage"], is_active: true, sort_order: 58 },
  { catalog_id: "CAT-059", canonical_name: "Landlord Insurance", purpose: "What landlord's insurance covers", typical_keywords: ["building insurance", "property insurance"], typical_variants: ["Lessor's Coverage", "Structure Insurance"], risk_triggers: ["tenant not covered"], is_active: true, sort_order: 59 },
  { catalog_id: "CAT-060", canonical_name: "Liability Limitations", purpose: "Limits on landlord's liability to tenant", typical_keywords: ["liability", "indemnify", "hold harmless"], typical_variants: ["Limitation of Liability", "Indemnification"], risk_triggers: ["broad liability exclusion"], is_active: true, sort_order: 60 },
  { catalog_id: "CAT-061", canonical_name: "Damage by Third Parties", purpose: "Responsibility for damage caused by others", typical_keywords: ["third party", "neighbor", "contractor"], typical_variants: ["External Damage", "Other Party Liability"], risk_triggers: ["tenant liable for all damage"], is_active: true, sort_order: 61 },
  { catalog_id: "CAT-062", canonical_name: "Personal Property Risk", purpose: "Who bears risk of loss for tenant's belongings", typical_keywords: ["personal property", "belongings", "theft"], typical_variants: ["Content Risk", "Personal Effects"], risk_triggers: ["landlord not responsible for any loss"], is_active: true, sort_order: 62 },

  // === DEFAULT & REMEDIES (CAT-063 to CAT-068) ===
  { catalog_id: "CAT-063", canonical_name: "Events of Default", purpose: "Define what constitutes a breach of lease", typical_keywords: ["default", "breach", "violation"], typical_variants: ["Breach Events", "Contract Violation"], risk_triggers: ["minor violations = default"], is_active: true, sort_order: 63 },
  { catalog_id: "CAT-064", canonical_name: "Cure Period", purpose: "Time allowed to fix a breach before termination", typical_keywords: ["cure", "remedy", "rectify"], typical_variants: ["Grace Period", "Rectification Period"], risk_triggers: ["no cure period", "short cure (<7 days)"], is_active: true, sort_order: 64 },
  { catalog_id: "CAT-065", canonical_name: "Termination for Breach", purpose: "How lease can be terminated for default", typical_keywords: ["terminate", "end", "cancel"], typical_variants: ["Contract Termination", "Lease Cancellation"], risk_triggers: ["immediate termination", "no notice required"], is_active: true, sort_order: 65 },
  { catalog_id: "CAT-066", canonical_name: "Damages & Penalties", purpose: "Financial consequences of breach", typical_keywords: ["damages", "penalty", "compensation"], typical_variants: ["Liquidated Damages", "Breach Penalty"], risk_triggers: ["excessive penalties", "penalty stacking"], is_active: true, sort_order: 66 },
  { catalog_id: "CAT-067", canonical_name: "Abandoned Property", purpose: "Handling tenant's belongings after move-out", typical_keywords: ["abandon", "left behind", "dispose"], typical_variants: ["Deserted Property", "Left Items"], risk_triggers: ["short timeframe (<7 days)"], is_active: true, sort_order: 67 },
  { catalog_id: "CAT-068", canonical_name: "Eviction Procedure", purpose: "Legal process for removing tenant", typical_keywords: ["eviction", "remove", "vacate"], typical_variants: ["Removal Process", "Eviction Rights"], risk_triggers: ["self-help eviction", "lock change"], is_active: true, sort_order: 68 },

  // === LEGAL & DISPUTE (CAT-069 to CAT-075) ===
  { catalog_id: "CAT-069", canonical_name: "Governing Law", purpose: "Which country's laws govern the contract", typical_keywords: ["governing law", "applicable law", "Thai law"], typical_variants: ["Choice of Law", "Legal Jurisdiction"], risk_triggers: ["foreign law chosen"], is_active: true, sort_order: 69 },
  { catalog_id: "CAT-070", canonical_name: "Dispute Resolution", purpose: "How disputes will be resolved", typical_keywords: ["dispute", "resolution", "mediation", "arbitration"], typical_variants: ["Conflict Resolution", "Settlement Process"], risk_triggers: ["mandatory arbitration", "waiver of court access"], is_active: true, sort_order: 70 },
  { catalog_id: "CAT-071", canonical_name: "Court Jurisdiction", purpose: "Which court has jurisdiction over disputes", typical_keywords: ["court", "jurisdiction", "venue"], typical_variants: ["Forum Selection", "Court Choice"], risk_triggers: ["inconvenient venue", "foreign court"], is_active: true, sort_order: 71 },
  { catalog_id: "CAT-072", canonical_name: "Legal Fees", purpose: "Who pays legal fees in disputes", typical_keywords: ["legal fees", "attorney", "costs"], typical_variants: ["Litigation Costs", "Legal Expenses"], risk_triggers: ["loser pays all", "tenant pays regardless"], is_active: true, sort_order: 72 },
  { catalog_id: "CAT-073", canonical_name: "Waiver of Rights", purpose: "Any rights tenant gives up by signing", typical_keywords: ["waive", "relinquish", "give up"], typical_variants: ["Rights Waiver", "Surrender of Rights"], risk_triggers: ["waiver of legal rights"], is_active: true, sort_order: 73 },
  { catalog_id: "CAT-074", canonical_name: "Notices & Communications", purpose: "How formal notices must be given", typical_keywords: ["notice", "written", "delivery", "registered mail"], typical_variants: ["Communication Method", "Notice Requirements"], risk_triggers: ["multi-channel required", "short windows"], is_active: true, sort_order: 74 },
  { catalog_id: "CAT-075", canonical_name: "Severability", purpose: "What happens if part of contract is invalid", typical_keywords: ["severability", "invalid", "unenforceable"], typical_variants: ["Partial Invalidity", "Contract Survival"], risk_triggers: ["entire contract void if any part invalid"], is_active: true, sort_order: 75 },

  // === SPECIAL PROVISIONS (CAT-076 to CAT-082) ===
  { catalog_id: "CAT-076", canonical_name: "Force Majeure", purpose: "Events beyond control that excuse performance", typical_keywords: ["force majeure", "act of god"], typical_variants: ["Extraordinary Events", "Unforeseeable Circumstances"], risk_triggers: ["no force majeure clause", "pandemic excluded"], is_active: true, sort_order: 76 },
  { catalog_id: "CAT-077", canonical_name: "Entire Agreement", purpose: "Contract is the complete agreement, no side deals", typical_keywords: ["entire agreement", "complete", "supersedes"], typical_variants: ["Integration Clause", "Merger Clause"], risk_triggers: ["verbal promises not binding"], is_active: true, sort_order: 77 },
  { catalog_id: "CAT-078", canonical_name: "Amendments", purpose: "How contract can be modified", typical_keywords: ["amend", "modify", "change"], typical_variants: ["Contract Changes", "Modifications"], risk_triggers: ["landlord can amend unilaterally"], is_active: true, sort_order: 78 },
  { catalog_id: "CAT-079", canonical_name: "Representations & Warranties", purpose: "Promises made by each party about facts", typical_keywords: ["represent", "warrant", "guarantee"], typical_variants: ["Assurances", "Statements of Fact"], risk_triggers: ["no landlord representations"], is_active: true, sort_order: 79 },
  { catalog_id: "CAT-080", canonical_name: "Move-Out Procedure", purpose: "Steps required when vacating property", typical_keywords: ["move-out", "vacate", "handover"], typical_variants: ["End of Tenancy", "Property Return"], risk_triggers: ["unreasonable requirements"], is_active: true, sort_order: 80 },
  { catalog_id: "CAT-081", canonical_name: "Signatures & Witnesses", purpose: "Execution requirements for the contract", typical_keywords: ["sign", "execute", "witness"], typical_variants: ["Contract Execution", "Authentication"], risk_triggers: ["witness required but missing"], is_active: true, sort_order: 81 },
  { catalog_id: "CAT-082", canonical_name: "Language & Translation", purpose: "Which language version controls if bilingual", typical_keywords: ["language", "Thai", "English", "translation"], typical_variants: ["Controlling Version", "Interpretation"], risk_triggers: ["foreign language controls", "no Thai version"], is_active: true, sort_order: 82 },

  // === LEASE SHIELD ENHANCED CLAUSES v1.1 (CAT-121 to CAT-129) ===
  { catalog_id: "CAT-121", canonical_name: "Grace Period Definition", purpose: "Define the number of days after rent due date before late fees apply", typical_keywords: ["grace period", "grace days", "late after"], typical_variants: ["Payment Grace", "Late Payment Buffer"], risk_triggers: ["no grace period", "grace period less than 5 days"], is_active: true, sort_order: 121 },
  { catalog_id: "CAT-122", canonical_name: "Rent Suspension Conditions", purpose: "Define conditions when rent may be suspended or abated due to uninhabitability", typical_keywords: ["rent suspension", "rent abatement", "uninhabitable"], typical_variants: ["Rent Abatement", "Habitability Clause"], risk_triggers: ["no rent suspension provision"], is_active: true, sort_order: 122 },
  { catalog_id: "CAT-123", canonical_name: "Deposit Is Not Rent", purpose: "Clarify that security deposit cannot be applied as last month's rent by tenant", typical_keywords: ["deposit not rent", "cannot apply deposit"], typical_variants: ["Deposit Application Restriction", "No Rent Offset"], risk_triggers: ["silent on deposit-as-rent"], is_active: true, sort_order: 123 },
  { catalog_id: "CAT-124", canonical_name: "Wear and Tear Safe Harbour", purpose: "Explicitly exclude normal wear and tear from deposit deductions with specific examples", typical_keywords: ["normal wear excluded", "fair wear"], typical_variants: ["Wear Exclusion", "Depreciation Allowance"], risk_triggers: ["no wear and tear exclusion"], is_active: true, sort_order: 124 },
  { catalog_id: "CAT-125", canonical_name: "Quiet Enjoyment Covenant", purpose: "Guarantee tenant's right to peaceful possession without landlord interference", typical_keywords: ["quiet enjoyment", "peaceful possession"], typical_variants: ["Peaceful Enjoyment", "Non-Interference"], risk_triggers: ["no quiet enjoyment clause"], is_active: true, sort_order: 125 },
  { catalog_id: "CAT-126", canonical_name: "Cure Period Exceptions", purpose: "Define which breaches cannot be cured (e.g., non-payment, serious violations)", typical_keywords: ["non-curable", "cure exception", "serious breach"], typical_variants: ["Incurable Defaults", "No Remedy Breaches"], risk_triggers: ["too many non-curable breaches"], is_active: true, sort_order: 126 },
  { catalog_id: "CAT-127", canonical_name: "Early Termination Penalty Formula", purpose: "Define the specific calculation for early termination penalties based on remaining term", typical_keywords: ["termination penalty", "early exit fee", "penalty formula"], typical_variants: ["Break Fee Calculation", "Exit Penalty"], risk_triggers: ["excessive penalty (>2 months)"], is_active: true, sort_order: 127 },
  { catalog_id: "CAT-128", canonical_name: "Rent Abatement vs Force Majeure", purpose: "Distinguish between rent abatement (habitability) and force majeure (external events) provisions", typical_keywords: ["abatement", "force majeure", "rent reduction"], typical_variants: ["Rent Relief Distinction", "Habitability vs FM"], risk_triggers: ["no distinction between abatement and FM"], is_active: true, sort_order: 128 },
  { catalog_id: "CAT-129", canonical_name: "Utility Interruption – Rent Still Payable", purpose: "Clarify tenant's rent obligation during utility service interruptions not caused by tenant", typical_keywords: ["utility interruption", "service outage"], typical_variants: ["Service Interruption", "Utility Failure"], risk_triggers: ["tenant must pay full rent during extended outage"], is_active: true, sort_order: 129 },

  // === UNMAPPED CATCH-ALL ===
  { catalog_id: "CAT-UNMAPPED", canonical_name: "Unclassified Clause", purpose: "Clauses that don't fit standard categories", typical_keywords: [], typical_variants: [], risk_triggers: ["unusual or non-standard terms requiring manual review"], is_active: true, sort_order: 999 }
];

// Add version to each entry
const VERSIONED_CATALOG = CANONICAL_CLAUSE_CATALOG.map(entry => ({
  ...entry,
  catalog_version: CATALOG_VERSION
}));

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Check admin access
    const userRole = user.role?.toLowerCase();
    const accessLevel = user.access_level?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || 
                    accessLevel === 'admin' || accessLevel === 'super_admin' || accessLevel === 'va';
    
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required', code: 'ADMIN_REQUIRED' }, { 
        status: 403,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Return the canonical catalog
    return Response.json({
      success: true,
      catalog_version: CATALOG_VERSION,
      catalog_updated_at: CATALOG_UPDATED_AT,
      catalog_count: VERSIONED_CATALOG.length,
      source: 'LEASE_SHIELD_CANONICAL_V1',
      function_name: 'getCanonicalLedgerV1',
      catalog: VERSIONED_CATALOG
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('[GET_CANONICAL_LEDGER_V1_ERROR]', error.message);
    return Response.json({ 
      error: 'Failed to retrieve catalog', 
      details: error.message,
      function_name: 'getCanonicalLedgerV1'
    }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
});