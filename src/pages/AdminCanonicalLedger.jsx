import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Download, Copy, Search, CheckCircle2, AlertTriangle, 
  ArrowLeft, FileText, Database, RefreshCw, Code, ChevronDown, ChevronUp,
  AlertCircle
} from "lucide-react";

import AuthGuard from "../components/shared/AuthGuard";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import { haptic } from "../components/shared/HapticFeedback";
import ErrorBoundary from "../components/shared/ErrorBoundary";

const FALLBACK_CATALOG = {
  catalog_version: "v1.1",
  catalog_updated_at: "2026-01-05T00:00:00Z",
  catalog_count: 92,
  catalog: [
    { catalog_id: "CAT-001", canonical_name: "Parties Identification", purpose: "Identify lessor and lessee with full legal names and ID numbers", typical_keywords: ["lessor", "lessee", "landlord", "tenant"], typical_variants: ["First Party / Second Party"], risk_triggers: ["missing ID numbers"], is_active: true, sort_order: 1, catalog_version: "v1.1" },
    { catalog_id: "CAT-002", canonical_name: "Property Description", purpose: "Define the leased premises with address, unit number, and boundaries", typical_keywords: ["premises", "property", "unit"], typical_variants: ["Leased Property"], risk_triggers: ["vague description"], is_active: true, sort_order: 2, catalog_version: "v1.1" },
    { catalog_id: "CAT-003", canonical_name: "Property Condition at Handover", purpose: "Document the state of property at lease commencement", typical_keywords: ["condition", "as-is", "inventory"], typical_variants: ["Move-in Condition"], risk_triggers: ["no inventory list"], is_active: true, sort_order: 3, catalog_version: "v1.1" },
    { catalog_id: "CAT-004", canonical_name: "Furnishings & Fixtures Inventory", purpose: "List all furniture, appliances, and fixtures included", typical_keywords: ["furniture", "appliances", "fixtures"], typical_variants: ["Equipment List"], risk_triggers: ["no itemized list"], is_active: true, sort_order: 4, catalog_version: "v1.1" },
    { catalog_id: "CAT-005", canonical_name: "Common Areas & Facilities", purpose: "Define access to shared facilities", typical_keywords: ["common area", "facilities", "amenities"], typical_variants: ["Shared Facilities"], risk_triggers: ["facilities access can be revoked"], is_active: true, sort_order: 5, catalog_version: "v1.1" },
    { catalog_id: "CAT-006", canonical_name: "Lease Term & Commencement", purpose: "Define start date, end date, and duration", typical_keywords: ["term", "commence", "duration"], typical_variants: ["Tenancy Period"], risk_triggers: ["unclear start date"], is_active: true, sort_order: 6, catalog_version: "v1.1" },
    { catalog_id: "CAT-007", canonical_name: "Renewal Terms", purpose: "Define how lease can be renewed", typical_keywords: ["renew", "renewal", "extend"], typical_variants: ["Lease Extension"], risk_triggers: ["auto-renewal without consent"], is_active: true, sort_order: 7, catalog_version: "v1.1" },
    { catalog_id: "CAT-008", canonical_name: "Auto-Renewal Mechanism", purpose: "Specify automatic renewal conditions", typical_keywords: ["automatic", "auto-renew"], typical_variants: ["Tacit Renewal"], risk_triggers: ["short opt-out window"], is_active: true, sort_order: 8, catalog_version: "v1.1" },
    { catalog_id: "CAT-009", canonical_name: "Notice Period for Non-Renewal", purpose: "Define advance notice required", typical_keywords: ["notice", "days before", "advance"], typical_variants: ["Termination Notice"], risk_triggers: ["excessive notice period"], is_active: true, sort_order: 9, catalog_version: "v1.1" },
    { catalog_id: "CAT-010", canonical_name: "Early Termination by Tenant", purpose: "Conditions for tenant early termination", typical_keywords: ["early termination", "break clause"], typical_variants: ["Tenant Break"], risk_triggers: ["no early termination right"], is_active: true, sort_order: 10, catalog_version: "v1.1" },
    { catalog_id: "CAT-011", canonical_name: "Early Termination by Landlord", purpose: "Conditions for landlord early termination", typical_keywords: ["landlord terminate"], typical_variants: ["Lessor Break"], risk_triggers: ["termination without cause"], is_active: true, sort_order: 11, catalog_version: "v1.1" },
    { catalog_id: "CAT-012", canonical_name: "Holdover Tenancy", purpose: "Define status if tenant stays past lease end", typical_keywords: ["holdover", "overstay"], typical_variants: ["Post-Lease Occupancy"], risk_triggers: ["2x-3x rent multiplier"], is_active: true, sort_order: 12, catalog_version: "v1.1" },
    { catalog_id: "CAT-013", canonical_name: "Rent Amount & Currency", purpose: "State monthly rent amount", typical_keywords: ["rent", "monthly", "baht"], typical_variants: ["Rental Fee"], risk_triggers: ["rent in foreign currency"], is_active: true, sort_order: 13, catalog_version: "v1.1" },
    { catalog_id: "CAT-014", canonical_name: "Rent Due Date", purpose: "Specify which day rent is due", typical_keywords: ["due date", "payable"], typical_variants: ["Payment Date"], risk_triggers: ["no grace period"], is_active: true, sort_order: 14, catalog_version: "v1.1" },
    { catalog_id: "CAT-015", canonical_name: "Rent Payment Method", purpose: "Define acceptable payment methods", typical_keywords: ["bank transfer", "payment method"], typical_variants: ["Payment Channel"], risk_triggers: ["cash only"], is_active: true, sort_order: 15, catalog_version: "v1.1" },
    { catalog_id: "CAT-016", canonical_name: "Late Payment Penalty", purpose: "Define consequences of late payment", typical_keywords: ["late fee", "penalty"], typical_variants: ["Overdue Charge"], risk_triggers: ["excessive daily rate"], is_active: true, sort_order: 16, catalog_version: "v1.1" },
    { catalog_id: "CAT-017", canonical_name: "Rent Escalation / Increase", purpose: "Define how rent can increase", typical_keywords: ["increase", "escalation"], typical_variants: ["Rent Review"], risk_triggers: ["unlimited increase"], is_active: true, sort_order: 17, catalog_version: "v1.1" },
    { catalog_id: "CAT-018", canonical_name: "Advance Rent", purpose: "Define rent paid in advance", typical_keywords: ["advance", "prepaid"], typical_variants: ["Prepayment"], risk_triggers: ["excessive advance"], is_active: true, sort_order: 18, catalog_version: "v1.1" },
    { catalog_id: "CAT-019", canonical_name: "Rent Receipts", purpose: "Obligation to provide receipts", typical_keywords: ["receipt", "acknowledgment"], typical_variants: ["Payment Confirmation"], risk_triggers: ["no receipt obligation"], is_active: true, sort_order: 19, catalog_version: "v1.1" },
    { catalog_id: "CAT-020", canonical_name: "Partial Payment", purpose: "Whether partial payments accepted", typical_keywords: ["partial", "incomplete"], typical_variants: ["Incomplete Payment"], risk_triggers: ["partial payment rejected"], is_active: true, sort_order: 20, catalog_version: "v1.1" },
    { catalog_id: "CAT-021", canonical_name: "Security Deposit Amount", purpose: "State the security deposit amount", typical_keywords: ["deposit", "security"], typical_variants: ["Bond"], risk_triggers: ["excessive deposit"], is_active: true, sort_order: 21, catalog_version: "v1.1" },
    { catalog_id: "CAT-022", canonical_name: "Deposit Payment Terms", purpose: "When and how deposit must be paid", typical_keywords: ["upon signing", "before move-in"], typical_variants: ["Deposit Due"], risk_triggers: ["immediate forfeiture"], is_active: true, sort_order: 22, catalog_version: "v1.1" },
    { catalog_id: "CAT-023", canonical_name: "Deposit Holding", purpose: "Where deposit is held", typical_keywords: ["held", "escrow"], typical_variants: ["Deposit Custody"], risk_triggers: ["no separate account"], is_active: true, sort_order: 23, catalog_version: "v1.1" },
    { catalog_id: "CAT-024", canonical_name: "Permitted Deposit Deductions", purpose: "What landlord can deduct", typical_keywords: ["deduct", "withhold"], typical_variants: ["Deposit Setoff"], risk_triggers: ["vague deduction grounds"], is_active: true, sort_order: 24, catalog_version: "v1.1" },
    { catalog_id: "CAT-025", canonical_name: "Deposit Return Timeline", purpose: "When deposit must be returned", typical_keywords: ["return", "refund"], typical_variants: ["Deposit Refund Period"], risk_triggers: ["no timeline specified"], is_active: true, sort_order: 25, catalog_version: "v1.1" },
    { catalog_id: "CAT-026", canonical_name: "Deposit Return Procedure", purpose: "Process for returning deposit", typical_keywords: ["itemized", "statement"], typical_variants: ["Return Process"], risk_triggers: ["no itemization required"], is_active: true, sort_order: 26, catalog_version: "v1.1" },
    { catalog_id: "CAT-027", canonical_name: "Deposit Forfeiture Conditions", purpose: "When deposit is lost", typical_keywords: ["forfeit", "lose"], typical_variants: ["Deposit Loss"], risk_triggers: ["early termination = forfeiture"], is_active: true, sort_order: 27, catalog_version: "v1.1" },
    { catalog_id: "CAT-028", canonical_name: "Wear and Tear Definition", purpose: "Define normal vs abnormal wear", typical_keywords: ["wear and tear", "normal use"], typical_variants: ["Fair Wear"], risk_triggers: ["no wear allowance"], is_active: true, sort_order: 28, catalog_version: "v1.1" },
    { catalog_id: "CAT-029", canonical_name: "Electricity Charges", purpose: "Define electricity billing", typical_keywords: ["electricity", "electric"], typical_variants: ["Power Charges"], risk_triggers: ["above MEA rate"], is_active: true, sort_order: 29, catalog_version: "v1.1" },
    { catalog_id: "CAT-030", canonical_name: "Water Charges", purpose: "Define water billing", typical_keywords: ["water", "unit"], typical_variants: ["Water Bill"], risk_triggers: ["above MWA rate"], is_active: true, sort_order: 30, catalog_version: "v1.1" },
    { catalog_id: "CAT-031", canonical_name: "Internet & Cable", purpose: "Internet and TV arrangements", typical_keywords: ["internet", "wifi"], typical_variants: ["Connectivity"], risk_triggers: ["mandatory provider"], is_active: true, sort_order: 31, catalog_version: "v1.1" },
    { catalog_id: "CAT-032", canonical_name: "Common Area Fees", purpose: "Monthly building fees", typical_keywords: ["common fee", "CAM"], typical_variants: ["Management Fee"], risk_triggers: ["tenant pays CAM directly"], is_active: true, sort_order: 32, catalog_version: "v1.1" },
    { catalog_id: "CAT-033", canonical_name: "Utility Disconnection Rights", purpose: "Whether landlord can cut utilities", typical_keywords: ["disconnect", "cut"], typical_variants: ["Service Termination"], risk_triggers: ["disconnection as penalty"], is_active: true, sort_order: 33, catalog_version: "v1.1" },
    { catalog_id: "CAT-034", canonical_name: "Utility Deposit", purpose: "Separate deposits for utilities", typical_keywords: ["utility deposit"], typical_variants: ["Service Deposit"], risk_triggers: ["non-refundable"], is_active: true, sort_order: 34, catalog_version: "v1.1" },
    { catalog_id: "CAT-035", canonical_name: "Tenant Maintenance Obligations", purpose: "What tenant must maintain", typical_keywords: ["tenant maintain"], typical_variants: ["Lessee's Maintenance"], risk_triggers: ["excessive scope"], is_active: true, sort_order: 35, catalog_version: "v1.1" },
    { catalog_id: "CAT-036", canonical_name: "Landlord Maintenance Obligations", purpose: "What landlord must maintain", typical_keywords: ["landlord maintain"], typical_variants: ["Lessor's Maintenance"], risk_triggers: ["minimal obligations"], is_active: true, sort_order: 36, catalog_version: "v1.1" },
    { catalog_id: "CAT-037", canonical_name: "Repair Request Procedure", purpose: "How to report issues", typical_keywords: ["report", "notify"], typical_variants: ["Maintenance Request"], risk_triggers: ["written notice only"], is_active: true, sort_order: 37, catalog_version: "v1.1" },
    { catalog_id: "CAT-038", canonical_name: "Repair Timeline", purpose: "How quickly landlord must respond", typical_keywords: ["within days", "response time"], typical_variants: ["Repair SLA"], risk_triggers: ["no timeline"], is_active: true, sort_order: 38, catalog_version: "v1.1" },
    { catalog_id: "CAT-039", canonical_name: "Emergency Repairs", purpose: "Handling urgent repairs", typical_keywords: ["emergency", "urgent"], typical_variants: ["Critical Repairs"], risk_triggers: ["no emergency definition"], is_active: true, sort_order: 39, catalog_version: "v1.1" },
    { catalog_id: "CAT-040", canonical_name: "Alterations & Improvements", purpose: "Tenant's right to modify", typical_keywords: ["alteration", "modification"], typical_variants: ["Changes"], risk_triggers: ["no alterations allowed"], is_active: true, sort_order: 40, catalog_version: "v1.1" },
    { catalog_id: "CAT-041", canonical_name: "Restoration at End of Lease", purpose: "Requirement to return to original", typical_keywords: ["restore", "original condition"], typical_variants: ["Make Good"], risk_triggers: ["strict original condition"], is_active: true, sort_order: 41, catalog_version: "v1.1" },
    { catalog_id: "CAT-042", canonical_name: "Appliance Maintenance", purpose: "Responsibility for appliances", typical_keywords: ["appliance", "aircon"], typical_variants: ["Equipment Care"], risk_triggers: ["tenant pays all repairs"], is_active: true, sort_order: 42, catalog_version: "v1.1" },
    { catalog_id: "CAT-043", canonical_name: "Permitted Use", purpose: "Define allowed use", typical_keywords: ["residential", "use"], typical_variants: ["Allowed Activities"], risk_triggers: ["strictly residential only"], is_active: true, sort_order: 43, catalog_version: "v1.1" },
    { catalog_id: "CAT-044", canonical_name: "Prohibited Activities", purpose: "Activities not allowed", typical_keywords: ["prohibit", "not allowed"], typical_variants: ["Restrictions"], risk_triggers: ["broad prohibitions"], is_active: true, sort_order: 44, catalog_version: "v1.1" },
    { catalog_id: "CAT-045", canonical_name: "Occupancy Limits", purpose: "Maximum occupants allowed", typical_keywords: ["occupant", "maximum"], typical_variants: ["Resident Limit"], risk_triggers: ["strict limits"], is_active: true, sort_order: 45, catalog_version: "v1.1" },
    { catalog_id: "CAT-046", canonical_name: "Guest Policy", purpose: "Rules for visitors", typical_keywords: ["guest", "visitor"], typical_variants: ["Visitor Rules"], risk_triggers: ["guest registration"], is_active: true, sort_order: 46, catalog_version: "v1.1" },
    { catalog_id: "CAT-047", canonical_name: "Pet Policy", purpose: "Rules regarding pets", typical_keywords: ["pet", "animal"], typical_variants: ["Animal Policy"], risk_triggers: ["no pets absolute"], is_active: true, sort_order: 47, catalog_version: "v1.1" },
    { catalog_id: "CAT-048", canonical_name: "Smoking Policy", purpose: "Rules regarding smoking", typical_keywords: ["smoking", "smoke"], typical_variants: ["No Smoking"], risk_triggers: ["heavy fines"], is_active: true, sort_order: 48, catalog_version: "v1.1" },
    { catalog_id: "CAT-049", canonical_name: "Noise & Nuisance", purpose: "Rules about noise", typical_keywords: ["noise", "quiet"], typical_variants: ["Quiet Hours"], risk_triggers: ["subjective standard"], is_active: true, sort_order: 49, catalog_version: "v1.1" },
    { catalog_id: "CAT-050", canonical_name: "Subletting & Assignment", purpose: "Whether tenant can sublet", typical_keywords: ["sublet", "sublease"], typical_variants: ["Sublease Rights"], risk_triggers: ["absolute prohibition"], is_active: true, sort_order: 50, catalog_version: "v1.1" },
    { catalog_id: "CAT-051", canonical_name: "Short-term Letting Ban", purpose: "Prohibition on Airbnb", typical_keywords: ["short-term", "daily"], typical_variants: ["No Daily Rental"], risk_triggers: ["immediate termination"], is_active: true, sort_order: 51, catalog_version: "v1.1" },
    { catalog_id: "CAT-052", canonical_name: "Business Use Restrictions", purpose: "Rules about business use", typical_keywords: ["business", "commercial"], typical_variants: ["WFH Policy"], risk_triggers: ["no WFH allowed"], is_active: true, sort_order: 52, catalog_version: "v1.1" },
    { catalog_id: "CAT-053", canonical_name: "Landlord Entry Rights", purpose: "When landlord can enter", typical_keywords: ["entry", "access"], typical_variants: ["Right of Access"], risk_triggers: ["entry without notice"], is_active: true, sort_order: 53, catalog_version: "v1.1" },
    { catalog_id: "CAT-054", canonical_name: "Notice for Entry", purpose: "Advance notice required", typical_keywords: ["notice", "advance"], typical_variants: ["Entry Notice"], risk_triggers: ["no notice requirement"], is_active: true, sort_order: 54, catalog_version: "v1.1" },
    { catalog_id: "CAT-055", canonical_name: "Emergency Entry", purpose: "Entry without notice in emergencies", typical_keywords: ["emergency", "urgent"], typical_variants: ["Urgent Access"], risk_triggers: ["emergency not defined"], is_active: true, sort_order: 55, catalog_version: "v1.1" },
    { catalog_id: "CAT-056", canonical_name: "Keys & Access Devices", purpose: "Rules about keys", typical_keywords: ["key", "card"], typical_variants: ["Access Control"], risk_triggers: ["landlord retains key"], is_active: true, sort_order: 56, catalog_version: "v1.1" },
    { catalog_id: "CAT-057", canonical_name: "Privacy & Personal Data", purpose: "Protection of tenant data", typical_keywords: ["privacy", "personal data"], typical_variants: ["Data Protection"], risk_triggers: ["no PDPA compliance"], is_active: true, sort_order: 57, catalog_version: "v1.1" },
    { catalog_id: "CAT-058", canonical_name: "Tenant Insurance Requirement", purpose: "Whether tenant must carry insurance", typical_keywords: ["insurance", "coverage"], typical_variants: ["Renter's Insurance"], risk_triggers: ["mandatory expensive coverage"], is_active: true, sort_order: 58, catalog_version: "v1.1" },
    { catalog_id: "CAT-059", canonical_name: "Landlord Insurance", purpose: "What landlord's insurance covers", typical_keywords: ["building insurance"], typical_variants: ["Lessor's Coverage"], risk_triggers: ["tenant not covered"], is_active: true, sort_order: 59, catalog_version: "v1.1" },
    { catalog_id: "CAT-060", canonical_name: "Liability Limitations", purpose: "Limits on landlord's liability", typical_keywords: ["liability", "indemnify"], typical_variants: ["Limitation of Liability"], risk_triggers: ["broad exclusion"], is_active: true, sort_order: 60, catalog_version: "v1.1" },
    { catalog_id: "CAT-061", canonical_name: "Damage by Third Parties", purpose: "Responsibility for third party damage", typical_keywords: ["third party", "neighbor"], typical_variants: ["External Damage"], risk_triggers: ["tenant liable for all"], is_active: true, sort_order: 61, catalog_version: "v1.1" },
    { catalog_id: "CAT-062", canonical_name: "Personal Property Risk", purpose: "Risk of loss for belongings", typical_keywords: ["personal property", "belongings"], typical_variants: ["Content Risk"], risk_triggers: ["landlord not responsible"], is_active: true, sort_order: 62, catalog_version: "v1.1" },
    { catalog_id: "CAT-063", canonical_name: "Events of Default", purpose: "Define what constitutes breach", typical_keywords: ["default", "breach"], typical_variants: ["Breach Events"], risk_triggers: ["minor violations = default"], is_active: true, sort_order: 63, catalog_version: "v1.1" },
    { catalog_id: "CAT-064", canonical_name: "Cure Period", purpose: "Time allowed to fix breach", typical_keywords: ["cure", "remedy"], typical_variants: ["Grace Period"], risk_triggers: ["no cure period"], is_active: true, sort_order: 64, catalog_version: "v1.1" },
    { catalog_id: "CAT-065", canonical_name: "Termination for Breach", purpose: "How lease can be terminated", typical_keywords: ["terminate", "end"], typical_variants: ["Contract Termination"], risk_triggers: ["immediate termination"], is_active: true, sort_order: 65, catalog_version: "v1.1" },
    { catalog_id: "CAT-066", canonical_name: "Damages & Penalties", purpose: "Financial consequences of breach", typical_keywords: ["damages", "penalty"], typical_variants: ["Liquidated Damages"], risk_triggers: ["excessive penalties"], is_active: true, sort_order: 66, catalog_version: "v1.1" },
    { catalog_id: "CAT-067", canonical_name: "Abandoned Property", purpose: "Handling belongings after move-out", typical_keywords: ["abandon", "left behind"], typical_variants: ["Deserted Property"], risk_triggers: ["short timeframe"], is_active: true, sort_order: 67, catalog_version: "v1.1" },
    { catalog_id: "CAT-068", canonical_name: "Eviction Procedure", purpose: "Legal process for removal", typical_keywords: ["eviction", "remove"], typical_variants: ["Removal Process"], risk_triggers: ["self-help eviction"], is_active: true, sort_order: 68, catalog_version: "v1.1" },
    { catalog_id: "CAT-069", canonical_name: "Governing Law", purpose: "Which country's laws govern", typical_keywords: ["governing law", "Thai law"], typical_variants: ["Choice of Law"], risk_triggers: ["foreign law chosen"], is_active: true, sort_order: 69, catalog_version: "v1.1" },
    { catalog_id: "CAT-070", canonical_name: "Dispute Resolution", purpose: "How disputes will be resolved", typical_keywords: ["dispute", "resolution"], typical_variants: ["Conflict Resolution"], risk_triggers: ["mandatory arbitration"], is_active: true, sort_order: 70, catalog_version: "v1.1" },
    { catalog_id: "CAT-071", canonical_name: "Court Jurisdiction", purpose: "Which court has jurisdiction", typical_keywords: ["court", "jurisdiction"], typical_variants: ["Forum Selection"], risk_triggers: ["inconvenient venue"], is_active: true, sort_order: 71, catalog_version: "v1.1" },
    { catalog_id: "CAT-072", canonical_name: "Legal Fees", purpose: "Who pays legal fees", typical_keywords: ["legal fees", "attorney"], typical_variants: ["Litigation Costs"], risk_triggers: ["loser pays all"], is_active: true, sort_order: 72, catalog_version: "v1.1" },
    { catalog_id: "CAT-073", canonical_name: "Waiver of Rights", purpose: "Rights tenant gives up", typical_keywords: ["waive", "relinquish"], typical_variants: ["Rights Waiver"], risk_triggers: ["waiver of legal rights"], is_active: true, sort_order: 73, catalog_version: "v1.1" },
    { catalog_id: "CAT-074", canonical_name: "Notices & Communications", purpose: "How notices must be given", typical_keywords: ["notice", "written"], typical_variants: ["Communication Method"], risk_triggers: ["multi-channel required"], is_active: true, sort_order: 74, catalog_version: "v1.1" },
    { catalog_id: "CAT-075", canonical_name: "Severability", purpose: "What if part is invalid", typical_keywords: ["severability", "invalid"], typical_variants: ["Partial Invalidity"], risk_triggers: ["entire contract void"], is_active: true, sort_order: 75, catalog_version: "v1.1" },
    { catalog_id: "CAT-076", canonical_name: "Force Majeure", purpose: "Events beyond control", typical_keywords: ["force majeure", "act of god"], typical_variants: ["Extraordinary Events"], risk_triggers: ["no force majeure clause"], is_active: true, sort_order: 76, catalog_version: "v1.1" },
    { catalog_id: "CAT-077", canonical_name: "Entire Agreement", purpose: "Contract is complete agreement", typical_keywords: ["entire agreement", "complete"], typical_variants: ["Integration Clause"], risk_triggers: ["verbal promises not binding"], is_active: true, sort_order: 77, catalog_version: "v1.1" },
    { catalog_id: "CAT-078", canonical_name: "Amendments", purpose: "How contract can be modified", typical_keywords: ["amend", "modify"], typical_variants: ["Contract Changes"], risk_triggers: ["landlord can amend unilaterally"], is_active: true, sort_order: 78, catalog_version: "v1.1" },
    { catalog_id: "CAT-079", canonical_name: "Representations & Warranties", purpose: "Promises about facts", typical_keywords: ["represent", "warrant"], typical_variants: ["Assurances"], risk_triggers: ["no landlord representations"], is_active: true, sort_order: 79, catalog_version: "v1.1" },
    { catalog_id: "CAT-080", canonical_name: "Move-Out Procedure", purpose: "Steps when vacating", typical_keywords: ["move-out", "vacate"], typical_variants: ["End of Tenancy"], risk_triggers: ["unreasonable requirements"], is_active: true, sort_order: 80, catalog_version: "v1.1" },
    { catalog_id: "CAT-081", canonical_name: "Signatures & Witnesses", purpose: "Execution requirements", typical_keywords: ["sign", "execute"], typical_variants: ["Contract Execution"], risk_triggers: ["witness required but missing"], is_active: true, sort_order: 81, catalog_version: "v1.1" },
    { catalog_id: "CAT-082", canonical_name: "Language & Translation", purpose: "Which language controls", typical_keywords: ["language", "Thai", "English"], typical_variants: ["Controlling Version"], risk_triggers: ["foreign language controls"], is_active: true, sort_order: 82, catalog_version: "v1.1" },
    { catalog_id: "CAT-121", canonical_name: "Grace Period Definition", purpose: "Define the number of days after rent due date before late fees apply", typical_keywords: ["grace period", "grace days", "late after", "ระยะผ่อนผัน"], typical_variants: ["Payment Grace", "Late Payment Buffer"], risk_triggers: ["no grace period", "grace period less than 5 days"], is_active: true, sort_order: 121, catalog_version: "v1.1" },
    { catalog_id: "CAT-122", canonical_name: "Rent Suspension Conditions", purpose: "Define conditions when rent may be suspended or abated due to uninhabitability", typical_keywords: ["rent suspension", "rent abatement", "uninhabitable", "อยู่ไม่ได้"], typical_variants: ["Rent Abatement", "Habitability Clause"], risk_triggers: ["no rent suspension provision", "tenant must pay even if uninhabitable"], is_active: true, sort_order: 122, catalog_version: "v1.1" },
    { catalog_id: "CAT-123", canonical_name: "Deposit Is Not Rent", purpose: "Clarify that security deposit cannot be applied as last month's rent by tenant", typical_keywords: ["deposit not rent", "cannot apply deposit", "มัดจำไม่ใช่ค่าเช่า"], typical_variants: ["Deposit Application Restriction", "No Rent Offset"], risk_triggers: ["silent on deposit-as-rent", "allows tenant to use deposit for rent"], is_active: true, sort_order: 123, catalog_version: "v1.1" },
    { catalog_id: "CAT-124", canonical_name: "Wear and Tear Safe Harbour", purpose: "Explicitly exclude normal wear and tear from deposit deductions with specific examples", typical_keywords: ["normal wear excluded", "fair wear", "การสึกหรอปกติ", "ยกเว้น"], typical_variants: ["Wear Exclusion", "Depreciation Allowance"], risk_triggers: ["no wear and tear exclusion", "all damage deductible"], is_active: true, sort_order: 124, catalog_version: "v1.1" },
    { catalog_id: "CAT-125", canonical_name: "Quiet Enjoyment Covenant", purpose: "Guarantee tenant's right to peaceful possession without landlord interference", typical_keywords: ["quiet enjoyment", "peaceful possession", "สิทธิครอบครอง", "ไม่รบกวน"], typical_variants: ["Peaceful Enjoyment", "Non-Interference"], risk_triggers: ["no quiet enjoyment clause", "landlord unlimited access"], is_active: true, sort_order: 125, catalog_version: "v1.1" },
    { catalog_id: "CAT-126", canonical_name: "Cure Period Exceptions", purpose: "Define which breaches cannot be cured (e.g., non-payment, serious violations)", typical_keywords: ["non-curable", "cure exception", "serious breach", "ไม่สามารถแก้ไข"], typical_variants: ["Incurable Defaults", "No Remedy Breaches"], risk_triggers: ["too many non-curable breaches", "minor breaches listed as non-curable"], is_active: true, sort_order: 126, catalog_version: "v1.1" },
    { catalog_id: "CAT-127", canonical_name: "Early Termination Penalty Formula", purpose: "Define the specific calculation for early termination penalties based on remaining term", typical_keywords: ["termination penalty", "early exit fee", "penalty formula", "ค่าปรับยกเลิก"], typical_variants: ["Break Fee Calculation", "Exit Penalty"], risk_triggers: ["excessive penalty (>2 months)", "full remaining rent as penalty"], is_active: true, sort_order: 127, catalog_version: "v1.1" },
    { catalog_id: "CAT-128", canonical_name: "Rent Abatement vs Force Majeure", purpose: "Distinguish between rent abatement (habitability) and force majeure (external events) provisions", typical_keywords: ["abatement", "force majeure", "rent reduction", "ลดค่าเช่า"], typical_variants: ["Rent Relief Distinction", "Habitability vs FM"], risk_triggers: ["no distinction between abatement and FM", "FM excludes rent relief"], is_active: true, sort_order: 128, catalog_version: "v1.1" },
    { catalog_id: "CAT-129", canonical_name: "Utility Interruption – Rent Still Payable", purpose: "Clarify tenant's rent obligation during utility service interruptions not caused by tenant", typical_keywords: ["utility interruption", "service outage", "ไฟฟ้าดับ", "น้ำไม่ไหล"], typical_variants: ["Service Interruption", "Utility Failure"], risk_triggers: ["tenant must pay full rent during extended outage", "no abatement for utility failure"], is_active: true, sort_order: 129, catalog_version: "v1.1" },
    { catalog_id: "CAT-UNMAPPED", canonical_name: "Unclassified Clause", purpose: "Clauses that don't fit categories", typical_keywords: [], typical_variants: [], risk_triggers: ["unusual or non-standard terms"], is_active: true, sort_order: 999, catalog_version: "v1.1" }
  ]
};

function AdminCanonicalLedgerContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [showRawJson, setShowRawJson] = useState(false);
  const [fetchDiagnostics, setFetchDiagnostics] = useState({ url: '', status: '', message: '', responseText: '' });
  const [pingResults, setPingResults] = useState({ catalog: null, ping: null, loading: false });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const userRole = user?.role?.toLowerCase();
  const accessLevel = user?.access_level?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || accessLevel === 'admin' || accessLevel === 'super_admin';

  const { data: catalogData, isLoading, error, refetch } = useQuery({
    queryKey: ['canonicalLedgerV1'],
    queryFn: async () => {
      const endpoint = 'getCanonicalLedgerV1';
      console.log('[CANONICAL_LEDGER_V1] Fetching catalog via base44.functions.invoke:', endpoint);
      setFetchDiagnostics({ url: `base44.functions.invoke('${endpoint}')`, status: 'fetching...', message: '', responseText: '' });
      
      try {
        const response = await base44.functions.invoke(endpoint, {});
        console.log('[CANONICAL_LEDGER_V1] Response received:', response);
        
        const payload = response?.data;
        
        if (!payload) {
          throw new Error('Empty response from server');
        }
        
        if (payload.error) {
          throw new Error(payload.error);
        }
        
        if (payload.catalog && !Array.isArray(payload.catalog)) {
          console.error('[CANONICAL_LEDGER_V1] Invalid catalog shape - not an array:', typeof payload.catalog);
          throw new Error('Invalid catalog shape: catalog is not an array');
        }
        
        setFetchDiagnostics({ 
          url: `base44.functions.invoke('${endpoint}')`, 
          status: String(response.status || 200), 
          message: 'Success - source: ' + (payload.source || 'unknown'),
          responseText: JSON.stringify(payload, null, 2).substring(0, 500) + '...'
        });
        
        return payload;
      } catch (fetchError) {
        console.error('[CANONICAL_LEDGER_V1] Fetch failed:', fetchError);
        const errorMessage = String(fetchError?.message || 'Unknown error');
        const errorStatus = String(fetchError?.response?.status || fetchError?.status || 'ERROR');
        const errorText = fetchError?.response?.data ? JSON.stringify(fetchError.response.data, null, 2) : errorMessage;
        
        setFetchDiagnostics({ 
          url: `base44.functions.invoke('${endpoint}')`, 
          status: errorStatus, 
          message: errorMessage,
          responseText: errorText
        });
        
        throw fetchError;
      }
    },
    enabled: !!user && isAdmin,
    retry: 1,
    retryDelay: 1000
  });

  const isDarkMode = user?.theme === 'dark';
  const language = user?.language || 'en';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Admin Access Required
              </h2>
              <p className="mb-4" style={{ color: colors.textSecondary }}>
                This page is restricted to administrators only.
              </p>
              <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const effectiveData = useMemo(() => {
    try {
      if (catalogData && catalogData.catalog && Array.isArray(catalogData.catalog)) {
        return catalogData;
      }
      console.warn('[CANONICAL_LEDGER] Using fallback catalog');
      return FALLBACK_CATALOG;
    } catch (err) {
      console.error('[CANONICAL_LEDGER] effectiveData error:', err);
      return FALLBACK_CATALOG;
    }
  }, [catalogData]);

  const isUsingFallback = effectiveData === FALLBACK_CATALOG;

  const handleExportJSON = () => {
    try {
      haptic.medium();
      
      const exportData = {
        catalog_version: effectiveData?.catalog_version || 'v1.1',
        catalog_updated_at: effectiveData?.catalog_updated_at || new Date().toISOString(),
        catalog_count: effectiveData?.catalog_count || 0,
        exported_at: new Date().toISOString(),
        source: isUsingFallback ? 'FALLBACK' : (effectiveData?.source || 'BACKEND'),
        catalog: Array.isArray(effectiveData?.catalog) ? effectiveData.catalog : []
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canonical-ledger-${exportData.catalog_version}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded: canonical-ledger-${exportData.catalog_version}.json`);
    } catch (err) {
      console.error('[EXPORT] Failed:', err);
      toast.error('Export failed: ' + String(err.message || 'Unknown error'));
    }
  };

  const handleCopyJSON = async () => {
    try {
      haptic.light();
      
      const exportData = {
        catalog_version: effectiveData?.catalog_version || 'v1.1',
        catalog_updated_at: effectiveData?.catalog_updated_at || new Date().toISOString(),
        catalog_count: effectiveData?.catalog_count || 0,
        source: isUsingFallback ? 'FALLBACK' : (effectiveData?.source || 'BACKEND'),
        catalog: Array.isArray(effectiveData?.catalog) ? effectiveData.catalog : []
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      toast.success('Catalog JSON copied to clipboard');
    } catch (err) {
      console.error('[COPY] Failed:', err);
      toast.error('Failed to copy: ' + String(err.message || 'Unknown error'));
    }
  };

  const toggleRow = (catalogId) => {
    setExpandedRows(prev => ({
      ...prev,
      [catalogId]: !prev[catalogId]
    }));
  };

  const filteredCatalog = effectiveData?.catalog?.filter(entry => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.catalog_id?.toLowerCase().includes(term) ||
      entry.canonical_name?.toLowerCase().includes(term) ||
      entry.purpose?.toLowerCase().includes(term) ||
      entry.typical_keywords?.some(k => k.toLowerCase().includes(term)) ||
      entry.typical_variants?.some(v => v.toLowerCase().includes(term))
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto">
          <SkeletonLoader variant="table" count={10} isDarkMode={isDarkMode} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Canonical Clause Catalog"
          subtitle={`Thailand Residential Lease Standard • ${String(effectiveData?.catalog_count || 0)} entries`}
          icon={Database}
          iconColor="#0C3B2E"
          showBack={true}
          backRoute={createPageUrl("AdminConsole")}
          isDarkMode={isDarkMode}
          actions={
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setShowRawJson(true)}>
                <Code className="w-4 h-4 mr-2" /> View Raw JSON
              </Button>
              <Button variant="outline" onClick={handleCopyJSON}>
                <Copy className="w-4 h-4 mr-2" /> Copy
              </Button>
              <Button style={{ backgroundColor: '#0C3B2E', color: '#fff' }} onClick={handleExportJSON}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          }
        />

        {isAdmin && (
          <Card className="mb-4 border-none shadow-sm" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7', borderLeft: '4px solid #F59E0B' }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-amber-800">Fetch Diagnostics</p>
                  <p className="text-amber-700">
                    <strong>Request:</strong> {String(fetchDiagnostics.url || 'Not started')}
                  </p>
                  <p className="text-amber-700">
                    <strong>Status:</strong> {String(fetchDiagnostics.status || 'N/A')} • <strong>Message:</strong> {String(fetchDiagnostics.message || 'N/A')}
                  </p>
                  {isUsingFallback && (
                    <p className="text-red-600 font-bold mt-1">
                      ⚠️ USING FALLBACK DATA - Backend fetch failed
                    </p>
                  )}
                  {error && (
                    <div className="mt-2">
                      <p className="text-red-600 font-bold">
                        <strong>Error:</strong> {String(error?.message || 'Unknown error')}
                      </p>
                      {fetchDiagnostics.responseText && (
                        <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto max-h-32 text-red-900">
                          {String(fetchDiagnostics.responseText)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isUsingFallback && (
          <Card className="mb-4 border-none shadow-lg" style={{ backgroundColor: '#FEE2E2', borderLeft: '6px solid #EF4444' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-red-600 text-white text-lg px-4 py-2">FALLBACK MODE</Badge>
                <span className="text-red-800 font-medium">
                  Backend fetch failing - displaying hard-embedded catalog ({String(FALLBACK_CATALOG.catalog_count)} entries)
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F0FDF4' }}>
                <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Version</div>
                <div className="text-xl font-bold" style={{ color: '#0C3B2E' }}>{String(effectiveData?.catalog_version || 'v1.1')}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#EFF6FF' }}>
                <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Total Entries</div>
                <div className="text-xl font-bold" style={{ color: '#3B82F6' }}>{String(effectiveData?.catalog_count || 0)}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7' }}>
                <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Active</div>
                <div className="text-xl font-bold" style={{ color: '#F59E0B' }}>
                  {String(Array.isArray(effectiveData?.catalog) ? effectiveData.catalog.filter(c => c.is_active !== false).length : 0)}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                <div className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Source</div>
                <div className="text-sm font-semibold" style={{ color: isUsingFallback ? '#EF4444' : '#10B981' }}>
                  {isUsingFallback ? 'FALLBACK' : (effectiveData?.source || 'BACKEND')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
              <Input
                placeholder="Search by ID, name, keywords, or variants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}
              />
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                Showing {String(filteredCatalog.length)} of {String(effectiveData?.catalog_count || 0)} entries
              </div>
            )}
          </CardContent>
        </Card>

        {showRawJson && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowRawJson(false)}>
            <div 
              className="w-full max-w-5xl max-h-[90vh] rounded-lg overflow-hidden flex flex-col"
              style={{ backgroundColor: colors.cardBg }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.borderColor }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Raw JSON View</h2>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    canonical-ledger-{String(effectiveData?.catalog_version || 'v1.1')}.json • {String(effectiveData?.catalog_count || 0)} entries
                    {isUsingFallback && <span className="text-red-600 ml-2">(FALLBACK)</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyJSON}>
                    <Copy className="w-4 h-4 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportJSON}>
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowRawJson(false)}>
                    Close
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre 
                  className="text-xs font-mono whitespace-pre-wrap break-all"
                  style={{ 
                    color: colors.textPrimary,
                    backgroundColor: isDarkMode ? '#1A1D1F' : '#F8FAFC',
                    padding: '16px',
                    borderRadius: '8px'
                  }}
                >
                  {effectiveData ? JSON.stringify(effectiveData, null, 2) : '{}'}
                </pre>
              </div>
            </div>
          </div>
        )}

        <Card className="border-none shadow-lg overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader className="border-b" style={{ borderColor: colors.borderColor }}>
            <CardTitle style={{ color: colors.textPrimary }}>
              Clause Catalog Entries • v{effectiveData?.catalog_version || 'v1.1'} • {effectiveData?.catalog_count || 0} total
              {effectiveData?.catalog_count === 92 && <CheckCircle2 className="inline w-5 h-5 ml-2 text-emerald-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Canonical Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold hidden md:table-cell" style={{ color: colors.textSecondary }}>Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold hidden lg:table-cell" style={{ color: colors.textSecondary }}>Keywords</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: colors.textSecondary }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredCatalog) && filteredCatalog.length > 0 ? filteredCatalog.map((entry, idx) => (
                    <React.Fragment key={String(entry.catalog_id || idx)}>
                      <tr 
                        className="border-b cursor-pointer hover:opacity-80"
                        style={{ borderColor: colors.borderColor }}
                        onClick={() => toggleRow(entry.catalog_id)}
                      >
                        <td className="px-4 py-3">
                          <Badge variant="outline" style={{ fontFamily: 'monospace' }}>
                            {String(entry.catalog_id || 'N/A')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                         <div className="font-medium" style={{ color: colors.textPrimary }}>
                           {String(entry.canonical_name || 'Unnamed')}
                         </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                         <div className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                           {String(entry.purpose || 'No description')}
                         </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(entry.typical_keywords) && entry.typical_keywords.slice(0, 3).map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {String(kw)}
                              </Badge>
                            ))}
                            {Array.isArray(entry.typical_keywords) && entry.typical_keywords.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{String(entry.typical_keywords.length - 3)}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {entry.is_active !== false ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                      
                      {expandedRows[entry.catalog_id] && (
                        <tr style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
                          <td colSpan={5} className="px-4 py-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>Purpose</div>
                                <div className="text-sm" style={{ color: colors.textPrimary }}>{String(entry.purpose || 'No description')}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>Typical Variants</div>
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(entry.typical_variants) && entry.typical_variants.map((v, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">{String(v)}</Badge>
                                  ))}
                                  {(!Array.isArray(entry.typical_variants) || entry.typical_variants.length === 0) && (
                                    <span className="text-sm" style={{ color: colors.textSecondary }}>None</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>All Keywords</div>
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(entry.typical_keywords) && entry.typical_keywords.map((kw, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{String(kw)}</Badge>
                                  ))}
                                  {(!Array.isArray(entry.typical_keywords) || entry.typical_keywords.length === 0) && (
                                    <span className="text-sm" style={{ color: colors.textSecondary }}>None</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold mb-2 text-red-600">Risk Triggers</div>
                                <ul className="list-disc list-inside text-sm" style={{ color: colors.textPrimary }}>
                                  {Array.isArray(entry.risk_triggers) && entry.risk_triggers.map((rt, i) => (
                                    <li key={i}>{String(rt)}</li>
                                  ))}
                                  {(!Array.isArray(entry.risk_triggers) || entry.risk_triggers.length === 0) && (
                                    <li>None specified</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center" style={{ color: colors.textSecondary }}>
                        No catalog entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CatalogErrorFallback({ error, resetError }) {
  const colors = {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  const handleDownloadFallback = () => {
    try {
      const exportData = {
        catalog_version: 'v1.1',
        catalog_count: 92,
        exported_at: new Date().toISOString(),
        source: 'FALLBACK',
        error: String(error?.message || 'Page crashed - using fallback'),
        catalog: FALLBACK_CATALOG.catalog
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'canonical-ledger-v1.1-fallback.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (exportErr) {
      alert('Export failed: ' + String(exportErr.message));
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <Card style={{ backgroundColor: colors.cardBg, borderLeft: '6px solid #EF4444' }}>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Page Render Error
              </h2>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                AdminCanonicalLedger crashed. Using fallback mode.
              </p>
            </div>

            <div className="mb-4">
              <Badge className="bg-red-600 text-white mb-2">ERROR DETAILS</Badge>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all p-4 rounded-lg bg-red-50 text-red-900 overflow-auto max-h-48">
                {String(error?.message || 'Unknown error')}
                {error?.stack && '\n\n' + String(error.stack)}
              </pre>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <Button variant="outline" onClick={resetError}>
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
              <Button style={{ backgroundColor: '#0C3B2E', color: '#fff' }} onClick={handleDownloadFallback}>
                <Download className="w-4 h-4 mr-2" /> Download Fallback JSON (92 entries)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminCanonicalLedger() {
  return (
    <AuthGuard>
      <ToastProvider>
        <ErrorBoundary FallbackComponent={CatalogErrorFallback}>
          <AdminCanonicalLedgerContent />
        </ErrorBoundary>
      </ToastProvider>
    </AuthGuard>
  );
}