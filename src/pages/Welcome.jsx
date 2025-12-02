import React from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const handleRedirect = async () => {
      const queryString = window.location.search;
      
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        
        if (isAuthenticated) {
          navigate(createPageUrl("Dashboard") + queryString, { replace: true });
        } else {
          base44.auth.redirectToLogin(createPageUrl("Dashboard") + queryString);
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Dashboard") + queryString);
      }
    };
    
    handleRedirect();
  }, [navigate]);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#F3F6F5'
    }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0C3B2E' }} />
    </div>
  );
}