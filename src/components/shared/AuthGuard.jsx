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
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0C3B2E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(199, 163, 56, 0.3)',
          borderTop: '4px solid #C7A338',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  if (!isAuthed) return null;

  return <>{children}</>;
};

export default AuthGuard;