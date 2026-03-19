import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { input, maxLength = 1000, fieldName = 'input' } = await req.json();

    if (typeof input !== 'string') {
      return Response.json({ 
        error: 'Invalid input type', 
        sanitized: '', 
        isValid: false 
      }, { status: 400 });
    }

    // Remove null bytes and control characters
    let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<applet[^>]*>/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(sanitized)) {
        return Response.json({ 
          error: `Malicious content detected in ${fieldName}`,
          sanitized: '',
          isValid: false
        }, { status: 400 });
      }
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)/gi,
      /(\bDROP\b.*\bTABLE\b)/gi,
      /--/g,
      /\/\*/g,
      /\bEXEC\b/gi,
      /\bINSERT\b.*\bINTO\b/gi,
      /\bDELETE\b.*\bFROM\b/gi,
      /\bUPDATE\b.*\bSET\b/gi,
      /';/g,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(sanitized)) {
        return Response.json({ 
          error: `SQL injection attempt detected in ${fieldName}`,
          sanitized: '',
          isValid: false
        }, { status: 400 });
      }
    }

    // Strip HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Escape special characters
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    sanitized = sanitized.replace(/[&<>"'/]/g, (char) => escapeMap[char]);

    // Trim whitespace
    sanitized = sanitized.trim();

    // Enforce max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return Response.json({
      sanitized,
      isValid: true
    });

  } catch (error) {
    console.error('Sanitization error:', error);
    return Response.json({ 
      error: error.message,
      sanitized: '',
      isValid: false
    }, { status: 500 });
  }
});