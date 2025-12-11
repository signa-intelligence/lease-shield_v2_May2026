import React from 'react';

/**
 * ProgressBar - Visual progress indicator
 * @param {number} value - Progress value (0-100)
 * @param {string} color - Progress bar color
 * @param {string} label - Optional label text
 * @param {boolean} showPercentage - Show percentage text
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  color = '#0C3B2E',
  label = '',
  showPercentage = false,
  size = 'md',
  isDarkMode = false,
  animated = true,
  gradient = false
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const heights = {
    sm: '6px',
    md: '10px',
    lg: '14px'
  };

  const height = heights[size] || heights.md;

  const bgColor = isDarkMode ? '#374151' : '#E5E7EB';
  const textColor = isDarkMode ? '#F9FAFB' : '#0F172A';

  const gradientBg = gradient 
    ? `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`
    : color;

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span style={{
              fontSize: '13px',
              fontWeight: '600',
              color: textColor
            }}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span style={{
              fontSize: '13px',
              fontWeight: '700',
              color: color
            }}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div
        style={{
          width: '100%',
          height: height,
          backgroundColor: bgColor,
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: gradientBg,
            borderRadius: '999px',
            transition: animated ? 'width 0.4s ease-out' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {animated && percentage > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 2s infinite',
                transformOrigin: 'left'
              }}
            />
          )}
        </div>
        
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    </div>
  );
}