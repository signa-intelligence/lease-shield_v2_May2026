import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const AuthGuard = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        // Wait for SDK to rehydrate session from storage
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const isAuthenticated = await base44.auth.isAuthenticated();
        
        if (cancelled) return;

        if (isAuthenticated) {
          try {
            const me = await base44.auth.me();
            if (me && me.email) {
              setIsAuthed(true);
              setAuthReady(true);
              return;
            }
          } catch (meErr) {
            console.error("🔒 AuthGuard me() error:", meErr);
          }
        }
        
        setIsAuthed(false);
        setAuthReady(true);
      } catch (err) {
        console.error("🔒 AuthGuard error:", err);
        if (!cancelled) {
          setIsAuthed(false);
          setAuthReady(true);
        }
      }
    }

    initAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // Show branded loader while auth is initializing
  if (!authReady) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#063F2C',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '72px', height: '72px' }}>
              <path d="M12 2L4 5V11C4 16 7 20.5 12 22C17 20.5 20 16 20 11V5L12 2Z" fill="#063F2C" stroke="#C7A338" strokeWidth="2"/>
              <rect x="9" y="11" width="6" height="5" rx="1" fill="#C7A338"/>
              <path d="M10 11V9.5C10 8.67 10.67 8 11.5 8H12.5C13.33 8 14 8.67 14 9.5V11" stroke="#C7A338" strokeWidth="2"/>
            </svg>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(199, 163, 56, 0.3)',
            borderTopColor: '#C7A338',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(0.95); }
          }
        `}</style>
      </div>
    );
  }

  // Show login inline instead of redirecting
  if (isAuthed === false) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#063F2C',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px' }}>
                <path d="M12 2L4 5V11C4 16 7 20.5 12 22C17 20.5 20 16 20 11V5L12 2Z" fill="#0C3B2E" stroke="#C7A338" strokeWidth="2"/>
                <rect x="9" y="11" width="6" height="5" rx="1" fill="#C7A338"/>
                <path d="M10 11V9.5C10 8.67 10.67 8 11.5 8H12.5C13.33 8 14 8.67 14 9.5V11" stroke="#C7A338" strokeWidth="2"/>
              </svg>
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#0C3B2E',
              marginBottom: '8px'
            }}>
              LEASE SHIELD
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#64748b'
            }}>
              Fair. Transparent. Protected.
            </p>
          </div>
          
          <button
            onClick={() => {
              const nextUrl = window.location.pathname + window.location.search + window.location.hash;
              base44.auth.redirectToLogin(nextUrl);
            }}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(12, 59, 46, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 8px rgba(12, 59, 46, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(12, 59, 46, 0.3)';
            }}
          >
            Sign In / Sign Up
          </button>

          <p style={{
            marginTop: '20px',
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center'
          }}>
            Protect your rental rights with AI-powered lease analysis
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;