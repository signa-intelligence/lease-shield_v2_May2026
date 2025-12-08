import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield } from "lucide-react";

// LoginPage component - shown when user is not authenticated
function LoginPage() {
  const handleSignIn = () => {
    const nextUrl = window.location.pathname + window.location.search + window.location.hash;
    base44.auth.redirectToLogin(nextUrl !== '/login' ? nextUrl : '/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        padding: '48px 32px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/8a29b56f1_LeaseShieldmainlogowobkg.png"
            alt="Lease Shield"
            style={{ height: '60px', margin: '0 auto 16px' }}
          />
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#0C3B2E',
            marginBottom: '12px'
          }}>
            Welcome to Lease Shield
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748B',
            lineHeight: '1.6'
          }}>
            Protect your rental rights with AI-powered lease analysis and expert legal support
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            backgroundColor: '#F3F6F5',
            borderRadius: '12px'
          }}>
            <Shield className="w-6 h-6" style={{ color: '#0C3B2E' }} />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0C3B2E' }}>
                Fair. Transparent. Protected.
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Know your rights, protect your deposit
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#0C3B2E',
            color: '#FFFFFF',
            border: '2px solid #C7A338',
            borderRadius: '12px',
            fontSize: '16px',
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
          fontSize: '12px',
          color: '#94A3B8',
          marginTop: '24px'
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

// AuthGuard - protects routes and shows LoginPage if not authenticated
const AuthGuard = ({ children }) => {
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log('🔐 [AUTH_GUARD] Setting up onAuthStateChanged...');
    
    const unsubscribe = base44.auth.onAuthStateChanged((authUser) => {
      console.log('🔐 [AUTH_GUARD] Auth state changed:', authUser ? `Logged in as ${authUser.email}` : 'Not logged in');
      
      if (authUser) {
        setUser(authUser);
        setAuthState('authenticated');
      } else {
        setUser(null);
        setAuthState('unauthenticated');
      }
    });

    return () => {
      console.log('🔐 [AUTH_GUARD] Cleaning up listener');
      unsubscribe();
    };
  }, []);

  // Loading state - show spinner
  if (authState === 'loading') {
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

  // Unauthenticated - show login page
  if (authState === 'unauthenticated') {
    return <LoginPage />;
  }

  // Authenticated - show protected content
  return <>{children}</>;
};

export default AuthGuard;