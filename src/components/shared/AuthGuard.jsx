import React from "react";
import { base44 } from "@/api/base44Client";
import { Shield } from "lucide-react";
import { sessionStorage } from "../sessionStorage";

// LoginPage - fullscreen, no scroll, mobile-optimized
function LoginPage() {
  const handleSignIn = async () => {
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

        <button
          onClick={handleSignIn}
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

// AuthGuard - protects routes with state machine: "loading" | "authed" | "guest"
const AuthGuard = ({ children }) => {
  const [status, setStatus] = React.useState('loading');
  const [debugInfo, setDebugInfo] = React.useState(null);
  
  React.useEffect(() => {
    console.log('🔵 [AUTH_GUARD] ========== MOUNT ==========');
    console.log('🔵 [AUTH_GUARD] Location:', window.location.href);
    console.log('🔵 [AUTH_GUARD] document.cookie:', document.cookie);
    
    let mounted = true;

    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        
        console.log('🔵 [AUTH_GUARD] base44.auth.me() result:', {
          id: userData?.id || 'null',
          email: userData?.email || 'null',
          fullObject: userData
        });
        
        if (!mounted) return;

        if (userData) {
          // User is authenticated
          console.log('✅ [AUTH_GUARD] Status: AUTHED');
          sessionStorage.save(userData);
          setStatus('authed');
          setDebugInfo({ 
            status: 'authed', 
            email: userData.email,
            cookie: document.cookie.substring(0, 20)
          });
        } else {
          // No valid session
          console.log('⚠️ [AUTH_GUARD] Status: GUEST (no user data)');
          sessionStorage.clear();
          setStatus('guest');
          setDebugInfo({ 
            status: 'guest', 
            email: null,
            cookie: document.cookie.substring(0, 20)
          });
        }
      } catch (error) {
        if (!mounted) return;
        
        console.error('❌ [AUTH_GUARD] Status: GUEST (error)', error.message);
        console.error('❌ [AUTH_GUARD] Full error:', error);
        
        // Error checking auth - treat as guest
        sessionStorage.clear();
        setStatus('guest');
        setDebugInfo({ 
          status: 'guest', 
          email: null,
          cookie: document.cookie.substring(0, 20),
          error: error.message
        });
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Debug banner (only in dev or when query param present)
  const showDebug = window.location.hostname === 'localhost' || window.location.search.includes('debug=true');

  // Loading state - render nothing
  if (status === 'loading') {
    return null;
  }

  // Guest state - render welcome/login page
  if (status === 'guest') {
    return (
      <>
        {showDebug && debugInfo && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FF6B6B',
            color: 'white',
            padding: '8px 12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 99999,
            borderBottom: '2px solid #C92A2A'
          }}>
            🔴 Auth: NOT LOGGED IN | Cookie: "{debugInfo.cookie}..." {debugInfo.error && `| Error: ${debugInfo.error}`}
          </div>
        )}
        <LoginPage />
      </>
    );
  }

  // Authed state - render protected content
  return (
    <>
      {showDebug && debugInfo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#51CF66',
          color: '#1A1A1A',
          padding: '8px 12px',
          fontSize: '11px',
          fontFamily: 'monospace',
          zIndex: 99999,
          borderBottom: '2px solid #37B24D'
        }}>
          ✅ Auth: LOGGED IN as {debugInfo.email} | Cookie: "{debugInfo.cookie}..."
        </div>
      )}
      {children}
    </>
  );
};

export default AuthGuard;