import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/components/shared/SupabaseClient";
import { Loader2 } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);

  useEffect(() => {
    // Check Supabase session and redirect accordingly
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Authenticated - redirect to dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const nextUrl = urlParams.get('next') || '/dashboard';
        navigate(nextUrl, { replace: true });
      } else {
        // Not authenticated - redirect to login
        navigate('/login', { replace: true });
      }
    }).catch(err => {
      console.error('Session check failed:', err);
      navigate('/login', { replace: true });
    }).finally(() => {
      setChecking(false);
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F6F5' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0C3B2E' }} />
    </div>
  );
}