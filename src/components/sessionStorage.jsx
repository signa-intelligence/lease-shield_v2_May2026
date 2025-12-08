/**
 * Manual persistent session layer for WebView compatibility
 * Stores session state in localStorage to survive app restarts
 */

const SESSION_KEY = 'lease_shield_persistent_session';

export const sessionStorage = {
  /**
   * Save authenticated session to localStorage
   */
  save: (userData) => {
    try {
      const session = {
        isAuthenticated: true,
        lastLogin: Date.now(),
        userId: userData?.id,
        email: userData?.email,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      console.log('💾 [SESSION] Saved to localStorage:', session);
    } catch (error) {
      console.error('❌ [SESSION] Failed to save:', error);
    }
  },

  /**
   * Read session from localStorage
   */
  get: () => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) {
        console.log('📭 [SESSION] No stored session found');
        return null;
      }
      const session = JSON.parse(stored);
      console.log('📂 [SESSION] Retrieved from localStorage:', session);
      return session;
    } catch (error) {
      console.error('❌ [SESSION] Failed to read:', error);
      return null;
    }
  },

  /**
   * Clear session from localStorage (logout)
   */
  clear: () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      console.log('🗑️ [SESSION] Cleared from localStorage');
    } catch (error) {
      console.error('❌ [SESSION] Failed to clear:', error);
    }
  },

  /**
   * Check if session exists and is recent (within 30 days)
   */
  isValid: () => {
    const session = sessionStorage.get();
    if (!session || !session.isAuthenticated) {
      return false;
    }
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - session.lastLogin) < thirtyDaysMs;
    console.log('🔍 [SESSION] Valid check:', { isRecent, ageInDays: Math.floor((Date.now() - session.lastLogin) / (24 * 60 * 60 * 1000)) });
    return isRecent;
  }
};

export const SESSION_KEY_NAME = SESSION_KEY;