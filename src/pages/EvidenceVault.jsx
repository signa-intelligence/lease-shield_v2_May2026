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
import { FileText, Upload, Trash2, ExternalLink, Shield, Camera, FileVideo, Mail, HelpCircle, CheckSquare, Square, ArrowLeft, X, Loader2, ArrowRight, Eye, Download, Edit2, Send, CheckCircle2, Mic } from "lucide-react";
import { format } from "date-fns";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LetterPreview from "../components/shared/LetterPreview";
import DocumentAnnotation from "../components/documents/DocumentAnnotation";
import { compressMultipleImages } from "../components/shared/ImageCompression";
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
import {
  FEATURE_COLORS,
  CTA_COLOR,
  primaryCtaStyle,
  primaryCtaHover
} from "../components/shared/featureTheme";

const evidenceAccent = FEATURE_COLORS.evidence.accent;

const DOC_TYPE_CONFIG = {
  lease: {
    label_en: 'Lease',
    label_th: 'สัญญาเช่า',
    label_zh: '租约',
    label_ja: '賃貸契約',
    label_ko: '임대 계약',
    label_ru: 'Договор аренды',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800',
    bgColor: '#3B82F6'
  },
  receipt: {
    label_en: 'Receipt',
    label_th: 'ใบเสร็จ',
    label_zh: '收据',
    label_ja: '領収書',
    label_ko: '영수증',
    label_ru: 'Квитанция',
    icon: FileText,
    color: 'bg-emerald-100 text-emerald-800',
    bgColor: '#10B981'
  },
  photo: {
    label_en: 'Photo',
    label_th: 'รูปภาพ',
    label_zh: '照片',
    label_ja: '写真',
    label_ko: '사진',
    label_ru: 'Фото',
    icon: Camera,
    color: 'bg-purple-100 text-purple-800',
    bgColor: '#A855F7'
  },
  video: {
    label_en: 'Video',
    label_th: 'วิดีโอ',
    label_zh: '视频',
    label_ja: '動画',
    label_ko: '비디오',
    label_ru: 'Видео',
    icon: FileVideo,
    color: 'bg-amber-100 text-amber-800',
    bgColor: '#F59E0B'
  },
  letter: {
    label_en: 'Letter',
    label_th: 'จดหมาย',
    label_zh: '信件',
    label_ja: 'レター',
    label_ko: '편지',
    label_ru: 'Письмо',
    icon: Mail,
    color: 'bg-indigo-100 text-indigo-800',
    bgColor: '#6366F1'
  },
  other: {
    label_en: 'Other',
    label_th: 'อื่น ๆ',
    label_zh: '其他',
    label_ja: 'その他',
    label_ko: '기타',
    label_ru: 'Прочее',
    icon: HelpCircle,
    color: 'bg-slate-100 text-slate-800',
    bgColor: '#64748B'
  }
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

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  // ADDED: Optimistic update hook
  const optimistic = useOptimisticUpdate(['documents'], 'Document');

  // For now, no filtering logic provided, so filteredDocuments is all documents
  const filteredDocuments = documents;

  const getStorageLimits = () => {
    const tier = user?.plan_tier || 'free';
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
    if (user?.plan_tier === 'free' && currentFileCount + fileCount > limits.fileLimit) {
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
    // If selecting video files and not Secure tier, show upsell
    if (uploadType === 'video' && !isSecureTier) {
      setUpgradeModalType('video');
      setShowUpgradeModal(true);
      e.target.value = null;
      return;
    }

    const files = Array.from(e.target.files);
    setUploadFiles(prev => [...prev, ...files]);
    e.target.value = null; // Clear input so same file can be selected again
  };

  const [showVideoActionSheet, setShowVideoActionSheet] = useState(false);

  const handleVideoClick = () => {
    if (!isSecureTier) {
      setUpgradeModalType('video');
      setShowUpgradeModal(true);
      return;
    }

    if (videoFiles.length >= 3) {
      toast.error(strings.maxVideoReached);
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

    const validFiles = files.filter(f => {
      const isVideo = f.type.startsWith('video/');
      const isUnder80MB = f.size <= 80 * 1024 * 1024;

      if (!isVideo) {
        toast.error(language === 'th' ? 'กรุณาเลือกไฟล์วิดีโอเท่านั้น' : 'Please select video files only');
        return false;
      }

      if (!isUnder80MB) {
        toast.error(`${strings.fileTooLarge}: ${f.name} - ${strings.videoMaxSize}`);
        return false;
      }

      return true;
    });

    const remaining = 3 - videoFiles.length;
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
      // Compress images (0-40%)
      const { files: compressedFiles, stats } = await compressMultipleImages(uploadFiles, (progress) => {
        setUploadProgressPercent(Math.round(progress * 40)); // 0-40% for compression
      });

      if (stats.compressedCount > 0) {
        setCompressionStats(stats);
      }

      // Upload all files (40-70%)
      setUploadStage('uploadingFiles');
      setUploadProgressPercent(40);

      const allFilesToUpload = [...compressedFiles, ...voiceFiles, ...videoFiles];
      const uploadPromises = allFilesToUpload.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );

      const results = await Promise.all(uploadPromises);
      setUploadProgressPercent(70);

      // Save documents (70-100%)
      setUploadStage('savingDocuments');
      const createPromises = results.map((result, idx) => {
        let docType = uploadType;
        if (idx >= compressedFiles.length && idx < compressedFiles.length + voiceFiles.length) {
          docType = 'other'; // Voice notes saved as 'other'
        } else if (idx >= compressedFiles.length + voiceFiles.length) {
          docType = 'video';
        }

        const typeLabel = language === 'zh' ? DOC_TYPE_CONFIG[docType]?.label_zh :
                          language === 'ja' ? DOC_TYPE_CONFIG[docType]?.label_ja :
                          language === 'ko' ? DOC_TYPE_CONFIG[docType]?.label_ko :
                          language === 'th' ? DOC_TYPE_CONFIG[docType]?.label_th :
                          language === 'ru' ? DOC_TYPE_CONFIG[docType]?.label_ru :
                          DOC_TYPE_CONFIG[docType]?.label_en;

        return createDocumentMutation.mutateAsync({
          type: docType,
          file_url: result.file_url,
          label: uploadLabel || strings.defaultDocLabel.replace('{docType}', typeLabel).replace('{date}', new Date().toLocaleDateString()),
        });
      });

      await Promise.all(createPromises);
      setUploadProgressPercent(100);

      // Query invalidation and haptic.success are handled by createDocumentMutation's onSuccess
      setShowUploadDialog(false);
      setUploadFiles([]);
      setVoiceFiles([]);
      setVideoFiles([]);
      setUploadType('photo'); // Reset to default
      setUploadLabel(''); // Clear custom label
      toast.success(strings.uploadSuccess);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(strings.uploadFailed);
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
  const userTier = user?.plan_tier || 'free';
  const isSecureTier = userTier === 'secure';
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

  const strings = {
    en: {
      back: "Back to Dashboard",
      title: "Evidence Vault",
      subtitle: "Secure storage for all your rental documentation",
      uploadFiles: "Upload Files",
      uploadDocument: "Upload Document",
      uploadEvidence: "Upload evidence",
      documentType: "Document Type",
      customLabel: "Custom Label",
      customLabelPlaceholder: "e.g., Move-in photos",
      selectFiles: "Drag & drop files here or click to browse",
      supportedFormats: "PDF, Images (JPG, PNG), Videos (MP4, MOV, AVI)",
      selectedFiles: "Selected Files",
      uploadButton: "Upload",
      uploading: "Uploading...",
      recentUploads: "Recent Uploads",
      viewTemplates: "View Templates",
      viewTemplatesDesc: "Professional letter templates for common rental situations.",
      noDocuments: "No Documents Yet",
      noDocumentsDesc: "Start building your evidence vault for better protection. All your uploaded documents are securely stored here.",
      uploadFirst: "Upload First Document", // This string is no longer used due to the new empty state, but kept for completeness
      deleteConfirm: "Are you sure?",
      confirmDelete: "Are you sure you want to delete this letter? This action cannot be undone.",
      confirmBulkDelete: "Are you sure you want to delete {count} file(s)?" ,
      view: "View",
      download: "Download",
      sendEmail: "Send Email",
      delete: "Delete",
      selectAll: "Select All",
      deleteSelected: "Delete Selected",
      deleting: "Deleting...",
      selected: "selected",
      storageUsed: "Storage: ~{used}MB / {limit}MB",
      filesUsed: "{count} / {limit} files",
      editDocument: "Edit Document",
      save: "Save",
      cancel: "Cancel",
      saving: "Saving...",
      loadingDocuments: "Loading documents...",
      exportZip: "Export as ZIP",
      exportReport: "Export Full Report",
      exporting: "Exporting...",
      bulkActions: "Bulk Actions",
      annotate: "Annotate",
      selectFile: "Please select files to upload.",
      uploadFailed: "Upload failed. Please try again.",
      error: "Error",
      fileSelected: "file selected",
      filesSelected: "files selected",
      preparing: "Preparing upload...",
      compressing: "Compressing images...",
      uploadingFiles: "Uploading files...",
      savingDocuments: "Saving documents...",
      uploadTypeLabel: "Document Type",
      customLabelLabel: "Custom Label (Optional)",
      refreshed: "Refreshed successfully",
      deleteSuccess: "Document deleted",
      uploadSuccess: "Upload successful",
      annotationSaved: "Annotation saved",
      annotationFailed: "Failed to save annotation",
      exportSuccess: "Export started",
      exportFailed: "Export failed",
      editSuccess: "Document updated successfully",
      editFailed: "Failed to update document",
      deleteFailed: "Failed to delete document",
      pleaseSelectDocuments: "Please select documents",
      downloadFailed: "Failed to download file",
      noEvidenceTitle: "No evidence uploaded yet",
      noEvidenceDescription: "Upload photos, videos and documents now so you have a time-stamped record if there's a dispute later.",
      upgradeVaultStorage: "Upgrade for full vault storage",
      addVoiceNote: "Add Voice Note",
      addVideo: "Add Video (Secure required)",
      voiceNotesAdded: "voice note(s)",
      videosAdded: "video(s)",
      upgradeToSecureVideo: "Upgrade to Secure for video evidence",
      upgradeToSecureVideoDesc: "Secure members can upload videos for stronger dispute cases.",
      upgradeToSecure: "Upgrade to Secure",
      upgradeTitle: "Video uploads require Secure",
      upgradeDescription: "Video evidence is only available on the Secure plan. Upgrade now to unlock:",
      upgradeBenefitUnlimitedScans: "• Unlimited lease scans",
      upgradeBenefitPriorityQueue: "• Priority case handling",
      upgradeBenefitVideoEvidence: "• Video evidence uploads",
      upgradeBenefitFullSupport: "• Comprehensive support",
      maybeLater: "Maybe later",
      maxVoiceReached: "Maximum 3 voice notes",
      maxVideoReached: "Maximum 3 videos",
      fileTooLarge: "File too large",
      voiceMaxSize: "Voice notes must be under 5MB",
      videoMaxSize: "Videos must be under 80MB",
      uploadVideo: "Upload Video",
      recordVideo: "Record Video",
      defaultDocLabel: "{docType} - {date}",
      dear: "Dear",
      closingRegards: "Warm regards",
      letterExtractionFailed: "[Letter content could not be extracted]",
      createdBy: "Created by",
      selectFromDevice: "Select from device",
      useCameraToRecord: "Use camera to record",
    },
    th: {
      back: "กลับไปยังแดชบอร์ด",
      title: "คลังหลักฐาน",
      subtitle: "จัดเก็บเอกสารการเช่าทั้งหมดของคุณอย่างปลอดภัย",
      uploadFiles: "อัปโหลดไฟล์",
      uploadDocument: "อัปโหลดเอกสาร",
      uploadEvidence: "อัปโหลดหลักฐาน",
      documentType: "ประเภทเอกสาร",
      customLabel: "ป้ายกำกับที่กำหนดเอง",
      customLabelPlaceholder: "เช่น รูปภาพตอนย้ายเข้า",
      selectFiles: "ลากและวางไฟล์ที่นี่หรือคลิกเพื่อเลือก",
      supportedFormats: "PDF, รูปภาพ (JPG, PNG), วิดีโอ (MP4, MOV, AVI)",
      selectedFiles: "ไฟล์ที่เลือก",
      uploadButton: "อัปโหลด",
      uploading: "กำลังอัปโหลด...",
      recentUploads: "อัปโหลดล่าสุด",
      viewTemplates: "ดูเทมเพลต",
      viewTemplatesDesc: "เทมเพลตจดหมายมืออาชีพสำหรับสถานการณ์การเช่าทั่วไป",
      noDocuments: "ยังไม่มีเอกสาร",
      noDocumentsDesc: "เริ่มสร้างคลังหลักฐานเพื่อการป้องกันที่ดีขึ้น เอกสารทั้งหมดที่คุณอัปโหลดจะถูกจัดเก็บอย่างปลอดภัยที่นี่",
      uploadFirst: "อัปโหลดเอกสารแรก",
      deleteConfirm: "คุณแน่ใจหรือไม่?",
      confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบจดหมายนี้? การกระทำนี้ไม่สามารถยกเลิกได้",
      confirmBulkDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์ {count} ไฟล์?",
      view: "ดู",
      download: "ดาวน์โหลด",
      sendEmail: "ส่งอีเมล",
      delete: "ลบ",
      selectAll: "เลือกทั้งหมด",
      deleteSelected: "ลบที่เลือก",
      deleting: "กำลังลบ...",
      selected: "เลือกแล้ว",
      storageUsed: "พื้นที่: ~{used}MB / {limit}MB",
      filesUsed: "{count} / {limit} ไฟล์",
      editDocument: "แก้ไขเอกสาร",
      save: "บันทึก",
      cancel: "ยกเลิก",
      saving: "กำลังบันทึก...",
      loadingDocuments: "กำลังโหลดเอกสาร...",
      exportZip: "ส่งออกเป็น ZIP",
      exportReport: "ส่งออกรายงานฉบับเต็ม",
      exporting: "กำลังส่งออก...",
      bulkActions: "การดำเนินการจำนวนมาก",
      annotate: "เขียนบันทึก",
      selectFile: "โปรดเลือกไฟล์ที่จะอัปโหลด",
      uploadFailed: "อัปโหลดไม่สำเร็จ โปรดลองอีกครั้ง",
      error: "ข้อผิดพลาด",
      fileSelected: "ไฟล์ที่เลือก",
      filesSelected: "ไฟล์ที่เลือก",
      preparing: "กำลังเตรียมการอัปโหลด...",
      compressing: "กำลังบีบอัดรูปภาพ...",
      uploadingFiles: "กำลังอัปโหลดไฟล์...",
      savingDocuments: "กำลังบันทึกเอกสาร...",
      uploadTypeLabel: "ประเภทเอกสาร",
      customLabelLabel: "ป้ายกำกับที่กำหนดเอง (ไม่บังคับ)",
      refreshed: "รีเฟรชสำเร็จ",
      deleteSuccess: "ลบเอกสารแล้ว",
      uploadSuccess: "อัปโหลดสำเร็จ",
      annotationSaved: "บันทึกคำอธิบายสำเร็จ",
      annotationFailed: "บันทึกไม่สำเร็จ",
      exportSuccess: "เริ่มส่งออกแล้ว",
      exportFailed: "ส่งออกไม่สำเร็จ",
      editSuccess: "อัปเดตเอกสารสำเร็จ",
      editFailed: "ไม่สามารถอัปเดตเอกสารได้",
      deleteFailed: "ไม่สามารถลบเอกสารได้",
      pleaseSelectDocuments: "กรุณาเลือกเอกสาร",
      downloadFailed: "ไม่สามารถดาวน์โหลดไฟล์ได้",
      noEvidenceTitle: "ยังไม่มีหลักฐานที่อัปโหลด",
      noEvidenceDescription: "อัปโหลดรูปภาพ วิดีโอ และเอกสารตอนนี้ เพื่อให้คุณมีบันทึกพร้อมประทับเวลาหากเกิดข้อพิพาทในภายหลัง",
      upgradeVaultStorage: "อัปเกรดเพื่อจัดเก็บคลังข้อมูลเต็มรูปแบบ",
      addVoiceNote: "เพิ่มบันทึกเสียง",
      addVideo: "เพิ่มวิดีโอ (ต้องการ Secure)",
      voiceNotesAdded: "บันทึกเสียง",
      videosAdded: "วิดีโอ",
      upgradeToSecureVideo: "อัปเกรดเป็น Secure สำหรับหลักฐานวิดีโอ",
      upgradeToSecureVideoDesc: "สมาชิก Secure สามารถอัปโหลดวิดีโอเพื่อสร้างหลักฐานที่แข็งแกร่งยิ่งขึ้น",
      upgradeToSecure: "อัปเกรดเป็น Secure",
      upgradeTitle: "อัปโหลดวิดีโอต้องใช้แผน Secure",
      upgradeDescription: "หลักฐานวิดีโอใช้ได้เฉพาะแผน Secure เท่านั้น อัปเกรดตอนนี้เพื่อปลดล็อก:",
      upgradeBenefitUnlimitedScans: "• สแกนสัญญาเช่าไม่จำกัด",
      upgradeBenefitPriorityQueue: "• การจัดการคดีแบบเร่งด่วน",
      upgradeBenefitVideoEvidence: "• อัปโหลดหลักฐานวิดีโอ",
      upgradeBenefitFullSupport: "• การสนับสนุนอย่างครอบคลุม",
      maybeLater: "ภายหลัง",
      maxVoiceReached: "สูงสุด 3 บันทึกเสียง",
      maxVideoReached: "สูงสุด 3 วิดีโอ",
      fileTooLarge: "ไฟล์ใหญ่เกินไป",
      voiceMaxSize: "บันทึกเสียงต้องน้อยกว่า 5MB",
      videoMaxSize: "วิดีโอต้องน้อยกว่า 80MB",
      uploadVideo: "อัปโหลดวิดีโอ",
      recordVideo: "บันทึกวิดีโอ",
      defaultDocLabel: "{docType} - {date}",
      dear: "เรียน",
      closingRegards: "ขอแสดงความนับถือ",
      letterExtractionFailed: "[ไม่สามารถดึงเนื้อหาจดหมายได้]",
      createdBy: "สร้างโดย",
      selectFromDevice: "เลือกจากอุปกรณ์",
      useCameraToRecord: "ใช้กล้องเพื่อบันทึก",
    },
    zh: {
      back: "返回仪表板",
      title: "证据库",
      subtitle: "安全存储您的所有租赁文档",
      uploadFiles: "上传文件",
      uploadDocument: "上传文档",
      uploadEvidence: "上传证据",
      documentType: "文档类型",
      customLabel: "自定义标签",
      customLabelPlaceholder: "例如，搬入照片",
      selectFiles: "拖放文件到此处或点击浏览",
      supportedFormats: "PDF、图片（JPG、PNG）、视频（MP4、MOV、AVI）",
      selectedFiles: "选定的文件",
      uploadButton: "上传",
      uploading: "上传中...",
      recentUploads: "最近上传",
      viewTemplates: "查看模板",
      viewTemplatesDesc: "常见租赁情况的专业信件模板。",
      noDocuments: "暂无文档",
      noDocumentsDesc: "开始建立您的证据库以获得更好的保护。您上传的所有文档都会安全存储在这里。",
      uploadFirst: "上传第一份文档",
      deleteConfirm: "您确定吗？",
      confirmDelete: "您确定要删除此信件吗？此操作无法撤消。",
      confirmBulkDelete: "您确定要删除 {count} 个文件吗？",
      view: "查看",
      download: "下载",
      sendEmail: "发送电子邮件",
      delete: "删除",
      selectAll: "全选",
      deleteSelected: "删除所选",
      deleting: "删除中...",
      selected: "已选",
      storageUsed: "存储：~{used}MB / {limit}MB",
      filesUsed: "{count} / {limit} 个文件",
      editDocument: "编辑文档",
      save: "保存",
      cancel: "取消",
      saving: "保存中...",
      loadingDocuments: "加载文档中...",
      exportZip: "导出为ZIP",
      exportReport: "导出完整报告",
      exporting: "导出中...",
      bulkActions: "批量操作",
      annotate: "注释",
      selectFile: "请选择要上传的文件。",
      uploadFailed: "上传失败。请重试。",
      error: "错误",
      fileSelected: "个文件已选",
      filesSelected: "个文件已选",
      preparing: "准备上传...",
      compressing: "压缩图片...",
      uploadingFiles: "上传文件...",
      savingDocuments: "保存文档...",
      uploadTypeLabel: "文档类型",
      customLabelLabel: "自定义标签（可选）",
      refreshed: "刷新成功",
      deleteSuccess: "文档已删除",
      uploadSuccess: "上传成功",
      annotationSaved: "注释已保存",
      annotationFailed: "保存注释失败",
      exportSuccess: "导出已开始",
      exportFailed: "导出失败",
      editSuccess: "文档更新成功",
      editFailed: "更新文档失败",
      deleteFailed: "删除文档失败",
      pleaseSelectDocuments: "请选择文档",
      downloadFailed: "下载文件失败",
      noEvidenceTitle: "尚未上传任何证据",
      noEvidenceDescription: "立即上传照片、视频和文件，以便在以后发生争议时拥有带时间戳的记录。",
      upgradeVaultStorage: "升级以获得完整的证据库存储",
      addVoiceNote: "添加语音备忘录",
      addVideo: "添加视频（需要 Secure）",
      voiceNotesAdded: "语音备忘录",
      videosAdded: "视频",
      upgradeToSecureVideo: "升级到 Secure 以添加视频证据",
      upgradeToSecureVideoDesc: "Secure 会员可以上传视频以加强争议案件。",
      upgradeToSecure: "升级到 Secure",
      upgradeTitle: "视频上传需要 Secure 计划",
      upgradeDescription: "视频证据仅适用于 Secure 计划。立即升级以解锁：",
      upgradeBenefitUnlimitedScans: "• 无限租约扫描",
      upgradeBenefitPriorityQueue: "• 优先案件处理",
      upgradeBenefitVideoEvidence: "• 视频证据上传",
      upgradeBenefitFullSupport: "• 全面支持",
      maybeLater: "稍后再说",
      maxVoiceReached: "最多 3 个语音备忘录",
      maxVideoReached: "最多 3 个视频",
      fileTooLarge: "文件过大",
      voiceMaxSize: "语音备忘录必须小于 5MB",
      videoMaxSize: "视频必须小于 80MB",
      uploadVideo: "上传视频",
      recordVideo: "录制视频",
      defaultDocLabel: "{docType} - {date}",
      dear: "亲爱的",
      closingRegards: "诚挚的问候",
      letterExtractionFailed: "[无法提取信件内容]",
      createdBy: "创建者",
      selectFromDevice: "从设备选择",
      useCameraToRecord: "使用相机录制",
    },
    ja: {
      back: "ダッシュボードに戻る",
      title: "証拠保管庫",
      subtitle: "すべての賃貸文書を安全に保管",
      uploadFiles: "ファイルをアップロード",
      uploadDocument: "ドキュメントをアップロード",
      uploadEvidence: "証拠をアップロード",
      documentType: "ドキュメントタイプ",
      customLabel: "カスタムラベル",
      customLabelPlaceholder: "例：入居時の写真",
      selectFiles: "ファイルをドラッグ＆ドロップまたはクリックして参照",
      supportedFormats: "PDF、画像（JPG、PNG）、動画（MP4、MOV、AVI）",
      selectedFiles: "選択したファイル",
      uploadButton: "アップロード",
      uploading: "アップロード中...",
      recentUploads: "最近のアップロード",
      viewTemplates: "テンプレートを表示",
      viewTemplatesDesc: "一般的な賃貸状況のためのプロフェッショナルなレターテンプレート。",
      noDocuments: "まだドキュメントがありません",
      noDocumentsDesc: "より良い保護のために証拠保管庫の構築を開始してください。アップロードしたすべてのドキュメントはここに安全に保存されます。",
      uploadFirst: "最初のドキュメントをアップロード",
      deleteConfirm: "よろしいですか？",
      confirmDelete: "このレターを削除してもよろしいですか？この操作は元に戻せません。",
      confirmBulkDelete: "{count}個のファイルを削除してもよろしいですか？",
      view: "表示",
      download: "ダウンロード",
      sendEmail: "メールを送信",
      delete: "削除",
      selectAll: "すべて選択",
      deleteSelected: "選択項目を削除",
      deleting: "削除中...",
      selected: "選択済み",
      storageUsed: "ストレージ：~{used}MB / {limit}MB",
      filesUsed: "{count} / {limit} ファイル",
      editDocument: "ドキュメントを編集",
      save: "保存",
      cancel: "キャンセル",
      saving: "保存中...",
      loadingDocuments: "ドキュメント読み込み中...",
      exportZip: "ZIPとしてエクスポート",
      exportReport: "完全なレポートをエクスポート",
      exporting: "エクスポート中...",
      bulkActions: "一括操作",
      annotate: "注釈",
      selectFile: "アップロードするファイルを選択してください。",
      uploadFailed: "アップロードに失敗しました。もう一度お試しください。",
      error: "エラー",
      fileSelected: "個のファイルを選択",
      filesSelected: "個のファイルを選択",
      preparing: "アップロード準備中...",
      compressing: "画像を圧縮中...",
      uploadingFiles: "ファイルをアップロード中...",
      savingDocuments: "ドキュメントを保存中...",
      uploadTypeLabel: "ドキュメントタイプ",
      customLabelLabel: "カスタムラベル（オプション）",
      refreshed: "更新成功",
      deleteSuccess: "ドキュメントを削除しました",
      uploadSuccess: "アップロード成功",
      annotationSaved: "注釈を保存しました",
      annotationFailed: "注釈の保存に失敗しました",
      exportSuccess: "エクスポート開始",
      exportFailed: "エクスポート失敗",
      editSuccess: "ドキュメントを正常に更新しました",
      editFailed: "ドキュメントの更新に失敗しました",
      deleteFailed: "ドキュメントの削除に失敗しました",
      pleaseSelectDocuments: "ドキュメントを選択してください",
      downloadFailed: "ファイルのダウンロードに失敗しました",
      noEvidenceTitle: "まだ証拠がアップロードされていません",
      noEvidenceDescription: "紛争が発生した場合にタイムスタンプ付きの記録を残すため、写真、ビデオ、ドキュメントを今すぐアップロードしてください。",
      upgradeVaultStorage: "完全な保管庫ストレージにアップグレード",
      addVoiceNote: "音声メモを追加",
      addVideo: "動画を追加（Secureが必要）",
      voiceNotesAdded: "音声メモ",
      videosAdded: "動画",
      upgradeToSecureVideo: "動画証拠を追加するにはSecureにアップグレード",
      upgradeToSecureVideoDesc: "Secure 会員は、より強力な争議ケースのために動画をアップロードできます。",
      upgradeToSecure: "Secureにアップグレード",
      upgradeTitle: "動画アップロードにはSecureが必要",
      upgradeDescription: "動画証拠はSecureプランでのみ利用可能です。今すぐアップグレードしてロック解除：",
      upgradeBenefitUnlimitedScans: "• 無制限の賃貸契約スキャン",
      upgradeBenefitPriorityQueue: "• 優先的なケース処理",
      upgradeBenefitVideoEvidence: "• 動画証拠のアップロード",
      upgradeBenefitFullSupport: "• 包括的なサポート",
      maybeLater: "後で",
      maxVoiceReached: "最大3件の音声メモ",
      maxVideoReached: "最大3件の動画",
      fileTooLarge: "ファイルが大きすぎます",
      voiceMaxSize: "音声メモは5MB未満である必要があります",
      videoMaxSize: "動画は80MB未満である必要があります",
      uploadVideo: "動画をアップロード",
      recordVideo: "動画を録画",
      defaultDocLabel: "{docType} - {date}",
      dear: "拝啓",
      closingRegards: "敬具",
      letterExtractionFailed: "[手紙の内容を抽出できませんでした]",
      createdBy: "作成者",
      selectFromDevice: "デバイスから選択",
      useCameraToRecord: "カメラで録画",
    },
    ko: {
      back: "대시보드로 돌아가기",
      title: "증거 보관소",
      subtitle: "모든 임대 문서를 안전하게 보관",
      uploadFiles: "파일 업로드",
      uploadDocument: "문서 업로드",
      uploadEvidence: "증거 업로드",
      documentType: "문서 유형",
      customLabel: "사용자 지정 레이블",
      customLabelPlaceholder: "예: 입주 사진",
      selectFiles: "여기에 파일을 드래그하거나 클릭하여 찾아보기",
      supportedFormats: "PDF, 이미지 (JPG, PNG), 비디오 (MP4, MOV, AVI)",
      selectedFiles: "선택된 파일",
      uploadButton: "업로드",
      uploading: "업로드 중...",
      recentUploads: "최근 업로드",
      viewTemplates: "템플릿 보기",
      viewTemplatesDesc: "일반적인 임대 상황을 위한 전문 편지 템플릿.",
      noDocuments: "아직 문서 없음",
      noDocumentsDesc: "더 나은 보호를 위해 증거 보관소 구축을 시작하세요. 업로드한 모든 문서는 여기에 안전하게 저장됩니다.",
      uploadFirst: "첫 번째 문서 업로드",
      deleteConfirm: "확실합니까?",
      confirmDelete: "이 편지를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.",
      confirmBulkDelete: "{count}개의 파일을 삭제하시겠습니까?",
      view: "보기",
      download: "다운로드",
      sendEmail: "이메일 보내기",
      delete: "삭제",
      selectAll: "모두 선택",
      deleteSelected: "선택 항목 삭제",
      deleting: "삭제 중...",
      selected: "선택됨",
      storageUsed: "저장소: ~{used}MB / {limit}MB",
      filesUsed: "{count} / {limit} 파일",
      editDocument: "문서 편집",
      save: "저장",
      cancel: "취소",
      saving: "저장 중...",
      loadingDocuments: "문서 로딩 중...",
      exportZip: "ZIP으로 내보내기",
      exportReport: "전체 보고서 내보내기",
      exporting: "내보내기 중...",
      bulkActions: "일괄 작업",
      annotate: "주석",
      selectFile: "업로드할 파일을 선택하세요.",
      uploadFailed: "업로드 실패. 다시 시도해주세요.",
      error: "오류",
      fileSelected: "개 파일 선택됨",
      filesSelected: "개 파일 선택됨",
      preparing: "업로드 준비 중...",
      compressing: "이미지 압축 중...",
      uploadingFiles: "파일 업로드 중...",
      savingDocuments: "문서 저장 중...",
      uploadTypeLabel: "문서 유형",
      customLabelLabel: "사용자 지정 레이블 (선택사항)",
      refreshed: "새로고침 성공",
      deleteSuccess: "문서 삭제됨",
      uploadSuccess: "업로드 성공",
      annotationSaved: "주석 저장됨",
      annotationFailed: "주석 저장 실패",
      exportSuccess: "내보내기 시작됨",
      exportFailed: "내보내기 실패",
      editSuccess: "문서 업데이트 성공",
      editFailed: "문서 업데이트 실패",
      deleteFailed: "문서 삭제 실패",
      pleaseSelectDocuments: "문서를 선택하세요",
      downloadFailed: "파일 다운로드 실패",
      noEvidenceTitle: "아직 증거가 업로드되지 않았습니다.",
      noEvidenceDescription: "분쟁 발생 시 타임스탬프가 찍힌 기록을 가질 수 있도록 지금 사진, 동영상 및 문서를 업로드하세요.",
      upgradeVaultStorage: "전체 볼트 저장 공간을 위해 업그레이드",
      addVoiceNote: "음성 메모 추가",
      addVideo: "동영상 추가（Secure 필요）",
      voiceNotesAdded: "음성 메모",
      videosAdded: "동영상",
      upgradeToSecureVideo: "동영상 증거를 추가하려면 Secure로 업그레이드",
      upgradeToSecureVideoDesc: "Secure 회원은 더 강력한 분쟁 사례를 위해 동영상을 업로드할 수 있습니다.",
      upgradeToSecure: "Secure로 업그레이드",
      upgradeTitle: "동영상 업로드에는 Secure 필요",
      upgradeDescription: "동영상 증거는 Secure 플랜에서만 사용할 수 있습니다. 지금 업그레이드하여 잠금 해제:",
      upgradeBenefitUnlimitedScans: "• 무제한 임대 계약 스캔",
      upgradeBenefitPriorityQueue: "• 우선 사례 처리",
      upgradeBenefitVideoEvidence: "• 동영상 증거 업로드",
      upgradeBenefitFullSupport: "• 포괄적인 지원",
      maybeLater: "나중에",
      maxVoiceReached: "최대 3개의 음성 메모",
      maxVideoReached: "최대 3개의 동영상",
      fileTooLarge: "파일이 너무 큼",
      voiceMaxSize: "음성 메모는 5MB 미만이어야 합니다",
      videoMaxSize: "동영상은 80MB 미만이어야 합니다",
      uploadVideo: "동영상 업로드",
      recordVideo: "동영상 녹화",
      defaultDocLabel: "{docType} - {date}",
      dear: "에게",
      closingRegards: "안부를 전하며",
      letterExtractionFailed: "[편지 내용을 추출할 수 없습니다]",
      createdBy: "작성자",
      selectFromDevice: "기기에서 선택",
      useCameraToRecord: "카메라로 녹화",
    },
    ru: {
      back: "Назад к панели",
      title: "Хранилище доказательств",
      subtitle: "Безопасное хранение всей арендной документации",
      uploadFiles: "Загрузить файлы",
      uploadDocument: "Загрузить документ",
      uploadEvidence: "Загрузить доказательства",
      documentType: "Тип документа",
      customLabel: "Произвольная метка",
      customLabelPlaceholder: "напр., Фото при въезде",
      selectFiles: "Перетащите файлы сюда или нажмите для выбора",
      supportedFormats: "PDF, Изображения (JPG, PNG), Видео (MP4, MOV, AVI)",
      selectedFiles: "Выбранные файлы",
      uploadButton: "Загрузить",
      uploading: "Загрузка...",
      recentUploads: "Недавние загрузки",
      viewTemplates: "Посмотреть шаблоны",
      viewTemplatesDesc: "Профессиональные шаблоны писем для типичных арендных ситуаций.",
      noDocuments: "Документов пока нет",
      noDocumentsDesc: "Начните создавать хранилище доказательств для лучшей защиты. Все загруженные документы безопасно хранятся здесь.",
      uploadFirst: "Загрузить первый документ",
      deleteConfirm: "Вы уверены?",
      confirmDelete: "Вы уверены, что хотите удалить это письмо? Это действие необратимо.",
      confirmBulkDelete: "Вы уверены, что хотите удалить файлов: {count}?",
      view: "Посмотреть",
      download: "Скачать",
      sendEmail: "Отправить по почте",
      delete: "Удалить",
      selectAll: "Выбрать все",
      deleteSelected: "Удалить выбранные",
      deleting: "Удаление...",
      selected: "выбрано",
      storageUsed: "Хранилище: ~{used}МБ / {limit}МБ",
      filesUsed: "{count} / {limit} файлов",
      editDocument: "Редактировать документ",
      save: "Сохранить",
      cancel: "Отмена",
      saving: "Сохранение...",
      loadingDocuments: "Загрузка документов...",
      exportZip: "Экспорт в ZIP",
      exportReport: "Экспортировать полный отчёт",
      exporting: "Экспорт...",
      bulkActions: "Массовые действия",
      annotate: "Аннотировать",
      selectFile: "Пожалуйста, выберите файлы для загрузки.",
      uploadFailed: "Загрузка не удалась. Попробуйте снова.",
      error: "Ошибка",
      fileSelected: "файл выбран",
      filesSelected: "файлов выбрано",
      preparing: "Подготовка загрузки...",
      compressing: "Сжатие изображений...",
      uploadingFiles: "Загрузка файлов...",
      savingDocuments: "Сохранение документов...",
      uploadTypeLabel: "Тип документа",
      customLabelLabel: "Произвольная метка (необязательно)",
      refreshed: "Обновлено успешно",
      deleteSuccess: "Документ удалён",
      uploadSuccess: "Загрузка успешна",
      annotationSaved: "Аннотация сохранена",
      annotationFailed: "Не удалось сохранить аннотацию",
      exportSuccess: "Экспорт начат",
      exportFailed: "Экспорт не удался",
      editSuccess: "Документ успешно обновлён",
      editFailed: "Не удалось обновить документ",
      deleteFailed: "Не удалось удалить документ",
      pleaseSelectDocuments: "Пожалуйста, выберите документы",
      downloadFailed: "Не удалось скачать файл",
      noEvidenceTitle: "Доказательства еще не загружены",
      noEvidenceDescription: "Загрузите фотографии, видео и документы сейчас, чтобы иметь запись с отметками времени в случае спора позже.",
      upgradeVaultStorage: "Обновите для полного хранилища",
      addVoiceNote: "Добавить голосовую заметку",
      addVideo: "Добавить видео (требуется Secure)",
      voiceNotesAdded: "голосовых заметок",
      videosAdded: "видео",
      upgradeToSecureVideo: "Обновитесь до Secure для видеодоказательств",
      upgradeToSecureVideoDesc: "Участники тарифа Secure могут загружать видео для усиления своих дел.",
      upgradeToSecure: "Обновить до Secure",
      upgradeTitle: "Для загрузки видео требуется Secure",
      upgradeDescription: "Видеодоказательства доступны только в плане Secure. Обновитесь сейчас, чтобы разблокировать:",
      upgradeBenefitUnlimitedScans: "• Неограниченные сканы договоров аренды",
      upgradeBenefitPriorityQueue: "• Приоритетная обработка дел",
      upgradeBenefitVideoEvidence: "• Загрузка видеодоказательств",
      upgradeBenefitFullSupport: "• Полная поддержка",
      maybeLater: "Позже",
      maxVoiceReached: "Максимум 3 голосовые заметки",
      maxVideoReached: "Максимум 3 видео",
      fileTooLarge: "Файл слишком большой",
      voiceMaxSize: "Голосовые заметки должны быть менее 5 МБ",
      videoMaxSize: "Видео должны быть менее 80 МБ",
      uploadVideo: "Загрузить видео",
      recordVideo: "Записать видео",
      defaultDocLabel: "{docType} - {date}",
      dear: "Уважаемый",
      closingRegards: "С уважением",
      letterExtractionFailed: "[Не удалось извлечь содержимое письма]",
      createdBy: "Создано",
      selectFromDevice: "Выбрать с устройства",
      useCameraToRecord: "Записать с помощью камеры",
    }
  }[language] || {
    back: "Back to Dashboard",
    title: "Evidence Vault",
    subtitle: "Secure storage for all your rental documentation",
    uploadFiles: "Upload Files",
    uploadDocument: "Upload Document",
    uploadEvidence: "Upload evidence",
    documentType: "Document Type",
    customLabel: "Custom Label",
    customLabelPlaceholder: "e.g., Move-in photos",
    selectFiles: "Drag & drop files here or click to browse",
    supportedFormats: "PDF, Images (JPG, PNG), Videos (MP4, MOV, AVI)",
    selectedFiles: "Selected Files",
    uploadButton: "Upload",
    uploading: "Uploading...",
    recentUploads: "Recent Uploads",
    viewTemplates: "View Templates",
    viewTemplatesDesc: "Professional letter templates for common rental situations.",
    noDocuments: "No Documents Yet",
    noDocumentsDesc: "Start building your evidence vault for better protection. All your uploaded documents are securely stored here.",
    uploadFirst: "Upload First Document",
    deleteConfirm: "Are you sure?",
    confirmDelete: "Are you sure you want to delete this file?",
    confirmBulkDelete: "Are you sure you want to delete {count} file(s)?",
    view: "View",
    download: "Download",
    sendEmail: "Send Email",
    delete: "Delete",
    selectAll: "Select All",
    deleteSelected: "Delete Selected",
    deleting: "Deleting...",
    selected: "selected",
    storageUsed: "Storage: ~{used}MB / {limit}MB",
    filesUsed: "{count} / {limit} files",
    editDocument: "Edit Document",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    loadingDocuments: "Loading documents...",
    exportZip: "Export as ZIP",
    exportReport: "Export Full Report",
    exporting: "Exporting...",
    bulkActions: "Bulk Actions",
    annotate: "Annotate",
    selectFile: "Please select files to upload.",
    uploadFailed: "Upload failed. Please try again.",
    error: "Error",
    fileSelected: "file selected",
    filesSelected: "files selected",
    preparing: "Preparing upload...",
    compressing: "Compressing images...",
    uploadingFiles: "Uploading files...",
    savingDocuments: "Saving documents...",
    uploadTypeLabel: "Document Type",
    customLabelLabel: "Custom Label (Optional)",
    refreshed: "Refreshed successfully",
    deleteSuccess: "Document deleted",
    uploadSuccess: "Upload successful",
    annotationSaved: "Annotation saved",
    annotationFailed: "Failed to save annotation",
    exportSuccess: "Export started",
    exportFailed: "Export failed",
    editSuccess: "Document updated successfully",
    editFailed: "Failed to update document",
    deleteFailed: "Failed to delete document",
    pleaseSelectDocuments: "Please select documents",
    downloadFailed: "Failed to download file",
    noEvidenceTitle: "No evidence uploaded yet",
    noEvidenceDescription: "Upload photos, videos and documents now so you have a time-stamped record if there's a dispute later.",
    upgradeVaultStorage: "Upgrade for full vault storage",
    uploadVideo: "Upload Video",
    recordVideo: "Record Video"
  };

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
                    backgroundColor: '#8B5CF6',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
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
                      backgroundColor: '#8B5CF6',
                      color: '#FFFFFF',
                      minHeight: '48px',
                      fontSize: '15px',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
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
                    backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF',
                    borderColor: '#3B82F6'
                  }}>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold mb-1" style={{ color: isDarkMode ? '#93C5FD' : '#1D4ED8' }}>
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
                      border: `2px solid #8B5CF6`,
                      backgroundColor: isDarkMode ? '#4C1D95' : '#F3E8FF',
                      color: '#8B5CF6',
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
                      e.currentTarget.style.backgroundColor = '#8B5CF6';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? '#4C1D95' : '#F3E8FF';
                      e.currentTarget.style.color = '#8B5CF6';
                    }}
                  >
                    <Mic className="w-4 h-4" />
                    {strings.addVoiceNote}
                  </button>

                  <button
                    type="button"
                    onClick={handleVideoClick}
                    className="btn-interaction"
                    title={!isSecureTier ? strings.upgradeTitle : ''}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: `2px solid ${!isSecureTier ? '#8B5CF6' : '#EF4444'}`,
                      backgroundColor: !isSecureTier ? (isDarkMode ? '#4C1D95' : '#F3E8FF') : (isDarkMode ? '#7F1D1D' : '#FEE2E2'),
                      color: !isSecureTier ? '#8B5CF6' : '#EF4444',
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
                      if (isSecureTier) {
                        e.currentTarget.style.backgroundColor = '#EF4444';
                        e.currentTarget.style.color = '#FFFFFF';
                      } else {
                        e.currentTarget.style.backgroundColor = '#8B5CF6';
                        e.currentTarget.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isSecureTier) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#7F1D1D' : '#FEE2E2';
                        e.currentTarget.style.color = '#EF4444';
                      } else {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#4C1D95' : '#F3E8FF';
                        e.currentTarget.style.color = '#8B5CF6';
                      }
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
                          <Mic className="w-4 h-4 text-purple-600" />
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
                          <FileVideo className="w-4 h-4 text-red-600" />
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
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov,.avi"
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
            iconColor={evidenceAccent}
            showBack={true}
            backLabel={strings.back}
            colors={colors}
            onBack={() => navigate(createPageUrl("Dashboard"))}
          />

          {/* Trust Badge */}
          <div className="mb-6">
            <TrustBadge language={language} isDarkMode={isDarkMode} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
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
                  gap: "8px",
                  width: '100%'
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
            </div>

            {/* Storage Badges - Now separate from actions */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
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

          {/* Templates Link Card - Keep existing but remove actions prop from PageHeader */}
          <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg, borderLeft: `4px solid ${evidenceAccent}` }}>
            <CardContent className="p-0">
              <Link to={createPageUrl("Templates")}>
                <div
                  className="p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => haptic.light()}
                  style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    borderColor: evidenceAccent
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
                    <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: evidenceAccent }} />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Keep rest of content - adjusted to not use actions in PageHeader */}
          <div style={{ display: 'none' }} actions={
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
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
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

          {/* Templates Link Card */}
          <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg, borderLeft: `4px solid ${evidenceAccent}` }}>
            <CardContent className="p-0">
              <Link to={createPageUrl("Templates")}>
                <div
                  className="p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => haptic.light()}
                  style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    borderColor: evidenceAccent
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
                    <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: evidenceAccent }} />
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
                                  <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: evidenceAccent }} />
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
                        borderColor: isSelected ? evidenceAccent : colors.borderColor,
                        borderLeft: isSelected ? `4px solid ${evidenceAccent}` : undefined
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
                            loadingColor="#C7A338"
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
          <p className="text-xs leading-relaxed mt-3 pt-3" style={{ 
            color: colors.textSecondary,
            borderTop: `1px solid ${colors.borderColor}`
          }}>
            {language === 'th'
              ? 'Lease Shield ให้เทมเพลตเอกสารและคำแนะนำเท่านั้น เอกสารที่สร้างขึ้นสามารถแก้ไขได้ทั้งหมดและส่งตามดุลยพินิจของผู้ใช้ ผู้ใช้มีหน้าที่รับผิดชอบในการตรวจสอบและยืนยันเนื้อหาทั้งหมดก่อนใช้'
              : language === 'zh'
                ? 'Lease Shield仅提供文档模板和指导。生成的文档可完全编辑并由用户自行决定发送。用户在使用前有责任审查和验证所有内容。'
                : language === 'ja'
                  ? 'Lease Shieldは文書テンプレートとガイダンスのみを提供します。生成された文書は完全に編集可能で、ユーザーの裁量で送信されます。ユーザーは使用前にすべての内容を確認し検証する責任があります。'
                  : language === 'ko'
                    ? 'Lease Shield는 문서 템플릿과 안내만 제공합니다. 생성된 문서는 완전히 편집 가능하며 사용자의 재량에 따라 발송됩니다. 사용자는 사용 전에 모든 내용을 검토하고 확인할 책임이 있습니다。'
                    : language === 'ru'
                      ? 'Lease Shield предоставляет только шаблоны документов и рекомендации。Созданные документы полностью редактируемы и отправляются по усмотрению пользователя。Пользователь несёт ответственность за проверку и верификацию всего содержимого перед использованием。'
                      : 'Lease Shield provides document templates and guidance only. Generated documents are fully editable and sent at the user\'s discretion. Users are responsible for reviewing and verifying all content before use.'}
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