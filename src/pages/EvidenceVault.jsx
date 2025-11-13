
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Trash2, ExternalLink, Shield, Camera, FileVideo, Mail, HelpCircle, CheckSquare, Square, ArrowLeft, X, Loader2, ArrowRight, Eye, Download, Edit2, Send, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import FloatingActionButton from "../components/shared/FloatingActionButton";
import MobileFormInput from "../components/shared/MobileFormInput";
import LazyImage from "../components/shared/LazyImage";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import EmptyState from "../components/shared/EmptyState";
import { useOptimisticUpdate } from "../components/shared/OptimisticUpdate";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";

const DOC_TYPE_CONFIG = {
  lease: { label_en: 'Lease', label_th: 'สัญญาเช่า', icon: FileText, color: 'bg-blue-100 text-blue-800', bgColor: '#3B82F6' },
  receipt: { label_en: 'Receipt', label_th: 'ใบเสร็จ', icon: FileText, color: 'bg-emerald-100 text-emerald-800', bgColor: '#10B981' },
  photo: { label_en: 'Photo', label_th: 'รูปภาพ', icon: Camera, color: 'bg-purple-100 text-purple-800', bgColor: '#A855F7' },
  video: { label_en: 'Video', label_th: 'วิดีโอ', icon: FileVideo, color: 'bg-amber-100 text-amber-800', bgColor: '#F59E0B' },
  letter: { label_en: 'Letter', label_th: 'จดหมาย', icon: Mail, color: 'bg-indigo-100 text-indigo-800', bgColor: '#6366F1' },
  other: { label_en: 'Other', label_th: 'อื่น ๆ', icon: HelpCircle, color: 'bg-slate-100 text-slate-800', bgColor: '#64748B' }
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
    const files = Array.from(e.target.files);
    setUploadFiles(prev => [...prev, ...files]);
    e.target.value = null; // Clear input so same file can be selected again
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
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

      // Upload compressed files (40-70%)
      setUploadStage('uploadingFiles');
      setUploadProgressPercent(40);

      const uploadPromises = compressedFiles.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );

      const results = await Promise.all(uploadPromises);
      setUploadProgressPercent(70); // After all files uploaded

      // Save documents (70-100%)
      setUploadStage('savingDocuments');
      const createPromises = results.map((result) =>
        createDocumentMutation.mutateAsync({
          type: uploadType,
          file_url: result.file_url,
          label: uploadLabel || `${uploadType} - ${new Date().toLocaleDateString()}`,
        })
      );

      await Promise.all(createPromises);
      setUploadProgressPercent(100);
      
      // Query invalidation and haptic.success are handled by createDocumentMutation's onSuccess
      setShowUploadDialog(false);
      setUploadFiles([]);
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
    const docLabel = doc.label || (language === 'th' ? config.label_th : config.label_en);
    
    const subject = language === 'th' 
      ? `${docLabel}` 
      : `${docLabel}`;
    
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
      let englishMatch = fullText.match(/Dear\s+[^,]+,[\s\S]*?(Warm regards|Best regards|Sincerely|Yours truly),?/i);
      let englishLetter = englishMatch ? englishMatch[0].trim() : '';
      
      // Extract Thai letter: Start from "เรียน" to Thai closing
      let thaiMatch = fullText.match(/เรียน[^,]+,[\s\S]*?(ขอแสดงความนับถือ|ด้วยความเคารพ|ขอแสดงความเคารพ),?/);
      let thaiLetter = thaiMatch ? thaiMatch[0].trim() : '';
      
      // Build email body: Thai header + Thai content + separator + English content
      let letterContent = 'ภาษาไทยด้านล่าง\n\n';
      
      if (thaiLetter) {
        letterContent += thaiLetter;
      }
      
      if (englishLetter) {
        if (thaiLetter) {
          letterContent += '\n\n---\n\n';
        }
        letterContent += englishLetter;
      }
      
      // If no letters extracted, fallback
      if (!thaiLetter && !englishLetter) {
        letterContent += '[Letter content could not be extracted]';
      }
      
      // Format final email with footer
      body = `${letterContent}\n\n---\n\n${language === 'th' ? 'สร้างโดย' : 'Created by'} Lease Shield - https://www.leaseshield.asia`;
    } else {
      // For other document types, keep existing format
      body = language === 'th'
        ? `เอกสาร: ${docLabel}\nวันที่: ${format(new Date(doc.created_date), 'dd/MM/yyyy')}\n\n${doc.file_url}`
        : `Document: ${docLabel}\nDate: ${format(new Date(doc.created_date), 'MMM d, yyyy')}\n\n${doc.file_url}`;
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
  const storageLimits = getStorageLimits();
  const storageCheck = canUploadFiles(0);

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    uploadBg: '#353A3D',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    uploadBg: '#F8FAFC',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF'
  };

  const strings = {
    en: {
      back: "Back to Dashboard",
      title: "Evidence Vault",
      subtitle: "Secure storage for all your rental documentation",
      uploadFiles: "Upload Files",
      uploadDocument: "Upload Document",
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
      deleteConfirm: "Are you sure?", // Existing
      confirmDelete: "Are you sure you want to delete this file?", // Added for haptic-enabled delete
      confirmBulkDelete: "Are you sure you want to delete {count} file(s)?" , // Added for haptic-enabled bulk delete
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
      downloadFailed: "Failed to download file"
    },
    th: {
      back: "กลับไปยังแดชบอร์ด",
      title: "คลังหลักฐาน",
      subtitle: "จัดเก็บเอกสารการเช่าทั้งหมดของคุณอย่างปลอดภัย",
      uploadFiles: "อัปโหลดไฟล์",
      uploadDocument: "อัปโหลดเอกสาร",
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
      deleteConfirm: "คุณแน่ใจหรือไม่?", // Existing
      confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?", // Added
      confirmBulkDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์ {count} ไฟล์?", // Added
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
      downloadFailed: "ไม่สามารถดาวน์โหลดไฟล์ได้"
    },
    zh: {
      back: "返回仪表板",
      title: "证据库",
      subtitle: "安全存储您的所有租赁文档",
      uploadFiles: "上传文件",
      uploadDocument: "上传文档",
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
      confirmDelete: "您确定要删除此文件吗？",
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
      downloadFailed: "下载文件失败"
    },
    ja: {
      back: "ダッシュボードに戻る",
      title: "証拠保管庫",
      subtitle: "すべての賃貸文書を安全に保管",
      uploadFiles: "ファイルをアップロード",
      uploadDocument: "ドキュメントをアップロード",
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
      confirmDelete: "このファイルを削除してもよろしいですか？",
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
      downloadFailed: "ファイルのダウンロードに失敗しました"
    },
    ko: {
      back: "대시보드로 돌아가기",
      title: "증거 보관소",
      subtitle: "모든 임대 문서를 안전하게 보관",
      uploadFiles: "파일 업로드",
      uploadDocument: "문서 업로드",
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
      confirmDelete: "이 파일을 삭제하시겠습니까?",
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
      downloadFailed: "파일 다운로드 실패"
    }
  }[language] || {
    back: "Back to Dashboard",
    title: "Evidence Vault",
    subtitle: "Secure storage for all your rental documentation",
    uploadFiles: "Upload Files",
    uploadDocument: "Upload Document",
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
    downloadFailed: "Failed to download file"
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
                        {language === 'th' ? config.label_th : config.label_en}
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
                {viewingDoc?.label || (language === 'th' ? DOC_TYPE_CONFIG[viewingDoc?.type]?.label_th : DOC_TYPE_CONFIG[viewingDoc?.type]?.label_en)}
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

        {/* FAB for Upload */}
        <FloatingActionButton
          icon={Upload}
          label={strings.uploadDocument}
          onClick={() => setShowUploadDialog(true)}
          color="#0C3B2E"
          showLabel={false}
        />

        {/* Upload Bottom Sheet - REPLACING Dialog */}
        <BottomSheet
          open={showUploadDialog}
          onClose={() => {
            setShowUploadDialog(false);
            setUploadFiles([]);
            setCompressionStats(null);
            setError(null);
            setUploadType('photo'); // Reset type to default
            setUploadLabel(''); // Clear label
          }}
          title={strings.uploadDocument}
          colors={colors}
          maxHeight="85vh"
        >
          <div className="space-y-4 pb-4">
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
                        <p className="text-sm font-semibold mb-1" style={{ color: isDarkMode ? '#93C5FD' : '#1D4ED8' }}>
                          {language === 'th' ? 'ปรับขนาดไฟล์แล้ว' : 'Images Optimized'}
                        </p>
                        <p className="text-xs" style={{ color: isDarkMode ? '#BFDBFE' : '#2563EB' }}>
                          {language === 'th' 
                            ? `${compressionStats.compressedCount} รูป • ประหยัด ${compressionStats.savedMB} MB`
                            : `${compressionStats.compressedCount} images • Saved ${compressionStats.savedMB} MB`
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
                          {language === 'th' ? config.label_th : config.label_en}
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
                      className="border-2 border-dashed rounded-xl p-8 text-center transition-colors active:scale-[0.98]"
                      style={{
                        borderColor: colors.borderColor,
                        backgroundColor: colors.uploadBg,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        minHeight: '120px'
                      }}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary }} />
                      <p className="font-semibold mb-1 text-sm" style={{ color: colors.textPrimary }}>
                        {strings.selectFiles}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
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

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      haptic.light();
                      setShowUploadDialog(false);
                      setUploadFiles([]);
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
                    disabled={uploading || uploadFiles.length === 0}
                    className="flex-1 bg-ls-forest hover:bg-ls-forest/90"
                    style={{ minHeight: '48px' }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {strings.uploading}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {strings.uploadButton}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </BottomSheet>

        <Button
          variant="ghost"
          onClick={() => {
            haptic.light();
            navigate(createPageUrl("Dashboard"));
          }}
          className="mb-4"
          style={{ color: colors.textSecondary }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.back}
        </Button>

        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-ls-forest" />
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          
          {/* STORAGE USAGE INDICATOR */}
          <div className="mt-3 flex gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {strings.storageUsed
                .replace('{used}', storageCheck.usedMB)
                .replace('{limit}', storageLimits.limitMB)}
            </Badge>
            {userTier === 'free' && (
              <Badge className={documents.length >= storageLimits.fileLimit ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}>
                {strings.filesUsed
                  .replace('{count}', documents.length)
                  .replace('{limit}', storageLimits.fileLimit)}
              </Badge>
            )}
          </div>
        </div>

        {/* Templates Link - now a separate card */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-0">
            <Link to={createPageUrl("Templates")}>
              <div
                className="p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer"
                onClick={() => haptic.light()} // Added haptic
                style={{
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  borderColor: '#0C3B2E'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-ls-forest flex items-center justify-center flex-shrink-0">
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
                  <ArrowRight className="w-5 h-5 text-ls-forest flex-shrink-0" />
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <div className="max-w-7xl mx-auto">
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
                                  <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-ls-forest" />
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
            <EmptyState
              icon={FileText}
              title={strings.noDocuments}
              description={strings.noDocumentsDesc}
              illustration="documents"
              actionLabel={strings.uploadFirst}
              onAction={() => setShowUploadDialog(true)}
              colors={colors}
            />
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
                    onDelete={() => handleSwipeDelete(doc.id)} // Kept original handleSwipeDelete
                    deleteLabel={strings.delete}
                    colors={colors}
                    disabled={isOptimistic}
                  >
                    <Card
                      className={`overflow-hidden border-none shadow-lg hover:shadow-xl transition-all relative ${isSelected ? 'ring-2 ring-ls-forest' : ''} ${isOptimistic ? 'opacity-60' : ''}`}
                      style={{ backgroundColor: colors.cardBg, borderColor: isSelected ? '#0C3B2E' : colors.borderColor }}
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
                            {doc.label || (language === 'th' ? config.label_th : config.label_en)}
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
                              {language === 'th' ? config.label_th : config.label_en}
                            </Badge>
                            <h3 className="font-bold text-sm truncate" style={{ color: colors.textPrimary }}>
                              {doc.label || (language === 'th' ? config.label_th : config.label_en)}
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
                              backgroundColor: '#0C3B2E',
                              color: '#FFFFFF'
                            }}
                            onMouseEnter={(e) => {
                              if (!isOptimistic) {
                                e.target.style.backgroundColor = '#0a2f25';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isOptimistic) {
                                e.target.style.backgroundColor = '#0C3B2E';
                              }
                            }}
                          >
                            <Download className="w-3 h-3 inline mr-1" />
                            {strings.download}
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
      </div>
    </PullToRefresh>
  );
}

export default function EvidenceVault() {
  return (
    <ToastProvider>
      <EvidenceVaultContent />
    </ToastProvider>
  );
}
