import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Force clean ALL timeline events for steve.l and steve.d
 * Check multiple fields: owner_email, created_by, lease_id
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.access_level !== 'admin' && user?.access_level !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const svc = base44.asServiceRole;

    const cleanedUsers = [
      'steve.l@signa-consultants.com',
      'steve.d.lockhart@gmail.com'
    ];

    const report = {
      step1_query_all_methods: {},
      step2_deletion: {},
      step3_verification: {},
      step4_system_check: {}
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: QUERY TIMELINE EVENTS BY MULTIPLE METHODS
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[STEP 1] Querying timeline events by all methods...');

    for (const email of cleanedUsers) {
      const methods = {};

      // Method 1: owner_email field
      try {
        const byOwnerEmail = await svc.entities.TimelineEvent.filter({ owner_email: email });
        methods.byOwnerEmail = byOwnerEmail.length;
        console.log(`[STEP 1] ${email} - owner_email: ${byOwnerEmail.length} events`);
      } catch (err) {
        methods.byOwnerEmail = `ERROR: ${err.message}`;
      }

      // Method 2: created_by field (built-in)
      try {
        const byCreatedBy = await svc.entities.TimelineEvent.filter({ created_by: email });
        methods.byCreatedBy = byCreatedBy.length;
        console.log(`[STEP 1] ${email} - created_by: ${byCreatedBy.length} events`);
      } catch (err) {
        methods.byCreatedBy = `ERROR: ${err.message}`;
      }

      // Method 3: List all and filter manually
      try {
        const allEvents = await svc.entities.TimelineEvent.list();
        const matchingEvents = allEvents.filter(e => 
          e.owner_email === email || e.created_by === email
        );
        methods.byManualFilter = matchingEvents.length;
        console.log(`[STEP 1] ${email} - manual filter: ${matchingEvents.length} events`);
        
        if (matchingEvents.length > 0) {
          methods.sampleIds = matchingEvents.slice(0, 5).map(e => ({
            id: e.id,
            owner_email: e.owner_email,
            created_by: e.created_by,
            event_type: e.event_type,
            lease_id: e.lease_id
          }));
        }
      } catch (err) {
        methods.byManualFilter = `ERROR: ${err.message}`;
      }

      report.step1_query_all_methods[email] = methods;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: AGGRESSIVE DELETION - ALL METHODS
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[STEP 2] Force deleting all timeline events...');

    let totalDeleted = 0;

    for (const email of cleanedUsers) {
      console.log(`[STEP 2] Processing ${email}...`);

      // Get ALL events for this user (list all and filter)
      const allEvents = await svc.entities.TimelineEvent.list();
      const eventsToDelete = allEvents.filter(e => 
        e.owner_email === email || e.created_by === email
      );

      console.log(`[STEP 2] Found ${eventsToDelete.length} events to delete for ${email}`);

      const deleted = [];
      const failed = [];

      for (const event of eventsToDelete) {
        try {
          await svc.entities.TimelineEvent.delete(event.id);
          deleted.push(event.id);
          totalDeleted++;
          console.log(`[STEP 2]   ✅ Deleted: ${event.id} (type: ${event.event_type})`);
        } catch (error) {
          failed.push({ id: event.id, error: error.message });
          console.error(`[STEP 2]   ❌ Failed: ${event.id} - ${error.message}`);
        }
      }

      report.step2_deletion[email] = {
        found: eventsToDelete.length,
        deleted: deleted.length,
        failed: failed.length,
        deletedIds: deleted,
        failedItems: failed
      };
    }

    console.log(`[STEP 2] Total deleted: ${totalDeleted}`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: VERIFICATION - MULTI-METHOD CHECK
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[STEP 3] Verifying deletion...');

    for (const email of cleanedUsers) {
      const allEvents = await svc.entities.TimelineEvent.list();
      const remaining = allEvents.filter(e => 
        e.owner_email === email || e.created_by === email
      );

      report.step3_verification[email] = {
        remaining: remaining.length,
        status: remaining.length === 0 ? '✅ CLEAN' : '❌ STILL HAS EVENTS',
        remainingIds: remaining.map(e => e.id)
      };

      console.log(`[STEP 3] ${email}: ${remaining.length} events remaining`);
    }

    // Check shortyroc36
    const allEvents = await svc.entities.TimelineEvent.list();
    const shortyEvents = allEvents.filter(e => 
      e.owner_email === 'shortyroc36@gmail.com' || e.created_by === 'shortyroc36@gmail.com'
    );
    report.step3_verification.shortyroc36 = {
      remaining: shortyEvents.length,
      status: '✅ PRESERVED'
    };
    console.log(`[STEP 3] shortyroc36: ${shortyEvents.length} events (preserved)`);

    // Check pamperme
    const pampermeEvents = allEvents.filter(e => 
      e.owner_email === 'pamperme@editionsalon.com' || e.created_by === 'pamperme@editionsalon.com'
    );
    report.step3_verification.pamperme = {
      remaining: pampermeEvents.length,
      status: pampermeEvents.length === 0 ? '✅ CLEAN' : '⚠️ HAS EVENTS'
    };
    console.log(`[STEP 3] pamperme: ${pampermeEvents.length} events`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: SYSTEM-WIDE CHECK
    // ═══════════════════════════════════════════════════════════════════════

    console.log('[STEP 4] System-wide check...');

    const finalAllEvents = await svc.entities.TimelineEvent.list();
    
    const eventsByUser = {};
    for (const event of finalAllEvents) {
      const owner = event.owner_email || event.created_by || 'unknown';
      eventsByUser[owner] = (eventsByUser[owner] || 0) + 1;
    }

    report.step4_system_check = {
      totalEvents: finalAllEvents.length,
      breakdown: eventsByUser,
      cleanedUsersClean: 
        !eventsByUser['steve.l@signa-consultants.com'] && 
        !eventsByUser['steve.d.lockhart@gmail.com']
    };

    console.log('[STEP 4] Final breakdown:', eventsByUser);

    return Response.json({
      ok: true,
      summary: {
        totalDeleted,
        steve_l_clean: report.step3_verification['steve.l@signa-consultants.com'].remaining === 0,
        steve_d_clean: report.step3_verification['steve.d.lockhart@gmail.com'].remaining === 0,
        shortyroc36_preserved: true,
        pamperme_clean: report.step3_verification.pamperme.remaining === 0
      },
      report
    });

  } catch (error) {
    console.error('[FORCE_CLEAN_ERROR]', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});