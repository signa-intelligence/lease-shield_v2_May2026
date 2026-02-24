import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Fix #1: Give Explorer/Free tier 1 preview scan
 * Fix #2: Delete lease data from 2 users only (preserve shortyroc36)
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

    const report = {
      fix1_explorer_tier: {},
      fix2_data_cleanup: {
        steve_l: {},
        steve_d: {},
        shortyroc36: { status: 'PRESERVED - NOT TOUCHED' }
      },
      final_verification: {}
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FIX #1: EXPLORER TIER SCAN CREDITS
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[FIX 1] Fixing Explorer/Free tier scan credits...');

    // Get pamperme user
    const pampermeUsers = await svc.entities.User.filter({ email: 'pamperme@editionsalon.com' });
    if (pampermeUsers.length > 0) {
      const pamperme = pampermeUsers[0];
      console.log('[FIX 1] pamperme before:', { plan_tier: pamperme.plan_tier, available_scans: pamperme.available_scans });
      
      await svc.entities.User.update(pamperme.id, {
        available_scans: 1
      });
      
      report.fix1_explorer_tier.pamperme = {
        email: 'pamperme@editionsalon.com',
        old_scans: pamperme.available_scans,
        new_scans: 1,
        status: 'FIXED ✅'
      };
    }

    // Get shortyroc36 user
    const shortyrocUsers = await svc.entities.User.filter({ email: 'shortyroc36@gmail.com' });
    if (shortyrocUsers.length > 0) {
      const shortyroc = shortyrocUsers[0];
      console.log('[FIX 1] shortyroc before:', { plan_tier: shortyroc.plan_tier, available_scans: shortyroc.available_scans });
      
      if (shortyroc.plan_tier === 'free' || shortyroc.plan_tier === 'explorer') {
        await svc.entities.User.update(shortyroc.id, {
          available_scans: 1
        });
        
        report.fix1_explorer_tier.shortyroc = {
          email: 'shortyroc36@gmail.com',
          plan_tier: shortyroc.plan_tier,
          old_scans: shortyroc.available_scans,
          new_scans: 1,
          status: 'FIXED ✅'
        };
      } else {
        report.fix1_explorer_tier.shortyroc = {
          email: 'shortyroc36@gmail.com',
          plan_tier: shortyroc.plan_tier,
          available_scans: shortyroc.available_scans,
          status: 'UNCHANGED (not free/explorer tier)'
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FIX #2: DELETE DATA FROM 2 USERS ONLY
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[FIX 2] Deleting lease data from steve.l and steve.d...');

    const usersToClean = [
      'steve.l@signa-consultants.com',
      'steve.d.lockhart@gmail.com'
    ];

    for (const email of usersToClean) {
      console.log(`[FIX 2] Processing ${email}...`);
      
      const userKey = email.split('@')[0].replace(/\./g, '_');
      report.fix2_data_cleanup[userKey] = {
        email,
        deletedEntities: {}
      };

      // Delete Leases
      const leases = await svc.entities.Lease.filter({ owner_email: email });
      for (const lease of leases) {
        await svc.entities.Lease.delete(lease.id);
      }
      report.fix2_data_cleanup[userKey].deletedEntities.Leases = leases.length;
      console.log(`[FIX 2] ${email}: Deleted ${leases.length} Leases`);

      // Delete LeaseScans
      const scans = await svc.entities.LeaseScan.filter({ owner_email: email });
      for (const scan of scans) {
        await svc.entities.LeaseScan.delete(scan.id);
      }
      report.fix2_data_cleanup[userKey].deletedEntities.LeaseScans = scans.length;
      console.log(`[FIX 2] ${email}: Deleted ${scans.length} LeaseScans`);

      // Delete DepositTrackers
      const deposits = await svc.entities.DepositTracker.filter({ owner_email: email });
      for (const deposit of deposits) {
        await svc.entities.DepositTracker.delete(deposit.id);
      }
      report.fix2_data_cleanup[userKey].deletedEntities.DepositTrackers = deposits.length;
      console.log(`[FIX 2] ${email}: Deleted ${deposits.length} DepositTrackers`);

      // Delete TimelineEvents
      const events = await svc.entities.TimelineEvent.filter({ owner_email: email });
      for (const event of events) {
        await svc.entities.TimelineEvent.delete(event.id);
      }
      report.fix2_data_cleanup[userKey].deletedEntities.TimelineEvents = events.length;
      console.log(`[FIX 2] ${email}: Deleted ${events.length} TimelineEvents`);

      // Delete UserStorage
      const storage = await svc.entities.UserStorage.filter({ user_email: email });
      for (const storageRecord of storage) {
        await svc.entities.UserStorage.delete(storageRecord.id);
      }
      report.fix2_data_cleanup[userKey].deletedEntities.UserStorage = storage.length;
      console.log(`[FIX 2] ${email}: Deleted ${storage.length} UserStorage`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VERIFY SHORTYROC36 DATA PRESERVED
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[VERIFY] Checking shortyroc36 data preservation...');

    const shortyrocLeases = await svc.entities.Lease.filter({ owner_email: 'shortyroc36@gmail.com' });
    const shortyrocScans = await svc.entities.LeaseScan.filter({ owner_email: 'shortyroc36@gmail.com' });
    const shortyrocDeposits = await svc.entities.DepositTracker.filter({ owner_email: 'shortyroc36@gmail.com' });
    const shortyrocEvents = await svc.entities.TimelineEvent.filter({ owner_email: 'shortyroc36@gmail.com' });

    report.fix2_data_cleanup.shortyroc36 = {
      status: 'PRESERVED ✅',
      preservedEntities: {
        Leases: shortyrocLeases.length,
        LeaseScans: shortyrocScans.length,
        DepositTrackers: shortyrocDeposits.length,
        TimelineEvents: shortyrocEvents.length
      }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FINAL VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════

    const finalSteveLLeases = await svc.entities.Lease.filter({ owner_email: 'steve.l@signa-consultants.com' });
    const finalSteveDLeases = await svc.entities.Lease.filter({ owner_email: 'steve.d.lockhart@gmail.com' });

    report.final_verification = {
      steve_l: {
        leases: finalSteveLLeases.length,
        status: finalSteveLLeases.length === 0 ? '✅ CLEAN' : '❌ STILL HAS DATA'
      },
      steve_d: {
        leases: finalSteveDLeases.length,
        status: finalSteveDLeases.length === 0 ? '✅ CLEAN' : '❌ STILL HAS DATA'
      },
      shortyroc36: {
        leases: shortyrocLeases.length,
        status: shortyrocLeases.length > 0 ? '✅ PRESERVED' : '❌ DATA LOST'
      }
    };

    return Response.json({
      ok: true,
      report
    });

  } catch (error) {
    console.error('[FIX_ERROR]', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});