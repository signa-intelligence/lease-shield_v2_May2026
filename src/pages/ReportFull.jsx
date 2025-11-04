
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, FileText, ArrowLeft, AlertTriangle, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { FeatureGate } from "../components/shared/FeatureGate";

export default function ReportFull() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scanId');

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
    queryKey: ['lease', scan?.lease_id],
    queryFn: async () => {
      const leases = await base44.entities.Lease.list();
      return leases.find(l => l.id === scan.lease_id);
    },
    enabled: !!scan?.lease_id,
  });

  const handleDownloadPDF = async () => {
    if (!scan || !lease) return;
    
    try {
      // Generate PDF using jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Lease Shield - Full Report', 20, 20);
      
      // Property details
      doc.setFontSize(12);
      doc.text(`Property: ${lease.property_address || 'N/A'}`, 20, 35);
      doc.text(`Risk Score: ${scan.risk_score}/100`, 20, 45);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
      
      // Summary
      doc.setFontSize(14);
      doc.text('Summary', 20, 70);
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(scan.summary || 'No summary available', 170);
      doc.text(summaryLines, 20, 80);
      
      let yPos = 80 + (summaryLines.length * 7) + 10; // Start position after summary + some padding
      
      // Flags
      if (scan.scan_full?.flags && scan.scan_full.flags.length > 0) {
        doc.setFontSize(14);
        // Check if there's enough space for "Issues Found" header, if not, add page
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text('Issues Found', 20, yPos);
        yPos += 10;
        
        scan.scan_full.flags.forEach((flag, idx) => {
          // Check for space before adding a new flag detail
          // Estimate space needed for title, severity, and description (approx 3 lines for description)
          const estimatedFlagHeight = 7 + 7 + (3 * 7) + 5; 
          if (yPos + estimatedFlagHeight > 270) { // 270 is roughly the bottom margin
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(12);
          doc.text(`${idx + 1}. ${flag.title || flag.category}`, 20, yPos);
          yPos += 7;
          
          doc.setFontSize(10);
          doc.text(`Severity: ${flag.severity}`, 25, yPos);
          yPos += 7;
          
          if (flag.explanation) { // Changed from description to explanation based on flag structure
            const descLines = doc.splitTextToSize(flag.explanation, 165);
            doc.text(descLines, 25, yPos);
            yPos += (descLines.length * 7); // + 5 will be added globally below
          }
          
          yPos += 5; // Padding between flags
        });
      }
      
      // Download
      doc.save(`lease-report-${lease.id?.slice(0, 8) || 'report'}.pdf`);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (!scan || !lease) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No scan report found</p>
          <Button onClick={() => navigate(createPageUrl("UploadScan"))}>
            Upload a Lease
          </Button>
        </div>
      </div>
    );
  }

  const getSeverityIcon = (severity) => {
    const icons = { critical: AlertTriangle, high: AlertTriangle, medium: Info, low: CheckCircle2 };
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

  const fullFlags = scan.scan_full?.flags || [];
  const missingItems = scan.scan_full?.missing_items || [];
  const keyTerms = scan.scan_full?.key_terms || {};

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
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* Risk Score Summary */}
          <Card className="mb-6 border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Risk Assessment</span>
                <Badge className="bg-white text-blue-800 text-lg px-4 py-2">
                  Score: {scan.risk_score}/100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-700 leading-relaxed">{scan.summary}</p>
            </CardContent>
          </Card>

          {/* Key Terms */}
          {Object.keys(keyTerms).length > 0 && (
            <Card className="mb-6 border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Key Lease Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {keyTerms.property_address && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Property Address</p>
                      <p className="font-medium text-slate-900">{keyTerms.property_address}</p>
                    </div>
                  )}
                  {keyTerms.rent_amount && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Monthly Rent</p>
                      <p className="font-medium text-slate-900">฿{keyTerms.rent_amount.toLocaleString()}</p>
                    </div>
                  )}
                  {keyTerms.deposit_amount && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Security Deposit</p>
                      <p className="font-medium text-slate-900">฿{keyTerms.deposit_amount.toLocaleString()}</p>
                    </div>
                  )}
                  {keyTerms.start_date && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Lease Period</p>
                      <p className="font-medium text-slate-900">
                        {keyTerms.start_date} {keyTerms.end_date && `to ${keyTerms.end_date}`}
                      </p>
                    </div>
                  )}
                  {keyTerms.lease_type_detected && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Lease Type</p>
                      <p className="font-medium text-slate-900 capitalize">{keyTerms.lease_type_detected.replace('_', ' ')}</p>
                    </div>
                  )}
                  {keyTerms.language_detected && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Language</p>
                      <p className="font-medium text-slate-900 uppercase">{keyTerms.language_detected}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Flags */}
          {fullFlags.length > 0 && (
            <Card className="mb-6 border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Detailed Issues & Recommendations ({fullFlags.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {fullFlags.map((flag, index) => {
                    const SeverityIcon = getSeverityIcon(flag.severity);
                    return (
                      <div key={index} className={`p-5 rounded-xl border-2 ${getSeverityColor(flag.severity)}`}>
                        <div className="flex items-start gap-3 mb-3">
                          <SeverityIcon className="w-6 h-6 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-lg">{flag.title}</h4>
                              <Badge variant="outline" className="text-xs font-bold uppercase">
                                {flag.severity}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="mb-3 text-xs">
                              {flag.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-3 ml-9">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide mb-1 opacity-70">Evidence</p>
                            <p className="text-sm italic border-l-2 border-current pl-3 py-1">"{flag.evidence}"</p>
                          </div>
                          
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide mb-1 opacity-70">Explanation</p>
                            <p className="text-sm leading-relaxed">{flag.explanation}</p>
                          </div>
                          
                          <div className="bg-white/50 rounded-lg p-3 border border-current/20">
                            <p className="text-xs font-bold uppercase tracking-wide mb-1 opacity-70">Recommendation</p>
                            <p className="text-sm font-medium leading-relaxed">{flag.recommendation}</p>
                          </div>
                          
                          {(flag.impact_0_10 || flag.likelihood_0_10) && (
                            <div className="flex gap-4 text-xs">
                              {flag.impact_0_10 && (
                                <div>
                                  <span className="font-semibold">Impact:</span> {flag.impact_0_10}/10
                                </div>
                              )}
                              {flag.likelihood_0_10 && (
                                <div>
                                  <span className="font-semibold">Likelihood:</span> {flag.likelihood_0_10}/10
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing Protections */}
          {missingItems.length > 0 && (
            <Card className="mb-6 border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Missing Protections ({missingItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-3">
                  {missingItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-900 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4">Suggested Next Steps</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => navigate(createPageUrl("DepositTracker"))}
                >
                  <Shield className="w-5 h-5 mr-3 text-emerald-600" />
                  <div className="text-left">
                    <div className="font-semibold">Enable Deposit Shield</div>
                    <div className="text-xs text-slate-500">Track your security deposit</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => navigate(createPageUrl("Templates"))}
                >
                  <FileText className="w-5 h-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold">Generate Letter</div>
                    <div className="text-xs text-slate-500">Professional tenant letters</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureGate>
  );
}
