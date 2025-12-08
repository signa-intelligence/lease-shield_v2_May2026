import React from "react";
import { base44 } from "@/api/base44Client";
import { Shield } from "lucide-react";
import { sessionStorage } from "@/utils/sessionStorage";

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
        maxWidth: '90%',
        width: '100%',
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

// AuthGuard - protects routes with manual persistent session layer
const AuthGuard = ({ children }) => {
  const [authState, setAuthState] = React.useState(() => {
    // Stage 1: Check localStorage immediately on mount
    const persistedSession = sessionStorage.get();
    if (persistedSession && persistedSession.isAuthenticated && sessionStorage.isValid()) {
      console.log('🚀 [AUTH_GUARD] Found valid persisted session, provisionally authenticated');
      return { loading: true, user: { provisional: true }, skipLoginFlash: true };
    }
    console.log('🔍 [AUTH_GUARD] No persisted session, will check SDK');
    return { loading: true, user: null, skipLoginFlash: false };
  });

  React.useEffect(() => {
    console.log('🔐 [AUTH_GUARD] Validating session with Base44 SDK...');
    
    let mounted = true;

    const validateAuth = async () => {
      try {
        // Stage 2: Validate with SDK
        const userData = await base44.auth.me();
        
        if (!mounted) return;

        if (userData) {
          console.log('✅ [AUTH_GUARD] SDK confirmed session:', {
            email: userData.email,
            plan: userData.plan_tier
          });
          
          // Update localStorage with fresh session
          sessionStorage.save(userData);
          
          setAuthState({ loading: false, user: userData, skipLoginFlash: false });
        } else {
          console.log('⚠️ [AUTH_GUARD] SDK reports no valid session');
          
          // Clear localStorage - this is a true logout
          sessionStorage.clear();
          
          setAuthState({ loading: false, user: null, skipLoginFlash: false });
        }
      } catch (error) {
        if (!mounted) return;
        
        console.error('❌ [AUTH_GUARD] SDK validation error:', error.message);
        
        // Clear localStorage on error
        sessionStorage.clear();
        
        setAuthState({ loading: false, user: null, skipLoginFlash: false });
      }
    };

    validateAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Show loading while SDK validates (but only if we don't have a provisional session)
  if (authState.loading && !authState.skipLoginFlash) {
    console.log('⏳ [AUTH_GUARD] SDK validation in progress...');
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#063F2C'
      }}>
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
          alt="Lease Shield"
          style={{ 
            height: '80px', 
            width: '80px',
            animation: 'spin 2s linear infinite'
          }}
        />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If we have a provisional session, render content immediately while SDK validates
  if (authState.loading && authState.skipLoginFlash) {
    console.log('🎯 [AUTH_GUARD] Rendering protected content with provisional session...');
    return <>{children}</>;
  }

  // Final decision: show login only if SDK confirmed no user
  if (!authState.user) {
    console.log('🔓 [AUTH_GUARD] No authenticated user, showing login page');
    return <LoginPage />;
  }

  console.log('🔒 [AUTH_GUARD] User authenticated, rendering protected content');
  return <>{children}</>;
};

export default AuthGuard;