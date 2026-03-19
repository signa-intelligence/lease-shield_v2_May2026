import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * ═══════════════════════════════════════════════════════════════════
 * FIX ORPHAN CASES - One-time migration utility
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Purpose: Fix cases that were wrongly created with admin ownership
 * 
 * Problem: Cases created before ownership fix have:
 * - user_email = signaconsultants@gmail.com (admin)
 * - created_by = admin email
 * - Result: Invisible to actual tenant users
 * 
 * Solution: 
 * - Find cases with admin user_email but different email in metadata/evidence
 * - Re-bind to correct tenant user
 * - Preserve all other case data
 * 
 * WARNING: Run this ONCE after deploying the ownership fix
 * ═══════════════════════════════════════════════════════════════════
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify Super Admin access
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const isSuperAdmin = currentUser.access_level === 'super_admin' || currentUser.role === 'super_admin';
    if (!isSuperAdmin) {
      return Response.json({
        error: 'Forbidden - Super Admin access required',
        your_role: currentUser.access_level || currentUser.role
      }, { status: 403 });
    }

    console.log('🔧 [FIX_ORPHANS] Starting orphan case migration...');
    
    const { dryRun = true } = await req.json();
    
    console.log('Mode:', dryRun ? '🔍 DRY RUN (no changes)' : '✏️ LIVE RUN (will update database)');

    // Fetch all cases
    const allCases = await base44.asServiceRole.entities.Case.list();
    console.log('📊 Total cases in database:', allCases.length);

    // Identify orphan cases (owned by admin but likely belong to someone else)
    const ADMIN_EMAIL = 'signaconsultants@gmail.com';
    const orphanCases = allCases.filter(c => c.user_email === ADMIN_EMAIL);
    
    console.log('🔍 Found orphan cases (owned by admin):', orphanCases.length);

    const fixes = [];
    const unfixable = [];

    for (const orphanCase of orphanCases) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 Analyzing case:', orphanCase.case_number || orphanCase.id.slice(0, 8));
      
      let correctEmail = null;
      let source = null;

      // Strategy 1: Check timeline for original creator
      if (orphanCase.timeline && orphanCase.timeline.length > 0) {
        const firstEvent = orphanCase.timeline[0];
        if (firstEvent.actor && firstEvent.actor !== ADMIN_EMAIL) {
          correctEmail = firstEvent.actor;
          source = 'timeline_actor';
        }
      }

      // Strategy 2: Check Stripe metadata if available
      if (!correctEmail && orphanCase.stripe_session_id) {
        // We don't have direct access to Stripe here, but we can check
        // if there's a Payment record with created_by
        const payments = await base44.asServiceRole.entities.Payment.filter({
          external_id: orphanCase.stripe_session_id
        });
        
        if (payments.length > 0 && payments[0].created_by !== ADMIN_EMAIL) {
          correctEmail = payments[0].created_by;
          source = 'payment_created_by';
        }
      }

      if (correctEmail) {
        // Find the correct user
        const allUsers = await base44.asServiceRole.entities.User.filter({ email: correctEmail });
        const correctUser = allUsers[0];

        if (correctUser) {
          console.log('✅ Found correct owner:', {
            email: correctUser.email,
            id: correctUser.id,
            full_name: correctUser.full_name,
            source
          });

          fixes.push({
            caseId: orphanCase.id,
            caseNumber: orphanCase.case_number,
            currentEmail: orphanCase.user_email,
            correctEmail: correctUser.email,
            correctUserId: correctUser.id,
            source
          });

          if (!dryRun) {
            // Perform the fix
            await base44.asServiceRole.entities.Case.update(orphanCase.id, {
              user_email: correctUser.email,
              created_by: correctUser.email
            });
            console.log('✅ FIXED: Case ownership updated');
          } else {
            console.log('🔍 DRY RUN: Would update user_email to:', correctUser.email);
          }
        } else {
          console.log('❌ Email found but user does not exist:', correctEmail);
          unfixable.push({
            caseId: orphanCase.id,
            caseNumber: orphanCase.case_number,
            reason: 'user_not_found',
            emailFound: correctEmail,
            source
          });
        }
      } else {
        console.log('❌ Cannot determine correct owner - no clues in timeline or payments');
        unfixable.push({
          caseId: orphanCase.id,
          caseNumber: orphanCase.case_number,
          reason: 'no_clues',
          currentEmail: orphanCase.user_email
        });
      }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log('Total cases analyzed:', allCases.length);
    console.log('Orphan cases found:', orphanCases.length);
    console.log('Fixable:', fixes.length);
    console.log('Unfixable:', unfixable.length);
    console.log('Mode:', dryRun ? 'DRY RUN (no changes made)' : 'LIVE RUN (database updated)');
    console.log('═══════════════════════════════════════════════════');

    return Response.json({
      success: true,
      dryRun,
      summary: {
        totalCases: allCases.length,
        orphanCases: orphanCases.length,
        fixable: fixes.length,
        unfixable: unfixable.length
      },
      fixes,
      unfixable,
      message: dryRun 
        ? `DRY RUN: Found ${fixes.length} fixable cases. Call again with {dryRun: false} to apply changes.`
        : `LIVE RUN: Fixed ${fixes.length} cases successfully.`
    }, { status: 200 });

  } catch (error) {
    console.error('❌ [FIX_ORPHANS] Error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});