import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

/**
 * CookieSync - OAuth bridge for WebView authentication
 * 
 * When OAuth completes in a WebView, it returns here with auth tokens.
 * This page:
 * 1. Receives the OAuth token from URL params or postMessage
 * 2. Ensures cookies are set correctly in the WebView
 * 3. Redirects to the dashboard after successful auth
 */
export default function CookieSync() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('syncing');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        // Check if user is already authenticated
        const user = await base44.auth.me();
        
        if (user) {
          // Successfully authenticated - redirect to dashboard
          setStatus('success');
          
          // Force a full page redirect to ensure WebView context is reset
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        } else {
          // Not authenticated - redirect to login
          setStatus('redirect');
          setTimeout(() => {
            window.location.href = '/welcome';
          }, 1000);
        }
      } catch (err) {
        console.error('CookieSync error:', err);
        setError(err.message);
        setStatus('error');
        
        // Redirect to welcome after error
        setTimeout(() => {
          navigate('/welcome');
        }, 2000);
      }
    }

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #F3F6F5 0%, #E8EDEC 100%)'
    }}>
      <div className="text-center">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
          alt="Lease Shield"
          className="h-16 w-16 mx-auto mb-6 animate-pulse"
        />
        
        {status === 'syncing' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#0C3B2E' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#0C3B2E' }}>
              Signing you in...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your authentication
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#0C3B2E' }}>
              Success!
            </h2>
            <p className="text-gray-600">
              Redirecting to your dashboard...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-600">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-2">
              {error || 'Something went wrong during sign in'}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting back to login...
            </p>
          </>
        )}
        
        {status === 'redirect' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#0C3B2E' }} />
            <p className="text-gray-600">
              Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}