// src/components/shared/AuthGuard.jsx
//
// Authentication and lifecycle enforcement for LeaseShield.
// Validates user authentication AND account status (active/suspended/deleted).
// Blocks access for non-active users and forces logout.

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle } from "lucide-react";

const AuthGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [denialReason, setDenialReason] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const me = await base44.auth.me();
        if (cancelled) return;

        if (!me) {
          // Not authenticated - redirect to login
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
          return;
        }

        // ✅ CRITICAL: Enforce user lifecycle status
        const userStatus = me.status || 'active'; // Default to active for backward compatibility
        
        console.log('🔐 [AUTH_GUARD] User status check:', {
          email: me.email,
          status: userStatus,
          is_active: me.is_active,
          deleted_at: me.deleted_at,
          suspended_at: me.suspended_at
        });

        // Block access if user is not active
        if (userStatus !== 'active') {
          console.warn('🚫 [AUTH_GUARD] Access denied - user status:', userStatus);
          
          setAccessDenied(true);
          
          if (userStatus === 'deleted') {
            setDenialReason('Account deleted. Contact support if this is an error.');
          } else if (userStatus === 'suspended') {
            setDenialReason(`Account suspended${me.suspension_reason ? ': ' + me.suspension_reason : ''}. Contact support for assistance.`);
          } else {
            setDenialReason('Account deactivated. Contact support.');
          }
          
          // Logout user after 3 seconds
          setTimeout(async () => {
            try {
              await base44.auth.logout();
            } catch (err) {
              console.error('Logout failed:', err);
              // Force reload to clear session
              window.location.href = '/login';
            }
          }, 3000);
          
          return;
        }

        // ✅ Additional check: is_active flag (backward compatibility)
        if (me.is_active === false) {
          console.warn('🚫 [AUTH_GUARD] Access denied - is_active=false');
          setAccessDenied(true);
          setDenialReason('Account deactivated. Contact support.');
          
          setTimeout(async () => {
            try {
              await base44.auth.logout();
            } catch (err) {
              console.error('Logout failed:', err);
              window.location.href = '/login';
            }
          }, 3000);
          
          return;
        }

        // User is authenticated and active
        setIsAuthed(true);

      } catch (err) {
        console.error("❌ [AUTH_GUARD] Auth check failed:", err);
        if (!cancelled) {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F6F5' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#0C3B2E' }}></div>
      </div>
    );
  }

  // Show access denied state
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F3F6F5' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {denialReason}
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to login in 3 seconds...
          </p>
          <div className="mt-6">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 animate-pulse" 
                style={{ width: '100%', animation: 'pulse 3s linear' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return <>{children}</>;
};

export default AuthGuard;