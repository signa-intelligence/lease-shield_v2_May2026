// Shared severity palette for frontend (React)
export const severityPalette = {
  none:    { bg: '#D1FAE5', border: '#10B981', text: '#064E3B', badgeBg: '#E5E7EB', badgeText: '#4B5563' },
  low:     { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8', badgeBg: '#BFDBFE', badgeText: '#1D4ED8' },
  medium:  { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', badgeBg: '#FDE68A', badgeText: '#92400E' },
  high:    { bg: '#FED7AA', border: '#F97316', text: '#9A3412', badgeBg: '#FED7AA', badgeText: '#9A3412' },
  critical:{ bg: '#FEE2E2', border: '#EF4444', text: '#7F1D1D', badgeBg: '#FECACA', badgeText: '#7F1D1D' },
};

export function highestSeverity(severities) {
  const order = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
  return severities.reduce((acc, s) => (order[s] > order[acc] ? s : acc), 'none');
}