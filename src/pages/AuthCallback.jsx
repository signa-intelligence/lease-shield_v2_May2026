import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/components/shared/SupabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    let timeout;

    const handleCallback = async () => {
      // Wait for Supabase to process the auth callback from URL hash
      await new Promise(resolve => setTimeout(resolve, 800));

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session) {
        console.log('✅ [AuthCallback] Session confirmed, redirecting...');
        // Get the original 'next' param if it exists
        const urlParams = new URLSearchParams(window.location.search);
        const nextUrl = urlParams.get('next') || '/dashboard';
        navigate(nextUrl, { replace: true });
      } else {
        console.warn('⚠️ [AuthCallback] No session found');
        // Set timeout to show error after 3 seconds
        timeout = setTimeout(() => {
          setError(true);
        }, 3000);
      }
    };

    handleCallback();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [navigate]);

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #F3F6F5 0%, #E8EDEC 100%)' }}
      >
        <div 
          className="w-full max-w-md p-8 rounded-2xl shadow-2xl text-center"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#EF4444' }}>
            Login Failed
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't complete your sign-in. Please try again.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full px-6 py-3 rounded-xl font-semibold"
            style={{
              backgroundColor: '#063F2C',
              color: '#FFFFFF',
              border: '2px solid #CFAF6A',
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #F3F6F5 0%, #E8EDEC 100%)' }}
    >
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#0C3B2E' }} />
        <p className="text-lg font-medium" style={{ color: '#0C3B2E' }}>
          Completing sign in...
        </p>
      </div>
    </div>
  );
}