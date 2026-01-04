/**
 * Input sanitization utilities for Lease Shield
 * Prevents XSS, injection, and malicious content
 */

/**
 * Sanitize text for safe HTML rendering
 * Removes all HTML tags except safe formatting
 */
export function sanitizeText(input) {
  if (!input || typeof input !== 'string') return '';
  
  // Remove all HTML tags
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize HTML for limited rich text (preserve safe tags only)
 * Use for LLM output that needs basic formatting
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';
  
  // Allow only safe tags
  const allowedTags = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li'];
  
  // Remove script, style, and event handlers
  let sanitized = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
  
  // Remove disallowed tags
  sanitized = sanitized.replace(/<(\/?)([\w-]+)([^>]*)>/g, (match, slash, tag, attrs) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // Remove all attributes from allowed tags (prevent style/class injection)
      return `<${slash}${tag}>`;
    }
    return ''; // Remove disallowed tags
  });
  
  return sanitized;
}

/**
 * Validate file upload
 * Returns {valid: boolean, error: string}
 */
export function validateFileUpload(file) {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  // Check size
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `File too large. Maximum size: 10MB` };
  }
  
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: PDF, PNG, JPG` };
  }
  
  // Check extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return { valid: false, error: `Invalid file extension. Allowed: .pdf, .png, .jpg` };
  }
  
  // Prevent path traversal in filename
  if (fileName.includes('../') || fileName.includes('..\\')) {
    return { valid: false, error: 'Invalid filename' };
  }
  
  return { valid: true };
}

/**
 * Validate file URL (for scan function)
 * Ensures URL is from trusted storage domain
 */
export function validateFileUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Invalid URL' };
  }
  
  // Must be HTTPS
  if (!url.startsWith('https://')) {
    return { valid: false, error: 'URL must use HTTPS' };
  }
  
  // Must be from Supabase storage (your trusted domain)
  const TRUSTED_DOMAINS = [
    'qtrypzzcjebvfcihiynt.supabase.co',
    'supabase.co'
  ];
  
  try {
    const urlObj = new URL(url);
    const isTrusted = TRUSTED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
    
    if (!isTrusted) {
      return { valid: false, error: 'URL must be from trusted storage' };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Malformed URL' };
  }
}