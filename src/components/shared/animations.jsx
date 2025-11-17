/**
 * LeaseShield Animation System
 * Centralized animation utilities for consistent micro-interactions
 */

export const ANIMATION_TIMINGS = {
  fast: '90ms',
  normal: '120ms',
  medium: '150ms',
  slow: '180ms'
};

export const ANIMATION_EASINGS = {
  snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

/**
 * Button press animation (mobile-first)
 */
export const buttonPressStyle = {
  transition: `transform ${ANIMATION_TIMINGS.fast} ${ANIMATION_EASINGS.snappy}, opacity ${ANIMATION_TIMINGS.normal} ${ANIMATION_EASINGS.smooth}`,
  cursor: 'pointer',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent'
};

export const applyButtonPress = (element) => {
  if (!element) return;
  element.style.transform = 'scale(0.96)';
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 90);
};

/**
 * Card hover/press animations
 */
export const cardInteractionStyle = {
  transition: `transform ${ANIMATION_TIMINGS.normal} ${ANIMATION_EASINGS.snappy}, box-shadow ${ANIMATION_TIMINGS.normal} ${ANIMATION_EASINGS.smooth}`,
  cursor: 'pointer'
};

/**
 * Page transition wrapper
 */
export const pageTransitionStyle = {
  animation: 'pageEnter 150ms ease-out forwards',
  '@keyframes pageEnter': {
    from: {
      opacity: 0,
      transform: 'translateY(10px)'
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)'
    }
  }
};

/**
 * Modal/Dialog animations
 */
export const modalBackdropStyle = {
  animation: 'fadeIn 120ms ease-out'
};

export const modalContentStyle = {
  animation: 'modalEnter 110ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

/**
 * Toast slide-up animation
 */
export const toastEnterStyle = {
  animation: 'toastSlideUp 140ms ease-out'
};

/**
 * Skeleton shimmer animation
 */
export const skeletonShimmerStyle = {
  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite'
};

/**
 * Success checkmark pop animation
 */
export const checkmarkPopStyle = {
  animation: 'checkPop 150ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

/**
 * Icon pulse animation
 */
export const iconPulseStyle = {
  animation: 'iconPulse 90ms ease-out'
};

/**
 * Global animation keyframes (to be injected into <style>)
 */
export const globalAnimationKeyframes = `
  @keyframes pageEnter {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modalEnter {
    from {
      opacity: 0;
      transform: scale(1.1);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes modalExit {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }

  @keyframes toastSlideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes checkPop {
    0% { transform: scale(0); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  @keyframes iconPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes tabHighlight {
    from {
      transform: scale(1);
      opacity: 0.8;
    }
    to {
      transform: scale(1.05);
      opacity: 1;
    }
  }

  @keyframes cardHoverLift {
    to {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    }
  }

  @keyframes scoreSparkle {
    0%, 100% { opacity: 0; transform: scale(0.8) rotate(0deg); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
  }

  /* Button press - global utility class */
  .btn-press {
    transition: transform 90ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-press:active:not(:disabled) {
    transform: scale(0.96);
  }

  /* Card interaction - global utility class */
  .card-interactive {
    transition: transform 120ms cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 120ms cubic-bezier(0.4, 0, 0.6, 1);
  }

  @media (hover: hover) {
    .card-interactive:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    }
  }

  .card-interactive:active {
    transform: scale(0.98);
  }

  /* Smooth content fade-in */
  .content-fade-in {
    animation: fadeIn 150ms ease-out;
  }

  /* Hover brightness (desktop only) */
  @media (hover: hover) {
    .hover-brightness:hover {
      filter: brightness(1.08);
      transition: filter 120ms ease;
    }
  }

  /* Link underline animation (desktop only) */
  @media (hover: hover) {
    .link-animated {
      position: relative;
      text-decoration: none;
    }

    .link-animated::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background-color: currentColor;
      transition: width 120ms ease;
    }

    .link-animated:hover::after {
      width: 100%;
    }
  }

  /* Remove tap highlight on mobile */
  * {
    -webkit-tap-highlight-color: transparent;
  }
`;

/**
 * Apply page transition to a page wrapper
 */
export const PageTransition = ({ children, className = '' }) => {
  return (
    <div className={`content-fade-in ${className}`}>
      {children}
    </div>
  );
};