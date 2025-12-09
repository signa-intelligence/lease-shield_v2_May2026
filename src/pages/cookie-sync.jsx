import React, { useEffect } from "react";

const CookieSyncPage = () => {
  useEffect(() => {
    try {
      // Dump current cookies into localStorage for the WebView bridge
      localStorage.setItem("lease_cookie_dump", document.cookie || "");

      // Small delay so storage write completes
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    } catch (err) {
      console.error("CookieSyncPage error", err);
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      Syncing your session…
    </div>
  );
};

export default CookieSyncPage;