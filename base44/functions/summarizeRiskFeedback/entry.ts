import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled automations have no user session — skip auth check for those.
    // Manual invocations still require admin.
    let isScheduled = false;
    try {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      // No user session = scheduled automation
      isScheduled = true;
    }

    // Fetch only recent feedback (last 7 days) to avoid timeout on large datasets
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const feedback = await base44.asServiceRole.entities.RiskFeedback.filter(
      { created_date: { $gte: sevenDaysAgo } },
      '-created_date',
      200
    );

    const byCategory = new Map();
    feedback.forEach(fb => {
      const k = fb.category_id || 'UNSPECIFIED';
      const entry = byCategory.get(k) || { count: 0, samples: [] };
      entry.count += 1;
      if (entry.samples.length < 5 && fb.clause_ref?.snippet) {
        entry.samples.push(fb.clause_ref.snippet.substring(0, 240));
      }
      byCategory.set(k, entry);
    });

    const summary = Array.from(byCategory.entries()).map(([category_id, v]) => ({
      category_id,
      count: v.count,
      samples: v.samples
    }));

    return Response.json({
      success: true,
      generated_at: new Date().toISOString(),
      period: 'last_7_days',
      total_feedback: feedback.length,
      summary
    });
  } catch (e) {
    console.error('[summarizeRiskFeedback] Error:', e.message);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
});