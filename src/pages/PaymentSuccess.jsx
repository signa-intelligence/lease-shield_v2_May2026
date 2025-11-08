import React from "react";

export default function PaymentSuccess() {
  React.useEffect(() => {
    // Wait 1.5 seconds, then close window and refresh parent
    const timer = setTimeout(() => {
      if (window.opener) {
        try {
          window.opener.location.reload();
        } catch (e) {
          console.log('Could not refresh parent window');
        }
        window.close();
      } else {
        // If no opener (opened directly), redirect to account
        window.location.href = '/account';
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F0FDF4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '48px',
        maxWidth: '400px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#10B981',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#064E3B',
          marginBottom: '12px'
        }}>
          Payment Successful!
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#065F46',
          marginBottom: '24px'
        }}>
          Your credits have been added to your account.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: '#D1FAE5',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#065F46',
          fontWeight: '500'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #10B981',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Closing window...
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}