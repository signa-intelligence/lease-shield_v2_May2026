import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await req.json();

    // Return null for empty/optional phone
    if (!phone || phone.trim() === '') {
      return Response.json({
        valid: true,
        phone: null
      });
    }

    if (typeof phone !== 'string') {
      return Response.json({ 
        error: 'Phone must be a string',
        valid: false 
      }, { status: 400 });
    }

    const phoneTrimmed = phone.trim();

    // E.164 format validation
    // Must start with +
    if (!phoneTrimmed.startsWith('+')) {
      return Response.json({ 
        error: 'Phone number must start with + (E.164 format)',
        valid: false 
      }, { status: 400 });
    }

    // Remove the + and check if remaining characters are digits
    const digits = phoneTrimmed.substring(1);
    
    if (!/^\d+$/.test(digits)) {
      return Response.json({ 
        error: 'Phone number must contain only digits after +',
        valid: false 
      }, { status: 400 });
    }

    // Check length (8-15 digits after +)
    if (digits.length < 8 || digits.length > 15) {
      return Response.json({ 
        error: 'Phone number must be 8-15 digits after +',
        valid: false 
      }, { status: 400 });
    }

    return Response.json({
      valid: true,
      phone: phoneTrimmed
    });

  } catch (error) {
    console.error('Phone validation error:', error);
    return Response.json({ 
      error: error.message,
      valid: false
    }, { status: 500 });
  }
});