import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return Response.json({ 
        error: 'Email is required',
        valid: false 
      }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Check max length
    if (emailLower.length > 255) {
      return Response.json({ 
        error: 'Email exceeds maximum length of 255 characters',
        valid: false 
      }, { status: 400 });
    }

    // RFC 5322 email regex (simplified but robust)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(emailLower)) {
      return Response.json({ 
        error: 'Invalid email format',
        valid: false 
      }, { status: 400 });
    }

    // Extract domain
    const domain = emailLower.split('@')[1];

    // List of disposable email domains to block
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'temp-mail.org',
      'fakeinbox.com',
      'sharklasers.com',
      'maildrop.cc',
      'yopmail.com',
      'trashmail.com',
      'getnada.com',
      'emailondeck.com',
      'spamgourmet.com',
      'mytemp.email',
      'temp-mail.io',
      'mohmal.com',
      'minuteinbox.com',
      'dispostable.com',
      'throwawaymail.com'
    ];

    if (disposableDomains.includes(domain)) {
      return Response.json({ 
        error: 'Disposable email addresses are not allowed',
        valid: false 
      }, { status: 400 });
    }

    return Response.json({
      valid: true,
      email: emailLower
    });

  } catch (error) {
    console.error('Email validation error:', error);
    return Response.json({ 
      error: error.message,
      valid: false
    }, { status: 500 });
  }
});