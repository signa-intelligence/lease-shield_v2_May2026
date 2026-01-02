import React, { useEffect } from "react";
import { createPageUrl } from "@/utils";

export default function reportfull() {
  useEffect(() => {
    const qs = window.location.search || "";
    // Redirect to canonical case-sensitive route
    window.location.replace(createPageUrl("ReportFull") + qs);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center text-sm text-gray-500">Redirecting to report…</div>
    </div>
  );
}