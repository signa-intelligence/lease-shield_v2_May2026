// Subscription cancel/downgrade handler hooks for Account page
import { base44 } from "@/api/base44Client";
import { haptic } from "../shared/HapticFeedback";

export function createCancelHandler({ 
  user, cancelReason, cancelFeedback, 
  setCancelling, setShowCancelDialog, setCancelReason, setCancelFeedback,
  refetchUser, queryClient, language
}) {
  return async () => {
    if (!cancelReason) {
      alert(language === 'th' ? 'กรุณาเลือกเหตุผลในการยกเลิก' : 'Please select a reason for cancellation');
      return;
    }

    haptic.medium();
    setCancelling(true);
    try {
      const response = await base44.functions.invoke('cancelSubscription', {
        reason: cancelReason,
        feedback: cancelFeedback
      });

      if (response.data?.success) {
        refetchUser?.();
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        setShowCancelDialog(false);
        setCancelReason('');
        setCancelFeedback('');
        haptic.success();
        const accessUntil = response.data.access_until 
          ? new Date(response.data.access_until).toLocaleDateString() 
          : '';
        alert(language === 'th' 
          ? `การยกเลิกสำเร็จ คุณจะยังคงสามารถเข้าถึงฟีเจอร์ได้จนถึง ${accessUntil}` 
          : `Cancellation successful. You'll keep access until ${accessUntil}.`);
      } else if (response.data?.error) {
        console.error('[CANCEL] Server error:', response.data.error);
        haptic.error();
        alert(language === 'th' 
          ? `ไม่สามารถยกเลิกได้: ${response.data.error}` 
          : `Failed to cancel: ${response.data.error}`);
      }
    } catch (error) {
      console.error('[CANCEL] Error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      haptic.error();
      alert(language === 'th' 
        ? `ไม่สามารถยกเลิกได้: ${errorMsg}` 
        : `Failed to cancel: ${errorMsg}`);
    } finally {
      setCancelling(false);
    }
  };
}

export function createDowngradeHandler({
  downgradeReason, downgradeFeedback,
  setCancelling, setShowDowngradeFlow, setDowngradeStep, setDowngradeReason, setDowngradeFeedback,
  refetchUser, queryClient, language
}) {
  return async () => {
    if (!downgradeReason) {
      alert(language === 'th' ? 'กรุณาเลือกเหตุผล' : 'Please select a reason');
      return;
    }

    haptic.medium();
    setCancelling(true);
    try {
      const response = await base44.functions.invoke('cancelSubscription', {
        reason: downgradeReason,
        feedback: downgradeFeedback || 'User chose to downgrade to free plan'
      });

      if (response.data?.success) {
        refetchUser?.();
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        setShowDowngradeFlow(false);
        setDowngradeStep(1);
        setDowngradeReason('');
        setDowngradeFeedback('');
        haptic.success();
        const accessUntil = response.data.access_until 
          ? new Date(response.data.access_until).toLocaleDateString() 
          : '';
        alert(language === 'th' 
          ? `ลดระดับสำเร็จ คุณจะยังคงสามารถเข้าถึงฟีเจอร์ได้จนถึง ${accessUntil}` 
          : `Downgrade successful. You'll keep access until ${accessUntil}.`);
      } else if (response.data?.error) {
        console.error('[DOWNGRADE] Server error:', response.data.error);
        haptic.error();
        alert(language === 'th' 
          ? `ไม่สามารถลดระดับได้: ${response.data.error}` 
          : `Failed to downgrade: ${response.data.error}`);
      }
    } catch (error) {
      console.error('[DOWNGRADE] Error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      haptic.error();
      alert(language === 'th' 
        ? `ไม่สามารถลดระดับได้: ${errorMsg}` 
        : `Failed to downgrade: ${errorMsg}`);
    } finally {
      setCancelling(false);
    }
  };
}