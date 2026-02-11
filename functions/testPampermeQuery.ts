import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Test 1: User-scoped query (what frontend does)
    let userLeases = [];
    let userError = null;
    try {
      userLeases = await base44.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" });
    } catch (e) {
      userError = e.message;
    }

    // Test 2: User-scoped list (no filter)
    let userListAll = [];
    let userListError = null;
    try {
      userListAll = await base44.entities.Lease.list();
    } catch (e) {
      userListError = e.message;
    }

    // Test 3: Service role query (bypasses RLS)
    const svc = base44.asServiceRole;
    let svcLeases = [];
    let svcError = null;
    try {
      svcLeases = await svc.entities.Lease.filter({ owner_email: "pamperme@editionsalon.com" });
    } catch (e) {
      svcError = e.message;
    }

    // Test 4: Service role - check created_by field
    let svcByCreator = [];
    let svcByCreatorError = null;
    try {
      svcByCreator = await svc.entities.Lease.filter({ created_by: "pamperme@editionsalon.com" });
    } catch (e) {
      svcByCreatorError = e.message;
    }

    return Response.json({
      caller: {
        email: user?.email,
        role: user?.role,
        id: user?.id
      },
      test1_user_filter_owner_email: {
        count: userLeases.length,
        ids: userLeases.map(l => l.id),
        error: userError
      },
      test2_user_list_all: {
        count: userListAll.length,
        ids: userListAll.map(l => l.id),
        error: userListError
      },
      test3_svc_filter_owner_email: {
        count: svcLeases.length,
        ids: svcLeases.map(l => l.id),
        firstLease: svcLeases[0] ? {
          id: svcLeases[0].id,
          owner_email: svcLeases[0].owner_email,
          created_by: svcLeases[0].created_by,
          status: svcLeases[0].status
        } : null,
        error: svcError
      },
      test4_svc_filter_created_by: {
        count: svcByCreator.length,
        ids: svcByCreator.map(l => l.id),
        firstLease: svcByCreator[0] ? {
          id: svcByCreator[0].id,
          owner_email: svcByCreator[0].owner_email,
          created_by: svcByCreator[0].created_by,
          status: svcByCreator[0].status
        } : null,
        error: svcByCreatorError
      }
    });
  } catch (e) {
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
});