import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeatureGate } from "../components/shared/FeatureGate";
import { Progress } from "@/components/ui/progress";

export default function ReportFull() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('scanId');

  const { data: scan, isLoading } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      const scans = await base44.entities.LeaseScan.list();
      return scans.find(s => s.id === scanId);
    },
    enabled: !!scanId,
  });

  if (!scanId) {
    navigate(createPageUrl("UploadScan"));
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Full Analysis Report</h1>
            <p className="text-slate-600">Comprehensive lease breakdown</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <FeatureGate feature="full_report">
          {isLoading ? (
            <Card className="border-none shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading report...</p>
              </CardContent>
            </Card>
          ) : scan ? (
            <div className="space-y-6">
              {/* Executive Summary */}
              <Card className="border-none shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Overall Risk Score</span>
                      <span className="text-3xl font-bold">{scan.risk_score}/100</span>
                    </div>
                    <Progress value={scan.risk_score} className="h-3" />
                  </div>
                  <p className="text-slate-700 leading-relaxed">{scan.summary}</p>
                </CardContent>
              </Card>

              {/* Detailed Findings */}
              <Card className="border-none shadow-xl">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Detailed Findings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {scan.flags?.map((flag, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg">{flag.category}</h3>
                          <Badge variant="outline">{flag.severity}</Badge>
                        </div>
                        <p className="text-slate-700 mb-3">{flag.description}</p>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-sm font-semibold text-blue-900 mb-2">Recommendation:</p>
                          <p className="text-sm text-blue-800">
                            Review this clause carefully and consider consulting with a legal expert before signing.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Legal Recommendations */}
              <Card className="border-none shadow-xl">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Legal Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">Document Everything</h3>
                        <p className="text-sm text-slate-600">
                          Take photos of the property before moving in and keep all communication records
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">Understand Your Rights</h3>
                        <p className="text-sm text-slate-600">
                          Familiarize yourself with local tenant protection laws and regulations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">Track Your Deposit</h3>
                        <p className="text-sm text-slate-600">
                          Use our Deposit Shield feature to monitor your security deposit return
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-none shadow-xl">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Report not found</p>
              </CardContent>
            </Card>
          )}
        </FeatureGate>
      </div>
    </div>
  );
}