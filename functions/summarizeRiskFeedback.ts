import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const feedback = await base44.asServiceRole.entities.RiskFeedback.list();
    const byCategory = new Map();
    feedback.forEach(fb => {
      const k = fb.category_id || 'UNSPECIFIED';
      const entry = byCategory.get(k) || { count: 0, samples: [] };
      entry.count += 1;
      if (entry.samples.length < 5 && fb.clause_ref?.snippet) entry.samples.push(fb.clause_ref.snippet.substring(0, 240));
      byCategory.set(k, entry);
    });

    const summary = Array.from(byCategory.entries()).map(([category_id, v]) => ({ category_id, count: v.count, samples: v.samples }));

    return Response.json({ success: true, generated_at: new Date().toISOString(), summary });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
});