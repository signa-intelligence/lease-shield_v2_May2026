
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Camera, X, Image as ImageIcon, Trash2, ExternalLink, Shield, FileVideo, Mail, HelpCircle, CheckSquare, Square } from "lucide-react";
import { format }
from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UploadScanPage() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [leaseDetails, setLeaseDetails] = useState(null);
  const [pendingLeaseId, setPendingLeaseId] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F9FAFB',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#6B7280',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    inputBg: isDarkMode ? '#353A3D' : '#FFFFFF',
  };

  const strings = {
    en: {
      title: "Scan Your Lease",
      subtitle: "Upload your lease agreement for automated analysis",
      uploadArea: "Drop your lease files here or click to browse",
      supportedFormats: "PDF, Word (DOC/DOCX), PNG, JPG (Max 10MB each)",
      selectFiles: "Select Files",
      uploadAll: "Upload & Analyze",
      uploading: "Uploading...",
      analyzingTitle: "Analyzing Your Lease",
      analyzingDesc: "Our system is reviewing your lease agreement. This may take up to 30 seconds...",
      recentScans: "Recent Scans",
      viewAll: "View All Leases",
      noScans: "No recent scans",
      scanDate: "Scanned on",
      confirmNoticeTitle: "Set Notice Period Reminder",
      confirmNoticeDesc: "We detected your lease ends on",
      noticePeriodLabel: "Notice Period (Days)",
      noticePeriodHelp: "Days before lease end to notify landlord",
      skipReminder: "Skip",
      setReminder: "Set Reminder",
      riskLevels: {
        low: "Low Risk",
        medium: "Medium Risk",
        high: "High Risk",
        critical: "Critical Risk"
      }
    },
    th: {
      title: "สแกนสัญญาเช่า",
      subtitle: "อัปโหลดสัญญาเช่าเพื่อวิเคราะห์อัตโนมัติ",
      uploadArea: "วางไฟล์สัญญาเช่าที่นี่ หรือคลิกเพื่อเลือกไฟล์",
      supportedFormats: "รองรับ PDF, Word (DOC/DOCX), PNG, JPG (ไฟล์ละไม่เกิน 10MB)",
      selectFiles: "เลือกไฟล์",
      uploadAll: "อัปโหลดและวิเคราะห์",
      uploading: "กำลังอัปโหลด...",
      analyzingTitle: "กำลังวิเคราะห์สัญญาเช่า",
      analyzingDesc: "ระบบกำลังตรวจสอบสัญญาเช่าของคุณ อาจใช้เวลาประมาณ 30 วินาที...",
      recentScans: "การสแกนล่าสุด",
      viewAll: "ดูสัญญาเช่าทั้งหมด",
      noScans: "ยังไม่มีการสแกน",
      scanDate: "สแกนเมื่อ",
      confirmNoticeTitle: "ตั้งการแจ้งเตือนระยะเวลาแจ้งล่วงหน้า",
      confirmNoticeDesc: "เราตรวจพบว่าสัญญาเช่าของคุณสิ้นสุดวันที่",
      noticePeriodLabel: "ระยะเวลาแจ้งล่วงหน้า (วัน)",
      noticePeriodHelp: "จำนวนวันก่อนสัญญาหมดที่ต้องแจ้งเจ้าของบ้าน",
      skipReminder: "ข้าม",
      setReminder: "ตั้งการแจ้งเตือน",
      riskLevels: {
        low: "ความเสี่ยงต่ำ",
        medium: "ความเสี่ยงปานกลาง",
        high: "ความเสี่ยงสูง",
        critical: "ความเสี่ยงวิกฤต"
      }
    }
  }[language];

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) {
      setError(language === 'th' ? 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' : 'Please select at least one file');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    setRetryCount(0);

    let currentRetry = 0;
    const maxRetries = 3;

    const attemptUpload = async () => {
      try {
        // Upload files
        setUploadProgress(10);
        const uploadPromises = selectedFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );

        const uploadResults = await Promise.all(uploadPromises);
        const fileUrls = uploadResults.map(result => result.file_url);
        setUploadProgress(40);

        // Create lease
        const lease = await base44.entities.Lease.create({
          file_url: fileUrls[0],
          file_urls: fileUrls,
          status: 'uploaded'
        });
        setUploadProgress(50);

        setAnalyzing(true);
        setUploading(false);

        // Analyze with retry logic - Enhanced for Word documents
        let scanResult;
        let analysisRetry = 0;
        const maxAnalysisRetries = 2;

        while (analysisRetry <= maxAnalysisRetries) {
          try {
            // Enhanced prompt with explicit instructions for Word documents
            scanResult = await base44.integrations.Core.InvokeLLM({
              prompt: `Analyze this lease agreement and extract key information. The document may be in PDF, image, or Word (DOC/DOCX) format. 
              
              If this is a Word document, read the full text content and analyze it thoroughly. Identify any potential issues or unfair clauses that could harm the tenant.

              Provide:
              1. A risk score from 0-100 (0 = very safe, 100 = very risky)
              2. List of flags with severity (critical, high, medium, low), category, and description
              3. A summary of the overall lease quality
              4. Extract: property_address, start_date, end_date, rent_amount, deposit_amount, language_detected (en, th, or mixed)
              5. IMPORTANT: Extract notice_period_days - the number of days before lease end that tenant must notify landlord about renewal/termination (common: 30, 45, 60, 90 days). Look for clauses like "notify landlord X days prior to end" or "แจ้งล่วงหน้า X วัน". If not found, return null.
              
              IMPORTANT: If you cannot read the document or it appears blank/corrupted, return a risk_score of 0 and include a flag indicating the document could not be properly analyzed.`,
              file_urls: fileUrls,
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
                  language_detected: { type: "string", enum: ["en", "th", "mixed"] },
                  notice_period_days: { type: ["integer", "null"] }
                }
              }
            });
            
            // Check if analysis indicates document couldn't be read
            if (scanResult.risk_score === 0 && scanResult.summary && (scanResult.summary.toLowerCase().includes('could not') || scanResult.summary.toLowerCase().includes('unable to'))) {
              throw new Error(language === 'th'
                ? 'ไม่สามารถอ่านเอกสารได้ กรุณาลองใช้ไฟล์ PDF หรือรูปภาพแทน'
                : 'Unable to read document. Please try using PDF or image format instead.');
            }
            
            setUploadProgress(80);
            break; // Success, exit retry loop
          } catch (analysisError) {
            console.error(`Analysis attempt ${analysisRetry + 1} failed:`, analysisError);
            analysisRetry++;
            
            if (analysisRetry > maxAnalysisRetries) {
              // Check if it's a Word document specific error
              const isWordDoc = selectedFiles.some(f => 
                f.name.toLowerCase().endsWith('.doc') || 
                f.name.toLowerCase().endsWith('.docx')
              );
              
              if (isWordDoc) {
                throw new Error(language === 'th'
                  ? 'ไม่สามารถวิเคราะห์ไฟล์ Word ได้ กรุณาลองแปลงเป็น PDF หรือถ่ายภาพหน้าสัญญาแทน'
                  : 'Unable to analyze Word document. Please try converting to PDF or take photos of the lease pages instead.');
              }
              
              throw new Error(language === 'th'
                ? 'การวิเคราะห์ล้มเหลว กรุณาตรวจสอบว่าไฟล์ไม่เสียหายและลองอีกครั้ง'
                : 'Analysis failed. Please ensure the file is not corrupted and try again.');
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * analysisRetry));
          }
        }

        await base44.entities.Lease.update(lease.id, {
          status: 'scanned',
          property_address: scanResult.property_address,
          start_date: scanResult.start_date,
          end_date: scanResult.end_date,
          rent_amount: scanResult.rent_amount,
          deposit_amount: scanResult.deposit_amount,
          language_detected: scanResult.language_detected
        });
        setUploadProgress(90);

        await base44.entities.LeaseScan.create({
          lease_id: lease.id,
          risk_score: scanResult.risk_score,
          flags: scanResult.flags || [],
          summary: scanResult.summary,
          scan_full: scanResult,
          version: '1.0'
        });
        setUploadProgress(100);

        // Show confirmation modal
        setLeaseDetails({
          end_date: scanResult.end_date,
          notice_period_days: scanResult.notice_period_days || 30
        });
        setPendingLeaseId(lease.id);
        setShowConfirmation(true);
        setSelectedFiles([]);

      } catch (err) {
        console.error('Upload/Analysis error:', err);
        
        // If this is already a formatted error message, use it directly
        if (err.message && (err.message.includes('Word') || err.message.includes('PDF') || err.message.includes('วิเคราะห์') || err.message.includes('อ่าน'))) {
          setError(err.message);
          setUploading(false);
          setAnalyzing(false);
          setUploadProgress(0);
          return;
        }
        
        currentRetry++;
        setRetryCount(currentRetry);

        if (currentRetry <= maxRetries) {
          // Show retry message
          setError(language === 'th'
            ? `เกิดข้อผิดพลาด กำลังลองใหม่... (${currentRetry}/${maxRetries})`
            : `Error occurred. Retrying... (${currentRetry}/${maxRetries})`);

          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry)));
          return attemptUpload();
        } else {
          // Max retries reached
          let errorMessage = language === 'th'
            ? 'ไม่สามารถอัปโหลดได้ กรุณาตรวจสอบ:\n• ไฟล์ไม่เสียหาย\n• ขนาดไฟล์ไม่เกิน 10MB\n• มีอินเทอร์เน็ตที่เสถียร\n\n💡 เคล็ดลับ: ลองแปลงเป็น PDF หรือถ่ายภาพหน้าสัญญาแทน'
            : 'Upload failed. Please check:\n• File is not corrupted\n• File size is under 10MB\n• Stable internet connection\n\n💡 Tip: Try converting to PDF or take photos of the lease pages instead';

          if (err.message) {
            errorMessage = err.message;
          }

          setError(errorMessage);
        }
      } finally {
        setUploading(false);
        setAnalyzing(false);
        setUploadProgress(0);
      }
    };

    await attemptUpload();
  };

  const handleConfirmLeaseDetails = async () => {
    if (!pendingLeaseId || !leaseDetails) return;

    await base44.entities.Lease.update(pendingLeaseId, {
      notice_period_days: leaseDetails.notice_period_days,
      notice_alerts_enabled: true
    });

    queryClient.invalidateQueries({ queryKey: ['leases'] });
    setShowConfirmation(false);
    navigate(createPageUrl("ScanPreview") + `?leaseId=${pendingLeaseId}`);
  };

  const handleSkipConfirmation = () => {
    setShowConfirmation(false);
    if (pendingLeaseId) {
      navigate(createPageUrl("ScanPreview") + `?leaseId=${pendingLeaseId}`);
    }
  };

  const deleteLeaseWithScanMutation = useMutation({
    mutationFn: async (leaseId) => {
      // First delete any associated scans
      const associatedScans = await base44.entities.LeaseScan.list();
      const scansToDelete = associatedScans.filter(s => s.lease_id === leaseId);
      for (const scan of scansToDelete) {
        await base44.entities.LeaseScan.delete(scan.id);
      }
      // Then delete the lease
      await base44.entities.Lease.delete(leaseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });

  const handleDeleteLease = (leaseId, e) => {
    e.stopPropagation(); // Prevent card onClick from firing
    if (window.confirm(language === 'th'
      ? 'คุณแน่ใจหรือไม่ว่าต้องการลบการสแกนนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้'
      : 'Are you sure you want to delete this scan? This action cannot be undone.')) {
      deleteLeaseWithScanMutation.mutate(leaseId);
    }
  };

  const handleViewDetails = (leaseId) => {
    navigate(createPageUrl("LeaseDetails") + `?leaseId=${leaseId}`);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRetry = () => {
    setError(null);
    setSelectedFiles([]);
  };

  const getRiskColor = (score) => {
    if (score <= 30) return '#10B981';
    if (score <= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getRiskLabel = (score) => {
    if (score <= 30) return strings.riskLevels.low;
    if (score <= 60) return strings.riskLevels.medium;
    if (score <= 80) return strings.riskLevels.high;
    return strings.riskLevels.critical;
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border-2 border-red-200 animate-shake" style={{
            backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2'
          }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 font-semibold mb-1">
                  {language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error Occurred'}
                </p>
                <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
                {retryCount > 0 && retryCount < 3 && (
                  <p className="text-red-500 text-xs mt-2">
                    {language === 'th'
                      ? `🔄 กำลังลองอีกครั้ง... (ครั้งที่ ${retryCount}/3)`
                      : `🔄 Retrying... (Attempt ${retryCount}/3)`}
                  </p>
                )}
              </div>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-800 font-semibold text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Lease Details Confirmation Modal */}
        {showConfirmation && leaseDetails && (
          <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <DialogHeader>
                <DialogTitle style={{ color: colors.textPrimary }}>{strings.confirmNoticeTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p style={{ color: colors.textSecondary }}>
                  {strings.confirmNoticeDesc}: <strong>{leaseDetails.end_date ? format(new Date(leaseDetails.end_date), 'MMM d, yyyy') : 'N/A'}</strong>
                </p>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.noticePeriodLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={leaseDetails.notice_period_days}
                    onChange={(e) => setLeaseDetails({...leaseDetails, notice_period_days: parseInt(e.target.value)})}
                    className="w-full p-3 border-2 rounded-lg"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  />
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {strings.noticePeriodHelp}
                  </p>
                </div>
                <Button 
                  onClick={handleConfirmLeaseDetails} 
                  className="w-full bg-ls-forest hover:bg-ls-forest/90 py-6 text-base font-bold"
                >
                  {strings.setReminder}
                </Button>
                <button
                  onClick={handleSkipConfirmation}
                  className="w-full text-center py-2 text-sm font-medium transition-colors"
                  style={{ color: colors.textSecondary }}
                  onMouseEnter={(e) => e.target.style.color = colors.textPrimary}
                  onMouseLeave={(e) => e.target.style.color = colors.textSecondary}
                >
                  {strings.skipReminder}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <div className="p-6 md:p-8">
            {uploading || analyzing ? (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                  {uploading ? strings.uploading : strings.analyzingTitle}
                </h3>
                <p style={{ color: colors.textSecondary }}>
                  {analyzing ? strings.analyzingDesc : (language === 'th' ? 'กรุณารอสักครู่' : 'Please wait')}
                </p>

                {/* Progress Bar */}
                {uploadProgress > 0 && (
                  <div className="mt-6 max-w-md mx-auto">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                      {uploadProgress}%
                    </p>
                  </div>
                )}

                {retryCount > 0 && (
                  <p className="text-sm mt-4 text-amber-600">
                    {language === 'th'
                      ? `กำลังลองอีกครั้ง... (ครั้งที่ ${retryCount}/3)`
                      : `Retrying... (Attempt ${retryCount}/3)`}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : ''}`}
                  style={{
                    borderColor: dragActive ? '#3B82F6' : colors.borderColor,
                    backgroundColor: dragActive ? (isDarkMode ? '#1E3A5F' : '#EFF6FF') : 'transparent'
                  }}
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
                  <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.uploadArea}
                  </h3>
                  <p className="mb-4" style={{ color: colors.textSecondary }}>{strings.supportedFormats}</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    {/* Document Browse Button */}
                    <label className="inline-block">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="document-upload"
                      />
                      <span
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer"
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF'
                        }}
                      >
                        <FileText className="w-5 h-5" />
                        {language === 'th' ? 'เลือกเอกสาร' : 'Browse Documents'}
                      </span>
                    </label>

                    {/* Photo/Camera Button */}
                    <label className="inline-block">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="photo-upload"
                      />
                      <span
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer border-2"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                          color: '#0C3B2E',
                          borderColor: '#0C3B2E'
                        }}
                      >
                        <Camera className="w-5 h-5" />
                        {language === 'th' ? 'ถ่ายรูป' : 'Take Photos'}
                      </span>
                    </label>
                  </div>

                  <p className="text-xs mt-4" style={{ color: colors.textSecondary }}>
                    {language === 'th' 
                      ? '💡 เคล็ดลับ: ใช้ "เลือกเอกสาร" สำหรับไฟล์ PDF/Word หรือ "ถ่ายรูป" สำหรับถ่ายภาพสัญญา'
                      : '💡 Tip: Use "Browse Documents" for PDF/Word files or "Take Photos" to capture your lease'}
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? 'ไฟล์ที่เลือก' : 'Selected Files'} ({selectedFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6'
                        }}>
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5" style={{ color: colors.textSecondary }} />
                            <div>
                              <p className="font-medium" style={{ color: colors.textPrimary }}>{file.name}</p>
                              <p className="text-sm" style={{ color: colors.textSecondary }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleUploadAll}
                      disabled={uploading}
                      className="w-full mt-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: '#0C3B2E',
                        color: '#FFFFFF'
                      }}
                    >
                      <Upload className="w-5 h-5" />
                      {strings.uploadAll}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Recent Scans */}
        {leases.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{strings.recentScans}</h2>
              <Link to={createPageUrl("Leases")}>
                <Button variant="outline">{strings.viewAll}</Button>
              </Link>
            </div>
            <div className="grid gap-4">
              {leases.slice(0, 3).map((lease) => (
                <Card
                  key={lease.id}
                  className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => handleViewDetails(lease.id)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-ls-forest flex-shrink-0" />
                          <h3 className="font-bold truncate" style={{ color: colors.textPrimary }}>
                            {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                          </h3>
                        </div>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {strings.scanDate}: {format(new Date(lease.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {lease.status === 'scanned' && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {language === 'th' ? 'วิเคราะห์แล้ว' : 'Analyzed'}
                          </Badge>
                        )}
                        <button
                          onClick={(e) => handleDeleteLease(lease.id, e)}
                          disabled={deleteLeaseWithScanMutation.isPending}
                          style={{
                            backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                            color: '#EF4444',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: deleteLeaseWithScanMutation.isPending ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: deleteLeaseWithScanMutation.isPending ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            if (!deleteLeaseWithScanMutation.isPending) {
                              e.target.style.backgroundColor = '#DC2626';
                              e.target.style.color = '#FFFFFF';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.stopPropagation();
                            if (!deleteLeaseWithScanMutation.isPending) {
                              e.target.style.backgroundColor = isDarkMode ? '#3A2626' : '#FEE2E2';
                              e.target.style.color = '#EF4444';
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
