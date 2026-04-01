import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.filter({});

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const results = {
      checked: allUsers.length,
      sent: 0,
      skipped_active: 0,
      skipped_no_login: 0,
      skipped_cooldown: 0,
      skipped_deleted: 0,
      skipped_opted_out: 0,
      errors: []
    };

    for (const u of allUsers) {
      try {
        // Skip soft-deleted users
        if (u.is_deleted) {
          results.skipped_deleted++;
          continue;
        }

        // Skip users without last_login (never logged in or brand new)
        if (!u.last_login) {
          results.skipped_no_login++;
          continue;
        }

        // Skip if user opted out
        if (u.notification_preferences?.inactive_reminders === false) {
          results.skipped_opted_out++;
          continue;
        }

        const lastLogin = new Date(u.last_login);
        const daysSinceLogin = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

        // Skip if logged in within 30 days
        if (daysSinceLogin < 30) {
          results.skipped_active++;
          continue;
        }

        // Skip if reminder sent within 60 days (cooldown)
        if (u.inactive_reminder_sent && u.inactive_reminder_sent_date) {
          const reminderDate = new Date(u.inactive_reminder_sent_date);
          const daysSinceReminder = Math.floor((today - reminderDate) / (1000 * 60 * 60 * 24));
          if (daysSinceReminder < 60) {
            results.skipped_cooldown++;
            continue;
          }
        }

        // Fetch user's active deposits and leases for personalization
        let deposits = [];
        let leases = [];
        try {
          deposits = await base44.asServiceRole.entities.DepositTracker.filter(
            { owner_email: u.email, status: 'tracking' }
          );
        } catch (e) { /* non-critical */ }

        try {
          leases = await base44.asServiceRole.entities.Lease.filter(
            { owner_email: u.email, status: 'active' }
          );
        } catch (e) { /* non-critical */ }

        // Build email
        const subject = `We miss you, ${u.full_name || 'friend'}! Your LeaseShield account awaits`;
        const emailBody = buildReengagementEmail(u, deposits, leases, daysSinceLogin);

        // Send via Resend (no unsubscribe footer)
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LeaseShield Notifications <notifications@leaseshield.asia>',
            to: [u.email],
            subject,
            html: emailBody
          })
        });
        if (!emailRes.ok) {
          const errText = await emailRes.text();
          throw new Error(`Resend failed: ${errText}`);
        }

        // Mark reminder sent
        await base44.asServiceRole.entities.User.update(u.id, {
          inactive_reminder_sent: true,
          inactive_reminder_sent_date: now.toISOString()
        });

        // Log notification
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: u.email,
          notification_type: 'maintenance_update', // closest existing enum value
          channel: 'Email',
          status: 'sent',
          related_entity_type: 'user',
          related_entity_id: u.id,
          message_preview: `Inactive re-engagement (${daysSinceLogin}d) sent to ${u.email}`
        });

        results.sent++;
        console.log(`[SENT] ${u.email} — ${daysSinceLogin} days inactive`);

      } catch (err) {
        console.error(`[ERROR] ${u.email}:`, err.message);
        results.errors.push(`${u.email}: ${err.message}`);
      }
    }

    console.log('[RESULTS]', JSON.stringify(results));
    return Response.json({ success: true, results });

  } catch (error) {
    console.error('[FATAL]', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});


function buildReengagementEmail(user, deposits, leases, daysSinceLogin) {
  const name = user.full_name || 'there';
  const hasDeposits = deposits.length > 0;
  const hasLeases = leases.length > 0;

  const upcomingDeposits = deposits.filter(d => {
    if (!d.expected_return_date) return false;
    const daysUntil = Math.floor((new Date(d.expected_return_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 60;
  });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
  <div style="background:#0C3B2E;color:white;padding:24px;text-align:center;">
    <h1 style="margin:0;font-size:22px;">We Miss You! 👋</h1>
  </div>
  <div style="padding:28px 20px;">
    <p>Hi ${name},</p>
    <p style="font-size:15px;">It's been <strong>${daysSinceLogin} days</strong> since you last logged into LeaseShield. We wanted to check in and remind you of the tools available to protect your rental rights.</p>

    ${(hasDeposits || hasLeases) ? `
    <div style="background:#FFF3E0;border-left:4px solid #FF9800;padding:14px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;font-weight:600;">📊 Your Account Summary</p>
      ${hasDeposits ? `<p style="margin:8px 0 0;">• ${deposits.length} deposit${deposits.length === 1 ? '' : 's'} being tracked</p>` : ''}
      ${hasLeases ? `<p style="margin:8px 0 0;">• ${leases.length} active lease${leases.length === 1 ? '' : 's'}</p>` : ''}
      ${upcomingDeposits.length > 0 ? `<p style="margin:8px 0 0;color:#E65100;font-weight:600;">⚠ ${upcomingDeposits.length} deposit${upcomingDeposits.length === 1 ? '' : 's'} due for return soon!</p>` : ''}
    </div>` : ''}

    <h3 style="color:#0C3B2E;margin-top:24px;">What You Can Do Now</h3>

    <div style="background:#f5f5f5;padding:14px;border-radius:6px;margin:10px 0;">
      <p style="margin:0;font-weight:600;">🔍 Scan a Lease</p>
      <p style="margin:4px 0 0;font-size:13px;color:#666;">Get AI-powered risk analysis before signing your next lease.</p>
    </div>
    <div style="background:#f5f5f5;padding:14px;border-radius:6px;margin:10px 0;">
      <p style="margin:0;font-weight:600;">💰 Track Your Deposits</p>
      <p style="margin:4px 0 0;font-size:13px;color:#666;">Set up automated reminders so you never miss a deposit return deadline.</p>
    </div>
    <div style="background:#f5f5f5;padding:14px;border-radius:6px;margin:10px 0;">
      <p style="margin:0;font-weight:600;">📸 Store Evidence</p>
      <p style="margin:4px 0 0;font-size:13px;color:#666;">Upload move-in/move-out photos to protect yourself from unfair damage claims.</p>
    </div>
    <div style="background:#f5f5f5;padding:14px;border-radius:6px;margin:10px 0;">
      <p style="margin:0;font-weight:600;">⚖️ Get Dispute Support</p>
      <p style="margin:4px 0 0;font-size:13px;color:#666;">If you're facing a rental dispute, our Resolve service can help.</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="https://app.leaseshield.asia" style="display:inline-block;background:#0C3B2E;color:white;padding:14px 36px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">Log In to Your Account</a>
    </div>

    <div style="background:#E8F5E9;padding:14px;border-radius:6px;margin:20px 0;">
      <p style="margin:0;font-size:13px;"><strong>💡 Did you know?</strong> Users who actively track their deposits recover 87% more of their security deposits on average.</p>
    </div>

    <p style="margin-top:28px;color:#999;font-size:12px;">Not interested in these reminders? You can adjust your notification preferences in your <a href="https://app.leaseshield.asia/Account" style="color:#0C3B2E;">account settings</a>.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px;text-align:center;color:#999;font-size:11px;">
    <p style="margin:0;">LeaseShield — Protecting Your Rental Rights</p>
    <p style="margin:8px 0 0;">Questions? Contact support@leaseshield.asia</p>
  </div>
</body></html>`;
}