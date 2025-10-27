import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ExternalLink, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import LeaseAnalysisResults from "../components/leases/LeaseAnalysisResults";

export default function ScanPreview() {
  const navigate = useNavigate();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scanId');
  const leaseId = urlParams.get('leaseId');

  const { data: scan, isLoading } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      const scans = await base44.entities.LeaseScan.list();
      return scans.find(s => s.id === scanId);
    },
    enabled: !!scanId,
  });

  const { data: lease } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: async () => {
      const leases = await base44.entities.Lease.list();
      return leases.find(l => l.id === leaseId);
    },
    enabled: !!leaseId,
  });

  const handleSave = () => {
    navigate(createPageUrl("Dashboard"));
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      // Generate PDF report using AI
      const pdfResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a professional PDF-ready lease risk report with the following structure:

LEASE SHIELD – RISK REPORT
Fair. Transparent. Protected.

1) SUMMARY
${scan.summary}

2) OVERALL RISK SCORE
Score: ${scan.risk_score}/100
${scan.risk_score >= 75 ? 'High Risk - Immediate attention recommended' : 
  scan.risk_score >= 50 ? 'Medium Risk - Review carefully' : 
  scan.risk_score >= 25 ? 'Low Risk - Minor concerns' : 'Very Low Risk - Generally favorable'}

3) FLAGGED CLAUSES
${JSON.stringify(scan.scan_full.flags, null, 2)}

4) MISSING PROTECTIONS
${JSON.stringify(scan.scan_full.missing_items, null, 2)}

5) KEY TERMS
${JSON.stringify(scan.scan_full.key_terms, null, 2)}

6) NEXT STEPS
- Review flagged clauses with landlord
- Consider using letter templates for clarification
- Keep evidence and documentation organized

DISCLAIMER: This is a documentation service, not legal advice.

Format this as a well-structured, professional document in both English and Thai.`,
        response_json_schema: {
          type: "object",
          properties: {
            report_text: { type: "string" }
          }
        }
      });

      // In a real implementation, you would convert this to PDF
      // For now, we'll create a text document
      const blob = new Blob([pdfResult.report_text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lease_shield_report_${scanId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Scan not found</p>
          <Button onClick={() => navigate(createPageUrl("UploadScan"))}>
            Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("UploadScan"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Scan Results</h1>
            {lease?.property_address && (
              <p className="text-slate-600">{lease.property_address}</p>
            )}
          </div>
          <div className="flex gap-2">
            {lease?.file_url && (
              <a href={lease.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Original
                </Button>
              </a>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>

        <LeaseAnalysisResults scan={scan} onSave={handleSave} />
      </div>
    </div>
  );
}