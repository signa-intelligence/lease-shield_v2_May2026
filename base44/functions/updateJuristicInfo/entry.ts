import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();

    // Rate limit: 3 per minute
    const rateLimitCheck = await base44.functions.invoke('checkRateLimit', {
      userId: user.id,
      action: 'juristic_update',
      limit: 3,
      windowMs: 60000
    });

    if (!rateLimitCheck.data.allowed) {
      return Response.json({
        error: 'Rate limit exceeded. Please wait before updating juristic information again.',
        retry_after_seconds: rateLimitCheck.data.retry_after_seconds
      }, { status: 429 });
    }

    const validatedUpdates = {};
    const changes = {};

    // Validate juristic_name
    if (updates.juristic_name !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.juristic_name,
        maxLength: 100,
        fieldName: 'juristic_name'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      const name = sanitized.data.sanitized;
      if (name.length < 2 || name.length > 100) {
        return Response.json({ error: 'Juristic name must be 2-100 characters' }, { status: 400 });
      }

      validatedUpdates.juristic_name = name;
      changes.juristic_name = { old: user.juristic_name, new: name };
    }

    // Validate juristic_email
    if (updates.juristic_email !== undefined) {
      const emailValidation = await base44.functions.invoke('validateEmail', {
        email: updates.juristic_email
      });

      if (!emailValidation.data.valid) {
        return Response.json({ error: emailValidation.data.error }, { status: 400 });
      }

      validatedUpdates.juristic_email = emailValidation.data.email;
      changes.juristic_email = { old: user.juristic_email, new: emailValidation.data.email };
    }

    // Validate juristic_phone (optional)
    if (updates.juristic_phone !== undefined) {
      const phoneValidation = await base44.functions.invoke('validatePhone', {
        phone: updates.juristic_phone
      });

      if (!phoneValidation.data.valid) {
        return Response.json({ error: phoneValidation.data.error }, { status: 400 });
      }

      validatedUpdates.juristic_phone = phoneValidation.data.phone;
      changes.juristic_phone = { old: user.juristic_phone, new: phoneValidation.data.phone };
    }

    // Validate juristic_line (optional, alphanumeric)
    if (updates.juristic_line !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.juristic_line,
        maxLength: 50,
        fieldName: 'juristic_line'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      const lineId = sanitized.data.sanitized;
      if (lineId && !/^[a-zA-Z0-9_-]+$/.test(lineId)) {
        return Response.json({ error: 'LINE ID can only contain letters, numbers, hyphens, and underscores' }, { status: 400 });
      }

      validatedUpdates.juristic_line = lineId;
      changes.juristic_line = { old: user.juristic_line, new: lineId };
    }

    // Update user
    if (Object.keys(validatedUpdates).length > 0) {
      await base44.auth.updateMe(validatedUpdates);

      // Log audit event
      await base44.functions.invoke('logAuditEvent', {
        action: 'juristic_info_updated',
        entity_type: 'user',
        entity_id: user.id,
        changes: changes,
        status: 'success'
      });
    }

    return Response.json({
      success: true,
      message: 'Juristic information updated successfully'
    });

  } catch (error) {
    console.error('Update juristic info error:', error);
    return Response.json({ 
      error: 'An error occurred while updating juristic information. Please try again.'
    }, { status: 500 });
  }
});