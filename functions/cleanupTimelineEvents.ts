import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Delete all timeline events for steve.l and steve.d
 * Verify complete deletion and preserve shortyroc36
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

    const cleanedUsers = [
      'steve.l@signa-consultants.com',
      'steve.d.lockhart@gmail.com'
    ];

    const report = {
      step1_before_cleanup: {},
      step2_deletion_process: {},
      step3_orphan_check: {},
      step4_after_cleanup: {},
      step5_other_users: {}
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: VERIFY CURRENT STATE
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[STEP 1] Checking current timeline events...');

    for (const email of cleanedUsers) {
      const events = await svc.entities.TimelineEvent.filter({ owner_email: email });
      
      report.step1_before_cleanup[email] = {
        count: events.length,
        eventIds: events.map(e => e.id),
        sample: events.slice(0, 3).map(e => ({
          id: e.id,
          event_type: e.event_type,
          lease_id: e.lease_id,
          created_at: e.created_date
        }))
      };

      console.log(`[STEP 1] ${email}: ${events.length} timeline events`);
      if (events.length > 0) {
        console.log(`[STEP 1] Event IDs:`, events.map(e => e.id));
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: DELETE ALL TIMELINE EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[STEP 2] Deleting timeline events...');

    let totalDeleted = 0;

    for (const email of cleanedUsers) {
      const events = await svc.entities.TimelineEvent.filter({ owner_email: email });
      
      console.log(`[STEP 2] [DELETING] ${events.length} events for ${email}`);
      
      const deleted = [];
      const failed = [];

      for (const event of events) {
        try {
          await svc.entities.TimelineEvent.delete(event.id);
          deleted.push(event.id);
          totalDeleted++;
          console.log(`[STEP 2]   ✅ Deleted event: ${event.id}`);
        } catch (error) {
          failed.push({ id: event.id, error: error.message });
          console.error(`[STEP 2]   ❌ Failed to delete event ${event.id}:`, error.message);
        }
      }

      report.step2_deletion_process[email] = {
        attempted: events.length,
        deleted: deleted.length,
        failed: failed.length,
        deletedIds: deleted,
        failedItems: failed
      };
    }

    console.log(`[STEP 2] Total timeline events deleted: ${totalDeleted}`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: CHECK FOR ORPHANED EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[STEP 3] Checking for orphaned timeline events...');

    // Get all remaining timeline events
    const allEvents = await svc.entities.TimelineEvent.list();
    console.log(`[STEP 3] Total timeline events in system: ${allEvents.length}`);

    // Get all existing leases
    const allLeases = await svc.entities.Lease.list();
    const leaseIds = new Set(allLeases.map(l => l.id));

    // Find orphaned events (events with lease_id but lease doesn't exist)
    const orphanedEvents = allEvents.filter(e => e.lease_id && !leaseIds.has(e.lease_id));

    report.step3_orphan_check = {
      totalEvents: allEvents.length,
      totalLeases: allLeases.length,
      orphanedEvents: orphanedEvents.length,
      orphanedSample: orphanedEvents.slice(0, 5).map(e => ({
        id: e.id,
        owner_email: e.owner_email,
        lease_id: e.lease_id,
        event_type: e.event_type
      }))
    };

    console.log(`[STEP 3] Found ${orphanedEvents.length} orphaned events`);

    // Delete orphaned events for cleaned users only
    let orphansDeleted = 0;
    for (const orphan of orphanedEvents) {
      if (cleanedUsers.includes(orphan.owner_email)) {
        try {
          await svc.entities.TimelineEvent.delete(orphan.id);
          orphansDeleted++;
          console.log(`[STEP 3]   ✅ Deleted orphaned event: ${orphan.id}`);
        } catch (error) {
          console.error(`[STEP 3]   ❌ Failed to delete orphan ${orphan.id}:`, error.message);
        }
      }
    }

    report.step3_orphan_check.orphansDeleted = orphansDeleted;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: VERIFY COMPLETE DELETION
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[STEP 4] Verifying deletion...');

    // Check steve.l
    const steveLEvents = await svc.entities.TimelineEvent.filter({ owner_email: 'steve.l@signa-consultants.com' });
    report.step4_after_cleanup.steve_l = {
      email: 'steve.l@signa-consultants.com',
      events: steveLEvents.length,
      status: steveLEvents.length === 0 ? '✅ CLEAN' : '❌ STILL HAS EVENTS',
      remainingIds: steveLEvents.map(e => e.id)
    };
    console.log(`[STEP 4] steve.l timeline events: ${steveLEvents.length}`);

    // Check steve.d
    const steveDEvents = await svc.entities.TimelineEvent.filter({ owner_email: 'steve.d.lockhart@gmail.com' });
    report.step4_after_cleanup.steve_d = {
      email: 'steve.d.lockhart@gmail.com',
      events: steveDEvents.length,
      status: steveDEvents.length === 0 ? '✅ CLEAN' : '❌ STILL HAS EVENTS',
      remainingIds: steveDEvents.map(e => e.id)
    };
    console.log(`[STEP 4] steve.d timeline events: ${steveDEvents.length}`);

    // Check shortyroc36 (should be preserved)
    const shortyEvents = await svc.entities.TimelineEvent.filter({ owner_email: 'shortyroc36@gmail.com' });
    report.step4_after_cleanup.shortyroc36 = {
      email: 'shortyroc36@gmail.com',
      events: shortyEvents.length,
      status: '✅ PRESERVED (not touched)',
      note: 'This user data should remain intact'
    };
    console.log(`[STEP 4] shortyroc36 timeline events: ${shortyEvents.length} (preserved)`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: CHECK OTHER USERS
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[STEP 5] Checking other users...');

    // Check pamperme
    const pampermeEvents = await svc.entities.TimelineEvent.filter({ owner_email: 'pamperme@editionsalon.com' });
    report.step5_other_users.pamperme = {
      email: 'pamperme@editionsalon.com',
      events: pampermeEvents.length,
      status: pampermeEvents.length === 0 ? '✅ CLEAN (expected)' : '⚠️ HAS EVENTS'
    };
    console.log(`[STEP 5] pamperme timeline events: ${pampermeEvents.length}`);

    // Summary
    const allRemainingEvents = await svc.entities.TimelineEvent.list();
    report.step5_other_users.system_total = {
      totalEvents: allRemainingEvents.length,
      breakdown: {}
    };

    // Count by user
    const eventsByUser = {};
    for (const event of allRemainingEvents) {
      const email = event.owner_email || 'unknown';
      eventsByUser[email] = (eventsByUser[email] || 0) + 1;
    }
    report.step5_other_users.system_total.breakdown = eventsByUser;

    return Response.json({
      ok: true,
      summary: {
        totalDeleted: totalDeleted,
        orphansDeleted: orphansDeleted,
        steve_l_clean: report.step4_after_cleanup.steve_l.events === 0,
        steve_d_clean: report.step4_after_cleanup.steve_d.events === 0,
        shortyroc36_preserved: true
      },
      report
    });

  } catch (error) {
    console.error('[CLEANUP_TIMELINE_ERROR]', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});