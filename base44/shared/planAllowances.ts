export const PLAN_ALLOWANCES = {
  explorer: { scans: 1, letters: 0 },
  free:     { scans: 1, letters: 0 },
  lite:     { scans: 6, letters: 3 },
  protect:  { scans: 12, letters: 5 },
  secure:   { scans: 50, letters: 50 }
};

export function getAllowance(tier) {
  const key = String(tier || '').toLowerCase();
  return PLAN_ALLOWANCES[key] || PLAN_ALLOWANCES.explorer;
}