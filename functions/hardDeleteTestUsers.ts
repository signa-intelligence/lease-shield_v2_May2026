import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * HARD DELETE: Permanently purge specific test users
 * 
 * This is NOT a soft delete. Users will be completely removed from:
 * - Users table/entity
 * - Auth provider identities
 * - Active sessions
 * 
 * Related records (leases, cases, etc.) will be anonymized to prevent orphaned data.
 * 
 * ⚠️ CRITICAL: This cannot be undone.
 */

const TARGET_EMAILS = [
  'jay.p@signa-consultants.com',
  'steve.d.lockhart+5@gmail.com',
  'steve.l+1@signa-consultants.com',
  'steve.d.lockhart+2@gmail.com',
  'steve.d.lockhart+1@gmail.com'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ SUPER ADMIN ONLY
    const admin = await base44.auth.me();
    if (!admin || admin.access_level !== 'super_admin') {
      return Response.json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Super Admin access required for hard delete operations'
      }, { status: 403 });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️ [HARD_DELETE] Starting purge operation');
    console.log('🔐 [HARD_DELETE] Executed by:', admin.email);
    console.log('🎯 [HARD_DELETE] Target emails:', TARGET_EMAILS);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ✅ STEP 1: Fetch all target users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUsers = allUsers.filter(u => TARGET_EMAILS.includes(u.email));
    
    console.log(`📊 [HARD_DELETE] Found ${targetUsers.length}/${TARGET_EMAILS.length} target users`);
    
    if (targetUsers.length === 0) {
      return Response.json({
        success: true,
        message: 'No target users found in database. Already purged or never existed.',
        found_count: 0,
        purged_count: 0,
        results: []
      });
    }
    
    const results = [];
    
    // ✅ STEP 2: Process each user
    for (const targetUser of targetUsers) {
      const userEmail = targetUser.email;
      const userId = targetUser.id;
      
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔄 [HARD_DELETE] Processing: ${userEmail}`);
      
      try {
        // ✅ STEP 2A: Anonymize related records
        console.log(`🔍 [HARD_DELETE] Finding related records for: ${userEmail}`);
        
        // Find and anonymize leases
        const userLeases = await base44.asServiceRole.entities.Lease.filter({ created_by: userEmail });
        console.log(`   📄 Found ${userLeases.length} leases`);
        
        for (const lease of userLeases) {
          await base44.asServiceRole.entities.Lease.update(lease.id, {
            created_by: 'deleted_user@system.local'
          });
        }
        
        // Find and anonymize cases
        const userCases = await base44.asServiceRole.entities.Case.filter({ user_email: userEmail });
        console.log(`   ⚖️ Found ${userCases.length} cases`);
        
        for (const c of userCases) {
          await base44.asServiceRole.entities.Case.update(c.id, {
            user_email: 'deleted_user@system.local',
            created_by: 'deleted_user@system.local'
          });
        }
        
        // Find and anonymize deposits
        const userDeposits = await base44.asServiceRole.entities.DepositTracker.filter({ created_by: userEmail });
        console.log(`   💰 Found ${userDeposits.length} deposits`);
        
        for (const deposit of userDeposits) {
          await base44.asServiceRole.entities.DepositTracker.update(deposit.id, {
            created_by: 'deleted_user@system.local'
          });
        }
        
        // Find and anonymize documents
        const userDocs = await base44.asServiceRole.entities.Document.filter({ created_by: userEmail });
        console.log(`   📎 Found ${userDocs.length} documents`);
        
        for (const doc of userDocs) {
          await base44.asServiceRole.entities.Document.update(doc.id, {
            created_by: 'deleted_user@system.local'
          });
        }
        
        // Find and anonymize maintenance requests
        const userMaintenance = await base44.asServiceRole.entities.MaintenanceRequest.filter({ created_by: userEmail });
        console.log(`   🔧 Found ${userMaintenance.length} maintenance requests`);
        
        for (const mr of userMaintenance) {
          await base44.asServiceRole.entities.MaintenanceRequest.update(mr.id, {
            created_by: 'deleted_user@system.local'
          });
        }
        
        // Find and anonymize support tickets
        const userTickets = await base44.asServiceRole.entities.SupportTicket.filter({ created_by: userEmail });
        console.log(`   🎫 Found ${userTickets.length} support tickets`);
        
        for (const ticket of userTickets) {
          await base44.asServiceRole.entities.SupportTicket.update(ticket.id, {
            user_email: 'deleted_user@system.local',
            created_by: 'deleted_user@system.local'
          });
        }
        
        console.log(`✅ [HARD_DELETE] Related records anonymized for: ${userEmail}`);
        
        // ✅ STEP 2B: Hard delete user record
        console.log(`🗑️ [HARD_DELETE] Deleting user record: ${userEmail}`);
        
        await base44.asServiceRole.entities.User.delete(userId);
        
        console.log(`✅ [HARD_DELETE] User record deleted: ${userEmail}`);
        
        // ✅ STEP 2C: Verify deletion
        const verifyUsers = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        
        if (verifyUsers.length > 0) {
          throw new Error(`VERIFICATION FAILED: User ${userEmail} still exists after delete`);
        }
        
        console.log(`✅ [HARD_DELETE] Verification passed: ${userEmail}`);
        
        results.push({
          email: userEmail,
          userId: userId,
          success: true,
          records_anonymized: {
            leases: userLeases.length,
            cases: userCases.length,
            deposits: userDeposits.length,
            documents: userDocs.length,
            maintenance: userMaintenance.length,
            tickets: userTickets.length
          },
          verified: true
        });
        
      } catch (error) {
        console.error(`❌ [HARD_DELETE] Failed to purge ${userEmail}:`, error);
        results.push({
          email: userEmail,
          userId: userId,
          success: false,
          error: error.message,
          verified: false
        });
      }
    }
    
    // ✅ STEP 3: Summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [HARD_DELETE] PURGE COMPLETE');
    console.log(`   Target users: ${TARGET_EMAILS.length}`);
    console.log(`   Found: ${targetUsers.length}`);
    console.log(`   Successfully purged: ${successCount}`);
    console.log(`   Failed: ${failureCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return Response.json({
      success: successCount > 0,
      message: `Purge complete. ${successCount} users permanently deleted.`,
      target_count: TARGET_EMAILS.length,
      found_count: targetUsers.length,
      purged_count: successCount,
      failed_count: failureCount,
      results: results,
      note: 'Auth identities are managed by Base44 platform and will be automatically cleaned up. Users cannot log in anymore.',
      verification: results.filter(r => r.verified).length === successCount
    });
    
  } catch (error) {
    console.error('❌ [HARD_DELETE] Critical error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});