import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { haptic } from "./HapticFeedback";

/**
 * Offline Detector Component
 * Shows banner when offline and provides offline mode capabilities
 */
export default function OfflineDetector({ language = 'en', colors }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);
      haptic.success();
      
      // Auto-hide "back online" message after 3 seconds
      setTimeout(() => {
        setJustCameOnline(false);
        setShowBanner(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      haptic.error();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show banner initially if offline
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const t = {
    en: {
      offline: "You're Offline",
      offlineDesc: "Some features may be limited. Changes will sync when you're back online.",
      backOnline: "Back Online!",
      backOnlineDesc: "All features restored. Syncing your data...",
      viewOffline: "Viewing cached data"
    },
    th: {
      offline: "คุณออฟไลน์",
      offlineDesc: "ฟีเจอร์บางอย่างอาจถูกจำกัด การเปลี่ยนแปลงจะซิงค์เมื่อคุณกลับมาออนไลน์",
      backOnline: "กลับมาออนไลน์แล้ว!",
      backOnlineDesc: "ฟีเจอร์ทั้งหมดกลับมาแล้ว กำลังซิงค์ข้อมูล...",
      viewOffline: "กำลังดูข้อมูลที่แคชไว้"
    }
  };

  const strings = t[language];

  if (!showBanner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: '500px',
        animation: 'slideInDown 0.3s ease-out'
      }}
    >
      <style>
        {`
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translate(-50%, -20px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }
        `}
      </style>
      
      <div
        className="rounded-xl shadow-2xl p-4"
        style={{
          backgroundColor: justCameOnline 
            ? '#10B981' 
            : (colors?.cardBg || '#2A2D30'),
          border: `2px solid ${justCameOnline ? '#059669' : '#EF4444'}`,
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: justCameOnline ? '#FFFFFF20' : '#EF444420'
            }}
          >
            {justCameOnline ? (
              <Wifi className="w-5 h-5 text-white" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className="font-bold text-sm mb-1"
              style={{
                color: justCameOnline ? '#FFFFFF' : (colors?.textPrimary || '#ECEFED')
              }}
            >
              {justCameOnline ? strings.backOnline : strings.offline}
            </h4>
            <p
              className="text-xs"
              style={{
                color: justCameOnline ? '#FFFFFF90' : (colors?.textSecondary || '#A8ABAD')
              }}
            >
              {justCameOnline ? strings.backOnlineDesc : strings.offlineDesc}
            </p>
          </div>
          {!justCameOnline && (
            <button
              onClick={() => {
                haptic.light();
                window.location.reload();
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ minWidth: '36px', minHeight: '36px' }}
            >
              <RefreshCw className="w-4 h-4" style={{ color: colors?.textSecondary }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to check online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}