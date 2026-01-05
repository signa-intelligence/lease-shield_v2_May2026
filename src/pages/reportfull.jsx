import React, { useEffect, useRef } from "react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function ReportFullRedirect() {
  const redirectedRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    // CRITICAL: Only redirect ONCE to prevent loops
    if (redirectedRef.current) {
      console.log('[reportfull] Redirect already attempted, blocking repeat');
      return;
    }
    redirectedRef.current = true;

    const qs = window.location.search || "";
    const targetUrl = createPageUrl("ReportFull") + qs;
    
    console.log('[reportfull] One-time redirect to:', targetUrl);
    
    // Use React Router navigate instead of window.location to prevent full reload
    navigate(targetUrl, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center text-sm text-gray-500">Redirecting to report…</div>
    </div>
  );
}