import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { haptic } from "./HapticFeedback";

export default function RetryAnalysis({ lease, onSuccess, language = 'en', colors = {}, onStatusChange }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    haptic.medium();
    setRetrying(true);

    try {
      const requestId = `retry-${Date.now()}`;
      
      console.log(`[RETRY] Starting analysis retry for lease ${lease.id}`);
      
      // Update status to processing (not queued, since we're actively processing)
      await base44.entities.Lease.update(lease.id, {
        status: 'processing'
      });

      // Notify parent to update UI immediately
      if (onStatusChange) {
        onStatusChange(lease.id, 'processing');
      }

      const fileUrls = lease.file_urls || [lease.file_url];
      
      console.log("[RETRY] INVOKE_SCANLEASEEXTERNAL_START", { leaseId: lease.id, fileUrl: fileUrls?.[0] || lease.file_url, language });
      const resp = await base44.functions.invoke('scanLeaseExternal', {
        leaseId: lease.id,
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
        alert(`[${out.step || 'ERROR'}][${out.error_code || 'UNKNOWN'}] ${out.message || 'Analysis failed'}`);
        setRetrying(false);
        return;
      }
      const scanResponse = resp.data;

      if (scanResponse?.success) {
        const scanResult = scanResponse.result;
        
        await base44.entities.Lease.update(lease.id, {
          status: 'scanned',
          property_address: scanResult.property_address || null,
          start_date: scanResult.start_date || null,
          end_date: scanResult.end_date || null,
          rent_amount: scanResult.rent_amount > 0 ? scanResult.rent_amount : null,
          deposit_amount: scanResult.deposit_amount > 0 ? scanResult.deposit_amount : null,
          language_detected: scanResult.language_detected || 'en'
        });

        // Check if scan already exists
        const existingScans = await base44.entities.LeaseScan.filter({ lease_id: lease.id });
        
        if (existingScans.length > 0) {
          await base44.entities.LeaseScan.update(existingScans[0].id, {
            risk_score: scanResult.risk_score,
            flags: scanResult.flags || [],
            summary: scanResult.summary,
            scan_full: scanResult,
            version: '1.0'
          });
        } else {
          await base44.entities.LeaseScan.create({
            lease_id: lease.id,
            risk_score: scanResult.risk_score,
            flags: scanResult.flags || [],
            summary: scanResult.summary,
            scan_full: scanResult,
            version: '1.0'
          });
        }

        console.log(`[RETRY] Analysis succeeded for lease ${lease.id}`);
        haptic.success();
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(scanResponse?.error || 'Analysis failed');
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

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation(); // Prevent card click
        handleRetry();
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
          {language === 'th' ? 'กำลังลองใหม่...' : language === 'ru' ? 'Повтор...' : 'Retrying...'}
        </>
      ) : (
        <>
          <RefreshCw className="w-3 h-3" />
          {language === 'th' ? 'ลองอีกครั้ง' : language === 'ru' ? 'Повторить' : 'Retry Analysis'}
        </>
      )}
    </Button>
  );
}