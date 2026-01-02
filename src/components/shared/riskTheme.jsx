export function riskTheme(risk_score = 0, overall_risk = '') {
  const overall = String(overall_risk).toUpperCase();
  const score = Math.max(0, Math.min(100, Number(risk_score) || 0));
  // Color bands per new rule
  // 70–100 Red, 40–69 Orange, 20–39 Yellow, 0–19 Green
  if (score >= 70 || overall === 'HIGH') {
    return { key: 'high', color: '#EF4444', bg: '#FEE2E2', border: '#DC2626' };
  }
  if (score >= 40 || overall === 'MEDIUM') {
    return { key: 'medium', color: '#F97316', bg: '#FFEDD5', border: '#EA580C' }; // orange
  }
  if (score >= 20) {
    // Keep key as 'low' for backward label compatibility but use yellow color band
    return { key: 'low', color: '#F59E0B', bg: '#FEF3C7', border: '#D97706' }; // yellow
  }
  return { key: 'low', color: '#10B981', bg: '#D1FAE5', border: '#059669' }; // green
}

export const LEGAL_DISCLAIMER =
  "This report is an automated risk review, not legal advice. It highlights potential issues based on Thai law and common practice but does not guarantee the absence of risk.";