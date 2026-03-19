import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Deletes a lease and cascades to related records (scans, deposits, timeline, maintenance).
 * Uses asServiceRole for all entity operations to avoid RLS issues.
 */
Deno.serve(async (req) => {
  const correlationId = `delete-lease-${Date.now()}`;

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaseId } = await req.json();

    if (!leaseId) {
      return Response.json({ error: 'Missing leaseId' }, { status: 400 });
    }

    console.log(`[${correlationId}] Deleting lease`, { leaseId, userEmail: user.email });

    const svc = base44.asServiceRole;

    // Get the lease
    const lease = await svc.entities.Lease.get(leaseId);

    if (!lease) {
      return Response.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Ownership check: user must own the lease or be admin
    const userRole = user.role?.toLowerCase();
    const accessLevel = user.access_level?.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || accessLevel === 'admin' || accessLevel === 'super_admin';

    if (lease.owner_email !== user.email && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fileSize = lease.file_size_bytes || 0;

    // Fetch all related records in parallel
    const [leaseScans, depositsByLeaseId, maintenanceRequests, timelineByLeaseId] = await Promise.all([
      svc.entities.LeaseScan.filter({ lease_id: leaseId }),
      svc.entities.DepositTracker.filter({ lease_id: leaseId }),
      svc.entities.MaintenanceRequest.filter({ lease_id: leaseId }),
      svc.entities.TimelineEvent.filter({ lease_id: leaseId }),
    ]);

    console.log(`[${correlationId}] Related records:`, {
      scans: leaseScans.length,
      deposits: depositsByLeaseId.length,
      maintenance: maintenanceRequests.length,
      timeline: timelineByLeaseId.length,
    });

    // Delete all related records in parallel batches
    const deleteOps = [
      ...leaseScans.map(s => svc.entities.LeaseScan.delete(s.id)),
      ...depositsByLeaseId.map(d => svc.entities.DepositTracker.delete(d.id)),
      ...maintenanceRequests.map(m => svc.entities.MaintenanceRequest.delete(m.id)),
      ...timelineByLeaseId.map(t => svc.entities.TimelineEvent.delete(t.id)),
    ];

    await Promise.all(deleteOps);
    console.log(`[${correlationId}] Related records deleted`);

    // Delete the lease itself
    await svc.entities.Lease.delete(leaseId);
    console.log(`[${correlationId}] Lease deleted`);

    // Decrement storage (non-blocking)
    if (fileSize > 0) {
      svc.functions.invoke('updateStorageUsage', { bytesAdded: -fileSize })
        .then(() => console.log(`[${correlationId}] Storage decremented: ${fileSize}`))
        .catch(err => console.warn(`[${correlationId}] Storage decrement failed (non-blocking):`, err.message));
    }

    return Response.json({
      success: true,
      deleted: {
        lease: 1,
        scans: leaseScans.length,
        deposits: depositsByLeaseId.length,
        maintenance: maintenanceRequests.length,
        timeline: timelineByLeaseId.length,
      },
      storageFreed: fileSize,
      correlationId,
    });

  } catch (error) {
    console.error(`[${correlationId}] DELETE_LEASE_ERROR`, {
      message: error.message,
      stack: error.stack,
    });

    return Response.json({
      success: false,
      error: error.message,
      correlationId,
    }, { status: 500 });
  }
});