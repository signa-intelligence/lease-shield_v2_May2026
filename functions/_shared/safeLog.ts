/**
 * Safe logging utility - redacts PII from production logs
 * Prevents accidental exposure of emails, phones, and other sensitive data
 * 
 * Usage:
 *   safeLog('USER_ACTION', { userEmail: 'test@example.com', action: 'scan' }, 'info');
 *   // Logs: [USER_ACTION] { userEmail: 'tes***@example.com', action: 'scan' }
 */

const DEBUG_MODE = Deno.env.get('ADMIN_DEBUG') === 'true';

const PII_FIELDS = [
  'email',
  'userEmail',
  'user_email',
  'owner_email',
  'created_by',
  'landlord_email',
  'juristic_email',
  'phone',
  'landlord_phone',
  'juristic_phone',
  'line_id',
  'landlord_line',
  'juristic_line',
  'full_name',
  'display_name',
  'tenant_address',
  'landlord_address',
  'landlord_name',
  'juristic_name'
];

function redactEmail(email) {
  if (!email || typeof email !== 'string') return '[REDACTED]';
  
  if (email.includes('@')) {
    const [localPart, domain] = email.split('@');
    const visibleChars = Math.min(3, localPart.length);
    return `${localPart.substring(0, visibleChars)}***@${domain}`;
  }
  
  return '[REDACTED]';
}

function redactValue(value) {
  if (!value) return null;
  
  if (typeof value === 'string') {
    if (value.includes('@')) {
      return redactEmail(value);
    }
    // Redact phone numbers
    if (value.match(/^\+?\d{8,15}$/)) {
      return `***${value.substring(value.length - 4)}`;
    }
    // Redact names/addresses (show first 3 chars)
    if (value.length > 10) {
      return `${value.substring(0, 3)}***`;
    }
    return '[REDACTED]';
  }
  
  return '[REDACTED]';
}

function redactPII(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    // Check if this is a PII field
    if (PII_FIELDS.includes(key)) {
      sanitized[key] = redactValue(value);
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects
      sanitized[key] = redactPII(value);
    }
  }
  
  return sanitized;
}

export function safeLog(message, data = {}, level = 'log') {
  // In admin debug mode, log raw data (for troubleshooting)
  if (DEBUG_MODE) {
    console[level](`[${message}] [DEBUG_MODE]`, data);
    return;
  }
  
  // Otherwise, redact PII
  const sanitized = redactPII(data);
  console[level](`[${message}]`, sanitized);
}

// Export for Deno Deploy
export default safeLog;