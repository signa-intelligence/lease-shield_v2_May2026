import React from "react";
import { Plus } from "lucide-react";
import { haptic } from "./HapticFeedback";

/**
 * Floating Action Button (FAB)
 * Primary action button that floats in the bottom-right corner
 */
export default function FloatingActionButton({ 
  icon: Icon = Plus,
  label,
  onClick,
  color = '#C7A338',
  position = 'bottom-right',
  size = 'large',
  showLabel = false,
  disabled = false
}) {
  const handleClick = () => {
    if (disabled) return;
    haptic.medium();
    onClick();
  };

  const positionStyles = {
    'bottom-right': {
      bottom: 'calc(80px + env(safe-area-inset-bottom))',
      right: '20px'
    },
    'bottom-left': {
      bottom: 'calc(80px + env(safe-area-inset-bottom))',
      left: '20px'
    },
    'bottom-center': {
      bottom: 'calc(80px + env(safe-area-inset-bottom))',
      left: '50%',
      transform: 'translateX(-50%)'
    }
  };

  const sizeStyles = {
    small: { width: '48px', height: '48px', iconSize: 'w-5 h-5' },
    medium: { width: '56px', height: '56px', iconSize: 'w-6 h-6' },
    large: { width: '64px', height: '64px', iconSize: 'w-7 h-7' }
  };

  const currentSize = sizeStyles[size] || sizeStyles.large;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      className={`fixed z-40 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        ...positionStyles[position],
        width: showLabel ? 'auto' : currentSize.width,
        height: currentSize.height,
        backgroundColor: color,
        borderRadius: showLabel ? '32px' : '50%',
        border: 'none',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showLabel ? '12px' : '0',
        padding: showLabel ? '0 24px' : '0',
        animation: 'fabEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.transform = showLabel ? 'scale(1.05)' : 'scale(1.1)';
          e.target.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.transform = position === 'bottom-center' ? 'translateX(-50%) scale(1)' : 'scale(1)';
          e.target.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
        }
      }}
      onTouchStart={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = position === 'bottom-center' ? 'translateX(-50%) scale(0.95)' : 'scale(0.95)';
        }
      }}
      onTouchEnd={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = position === 'bottom-center' ? 'translateX(-50%) scale(1)' : 'scale(1)';
        }
      }}
    >
      <style>
        {`
          @keyframes fabEntrance {
            0% {
              opacity: 0;
              transform: scale(0) rotate(-180deg);
            }
            60% {
              transform: scale(1.15) rotate(20deg);
            }
            100% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
          }
        `}
      </style>
      
      <Icon className={`${currentSize.iconSize} text-white`} />
      
      {showLabel && (
        <span className="text-white font-bold text-sm whitespace-nowrap">
          {label}
        </span>
      )}
    </button>
  );
}