import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const testEmails = [
      'signaconsultants@gmail.com',
      'testbase44andy@gmail.com',
      'contact@signahoteladvisors.com',
      'info@signature-thebeautydestination.com',
      'recruitbkkhotel@gmail.com',
      'dom.sources@gmail.com',
      'signaturehairandnail@gmail.com',
      'jay.p@signa-consultants.com',
      'signa.asset.management@gmail.com',
      'signaintelligence@gmail.com',
      'hello@usevain.com'
    ];

    const results = {
      leases: 0,
      scans: 0,
      deposits: 0,
      timeline_events: 0,
      storage: 0,
      errors: []
    };

    // Delete all leases
    const allLeases = await base44.asServiceRole.entities.Lease.list('-created_date', 200);
    for (const lease of allLeases) {
      if (testEmails.includes(lease.owner_email) || testEmails.includes(lease.created_by)) {
        try {
          await base44.asServiceRole.entities.Lease.delete(lease.id);
          results.leases++;
          console.log(`Deleted lease ${lease.id} (${lease.owner_email || lease.created_by})`);
        } catch (e) {
          results.errors.push(`Lease ${lease.id}: ${e.message}`);
        }
      }
    }

    // Delete all scans
    const allScans = await base44.asServiceRole.entities.LeaseScan.list('-created_date', 200);
    for (const scan of allScans) {
      if (testEmails.includes(scan.owner_email) || testEmails.includes(scan.created_by)) {
        try {
          await base44.asServiceRole.entities.LeaseScan.delete(scan.id);
          results.scans++;
          console.log(`Deleted scan ${scan.id}`);
        } catch (e) {
          results.errors.push(`Scan ${scan.id}: ${e.message}`);
        }
      }
    }

    // Delete all deposits
    const allDeposits = await base44.asServiceRole.entities.DepositTracker.list('-created_date', 200);
    for (const dep of allDeposits) {
      if (testEmails.includes(dep.owner_email) || testEmails.includes(dep.created_by)) {
        try {
          await base44.asServiceRole.entities.DepositTracker.delete(dep.id);
          results.deposits++;
          console.log(`Deleted deposit ${dep.id}`);
        } catch (e) {
          results.errors.push(`Deposit ${dep.id}: ${e.message}`);
        }
      }
    }

    // Delete all timeline events
    const allEvents = await base44.asServiceRole.entities.TimelineEvent.list('-created_date', 500);
    for (const evt of allEvents) {
      if (testEmails.includes(evt.owner_email) || testEmails.includes(evt.created_by)) {
        try {
          await base44.asServiceRole.entities.TimelineEvent.delete(evt.id);
          results.timeline_events++;
          console.log(`Deleted event ${evt.id}`);
        } catch (e) {
          results.errors.push(`Event ${evt.id}: ${e.message}`);
        }
      }
    }

    // Delete storage records
    const allStorage = await base44.asServiceRole.entities.UserStorage.list('-created_date', 200);
    for (const s of allStorage) {
      if (testEmails.includes(s.user_email) || testEmails.includes(s.created_by)) {
        try {
          await base44.asServiceRole.entities.UserStorage.delete(s.id);
          results.storage++;
          console.log(`Deleted storage ${s.id}`);
        } catch (e) {
          results.errors.push(`Storage ${s.id}: ${e.message}`);
        }
      }
    }

    // Final verification
    const remainingLeases = await base44.asServiceRole.entities.Lease.list('-created_date', 200);
    const remainingScans = await base44.asServiceRole.entities.LeaseScan.list('-created_date', 200);
    const remainingDeposits = await base44.asServiceRole.entities.DepositTracker.list('-created_date', 200);
    const remainingEvents = await base44.asServiceRole.entities.TimelineEvent.list('-created_date', 500);
    const remainingStorage = await base44.asServiceRole.entities.UserStorage.list('-created_date', 200);

    return Response.json({
      status: 'cleanup_complete',
      deleted: results,
      remaining: {
        leases: remainingLeases.length,
        scans: remainingScans.length,
        deposits: remainingDeposits.length,
        timeline_events: remainingEvents.length,
        storage: remainingStorage.length
      },
      remaining_details: {
        lease_owners: remainingLeases.map(l => ({ id: l.id, owner: l.owner_email, created_by: l.created_by })),
        scan_owners: remainingScans.map(s => ({ id: s.id, owner: s.owner_email, created_by: s.created_by })),
      }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});