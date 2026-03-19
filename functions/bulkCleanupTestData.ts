import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * PRODUCTION DATA CLEANUP
 * Deletes all test users and their data while preserving production accounts
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const adminUser = await base44.auth.me();

    if (!adminUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const isAdmin = 
      adminUser.role === 'admin' || 
      adminUser.role === 'super_admin' ||
      adminUser.access_level === 'admin' ||
      adminUser.access_level === 'super_admin';
    
    if (!isAdmin) {
      return Response.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }

    const { confirmed } = await req.json();
    
    if (confirmed !== 'DELETE_ALL_TEST_DATA') {
      return Response.json({
        error: 'Confirmation required. Send: {"confirmed": "DELETE_ALL_TEST_DATA"}'
      }, { status: 400 });
    }

    // Protected production accounts
    const keptEmails = [
      'steve.l@signa-consultants.com',
      'shortyroc36@gmail.com',
      'steve.d.lockhart@gmail.com'
    ];

    console.log('[BULK_CLEANUP_START]', { 
      adminEmail: adminUser.email,
      timestamp: new Date().toISOString(),
      protectedAccounts: keptEmails.length
    });

    const svc = base44.asServiceRole;
    const results = {
      startedAt: new Date().toISOString(),
      adminEmail: adminUser.email,
      usersDeleted: 0,
      usersKept: 0,
      errors: [],
      deletionSummary: {}
    };

    // Get all users
    const allUsers = await svc.entities.User.list();
    console.log(`[BULK_CLEANUP] Found ${allUsers.length} total users`);

    // Separate users to keep vs delete
    const usersToKeep = allUsers.filter(u => keptEmails.includes(u.email));
    const usersToDelete = allUsers.filter(u => !keptEmails.includes(u.email));

    console.log(`[BULK_CLEANUP] Keeping ${usersToKeep.length} users, deleting ${usersToDelete.length} users`);

    // Step 1: Delete all entity records for users to be deleted
    for (const user of usersToDelete) {
      console.log(`[BULK_CLEANUP] Processing user: ${user.email}`);
      
      try {
        // Delete Leases (which cascades to LeaseScan)
        const leases = await svc.entities.Lease.filter({ owner_email: user.email });
        for (const lease of leases) {
          try {
            await svc.functions.invoke('deleteLease', { leaseId: lease.id });
          } catch (err) {
            console.warn(`[BULK_CLEANUP] Failed to delete lease ${lease.id}: ${err.message}`);
          }
        }
        
        // Delete DepositTrackers
        const deposits = await svc.entities.DepositTracker.filter({ owner_email: user.email });
        for (const deposit of deposits) {
          await svc.entities.DepositTracker.delete(deposit.id);
        }
        
        // Delete TimelineEvents
        const events = await svc.entities.TimelineEvent.filter({ owner_email: user.email });
        for (const event of events) {
          await svc.entities.TimelineEvent.delete(event.id);
        }
        
        // Delete Cases
        const cases = await svc.entities.Case.filter({ user_email: user.email });
        for (const caseItem of cases) {
          await svc.entities.Case.delete(caseItem.id);
        }
        
        // Delete MaintenanceRequests
        const maintenance = await svc.entities.MaintenanceRequest.filter({ created_by: user.email });
        for (const request of maintenance) {
          await svc.entities.MaintenanceRequest.delete(request.id);
        }
        
        // Delete UserStorage
        const storage = await svc.entities.UserStorage.filter({ user_email: user.email });
        for (const storageRecord of storage) {
          await svc.entities.UserStorage.delete(storageRecord.id);
        }
        
        // Delete RateLimits
        try {
          const rateLimits = await svc.entities.RateLimit.filter({ user_id: user.id });
          for (const limit of rateLimits) {
            await svc.entities.RateLimit.delete(limit.id);
          }
        } catch (e) {
          console.warn(`[BULK_CLEANUP] RateLimit deletion failed for ${user.email}: ${e.message}`);
        }
        
        // Delete NotificationLogs
        try {
          const notifications = await svc.entities.NotificationLog.filter({ user_email: user.email });
          for (const notification of notifications) {
            await svc.entities.NotificationLog.delete(notification.id);
          }
        } catch (e) {
          console.warn(`[BULK_CLEANUP] NotificationLog deletion failed for ${user.email}: ${e.message}`);
        }
        
        // Delete Documents
        try {
          const documents = await svc.entities.Document.filter({ created_by: user.email });
          for (const doc of documents) {
            await svc.entities.Document.delete(doc.id);
          }
        } catch (e) {
          console.warn(`[BULK_CLEANUP] Document deletion failed for ${user.email}: ${e.message}`);
        }
        
        // Anonymize CreditsLedger (keep financial audit trail)
        try {
          const credits = await svc.entities.CreditsLedger.filter({ user_email: user.email });
          for (const credit of credits) {
            await svc.entities.CreditsLedger.update(credit.id, {
              user_email: '[DELETED_USER]',
              anonymized_at: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn(`[BULK_CLEANUP] CreditsLedger anonymization failed for ${user.email}: ${e.message}`);
        }
        
        // Delete LisaConversations
        try {
          const conversations = await svc.entities.LisaConversation.filter({ user_email: user.email });
          for (const conv of conversations) {
            await svc.entities.LisaConversation.delete(conv.id);
          }
        } catch (e) {
          console.warn(`[BULK_CLEANUP] LisaConversation deletion failed for ${user.email}: ${e.message}`);
        }
        
        // Delete Referrals (where user is referrer or referred)
        try {
          const referrals = await svc.entities.Referral.filter({ 
            $or: [
              { referrer_email: user.email },
              { referred_email: user.email }
            ]
          });
          for (const referral of referrals) {
            await svc.entities.Referral.delete(referral.id);
          }
        } catch (e) {
          console.warn(`[BULK_CLEANUP] Referral deletion failed for ${user.email}: ${e.message}`);
        }
        
        console.log(`[BULK_CLEANUP] ✓ Deleted all entity data for ${user.email}`);
        results.usersDeleted++;
        
      } catch (error) {
        console.error(`[BULK_CLEANUP] Error deleting data for ${user.email}:`, error);
        results.errors.push({
          email: user.email,
          error: error.message
        });
      }
    }

    // Step 2: Reset kept users to clean state
    for (const user of usersToKeep) {
      try {
        await svc.entities.User.update(user.id, {
          available_scans: 0,
          scans_used: 0,
          available_letters: 0,
          letters_used: 0,
          tier_credits_thb: 0,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          referral_code: null,
          referred_by: null,
          onboarding_completed: false,
          quick_guide_dismissed: false
        });
        console.log(`[BULK_CLEANUP] ✓ Reset ${user.email} to clean state`);
        results.usersKept++;
      } catch (error) {
        console.error(`[BULK_CLEANUP] Error resetting ${user.email}:`, error);
        results.errors.push({
          email: user.email,
          error: `Reset failed: ${error.message}`
        });
      }
    }

    // Step 3: PERMANENTLY DELETE user accounts (not anonymize)
    for (const user of usersToDelete) {
      try {
        // Create deletion audit log before deletion
        try {
          await svc.entities.GDPRDeletionLog.create({
            user_email: user.email,
            user_id: user.id,
            deleted_at: new Date().toISOString(),
            deleted_by: adminUser.email,
            deletion_summary: { reason: 'production_cleanup' },
            reason: 'admin_cleanup',
            status: 'completed'
          });
        } catch (e) {
          console.warn(`[BULK_CLEANUP] GDPR log creation failed for ${user.email}: ${e.message}`);
        }
        
        // PERMANENTLY DELETE the user record
        await svc.entities.User.delete(user.id);
        console.log(`[BULK_CLEANUP] ✓ DELETED user account: ${user.email}`);
      } catch (error) {
        console.error(`[BULK_CLEANUP] Error deleting user account ${user.email}:`, error);
        results.errors.push({
          email: user.email,
          error: `User deletion failed: ${error.message}`
        });
      }
    }

    results.completedAt = new Date().toISOString();
    results.deletionSummary = {
      totalUsers: allUsers.length,
      usersDeleted: results.usersDeleted,
      usersKept: results.usersKept,
      errorCount: results.errors.length
    };

    console.log('[BULK_CLEANUP_COMPLETE]', results);

    return Response.json({
      ok: true,
      message: `Production cleanup complete. Deleted ${results.usersDeleted} test users, kept ${results.usersKept} production users.`,
      results
    });

  } catch (error) {
    console.error('[BULK_CLEANUP_ERROR]', error);
    
    return Response.json({
      ok: false,
      error: 'CLEANUP_FAILED',
      message: error.message
    }, { status: 500 });
  }
});