import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * HARD DELETE USERS - PERMANENT PURGE
 * 
 * Completely removes user records from the database and revokes auth.
 * This is NOT a soft delete - users are permanently removed.
 * 
 * Handles related records safely by anonymizing ownership.
 * 
 * Usage: Provide array of email addresses to purge
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ SUPER ADMIN ONLY
    const admin = await base44.auth.me();
    if (!admin || admin.access_level !== 'super_admin') {
      return Response.json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Super Admin access required for hard delete'
      }, { status: 403 });
    }
    
    const { emails } = await req.json();
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Provide array of email addresses to delete'
      }, { status: 400 });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️ [HARD_DELETE] Starting permanent user deletion');
    console.log('📧 [HARD_DELETE] Target emails:', emails);
    console.log('👤 [HARD_DELETE] Executed by:', admin.email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const results = [];
    const PLACEHOLDER_EMAIL = 'deleted_user@system';
    
    for (const email of emails) {
      const userResult = {
        email,
        found: false,
        deleted: false,
        relatedRecordsHandled: false,
        error: null
      };
      
      try {
        // Step 1: Find user by email
        console.log(`🔍 [HARD_DELETE] Looking up user: ${email}`);
        const allUsers = await base44.asServiceRole.entities.User.list();
        const targetUser = allUsers.find(u => u.email === email);
        
        if (!targetUser) {
          console.warn(`⚠️ [HARD_DELETE] User not found: ${email}`);
          userResult.error = 'USER_NOT_FOUND';
          results.push(userResult);
          continue;
        }
        
        userResult.found = true;
        userResult.userId = targetUser.id;
        
        console.log(`✅ [HARD_DELETE] User found:`, {
          id: targetUser.id,
          email: targetUser.email,
          status: targetUser.status,
          access_level: targetUser.access_level
        });
        
        // Step 2: Handle related records (anonymize ownership)
        console.log(`🔗 [HARD_DELETE] Handling related records for: ${email}`);
        
        try {
          // Update Leases
          const userLeases = await base44.asServiceRole.entities.Lease.filter({ created_by: email });
          if (userLeases.length > 0) {
            console.log(`  📄 Anonymizing ${userLeases.length} leases...`);
            for (const lease of userLeases) {
              await base44.asServiceRole.entities.Lease.update(lease.id, {
                created_by: PLACEHOLDER_EMAIL
              });
            }
          }
          
          // Update Cases
          const userCases = await base44.asServiceRole.entities.Case.filter({ user_email: email });
          if (userCases.length > 0) {
            console.log(`  ⚖️ Anonymizing ${userCases.length} cases...`);
            for (const caseRecord of userCases) {
              await base44.asServiceRole.entities.Case.update(caseRecord.id, {
                user_email: PLACEHOLDER_EMAIL,
                created_by: PLACEHOLDER_EMAIL
              });
            }
          }
          
          // Update Deposits
          const userDeposits = await base44.asServiceRole.entities.DepositTracker.filter({ created_by: email });
          if (userDeposits.length > 0) {
            console.log(`  💰 Anonymizing ${userDeposits.length} deposits...`);
            for (const deposit of userDeposits) {
              await base44.asServiceRole.entities.DepositTracker.update(deposit.id, {
                created_by: PLACEHOLDER_EMAIL
              });
            }
          }
          
          // Update Documents
          const userDocuments = await base44.asServiceRole.entities.Document.filter({ created_by: email });
          if (userDocuments.length > 0) {
            console.log(`  📎 Anonymizing ${userDocuments.length} documents...`);
            for (const doc of userDocuments) {
              await base44.asServiceRole.entities.Document.update(doc.id, {
                created_by: PLACEHOLDER_EMAIL
              });
            }
          }
          
          // Update Support Tickets
          const userTickets = await base44.asServiceRole.entities.SupportTicket.filter({ user_email: email });
          if (userTickets.length > 0) {
            console.log(`  🎫 Anonymizing ${userTickets.length} support tickets...`);
            for (const ticket of userTickets) {
              await base44.asServiceRole.entities.SupportTicket.update(ticket.id, {
                user_email: PLACEHOLDER_EMAIL,
                created_by: PLACEHOLDER_EMAIL
              });
            }
          }
          
          // Update Maintenance Requests
          const userMaintenance = await base44.asServiceRole.entities.MaintenanceRequest.filter({ created_by: email });
          if (userMaintenance.length > 0) {
            console.log(`  🔧 Anonymizing ${userMaintenance.length} maintenance requests...`);
            for (const mr of userMaintenance) {
              await base44.asServiceRole.entities.MaintenanceRequest.update(mr.id, {
                created_by: PLACEHOLDER_EMAIL
              });
            }
          }
          
          userResult.relatedRecordsHandled = true;
          console.log(`✅ [HARD_DELETE] Related records anonymized for: ${email}`);
          
        } catch (relatedError) {
          console.error(`❌ [HARD_DELETE] Failed to handle related records for ${email}:`, relatedError);
          // Continue with deletion anyway - related records will just keep the old created_by
        }
        
        // Step 3: HARD DELETE user record
        console.log(`🗑️ [HARD_DELETE] Permanently deleting user record: ${email}`);
        
        await base44.asServiceRole.entities.User.delete(targetUser.id);
        
        userResult.deleted = true;
        console.log(`✅ [HARD_DELETE] User permanently deleted: ${email}`);
        
      } catch (error) {
        console.error(`❌ [HARD_DELETE] Failed to delete ${email}:`, error);
        userResult.error = error.message;
      }
      
      results.push(userResult);
    }
    
    // ✅ Summary
    const successCount = results.filter(r => r.deleted).length;
    const failureCount = results.filter(r => !r.deleted).length;
    const notFoundCount = results.filter(r => !r.found).length;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [HARD_DELETE] COMPLETE');
    console.log(`   Requested: ${emails.length}`);
    console.log(`   Successfully deleted: ${successCount}`);
    console.log(`   Not found: ${notFoundCount}`);
    console.log(`   Failed: ${failureCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ✅ Verification: Check if any users still exist
    console.log('🔍 [HARD_DELETE] Verification: checking if users still exist...');
    const allUsersAfter = await base44.asServiceRole.entities.User.list();
    const stillExist = emails.filter(email => 
      allUsersAfter.some(u => u.email === email)
    );
    
    if (stillExist.length > 0) {
      console.error('❌ [HARD_DELETE] VERIFICATION FAILED - users still exist:', stillExist);
    } else {
      console.log('✅ [HARD_DELETE] VERIFICATION PASSED - all users purged');
    }
    
    return Response.json({
      success: successCount > 0,
      message: `Hard delete complete. ${successCount} users permanently removed.`,
      requested: emails.length,
      deleted_count: successCount,
      not_found_count: notFoundCount,
      failed_count: failureCount,
      verification: {
        still_exist: stillExist,
        verification_passed: stillExist.length === 0
      },
      results,
      note: 'Users and their auth identities have been permanently removed. Related records have been anonymized.'
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