import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await req.json();

    if (!caseId) {
      return Response.json({ error: 'caseId required' }, { status: 400 });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 [FREE_RESOLVE] Processing free Resolve case');
    console.log('User:', user.email);
    console.log('Case ID:', caseId);

    // Step 1: Verify eligibility
    console.log('🔍 [FREE_RESOLVE] Checking eligibility...');
    const eligibilityCheck = await base44.functions.invoke('isFreeResolveEligible', { userId: user.id });
    
    if (!eligibilityCheck.data?.eligible) {
      console.log('❌ [FREE_RESOLVE] Not eligible:', eligibilityCheck.data?.reason);
      return Response.json({
        success: false,
        error: 'Not eligible for free Resolve',
        details: eligibilityCheck.data
      }, { status: 403 });
    }

    console.log('✅ [FREE_RESOLVE] Eligibility confirmed');

    // Step 2: Update case status to intake and mark as paid via free entitlement
    const existingCase = (await base44.entities.Case.filter({ id: caseId }))[0];
    
    console.log('📎 [FREE_RESOLVE] Case evidence before update:', {
      evidence_count: existingCase?.evidence?.length || 0,
      evidence: existingCase?.evidence || []
    });
    
    await base44.asServiceRole.entities.Case.update(caseId, {
      status: 'intake',
      paid_at: new Date().toISOString(),
      resolve_amount: 0,
      pricing_type: 'free_entitlement',
      stripe_payment_intent_id: 'free_entitlement',
      timeline: [
        ...(existingCase?.timeline || []),
        {
          timestamp: new Date().toISOString(),
          event: 'Case activated via free Resolve entitlement (Annual Secure)',
          actor: user.email,
          meta: {
            payment_type: 'free_entitlement',
            plan: 'secure',
            billing: 'annual',
            evidence_count: existingCase?.evidence?.length || 0
          }
        }
      ]
    });
    
    console.log('📎 [FREE_RESOLVE] Case updated - evidence preserved');

    console.log('✅ [FREE_RESOLVE] Case status updated to intake');

    // Step 3: Mark entitlement as used
    // Check if this is a manual override user - decrement manual_case_credits
    const currentUser = (await base44.asServiceRole.entities.User.filter({ id: user.id }))[0];
    const updateData = {
      resolve_entitlement_used_at: new Date().toISOString(),
      resolve_entitlement_used_case_id: caseId
    };
    
    if (currentUser?.manual_tier_override && (currentUser.manual_case_credits || 0) > 0) {
      updateData.manual_case_credits = currentUser.manual_case_credits - 1;
      console.log('🔧 [FREE_RESOLVE] Decremented manual_case_credits:', currentUser.manual_case_credits, '->', updateData.manual_case_credits);
    }
    
    await base44.asServiceRole.entities.User.update(user.id, updateData);

    console.log('✅ [FREE_RESOLVE] Entitlement marked as used');

    // Note: Admin notification is already sent during case creation (ResolveCase page)
    // No duplicate notification needed here
    console.log('✅ [FREE_RESOLVE] Skipping notification (already sent at case creation)');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return Response.json({
      success: true,
      caseId: caseId,
      message: 'Free Resolve case activated successfully'
    });

  } catch (error) {
    console.error('❌ [FREE_RESOLVE] Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});