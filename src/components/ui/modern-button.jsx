import React from "react";

/**
 * Modern Button Component with consistent styling
 * Variants: primary, secondary, outline, ghost, danger
 * Sizes: sm, md, lg
 */
export function ModernButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  loading = false
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    position: 'relative',
    overflow: 'hidden'
  };

  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '14px', lineHeight: '20px' },
    md: { padding: '12px 24px', fontSize: '16px', lineHeight: '24px' },
    lg: { padding: '16px 32px', fontSize: '18px', lineHeight: '28px' }
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#0C3B2E',
      color: '#FFFFFF',
      boxShadow: '0 4px 6px rgba(12, 59, 46, 0.2)',
      hover: { backgroundColor: '#0a2f25', transform: 'translateY(-2px)', boxShadow: '0 6px 12px rgba(12, 59, 46, 0.3)' }
    },
    secondary: {
      backgroundColor: '#C7A338',
      color: '#1A1D1F',
      boxShadow: '0 4px 6px rgba(199, 163, 56, 0.2)',
      hover: { backgroundColor: '#B89330', transform: 'translateY(-2px)', boxShadow: '0 6px 12px rgba(199, 163, 56, 0.3)' }
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#0C3B2E',
      border: '2px solid #0C3B2E',
      hover: { backgroundColor: '#0C3B2E', color: '#FFFFFF' }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#0C3B2E',
      hover: { backgroundColor: 'rgba(12, 59, 46, 0.1)' }
    },
    danger: {
      backgroundColor: '#EF4444',
      color: '#FFFFFF',
      boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
      hover: { backgroundColor: '#DC2626', transform: 'translateY(-2px)', boxShadow: '0 6px 12px rgba(239, 68, 68, 0.3)' }
    }
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(isHovered && !disabled && !loading ? variantStyles[variant].hover : {})
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={combinedStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {loading ? (
        <>
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          {children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}