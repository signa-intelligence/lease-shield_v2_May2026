// src/components/shared/AuthGuard.jsx
//
// Supabase-only authentication guard for LeaseShield.
// Redirects unauthenticated users to /login.

import React, { useEffect, useState } from "react";
import { supabase } from "./SupabaseClient";

const AuthGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        console.log('🔒 [AuthGuard] Session check:', !!session);

        if (session) {
          setIsAuthed(true);
        } else {
          // Redirect to login with next parameter
          const currentPath = window.location.pathname + window.location.search;
          console.log('🔒 [AuthGuard] No session, redirecting to /login');
          window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
        }
      } catch (err) {
        console.error("❌ [AuthGuard] Auth check failed:", err);
        if (!cancelled) {
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

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        console.log('🔒 [AuthGuard] Auth state changed:', !!session);
        setIsAuthed(!!session);
        if (!session) {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
        }
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
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