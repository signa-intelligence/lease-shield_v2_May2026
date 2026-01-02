export function riskTheme(risk_score = 0, overall_risk = '') {
  const high = risk_score >= 70 || String(overall_risk).toUpperCase() === 'HIGH';
  const medium = !high && (risk_score >= 40 || String(overall_risk).toUpperCase() === 'MEDIUM');
  if (high) return { key: 'high', color: '#EF4444', bg: '#FEE2E2', border: '#DC2626' };
  if (medium) return { key: 'medium', color: '#F59E0B', bg: '#FEF3C7', border: '#D97706' };
  return { key: 'low', color: '#10B981', bg: '#D1FAE5', border: '#059669' };
}

export const LEGAL_DISCLAIMER =
  "This report is an automated risk screening tool, not legal advice. Some risks may not be detected. Users remain responsible for independent review.";