// src/components/shared/AuthGuard.jsx
//
// Simple authentication guard for LeaseShield.
// Uses Base44 built-in auth and does NOT change behaviour
// except redirecting unauthenticated users to the login page.

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Expose base44 SDK on window for debugging and WebView access
if (typeof window !== "undefined" && !window.base44) {
  window.base44 = base44;
  console.log("[AuthGuard] attached base44 to window", { methods: Object.keys(base44.auth || {}) });
}

const AuthGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const me = await base44.auth.me();
        if (cancelled) return;

        if (me) {
          setIsAuthed(true);
        } else {
          // Redirect to Base44 login, then back to current app
          const nextUrl = window.location.pathname + window.location.search;
          await base44.auth.redirectToLogin(nextUrl);
        }
      } catch (err) {
        console.error("AuthGuard: auth check failed", err);
        if (!cancelled) {
          const nextUrl = window.location.pathname + window.location.search;
          await base44.auth.redirectToLogin(nextUrl);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // While checking auth, render nothing to avoid flicker
  if (loading) return null;
  if (!isAuthed) return null;

  return <>{children}</>;
};

export default AuthGuard;