
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle, Loader2, FileText, History } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import LeaseUploadZone from "../components/leases/LeaseUploadZone";

export default function UploadScan() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date', 5),
    enabled: !!user,
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileSelect = async (e) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);

    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      setError(language === 'th' ? 'กรุณาอัปโหลดไฟล์ PDF หรือรูปภาพ' : 'Please upload a PDF or image file');
      return;
    }

    setUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const lease = await base44.entities.Lease.create({
        file_url,
        status: 'uploaded'
      });

      setAnalyzing(true);
      
      // Step 1: Extract and classify clauses
      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an assistant that analyzes Thai/English residential lease contracts.
Extract risky/illegal/unfair clauses, missing protections, and compliance gaps.

IMPORTANT:
- Keep neutral, not anti-landlord.
- This is documentation guidance, not legal advice.
- If text is Thai, respond primarily in Thai with short English gloss.
- If text is English, respond primarily in English with short Thai gloss.

Analyze this lease agreement thoroughly and identify any potential issues or unfair clauses.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  evidence: { type: "string" },
                  explanation: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            missing_items: {
              type: "array",
              items: { type: "string" }
            },
            key_terms: {
              type: "object",
              properties: {
                property_address: { type: "string" },
                deposit_amount: { type: "number" },
                rent_amount: { type: "number" },
                start_date: { type: "string" },
                end_date: { type: "string" },
                language_detected: { type: "string", enum: ["en", "th", "mixed"] }
              }
            }
          }
        }
      });

      // Step 2: Calculate risk score and summary
      const scoreResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Given the flags JSON, compute:
- risk_score: integer 0..100 (0 = very safe, 100 = very risky)
- summary: <= 180 characters
- top_flags: top 5 flag ids/titles

Return JSON with these fields.
Flags JSON: ${JSON.stringify(analysisResult.flags)}`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_score: { type: "integer", minimum: 0, maximum: 100 },
            summary: { type: "string" },
            top_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Update lease with extracted data
      await base44.entities.Lease.update(lease.id, {
        status: 'scanned',
        property_address: analysisResult.key_terms?.property_address,
        start_date: analysisResult.key_terms?.start_date,
        end_date: analysisResult.key_terms?.end_date,
        rent_amount: analysisResult.key_terms?.rent_amount,
        deposit_amount: analysisResult.key_terms?.deposit_amount,
        language_detected: analysisResult.key_terms?.language_detected
      });

      // Create scan preview
      const scan = await base44.entities.LeaseScan.create({
        lease_id: lease.id,
        risk_score: scoreResult.risk_score,
        flags: scoreResult.top_flags || [],
        summary: scoreResult.summary,
        scan_preview: scoreResult,
        scan_full: analysisResult,
        version: 'v1'
      });

      queryClient.invalidateQueries({ queryKey: ['leases'] });
      navigate(createPageUrl("ScanPreview") + `?scanId=${scan.id}&leaseId=${lease.id}`);
      
    } catch (err) {
      setError(language === 'th' ? 'การวิเคราะห์สัญญาล้มเหลว กรุณาลองอีกครั้ง' : 'Failed to analyze lease. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      uploaded: "bg-amber-100 text-amber-800",
      scanned: "bg-blue-100 text-blue-800",
      paid: "bg-emerald-100 text-emerald-800"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Upload & Scan</h1>
          </div>
          <p className="text-slate-600">AI-powered lease analysis in seconds</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-xl mb-6 overflow-hidden">
          <div className="p-6 md:p-8">
            {uploading || analyzing ? (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {uploading ? 'Uploading Lease...' : 'Analyzing Agreement...'}
                </h3>
                <p className="text-slate-600">
                  {analyzing ? 'Our AI is reviewing your lease for potential issues' : 'Please wait'}
                </p>
              </div>
            ) : (
              <LeaseUploadZone
                onFileSelect={handleFileSelect}
                dragActive={dragActive}
                onDrag={handleDrag}
              />
            )}
          </div>
        </Card>

        {leases.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-bold text-slate-900">Recent Scans</h2>
            </div>
            <div className="space-y-3">
              {leases.map((lease) => (
                <Card key={lease.id} className="p-4 border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {lease.property_address || 'Lease Agreement'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(lease.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(lease.status)}>
                      {lease.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
