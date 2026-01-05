import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, MessageSquare, AlertTriangle, CheckCircle2, 
  ArrowRight, Shield, Lightbulb 
} from "lucide-react";

// Generate deterministic recommendations based on catalog_id and severity
const RECOMMENDATION_TEMPLATES = {
  // Deposit-related
  'CAT-021': {
    high: {
      summary: "Negotiate to reduce excessive deposit to 1-2 months rent maximum.",
      negotiation_language: "I'd like to discuss reducing the security deposit to [2 months rent]. This is standard market practice in Bangkok.",
      who_benefits: "landlord",
      fallback: "Offer to pay in installments or provide a bank guarantee instead."
    },
    medium: {
      summary: "Clarify deposit holding and return conditions.",
      negotiation_language: "Can we add a clause specifying the deposit will be held in a separate account and returned within 30 days?",
      who_benefits: "balanced",
      fallback: "Request itemized move-out inspection checklist."
    }
  },
  'CAT-025': {
    high: {
      summary: "Add specific deposit return timeline (30 days maximum).",
      negotiation_language: "Please add: 'Deposit shall be returned within 30 days of move-out, with itemized deductions if any.'",
      who_benefits: "tenant",
      fallback: "At minimum, request written confirmation of expected return date."
    }
  },
  'CAT-027': {
    high: {
      summary: "Remove or limit automatic deposit forfeiture conditions.",
      negotiation_language: "I'd like to modify the forfeiture clause to only apply to proven damages, not early termination.",
      who_benefits: "tenant",
      fallback: "Request mediation clause before any forfeiture takes effect."
    }
  },
  // Entry/Privacy
  'CAT-053': {
    high: {
      summary: "Require advance notice before landlord entry.",
      negotiation_language: "Please add: 'Landlord shall provide 24-48 hours written notice before entry, except for genuine emergencies.'",
      who_benefits: "tenant",
      fallback: "Define 'emergency' explicitly (fire, flood, gas leak only)."
    },
    critical: {
      summary: "Remove unrestricted entry rights immediately.",
      negotiation_language: "The current entry clause violates tenant privacy rights. Please replace with standard 24-hour notice requirement.",
      who_benefits: "tenant",
      fallback: "This clause may be unenforceable under Thai law. Seek legal advice before signing."
    }
  },
  // Termination
  'CAT-064': {
    high: {
      summary: "Add cure period for minor breaches before termination.",
      negotiation_language: "Please add: 'Tenant shall have 14 days to cure any breach (except non-payment of rent which has 7 days).'",
      who_benefits: "tenant",
      fallback: "Request written warning system before termination."
    }
  },
  'CAT-065': {
    high: {
      summary: "Require proper legal process for termination.",
      negotiation_language: "Termination should follow Thai legal requirements with proper notice and opportunity to remedy.",
      who_benefits: "balanced",
      fallback: "Ensure any eviction follows court process, not self-help."
    }
  },
  // Utilities
  'CAT-033': {
    critical: {
      summary: "Remove illegal utility disconnection clause.",
      negotiation_language: "Utility disconnection as a penalty is illegal under Thai law. Please remove this clause entirely.",
      who_benefits: "tenant",
      fallback: "This clause is unenforceable. Document it and proceed with caution."
    }
  },
  // Default recommendations by severity
  'default': {
    critical: {
      summary: "This clause poses significant legal risk and should be removed or substantially modified.",
      negotiation_language: "This clause is concerning and may not be enforceable. Can we discuss alternatives?",
      who_benefits: "tenant",
      fallback: "Consult with a lawyer before signing if landlord refuses to modify."
    },
    high: {
      summary: "Request modification to balance landlord and tenant interests.",
      negotiation_language: "I'd like to discuss a more balanced approach to this clause.",
      who_benefits: "balanced",
      fallback: "Document your concerns in writing before signing."
    },
    medium: {
      summary: "Consider requesting clarification or minor modifications.",
      negotiation_language: "Could we clarify the specific terms of this clause?",
      who_benefits: "balanced",
      fallback: "Acceptable if other critical issues are addressed."
    },
    low: {
      summary: "Standard clause with minor tenant concern.",
      negotiation_language: "This is generally acceptable.",
      who_benefits: "balanced",
      fallback: "No action required."
    },
    none: {
      summary: "No action needed.",
      negotiation_language: "Accept as standard.",
      who_benefits: "balanced",
      fallback: "N/A"
    }
  }
};

function getRecommendation(catalogId, severity) {
  const template = RECOMMENDATION_TEMPLATES[catalogId]?.[severity] || 
                   RECOMMENDATION_TEMPLATES['default'][severity] ||
                   RECOMMENDATION_TEMPLATES['default']['none'];
  return template;
}

export default function NegotiationPlan({ 
  clauseReview = [], 
  flags = [],
  colors,
  isDarkMode,
  language = 'en'
}) {
  // Sort issues by severity
  const sortedIssues = [...clauseReview]
    .filter(r => r.risk_level && r.risk_level !== 'none')
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.risk_level] || 3) - (order[b.risk_level] || 3);
    })
    .slice(0, 10); // Top 10 for negotiation plan

  // Also include flags if clauseReview is sparse
  const flagIssues = flags
    .filter(f => f.severity === 'critical' || f.severity === 'high')
    .slice(0, 5);

  const t = {
    en: {
      title: "Negotiation Plan",
      subtitle: "Top changes to request before signing",
      whatToAsk: "What to Ask For",
      ifRefused: "If Landlord Refuses",
      priority: "Priority",
      critical: "CRITICAL",
      high: "HIGH",
      medium: "MEDIUM",
      noIssues: "No significant issues requiring negotiation.",
      tenantFocus: "Tenant",
      landlordFocus: "Landlord",
      balanced: "Balanced"
    },
    th: {
      title: "แผนการเจรจา",
      subtitle: "การเปลี่ยนแปลงสำคัญที่ควรขอก่อนเซ็น",
      whatToAsk: "สิ่งที่ควรขอ",
      ifRefused: "หากเจ้าของบ้านปฏิเสธ",
      priority: "ความสำคัญ",
      critical: "วิกฤต",
      high: "สูง",
      medium: "ปานกลาง",
      noIssues: "ไม่มีปัญหาสำคัญที่ต้องเจรจา",
      tenantFocus: "ผู้เช่า",
      landlordFocus: "เจ้าของ",
      balanced: "สมดุล"
    }
  };
  const strings = t[language] || t.en;

  const getPriorityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getBenefitsIcon = (who) => {
    if (who === 'tenant') return <Shield className="w-3 h-3 text-emerald-600" />;
    if (who === 'landlord') return <AlertTriangle className="w-3 h-3 text-amber-600" />;
    return <Scale className="w-3 h-3 text-blue-600" />;
  };

  // Combine clauseReview and flags for comprehensive plan
  const allIssues = sortedIssues.length > 0 ? sortedIssues : flagIssues.map(f => ({
    clause_id: f.clause_id || 'FLAG',
    risk_level: f.severity,
    risk_summary: f.description,
    recommended_change: f.recommendation,
    negotiation_tip: f.explanation,
    mapped_catalog_ids: f.pattern_id ? [`CAT-${f.pattern_id}`] : ['default']
  }));

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors?.cardBg || '#FFFFFF' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6" style={{ color: '#0C3B2E' }} />
          {strings.title}
        </CardTitle>
        <p className="text-sm" style={{ color: colors?.textSecondary || '#64748b' }}>
          {strings.subtitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {allIssues.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
            <p style={{ color: colors?.textSecondary }}>{strings.noIssues}</p>
          </div>
        ) : (
          allIssues.map((issue, idx) => {
            const catalogId = issue.mapped_catalog_ids?.[0] || 'default';
            const rec = getRecommendation(catalogId, issue.risk_level);
            
            return (
              <div 
                key={idx} 
                className="p-4 rounded-xl border-2"
                style={{ 
                  borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
                  backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC'
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(issue.risk_level)}>
                      #{idx + 1}
                    </Badge>
                    <span className="font-semibold text-sm" style={{ color: colors?.textPrimary }}>
                      {issue.risk_summary?.substring(0, 100) || 'Issue identified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getBenefitsIcon(rec.who_benefits)}
                    <span className="text-xs" style={{ color: colors?.textSecondary }}>
                      {rec.who_benefits === 'tenant' ? strings.tenantFocus : 
                       rec.who_benefits === 'landlord' ? strings.landlordFocus : strings.balanced}
                    </span>
                  </div>
                </div>

                {/* What to Ask */}
                <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#ECFDF5' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">{strings.whatToAsk}</span>
                  </div>
                  <p className="text-sm" style={{ color: colors?.textPrimary }}>
                    {issue.recommended_change && issue.recommended_change !== 'No change recommended' 
                      ? issue.recommended_change 
                      : rec.negotiation_language}
                  </p>
                </div>

                {/* Negotiation Tip */}
                {issue.negotiation_tip && (
                  <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#EFF6FF' }}>
                    <p className="text-xs" style={{ color: colors?.textSecondary }}>
                      💡 {issue.negotiation_tip}
                    </p>
                  </div>
                )}

                {/* If Refused */}
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-700">{strings.ifRefused}: </span>
                    <span className="text-xs" style={{ color: colors?.textSecondary }}>
                      {rec.fallback}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}