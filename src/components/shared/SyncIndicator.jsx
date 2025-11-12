import React from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useOfflineQueue } from "./OfflineCache";
import { useOnlineStatus } from "./OfflineDetector";
import { Badge } from "@/components/ui/badge";

/**
 * Sync Indicator Component
 * Shows sync status and pending offline changes
 */
export default function SyncIndicator({ language = 'en', colors }) {
  const isOnline = useOnlineStatus();
  const { pendingCount, processQueue } = useOfflineQueue();
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await processQueue();
    } finally {
      setSyncing(false);
    }
  };

  const t = {
    en: {
      online: "Online",
      offline: "Offline",
      syncing: "Syncing...",
      pendingChanges: "pending changes",
      syncNow: "Sync Now",
      allSynced: "All synced"
    },
    th: {
      online: "ออนไลน์",
      offline: "ออฟไลน์",
      syncing: "กำลังซิงค์...",
      pendingChanges: "การเปลี่ยนแปลงที่รอ",
      syncNow: "ซิงค์เลย",
      allSynced: "ซิงค์ทั้งหมดแล้ว"
    }
  };

  const strings = t[language];

  if (!isOnline && pendingCount === 0) {
    // Offline, no pending changes
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
        backgroundColor: colors?.cardBg || '#2A2D30',
        border: '2px solid #EF4444'
      }}>
        <CloudOff className="w-3 h-3 text-red-500" />
        <span className="text-xs font-semibold text-red-500">{strings.offline}</span>
      </div>
    );
  }

  if (!isOnline && pendingCount > 0) {
    // Offline with pending changes
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
        backgroundColor: colors?.cardBg || '#2A2D30',
        border: '2px solid #F59E0B'
      }}>
        <CloudOff className="w-3 h-3 text-amber-500" />
        <span className="text-xs font-semibold text-amber-500">
          {pendingCount} {strings.pendingChanges}
        </span>
      </div>
    );
  }

  if (isOnline && pendingCount > 0) {
    // Online but has pending changes to sync
    return (
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95"
        style={{
          backgroundColor: syncing ? '#9CA3AF' : '#3B82F6',
          border: 'none',
          cursor: syncing ? 'not-allowed' : 'pointer',
          minHeight: '32px'
        }}
      >
        {syncing ? (
          <>
            <RefreshCw className="w-3 h-3 text-white animate-spin" />
            <span className="text-xs font-semibold text-white">{strings.syncing}</span>
          </>
        ) : (
          <>
            <Cloud className="w-3 h-3 text-white" />
            <span className="text-xs font-semibold text-white">
              {strings.syncNow} ({pendingCount})
            </span>
          </>
        )}
      </button>
    );
  }

  // Online and synced
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
      backgroundColor: '#10B98120',
      border: '2px solid #10B981'
    }}>
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      <span className="text-xs font-semibold text-emerald-600">{strings.allSynced}</span>
    </div>
  );
}