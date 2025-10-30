import React from "react";
import { Upload, FileText, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function LeaseUploadZone({ onFileSelect, dragActive, onDrag }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';

  const t = {
    en: {
      title: "Upload Your Lease Agreement",
      dragDrop: "Drag and drop your lease document here, or click to browse",
      multiPage: "Multiple pages supported - upload all pages of your lease",
      browseFiles: "Browse Files",
      takePhotos: "Take Photos",
      formats: "Supported formats: PDF, PNG, JPEG • Max size: 10MB per file • Multiple files allowed"
    },
    th: {
      title: "อัปโหลดสัญญาเช่าของคุณ",
      dragDrop: "ลากและวางเอกสารสัญญาเช่าที่นี่ หรือคลิกเพื่อเรียกดู",
      multiPage: "รองรับหลายหน้า - อัปโหลดทุกหน้าของสัญญาเช่า",
      browseFiles: "เรียกดูไฟล์",
      takePhotos: "ถ่ายรูป",
      formats: "รองรับรูปแบบ: PDF, PNG, JPEG • ขนาดสูงสุด: 10MB ต่อไฟล์ • อนุญาตหลายไฟล์"
    }
  };

  const strings = t[language];

  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onFileSelect}
      style={{
        border: dragActive ? '3px dashed #0C3B2E' : '3px dashed #D1D5DB',
        borderRadius: '16px',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: dragActive ? '#ECEFED' : '#F9FAFB',
        transition: 'all 0.3s',
        cursor: 'pointer'
      }}
    >
      <div className="flex flex-col items-center">
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: 'linear-gradient(to bottom right, #0C3B2E, #14532d)',
            boxShadow: '0 8px 16px rgba(12, 59, 46, 0.2)'
          }}
        >
          <Upload className="w-10 h-10 text-white" />
        </div>
        
        <h3 className="text-xl font-bold text-ls-charcoal mb-2">
          {strings.title}
        </h3>
        
        <p className="text-slate-600 mb-1">
          {strings.dragDrop}
        </p>
        
        <p className="text-sm text-ls-gold font-semibold mb-6">
          ⚡ {strings.multiPage}
        </p>

        <div className="flex gap-3">
          <label
            htmlFor="file-input"
            style={{
              backgroundColor: '#0C3B2E',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
          >
            <FileText className="w-5 h-5" />
            {strings.browseFiles}
          </label>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={onFileSelect}
            className="hidden"
          />

          <label
            htmlFor="camera-input"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0C3B2E',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              border: '2px solid #0C3B2E',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#ECEFED'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFFFF'}
          >
            <Camera className="w-5 h-5" />
            {strings.takePhotos}
          </label>
          <input
            id="camera-input"
            type="file"
            multiple
            accept="image/*"
            capture="environment"
            onChange={onFileSelect}
            className="hidden"
          />
        </div>

        <p className="text-xs text-slate-500 mt-6">
          {strings.formats}
        </p>
      </div>
    </div>
  );
}