import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate admin
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userEmail } = await req.json();
    
    if (!userEmail) {
      return Response.json({ error: 'userEmail is required' }, { status: 400 });
    }

    // Get user with service role
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    
    // Fix the nested data structure
    const currentData = user.data || {};
    const nestedData = currentData.data || {};
    
    // Flatten the structure
    const fixedData = {
      referral_code: currentData.referral_code,
      referral_generated_at: currentData.referral_generated_at,
      scan_disclaimer_accepted: currentData.scan_disclaimer_accepted,
      quick_guide_dismissed: currentData.quick_guide_dismissed,
      available_scans: nestedData.available_scans || currentData.available_scans || 0,
      subscription_status: currentData.subscription_status,
      plan_tier: currentData.plan_tier,
      letter_credits: currentData.letter_credits,
      stripe_customer_id: currentData.stripe_customer_id
    };

    // Update user
    await base44.asServiceRole.entities.User.update(user.id, { data: fixedData });

    return Response.json({ 
      success: true, 
      message: 'User data structure fixed',
      previousData: currentData,
      fixedData: fixedData
    });

  } catch (error) {
    console.error('Error fixing user data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});