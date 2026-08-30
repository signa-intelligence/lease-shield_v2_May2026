/**
 * Opens a document (lease PDF, evidence file, report) safely.
 *
 * Why this exists: the Android build is a TWA, so the app IS a browser tab.
 * Calling window.open(url, '_blank') from inside it spawns a Custom Tab whose
 * close control tears down the whole task, which closed the app instead of
 * returning the user to it. Navigating in the same tab keeps the app in the
 * back stack, so the system back button returns to where they were.
 */
export function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
      window.matchMedia?.('(display-mode: minimal-ui)')?.matches === true ||
      window.navigator?.standalone === true ||
      document.referrer?.startsWith('android-app://')
    );
  } catch {
    return false;
  }
}

export function openDocument(url) {
  if (!url) return;

  if (isStandaloneApp()) {
    // Same-tab navigation keeps the app in history so back returns to it
    window.location.href = url;
    return;
  }

  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    // Popup blocked, fall back to same-tab rather than failing silently
    window.location.href = url;
  }
}
