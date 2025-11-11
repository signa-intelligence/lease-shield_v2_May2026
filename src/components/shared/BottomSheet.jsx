import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { borderRadius, transitions, shadows } from '@/utils/designSystem';

const BottomSheet = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  colors,
  maxHeight = '85vh'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Bottom Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: colors.cardBg,
          borderTopLeftRadius: borderRadius['3xl'],
          borderTopRightRadius: borderRadius['3xl'],
          boxShadow: shadows['2xl'],
          maxHeight: maxHeight,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
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
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}
        </style>

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            style={{
              width: '40px',
              height: '4px',
              backgroundColor: colors.borderColor,
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: colors.borderColor }}
        >
          <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: colors.bg,
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: transitions.fast,
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.borderColor;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.bg;
            }}
          >
            <X className="w-5 h-5" style={{ color: colors.textPrimary }} />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;