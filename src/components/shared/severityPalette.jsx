// Shared severity palette for frontend (React)
export const severityPalette = {
  none:    { bg: '#D1FAE5', border: '#10B981', text: '#064E3B', badgeBg: '#E5E7EB', badgeText: '#4B5563', fillSoft: '#ECFDF5', fillStrong: '#A7F3D0' },
  low:     { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8', badgeBg: '#BFDBFE', badgeText: '#1D4ED8', fillSoft: '#EFF6FF', fillStrong: '#BFDBFE' },
  medium:  { bg: '#FFEDD5', border: '#F97316', text: '#9A3412', badgeBg: '#FED7AA', badgeText: '#9A3412', fillSoft: '#FFF7ED', fillStrong: '#FED7AA' },
  high:    { bg: '#FEE2E2', border: '#DC2626', text: '#7F1D1D', badgeBg: '#FECACA', badgeText: '#7F1D1D', fillSoft: '#FEF2F2', fillStrong: '#FECACA' },
  critical:{ bg: '#FECACA', border: '#991B1B', text: '#7F1D1D', badgeBg: '#FCA5A5', badgeText: '#7F1D1D', fillSoft: '#FEF2F2', fillStrong: '#FCA5A5' },
};

export function highestSeverity(severities) {
  const order = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
  return severities.reduce((acc, s) => (order[s] > order[acc] ? s : acc), 'none');
}

export function riskScoreToSeverity(score) {
  const s = Number(score || 0);
  if (s >= 80) return 'critical';
  if (s >= 61) return 'high';
  if (s >= 31) return 'medium';
  if (s > 0) return 'low';
  return 'none';
}