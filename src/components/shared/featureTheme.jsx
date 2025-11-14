// Master colour map for all LeaseShield features
export const FEATURE_COLORS = {
  leases:       { accent: "#2563EB" }, // Active Leases
  deposits:     { accent: "#C7A338" }, // Deposit Tracker
  rent:         { accent: "#0EA5E9" }, // Rent Tracker
  notifications:{ accent: "#8B5CF6" }, // Notifications / Alerts
  cases:        { accent: "#DC2626" }, // Active Cases / Legal
  maintenance:  { accent: "#F97316" }, // Maintenance
  evidence:     { accent: "#2563EB" }, // Evidence Vault
};

export const CTA_COLOR = "#0C3B2E";        // All primary buttons
export const CTA_COLOR_DISABLED = "#9CA3AF";

// Helper to get card styles by feature key
export function getFeatureCardStyles(featureKey, isDarkMode = false) {
  const feature = FEATURE_COLORS[featureKey];

  if (!feature) {
    return {
      borderLeftColor: isDarkMode ? "#4B5563" : "#D1D5DB",
      background: isDarkMode ? "#111827" : "#FFFFFF",
      headerColor: isDarkMode ? "#E5E7EB" : "#111827",
      metricColor: isDarkMode ? "#F9FAFB" : "#111827",
    };
  }

  const accent = feature.accent;

  if (isDarkMode) {
    return {
      borderLeftColor: accent,
      background: `linear-gradient(135deg, rgba(17,24,39,1) 0%, rgba(15,23,42,1) 45%, ${accent}20 100%)`,
      headerColor: "#E5E7EB",
      metricColor: "#F9FAFB",
      accent,
    };
  }

  return {
    borderLeftColor: accent,
    background: `linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 40%, ${accent}10 100%)`,
    headerColor: "#111827",
    metricColor: "#111827",
    accent,
  };
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