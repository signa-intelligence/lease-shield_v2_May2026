// Master theme configuration for LeaseShield features

export const CTA_COLOR = "#0C3B2E";
export const CTA_COLOR_DISABLED = "#9CA3AF";

// Type definition for feature card theme
export const FEATURE_THEMES = {
  leases: {
    // Active Leases – blue
    light: {
      cardBg: "#EFF6FF",
      borderColor: "#3B82F6",
      iconBg: "#3B82F6",
      iconColor: "#FFFFFF",
      titleColor: "#1E3A8A",
      metricColor: "#1E40AF",
      buttonBg: "#3B82F6",
      buttonText: "#FFFFFF",
    },
    dark: {
      cardBg: "#1E293B",
      borderColor: "#60A5FA",
      iconBg: "#2563EB",
      iconColor: "#FFFFFF",
      titleColor: "#DBEAFE",
      metricColor: "#BFDBFE",
      buttonBg: "#3B82F6",
      buttonText: "#FFFFFF",
    },
  },
  rent: {
    // Rent Tracked – sky blue (lighter blue family)
    light: {
      cardBg: "#E0F2FE",
      borderColor: "#0EA5E9",
      iconBg: "#0EA5E9",
      iconColor: "#FFFFFF",
      titleColor: "#075985",
      metricColor: "#0C4A6E",
      buttonBg: "#0EA5E9",
      buttonText: "#FFFFFF",
    },
    dark: {
      cardBg: "#0C2339",
      borderColor: "#38BDF8",
      iconBg: "#0284C7",
      iconColor: "#FFFFFF",
      titleColor: "#BAE6FD",
      metricColor: "#7DD3FC",
      buttonBg: "#0EA5E9",
      buttonText: "#FFFFFF",
    },
  },
  notifications: {
    // Notifications – purple
    light: {
      cardBg: "#F3E8FF",
      borderColor: "#8B5CF6",
      iconBg: "#8B5CF6",
      iconColor: "#FFFFFF",
      titleColor: "#5B21B6",
      metricColor: "#6B21A8",
      buttonBg: "#8B5CF6",
      buttonText: "#FFFFFF",
    },
    dark: {
      cardBg: "#2E1065",
      borderColor: "#A78BFA",
      iconBg: "#7C3AED",
      iconColor: "#FFFFFF",
      titleColor: "#DDD6FE",
      metricColor: "#C4B5FD",
      buttonBg: "#8B5CF6",
      buttonText: "#FFFFFF",
    },
  },
  deposits: {
    // Deposits Tracked – teal/emerald green
    light: {
      cardBg: "#D1FAE5",
      borderColor: "#10B981",
      iconBg: "#10B981",
      iconColor: "#FFFFFF",
      titleColor: "#065F46",
      metricColor: "#047857",
      buttonBg: "#10B981",
      buttonText: "#FFFFFF",
    },
    dark: {
      cardBg: "#022C22",
      borderColor: "#34D399",
      iconBg: "#059669",
      iconColor: "#FFFFFF",
      titleColor: "#A7F3D0",
      metricColor: "#6EE7B7",
      buttonBg: "#10B981",
      buttonText: "#FFFFFF",
    },
  },
  cases: {
    // Active Cases – red
    light: {
      cardBg: "#FEE2E2",
      borderColor: "#DC2626",
      iconBg: "#DC2626",
      iconColor: "#FFFFFF",
      titleColor: "#991B1B",
      metricColor: "#B91C1C",
      buttonBg: "#DC2626",
      buttonText: "#FFFFFF",
    },
    dark: {
      cardBg: "#450A0A",
      borderColor: "#F87171",
      iconBg: "#B91C1C",
      iconColor: "#FFFFFF",
      titleColor: "#FECACA",
      metricColor: "#FCA5A5",
      buttonBg: "#DC2626",
      buttonText: "#FFFFFF",
    },
  },
  maintenance: {
    // Maintenance – amber/orange
    light: {
      cardBg: "#FEF3C7",
      borderColor: "#F59E0B",
      iconBg: "#F59E0B",
      iconColor: "#FFFFFF",
      titleColor: "#92400E",
      metricColor: "#B45309",
      buttonBg: "#F59E0B",
      buttonText: "#FFFFFF",
    },
    dark: {
      cardBg: "#451A03",
      borderColor: "#FBBF24",
      iconBg: "#D97706",
      iconColor: "#FFFFFF",
      titleColor: "#FDE68A",
      metricColor: "#FCD34D",
      buttonBg: "#F59E0B",
      buttonText: "#FFFFFF",
    },
  },
  evidence: {
    // Evidence Vault – indigo
    light: {
      cardBg: "#E0E7FF",
      borderColor: "#6366F1",
      iconBg: "#6366F1",
      iconColor: "#FFFFFF",
      titleColor: "#3730A3",
      metricColor: "#4338CA",
      buttonBg: "#6366F1",
      buttonText: "#FFFFFF",
    },
    dark: {
      cardBg: "#1E1B4B",
      borderColor: "#818CF8",
      iconBg: "#4F46E5",
      iconColor: "#FFFFFF",
      titleColor: "#C7D2FE",
      metricColor: "#A5B4FC",
      buttonBg: "#6366F1",
      buttonText: "#FFFFFF",
    },
  },
};

// Legacy compatibility: FEATURE_COLORS export for existing code
export const FEATURE_COLORS = {
  leases: { accent: "#3B82F6" },
  deposits: { accent: "#10B981" },
  rent: { accent: "#0EA5E9" },
  notifications: { accent: "#8B5CF6" },
  cases: { accent: "#DC2626" },
  maintenance: { accent: "#F59E0B" },
  evidence: { accent: "#6366F1" },
};

/**
 * Get comprehensive theme for a feature card
 * @param {string} featureKey - Key from FEATURE_THEMES (e.g., "leases", "deposits")
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} Theme object with all color properties
 */
export function getFeatureCardStyles(featureKey, isDarkMode = false) {
  const feature = FEATURE_THEMES[featureKey];

  if (!feature) {
    // Fallback for unknown features
    return isDarkMode
      ? {
          cardBg: "#2A2D30",
          borderColor: "#4B5563",
          iconBg: "#4B5563",
          iconColor: "#E5E7EB",
          titleColor: "#E5E7EB",
          metricColor: "#F9FAFB",
          buttonBg: "#4B5563",
          buttonText: "#FFFFFF",
        }
      : {
          cardBg: "#F9FAFB",
          borderColor: "#D1D5DB",
          iconBg: "#9CA3AF",
          iconColor: "#FFFFFF",
          titleColor: "#111827",
          metricColor: "#1F2937",
          buttonBg: "#6B7280",
          buttonText: "#FFFFFF",
        };
  }

  return isDarkMode ? feature.dark : feature.light;
}

// Legacy compatibility: Extract accent color from theme
export function getFeatureAccent(featureKey, isDarkMode = false) {
  const theme = getFeatureCardStyles(featureKey, isDarkMode);
  return theme.borderColor;
}

// Standardised CTA style object (for inline use)
export const primaryCtaStyle = {
  backgroundColor: CTA_COLOR,
  color: "#FFFFFF",
  borderRadius: "9999px",
  border: "none",
  padding: "8px 14px",
  fontWeight: 600,
  fontSize: "0.875rem",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  boxShadow: "0 10px 18px rgba(12,59,46,0.35)",
  transition: "transform 0.12s ease, box-shadow 0.12s ease, opacity 0.15s ease",
};

export const primaryCtaHover = {
  transform: "translateY(-1px)",
  boxShadow: "0 14px 24px rgba(12,59,46,0.45)",
};

export const primaryCtaDisabled = {
  backgroundColor: CTA_COLOR_DISABLED,
  boxShadow: "none",
  opacity: 0.65,
  cursor: "not-allowed",
};