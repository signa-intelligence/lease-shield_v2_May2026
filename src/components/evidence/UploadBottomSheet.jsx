import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2, FileText, FileVideo, CheckCircle2, Mic, Folder, FolderPlus } from "lucide-react";
import { compressMultipleImages } from "../shared/ImageCompression";
import { uploadFilesSequentially } from "./uploadFiles";
import { haptic } from "../shared/HapticFeedback";
import UploadProgress from "../shared/UploadProgress";
import BottomSheet from "../shared/BottomSheet";
import MobileFormInput from "../shared/MobileFormInput";
import { getDocTypeLabel } from "./evidenceStrings";

export default function UploadBottomSheet({
  open, onClose, language, colors, isDarkMode, strings, folderStr,
  folders, user, isVideoTier, activeFolderFilter,
  canUploadFiles, createDocumentMutation,
}) {
  const queryClient = useQueryClient();
  const [uploadFiles, setUploadFiles] = useState([]);
  const [voiceFiles, setVoiceFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [uploadLabel, setUploadLabel] = useState('');
  const [error, setError] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);

  // Folder destination
  const [uploadFolderId, setUploadFolderId] = useState(() => {
    if (activeFolderFilter && activeFolderFilter !== 'all' && activeFolderFilter !== 'root') {
      return activeFolderFilter;
    }
    return null;
  });
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [inlineFolderName, setInlineFolderName] = useState('');
  const [creatingInlineFolder, setCreatingInlineFolder] = useState(false);

  const MAX_VIDEO_SIZE_MB = 50;

  const resetState = () => {
    setUploadFiles([]);
    setVoiceFiles([]);
    setUploadType('photo');
    setUploadLabel('');
    setError(null);
    setCompressionStats(null);
    setUploadStage('');
    setUploadProgressPercent(0);
    setUploadFolderId(null);
    setShowInlineCreate(false);
    setInlineFolderName('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      console.log(`[EV_SELECT] File: ${f.name}, type: ${f.type}, size: ${f.size}`);
      if (f.type.startsWith('video/') && !isVideoTier) {
        console.log(`[EV_SELECT] ❌ Rejected (video, not video tier): ${f.name}`);
        return false;
      }
      if (f.type.startsWith('video/') && f.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        console.log(`[EV_SELECT] ❌ Rejected (video too large): ${f.name}`);
        return false;
      }
      return true;
    });

    console.log(`[EV_SELECT] Accepted ${validFiles.length}/${files.length} files`);
    if (validFiles.length === 0) { e.target.value = null; return; }
    setUploadFiles(prev => [...prev, ...validFiles]);
    e.target.value = null;
  };

  const handleVoiceClick = () => {
    if (voiceFiles.length >= 3) return;
    document.getElementById('upload-voice-input')?.click();
  };

  const handleVoiceSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const validFiles = files.filter(f => f.type.startsWith('audio/') && f.size <= 5 * 1024 * 1024);
    const remaining = 3 - voiceFiles.length;
    setVoiceFiles(prev => [...prev, ...validFiles.slice(0, remaining)]);
    haptic.light();
  };

  const handleInlineCreateFolder = async () => {
    if (!inlineFolderName.trim() || !user?.email) return;
    setCreatingInlineFolder(true);
    try {
      const newFolder = await base44.entities.EvidenceFolder.create({
        folder_name: inlineFolderName.trim(),
        owner_email: user.email,
      });
      queryClient.invalidateQueries({ queryKey: ['evidenceFolders', user.email] });
      setUploadFolderId(newFolder.id);
      setInlineFolderName('');
      setShowInlineCreate(false);
      haptic.success();
    } catch (err) {
      console.error('Inline folder create failed:', err);
      haptic.error();
    } finally {
      setCreatingInlineFolder(false);
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 && voiceFiles.length === 0) {
      setError(strings.selectFile);
      return;
    }

    const uploadCheck = canUploadFiles(uploadFiles.length);
    if (!uploadCheck.allowed) {
      setError(
        language === 'th'
          ? `ถึงขีดจำกัดไฟล์แล้ว (${uploadCheck.current}/${uploadCheck.limit} ไฟล์)\n\nอัปเกรดเพื่อจัดเก็บไฟล์เพิ่มเติม`
          : `File limit reached (${uploadCheck.current}/${uploadCheck.limit} files)\n\nUpgrade for more storage`
      );
      return;
    }

    // --- STORAGE QUOTA CHECK ---
    const totalBytes = [...uploadFiles, ...voiceFiles].reduce((sum, f) => sum + (f.size || 0), 0);
    if (totalBytes > 0) {
      try {
        const quotaRes = await base44.functions.invoke('checkStorageQuota', { fileSize: totalBytes });
        const quota = quotaRes.data;
        if (quota && !quota.allowed && !quota.failOpen) {
          const msg = language === 'th'
            ? `พื้นที่จัดเก็บเต็ม คุณใช้ ${quota.usedMB || 0} MB จาก ${quota.limitMB || 0} MB\n\nอัปเกรดเพื่อเพิ่มพื้นที่`
            : `Storage limit reached. You're using ${quota.usedMB || 0} MB of ${quota.limitMB || 0} MB.\n\nUpgrade for more storage.`;
          setError(msg);
          return;
        }
      } catch (quotaErr) {
        // Fail open — don't block upload if quota check fails
        console.warn('[EV] Quota check failed, continuing upload:', quotaErr?.message);
      }
    }

    haptic.medium();
    setUploading(true);
    setError(null);
    setCompressionStats(null);
    setUploadStage('compressing');
    setUploadProgressPercent(0);

    try {
      const { files: compressedFiles, stats } = await compressMultipleImages(uploadFiles, (progress) => {
        setUploadProgressPercent(Math.round(progress * 40));
      });
      if (stats.compressedCount > 0) setCompressionStats(stats);

      setUploadStage('uploadingFiles');
      setUploadProgressPercent(40);

      const allFilesToUpload = [...compressedFiles, ...voiceFiles];
      const { results, failedFiles } = await uploadFilesSequentially(allFilesToUpload, {
        language,
        onProgress: (i, total) => {
          setUploadProgressPercent(40 + Math.round(((i + 1) / total) * 30));
        }
      });

      if (results.length === 0) {
        throw new Error(failedFiles.length > 0 ? `Upload failed:\n${failedFiles.join('\n')}` : strings.uploadFailed);
      }

      setUploadStage('savingDocuments');
      let totalUploadedBytes = 0;
      for (let idx = 0; idx < results.length; idx++) {
        const { result, fileIndex } = results[idx];
        const originalFile = allFilesToUpload[fileIndex];
        const fileSize = originalFile?.size || 0;
        let docType = uploadType;
        if (fileIndex >= compressedFiles.length) {
          docType = 'other';
        } else if (originalFile) {
          const mime = (originalFile.type || '').toLowerCase();
          if (mime.startsWith('video/')) docType = 'video';
          else if (mime.startsWith('image/')) docType = 'photo';
          else if (mime === 'application/pdf' || mime.includes('word') || mime.includes('document') || mime.includes('spreadsheet') || mime === 'text/plain') docType = 'other';
        }
        const typeLabel = getDocTypeLabel(docType, language);
        const docData = {
          type: docType,
          file_url: result.file_url,
          label: uploadLabel || strings.defaultDocLabel.replace('{docType}', typeLabel).replace('{date}', new Date().toLocaleDateString()),
          file_size: fileSize,
        };
        if (uploadFolderId) docData.folder_id = uploadFolderId;
        await createDocumentMutation.mutateAsync(docData);
        totalUploadedBytes += fileSize;
        setUploadProgressPercent(70 + Math.round(((idx + 1) / results.length) * 30));
      }

      // --- UPDATE STORAGE USAGE after all docs saved ---
      if (totalUploadedBytes > 0) {
        base44.functions.invoke('updateStorageUsage', { bytesAdded: totalUploadedBytes }).catch(err =>
          console.warn('[EV] Storage update failed (non-blocking):', err?.message)
        );
      }

      // Invalidate storage query so StorageMeter refreshes
      queryClient.invalidateQueries({ queryKey: ['userStorage'] });

      resetState();
      onClose();
    } catch (err) {
      console.error('[EV] UPLOAD FAILED:', err);
      setError(err?.message || strings.uploadFailed);
      haptic.error();
    } finally {
      setUploading(false);
      setUploadStage('');
      setUploadProgressPercent(0);
    }
  };

  // Update folder default when activeFolderFilter changes
  React.useEffect(() => {
    if (open && activeFolderFilter && activeFolderFilter !== 'all' && activeFolderFilter !== 'root') {
      setUploadFolderId(activeFolderFilter);
    }
  }, [open, activeFolderFilter]);

  const selectedFolderName = uploadFolderId ? folders.find(f => f.id === uploadFolderId)?.folder_name : null;

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
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
              <div className="p-3 rounded-lg border-2" style={{ backgroundColor: isDarkMode ? '#1E3A2E' : '#ECFDF5', borderColor: '#10B981' }}>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#10B981' }}>
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <p className="font-semibold mb-1" style={{ color: isDarkMode ? '#6EE7B7' : '#047857' }}>
                    {strings.imagesOptimizedDesc?.replace('{count}', compressionStats.compressedCount).replace('{saved}', compressionStats.savedMB)}
                  </p>
                </div>
              </div>
            )}

            <MobileFormInput
              label={strings.customLabelLabel}
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              placeholder={strings.customLabelPlaceholder}
              colors={colors}
            />

            {/* Folder destination selector */}
            <div>
              <Label className="text-sm font-semibold mb-2 block" style={{ color: colors.textPrimary }}>
                <Folder className="w-4 h-4 inline mr-1.5 mb-0.5" />
                {folderStr.saveTo}
              </Label>
              {!showInlineCreate ? (
                <div className="flex gap-2 items-center">
                  <Select
                    value={uploadFolderId || "__root__"}
                    onValueChange={(v) => {
                      setUploadFolderId(v === '__root__' ? null : v);
                    }}
                  >
                    <SelectTrigger className="flex-1" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                      <SelectItem value="__root__">📂 {folderStr.rootLevel}</SelectItem>
                      {folders.map(f => (
                        <SelectItem key={f.id} value={f.id}>📁 {f.folder_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => { setShowInlineCreate(true); haptic.light(); }}
                    className="btn-interaction flex items-center gap-1.5 whitespace-nowrap"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${isDarkMode ? '#C7A338' : '#0C3B2E'}`,
                      backgroundColor: 'transparent',
                      color: isDarkMode ? '#C7A338' : '#0C3B2E',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: '36px',
                    }}
                  >
                    <FolderPlus className="w-4 h-4" />
                    {folderStr.newFolderBtn}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={inlineFolderName}
                    onChange={(e) => setInlineFolderName(e.target.value)}
                    placeholder={folderStr.newFolderName}
                    maxLength={50}
                    autoFocus
                    className="flex-1"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && inlineFolderName.trim()) handleInlineCreateFolder(); }}
                  />
                  <Button size="sm" disabled={!inlineFolderName.trim() || creatingInlineFolder} onClick={handleInlineCreateFolder}
                    style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF', minHeight: '40px' }}>
                    {creatingInlineFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : folderStr.create}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowInlineCreate(false); setInlineFolderName(''); }} style={{ minHeight: '40px' }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {(uploadFiles.length > 0 || voiceFiles.length > 0) && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: colors.textSecondary }}>
                  {folderStr.savingTo} {selectedFolderName ? `📁 ${selectedFolderName}` : `📂 ${folderStr.rootLevel}`}
                </p>
              )}
            </div>

            {/* Voice Upload */}
            <div className="flex gap-2 flex-wrap">
              <input id="upload-voice-input" type="file" accept="audio/*" multiple onChange={handleVoiceSelection} className="hidden" />
              <button type="button" onClick={handleVoiceClick} className="btn-interaction"
                style={{ padding: '8px 14px', borderRadius: '8px', border: `2px solid ${colors.borderColor}`, backgroundColor: colors.uploadBg,
                  color: colors.textPrimary, fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '40px' }}>
                <Mic className="w-4 h-4" />
                {strings.addVoiceNote}
              </button>
            </div>

            {voiceFiles.length > 0 && (
              <div>
                <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>{voiceFiles.length} {strings.voiceNotesAdded}</p>
                <div className="space-y-2">
                  {voiceFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colors.inputBg, border: `1px solid ${colors.borderColor}` }}>
                      <Mic className="w-4 h-4" style={{ color: colors.textPrimary }} />
                      <span className="text-xs flex-1 truncate" style={{ color: colors.textPrimary }}>{file.name}</span>
                      <button type="button" onClick={() => setVoiceFiles(prev => prev.filter((_, i) => i !== index))} className="text-red-600" style={{ minWidth: '24px', minHeight: '24px' }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File picker */}
            <div>
              <input type="file" multiple onChange={handleFileSelect} className="hidden" id="upload-sheet-file-input"
                accept={isVideoTier ? ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.heic,.heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" : ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
                disabled={uploading} />
              <label htmlFor="upload-sheet-file-input">
                <div className="border-2 border-dashed rounded-xl text-center transition-colors active:scale-[0.98]"
                  style={{ borderColor: colors.borderColor, backgroundColor: colors.uploadBg, cursor: uploading ? 'not-allowed' : 'pointer', padding: '16px', minHeight: '100px' }}>
                  <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                  <p className="font-semibold text-xs leading-tight" style={{ color: colors.textPrimary }}>{strings.selectFiles}</p>
                  <p className="text-xs mt-1 leading-tight" style={{ color: colors.textSecondary }}>{strings.supportedFormats}</p>
                </div>
              </label>
            </div>

            {uploadFiles.length > 0 && (
              <div>
                <p className="font-semibold mb-2 text-sm" style={{ color: colors.textPrimary }}>{strings.selectedFiles} ({uploadFiles.length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: colors.uploadBg }}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 flex-shrink-0" style={{ color: colors.textSecondary }} />
                        <span className="text-sm truncate" style={{ color: colors.textPrimary }}>{file.name}</span>
                      </div>
                      <button onClick={() => { haptic.light(); setUploadFiles(prev => prev.filter((_, i) => i !== index)); }}
                        className="p-2 hover:bg-red-100 rounded-lg flex-shrink-0" disabled={uploading} style={{ minWidth: '44px', minHeight: '44px' }}>
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky footer */}
            <div className="fixed left-0 right-0 flex gap-3 p-4 border-t"
              style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 80px)', backgroundColor: colors.cardBg, borderTopColor: colors.borderColor, zIndex: 10 }}>
              <Button variant="outline" onClick={handleClose} disabled={uploading} className="flex-1" style={{ minHeight: '48px' }}>
                {strings.cancel}
              </Button>
              <Button onClick={handleUpload} disabled={uploading || (uploadFiles.length === 0 && voiceFiles.length === 0)} className="flex-1"
                style={{ minHeight: '48px', backgroundColor: '#0C3B2E', color: '#FFFFFF', fontWeight: '600', fontSize: '15px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span style={{ color: '#FFFFFF' }}>{strings.uploading}</span></>
                ) : (
                  <><Upload className="w-4 h-4" /><span style={{ color: '#FFFFFF' }}>{strings.uploadButton}</span></>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}