import React, { useState } from "react";
import { Database, Trash2, RefreshCw, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearAllCaches, getCacheSize } from "../shared/OfflineCache";
import { haptic } from "../shared/HapticFeedback";

/**
 * Cache Manager Component
 * Allows users to manage offline cache
 */
export default function CacheManager({ language = 'en', colors, onClear }) {
  const [cacheSize, setCacheSize] = useState(getCacheSize());
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    if (!confirm(language === 'th' 
      ? 'ลบข้อมูลแคชทั้งหมด? คุณจะต้องเชื่อมต่ออินเทอร์เน็ตเพื่อโหลดข้อมูลใหม่'
      : 'Clear all cached data? You\'ll need to be online to reload data.')) {
      return;
    }

    haptic.heavy();
    setClearing(true);
    
    try {
      clearAllCaches();
      setCacheSize(0);
      
      if (onClear) onClear();
      
      haptic.success();
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      haptic.error();
    } finally {
      setClearing(false);
    }
  };

  const handleRefreshSize = () => {
    haptic.light();
    setCacheSize(getCacheSize());
  };

  const t = {
    en: {
      title: "Storage & Cache",
      cacheSize: "Cache Size",
      clearCache: "Clear All Cache",
      clearing: "Clearing...",
      refresh: "Refresh",
      offlineAccess: "Offline Access Enabled",
      cacheDesc: "Cached data allows offline viewing"
    },
    th: {
      title: "พื้นที่เก็บข้อมูลและแคช",
      cacheSize: "ขนาดแคช",
      clearCache: "ลบแคชทั้งหมด",
      clearing: "กำลังลบ...",
      refresh: "รีเฟรช",
      offlineAccess: "เปิดใช้งานการเข้าถึงออฟไลน์",
      cacheDesc: "ข้อมูลที่แคชช่วยให้ดูได้แบบออฟไลน์"
    }
  };

  const strings = t[language];

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Database className="w-5 h-5 text-ls-forest" />
          {strings.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg" style={{
          backgroundColor: colors.fieldBg || '#353A3D'
        }}>
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-semibold" style={{ color: colors.textPrimary }}>
                {strings.cacheSize}
              </p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {cacheSize} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshSize}
            style={{ minHeight: '44px' }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 rounded-lg" style={{
          backgroundColor: colors.fieldBg || '#353A3D',
          border: '2px solid #10B981'
        }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                {strings.offlineAccess}
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {strings.cacheDesc}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleClearCache}
          disabled={clearing}
          className="w-full text-red-600 hover:text-red-700 border-red-200"
          style={{ minHeight: '44px' }}
        >
          {clearing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {strings.clearing}
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              {strings.clearCache}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}