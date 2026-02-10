import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyText = await req.text();
    let payload = {};
    try { payload = JSON.parse(bodyText || '{}'); } catch (_) { payload = {}; }

    const targetEmail = payload.targetEmail || user.email;

    // Test 1: User-scoped query (what the frontend does)
    let userScopedDeposits = [];
    let userScopedError = null;
    try {
      userScopedDeposits = await base44.entities.DepositTracker.filter({ owner_email: targetEmail });
    } catch (e) {
      userScopedError = e.message;
    }

    // Test 2: User-scoped list (no filter)
    let userScopedList = [];
    let userScopedListError = null;
    try {
      userScopedList = await base44.entities.DepositTracker.list();
    } catch (e) {
      userScopedListError = e.message;
    }

    // Test 3: Service role query
    let serviceDeposits = [];
    let serviceError = null;
    try {
      serviceDeposits = await base44.asServiceRole.entities.DepositTracker.filter({ owner_email: targetEmail });
    } catch (e) {
      serviceError = e.message;
    }

    // Test 4: Timeline events
    let userTimeline = [];
    let timelineError = null;
    try {
      userTimeline = await base44.entities.TimelineEvent.filter({ owner_email: targetEmail });
    } catch (e) {
      timelineError = e.message;
    }

    // Test 5: Leases
    let userLeases = [];
    let leasesError = null;
    try {
      userLeases = await base44.entities.Lease.filter({ owner_email: targetEmail });
    } catch (e) {
      leasesError = e.message;
    }

    return Response.json({
      ok: true,
      callerEmail: user.email,
      callerRole: user.role,
      targetEmail,
      tests: {
        userScopedFilter: {
          count: userScopedDeposits.length,
          error: userScopedError,
          ids: userScopedDeposits.map(d => d.id),
          ownerEmails: userScopedDeposits.map(d => d.owner_email)
        },
        userScopedList: {
          count: userScopedList.length,
          error: userScopedListError,
          ids: userScopedList.map(d => d.id)
        },
        serviceRoleFilter: {
          count: serviceDeposits.length,
          error: serviceError,
          ids: serviceDeposits.map(d => d.id),
          ownerEmails: serviceDeposits.map(d => d.owner_email)
        },
        timelineEvents: {
          count: userTimeline.length,
          error: timelineError
        },
        leases: {
          count: userLeases.length,
          error: leasesError
        }
      }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});