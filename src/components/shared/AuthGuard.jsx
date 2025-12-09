// src/components/shared/AuthGuard.jsx
//
// Simple authentication guard for LeaseShield.
// Uses Base44 built-in auth and does NOT change behaviour
// except redirecting unauthenticated users to the login page.

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

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
          // Redirect to welcome page
          window.location.href = "/welcome";
        }
      } catch (err) {
        console.error("AuthGuard: auth check failed", err);
        if (!cancelled) {
          // Redirect to welcome page
          window.location.href = "/welcome";
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