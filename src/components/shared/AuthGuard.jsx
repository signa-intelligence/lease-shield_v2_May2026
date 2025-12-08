import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const AuthGuard = ({ children }) => {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    console.log('🔐 [AUTH_GUARD] Setting up onAuthStateChanged...');
    
    const unsubscribe = base44.auth.onAuthStateChanged((authUser) => {
      console.log('🔐 [AUTH_GUARD] Auth state:', authUser ? `Logged in as ${authUser.email}` : 'Not logged in');
      
      if (authUser) {
        setUser(authUser);
      } else {
        const nextUrl = window.location.pathname + window.location.search + window.location.hash;
        base44.auth.redirectToLogin(nextUrl);
      }
    });

    return () => unsubscribe();
  }, []);

  // Show minimal loader while auth state is being determined
  if (user === undefined) {
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

  return <>{children}</>;
};

export default AuthGuard;