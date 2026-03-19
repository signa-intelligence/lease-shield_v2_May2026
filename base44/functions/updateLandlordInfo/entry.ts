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
      action: 'landlord_update',
      limit: 3,
      windowMs: 60000
    });

    if (!rateLimitCheck.data.allowed) {
      return Response.json({
        error: 'Rate limit exceeded. Please wait before updating landlord information again.',
        retry_after_seconds: rateLimitCheck.data.retry_after_seconds
      }, { status: 429 });
    }

    const validatedUpdates = {};
    const changes = {};

    // Validate landlord_name
    if (updates.landlord_name !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.landlord_name,
        maxLength: 100,
        fieldName: 'landlord_name'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      const name = sanitized.data.sanitized;
      if (name.length < 2 || name.length > 100) {
        return Response.json({ error: 'Landlord name must be 2-100 characters' }, { status: 400 });
      }

      validatedUpdates.landlord_name = name;
      changes.landlord_name = { old: user.landlord_name, new: name };
    }

    // Validate landlord_email
    if (updates.landlord_email !== undefined) {
      const emailValidation = await base44.functions.invoke('validateEmail', {
        email: updates.landlord_email
      });

      if (!emailValidation.data.valid) {
        return Response.json({ error: emailValidation.data.error }, { status: 400 });
      }

      validatedUpdates.landlord_email = emailValidation.data.email;
      changes.landlord_email = { old: user.landlord_email, new: emailValidation.data.email };
    }

    // Validate landlord_phone (optional)
    if (updates.landlord_phone !== undefined) {
      const phoneValidation = await base44.functions.invoke('validatePhone', {
        phone: updates.landlord_phone
      });

      if (!phoneValidation.data.valid) {
        return Response.json({ error: phoneValidation.data.error }, { status: 400 });
      }

      validatedUpdates.landlord_phone = phoneValidation.data.phone;
      changes.landlord_phone = { old: user.landlord_phone, new: phoneValidation.data.phone };
    }

    // Validate landlord_line (optional, alphanumeric)
    if (updates.landlord_line !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.landlord_line,
        maxLength: 50,
        fieldName: 'landlord_line'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      const lineId = sanitized.data.sanitized;
      if (lineId && !/^[a-zA-Z0-9_-]+$/.test(lineId)) {
        return Response.json({ error: 'LINE ID can only contain letters, numbers, hyphens, and underscores' }, { status: 400 });
      }

      validatedUpdates.landlord_line = lineId;
      changes.landlord_line = { old: user.landlord_line, new: lineId };
    }

    // Validate landlord_address
    if (updates.landlord_address !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.landlord_address,
        maxLength: 300,
        fieldName: 'landlord_address'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      validatedUpdates.landlord_address = sanitized.data.sanitized;
      changes.landlord_address = { old: user.landlord_address, new: sanitized.data.sanitized };
    }

    // Update user
    if (Object.keys(validatedUpdates).length > 0) {
      await base44.auth.updateMe(validatedUpdates);

      // Log audit event
      await base44.functions.invoke('logAuditEvent', {
        action: 'landlord_info_updated',
        entity_type: 'user',
        entity_id: user.id,
        changes: changes,
        status: 'success'
      });
    }

    return Response.json({
      success: true,
      message: 'Landlord information updated successfully'
    });

  } catch (error) {
    console.error('Update landlord info error:', error);
    return Response.json({ 
      error: 'An error occurred while updating landlord information. Please try again.'
    }, { status: 500 });
  }
});