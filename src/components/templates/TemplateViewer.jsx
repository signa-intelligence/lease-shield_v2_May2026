import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Copy, FileText, CreditCard, Loader2 } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

export default function TemplateViewer({ template, isOpen, onClose, colors, language, contentLang, onContentLangChange, user, toast }) {
  const queryClient = useQueryClient();
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [templateReady, setTemplateReady] = useState(false);

  React.useEffect(() => {
    if (template && template.id && template.template_key) {
      setTemplateReady(true);
    } else {
      setTemplateReady(false);
    }
  }, [template]);

  if (!isOpen) return null;
  
  if (!template || !templateReady) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        onClick={onClose}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-2xl p-8 text-center"
          style={{ backgroundColor: colors?.cardBg || '#FFFFFF' }}
        >
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#0C3B2E' }} />
          <p style={{ color: colors?.textSecondary || '#666' }}>
            {language === 'th' ? 'กำลังโหลด...' : 'Loading template...'}
          </p>
        </div>
      </div>
    );
  }

  const displayLang = contentLang || language;
  const title = displayLang === 'th' ? (template.title_th || template.title_en || 'Template') : (template.title_en || 'Template');
  
  // Extract from nested or flat structure
  const nestedPreview = template.preview_content || {};
  const nestedDoc = template.document_content || {};
  
  const previewEn = nestedPreview.en || template.preview_content_en || template.preview_en || '';
  const previewTh = nestedPreview.th || template.preview_content_th || template.preview_th || '';
  const docEn = nestedDoc.en || template.document_content_en || template.document_content || '';
  const docTh = nestedDoc.th || template.document_content_th || '';
  
  const previewContent = displayLang === 'th' ? previewTh : previewEn;
  const documentContent = displayLang === 'th' ? docTh : docEn;
  
  const letterCredits = user?.letter_credits || 0;
  const canUseCredits = letterCredits >= 1;
  const hasPreview = previewContent && previewContent.trim().length >= 50;
  const hasDocument = documentContent && documentContent.trim().length >= 300;

  const contentMissing = displayLang === 'th' 
    ? (previewTh.trim().length < 50 || docTh.trim().length < 300)
    : (previewEn.trim().length < 50 || docEn.trim().length < 300);

  const handleCopy = async () => {
    if (!template || !template.id) {
      toast?.error?.(language === 'th' ? 'ข้อมูลเทมเพลตไม่ถูกต้อง' : 'Invalid template data');
      return;
    }

    if (!hasDocument) {
      toast?.error?.(language === 'th' ? 'เทมเพลตนี้ยังไม่พร้อมใช้งาน' : 'This template is not ready for download yet');
      return;
    }

    if (!canUseCredits) {
      setShowCreditModal(true);
      return;
    }

    setCopying(true);
    try {
      console.log('[TEMPLATE] Copy text action:', { template_key: template?.template_key, lang: language, credits_before: letterCredits });

      // Deduct credit first
      await base44.auth.updateMe({ 
        letter_credits: Math.max(0, letterCredits - 1) 
      });

      await base44.entities.CreditsLedger.create({
        user_id: user.id,
        user_email: user.email,
        type: 'letters',
        delta: -1,
        reason: 'purchase',
        source_ref: `template_copy:${template.template_key}`
      });

      console.log('[TEMPLATE] Credit deducted, credits_after:', letterCredits - 1);

      // Copy document content to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(documentContent);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = documentContent;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(language === 'th' 
        ? `คัดลอกแล้ว! เครดิตคงเหลือ: ${letterCredits - 1}` 
        : `Copied! Credits remaining: ${letterCredits - 1}`);
      haptic.success();
    } catch (error) {
      console.error('[TEMPLATE] Copy error:', error);
      toast.error(language === 'th' ? 'คัดลอกล้มเหลว' : 'Copy failed');
      haptic.error();
    } finally {
      setCopying(false);
    }
  };

  const handleDownloadDOCX = async () => {
    if (!template || !template.id) {
      toast?.error?.(language === 'th' ? 'ข้อมูลเทมเพลตไม่ถูกต้อง' : 'Invalid template data');
      return;
    }

    if (!hasDocument) {
      toast?.error?.(language === 'th' ? 'เทมเพลตนี้ยังไม่พร้อมใช้งาน' : 'This template is not ready for download yet');
      return;
    }

    if (!canUseCredits) {
      setShowCreditModal(true);
      return;
    }

    setDownloading(true);
    try {
      console.log('[TEMPLATE] DOCX download action:', { template_key: template?.template_key, lang: language, credits_before: letterCredits });

      // Deduct credit first
      await base44.auth.updateMe({ 
        letter_credits: Math.max(0, letterCredits - 1) 
      });

      await base44.entities.CreditsLedger.create({
        user_id: user.id,
        user_email: user.email,
        type: 'letters',
        delta: -1,
        reason: 'purchase',
        source_ref: `template_docx:${template.template_key}`
      });

      console.log('[TEMPLATE] Credit deducted, generating DOCX, credits_after:', letterCredits - 1);

      // Generate DOCX from document_content
      const paragraphs = [];
      
      // Title (bold, centered)
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 32
            })
          ],
          spacing: { after: 400 }
        })
      );

      // Body paragraphs from document_content
      const bodyLines = documentContent.split('\n');
      bodyLines.forEach((line) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 24
              })
            ],
            spacing: { after: 200 }
          })
        );
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const langSuffix = displayLang === 'th' ? '_th' : '_en';
      a.download = `${template.template_key}${langSuffix}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(language === 'th' 
        ? `ดาวน์โหลดแล้ว! เครดิตคงเหลือ: ${letterCredits - 1}` 
        : `Downloaded! Credits remaining: ${letterCredits - 1}`);
      haptic.success();
    } catch (error) {
      console.error('[TEMPLATE] DOCX error:', error);
      toast.error(language === 'th' ? 'ไม่สามารถสร้าง DOCX ได้' : 'DOCX generation failed');
      haptic.error();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.cardBg }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.borderColor }}>
            <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{title}</h2>
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg mr-2" style={{ backgroundColor: colors.fieldBg, border: `1px solid ${colors.borderColor}` }}>
                <button
                  onClick={() => onContentLangChange?.('en')}
                  className="px-2 py-1 rounded text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: displayLang === 'en' ? '#0C3B2E' : 'transparent',
                    color: displayLang === 'en' ? '#FFFFFF' : colors.textSecondary
                  }}
                >
                  EN
                </button>
                <button
                  onClick={() => onContentLangChange?.('th')}
                  className="px-2 py-1 rounded text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: displayLang === 'th' ? '#0C3B2E' : 'transparent',
                    color: displayLang === 'th' ? '#FFFFFF' : colors.textSecondary
                  }}
                >
                  TH
                </button>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5">
                <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: colors.fieldBg }}>
            {contentMissing && (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', borderLeft: '4px solid #F59E0B' }}>
                <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                  {displayLang === 'th' 
                    ? '⚠️ เนื้อหาภาษาไทยกำลังเตรียมการ - ใช้ภาษาอังกฤษในตอนนี้' 
                    : '⚠️ Content coming soon in selected language'}
                </p>
              </div>
            )}
            {hasPreview ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
                {previewContent}
              </pre>
            ) : (
              <p className="text-sm text-center" style={{ color: colors.textSecondary }}>
                {language === 'th' ? 'ไม่มีเนื้อหาตัวอย่าง' : 'Preview content unavailable'}
              </p>
            )}
          </div>

          {/* Footer - Actions */}
          <div className="p-4 border-t space-y-3" style={{ borderColor: colors.borderColor }}>
            {user && (user.role === 'admin' || user.access_level === 'admin' || user.access_level === 'super_admin') && (
              <button
                onClick={async () => {
                  try {
                    const { data } = await base44.functions.invoke('seedTemplateLibrary', { force: false });
                    toast.success(`Seeded ${data.summary.updated_count} templates!`);
                    queryClient.invalidateQueries({ queryKey: ['templateAssets'] });
                  } catch (error) {
                    toast.error('Seed failed: ' + error.message);
                  }
                }}
                className="w-full text-xs py-2 rounded"
                style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
              >
                🌱 Seed Template Content (Admin)
              </button>
            )}
            
            <div className="flex items-center justify-between text-sm mb-2">
              <span style={{ color: colors.textSecondary }}>
                {language === 'th' ? 'เครดิตของคุณ:' : 'Your credits:'}
              </span>
              <span className="font-bold" style={{ color: letterCredits > 0 ? '#10B981' : '#EF4444' }}>
                {letterCredits}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCopy}
                disabled={copying || !canUseCredits || !hasDocument}
                className="w-full"
                style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
              >
                {copying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {language === 'th' ? 'คัดลอกข้อความ' : 'Copy Text'}
                <span className="ml-1 text-xs opacity-75">(1 {language === 'th' ? 'เครดิต' : 'credit'})</span>
              </Button>

              <Button
                onClick={handleDownloadDOCX}
                disabled={downloading || !canUseCredits || !hasDocument}
                className="w-full"
                style={{ backgroundColor: '#C7A338', color: '#FFFFFF' }}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {language === 'th' ? 'ดาวน์โหลด Word' : 'Download Word'}
                <span className="ml-1 text-xs opacity-75">(.docx)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* No Credits Modal */}
      {showCreditModal && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={() => setShowCreditModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ backgroundColor: colors.cardBg }}
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>
              <CreditCard className="w-8 h-8" style={{ color: '#DC2626' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {language === 'th' ? 'ไม่มีเครดิต' : 'No Credits'}
            </h3>
            <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
              {language === 'th' 
                ? 'คุณมี 0 เครดิต กรุณาอัปเกรดหรือซื้อเครดิตเพื่อดำเนินการต่อ' 
                : 'You have 0 letter credits. Upgrade or buy credits to proceed.'}
            </p>
            <Button
              onClick={() => setShowCreditModal(false)}
              className="w-full"
              style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
            >
              {language === 'th' ? 'ปิด' : 'Close'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}