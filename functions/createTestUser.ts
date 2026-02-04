import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only function
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email, tier = 'explorer', available_scans = 5 } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[CREATE_TEST_USER] Creating user', { email, tier, available_scans });

    // Check if user already exists
    const existingUsers = await base44.asServiceRole.entities.User.filter({ email });
    if (existingUsers && existingUsers.length > 0) {
      return Response.json({ 
        error: 'User already exists',
        userId: existingUsers[0].id 
      }, { status: 400 });
    }

    // Invite user (creates auth account)
    await base44.users.inviteUser(email, 'user');
    
    // Wait a moment for user record to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find the newly created user
    const newUsers = await base44.asServiceRole.entities.User.filter({ email });
    
    if (!newUsers || newUsers.length === 0) {
      return Response.json({ 
        error: 'User invited but record not found. Try again in a few seconds.' 
      }, { status: 500 });
    }

    const newUser = newUsers[0];

    // Update user with tier and available_scans
    await base44.asServiceRole.entities.User.update(newUser.id, {
      tier: tier,
      available_scans: available_scans,
      subscription_status: 'active'
    });

    console.log('[CREATE_TEST_USER] User created successfully', { 
      userId: newUser.id, 
      email, 
      tier, 
      available_scans 
    });

    return Response.json({
      success: true,
      userId: newUser.id,
      email: email,
      tier: tier,
      available_scans: available_scans,
      message: 'Test user created. Check email for invitation link to set password.'
    });

  } catch (error) {
    console.error('[CREATE_TEST_USER] Error:', error.message);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});