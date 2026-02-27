import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Copy, FileText, CreditCard, Loader2, Lock, Eye } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";
import { translateTemplateContent } from "./translateTemplate";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export default function TemplateViewer({ template, isOpen, onClose, colors, language, user, toast }) {
  const queryClient = useQueryClient();
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [templateReady, setTemplateReady] = useState(false);
  const [translatedPreview, setTranslatedPreview] = useState(null);
  const [translatingPreview, setTranslatingPreview] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState(null);
  // NEW: Track whether user has unlocked the full document
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  React.useEffect(() => {
    if (template && template.id && template.template_key) {
      setTemplateReady(true);
    } else {
      setTemplateReady(false);
    }
    // Reset unlocked state when template changes
    setUnlocked(false);
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

  const displayLang = language;
  const isNonEnTh = !['en', 'th'].includes(displayLang);
  const title = isNonEnTh && translatedTitle 
    ? translatedTitle 
    : (displayLang === 'th' ? (template.title_th || template.title_en || 'Template') : (template.title_en || 'Template'));
  
  const previewContentObj = typeof template.preview_content === 'object' ? template.preview_content : {};
  const documentContentObj = typeof template.document_content === 'object' ? template.document_content : {};
  
  const previewEn = typeof previewContentObj.en === 'string' ? previewContentObj.en : '';
  const previewTh = typeof previewContentObj.th === 'string' ? previewContentObj.th : '';
  const docEn = typeof documentContentObj.en === 'string' ? documentContentObj.en : '';
  const docTh = typeof documentContentObj.th === 'string' ? documentContentObj.th : '';
  
  const previewContent = isNonEnTh && translatedPreview 
    ? translatedPreview 
    : (displayLang === 'th' ? previewTh : previewEn);
  
  const documentLangForExport = displayLang === 'th' ? 'th' : 'en';
  const documentContent = documentLangForExport === 'th' ? docTh : docEn;
  
  const letterCredits = user?.letter_credits || 0;
  const userTierForCredits = user?.plan_tier || 'free';
  const hasUnlimitedCredits = userTierForCredits === 'secure';
  const canUseCredits = hasUnlimitedCredits || letterCredits >= 1;
  const hasPreview = previewContent && previewContent.trim().length >= 50;
  const hasDocument = documentContent && documentContent.trim().length >= 300;

  const contentMissing = displayLang === 'th' 
    ? (previewTh.trim().length < 50 || docTh.trim().length < 300)
    : (previewEn.trim().length < 50 || docEn.trim().length < 300);

  // Localized strings
  const str = {
    unlockFull: language === 'th' ? 'ปลดล็อกเอกสารฉบับเต็ม' : language === 'zh' ? '解锁完整文档' : language === 'ja' ? '完全な文書をロック解除' : language === 'ko' ? '전체 문서 잠금 해제' : language === 'ru' ? 'Разблокировать полный документ' : 'Unlock Full Document',
    oneCreditCost: language === 'th' ? '(ใช้ 1 เครดิต)' : language === 'zh' ? '(1积分)' : language === 'ja' ? '(1クレジット)' : language === 'ko' ? '(1크레딧)' : language === 'ru' ? '(1 кредит)' : '(1 credit)',
    freeCost: language === 'th' ? '(ไม่จำกัด)' : language === 'zh' ? '(无限)' : language === 'ja' ? '(無制限)' : language === 'ko' ? '(무제한)' : language === 'ru' ? '(безлимит)' : '(unlimited)',
    previewLabel: language === 'th' ? 'ตัวอย่าง' : language === 'zh' ? '预览' : language === 'ja' ? 'プレビュー' : language === 'ko' ? '미리보기' : language === 'ru' ? 'Предпросмотр' : 'Preview',
    fullDocument: language === 'th' ? 'เอกสารฉบับเต็ม' : language === 'zh' ? '完整文档' : language === 'ja' ? '完全なドキュメント' : language === 'ko' ? '전체 문서' : language === 'ru' ? 'Полный документ' : 'Full Document',
    copyText: language === 'th' ? 'คัดลอกข้อความ' : language === 'zh' ? '复制文本' : language === 'ja' ? 'テキストをコピー' : language === 'ko' ? '텍스트 복사' : language === 'ru' ? 'Копировать текст' : 'Copy Text',
    downloadWord: language === 'th' ? 'ดาวน์โหลด Word' : language === 'zh' ? '下载 Word' : language === 'ja' ? 'Word をダウンロード' : language === 'ko' ? 'Word 다운로드' : language === 'ru' ? 'Скачать Word' : 'Download Word',
    yourCredits: language === 'th' ? 'เครดิตของคุณ:' : language === 'zh' ? '您的积分：' : language === 'ja' ? 'あなたのクレジット：' : language === 'ko' ? '크레딧：' : language === 'ru' ? 'Ваши кредиты：' : 'Your credits:',
    noCreditsTitle: language === 'th' ? 'ไม่มีเครดิต' : language === 'zh' ? '没有积分' : language === 'ja' ? 'クレジットがありません' : language === 'ko' ? '크레딧 없음' : language === 'ru' ? 'Нет кредитов' : 'No Credits',
    noCreditsDesc: language === 'th' ? 'คุณมี 0 เครดิต กรุณาอัปเกรดหรือซื้อเครดิตเพื่อดำเนินการต่อ' : language === 'zh' ? '您有0个信函积分。升级或购买积分以继续。' : language === 'ja' ? 'レタークレジットが0です。続行するにはアップグレードまたはクレジットを購入してください。' : language === 'ko' ? '레터 크레딧이 0개입니다. 계속하려면 업그레이드하거나 크레딧을 구매하세요.' : language === 'ru' ? 'У вас 0 кредитов писем. Обновите план или купите кредиты для продолжения.' : 'You have 0 letter credits. Upgrade or buy credits to proceed.',
    close: language === 'th' ? 'ปิด' : language === 'zh' ? '关闭' : language === 'ja' ? '閉じる' : language === 'ko' ? '닫기' : language === 'ru' ? 'Закрыть' : 'Close',
    contentUnavailable: language === 'th' ? 'เนื้อหาเทมเพลตไม่พร้อมใช้งานชั่วคราว' : language === 'zh' ? '模板内容暂时不可用' : language === 'ja' ? 'テンプレートコンテンツは一時的に利用できません' : language === 'ko' ? '템플릿 콘텐츠를 일시적으로 사용할 수 없습니다' : language === 'ru' ? 'Контент шаблона временно недоступен' : 'Template content is temporarily unavailable',
    unlockToSee: language === 'th' ? 'ปลดล็อกเพื่อดูเอกสารฉบับเต็ม คัดลอก หรือดาวน์โหลด' : language === 'zh' ? '解锁以查看完整文档、复制或下载' : language === 'ja' ? '完全な文書を表示、コピー、またはダウンロードするにはロックを解除してください' : language === 'ko' ? '전체 문서 보기, 복사 또는 다운로드하려면 잠금 해제하세요' : language === 'ru' ? 'Разблокируйте для просмотра, копирования или скачивания полного документа' : 'Unlock to view, copy, or download the full document',
    copied: language === 'th' ? 'คัดลอกแล้ว!' : 'Copied!',
    downloaded: language === 'th' ? 'ดาวน์โหลดแล้ว!' : 'Downloaded!',
    freeActions: language === 'th' ? '(ฟรี – ปลดล็อกแล้ว)' : language === 'zh' ? '(免费 – 已解锁)' : language === 'ja' ? '(無料 – ロック解除済み)' : language === 'ko' ? '(무료 – 잠금 해제됨)' : language === 'ru' ? '(бесплатно – разблокировано)' : '(free – unlocked)',
  };

  // Handle unlocking (deduct credit + show full document)
  const handleUnlock = async () => {
    if (!template || !template.id) {
      toast?.error?.(str.contentUnavailable);
      return;
    }

    if (!documentContent || documentContent.trim().length < 100) {
      toast?.error?.(str.contentUnavailable);
      return;
    }

    if (!canUseCredits) {
      setShowCreditModal(true);
      return;
    }

    // Check template download limit
    const userTier = user?.plan_tier || 'free';
    const limitCheckResponse = await base44.functions.invoke('checkTemplateDownloadLimit', {
      userEmail: user.email,
      tier: userTier
    });
    
    const limitCheck = limitCheckResponse?.data;
    if (!limitCheck?.allowed) {
      toast.error(limitCheck?.message || 'Template download limit reached');
      return;
    }

    setUnlocking(true);
    try {
      // Deduct credit (skip for unlimited tiers)
      if (!hasUnlimitedCredits) {
        await base44.auth.updateMe({ 
          letter_credits: Math.max(0, letterCredits - 1) 
        });

        await base44.entities.CreditsLedger.create({
          user_id: user.id,
          user_email: user.email,
          type: 'letters',
          delta: -1,
          reason: 'purchase',
          source_ref: `template_unlock:${template.template_key}:${documentLangForExport}`
        });
      }

      // Track
      await base44.functions.invoke('trackTemplateDownload', {
        userEmail: user.email,
        templateKey: template.template_key,
        templateName: title,
        tier: userTier
      });

      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['templateUsage'] });
      
      setUnlocked(true);
      haptic.success();
    } catch (error) {
      console.error('[TEMPLATE] Unlock error:', error);
      toast.error(str.contentUnavailable);
      haptic.error();
    } finally {
      setUnlocking(false);
    }
  };

  // Copy (no credit deduction – already unlocked)
  const handleCopy = async () => {
    setCopying(true);
    try {
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
      toast.success(str.copied);
      haptic.success();
    } catch (error) {
      console.error('[TEMPLATE] Copy error:', error);
      toast.error('Copy failed');
      haptic.error();
    } finally {
      setCopying(false);
    }
  };

  // Download DOCX (no credit deduction – already unlocked)
  const handleDownloadDOCX = async () => {
    setDownloading(true);
    try {
      const lines = documentContent.split('\n');
      const children = [];

      children.push(new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 28, color: '0C3B2E' })],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 }
      }));

      for (const line of lines) {
        if (line.trim() === '') {
          children.push(new Paragraph({ text: '' }));
          continue;
        }
        const bulletMatch = line.match(/^\s*[-•*]\s+(.*)$/);
        if (bulletMatch) {
          children.push(new Paragraph({
            text: bulletMatch[1],
            bullet: { level: 0 },
            spacing: { before: 80, after: 80 }
          }));
          continue;
        }
        children.push(new Paragraph({
          children: [new TextRun({ text: line.trim(), size: 22 })],
          spacing: { before: 80, after: 80 }
        }));
      }

      const doc = new Document({
        sections: [{ properties: {}, children }]
      });

      const buffer = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(buffer);
      const a = document.createElement('a');
      a.href = url;
      const langSuffix = documentLangForExport === 'th' ? '_TH' : '_EN';
      a.download = `${template.template_key}${langSuffix}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(str.downloaded);
      haptic.success();
    } catch (error) {
      console.error('[TEMPLATE] DOCX error:', error);
      toast.error('DOCX generation failed');
      haptic.error();
    } finally {
      setDownloading(false);
    }
  };

  // Determine what to show in the body
  const showFullDocument = unlocked || hasUnlimitedCredits;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        onClick={onClose}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.cardBg }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.borderColor }}>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{title}</h2>
              <div className="flex items-center gap-2 mt-1">
                {showFullDocument ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                    <Eye className="w-3 h-3" />
                    {str.fullDocument}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.fieldBg, color: colors.textSecondary }}>
                    {str.previewLabel}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 flex-shrink-0">
              <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
            </button>
          </div>

          {/* Body */}
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

            {showFullDocument ? (
              /* FULL DOCUMENT VIEW (after unlock) */
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
                {documentContent}
              </pre>
            ) : (
              /* PREVIEW VIEW (before unlock) */
              <>
                {translatingPreview ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0C3B2E' }} />
                  </div>
                ) : hasPreview ? (
                  <div className="relative">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
                      {previewContent}
                    </pre>
                    {/* Fade overlay to indicate truncated content */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                      style={{ 
                        background: `linear-gradient(to bottom, transparent, ${colors.fieldBg})` 
                      }}
                    />
                  </div>
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
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t space-y-3" style={{ borderColor: colors.borderColor }}>
            {/* Credits info */}
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: colors.textSecondary }}>{str.yourCredits}</span>
              <span className="font-bold" style={{ color: (hasUnlimitedCredits || letterCredits > 0) ? '#10B981' : '#EF4444' }}>
                {hasUnlimitedCredits ? '∞' : letterCredits}
              </span>
            </div>

            {(!documentContent || documentContent.trim().length < 100) && (
              <div className="mb-3 p-3 rounded-lg text-center" style={{ backgroundColor: '#FEF3C7' }}>
                <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                  {str.contentUnavailable}
                </p>
              </div>
            )}

            {showFullDocument ? (
              /* UNLOCKED: Show Copy + Download (free, no additional credit) */
              <div className="space-y-2">
                <p className="text-xs text-center font-medium" style={{ color: '#10B981' }}>
                  {str.freeActions}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleCopy}
                    disabled={copying}
                    className="w-full flex-1"
                    style={{ 
                      backgroundColor: '#0C3B2E',
                      color: '#FFFFFF',
                      minHeight: '48px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {copying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {str.copyText}
                  </Button>

                  <Button
                    onClick={handleDownloadDOCX}
                    disabled={downloading}
                    className="w-full flex-1"
                    style={{ 
                      backgroundColor: '#C7A338',
                      color: '#FFFFFF',
                      minHeight: '48px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    {str.downloadWord}
                  </Button>
                </div>
              </div>
            ) : (
              /* LOCKED: Show Unlock button */
              <div className="space-y-2">
                <p className="text-xs text-center" style={{ color: colors.textSecondary }}>
                  {str.unlockToSee}
                </p>
                <Button
                  onClick={handleUnlock}
                  disabled={unlocking || !canUseCredits || !documentContent || documentContent.trim().length < 100}
                  className="w-full"
                  style={{ 
                    backgroundColor: (!documentContent || documentContent.trim().length < 100) ? '#9CA3AF' : '#0C3B2E',
                    color: '#FFFFFF',
                    minHeight: '52px',
                    fontSize: '15px',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(12, 59, 46, 0.3)'
                  }}
                >
                  {unlocking ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Lock className="w-5 h-5 mr-2" />
                  )}
                  {str.unlockFull}
                  <span className="text-xs opacity-75 ml-2">
                    {hasUnlimitedCredits ? str.freeCost : str.oneCreditCost}
                  </span>
                </Button>
              </div>
            )}
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
              {str.noCreditsTitle}
            </h3>
            <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
              {str.noCreditsDesc}
            </p>
            <Button
              onClick={() => setShowCreditModal(false)}
              className="w-full"
              style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
            >
              {str.close}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}