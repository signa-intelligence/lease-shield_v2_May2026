import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  // Only super admin can run migrations
  if (user?.role !== 'admin' && user?.data?.access_level !== 'super_admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }
  
  const svc = base44.asServiceRole;
  
  try {
    // Get all users
    const users = await svc.entities.User.list();
    
    const results = {
      fixed: [],
      alreadyCorrect: [],
      noTierData: [],
      errors: []
    };
    
    for (const userRecord of users) {
      try {
        // CRITICAL: SDK flattens data.* fields to top level
        // So data.tier becomes userRecord.tier
        // And data.plan_tier becomes userRecord.plan_tier
        
        // Case 1: Has tier but not plan_tier - MIGRATE
        if (userRecord.tier && !userRecord.plan_tier) {
          // Update by setting plan_tier and removing tier
          await base44.auth.updateMe({ 
            plan_tier: userRecord.tier,
            tier: null  // Remove old field
          });
          
          results.fixed.push({
            email: userRecord.email,
            migratedValue: userRecord.tier,
            userId: userRecord.id
          });
          
          console.log('[MIGRATION_FIXED]', {
            email: userRecord.email,
            oldField: 'tier',
            value: userRecord.tier,
            newField: 'plan_tier'
          });
          
        // Case 2: Already has plan_tier - OK
        } else if (userRecord.plan_tier) {
          results.alreadyCorrect.push({
            email: userRecord.email,
            plan_tier: userRecord.plan_tier
          });
          
        // Case 3: No tier data at all - set default
        } else {
          await base44.auth.updateMe({ plan_tier: 'free' });
          
          results.noTierData.push({
            email: userRecord.email,
            action: 'Set default plan_tier: free'
          });
          
          console.log('[MIGRATION_DEFAULT]', {
            email: userRecord.email,
            setPlanTier: 'free'
          });
        }
        
      } catch (err) {
        results.errors.push({
          email: userRecord.email,
          error: err.message
        });
        console.error('[MIGRATION_ERROR]', {
          email: userRecord.email,
          error: err.message
        });
      }
    }
    
    return Response.json({
      success: true,
      summary: {
        totalUsers: users.length,
        fixed: results.fixed.length,
        alreadyCorrect: results.alreadyCorrect.length,
        noTierData: results.noTierData.length,
        errors: results.errors.length
      },
      details: results
    }, { status: 200 });
    
  } catch (error) {
    console.error('[MIGRATION_CRASH]', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});