// Shared severity palette for backend (PDF, etc.)
export const severityPalette = {
  none:    { bg: [209, 250, 229], border: [16, 185, 129], text: [6, 78, 59], badgeBg: [229, 231, 235], badgeText: [75, 85, 99], fillSoft: [236, 253, 245], fillStrong: [167, 243, 208] },
  low:     { bg: [219, 234, 254], border: [59, 130, 246], text: [29, 78, 216], badgeBg: [191, 219, 254], badgeText: [29, 78, 216], fillSoft: [239, 246, 255], fillStrong: [191, 219, 254] },
  medium:  { bg: [254, 243, 199], border: [245, 158, 11], text: [146, 64, 14], badgeBg: [253, 230, 138], badgeText: [146, 64, 14], fillSoft: [255, 251, 235], fillStrong: [254, 240, 199] },
  high:    { bg: [254, 215, 170], border: [249, 115, 22], text: [154, 52, 18], badgeBg: [254, 215, 170], badgeText: [154, 52, 18], fillSoft: [255, 247, 237], fillStrong: [254, 215, 170] },
  critical:{ bg: [254, 226, 226], border: [239, 68, 68], text: [127, 29, 29], badgeBg: [254, 202, 202], badgeText: [127, 29, 29], fillSoft: [254, 242, 242], fillStrong: [254, 202, 202] },
};

export function rgbToCss(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function riskScoreToSeverity(score) {
  const s = Number(score || 0);
  if (s >= 85) return 'critical';
  if (s >= 70) return 'high';
  if (s >= 40) return 'medium';
  if (s > 0) return 'low';
  return 'none';
}