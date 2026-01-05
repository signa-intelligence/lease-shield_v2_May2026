import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, CheckCircle2, Info, AlertCircle, 
  Lightbulb, Scale, User, Briefcase 
} from "lucide-react";

const SEVERITY_CONFIG = {
  none: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'NO RISK', Icon: CheckCircle2 },
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'LOW', Icon: Info },
  medium: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'MEDIUM', Icon: AlertTriangle },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'HIGH', Icon: AlertTriangle },
  critical: { color: 'bg-red-100 text-red-800 border-red-200', label: 'CRITICAL', Icon: AlertCircle }
};

export default function RecommendationCard({ 
  review, 
  clauseHeading,
  index,
  colors,
  isDarkMode,
  language = 'en',
  compact = false
}) {
  const severity = review.risk_level || 'none';
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.none;
  const Icon = config.Icon;

  const t = {
    en: {
      tenantImpact: "Tenant Impact",
      landlordBenefit: "Landlord Benefit",
      legalContext: "Thai Law Context",
      recommendation: "Recommended Change",
      negotiationTip: "Negotiation Tip",
      noRisk: "No significant risk identified"
    },
    th: {
      tenantImpact: "ผลกระทบต่อผู้เช่า",
      landlordBenefit: "ประโยชน์ของเจ้าของ",
      legalContext: "บริบทกฎหมายไทย",
      recommendation: "การเปลี่ยนแปลงที่แนะนำ",
      negotiationTip: "เคล็ดลับการเจรจา",
      noRisk: "ไม่พบความเสี่ยงที่สำคัญ"
    }
  };
  const strings = t[language] || t.en;

  // Compact mode for no-risk clauses
  if (compact && severity === 'none') {
    return (
      <div 
        className="p-3 rounded-lg border flex items-center justify-between"
        style={{ 
          borderColor: colors?.borderColor || '#E5E7EB',
          backgroundColor: isDarkMode ? '#2A2D30' : '#FAFAFA'
        }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm" style={{ color: colors?.textPrimary }}>
            {clauseHeading || `Clause ${review.clause_id}`}
          </span>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800 text-xs">OK</Badge>
      </div>
    );
  }

  return (
    <div 
      className="p-4 rounded-xl border-2"
      style={{ 
        borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
        backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span className="text-xs font-bold px-2 py-1 rounded" style={{ 
              backgroundColor: isDarkMode ? '#1F2937' : '#E5E7EB',
              color: colors?.textSecondary 
            }}>
              #{index + 1}
            </span>
          )}
          <span className="font-semibold" style={{ color: colors?.textPrimary }}>
            {clauseHeading || `Clause ${review.clause_id}`}
          </span>
        </div>
        <Badge className={`${config.color} border flex items-center gap-1`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </Badge>
      </div>

      {/* Risk Summary */}
      {review.risk_summary && (
        <p className="text-sm mb-3" style={{ color: colors?.textPrimary }}>
          {review.risk_summary}
        </p>
      )}

      {/* Only show details for non-zero risk */}
      {severity !== 'none' && (
        <>
          {/* Three Perspectives */}
          <div className="space-y-2 mb-3">
            {review.tenant_view && (
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7' }}>
                <div className="flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">{strings.tenantImpact}</span>
                </div>
                <p className="text-xs" style={{ color: colors?.textSecondary }}>{review.tenant_view}</p>
              </div>
            )}
            
            {review.landlord_view && (
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#EFF6FF' }}>
                <div className="flex items-center gap-1 mb-1">
                  <Briefcase className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-bold text-blue-700">{strings.landlordBenefit}</span>
                </div>
                <p className="text-xs" style={{ color: colors?.textSecondary }}>{review.landlord_view}</p>
              </div>
            )}

            {review.lawyer_view && (
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }}>
                <div className="flex items-center gap-1 mb-1">
                  <Scale className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-bold text-gray-700">{strings.legalContext}</span>
                </div>
                <p className="text-xs" style={{ color: colors?.textSecondary }}>{review.lawyer_view}</p>
              </div>
            )}
          </div>

          {/* Recommendation */}
          {review.recommended_change && review.recommended_change !== 'No change recommended' && (
            <div className="p-3 rounded-lg mb-2" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#ECFDF5' }}>
              <div className="flex items-center gap-1 mb-1">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">{strings.recommendation}</span>
              </div>
              <p className="text-sm" style={{ color: colors?.textPrimary }}>{review.recommended_change}</p>
            </div>
          )}

          {/* Negotiation Tip */}
          {review.negotiation_tip && review.negotiation_tip !== 'Accept as standard.' && (
            <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
              <span className="text-xs">💡</span>
              <p className="text-xs" style={{ color: colors?.textSecondary }}>{review.negotiation_tip}</p>
            </div>
          )}
        </>
      )}

      {/* No risk message */}
      {severity === 'none' && (
        <p className="text-sm" style={{ color: colors?.textSecondary }}>
          ✓ {strings.noRisk}
        </p>
      )}
    </div>
  );
}