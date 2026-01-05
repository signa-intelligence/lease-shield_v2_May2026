import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, XCircle, AlertTriangle, Info, ChevronDown, ChevronUp, 
  Shield, FileText, Search 
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Canonical clause catalog (92 entries) - simplified reference
const CANONICAL_CATALOG = [
  { id: "CAT-001", name: "Parties Identification", category: "Parties & Property" },
  { id: "CAT-002", name: "Property Description", category: "Parties & Property" },
  { id: "CAT-003", name: "Property Condition at Handover", category: "Parties & Property" },
  { id: "CAT-004", name: "Furnishings & Fixtures Inventory", category: "Parties & Property" },
  { id: "CAT-005", name: "Common Areas & Facilities", category: "Parties & Property" },
  { id: "CAT-006", name: "Lease Term & Commencement", category: "Term & Renewal" },
  { id: "CAT-007", name: "Renewal Terms", category: "Term & Renewal" },
  { id: "CAT-008", name: "Auto-Renewal Mechanism", category: "Term & Renewal" },
  { id: "CAT-009", name: "Notice Period for Non-Renewal", category: "Term & Renewal" },
  { id: "CAT-010", name: "Early Termination by Tenant", category: "Term & Renewal" },
  { id: "CAT-011", name: "Early Termination by Landlord", category: "Term & Renewal" },
  { id: "CAT-012", name: "Holdover Tenancy", category: "Term & Renewal" },
  { id: "CAT-013", name: "Rent Amount & Currency", category: "Rent & Payment" },
  { id: "CAT-014", name: "Rent Due Date", category: "Rent & Payment" },
  { id: "CAT-015", name: "Rent Payment Method", category: "Rent & Payment" },
  { id: "CAT-016", name: "Late Payment Penalty", category: "Rent & Payment" },
  { id: "CAT-017", name: "Rent Escalation / Increase", category: "Rent & Payment" },
  { id: "CAT-018", name: "Advance Rent", category: "Rent & Payment" },
  { id: "CAT-019", name: "Rent Receipts", category: "Rent & Payment" },
  { id: "CAT-020", name: "Partial Payment", category: "Rent & Payment" },
  { id: "CAT-021", name: "Security Deposit Amount", category: "Deposit & Return" },
  { id: "CAT-022", name: "Deposit Payment Terms", category: "Deposit & Return" },
  { id: "CAT-023", name: "Deposit Holding", category: "Deposit & Return" },
  { id: "CAT-024", name: "Permitted Deposit Deductions", category: "Deposit & Return" },
  { id: "CAT-025", name: "Deposit Return Timeline", category: "Deposit & Return" },
  { id: "CAT-026", name: "Deposit Return Procedure", category: "Deposit & Return" },
  { id: "CAT-027", name: "Deposit Forfeiture Conditions", category: "Deposit & Return" },
  { id: "CAT-028", name: "Wear and Tear Definition", category: "Deposit & Return" },
  { id: "CAT-029", name: "Electricity Charges", category: "Utilities" },
  { id: "CAT-030", name: "Water Charges", category: "Utilities" },
  { id: "CAT-031", name: "Internet & Cable", category: "Utilities" },
  { id: "CAT-032", name: "Common Area Fees", category: "Utilities" },
  { id: "CAT-033", name: "Utility Disconnection Rights", category: "Utilities" },
  { id: "CAT-034", name: "Utility Deposit", category: "Utilities" },
  { id: "CAT-035", name: "Tenant Maintenance Obligations", category: "Maintenance" },
  { id: "CAT-036", name: "Landlord Maintenance Obligations", category: "Maintenance" },
  { id: "CAT-037", name: "Repair Request Procedure", category: "Maintenance" },
  { id: "CAT-038", name: "Repair Timeline", category: "Maintenance" },
  { id: "CAT-039", name: "Emergency Repairs", category: "Maintenance" },
  { id: "CAT-040", name: "Alterations & Improvements", category: "Maintenance" },
  { id: "CAT-041", name: "Restoration at End of Lease", category: "Maintenance" },
  { id: "CAT-042", name: "Appliance Maintenance", category: "Maintenance" },
  { id: "CAT-043", name: "Permitted Use", category: "Use & Restrictions" },
  { id: "CAT-044", name: "Prohibited Activities", category: "Use & Restrictions" },
  { id: "CAT-045", name: "Occupancy Limits", category: "Use & Restrictions" },
  { id: "CAT-046", name: "Guest Policy", category: "Use & Restrictions" },
  { id: "CAT-047", name: "Pet Policy", category: "Use & Restrictions" },
  { id: "CAT-048", name: "Smoking Policy", category: "Use & Restrictions" },
  { id: "CAT-049", name: "Noise & Nuisance", category: "Use & Restrictions" },
  { id: "CAT-050", name: "Subletting & Assignment", category: "Use & Restrictions" },
  { id: "CAT-051", name: "Short-term Letting Ban", category: "Use & Restrictions" },
  { id: "CAT-052", name: "Business Use Restrictions", category: "Use & Restrictions" },
  { id: "CAT-053", name: "Landlord Entry Rights", category: "Privacy & Access" },
  { id: "CAT-054", name: "Notice for Entry", category: "Privacy & Access" },
  { id: "CAT-055", name: "Emergency Entry", category: "Privacy & Access" },
  { id: "CAT-056", name: "Keys & Access Devices", category: "Privacy & Access" },
  { id: "CAT-057", name: "Privacy & Personal Data", category: "Privacy & Access" },
  { id: "CAT-058", name: "Tenant Insurance Requirement", category: "Insurance & Liability" },
  { id: "CAT-059", name: "Landlord Insurance", category: "Insurance & Liability" },
  { id: "CAT-060", name: "Liability Limitations", category: "Insurance & Liability" },
  { id: "CAT-061", name: "Damage by Third Parties", category: "Insurance & Liability" },
  { id: "CAT-062", name: "Personal Property Risk", category: "Insurance & Liability" },
  { id: "CAT-063", name: "Events of Default", category: "Default & Termination" },
  { id: "CAT-064", name: "Cure Period", category: "Default & Termination" },
  { id: "CAT-065", name: "Termination for Breach", category: "Default & Termination" },
  { id: "CAT-066", name: "Damages & Penalties", category: "Default & Termination" },
  { id: "CAT-067", name: "Abandoned Property", category: "Default & Termination" },
  { id: "CAT-068", name: "Eviction Procedure", category: "Default & Termination" },
  { id: "CAT-069", name: "Governing Law", category: "Legal & Dispute" },
  { id: "CAT-070", name: "Dispute Resolution", category: "Legal & Dispute" },
  { id: "CAT-071", name: "Court Jurisdiction", category: "Legal & Dispute" },
  { id: "CAT-072", name: "Legal Fees", category: "Legal & Dispute" },
  { id: "CAT-073", name: "Waiver of Rights", category: "Legal & Dispute" },
  { id: "CAT-074", name: "Notices & Communications", category: "Legal & Dispute" },
  { id: "CAT-075", name: "Severability", category: "Legal & Dispute" },
  { id: "CAT-076", name: "Force Majeure", category: "Legal & Dispute" },
  { id: "CAT-077", name: "Entire Agreement", category: "Legal & Dispute" },
  { id: "CAT-078", name: "Amendments", category: "Legal & Dispute" },
  { id: "CAT-079", name: "Representations & Warranties", category: "Legal & Dispute" },
  { id: "CAT-080", name: "Move-Out Procedure", category: "Legal & Dispute" },
  { id: "CAT-081", name: "Signatures & Witnesses", category: "Legal & Dispute" },
  { id: "CAT-082", name: "Language & Translation", category: "Legal & Dispute" },
  { id: "CAT-121", name: "Grace Period Definition", category: "Enhanced Protections" },
  { id: "CAT-122", name: "Rent Suspension Conditions", category: "Enhanced Protections" },
  { id: "CAT-123", name: "Deposit Is Not Rent", category: "Enhanced Protections" },
  { id: "CAT-124", name: "Wear and Tear Safe Harbour", category: "Enhanced Protections" },
  { id: "CAT-125", name: "Quiet Enjoyment Covenant", category: "Enhanced Protections" },
  { id: "CAT-126", name: "Cure Period Exceptions", category: "Enhanced Protections" },
  { id: "CAT-127", name: "Early Termination Penalty Formula", category: "Enhanced Protections" },
  { id: "CAT-128", name: "Rent Abatement vs Force Majeure", category: "Enhanced Protections" },
  { id: "CAT-129", name: "Utility Interruption – Rent Still Payable", category: "Enhanced Protections" },
  { id: "CAT-UNMAPPED", name: "Unclassified Clause", category: "Other" }
];

const RISK_COLORS = {
  high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  low: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  none: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' }
};

export default function ClauseCoverageTable({ 
  clauseReview = [], 
  mappings = [], 
  missingClauses = [],
  colors,
  isDarkMode,
  language = 'en'
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyRisks, setShowOnlyRisks] = useState(false);

  // Build coverage map from mappings
  const coverageMap = new Map();
  mappings.forEach(m => {
    m.mapped_catalog_ids?.forEach(catId => {
      if (!coverageMap.has(catId)) {
        coverageMap.set(catId, []);
      }
      coverageMap.get(catId).push(m.clause_id);
    });
  });

  // Build risk map from clauseReview
  const riskMap = new Map();
  clauseReview.forEach(r => {
    if (!riskMap.has(r.clause_id)) {
      riskMap.set(r.clause_id, r);
    }
  });

  // Get catalog status for each entry
  const getCatalogStatus = (catId) => {
    if (catId === 'CAT-UNMAPPED') return { status: 'unmapped', risk: 'none' };
    
    const mappedClauses = coverageMap.get(catId) || [];
    if (mappedClauses.length === 0) {
      return { status: 'missing', risk: 'none' };
    }
    
    // Find highest risk among mapped clauses
    let highestRisk = 'none';
    const riskOrder = { high: 3, medium: 2, low: 1, none: 0 };
    
    mappedClauses.forEach(clauseId => {
      const review = riskMap.get(clauseId);
      if (review && riskOrder[review.risk_level] > riskOrder[highestRisk]) {
        highestRisk = review.risk_level;
      }
    });
    
    return { status: 'present', risk: highestRisk, clauseIds: mappedClauses };
  };

  // Group by category
  const groupedCatalog = CANONICAL_CATALOG.reduce((acc, cat) => {
    if (!acc[cat.category]) acc[cat.category] = [];
    acc[cat.category].push({ ...cat, ...getCatalogStatus(cat.id) });
    return acc;
  }, {});

  // Filter by search and risk
  const filterCatalog = (items) => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = !showOnlyRisks || item.risk !== 'none' || item.status === 'missing';
      return matchesSearch && matchesRisk;
    });
  };

  // Calculate totals
  const totalCatalog = CANONICAL_CATALOG.length - 1; // Exclude UNMAPPED
  const presentCount = CANONICAL_CATALOG.filter(c => c.id !== 'CAT-UNMAPPED' && getCatalogStatus(c.id).status === 'present').length;
  const missingCount = missingClauses?.length || (totalCatalog - presentCount);
  const riskCount = clauseReview.filter(r => r.risk_level && r.risk_level !== 'none').length;

  const t = {
    en: {
      title: "Clause Coverage",
      subtitle: "All 92 standard clause categories",
      present: "Present",
      missing: "Missing",
      withRisk: "With Risk",
      search: "Search clauses...",
      showRisksOnly: "Show risks only",
      status: "Status",
      risk: "Risk",
      category: "Category"
    },
    th: {
      title: "ความครอบคลุมของข้อกำหนด",
      subtitle: "หมวดหมู่ข้อกำหนดมาตรฐาน 92 ข้อ",
      present: "มีอยู่",
      missing: "ไม่มี",
      withRisk: "มีความเสี่ยง",
      search: "ค้นหาข้อกำหนด...",
      showRisksOnly: "แสดงเฉพาะความเสี่ยง",
      status: "สถานะ",
      risk: "ความเสี่ยง",
      category: "หมวดหมู่"
    }
  };
  const strings = t[language] || t.en;

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors?.cardBg || '#FFFFFF' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-6 h-6" style={{ color: '#0C3B2E' }} />
          {strings.title}
        </CardTitle>
        <p className="text-sm" style={{ color: colors?.textSecondary || '#64748b' }}>
          {strings.subtitle}
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#D1FAE5' }}>
            <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
            <div className="text-xs font-semibold text-emerald-700">{strings.present}</div>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEE2E2' }}>
            <div className="text-2xl font-bold text-red-600">{missingCount}</div>
            <div className="text-xs font-semibold text-red-700">{strings.missing}</div>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7' }}>
            <div className="text-2xl font-bold text-amber-600">{riskCount}</div>
            <div className="text-xs font-semibold text-amber-700">{strings.withRisk}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors?.textSecondary }} />
            <Input
              placeholder={strings.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}
            />
          </div>
          <Button
            variant={showOnlyRisks ? "default" : "outline"}
            onClick={() => setShowOnlyRisks(!showOnlyRisks)}
            size="sm"
            style={showOnlyRisks ? { backgroundColor: '#0C3B2E', color: '#fff' } : {}}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            {strings.showRisksOnly}
          </Button>
        </div>

        {/* Category Accordions */}
        <div className="space-y-2">
          {Object.entries(groupedCatalog).map(([category, items]) => {
            const filtered = filterCatalog(items);
            if (filtered.length === 0) return null;
            
            const categoryRiskCount = filtered.filter(i => i.risk !== 'none').length;
            const categoryMissingCount = filtered.filter(i => i.status === 'missing').length;
            const isExpanded = expandedCategory === category;

            return (
              <div key={category} className="border rounded-lg overflow-hidden" style={{ borderColor: colors?.borderColor }}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="w-full flex items-center justify-between p-3 text-left transition-colors"
                  style={{ backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: colors?.textPrimary }}>{category}</span>
                    <Badge variant="outline" className="text-xs">{filtered.length}</Badge>
                    {categoryRiskCount > 0 && (
                      <Badge className="bg-amber-100 text-amber-800 text-xs">{categoryRiskCount} risk</Badge>
                    )}
                    {categoryMissingCount > 0 && (
                      <Badge className="bg-red-100 text-red-800 text-xs">{categoryMissingCount} missing</Badge>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {isExpanded && (
                  <div className="divide-y" style={{ borderColor: colors?.borderColor }}>
                    {filtered.map(item => (
                      <div 
                        key={item.id} 
                        className="p-3 flex items-center justify-between"
                        style={{ backgroundColor: colors?.cardBg }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {item.status === 'present' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="text-sm font-medium truncate" style={{ color: colors?.textPrimary }}>
                              {item.name}
                            </span>
                            <span className="text-xs ml-2" style={{ color: colors?.textSecondary }}>
                              [{item.id}]
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.status === 'missing' ? (
                            <Badge className="bg-red-100 text-red-800 text-xs">Missing</Badge>
                          ) : item.risk !== 'none' ? (
                            <Badge className={`${RISK_COLORS[item.risk]?.bg} ${RISK_COLORS[item.risk]?.text} text-xs`}>
                              {item.risk.toUpperCase()}
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">OK</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}