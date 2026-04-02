export const isInstalledApp = () => {
  // PWA standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS standalone
  if (window.navigator.standalone === true) return true;
  // Android TWA
  if (document.referrer.includes('android-app://')) return true;
  // WebView indicators
  const ua = navigator.userAgent || '';
  if (ua.includes('wv') || ua.includes('WebView')) return true;
  return false;
};