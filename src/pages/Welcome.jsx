import React, { useEffect } from "react";

export default function Welcome() {
  useEffect(() => {
    const pendingPlan = sessionStorage.getItem('pendingPlan');

    if (pendingPlan) {
      sessionStorage.removeItem('pendingPlan');

      if (pendingPlan === 'one-time-scan') {
        window.location.replace('/UploadScan');
      } else {
        window.location.replace(`/Account?upgrade=${pendingPlan}`);
      }
    } else {
      window.location.replace('/Dashboard');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0C3B2E" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Setting up your account…</p>
      </div>
    </div>
  );
}