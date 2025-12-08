import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const AuthGuard = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        
        if (isAuthenticated) {
          setAuthChecked(true);
        } else {
          const nextUrl = window.location.pathname + window.location.search + window.location.hash;
          base44.auth.redirectToLogin(nextUrl);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        const nextUrl = window.location.pathname + window.location.search + window.location.hash;
        base44.auth.redirectToLogin(nextUrl);
      }
    };

    checkAuth();
  }, []);

  if (!authChecked) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;