import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { haptic } from "./HapticFeedback";

export default function RetryAnalysis({ lease, onSuccess, language = 'en', colors }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    haptic.medium();
    setRetrying(true);

    try {
      const requestId = `retry-${Date.now()}`;
      
      console.log(`[RETRY] Starting analysis retry for lease ${lease.id}`);
      
      // Update status to queued
      await base44.entities.Lease.update(lease.id, {
        status: 'queued'
      });

      const fileUrls = lease.file_urls || [lease.file_url];
      
      const { data: scanResponse } = await base44.functions.invoke('scanLease', {
        fileUrls: fileUrls,
        requestId,
        leaseId: lease.id,
        scanId: lease.id
      });

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
          // Update existing scan
          await base44.entities.LeaseScan.update(existingScans[0].id, {
            risk_score: scanResult.risk_score,
            flags: scanResult.flags || [],
            summary: scanResult.summary,
            scan_full: scanResult,
            version: '1.0'
          });
        } else {
          // Create new scan
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

      haptic.error();
      alert(
        language === 'th'
          ? `ไม่สามารถวิเคราะห์ได้: ${error.message}\n\nลองอีกครั้งหรือติดต่อฝ่ายสนับสนุน`
          : language === 'ru'
            ? `Ошибка анализа: ${error.message}\n\nПопробуйте снова или свяжитесь с поддержкой`
            : `Analysis failed: ${error.message}\n\nPlease try again or contact support`
      );
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={retrying}
      size="sm"
      variant="outline"
      className="flex items-center gap-2"
      style={{
        borderColor: retrying ? colors?.borderColor : '#3B82F6',
        color: retrying ? colors?.textSecondary : '#3B82F6'
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