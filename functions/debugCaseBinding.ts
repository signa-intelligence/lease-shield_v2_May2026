import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * DEBUG UTILITY: Check case user bindings
 * Returns all cases with user_email verification
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Require admin access
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin', 'va'].includes(user.access_level || user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all cases (using service role to bypass RLS)
    const allCases = await base44.asServiceRole.entities.Case.list('-created_date', 50);
    
    console.log('🔍 [DEBUG] Total cases in DB:', allCases.length);
    
    const report = {
      total_cases: allCases.length,
      cases_with_user_email: allCases.filter(c => c.user_email).length,
      cases_without_user_email: allCases.filter(c => !c.user_email).length,
      cases_with_created_by: allCases.filter(c => c.created_by).length,
      cases_without_created_by: allCases.filter(c => !c.created_by).length,
      recent_cases: allCases.slice(0, 10).map(c => ({
        id: c.id.slice(0, 8),
        case_number: c.case_number,
        user_email: c.user_email || 'MISSING',
        created_by: c.created_by || 'MISSING',
        status: c.status,
        type: c.type,
        dispute_amount: c.dispute_amount,
        property_address: c.property_address,
        landlord_name: c.landlord_name,
        summary: c.summary?.substring(0, 50),
        evidence_count: c.evidence?.length || 0,
        created_date: c.created_date,
        stripe_session_id: c.stripe_session_id ? 'SET' : 'MISSING',
        paid_at: c.paid_at || 'NOT PAID'
      })),
      orphaned_cases: allCases.filter(c => !c.user_email && !c.created_by).map(c => ({
        id: c.id,
        case_number: c.case_number,
        status: c.status,
        created_date: c.created_date
      }))
    };
    
    console.log('📊 [DEBUG] Report:', JSON.stringify(report, null, 2));
    
    return Response.json(report, { status: 200 });
    
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});