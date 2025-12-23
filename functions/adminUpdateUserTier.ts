import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins allowed
    const superAdmins = ['steve.l@signa-consultants.com', 'steve.d.lockhart@gmail.com'];
    if (!superAdmins.includes(currentUser.email.toLowerCase())) {
      return Response.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const { userId, tier } = await req.json();

    if (!userId || !tier) {
      return Response.json({ error: 'Missing userId or tier' }, { status: 400 });
    }

    // Valid tiers
    const validTiers = ['free', 'lite', 'protect', 'secure'];
    if (!validTiers.includes(tier)) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    console.log('🔄 Updating user tier:', { userId, tier });

    // Update user using service role
    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { plan_tier: tier });

    console.log('✅ Tier update complete:', updatedUser);

    return Response.json({ 
      success: true,
      message: `User tier updated to ${tier}`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Admin update tier error:', error);
    return Response.json({ 
      error: error.message || 'Failed to update user tier'
    }, { status: 500 });
  }
});