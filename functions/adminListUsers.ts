import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { requireSuperAdmin, safeLog } from './authGuards.js';
import { handleCors, ensureAllowedOrigin, err } from './http.js';

Deno.serve(async (req) => {
  const pre = handleCors(req); if (pre) return pre;
  const { allowed, requestId } = ensureAllowedOrigin(req); if (!allowed) return err(req, 'CORS_FORBIDDEN', 'Origin not allowed', 403, requestId);
  try {
    // SECURITY FIX: Role-based auth instead of hard-coded emails
    const { user, base44 } = await requireSuperAdmin(req);
    
    await safeLog('ADMIN_LIST_USERS', { userId: user.id, timestamp: new Date().toISOString() });

    // Fetch all users
    const users = await base44.asServiceRole.entities.User.list('-created_date');

    await safeLog('ADMIN_LIST_USERS_SUCCESS', { count: users.length });

    return Response.json({ 
      success: true,
      users
    });

  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return err(req, 'UNAUTHORIZED', 'Unauthorized', 401);
    }
    if (error.message === 'FORBIDDEN') {
      return err(req, 'FORBIDDEN', 'Forbidden - Super admin access required', 403);
    }
    
    console.error('[ADMIN_LIST_USERS_ERROR]', { error: error.message });
    return Response.json({ 
      error: 'Failed to fetch users'
    }, { status: 500 });
  }
});