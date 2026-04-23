import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function Welcome() {
  useEffect(() => {
    const route = async () => {
      const pendingPlan = sessionStorage.getItem('pendingPlan');
      const scanFromFunnel = sessionStorage.getItem('scanFromFunnel');

      // Clear flags
      if (pendingPlan) sessionStorage.removeItem('pendingPlan');
      if (scanFromFunnel) sessionStorage.removeItem('scanFromFunnel');

      // Plan-specific routing
      if (pendingPlan) {
        if (pendingPlan === 'one-time-scan') {
          window.location.replace('/UploadScan');
          return;
        }
        window.location.replace(`/Account?upgrade=${pendingPlan}`);
        return;
      }

      // Force to upload if coming from marketing funnel CTA
      if (scanFromFunnel) {
        window.location.replace('/UploadScan');
        return;
      }

      // Check if new or returning user
      try {
        const user = await base44.auth.me();
        const hasUploaded = user?.hasUploadedLease === true;
        if (hasUploaded) {
          window.location.replace('/Dashboard');
        } else {
          window.location.replace('/UploadScan');
        }
      } catch {
        // Fallback: send to upload scan for new users
        window.location.replace('/UploadScan');
      }
    };

    route();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0C3B2E" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Setting up your account...</p>
      </div>
    </div>
  );
}