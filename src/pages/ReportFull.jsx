import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, AlertTriangle, CheckCircle2, XCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FeatureGate } from "../components/shared/FeatureGate";

export default function ReportFull() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scanId');
  const leaseIdFromUrl = urlParams.get('leaseId');
  const [downloading, setDownloading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: scan } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      const scans = await base44.entities.LeaseScan.list();
      return scans.find(s => s.id === scanId);
    },
    enabled: !!scanId,
  });

  const { data: lease } = useQuery({
    queryKey: ['lease', scan?.lease_id || leaseIdFromUrl],
    queryFn: async () => {
      const leases = await base44.entities.Lease.list();
      const targetLeaseId = scan?.lease_id || leaseIdFromUrl;
      return leases.find(l => l.id === targetLeaseId);
    },
    enabled: !!(scan?.lease_id || leaseIdFromUrl),
  });

  const handleDownloadPDF = async () => {
    if (!scan || !lease || downloading) return;
    
    // Extra safety check
    if (!lease.id) {
      alert('Unable to generate PDF: lease information is incomplete');
      return;
    }
    
    setDownloading(true);
    try {
      const response = await base44.functions.invoke('generateLeaseReportPDF', {
        scanId: scan.id,
        leaseId: lease.id
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `lease-report-${lease.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!scan || !lease) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Loading Report...</h3>
            <p className="text-slate-600">Please wait while we load your lease report.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <FeatureGate feature="full_report">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Full Lease Report</h1>
              <p className="text-slate-600">{lease.property_address || 'Lease Agreement'}</p>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>

          <Card className="mb-6 border-none shadow-xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Overall Risk Score</p>
                  <p className="text-5xl font-bold text-slate-900">{scan.risk_score}<span className="text-2xl text-slate-500">/100</span></p>
                </div>
                <div className={`px-6 py-3 rounded-xl ${
                  scan.risk_score >= 80 ? 'bg-red-100 text-red-800' :
                  scan.risk_score >= 60 ? 'bg-orange-100 text-orange-800' :
                  scan.risk_score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  <p className="text-xs font-medium mb-1">Risk Level</p>
                  <p className="text-lg font-bold">
                    {scan.risk_score >= 80 ? 'High Risk' :
                     scan.risk_score >= 60 ? 'Medium-High' :
                     scan.risk_score >= 40 ? 'Medium' :
                     'Low Risk'}
                  </p>
                </div>
              </div>
              
              {scan.summary && (
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-700 leading-relaxed">{scan.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {scan.scan_full?.flags && scan.scan_full.flags.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Detailed Findings</h2>
              {scan.scan_full.flags.map((flag, index) => (
                <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getSeverityIcon(flag.severity)}
                        <div>
                          <CardTitle className="text-lg mb-1">{flag.title || flag.category}</CardTitle>
                          {flag.clause_reference && (
                            <p className="text-sm text-slate-500">Section: {flag.clause_reference}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={`${getSeverityColor(flag.severity)} border`}>
                        {flag.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {flag.description && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-slate-700 mb-2">Issue Description</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{flag.description}</p>
                      </div>
                    )}
                    
                    {flag.recommendation && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 Our Recommendation</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">{flag.recommendation}</p>
                      </div>
                    )}

                    {flag.legal_basis && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-xs text-slate-700 mb-1">Legal Basis</h4>
                        <p className="text-xs text-slate-600">{flag.legal_basis}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="mt-6 border-none shadow-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardHeader>
              <CardTitle className="text-white">What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <p className="text-sm">Review all flagged issues carefully and understand your rights</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <p className="text-sm">Document everything - photos, communications, and receipts</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <p className="text-sm">Use our letter templates to communicate with your landlord</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                  <p className="text-sm">If issues persist, open a dispute case for professional support</p>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button 
                  variant="secondary"
                  onClick={() => navigate(createPageUrl("Templates"))}
                  className="flex-1"
                >
                  View Templates
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => navigate(createPageUrl("ResolveCase"))}
                  className="flex-1"
                >
                  Open Case
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureGate>
  );
}