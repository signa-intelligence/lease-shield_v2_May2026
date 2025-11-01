
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Camera, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { format } = from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UploadScan() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); // New state for upload progress
  const [retryCount, setRetryCount] = useState(0); // New state for retry count
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [leaseDetails, setLeaseDetails] = useState(null);
  const [pendingLeaseId, setPendingLeaseId] = useState(null);
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

  const { data: scans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: async () => {
      const allScans = await base44.entities.LeaseScan.list();
      return allScans.filter(s => leases.some(l => l.id === s.lease_id));
    },
    enabled: !!user && leases.length > 0,
  });

  const deleteLeaseMutation = useMutation({
    mutationFn: async (leaseId) => {
      const associatedScan = scans.find(s => s.lease_id === leaseId);
      if (associatedScan) {
        await base44.entities.LeaseScan.delete(associatedScan.id);
      }
      await base44.entities.Lease.delete(leaseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
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

  const handleFileSelect = (e) => {
    e.preventDefault();
    setDragActive(false);
    setError(null); // Clear error on new file selection

    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file =>
      file.type.includes('pdf') || file.type.includes('image')
    );

    if (validFiles.length === 0) {
      setError(language === 'th' ? 'กรุณาอัปโหลดไฟล์ PDF หรือรูปภาพ' : 'Please upload PDF or image files');
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

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
    const maxRetries = 3; // Max retries for the entire upload/analysis process

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

        // Analyze with retry logic
        let scanResult;
        let analysisRetry = 0;
        const maxAnalysisRetries = 2; // Max retries for the LLM invocation specifically

        while (analysisRetry <= maxAnalysisRetries) {
          try {
            scanResult = await base44.integrations.Core.InvokeLLM({
              prompt: `Analyze this lease agreement and extract key information. Identify any potential issues or unfair clauses that could harm the tenant.

              Provide:
              1. A risk score from 0-100 (0 = very safe, 100 = very risky)
              2. List of flags with severity (critical, high, medium, low), category, and description
              3. A summary of the overall lease quality
              4. Extract: property_address, start_date, end_date, rent_amount, deposit_amount, language_detected (en, th, or mixed)
              5. IMPORTANT: Extract notice_period_days - the number of days before lease end that tenant must notify landlord about renewal/termination (common: 30, 45, 60, 90 days). Look for clauses like "notify landlord X days prior to end" or "แจ้งล่วงหน้า X วัน". If not found, return null.`,
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
            setUploadProgress(80);
            break; // Success, exit retry loop
          } catch (analysisError) {
            analysisRetry++;
            if (analysisRetry > maxAnalysisRetries) {
              throw new Error(language === 'th'
                ? 'การวิเคราะห์ล้มเหลว กรุณาลองอีกครั้งภายหลัง'
                : 'Analysis failed. Please try again later.');
            }
            // Wait before retry with exponential backoff
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

        // Show confirmation modal for lease details
        setLeaseDetails({
          end_date: scanResult.end_date,
          notice_period_days: scanResult.notice_period_days || 30
        });
        setPendingLeaseId(lease.id);
        setShowConfirmation(true);
        setSelectedFiles([]); // Clear selected files after successful upload and analysis

      } catch (err) {
        currentRetry++;
        setRetryCount(currentRetry);

        if (currentRetry <= maxRetries) {
          // Show retry message
          setError(language === 'th'
            ? `เกิดข้อผิดพลาด กำลังลองใหม่... (${currentRetry}/${maxRetries})`
            : `Error occurred. Retrying... (${currentRetry}/${maxRetries})`);

          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry)));
          return attemptUpload(); // Recursive call for retry
        } else {
          // Max retries reached
          console.error('Upload failed after retries:', err);

          let errorMessage = language === 'th'
            ? 'ไม่สามารถอัปโหลดได้ กรุณาตรวจสอบ:\n• ไฟล์ไม่เสียหาย\n• ขนาดไฟล์ไม่เกิน 10MB\n• มีอินเทอร์เน็ตที่เสถียร'
            : 'Upload failed. Please check:\n• File is not corrupted\n• File size is under 10MB\n• Stable internet connection';

          if (err.message.includes('Analysis failed')) {
            errorMessage = err.message;
          } else if (err.message.toLowerCase().includes('file')) {
            errorMessage = language === 'th'
              ? 'ไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ PDF หรือรูปภาพเท่านั้น'
              : 'Invalid file. Please use PDF or image files only.';
          }

          setError(errorMessage);
        }
      } finally {
        setUploading(false);
        setAnalyzing(false);
        setUploadProgress(0); // Reset progress on completion/failure
      }
    };

    await attemptUpload();
  };

  const handleConfirmLeaseDetails = async () => {
    try {
      if (!leaseDetails.end_date) {
        alert(language === 'th' ? 'กรุณาระบุวันสิ้นสุดสัญญา' : 'Please enter lease end date');
        return;
      }

      // Calculate notice deadline
      const endDate = new Date(leaseDetails.end_date);
      const noticeDeadline = new Date(endDate);
      noticeDeadline.setDate(noticeDeadline.getDate() - leaseDetails.notice_period_days);

      await base44.entities.Lease.update(pendingLeaseId, {
        notice_period_days: leaseDetails.notice_period_days,
        notice_deadline: noticeDeadline.toISOString().split('T')[0],
        notice_alerts_enabled: true
      });

      await queryClient.invalidateQueries({ queryKey: ['leases'] });
      await queryClient.invalidateQueries({ queryKey: ['scans'] });

      navigate(createPageUrl("LeaseDetails") + `?leaseId=${pendingLeaseId}`);
    } catch (err) {
      console.error('Failed to save lease details:', err);
      alert(language === 'th' ? 'ไม่สามารถบันทึกข้อมูลได้' : 'Failed to save details');
    } finally {
      setShowConfirmation(false);
      setPendingLeaseId(null);
      setLeaseDetails(null);
    }
  };

  const handleSkipConfirmation = async () => {
    await queryClient.invalidateQueries({ queryKey: ['leases'] });
    await queryClient.invalidateQueries({ queryKey: ['scans'] });
    navigate(createPageUrl("LeaseDetails") + `?leaseId=${pendingLeaseId}`);
    setShowConfirmation(false);
    setPendingLeaseId(null);
    setLeaseDetails(null);
  };

  const handleViewDetails = (lease) => {
    const scan = scans.find(s => s.lease_id === lease.id);
    if (scan) {
      navigate(createPageUrl("ScanPreview") + `?scanId=${scan.id}&leaseId=${lease.id}`);
    }
  };

  const handleDeleteLease = async (leaseId, leaseName) => {
    const confirmMessage = language === 'th'
      ? `ลบ ${leaseName}?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`
      : `Delete ${leaseName}?\n\nThis action cannot be undone.`;

    if (confirm(confirmMessage)) {
      await deleteLeaseMutation.mutateAsync(leaseId);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSelectedFiles([]);
    setRetryCount(0); // Reset retry count as well
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
      subtitle: "Lease analysis in seconds",
      dragDrop: "Drag and drop your lease pages here, or click to browse",
      browseFiles: "Browse Files",
      scanDocument: "Scan Document",
      supportedFormats: "Supported formats: PDF, PNG, JPEG • Max size: 10MB per file",
      filesSelected: "files selected",
      removeFile: "Remove",
      uploadAll: "Upload & Analyze",
      uploading: "Uploading Lease...",
      analyzingTitle: "Analyzing Agreement...",
      analyzingDesc: "Your lease will be reviewed for potential issues...stand by",
      recentScans: "Recent Scans",
      noScansTitle: "No Scans Yet",
      noScansDesc: "Upload your first lease to get started",
      uploadFirst: "Upload Your First Lease",
      pages: "pages",
      uploaded: "Uploaded",
      viewResults: "View Results",
      viewDetails: "View Details",
      selectAtLeast: "Select at least one file to upload",
      delete: "Delete",
      deleting: "Deleting...",
      manage: "Manage",
      errorOccurred: "Error Occurred",
      retrying: "Retrying...",
      pleaseSelectFile: "Please select at least one file",
      errorRetryGeneric: "Error occurred. Retrying... (Attempt {currentRetry}/{maxRetries})",
      uploadFailedGeneric: "Upload failed. Please check:\n• File is not corrupted\n• File size is under 10MB\n• Stable internet connection",
      analysisFailedSpecific: "Analysis failed. Please try again later.",
      invalidFileSpecific: "Invalid file. Please use PDF or image files only.",
    },
    th: {
      title: "สแกนความเสี่ยงสัญญาเช่า",
      subtitle: "วิเคราะห์สัญญาเช่าภายในไม่กี่วินาที",
      dragDrop: "ลากและวางหน้าสัญญาเช่าที่นี่ หรือคลิกเพื่อเรียกดู",
      browseFiles: "เรียกดูไฟล์",
      scanDocument: "สแกนเอกสาร",
      supportedFormats: "รองรับ: PDF, PNG, JPEG • ขนาดไม่เกิน 10MB ต่อไฟล์",
      filesSelected: "ไฟล์ที่เลือก",
      removeFile: "ลบ",
      uploadAll: "อัปโหลดและวิเคราะห์",
      uploading: "กำลังอัปโหลดสัญญาเช่า...",
      analyzingTitle: "กำลังวิเคราะห์สัญญา...",
      analyzingDesc: "สัญญาเช่าของคุณจะได้รับการตรวจสอบเพื่อหาปัญหาที่อาจเกิดขึ้น...กรุณารอสักครู่",
      recentScans: "การสแกนล่าสุด",
      noScansTitle: "ยังไม่มีการสแกน",
      noScansDesc: "อัปโหลดสัญญาเช่าแรกของคุณเพื่อเริ่มต้น",
      uploadFirst: "อัปโหลดสัญญาเช่าแรก",
      pages: "หน้า",
      uploaded: "อัปโหลดแล้ว",
      viewResults: "ดูผลลัพธ์",
      viewDetails: "ดูรายละเอียด",
      selectAtLeast: "เลือกไฟล์อย่างน้อยหนึ่งไฟล์เพื่ออัปโหลด",
      delete: "ลบ",
      deleting: "กำลังลบ...",
      manage: "จัดการ",
      errorOccurred: "เกิดข้อผิดพลาด",
      retrying: "กำลังลองใหม่...",
      pleaseSelectFile: "กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์",
      errorRetryGeneric: "เกิดข้อผิดพลาด กำลังลองใหม่... (ครั้งที่ {currentRetry}/{maxRetries})",
      uploadFailedGeneric: "ไม่สามารถอัปโหลดได้ กรุณาตรวจสอบ:\n• ไฟล์ไม่เสียหาย\n• ขนาดไฟล์ไม่เกิน 10MB\n• มีอินเทอร์เน็ตที่เสถียร",
      analysisFailedSpecific: "การวิเคราะห์ล้มเหลว กรุณาลองอีกครั้งภายหลัง",
      invalidFileSpecific: "ไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ PDF หรือรูปภาพเท่านั้น",
    }
  };

  const strings = t[language];

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    uploadBg: '#353A3D',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    hoverBg: '#3A3D40'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    uploadBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    hoverBg: '#F1F5F9'
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p className="text-sm md:text-base" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border-2 border-red-200 animate-shake" style={{
            backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2'
          }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 font-semibold mb-1">
                  {strings.errorOccurred}
                </p>
                <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
                {retryCount > 0 && retryCount <= 3 && ( // Show retry message if retrying and not past max attempts
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl shadow-2xl max-w-lg w-full p-6" style={{ backgroundColor: colors.cardBg }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                {language === 'th' ? '📋 ยืนยันรายละเอียดสัญญา' : '📋 Confirm Lease Details'}
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {language === 'th' ? 'วันสิ้นสุดสัญญา' : 'Lease End Date'}
                  </label>
                  <input
                    type="date"
                    value={leaseDetails.end_date || ''}
                    onChange={(e) => setLeaseDetails({...leaseDetails, end_date: e.target.value})}
                    className="w-full p-3 border-2 rounded-lg"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {language === 'th' ? 'ระยะเวลาแจ้งล่วงหน้า (วัน)' : 'Notice Period (Days)'}
                  </label>
                  <input
                    type="number"
                    value={leaseDetails.notice_period_days}
                    onChange={(e) => setLeaseDetails({...leaseDetails, notice_period_days: parseInt(e.target.value) || 30})}
                    min="1"
                    max="365"
                    className="w-full p-3 border-2 rounded-lg"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {language === 'th'
                      ? 'จำนวนวันที่ต้องแจ้งเจ้าของบ้านก่อนสัญญาหมดอายุ'
                      : 'Days before lease end you must notify landlord'}
                  </p>
                </div>

                {leaseDetails.end_date && leaseDetails.notice_period_days && (
                  <div className="p-4 rounded-lg border-2" style={{
                    backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5',
                    borderColor: isDarkMode ? '#10B981' : '#A7F3D0'
                  }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
                      {language === 'th' ? '📅 กำหนดแจ้ง:' : '📅 Notice Deadline:'}
                    </p>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                      {new Date(new Date(leaseDetails.end_date).getTime() - leaseDetails.notice_period_days * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                    <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                      {language === 'th'
                        ? 'เราจะส่งการแจ้งเตือนก่อนถึงกำหนดนี้'
                        : "We'll send reminders before this date"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSkipConfirmation}
                  style={{
                    flex: 1,
                    backgroundColor: colors.bg,
                    color: colors.textPrimary,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${colors.borderColor}`,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {language === 'th' ? 'ข้าม' : 'Skip'}
                </button>
                <button
                  onClick={handleConfirmLeaseDetails}
                  style={{
                    flex: 2,
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {language === 'th' ? '✅ ยืนยันและบันทึก' : '✅ Confirm & Save'}
                </button>
              </div>
            </div>
          </div>
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
                      ? `กำลังลองใหม่... (ครั้งที่ ${retryCount}/3)`
                      : `Retrying... (Attempt ${retryCount}/3)`}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleFileSelect}
                  className="border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-300"
                  style={{
                    backgroundColor: dragActive ? (isDarkMode ? '#3A3D40' : '#EFF6FF') : colors.uploadBg,
                    borderColor: dragActive ? '#3B82F6' : colors.borderColor
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{
                      backgroundColor: '#0C3B2E',
                      boxShadow: '0 4px 6px -1px rgba(12, 59, 46, 0.3), 0 2px 4px -1px rgba(12, 59, 46, 0.2)'
                    }}
                  >
                    <Upload className="w-10 h-10 text-white" style={{ color: '#FFFFFF' }} />
                  </div>

                  <p className="text-base md:text-lg mb-6" style={{ color: colors.textSecondary }}>
                    {strings.dragDrop}
                  </p>

                  <div className="flex gap-3 justify-center flex-wrap">
                    <label>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,image/*"
                        multiple
                        className="hidden"
                      />
                      <div
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#0a2f25';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#0C3B2E';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <FileText className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                        {strings.browseFiles}
                      </div>
                    </label>

                    <label>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="hidden"
                      />
                      <div
                        style={{
                          backgroundColor: isDarkMode ? '#3A3D40' : '#FFFFFF',
                          color: '#0C3B2E',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '14px',
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
                        <Camera className="w-4 h-4" />
                        {strings.scanDocument}
                      </div>
                    </label>
                  </div>

                  <p className="mt-6 text-xs md:text-sm" style={{ color: colors.textSecondary }}>
                    {strings.supportedFormats}
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-sm md:text-base" style={{ color: colors.textPrimary }}>
                        {selectedFiles.length} {strings.filesSelected}
                      </p>
                      <Button
                        onClick={handleUploadAll}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {strings.uploadAll}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="relative p-3 rounded-lg border-2"
                          style={{
                            backgroundColor: colors.uploadBg,
                            borderColor: colors.borderColor
                          }}
                        >
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            style={{ zIndex: 10 }}
                          >
                            <X className="w-3 h-3" />
                          </button>

                          <div className="flex flex-col items-center">
                            {file.type.includes('image') ? (
                              <ImageIcon className="w-8 h-8 text-blue-500 mb-2" />
                            ) : (
                              <FileText className="w-8 h-8 text-red-500 mb-2" />
                            )}
                            <p className="text-xs text-center truncate w-full" style={{ color: colors.textPrimary }}>
                              {file.name}
                            </p>
                            <p className="text-xs" style={{ color: colors.textSecondary }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {leases.length > 0 && (
          <div>
            <h2 className="text-lg md:text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>{strings.recentScans}</h2>
            <div className="grid gap-4">
              {leases.map((lease) => (
                <Card key={lease.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300" style={{
                  backgroundColor: colors.cardBg
                }}>
                  <div className="p-4">
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-sm leading-tight flex-1" style={{
                          color: colors.textPrimary,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                          maxWidth: '70%'
                        }}>
                          {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                        </h3>
                        <Badge className={`${getStatusColor(lease.status)} flex-shrink-0 text-xs`}>
                          {lease.status.toUpperCase()}
                        </Badge>
                      </div>

                      {lease.rent_amount && (
                        <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                          ฿{lease.rent_amount.toLocaleString()}/{language === 'th' ? 'เดือน' : 'month'}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs mb-2" style={{ color: colors.textSecondary }}>
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

                    <div className="flex gap-2 pt-3 border-t" style={{ borderColor: colors.borderColor }}>
                      {(lease.status === 'scanned' || lease.status === 'paid') && (
                        <>
                          <button
                            onClick={() => navigate(createPageUrl("LeaseDetails") + `?leaseId=${lease.id}`)}
                            className="flex-1"
                            style={{
                              backgroundColor: '#0C3B2E',
                              color: '#FFFFFF',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                          >
                            <FileText className="w-4 h-4" />
                            <span>{strings.manage}</span>
                          </button>
                          <button
                            onClick={() => handleViewDetails(lease)}
                            className="flex-shrink-0"
                            style={{
                              backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                              color: '#3B82F6',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: '2px solid #3B82F6',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              minWidth: '80px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#3B82F6';
                              e.target.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#FFFFFF';
                              e.target.style.color = '#3B82F6';
                            }}
                          >
                            <span>{strings.viewDetails}</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteLease(
                          lease.id,
                          lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease')
                        )}
                        disabled={deleteLeaseMutation.isLoading}
                        className={!(lease.status === 'scanned' || lease.status === 'paid') ? 'flex-1' : 'flex-shrink-0'}
                        style={{
                          backgroundColor: isDarkMode ? '#3A2626' : '#FFFFFF',
                          color: '#EF4444',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          border: '2px solid #EF4444',
                          cursor: deleteLeaseMutation.isLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: deleteLeaseMutation.isLoading ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          minWidth: '80px'
                        }}
                        onMouseEnter={(e) => {
                          if (!deleteLeaseMutation.isLoading) {
                            e.target.style.backgroundColor = '#FEE2E2';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!deleteLeaseMutation.isLoading) {
                            e.target.style.backgroundColor = isDarkMode ? '#3A2626' : '#FFFFFF';
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{deleteLeaseMutation.isLoading ? strings.deleting : strings.delete}</span>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {leases.length === 0 && !uploading && !analyzing && selectedFiles.length === 0 && (
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
