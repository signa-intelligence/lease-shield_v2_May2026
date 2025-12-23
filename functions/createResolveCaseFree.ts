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

    // Step 2: Update case status to paid (via free entitlement)
    await base44.asServiceRole.entities.Case.update(caseId, {
      status: 'intake',
      paid_at: new Date().toISOString(),
      resolve_amount: 0,
      pricing_type: 'free_entitlement',
      stripe_payment_intent_id: 'free_entitlement',
      timeline: [
        ...(await base44.entities.Case.filter({ id: caseId }))[0].timeline || [],
        {
          timestamp: new Date().toISOString(),
          event: 'Case activated via free Resolve entitlement (Annual Secure)',
          actor: user.email,
          meta: {
            payment_type: 'free_entitlement',
            plan: 'secure',
            billing: 'annual'
          }
        }
      ]
    });

    console.log('✅ [FREE_RESOLVE] Case status updated to intake');

    // Step 3: Mark entitlement as used
    await base44.asServiceRole.entities.User.update(user.id, {
      resolve_entitlement_used_at: new Date().toISOString(),
      resolve_entitlement_used_case_id: caseId
    });

    console.log('✅ [FREE_RESOLVE] Entitlement marked as used');

    // Step 4: Send admin notification
    try {
      const caseData = (await base44.entities.Case.filter({ id: caseId }))[0];
      await base44.functions.invoke('notifyAdminNewCase', {
        caseNumber: caseData.case_number,
        tenantName: user.full_name || user.display_name,
        tenantEmail: user.email,
        landlordName: caseData.landlord_name,
        propertyAddress: caseData.property_address,
        disputeAmount: caseData.dispute_amount,
        planTier: 'secure',
        caseId: caseId,
        paymentType: 'free_entitlement'
      });
      console.log('✅ [FREE_RESOLVE] Admin notification sent');
    } catch (notifyError) {
      console.error('⚠️ [FREE_RESOLVE] Admin notification failed (non-critical):', notifyError);
    }

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