import React from 'react';

/**
 * LoadingSpinner - Consistent loading indicator
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} color - CSS color value
 * @param {boolean} fullScreen - Show as full-screen overlay
 * @param {string} text - Optional loading text
 */
export default function LoadingSpinner({ 
  size = 'md', 
  color = '#0C3B2E',
  fullScreen = false,
  text = '',
  isDarkMode = false
}) {
  const sizes = {
    sm: '20px',
    md: '40px',
    lg: '60px',
    xl: '80px'
  };

  const spinnerSize = sizes[size] || sizes.md;

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `4px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
          borderTop: `4px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {text && (
        <p style={{
          color: isDarkMode ? '#D1D5DB' : '#64748B',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {text}
        </p>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}