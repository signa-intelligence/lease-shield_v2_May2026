import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Resolves a private file_uri into a short-lived signed URL,
 * AFTER verifying the authenticated caller owns the parent record.
 *
 * Body: { entity: 'Document'|'Lease'|'Case', id: string, field: string, index?: number, expiresIn?: number }
 *  - field: which property on the record holds the uri (e.g. 'file_uri', 'file_uris', 'letter_pack_uri', 'letters.deposit_uri')
 *  - index: array index when field is an array (e.g. file_uris)
 *
 * Returns: { signed_url, expires_in } or an error.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity, id, field, index, expiresIn } = await req.json();
    if (!entity || !id || !field) {
      return Response.json({ error: 'entity, id and field are required' }, { status: 400 });
    }

    const ALLOWED = ['Document', 'Lease', 'Case'];
    if (!ALLOWED.includes(entity)) {
      return Response.json({ error: 'Unsupported entity' }, { status: 400 });
    }

    // Fetch the record with service role so we can run our own ownership check
    const rows = await base44.asServiceRole.entities[entity].filter({ id });
    const record = rows?.[0];
    if (!record) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    // ---- OWNERSHIP CHECK ----
    const role = (user.role || user.access_level || '').toLowerCase();
    const isAdminLike = ['admin', 'super_admin', 'va'].includes(role);
    const ownerFields = [record.created_by, record.owner_email, record.user_email]
      .filter(Boolean)
      .map((e) => String(e).toLowerCase());
    const isOwner = ownerFields.includes(String(user.email).toLowerCase());
    if (!isAdminLike && !isOwner) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ---- Resolve the uri value from the (optionally nested) field ----
    let container = record;
    const parts = field.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      container = container?.[parts[i]] ?? {};
    }
    const leaf = parts[parts.length - 1];
    let uri = container?.[leaf];
    if (Array.isArray(uri)) {
      uri = uri[Number(index) || 0];
    }

    if (!uri || typeof uri !== 'string') {
      return Response.json({ error: 'No private file_uri on this field' }, { status: 404 });
    }

    const seconds = Math.min(Math.max(Number(expiresIn) || 300, 60), 3600);
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: uri,
      expires_in: seconds
    });

    return Response.json({ signed_url, expires_in: seconds });
  } catch (error) {
    console.error('resolveFileUrl error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});