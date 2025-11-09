
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
  Trash2,
  Home, // New Icon
  DollarSign, // New Icon
  Bell, // New Icon
  Edit2, // New Icon
  Save, // New Icon
  Shield, // New Icon
  Eye, // New Icon
  ExternalLink // New Icon
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
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

  // New state for viewing lease details
  const [selectedLease, setSelectedLease] = useState(null);
  const [editingNotice, setEditingNotice] = useState(false);
  const [noticeSettings, setNoticeSettings] = useState({ notice_period_days: 30 });

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

  const { data: allScans = [] } = useQuery({
    queryKey: ['allScans'],
    queryFn: () => base44.entities.LeaseScan.list(),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userTier = user?.plan_tier || 'free';

  // ✅ SCAN LIMIT ENFORCEMENT
  const getScanLimits = () => {
    switch(userTier) {
      case 'free': return { limit: 1, period: 'lifetime', unlimited: false };
      case 'lite': return { limit: 6, period: 'year', unlimited: false };
      case 'protect': return { limit: 12, period: 'year', unlimited: false };
      case 'secure': return { limit: 999, period: 'year', unlimited: true };
      default: return { limit: 1, period: 'lifetime', unlimited: false };
    }
  };

  const canUploadLease = () => {
    const limits = getScanLimits();
    if (limits.unlimited) return { allowed: true, remaining: 999, used: 0, limit: 999, period: limits.period };

    let scannedCount = 0;
    if (limits.period === 'lifetime') {
      scannedCount = leases.filter(l => l.status === 'scanned' || l.status === 'paid').length;
    } else if (limits.period === 'year') {
      const thisYear = new Date().getFullYear();
      scannedCount = leases.filter(l => {
        if (!l.created_date) return false; // Handle cases where created_date might be missing
        const leaseYear = new Date(l.created_date).getFullYear();
        return leaseYear === thisYear && (l.status === 'scanned' || l.status === 'paid');
      }).length;
    }

    return {
      allowed: scannedCount < limits.limit,
      remaining: Math.max(0, limits.limit - scannedCount),
      used: scannedCount,
      limit: limits.limit,
      period: limits.period
    };
  };

  const scanStatus = canUploadLease();

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
      },
      leaseDetails: "Lease Details",
      basicInfo: "Basic Information",
      propertyAddress: "Property Address",
      monthlyRent: "Monthly Rent",
      securityDeposit: "Security Deposit",
      leasePeriod: "Lease Period",
      to: "to",
      noticeSettings: "Notice Settings",
      noticeAlertsEnabled: "Notice Alerts Enabled",
      noticePeriod: "Notice Period (Days)",
      noticeDeadline: "Notice Deadline",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      days: "days",
      riskAnalysis: "Risk Analysis",
      riskScore: "Risk Score",
      viewFullReport: "View Full Report",
      viewScanResults: "View Scan Results",
      viewLease: "View Lease Document",
      closeDetails: "Close Details",
      enableAlertsHelp: "Receive reminders 30, 7, and 3 days before notice deadline",
      deadlineCalculated: "Calculated based on lease end date and notice period",
      allLeases: "All Leases",
      scanLimitReached: "Scan Limit Reached",
      scanLimitMsg: "You've used {used} of {limit} scans {periodText}",
      upgradeForMore: "Upgrade for More Scans",
      scansRemaining: "{remaining} scan(s) remaining {periodText}",
      unlimitedScans: "Unlimited Scans"
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
      noticePeriodHelp: "จำนวนวันก่อนสัญญาหมดอายุที่ต้องแจ้งเจ้าของบ้าน",
      skipReminder: "ข้าม",
      setReminder: "ตั้งการแจ้งเตือน",
      riskLevels: {
        low: "ความเสี่ยงต่ำ",
        medium: "ความเสี่ยงปานกลาง",
        high: "ความเสี่ยงสูง",
        critical: "ความเสี่ยงวิกฤต"
      },
      leaseDetails: "รายละเอียดสัญญาเช่า",
      basicInfo: "ข้อมูลพื้นฐาน",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      monthlyRent: "ค่าเช่ารายเดือน",
      securityDeposit: "เงินมัดจำ",
      leasePeriod: "ระยะเวลาสัญญา",
      to: "ถึง",
      noticeSettings: "การตั้งค่าการแจ้งเตือน",
      noticeAlertsEnabled: "เปิดการแจ้งเตือน",
      noticePeriod: "ระยะเวลาแจ้งล่วงหน้า (วัน)",
      noticeDeadline: "กำหนดแจ้ง",
      edit: "แก้ไข",
      save: "บันทึก",
      cancel: "ยกเลิก",
      days: "วัน",
      riskAnalysis: "การวิเคราะห์ความเสี่ยง",
      riskScore: "คะแนนความเสี่ยง",
      viewFullReport: "ดูรายงานฉบับเต็ม",
      viewScanResults: "ดูผลการสแกน",
      viewLease: "ดูเอกสารสัญญาเช่า",
      closeDetails: "ปิดรายละเอียด",
      enableAlertsHelp: "รับการแจ้งเตือน 30, 7 และ 3 วันก่อนถึงกำหนดแจ้ง",
      deadlineCalculated: "คำนวณจากวันสิ้นสุดสัญญาและระยะเวลาแจ้งล่วงหน้า",
      allLeases: "สัญญาเช่าทั้งหมด",
      scanLimitReached: "ถึงขีดจำกัดการสแกนแล้ว",
      scanLimitMsg: "คุณใช้ไป {used} จาก {limit} การสแกน{periodText}",
      upgradeForMore: "อัปเกรดเพื่อเพิ่มการสแกน",
      scansRemaining: "เหลืออีก {remaining} การสแกน{periodText}",
      unlimitedScans: "สแกนได้ไม่จำกัด"
    }
  }[language];

  const updateLeaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lease.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setEditingNotice(false);
    }
  });

  const handleUploadAll = async () => {
    // ✅ CHECK SCAN LIMIT BEFORE UPLOAD
    if (!scanStatus.allowed) {
      const periodText = scanStatus.period === 'year'
        ? (language === 'th' ? 'ปีนี้' : 'this year')
        : (language === 'th' ? 'ตลอดชีพ' : 'lifetime');

      alert(
        language === 'th'
          ? `คุณใช้ครบโควต้าการสแกนแล้ว (${scanStatus.used}/${scanStatus.limit} ${periodText})\n\nอัปเกรดแผนเพื่อสแกนเพิ่มเติม`
          : `You've reached your scan limit (${scanStatus.used}/${scanStatus.limit} ${periodText})\n\nUpgrade your plan for more scans`
      );
      return;
    }

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
    let createdLeaseId = null;

    const attemptUpload = async () => {
      try {
        setAnalysisStage('uploading');
        setUploadProgress(10);

        const uploadPromises = selectedFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );

        const uploadResults = await Promise.all(uploadPromises);
        const fileUrls = uploadResults.map(result => result.file_url);
        setUploadProgress(30);

        setAnalysisStage('creating');
        setUploadProgress(40);

        const lease = await base44.entities.Lease.create({
          file_url: fileUrls[0],
          file_urls: fileUrls,
          status: 'uploaded'
        });
        createdLeaseId = lease.id;
        setUploadProgress(50);

        setAnalyzing(true);
        setUploading(false);
        setAnalysisStage('scanning');
        setUploadProgress(60);

        const { data: scanResponse } = await base44.functions.invoke('scanLease', {
          fileUrls: fileUrls
        });

        if (!scanResponse || !scanResponse.success) {
          throw new Error(scanResponse?.error || 'Scan failed');
        }

        const scanResult = scanResponse.result;
        setAnalysisStage('extracting');
        setUploadProgress(70);

        await base44.entities.Lease.update(createdLeaseId, {
          status: 'scanned',
          property_address: scanResult.property_address || null,
          start_date: scanResult.start_date || null,
          end_date: scanResult.end_date || null,
          rent_amount: scanResult.rent_amount > 0 ? scanResult.rent_amount : null,
          deposit_amount: scanResult.deposit_amount > 0 ? scanResult.deposit_amount : null,
          language_detected: scanResult.language_detected || 'en'
        });
        setUploadProgress(80);

        setAnalysisStage('finalizing');

        await base44.entities.LeaseScan.create({
          lease_id: createdLeaseId,
          risk_score: scanResult.risk_score,
          flags: scanResult.flags || [],
          summary: scanResult.summary,
          scan_full: scanResult,
          version: '1.0'
        });
        setUploadProgress(100);

        if (scanResult.end_date) {
          setLeaseDetails({
            end_date: scanResult.end_date,
            notice_period_days: scanResult.notice_period_days || 30
          });
          setPendingLeaseId(createdLeaseId);
          setShowConfirmation(true);
        } else {
          // Open details modal instead of navigating
          const updatedLeases = await base44.entities.Lease.filter({ created_by: user?.email }, '-created_date');
          const newLease = updatedLeases.find(l => l.id === createdLeaseId);
          setSelectedLease(newLease);
        }

        setSelectedFiles([]);
        queryClient.invalidateQueries({ queryKey: ['leases'] });
        queryClient.invalidateQueries({ queryKey: ['allScans'] });

      } catch (err) {
        console.error('❌ Upload/Analysis error:', err);

        const isWordDoc = selectedFiles.some(f =>
          f.name.toLowerCase().endsWith('.doc') ||
          f.name.toLowerCase().endsWith('.docx')
        );

        currentRetry++;
        setRetryCount(currentRetry);

        if (currentRetry <= maxRetries) {
          setError(language === 'th'
            ? `เกิดข้อผิดพลาด กำลังลองใหม่... (${currentRetry}/${maxRetries})`
            : `Error occurred. Retrying... (${currentRetry}/${maxRetries})`);

          await new Promise(resolve => setTimeout(resolve, 2000 * currentRetry));

          if (createdLeaseId && analysisStage !== 'uploading') {
            try {
              await base44.entities.Lease.delete(createdLeaseId);
              createdLeaseId = null;
            } catch (cleanupErr) {
              console.error('Failed to cleanup lease:', cleanupErr);
            }
          }

          return attemptUpload();
        } else {
          let errorMessage;

          if (isWordDoc) {
            errorMessage = language === 'th'
              ? 'ไม่สามารถวิเคราะห์ไฟล์ Word ได้\n\n💡 กรุณาลอง:\n• แปลงเป็น PDF ก่อนอัปโหลด\n• ถ่ายภาพหน้าสัญญาแทน\n• เปิดด้วย Google Docs แล้ว Download เป็น PDF'
              : 'Unable to analyze Word document\n\n💡 Please try:\n• Convert to PDF before uploading\n• Take photos of lease pages\n• Open in Google Docs and save as PDF';
          } else if (err.message?.toLowerCase().includes('timeout')) {
            errorMessage = language === 'th'
              ? 'การวิเคราะห์ใช้เวลานานเกินไป\n\n💡 กรุณาลอง:\n• ใช้ไฟล์ที่เล็กกว่า\n• แยกอัปโหลดทีละหน้า\n• ถ่ายภาพที่ชัดเจนกว่า'
              : 'Analysis timed out\n\n💡 Please try:\n• Use smaller files\n• Upload pages separately\n• Take clearer photos';
          } else {
            errorMessage = language === 'th'
              ? 'ไม่สามารถวิเคราะห์ได้\n\n💡 กรุณาตรวจสอบ:\n• ไฟล์เป็นสัญญาเช่าที่อ่านได้\n• ขนาดไฟล์ไม่เกิน 10MB\n• ภาพชัดเจนและอ่านได้'
              : 'Analysis failed\n\n💡 Please check:\n• File is a readable lease agreement\n• File size is under 10MB\n• Images are clear and readable';
          }

          setError(errorMessage);

          if (createdLeaseId) {
            try {
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
      const endDate = new Date(leaseDetails.end_date);
      const deadline = new Date(endDate);
      deadline.setDate(deadline.getDate() - leaseDetails.notice_period_days);

      await base44.entities.Lease.update(pendingLeaseId, {
        notice_period_days: leaseDetails.notice_period_days,
        notice_alerts_enabled: true,
        notice_deadline: deadline.toISOString().split('T')[0]
      });

      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setShowConfirmation(false);

      // Open in modal instead of navigate
      const updatedLeases = await base44.entities.Lease.filter({ created_by: user?.email }, '-created_date');
      const updatedLease = updatedLeases.find(l => l.id === pendingLeaseId);
      setSelectedLease(updatedLease);
    } catch (err) {
      console.error('Failed to update lease details:', err);
      // Still open the modal even if update fails
      const updatedLeases = await base44.entities.Lease.filter({ created_by: user?.email }, '-created_date');
      const updatedLease = updatedLeases.find(l => l.id === pendingLeaseId);
      setSelectedLease(updatedLease);
    }
  };

  const handleSkipConfirmation = async () => {
    setShowConfirmation(false);
    if (pendingLeaseId) {
      const updatedLeases = await base44.entities.Lease.filter({ created_by: user?.email }, '-created_date');
      const skippedLease = updatedLeases.find(l => l.id === pendingLeaseId);
      setSelectedLease(skippedLease);
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
      queryClient.invalidateQueries({ queryKey: ['allScans'] });
      setSelectedLease(null);
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

  const handleViewDetails = (lease) => {
    setSelectedLease(lease);
  };

  const handleFileSelect = (e) => {
    // Only allow file selection if upload is allowed
    if (!scanStatus.allowed) return;
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
    setDragActive(false);
  };

  const handleDrop = (e) => {
    // Only allow drop if upload is allowed
    if (!scanStatus.allowed) return;
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

  const handleToggleAlerts = async (enabled) => {
    await updateLeaseMutation.mutateAsync({
      id: selectedLease.id,
      data: { notice_alerts_enabled: enabled }
    });
    setSelectedLease({ ...selectedLease, notice_alerts_enabled: enabled });
  };

  const handleSaveNoticeSettings = async () => {
    if (!selectedLease.end_date || !noticeSettings.notice_period_days) {
      alert(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
      return;
    }

    const endDate = new Date(selectedLease.end_date);
    const deadline = new Date(endDate);
    deadline.setDate(deadline.getDate() - noticeSettings.notice_period_days);

    await updateLeaseMutation.mutateAsync({
      id: selectedLease.id,
      data: {
        notice_period_days: noticeSettings.notice_period_days,
        notice_deadline: deadline.toISOString().split('T')[0]
      }
    });

    setSelectedLease({
      ...selectedLease,
      notice_period_days: noticeSettings.notice_period_days,
      notice_deadline: deadline.toISOString().split('T')[0]
    });
    setEditingNotice(false);
  };

  const getRiskColor = (score) => {
    if (score >= 75) return '#EF4444'; // Red (Critical)
    if (score >= 50) return '#F59E0B'; // Orange (High)
    if (score >= 25) return '#EAB308'; // Yellow (Medium)
    return '#10B981'; // Green (Low)
  };

  // Get scan for selected lease
  const selectedScan = selectedLease ? allScans.find(s => s.lease_id === selectedLease.id) : null;

  // Check URL params and open lease modal if leaseId is provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const leaseIdFromUrl = urlParams.get('leaseId');

    if (leaseIdFromUrl && leases.length > 0) {
      const leaseToOpen = leases.find(l => l.id === leaseIdFromUrl);
      if (leaseToOpen) {
        setSelectedLease(leaseToOpen);
        // Clear the URL param
        window.history.replaceState({}, '', createPageUrl("UploadScan"));
      }
    }
  }, [leases]);

  const getPeriodText = (period) => {
    if (period === 'year') {
      return language === 'th' ? 'ปีนี้' : 'this year';
    } else if (period === 'lifetime') {
      return language === 'th' ? 'ตลอดชีพ' : 'lifetime';
    }
    return '';
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>

          {/* ✅ SCAN LIMIT INDICATOR */}
          <div className="mt-3">
            {getScanLimits().unlimited ? (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                ✨ {strings.unlimitedScans}
              </Badge>
            ) : (
              <Badge className={scanStatus.allowed ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}>
                {scanStatus.allowed
                  ? strings.scansRemaining
                      .replace('{remaining}', scanStatus.remaining)
                      .replace('{periodText}', getPeriodText(scanStatus.period))
                  : strings.scanLimitMsg
                      .replace('{used}', scanStatus.used)
                      .replace('{limit}', scanStatus.limit)
                      .replace('{periodText}', getPeriodText(scanStatus.period))
                }
              </Badge>
            )}
          </div>
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

        {/* Lease Details Modal */}
        {selectedLease && (
          <Dialog open={!!selectedLease} onOpenChange={() => setSelectedLease(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.cardBg }}>
              <DialogHeader className="sticky top-0 z-10 pb-4" style={{
                backgroundColor: colors.cardBg,
                borderBottom: `1px solid ${colors.borderColor}`
              }}>
                <div className="flex items-center justify-between">
                  <DialogTitle style={{ color: colors.textPrimary }}>{strings.leaseDetails}</DialogTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLease(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Basic Info */}
                <Card className="border-none" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base" style={{ color: colors.textPrimary }}>
                      <Home className="w-4 h-4 text-ls-forest" />
                      {strings.basicInfo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.propertyAddress}</p>
                      <p style={{ color: colors.textPrimary }}>{selectedLease.property_address || 'N/A'}</p>
                    </div>
                    {selectedLease.rent_amount > 0 && (
                      <div>
                        <p className="font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.monthlyRent}</p>
                        <p className="flex items-center" style={{ color: colors.textPrimary }}><DollarSign className="w-4 h-4 mr-1"/>{selectedLease.rent_amount.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedLease.deposit_amount > 0 && (
                      <div>
                        <p className="font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.securityDeposit}</p>
                        <p className="flex items-center" style={{ color: colors.textPrimary }}><DollarSign className="w-4 h-4 mr-1"/>{selectedLease.deposit_amount.toLocaleString()}</p>
                      </div>
                    )}
                    {(selectedLease.start_date || selectedLease.end_date) && (
                      <div>
                        <p className="font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.leasePeriod}</p>
                        <p style={{ color: colors.textPrimary }}>
                          {selectedLease.start_date ? format(new Date(selectedLease.start_date), 'MMM d, yyyy') : 'N/A'} {strings.to} {selectedLease.end_date ? format(new Date(selectedLease.end_date), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notice Settings */}
                <Card className="border-none" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base" style={{ color: colors.textPrimary }}>
                      <Bell className="w-4 h-4 text-ls-forest" />
                      {strings.noticeSettings}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.cardBg }}>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>{strings.noticeAlertsEnabled}</p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>{strings.enableAlertsHelp}</p>
                      </div>
                      <Switch
                        checked={selectedLease.notice_alerts_enabled !== false}
                        onCheckedChange={handleToggleAlerts}
                        disabled={!selectedLease.end_date} // Disable if no end date
                      />
                    </div>

                    {!editingNotice ? (
                      <div className="space-y-3">
                        {selectedLease.end_date && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.noticePeriod}</p>
                              <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                                {selectedLease.notice_period_days || 30} {strings.days}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                              setNoticeSettings({ notice_period_days: selectedLease.notice_period_days || 30 });
                              setEditingNotice(true);
                            }} disabled={!selectedLease.end_date}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              {strings.edit}
                            </Button>
                          </div>
                        )}
                        {selectedLease.notice_deadline && (
                          <div className="p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1E4435' : '#ECFDF5' }}>
                            <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>{strings.noticeDeadline}</p>
                            <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                              {format(new Date(selectedLease.notice_deadline), 'MMMM d, yyyy')}
                            </p>
                            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                                {strings.deadlineCalculated}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                            {strings.noticePeriodLabel}
                          </label>
                          <input
                            type="number"
                            value={noticeSettings.notice_period_days}
                            onChange={(e) => setNoticeSettings({ notice_period_days: parseInt(e.target.value) || 30 })}
                            min="1"
                            max="365"
                            className="w-full p-3 border-2 rounded-lg"
                            style={{
                              backgroundColor: colors.inputBg,
                              borderColor: colors.borderColor,
                              color: colors.textPrimary
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditingNotice(false)} className="flex-1">
                            <X className="w-4 h-4 mr-2" />
                            {strings.cancel}
                          </Button>
                          <Button onClick={handleSaveNoticeSettings} className="flex-1 bg-ls-forest hover:bg-ls-forest/90">
                            <Save className="w-4 h-4 mr-2" />
                            {strings.save}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Risk Analysis */}
                {selectedScan && (
                  <Card className="border-none" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base" style={{ color: colors.textPrimary }}>
                        <Shield className="w-4 h-4 text-ls-forest" />
                        {strings.riskAnalysis}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.riskScore}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold" style={{ color: getRiskColor(selectedScan.risk_score) }}>
                              {selectedScan.risk_score}
                            </span>
                            <span className="text-lg" style={{ color: colors.textSecondary }}>/100</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLease(null);
                              navigate(createPageUrl("ScanPreview") + `?scanId=${selectedScan.id}&leaseId=${selectedLease.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {strings.viewScanResults}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-ls-forest hover:bg-ls-forest/90"
                            onClick={() => {
                              setSelectedLease(null);
                              navigate(createPageUrl("ReportFull") + `?scanId=${selectedScan.id}&leaseId=${selectedLease.id}`);
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {strings.viewFullReport}
                          </Button>
                        </div>
                      </div>
                      {selectedScan.summary && (
                        <p className="text-sm p-3 rounded-lg" style={{
                          backgroundColor: colors.cardBg,
                          color: colors.textSecondary
                        }}>
                          {selectedScan.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t" style={{ borderColor: colors.borderColor }}>
                  {selectedLease.file_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedLease.file_url, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {strings.viewLease}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={(e) => handleDeleteLease(selectedLease.id, e)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'th' ? 'ลบ' : 'Delete'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Upload Zone */}
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
                {/* ✅ SHOW UPGRADE BANNER IF LIMIT REACHED */}
                {!scanStatus.allowed && (
                  <div className="mb-6 p-6 rounded-xl border-2" style={{
                    backgroundColor: isDarkMode ? '#3A2626' : '#FEF2F2',
                    borderColor: '#EF4444'
                  }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2" style={{ color: colors.textPrimary }}>
                          {strings.scanLimitReached}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                          {strings.scanLimitMsg
                            .replace('{used}', scanStatus.used)
                            .replace('{limit}', scanStatus.limit)
                            .replace('{periodText}', getPeriodText(scanStatus.period))}
                        </p>
                        <Button
                          onClick={() => navigate(createPageUrl("Account"))}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {strings.upgradeForMore}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : ''} ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    borderColor: dragActive ? '#3B82F6' : colors.borderColor,
                    backgroundColor: dragActive ? (isDarkMode ? '#1E3A5F' : '#EFF6FF') : 'transparent',
                    pointerEvents: scanStatus.allowed ? 'auto' : 'none'
                  }}
                  onDragEnter={() => scanStatus.allowed && setDragActive(true)}
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
                        disabled={!scanStatus.allowed}
                      />
                      <span
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        disabled={!scanStatus.allowed}
                      />
                      <span
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer border-2 ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      disabled={uploading || !scanStatus.allowed}
                      className={`w-full mt-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : ''}`}
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

        {/* All Leases List */}
        {leases.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              {strings.allLeases} ({leases.length})
            </h2>
            <div className="grid gap-4">
              {leases.map((lease) => (
                <Card
                  key={lease.id}
                  className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => handleViewDetails(lease)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-ls-forest flex-shrink-0" />
                          <h3 className="font-bold text-sm break-words line-clamp-2" style={{
                            color: colors.textPrimary,
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word'
                          }}>
                            {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                          </h3>
                        </div>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {strings.scanDate}: {format(new Date(lease.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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
