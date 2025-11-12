
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

const DOC_TYPE_CONFIG = {
  lease: { label_en: 'Lease', label_th: 'สัญญาเช่า', icon: FileText, color: 'bg-blue-100 text-blue-800', bgColor: '#3B82F6' },
  receipt: { label_en: 'Receipt', label_th: 'ใบเสร็จ', icon: FileText, color: 'bg-emerald-100 text-emerald-800', bgColor: '#10B981' },
  photo: { label_en: 'Photo', label_th: 'รูปภาพ', icon: Camera, color: 'bg-purple-100 text-purple-800', bgColor: '#A855F7' },
  video: { label_en: 'Video', label_th: 'วิดีโอ', icon: FileVideo, color: 'bg-amber-100 text-amber-800', bgColor: '#F59E0B' },
  letter: { label_en: 'Letter', label_th: 'จดหมาย', icon: Mail, color: 'bg-indigo-100 text-indigo-800', bgColor: '#6366F1' },
  other: { label_en: 'Other', label_th: 'อื่น ๆ', icon: HelpCircle, color: 'bg-slate-100 text-slate-800', bgColor: '#64748B' }
};

export default function EvidenceVault() {
  const navigate = useNavigate();
  // Upload dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [uploadLabel, setUploadLabel] = useState(''); // Renamed from customLabel
  const [uploadFiles, setUploadFiles] = useState([]); // Renamed from selectedFiles
  const [error, setError] = useState(null); // For upload errors
  const [compressionStats, setCompressionStats] = useState(null); // New state
  const [uploadStage, setUploadStage] = useState(''); // New state
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0); // New state

  // Existing states for document management
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editFormData, setEditFormData] = useState({ type: '', label: '' });
  const [viewingDoc, setViewingDoc] = useState(null);
  const [annotatingDocument, setAnnotatingDocument] = useState(null);
  const queryClient = useQueryClient();

  const [exportingZip, setExportingZip] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

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
    onSuccess: () => {
      // Query invalidation and state resets are handled by handleUpload's final logic
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setEditingDoc(null);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocs([]); // Clear selection in case a selected item was deleted
    },
  });

  // Removed deleteBulkMutation as per outline, will use deleteDocumentMutation in a loop

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
      const createPromises = results.map((result, index) =>
        base44.entities.Document.create({
          type: uploadType,
          file_url: result.file_url,
          label: uploadLabel || `${uploadType} - ${new Date().toLocaleDateString()}`,
        })
      );

      await Promise.all(createPromises);
      setUploadProgressPercent(100);
      haptic.success();

      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUploadDialog(false);
      setUploadFiles([]);
      setUploadType('other'); // Reset to default
      setUploadLabel(''); // Clear custom label
    } catch (err) {
      console.error('Upload failed:', err);
      setError(strings.uploadFailed);
      haptic.error();
    } finally {
      setUploading(false);
      setUploadStage('');
      setUploadProgressPercent(0);
    }
  };

  const handleSelectAll = () => {
    haptic.light();
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(doc => doc.id));
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
      haptic.heavy();
      deleteDocumentMutation.mutate(docId);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.length === 0) return;
    
    if (confirm(strings.confirmBulkDelete.replace('{count}', selectedDocs.length))) { // Using new string
      haptic.heavy();
      try {
        for (const docId of selectedDocs) {
          await deleteDocumentMutation.mutateAsync(docId); // Changed to use individual mutation and await
        }
        queryClient.invalidateQueries({ queryKey: ['documents'] }); // Invalidate once after all deletes
        setSelectedDocs([]);
        haptic.success();
      } catch (error) {
        console.error("Bulk delete failed:", error);
        alert(language === 'th' ? 'การลบจำนวนมากล้มเหลว' : 'Bulk deletion failed');
        haptic.error();
      }
    }
  };

  const handleBulkExportZip = async () => {
    if (selectedDocs.length === 0) {
      alert(language === 'th' ? 'กรุณาเลือกเอกสารอย่างน้อย 1 ไฟล์' : 'Please select at least 1 document');
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
    } catch (error) {
      console.error('Export failed:', error);
      alert(language === 'th' ? 'ไม่สามารถส่งออกได้' : 'Export failed');
      haptic.error();
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
    } catch (error) {
      console.error('Export failed:', error);
      alert(language === 'th' ? 'ไม่สามารถส่งออกได้' : 'Export failed');
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
      alert(language === 'th' ? 'ไม่พบไฟล์ที่จะดาวน์โหลด' : 'No file found to download.');
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
    
    haptic.medium();
    try {
      await updateDocumentMutation.mutateAsync({
        id: editingDoc.id,
        data: {
          type: editFormData.type,
          label: editFormData.label
        }
      });
      haptic.success();
    } catch (error) {
      console.error('Failed to save document edit:', error);
      alert(language === 'th' ? 'ไม่สามารถบันทึกการแก้ไขได้ โปรดลองอีกครั้ง' : 'Failed to save edits. Please try again.');
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

      // Update document with new URL
      await base44.entities.Document.update(annotatingDocument.id, {
        file_url: file_url
      });

      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setAnnotatingDocument(null);
      
      alert(language === 'th' ? 'บันทึกคำอธิบายประกอบสำเร็จ' : 'Annotation saved successfully');
      haptic.success();
    } catch (error) {
      console.error('Failed to save annotation:', error);
      alert(language === 'th' ? 'ไม่สามารถบันทึกได้' : 'Failed to save annotation');
      haptic.error();
    }
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

  const t = {
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
      confirmBulkDelete: "Are you sure you want to delete {count} file(s)?", // Added for haptic-enabled bulk delete
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
    }
  };

  const strings = t[language];

  return (
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => {
            haptic.light();
            setShowUploadDialog(true);
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0C3B2E',
            color: '#FFFFFF',
            borderRadius: '12px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
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
          <Upload className="w-5 h-5" />
          {strings.uploadDocument}
        </button>
        {/* Other action buttons, if any, could be added here following the same style */}
      </div>

      {/* Simplified Upload Section Card - now acts as a trigger for the dialog */}
      {/* The Upload Files button previously in CardHeader is now replaced by the above "Action Buttons" section */}
      <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
        <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
          <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-ls-forest" /> {/* Changed to FileText, as Upload is in action button now */}
              {strings.uploadFiles} {/* Text remains as is, just indicating the section */}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6" style={{ color: colors.textSecondary }}>
            {strings.uploadFirst}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.textPrimary }}>{strings.uploadDocument}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
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

                {/* Compression Notice */}
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
                            ? `${compressionStats.compressedCount} รูป • ประหยัด ${compressionStats.savedMB} MB (${compressionStats.savingsPercent}%)`
                            : `${compressionStats.compressedCount} images • Saved ${compressionStats.savedMB} MB (${compressionStats.savingsPercent}%)`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="dialog_doc_type" style={{ color: colors.textPrimary }}>{strings.documentType}</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger id="dialog_doc_type" className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
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
                  <Label htmlFor="dialog_custom_label" style={{ color: colors.textPrimary }}>{strings.customLabel}</Label>
                  <Input
                    id="dialog_custom_label"
                    type="text"
                    value={uploadLabel}
                    onChange={(e) => setUploadLabel(e.target.value)}
                    placeholder={strings.customLabelPlaceholder}
                    className="mt-2"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                  />
                </div>

                <div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="dialog-file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov,.avi"
                    disabled={uploading}
                  />
                  <label htmlFor="dialog-file-upload" className={uploading ? 'cursor-not-allowed opacity-70' : ''}>
                    <div
                      className="border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-colors"
                      style={{
                        borderColor: colors.borderColor,
                        backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                        cursor: uploading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3" style={{ color: colors.textSecondary }} />
                      <p className="font-semibold mb-1 text-sm md:text-base" style={{ color: colors.textPrimary }}>{strings.selectFiles}</p>
                      <p className="text-xs md:text-sm" style={{ color: colors.textSecondary }}>{strings.supportedFormats}</p>
                    </div>
                  </label>
                </div>

                {/* Selected Files List */}
                {uploadFiles.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2 text-sm" style={{ color: colors.textPrimary }}>
                      {strings.selectedFiles} ({uploadFiles.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6' }}>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: colors.textSecondary }} />
                            <span className="text-sm truncate" style={{ color: colors.textPrimary }}>{file.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              haptic.light();
                              setUploadFiles(uploadFiles.filter((_, i) => i !== index));
                            }}
                            className="p-1 hover:bg-red-100 rounded flex-shrink-0 ml-2"
                            disabled={uploading}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end mt-4">
                  <Button variant="outline" onClick={() => {
                    haptic.light();
                    setShowUploadDialog(false);
                    setUploadFiles([]);
                    setCompressionStats(null);
                  }} disabled={uploading}>
                    {strings.cancel}
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || uploadFiles.length === 0}
                    className="bg-ls-forest hover:bg-ls-forest/90"
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
        </DialogContent>
      </Dialog>
      
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

      {/* Recent Uploads */}
      {isLoadingDocuments ? (
        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center text-ls-forest">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>{strings.loadingDocuments}</p>
          </CardContent>
        </Card>
      ) : documents.length > 0 ? (
        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <FileText className="w-5 h-5 text-ls-forest" />
                {strings.recentUploads} ({documents.length})
              </CardTitle>
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
                      {exportingZip ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {strings.exporting}
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          {strings.exportZip}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={deleteDocumentMutation.isPending} // Use deleteDocumentMutation's pending state
                      className="text-xs h-8"
                    >
                      {deleteDocumentMutation.isPending ? ( // Use deleteDocumentMutation's pending state
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {strings.deleting}
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          {strings.deleteSelected} ({selectedDocs.length})
                        </>
                      )}
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
                  {exportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {strings.exporting}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      {strings.exportReport}
                    </>
                  )}
                </Button>

                {documents.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm"
                    style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                      color: colors.textPrimary
                    }}
                  >
                    {selectedDocs.length === documents.length ? (
                      <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-ls-forest" />
                    ) : (
                      <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    <span className="font-medium">{language === 'th' ? 'เลือกทั้งหมด' : 'Select All'}</span>
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y" style={{ borderColor: colors.borderColor }}>
              {documents.map((doc) => {
                const config = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.other;
                const Icon = config.icon;
                const isSelected = selectedDocs.includes(doc.id);

                return (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-opacity-50 transition-colors"
                    style={{
                      backgroundColor: isSelected ? (isDarkMode ? '#3A3D40' : '#F3F4F6') : 'transparent'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(doc.id)}
                        className="mt-1 flex-shrink-0 rounded"
                      />
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}
                        style={{ backgroundColor: config.bgColor }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm break-words" style={{ 
                              color: colors.textPrimary,
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere'
                            }}>
                              {doc.label || (language === 'th' ? config.label_th : config.label_en)}
                            </p>
                            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                              {format(new Date(doc.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge className="text-xs whitespace-nowrap" style={{ backgroundColor: config.bgColor + '20', color: config.bgColor, border: `1px solid ${config.bgColor}40` }}>
                            {language === 'th' ? config.label_th : config.label_en}
                          </Badge>
                        </div>
                        {doc.type === 'photo' && doc.file_url && (
                          <div className="mb-3">
                            <img
                              src={doc.file_url}
                              alt={doc.label}
                              className="w-full h-32 object-cover rounded-lg"
                              style={{ border: `1px solid ${colors.borderColor}` }}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(doc)}
                            className="w-full justify-center text-xs"
                            style={{
                              borderColor: colors.borderColor,
                              backgroundColor: colors.cardBg,
                              color: colors.textPrimary,
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {strings.view}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            className="w-full justify-center text-xs"
                            style={{
                              borderColor: colors.borderColor,
                              backgroundColor: colors.cardBg,
                              color: colors.textPrimary,
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {strings.download}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendEmail(doc)}
                            className="w-full justify-center text-xs"
                            style={{
                              borderColor: colors.borderColor,
                              backgroundColor: colors.cardBg,
                              color: colors.textPrimary,
                            }}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            {strings.sendEmail}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(doc)}
                            className="w-full justify-center text-xs"
                            style={{
                              borderColor: colors.borderColor,
                              backgroundColor: colors.cardBg,
                              color: colors.textPrimary,
                            }}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            {strings.editDocument}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            disabled={deleteDocumentMutation.isPending}
                            className="w-full text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {strings.delete}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 md:py-20">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{
            backgroundColor: isDarkMode ? '#3A3D40' : '#F3F4F6'
          }}>
            <FileText className="w-10 h-10 md:w-12 md:h-12" style={{ color: colors.textSecondary, opacity: 0.5 }} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            {strings.noDocuments}
          </h2>
          <p className="mb-6 max-w-md mx-auto text-sm md:text-base px-4" style={{ color: colors.textSecondary }}>
            {strings.noDocumentsDesc}
          </p>
        </div>
      )}
    </div>
  );
}
