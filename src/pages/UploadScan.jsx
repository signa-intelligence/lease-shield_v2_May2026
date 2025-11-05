import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Camera, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
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
  const [analysisStage, setAnalysisStage] = useState('');
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
      uploading: "Uploading files...",
      analyzingTitle: "Analyzing Your Lease",
      analyzingDesc: "Our AI is reviewing your lease agreement. This may take up to 30 seconds...",
      analyzing: {
        uploading: "Uploading files...",
        creating: "Creating lease record...",
        scanning: "AI analyzing document...",
        extracting: "Extracting lease details...",
        finalizing: "Finalizing analysis..."
      },
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
      uploading: "กำลังอัปโหลดไฟล์...",
      analyzingTitle: "กำลังวิเคราะห์สัญญาเช่า",
      analyzingDesc: "AI กำลังตรวจสอบสัญญาเช่าของคุณ อาจใช้เวลาประมาณ 30 วินาที...",
      analyzing: {
        uploading: "กำลังอัปโหลดไฟล์...",
        creating: "กำลังสร้างบันทึกสัญญาเช่า...",
        scanning: "AI กำลังวิเคราะห์เอกสาร...",
        extracting: "กำลังดึงข้อมูลสัญญาเช่า...",
        finalizing: "กำลังสรุปการวิเคราะห์..."
      },
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
    setAnalysisStage('uploading');

    let currentRetry = 0;
    const maxRetries = 3;
    let createdLeaseId = null; // Track the lease ID we create

    const attemptUpload = async () => {
      try {
        // Step 1: Upload files
        console.log('📤 Step 1: Uploading files...');
        setAnalysisStage('uploading');
        setUploadProgress(10);
        
        const uploadPromises = selectedFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );

        const uploadResults = await Promise.all(uploadPromises);
        const fileUrls = uploadResults.map(result => result.file_url);
        console.log('✅ Files uploaded:', fileUrls.length);
        setUploadProgress(30);

        // Step 2: Create lease record
        console.log('📝 Step 2: Creating lease record...');
        setAnalysisStage('creating');
        setUploadProgress(40);
        
        const lease = await base44.entities.Lease.create({
          file_url: fileUrls[0],
          file_urls: fileUrls,
          status: 'uploaded'
        });
        createdLeaseId = lease.id; // Store the ID
        console.log('✅ Lease created with ID:', createdLeaseId);
        setUploadProgress(50);

        // Step 3: Start AI analysis
        console.log('🤖 Step 3: Starting AI analysis...');
        setAnalyzing(true);
        setUploading(false);
        setAnalysisStage('scanning');
        setUploadProgress(60);

        // Call backend function for scanning
        const { data: scanResponse } = await base44.functions.invoke('scanLease', {
          fileUrls: fileUrls,
          leaseId: createdLeaseId // Use the stored ID
        });

        if (!scanResponse || !scanResponse.success) {
          throw new Error(scanResponse?.error || 'Scan failed - no response from backend');
        }

        const scanResult = scanResponse.result;
        console.log('✅ AI analysis complete. Risk score:', scanResult.risk_score);
        setAnalysisStage('extracting');
        setUploadProgress(80);

        // Step 4: Create scan record
        console.log('💾 Step 4: Saving scan results...');
        setAnalysisStage('finalizing');
        
        await base44.entities.LeaseScan.create({
          lease_id: createdLeaseId, // Use the stored ID
          risk_score: scanResult.risk_score,
          flags: scanResult.flags || [],
          summary: scanResult.summary,
          scan_full: scanResult,
          version: '1.0'
        });
        console.log('✅ Scan record created');
        setUploadProgress(100);

        // Step 5: Show confirmation modal for notice period
        if (scanResult.end_date) {
          setLeaseDetails({
            end_date: scanResult.end_date,
            notice_period_days: scanResult.notice_period_days || 30
          });
          setPendingLeaseId(createdLeaseId);
          setShowConfirmation(true);
        } else {
          // No end date detected, go straight to results
          navigate(createPageUrl("ScanPreview") + `?leaseId=${createdLeaseId}`);
        }
        
        setSelectedFiles([]);
        queryClient.invalidateQueries({ queryKey: ['leases'] });

      } catch (err) {
        console.error('❌ Upload/Analysis error:', err);
        console.error('Error details:', {
          message: err.message,
          leaseId: createdLeaseId,
          retry: currentRetry,
          stage: analysisStage
        });
        
        // Check if it's a Word document specific error
        const isWordDoc = selectedFiles.some(f => 
          f.name.toLowerCase().endsWith('.doc') || 
          f.name.toLowerCase().endsWith('.docx')
        );
        
        currentRetry++;
        setRetryCount(currentRetry);

        if (currentRetry <= maxRetries) {
          // Show retry message
          setError(language === 'th'
            ? `เกิดข้อผิดพลาด กำลังลองใหม่... (${currentRetry}/${maxRetries})`
            : `Error occurred. Retrying... (${currentRetry}/${maxRetries})`);

          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentRetry)));
          
          // If we created a lease but analysis failed, delete it before retrying
          if (createdLeaseId && analysisStage !== 'uploading') {
            try {
              console.log('🗑️ Cleaning up failed lease:', createdLeaseId);
              await base44.entities.Lease.delete(createdLeaseId);
              createdLeaseId = null; // Reset
            } catch (cleanupErr) {
              console.error('Failed to cleanup lease:', cleanupErr);
            }
          }
          
          return attemptUpload();
        } else {
          // Max retries reached - provide helpful error message
          let errorMessage;
          
          if (isWordDoc) {
            errorMessage = language === 'th'
              ? 'ไม่สามารถวิเคราะห์ไฟล์ Word ได้\n\n💡 กรุณาลอง:\n• แปลงเป็น PDF ก่อนอัปโหลด\n• ถ่ายภาพหน้าสัญญาแทน\n• เปิดด้วย Google Docs แล้ว Download เป็น PDF'
              : 'Unable to analyze Word document\n\n💡 Please try:\n• Convert to PDF before uploading\n• Take photos of lease pages\n• Open in Google Docs and save as PDF';
          } else if (err.message?.toLowerCase().includes('timeout') || err.message?.toLowerCase().includes('function execution limit')) {
            errorMessage = language === 'th'
              ? 'การวิเคราะห์ใช้เวลานานเกินไป\n\n💡 กรุณาลอง:\n• ใช้ไฟล์ที่เล็กกว่า\n• แยกอัปโหลดทีละหน้า\n• ถ่ายภาพที่ชัดเจนกว่า'
              : 'Analysis timed out\n\n💡 Please try:\n• Use smaller files\n• Upload pages separately\n• Take clearer photos';
          } else if (err.message?.includes('not Found')) {
            errorMessage = language === 'th'
              ? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล\n\n💡 กรุณา:\n• รีเฟรชหน้าเว็บ\n• ลองอัปโหลดอีกครั้ง\n• หากปัญหายังคงอยู่ ติดต่อฝ่ายสนับสนุน'
              : 'Data saving error occurred\n\n💡 Please:\n• Refresh the page\n• Try uploading again\n• Contact support if issue persists';
          } else {
            errorMessage = language === 'th'
              ? 'ไม่สามารถวิเคราะห์ได้\n\n💡 กรุณาตรวจสอบ:\n• ไฟล์เป็นสัญญาเช่าที่อ่านได้\n• ขนาดไฟล์ไม่เกิน 10MB\n• ภาพชัดเจนและอ่านได้\n\nหรือลองแปลงเป็น PDF'
              : 'Analysis failed\n\n💡 Please check:\n• File is a readable lease agreement\n• File size is under 10MB\n• Images are clear and readable\n\nOr try converting to PDF';
          }

          setError(errorMessage);
          
          // Cleanup failed lease if it exists
          if (createdLeaseId) {
            try {
              console.log('🗑️ Final cleanup of failed lease:', createdLeaseId);
              await base44.entities.Lease.delete(createdLeaseId);
            } catch (cleanupErr) {
              console.error('Failed final cleanup:', cleanupErr);
            }
          }
        }
      } finally {
        setUploading(false);
        setAnalyzing(false);
        setUploadProgress(0);
        setAnalysisStage('');
      }
    };

    await attemptUpload();
  };

  const handleConfirmLeaseDetails = async () => {
    if (!pendingLeaseId || !leaseDetails) return;

    try {
      await base44.entities.Lease.update(pendingLeaseId, {
        notice_period_days: leaseDetails.notice_period_days,
        notice_alerts_enabled: true
      });

      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setShowConfirmation(false);
      navigate(createPageUrl("ScanPreview") + `?leaseId=${pendingLeaseId}`);
    } catch (err) {
      console.error('Failed to update lease details:', err);
      // Still navigate even if update fails
      navigate(createPageUrl("ScanPreview") + `?leaseId=${pendingLeaseId}`);
    }
  };

  const handleSkipConfirmation = () => {
    setShowConfirmation(false);
    if (pendingLeaseId) {
      navigate(createPageUrl("ScanPreview") + `?leaseId=${pendingLeaseId}`);
    }
  };

  const deleteLeaseWithScanMutation = useMutation({
    mutationFn: async (leaseId) => {
      const associatedScans = await base44.entities.LeaseScan.filter({ lease_id: leaseId });
      for (const scan of associatedScans) {
        await base44.entities.LeaseScan.delete(scan.id);
      }
      await base44.entities.Lease.delete(leaseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });

  const handleDeleteLease = (leaseId, e) => {
    e.stopPropagation();
    
    const confirmMessage = language === 'th'
      ? 'คุณแน่ใจหรือไม่ว่าต้องการลบการสแกนนี้?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้'
      : 'Are you sure you want to delete this scan?\n\nThis action cannot be undone.';
    
    const userConfirmed = window.confirm(confirmMessage);
    
    if (userConfirmed) {
      deleteLeaseWithScanMutation.mutate(leaseId);
    }
  };

  const handleViewDetails = (leaseId) => {
    navigate(createPageUrl("LeaseDetails") + `?leaseId=${leaseId}`);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
    setDragActive(false);
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
    setUploadProgress(0);
    setRetryCount(0);
    setAnalysisStage('');
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
                  {analyzing ? strings.analyzingTitle : strings.uploading}
                </h3>
                <p className="mb-4" style={{ color: colors.textSecondary }}>
                  {analyzing ? strings.analyzingDesc : (language === 'th' ? 'กรุณารอสักครู่' : 'Please wait')}
                </p>
                
                {/* Current Stage Indicator */}
                {analysisStage && (
                  <p className="text-sm font-medium mb-4" style={{ color: '#3B82F6' }}>
                    {strings.analyzing[analysisStage] || analysisStage}
                  </p>
                )}

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