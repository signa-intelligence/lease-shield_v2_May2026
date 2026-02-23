import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Verify cleanup state and fix remaining issues
 * - Check all users
 * - Delete dom.sources@gmail.com if exists
 * - Investigate pamperme@editionsalon.com
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (user?.role !== 'admin' && user?.access_level !== 'admin' && user?.access_level !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const svc = base44.asServiceRole;

    // STEP 1: Get ALL users
    console.log('[VERIFY_CLEANUP] Fetching all users...');
    
    // Query User entity directly instead of using adminListUsers
    const allUsers = await svc.entities.User.list();

    console.log(`[VERIFY_CLEANUP] Total users: ${allUsers.length}`);
    console.log(`[VERIFY_CLEANUP] User emails:`, allUsers.map(u => u.email));

    const userEmails = allUsers.map(u => u.email);
    const report = {
      totalUsers: allUsers.length,
      userEmails,
      keptUsers: [],
      deletedUsers: [],
      investigatedUsers: [],
      entityCounts: {}
    };

    // Define kept users
    const keptUserEmails = [
      'steve.l@signa-consultants.com',
      'shortyroc36@gmail.com',
      'steve.d.lockhart@gmail.com'
    ];

    // STEP 2: Delete dom.sources@gmail.com if exists
    const domUser = allUsers.find(u => u.email === 'dom.sources@gmail.com');
    if (domUser) {
      console.log('[DELETE] Deleting dom.sources@gmail.com...');
      
      // Delete user's data via adminDeleteUserData
      const deleteResp = await svc.functions.invoke('adminDeleteUserData', {
        targetUserEmail: 'dom.sources@gmail.com',  // FIXED: correct param name
        reason: 'cleanup_remaining_test_account'
      });
      
      console.log('[DELETE] dom.sources deletion result:', deleteResp?.data);
      
      report.deletedUsers.push({
        email: 'dom.sources@gmail.com',
        reason: 'Remaining test account from cleanup',
        method: 'adminDeleteUserData',
        result: deleteResp?.data
      });
    } else {
      console.log('[DELETE] dom.sources@gmail.com not found (already deleted)');
      report.deletedUsers.push({
        email: 'dom.sources@gmail.com',
        status: 'already_gone'
      });
    }

    // STEP 3: Investigate pamperme@editionsalon.com
    const pampermeUser = allUsers.find(u => u.email === 'pamperme@editionsalon.com');
    if (pampermeUser) {
      console.log('[INVESTIGATE] pamperme@editionsalon.com found');
      
      const createdAt = new Date(pampermeUser.created_at);
      const cleanupTime = new Date('2026-02-22T00:00:00Z'); // Approximate cleanup time
      
      const isNewSignup = createdAt > cleanupTime;
      
      report.investigatedUsers.push({
        email: 'pamperme@editionsalon.com',
        created_at: pampermeUser.created_at,
        plan_tier: pampermeUser.plan_tier,
        available_scans: pampermeUser.available_scans,
        isNewSignup,
        verdict: isNewSignup 
          ? 'NEW SIGNUP - Valid account, scan limit reached is correct behavior'
          : 'OLD ACCOUNT - Should have been deleted, deleting now'
      });

      if (!isNewSignup) {
        // Delete old account
        console.log('[DELETE] Deleting old pamperme account...');
        
        // Delete user's data via adminDeleteUserData
        const deletePamperResp = await svc.functions.invoke('adminDeleteUserData', {
          targetUserEmail: 'pamperme@editionsalon.com',  // FIXED: correct param name
          reason: 'cleanup_old_test_account'
        });
        
        console.log('[DELETE] pamperme deletion result:', deletePamperResp?.data);
        
        report.deletedUsers.push({
          email: 'pamperme@editionsalon.com',
          reason: 'Old test account from before cleanup',
          method: 'adminDeleteUserData',
          result: deletePamperResp?.data
        });
      }
    } else {
      console.log('[INVESTIGATE] pamperme@editionsalon.com not found');
      report.investigatedUsers.push({
        email: 'pamperme@editionsalon.com',
        status: 'not_found'
      });
    }

    // STEP 4: Report kept users (READ ONLY)
    for (const email of keptUserEmails) {
      const keptUser = allUsers.find(u => u.email === email);
      if (keptUser) {
        report.keptUsers.push({
          email,
          tier: keptUser.plan_tier,
          available_scans: keptUser.available_scans,
          referral_credit_thb: keptUser.referral_credit_thb || 0,
          status: 'UNCHANGED'
        });
      } else {
        report.keptUsers.push({
          email,
          status: 'MISSING (ERROR)'
        });
      }
    }

    // STEP 5: Count entities
    const entityTypes = [
      'Lease',
      'LeaseScan',
      'DepositTracker',
      'TimelineEvent',
      'Referral',
      'Case',
      'UserStorage',
      'RateLimit',
      'CreditsLedger',
      'NotificationLog',
      'MaintenanceRequest',
      'RecycleBin',
      'Document',
      'LetterUsage',
      'TemplateDownload'
    ];

    for (const entityType of entityTypes) {
      try {
        const records = await svc.entities[entityType].list();
        report.entityCounts[entityType] = records.length;
      } catch (err) {
        report.entityCounts[entityType] = `ERROR: ${err.message}`;
      }
    }

    return Response.json(report);

  } catch (error) {
    console.error('[VERIFY_CLEANUP_ERROR]', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});