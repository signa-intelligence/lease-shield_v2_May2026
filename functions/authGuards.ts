import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Centralized authorization guards for Lease Shield backend functions
 * USE THESE INSTEAD OF HARD-CODED EMAIL CHECKS
 */

/**
 * Verify user is authenticated
 * @returns {user, base44} or throws 401
 */
export async function requireAuth(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  return { user, base44 };
}

/**
 * Verify user has admin privileges
 * Checks both role and access_level fields
 * @returns {user, base44} or throws 403
 */
export async function requireAdmin(req) {
  const { user, base44 } = await requireAuth(req);
  
  const isAdmin = 
    user.role === 'admin' || 
    user.role === 'super_admin' || 
    user.access_level === 'admin' || 
    user.access_level === 'super_admin' || 
    user.access_level === 'va';
  
  if (!isAdmin) {
    throw new Error('FORBIDDEN');
  }
  
  return { user, base44 };
}

/**
 * Verify user is super admin
 * @returns {user, base44} or throws 403
 */
export async function requireSuperAdmin(req) {
  const { user, base44 } = await requireAuth(req);
  
  const isSuperAdmin = 
    user.role === 'super_admin' || 
    user.access_level === 'super_admin';
  
  if (!isSuperAdmin) {
    throw new Error('FORBIDDEN');
  }
  
  return { user, base44 };
}

/**
 * Verify user owns the resource OR is admin
 * @param {string} resourceUserId - User ID who owns the resource
 */
export function requireOwnerOrAdmin(user, resourceUserId) {
  const isOwner = user.id === resourceUserId || user.email === resourceUserId;
  const isAdmin = 
    user.role === 'admin' || 
    user.role === 'super_admin' || 
    user.access_level === 'admin' || 
    user.access_level === 'super_admin';
  
  if (!isOwner && !isAdmin) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Hash user ID for safe logging (PDPA/GDPR compliance)
 */
export async function hashUserId(userId) {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 12); // First 12 chars for brevity
}

/**
 * Safe logger - redacts PII automatically
 */
export async function safeLog(eventName, data) {
  const redacted = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Redact email, address, name, phone, PII fields
    if (/(email|address|name|phone|id|token|secret)/i.test(key)) {
      if (key === 'userId' || key === 'user_id') {
        redacted[key] = await hashUserId(value);
      } else {
        redacted[key] = '[REDACTED]';
      }
    } else {
      redacted[key] = value;
    }
  }
  
  console.log(`[${eventName}]`, redacted);
}