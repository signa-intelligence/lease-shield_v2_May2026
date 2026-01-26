import React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Enhanced Upload Progress Component
 * Shows detailed progress with stages and percentages
 */
export default function UploadProgress({ 
  currentStage = '',  // Changed from 'stage' to match usage
  progress = 0, 
  fileCount = 1,  // Changed from 'totalFiles' to match usage
  currentFile = 1,
  language = 'en',
  primaryColor,
  secondaryColor,
  colors,
  isAnalyzing = false,
  isUploading = false,
  strings,
  retryCount = 0
}) {
  const isComplete = progress >= 100;

  const stages = {
    en: {
      compressing: 'Compressing images...',
      uploading: 'Uploading files...',
      uploadingFiles: 'Uploading files...',
      processing: 'Processing...',
      analyzing: 'Analysing...',
      finalizing: 'Finalising...',
      savingDocuments: 'Saving documents...',
      creating: 'Creating lease record...',
      scanning: 'Analysing document...',
      extracting: 'Extracting lease details...',
      complete: 'Complete!'
    },
    th: {
      compressing: 'กำลังบีบอัดรูปภาพ...',
      uploading: 'กำลังอัปโหลดไฟล์...',
      uploadingFiles: 'กำลังอัปโหลดไฟล์...',
      processing: 'กำลังประมวลผล...',
      analyzing: 'กำลังวิเคราะห์...',
      finalizing: 'กำลังสรุป...',
      savingDocuments: 'กำลังบันทึกเอกสาร...',
      creating: 'กำลังสร้างบันทึกสัญญาเช่า...',
      scanning: 'กำลังวิเคราะห์เอกสาร...',
      extracting: 'กำลังดึงข้อมูลสัญญาเช่า...',
      complete: 'เสร็จสมบูรณ์!'
    },
    zh: {
      compressing: '压缩图片中...',
      uploading: '上传文件中...',
      uploadingFiles: '上传文件中...',
      processing: '处理中...',
      analyzing: '分析中...',
      finalizing: '完成中...',
      savingDocuments: '保存文档中...',
      creating: '创建租约记录中...',
      scanning: '分析文档中...',
      extracting: '提取租约详情中...',
      complete: '完成！'
    },
    ja: {
      compressing: '画像を圧縮中...',
      uploading: 'ファイルをアップロード中...',
      uploadingFiles: 'ファイルをアップロード中...',
      processing: '処理中...',
      analyzing: '分析中...',
      finalizing: '最終処理中...',
      savingDocuments: 'ドキュメントを保存中...',
      creating: '賃貸契約記録を作成中...',
      scanning: 'ドキュメントを分析中...',
      extracting: '賃貸契約の詳細を抽出中...',
      complete: '完了！'
    },
    ko: {
      compressing: '이미지 압축 중...',
      uploading: '파일 업로드 중...',
      uploadingFiles: '파일 업로드 중...',
      processing: '처리 중...',
      analyzing: '분석 중...',
      finalizing: '완료 중...',
      savingDocuments: '문서 저장 중...',
      creating: '임대 계약 기록 생성 중...',
      scanning: '문서를 분석 중...',
      extracting: '임대 계약 세부 정보 추출 중...',
      complete: '완료！'
    },
    ru: {
      compressing: 'Сжатие изображений...',
      uploading: 'Загрузка файлов...',
      uploadingFiles: 'Загрузка файлов...',
      processing: 'Обработка...',
      analyzing: 'Анализ...',
      finalizing: 'Завершение...',
      savingDocuments: 'Сохранение документов...',
      creating: 'Создание записи договора...',
      scanning: 'Анализ документа...',
      extracting: 'Извлечение деталей...',
      complete: 'Завершено!'
    }
  };

  // Safe access with fallbacks
  const langStages = stages[language] || stages.en;
  const stageText = currentStage ? (langStages[currentStage] || currentStage) : '';

  const progressText = {
    en: 'Progress',
    th: 'ความคืบหน้า',
    zh: '进度',
    ja: '進捗',
    ko: '진행 상황'
  };

  const fileText = {
    en: 'File',
    th: 'ไฟล์',
    zh: '文件',
    ja: 'ファイル',
    ko: '파일'
  };

  const pleaseWaitText = {
    en: 'Please wait...',
    th: 'โปรดรอสักครู่...',
    zh: '请稍候...',
    ja: 'お待ちください...',
    ko: '잠시 기다려주세요...'
  };

  const textColor = colors?.textPrimary || primaryColor || '#1A1D1F';
  const secondaryTextColor = colors?.textSecondary || secondaryColor || '#64748b';

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
          <p className="text-lg font-bold" style={{ color: textColor }}>
            {stageText}
          </p>
          {fileCount > 1 && !isComplete && (
            <p className="text-sm" style={{ color: secondaryTextColor }}>
              {fileText[language] || fileText.en} {currentFile}/{fileCount}
            </p>
          )}
          {retryCount > 0 && !isComplete && (
            <p className="text-xs text-amber-600">
              {language === 'th' ? `กำลังลองใหม่ (${retryCount}/3)` : `Retrying (${retryCount}/3)`}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: secondaryTextColor }}>
            {progressText[language] || progressText.en}
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
                : 'linear-gradient(90deg, #0C3B2E 0%, #047857 100%)'
            }}
          />
        </div>

        {/* Estimated Time (if not complete) */}
        {!isComplete && progress > 0 && progress < 100 && (
          <p className="text-xs text-center mt-2" style={{ color: secondaryTextColor }}>
            {pleaseWaitText[language] || pleaseWaitText.en}
          </p>
        )}
      </div>
    </div>
  );
}