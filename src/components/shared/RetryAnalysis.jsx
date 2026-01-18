import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { haptic } from "./HapticFeedback";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RetryAnalysis({ lease, onSuccess, language = 'en', colors = {}, onStatusChange, user, leases = [] }) {
  const [retrying, setRetrying] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();

  const getScanLimits = () => {
    const userTier = user?.plan_tier || 'free';
    switch(userTier) {
      case 'free': return { limit: 1, period: 'lifetime', unlimited: false };
      case 'lite': return { limit: 6, period: 'year', unlimited: false };
      case 'protect': return { limit: 12, period: 'year', unlimited: false };
      case 'secure': return { limit: 999, period: 'year', unlimited: true };
      default: return { limit: 1, period: 'lifetime', unlimited: false };
    }
  };

  const canRetry = () => {
    const limits = getScanLimits();
    if (limits.unlimited) return { allowed: true, remaining: 999 };

    let scannedCount = 0;
    if (limits.period === 'lifetime') {
      scannedCount = leases.filter(l => l.status === 'scanned' || l.status === 'ok' || l.status === 'paid').length;
    } else if (limits.period === 'year') {
      const thisYear = new Date().getFullYear();
      scannedCount = leases.filter(l => {
        if (!l.created_date) return false;
        const leaseYear = new Date(l.created_date).getFullYear();
        return leaseYear === thisYear && (l.status === 'scanned' || l.status === 'ok' || l.status === 'paid');
      }).length;
    }

    return {
      allowed: scannedCount < limits.limit,
      remaining: Math.max(0, limits.limit - scannedCount)
    };
  };

  const handleRetryClick = () => {
    const scanStatus = canRetry();
    
    if (!scanStatus.allowed) {
      // Show upgrade prompt
      const periodText = getScanLimits().period === 'year'
        ? (language === 'th' ? 'ปีนี้' : 'this year')
        : (language === 'th' ? 'ตลอดชีพ' : 'lifetime');
      
      if (window.confirm(
        language === 'th'
          ? `คุณใช้ครบโควต้าการสแกนแล้ว\n\nอัปเกรดแผนเพื่อสแกนเพิ่มเติม`
          : `You've used all your scans ${periodText}.\n\nUpgrade your plan for more scans.`
      )) {
        navigate(createPageUrl("Account"));
      }
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmRetry = async () => {
    setShowConfirmDialog(false);
    haptic.medium();
    setRetrying(true);

    try {
      const requestId = `retry-${Date.now()}`;
      
      console.log(`[RETRY] Starting analysis retry for lease ${lease.id}`);
      
      // Update status to queued first (triggers progress bar on UploadScan page)
      await base44.entities.Lease.update(lease.id, {
        status: 'queued'
      });

      // Notify parent to update UI immediately
      if (onStatusChange) {
        onStatusChange(lease.id, 'queued');
      }
      
      // Brief delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Then set to processing
      await base44.entities.Lease.update(lease.id, {
        status: 'processing'
      });

      if (onStatusChange) {
        onStatusChange(lease.id, 'processing');
      }

      const fileUrls = lease.file_urls || [lease.file_url];
      
      // Find existing scan for this lease to pass scanId
      let existingScanId = null;
      try {
        const existingScans = await base44.entities.LeaseScan.filter({ lease_id: lease.id });
        if (existingScans.length > 0) {
          existingScanId = existingScans[0].id;
        }
      } catch (e) {
        console.log('[RETRY] Could not find existing scan:', e);
      }
      
      console.log("[RETRY] INVOKE_SCANLEASEEXTERNAL_START", { leaseId: lease.id, scanId: existingScanId, fileUrl: fileUrls?.[0] || lease.file_url, language });
      const resp = await base44.functions.invoke("scanLeaseCF_v1", {
        leaseId: lease.id,
        scanId: existingScanId,
        fileUrl: fileUrls?.[0] || lease.file_url,
        language
      });
      const out = resp?.data ?? resp;
      console.log("[RETRY] INVOKE_SCANLEASEEXTERNAL_RAW", resp);
      console.log("[RETRY] INVOKE_SCANLEASEEXTERNAL_OUT", out);
      
      if (!out) {
        alert(language === 'th' ? 'ไม่ได้รับผลลัพธ์จากการวิเคราะห์' : 'Did not receive analysis result from function');
        setRetrying(false);
        return;
      }
      if (out?.ok !== true) {
        const preview = out?.debugLog?.body_preview ? `\n\n[Preview]\n${out.debugLog.body_preview}` : '';
        alert(`[${out.step}][${out.error_code}] ${out.message}${preview}`);
        setRetrying(false);
        return;
      }
      // Handle the response from scanLeaseCF_v1
      if (out?.ok === true && out?.scan_full) {
        const scanFull = out.scan_full;
        
        // Extract key terms from scan_full
        const keyTerms = scanFull.key_terms || {};
        
        // Update lease with all extracted data including property_address
        await base44.entities.Lease.update(lease.id, {
          status: 'scanned',
          property_address: keyTerms.property_address || scanFull.property_address || null,
          start_date: keyTerms.lease_start_date || keyTerms.start_date || null,
          end_date: keyTerms.lease_end_date || keyTerms.end_date || null,
          rent_amount: keyTerms.monthly_rent || keyTerms.rent_amount || null,
          deposit_amount: keyTerms.security_deposit || keyTerms.deposit_amount || null,
          language_detected: language || 'en'
        });
        
        console.log('[RETRY] Lease updated with extracted data:', {
          property_address: keyTerms.property_address || scanFull.property_address,
          start_date: keyTerms.lease_start_date || keyTerms.start_date,
          end_date: keyTerms.lease_end_date || keyTerms.end_date
        });

        // Update or create scan record
        if (existingScanId) {
          await base44.entities.LeaseScan.update(existingScanId, {
            risk_score: scanFull.risk_score || 0,
            flags: (scanFull.clauses || []).filter(c => c.risk_level !== 'none').map(c => ({
              severity: c.risk_level,
              description: c.explanation
            })),
            summary: scanFull.summary?.executive_summary || '',
            scan_full: scanFull,
            version: '1.0'
          });
        } else {
          await base44.entities.LeaseScan.create({
            lease_id: lease.id,
            risk_score: scanFull.risk_score || 0,
            flags: (scanFull.clauses || []).filter(c => c.risk_level !== 'none').map(c => ({
              severity: c.risk_level,
              description: c.explanation
            })),
            summary: scanFull.summary?.executive_summary || '',
            scan_full: scanFull,
            version: '1.0'
          });
        }

        console.log(`[RETRY] Analysis succeeded for lease ${lease.id}`);
        haptic.success();
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(out?.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('[RETRY] Analysis failed:', error);
      
      await base44.entities.Lease.update(lease.id, {
        status: 'failed'
      });

      if (onStatusChange) {
        onStatusChange(lease.id, 'failed');
      }

      haptic.error();
    } finally {
      setRetrying(false);
    }
  };

  const t = {
    en: {
      retryConfirmTitle: 'Retry Analysis?',
      retryConfirmMessage: '1 lease scan will be deducted from your account.',
      scansRemaining: 'scans remaining',
      cancel: 'Cancel',
      confirm: 'Yes, Retry',
      retrying: 'Retrying...',
      retryButton: 'Retry Analysis'
    },
    th: {
      retryConfirmTitle: 'ลองวิเคราะห์อีกครั้ง?',
      retryConfirmMessage: 'จะหัก 1 การสแกนสัญญาเช่าจากบัญชีของคุณ',
      scansRemaining: 'การสแกนที่เหลือ',
      cancel: 'ยกเลิก',
      confirm: 'ใช่ ลองใหม่',
      retrying: 'กำลังลองใหม่...',
      retryButton: 'ลองอีกครั้ง'
    },
    ru: {
      retryConfirmTitle: 'Повторить анализ?',
      retryConfirmMessage: '1 сканирование будет вычтено из вашего счета.',
      scansRemaining: 'сканирований осталось',
      cancel: 'Отмена',
      confirm: 'Да, повторить',
      retrying: 'Повтор...',
      retryButton: 'Повторить'
    }
  };

  const strings = t[language] || t.en;
  const scanStatus = canRetry();

  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleRetryClick();
        }}
        disabled={retrying}
        size="sm"
        variant="outline"
        className="flex items-center gap-2"
        style={{
          borderColor: retrying ? colors?.borderColor : '#3B82F6',
          color: retrying ? colors?.textSecondary : '#3B82F6',
          minHeight: '32px'
        }}
      >
        {retrying ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            {strings.retrying}
          </>
        ) : (
          <>
            <RefreshCw className="w-3 h-3" />
            {strings.retryButton}
          </>
        )}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent
          className="max-w-sm w-[90vw]"
          style={{ backgroundColor: colors?.cardBg || '#FFFFFF', borderColor: colors?.borderColor }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: colors?.textPrimary }}>
              <AlertCircle className="w-5 h-5 text-blue-600" />
              {strings.retryConfirmTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm" style={{ color: colors?.textSecondary }}>
              {strings.retryConfirmMessage}
            </p>
            {!getScanLimits().unlimited && (
              <div className="p-3 rounded-lg" style={{
                backgroundColor: colors?.fieldBg || '#F8FAFC',
                border: `1px solid ${colors?.borderColor}`
              }}>
                <p className="text-xs font-semibold" style={{ color: colors?.textSecondary }}>
                  {scanStatus.remaining - 1} {strings.scansRemaining}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  haptic.light();
                  setShowConfirmDialog(false);
                }}
                className="flex-1"
              >
                {strings.cancel}
              </Button>
              <Button
                onClick={handleConfirmRetry}
                className="flex-1"
                style={{ backgroundColor: '#3B82F6', color: '#FFFFFF' }}
              >
                {strings.confirm}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}