// Shared severity palette for frontend (React)
export const severityPalette = {
  none:    { bg: '#D1FAE5', border: '#10B981', text: '#064E3B', badgeBg: '#E5E7EB', badgeText: '#4B5563', fillSoft: '#ECFDF5', fillStrong: '#A7F3D0' },
  low:     { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8', badgeBg: '#BFDBFE', badgeText: '#1D4ED8', fillSoft: '#EFF6FF', fillStrong: '#BFDBFE' },
  medium:  { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', badgeBg: '#FDE68A', badgeText: '#92400E', fillSoft: '#FFFBEB', fillStrong: '#FEE2A5' },
  high:    { bg: '#FED7AA', border: '#F97316', text: '#9A3412', badgeBg: '#FED7AA', badgeText: '#9A3412', fillSoft: '#FFF7ED', fillStrong: '#FED7AA' },
  critical:{ bg: '#FEE2E2', border: '#EF4444', text: '#7F1D1D', badgeBg: '#FECACA', badgeText: '#7F1D1D', fillSoft: '#FEF2F2', fillStrong: '#FECACA' },
};

export function highestSeverity(severities) {
  const order = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
  return severities.reduce((acc, s) => (order[s] > order[acc] ? s : acc), 'none');
}

export function riskScoreToSeverity(score) {
  const s = Number(score || 0);
  if (s >= 85) return 'critical';
  if (s >= 70) return 'high';
  if (s >= 40) return 'medium';
  if (s > 0) return 'low';
  return 'none';
}