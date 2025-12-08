import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

function LoginScreen() {
  useEffect(() => {
    base44.auth.redirectToLogin();
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#063F2C'
    }}>
      <div style={{ textAlign: 'center', color: '#FFFFFF' }}>
        <div style={{ marginBottom: '20px' }}>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/8a29b56f1_LeaseShieldmainlogowobkg.png"
            alt="Lease Shield"
            style={{ height: '80px', margin: '0 auto' }}
          />
        </div>
        <p style={{ fontSize: '16px', opacity: 0.9 }}>Redirecting to login...</p>
      </div>
    </div>
  );
}

export default function RootAuthWrapper({ children }) {
  // user === undefined → still loading auth state
  // user === null → not logged in
  // user !== null → logged in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    console.log('🔐 [ROOT_AUTH] Setting up onAuthStateChanged listener...');
    
    const unsubscribe = base44.auth.onAuthStateChanged((authUser) => {
      console.log('🔐 [ROOT_AUTH] Auth state changed:', authUser ? `Logged in as ${authUser.email}` : 'Not logged in');
      setUser(authUser || null);
    });

    return () => {
      console.log('🔐 [ROOT_AUTH] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // While SDK is rehydrating the session, show a simple lightweight loader
  if (user === undefined) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#063F2C'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
              alt="Lease Shield"
              style={{ 
                height: '80px', 
                width: '80px',
                margin: '0 auto',
                animation: 'spin 2s linear infinite'
              }}
            />
          </div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Not logged in → show login screen
  if (user === null) {
    return <LoginScreen />;
  }

  // Logged in → show the main app
  return <>{children}</>;
}