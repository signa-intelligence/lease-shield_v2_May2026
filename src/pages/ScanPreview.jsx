import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

import LeaseAnalysisResults from "../components/leases/LeaseAnalysisResults";

export default function ScanPreview() {
  const navigate = useNavigate();
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
          {lease?.file_url && (
            <a href={lease.file_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Original
              </Button>
            </a>
          )}
        </div>

        <LeaseAnalysisResults scan={scan} onSave={handleSave} />
      </div>
    </div>
  );
}