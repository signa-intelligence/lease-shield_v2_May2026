import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function sanitizeText(input, max){
  if (!input) return '';
  const s = String(input);
  return s.length > max ? s.slice(0, max) : s;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const body = await req.json();
    const { leaseId, scanId, payload } = body || {};

    if (!leaseId || !scanId) {
      return Response.json({ success:false, error: 'Missing leaseId or scanId' }, { status: 400 });
    }

    const category = sanitizeText(payload?.category, 64);
    const clause_text = sanitizeText(payload?.clause_text, 4000);
    const note = sanitizeText(payload?.note, 2000);
    const app_language = sanitizeText(payload?.app_language, 10) || 'en';
    const lease_language_detected = sanitizeText(payload?.lease_language_detected, 10);

    if (!category) {
      return Response.json({ success:false, error: 'Category is required' }, { status: 400 });
    }

    // Rate limit: max 5 per day per user or anonymous per scan
    const who = user?.email || 'anon';
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const existing = await base44.entities.RiskFeedback.filter({ scan_id: scanId, user_id: user?.id || undefined, created_date: { $gte: from } });
    if (Array.isArray(existing) && existing.length >= 5) {
      return Response.json({ success:false, error: 'Rate limit exceeded. Please try tomorrow.' }, { status: 429 });
    }

    const record = await base44.entities.RiskFeedback.create({
      lease_id: leaseId,
      scan_id: scanId,
      user_id: user?.id || null,
      feedback_type: 'MISSED_RISK',
      category_id: category,
      clause_ref: clause_text ? { clause_id: 'MANUAL', page: null, snippet: clause_text.slice(0, 240) } : undefined,
      note: note || null,
      status: 'NEW',
      app_language,
      lease_language_detected
    });

    try {
      await base44.functions.invoke('logAuditEvent', { event: 'RiskFeedbackSubmitted', meta: { leaseId, scanId, category, user: who, id: record?.id } });
    } catch (_) {}

    return Response.json({ success: true, id: record?.id });
  } catch (error) {
    try {
      const base44 = createClientFromRequest(req);
      await base44.functions.invoke('logAuditEvent', { event: 'submitRiskFeedbackError', meta: { message: error?.message, stack: (error?.stack||'').slice(0,500) } });
    } catch (_) {}
    return Response.json({ success:false, error: error?.message || 'Server error' }, { status: 500 });
  }
});