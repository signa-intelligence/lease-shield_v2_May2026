import React from 'react';

const SkeletonLoader = ({ variant = 'card', count = 1, colors }) => {
  const Skeleton = ({ width = '100%', height = '20px', className = '' }) => (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        backgroundColor: colors?.borderColor || '#E5E7EB',
        borderRadius: '8px',
      }}
    />
  );

  const variants = {
    card: (
      <div
        className="p-6 rounded-xl"
        style={{
          backgroundColor: colors?.cardBg || '#FFFFFF',
          borderRadius: '16px',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Skeleton width="48px" height="48px" />
          <div className="flex-1">
            <Skeleton width="60%" height="24px" className="mb-2" />
            <Skeleton width="40%" height="16px" />
          </div>
        </div>
        <Skeleton width="100%" height="60px" className="mb-3" />
        <div className="flex gap-2">
          <Skeleton width="80px" height="32px" />
          <Skeleton width="80px" height="32px" />
        </div>
      </div>
    ),
    stat: (
      <div
        className="p-6 rounded-xl"
        style={{
          backgroundColor: colors?.cardBg || '#FFFFFF',
          borderRadius: '16px',
        }}
      >
        <Skeleton width="60%" height="16px" className="mb-3" />
        <Skeleton width="40%" height="32px" className="mb-2" />
        <Skeleton width="50%" height="12px" />
      </div>
    ),
    list: (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg"
            style={{
              backgroundColor: colors?.cardBg || '#FFFFFF',
              borderRadius: '12px',
            }}
          >
            <div className="flex items-center gap-3">
              <Skeleton width="40px" height="40px" />
              <div className="flex-1">
                <Skeleton width="70%" height="18px" className="mb-2" />
                <Skeleton width="50%" height="14px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
    table: (
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: colors?.cardBg || '#FFFFFF',
          borderRadius: '16px',
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: colors?.borderColor || '#E5E7EB' }}>
          <div className="flex gap-4">
            <Skeleton width="25%" height="16px" />
            <Skeleton width="25%" height="16px" />
            <Skeleton width="25%" height="16px" />
            <Skeleton width="25%" height="16px" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b" style={{ borderColor: colors?.borderColor || '#E5E7EB' }}>
            <div className="flex gap-4">
              <Skeleton width="25%" height="14px" />
              <Skeleton width="25%" height="14px" />
              <Skeleton width="25%" height="14px" />
              <Skeleton width="25%" height="14px" />
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={i < count - 1 ? 'mb-4' : ''}>
          {variants[variant]}
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;