import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ExternalLink, Download, Loader2 } from "lucide-react";

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
          <button 
            onClick={() => navigate(createPageUrl("UploadScan"))}
            style={{
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563EB'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3B82F6'}
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl("UploadScan"))}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1A1D1F',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFFFF'}
          >
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Scan Results</h1>
            {lease?.property_address && (
              <p className="text-slate-600">{lease.property_address}</p>
            )}
          </div>
          <div className="flex gap-2">
            {lease?.file_url && (
              <a href={lease.file_url} target="_blank" rel="noopener noreferrer">
                <button
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#1A1D1F',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid #D1D5DB',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                >
                  <ExternalLink style={{ width: '16px', height: '16px' }} />
                  View Original
                </button>
              </a>
            )}
            <button 
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              style={{
                backgroundColor: downloadingPdf ? '#E5E7EB' : '#FFFFFF',
                color: downloadingPdf ? '#9CA3AF' : '#1A1D1F',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                border: '1px solid #D1D5DB',
                cursor: downloadingPdf ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!downloadingPdf) e.target.style.backgroundColor = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                if (!downloadingPdf) e.target.style.backgroundColor = '#FFFFFF';
              }}
            >
              {downloadingPdf ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Generating...
                </>
              ) : (
                <>
                  <Download style={{ width: '16px', height: '16px' }} />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>

        <LeaseAnalysisResults scan={scan} onSave={handleSave} />
      </div>
    </div>
  );
}