import React, { useState, useRef } from "react";
import { Trash2, Archive, CheckCircle2 } from "lucide-react";
import { haptic } from "./HapticFeedback";

/**
 * Swipeable Item Component
 * Swipe left to reveal action buttons (delete, archive, etc.)
 */
export default function SwipeableItem({ 
  children, 
  onDelete, 
  onArchive, 
  onComplete,
  deleteLabel = "Delete",
  archiveLabel = "Archive",
  completeLabel = "Complete",
  colors,
  disabled = false
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 200;

  const handleTouchStart = (e) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (disabled || !isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    
    // Only allow left swipe
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, MAX_SWIPE));
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsSwiping(false);
    
    // Snap to open or closed
    if (swipeOffset > SWIPE_THRESHOLD) {
      setSwipeOffset(MAX_SWIPE);
      haptic.light();
    } else {
      setSwipeOffset(0);
    }
  };

  const handleAction = (action) => {
    haptic.medium();
    setSwipeOffset(0);
    if (action) action();
  };

  const actions = [];
  if (onComplete) actions.push({ icon: CheckCircle2, label: completeLabel, color: '#10B981', handler: onComplete });
  if (onArchive) actions.push({ icon: Archive, label: archiveLabel, color: '#F59E0B', handler: onArchive });
  if (onDelete) actions.push({ icon: Trash2, label: deleteLabel, color: '#EF4444', handler: onDelete });

  return (
    <div className="relative overflow-hidden" style={{ touchAction: 'pan-y' }}>
      {/* Action Buttons (Behind) */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2" style={{
        width: `${MAX_SWIPE}px`,
        pointerEvents: swipeOffset > SWIPE_THRESHOLD ? 'auto' : 'none'
      }}>
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => handleAction(action.handler)}
              className="flex-1 h-full flex flex-col items-center justify-center rounded-lg transition-all"
              style={{
                backgroundColor: action.color,
                opacity: swipeOffset > SWIPE_THRESHOLD ? 1 : 0.5,
                transform: `scale(${swipeOffset > SWIPE_THRESHOLD ? 1 : 0.9})`,
                minWidth: '60px'
              }}
            >
              <Icon className="w-5 h-5 text-white mb-1" />
              <span className="text-xs text-white font-semibold">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content (Swipeable) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: colors?.cardBg || '#FFFFFF'
        }}
      >
        {children}
      </div>
    </div>
  );
}