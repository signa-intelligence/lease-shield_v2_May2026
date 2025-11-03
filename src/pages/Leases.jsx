
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import LeaseUploadZone from "../components/leases/LeaseUploadZone";
import LeaseAnalysisResults from "../components/leases/LeaseAnalysisResults";

export default function Leases() {
  const navigate = useNavigate();
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

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    loaderBg: '#353A3D'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    loaderBg: '#F8FAFC'
  };

  const t = {
    en: {
      myLeases: "My Leases",
      uploadAnalyze: "Upload and analyze your rental agreements",
      uploadingLease: "Uploading Lease...",
      analyzingAgreement: "Analyzing Agreement...",
      aiReviewing: "Our AI is reviewing your lease for potential issues",
      pleaseWait: "Please wait",
      previousLeases: "Previous Leases",
      leaseAgreement: "Lease Agreement",
      month: "month",
      language: "Language",
      pages: "pages",
      uploaded: "Uploaded",
      viewDetails: "View Details",
      uploadPDFImage: "Please upload a PDF or image file",
      failedAnalyze: "Failed to analyze lease. Please try again.",
      scanNotFound: "Scan results not found for this lease."
    },
    th: {
      myLeases: "สัญญาเช่าของฉัน",
      uploadAnalyze: "อัปโหลดและวิเคราะห์สัญญาเช่าของคุณ",
      uploadingLease: "กำลังอัปโหลดสัญญาเช่า...",
      analyzingAgreement: "กำลังวิเคราะห์สัญญา...",
      aiReviewing: "AI กำลังตรวจสอบสัญญาเช่าของคุณเพื่อหาปัญหาที่อาจเกิดขึ้น",
      pleaseWait: "กรุณารอสักครู่",
      previousLeases: "สัญญาเช่าก่อนหน้า",
      leaseAgreement: "สัญญาเช่า",
      month: "เดือน",
      language: "ภาษา",
      pages: "หน้า",
      uploaded: "อัปโหลดเมื่อ",
      viewDetails: "ดูรายละเอียด",
      uploadPDFImage: "กรุณาอัปโหลดไฟล์ PDF หรือรูปภาพ",
      failedAnalyze: "ไม่สามารถวิเคราะห์สัญญาเช่าได้ กรุณาลองอีกครั้ง",
      scanNotFound: "ไม่พบผลการสแกนสำหรับสัญญาเช่านี้"
    }
  };

  const strings = t[language];

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: async () => {
      const allScans = await base44.entities.LeaseScan.list();
      return allScans.filter(s => leases.some(l => l.id === s.lease_id));
    },
    enabled: !!user && leases.length > 0,
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
      setError(strings.uploadPDFImage);
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
      setError(strings.failedAnalyze);
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

  const handleViewDetails = (lease) => {
    // Find the scan for this lease
    const scan = scans.find(s => s.lease_id === lease.id);
    
    if (scan) {
      // Navigate to scan preview
      navigate(createPageUrl("ScanPreview") + `?scanId=${scan.id}&leaseId=${lease.id}`);
    } else {
      // If no scan found, alert user
      alert(strings.scanNotFound);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      uploaded: "bg-amber-100 text-amber-800",
      scanned: "bg-blue-100 text-blue-800",
      paid: "bg-emerald-100 text-emerald-800"
    };
    return statusColors[status] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.myLeases}</h1>
          </div>
          <p style={{ color: colors.textSecondary }}>{strings.uploadAnalyze}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!currentScan ? (
          <>
            <Card className="border-none shadow-xl mb-8 overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
              <div className="p-8">
                {uploading || analyzing ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {uploading ? strings.uploadingLease : strings.analyzingAgreement}
                    </h3>
                    <p style={{ color: colors.textSecondary }}>
                      {analyzing ? strings.aiReviewing : strings.pleaseWait}
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
                <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>{strings.previousLeases}</h2>
                <div className="grid gap-4">
                  {leases.map((lease) => (
                    <Card key={lease.id} className="p-6 border-none shadow-lg hover:shadow-xl transition-all duration-300" style={{ 
                      backgroundColor: colors.cardBg,
                      borderColor: colors.borderColor
                    }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold mb-1" style={{ color: colors.textPrimary }}>
                            {lease.property_address || strings.leaseAgreement}
                          </h3>
                          {lease.rent_amount && (
                            <p className="mb-2" style={{ color: colors.textSecondary }}>
                              ฿{lease.rent_amount.toLocaleString()}/{strings.month}
                            </p>
                          )}
                          <div className="flex gap-2 text-sm mb-2" style={{ color: colors.textSecondary }}>
                            {lease.language_detected && (
                              <span>• {strings.language}: {lease.language_detected.toUpperCase()}</span>
                            )}
                            {lease.file_urls && lease.file_urls.length > 1 && (
                              <span>• {lease.file_urls.length} {strings.pages}</span>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: colors.textSecondary, opacity: 0.7 }}>
                            {strings.uploaded}: {format(new Date(lease.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getStatusColor(lease.status)}>
                            {lease.status}
                          </Badge>
                          {(lease.status === 'scanned' || lease.status === 'paid') && (
                            <button
                              onClick={() => handleViewDetails(lease)}
                              style={{
                                backgroundColor: '#3B82F6',
                                color: '#FFFFFF',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563EB'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#3B82F6'}
                            >
                              {strings.viewDetails}
                            </button>
                          )}
                        </div>
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
