import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { haptic } from "./HapticFeedback";

/**
 * Mobile-optimized Bottom Sheet Component
 * Slides up from bottom with smooth animations and drag-to-dismiss
 */
export default function BottomSheet({ 
  open, 
  onClose, 
  title, 
  children, 
  colors,
  height = 'auto',
  maxHeight = '90vh',
  showHandle = true,
  closeOnBackdrop = true
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      haptic.light();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY;
    
    // Only allow dragging down
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // If dragged more than 100px, close the sheet
    if (currentY > 100) {
      haptic.medium();
      onClose();
    } else {
      haptic.light();
    }
    
    setCurrentY(0);
  };

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      haptic.light();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 0.2s ease-out',
          backdropFilter: 'blur(4px)'
        }}
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 z-50"
        style={{
          backgroundColor: colors.cardBg,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
          transform: `translateY(${currentY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          height: height,
          maxHeight: maxHeight,
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)'
        }}
      >
        <style>
          {`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}
        </style>

        {/* Drag Handle */}
        {showHandle && (
          <div
            className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: colors.borderColor,
                borderRadius: '2px',
                opacity: 0.5
              }}
            />
          </div>
        )}

        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-6 pb-4"
            style={{
              borderBottom: `1px solid ${colors.borderColor}`
            }}
          >
            <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              {title}
            </h3>
            <button
              onClick={() => {
                haptic.light();
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}