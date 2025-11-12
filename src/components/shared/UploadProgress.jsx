import React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Enhanced Upload Progress Component
 * Shows detailed progress with stages and percentages
 */
export default function UploadProgress({ 
  stage = '', 
  progress = 0, 
  totalFiles = 1, 
  currentFile = 1,
  language = 'en',
  colors
}) {
  const isComplete = progress >= 100;

  const stages = {
    en: {
      compressing: 'Compressing images...',
      uploading: 'Uploading files...',
      processing: 'Processing...',
      analyzing: 'Analyzing...',
      finalizing: 'Finalizing...',
      complete: 'Complete!'
    },
    th: {
      compressing: 'กำลังบีบอัดรูปภาพ...',
      uploading: 'กำลังอัปโหลดไฟล์...',
      processing: 'กำลังประมวลผล...',
      analyzing: 'กำลังวิเคราะห์...',
      finalizing: 'กำลังสรุป...',
      complete: 'เสร็จสมบูรณ์!'
    }
  };

  const stageText = stages[language][stage] || stage;

  return (
    <div className="w-full">
      {/* Stage Indicator */}
      <div className="flex items-center justify-center gap-3 mb-4">
        {isComplete ? (
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
        ) : (
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        )}
        <div className="text-left">
          <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {stageText}
          </p>
          {totalFiles > 1 && !isComplete && (
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'ไฟล์' : 'File'} {currentFile}/{totalFiles}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
            {language === 'th' ? 'ความคืบหน้า' : 'Progress'}
          </span>
          <span className="text-sm font-bold" style={{ color: '#3B82F6' }}>
            {progress}%
          </span>
        </div>
        
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: isComplete 
                ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)'
            }}
          />
        </div>

        {/* Estimated Time (if not complete) */}
        {!isComplete && progress > 0 && progress < 100 && (
          <p className="text-xs text-center mt-2" style={{ color: colors.textSecondary }}>
            {language === 'th' ? 'โปรดรอสักครู่...' : 'Please wait...'}
          </p>
        )}
      </div>
    </div>
  );
}