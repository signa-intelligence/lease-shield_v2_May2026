import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Trash2, ExternalLink, Shield, Camera, FileVideo, Mail, HelpCircle, CheckSquare, Square, ArrowLeft, X, Loader2, ArrowRight, Eye, Download, Edit2, Send, CheckCircle2, Mic, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LetterPreview from "../components/shared/LetterPreview";
import DocumentAnnotation from "../components/documents/DocumentAnnotation";
import { compressMultipleImages } from "../components/shared/ImageCompression";
import { uploadFilesSequentially } from "../components/evidence/uploadFiles";
import { haptic } from "../components/shared/HapticFeedback";
import UploadProgress from "../components/shared/UploadProgress";
import SwipeToDelete from "../components/shared/SwipeToDelete";
import BottomSheet from "../components/shared/BottomSheet";
import MobileFormInput from "../components/shared/MobileFormInput";
import LazyImage from "../components/shared/LazyImage";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import { useOptimisticUpdate } from "../components/shared/OptimisticUpdate";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import AuthGuard from "../components/shared/AuthGuard";
import TrustBadge from "../components/shared/TrustBadge";
import {
  FEATURE_COLORS,
  CTA_COLOR,
  primaryCtaStyle,
  primaryCtaHover
} from "../components/shared/featureTheme";

const evidenceAccent = FEATURE_COLORS.evidence.accent;

import { DOC_TYPE_CONFIG as _DOC_TYPE_CONFIG_DATA, getDocTypeLabel, getEvidenceStrings } from "../components/evidence/evidenceStrings";

// Add icon references to the imported config
const DOC_TYPE_CONFIG = {
  lease: { ..._DOC_TYPE_CONFIG_DATA.lease, icon: FileText },
  receipt: { ..._DOC_TYPE_CONFIG_DATA.receipt, icon: FileText },
  photo: { ..._DOC_TYPE_CONFIG_DATA.photo, icon: Camera },
  video: { ..._DOC_TYPE_CONFIG_DATA.video, icon: FileVideo },
  letter: { ..._DOC_TYPE_CONFIG_DATA.letter, icon: Mail },
  other: { ..._DOC_TYPE_CONFIG_DATA.other, icon: HelpCircle },
};

function EvidenceVaultContent() {
  const navigate = useNavigate();
  const toast = useToast();
  // Upload dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [error, setError] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);

  // Voice/Video states
  const [voiceFiles, setVoiceFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalType, setUpgradeModalType] = useState(''); // 'video'

  // Existing states for document management
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editFormData, setEditFormData] = useState({ type: '', label: '' });
  const [viewingDoc, setViewingDoc] = useState(null);
  const [annotatingDocument, setAnnotatingDocument] = useState(null);
  const queryClient = useQueryClient();

  const [exportingZip, setExportingZip] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: documents = [], isLoading: isLoadingDocuments, error: documentsError } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Document.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
    retry: 2,
    staleTime: 30000,
  });

  // ADDED: Optimistic update hook
  const optimistic = useOptimisticUpdate(['documents'], 'Document');

  // For now, no filtering logic provided, so filteredDocuments is all documents
  const filteredDocuments = documents;

  const getStorageLimits = () => {
    const rawT = (user?.plan_tier || 'free').toLowerCase().trim();
    const tier = rawT === 'explorer' ? 'free' : rawT;
    switch(tier) {
      case 'free': return { limit: 100 * 1024 * 1024, limitMB: 100, fileLimit: 3 };
      case 'lite': return { limit: 1024 * 1024 * 1024, limitMB: 1024, fileLimit: 999 };
      case 'protect': return { limit: 5 * 1024 * 1024 * 1024, limitMB: 5120, fileLimit: 999 };
      case 'secure': return { limit: 20 * 1024 * 1024 * 1024, limitMB: 20480, fileLimit: 999 };
      default: return { limit: 100 * 1024 * 1024, limitMB: 100, fileLimit: 3 };
    }
  };

  // Calculate total storage used (estimate based on document count since we don't store file sizes)
  // For now, estimate 2MB per document average
  const estimateTotalStorage = () => {
    return documents.length * 2 * 1024 * 1024; // Rough estimate: 2MB per file
  };

  const canUploadFiles = (fileCount) => {
    const limits = getStorageLimits();
    const currentFileCount = documents.length;

    // Check file count limit (Free tier only)
    const effTier = (user?.plan_tier || 'free').toLowerCase().trim();
    const isFreeOrExplorer = effTier === 'free' || effTier === 'explorer';
    if (isFreeOrExplorer && currentFileCount + fileCount > limits.fileLimit) {
      return {
        allowed: false,
        reason: 'file_limit',
        current: currentFileCount,
        limit: limits.fileLimit
      };
    }

    // For storage, we'll do a rough check
    // Since we don't have exact file sizes in DB, we'll be permissive
    return {
      allowed: true,
      usedMB: Math.round(estimateTotalStorage() / 1024 / 1024),
      limitMB: limits.limitMB
    };
  };

  const createDocumentMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onMutate: async (newDoc) => {
      haptic.light();

      const tempId = `optimistic-${Date.now()}-${Math.random()}`;
      const optimisticItem = {
        ...newDoc,
        id: tempId,
        created_date: new Date().toISOString(),
        created_by: user?.email,
        __optimistic: true,
      };

      optimistic.optimisticCreate(optimisticItem);
      return { optimisticItem };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      haptic.success();
      toast.success(strings.uploadSuccess);
    },
    onError: (error, variables, context) => {
      optimistic.revert(context.optimisticItem.id);
      haptic.error();
      toast.error(strings.uploadFailed);
    }
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onMutate: async ({ id, data }) => {
      haptic.medium();
      optimistic.optimisticUpdate(id, data);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingDoc(null);
      haptic.success();
      toast.success(strings.editSuccess);
    },
    onError: (error, variables, context) => {
      optimistic.revert(context.id);
      haptic.error();
      toast.error(strings.editFailed);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onMutate: async (idToDelete) => {
      haptic.heavy();
      optimistic.optimisticDelete(idToDelete);
      return { idToDelete };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocs([]); // Clear selection in case a selected item was deleted
      haptic.success();
      toast.success(strings.deleteSuccess);
    },
    onError: (error, variables, context) => {
      optimistic.revert(context.idToDelete);
      haptic.error();
      toast.error(strings.deleteFailed);
    },
  });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Check if any video files are selected and user is not on Protect/Secure tier
    const hasVideoFiles = files.some(f => f.type.startsWith('video/'));
    if (hasVideoFiles && !isVideoTier) {
      setUpgradeModalType('video');
      setShowUpgradeModal(true);
      e.target.value = null;
      return;
    }

    // Validate video file sizes (50 MB max)
    const maxVideoBytes = MAX_VIDEO_SIZE_MB * 1024 * 1024;
    for (const f of files) {
      if (f.type.startsWith('video/') && f.size > maxVideoBytes) {
        toast.error(
          language === 'th'
            ? `ไฟล์วิดีโอใหญ่เกินไป: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB) — สูงสุด ${MAX_VIDEO_SIZE_MB} MB`
            : `Video too large: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB) — max ${MAX_VIDEO_SIZE_MB} MB`
        );
        e.target.value = null;
        return;
      }
    }

    console.log('[EV] Files selected:', files.map(f => `${f.name} (${f.type}, ${(f.size/1024).toFixed(1)}KB)`));
    setUploadFiles(prev => [...prev, ...files]);
    e.target.value = null;
  };

  const [showVideoActionSheet, setShowVideoActionSheet] = useState(false);

  const getExistingVideoCount = () => {
    return documents.filter(d => d.type === 'video').length;
  };

  const handleVideoClick = () => {
    if (!isVideoTier) {
      setUpgradeModalType('video');
      setShowUpgradeModal(true);
      return;
    }

    const totalVideos = getExistingVideoCount() + videoFiles.length;
    if (totalVideos >= MAX_VIDEO_COUNT) {
      toast.error(
        language === 'th'
          ? `ถึงขีดจำกัดวิดีโอแล้ว (${MAX_VIDEO_COUNT} วิดีโอสำหรับแพลน Protect)`
          : `Video limit reached (${MAX_VIDEO_COUNT} videos on Protect plan)`
      );
      return;
    }

    setShowVideoActionSheet(true);
  };

  const handleVideoUpload = () => {
    setShowVideoActionSheet(false);
    document.getElementById('video-evidence-input').click();
  };

  const handleVideoRecord = async () => {
    setShowVideoActionSheet(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const file = new File([blob], `recorded_${Date.now()}.mp4`, { type: 'video/mp4' });
        setVideoFiles(prev => [...prev, file]);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 60000);
      
      toast.info(language === 'th' ? 'กำลังบันทึก... จะหยุดอัตโนมัติใน 60 วินาที' : language === 'zh' ? '正在录制... 将在60秒后自动停止' : language === 'ja' ? '録画中... 60秒後に自動停止します' : language === 'ko' ? '녹화 중... 60초 후 자동 정지' : language === 'ru' ? 'Идёт запись... Автостоп через 60 сек' : 'Recording... Will auto-stop in 60 seconds');
      
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error(language === 'th' ? 'ไม่สามารถเข้าถึงกล้องได้' : language === 'zh' ? '无法访问相机' : language === 'ja' ? 'カメラにアクセスできません' : language === 'ko' ? '카메라 액세스 불가' : language === 'ru' ? 'Нет доступа к камере' : 'Cannot access camera');
    }
  };

  const handleVoiceClick = () => {
    if (voiceFiles.length >= 3) {
      toast.error(strings.maxVoiceReached);
      return;
    }

    document.getElementById('voice-evidence-input').click();
  };

  const handleVoiceSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      const isAudio = f.type.startsWith('audio/');
      const isUnder5MB = f.size <= 5 * 1024 * 1024;

      if (!isAudio) {
        toast.error(language === 'th' ? 'กรุณาเลือกไฟล์เสียงเท่านั้น' : 'Please select audio files only');
        return false;
      }

      if (!isUnder5MB) {
        toast.error(`${strings.fileTooLarge}: ${f.name} - ${strings.voiceMaxSize}`);
        return false;
      }

      return true;
    });

    const remaining = 3 - voiceFiles.length;
    const toAdd = validFiles.slice(0, remaining);

    setVoiceFiles(prev => [...prev, ...toAdd]);
    haptic.light();
  };

  const handleVideoSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const maxSizeBytes = MAX_VIDEO_SIZE_MB * 1024 * 1024;
    const existingCount = getExistingVideoCount();

    const validFiles = files.filter(f => {
      const isVideo = f.type.startsWith('video/');

      if (!isVideo) {
        toast.error(language === 'th' ? 'กรุณาเลือกไฟล์วิดีโอเท่านั้น' : 'Please select video files only');
        return false;
      }

      if (f.size > maxSizeBytes) {
        toast.error(
          language === 'th'
            ? `ไฟล์ใหญ่เกินไป: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB) — สูงสุด ${MAX_VIDEO_SIZE_MB} MB`
            : `File too large: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB) — max ${MAX_VIDEO_SIZE_MB} MB`
        );
        return false;
      }

      return true;
    });

    const remaining = MAX_VIDEO_COUNT - existingCount - videoFiles.length;
    if (remaining <= 0) {
      toast.error(
        language === 'th'
          ? `ถึงขีดจำกัดวิดีโอแล้ว (${MAX_VIDEO_COUNT} วิดีโอสำหรับแพลน Protect)`
          : `Video limit reached (${MAX_VIDEO_COUNT} videos on Protect plan)`
      );
      return;
    }
    const toAdd = validFiles.slice(0, remaining);

    setVideoFiles(prev => [...prev, ...toAdd]);
    haptic.light();
  };

  const handleRemoveVoice = (index) => {
    haptic.light();
    setVoiceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index) => {
    haptic.light();
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 && voiceFiles.length === 0 && videoFiles.length === 0) {
      setError(strings.selectFile);
      return;
    }

    // CHECK STORAGE/FILE LIMITS
    const uploadCheck = canUploadFiles(uploadFiles.length);
    if (!uploadCheck.allowed) {
      if (uploadCheck.reason === 'file_limit') {
        setError(
          language === 'th'
            ? `ถึงขีดจำกัดไฟล์แล้ว (${uploadCheck.current}/${uploadCheck.limit} ไฟล์)\n\nอัปเกรดเพื่อจัดเก็บไฟล์เพิ่มเติม`
            : `File limit reached (${uploadCheck.current}/${uploadCheck.limit} files)\n\nUpgrade for more storage`
        );
        return;
      }
    }

    haptic.medium();
    setUploading(true);
    setError(null);
    setCompressionStats(null);
    setUploadStage('compressing'); // Following outline: set compressing stage here
    setUploadProgressPercent(0);

    try {
      console.log('[EV] Starting upload:', uploadFiles.length, 'files');
      const { files: compressedFiles, stats } = await compressMultipleImages(uploadFiles, (progress) => {
        setUploadProgressPercent(Math.round(progress * 40));
      });
      if (stats.compressedCount > 0) setCompressionStats(stats);

      setUploadStage('uploadingFiles');
      setUploadProgressPercent(40);

      const allFilesToUpload = [...compressedFiles, ...voiceFiles, ...videoFiles];
      console.log('[EV] Uploading', allFilesToUpload.length, 'files to storage');

      // Upload files one at a time with retry, size validation, and better error messages
      const { results, failedFiles } = await uploadFilesSequentially(allFilesToUpload, {
        language,
        onProgress: (i, total) => {
          setUploadProgressPercent(40 + Math.round(((i + 1) / total) * 30));
        }
      });

      if (results.length === 0) {
        const detail = failedFiles.length > 0 ? failedFiles.join('\n') : strings.uploadFailed;
        console.error('[EV] ALL UPLOADS FAILED:', detail);
        throw new Error(failedFiles.length > 0 
          ? `Upload failed:\n${detail}` 
          : strings.uploadFailed);
      }

      setUploadStage('savingDocuments');
      for (let idx = 0; idx < results.length; idx++) {
        const { result, fileIndex } = results[idx];
        let docType = uploadType;
        if (fileIndex >= compressedFiles.length && fileIndex < compressedFiles.length + voiceFiles.length) {
          docType = 'other';
        } else if (fileIndex >= compressedFiles.length + voiceFiles.length) {
          docType = 'video';
        }
        const typeLabel = getDocTypeLabel(docType, language);

        console.log('[EV] Creating doc record:', docType, result.file_url);
        await createDocumentMutation.mutateAsync({
          type: docType,
          file_url: result.file_url,
          label: uploadLabel || strings.defaultDocLabel.replace('{docType}', typeLabel).replace('{date}', new Date().toLocaleDateString()),
        });
        setUploadProgressPercent(70 + Math.round(((idx + 1) / results.length) * 30));
      }

      console.log('[EV] All uploads complete. Success:', results.length, 'Failed:', failedFiles.length);
      setShowUploadDialog(false);
      setUploadFiles([]);
      setVoiceFiles([]);
      setVideoFiles([]);
      setUploadType('photo');
      setUploadLabel('');
      if (failedFiles.length > 0) {
        toast.warning(`${results.length} uploaded, ${failedFiles.length} failed: ${failedFiles.join(', ')}`);
      } else {
        toast.success(strings.uploadSuccess);
      }
    } catch (err) {
      console.error('[EV] UPLOAD FAILED:', err?.message, err?.response?.data, err);
      setError(err?.message || strings.uploadFailed);
      haptic.error();
      toast.error(strings.uploadFailed);
    } finally {
      setUploading(false);
      setUploadStage('');
      setUploadProgressPercent(0);
    }
  };

  const handleSelectAll = () => {
    haptic.light();
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleToggleSelect = (docId) => {
    haptic.light();
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleDelete = (docId) => {
    if (confirm(strings.confirmDelete)) { // Using new string
      deleteDocumentMutation.mutate(docId); // haptic is now in onMutate
    }
  };

  const handleSwipeDelete = (docId) => {
    deleteDocumentMutation.mutate(docId); // haptic is now in onMutate
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.length === 0) return;

    if (confirm(strings.confirmBulkDelete.replace('{count}', selectedDocs.length))) {
      // haptic.heavy() is now in onMutate of deleteDocumentMutation
      try {
        // Run mutations sequentially to avoid too many optimistic updates at once,
        // but still trigger individual optimistic effects.
        for (const docId of selectedDocs) {
          await deleteDocumentMutation.mutateAsync(docId);
        }
        queryClient.invalidateQueries({ queryKey: ['documents'] }); // Invalidate once after all deletes are confirmed by server
        setSelectedDocs([]);
        // haptic.success() is handled by deleteDocumentMutation onSuccess
      } catch (error) {
        console.error("Bulk delete failed:", error);
        toast.error(strings.deleteFailed);
        haptic.error();
      }
    }
  };

  const handleBulkExportZip = async () => {
    if (selectedDocs.length === 0) {
      toast.warning(strings.pleaseSelectDocuments);
      return;
    }
    haptic.light();
    setExportingZip(true);
    try {
      const response = await base44.functions.invoke('bulkExportDocuments', {
        documentIds: selectedDocs
      });

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LeaseShield_Documents_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setSelectedDocs([]);
      haptic.success();
      toast.success(strings.exportSuccess);
    } catch (error) {
      console.error('Export failed:', error);
      haptic.error();
      toast.error(strings.exportFailed);
    } finally {
      setExportingZip(false);
    }
  };

  const handleExportAllReport = async () => {
    haptic.light();
    setExportingPdf(true);
    try {
      const response = await base44.functions.invoke('generateDataReport');

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LeaseShield_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      haptic.success();
      toast.success(strings.exportSuccess);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(strings.exportFailed);
      haptic.error();
    } finally {
      setExportingPdf(false);
    }
  };

  const handleView = (doc) => {
    haptic.light();
    // For letter type with html_content, use LetterPreview component
    if (doc.type === 'letter' && doc.html_content) {
      setViewingDoc(doc);
    } else {
      setViewingDoc(doc);
    }
  };

  const handleDownload = (doc) => {
    haptic.light();
    if (!doc.file_url) {
      console.error("Document has no file_url to download:", doc);
      toast.error(strings.downloadFailed);
      haptic.error();
      return;
    }

    const link = document.createElement('a');
    link.href = doc.file_url;
    const filename = doc.file_url.substring(doc.file_url.lastIndexOf('/') + 1);
    link.download = doc.label || filename || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    haptic.success();
  };

  const handleEdit = (doc) => {
    haptic.light();
    setEditingDoc(doc);
    setEditFormData({ type: doc.type, label: doc.label || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingDoc) return;

    // haptic.medium() is now in onMutate of updateDocumentMutation
    try {
      await updateDocumentMutation.mutateAsync({
        id: editingDoc.id,
        data: {
          type: editFormData.type,
          label: editFormData.label
        }
      });
      // haptic.success() is now in onSuccess of updateDocumentMutation
    } catch (error) {
      console.error('Failed to save document edit:', error);
      toast.error(strings.editFailed);
      haptic.error();
    }
  };

  const handleSendEmail = (doc) => {
    haptic.light();
    const config = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.other;
    const docLabel = doc.label || (
      language === 'zh' ? config.label_zh :
      language === 'ja' ? config.label_ja :
      language === 'ko' ? config.label_ko :
      language === 'th' ? config.label_th :
      language === 'ru' ? config.label_ru :
      config.label_en
    );

    const subject = `${docLabel}`;

    let body = '';

    // For letters, extract and format as proper email
    if (doc.type === 'letter' && doc.html_content) {
      // Parse HTML properly using DOMParser
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(doc.html_content, 'text/html');

      // Remove all non-content elements
      htmlDoc.querySelectorAll('style, script, .header, .footer, .section-title').forEach(el => el.remove());

      // Get full text
      const fullText = (htmlDoc.body.textContent || htmlDoc.body.innerText || '').trim();

      // Extract English letter: Start from "Dear" to closing
      let englishMatch = fullText.match(new RegExp(`${strings.dear}[\s\S]*?(${strings.closingRegards})`, 'i'));
      let englishLetter = englishMatch ? englishMatch[0].trim() : '';
      
      let letterContent = englishLetter;

      // If no letters extracted, fallback
      if (!letterContent) {
        letterContent += strings.letterExtractionFailed;
      }

      // Format final email with footer
      body = `${letterContent}\n\n---\n\n${strings.createdBy} Lease Shield - https://www.leaseshield.asia`;
    } else {
      // For other document types
      const documentText = language === 'zh' ? '文档' : language === 'ja' ? 'ドキュメント' : language === 'ko' ? '문서' : language === 'th' ? 'เอกสาร' : 'Document';
      const dateText = language === 'zh' ? '日期' : language === 'ja' ? '日付' : language === 'ko' ? '날짜' : language === 'th' ? 'วันที่' : 'Date';

      body = `${documentText}: ${docLabel}\n${dateText}: ${format(new Date(doc.created_date), language === 'th' ? 'dd/MM/yyyy' : 'MMM d, yyyy')}\n\n${doc.file_url}`;
    }

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleSaveAnnotation = async (annotatedDataUrl) => {
    if (!annotatingDocument) return;
    haptic.medium();
    try {
      // Convert data URL to blob
      const response = await fetch(annotatedDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `annotated_${Date.now()}.png`, { type: 'image/png' });

      // Upload annotated version
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Update document with new URL using mutation for optimistic update
      await updateDocumentMutation.mutateAsync({
        id: annotatingDocument.id,
        data: {
          file_url: file_url
        }
      });

      // Query invalidation and haptic.success are handled by updateDocumentMutation's onSuccess
      setAnnotatingDocument(null);

      toast.success(strings.annotationSaved);
    } catch (error) {
      console.error('Failed to save annotation:', error);
      toast.error(strings.annotationFailed);
      haptic.error();
    }
  };

  const handleCardClick = (doc) => {
    haptic.light();
    if (bulkMode) {
      handleToggleSelect(doc.id);
    } else {
      handleView(doc);
    }
  };

  const handleRefresh = async () => {
    haptic.light();
    await queryClient.invalidateQueries({ queryKey: ['documents'] });
    toast.success(strings.refreshed);
  };

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const rawTier = (user?.plan_tier || 'free').toLowerCase().trim();
  const userTier = (rawTier === 'explorer') ? 'free' : rawTier; // normalize explorer → free
  const isVideoTier = ['protect', 'secure'].includes(userTier);
  const isSecureTier = isVideoTier; // kept for backward compat
  const MAX_VIDEO_SIZE_MB = 50;
  const MAX_VIDEO_COUNT = userTier === 'protect' ? 10 : Infinity; // protect=10, secure=unlimited
  const storageLimits = getStorageLimits();
  const storageCheck = canUploadFiles(0);

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    uploadBg: '#374151',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    inputBg: '#374151'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    uploadBg: '#F8FAFC',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    inputBg: '#FFFFFF'
  };

  const strings = getEvidenceStrings(language);

  // Handle critical errors
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#0C3B2E' }} />
        <p style={{ color: colors.textPrimary }}>{language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</p>
      </div>
      </div>
    );
  }

  if (documentsError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md w-full" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
              {language === 'th' ? 'เกิดข้อผิดพลาด' : language === 'zh' ? '发生错误' : language === 'ja' ? 'エラーが発生しました' : language === 'ko' ? '오류 발생' : language === 'ru' ? 'Произошла ошибка' : 'Something went wrong'}
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'ไม่สามารถโหลดเอกสารได้ กรุณาลองอีกครั้ง' : language === 'zh' ? '无法加载文档。请重试。' : language === 'ja' ? 'ドキュメントを読み込めませんでした。もう一度お試しください。' : language === 'ko' ? '문서를 로드할 수 없습니다. 다시 시도해주세요.' : language === 'ru' ? 'Не удалось загрузить документы. Попробуйте снова.' : 'Failed to load documents. Please try again.'}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(createPageUrl("Dashboard"))}
                variant="outline"
                className="flex-1"
              >
                {language === 'th' ? 'กลับ' : language === 'zh' ? '返回' : language === 'ja' ? '戻る' : language === 'ko' ? '뒤로' : language === 'ru' ? 'Назад' : 'Go Back'}
              </Button>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}
                className="flex-1"
                style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
              >
                {language === 'th' ? 'ลองอีกครั้ง' : language === 'zh' ? '重试' : language === 'ja' ? '再試行' : language === 'ko' ? '다시 시도' : language === 'ru' ? 'Повторить' : 'Try Again'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} colors={colors}>
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
        {/* Annotation Modal */}
        {annotatingDocument && (
          <DocumentAnnotation
            imageUrl={annotatingDocument.file_url}
            onSave={handleSaveAnnotation}
            onClose={() => {
              haptic.light();
              setAnnotatingDocument(null);
            }}
            colors={colors}
            language={language}
          />
        )}

        {/* Edit Document Metadata Dialog */}
        <Dialog open={!!editingDoc} onOpenChange={() => {
          haptic.light();
          setEditingDoc(null);
        }}>
          <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>{strings.editDocument}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit_doc_type" style={{ color: colors.textPrimary }}>{strings.documentType}</Label>
                <Select value={editFormData.type} onValueChange={(val) => setEditFormData({...editFormData, type: val})}>
                  <SelectTrigger id="edit_doc_type" className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                    {Object.entries(DOC_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {language === 'zh' ? config.label_zh : language === 'ja' ? config.label_ja : language === 'ko' ? config.label_ko : language === 'th' ? config.label_th : language === 'ru' ? config.label_ru : config.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_custom_label" style={{ color: colors.textPrimary }}>{strings.customLabel}</Label>
                <Input
                  id="edit_custom_label"
                  value={editFormData.label}
                  onChange={(e) => setEditFormData({...editFormData, label: e.target.value})}
                  placeholder={strings.customLabelPlaceholder}
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => {
                  haptic.light();
                  setEditingDoc(null);
                }}>
                  {strings.cancel}
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateDocumentMutation.isPending}
                  className="bg-ls-forest hover:bg-ls-forest/90"
                >
                  {updateDocumentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {strings.saving}
                    </>
                  ) : (
                    strings.save
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog (for non-letter types or letters without html content) */}
        <Dialog open={!!viewingDoc && viewingDoc?.type !== 'letter'} onOpenChange={() => {
          haptic.light();
          setViewingDoc(null);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh]" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {viewingDoc?.label || (
                  language === 'zh' ? DOC_TYPE_CONFIG[viewingDoc?.type]?.label_zh :
                  language === 'ja' ? DOC_TYPE_CONFIG[viewingDoc?.type]?.label_ja :
                  language === 'ko' ? DOC_TYPE_CONFIG[viewingDoc?.type]?.label_ko :
                  language === 'th' ? DOC_TYPE_CONFIG[viewingDoc?.type]?.label_th :
                  language === 'ru' ? DOC_TYPE_CONFIG[viewingDoc?.type]?.label_ru :
                  DOC_TYPE_CONFIG[viewingDoc?.type]?.label_en
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 overflow-auto max-h-[70vh]">
              {viewingDoc?.file_url ? (
                <>
                  {viewingDoc?.type === 'photo' && (
                    <img src={viewingDoc.file_url} alt={viewingDoc.label} className="w-full h-auto rounded-lg object-contain max-h-[60vh]" />
                  )}
                  {viewingDoc?.type === 'video' && (
                    <video src={viewingDoc.file_url} controls className="w-full h-auto rounded-lg max-h-[60vh]" />
                  )}
                  {(!['photo', 'video', 'letter'].includes(viewingDoc?.type)) && (
                    <iframe
                      src={viewingDoc.file_url}
                      className="w-full h-[60vh] rounded-lg border"
                      style={{ borderColor: colors.borderColor }}
                      title={viewingDoc.label}
                    />
                  )}
                </>
              ) : (
                <p className="text-center" style={{ color: colors.textSecondary }}>{language === 'th' ? 'ไม่พบเนื้อหาเอกสาร' : 'No document content found.'}</p>
              )}
            </div>
            {/* ADD: Annotate button for images */}
            {viewingDoc?.type === 'photo' && (
              <div className="mt-4">
                <Button
                  onClick={() => {
                    haptic.light();
                    setAnnotatingDocument(viewingDoc);
                    setViewingDoc(null);
                  }}
                  variant="outline"
                  className="w-full"
                  style={{
                    borderColor: colors.borderColor,
                    backgroundColor: colors.cardBg,
                    color: colors.textPrimary,
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {strings.annotate}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* LetterPreview for letter types with html_content */}
        {viewingDoc?.type === 'letter' && viewingDoc?.html_content && (
          <LetterPreview
            open={!!viewingDoc}
            onOpenChange={() => {
              haptic.light();
              setViewingDoc(null);
            }}
            htmlContent={viewingDoc.html_content}
            docUrl={viewingDoc.file_url}
            title={viewingDoc.label || (language === 'th' ? 'จดหมาย' : 'Letter')}
          />
        )}

        {/* Upgrade Modal - Enhanced Upsell */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent
            className="modal-enter"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
              maxWidth: '500px',
              width: '95vw',
              maxHeight: '90vh'
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold" style={{ color: colors.textPrimary }}>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: '#0C3B2E',
                    boxShadow: '0 4px 12px rgba(12, 59, 46, 0.3)'
                  }}
                >
                  <FileVideo className="w-7 h-7 text-white" />
                </div>
                <div>
                  {strings.upgradeTitle}
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                {strings.upgradeDescription}
              </p>

              <div className="space-y-3 p-4 rounded-xl" style={{
                backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                border: `1px solid ${colors.borderColor}`
              }}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {strings.upgradeBenefitUnlimitedScans}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {strings.upgradeBenefitPriorityQueue}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {strings.upgradeBenefitVideoEvidence}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {strings.upgradeBenefitFullSupport}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  to={createPageUrl("Account") + '?showPlans=true&highlight=secure'}
                  className="w-full"
                  onClick={() => haptic.medium()}
                >
                  <Button
                    className="w-full"
                    style={{
                      backgroundColor: '#0C3B2E',
                      color: '#FFFFFF',
                      minHeight: '48px',
                      fontSize: '15px',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(12, 59, 46, 0.4)'
                    }}
                  >
                    {strings.upgradeToSecure}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    haptic.light();
                    setShowUpgradeModal(false);
                  }}
                  className="w-full"
                  style={{ minHeight: '44px' }}
                >
                  {strings.maybeLater}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Video Action Sheet */}
        <BottomSheet
          open={showVideoActionSheet}
          onClose={() => setShowVideoActionSheet(false)}
          title={strings.addVideo}
          colors={colors}
        >
          <div className="space-y-3 p-4">
            <button
              onClick={handleVideoUpload}
              className="w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.borderColor,
                color: colors.textPrimary
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">{strings.uploadVideo}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {strings.selectFromDevice}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleVideoRecord}
              className="w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.borderColor,
                color: colors.textPrimary
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">{strings.recordVideo}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {strings.useCameraToRecord}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </BottomSheet>

        {/* Upload Bottom Sheet - REPLACING Dialog */}
        <BottomSheet
          open={showUploadDialog}
          onClose={() => {
            setShowUploadDialog(false);
            setUploadFiles([]);
            setVoiceFiles([]);
            setVideoFiles([]);
            setCompressionStats(null);
            setError(null);
            setUploadType('photo'); // Reset type to default
            setUploadLabel(''); // Clear label
          }}
          title={strings.uploadDocument}
          colors={colors}
          maxHeight="90vh"
        >
          <div className="space-y-4" style={{ paddingBottom: '100px' }}>
            {uploading ? (
              <UploadProgress
                currentStage={uploadStage}
                progress={uploadProgressPercent}
                fileCount={uploadFiles.length}
                primaryColor={colors.textPrimary}
                secondaryColor={colors.textSecondary}
                language={language}
              />
            ) : (
              <>
                {error && (
                  <div className="p-3 rounded-lg border-2 border-red-500 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100">
                    <p className="text-sm font-semibold">{strings.error}:</p>
                    <p className="text-xs">{error}</p>
                  </div>
                )}

                {compressionStats && compressionStats.compressedCount > 0 && (
                 <div className="p-3 rounded-lg border-2" style={{
                   backgroundColor: isDarkMode ? '#1E3A2E' : '#ECFDF5',
                   borderColor: '#10B981'
                 }}>
                   <div className="flex items-start gap-2">
                     <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{
                       backgroundColor: '#10B981'
                     }}>
                       <CheckCircle2 className="w-3 h-3 text-white" />
                     </div>
                     <div className="flex-1">
                       <p className="font-semibold mb-1" style={{ color: isDarkMode ? '#6EE7B7' : '#047857' }}>
                         {language === 'th'
                           ? strings.imagesOptimizedDesc.replace('{count}', compressionStats.compressedCount).replace('{saved}', compressionStats.savedMB)
                           : strings.imagesOptimizedDesc.replace('{count}', compressionStats.compressedCount).replace('{saved}', compressionStats.savedMB)
                         }
                       </p>
                     </div>
                   </div>
                 </div>
                )}

                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.uploadTypeLabel}</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger className="mt-2" style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.borderColor,
                      color: colors.textPrimary,
                      minHeight: '44px',
                      fontSize: '16px'
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                      {Object.entries(DOC_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                           {language === 'zh' ? config.label_zh : language === 'ja' ? config.label_ja : language === 'ko' ? config.label_ko : language === 'th' ? config.label_th : config.label_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <MobileFormInput
                  label={strings.customLabelLabel}
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  placeholder={strings.customLabelPlaceholder}
                  colors={colors}
                />

                {/* Voice/Video Upload Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <input
                    id="voice-evidence-input"
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleVoiceSelection}
                    className="hidden"
                  />
                  <input
                    id="video-evidence-input"
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleVideoSelection}
                    className="hidden"
                  />

                  <button
                   type="button"
                   onClick={handleVoiceClick}
                   className="btn-interaction"
                   style={{
                     padding: '8px 14px',
                     borderRadius: '8px',
                     border: `2px solid ${colors.borderColor}`,
                     backgroundColor: colors.uploadBg,
                     color: colors.textPrimary,
                     fontSize: '13px',
                     fontWeight: '600',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px',
                     transition: 'all 0.2s',
                     minHeight: '40px'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.backgroundColor = isDarkMode ? '#3A3D40' : '#E5E7EB';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundColor = colors.uploadBg;
                   }}
                  >
                   <Mic className="w-4 h-4" />
                   {strings.addVoiceNote}
                  </button>

                  <button
                  type="button"
                  onClick={handleVideoClick}
                  className="btn-interaction"
                  title={!isVideoTier ? strings.upgradeTitle : ''}
                   style={{
                     padding: '8px 14px',
                     borderRadius: '8px',
                     border: `2px solid ${colors.borderColor}`,
                     backgroundColor: colors.uploadBg,
                     color: colors.textPrimary,
                     fontSize: '13px',
                     fontWeight: '600',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px',
                     transition: 'all 0.2s',
                     minHeight: '40px'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.backgroundColor = isDarkMode ? '#3A3D40' : '#E5E7EB';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundColor = colors.uploadBg;
                   }}
                  >
                   <FileVideo className="w-4 h-4" />
                   {strings.addVideo}
                  </button>
                </div>

                {/* Voice Notes Preview */}
                {voiceFiles.length > 0 && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                      {voiceFiles.length} {strings.voiceNotesAdded}
                    </p>
                    <div className="space-y-2">
                      {voiceFiles.map((file, index) => (
                       <div key={index} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colors.inputBg, border: `1px solid ${colors.borderColor}` }}>
                         <Mic className="w-4 h-4" style={{ color: colors.textPrimary }} />
                         <span className="text-xs flex-1 truncate" style={{ color: colors.textPrimary }}>{file.name}</span>
                         <button
                           type="button"
                           onClick={() => handleRemoveVoice(index)}
                           className="text-red-600"
                           style={{ minWidth: '24px', minHeight: '24px' }}
                         >
                           <X className="w-3 h-3" />
                         </button>
                       </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos Preview */}
                {videoFiles.length > 0 && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                      {videoFiles.length} {strings.videosAdded}
                    </p>
                    <div className="space-y-2">
                      {videoFiles.map((file, index) => (
                       <div key={index} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colors.inputBg, border: `1px solid ${colors.borderColor}` }}>
                         <FileVideo className="w-4 h-4" style={{ color: colors.textPrimary }} />
                         <span className="text-xs flex-1 truncate" style={{ color: colors.textPrimary }}>{file.name}</span>
                         <button
                           type="button"
                           onClick={() => handleRemoveVideo(index)}
                           className="text-red-600"
                           style={{ minWidth: '24px', minHeight: '24px' }}
                         >
                           <X className="w-3 h-3" />
                         </button>
                       </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="bottomsheet-file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.heic,.heif"
                    disabled={uploading}
                  />
                  <label htmlFor="bottomsheet-file-upload">
                    <div
                      className="border-2 border-dashed rounded-xl text-center transition-colors active:scale-[0.98]"
                      style={{
                        borderColor: colors.borderColor,
                        backgroundColor: colors.uploadBg,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        padding: '16px',
                        minHeight: '100px'
                      }}
                    >
                      <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                      <p className="font-semibold text-xs leading-tight" style={{ color: colors.textPrimary }}>
                        {strings.selectFiles}
                      </p>
                      <p className="text-xs mt-1 leading-tight" style={{ color: colors.textSecondary }}>
                        {strings.supportedFormats}
                      </p>
                    </div>
                  </label>
                </div>

                {uploadFiles.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2 text-sm" style={{ color: colors.textPrimary }}>
                      {strings.selectedFiles} ({uploadFiles.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.uploadBg }}>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: colors.textSecondary }} />
                            <span className="text-sm truncate" style={{ color: colors.textPrimary }}>{file.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              haptic.light();
                              setUploadFiles(uploadFiles.filter((_, i) => i !== index));
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg flex-shrink-0 transition-all active:scale-95"
                            disabled={uploading}
                            style={{ minWidth: '44px', minHeight: '44px' }}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sticky button footer */}
                <div 
                  className="fixed left-0 right-0 flex gap-3 p-4 border-t"
                  style={{ 
                    bottom: 'max(env(safe-area-inset-bottom, 0px), 80px)',
                    backgroundColor: colors.cardBg,
                    borderTopColor: colors.borderColor,
                    zIndex: 10
                  }}
                >
                  <Button
                    variant="outline"
                    onClick={() => {
                      haptic.light();
                      setShowUploadDialog(false);
                      setUploadFiles([]);
                      setVoiceFiles([]);
                      setVideoFiles([]);
                      setCompressionStats(null);
                    }}
                    disabled={uploading}
                    className="flex-1"
                    style={{ minHeight: '48px' }}
                  >
                    {strings.cancel}
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || (uploadFiles.length === 0 && voiceFiles.length === 0 && videoFiles.length === 0)}
                    className="flex-1"
                    style={{ 
                      minHeight: '48px',
                      backgroundColor: '#0C3B2E',
                      color: '#FFFFFF',
                      fontWeight: '600',
                      fontSize: '15px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span style={{ color: '#FFFFFF' }}>{strings.uploading}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span style={{ color: '#FFFFFF' }}>{strings.uploadButton}</span>
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </BottomSheet>

        <div className="max-w-7xl mx-auto">
          <PageHeader
            title={strings.title}
            subtitle={strings.subtitle}
            icon={Shield}
            iconColor="#0C3B2E"
            showBack={true}
            backLabel={strings.back}
            colors={colors}
            onBack={() => navigate(createPageUrl("Dashboard"))}
            actions={
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Upload Evidence CTA */}
                <button
                  type="button"
                  onClick={() => {
                    haptic.medium();
                    setShowUploadDialog(true);
                  }}
                  style={{
                    ...primaryCtaStyle,
                    padding: "10px 16px",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = primaryCtaHover.transform;
                    e.currentTarget.style.boxShadow = primaryCtaHover.boxShadow;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = primaryCtaStyle.boxShadow;
                  }}
                >
                  <Upload className="w-4 h-4" />
                  {strings.uploadEvidence}
                </button>

                {/* Storage Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100 border-gray-300 text-xs">
                  {strings.storageUsed
                  .replace('{used}', storageCheck.usedMB)
                  .replace('{limit}', storageLimits.limitMB)}
                  </Badge>
                  {userTier === 'free' && (
                    <Badge className={documents.length >= storageLimits.fileLimit ? 'bg-red-100 text-red-700 text-xs' : 'bg-slate-100 text-slate-700 text-xs'}>
                      {strings.filesUsed
                        .replace('{count}', documents.length)
                        .replace('{limit}', storageLimits.fileLimit)}
                    </Badge>
                  )}
                </div>
              </div>
            }
          />

          {/* Trust Badge */}
          <div className="mb-6">
            <TrustBadge language={language} isDarkMode={isDarkMode} />
          </div>

          {/* Templates Link Card */}
          <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg, borderLeft: `4px solid #0C3B2E` }}>
            <CardContent className="p-0">
              <Link to={createPageUrl("Templates")}>
                <div
                  className="p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => haptic.light()}
                  style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    borderColor: '#0C3B2E'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: evidenceAccent }}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base" style={{ color: colors.textPrimary }}>
                        {strings.viewTemplates}
                      </p>
                      <p className="text-xs md:text-sm" style={{ color: colors.textSecondary }}>
                        {strings.viewTemplatesDesc}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: '#0C3B2E' }} />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Uploads Header and Bulk Actions */}
          {(isLoadingDocuments || filteredDocuments.length > 0) && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      {strings.recentUploads} ({filteredDocuments.length})
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                      {/* Bulk Actions */}
                      {selectedDocs.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleBulkExportZip}
                                  disabled={exportingZip}
                                  className="text-xs h-8"
                              >
                                  {exportingZip ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{strings.exporting}</>) : (<><Download className="w-4 h-4 mr-2" />{strings.exportZip}</>)}
                              </Button>
                              <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={handleBulkDelete}
                                  disabled={deleteDocumentMutation.isPending}
                                  className="text-xs h-8"
                              >
                                  {deleteDocumentMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{strings.deleting}</>) : (<><Trash2 className="w-4 h-4 mr-2" />{strings.deleteSelected} ({selectedDocs.length})</>)}
                              </Button>
                          </div>
                      )}
                      {/* Export Full Report */}
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportAllReport}
                          disabled={exportingPdf}
                          className="text-xs h-8"
                      >
                          {exportingPdf ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{strings.exporting}</>) : (<><FileText className="w-4 h-4 mr-2" />{strings.exportReport}</>)}
                      </Button>
                      {filteredDocuments.length > 0 && (
                          <button
                              onClick={handleSelectAll}
                              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm"
                              style={{
                                  backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                                  color: colors.textPrimary
                              }}
                          >
                              {selectedDocs.length === filteredDocuments.length ? (
                                  <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#0C3B2E' }} />
                              ) : (
                                  <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                              <span className="font-medium">{strings.selectAll}</span>
                          </button>
                      )}
                  </div>
              </div>
          )}

          {/* Documents Grid */}
          {isLoadingDocuments ? (
            <SkeletonLoader variant="card" count={6} colors={colors} />
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 sm:p-5" style={{ 
              borderColor: colors.borderColor, 
              backgroundColor: colors.uploadBg 
            }}>
              <h3 className="font-semibold text-sm sm:text-base mb-1" style={{ color: colors.textPrimary }}>{strings.noEvidenceTitle}</h3>
              <p className="text-xs sm:text-sm mb-3" style={{ color: colors.textSecondary }}>
                {strings.noEvidenceDescription}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    haptic.medium();
                    setShowUploadDialog(true);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm"
                  style={{ 
                    backgroundColor: "#0C3B2E", 
                    color: "#FFFFFF",
                    border: `2px solid #C7A338`
                  }}
                >
                  {strings.uploadEvidence}
                </button>
                {(userTier === 'free') && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      navigate(createPageUrl("Account") + '#plans');
                    }}
                    className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border"
                    style={{ 
                      borderColor: isDarkMode ? '#C7A338' : '#0C3B2E', 
                      color: isDarkMode ? '#C7A338' : '#0C3B2E', 
                      backgroundColor: colors.cardBg 
                    }}
                  >
                    {strings.upgradeVaultStorage}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => {
                const config = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.other;
                const isSelected = selectedDocs.includes(doc.id);
                const isImage = doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                const isVideo = doc.file_url?.match(/\.(mp4|mov|avi)$/i);
                const isOptimistic = doc.__optimistic;

                return (
                  <SwipeToDelete
                    key={doc.id}
                    onDelete={() => handleSwipeDelete(doc.id)}
                    deleteLabel={strings.delete}
                    colors={colors}
                    disabled={isOptimistic}
                  >
                    <Card
                      className={`overflow-hidden border-none shadow-lg hover:shadow-xl transition-all relative ${isSelected ? 'ring-2' : ''} ${isOptimistic ? 'opacity-60' : ''}`}
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: isSelected ? '#0C3B2E' : colors.borderColor,
                        borderLeft: isSelected ? `4px solid #0C3B2E` : undefined
                      }}
                      onClick={() => !isOptimistic && handleCardClick(doc)}
                    >
                      {isOptimistic && (
                        <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center rounded-lg">
                          <Loader2 className="w-8 h-8 animate-spin text-white" />
                        </div>
                      )}

                      {isImage ? (
                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                          <LazyImage
                            src={doc.file_url}
                            alt={doc.label || doc.type}
                            className="w-full h-full object-cover"
                            loadingColor="#0C3B2E"
                            fallback={
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                <FileText className="w-12 h-12 text-gray-400" />
                              </div>
                            }
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(doc);
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg backdrop-blur-sm hover:bg-black/70 transition-colors"
                            disabled={isOptimistic}
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : isVideo ? (
                        <div className="aspect-video bg-gray-900 relative">
                          <video
                            src={doc.file_url}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                          />
                        </div>
                      ) : (
                        <div
                          className="aspect-video flex flex-col items-center justify-center p-4"
                          style={{ backgroundColor: config.bgColor, color: 'white' }}
                        >
                          {React.createElement(config.icon, { className: "w-12 h-12 mb-2" })}
                          <span className="text-sm font-semibold text-center break-words">
                            {doc.label || (
                              language === 'zh' ? config.label_zh :
                              language === 'ja' ? config.label_ja :
                              language === 'ko' ? config.label_ko :
                              language === 'th' ? config.label_th :
                              language === 'ru' ? config.label_ru :
                              config.label_en
                            )}
                          </span>
                        </div>
                      )}

                      <CardContent className="p-4">
                        {bulkMode && (
                          <div className="absolute top-4 right-4 z-10">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(doc.id)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isOptimistic}
                            />
                          </div>
                        )}

                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: config.bgColor }}>
                            {React.createElement(config.icon, { className: "w-6 h-6 text-white" })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Badge className="mb-2" style={{
                              backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                              color: colors.textPrimary
                            }}>
                              {language === 'zh' ? config.label_zh : language === 'ja' ? config.label_ja : language === 'ko' ? config.label_ko : language === 'th' ? config.label_th : language === 'ru' ? config.label_ru : config.label_en}
                            </Badge>
                            <h3 className="font-bold text-sm truncate" style={{ color: colors.textPrimary }}>
                              {doc.label || (
                                language === 'zh' ? config.label_zh :
                                language === 'ja' ? config.label_ja :
                                language === 'ko' ? config.label_ko :
                                language === 'th' ? config.label_th :
                                language === 'ru' ? config.label_ru :
                                config.label_en
                              )}
                            </h3>
                            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                              {format(new Date(doc.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.light();
                              handleView(doc);
                            }}
                            disabled={isOptimistic}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                              color: colors.textPrimary
                            }}
                            onMouseEnter={(e) => {
                              if (!isOptimistic) {
                                e.target.style.backgroundColor = isDarkMode ? '#3A3D40' : '#E5E7EB';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isOptimistic) {
                                e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                              }
                            }}
                          >
                            <Eye className="w-3 h-3 inline mr-1" />
                            {strings.view}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              haptic.light();
                              handleDownload(doc);
                            }}
                            disabled={isOptimistic}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: CTA_COLOR,
                              color: '#FFFFFF'
                            }}
                            onMouseEnter={(e) => {
                              if (!isOptimistic) {
                                e.target.style.backgroundColor = '#0a2f25';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isOptimistic) {
                                e.target.style.backgroundColor = CTA_COLOR;
                              }
                            }}
                          >
                            <Download className="w-3 h-3 inline mr-1" />
                            {strings.download}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(strings.confirmDelete)) {
                                handleDelete(doc.id);
                              }
                            }}
                            disabled={isOptimistic}
                            className="py-2 px-3 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626'
                            }}
                            onMouseEnter={(e) => {
                              if (!isOptimistic) {
                                e.target.style.backgroundColor = '#FECACA';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isOptimistic) {
                                e.target.style.backgroundColor = '#FEE2E2';
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </SwipeToDelete>
                );
              })}
            </div>
          )}
          </div>

          {/* Legal Disclaimer */}
          <div className="mt-8 p-4 rounded-lg text-center max-w-4xl mx-auto" style={{
          backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC',
          border: `1px solid ${colors.borderColor}`
          }}>
          <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
            {language === 'th' 
              ? 'Lease Shield ให้คำแนะนำทั่วไปและเทมเพลตเอกสารเพื่อวัตถุประสงค์ในการให้ข้อมูลเท่านั้น เราไม่ใช่สำนักงานกฎหมายและไม่ให้บริการตัวแทนทางกฎหมาย'
              : language === 'zh'
                ? 'Lease Shield仅提供一般性指导和文档模板用于信息目的。我们不是律师事务所，也不提供法律代理。'
                : language === 'ja'
                  ? 'Lease Shieldは情報提供のみを目的とした一般的なガイダンスと文書テンプレートを提供します。当社は法律事務所ではなく、法的代理を提供しません。'
                  : language === 'ko'
                    ? 'Lease Shield는 정보 제공 목적으로만 일반적인 안내 및 문서 템플릿을 제공합니다. 당사는 법률 회사가 아니며 법적 대리를 제공하지 않습니다.'
                    : language === 'ru'
                      ? 'Lease Shield предоставляет общие рекомендации и шаблоны документов только в информационных целях. Мы не являемся юридической фирмой и не предоставляем юридическое представительство.'
                      : 'Lease Shield provides general guidance and document templates for informational purposes only. We are not a law firm and do not provide legal representation.'}
          </p>
          <p className="text-xs leading-relaxed mt-3 pt-3" style={{ 
            color: colors.textSecondary,
            borderTop: `1px solid ${colors.borderColor}`
          }}>
            {language === 'th'
              ? 'เอกสารและหลักฐานทั้งหมดที่อัปโหลดหรือสร้างในแอปยังคงอยู่ภายใต้การควบคุมของผู้ใช้ ผู้ใช้มีหน้าที่รับผิดชอบในการตรวจสอบ ยืนยัน และตัดสินใจว่าจะใช้เอกสาร หลักฐาน หรือการสื่อสารใดๆ ที่สร้างผ่าน Lease Shield อย่างไรและเมื่อใด'
              : language === 'zh'
                ? '在应用内上传或生成的所有文档和证据均由用户控制。用户负责审查、验证和决定如何以及何时使用通过Lease Shield创建的任何文档、证据或通信。'
                : language === 'ja'
                  ? 'アプリ内でアップロードまたは生成されたすべての文書と証拠は、ユーザーの管理下にあります。ユーザーは、Lease Shieldを通じて作成された文書、証拠、または通信をいつどのように使用するかを確認、検証、決定する責任があります。'
                  : language === 'ko'
                    ? '앱 내에서 업로드되거나 생성된 모든 문서 및 증거는 사용자의 통제 하에 있습니다. 사용자는 Lease Shield를 통해 생성된 모든 문서, 증거 또는 커뮤니케이션을 검토하고 확인하며 사용 방법과 시기를 결정할 책임이 있습니다.'
                    : language === 'ru'
                      ? 'Все документы и доказательства, загруженные или созданные в приложении, остаются под контролем пользователя. Пользователь несёт ответственность за проверку, верификацию и принятие решений о том, как и когда использовать любые документы, доказательства или сообщения, созданные через Lease Shield.'
                      : 'All documents and evidence uploaded or generated within the app remain under the user\'s control. Users are responsible for reviewing, verifying, and deciding how and when to use any documents, evidence, or communications created through Lease Shield.'}
          </p>
          </div>
      </div>
    </PullToRefresh>
  );
}

export default function EvidenceVault() {
  return (
    <AuthGuard>
      <ToastProvider>
        <EvidenceVaultContent />
      </ToastProvider>
    </AuthGuard>
  );
}