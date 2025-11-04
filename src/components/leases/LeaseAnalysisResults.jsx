import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, AlertCircle, Download, FileText, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FeatureGate } from "../shared/FeatureGate";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LeaseAnalysisResults({ scan, onSave, onDownload }) {
  const navigate = useNavigate();

  const getRiskColor = (score) => {
    if (score >= 75) return "text-red-600 bg-red-50";
    if (score >= 50) return "text-amber-600 bg-amber-50";
    if (score >= 25) return "text-yellow-600 bg-yellow-50";
    return "text-emerald-600 bg-emerald-50";
  };

  const getRiskLabel = (score) => {
    if (score >= 75) return "High Risk";
    if (score >= 50) return "Medium Risk";
    if (score >= 25) return "Low Risk";
    return "Very Low Risk";
  };

  const getRiskScoreColor = (score) => {
    if (score >= 75) return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', badge: 'RED' };
    if (score >= 50) return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', badge: 'AMBER' };
    if (score >= 25) return { bg: '#FEF9C3', border: '#EAB308', text: '#713F12', badge: 'YELLOW' };
    return { bg: '#D1FAE5', border: '#10B981', text: '#065F46', badge: 'GREEN' };
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: AlertTriangle,
      high: AlertCircle,
      medium: Info,
      low: CheckCircle2
    };
    return icons[severity] || Info;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "text-red-600 bg-red-50 border-red-200",
      high: "text-orange-600 bg-orange-50 border-orange-200",
      medium: "text-amber-600 bg-amber-50 border-amber-200",
      low: "text-blue-600 bg-blue-50 border-blue-200"
    };
    return colors[severity] || "text-slate-600 bg-slate-50 border-slate-200";
  };

  const riskScoreColors = getRiskScoreColor(scan.risk_score);

  return (
    <div className="space-y-6">
      {/* Contract Risk Score Card */}
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader style={{ 
          background: 'linear-gradient(to right, #0C3B2E, #047857)',
          padding: '24px'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">Contract Risk Score</CardTitle>
              <p className="text-sm text-white/80">Detailed analysis with risk assessment</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div 
            style={{
              backgroundColor: riskScoreColors.bg,
              border: `3px solid ${riskScoreColors.border}`,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: riskScoreColors.text }}>
                  Overall Risk Rating
                </p>
                <div className="flex items-center gap-3">
                  <span 
                    className="text-5xl font-bold" 
                    style={{ color: riskScoreColors.text }}
                  >
                    {scan.risk_score}
                  </span>
                  <span className="text-2xl font-medium" style={{ color: riskScoreColors.text }}>
                    /100
                  </span>
                </div>
              </div>
              <div 
                style={{
                  backgroundColor: riskScoreColors.border,
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                {riskScoreColors.badge}
              </div>
            </div>
            
            <Progress 
              value={scan.risk_score} 
              className="h-4 mb-4" 
              style={{
                backgroundColor: '#FFFFFF',
                border: `2px solid ${riskScoreColors.border}`
              }}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div style={{
                backgroundColor: '#FFFFFF',
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${riskScoreColors.border}`
              }}>
                <p className="text-xs font-semibold mb-1" style={{ color: riskScoreColors.text }}>
                  Risk Level
                </p>
                <p className="font-bold" style={{ color: riskScoreColors.text }}>
                  {getRiskLabel(scan.risk_score)}
                </p>
              </div>
              <div style={{
                backgroundColor: '#FFFFFF',
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${riskScoreColors.border}`
              }}>
                <p className="text-xs font-semibold mb-1" style={{ color: riskScoreColors.text }}>
                  Issues Found
                </p>
                <p className="font-bold" style={{ color: riskScoreColors.text }}>
                  {scan.flags?.length || 0} Flags
                </p>
              </div>
            </div>
          </div>
          
          {scan.summary && (
            <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">📋 Summary</p>
              <p className="text-sm text-slate-700 leading-relaxed">{scan.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flags Card */}
      {scan.flags && scan.flags.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100 p-6">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Issues Detected ({scan.flags.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {scan.flags.map((flag, index) => {
                const SeverityIcon = getSeverityIcon(flag.severity);
                return (
                  <div key={index} className={`p-4 rounded-xl border ${getSeverityColor(flag.severity)}`}>
                    <div className="flex items-start gap-3">
                      <SeverityIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm uppercase tracking-wide">
                            {flag.category}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {flag.severity}
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed">{flag.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Report - Gated Feature */}
      <FeatureGate feature="full_report">
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Detailed Analysis Report</h3>
                <p className="text-sm text-slate-600">
                  Comprehensive breakdown with recommendations
                </p>
              </div>
              <button
                onClick={() => navigate(createPageUrl("ReportFull") + `?scanId=${scan.id}&leaseId=${scan.lease_id}`)}
                style={{
                  backgroundColor: '#9333EA',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#7e22ce'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#9333EA'}
              >
                <FileText style={{ width: '16px', height: '16px' }} />
                View Full Report
              </button>
            </div>
          </CardContent>
        </Card>
      </FeatureGate>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onSave}
          style={{
            flex: 1,
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            padding: '14px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
        >
          <CheckCircle2 style={{ width: '20px', height: '20px' }} />
          Save Analysis
        </button>
        <FeatureGate 
          feature="full_report"
          fallback={
            <button
              disabled
              style={{
                backgroundColor: '#E5E7EB',
                color: '#9CA3AF',
                padding: '14px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                border: '1px solid #D1D5DB',
                cursor: 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                opacity: 0.6
              }}
            >
              <Download style={{ width: '20px', height: '20px' }} />
              Download Report (Premium)
            </button>
          }
        >
          <button
            onClick={onDownload}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1A1D1F',
              padding: '14px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              border: '2px solid #D1D5DB',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#F3F4F6';
              e.target.style.borderColor = '#9CA3AF';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#FFFFFF';
              e.target.style.borderColor = '#D1D5DB';
            }}
          >
            <Download style={{ width: '20px', height: '20px' }} />
            Download Report
          </button>
        </FeatureGate>
      </div>
    </div>
  );
}