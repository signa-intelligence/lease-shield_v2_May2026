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
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (cancelled) return;

        if (isAuthenticated) {
          const me = await base44.auth.me();
          if (cancelled) return;

          if (me) {
            // Block access if account is deactivated
            if (me.is_active === false) {
              console.warn("AuthGuard: Account deactivated");
              alert("Your account has been deactivated. Please contact support.");
              base44.auth.redirectToLogin();
              return;
            }
            setIsAuthed(true);
          } else {
            base44.auth.redirectToLogin(window.location.pathname + window.location.search);
          }
        } else {
          base44.auth.redirectToLogin(window.location.pathname + window.location.search);
        }
      } catch (err) {
        console.error("AuthGuard: auth check failed", err);
        if (!cancelled) {
          base44.auth.redirectToLogin(window.location.pathname + window.location.search);
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

  // While checking auth, show minimal loading (avoid flicker)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F6F5' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#0C3B2E' }}></div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return <>{children}</>;
};

export default AuthGuard;