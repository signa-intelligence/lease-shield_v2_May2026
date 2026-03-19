import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Final cleanup verification and fixes
 * Direct entity operations, no cross-function calls
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
    const allUsers = await svc.entities.User.list();
    
    const report = {
      step1_current_state: {
        totalUsers: allUsers.length,
        userEmails: allUsers.map(u => u.email).sort()
      },
      step2_dom_sources: {},
      step3_pamperme: {},
      step4_kept_users: [],
      step5_entity_counts: {}
    };

    console.log(`[STEP 1] Total users: ${allUsers.length}`);
    console.log(`[STEP 1] Emails:`, report.step1_current_state.userEmails);

    // STEP 2: Handle dom.sources@gmail.com
    const domUser = allUsers.find(u => u.email === 'dom.sources@gmail.com');
    if (domUser) {
      console.log('[STEP 2] Deleting dom.sources@gmail.com...');
      
      // Delete all entities for dom.sources
      const domLeases = await svc.entities.Lease.filter({ owner_email: 'dom.sources@gmail.com' });
      const domScans = await svc.entities.LeaseScan.filter({ owner_email: 'dom.sources@gmail.com' });
      const domDeposits = await svc.entities.DepositTracker.filter({ owner_email: 'dom.sources@gmail.com' });
      const domTimeline = await svc.entities.TimelineEvent.filter({ owner_email: 'dom.sources@gmail.com' });
      const domStorage = await svc.entities.UserStorage.filter({ user_email: 'dom.sources@gmail.com' });
      
      // Delete entities
      for (const lease of domLeases) await svc.entities.Lease.delete(lease.id);
      for (const scan of domScans) await svc.entities.LeaseScan.delete(scan.id);
      for (const deposit of domDeposits) await svc.entities.DepositTracker.delete(deposit.id);
      for (const event of domTimeline) await svc.entities.TimelineEvent.delete(event.id);
      for (const storage of domStorage) await svc.entities.UserStorage.delete(storage.id);
      
      // Anonymize user record
      await svc.entities.User.update(domUser.id, {
        plan_tier: 'deleted',
        available_scans: 0,
        full_name: '[DELETED]',
        is_active: false
      });
      
      report.step2_dom_sources = {
        status: 'DELETED',
        entitiesDeleted: {
          Leases: domLeases.length,
          LeaseScans: domScans.length,
          DepositTrackers: domDeposits.length,
          TimelineEvents: domTimeline.length,
          UserStorage: domStorage.length
        }
      };
    } else {
      report.step2_dom_sources = { status: 'ALREADY_GONE' };
    }

    // STEP 3: Investigate pamperme@editionsalon.com
    const pampermeUser = allUsers.find(u => u.email === 'pamperme@editionsalon.com');
    if (pampermeUser) {
      const createdAt = new Date(pampermeUser.created_date);
      const cleanupDate = new Date('2026-02-22T12:00:00Z');
      const isNewSignup = createdAt > cleanupDate;
      
      report.step3_pamperme = {
        exists: true,
        created_at: pampermeUser.created_date,
        plan_tier: pampermeUser.plan_tier,
        available_scans: pampermeUser.available_scans,
        isNewSignup,
        verdict: isNewSignup 
          ? 'NEW SIGNUP ✅ - Valid account (Explorer tier, 0 scans is correct)'
          : 'OLD ACCOUNT ❌ - Deleting now'
      };

      if (!isNewSignup) {
        // Delete old pamperme account
        const pamperLeases = await svc.entities.Lease.filter({ owner_email: 'pamperme@editionsalon.com' });
        const pamperScans = await svc.entities.LeaseScan.filter({ owner_email: 'pamperme@editionsalon.com' });
        const pamperDeposits = await svc.entities.DepositTracker.filter({ owner_email: 'pamperme@editionsalon.com' });
        const pamperTimeline = await svc.entities.TimelineEvent.filter({ owner_email: 'pamperme@editionsalon.com' });
        const pamperStorage = await svc.entities.UserStorage.filter({ user_email: 'pamperme@editionsalon.com' });
        
        for (const lease of pamperLeases) await svc.entities.Lease.delete(lease.id);
        for (const scan of pamperScans) await svc.entities.LeaseScan.delete(scan.id);
        for (const deposit of pamperDeposits) await svc.entities.DepositTracker.delete(deposit.id);
        for (const event of pamperTimeline) await svc.entities.TimelineEvent.delete(event.id);
        for (const storage of pamperStorage) await svc.entities.UserStorage.delete(storage.id);
        
        await svc.entities.User.update(pampermeUser.id, {
          plan_tier: 'deleted',
          available_scans: 0,
          full_name: '[DELETED]',
          is_active: false
        });
        
        report.step3_pamperme.deletionResult = {
          entitiesDeleted: {
            Leases: pamperLeases.length,
            LeaseScans: pamperScans.length,
            DepositTrackers: pamperDeposits.length,
            TimelineEvents: pamperTimeline.length,
            UserStorage: pamperStorage.length
          }
        };
      }
    } else {
      report.step3_pamperme = { exists: false };
    }

    // STEP 4: Report kept users (READ ONLY)
    const keptEmails = [
      'steve.l@signa-consultants.com',
      'shortyroc36@gmail.com',
      'steve.d.lockhart@gmail.com'
    ];

    for (const email of keptEmails) {
      const keptUser = allUsers.find(u => u.email === email);
      if (keptUser) {
        report.step4_kept_users.push({
          email,
          tier: keptUser.plan_tier,
          available_scans: keptUser.available_scans,
          referral_credit_thb: keptUser.referral_credit_thb || 0,
          status: '✅ UNCHANGED'
        });
      } else {
        report.step4_kept_users.push({
          email,
          status: '❌ MISSING'
        });
      }
    }

    // STEP 5: Count entities
    const entityTypes = [
      'Lease', 'LeaseScan', 'DepositTracker', 'TimelineEvent',
      'Referral', 'Case', 'UserStorage', 'RateLimit',
      'CreditsLedger', 'NotificationLog', 'MaintenanceRequest'
    ];

    for (const entityType of entityTypes) {
      try {
        const records = await svc.entities[entityType].list();
        report.step5_entity_counts[entityType] = records.length;
      } catch (err) {
        report.step5_entity_counts[entityType] = `ERROR: ${err.message}`;
      }
    }

    return Response.json(report);

  } catch (error) {
    console.error('[CLEANUP_CHECK_ERROR]', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});