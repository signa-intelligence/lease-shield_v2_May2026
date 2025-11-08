import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccess() {
  React.useEffect(() => {
    // Close this window and refresh parent
    if (window.opener) {
      window.opener.location.reload();
      window.close();
    } else {
      // If no opener, redirect to account page
      setTimeout(() => {
        window.location.href = '/account';
      }, 2000);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F0FDF4',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '32px',
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
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
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
          Your credits have been added.
        </p>
        <p style={{
          fontSize: '14px',
          color: '#10B981'
        }}>
          This window will close automatically...
        </p>
      </div>
    </div>
  );
}