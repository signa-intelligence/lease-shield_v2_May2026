/**
 * ⚡ LeaseShield Brand System & Feature Themes
 * Single source of truth for colors, styling, and CTA treatments
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1️⃣ BRAND PALETTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const BRAND = {
  forest: '#063F2C',      // Primary green (2025 refresh)
  forestHover: '#084D38', // Hover state
  gold: '#CFAF6A',        // Accent gold (2025 refresh)
  goldHover: '#D9BC7E',   // Gold hover
  charcoal: '#1A1D1F',    // Dark bg
  stone: '#F8FAFC',       // Light bg (2025 refresh)
  stoneAlt: '#F3F6F5',    // Alt light bg
  white: '#FFFFFF',       // Pure white
  
  // Extended palette for feature accents
  teal: '#047857',
  emerald: '#10B981',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  red: '#DC2626',         // Updated to match danger color
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
      cardBg: '#FFF8E1',
      borderColor: '#F9A825',
      iconBg: 'rgba(249,168,37,0.15)',
      iconColor: '#F57F17',
      titleColor: '#F57F17',
      metricColor: '#F9A825',
      buttonBg: '#F9A825',
      buttonText: '#FFFFFF',
      accent: '#F9A825'
    },
    dark: {
      cardBg: '#2D2817',
      borderColor: '#F9A825',
      iconBg: 'rgba(249,168,37,0.2)',
      iconColor: '#FFD54F',
      titleColor: '#FFF9C4',
      metricColor: '#FFD54F',
      buttonBg: '#F9A825',
      buttonText: '#FFFFFF',
      accent: '#F9A825'
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
  maintenance: { accent: '#F9A825' },
  evidence: { accent: '#0EA5E9' }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4️⃣ CTA BUTTON SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CTA_COLOR = BRAND.forest; // Primary CTA green

export const primaryCtaStyle = {
  backgroundColor: BRAND.forest,
  color: BRAND.white,
  border: 'none',
  borderRadius: '12px',
  padding: '12px 24px',
  fontFamily: 'Inter, -apple-system, sans-serif',
  fontWeight: '600',
  fontSize: '14px',
  minHeight: '48px',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  boxShadow: '0 2px 8px rgba(6, 63, 44, 0.15)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
};

export const primaryCtaHover = {
  backgroundColor: BRAND.forestHover,
  boxShadow: '0 4px 12px rgba(6, 63, 44, 0.25)'
};

export const secondaryCtaStyle = {
  backgroundColor: 'transparent',
  color: BRAND.forest,
  border: `2px solid ${BRAND.forest}`,
  borderRadius: '12px',
  padding: '12px 24px',
  fontFamily: 'Inter, -apple-system, sans-serif',
  fontWeight: '600',
  fontSize: '14px',
  minHeight: '48px',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
};

export const accentCtaStyle = {
  backgroundColor: BRAND.gold,
  color: BRAND.charcoal,
  border: 'none',
  borderRadius: '12px',
  padding: '12px 24px',
  fontFamily: 'Inter, -apple-system, sans-serif',
  fontWeight: '600',
  fontSize: '14px',
  minHeight: '48px',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  boxShadow: '0 2px 8px rgba(207, 175, 106, 0.15)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5️⃣ CARD STYLING SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const cardStyles = {
  light: {
    borderRadius: '16px',
    border: `1px solid rgba(6, 63, 44, 0.08)`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    backgroundColor: BRAND.white,
    padding: '24px'
  },
  dark: {
    borderRadius: '16px',
    border: `1px solid rgba(255, 255, 255, 0.08)`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    backgroundColor: '#1F2937',
    padding: '24px'
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
      cardBg: '#1F2937',
      borderColor: '#374151',
      iconBg: 'rgba(207,175,106,0.2)',
      iconColor: '#D9BC7E',
      titleColor: '#F3F6F5',
      metricColor: '#F3F6F5',
      buttonBg: '#063F2C',
      buttonText: '#FFFFFF',
      accent: '#CFAF6A'
    } : {
      cardBg: '#FFFFFF',
      borderColor: '#E5E7EB',
      iconBg: 'rgba(6,63,44,0.1)',
      iconColor: '#063F2C',
      titleColor: '#1A1D1F',
      metricColor: '#1A1D1F',
      buttonBg: '#063F2C',
      buttonText: '#FFFFFF',
      accent: '#063F2C'
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
    cardBg: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    inputBg: '#374151',
    fieldBg: '#374151',
    hoverBg: '#374151',
    topBarBg: '#1F2937',
    bottomTabBg: '#1F2937'
  } : {
    bg: BRAND.stone,
    cardBg: BRAND.white,
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(6,63,44,0.08)',
    inputBg: BRAND.white,
    fieldBg: '#F8FAFC',
    hoverBg: '#F1F5F9',
    topBarBg: BRAND.white,
    bottomTabBg: BRAND.white
  };
};