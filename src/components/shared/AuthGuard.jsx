import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const AuthGuard = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const initAuth = async () => {
      // Listen for auth state changes
      unsubscribe = base44.auth.onAuthStateChanged((user) => {
        if (user) {
          // User is authenticated, allow app to render
          setAuthChecked(true);
        } else {
          // User is not authenticated, redirect to login
          const nextUrl = window.location.pathname + window.location.search + window.location.hash;
          base44.auth.redirectToLogin(nextUrl);
        }
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Don't render until auth is confirmed (prevents flash)
  if (!authChecked) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;