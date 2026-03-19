import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Admin function to reset a test user:
 * - Delete all leases and cascaded records (scans, deposits, timeline events)
 * - Restore available_scans to plan limit
 */
Deno.serve(async (req) => {
  const correlationId = `reset-user-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userEmail, restoreScanCount } = await req.json();

    if (!userEmail) {
      return Response.json({ 
        error: 'Missing userEmail' 
      }, { status: 400 });
    }

    console.log(`[${correlationId}] Resetting user: ${userEmail}`);
    const svc = base44.asServiceRole;

    // Find the user
    const users = await svc.entities.User.filter({ email: userEmail });
    if (!users || users.length === 0) {
      return Response.json({ 
        error: `User not found: ${userEmail}` 
      }, { status: 404 });
    }

    const targetUser = users[0];
    console.log(`[${correlationId}] Found user:`, {
      id: targetUser.id,
      email: targetUser.email,
      tier: targetUser.plan_tier
    });

    // Delete all leases for this user (cascade deletes deposits, scans, timeline)
    const leases = await svc.entities.Lease.filter({ owner_email: userEmail });
    console.log(`[${correlationId}] Found ${leases.length} leases to delete`);

    let deletedCount = 0;
    for (const lease of leases) {
      try {
        await svc.entities.Lease.delete(lease.id);
        deletedCount++;
        console.log(`[${correlationId}] Deleted lease: ${lease.id}`);
      } catch (err) {
        console.error(`[${correlationId}] Failed to delete lease ${lease.id}:`, err.message);
      }
    }

    // Reset available_scans based on plan
    let scansToRestore = 1; // Default to 1 (free tier)
    
    if (restoreScanCount !== undefined) {
      scansToRestore = restoreScanCount;
    } else if (targetUser.plan_tier === 'lite') {
      scansToRestore = 6;
    } else if (targetUser.plan_tier === 'protect') {
      scansToRestore = 12;
    } else if (targetUser.plan_tier === 'secure') {
      scansToRestore = 999;
    }

    console.log(`[${correlationId}] Restoring scans to: ${scansToRestore}`);
    
    await svc.entities.User.update(targetUser.id, {
      available_scans: scansToRestore
    });

    console.log(`[${correlationId}] Reset complete`);

    return Response.json({
      success: true,
      user: {
        email: userEmail,
        tier: targetUser.plan_tier
      },
      deleted: {
        leases: deletedCount
      },
      restored: {
        available_scans: scansToRestore
      },
      correlationId
    });

  } catch (error) {
    console.error(`[${correlationId}] Error:`, error.message);
    return Response.json({
      error: error.message,
      correlationId
    }, { status: 500 });
  }
});