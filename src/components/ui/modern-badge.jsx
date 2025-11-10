import React from "react";

/**
 * Modern Badge Component with consistent styling
 * Variants: success, warning, error, info, default
 */
export function ModernBadge({ 
  children, 
  variant = 'default', 
  size = 'md',
  icon,
  className = ''
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '600',
    borderRadius: '8px',
    border: '1px solid',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s'
  };

  const sizeStyles = {
    sm: { padding: '4px 10px', fontSize: '12px', lineHeight: '16px' },
    md: { padding: '6px 14px', fontSize: '13px', lineHeight: '18px' },
    lg: { padding: '8px 18px', fontSize: '14px', lineHeight: '20px' }
  };

  const variantStyles = {
    default: {
      backgroundColor: '#F3F4F6',
      color: '#1F2937',
      borderColor: '#E5E7EB'
    },
    success: {
      backgroundColor: '#ECFDF5',
      color: '#047857',
      borderColor: '#86EFAC'
    },
    warning: {
      backgroundColor: '#FFFBEB',
      color: '#B45309',
      borderColor: '#FCD34D'
    },
    error: {
      backgroundColor: '#FEF2F2',
      color: '#DC2626',
      borderColor: '#FECACA'
    },
    info: {
      backgroundColor: '#EFF6FF',
      color: '#1D4ED8',
      borderColor: '#BFDBFE'
    },
    gold: {
      backgroundColor: '#FFF7ED',
      color: '#C7A338',
      borderColor: '#FED7AA'
    },
    forest: {
      backgroundColor: '#F0FDF4',
      color: '#0C3B2E',
      borderColor: '#86EFAC'
    }
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant]
  };

  return (
    <span className={className} style={combinedStyles}>
      {icon}
      {children}
    </span>
  );
}