import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * One-time script to restore steve.l@signa-consultants.com as super admin
 * This is a direct update that bypasses safeguards (intentional for recovery)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Find Steve's user record
    const allUsers = await base44.asServiceRole.entities.User.list();
    const steveUser = allUsers.find(u => u.email === 'steve.l@signa-consultants.com');

    if (!steveUser) {
      return Response.json({ error: 'User steve.l@signa-consultants.com not found' }, { status: 404 });
    }

    console.log('Found user:', steveUser.email, '| Current role:', steveUser.role);

    // Update to super admin
    await base44.asServiceRole.entities.User.update(steveUser.id, {
      role: 'super_admin',
      access_level: 'super_admin',
      is_super_admin: true
    });

    console.log('✅ User updated to super_admin');

    return Response.json({ 
      success: true,
      message: 'steve.l@signa-consultants.com is now a super admin',
      user: {
        id: steveUser.id,
        email: steveUser.email,
        role: 'super_admin',
        access_level: 'super_admin',
        is_super_admin: true
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});