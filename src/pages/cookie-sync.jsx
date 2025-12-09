import React, { useEffect } from "react";

const CookieSyncPage = () => {
  useEffect(() => {
    try {
      const all = document.cookie.split("; ");
      let auth = "";

      for (const c of all) {
        if (c.startsWith("base44_app_session=")) {
          auth = c;
          break;
        }
      }

      if (auth) {
        localStorage.setItem("lease_auth_token", auth);
      } else {
        localStorage.setItem("lease_auth_token", "");
      }

      setTimeout(() => {
        window.location.href = "/";
      }, 300);

    } catch (err) {
      console.error("CookieSync error", err);
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