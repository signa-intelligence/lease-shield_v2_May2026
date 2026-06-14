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
  Home,
  Bell,
  Edit2,
  Save,
  Shield,
  Lock,
  Scissors,
  Eye,
  ExternalLink,
  Copy,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import UploadProgress from "../components/shared/UploadProgress";
import { haptic } from "../components/shared/HapticFeedback";
import SwipeToDelete from "../components/shared/SwipeToDelete";
import AuthGuard from "../components/shared/AuthGuard";
import { FEATURE_COLORS } from "../components/shared/featureTheme";
import TrustBadge from "../components/shared/TrustBadge";
import { generateRequestId, normalizeFiles, preflightCheck } from "../components/shared/FileNormalizer";
import { formatErrorForUser, createDebugLog } from "../components/shared/ErrorCategorizer";
import { getDeviceContext } from "../components/shared/DeviceContext";
import { uploadFileWithSession, uploadMultipleFiles, getUploadTimeout } from "../components/shared/MobileUploader";
import RetryAnalysis from "../components/shared/RetryAnalysis";
import ScanReviewConfirmation from "../components/scan/ScanReviewConfirmation";
import ScanErrorDisplay from "../components/scan/ScanErrorDisplay";
import MissingCriticalClauses from "../components/leases/MissingCriticalClauses";
import uploadScanStrings from "../components/scan/uploadScanStrings.jsx";
import DisclaimerModal from "../components/scan/DisclaimerModal";

function UploadScanPageContent() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [debugLog, setDebugLog] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cumulativeProgress, setCumulativeProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [leaseDetails, setLeaseDetails] = useState(null);
  const [pendingLeaseId, setPendingLeaseId] = useState(null);
  const [analysisStage, setAnalysisStage] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchResults, setBatchResults] = useState([]);
  const [selectedLease, setSelectedLease] = useState(null);
  const [editingNotice, setEditingNotice] = useState(false);
  const [noticeSettings, setNoticeSettings] = useState({ notice_period_days: 30 });
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentToView, setDocumentToView] = useState(null);
  const [showPostScanHint, setShowPostScanHint] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const pendingDisclaimerFiles = React.useRef(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedLeaseId, setCompletedLeaseId] = useState(null);
  const [addingPagesToLease, setAddingPagesToLease] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [savingConfirmedData, setSavingConfirmedData] = useState(false);
  const fileInputRef = React.useRef(null);

  const queryClient = useQueryClient();

  // Upload URL validation & preflight helpers
  const isValidPublicUrl = (url) => {
    return (
      typeof url === 'string' &&
      url.startsWith('https://') &&
      url.length > 20 &&
      !/[\[\]\(\)]/.test(url)
    );
  };
  const safeStringify = (obj) => {
    try { return JSON.stringify(obj).slice(0, 2000); } catch (e) { try { return String(obj).slice(0,2000); } catch { return '[unserializable]'; } }
  };
  const preflightUrl = async (url) => {
    try {
      let res = await fetch(url, { method: 'HEAD' });
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, { method: 'GET' });
      }
      return res.status;
    } catch {
      return 0;
    }
  };

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ 
      owner_email: user?.email,
      status: { $ne: 'deleted' }
    }, '-created_date'),
    enabled: !!user,
    initialData: [],
    refetchInterval: (query) => {
      // Poll every 5 seconds if any lease is in pending/queued/processing state
      const data = query.state.data || [];
      const hasPendingScans = data.some(l => 
        l.status === 'uploaded' || 
        l.status === 'queued' || 
        l.status === 'processing'
      );
      return hasPendingScans ? 5000 : false;
    }
  });

  const { data: allScans = [] } = useQuery({
    queryKey: ['allScans'],
    queryFn: () => base44.entities.LeaseScan.list(),
    enabled: !!user,
    refetchOnMount: 'always',
    staleTime: 0
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const userTier = user?.plan_tier || 'explorer';

  // ✅ SCAN LIMIT ENFORCEMENT (annual + monthly caps for Secure)
  const getScanLimits = () => {
    switch(userTier) {
      case 'explorer': return { limit: 1, period: 'lifetime', unlimited: false, monthlyMax: 0 };
      case 'lite': return { limit: 6, period: 'year', unlimited: false, monthlyMax: 0 };
      case 'protect': return { limit: 12, period: 'year', unlimited: false, monthlyMax: 0 };
      case 'secure': return { limit: 50, period: 'year', unlimited: false, monthlyMax: 10 };
      default: return { limit: 1, period: 'lifetime', unlimited: false, monthlyMax: 0 };
    }
  };
  const canUploadLease = () => {
    const limits = getScanLimits();
    const availableScans = user?.available_scans ?? 0;
    const used = Math.max(0, limits.limit - availableScans);
    let monthlyBlocked = false, monthlyUsed = 0;
    if (limits.monthlyMax > 0) {
      const cm = new Date().toISOString().slice(0, 7);
      monthlyUsed = user?.usage_month === cm ? (user?.scans_used_this_month || 0) : 0;
      monthlyBlocked = monthlyUsed >= limits.monthlyMax;
    }
    return { allowed: availableScans > 0 && !monthlyBlocked, remaining: availableScans, used, limit: limits.limit, period: limits.period, monthlyBlocked, monthlyUsed, monthlyMax: limits.monthlyMax };
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

  const strings = (uploadScanStrings[language] || uploadScanStrings.en);

  const updateLeaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lease.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setEditingNotice(false);
    }
  });

  const handleAcceptDisclaimer = async () => {
    setShowDisclaimerModal(false);
    
    // Save acceptance to user profile
    await base44.auth.updateMe({ scan_disclaimer_accepted: true });
    queryClient.invalidateQueries({ queryKey: ['user'] });
    
    // Immediately proceed with the files that were pending
    const files = pendingDisclaimerFiles.current;
    pendingDisclaimerFiles.current = null;
    if (files && files.length > 0) {
      proceedWithUpload(files);
    }
  };

  const proceedWithUpload = async (filesToUpload) => {
    // Reset post-scan hint at the start of a new upload attempt
    setShowPostScanHint(false);
    
    // Validate files
    if (!filesToUpload || filesToUpload.length === 0) {
      setError(language === 'th' ? 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' : 'Please select at least one file');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // ✅ RATE LIMIT CHECK: Prevent spam uploads (max 20 uploads/hour)
    try {
      const rateLimitResponse = await base44.functions.invoke('checkRateLimit', {
        actionType: 'upload',
        windowMinutes: 60
      });
      
      const rateLimitResult = rateLimitResponse?.data;
      
      if (rateLimitResult && !rateLimitResult.allowed) {
        const retryMinutes = rateLimitResult.retryAfterMinutes || 1;
        const errorMsg = language === 'th'
          ? `ถึงขีดจำกัดการอัปโหลดแล้ว\n\nคุณสามารถอัปโหลดได้อีกครั้งใน ${retryMinutes} นาที\n\nขีดจำกัด: ${rateLimitResult.limit} ไฟล์ต่อชั่วโมง`
          : `Upload limit reached\n\nYou can upload again in ${retryMinutes} minute${retryMinutes !== 1 ? 's' : ''}\n\nLimit: ${rateLimitResult.limit} uploads per hour`;
        
        alert(errorMsg);
        return;
      }
      
      console.log('[UPLOAD_RATE_LIMIT_PASSED]', {
        remaining: rateLimitResult?.remaining,
        limit: rateLimitResult?.limit
      });
    } catch (rateLimitErr) {
      // Fail open - don't block on rate limit errors
      console.warn('[UPLOAD_RATE_LIMIT_CHECK_FAILED]', rateLimitErr);
    }
    
    // ✅ CRITICAL: CHECK SCAN LIMIT (annual + monthly caps)
    const scanCheck = canUploadLease();
    
    if (!scanCheck.allowed) {
      if (scanCheck.monthlyBlocked) {
        alert(language === 'th'
          ? `ถึงขีดจำกัดการสแกนรายเดือนแล้ว (${scanCheck.monthlyUsed}/${scanCheck.monthlyMax})\n\nรีเซ็ตเดือนหน้า`
          : `Monthly scan limit reached (${scanCheck.monthlyUsed}/${scanCheck.monthlyMax})\n\nResets next month`);
      } else {
        alert(language === 'th'
          ? `คุณใช้ครบโควต้าการสแกนแล้ว\n\nอัปเกรดแผนเพื่อสแกนเพิ่มเติม`
          : `You've reached your scan limit (0 remaining)\n\nUpgrade your plan for more scans`);
      }
      return;
    }
    
    // Update state for UI display
    setSelectedFiles(filesToUpload);
    
    // Reset cumulative progress for new upload
    setCumulativeProgress(0);
    
    // Generate unique request ID for tracking
    const requestId = generateRequestId();
    const deviceContext = getDeviceContext();
    const stages = [];
    const networkLog = [];
    
    const logStage = (stage, data) => {
      const entry = { stage, timestamp: new Date().toISOString(), ...data };
      stages.push(entry);
      console.log(`[${requestId}] ${stage}:`, data);
    };

    const logNetwork = (stage, data) => {
      const entry = { stage, timestamp: new Date().toISOString(), ...data };
      networkLog.push(entry);
      console.log(`[${requestId}] NETWORK ${stage}:`, data);
    };

    logStage('INIT', { 
      deviceContext,
      filesCount: selectedFiles.length, userTier,
      availableScans: user?.available_scans ?? 0,
      canScan: (user?.available_scans ?? 0) > 0
    });

    haptic.medium();

    // MULTI-FILE MODE: Upload ALL files as ONE lease (pages of the same document)
    if (filesToUpload.length > 1) {
      setUploading(true);
      setAnalyzing(false);
      setError(null);
      setUploadProgress(0);
      setCumulativeProgress(0);
      
      let createdLeaseId = null;

      try {
        // Upload all files first
        const uploadedUrls = [];
        
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          
          setAnalysisStage(language === 'th' ? `กำลังอัปโหลดหน้า ${i + 1}/${filesToUpload.length}` : `Uploading page ${i + 1}/${filesToUpload.length}`);
          const newProgress = Math.round(((i + 1) / filesToUpload.length) * 20);
          setCumulativeProgress(prev => Math.max(prev, newProgress));
          setUploadProgress(newProgress);

          console.log('UPLOAD_START', { filename: file?.name, size: file?.size });
          const uploadResp = await base44.integrations.Core.UploadFile({ file });
          const file_url = uploadResp?.file_url;
          console.log('UPLOAD_RESULT', { url_preview: String(file_url || '').slice(0,200) });
          if (!isValidPublicUrl(file_url)) {
            setError({ step: 'UPLOAD', code: 'UPLOAD_NO_URL', message: 'Upload did not return a valid public file URL', retryable: false, debugLog: { raw: safeStringify(uploadResp) } });
            setUploading(false);
            setAnalyzing(false);
            setAnalysisStage('');
            return;
          }
          uploadedUrls.push(file_url);
        }

        setAnalysisStage('creating');
        const creatingProgress = 30;
        setCumulativeProgress(prev => Math.max(prev, creatingProgress));
        setUploadProgress(creatingProgress);

        // Create ONE lease with all file URLs
        // Extract original filename from first file
        const originalFilename = filesToUpload[0]?.name || 'Lease Document';

        // CRITICAL: Ensure user is loaded before creating lease
        if (!user?.email) {
          throw new Error('USER_NOT_LOADED: Cannot create lease without user email');
        }

        // Calculate total file size for storage tracking
        const totalFileSize = filesToUpload.reduce((sum, file) => sum + (file?.size || 0), 0);
        
        // Check storage quota BEFORE upload
        try {
          const quotaResponse = await base44.functions.invoke('checkStorageQuota', {
            fileSize: totalFileSize
          });
          
          const quotaResult = quotaResponse?.data;
          
          if (quotaResult && !quotaResult.allowed) {
            const errorMsg = language === 'th'
              ? `พื้นที่จัดเก็บไม่เพียงพอ\n\nคุณมีพื้นที่เหลือ ${quotaResult.remainingMB}MB แต่ต้องการ ${quotaResult.fileSizeMB}MB\n\nอัปเกรดเพื่อเพิ่มพื้นที่จัดเก็บ`
              : `Storage limit exceeded\n\nYou have ${quotaResult.remainingMB}MB remaining but need ${quotaResult.fileSizeMB}MB\n\nUpgrade for more storage`;
            
            setError(errorMsg);
            setUploading(false);
            setAnalyzing(false);
            return;
          }
        } catch (quotaErr) {
          console.warn('[STORAGE_QUOTA_CHECK_FAILED]', quotaErr);
          // Fail open - allow upload if quota check fails
        }
        
        const lease = await base44.entities.Lease.create({
          file_url: uploadedUrls[0], // Primary file
          file_urls: uploadedUrls, // All pages
          status: 'queued',
          owner_email: user.email,
          created_by: user.email,
          original_filename: originalFilename,
          file_size_bytes: totalFileSize
        });
        createdLeaseId = lease.id;

        // FORENSIC LOG: STEP 1 - Lease Created
        console.log('[LEASE_CREATED]', {
          leaseId: lease.id,
          owner_email: lease.owner_email,
          created_by: lease.created_by,
          userEmail: user.email,
          timestamp: new Date().toISOString()
        });

        // FORENSIC LOG: STEP 2 - Verify Lease in DB Immediately
        const verifyLease = await base44.entities.Lease.filter({ id: lease.id });
        console.log('[LEASE_VERIFY_IMMEDIATE]', {
          found: verifyLease.length > 0,
          leaseData: verifyLease[0]
        });

        const createdProgress = 40;
        setCumulativeProgress(prev => Math.max(prev, createdProgress));
        setUploadProgress(createdProgress);
        setAnalyzing(true);
        setUploading(false);
        setAnalysisStage('scanning');
        
        // Start smooth continuous progress animation during AI analysis (40-95%)
        // Moves faster initially (40-70%), then slows down (70-95%)
        let currentProgress = 40;
        const progressInterval = setInterval(() => {
          setCumulativeProgress(prev => {
            currentProgress = prev;
            let increment;
            
            if (currentProgress < 70) {
              increment = 2.5; // Fast progress during early analysis
            } else if (currentProgress < 85) {
              increment = 1; // Moderate progress
            } else if (currentProgress < 95) {
              increment = 0.5; // Slow but steady progress - never freeze
            } else {
              increment = 0; // Stop at 95% and wait for backend
            }
            
            const next = Math.min(95, prev + increment);
            setUploadProgress(Math.round(next));
            return next;
          });
        }, 1500); // Check every 1.5 seconds for smooth animation

        // Validate uploaded URLs array and preflight primary URL
        const urls = Array.isArray(uploadedUrls) ? uploadedUrls.filter(Boolean) : [];
        if (!(urls.length >= 1 && isValidPublicUrl(urls[0]))) {
          setError({ step: 'UPLOAD', code: 'UPLOAD_NO_URL', message: 'Upload did not return a valid public file URL', retryable: false, debugLog: { raw: safeStringify({ urls }) } });
          await base44.entities.Lease.update(lease.id, { status: 'failed' });
          setUploading(false); setAnalyzing(false); setAnalysisStage('');
          return;
        }
        const primaryUrl = urls[0];
        const preStatus = await preflightUrl(primaryUrl);
        console.log('UPLOAD_PREFLIGHT', { status: preStatus });
        if (!preStatus || preStatus >= 400) {
          setError({ step: 'UPLOAD', code: 'UPLOAD_URL_UNREACHABLE', message: `Uploaded URL not reachable (HTTP ${preStatus})`, retryable: false, debugLog: { status: preStatus, url: primaryUrl } });
          await base44.entities.Lease.update(lease.id, { status: 'failed' });
          setUploading(false); setAnalyzing(false); setAnalysisStage('');
          return;
        }

        // ASYNC MODEL: Kick off scan, then poll for completion
        console.log('SCAN_INVOKE_ASYNC', { leaseId: lease.id, hasFileUrl: !!primaryUrl, language });
        const resp = await base44.functions.invoke('scanLeaseCF_v1', {
          leaseId: lease.id,
          fileUrl: primaryUrl,
          language
        });
        const out = resp?.data ?? resp;
        
        if (!out || out?.ok !== true) {
          setError({ code: out?.error_code, step: out?.step, message: out?.message || 'Scan failed', retryable: true });
          setUploading(false); setAnalyzing(false); setAnalysisStage('');
          return;
        }

        const scanId = out.scanId;
        if (!scanId) throw new Error('BUG: scanId missing from response');

        // Poll LeaseScan record until status is 'completed' or 'failed'
        console.log('[POLL_START]', { scanId });
        let pollCount = 0;
        const maxPolls = 60; // 60 * 3s = 3 minutes max
        let completedScan = null;

        while (pollCount < maxPolls) {
          await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds
          pollCount++;
          
          try {
            const scans = await base44.entities.LeaseScan.filter({ id: scanId });
            const scan = scans?.[0];
            
            if (scan?.status === 'completed') {
              completedScan = scan;
              console.log('[POLL_COMPLETE]', { scanId, pollCount, riskScore: scan.risk_score });
              break;
            }
            
            if (scan?.status === 'failed') {
              throw new Error('Scan analysis failed. Please try again.');
            }
            
            // Update progress based on poll count
            const pollProgress = Math.min(94, 45 + pollCount * 1.5);
            setCumulativeProgress(prev => Math.max(prev, pollProgress));
            setUploadProgress(Math.round(pollProgress));
          } catch (pollErr) {
            if (pollErr.message.includes('failed')) throw pollErr;
            console.warn('[POLL_ERROR]', pollErr.message);
          }
        }

        if (!completedScan) {
          throw new Error('Analysis is taking longer than expected. Check your scan results in a few minutes.');
        }

        // Stop smooth progress animation
        clearInterval(progressInterval);
        setCumulativeProgress(100);
        setUploadProgress(100);
        setAnalysisStage('finalizing');
        
        // Update storage usage after successful upload
        try {
          await base44.functions.invoke('updateStorageUsage', { bytesAdded: totalFileSize });
        } catch (_) {}
        
        // Mark user as having uploaded + navigate to report
        base44.auth.updateMe({ hasUploadedLease: true }).catch(() => {});
        navigate(createPageUrl("ReportFull") + `?scanId=${encodeURIComponent(scanId)}&leaseId=${encodeURIComponent(lease.id)}`, { state: { scan_full: completedScan.scan_full, fromUpload: true } });
        return;
      } catch (err) {
        console.error('[MULTI_PAGE_ERROR]', err);
        if (progressInterval) clearInterval(progressInterval);

        if (createdLeaseId) {
          try {
            await base44.entities.Lease.update(createdLeaseId, { status: 'failed' });
          } catch (updateErr) {
            console.error('Failed to mark lease as failed:', updateErr);
          }
        }

        setError(typeof err === 'string' ? err : err.message);
      } finally {
        setUploading(false);
        setAnalyzing(false);
        setUploadProgress(0);
        setCumulativeProgress(0);
        setAnalysisStage('');
      }
      
      return;
    }

    // SINGLE MODE: Keep existing logic with file normalization
    setUploading(true);
    setError(null);
    setDebugLog(null);
    setUploadProgress(0);
    setCumulativeProgress(0);
    setRetryCount(0);
    setAnalysisStage('uploading');

    let currentRetry = 0;
    let createdLeaseId = null;
    let progressInterval = null;
    const maxRetries = 0; // Disable auto-retry to show errors immediately

    const attemptUpload = async () => {
      let scanId = null;
      try {
        // STEP 0: Preflight check - verify files are readable
        logStage('PREFLIGHT_CHECK_START', {
          filesCount: selectedFiles.length
        });

        for (let i = 0; i < selectedFiles.length; i++) {
          const preflightResult = await preflightCheck(selectedFiles[i], requestId);
          if (!preflightResult.success) {
            logStage('PREFLIGHT_FAILED', {
              fileIndex: i,
              fileName: selectedFiles[i].name,
              error: preflightResult.error
            });
            throw new Error(`PREFLIGHT_READ_FAILED: ${preflightResult.error}`);
          }
        }

        logStage('PREFLIGHT_CHECK_PASSED', { filesCount: selectedFiles.length });

        // STEP 1: Normalize files (critical for Google Drive PDFs on Android)
        logStage('FILE_NORMALIZATION_START', {
          filesCount: filesToUpload.length,
          fileDetails: filesToUpload.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            lastModified: f.lastModified
          }))
        });

        const normalizedResults = await normalizeFiles(filesToUpload, requestId);
        
        const failedFiles = normalizedResults.filter(r => !r.success);
        if (failedFiles.length > 0) {
          logStage('FILE_NORMALIZATION_FAILED', {
            failedCount: failedFiles.length,
            errors: failedFiles.map(f => ({ name: f.original.name, error: f.error }))
          });
          throw new Error(`FILE_NORMALIZATION_FAILED: ${failedFiles[0].error}`);
        }

        const normalizedFiles = normalizedResults.map(r => r.normalized);
        logStage('FILE_NORMALIZATION_SUCCESS', {
          normalizedCount: normalizedFiles.length,
          wasNormalized: normalizedResults.some(r => r.wasNormalized)
        });

        setAnalysisStage('uploading');
        const uploadingProgress = 10;
        setCumulativeProgress(prev => Math.max(prev, uploadingProgress));
        setUploadProgress(uploadingProgress);

        // STEP 2: Upload normalized files using mobile-proof uploader
        const uploadTimeoutMs = getUploadTimeout();
        
        logStage('UPLOAD_START', { filesCount: normalizedFiles.length });
        logNetwork('UPLOAD_CONFIG', {
          method: 'POST',
          integration: 'Core.UploadFile',
          filesCount: normalizedFiles.length,
          totalBytes: normalizedFiles.reduce((sum, f) => sum + f.size, 0),
          timeoutMs: uploadTimeoutMs,
          timeoutConfigured: uploadTimeoutMs > 0,
          devicePlatform: deviceContext.platform,
          isAndroid: deviceContext.isAndroid,
          runtime: deviceContext.runtime
        });

        const uploadStartTime = Date.now();

        const uploadResults = await uploadMultipleFiles(
          normalizedFiles,
          requestId,
          (fileIndex, progress) => {
            const overallProgress = 10 + (fileIndex / normalizedFiles.length * 20) + (progress / 100 * (20 / normalizedFiles.length));
            setCumulativeProgress(prev => {
              const next = Math.max(prev, overallProgress);
              setUploadProgress(Math.round(next));
              return next;
            });
          }
        );

        const uploadDuration = Date.now() - uploadStartTime;
        
        // Check for failures
        const failedUploads = uploadResults.filter(r => !r.success);
        if (failedUploads.length > 0) {
          logStage('UPLOAD_FAILED', {
            failedCount: failedUploads.length,
            errors: failedUploads.map(r => ({ file: r.fileName, error: r.error }))
          });
          
          // Merge network logs
          failedUploads.forEach(r => {
            if (r.networkLog) {
              networkLog.push(...r.networkLog);
            }
          });
          
          throw new Error(`UPLOAD_FAILED: ${failedUploads[0].error}`);
        }
        
        const fileUrls = uploadResults.filter(r => r?.success && r?.file_url).map(r => r.file_url);
        // Validate and preflight
        if (!(Array.isArray(fileUrls) && fileUrls.length >= 1 && isValidPublicUrl(fileUrls[0]))) {
          setError({ step: 'UPLOAD', code: 'UPLOAD_NO_URL', message: 'Upload did not return a valid public file URL', retryable: false, debugLog: { raw: safeStringify(uploadResults) } });
          setUploading(false); setAnalyzing(false); setAnalysisStage('');
          return;
        }
        console.log('UPLOAD_RESULT', { url_preview: String(fileUrls[0]).slice(0,200) });
        const preStatusSingle = await preflightUrl(fileUrls[0]);
        console.log('UPLOAD_PREFLIGHT', { status: preStatusSingle });
        if (!preStatusSingle || preStatusSingle >= 400) {
          setError({ step: 'UPLOAD', code: 'UPLOAD_URL_UNREACHABLE', message: `Uploaded URL not reachable (HTTP ${preStatusSingle})`, retryable: false, debugLog: { status: preStatusSingle, url: fileUrls[0] } });
          setUploading(false); setAnalyzing(false); setAnalysisStage('');
          return;
        }
        
        // Merge all network logs
        uploadResults.forEach(r => {
          if (r.networkLog) {
            networkLog.push(...r.networkLog);
          }
        });
        
        logStage('UPLOAD_SUCCESS', {
          duration: uploadDuration,
          filesUploaded: fileUrls.length,
          totalBytesUploaded: uploadResults.reduce((sum, r) => sum + (r.bytesUploaded || 0), 0),
          urls: fileUrls.map(url => url.substring(0, 100) + '...')
        });
        
        const uploadedProgress = 30;
        setCumulativeProgress(prev => Math.max(prev, uploadedProgress));
        setUploadProgress(uploadedProgress);

        setAnalysisStage('creating');
        const creatingProgressSingle = 40;
        setCumulativeProgress(prev => Math.max(prev, creatingProgressSingle));
        setUploadProgress(creatingProgressSingle);

        // Extract original filename from first file
        const originalFilename = normalizedFiles[0]?.name || filesToUpload[0]?.name || 'Lease Document';
        
        // CRITICAL: Ensure user is loaded before creating lease
        if (!user?.email) {
          throw new Error('USER_NOT_LOADED: Cannot create lease without user email');
        }

        // Calculate total file size for storage tracking
        const totalFileSizeSingle = normalizedFiles.reduce((sum, file) => sum + (file?.size || 0), 0);
        
        // Check storage quota BEFORE creating lease
        try {
          const quotaResponse = await base44.functions.invoke('checkStorageQuota', {
            fileSize: totalFileSizeSingle
          });
          
          const quotaResult = quotaResponse?.data;
          
          if (quotaResult && !quotaResult.allowed) {
            const errorMsg = language === 'th'
              ? `พื้นที่จัดเก็บไม่เพียงพอ\n\nคุณมีพื้นที่เหลือ ${quotaResult.remainingMB}MB แต่ต้องการ ${quotaResult.fileSizeMB}MB\n\nอัปเกรดเพื่อเพิ่มพื้นที่จัดเก็บ`
              : `Storage limit exceeded\n\nYou have ${quotaResult.remainingMB}MB remaining but need ${quotaResult.fileSizeMB}MB\n\nUpgrade for more storage`;
            
            setError(errorMsg);
            setUploading(false);
            setAnalyzing(false);
            setAnalysisStage('');
            return;
          }
        } catch (quotaErr) {
          console.warn('[STORAGE_QUOTA_CHECK_FAILED]', quotaErr);
          // Fail open - allow upload if quota check fails
        }
        
        const lease = await base44.entities.Lease.create({
          file_url: fileUrls[0],
          file_urls: fileUrls,
          status: 'uploaded',
          owner_email: user.email,
          created_by: user.email,
          original_filename: originalFilename,
          file_size_bytes: totalFileSizeSingle
        });
        createdLeaseId = lease.id;

        // FORENSIC LOG: STEP 1 - Lease Created
        console.log('[LEASE_CREATED]', {
          leaseId: lease.id,
          owner_email: lease.owner_email,
          created_by: lease.created_by,
          userEmail: user.email,
          timestamp: new Date().toISOString()
        });

        // FORENSIC LOG: STEP 2 - Verify Lease in DB Immediately
        const verifyLease = await base44.entities.Lease.filter({ id: lease.id });
        console.log('[LEASE_VERIFY_IMMEDIATE]', {
          found: verifyLease.length > 0,
          leaseData: verifyLease[0]
        });
        const createdProgressSingle = 50;
        setCumulativeProgress(prev => Math.max(prev, createdProgressSingle));
        setUploadProgress(createdProgressSingle);

        setAnalyzing(true);
        setUploading(false);
        setAnalysisStage('scanning');
        
        // Start smooth continuous progress animation during AI analysis (50-95%)
        let currentProgress = 50;
        progressInterval = setInterval(() => {
          setCumulativeProgress(prev => {
            currentProgress = prev;
            let increment;
            
            if (currentProgress < 70) {
              increment = 2.5; // Fast progress during early analysis
            } else if (currentProgress < 85) {
              increment = 1; // Moderate progress
            } else if (currentProgress < 95) {
              increment = 0.5; // Slow but steady - never freeze
            } else {
              increment = 0; // Stop at 95% and wait for backend
            }
            
            const next = Math.min(95, prev + increment);
            setUploadProgress(Math.round(next));
            return next;
          });
        }, 1500); // Check every 1.5 seconds

        // STEP 3: Invoke analysis (ASYNC model - returns immediately)
        logStage('ANALYSIS_START', { fileUrls });

        console.log('SCAN_INVOKE_ASYNC', { leaseId: lease.id, hasFileUrl: !!fileUrls?.[0], language });
        const resp = await base44.functions.invoke('scanLeaseCF_v1', {
          leaseId: lease.id,
          fileUrl: fileUrls[0],
          language
        });
        const out = resp?.data ?? resp;
        
        if (!out || out?.ok !== true) {
          setError({ code: out?.error_code, step: out?.step, message: out?.message || 'Scan failed', retryable: true });
          setUploading(false); setAnalyzing(false); setAnalysisStage('');
          return;
        }

        scanId = out.scanId;
        if (!scanId) throw new Error('BUG: scanId missing from response');

        // Poll LeaseScan record until status is 'completed' or 'failed'
        console.log('[POLL_START]', { scanId });
        let pollCount = 0;
        const maxPolls = 60; // 60 * 3s = 3 minutes max
        let completedScan = null;

        while (pollCount < maxPolls) {
          await new Promise(r => setTimeout(r, 3000));
          pollCount++;
          
          try {
            const scans = await base44.entities.LeaseScan.filter({ id: scanId });
            const scan = scans?.[0];
            
            if (scan?.status === 'completed') {
              completedScan = scan;
              console.log('[POLL_COMPLETE]', { scanId, pollCount, riskScore: scan.risk_score });
              break;
            }
            
            if (scan?.status === 'failed') {
              throw new Error('Scan analysis failed. Please try again.');
            }
            
            // Update progress based on poll count
            const pollProgress = Math.min(94, 55 + pollCount * 1.5);
            setCumulativeProgress(prev => Math.max(prev, pollProgress));
            setUploadProgress(Math.round(pollProgress));
          } catch (pollErr) {
            if (pollErr.message.includes('failed')) throw pollErr;
            console.warn('[POLL_ERROR]', pollErr.message);
          }
        }

        if (!completedScan) {
          throw new Error('Analysis is taking longer than expected. Check your scan results in a few minutes.');
        }

        // Stop smooth progress animation
        clearInterval(progressInterval);
        setCumulativeProgress(100);
        setUploadProgress(100);
        
        logStage('ANALYSIS_SUCCESS', { scanId, riskScore: completedScan.risk_score });
        
        // Invalidate queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['allScans'] }),
          queryClient.invalidateQueries({ queryKey: ['deposits'] }),
          queryClient.invalidateQueries({ queryKey: ['timelineEvents'] }),
          queryClient.invalidateQueries({ queryKey: ['leases'] }),
          queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        ]);
        
        // Update storage usage
        try {
          await base44.functions.invoke('updateStorageUsage', { bytesAdded: totalFileSizeSingle });
        } catch (_) {}
        
        // Mark user as having uploaded + navigate to report
        base44.auth.updateMe({ hasUploadedLease: true }).catch(() => {});
        navigate(createPageUrl("ReportFull") + `?scanId=${encodeURIComponent(scanId)}&leaseId=${encodeURIComponent(lease.id)}`, { state: { scan_full: completedScan.scan_full, fromUpload: true } });
        return;
      } catch (err) {
        logStage('ERROR_CAUGHT', {
          error: err.message,
          details: err.details,
          stage: analysisStage,
          retryAttempt: currentRetry
        });

        currentRetry++;
        setRetryCount(currentRetry);

        if (false) { // RETRY DISABLED
          // This block is now disabled to show errors immediately.
        } else {
          // Final failure after all retries - categorize and format error
          const formattedError = formatErrorForUser(err, requestId, language, {
            uploadStage: analysisStage
          });
          // Stop progress on error
          if (progressInterval) clearInterval(progressInterval);
          
          formattedError.scanId = scanId || null;
          const debugData = createDebugLog(requestId, stages, deviceContext, networkLog);
          
          logStage('FINAL_FAILURE', {
            category: formattedError.category,
            retriesExhausted: true,
            devicePlatform: deviceContext.platform,
            isAndroid: deviceContext.isAndroid,
            uploadStage: analysisStage
          });

          setError(formattedError);
          setDebugLog(debugData);

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

  const handleUploadAll = async (filesToUpload = null) => {
    // Use provided files or fall back to state
    const filesToUse = filesToUpload || selectedFiles;
    
    if (filesToUse.length === 0) {
      setError(language === 'th' ? 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' : 'Please select at least one file');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Update state with files if provided
    if (filesToUpload) {
      setSelectedFiles(filesToUpload);
    }
    
    // Check if user needs to see disclaimer (one-time only)
    if (!user?.scan_disclaimer_accepted) {
      pendingDisclaimerFiles.current = filesToUse;
      setShowDisclaimerModal(true);
      return;
    }
    
    // If already accepted, proceed directly with the files
    proceedWithUpload(filesToUse);
  };

  const handleConfirmLeaseDetails = async () => {
    if (!pendingLeaseId || !leaseDetails) return;

    haptic.medium();

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
      haptic.success();
    } catch (err) {
      console.error('Failed to update lease details:', err);
      setShowConfirmation(false);
      haptic.error();
    }
  };

  const handleCompletionViewResults = async () => {
    haptic.medium();
    setShowCompletionModal(false);
    
    const lease = leases.find(l => l.id === completedLeaseId);
    if (lease) {
      setSelectedLease(lease);
    }
  };

  const handleCompletionDone = () => {
    haptic.light();
    setShowCompletionModal(false);
    setCompletedLeaseId(null);
    if (userTier === 'explorer') {
      setShowPostScanHint(true);
    }
  };

  const handleConfirmReviewedData = async (editedData) => {
    setSavingConfirmedData(true);
    haptic.medium();

    try {
      console.log('[CONFIRM_SCAN_DATA] Saving confirmed data...');
      
      // Reconstruct deposit data from edited form
      const depositData = {
        deposit_amount: editedData.deposit_amount || reviewData.data_prepared.deposit_tracker.deposit_amount,
        property_address: editedData.property_address || reviewData.data_prepared.deposit_tracker.property_address,
        rent_amount: editedData.monthly_rent || reviewData.data_prepared.deposit_tracker.rent_amount,
        rent_due_day: editedData.rent_due_day || reviewData.data_prepared.deposit_tracker.rent_due_day,
        deposit_paid_date: editedData.deposit_due_date || reviewData.data_prepared.deposit_tracker.deposit_paid_date,
        expected_return_date: editedData.expected_return_date || reviewData.data_prepared.deposit_tracker.expected_return_date,
        deposit_due_date: editedData.deposit_due_date || reviewData.data_prepared.deposit_tracker.deposit_due_date,
        lease_start_date: editedData.lease_start || reviewData.data_prepared.deposit_tracker.lease_start_date,
        lease_end_date: editedData.lease_end || reviewData.data_prepared.deposit_tracker.lease_end_date,
        ...reviewData.data_prepared.deposit_tracker,
        existingDepositId: reviewData.data_prepared.deposit_tracker.existingDepositId
      };

      const { data: confirmResponse } = await base44.functions.invoke('confirmScanData', {
        depositData,
        timelineEvents: reviewData.data_prepared.timeline_events,
        scanId: completedLeaseId,
        leaseId: completedLeaseId
      });

      if (confirmResponse?.success) {
        console.log('[CONFIRM_SCAN_DATA] Data saved successfully');
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['deposits'] });
        queryClient.invalidateQueries({ queryKey: ['timelineEvents'] });
        
        setShowReviewScreen(false);
        setShowCompletionModal(true);
        haptic.success();
      } else {
        throw new Error('Failed to save confirmed data');
      }
    } catch (error) {
      console.error('[CONFIRM_SCAN_DATA] Error:', error);
      alert(language === 'th' ? 'ไม่สามารถบันทึกข้อมูลได้' : 'Failed to save data');
      haptic.error();
    } finally {
      setSavingConfirmedData(false);
    }
  };

  const handleCancelReview = () => {
    haptic.light();
    setShowReviewScreen(false);
    setShowCompletionModal(true);
  };

  const handleSkipConfirmation = () => {
    haptic.light();
    setShowConfirmation(false);
  };

  const handleAddPages = async () => {
    if (!addingPagesToLease || additionalFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    setAnalysisStage('uploading');

    try {
      const existingUrls = addingPagesToLease.file_urls || [addingPagesToLease.file_url];
      const newUrls = [];

      // Upload new pages
      for (let i = 0; i < additionalFiles.length; i++) {
        const file = additionalFiles[i];
        
        setAnalysisStage(language === 'th' ? `กำลังอัปโหลดหน้าใหม่ ${i + 1}/${additionalFiles.length}` : `Uploading new page ${i + 1}/${additionalFiles.length}`);
        setUploadProgress(Math.round(((i + 1) / additionalFiles.length) * 30));

        console.log('UPLOAD_START', { filename: file?.name, size: file?.size });
        const uploadResp2 = await base44.integrations.Core.UploadFile({ file });
        const file_url = uploadResp2?.file_url;
        console.log('UPLOAD_RESULT', { url_preview: String(file_url || '').slice(0,200) });
        if (!isValidPublicUrl(file_url)) {
          setError({ step: 'UPLOAD', code: 'UPLOAD_NO_URL', message: 'Upload did not return a valid public file URL', retryable: false, debugLog: { raw: safeStringify(uploadResp2) } });
          setUploading(false); setAnalyzing(false); setAnalysisStage('');
          return;
        }
        newUrls.push(file_url);
      }

      const allUrls = [...existingUrls, ...newUrls];

      // Validate and preflight first URL
      if (!(Array.isArray(allUrls) && allUrls.length >= 1 && isValidPublicUrl(allUrls[0]))) {
        setError({ step: 'UPLOAD', code: 'UPLOAD_NO_URL', message: 'Upload did not return a valid public file URL', retryable: false, debugLog: { raw: safeStringify(allUrls) } });
        setUploading(false); setAnalyzing(false); setAnalysisStage('');
        return;
      }
      const preStatusAdd = await preflightUrl(allUrls[0]);
      console.log('UPLOAD_PREFLIGHT', { status: preStatusAdd });
      if (!preStatusAdd || preStatusAdd >= 400) {
        setError({ step: 'UPLOAD', code: 'UPLOAD_URL_UNREACHABLE', message: `Uploaded URL not reachable (HTTP ${preStatusAdd})`, retryable: false, debugLog: { status: preStatusAdd, url: allUrls[0] } });
        setUploading(false); setAnalyzing(false); setAnalysisStage('');
        return;
      }

      // Update lease with new pages and set to re-analyzing
      await base44.entities.Lease.update(addingPagesToLease.id, {
        file_urls: allUrls,
        status: 'processing'
      });

      setUploadProgress(40);
      setAnalysisStage('scanning');
      setUploadProgress(50);

      // Re-trigger analysis
      console.log('SCAN_INVOKE', { leaseId: addingPagesToLease.id, hasFileUrl: !!allUrls?.[0], language });
      const resp = await base44.functions.invoke('scanLeaseCF_v1', {
          leaseId: addingPagesToLease.id,
          fileUrl: allUrls[0],
          language
        });
        const out = resp?.data ?? resp;
        console.log("INVOKE_SCANLEASEEXTERNAL_RAW", resp);
        console.log("INVOKE_SCANLEASEEXTERNAL_OUT", out);
        
        if (!out) {
          setError({ code: 'EMPTY_FUNCTION_RESULT', step: 'FUNCTION_INVOCATION', message: language === 'th' ? 'ไม่ได้รับผลลัพธ์จากการวิเคราะห์' : 'Did not receive analysis result from function', retryable: true });
          setUploading(false);
          setAnalyzing(false);
          setAnalysisStage('');
          return;
        }
        if (out?.ok !== true) {
          setError({ code: out.error_code, step: out.step, message: out.message, retryable: out.retryable === true });
          setUploading(false);
          setAnalyzing(false);
          setAnalysisStage('');
          return;
        }
        const scanResponse = resp.data;

      if (!scanResponse || !scanResponse.success) {
        throw new Error(scanResponse?.error || 'Re-analysis failed');
      }

      const scanResult = scanResponse.result;
      setAnalysisStage('extracting');
      setUploadProgress(70);

      await base44.entities.Lease.update(addingPagesToLease.id, {
        status: 'scanned',
        property_address: scanResult.property_address || null,
        start_date: scanResult.start_date || null,
        end_date: scanResult.end_date || null,
        rent_amount: scanResult.rent_amount > 0 ? scanResult.rent_amount : null,
        deposit_amount: scanResult.deposit_amount > 0 ? scanResult.deposit_amount : null,
        language_detected: scanResult.language_detected || 'en'
      });

      // Update existing scan
      const existingScans = await base44.entities.LeaseScan.filter({ lease_id: addingPagesToLease.id });
      if (existingScans.length > 0) {
        await base44.entities.LeaseScan.update(existingScans[0].id, {
          risk_score: scanResult.risk_score,
          flags: scanResult.issues_validated || scanResult.flags || [],
          summary: scanResult.summary,
          scan_full: {
            ...scanResult,
            issues_validated: scanResult.issues_validated || scanResult.flags || [],
            issues_invalid: scanResult.issues_invalid || [],
            flags: scanResult.issues_validated || scanResult.flags || []
          },
          version: '3.0'
        });
      }

      setUploadProgress(100);

      // Show completion modal
      setCompletedLeaseId(addingPagesToLease.id);
      setShowCompletionModal(true);
      setAddingPagesToLease(null);
      setAdditionalFiles([]);
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['allScans'] });

    } catch (err) {
      console.error('Failed to add pages:', err);
      setError(typeof err === 'string' ? err : err.message);
      
      if (addingPagesToLease) {
        await base44.entities.Lease.update(addingPagesToLease.id, { status: 'failed' });
      }
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress(0);
      setAnalysisStage('');
    }
  };

  const deleteLeaseWithScanMutation = useMutation({
    mutationFn: async (leaseId) => {
      // Call the deleteLease backend function which handles cascade deletion
      const response = await base44.functions.invoke('deleteLease', { leaseId });
      return response.data;
    },
    onSuccess: (result) => {
      console.log('[DELETE_SUCCESS]', result);
      
      // CRITICAL: Invalidate ALL related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['allScans'] });
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['depositTrackers'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceRequests'] });
      queryClient.invalidateQueries({ queryKey: ['timelineEvents'] });
      
      setSelectedLease(null);
      haptic.success();
    },
    onError: (error) => {
      console.error('[DELETE_ERROR]', error);
      haptic.error();
      alert(language === 'th' ? 'ไม่สามารถลบสัญญาเช่าได้' : 'Failed to delete lease');
    }
  });

  const handleSwipeDelete = (leaseId) => {
    haptic.heavy();
    const confirmMessage = language === 'th'
      ? 'คุณแน่ใจหรือไม่ว่าต้องการลบการสแกนนี้?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้'
      : 'Are you sure you want to delete this scan?\n\nThis action cannot be undone.';

    const userConfirmed = window.confirm(confirmMessage);

    if (userConfirmed) {
      deleteLeaseWithScanMutation.mutate(leaseId);
    }
  };

  const handleDeleteLease = (leaseId, e) => {
    e.stopPropagation();

    const confirmMessage = language === 'th'
      ? 'คุณแน่ใจหรือไม่ว่าต้องการลบการสแกนนี้?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้'
      : 'Are you sure you want to delete this scan?\n\nThis action cannot be undone.';

    const userConfirmed = window.confirm(confirmMessage);

    if (userConfirmed) {
      haptic.heavy();
      deleteLeaseWithScanMutation.mutate(leaseId);
    }
  };

  const handleViewDetails = (lease) => {
    setSelectedLease(lease);
  };

  const handleFileSelect = (e) => {
    if (!scanStatus.allowed) return;
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'pdf' || file.type === 'application/pdf') {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      setError(language === 'th'
        ? `รองรับเฉพาะไฟล์ PDF เท่านั้น 📄\n\nไฟล์ที่ไม่รองรับ: ${invalidFiles.join(', ')}\n\nการสแกนรูปภาพจะเปิดให้บริการเร็ว ๆ นี้`
        : language === 'ru'
          ? `Поддерживаются только PDF файлы 📄\n\nНеподдерживаемые файлы: ${invalidFiles.join(', ')}\n\nСканирование изображений скоро будет доступно`
          : `PDF files only 📄\n\nUnsupported: ${invalidFiles.join(', ')}\n\nImage scanning coming soon.`);
      setTimeout(() => setError(null), 5000);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
    
    setDragActive(false);
  };

  const handleDrop = (e) => {
    if (!scanStatus.allowed) return;
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'pdf' || file.type === 'application/pdf') {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      setError(language === 'th'
        ? `รองรับเฉพาะไฟล์ PDF เท่านั้น 📄\n\nไฟล์ที่ไม่รองรับ: ${invalidFiles.join(', ')}\n\nการสแกนรูปภาพจะเปิดให้บริการเร็ว ๆ นี้`
        : language === 'ru'
          ? `Поддерживаются только PDF файлы 📄\n\nНеподдерживаемые файлы: ${invalidFiles.join(', ')}\n\nСканирование изображений скоро будет доступно`
          : `PDF files only 📄\n\nUnsupported: ${invalidFiles.join(', ')}\n\nImage scanning coming soon.`);
      setTimeout(() => setError(null), 5000);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRetry = () => {
    setError(null);
    setDebugLog(null);
    setSelectedFiles([]);
    setUploadProgress(0);
    setRetryCount(0);
    setAnalysisStage('');
  };



  const handleToggleAlerts = async (enabled) => {
    haptic.light();
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

    haptic.medium();

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
    haptic.success();
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
      return language === 'th' ? 'ปีนี้' : language === 'ru' ? 'в этом году' : 'this year';
    } else if (period === 'lifetime') {
      return language === 'th' ? 'ตลอดชีพ' : language === 'ru' ? 'за всё время' : 'lifetime';
    }
    return '';
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        
        {/* Review Screen (full page, not modal) */}
        {showReviewScreen && reviewData && (
          <ScanReviewConfirmation
            reviewData={reviewData.review_required}
            onConfirm={handleConfirmReviewedData}
            onCancel={handleCancelReview}
            colors={colors}
            language={language}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Main upload UI (hidden when review screen is active) */}
        {!showReviewScreen && (
          <>


        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>

          {/* ✅ SCAN LIMIT INDICATOR */}
          <div className="mt-3">
            {isLoadingUser || !user ? (
              <div className="h-6 w-48 rounded animate-pulse" style={{ backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }} />
            ) : (
              <Badge className={scanStatus.allowed ? 'bg-blue-100 text-blue-700' : (scanStatus.monthlyBlocked ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                {scanStatus.monthlyBlocked
                  ? (language === 'th' ? `ถึงขีดจำกัดรายเดือน (${scanStatus.monthlyUsed}/${scanStatus.monthlyMax})` : `Monthly limit reached (${scanStatus.monthlyUsed}/${scanStatus.monthlyMax})`)
                  : scanStatus.allowed
                    ? `${scanStatus.remaining} ${scanStatus.remaining === 1 ? (language === 'th' ? 'การสแกน' : 'scan') : (language === 'th' ? 'การสแกน' : 'scans')} ${language === 'th' ? 'คงเหลือ' : 'remaining'}${scanStatus.period === 'year' ? ` (${getPeriodText(scanStatus.period)})` : ''}${scanStatus.monthlyMax > 0 ? ` · ${scanStatus.monthlyUsed}/${scanStatus.monthlyMax} ${language === 'th' ? 'เดือนนี้' : 'this month'}` : ''}`
                    : strings.scanLimitMsg.replace('{used}', scanStatus.used).replace('{limit}', scanStatus.limit).replace('{periodText}', getPeriodText(scanStatus.period))
                }
              </Badge>
            )}
          </div>
        </div>

        {/* ✅ NEW: Post-scan upgrade hint */}
        {showPostScanHint && userTier === 'explorer' && (
          <div
            style={{
              marginBottom: 16,
              padding: 10,
              borderRadius: 12,
              backgroundColor: isDarkMode ? 'rgba(12,59,46,0.12)' : 'rgba(12,59,46,0.06)',
              border: '1px dashed rgba(12,59,46,0.25)',
              fontSize: '0.8rem',
              color: colors.textPrimary
            }}
          >
            <strong>Tip:</strong> {strings.upgradeHintText}
            <button
              onClick={() => navigate(createPageUrl('Account') + '#plans')}
              style={{
                padding: '4px 8px',
                borderRadius: 9999,
                backgroundColor: '#0C3B2E',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                marginLeft: 6,
              }}
            >
              {strings.viewPlans}
            </button>
          </div>
        )}

        <ScanErrorDisplay error={error} language={language} user={user} onRetry={handleRetry} />

        {/* Lease Details Confirmation Modal */}
        {showConfirmation && leaseDetails && (
          <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <DialogHeader>
                <DialogTitle style={{ color: colors.textPrimary }}>{strings.confirmNoticeTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p style={{ color: colors.textSecondary }}>
                  {leaseDetails.end_date ? `${strings.confirmNoticeDesc}: ${format(new Date(leaseDetails.end_date), 'MMM d, yyyy')}` : `${strings.confirmNoticeDesc}: N/A`}
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
                  className="w-full py-6 text-base font-bold"
                  style={{
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    minHeight: '56px',
                    fontSize: '16px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0a2f25';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0C3B2E';
                  }}
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

        {/* Lease Details Modal - REDESIGNED CLEAN & STRUCTURED */}
        {selectedLease && (
          <Dialog open={!!selectedLease} onOpenChange={() => setSelectedLease(null)}>
            <DialogContent
              className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0"
              style={{ backgroundColor: colors.cardBg }}
            >
              <DialogHeader className="px-6 py-4 border-b flex-shrink-0 flex flex-row items-center justify-between" style={{
                backgroundColor: colors.cardBg,
                borderBottom: `1px solid ${colors.borderColor}`
              }}>
                <DialogTitle className="text-xl font-bold" style={{ color: colors.textPrimary }}>{strings.leaseDetails}</DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                {/* Basic Info */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm" style={{ color: colors.textSecondary }}>{strings.basicInfo}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                      <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.propertyAddress}</p>
                      <p className="break-words text-sm" style={{ color: colors.textPrimary }}>{selectedLease.property_address || 'N/A'}</p>
                    </div>
                    {selectedLease.rent_amount > 0 && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                        <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.monthlyRent}</p>
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          ฿{selectedLease.rent_amount.toLocaleString('en-US')}
                        </p>
                      </div>
                    )}
                    {selectedLease.deposit_amount > 0 && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                        <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.securityDeposit}</p>
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          ฿{selectedLease.deposit_amount.toLocaleString('en-US')}
                        </p>
                      </div>
                    )}
                    {(selectedLease.start_date || selectedLease.end_date) && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                        <p className="font-semibold mb-1 text-xs" style={{ color: colors.textSecondary }}>{strings.leasePeriod}</p>
                        <p className="break-words text-sm" style={{ color: colors.textPrimary }}>
                          {selectedLease.start_date ? format(new Date(selectedLease.start_date), 'MMM d, yyyy') : 'N/A'} {strings.to} {selectedLease.end_date ? format(new Date(selectedLease.end_date), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notice Settings */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm" style={{ color: colors.textSecondary }}>{strings.noticeSettings}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.cardBg }}>
                      <div className="flex-1 pr-3">
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>{strings.noticeAlertsEnabled}</p>
                        <p className="text-xs break-words" style={{ color: colors.textSecondary }}>{strings.enableAlertsHelp}</p>
                      </div>
                      <Switch
                        checked={selectedLease.notice_alerts_enabled !== false}
                        onCheckedChange={handleToggleAlerts}
                        disabled={!selectedLease.end_date}
                      />
                    </div>

                    {!editingNotice ? (
                      <div className="space-y-3">
                        {selectedLease.end_date && (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
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
                            <p className="text-lg font-bold break-words" style={{ color: colors.textPrimary }}>
                              {format(new Date(selectedLease.notice_deadline), 'MMMM d, yyyy')}
                            </p>
                            <p className="text-xs mt-1 break-words" style={{ color: colors.textSecondary }}>
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
                  </div>
                </div>

                {/* Risk Summary Section */}
                {selectedScan && (() => {
                  const riskLevel = selectedScan.risk_score >= 70 
                    ? { level: 'high', label: language === 'th' ? 'ความเสี่ยงสูง' : language === 'ru' ? 'Высокий' : 'HIGH RISK', color: '#EF4444', bg: '#FEE2E2' }
                    : selectedScan.risk_score >= 40
                      ? { level: 'medium', label: language === 'th' ? 'ความเสี่ยงปานกลาง' : language === 'ru' ? 'Средний' : 'MEDIUM RISK', color: '#F59E0B', bg: '#FEF3C7' }
                      : { level: 'low', label: language === 'th' ? 'ความเสี่ยงต่ำ' : language === 'ru' ? 'Низкий' : 'LOW RISK', color: '#10B981', bg: '#D1FAE5' };
                  
                  return (
                    <div className="space-y-4">
                      <h3 className="font-bold text-base" style={{ color: colors.textPrimary }}>{strings.riskAnalysis}</h3>
                      
                      <div className="p-5 rounded-xl border-2" style={{
                        backgroundColor: riskLevel.bg,
                        borderColor: riskLevel.color
                      }}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-semibold mb-1 opacity-80" style={{ color: riskLevel.color }}>{strings.riskScore}</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold" style={{ color: riskLevel.color }}>
                                {selectedScan.risk_score}
                              </span>
                              <span className="text-xl font-semibold" style={{ color: riskLevel.color }}>/100</span>
                            </div>
                          </div>
                          <Badge className="text-sm font-bold px-3 py-1" style={{
                            backgroundColor: riskLevel.color,
                            color: '#FFFFFF'
                          }}>
                            {riskLevel.label}
                          </Badge>
                        </div>
                        {selectedScan.summary && (
                          <p className="text-xs leading-relaxed mt-3 pt-3 border-t" style={{
                            color: riskLevel.color,
                            borderTopColor: `${riskLevel.color}50`
                          }}>
                            {selectedScan.summary}
                          </p>
                        )}
                      </div>

                      {/* Missing Critical Clauses Detection - Phase 1 */}
                      {selectedScan.scan_full?.missingCriticalClauses && (
                        <MissingCriticalClauses
                          missingCriticalClauses={selectedScan.scan_full.missingCriticalClauses}
                          language={language}
                          isDarkMode={isDarkMode}
                        />
                      )}

                      {/* Primary Action: View Full Report */}
                      <Button
                        onClick={() => {
                          haptic.medium();
                          setSelectedLease(null);
                          navigate(createPageUrl("ReportFull") + `?scanId=${selectedScan.id}&leaseId=${selectedLease.id}`);
                        }}
                        className="w-full py-4 text-base font-bold"
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF',
                          minHeight: '56px'
                        }}
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        {strings.viewFullReport}
                      </Button>

                      {/* Secondary Actions */}
                      <div className="flex flex-col gap-2">
                        {selectedLease.file_url && (
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.light();
                              setDocumentToView(selectedLease);
                              setShowDocumentModal(true);
                            }}
                            className="w-full justify-center py-3"
                            style={{
                              borderColor: colors.borderColor,
                              color: colors.textPrimary
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {strings.viewLease}
                            {selectedLease.file_urls && selectedLease.file_urls.length > 1 && (
                              <Badge className="ml-2 text-xs bg-emerald-100 text-emerald-700">
                                {selectedLease.file_urls.length} {language === 'th' ? 'หน้า' : language === 'ru' ? 'стр.' : 'pages'}
                              </Badge>
                            )}
                          </Button>
                        )}

                        {selectedLease.status === 'scanned' && (
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.medium();
                              setAddingPagesToLease(selectedLease);
                              setSelectedLease(null);
                            }}
                            className="w-full justify-center py-2 text-sm"
                            style={{
                              borderColor: '#0C3B2E',
                              color: '#0C3B2E'
                            }}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {language === 'th' ? 'เพิ่มหน้า' : language === 'ru' ? 'Добавить страницы' : 'Add pages'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Destructive Action */}
                <div className="pt-4 border-t" style={{ borderColor: colors.borderColor }}>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.heavy();
                      handleDeleteLease(selectedLease.id, e);
                    }}
                    className="w-full justify-center py-3 text-sm font-semibold border-red-600 text-red-600 hover:bg-red-50"
                    style={isDarkMode ? { 
                      backgroundColor: '#3A2626',
                      borderColor: '#EF4444',
                      color: '#FCA5A5'
                    } : {}}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'th' ? 'ลบสัญญาเช่านี้' : language === 'ru' ? 'Удалить договор' : 'Delete This Lease'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Completion Modal */}
        <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
          <DialogContent
            className="max-w-md w-[90vw]"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl" style={{ color: colors.textPrimary }}>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              {language === 'th' ? 'วิเคราะห์เสร็จสิ้น' : language === 'ru' ? 'Анализ завершен' : 'Lease Analysed'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'สัญญาเช่าของคุณได้รับการวิเคราะห์เรียบร้อยแล้ว'
                  : language === 'ru'
                    ? 'Ваш договор аренды успешно проанализирован'
                    : 'Your lease has been successfully analysed'}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCompletionViewResults}
                  className="w-full"
                  style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {language === 'th' ? 'ดูผลลัพธ์' : language === 'ru' ? 'Посмотреть результаты' : 'View Results'}
                </Button>
                <Button
                  onClick={handleCompletionDone}
                  variant="outline"
                  className="w-full"
                >
                  {language === 'th' ? 'เสร็จสิ้น' : language === 'ru' ? 'Готово' : 'Done'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Pages Modal */}
        <Dialog open={!!addingPagesToLease} onOpenChange={() => {
          setAddingPagesToLease(null);
          setAdditionalFiles([]);
        }}>
          <DialogContent
            className="max-w-lg w-[95vw]"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'เพิ่มหน้าเข้าสัญญา' : language === 'ru' ? 'Добавить страницы' : 'Add Pages to Lease'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {uploading ? (
                <UploadProgress
                  currentStage={analysisStage}
                  progress={uploadProgress}
                  fileCount={additionalFiles.length}
                  primaryColor={colors.textPrimary}
                  secondaryColor={colors.textSecondary}
                  language={language}
                  isAnalyzing={analyzing}
                  isUploading={uploading}
                  strings={strings}
                />
              ) : (
                <>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' 
                      ? `สัญญาปัจจุบัน: ${addingPagesToLease?.file_urls?.length || 1} หน้า`
                      : language === 'ru'
                        ? `Текущий договор: ${addingPagesToLease?.file_urls?.length || 1} стр.`
                        : `Current lease: ${addingPagesToLease?.file_urls?.length || 1} page(s)`}
                  </p>
                  
                  <div className="space-y-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setAdditionalFiles(files);
                        }}
                        className="hidden"
                      />
                      <div className="p-4 border-2 border-dashed rounded-lg text-center"
                        style={{ borderColor: colors.borderColor }}
                      >
                        <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {language === 'th' ? 'ถ่ายรูปหน้าเพิ่มเติม' : language === 'ru' ? 'Сфотографировать страницы' : 'Take photos of additional pages'}
                        </p>
                      </div>
                    </label>

                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setAdditionalFiles(files);
                        }}
                        className="hidden"
                      />
                      <div className="p-4 border-2 border-dashed rounded-lg text-center"
                        style={{ borderColor: colors.borderColor }}
                      >
                        <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {language === 'th' ? 'เลือกไฟล์' : language === 'ru' ? 'Выбрать файлы' : 'Browse files'}
                        </p>
                      </div>
                    </label>
                  </div>

                  {additionalFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                        {language === 'th' ? `เลือกแล้ว ${additionalFiles.length} ไฟล์` : language === 'ru' ? `Выбрано ${additionalFiles.length} файлов` : `${additionalFiles.length} file(s) selected`}
                      </p>
                      {additionalFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: colors.fieldBg }}>
                          <FileText className="w-4 h-4" style={{ color: colors.textSecondary }} />
                          <span className="text-xs flex-1" style={{ color: colors.textPrimary }}>{file.name}</span>
                          <button onClick={() => setAdditionalFiles(prev => prev.filter((_, i) => i !== idx))}>
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddingPagesToLease(null);
                        setAdditionalFiles([]);
                      }}
                      className="flex-1"
                    >
                      {language === 'th' ? 'ยกเลิก' : language === 'ru' ? 'Отмена' : 'Cancel'}
                    </Button>
                    <Button
                      onClick={handleAddPages}
                      disabled={additionalFiles.length === 0}
                      className="flex-1"
                      style={{ 
                        backgroundColor: additionalFiles.length > 0 ? '#0C3B2E' : '#9CA3AF',
                        color: '#FFFFFF'
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {language === 'th' ? 'อัปโหลด' : language === 'ru' ? 'Загрузить' : 'Upload'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Document Viewer Modal */}
        <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
          <DialogContent
            className="max-w-md w-[90vw]"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'เอกสารสัญญาเช่า' : language === 'ru' ? 'Документ аренды' : 'Lease Document'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'เลือกวิธีดูเอกสาร' 
                  : language === 'ru'
                    ? 'Выберите способ просмотра'
                    : 'Choose how to view your document'}
              </p>
              
              <Button
                onClick={() => {
                  haptic.medium();
                  setShowDocumentModal(false);
                  
                  // Open document in new tab
                  if (documentToView?.file_urls && documentToView.file_urls.length > 1) {
                    navigate(createPageUrl("LeaseViewer") + `?leaseId=${documentToView.id}`);
                  } else {
                    window.open(documentToView?.file_url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="w-full py-4"
                style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                {language === 'th' ? 'ดูออนไลน์' : language === 'ru' ? 'Посмотреть онлайн' : 'View Online'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  haptic.light();
                  setShowDocumentModal(false);
                  
                  // Download all pages
                  if (documentToView?.file_urls && documentToView.file_urls.length > 1) {
                    documentToView.file_urls.forEach((url, idx) => {
                      setTimeout(() => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `lease-page-${idx + 1}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }, idx * 500);
                    });
                  } else {
                    const link = document.createElement('a');
                    link.href = documentToView?.file_url;
                    link.download = 'lease-document';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="w-full py-3"
              >
                <Download className="w-5 h-5 mr-2" />
                {language === 'th' ? 'ดาวน์โหลด' : language === 'ru' ? 'Скачать' : 'Download'}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  haptic.light();
                  setShowDocumentModal(false);
                  setDocumentToView(null);
                }}
                className="w-full"
              >
                {language === 'th' ? 'ยกเลิก' : language === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disclaimer Modal - one-time, simplified */}
        <DisclaimerModal
          isOpen={showDisclaimerModal}
          onClose={() => {
            setShowDisclaimerModal(false);
            pendingDisclaimerFiles.current = null;
          }}
          onAccept={handleAcceptDisclaimer}
          language={language}
          isDarkMode={isDarkMode}
        />

        {/* Upload Zone */}
        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <div className="p-6 md:p-8">
            {uploading || analyzing ? (
              <UploadProgress
                currentStage={analysisStage}
                progress={uploadProgress}
                fileCount={selectedFiles.length}
                primaryColor={colors.textPrimary}
                secondaryColor={colors.textSecondary}
                language={language}
                isAnalyzing={analyzing}
                isUploading={uploading}
                strings={strings}
                retryCount={retryCount}
              />
            ) : (
              <>
                {/* ✅ SHOW UPGRADE BANNER IF LIMIT REACHED */}
                {!isLoadingUser && !scanStatus.allowed && (
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

                {/* Batch Mode Info */}
                {selectedFiles.length > 1 && (
                  <div className="mb-4 p-4 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF',
                    border: '2px solid #3B82F6'
                  }}>
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-bold text-sm" style={{ color: isDarkMode ? '#93C5FD' : '#1D4ED8' }}>{strings.batchUpload}</p>
                        <p className="text-xs" style={{ color: isDarkMode ? '#BFDBFE' : '#2563EB' }}>{strings.filesWillBeSeparate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trust Block */}
                <div className="mb-4 flex flex-col items-center text-center">
                  <img src="https://media.base44.com/images/public/68fd84b6c148652a5512a0a0/740ab03b9_pdpa-alignment-badge.png" alt="PDPA Alignment Badge" style={{ height: '120px', width: 'auto' }} />
                  <p className="mt-2 px-4 max-w-sm" style={{ fontSize: '10px', color: colors.textSecondary, opacity: 0.7, lineHeight: '1.5' }}>
                    This badge represents Lease Shield's internal privacy and data-protection measures. It is not a government certification, independent legal certification, or third-party endorsement.
                  </p>
                </div>

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
                  <p className="mb-4 font-semibold" style={{ color: colors.textPrimary }}>{strings.supportedFormats}</p>

                  {/* Hidden file input */}
                  <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                   onChange={(e) => {
                     if (!scanStatus.allowed) return;

                     const files = Array.from(e.target.files || []);

                     if (files.length === 0) return;

                     // Validate file types
                     const validFiles = [];
                     const invalidFiles = [];

                     files.forEach(file => {
                       const ext = file.name.toLowerCase().split('.').pop();
                       if (['pdf','jpg','jpeg','png'].includes(ext) || ['application/pdf','image/jpeg','image/png'].includes(file.type)) { validFiles.push(file); } else { invalidFiles.push(file.name); }
                     });
                     if (invalidFiles.length > 0) { setError(`Supports PDF, JPG, PNG only.\n\nUnsupported: ${invalidFiles.join(', ')}`); setTimeout(() => setError(null), 5000); }
                     if (validFiles.length > 0) { handleUploadAll(validFiles); }
                     e.target.value = '';
                   }}
                   className="hidden"
                   disabled={!scanStatus.allowed}
                  />

                  <div className="flex justify-center">
                   <button
                     onClick={() => {
                       if (!scanStatus.allowed) return;
                       haptic.light();
                       fileInputRef.current?.click();
                     }}
                     disabled={!scanStatus.allowed}
                     className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold ${!scanStatus.allowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                     style={{
                      backgroundColor: '#0C3B2E',
                      color: '#FFFFFF',
                      border: 'none',
                      minHeight: '56px',
                      fontSize: '16px'
                     }}
                   >
                     <Upload className="w-5 h-5" />
                     {strings.scanCTA}
                   </button>
                  </div>
                  </div>
                  {/* Redaction tip */}
                  <p className="mt-3 text-center px-4" style={{ fontSize: '11px', color: colors.textSecondary }}>
                   Tip: Remove your name and address before uploading. It does not affect the analysis.
                  </p>
                  </>
                  )}
                  </div>
                  </Card>

        {/* All Leases List - WITH SWIPE */}
        {leases.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              {strings.allLeases} ({leases.length})
            </h2>
            <div className="grid gap-3">
              {leases.map((lease) => (
                <SwipeToDelete
                  key={lease.id}
                  onDelete={() => handleSwipeDelete(lease.id)}
                  deleteLabel={language === 'th' ? 'ลบ' : 'Delete'}
                  colors={colors}
                >
                  <Card
                    className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer"
                    style={{ backgroundColor: colors.cardBg }}
                    onClick={() => {
                      haptic.light();
                      handleViewDetails(lease);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-ls-forest flex-shrink-0 mt-0.5" />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base mb-1 line-clamp-2" style={{
                            color: colors.textPrimary,
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            lineHeight: '1.4'
                          }}>
                            {lease.original_filename || lease.property_address || (language === 'th' ? 'สัญญาเช่า' : language === 'ru' ? 'Договор аренды' : 'Lease Agreement')}
                          </h3>
                          <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                            {strings.scanDate}: {format(new Date(lease.created_date), 'dd MMM yyyy')}
                          </p>
                          {lease.file_urls && lease.file_urls.length > 1 && (
                            <Badge className="bg-blue-50 text-blue-700 text-xs border-blue-200">
                              {lease.file_urls.length} {language === 'th' ? 'หน้า' : language === 'ru' ? 'стр.' : 'pages'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {lease.status === 'scanned' && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              {language === 'th' ? 'วิเคราะห์แล้ว' : language === 'ru' ? 'Проанализировано' : 'Analysed'}
                            </Badge>
                          )}
                          {(lease.status === 'uploaded' || lease.status === 'ok') && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              {language === 'th' ? 'วิเคราะห์แล้ว' : language === 'ru' ? 'Проанализировано' : 'Analysed'}
                            </Badge>
                          )}
                          {lease.status === 'queued' && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              {language === 'th' ? 'คิว' : language === 'ru' ? 'В очереди' : 'Queued'}
                            </Badge>
                          )}
                          {lease.status === 'processing' && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              {language === 'th' ? 'ประมวลผล' : language === 'ru' ? 'Обработка' : 'Processing'}
                            </Badge>
                          )}
                          {lease.status === 'failed' && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {language === 'th' ? 'ล้มเหลว' : language === 'ru' ? 'Ошибка' : 'Failed'}
                            </Badge>
                          )}
                          
                          {(lease.status === 'uploaded' || lease.status === 'failed') && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <RetryAnalysis 
                                lease={lease} 
                                language={language}
                                colors={colors}
                                user={user}
                                leases={leases}
                                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['leases', 'allScans'] })}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </SwipeToDelete>
              ))}
            </div>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-8 p-4 rounded-lg text-center max-w-4xl mx-auto" style={{
          backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC',
          border: `1px solid ${colors.borderColor}`
        }}>
          <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
            {language === 'th' 
              ? 'Lease Shield ให้คำแนะนำทั่วไปและเทมเพลตเอกสารเพื่อความสะดวกของคุณ Lease Shield ไม่ใช่สำนักงานกฎหมาย ไม่ให้บริการตัวแทนทางกฎหมาย และไม่ได้เป็นคู่สัญญาในสัญญาเช่าของคุณ คุณมีหน้าที่รับผิดชอบในการตรวจสอบความถูกต้องของข้อมูลและเอกสารทั้งหมดก่อนส่ง'
              : language === 'zh'
                ? 'Lease Shield为您提供一般性指导和文档模板以方便使用。Lease Shield不是律师事务所，不提供法律代理，也不是您租约的一方。在发送之前，您有责任检查所有信息和文档的准确性。'
                : language === 'ja'
                  ? 'Lease Shieldは、お客様の便宜のために一般的なガイダンスと文書テンプレートを提供します。Lease Shieldは法律事務所ではなく、法的代理を提供せず、お客様のリース契約の当事者でもありません。送信する前に、すべての情報と文書の正確性を確認する責任はお客様にあります。'
                  : language === 'ko'
                    ? 'Lease Shield는 귀하의 편의를 위해 일반적인 안내 및 문서 템플릿을 제공합니다。Lease Shield는 법률 회사가 아니며 법적 대리를 제공하지 않으며 귀하의 임대 계약 당사자가 아닙니다。발송하기 전에 모든 정보와 문서의 정확성을 확인할 책임은 귀하에게 있습니다。'
                    : language === 'ru'
                      ? 'Lease Shield предоставляет общие рекомендации и шаблоны документов для вашего удобства。Lease Shield не является юридической фирмой、не предоставляет юридическое представительство и не является стороной вашего договора аренды。Вы несёте ответственность за проверку точности всей информации и документов перед отправкой。'
                      : 'Lease Shield provides general guidance and document templates for your convenience. Lease Shield is not a law firm, does not provide legal representation, and is not a party to your lease. You are responsible for checking the accuracy of all information and documents before sending them.'}
          </p>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default function UploadScanPage() {
  return (
    <AuthGuard>
      <UploadScanPageContent />
    </AuthGuard>
  );
}