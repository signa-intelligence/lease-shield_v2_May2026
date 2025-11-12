import React, { useState, useRef } from "react";
import { Trash2, Archive, CheckCircle2, X } from "lucide-react";
import { haptic } from "./HapticFeedback";

/**
 * Swipe to Delete Component
 * Swipe left to reveal delete button
 * Swipe right to reveal complete/archive buttons
 */
export default function SwipeToDelete({ 
  children, 
  onDelete, 
  onArchive, 
  onComplete,
  language = 'en',
  colors,
  disabled = false
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const startX = useRef(0);

  const SWIPE_THRESHOLD = 100;
  const DELETE_THRESHOLD = 150;

  const handleTouchStart = (e) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
    setConfirming(false);
  };

  const handleTouchMove = (e) => {
    if (disabled || !isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Allow swipe both ways but limit
    setSwipeOffset(Math.max(-DELETE_THRESHOLD, Math.min(SWIPE_THRESHOLD, diff)));
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsSwiping(false);
    
    // Left swipe (delete)
    if (swipeOffset < -SWIPE_THRESHOLD) {
      setConfirming(true);
      setSwipeOffset(-DELETE_THRESHOLD);
      haptic.medium();
    } 
    // Right swipe (complete/archive)
    else if (swipeOffset > SWIPE_THRESHOLD) {
      setSwipeOffset(SWIPE_THRESHOLD);
      haptic.light();
    } 
    // Snap back
    else {
      setSwipeOffset(0);
    }
  };

  const handleDelete = () => {
    haptic.heavy();
    setSwipeOffset(0);
    setConfirming(false);
    if (onDelete) onDelete();
  };

  const handleComplete = () => {
    haptic.success();
    setSwipeOffset(0);
    if (onComplete) onComplete();
  };

  const handleArchive = () => {
    haptic.medium();
    setSwipeOffset(0);
    if (onArchive) onArchive();
  };

  const handleCancel = () => {
    setSwipeOffset(0);
    setConfirming(false);
  };

  return (
    <div className="relative overflow-hidden" style={{ touchAction: 'pan-y' }}>
      {/* Left Action (Delete) */}
      {onDelete && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-4"
          style={{
            width: `${DELETE_THRESHOLD}px`,
            background: confirming 
              ? 'linear-gradient(to left, #DC2626, #EF4444)'
              : 'linear-gradient(to left, #EF4444, #F87171)',
            opacity: Math.abs(swipeOffset) / DELETE_THRESHOLD,
            pointerEvents: confirming ? 'auto' : 'none'
          }}
        >
          {confirming ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 bg-white/20 rounded-lg backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-white rounded-lg font-bold text-red-600"
              >
                {deleteLabel}
              </button>
            </div>
          ) : (
            <Trash2 className="w-6 h-6 text-white" />
          )}
        </div>
      )}

      {/* Right Actions (Complete/Archive) */}
      {(onComplete || onArchive) && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center gap-2 pl-4"
          style={{
            width: `${SWIPE_THRESHOLD}px`,
            opacity: swipeOffset / SWIPE_THRESHOLD,
            pointerEvents: swipeOffset > SWIPE_THRESHOLD ? 'auto' : 'none'
          }}
        >
          {onComplete && (
            <button
              onClick={handleComplete}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#10B981' }}
            >
              <CheckCircle2 className="w-6 h-6 text-white" />
            </button>
          )}
          {onArchive && (
            <button
              onClick={handleArchive}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#F59E0B' }}
            >
              <Archive className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      )}

      {/* Main Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: colors?.cardBg || '#FFFFFF'
        }}
      >
        {children}
      </div>
    </div>
  );
}