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
      borderColor: 'rgba(59, 130, 246, 0.5)',
      iconBg: 'rgba(59,130,246,0.1)',
      iconColor: 'rgba(37, 99, 235, 0.5)',
      titleColor: 'rgba(30, 58, 138, 0.5)',
      metricColor: 'rgba(30, 64, 175, 0.5)',
      buttonBg: 'rgb(59, 130, 246)',
      buttonText: '#FFFFFF',
      accent: 'rgba(59, 130, 246, 0.5)'
    },
    dark: {
      cardBg: '#1E293B',
      borderColor: 'rgba(59, 130, 246, 0.5)',
      iconBg: 'rgba(59,130,246,0.15)',
      iconColor: 'rgba(96, 165, 250, 0.5)',
      titleColor: 'rgba(219, 234, 254, 0.5)',
      metricColor: 'rgba(147, 197, 253, 0.5)',
      buttonBg: 'rgb(59, 130, 246)',
      buttonText: '#FFFFFF',
      accent: 'rgba(59, 130, 246, 0.5)'
    }
  },
  
  deposits: {
    light: {
      cardBg: '#F0FDF4',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: 'rgba(5, 150, 105, 0.5)',
      titleColor: 'rgba(6, 95, 70, 0.5)',
      metricColor: 'rgba(4, 120, 87, 0.5)',
      buttonBg: 'rgb(16, 185, 129)',
      buttonText: '#FFFFFF',
      accent: 'rgba(16, 185, 129, 0.5)'
    },
    dark: {
      cardBg: '#1A2E27',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      iconBg: 'rgba(16,185,129,0.15)',
      iconColor: 'rgba(110, 231, 183, 0.5)',
      titleColor: 'rgba(209, 250, 229, 0.5)',
      metricColor: 'rgba(110, 231, 183, 0.5)',
      buttonBg: 'rgb(16, 185, 129)',
      buttonText: '#FFFFFF',
      accent: 'rgba(16, 185, 129, 0.5)'
    }
  },
  
  rent: {
    light: {
      cardBg: '#FFFBEB',
      borderColor: 'rgba(245, 158, 11, 0.5)',
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: 'rgba(217, 119, 6, 0.5)',
      titleColor: 'rgba(120, 53, 15, 0.5)',
      metricColor: 'rgba(180, 83, 9, 0.5)',
      buttonBg: 'rgba(245, 158, 11, 0.5)',
      buttonText: '#FFFFFF',
      accent: 'rgba(245, 158, 11, 0.5)'
    },
    dark: {
      cardBg: '#2A2416',
      borderColor: 'rgba(245, 158, 11, 0.5)',
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: 'rgba(252, 211, 77, 0.5)',
      titleColor: 'rgba(254, 243, 199, 0.5)',
      metricColor: 'rgba(253, 230, 138, 0.5)',
      buttonBg: 'rgba(245, 158, 11, 0.5)',
      buttonText: '#FFFFFF',
      accent: 'rgba(245, 158, 11, 0.5)'
    }
  },
  
  notifications: {
    light: {
      cardBg: '#F5F3FF',
      borderColor: 'rgba(139, 92, 246, 0.5)',
      iconBg: 'rgba(139,92,246,0.1)',
      iconColor: 'rgba(124, 58, 237, 0.5)',
      titleColor: 'rgba(91, 33, 182, 0.5)',
      metricColor: 'rgba(109, 40, 217, 0.5)',
      buttonBg: 'rgba(139, 92, 246, 0.5)',
      buttonText: '#FFFFFF',
      accent: 'rgba(139, 92, 246, 0.5)'
    },
    dark: {
      cardBg: '#2E1F3A',
      borderColor: 'rgba(139, 92, 246, 0.5)',
      iconBg: 'rgba(139,92,246,0.15)',
      iconColor: 'rgba(196, 181, 253, 0.5)',
      titleColor: 'rgba(237, 233, 254, 0.5)',
      metricColor: 'rgba(221, 214, 254, 0.5)',
      buttonBg: 'rgba(139, 92, 246, 0.5)',
      buttonText: '#FFFFFF',
      accent: 'rgba(139, 92, 246, 0.5)'
    }
  },
  
  cases: {
    light: {
      cardBg: '#FEF2F2',
      borderColor: 'rgba(239, 68, 68, 0.5)',
      iconBg: 'rgba(239,68,68,0.1)',
      iconColor: 'rgba(220, 38, 38, 0.5)',
      titleColor: 'rgba(153, 27, 27, 0.5)',
      metricColor: 'rgba(185, 28, 28, 0.5)',
      buttonBg: 'rgba(239, 68, 68, 0.5)',
      buttonText: '#FFFFFF',
      accent: 'rgba(239, 68, 68, 0.5)'
    },
    dark: {
      cardBg: '#2A1F1F',
      borderColor: 'rgba(239, 68, 68, 0.5)',
      iconBg: 'rgba(239,68,68,0.15)',
      iconColor: 'rgba(252, 165, 165, 0.5)',
      titleColor: 'rgba(254, 226, 226, 0.5)',
      metricColor: 'rgba(254, 202, 202, 0.5)',
      buttonBg: 'rgba(239, 68, 68, 0.5)',
      buttonText: '#FFFFFF',
      accent: 'rgba(239, 68, 68, 0.5)'
    }
  },
  
  maintenance: {
    light: {
      cardBg: '#FFF8E1',
      borderColor: 'rgba(249, 168, 37, 0.5)',
      iconBg: 'rgba(249,168,37,0.1)',
      iconColor: 'rgba(245, 127, 23, 0.5)',
      titleColor: 'rgba(245, 127, 23, 0.5)',
      metricColor: 'rgba(249, 168, 37, 0.5)',
      buttonBg: 'rgb(249, 168, 37)',
      buttonText: '#FFFFFF',
      accent: 'rgba(249, 168, 37, 0.5)'
    },
    dark: {
      cardBg: '#2D2817',
      borderColor: 'rgba(249, 168, 37, 0.5)',
      iconBg: 'rgba(249,168,37,0.15)',
      iconColor: 'rgba(255, 213, 79, 0.5)',
      titleColor: 'rgba(255, 249, 196, 0.5)',
      metricColor: 'rgba(255, 213, 79, 0.5)',
      buttonBg: 'rgb(249, 168, 37)',
      buttonText: '#FFFFFF',
      accent: 'rgba(249, 168, 37, 0.5)'
    }
  },
  
  evidence: {
    light: {
      cardBg: '#F0F9FF',
      borderColor: 'rgba(14, 165, 233, 0.5)',
      iconBg: 'rgba(14,165,233,0.1)',
      iconColor: 'rgba(2, 132, 199, 0.5)',
      titleColor: 'rgba(7, 89, 133, 0.5)',
      metricColor: 'rgba(3, 105, 161, 0.5)',
      buttonBg: 'rgba(14, 165, 233, 0.5)',
      buttonText: '#FFFFFF',
      accent: 'rgba(14, 165, 233, 0.5)'
    },
    dark: {
      cardBg: '#1E293B',
      borderColor: 'rgba(14, 165, 233, 0.5)',
      iconBg: 'rgba(14,165,233,0.15)',
      iconColor: 'rgba(125, 211, 252, 0.5)',
      titleColor: 'rgba(224, 242, 254, 0.5)',
      metricColor: 'rgba(186, 230, 253, 0.5)',
      buttonBg: 'rgba(14, 165, 233, 0.5)',
      buttonText: '#FFFFFF',
      accent: 'rgba(14, 165, 233, 0.5)'
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣ FEATURE COLORS (Simple accent mapping)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FEATURE_COLORS = {
  leases: { accent: 'rgba(59, 130, 246, 0.5)' },
  deposits: { accent: 'rgba(16, 185, 129, 0.5)' },
  rent: { accent: 'rgba(245, 158, 11, 0.5)' },
  notifications: { accent: 'rgba(139, 92, 246, 0.5)' },
  cases: { accent: 'rgba(239, 68, 68, 0.5)' },
  maintenance: { accent: 'rgba(249, 168, 37, 0.5)' },
  evidence: { accent: 'rgba(14, 165, 233, 0.5)' }
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