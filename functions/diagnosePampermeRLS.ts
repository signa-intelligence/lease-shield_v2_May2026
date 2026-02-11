import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  // Allow admin OR pamperme herself to run this
  const isPamperme = user?.email === 'pamperme@editionsalon.com';
  const isAdmin = user?.role === 'admin';
  
  if (!isPamperme && !isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const svc = base44.asServiceRole;
  const targetEmail = 'pamperme@editionsalon.com';
  
  // 1. Service role query (bypasses RLS) - ground truth
  const svcLeases = await svc.entities.Lease.filter({ owner_email: targetEmail });
  
  // 2. User-scoped query (goes through RLS) - this is what pamperme sees
  let userLeases = [];
  let userLeaseError = null;
  try {
    userLeases = await base44.entities.Lease.filter({ owner_email: targetEmail });
  } catch (e) {
    userLeaseError = e.message;
  }
  
  // 3. User-scoped list (no filter) - what does .list() return?
  let userList = [];
  let userListError = null;
  try {
    userList = await base44.entities.Lease.list('-created_date', 20);
  } catch (e) {
    userListError = e.message;
  }
  
  // 4. Inspect each lease record's RLS-relevant fields
  const leaseDetails = svcLeases.map(l => ({
    id: l.id,
    owner_email: l.owner_email,
    created_by: l.created_by,
    status: l.status,
    original_filename: l.original_filename,
    created_date: l.created_date,
  }));
  
  // 5. Also check: what user identity does the SDK see?
  let meData = null;
  try {
    meData = { email: user.email, role: user.role, id: user.id };
  } catch (e) {
    meData = { error: e.message };
  }
  
  return Response.json({
    caller: meData,
    service_role_lease_count: svcLeases.length,
    user_scoped_filter_count: userLeases.length,
    user_scoped_filter_error: userLeaseError,
    user_scoped_list_count: userList.length,
    user_scoped_list_error: userListError,
    user_scoped_list_ids: userList.map(l => l.id),
    lease_details_from_service_role: leaseDetails,
  });
});