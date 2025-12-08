import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield } from "lucide-react";
import { sessionStorage } from "../sessionStorage";

// LoginPage - fullscreen, no scroll, mobile-optimized
function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  // Detect Android WebView
  const ua = navigator.userAgent || "";
  const isAndroidWebView = /Android/i.test(ua) && /wv|Version\/\d+\.\d+ Chrome\/\d+/i.test(ua);

  console.log('[LoginPage] WebView detection:', { ua, isAndroidWebView });

  const handleWebViewLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    console.log('[LoginPage] WebView inline login attempt for:', email);
    
    setSubmitting(true);
    setError('');

    try {
      // Use Base44 auth API for email/password login in WebView
      const { data, error: authError } = await base44.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });
      
      console.log('[LoginPage] signInWithPassword response:', { data, authError });

      if (authError) {
        console.error('[LoginPage] Auth error:', authError);
        setError(authError.message || 'Login failed. Check your email and password.');
        setSubmitting(false);
        return;
      }

      if (data?.user) {
        console.log('[LoginPage] Login success, user:', data.user);
        sessionStorage.save(data.user);
        
        // Verify auth state
        const verifyUser = await base44.auth.me();
        console.log('[LoginPage] Verification auth.me():', verifyUser);
        
        // Force reload to trigger AuthGuard recheck with new cookie
        console.log('[LoginPage] Reloading to / to pick up auth cookie');
        window.location.href = '/';
      } else {
        console.error('[LoginPage] No user in response');
        setError('Login failed - no user returned');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('[LoginPage] WebView login exception:', err);
      setError(err.message || 'Login failed. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSignInDesktop = async () => {
    console.log('[LoginPage] Desktop redirect login');
    const nextUrl = window.location.pathname + window.location.search + window.location.hash;
    
    // Listen for auth state change and update localStorage when login succeeds
    const checkAuthAfterRedirect = setInterval(async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          sessionStorage.save(user);
          clearInterval(checkAuthAfterRedirect);
        }
      } catch (e) {
        // Still waiting for login
      }
    }, 1000);
    
    // Clear after 30 seconds to prevent memory leak
    setTimeout(() => clearInterval(checkAuthAfterRedirect), 30000);
    
    base44.auth.redirectToLogin(nextUrl !== '/login' ? nextUrl : '/dashboard');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      padding: 0,
      margin: 0,
      background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
      boxSizing: 'border-box',
      zIndex: 9999,
      paddingTop: 'env(safe-area-inset-top, 12px)'
    }}>
      <style>{`
        body.login-active {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100vh !important;
        }
        .bottom-tabs, .top-bar {
          display: none !important;
        }
      `}</style>
      <div style={{
        width: '90%',
        maxWidth: '380px',
        backgroundColor: '#FFFFFF',
        borderRadius: '18px',
        padding: '28px 20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/8a29b56f1_LeaseShieldmainlogowobkg.png"
          alt="Lease Shield"
          style={{ height: '48px', margin: '0 auto 14px' }}
        />
        <h1 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#0C3B2E',
          marginBottom: '6px'
        }}>
          Welcome to Lease Shield
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#64748B',
          lineHeight: '1.4',
          marginBottom: '20px'
        }}>
          Protect your rental rights with AI-powered analysis and legal support
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px',
          backgroundColor: '#F3F6F5',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <Shield className="w-5 h-5" style={{ color: '#0C3B2E', flexShrink: 0 }} />
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#0C3B2E' }}>
              Fair. Transparent. Protected.
            </div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>
              Know your rights, protect your deposit
            </div>
          </div>
        </div>

        {isAndroidWebView ? (
          // WebView: Show email/password form for inline login
          <form onSubmit={handleWebViewLogin} style={{ textAlign: 'left' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                opacity: submitting ? 0.6 : 1
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                opacity: submitting ? 0.6 : 1
              }}
            />
            {error && (
              <div style={{
                padding: '10px',
                marginBottom: '12px',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left'
              }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: submitting ? '#9CA3AF' : '#0C3B2E',
                color: '#FFFFFF',
                border: '2px solid #C7A338',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(12, 59, 46, 0.3)',
                transition: 'all 0.2s',
                opacity: submitting ? 0.8 : 1
              }}
            >
              {submitting ? 'Signing In...' : 'Sign In to Continue'}
            </button>
          </form>
        ) : (
          // Desktop/Mobile Browser: Use OAuth redirect flow
          <button
            onClick={handleSignInDesktop}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: '#0C3B2E',
              color: '#FFFFFF',
              border: '2px solid #C7A338',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(12, 59, 46, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 16px rgba(12, 59, 46, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(12, 59, 46, 0.3)';
            }}
          >
            Sign In to Continue
          </button>
        )}

        <p style={{
          fontSize: '9px',
          color: '#94A3B8',
          marginTop: '14px',
          lineHeight: '1.3'
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

const DebugBanner = ({ user }) => {
  let cookiePreview = "(no document)";
  if (typeof document !== "undefined") {
    const c = document.cookie || "";
    cookiePreview = c.length > 120 ? c.slice(0, 120) + "…" : c || "(no cookies)";
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.9)",
        color: "#fff",
        fontSize: 10,
        padding: "4px 8px",
        pointerEvents: "none",
      }}
    >
      <div>
        AuthGuard •{" "}
        {user
          ? `LOGGED IN as ${user.email || user.id || "unknown"}`
          : "NOT LOGGED IN"}
      </div>
      <div>Cookies: {cookiePreview}</div>
    </div>
  );
};

const AuthGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      console.log("[AuthGuard] mount at", window.location.href);
      try {
        const me = await base44.auth.me();
        console.log("[AuthGuard] base44.auth.me() =>", me);
        if (cancelled) return;

        if (me) {
          setUser(me);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("[AuthGuard] auth.me error", err);
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
        if (typeof document !== "undefined") {
          console.log("[AuthGuard] document.cookie =", document.cookie);
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  const renderGuest = () => {
    return (
      <>
        <DebugBanner user={null} />
        <LoginPage />
      </>
    );
  };

  if (!user) {
    return renderGuest();
  }

  return (
    <>
      <DebugBanner user={user} />
      {children}
    </>
  );
};

export default AuthGuard;