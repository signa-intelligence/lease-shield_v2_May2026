import React from "react";
import { Loader2 } from "lucide-react";
import { haptic } from "./HapticFeedback";

/**
 * Touch-optimized button with proper sizing and haptic feedback
 * Minimum 44x44px touch target for accessibility
 */
export default function TouchOptimizedButton({
  children,
  onClick,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'medium', // small, medium, large
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  hapticIntensity = 'medium', // light, medium, heavy
  className = '',
  style = {}
}) {
  const handleClick = (e) => {
    if (disabled || loading) return;
    
    // Trigger haptic
    if (hapticIntensity === 'light') haptic.light();
    else if (hapticIntensity === 'heavy') haptic.heavy();
    else haptic.medium();
    
    onClick?.(e);
  };

  const variants = {
    primary: {
      bg: '#0C3B2E',
      bgHover: '#0a2f25',
      color: '#FFFFFF',
      border: 'none'
    },
    secondary: {
      bg: '#C7A338',
      bgHover: '#D4B451',
      color: '#1A1D1F',
      border: 'none'
    },
    outline: {
      bg: 'transparent',
      bgHover: '#F3F4F6',
      color: '#0C3B2E',
      border: '2px solid #0C3B2E'
    },
    ghost: {
      bg: 'transparent',
      bgHover: '#F3F4F6',
      color: '#64748b',
      border: 'none'
    },
    danger: {
      bg: '#EF4444',
      bgHover: '#DC2626',
      color: '#FFFFFF',
      border: 'none'
    }
  };

  const sizes = {
    small: { padding: '8px 16px', fontSize: '14px', minHeight: '36px' },
    medium: { padding: '12px 24px', fontSize: '16px', minHeight: '44px' },
    large: { padding: '16px 32px', fontSize: '18px', minHeight: '52px' }
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.medium;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        backgroundColor: currentVariant.bg,
        color: currentVariant.color,
        border: currentVariant.border,
        borderRadius: '12px',
        fontWeight: 'bold',
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        opacity: (disabled || loading) ? 0.6 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        width: fullWidth ? '100%' : 'auto',
        boxShadow: variant === 'primary' || variant === 'secondary' 
          ? '0 4px 6px rgba(0, 0, 0, 0.1)' 
          : 'none',
        ...currentSize,
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.target.style.backgroundColor = currentVariant.bgHover;
          if (variant === 'primary' || variant === 'secondary') {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.target.style.backgroundColor = currentVariant.bg;
          e.target.style.transform = 'translateY(0)';
          if (variant === 'primary' || variant === 'secondary') {
            e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }
        }
      }}
      onTouchStart={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'scale(0.97)';
        }
      }}
      onTouchEnd={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
    </button>
  );
}