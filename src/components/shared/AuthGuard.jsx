import React from "react";
import { base44 } from "@/api/base44Client";
import { Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// LoginPage - vertically centered, mobile-optimized
function LoginPage() {
  const handleSignIn = () => {
    const nextUrl = window.location.pathname + window.location.search + window.location.hash;
    base44.auth.redirectToLogin(nextUrl !== '/login' ? nextUrl : '/dashboard');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: `env(safe-area-inset-top, 20px) env(safe-area-inset-right, 20px) env(safe-area-inset-bottom, 20px) env(safe-area-inset-left, 20px)`,
      background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        padding: '32px 24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/8a29b56f1_LeaseShieldmainlogowobkg.png"
          alt="Lease Shield"
          style={{ height: '50px', margin: '0 auto 16px' }}
        />
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#0C3B2E',
          marginBottom: '8px'
        }}>
          Welcome to Lease Shield
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#64748B',
          lineHeight: '1.5',
          marginBottom: '24px'
        }}>
          Protect your rental rights with AI-powered analysis and legal support
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px',
          backgroundColor: '#F3F6F5',
          borderRadius: '10px',
          marginBottom: '24px'
        }}>
          <Shield className="w-5 h-5" style={{ color: '#0C3B2E', flexShrink: 0 }} />
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0C3B2E' }}>
              Fair. Transparent. Protected.
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Know your rights, protect your deposit
            </div>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          style={{
            width: '100%',
            padding: '14px',
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
          fontSize: '10px',
          color: '#94A3B8',
          marginTop: '16px',
          lineHeight: '1.4'
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

// AuthGuard - protects routes, relies on Base44 SDK persistence
const AuthGuard = ({ children }) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['authGuardUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        console.log('🔐 [AUTH_GUARD] User:', userData?.email);
        return userData;
      } catch (err) {
        console.log('🔐 [AUTH_GUARD] No session');
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (isLoading) {
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

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default AuthGuard;