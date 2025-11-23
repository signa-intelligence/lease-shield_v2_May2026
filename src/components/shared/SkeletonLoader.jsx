import React from 'react';

function Skeleton({ width = '100%', height = '20px', className = '', isDarkMode }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
}

export default function SkeletonLoader({ variant = 'card', count = 1, isDarkMode = false }) {
  const cardBg = isDarkMode ? '#2A2D30' : '#FFFFFF';
  const borderColor = isDarkMode ? '#374151' : '#E5E7EB';

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="rounded-2xl p-5 border" style={{
            backgroundColor: cardBg,
            borderColor: borderColor,
            opacity: 0.6
          }}>
            <div className="flex items-start gap-3 mb-4">
              <Skeleton width="48px" height="48px" isDarkMode={isDarkMode} />
              <div className="flex-1">
                <Skeleton width="120px" height="16px" isDarkMode={isDarkMode} className="mb-2" />
                <Skeleton width="80px" height="24px" isDarkMode={isDarkMode} />
              </div>
            </div>
            <Skeleton width="100%" height="36px" isDarkMode={isDarkMode} />
          </div>
        );

      case 'stat':
        return (
          <div className="rounded-xl p-4 border" style={{
            backgroundColor: cardBg,
            borderColor: borderColor,
            opacity: 0.6
          }}>
            <Skeleton width="100px" height="14px" isDarkMode={isDarkMode} className="mb-2" />
            <Skeleton width="60px" height="28px" isDarkMode={isDarkMode} className="mb-3" />
            <Skeleton width="100%" height="32px" isDarkMode={isDarkMode} />
          </div>
        );

      case 'list':
        return (
          <div className="rounded-lg p-4 border mb-3" style={{
            backgroundColor: cardBg,
            borderColor: borderColor,
            opacity: 0.6
          }}>
            <div className="flex items-center gap-3">
              <Skeleton width="40px" height="40px" isDarkMode={isDarkMode} />
              <div className="flex-1">
                <Skeleton width="180px" height="16px" isDarkMode={isDarkMode} className="mb-2" />
                <Skeleton width="120px" height="14px" isDarkMode={isDarkMode} />
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: borderColor }}>
            <div className="p-3 border-b" style={{
              backgroundColor: cardBg,
              borderColor: borderColor,
              opacity: 0.6
            }}>
              <Skeleton width="150px" height="16px" isDarkMode={isDarkMode} />
            </div>
            <div className="p-3" style={{ backgroundColor: cardBg, opacity: 0.6 }}>
              <Skeleton width="100%" height="14px" isDarkMode={isDarkMode} className="mb-2" />
              <Skeleton width="80%" height="14px" isDarkMode={isDarkMode} />
            </div>
          </div>
        );

      default:
        return <Skeleton width="100%" height="100px" isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className="content-fade-in">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-4">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}