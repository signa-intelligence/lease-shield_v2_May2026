import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * PRE-DELETION INVENTORY
 * Shows all users and entity data BEFORE cleanup
 * Admin only - used for production cleanup verification
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('[INVENTORY_START]', { timestamp: new Date().toISOString() });

    const keptEmails = [
      'steve.l@signa-consultants.com',
      'shortyroc36@gmail.com',
      'steve.d.lockhart@gmail.com'
    ];

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    const usersToKeep = allUsers.filter(u => keptEmails.includes(u.email));
    const usersToDelete = allUsers.filter(u => !keptEmails.includes(u.email));

    // Get all entity counts
    const leases = await base44.asServiceRole.entities.Lease.list();
    const scans = await base44.asServiceRole.entities.LeaseScan.list();
    const deposits = await base44.asServiceRole.entities.DepositTracker.list();
    const events = await base44.asServiceRole.entities.TimelineEvent.list();
    const referrals = await base44.asServiceRole.entities.Referral.list();
    const cases = await base44.asServiceRole.entities.Case.list();
    const storage = await base44.asServiceRole.entities.UserStorage.list();
    const rateLimits = await base44.asServiceRole.entities.RateLimit.list();
    const credits = await base44.asServiceRole.entities.CreditsLedger.list();
    const maintenance = await base44.asServiceRole.entities.MaintenanceRequest.list();
    const notifications = await base44.asServiceRole.entities.NotificationLog.list();

    const inventory = {
      timestamp: new Date().toISOString(),
      users: {
        total: allUsers.length,
        toKeep: usersToKeep.length,
        toDelete: usersToDelete.length,
        keptEmails: usersToKeep.map(u => ({ email: u.email, tier: u.plan_tier, scans: u.available_scans || 0, credits: u.referral_credits_thb || 0 })),
        deleteEmails: usersToDelete.map(u => u.email)
      },
      entities: {
        Lease: leases.length,
        LeaseScan: scans.length,
        DepositTracker: deposits.length,
        TimelineEvent: events.length,
        Referral: referrals.length,
        Case: cases.length,
        UserStorage: storage.length,
        RateLimit: rateLimits.length,
        CreditsLedger: credits.length,
        MaintenanceRequest: maintenance.length,
        NotificationLog: notifications.length,
        TOTAL: leases.length + scans.length + deposits.length + events.length + referrals.length + cases.length + storage.length + rateLimits.length + credits.length + maintenance.length + notifications.length
      }
    };

    console.log('[INVENTORY_COMPLETE]', inventory);

    return Response.json({
      ok: true,
      inventory,
      warning: '⚠️ THIS IS A READ-ONLY INVENTORY. NO DATA HAS BEEN DELETED YET.'
    });

  } catch (error) {
    console.error('[INVENTORY_ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});