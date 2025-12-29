import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();

    // Rate limit: 5 per minute
    const rateLimitCheck = await base44.functions.invoke('checkRateLimit', {
      userId: user.id,
      action: 'profile_update',
      limit: 5,
      windowMs: 60000
    });

    if (!rateLimitCheck.data.allowed) {
      return Response.json({
        error: 'Rate limit exceeded. Please wait before updating your profile again.',
        retry_after_seconds: rateLimitCheck.data.retry_after_seconds
      }, { status: 429 });
    }

    // Whitelist of allowed fields
    const allowedFields = [
      'display_name', 'phone', 'country', 'language', 
      'theme', 'tenant_address', 'tenant_city', 
      'tenant_state', 'tenant_zip'
    ];

    // Check for unauthorized fields
    const submittedFields = Object.keys(updates);
    const unauthorizedFields = submittedFields.filter(field => !allowedFields.includes(field));
    
    if (unauthorizedFields.length > 0) {
      return Response.json({
        error: `Unauthorized fields: ${unauthorizedFields.join(', ')}`
      }, { status: 400 });
    }

    const validatedUpdates = {};
    const changes = {};

    // Validate display_name
    if (updates.display_name !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.display_name,
        maxLength: 100,
        fieldName: 'display_name'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      const name = sanitized.data.sanitized;
      if (name.length < 2 || name.length > 100) {
        return Response.json({ error: 'Display name must be 2-100 characters' }, { status: 400 });
      }

      if (!/^[a-zA-Z\s'-]+$/.test(name)) {
        return Response.json({ error: 'Display name can only contain letters, spaces, hyphens, and apostrophes' }, { status: 400 });
      }

      validatedUpdates.display_name = name;
      changes.display_name = { old: user.display_name, new: name };
    }

    // Validate phone
    if (updates.phone !== undefined) {
      const phoneValidation = await base44.functions.invoke('validatePhone', {
        phone: updates.phone
      });

      if (!phoneValidation.data.valid) {
        return Response.json({ error: phoneValidation.data.error }, { status: 400 });
      }

      validatedUpdates.phone = phoneValidation.data.phone;
      changes.phone = { old: user.phone, new: phoneValidation.data.phone };
    }

    // Validate country
    if (updates.country !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.country,
        maxLength: 100,
        fieldName: 'country'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      validatedUpdates.country = sanitized.data.sanitized;
      changes.country = { old: user.country, new: sanitized.data.sanitized };
    }

    // Validate language
    if (updates.language !== undefined) {
      const allowedLanguages = ['en', 'th', 'zh', 'ja', 'ko', 'ru'];
      if (!allowedLanguages.includes(updates.language)) {
        return Response.json({ 
          error: `Language must be one of: ${allowedLanguages.join(', ')}` 
        }, { status: 400 });
      }

      validatedUpdates.language = updates.language;
      changes.language = { old: user.language, new: updates.language };
    }

    // Validate theme
    if (updates.theme !== undefined) {
      const allowedThemes = ['light', 'dark'];
      if (!allowedThemes.includes(updates.theme)) {
        return Response.json({ 
          error: 'Theme must be either "light" or "dark"' 
        }, { status: 400 });
      }

      validatedUpdates.theme = updates.theme;
      changes.theme = { old: user.theme, new: updates.theme };
    }

    // Validate tenant_address
    if (updates.tenant_address !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.tenant_address,
        maxLength: 200,
        fieldName: 'tenant_address'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      validatedUpdates.tenant_address = sanitized.data.sanitized;
      changes.tenant_address = { old: user.tenant_address, new: sanitized.data.sanitized };
    }

    // Validate tenant_city
    if (updates.tenant_city !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.tenant_city,
        maxLength: 100,
        fieldName: 'tenant_city'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      validatedUpdates.tenant_city = sanitized.data.sanitized;
      changes.tenant_city = { old: user.tenant_city, new: sanitized.data.sanitized };
    }

    // Validate tenant_state
    if (updates.tenant_state !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.tenant_state,
        maxLength: 100,
        fieldName: 'tenant_state'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      validatedUpdates.tenant_state = sanitized.data.sanitized;
      changes.tenant_state = { old: user.tenant_state, new: sanitized.data.sanitized };
    }

    // Validate tenant_zip
    if (updates.tenant_zip !== undefined) {
      const sanitized = await base44.functions.invoke('sanitizeUserInput', {
        input: updates.tenant_zip,
        maxLength: 20,
        fieldName: 'tenant_zip'
      });

      if (!sanitized.data.isValid) {
        return Response.json({ error: sanitized.data.error }, { status: 400 });
      }

      validatedUpdates.tenant_zip = sanitized.data.sanitized;
      changes.tenant_zip = { old: user.tenant_zip, new: sanitized.data.sanitized };
    }

    // Update user
    await base44.auth.updateMe(validatedUpdates);

    // Log audit event
    if (Object.keys(changes).length > 0) {
      await base44.functions.invoke('logAuditEvent', {
        action: 'user_profile_updated',
        entity_type: 'user',
        entity_id: user.id,
        changes: changes,
        status: 'success'
      });
    }

    // Fetch updated user
    const updatedUser = await base44.auth.me();

    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        display_name: updatedUser.display_name,
        phone: updatedUser.phone,
        country: updatedUser.country,
        language: updatedUser.language,
        theme: updatedUser.theme,
        tenant_address: updatedUser.tenant_address,
        tenant_city: updatedUser.tenant_city,
        tenant_state: updatedUser.tenant_state,
        tenant_zip: updatedUser.tenant_zip
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return Response.json({ 
      error: 'An error occurred while updating your profile. Please try again.'
    }, { status: 500 });
  }
});