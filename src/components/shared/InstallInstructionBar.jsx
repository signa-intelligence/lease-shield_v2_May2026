import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function InstallInstructionBar() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("installBarDismissed")) {
      return;
    }

    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);

    // Check if already installed as PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                         window.navigator.standalone === true;

    if (isStandalone) {
      return; // Already installed, don't show
    }

    if (isIOS && isSafari) {
      setMessage("To install: tap Share → Add to Home Screen");
      setVisible(true);
    } else if (isAndroid && isChrome) {
      setMessage("Install the app: tap Install when prompted");
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("installBarDismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: "#F0FDF4",
      borderBottom: "1px solid #BBF7D0",
      padding: "8px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      fontSize: "13px",
      color: "#166534"
    }}>
      <span>{message}</span>
      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          padding: "4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#166534",
          opacity: 0.7
        }}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}