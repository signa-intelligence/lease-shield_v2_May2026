import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Copy, Download, CreditCard, Loader2 } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";
import { jsPDF } from "jspdf";

export default function TemplateViewer({ template, isOpen, onClose, colors, language, user, toast }) {
  const queryClient = useQueryClient();
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  if (!isOpen || !template) return null;

  const title = language === 'th' ? (template.title_th || template.title_en) : template.title_en;
  const body = language === 'th' ? (template.body_th || template.body_en) : template.body_en;
  const letterCredits = user?.letter_credits || 0;
  const canUseCredits = letterCredits >= 1;

  const handleCopy = async () => {
    if (!canUseCredits) {
      setShowCreditModal(true);
      return;
    }

    setCopying(true);
    try {
      console.log('[TEMPLATE] Copy text action:', { template_key: template.template_key, lang: language, credits_before: letterCredits });

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

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(body);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = body;
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

  const handleDownloadPDF = async () => {
    if (!canUseCredits) {
      setShowCreditModal(true);
      return;
    }

    setDownloading(true);
    try {
      console.log('[TEMPLATE] PDF download action:', { template_key: template.template_key, lang: language, credits_before: letterCredits });

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
        source_ref: `template_pdf:${template.template_key}`
      });

      console.log('[TEMPLATE] Credit deducted, generating PDF, credits_after:', letterCredits - 1);

      // Generate PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Title
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(title, margin, margin);

      // Body
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      const lines = pdf.splitTextToSize(body, maxWidth);
      let y = margin + 10;

      lines.forEach((line) => {
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 6;
      });

      pdf.save(`${template.template_key}_${language}.pdf`);

      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(language === 'th' 
        ? `ดาวน์โหลดแล้ว! เครดิตคงเหลือ: ${letterCredits - 1}` 
        : `Downloaded! Credits remaining: ${letterCredits - 1}`);
      haptic.success();
    } catch (error) {
      console.error('[TEMPLATE] PDF error:', error);
      toast.error(language === 'th' ? 'ไม่สามารถสร้าง PDF ได้' : 'PDF generation failed');
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
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5">
              <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: colors.fieldBg }}>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
              {body}
            </pre>
          </div>

          {/* Footer - Actions */}
          <div className="p-4 border-t space-y-3" style={{ borderColor: colors.borderColor }}>
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
                disabled={copying || !canUseCredits}
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
                onClick={handleDownloadPDF}
                disabled={downloading || !canUseCredits}
                className="w-full"
                style={{ backgroundColor: '#C7A338', color: '#FFFFFF' }}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {language === 'th' ? 'ดาวน์โหลด PDF' : 'Download PDF'}
                <span className="ml-1 text-xs opacity-75">(1 {language === 'th' ? 'เครดิต' : 'credit'})</span>
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