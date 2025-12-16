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
          // Redirect to login with next parameter
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
        }
      } catch (err) {
        console.error("AuthGuard: auth check failed", err);
        if (!cancelled) {
          // Redirect to login with next parameter
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
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