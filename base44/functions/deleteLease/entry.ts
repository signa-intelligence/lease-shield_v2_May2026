import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Soft-deletes a lease by archiving it and all related records
 * Sets status to 'deleted' and is_archived flags
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
    
    console.log('[DELETE_LEASE_START]', { 
      leaseId,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });
    
    console.log(`[${correlationId}] Soft-deleting lease and moving to RecycleBin`, {
      leaseId,
      userEmail: user.email
    });

    if (!leaseId) {
      return Response.json({ 
        error: 'Missing leaseId'
      }, { status: 400 });
    }

    // CRITICAL: Use service role for updates but user context for RecycleBin (RLS)
    const svc = base44.asServiceRole || base44;

    // Get the lease first
    const leaseArr = await base44.entities.Lease.filter({ id: leaseId });
    const lease = leaseArr?.[0];
    
    if (!lease) {
      return Response.json({ error: 'Lease not found' }, { status: 404 });
    }
    
    // Track file size for storage decrement
    const fileSize = lease.file_size_bytes || 0;
    const ownerEmail = lease.owner_email;
    
    console.log('[DELETE_LEASE_STORAGE]', {
      leaseId,
      fileSize,
      ownerEmail
    });

    // Get and archive related deposit trackers (by lease_id AND property_address)
    const depositsByLeaseId = await svc.entities.DepositTracker.filter({ lease_id: leaseId });
    const depositsByAddress = lease.property_address 
      ? await svc.entities.DepositTracker.filter({ property_address: lease.property_address })
      : [];

    // Deduplicate deposits
    const allDeposits = [...depositsByLeaseId, ...depositsByAddress].filter((v, i, a) => 
      a.findIndex(t => t.id === v.id) === i
    );

    for (const deposit of allDeposits) {
      await svc.entities.DepositTracker.update(deposit.id, {
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Get and archive related maintenance requests
    const maintenanceRequests = await svc.entities.MaintenanceRequest.filter({
      lease_id: leaseId
    });

    for (const request of maintenanceRequests) {
      await svc.entities.MaintenanceRequest.update(request.id, {
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // Archive related timeline events (by lease_id AND property_address)
    const timelineByLeaseId = await svc.entities.TimelineEvent.filter({ lease_id: leaseId });
    const timelineByAddress = lease.property_address
      ? await svc.entities.TimelineEvent.filter({ property_address: lease.property_address })
      : [];

    // Deduplicate events
    const allTimelineEvents = [...timelineByLeaseId, ...timelineByAddress].filter((v, i, a) => 
      a.findIndex(t => t.id === v.id) === i
    );

    for (const event of allTimelineEvents) {
      await svc.entities.TimelineEvent.update(event.id, {
        is_archived: true,
        archived_at: new Date().toISOString()
      });
    }

    // CASCADE DELETE: Delete ALL related timeline events (by lease_id AND property_address)
    console.log(`[${correlationId}] [DELETE_TIMELINE_START]`, { count: allTimelineEvents.length });
    try {
      for (const event of allTimelineEvents) {
        await svc.entities.TimelineEvent.delete(event.id);
      }
      console.log(`[${correlationId}] [DELETE_TIMELINE_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_TIMELINE_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    // CASCADE DELETE: Delete ALL related deposits (by lease_id AND property_address)
    console.log(`[${correlationId}] [DELETE_DEPOSITS_START]`, { count: allDeposits.length });
    try {
      for (const deposit of allDeposits) {
        await svc.entities.DepositTracker.delete(deposit.id);
      }
      console.log(`[${correlationId}] [DELETE_DEPOSITS_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_DEPOSITS_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    // CASCADE DELETE: Delete lease scans
    const leaseScans = await svc.entities.LeaseScan.filter({ lease_id: leaseId });
    console.log(`[${correlationId}] [DELETE_SCANS_START]`, { count: leaseScans.length });
    try {
      for (const scan of leaseScans) {
        await svc.entities.LeaseScan.delete(scan.id);
      }
      console.log(`[${correlationId}] [DELETE_SCANS_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_SCANS_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    // CASCADE DELETE: Delete rent payments linked to the deleted deposits (RentPayment links via deposit_tracker_id, not lease_id)
    let rentPayments = [];
    for (const deposit of allDeposits) {
      const payments = await svc.entities.RentPayment.filter({ deposit_tracker_id: deposit.id });
      rentPayments = [...rentPayments, ...payments];
    }
    console.log(`[${correlationId}] [DELETE_RENT_PAYMENTS_START]`, { count: rentPayments.length });
    try {
      for (const payment of rentPayments) {
        await svc.entities.RentPayment.delete(payment.id);
      }
      console.log(`[${correlationId}] [DELETE_RENT_PAYMENTS_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_RENT_PAYMENTS_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    // CASCADE DELETE: Delete notification logs by lease_id
    const notifications = await svc.entities.NotificationLog.filter({ lease_id: leaseId });
    console.log(`[${correlationId}] [DELETE_NOTIFICATIONS_START]`, { count: notifications.length });
    try {
      for (const notification of notifications) {
        await svc.entities.NotificationLog.delete(notification.id);
      }
      console.log(`[${correlationId}] [DELETE_NOTIFICATIONS_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_NOTIFICATIONS_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    // CASCADE DELETE: Delete lease itself
    console.log(`[${correlationId}] [DELETE_LEASE_START]`, { leaseId });
    try {
      await svc.entities.Lease.delete(leaseId);
      console.log(`[${correlationId}] [DELETE_LEASE_DONE]`);
    } catch (err) {
      console.error(`[${correlationId}] [DELETE_LEASE_FAILED]`, { error: err.message, stack: err.stack });
      throw err;
    }

    // Decrement storage usage after successful deletion
    if (fileSize > 0 && ownerEmail) {
      try {
        await svc.functions.invoke('updateStorageUsage', {
          bytesAdded: -fileSize
        });
        console.log(`[${correlationId}] [STORAGE_DECREMENTED]`, { bytesRemoved: fileSize });
      } catch (storageErr) {
        console.warn(`[${correlationId}] [STORAGE_DECREMENT_FAILED]`, storageErr);
        // Non-blocking - continue even if storage update fails
      }
    }
    
    console.log(`[${correlationId}] Successfully deleted lease and cascaded records`, {
      deposits: allDeposits.length,
      maintenance: maintenanceRequests.length,
      timeline: allTimelineEvents.length,
      scans: leaseScans.length,
      rentPayments: rentPayments.length,
      notifications: notifications.length,
      storageFreed: fileSize
    });

    return Response.json({
      success: true,
      deleted: {
        lease: 1,
        deposits: allDeposits.length,
        maintenance: maintenanceRequests.length,
        timeline: allTimelineEvents.length,
        scans: leaseScans.length,
        rentPayments: rentPayments.length,
        notifications: notifications.length
      },
      storageFreed: fileSize,
      correlationId
    });

  } catch (error) {
    console.error('[DELETE_LEASE_ERROR_DETAILED]', {
      correlationId,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code,
      errorName: error.name,
      fullError: String(error)
    });
    
    return Response.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      correlationId
    }, { status: 500 });
  }
});