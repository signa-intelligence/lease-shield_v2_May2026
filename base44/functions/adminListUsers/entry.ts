import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Id, X-Origin-URL',
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access using both role and access_level
    const role = (user.role || '').toLowerCase();
    const accessLevel = (user.access_level || '').toLowerCase();
    const isAdmin = ['admin', 'super_admin', 'va'].includes(role) || 
                    ['admin', 'super_admin', 'va'].includes(accessLevel);

    if (!isAdmin) {
      console.log('[ADMIN_LIST_USERS] Access denied for:', user.email, 'role:', role, 'access_level:', accessLevel);
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log('[ADMIN_LIST_USERS] Authorized:', user.email, 'role:', role, 'access_level:', accessLevel);

    // Fetch all users using service role to bypass RLS
    const users = await base44.asServiceRole.entities.User.list('-created_date');

    console.log('[ADMIN_LIST_USERS] Success, count:', users.length);

    return Response.json({ 
      success: true,
      users
    });

  } catch (error) {
    console.error('[ADMIN_LIST_USERS] Error:', error.message);
    return Response.json({ 
      error: 'Failed to fetch users',
      details: error.message
    }, { status: 500 });
  }
});