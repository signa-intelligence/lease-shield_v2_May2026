import React, { useState } from "react";
import LazyImage from "./LazyImage";
import { Download, Maximize2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { haptic } from "./HapticFeedback";

/**
 * Smart Image Component
 * Combines lazy loading + preview modal + download
 */
export default function SmartImage({
  src,
  alt = "",
  className = "",
  style = {},
  showActions = true,
  enablePreview = true,
  enableDownload = true,
  colors
}) {
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    haptic.medium();
    
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      haptic.success();
    } catch (error) {
      console.error('Download failed:', error);
      haptic.error();
    }
  };

  return (
    <>
      <div className="relative group" style={{ position: 'relative' }}>
        <LazyImage
          src={src}
          alt={alt}
          className={`${className} ${enablePreview ? 'cursor-pointer' : ''}`}
          style={style}
          onClick={() => {
            if (enablePreview) {
              haptic.light();
              setShowPreview(true);
            }
          }}
        />
        
        {showActions && (
          <div
            className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {enablePreview && (
              <button
                onClick={() => {
                  haptic.light();
                  setShowPreview(true);
                }}
                className="p-2 rounded-lg backdrop-blur-sm"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: '36px',
                  minHeight: '36px'
                }}
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            )}
            {enableDownload && (
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg backdrop-blur-sm"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: '36px',
                  minHeight: '36px'
                }}
              >
                <Download className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {enablePreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent 
            className="max-w-7xl w-[95vw] h-[95vh] max-h-[95vh] p-0"
            style={{ backgroundColor: colors?.cardBg || '#2A2D30' }}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              {enableDownload && (
                <button
                  onClick={handleDownload}
                  className="absolute top-4 right-20 z-10 p-2 rounded-full"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: '44px',
                    minHeight: '44px'
                  }}
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
              )}

              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain"
                style={{ borderRadius: '8px' }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}