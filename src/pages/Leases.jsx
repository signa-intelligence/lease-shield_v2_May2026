import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import LeaseUploadZone from "../components/leases/LeaseUploadZone";
import LeaseAnalysisResults from "../components/leases/LeaseAnalysisResults";

export default function Leases() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentScan, setCurrentScan] = useState(null);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date'),
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
      setError('Please upload a PDF or image file');
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
      
      const scanResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this lease agreement and extract key information. Identify any potential issues or unfair clauses that could harm the tenant. 
        
        Provide:
        1. A risk score from 0-100 (0 = very safe, 100 = very risky)
        2. List of flags with severity (critical, high, medium, low), category, and description
        3. A summary of the overall lease quality
        4. Extract: property_address, start_date, end_date, rent_amount, deposit_amount, language_detected (en, th, or mixed)`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            risk_score: { type: "integer" },
            flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  category: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            summary: { type: "string" },
            property_address: { type: "string" },
            start_date: { type: "string" },
            end_date: { type: "string" },
            rent_amount: { type: "number" },
            deposit_amount: { type: "number" },
            language_detected: { type: "string", enum: ["en", "th", "mixed"] }
          }
        }
      });

      await base44.entities.Lease.update(lease.id, {
        status: 'scanned',
        property_address: scanResult.property_address,
        start_date: scanResult.start_date,
        end_date: scanResult.end_date,
        rent_amount: scanResult.rent_amount,
        deposit_amount: scanResult.deposit_amount,
        language_detected: scanResult.language_detected
      });

      const scan = await base44.entities.LeaseScan.create({
        lease_id: lease.id,
        risk_score: scanResult.risk_score,
        flags: scanResult.flags || [],
        summary: scanResult.summary,
        scan_full: scanResult,
        version: '1.0'
      });

      setCurrentScan(scan);
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      
    } catch (err) {
      setError('Failed to analyze lease. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSaveScan = () => {
    setCurrentScan(null);
    queryClient.invalidateQueries({ queryKey: ['leases'] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">My Leases</h1>
          </div>
          <p className="text-slate-600">Upload and analyze your rental agreements</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!currentScan ? (
          <>
            <Card className="border-none shadow-xl mb-8 overflow-hidden">
              <div className="p-8">
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
                <h2 className="text-xl font-bold text-slate-900 mb-4">Previous Leases</h2>
                <div className="grid gap-4">
                  {leases.map((lease) => (
                    <Card key={lease.id} className="p-6 border-none shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-1">
                            {lease.property_address || 'Lease Agreement'}
                          </h3>
                          {lease.rent_amount && (
                            <p className="text-slate-600 mb-2">
                              ฿{lease.rent_amount.toLocaleString()}/month
                            </p>
                          )}
                          <div className="flex gap-2 text-sm text-slate-500">
                            <span>Status: {lease.status}</span>
                            {lease.language_detected && (
                              <span>• Language: {lease.language_detected.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <LeaseAnalysisResults scan={currentScan} onSave={handleSaveScan} />
        )}
      </div>
    </div>
  );
}