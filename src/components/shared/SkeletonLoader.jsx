import React from "react";

const SkeletonItem = ({ width = "100%", height = "20px", className = "", colors }) => {
  return (
    <div
      className={`skeleton-shimmer rounded ${className}`}
      style={{
        width,
        height,
        backgroundColor: colors?.borderColor || 'rgba(0,0,0,0.06)'
      }}
    />
  );
};

const SkeletonLoader = ({ variant = "card", count = 3, colors = {} }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "card") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => (
          <div
            key={i}
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: colors.cardBg || '#FFFFFF',
              borderColor: colors.borderColor || 'rgba(0,0,0,0.08)'
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <SkeletonItem width="48px" height="48px" className="rounded-xl" colors={colors} />
              <div className="flex-1 space-y-2">
                <SkeletonItem width="60%" height="16px" colors={colors} />
                <SkeletonItem width="40%" height="12px" colors={colors} />
              </div>
            </div>
            <div className="space-y-2">
              <SkeletonItem width="100%" height="12px" colors={colors} />
              <SkeletonItem width="80%" height="12px" colors={colors} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "stat") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => (
          <div
            key={i}
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: colors.cardBg || '#FFFFFF',
              borderColor: colors.borderColor || 'rgba(0,0,0,0.08)'
            }}
          >
            <SkeletonItem width="50%" height="14px" className="mb-3" colors={colors} />
            <SkeletonItem width="70%" height="32px" className="mb-2" colors={colors} />
            <SkeletonItem width="40%" height="12px" colors={colors} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg border"
            style={{
              backgroundColor: colors.cardBg || '#FFFFFF',
              borderColor: colors.borderColor || 'rgba(0,0,0,0.08)'
            }}
          >
            <SkeletonItem width="40px" height="40px" className="rounded-full" colors={colors} />
            <div className="flex-1 space-y-2">
              <SkeletonItem width="60%" height="14px" colors={colors} />
              <SkeletonItem width="40%" height="12px" colors={colors} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-4 p-3 border-b" style={{ borderColor: colors.borderColor }}>
          {[...Array(4)].map((_, i) => (
            <SkeletonItem key={i} width="100%" height="14px" colors={colors} />
          ))}
        </div>
        {items.map((i) => (
          <div key={i} className="grid grid-cols-4 gap-4 p-3 border-b" style={{ borderColor: colors.borderColor }}>
            {[...Array(4)].map((_, j) => (
              <SkeletonItem key={j} width="100%" height="12px" colors={colors} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;