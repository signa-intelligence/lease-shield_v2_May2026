import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Copy, FileText, CreditCard, Loader2 } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "npm:docx@8.5.0";
import { translateTemplateContent } from "./translateTemplate";

export default function TemplateViewer({ template, isOpen, onClose, colors, language, user, toast }) {
  const queryClient = useQueryClient();
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [templateReady, setTemplateReady] = useState(false);
  const [translatedPreview, setTranslatedPreview] = useState(null);
  const [translatingPreview, setTranslatingPreview] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState(null);

  React.useEffect(() => {
    if (template && template.id && template.template_key) {
      setTemplateReady(true);
    } else {
      setTemplateReady(false);
    }
  }, [template]);

  // Translate preview content and title for non-EN/TH languages
  React.useEffect(() => {
    if (!template || !language || !isOpen) return;
    
    const isNonEnTh = !['en', 'th'].includes(language);
    if (!isNonEnTh) {
      setTranslatedPreview(null);
      setTranslatedTitle(null);
      return;
    }

    const previewContentObj = typeof template.preview_content === 'object' ? template.preview_content : {};
    const previewEn = typeof previewContentObj.en === 'string' ? previewContentObj.en : '';
    
    // Translate both title and preview in parallel
    setTranslatingPreview(true);
    
    const titleEn = template.title_en || '';
    
    Promise.all([
      translateTemplateContent(template.template_key, titleEn, language, 'title'),
      previewEn && previewEn.trim().length >= 50 
        ? translateTemplateContent(template.template_key, previewEn, language, 'preview')
        : Promise.resolve(null)
    ])
      .then(([translatedTitleText, translatedPreviewText]) => {
        setTranslatedTitle(translatedTitleText);
        setTranslatedPreview(translatedPreviewText);
        setTranslatingPreview(false);
      })
      .catch(error => {
        console.error('[TRANSLATE] Translation failed:', error);
        setTranslatedTitle(titleEn);
        setTranslatedPreview(previewEn);
        setTranslatingPreview(false);
      });
  }, [template, language, isOpen]);

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
            {language === 'th' ? 'กำลังโหลด...' 
              : language === 'zh' ? '加载中...'
              : language === 'ja' ? '読み込み中...'
              : language === 'ko' ? '로딩 중...'
              : language === 'ru' ? 'Загрузка...'
              : 'Loading template...'}
          </p>
        </div>
      </div>
    );
  }

  // Use app language directly for preview (no separate toggle)
  const displayLang = language;
  const isNonEnTh = !['en', 'th'].includes(displayLang);
  const title = isNonEnTh && translatedTitle 
    ? translatedTitle 
    : (displayLang === 'th' ? (template.title_th || template.title_en || 'Template') : (template.title_en || 'Template'));
  
  // Extract from nested JSON fields (authoritative source)
  const previewContentObj = typeof template.preview_content === 'object' ? template.preview_content : {};
  const documentContentObj = typeof template.document_content === 'object' ? template.document_content : {};
  
  const previewEn = typeof previewContentObj.en === 'string' ? previewContentObj.en : '';
  const previewTh = typeof previewContentObj.th === 'string' ? previewContentObj.th : '';
  const docEn = typeof documentContentObj.en === 'string' ? documentContentObj.en : '';
  const docTh = typeof documentContentObj.th === 'string' ? documentContentObj.th : '';
  
  // Preview selection: EN for EN, TH for TH, translated content for other languages
  const previewContent = isNonEnTh && translatedPreview 
    ? translatedPreview 
    : (displayLang === 'th' ? previewTh : previewEn);
  
  // Document content for Copy/Download: ONLY EN or TH (prefer EN unless app is TH)
  const documentLangForExport = displayLang === 'th' ? 'th' : 'en';
  const documentContent = documentLangForExport === 'th' ? docTh : docEn;
  
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

    if (!documentContent || documentContent.trim().length < 100) {
      toast?.error?.(language === 'th' ? 'เนื้อหาเทมเพลตไม่พร้อมใช้งานชั่วคราว' : 'Template content is temporarily unavailable');
      return;
    }

    if (!canUseCredits) {
      setShowCreditModal(true);
      return;
    }

    setCopying(true);
    try {
      console.log('[TEMPLATE] Copy text action:', { template_key: template?.template_key, lang: displayLang, credits_before: letterCredits });

      // Copy document content to clipboard FIRST
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

      // ONLY deduct credit after successful copy
      await base44.auth.updateMe({ 
        letter_credits: Math.max(0, letterCredits - 1) 
      });

      await base44.entities.CreditsLedger.create({
        user_id: user.id,
        user_email: user.email,
        type: 'letters',
        delta: -1,
        reason: 'purchase',
        source_ref: `template_copy:${template.template_key}:${documentLangForExport}`
      });

      console.log('[TEMPLATE] Credit deducted, credits_after:', letterCredits - 1);

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

    if (!documentContent || documentContent.trim().length < 100) {
      toast?.error?.(language === 'th' ? 'เนื้อหาเทมเพลตไม่พร้อมใช้งานชั่วคราว' : 'Template content is temporarily unavailable');
      return;
    }

    if (!canUseCredits) {
      setShowCreditModal(true);
      return;
    }

    setDownloading(true);
    try {
      console.log('[TEMPLATE] DOCX download action:', { template_key: template?.template_key, lang: displayLang, credits_before: letterCredits });

      // Generate DOCX from selected language document_content
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

      // Body paragraphs from selected language document_content
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
      const langSuffix = documentLangForExport === 'th' ? '_TH' : '_EN';
      a.download = `${template.template_key}${langSuffix}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // ONLY deduct credit after successful download
      await base44.auth.updateMe({ 
        letter_credits: Math.max(0, letterCredits - 1) 
      });

      await base44.entities.CreditsLedger.create({
        user_id: user.id,
        user_email: user.email,
        type: 'letters',
        delta: -1,
        reason: 'purchase',
        source_ref: `template_docx:${template.template_key}:${documentLangForExport}`
      });

      console.log('[TEMPLATE] Credit deducted, credits_after:', letterCredits - 1);

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
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{title}</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5">
                <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: colors.fieldBg }}>
            {isNonEnTh && (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
                <p className="text-xs font-medium" style={{ color: '#1E3A8A' }}>
                  {language === 'zh' ? '此预览仅供参考，已自动翻译。最终文件提供英文版本。' 
                    : language === 'ja' ? 'このプレビューは参考用に自動翻訳されています。最終文書は英語で提供されます。'
                    : language === 'ko' ? '이 미리보기는 참고용으로 자동 번역되었습니다. 최종 문서는 영어로 제공됩니다.'
                    : language === 'ru' ? 'Предварительный просмотр переведен автоматически. Финальный документ предоставляется на английском.'
                    : 'Preview is auto-translated for convenience. Final document is provided in English.'}
                </p>
              </div>
            )}
            {contentMissing && (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', borderLeft: '4px solid #F59E0B' }}>
                <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                  {language === 'th' 
                    ? '⚠️ เนื้อหาภาษาไทยกำลังเตรียมการ - ใช้ภาษาอังกฤษในตอนนี้' 
                    : '⚠️ Content coming soon in selected language'}
                </p>
              </div>
            )}
            {translatingPreview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0C3B2E' }} />
              </div>
            ) : hasPreview ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
                {previewContent}
              </pre>
            ) : (
              <p className="text-sm text-center" style={{ color: colors.textSecondary }}>
                {language === 'th' ? 'ไม่มีเนื้อหาตัวอย่าง' 
                  : language === 'zh' ? '没有预览内容'
                  : language === 'ja' ? 'プレビューコンテンツがありません'
                  : language === 'ko' ? '미리보기 콘텐츠 없음'
                  : language === 'ru' ? 'Нет предварительного просмотра'
                  : 'Preview content unavailable'}
              </p>
            )}
          </div>

          {/* Footer - Actions */}
          <div className="p-4 border-t space-y-3" style={{ borderColor: colors.borderColor }}>

            
            <div className="flex items-center justify-between text-sm mb-2">
              <span style={{ color: colors.textSecondary }}>
                {language === 'th' ? 'เครดิตของคุณ:' 
                  : language === 'zh' ? '您的积分：'
                  : language === 'ja' ? 'あなたのクレジット：'
                  : language === 'ko' ? '크레딧：'
                  : language === 'ru' ? 'Ваши кредиты：'
                  : 'Your credits:'}
              </span>
              <span className="font-bold" style={{ color: letterCredits > 0 ? '#10B981' : '#EF4444' }}>
                {letterCredits}
              </span>
            </div>
            
            {(!documentContent || documentContent.trim().length < 100) && (
              <div className="mb-3 p-3 rounded-lg text-center" style={{ backgroundColor: '#FEF3C7' }}>
                <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                  {language === 'th' ? 'เนื้อหาเทมเพลตไม่พร้อมใช้งานชั่วคราว' 
                    : language === 'zh' ? '模板内容暂时不可用'
                    : language === 'ja' ? 'テンプレートコンテンツは一時的に利用できません'
                    : language === 'ko' ? '템플릿 콘텐츠를 일시적으로 사용할 수 없습니다'
                    : language === 'ru' ? 'Контент шаблона временно недоступен'
                    : 'Template content is temporarily unavailable'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCopy}
                disabled={copying || !canUseCredits || !documentContent || documentContent.trim().length < 100}
                className="w-full flex-1"
                style={{ 
                  backgroundColor: (!documentContent || documentContent.trim().length < 100) ? '#9CA3AF' : '#0C3B2E',
                  color: '#FFFFFF',
                  cursor: (!documentContent || documentContent.trim().length < 100) ? 'not-allowed' : 'pointer',
                  minHeight: '48px',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                {copying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="truncate">
                  {language === 'th' ? 'คัดลอกข้อความ' 
                    : language === 'zh' ? '复制文本'
                    : language === 'ja' ? 'テキストをコピー'
                    : language === 'ko' ? '텍스트 복사'
                    : language === 'ru' ? 'Копировать текст'
                    : 'Copy Text'}
                </span>
                <span className="text-xs opacity-75 flex-shrink-0">
                  {language === 'th' ? '(ใช้ 1 เครดิต)' 
                    : language === 'zh' ? '(1积分)'
                    : language === 'ja' ? '(1クレジット)'
                    : language === 'ko' ? '(1크레딧)'
                    : language === 'ru' ? '(1 кредит)'
                    : '(1 credit)'}
                </span>
              </Button>

              <Button
                onClick={handleDownloadDOCX}
                disabled={downloading || !canUseCredits || !documentContent || documentContent.trim().length < 100}
                className="w-full flex-1"
                style={{ 
                  backgroundColor: (!documentContent || documentContent.trim().length < 100) ? '#9CA3AF' : '#C7A338',
                  color: '#FFFFFF',
                  cursor: (!documentContent || documentContent.trim().length < 100) ? 'not-allowed' : 'pointer',
                  minHeight: '48px',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span className="truncate">
                  {language === 'th' ? 'ดาวน์โหลด Word' 
                    : language === 'zh' ? '下载 Word'
                    : language === 'ja' ? 'Word をダウンロード'
                    : language === 'ko' ? 'Word 다운로드'
                    : language === 'ru' ? 'Скачать Word'
                    : 'Download Word'}
                </span>
                <span className="text-xs opacity-75 flex-shrink-0">
                  {language === 'th' ? '(ใช้ 1 เครดิต)' 
                    : language === 'zh' ? '(1积分)'
                    : language === 'ja' ? '(1クレジット)'
                    : language === 'ko' ? '(1크레딧)'
                    : language === 'ru' ? '(1 кредит)'
                    : '(1 credit)'}
                </span>
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
              {language === 'th' ? 'ไม่มีเครดิต' 
                : language === 'zh' ? '没有积分'
                : language === 'ja' ? 'クレジットがありません'
                : language === 'ko' ? '크레딧 없음'
                : language === 'ru' ? 'Нет кредитов'
                : 'No Credits'}
            </h3>
            <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'คุณมี 0 เครดิต กรุณาอัปเกรดหรือซื้อเครดิตเพื่อดำเนินการต่อ' 
                : language === 'zh' ? '您有0个信函积分。升级或购买积分以继续。'
                : language === 'ja' ? 'レタークレジットが0です。続行するにはアップグレードまたはクレジットを購入してください。'
                : language === 'ko' ? '레터 크레딧이 0개입니다. 계속하려면 업그레이드하거나 크레딧을 구매하세요.'
                : language === 'ru' ? 'У вас 0 кредитов писем. Обновите план или купите кредиты для продолжения.'
                : 'You have 0 letter credits. Upgrade or buy credits to proceed.'}
            </p>
            <Button
              onClick={() => setShowCreditModal(false)}
              className="w-full"
              style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
            >
              {language === 'th' ? 'ปิด' 
                : language === 'zh' ? '关闭'
                : language === 'ja' ? '閉じる'
                : language === 'ko' ? '닫기'
                : language === 'ru' ? 'Закрыть'
                : 'Close'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}