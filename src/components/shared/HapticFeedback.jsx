/**
 * Haptic Feedback Utility
 * Provides tactile feedback on PWA/mobile devices
 */

export const haptic = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },
  
  // Wrapper for buttons
  tap: (intensity = 'light') => {
    if ('vibrate' in navigator) {
      switch(intensity) {
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(20); break;
        case 'heavy': navigator.vibrate(30); break;
        default: navigator.vibrate(10);
      }
    }
  }
};

/**
 * HOC to add haptic feedback to buttons
 */
export const withHaptic = (Component, intensity = 'light') => {
  return (props) => {
    const handleClick = (e) => {
      haptic.tap(intensity);
      if (props.onClick) {
        props.onClick(e);
      }
    };

    return <Component {...props} onClick={handleClick} />;
  };
};