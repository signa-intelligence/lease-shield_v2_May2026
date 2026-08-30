// Shared severity palette for backend (PDF, etc.)
export const severityPalette = {
  none:    { bg: [209, 250, 229], border: [16, 185, 129], text: [6, 78, 59], badgeBg: [229, 231, 235], badgeText: [75, 85, 99], fillSoft: [236, 253, 245], fillStrong: [167, 243, 208] },
  low:     { bg: [219, 234, 254], border: [59, 130, 246], text: [29, 78, 216], badgeBg: [191, 219, 254], badgeText: [29, 78, 216], fillSoft: [239, 246, 255], fillStrong: [191, 219, 254] },
  medium:  { bg: [255, 237, 213], border: [249, 115, 22], text: [154, 52, 18], badgeBg: [254, 215, 170], badgeText: [154, 52, 18], fillSoft: [255, 247, 237], fillStrong: [254, 215, 170] },
  high:    { bg: [254, 226, 226], border: [220, 38, 38], text: [127, 29, 29], badgeBg: [254, 202, 202], badgeText: [127, 29, 29], fillSoft: [254, 242, 242], fillStrong: [254, 202, 202] },
  critical:{ bg: [254, 202, 202], border: [153, 27, 27], text: [127, 29, 29], badgeBg: [252, 165, 165], badgeText: [127, 29, 29], fillSoft: [254, 242, 242], fillStrong: [252, 165, 165] },
};

export function rgbToCss(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function riskScoreToSeverity(score) {
  const s = Number(score || 0);
  if (s >= 80) return 'critical';
  if (s >= 61) return 'high';
  if (s >= 31) return 'medium';
  if (s > 0) return 'low';
  return 'none';
}