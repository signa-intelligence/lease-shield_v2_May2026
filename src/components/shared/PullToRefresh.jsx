import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

const PullToRefresh = ({ onRefresh, children, isDarkMode }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const startY = useRef(0);
  const containerRef = useRef(null);
  const threshold = 80;
  const IDLE_THRESHOLD = 10 * 60 * 1000; // 10 minutes
  const REFRESH_COOLDOWN = 5000; // 5 seconds

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === 0 || containerRef.current?.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      const now = Date.now();
      const timeSinceLastRefresh = lastRefreshTime ? now - lastRefreshTime : Infinity;
      const timeSinceActive = now - lastActiveTime;
      
      // Only show success toast if user manually pulled AND (no recent refresh OR was idle 10+ mins)
      const shouldShowToast = timeSinceLastRefresh > REFRESH_COOLDOWN || timeSinceActive > IDLE_THRESHOLD;
      
      setIsRefreshing(true);
      setLastRefreshTime(now);
      setLastActiveTime(now);
      
      try {
        await onRefresh(shouldShowToast);
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    startY.current = 0;
  };

  // Track user activity
  React.useEffect(() => {
    const updateActivity = () => setLastActiveTime(Date.now());
    
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    
    return () => {
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  const rotation = (pullDistance / threshold) * 360;
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Pull indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${pullDistance > 0 ? pullDistance - 40 : -40}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
          zIndex: 10,
          opacity: opacity,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <RefreshCw
            className="w-5 h-5"
            style={{
              color: isRefreshing ? '#10B981' : '#64748B',
              transform: `rotate(${isRefreshing ? 0 : rotation}deg)`,
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {children}
    </div>
  );
};

export default PullToRefresh;