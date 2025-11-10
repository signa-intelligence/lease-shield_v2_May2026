import React from "react";

/**
 * Modern Card Component with consistent styling
 * Features: Better shadows, rounded corners, hover effects
 */
export function ModernCard({ 
  children, 
  className = '',
  hover = false,
  isDark = false,
  onClick,
  noPadding = false,
  gradient = false
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyles = {
    backgroundColor: isDark ? '#2A2D30' : '#FFFFFF',
    borderRadius: '16px',
    border: 'none',
    boxShadow: isHovered && hover 
      ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered && hover ? 'translateY(-4px)' : 'translateY(0)',
    cursor: onClick ? 'pointer' : 'default',
    overflow: 'hidden',
    ...(gradient && {
      background: isDark 
        ? 'linear-gradient(135deg, #2A2D30 0%, #1A1D1F 100%)'
        : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)'
    })
  };

  const contentStyles = {
    padding: noPadding ? '0' : '24px'
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div style={contentStyles}>
        {children}
      </div>
    </div>
  );
}

export function ModernCardHeader({ children, isDark = false, className = '' }) {
  const styles = {
    padding: '20px 24px',
    borderBottom: `1px solid ${isDark ? '#3A3D40' : '#E5E7EB'}`,
    backgroundColor: isDark ? '#353A3D' : '#F9FAFB'
  };

  return (
    <div className={className} style={styles}>
      {children}
    </div>
  );
}

export function ModernCardContent({ children, className = '' }) {
  return (
    <div className={className} style={{ padding: '24px' }}>
      {children}
    </div>
  );
}