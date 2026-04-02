import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ADMIN_EMAIL = 'steve.l@signa-consultants.com';
const PLAN_PRICES = { lite: 190, protect: 390, secure: 990 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
    const monthName = lastMonthStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' });

    console.log(`[REPORT] Generating for ${monthName}: ${lastMonthStart.toISOString()} - ${lastMonthEnd.toISOString()}`);

    // 1. USER METRICS
    const allUsers = await base44.asServiceRole.entities.User.filter({});
    const newUsers = allUsers.filter(u => {
      const d = new Date(u.created_date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    const activeUsers = allUsers.filter(u => {
      if (!u.last_login) return false;
      const d = new Date(u.last_login);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const tierOf = u => {
      const t = (u.plan_tier || 'explorer').toLowerCase();
      return t === 'free' ? 'explorer' : t;
    };
    const byTier = { explorer: 0, lite: 0, protect: 0, secure: 0 };
    allUsers.forEach(u => { const t = tierOf(u); if (byTier[t] !== undefined) byTier[t]++; });

    // 2. REVENUE
    const currentMRR = byTier.lite * PLAN_PRICES.lite + byTier.protect * PLAN_PRICES.protect + byTier.secure * PLAN_PRICES.secure;
    const newPaidUsers = newUsers.filter(u => tierOf(u) !== 'explorer');
    const newMRR = newPaidUsers.reduce((s, u) => s + (PLAN_PRICES[tierOf(u)] || 0), 0);

    // 3. CHURN / CANCELLATIONS
    let cancellations = [];
    try {
      const all = await base44.asServiceRole.entities.CancellationReason.filter({});
      cancellations = all.filter(c => {
        const d = new Date(c.created_date);
        return d >= lastMonthStart && d <= lastMonthEnd;
      });
    } catch (e) { console.warn('[REPORT] CancellationReason fetch failed:', e.message); }

    const reasonCounts = {};
    let downgrades = 0, fullCancels = 0, churnedMRR = 0;
    cancellations.forEach(c => {
      reasonCounts[c.reason || 'unknown'] = (reasonCounts[c.reason || 'unknown'] || 0) + 1;
      if (c.outcome === 'cancelled') { fullCancels++; churnedMRR += (c.subscription_value || 0); }
      else if (c.outcome?.startsWith('downgraded')) { downgrades++; churnedMRR += ((c.subscription_value || 0) - (c.revenue_retained || 0)); }
    });

    // 4. FEATURE USAGE
    let leaseCount = 0, depositCount = 0, caseCount = 0, docCount = 0, maintenanceCount = 0;
    try {
      const leases = await base44.asServiceRole.entities.Lease.filter({});
      leaseCount = leases.filter(l => { const d = new Date(l.created_date); return d >= lastMonthStart && d <= lastMonthEnd; }).length;
    } catch (e) { console.warn('[REPORT] Lease fetch:', e.message); }
    try {
      const deposits = await base44.asServiceRole.entities.DepositTracker.filter({});
      depositCount = deposits.filter(d => { const dt = new Date(d.created_date); return dt >= lastMonthStart && dt <= lastMonthEnd; }).length;
    } catch (e) { console.warn('[REPORT] Deposit fetch:', e.message); }
    try {
      const cases = await base44.asServiceRole.entities.Case.filter({});
      caseCount = cases.filter(c => { const d = new Date(c.created_date); return d >= lastMonthStart && d <= lastMonthEnd; }).length;
    } catch (e) { console.warn('[REPORT] Case fetch:', e.message); }
    try {
      const docs = await base44.asServiceRole.entities.Document.filter({});
      docCount = docs.filter(d => { const dt = new Date(d.created_date); return dt >= lastMonthStart && dt <= lastMonthEnd; }).length;
    } catch (e) { console.warn('[REPORT] Document fetch:', e.message); }
    try {
      const maint = await base44.asServiceRole.entities.MaintenanceRequest.filter({});
      maintenanceCount = maint.filter(m => { const d = new Date(m.created_date); return d >= lastMonthStart && d <= lastMonthEnd; }).length;
    } catch (e) { console.warn('[REPORT] Maintenance fetch:', e.message); }

    // 5. BUILD REPORT
    const report = {
      period: monthName,
      generated_at: now.toISOString(),
      users: { total: allUsers.length, new: newUsers.length, active: activeUsers.length, byTier },
      revenue: { currentMRR, newMRR, churnedMRR, netChange: newMRR - churnedMRR },
      churn: { total: cancellations.length, downgrades, fullCancels, reasonCounts, details: cancellations.slice(0, 20) },
      usage: { leases: leaseCount, deposits: depositCount, cases: caseCount, documents: docCount, maintenance: maintenanceCount },
    };

    // 6. SEND EMAIL
    const html = buildEmailHtml(report);
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: ADMIN_EMAIL,
      from_name: 'LeaseShield Analytics',
      subject: `LeaseShield Monthly Report — ${monthName}`,
      body: html,
    });
    console.log(`[REPORT] Sent to ${ADMIN_EMAIL}`);

    return Response.json({ success: true, report });
  } catch (error) {
    console.error('[REPORT_ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildEmailHtml(r) {
  const { users, revenue, churn, usage, period, generated_at } = r;
  const pct = (n, total) => total ? Math.round((n / total) * 100) : 0;
  const fmt = n => (n || 0).toLocaleString();

  const topReasons = Object.entries(churn.reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([reason, count]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">${reason.replace(/_/g, ' ')}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;font-weight:700;">${count}</td></tr>`)
    .join('');

  const feedbackRows = churn.details
    .filter(c => c.reason_details)
    .slice(0, 10)
    .map(c => `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;">${new Date(c.created_date).toLocaleDateString('en-GB')}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;">${c.user_email || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;">${c.previous_tier || '—'} → ${c.new_tier || 'cancelled'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;">${(c.reason || '').replace(/_/g, ' ')}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;font-size:11px;color:#555;">${c.reason_details || '—'}</td>
    </tr>`).join('');

  const mc = (label, value, color) => `<div style="background:#f8f9fa;border-radius:8px;padding:16px;text-align:center;border-left:4px solid ${color};">
    <div style="font-size:12px;color:#666;margin-bottom:4px;">${label}</div>
    <div style="font-size:28px;font-weight:800;color:${color};">${value}</div>
  </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:800px;margin:0 auto;padding:16px;background:#fff;">
  <div style="background:linear-gradient(135deg,#0C3B2E 0%,#047857 100%);color:#fff;padding:32px;text-align:center;border-radius:12px;">
    <h1 style="margin:0;font-size:24px;">LeaseShield Monthly Report</h1>
    <p style="margin:8px 0 0;font-size:18px;color:#C7A338;font-weight:600;">${period}</p>
  </div>

  <h2 style="margin-top:32px;color:#0C3B2E;">👥 Users</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;">
    ${mc('Total Users', fmt(users.total), '#0C3B2E')}
    ${mc('New This Month', '+' + fmt(users.new), '#10B981')}
    ${mc('Active Users', fmt(users.active), '#3B82F6')}
    ${mc('Engagement', pct(users.active, users.total) + '%', '#8B5CF6')}
  </div>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr style="background:#0C3B2E;color:#fff;"><th style="padding:10px;text-align:left;">Tier</th><th style="padding:10px;text-align:center;">Count</th><th style="padding:10px;text-align:center;">%</th></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;">Explorer (Free)</td><td style="padding:8px;text-align:center;">${users.byTier.explorer}</td><td style="padding:8px;text-align:center;">${pct(users.byTier.explorer, users.total)}%</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;">Lite (฿190)</td><td style="padding:8px;text-align:center;">${users.byTier.lite}</td><td style="padding:8px;text-align:center;">${pct(users.byTier.lite, users.total)}%</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;">Protect (฿390)</td><td style="padding:8px;text-align:center;">${users.byTier.protect}</td><td style="padding:8px;text-align:center;">${pct(users.byTier.protect, users.total)}%</td></tr>
    <tr><td style="padding:8px;">Secure (฿990)</td><td style="padding:8px;text-align:center;">${users.byTier.secure}</td><td style="padding:8px;text-align:center;">${pct(users.byTier.secure, users.total)}%</td></tr>
  </table>

  <h2 style="margin-top:32px;color:#0C3B2E;">💰 Revenue</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;">
    ${mc('Current MRR', '฿' + fmt(revenue.currentMRR), '#0C3B2E')}
    ${mc('New MRR', '+฿' + fmt(revenue.newMRR), '#10B981')}
    ${mc('Churned MRR', '-฿' + fmt(revenue.churnedMRR), '#EF4444')}
    ${mc('Net Change', (revenue.netChange >= 0 ? '+' : '') + '฿' + fmt(revenue.netChange), revenue.netChange >= 0 ? '#10B981' : '#EF4444')}
  </div>

  <h2 style="margin-top:32px;color:#0C3B2E;">📉 Churn & Feedback</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:16px 0;">
    ${mc('Total Events', fmt(churn.total), '#F59E0B')}
    ${mc('Downgrades', fmt(churn.downgrades), '#F59E0B')}
    ${mc('Full Cancels', fmt(churn.fullCancels), '#EF4444')}
  </div>
  ${topReasons ? `<h3 style="color:#0C3B2E;">Top Reasons</h3>
  <table style="width:100%;border-collapse:collapse;margin:12px 0;">
    <tr style="background:#FFF7ED;"><th style="padding:8px 12px;text-align:left;">Reason</th><th style="padding:8px 12px;text-align:center;">Count</th></tr>
    ${topReasons}
  </table>` : ''}
  ${feedbackRows ? `<h3 style="color:#0C3B2E;">User Feedback Details</h3>
  <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
    <tr style="background:#0C3B2E;color:#fff;"><th style="padding:8px;">Date</th><th style="padding:8px;">User</th><th style="padding:8px;">Change</th><th style="padding:8px;">Reason</th><th style="padding:8px;">Details</th></tr>
    ${feedbackRows}
  </table>` : ''}

  <h2 style="margin-top:32px;color:#0C3B2E;">📊 Feature Usage</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;">
    ${mc('Leases Scanned', fmt(usage.leases), '#3B82F6')}
    ${mc('Deposits Tracked', fmt(usage.deposits), '#C7A338')}
    ${mc('Cases Opened', fmt(usage.cases), '#8B5CF6')}
    ${mc('Documents Uploaded', fmt(usage.documents), '#0C3B2E')}
    ${mc('Maintenance Requests', fmt(usage.maintenance), '#F59E0B')}
  </div>

  <div style="background:#f5f5f5;padding:16px;text-align:center;color:#999;font-size:11px;margin-top:32px;border-radius:8px;">
    LeaseShield Analytics · Generated ${new Date(generated_at).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })} (Bangkok)
  </div>
</body></html>`;
}