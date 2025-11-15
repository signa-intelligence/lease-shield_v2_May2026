import { base44 } from "@/api/base44Client";

/**
 * Ensures the user is authenticated. If not, redirects to Base44's login page.
 * @param {string} nextUrl - URL to redirect to after successful login
 * @returns {Promise<object|null>} User object if authenticated, null if redirecting
 */
export async function ensureAuthenticated(nextUrl) {
  try {
    const user = await base44.auth.me();
    if (!user || !user.id) {
      await base44.auth.redirectToLogin(nextUrl || window.location.pathname);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Auth check failed:', error);
    await base44.auth.redirectToLogin(nextUrl || window.location.pathname);
    return null;
  }
}

/**
 * Handles logout and redirects to marketing site
 */
export async function handleLogout() {
  try {
    await base44.auth.logout('https://leaseshield.asia/');
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = 'https://leaseshield.asia/';
  }
}