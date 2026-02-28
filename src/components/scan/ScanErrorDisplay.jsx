import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScanErrorDisplay({ error, language, user, onRetry }) {
  if (!error) return null;

  const isAdmin = user?.role === 'admin' || user?.access_level === 'admin' || user?.access_level === 'super_admin' || user?.access_level === 'va';
  const isDarkMode = user?.theme === 'dark';

  const getMessage = () => {
    if (typeof error === 'string') return error;
    if (typeof error === 'object') {
      if (error.step && error.code) {
        return `[${error.step}][${error.code}] ${error.message}`;
      }
      return error.message || (language === 'th' ? 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองอีกครั้ง' : 'A server error occurred. Please try again.');
    }
    return String(error);
  };

  return (
    <div className="mb-6 p-4 rounded-lg border-2 border-red-200" style={{ backgroundColor: isDarkMode ? '#3A2626' : '#FEF2F2' }}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-600 font-semibold mb-1">{getMessage()}</p>
          {typeof error === 'object' && error.requestId && (
            <p className="text-red-500 text-xs font-mono">Request ID: {error.requestId}</p>
          )}
          {typeof error === 'object' && error.debugLog?.body_preview && isAdmin && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">Debug</summary>
              <pre className="text-[10px] whitespace-pre-wrap text-red-700 opacity-90">{error.debugLog.body_preview}</pre>
            </details>
          )}
          {typeof error === 'object' && error.scanId && (
            <p className="text-red-500 text-xs font-mono">Scan ID: {error.scanId}</p>
          )}
          {typeof error === 'object' && error.retryable && onRetry && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}