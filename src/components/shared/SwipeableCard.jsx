import React, { useState, useRef } from 'react';
import { Trash2, Archive } from 'lucide-react';
import { transitions, borderRadius } from '@/utils/designSystem';

const SwipeableCard = ({ 
  children, 
  onDelete, 
  onArchive,
  deleteLabel = 'Delete',
  archiveLabel = 'Archive',
  swipeThreshold = 100,
  colors
}) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setSwipeX(diff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    if (Math.abs(swipeX) > swipeThreshold) {
      if (swipeX < 0 && onDelete) {
        // Swipe left - delete
        onDelete();
      } else if (swipeX > 0 && onArchive) {
        // Swipe right - archive
        onArchive();
      }
    }

    // Reset position
    setSwipeX(0);
  };

  const showLeftAction = swipeX > 20 && onArchive;
  const showRightAction = swipeX < -20 && onDelete;

  return (
    <div className="relative overflow-hidden" style={{ borderRadius: borderRadius.lg }}>
      {/* Left action (Archive) */}
      {onArchive && (
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center px-6"
          style={{
            backgroundColor: '#10B981',
            width: '100px',
            transform: `translateX(${Math.max(-100, swipeX - 100)}px)`,
            transition: isSwiping ? 'none' : transitions.base,
          }}
        >
          <div className="text-white flex flex-col items-center">
            <Archive className="w-6 h-6 mb-1" />
            <span className="text-xs font-semibold">{archiveLabel}</span>
          </div>
        </div>
      )}

      {/* Right action (Delete) */}
      {onDelete && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center px-6"
          style={{
            backgroundColor: '#EF4444',
            width: '100px',
            transform: `translateX(${Math.min(100, swipeX + 100)}px)`,
            transition: isSwiping ? 'none' : transitions.base,
          }}
        >
          <div className="text-white flex flex-col items-center">
            <Trash2 className="w-6 h-6 mb-1" />
            <span className="text-xs font-semibold">{deleteLabel}</span>
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : `transform ${transitions.base}`,
          backgroundColor: colors.cardBg,
          borderRadius: borderRadius.lg,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;