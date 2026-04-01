import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automated lease expiration reminders.
 * Runs daily via scheduled automation.
 * Checks all active leases and sends email reminders at:
 *   60 days, 30 days, 14 days, 7 days before end_date.
 * Also sends LINE notifications for Protect/Secure tier users.
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'LeaseShield Notifications <notifications@leaseshield.asia>';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const leases = await base44.asServiceRole.entities.Lease.filter(
    { status: 'active' }
  );

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayMs = new Date(todayStr).getTime();

  const results = {
    checked: leases.length,
    reminders_sent: 0,
    skipped: 0,
    errors: []
  };

  for (const lease of leases) {
    try {
      if (!lease.end_date) { results.skipped++; continue; }

      const endMs = new Date(lease.end_date).getTime();
      const daysUntil = Math.round((endMs - todayMs) / 86400000);

      // Determine which reminder to send
      let reminderKey = null;
      let subject = '';
      let urgency = '';

      if (daysUntil === 60 && !lease.reminder_60d_sent) {
        reminderKey = 'reminder_60d_sent';
        subject = '📋 Lease Ends in 60 Days — Start Planning';
        urgency = 'info';
      } else if (daysUntil === 30 && !lease.reminder_30d_sent) {
        reminderKey = 'reminder_30d_sent';
        subject = '⚠️ Lease Ends in 30 Days — Action Needed';
        urgency = 'important';
      } else if (daysUntil === 14 && !lease.reminder_14d_sent) {
        reminderKey = 'reminder_14d_sent';
        subject = '🚨 Lease Ends in 14 Days — Urgent';
        urgency = 'urgent';
      } else if (daysUntil === 7 && !lease.reminder_7d_sent) {
        reminderKey = 'reminder_7d_sent';
        subject = '🔴 Lease Ends in 7 Days — Final Notice';
        urgency = 'critical';
      }

      if (!reminderKey) { results.skipped++; continue; }

      // Check notice_alerts_enabled preference
      if (lease.notice_alerts_enabled === false) {
        console.log(`[LEASE] Skipped ${lease.owner_email} — notice alerts disabled`);
        results.skipped++;
        continue;
      }

      const email = lease.owner_email;
      const endDate = formatDate(lease.end_date);
      const property = lease.property_address || 'N/A';

      // Fetch user
      let users = [];
      try {
        users = await base44.asServiceRole.entities.User.filter({ email });
      } catch (_e) { /* ignore */ }
      const user = users[0];
      const userName = user?.full_name || 'there';

      // Check user notification preferences
      const prefs = user?.notification_preferences || {};
      const prefKey = daysUntil >= 30 ? 'lease_30d' :
                      daysUntil >= 14 ? 'lease_7d'  :
                      daysUntil >= 7  ? 'lease_3d'  : 'lease_0d';
      if (prefs[prefKey] === false) {
        console.log(`[LEASE] Skipped ${email} — preference ${prefKey} disabled`);
        results.skipped++;
        continue;
      }

      // ── Send email via Resend ──
      const emailHtml = buildEmailHtml({ userName, subject, endDate, property, daysUntil, urgency });

      if (RESEND_API_KEY) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM_EMAIL, to: [email], subject, html: emailHtml })
        });
        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error(`[LEASE] Email failed for ${email}:`, errText);
          results.errors.push(`Email to ${email}: ${errText}`);
        } else {
          console.log(`[LEASE] ✅ Email sent to ${email} (${reminderKey})`);
        }
      } else {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email, subject, body: emailHtml, from_name: 'LeaseShield Notifications'
        });
        console.log(`[LEASE] ✅ Email sent via Core to ${email}`);
      }

      // ── Send LINE notification if available ──
      const lineToken = user?.line_messaging_token;
      const lineEnabled = user?.line_notifications !== false;
      const userTier = user?.plan_tier || 'explorer';
      if (lineToken && lineEnabled && ['protect', 'secure'].includes(userTier)) {
        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: lineToken,
            message: `${subject}\n\n📍 ${property}\n📅 Ends: ${endDate}\n⏳ ${daysUntil} days remaining\n\nView: https://app.leaseshield.asia/Leases`
          });
          console.log(`[LEASE] ✅ LINE sent to ${email}`);
        } catch (lineErr) {
          console.error(`[LEASE] LINE failed for ${email}:`, lineErr.message);
        }
      }

      // ── Mark reminder as sent ──
      await base44.asServiceRole.entities.Lease.update(lease.id, { [reminderKey]: true });

      // ── Log notification ──
      const notifType = daysUntil >= 60 ? '30d_notice' :
                        daysUntil >= 30 ? '30d_notice' :
                        daysUntil >= 14 ? '7d_notice'  :
                                          '3d_notice';
      await base44.asServiceRole.entities.NotificationLog.create({
        user_email: email,
        notification_type: notifType,
        channel: 'Email',
        status: 'sent',
        related_entity_type: 'lease',
        related_entity_id: lease.id,
        message_preview: subject.slice(0, 200)
      });

      // ── Create timeline event ──
      await base44.asServiceRole.entities.TimelineEvent.create({
        owner_email: email,
        property_address: property,
        lease_id: lease.id,
        event_type: daysUntil >= 30 ? 'notification_30d_notice' :
                    daysUntil >= 14 ? 'notification_7d_notice'  :
                    daysUntil >= 7  ? 'notification_3d_notice'  :
                                      'notification_0d_notice',
        event_date: now.toISOString(),
        title: subject.replace(/[📋⚠️🚨🔴]/g, '').trim(),
        description: `Auto-reminder: lease at ${property} ends ${endDate}`,
        source: 'notification'
      });

      results.reminders_sent++;
    } catch (err) {
      console.error(`[LEASE] Error for lease ${lease.id}:`, err.message);
      results.errors.push(`${lease.id}: ${err.message}`);
    }
  }

  console.log('[LEASE] Run complete:', JSON.stringify(results));
  return Response.json({ success: true, results });
});

// ── Helpers ──

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric' });
}

function buildEmailHtml({ userName, subject, endDate, property, daysUntil, urgency }) {
  const color = urgency === 'info' ? '#2196F3' : urgency === 'important' ? '#FF9800' : urgency === 'urgent' ? '#F44336' : '#D32F2F';

  let message, actions;
  if (daysUntil >= 60) {
    message = `Your lease ends in ${daysUntil} days. Time to start planning.`;
    actions = '<li>Decide: renew or move?</li><li>Review lease for notice requirements</li><li>Check deposit return process</li>';
  } else if (daysUntil >= 30) {
    message = `Your lease ends in ${daysUntil} days. Take action soon.`;
    actions = '<li><strong>Notify landlord if not renewing</strong></li><li>Confirm deposit return procedure</li><li>Schedule move-out inspection</li>';
  } else if (daysUntil >= 14) {
    message = `Your lease ends in ${daysUntil} days. Action required now.`;
    actions = '<li><strong>Confirm move-out date with landlord</strong></li><li>Schedule professional cleaning if needed</li><li>Complete move-out photos/videos</li><li>Arrange utility disconnections</li>';
  } else {
    message = `Your lease ends in ${daysUntil} days. Final preparations needed.`;
    actions = '<li><strong>Complete all move-out preparations</strong></li><li>Take comprehensive property photos</li><li>Upload evidence to Evidence Vault</li><li>Return keys and get receipt</li>';
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto">
<div style="background:${color};color:#fff;padding:20px;text-align:center"><h1 style="margin:0;font-size:22px">${subject.replace(/[📋⚠️🚨🔴]/g, '').trim()}</h1></div>
<div style="padding:24px 20px">
<p>Hi ${userName},</p>
<p style="font-size:17px;font-weight:600;color:${color}">${message}</p>
<div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
<p style="margin:0"><strong>Lease End Date:</strong> ${endDate}</p>
<p style="margin:8px 0 0"><strong>Days Remaining:</strong> ${daysUntil}</p>
<p style="margin:8px 0 0"><strong>Property:</strong> ${property}</p>
</div>
<h3 style="margin-top:20px">Action Checklist:</h3>
<ul style="padding-left:20px">${actions}</ul>
<div style="text-align:center;margin:24px 0">
<a href="https://app.leaseshield.asia/Leases" style="display:inline-block;background:#0C3B2E;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600">View Your Leases</a>
</div>
${urgency === 'critical' || urgency === 'urgent' ? '<div style="background:#E8F5E9;border-left:4px solid #4CAF50;padding:14px;margin:16px 0"><p style="margin:0"><strong>Pro Tip:</strong> Upload your move-out condition photos to the Evidence Vault now. This protects your deposit claim later.</p></div>' : ''}
<p style="margin-top:24px;color:#888;font-size:13px">Automated reminder from LeaseShield. Manage preferences in Account Settings.</p>
</div>
<div style="background:#f5f5f5;padding:16px;text-align:center;color:#888;font-size:12px">
<p style="margin:0">LeaseShield — Protecting Your Rental Rights</p>
</div></body></html>`;
}