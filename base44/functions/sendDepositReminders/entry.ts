import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automated deposit return reminders.
 * Runs daily via scheduled automation.
 * Checks all tracking deposits and sends email reminders at:
 *   30 days, 7 days, 3 days, due date, and overdue.
 * Also sends LINE notifications for Protect/Secure tier users.
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'LeaseShield Notifications <notifications@leaseshield.asia>';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const deposits = await base44.asServiceRole.entities.DepositTracker.filter(
    { status: 'tracking', is_archived: { $ne: true } }
  );

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
  const todayMs = new Date(todayStr).getTime();

  const results = {
    checked: deposits.length,
    reminders_sent: 0,
    skipped: 0,
    errors: []
  };

  for (const deposit of deposits) {
    try {
      if (!deposit.expected_return_date) { results.skipped++; continue; }

      const returnMs = new Date(deposit.expected_return_date).getTime();
      const daysUntil = Math.round((returnMs - todayMs) / 86400000);

      // Determine which reminder to send
      let reminderKey = null;
      let subject = '';
      let urgency = '';

      if (daysUntil === 30 && !deposit.reminder_30d_sent) {
        reminderKey = 'reminder_30d_sent';
        subject = '🔔 Deposit Return in 30 Days';
        urgency = 'info';
      } else if (daysUntil === 7 && !deposit.reminder_7d_sent) {
        reminderKey = 'reminder_7d_sent';
        subject = '⚠️ Deposit Return in 7 Days — Action Needed';
        urgency = 'urgent';
      } else if (daysUntil === 3 && !deposit.reminder_3d_sent) {
        reminderKey = 'reminder_3d_sent';
        subject = '🚨 Deposit Return in 3 Days';
        urgency = 'urgent';
      } else if (daysUntil === 0 && !deposit.reminder_due_sent) {
        reminderKey = 'reminder_due_sent';
        subject = '🔴 Deposit Should Be Returned Today';
        urgency = 'critical';
      } else if (daysUntil < 0 && !deposit.reminder_overdue_sent) {
        reminderKey = 'reminder_overdue_sent';
        subject = `🔴 Deposit Overdue by ${Math.abs(daysUntil)} Days — Take Action`;
        urgency = 'critical';
      }

      if (!reminderKey) { results.skipped++; continue; }

      const email = deposit.owner_email;
      const amount = formatTHB(deposit.deposit_amount);
      const returnDate = formatDate(deposit.expected_return_date);
      const property = deposit.property_address || 'N/A';

      // ── Fetch user for name + notification prefs + LINE token ──
      let users = [];
      try {
        users = await base44.asServiceRole.entities.User.filter({ email });
      } catch (_e) { /* ignore */ }
      const user = users[0];
      const userName = user?.full_name || 'there';

      // ── Check user notification preferences ──
      const prefs = user?.notification_preferences || {};
      const prefKey = daysUntil >= 30 ? 'deposit_30d' :
                      daysUntil >= 7  ? 'deposit_7d'  :
                      daysUntil >= 3  ? 'deposit_3d'  : 'deposit_overdue';
      if (prefs[prefKey] === false) {
        console.log(`[DEPOSIT] Skipped ${email} — preference ${prefKey} disabled`);
        results.skipped++;
        continue;
      }

      // ── Send email via Resend ──
      const emailHtml = buildEmailHtml({ userName, subject, amount, returnDate, property, daysUntil, urgency });

      if (RESEND_API_KEY) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM_EMAIL, to: [email], subject, html: emailHtml })
        });
        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error(`[DEPOSIT] Email failed for ${email}:`, errText);
          results.errors.push(`Email to ${email}: ${errText}`);
        } else {
          console.log(`[DEPOSIT] ✅ Email sent to ${email} (${reminderKey})`);
        }
      } else {
        // Fallback to built-in SendEmail
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email, subject, body: emailHtml, from_name: 'LeaseShield Notifications'
        });
        console.log(`[DEPOSIT] ✅ Email sent via Core to ${email}`);
      }

      // ── Send LINE notification if user has it configured ──
      const lineToken = user?.line_messaging_token;
      const lineEnabled = user?.line_notifications !== false;
      const userTier = user?.plan_tier || 'explorer';
      if (lineToken && lineEnabled && ['protect', 'secure'].includes(userTier)) {
        try {
          await base44.asServiceRole.functions.invoke('sendLineMessage', {
            userId: lineToken,
            message: `${subject}\n\n💰 ${amount}\n📍 ${property}\n📅 Return: ${returnDate}\n\nView: https://app.leaseshield.asia/DepositTracker`
          });
          console.log(`[DEPOSIT] ✅ LINE sent to ${email}`);
        } catch (lineErr) {
          console.error(`[DEPOSIT] LINE failed for ${email}:`, lineErr.message);
        }
      }

      // ── Mark reminder as sent ──
      await base44.asServiceRole.entities.DepositTracker.update(deposit.id, { [reminderKey]: true });

      // ── Log notification ──
      const notifType = daysUntil >= 30 ? '30d_deposit' :
                        daysUntil >= 7  ? '7d_deposit'  :
                        daysUntil >= 3  ? '3d_deposit'  : 'overdue_deposit';
      await base44.asServiceRole.entities.NotificationLog.create({
        user_email: email,
        notification_type: notifType,
        channel: 'Email',
        status: 'sent',
        related_entity_type: 'deposit',
        related_entity_id: deposit.id,
        message_preview: subject.slice(0, 200)
      });

      // ── Create timeline event ──
      await base44.asServiceRole.entities.TimelineEvent.create({
        owner_email: email,
        property_address: property,
        lease_id: deposit.lease_id || '',
        event_type: notifType === '30d_deposit' ? 'notification_30d_deposit' :
                    notifType === '7d_deposit'  ? 'notification_7d_deposit'  :
                    notifType === '3d_deposit'  ? 'notification_3d_deposit'  :
                                                  'notification_overdue_deposit',
        event_date: now.toISOString(),
        title: subject.replace(/[🔔⚠️🚨🔴]/g, '').trim(),
        description: `Auto-reminder: deposit ${amount} at ${property}`,
        source: 'notification'
      });

      results.reminders_sent++;
    } catch (err) {
      console.error(`[DEPOSIT] Error for deposit ${deposit.id}:`, err.message);
      results.errors.push(`${deposit.id}: ${err.message}`);
    }
  }

  console.log('[DEPOSIT] Run complete:', JSON.stringify(results));
  return Response.json({ success: true, results });
});

// ── Helpers ──

function formatTHB(n) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n || 0);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric' });
}

function buildEmailHtml({ userName, subject, amount, returnDate, property, daysUntil, urgency }) {
  const color = urgency === 'info' ? '#2196F3' : urgency === 'urgent' ? '#FF9800' : '#F44336';

  let message, actions;
  if (daysUntil >= 30) {
    message = `Your security deposit of ${amount} should be returned in ${daysUntil} days.`;
    actions = '<li>Start preparing move-out documentation</li><li>Take photos of property condition</li><li>Review your lease for deposit return terms</li>';
  } else if (daysUntil >= 3) {
    message = `Your security deposit of ${amount} should be returned in ${daysUntil} days.`;
    actions = '<li>Complete move-out photos and videos</li><li>Upload all evidence to your Evidence Vault</li><li>Confirm landlord\'s contact information</li>';
  } else if (daysUntil === 0) {
    message = `Your security deposit of ${amount} should be returned TODAY.`;
    actions = '<li>Check with your landlord about return status</li><li>Verify bank account details are correct</li><li>Keep all communications documented</li>';
  } else {
    message = `Your security deposit of ${amount} is now ${Math.abs(daysUntil)} days OVERDUE.`;
    actions = '<li><strong>Contact your landlord immediately</strong></li><li>Send formal deposit return request letter</li><li>If no response, consider opening a Resolve case</li>';
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto">
<div style="background:${color};color:#fff;padding:20px;text-align:center"><h1 style="margin:0;font-size:22px">${subject.replace(/[🔔⚠️🚨🔴]/g, '').trim()}</h1></div>
<div style="padding:24px 20px">
<p>Hi ${userName},</p>
<p style="font-size:17px;font-weight:600;color:${color}">${message}</p>
<div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
<p style="margin:0"><strong>Deposit:</strong> ${amount}</p>
<p style="margin:8px 0 0"><strong>Expected Return:</strong> ${returnDate}</p>
<p style="margin:8px 0 0"><strong>Property:</strong> ${property}</p>
</div>
<h3 style="margin-top:20px">Action Items:</h3>
<ul style="padding-left:20px">${actions}</ul>
<div style="text-align:center;margin:24px 0">
<a href="https://app.leaseshield.asia/DepositTracker" style="display:inline-block;background:#0C3B2E;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600">View Deposit Tracker</a>
</div>
${urgency === 'critical' ? '<div style="background:#FFF3E0;border-left:4px solid #FF9800;padding:14px;margin:16px 0"><p style="margin:0"><strong>Need Help?</strong> Our Resolve service can help recover your deposit professionally.</p><p style="margin:8px 0 0"><a href="https://app.leaseshield.asia/Cases" style="color:#FF9800;font-weight:600">Open a Case →</a></p></div>' : ''}
<p style="margin-top:24px;color:#888;font-size:13px">Automated reminder from LeaseShield. Manage preferences in Account Settings.</p>
</div>
<div style="background:#f5f5f5;padding:16px;text-align:center;color:#888;font-size:12px">
<p style="margin:0">LeaseShield — Protecting Your Rental Rights</p>
</div></body></html>`;
}