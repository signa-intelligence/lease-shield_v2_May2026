import React from 'react';

/**
 * Haptic Feedback Utility
 * Provides tactile feedback on PWA/mobile devices
 */

export const haptic = {
  light: () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch (err) {
      // Silently fail - haptic is optional
    }
  },
  
  medium: () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch (err) {
      // Silently fail
    }
  },
  
  heavy: () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 10, 30]);
      }
    } catch (err) {
      // Silently fail
    }
  },
  
  success: () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    } catch (err) {
      // Silently fail
    }
  },
  
  error: () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
    } catch (err) {
      // Silently fail
    }
  },
  
  // Wrapper for buttons
  tap: (intensity = 'light') => {
    try {
      if ('vibrate' in navigator) {
        switch(intensity) {
          case 'light': navigator.vibrate(10); break;
          case 'medium': navigator.vibrate(20); break;
          case 'heavy': navigator.vibrate(30); break;
          default: navigator.vibrate(10);
        }
      }
    } catch (err) {
      // Silently fail
    }
  }
};

/**
 * HOC to add haptic feedback to buttons
 */
export const withHaptic = (Component, intensity = 'light') => {
  return (props) => {
    const handleClick = (e) => {
      try {
        haptic.tap(intensity);
      } catch (err) {
        // Silently fail
      }
      if (props.onClick) {
        props.onClick(e);
      }
    };

    return <Component {...props} onClick={handleClick} />;
  };
};