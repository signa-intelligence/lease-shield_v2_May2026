import React, { useState } from "react";
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function BatchUploadZone({ onUploadComplete, colors, language = 'en', disabled = false }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const strings = {
    en: {
      dropZone: "Drop multiple lease files here or click to browse",
      formats: "PDF, Word (DOC/DOCX), PNG, JPG",
      selected: "files selected",
      remove: "Remove",
      uploadAll: "Upload & Analyze All",
      uploading: "Uploading",
      processing: "Processing...",
      limitReached: "Upload limit reached"
    },
    th: {
      dropZone: "วางไฟล์สัญญาเช่าหลายไฟล์ที่นี่ หรือคลิกเพื่อเลือก",
      formats: "PDF, Word (DOC/DOCX), PNG, JPG",
      selected: "ไฟล์ที่เลือก",
      remove: "ลบ",
      uploadAll: "อัปโหลดและวิเคราะห์ทั้งหมด",
      uploading: "กำลังอัปโหลด",
      processing: "กำลังประมวลผล...",
      limitReached: "ถึงขีดจำกัดการอัปโหลดแล้ว"
    }
  }[language];

  const handleDrop = (e) => {
    if (disabled) return;
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    if (disabled) return;
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleRemove = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (files.length === 0 || uploading) return;
    
    setUploading(true);
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(prev => ({
        ...prev,
        [i]: { status: 'uploading', progress: 0 }
      }));
      
      try {
        const result = await onUploadComplete(file, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'uploading', progress }
          }));
        });
        
        setUploadProgress(prev => ({
          ...prev,
          [i]: { status: 'success', progress: 100 }
        }));
        
        results.push({ file, success: true, result });
      } catch (error) {
        setUploadProgress(prev => ({
          ...prev,
          [i]: { status: 'error', progress: 0, error: error.message }
        }));
        
        results.push({ file, success: false, error });
      }
    }
    
    setUploading(false);
    setFiles([]);
    setUploadProgress({});
  };

  return (
    <div className="space-y-4">
      {disabled && (
        <div className="p-4 rounded-lg border-2" style={{
          backgroundColor: '#FEE2E2',
          borderColor: '#EF4444'
        }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-semibold text-red-900">{strings.limitReached}</p>
          </div>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          borderColor: dragActive ? '#3B82F6' : colors.borderColor,
          backgroundColor: dragActive ? (colors.bg === '#1A1D1F' ? '#1E3A5F' : '#EFF6FF') : 'transparent',
          pointerEvents: disabled ? 'none' : 'auto'
        }}
        onDragEnter={() => !disabled && setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('batch-file-input')?.click()}
      >
        <input
          id="batch-file-input"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textSecondary }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
          {strings.dropZone}
        </h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.formats}</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {files.length} {strings.selected}
            </p>
            {!uploading && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiles([])}
              >
                <X className="w-4 h-4 mr-2" />
                {strings.remove}
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => {
              const progress = uploadProgress[index];
              
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: colors.bg, border: `1px solid ${colors.borderColor}` }}
                >
                  <div className="flex-shrink-0">
                    {progress?.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : progress?.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : progress?.status === 'uploading' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                      {file.name}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {progress?.status === 'uploading' && (
                      <Progress value={progress.progress} className="mt-2 h-1" />
                    )}
                  </div>

                  {!uploading && (
                    <button
                      onClick={() => handleRemove(index)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleUploadAll}
            disabled={uploading}
            className="w-full bg-ls-forest hover:bg-ls-forest/90 py-6 text-base font-bold"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {strings.processing}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                {strings.uploadAll} ({files.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}