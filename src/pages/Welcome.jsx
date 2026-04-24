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

      // Always go to dashboard after login
      window.location.replace('/Dashboard');
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