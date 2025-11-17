import React from 'react';

function Skeleton({ width = '100%', height = '20px', className = '', colors }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        backgroundColor: colors?.cardBg || '#E5E7EB',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
}

export default function SkeletonLoader({ variant = 'card', count = 1, colors }) {
  const defaultColors = colors || {
    cardBg: '#E5E7EB',
    borderColor: '#D1D5DB'
  };

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="rounded-2xl p-5 border" style={{
            backgroundColor: defaultColors.cardBg,
            borderColor: defaultColors.borderColor,
            opacity: 0.6
          }}>
            <div className="flex items-start gap-3 mb-4">
              <Skeleton width="48px" height="48px" colors={defaultColors} />
              <div className="flex-1">
                <Skeleton width="120px" height="16px" colors={defaultColors} className="mb-2" />
                <Skeleton width="80px" height="24px" colors={defaultColors} />
              </div>
            </div>
            <Skeleton width="100%" height="36px" colors={defaultColors} />
          </div>
        );

      case 'stat':
        return (
          <div className="rounded-xl p-4 border" style={{
            backgroundColor: defaultColors.cardBg,
            borderColor: defaultColors.borderColor,
            opacity: 0.6
          }}>
            <Skeleton width="100px" height="14px" colors={defaultColors} className="mb-2" />
            <Skeleton width="60px" height="28px" colors={defaultColors} className="mb-3" />
            <Skeleton width="100%" height="32px" colors={defaultColors} />
          </div>
        );

      case 'list':
        return (
          <div className="rounded-lg p-4 border mb-3" style={{
            backgroundColor: defaultColors.cardBg,
            borderColor: defaultColors.borderColor,
            opacity: 0.6
          }}>
            <div className="flex items-center gap-3">
              <Skeleton width="40px" height="40px" colors={defaultColors} />
              <div className="flex-1">
                <Skeleton width="180px" height="16px" colors={defaultColors} className="mb-2" />
                <Skeleton width="120px" height="14px" colors={defaultColors} />
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: defaultColors.borderColor }}>
            <div className="p-3 border-b" style={{
              backgroundColor: defaultColors.cardBg,
              borderColor: defaultColors.borderColor,
              opacity: 0.6
            }}>
              <Skeleton width="150px" height="16px" colors={defaultColors} />
            </div>
            <div className="p-3" style={{ backgroundColor: defaultColors.cardBg, opacity: 0.6 }}>
              <Skeleton width="100%" height="14px" colors={defaultColors} className="mb-2" />
              <Skeleton width="80%" height="14px" colors={defaultColors} />
            </div>
          </div>
        );

      default:
        return <Skeleton width="100%" height="100px" colors={defaultColors} />;
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