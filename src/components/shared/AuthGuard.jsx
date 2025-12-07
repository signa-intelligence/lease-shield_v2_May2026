// LeaseShield Auth Guard
// CRITICAL: Enforces authentication on ALL app routes
// Unauthenticated users are IMMEDIATELY redirected to login
// NO content is rendered until authentication is verified

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const AuthGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        // CRITICAL: Verify authentication status
        const isAuthenticated = await base44.auth.isAuthenticated();
        
        if (cancelled) return;

        if (isAuthenticated) {
          // Verify we can actually get user data
          const me = await base44.auth.me();
          if (me && me.email) {
            setIsAuthed(true);
            setLoading(false);
            return;
          }
        }
        
        // NOT authenticated - redirect immediately
        if (!cancelled) {
          const nextUrl = window.location.pathname + window.location.search + window.location.hash;
          base44.auth.redirectToLogin(nextUrl);
        }
      } catch (err) {
        console.error("🔒 AuthGuard: Authentication check failed", err);
        
        // On ANY error, redirect to login for security
        if (!cancelled) {
          const nextUrl = window.location.pathname + window.location.search + window.location.hash;
          base44.auth.redirectToLogin(nextUrl);
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // CRITICAL: Render NOTHING until auth is verified
  // This prevents ANY protected content from flashing
  if (loading) {
    return null;
  }
  
  if (!isAuthed) return null;

  return <>{children}</>;
};

export default AuthGuard;