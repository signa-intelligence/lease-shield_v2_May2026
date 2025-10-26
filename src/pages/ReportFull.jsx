import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, FileText, ArrowLeft, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { FeatureGate } from "../components/shared/FeatureGate";

export default function ReportFull() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date', 1),
    enabled: !!user,
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: async () => {
      if (!leases[0]) return [];
      const allScans = await base44.entities.LeaseScan.list();
      return allScans.filter(s => s.lease_id === leases[0].id).sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!leases[0],
  });

  const scan = scans[0];
  const lease = leases[0];

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
            <Button className="bg-blue-600 hover:bg-blue-700">
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

          {/* Detailed Flags */}
          {scan.flags && scan.flags.length > 0 && (
            <Card className="mb-6 border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Detailed Issues ({scan.flags.length})
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
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm uppercase tracking-wide">
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

          {/* Full Scan Data */}
          {scan.scan_full && (
            <Card className="mb-6 border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Complete Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-slate-50 rounded-xl p-4 overflow-auto">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(scan.scan_full, null, 2)}
                  </pre>
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