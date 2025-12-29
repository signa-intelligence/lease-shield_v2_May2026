import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entity_type, entity_id, changes, status = 'success' } = await req.json();

    // Redact sensitive fields
    const sensitiveFields = ['password', 'token', 'api_key', 'credit_card', 'cvv', 'ssn', 'secret'];
    
    let sanitizedChanges = { ...changes };
    if (typeof changes === 'object' && changes !== null) {
      for (const key in sanitizedChanges) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          sanitizedChanges[key] = '[REDACTED]';
        }
      }
    }

    // Get IP address from request headers
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Get user agent
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create audit log entry
    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      action: action,
      entity_type: entity_type || '',
      entity_id: entity_id || '',
      changes: JSON.stringify(sanitizedChanges),
      ip_address: ipAddress,
      user_agent: userAgent,
      status: status,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      logged: true
    });

  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ 
      error: error.message,
      logged: false
    }, { status: 500 });
  }
});