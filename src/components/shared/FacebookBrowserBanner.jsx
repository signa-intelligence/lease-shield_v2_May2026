import React, { useState } from "react";

export function useIsFacebookBrowser() {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV/i.test(navigator.userAgent);
}

export default function FacebookBrowserBanner() {
  const isFB = useIsFacebookBrowser();
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isFB || dismissed) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div style={{
      background: "#FFF3E0",
      border: "2px solid #FF9800",
      padding: "12px 16px",
      textAlign: "center",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
    }}>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          position: "absolute",
          top: "8px",
          right: "12px",
          background: "none",
          border: "none",
          fontSize: "18px",
          color: "#E65100",
          cursor: "pointer",
          padding: "4px",
          lineHeight: 1
        }}
      >
        ✕
      </button>
      <div style={{ fontSize: "14px", color: "#E65100", marginBottom: "8px", fontWeight: 600 }}>
        ⚠️ For the best experience, please open in your browser
      </div>
      <p style={{ fontSize: "12px", color: "#BF360C", margin: "0 0 10px 0" }}>
        Facebook's browser may not support login. Copy the link and paste in Chrome, Safari, or Firefox.
      </p>
      <button
        onClick={handleCopy}
        style={{
          background: "#0C3B2E",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          minHeight: "44px"
        }}
      >
        {copied ? "✅ Link Copied!" : "📋 Copy Link to Open in Browser"}
      </button>
    </div>
  );
}