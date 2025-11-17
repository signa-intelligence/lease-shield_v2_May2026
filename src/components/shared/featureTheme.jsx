/**
 * ⚡ LeaseShield Brand System & Feature Themes
 * Single source of truth for colors, styling, and CTA treatments
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1️⃣ BRAND PALETTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const BRAND = {
  forest: '#0C3B2E',      // Primary green
  gold: '#C7A338',        // Accent gold
  charcoal: '#1A1D1F',    // Dark bg
  stone: '#F3F6F5',       // Light bg
  stoneAlt: '#ECEFED',    // Alt light bg
  white: '#FFFFFF',       // Pure white
  
  // Extended palette for feature accents
  teal: '#047857',
  emerald: '#10B981',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  red: '#EF4444',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣ FEATURE CARD THEMES (Deposits, Rent, Cases, etc.)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FEATURE_THEMES = {
  leases: {
    light: {
      cardBg: '#F0F9FF',
      borderColor: '#3B82F6',
      iconBg: 'rgba(59,130,246,0.15)',
      iconColor: '#2563EB',
      titleColor: '#1E3A8A',
      metricColor: '#1E40AF',
      buttonBg: '#3B82F6',
      buttonText: '#FFFFFF',
      accent: '#3B82F6'
    },
    dark: {
      cardBg: '#1E293B',
      borderColor: '#3B82F6',
      iconBg: 'rgba(59,130,246,0.2)',
      iconColor: '#60A5FA',
      titleColor: '#DBEAFE',
      metricColor: '#93C5FD',
      buttonBg: '#3B82F6',
      buttonText: '#FFFFFF',
      accent: '#3B82F6'
    }
  },
  
  deposits: {
    light: {
      cardBg: '#F0FDF4',
      borderColor: '#10B981',
      iconBg: 'rgba(16,185,129,0.15)',
      iconColor: '#059669',
      titleColor: '#065F46',
      metricColor: '#047857',
      buttonBg: '#10B981',
      buttonText: '#FFFFFF',
      accent: '#10B981'
    },
    dark: {
      cardBg: '#1A2E27',
      borderColor: '#10B981',
      iconBg: 'rgba(16,185,129,0.2)',
      iconColor: '#6EE7B7',
      titleColor: '#D1FAE5',
      metricColor: '#6EE7B7',
      buttonBg: '#10B981',
      buttonText: '#FFFFFF',
      accent: '#10B981'
    }
  },
  
  rent: {
    light: {
      cardBg: '#FFFBEB',
      borderColor: '#F59E0B',
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: '#D97706',
      titleColor: '#78350F',
      metricColor: '#B45309',
      buttonBg: '#F59E0B',
      buttonText: '#FFFFFF',
      accent: '#F59E0B'
    },
    dark: {
      cardBg: '#2A2416',
      borderColor: '#F59E0B',
      iconBg: 'rgba(245,158,11,0.2)',
      iconColor: '#FCD34D',
      titleColor: '#FEF3C7',
      metricColor: '#FDE68A',
      buttonBg: '#F59E0B',
      buttonText: '#FFFFFF',
      accent: '#F59E0B'
    }
  },
  
  notifications: {
    light: {
      cardBg: '#F5F3FF',
      borderColor: '#8B5CF6',
      iconBg: 'rgba(139,92,246,0.15)',
      iconColor: '#7C3AED',
      titleColor: '#5B21B6',
      metricColor: '#6D28D9',
      buttonBg: '#8B5CF6',
      buttonText: '#FFFFFF',
      accent: '#8B5CF6'
    },
    dark: {
      cardBg: '#2E1F3A',
      borderColor: '#8B5CF6',
      iconBg: 'rgba(139,92,246,0.2)',
      iconColor: '#C4B5FD',
      titleColor: '#EDE9FE',
      metricColor: '#DDD6FE',
      buttonBg: '#8B5CF6',
      buttonText: '#FFFFFF',
      accent: '#8B5CF6'
    }
  },
  
  cases: {
    light: {
      cardBg: '#FEF2F2',
      borderColor: '#EF4444',
      iconBg: 'rgba(239,68,68,0.15)',
      iconColor: '#DC2626',
      titleColor: '#991B1B',
      metricColor: '#B91C1C',
      buttonBg: '#EF4444',
      buttonText: '#FFFFFF',
      accent: '#EF4444'
    },
    dark: {
      cardBg: '#2A1F1F',
      borderColor: '#EF4444',
      iconBg: 'rgba(239,68,68,0.2)',
      iconColor: '#FCA5A5',
      titleColor: '#FEE2E2',
      metricColor: '#FECACA',
      buttonBg: '#EF4444',
      buttonText: '#FFFFFF',
      accent: '#EF4444'
    }
  },
  
  maintenance: {
    light: {
      cardBg: '#FFFBEB',
      borderColor: '#F59E0B',
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: '#D97706',
      titleColor: '#78350F',
      metricColor: '#B45309',
      buttonBg: '#F59E0B',
      buttonText: '#FFFFFF',
      accent: '#F59E0B'
    },
    dark: {
      cardBg: '#2A2416',
      borderColor: '#F59E0B',
      iconBg: 'rgba(245,158,11,0.2)',
      iconColor: '#FCD34D',
      titleColor: '#FEF3C7',
      metricColor: '#FDE68A',
      buttonBg: '#F59E0B',
      buttonText: '#FFFFFF',
      accent: '#F59E0B'
    }
  },
  
  evidence: {
    light: {
      cardBg: '#F0F9FF',
      borderColor: '#0EA5E9',
      iconBg: 'rgba(14,165,233,0.15)',
      iconColor: '#0284C7',
      titleColor: '#075985',
      metricColor: '#0369A1',
      buttonBg: '#0EA5E9',
      buttonText: '#FFFFFF',
      accent: '#0EA5E9'
    },
    dark: {
      cardBg: '#1E293B',
      borderColor: '#0EA5E9',
      iconBg: 'rgba(14,165,233,0.2)',
      iconColor: '#7DD3FC',
      titleColor: '#E0F2FE',
      metricColor: '#BAE6FD',
      buttonBg: '#0EA5E9',
      buttonText: '#FFFFFF',
      accent: '#0EA5E9'
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣ FEATURE COLORS (Simple accent mapping)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FEATURE_COLORS = {
  leases: { accent: '#3B82F6' },
  deposits: { accent: '#10B981' },
  rent: { accent: '#F59E0B' },
  notifications: { accent: '#8B5CF6' },
  cases: { accent: '#EF4444' },
  maintenance: { accent: '#F59E0B' },
  evidence: { accent: '#0EA5E9' }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4️⃣ CTA BUTTON SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CTA_COLOR = BRAND.forest; // Primary CTA green
export const CTA_COLOR_DISABLED = '#9CA3AF'; // Disabled state

export const primaryCtaStyle = {
  backgroundColor: BRAND.forest,
  color: BRAND.white,
  border: `2px solid ${BRAND.gold}`,
  borderRadius: '10px',
  padding: '10px 18px',
  fontWeight: '700',
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 12px rgba(12, 59, 46, 0.25)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
};

export const primaryCtaHover = {
  transform: 'translateY(-1px)',
  boxShadow: '0 8px 16px rgba(12, 59, 46, 0.35)'
};

export const secondaryCtaStyle = {
  backgroundColor: 'transparent',
  color: BRAND.forest,
  border: `2px solid ${BRAND.forest}`,
  borderRadius: '10px',
  padding: '10px 18px',
  fontWeight: '600',
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5️⃣ CARD STYLING SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const cardStyles = {
  light: {
    borderRadius: '14px',
    border: `1px solid rgba(12, 59, 46, 0.08)`,
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
    backgroundColor: BRAND.white
  },
  dark: {
    borderRadius: '14px',
    border: `1px solid rgba(255, 255, 255, 0.08)`,
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
    backgroundColor: '#2A2D30'
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6️⃣ UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get feature card styling for a specific feature and mode
 */
export const getFeatureCardStyles = (feature, isDark = false) => {
  const theme = FEATURE_THEMES[feature];
  if (!theme) {
    // Fallback to default neutral theme
    return isDark ? {
      cardBg: '#2A2D30',
      borderColor: '#3A3D40',
      iconBg: 'rgba(199,163,56,0.2)',
      iconColor: '#C7A338',
      titleColor: '#ECEFED',
      metricColor: '#ECEFED',
      buttonBg: '#0C3B2E',
      buttonText: '#FFFFFF',
      accent: '#C7A338'
    } : {
      cardBg: '#FFFFFF',
      borderColor: '#E5E7EB',
      iconBg: 'rgba(12,59,46,0.1)',
      iconColor: '#0C3B2E',
      titleColor: '#1A1D1F',
      metricColor: '#1A1D1F',
      buttonBg: '#0C3B2E',
      buttonText: '#FFFFFF',
      accent: '#0C3B2E'
    };
  }
  
  return isDark ? theme.dark : theme.light;
};

/**
 * Get feature accent color
 */
export const getFeatureAccent = (feature) => {
  return FEATURE_COLORS[feature]?.accent || BRAND.gold;
};

/**
 * Get global color palette based on theme
 */
export const getGlobalColors = (isDark = false) => {
  return isDark ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    inputBg: '#374151',
    fieldBg: '#374151',
    hoverBg: '#3A3D40',
    topBarBg: '#1F2937',
    bottomTabBg: '#1F2937'
  } : {
    bg: BRAND.stone,
    cardBg: BRAND.white,
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    inputBg: BRAND.white,
    fieldBg: '#F8FAFC',
    hoverBg: '#F1F5F9',
    topBarBg: BRAND.white,
    bottomTabBg: BRAND.white
  };
};