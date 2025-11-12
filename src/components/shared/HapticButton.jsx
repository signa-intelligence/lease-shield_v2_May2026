import React from "react";
import { haptic } from "./HapticFeedback";

/**
 * Button wrapper with haptic feedback
 * Usage: <HapticButton intensity="medium" onClick={...}>Click me</HapticButton>
 */
export default function HapticButton({ 
  children, 
  onClick, 
  intensity = 'light',
  disabled = false,
  className = '',
  style = {},
  ...props 
}) {
  const handleClick = (e) => {
    if (disabled) return;
    
    haptic.tap(intensity);
    
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
      style={{
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
}