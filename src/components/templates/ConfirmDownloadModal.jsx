import React from "react";
import { Download, AlertCircle } from "lucide-react";

/**
 * ConfirmDownloadModal - Single reusable modal for template downloads
 * ALWAYS shows CTAs at bottom (sticky footer)
 */
export default function ConfirmDownloadModal({
  template,
  onConfirm,
  onCancel,
  colors,
  language = 'en',
  isDarkMode = false,
  debugMode = false
}) {
  if (!template) return null;

  const strings = {
    en: {
      confirmDownloadTitle: "Confirm Download",
      creditWillBeDeducted: "1 credit will be deducted",
      cancel: "Cancel",
      confirmDownload: "Confirm Download",
      previewUnavailable: "Preview not available",
      insideTemplate: "Inside this template:",
      mainSections: "Main sections:",
      includes: "Includes:",
      fillInFields: "Fill-in fields:"
    },
    th: {
      confirmDownloadTitle: "ยืนยันการดาวน์โหลด",
      creditWillBeDeducted: "จะหัก 1 เครดิต",
      cancel: "ยกเลิก",
      confirmDownload: "ยืนยันดาวน์โหลด",
      previewUnavailable: "ไม่มีตัวอย่าง",
      insideTemplate: "ภายในเทมเพลต:",
      mainSections: "ส่วนหลัก:",
      includes: "รวมถึง:",
      fillInFields: "ช่องกรอกข้อมูล:"
    }
  };

  const t = strings[language] || strings.en;

  const hasPreviewContent = 
    (template.preview_headings && template.preview_headings.length > 0) ||
    (template.preview_bullets && template.preview_bullets.length > 0) ||
    (template.preview_placeholders && template.preview_placeholders.length > 0);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center" 
      onClick={onCancel}
      style={{ 
        zIndex: 9999,
        overflow: 'hidden',
        padding: '12px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: 'min(92vw, 520px)',
          maxHeight: 'calc(100dvh - 24px)',
          backgroundColor: colors.cardBg,
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          flex: '0 0 auto',
          padding: '20px 20px 16px 20px'
        }}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#0C3B2E' }}>
              <Download className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {t.confirmDownloadTitle}
            </h3>
            <p className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>
              {language === 'th' ? template.title_th : template.title_en}
            </p>
            <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
              {language === 'th' ? template.description_th : template.description_en}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
              backgroundColor: isDarkMode ? '#374151' : '#FEF3C7',
              border: `1px solid ${isDarkMode ? '#4B5563' : '#FDE68A'}`
            }}>
              <AlertCircle className="w-4 h-4" style={{ color: '#D97706' }} />
              <span className="text-sm font-bold" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                {t.creditWillBeDeducted}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div 
          style={{ 
            flex: '1 1 auto',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '0 20px 24px 20px'
          }}
        >
          {hasPreviewContent ? (
            <div className="border rounded-lg p-4 space-y-3" style={{ 
              borderColor: colors.borderColor,
              backgroundColor: colors.fieldBg 
            }}>
              <h4 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {t.insideTemplate}
              </h4>
              
              {template.preview_headings && template.preview_headings.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                    {t.mainSections}
                  </p>
                  <ul className="space-y-1">
                    {template.preview_headings.map((heading, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textPrimary }}>
                        <span className="font-bold" style={{ color: '#0C3B2E' }}>§</span>
                        <span className="font-medium">{heading}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {template.preview_bullets && template.preview_bullets.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                    {t.includes}
                  </p>
                  <ul className="space-y-1">
                    {template.preview_bullets.map((bullet, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.textSecondary }}>
                        <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#0C3B2E' }} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {template.preview_placeholders && template.preview_placeholders.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                    {t.fillInFields}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.preview_placeholders.map((placeholder, i) => (
                      <span 
                        key={i} 
                        className="text-xs px-2 py-1 rounded font-mono"
                        style={{ 
                          backgroundColor: colors.cardBg,
                          border: `1px solid ${colors.borderColor}`,
                          color: colors.textSecondary 
                        }}
                      >
                        {placeholder}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4 text-center" style={{ 
              borderColor: colors.borderColor,
              backgroundColor: colors.fieldBg 
            }}>
              <p className="text-sm italic" style={{ color: colors.textSecondary }}>
                {t.previewUnavailable}
              </p>
            </div>
          )}

          {debugMode && (
            <div className="text-xs font-mono p-3 rounded-lg space-y-1 mt-3" style={{ 
              color: colors.textSecondary, 
              backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
              border: `1px solid ${colors.borderColor}`
            }}>
              <div><strong>Key:</strong> {template.template_key || 'missing'}</div>
              <div><strong>ID:</strong> {template.id}</div>
              <div><strong>File:</strong> {template.file_path || template.docx_url || template.pdf_url || 'missing'}</div>
              <div><strong>Status:</strong> {template.status || 'unknown'}</div>
            </div>
          )}
        </div>

        {/* Modal Footer - ALWAYS VISIBLE, STICKY */}
        <div 
          style={{
            flex: '0 0 auto',
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: colors.cardBg,
            borderTop: `1px solid ${colors.borderColor}`,
            padding: '12px 16px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <button
            onClick={onCancel}
            className="btn-interaction"
            style={{
              backgroundColor: 'transparent',
              border: `2px solid ${colors.borderColor}`,
              color: colors.textPrimary,
              minHeight: '48px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="btn-interaction"
            style={{
              backgroundColor: '#0C3B2E',
              color: '#FFFFFF',
              minHeight: '48px',
              fontSize: '16px',
              fontWeight: '700',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%'
            }}
          >
            <Download className="w-4 h-4" />
            <span>{t.confirmDownload}</span>
          </button>
        </div>
      </div>
    </div>
  );
}