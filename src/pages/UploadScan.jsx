
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UploadScan() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

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

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

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

      await base44.entities.LeaseScan.create({
        lease_id: lease.id,
        risk_score: scanResult.risk_score,
        flags: scanResult.flags || [],
        summary: scanResult.summary,
        scan_full: scanResult,
        version: '1.0'
      });

      window.location.href = createPageUrl("ScanPreview") + `?leaseId=${lease.id}`;
      
    } catch (err) {
      setError(language === 'th' ? 'การวิเคราะห์ล้มเหลว กรุณาลองอีกครั้ง' : 'Failed to analyze lease. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleViewDetails = (lease) => {
    const scan = scans.find(s => s.lease_id === lease.id);
    if (scan) {
      window.location.href = createPageUrl("ScanPreview") + `?scanId=${scan.id}&leaseId=${lease.id}`;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      uploaded: "bg-amber-100 text-amber-800 border-amber-200",
      scanned: "bg-blue-100 text-blue-800 border-blue-200",
      paid: "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const t = {
    en: {
      title: "Lease Risk Scan",
      subtitle: "AI-powered lease analysis in seconds",
      dragDrop: "Drag and drop your lease document here, or click to browse",
      browseFiles: "Browse Files",
      takePhoto: "Take Photos",
      supportedFormats: "Supported formats: PDF, PNG, JPEG • Max size: 10MB per file • Multiple files allowed",
      uploading: "Uploading Lease...",
      analyzing: "Analyzing Agreement...",
      analyzingDesc: "Our AI is reviewing your lease for potential issues",
      recentScans: "Recent Scans",
      noScansTitle: "No Scans Yet",
      noScansDesc: "Upload your first lease to get started",
      uploadFirst: "Upload Your First Lease",
      pages: "pages",
      uploaded: "Uploaded",
      viewResults: "View Results"
    },
    th: {
      title: "สแกนความเสี่ยงสัญญาเช่า",
      subtitle: "วิเคราะห์สัญญาเช่าด้วย AI ภายในไม่กี่วินาที",
      dragDrop: "ลากและวางเอกสารสัญญาเช่าที่นี่ หรือคลิกเพื่อเรียกดู",
      browseFiles: "เรียกดูไฟล์",
      takePhoto: "ถ่ายรูป",
      supportedFormats: "รองรับ: PDF, PNG, JPEG • ขนาดไม่เกิน 10MB ต่อไฟล์ • อนุญาตหลายไฟล์",
      uploading: "กำลังอัปโหลดสัญญาเช่า...",
      analyzing: "กำลังวิเคราะห์สัญญา...",
      analyzingDesc: "AI กำลังตรวจสอบสัญญาเช่าของคุณเพื่อหาปัญหาที่อาจเกิดขึ้น",
      recentScans: "การสแกนล่าสุด",
      noScansTitle: "ยังไม่มีการสแกน",
      noScansDesc: "อัปโหลดสัญญาเช่าแรกของคุณเพื่อเริ่มต้น",
      uploadFirst: "อัปโหลดสัญญาเช่าแรก",
      pages: "หน้า",
      uploaded: "อัปโหลดแล้ว",
      viewResults: "ดูผลลัพธ์"
    }
  };

  const strings = t[language];

  // Dark mode colors
  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    uploadBg: '#353A3D',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    hoverBg: '#3A3D40'
  } : {
    bg: '#0C3B2E',
    cardBg: '#FFFFFF',
    uploadBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#e2e8f0',
    hoverBg: '#f1f5f9'
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border-2 border-red-200" style={{
            backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2'
          }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <Card className="border-none shadow-xl mb-8" style={{ backgroundColor: colors.cardBg }}>
          <div className="p-8">
            {uploading || analyzing ? (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                  {uploading ? strings.uploading : strings.analyzing}
                </h3>
                <p style={{ color: colors.textSecondary }}>
                  {analyzing ? strings.analyzingDesc : (language === 'th' ? 'กรุณารอสักครู่' : 'Please wait')}
                </p>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleFileSelect}
                className="border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300"
                style={{
                  backgroundColor: dragActive ? (isDarkMode ? '#3A3D40' : '#EFF6FF') : colors.uploadBg,
                  borderColor: dragActive ? '#3B82F6' : colors.borderColor
                }}
              >
                <div className="w-16 h-16 bg-ls-forest rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                
                <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
                  {strings.dragDrop}
                </p>

                <div className="flex gap-4 justify-center flex-wrap">
                  <label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,image/*"
                      className="hidden"
                    />
                    <div
                      style={{
                        backgroundColor: '#0C3B2E',
                        color: '#FFFFFF',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                    >
                      <FileText className="w-5 h-5" />
                      {strings.browseFiles}
                    </div>
                  </label>
                  
                  <label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                    <div
                      style={{
                        backgroundColor: isDarkMode ? '#3A3D40' : '#FFFFFF',
                        color: '#0C3B2E',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        border: '2px solid #0C3B2E',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#0C3B2E';
                        e.target.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = isDarkMode ? '#3A3D40' : '#FFFFFF';
                        e.target.style.color = '#0C3B2E';
                      }}
                    >
                      <Camera className="w-5 h-5" />
                      {strings.takePhoto}
                    </div>
                  </label>
                </div>

                <p className="mt-6 text-sm" style={{ color: colors.textSecondary }}>
                  {strings.supportedFormats}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Scans */}
        {leases.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>{strings.recentScans}</h2>
            <div className="grid gap-4">
              {leases.map((lease) => (
                <Card key={lease.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300" style={{
                  backgroundColor: colors.cardBg
                }}>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold mb-1" style={{ color: colors.textPrimary }}>
                          {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                        </h3>
                        {lease.rent_amount && (
                          <p style={{ color: colors.textSecondary, marginBottom: '8px' }}>
                            ฿{lease.rent_amount.toLocaleString()}/{language === 'th' ? 'เดือน' : 'month'}
                          </p>
                        )}
                        <div className="flex gap-2 text-sm mb-2" style={{ color: colors.textSecondary }}>
                          {lease.language_detected && (
                            <span>• {language === 'th' ? 'ภาษา' : 'Language'}: {lease.language_detected.toUpperCase()}</span>
                          )}
                          {lease.file_urls && lease.file_urls.length > 1 && (
                            <span>• {lease.file_urls.length} {strings.pages}</span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.uploaded}: {format(new Date(lease.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(lease.status)}>
                          {lease.status.toUpperCase()}
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
                            {strings.viewResults}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {leases.length === 0 && !uploading && !analyzing && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.noScansTitle}</h3>
            <p style={{ color: colors.textSecondary }}>{strings.noScansDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
}
