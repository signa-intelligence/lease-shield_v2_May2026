import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automated lease expiration warning system.
 * Checks all active leases and sends reminders at 60d, 30d, 14d, and 7d milestones before end_date.
 * Uses dedup flags on Lease entity to prevent duplicate sends.
 * Logs to NotificationLog and creates TimelineEvents.
 * Designed to run daily at 9 AM Bangkok time via scheduled automation.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  const results = {
    checked: 0,
    sent_60d: 0,
    sent_30d: 0,
    sent_14d: 0,
    sent_7d: 0,
    skipped_prefs: 0,
    errors: []
  };

  try {
    const base44 = createClientFromRequest(req);

    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const headerSecret = req.headers.get('x-internal-secret');
    let guardBody = {};
    try { guardBody = await req.clone().json(); } catch (_e) { guardBody = {}; }
    const providedSecret = headerSecret || guardBody.internal_secret;
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ success: false, error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    // Fetch all active leases (not archived/deleted)
    const allLeases = await base44.asServiceRole.entities.Lease.filter({
      status: 'active'
    });
    // Also include scanned leases that are active
    const scannedLeases = await base44.asServiceRole.entities.Lease.filter({
      status: 'scanned'
    });
    const okLeases = await base44.asServiceRole.entities.Lease.filter({
      status: 'ok'
    });

    const leases = [...allLeases, ...scannedLeases, ...okLeases];
    results.checked = leases.length;
    console.log(`[LEASE_REMINDERS] Checking ${leases.length} leases`);

    // Bangkok midnight for consistent day calculation
    const now = new Date();
    const bangkokNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    const todayStr = bangkokNow.toISOString().split('T')[0];

    const userCache = {};

    for (const lease of leases) {
      try {
        if (!lease.end_date || !lease.owner_email) continue;

        const endDateStr = lease.end_date.split('T')[0];
        const endDate = new Date(endDateStr + 'T00:00:00Z');
        const todayDate = new Date(todayStr + 'T00:00:00Z');
        const daysUntilEnd = Math.round((endDate - todayDate) / (1000 * 60 * 60 * 24));

        let reminderType = null;
        let flagField = null;
        let subject = '';
        let urgency = '';

        if (daysUntilEnd === 60 && !lease.reminder_60d_sent) {
          reminderType = '60d';
          flagField = 'reminder_60d_sent';
          subject = 'Lease Ends in 60 Days — Start Planning';
          urgency = 'info';
        } else if (daysUntilEnd === 30 && !lease.reminder_30d_sent) {
          reminderType = '30d';
          flagField = 'reminder_30d_sent';
          subject = 'Lease Ends in 30 Days — Action Needed';
          urgency = 'warning';
        } else if (daysUntilEnd === 14 && !lease.reminder_14d_sent) {
          reminderType = '14d';
          flagField = 'reminder_14d_sent';
          subject = 'Lease Ends in 14 Days — Urgent';
          urgency = 'urgent';
        } else if (daysUntilEnd === 7 && !lease.reminder_7d_sent) {
          reminderType = '7d';
          flagField = 'reminder_7d_sent';
          subject = 'Lease Ends in 7 Days — Final Notice';
          urgency = 'critical';
        }

        if (!reminderType) continue;

        // Get user (cached)
        if (!userCache[lease.owner_email]) {
          const users = await base44.asServiceRole.entities.User.filter({ email: lease.owner_email });
          userCache[lease.owner_email] = users[0] || null;
        }
        const user = userCache[lease.owner_email];
        if (!user) {
          results.errors.push(`User not found: ${lease.owner_email}`);
          continue;
        }

        // Check notification preferences
        const prefs = user.notification_preferences || {};
        const prefKey = reminderType === '7d' ? 'lease_7d' :
                        reminderType === '14d' ? 'lease_3d' :
                        reminderType === '30d' ? 'lease_30d' : 'lease_30d';
        if (prefs[prefKey] === false) {
          results.skipped_prefs++;
          console.log(`[SKIP] ${lease.owner_email} has ${prefKey} disabled`);
          continue;
        }

        const emailBody = generateLeaseEmailBody(lease, daysUntilEnd, urgency, user.full_name);
        let sentChannel = null;

        // Send email via Resend (no unsubscribe footer)
        if (user.email_notifications !== false) {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'LeaseShield Notifications <notifications@leaseshield.asia>',
              to: [lease.owner_email],
              subject: `📅 ${subject}`,
              html: emailBody
            })
          });
          if (!emailRes.ok) {
            const errData = await emailRes.text();
            console.error(`[EMAIL_FAIL] ${lease.owner_email}:`, errData);
          } else {
            sentChannel = 'Email';
            console.log(`[SENT] ${reminderType} email to ${lease.owner_email}`);
          }
        }

        // Send LINE if eligible tier
        const userTier = user.plan_tier || 'explorer';
        if (['protect', 'secure'].includes(userTier) && user.line_messaging_token && user.line_notifications) {
          const lineMsg = generateLeaseLinePlainText(lease, daysUntilEnd, user.language || 'en');
          try {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
              userId: user.line_messaging_token,
              message: lineMsg
            });
            sentChannel = sentChannel ? 'Email+LINE' : 'LINE';
            console.log(`[SENT] ${reminderType} LINE to ${lease.owner_email}`);
          } catch (lineErr) {
            console.error(`[LINE_FAIL] ${lease.owner_email}:`, lineErr.message);
          }
        }

        if (!sentChannel) {
          console.log(`[SKIP] No channel for ${lease.owner_email}`);
          continue;
        }

        // Mark reminder as sent
        await base44.asServiceRole.entities.Lease.update(lease.id, {
          [flagField]: true
        });

        // Determine notification_type for NotificationLog (using existing enum values)
        const notifType = reminderType === '60d' ? '30d_notice' :
                          reminderType === '30d' ? '30d_notice' :
                          reminderType === '14d' ? '7d_notice' :
                          '7d_notice';

        // Log notification
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: lease.owner_email,
          notification_type: notifType,
          channel: sentChannel.includes('LINE') ? 'LINE' : 'Email',
          status: 'sent',
          related_entity_type: 'lease',
          related_entity_id: lease.id,
          message_preview: subject
        });

        // Create timeline event
        const timelineType = reminderType === '7d' ? 'notification_7d_notice' :
                             reminderType === '14d' ? 'notification_3d_notice' :
                             reminderType === '30d' ? 'notification_30d_notice' : 'notification_30d_notice';

        await base44.asServiceRole.entities.TimelineEvent.create({
          owner_email: lease.owner_email,
          property_address: lease.property_address || '',
          lease_id: lease.id,
          event_type: timelineType,
          event_date: new Date().toISOString(),
          title: subject,
          description: `Automated lease expiration reminder sent via ${sentChannel}. Lease ends ${endDateStr}.`,
          source: 'notification'
        });

        results[`sent_${reminderType}`] = (results[`sent_${reminderType}`] || 0) + 1;

      } catch (err) {
        console.error(`[ERROR] Lease ${lease.id}:`, err.message);
        results.errors.push(`${lease.id}: ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[LEASE_REMINDERS] Complete in ${duration}ms. Sent: 60d=${results.sent_60d}, 30d=${results.sent_30d}, 14d=${results.sent_14d}, 7d=${results.sent_7d}`);

    return Response.json({ success: true, duration_ms: duration, results });

  } catch (error) {
    console.error('[LEASE_REMINDERS] Fatal error:', error.message);
    return Response.json({ success: false, error: error.message, results }, { status: 500 });
  }
});

function generateLeaseLinePlainText(lease, daysUntil, language) {
  const prop = lease.property_address || 'N/A';
  const endDate = lease.end_date?.split('T')[0] || 'N/A';

  return `📅 Lease Expiration Notice\n\nYour lease ends in ${daysUntil} days.\n\n🏠 ${prop}\n📆 Ends: ${endDate}\n\n→ app.leaseshield.asia/PropertyTracker`;
}

function generateLeaseEmailBody(lease, daysUntil, urgency, userName) {
  const endDate = lease.end_date ? new Date(lease.end_date).toLocaleDateString('en-US', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric'
  }) : 'N/A';

  let message = '';
  let actionItems = '';
  let urgencyColor = '#2196F3';

  if (urgency === 'info') {
    urgencyColor = '#2196F3';
    message = 'Your lease ends in 60 days. Time to start planning your next move.';
    actionItems = `
      <li>Decide: renew or move?</li>
      <li>If moving, start apartment hunting</li>
      <li>Review lease for notice requirements</li>
      <li>Check deposit return process</li>`;
  } else if (urgency === 'warning') {
    urgencyColor = '#FF9800';
    message = 'Your lease ends in 30 days. Take action soon.';
    actionItems = `
      <li><strong>Notify landlord if not renewing</strong></li>
      <li>Confirm deposit return procedure</li>
      <li>Start packing/moving preparations</li>
      <li>Schedule move-out inspection</li>`;
  } else if (urgency === 'urgent') {
    urgencyColor = '#F44336';
    message = 'Your lease ends in 14 days. Action required now.';
    actionItems = `
      <li><strong>Confirm move-out date with landlord</strong></li>
      <li>Schedule professional cleaning if needed</li>
      <li>Complete move-out photos/videos</li>
      <li>Arrange utility disconnections</li>
      <li>Update address with important contacts</li>`;
  } else {
    urgencyColor = '#D32F2F';
    message = 'Your lease ends in 7 days. Final preparations needed.';
    actionItems = `
      <li><strong>Complete all move-out preparations</strong></li>
      <li>Take comprehensive property photos</li>
      <li>Upload evidence to Evidence Vault</li>
      <li>Confirm deposit return timeline</li>
      <li>Return keys and get receipt</li>
      <li>Keep all documentation safe</li>`;
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;background:#f9f9f9;">
  <div style="background:${urgencyColor};color:white;padding:24px;text-align:center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="width:48px;height:48px;margin-bottom:8px;" />
    <h1 style="margin:0;font-size:22px;">Lease Expiration Notice</h1>
  </div>
  <div style="padding:30px 24px;background:white;">
    <p>Hi ${userName || 'there'},</p>
    <p style="font-size:17px;font-weight:600;color:${urgencyColor};">${message}</p>
    <div style="background:#f5f5f5;padding:16px 20px;border-radius:8px;margin:20px 0;">
      <p style="margin:0;"><strong>Lease End Date:</strong> ${endDate}</p>
      <p style="margin:8px 0 0;"><strong>Days Remaining:</strong> ${daysUntil} days</p>
      ${lease.property_address ? `<p style="margin:8px 0 0;"><strong>Property:</strong> ${lease.property_address}</p>` : ''}
      ${lease.notice_period_days ? `<p style="margin:8px 0 0;"><strong>Notice Period:</strong> ${lease.notice_period_days} days</p>` : ''}
    </div>
    <h3 style="margin-top:24px;">Action Checklist:</h3>
    <ul style="padding-left:20px;">${actionItems}</ul>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://app.leaseshield.asia/PropertyTracker" style="display:inline-block;background:#0C3B2E;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;">View Property Tracker</a>
    </div>
    ${urgency === 'critical' ? `
    <div style="background:#E3F2FD;border-left:4px solid #2196F3;padding:14px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;font-weight:600;">Moving Out?</p>
      <p style="margin:8px 0 0;">Use our Evidence Vault to document property condition before handing over keys.</p>
      <a href="https://app.leaseshield.asia/EvidenceVault" style="color:#1565C0;font-weight:600;">Open Evidence Vault →</a>
    </div>` : ''}
    <p style="margin-top:28px;color:#888;font-size:13px;">This is an automated reminder. Manage preferences in <a href="https://app.leaseshield.asia/Account" style="color:#0C3B2E;">Account Settings</a>.</p>
  </div>
  <div style="background:#f0f0f0;padding:16px;text-align:center;color:#999;font-size:12px;">
    <p style="margin:0;">LeaseShield — Protecting Your Rental Rights</p>
  </div>
</body></html>`;
}