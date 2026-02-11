import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  
  const svc = base44.asServiceRole;
  const targetEmail = 'pamperme@editionsalon.com';
  
  // Get all pamperme leases via service role - inspect EVERY field
  const svcLeases = await svc.entities.Lease.filter({ owner_email: targetEmail });
  
  // Dump raw fields that matter for RLS
  const leaseRLSData = svcLeases.map(l => ({
    id: l.id,
    owner_email: l.owner_email,
    created_by: l.created_by,  // THIS is what we need to see
    created_by_type: typeof l.created_by,
    created_by_is_null: l.created_by === null,
    created_by_is_undefined: l.created_by === undefined,
    created_by_is_empty: l.created_by === '',
    status: l.status,
    created_date: l.created_date,
  }));

  // Get Lease entity schema/RLS definition
  let leaseSchema = null;
  try {
    leaseSchema = await svc.entities.Lease.schema();
  } catch(e) {
    leaseSchema = { error: e.message };
  }

  // Now simulate what pamperme's frontend does:
  // The Dashboard fetches leases with filter({ owner_email: user.email })
  // But RLS says: read requires owner_email === {{user.email}} OR admin
  // If owner_email matches "pamperme@editionsalon.com" and user.email is "pamperme@editionsalon.com"
  // it SHOULD return results. Unless the RLS comparison is case-sensitive or there's whitespace.
  
  // Check for invisible characters
  const ownerEmails = svcLeases.map(l => ({
    id: l.id,
    owner_email_raw: JSON.stringify(l.owner_email),
    owner_email_length: l.owner_email?.length,
    expected_length: targetEmail.length,
    exact_match: l.owner_email === targetEmail,
    trimmed_match: l.owner_email?.trim() === targetEmail.trim(),
    lowercase_match: l.owner_email?.toLowerCase() === targetEmail.toLowerCase(),
  }));

  return Response.json({
    lease_count: svcLeases.length,
    lease_rls_data: leaseRLSData,
    owner_email_analysis: ownerEmails,
  });
});