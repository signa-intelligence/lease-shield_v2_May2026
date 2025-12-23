import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.access_level !== 'super_admin') {
      return Response.json({ 
        success: false, 
        error: 'Super Admin access required' 
      }, { status: 403 });
    }

    // KEEPERS: Only these two users will remain
    const keepEmails = [
      'steve.l@signa-consultants.com',
      'steve.d.lockhart@gmail.com'
    ];

    console.log('🔥 [HARD_RESET] Starting hard reset of user management...');
    console.log('📋 [HARD_RESET] Users to KEEP:', keepEmails);

    // Step 1: Fetch all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`📊 [HARD_RESET] Total users in database: ${allUsers.length}`);

    // Step 2: Filter users to DELETE (all except keepers)
    const usersToDelete = allUsers.filter(u => !keepEmails.includes(u.email));
    console.log(`🗑️ [HARD_RESET] Users marked for deletion: ${usersToDelete.length}`);
    console.log('📝 [HARD_RESET] Emails to delete:', usersToDelete.map(u => u.email));

    const results = [];
    let deleted_count = 0;
    let failed_count = 0;

    // Step 3: Hard delete each user
    for (const targetUser of usersToDelete) {
      try {
        console.log(`\n🗑️ [HARD_DELETE] Processing: ${targetUser.email}`);

        // 3a. Anonymize related records
        const anonymousEmail = 'deleted_user@system.local';

        // Leases
        const userLeases = await base44.asServiceRole.entities.Lease.filter({ created_by: targetUser.email });
        for (const lease of userLeases) {
          await base44.asServiceRole.entities.Lease.update(lease.id, { 
            created_by: anonymousEmail 
          });
        }
        console.log(`  ✓ Anonymized ${userLeases.length} leases`);

        // Cases
        const userCases = await base44.asServiceRole.entities.Case.filter({ user_email: targetUser.email });
        for (const caseItem of userCases) {
          await base44.asServiceRole.entities.Case.update(caseItem.id, { 
            user_email: anonymousEmail,
            created_by: anonymousEmail 
          });
        }
        console.log(`  ✓ Anonymized ${userCases.length} cases`);

        // Deposits
        const userDeposits = await base44.asServiceRole.entities.DepositTracker.filter({ created_by: targetUser.email });
        for (const deposit of userDeposits) {
          await base44.asServiceRole.entities.DepositTracker.update(deposit.id, { 
            created_by: anonymousEmail 
          });
        }
        console.log(`  ✓ Anonymized ${userDeposits.length} deposits`);

        // Documents
        const userDocuments = await base44.asServiceRole.entities.Document.filter({ created_by: targetUser.email });
        for (const doc of userDocuments) {
          await base44.asServiceRole.entities.Document.update(doc.id, { 
            created_by: anonymousEmail 
          });
        }
        console.log(`  ✓ Anonymized ${userDocuments.length} documents`);

        // Maintenance
        const userMaintenance = await base44.asServiceRole.entities.MaintenanceRequest.filter({ created_by: targetUser.email });
        for (const maint of userMaintenance) {
          await base44.asServiceRole.entities.MaintenanceRequest.update(maint.id, { 
            created_by: anonymousEmail 
          });
        }
        console.log(`  ✓ Anonymized ${userMaintenance.length} maintenance requests`);

        // Support Tickets
        const userTickets = await base44.asServiceRole.entities.SupportTicket.filter({ user_email: targetUser.email });
        for (const ticket of userTickets) {
          await base44.asServiceRole.entities.SupportTicket.update(ticket.id, { 
            user_email: anonymousEmail,
            created_by: anonymousEmail 
          });
        }
        console.log(`  ✓ Anonymized ${userTickets.length} support tickets`);

        // 3b. Delete user from database
        await base44.asServiceRole.entities.User.delete(targetUser.id);
        console.log(`  ✅ [DB] User deleted: ${targetUser.email}`);

        // 3c. Revoke auth identity
        try {
          const revokeResponse = await base44.asServiceRole.functions.invoke('revokeUserAccess', {
            userEmail: targetUser.email
          });
          
          if (revokeResponse?.data?.success) {
            console.log(`  ✅ [AUTH] Identity revoked: ${targetUser.email}`);
          } else {
            console.warn(`  ⚠️ [AUTH] Revoke incomplete: ${revokeResponse?.data?.message || 'Unknown'}`);
          }
        } catch (authErr) {
          console.warn(`  ⚠️ [AUTH] Revoke failed (non-critical): ${authErr.message}`);
        }

        deleted_count++;
        results.push({
          email: targetUser.email,
          status: 'deleted',
          id: targetUser.id
        });

      } catch (err) {
        console.error(`  ❌ [HARD_DELETE] Failed to delete ${targetUser.email}:`, err.message);
        failed_count++;
        results.push({
          email: targetUser.email,
          status: 'failed',
          error: err.message
        });
      }
    }

    // Step 4: Verification
    console.log('\n🔍 [VERIFICATION] Checking remaining users...');
    const remainingUsers = await base44.asServiceRole.entities.User.list();
    const remainingEmails = remainingUsers.map(u => u.email);
    
    console.log(`📊 [VERIFICATION] Remaining users: ${remainingUsers.length}`);
    console.log(`📋 [VERIFICATION] Remaining emails:`, remainingEmails);

    const verification_passed = remainingUsers.length === 2 && 
                                remainingEmails.every(email => keepEmails.includes(email));

    console.log(`✅ [VERIFICATION] Passed: ${verification_passed}`);

    return Response.json({
      success: true,
      message: 'Hard reset complete',
      target_count: usersToDelete.length,
      deleted_count,
      failed_count,
      remaining_count: remainingUsers.length,
      verification: verification_passed,
      results,
      note: verification_passed 
        ? 'Database successfully reset to 2 users'
        : `⚠️ Verification failed - expected 2 users, found ${remainingUsers.length}`
    });

  } catch (error) {
    console.error('❌ [HARD_RESET] Fatal error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});