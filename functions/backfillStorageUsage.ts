import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ONE-TIME BACKFILL: Calculate and update storage usage for existing leases
 * Estimates file sizes for leases uploaded before storage tracking was implemented
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only function
    if (user?.role !== 'admin' && user?.access_level !== 'admin' && user?.access_level !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'userEmail is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // Get all leases for user
    const leases = await svc.entities.Lease.filter({
      owner_email: userEmail,
      status: { $ne: 'deleted' }
    });

    console.log(`[BACKFILL] Found ${leases.length} leases for ${userEmail}`);

    if (leases.length === 0) {
      return Response.json({
        ok: true,
        message: 'No leases found',
        userEmail,
        leasesProcessed: 0,
        totalBytes: 0
      });
    }

    let totalBytes = 0;
    let filesWithSizes = 0;
    let filesWithoutSizes = 0;
    const estimatedSizes = [];

    // Process each lease
    for (const lease of leases) {
      if (lease.file_size_bytes && lease.file_size_bytes > 0) {
        // Already has size recorded
        totalBytes += lease.file_size_bytes;
        filesWithSizes++;
        console.log(`[BACKFILL] Lease ${lease.id}: ${lease.file_size_bytes} bytes (already tracked)`);
      } else {
        // Estimate size based on typical PDF sizes
        // Average lease PDF: 200KB - 2MB depending on pages
        const pageCount = lease.file_urls?.length || 1;
        const estimatedSize = pageCount * 500 * 1024; // 500KB per page estimate

        // Update lease with estimated size
        await svc.entities.Lease.update(lease.id, {
          file_size_bytes: estimatedSize
        });

        totalBytes += estimatedSize;
        filesWithoutSizes++;
        estimatedSizes.push({
          leaseId: lease.id,
          filename: lease.original_filename,
          pages: pageCount,
          estimatedBytes: estimatedSize
        });

        console.log(`[BACKFILL] Lease ${lease.id}: ${estimatedSize} bytes (ESTIMATED - ${pageCount} pages)`);
      }
    }

    // Get user record for tier
    const userRecord = await svc.entities.User.filter({ email: userEmail });
    const userTier = userRecord[0]?.plan_tier || 'free';

    // Define tier limits
    const TIER_LIMITS = {
      free: 100 * 1024 * 1024,        // 100MB
      lite: 1024 * 1024 * 1024,        // 1GB
      protect: 5 * 1024 * 1024 * 1024, // 5GB
      secure: 20 * 1024 * 1024 * 1024  // 20GB
    };

    const limitBytes = TIER_LIMITS[userTier] || TIER_LIMITS.free;

    // Create or update UserStorage record
    const existingStorage = await svc.entities.UserStorage.filter({
      user_email: userEmail
    });

    if (existingStorage.length === 0) {
      // Create new storage record
      await svc.entities.UserStorage.create({
        user_email: userEmail,
        user_id: userRecord[0]?.id || user.id,
        total_bytes: totalBytes,
        tier_limit_bytes: limitBytes,
        files_count: leases.length,
        last_updated: new Date().toISOString()
      });

      console.log(`[BACKFILL] Created UserStorage for ${userEmail}: ${totalBytes} bytes, ${leases.length} files`);
    } else {
      // Update existing record
      await svc.entities.UserStorage.update(existingStorage[0].id, {
        total_bytes: totalBytes,
        files_count: leases.length,
        tier_limit_bytes: limitBytes,
        last_updated: new Date().toISOString()
      });

      console.log(`[BACKFILL] Updated UserStorage for ${userEmail}: ${totalBytes} bytes, ${leases.length} files`);
    }

    return Response.json({
      ok: true,
      userEmail,
      tier: userTier,
      leasesProcessed: leases.length,
      filesWithSizes,
      filesWithoutSizes,
      estimatedSizes,
      totalBytes,
      totalMB: Math.round(totalBytes / (1024 * 1024) * 100) / 100,
      limitMB: Math.round(limitBytes / (1024 * 1024)),
      usagePercent: Math.round((totalBytes / limitBytes) * 100)
    });

  } catch (error) {
    console.error('[BACKFILL_ERROR]', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});