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
        const userData = userRecord.data || {};
        
        // Case 1: Has data.tier but not data.plan_tier - MIGRATE
        if (userData.tier && !userData.plan_tier) {
          const newData = { ...userData };
          newData.plan_tier = userData.tier;
          delete newData.tier;
          
          await svc.entities.User.update(userRecord.id, newData);
          
          results.fixed.push({
            email: userRecord.email,
            migratedValue: userData.tier,
            userId: userRecord.id
          });
          
          console.log('[MIGRATION_FIXED]', {
            email: userRecord.email,
            tier: userData.tier,
            to: 'plan_tier'
          });
          
        // Case 2: Already has data.plan_tier - OK
        } else if (userData.plan_tier) {
          results.alreadyCorrect.push({
            email: userRecord.email,
            plan_tier: userData.plan_tier
          });
          
        // Case 3: No tier data at all - default to free
        } else {
          results.noTierData.push({
            email: userRecord.email,
            note: 'No tier field found'
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