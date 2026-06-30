import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automated deposit return reminder system.
 * Checks all active deposits and sends reminders at 30d, 7d, 3d, due, and overdue milestones.
 * Uses dedup flags on DepositTracker to prevent duplicate sends.
 * Logs to NotificationLog and creates TimelineEvents.
 * Designed to run daily at 9 AM Bangkok time via scheduled automation.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  const results = {
    checked: 0,
    sent_30d: 0,
    sent_7d: 0,
    sent_3d: 0,
    sent_due: 0,
    sent_overdue: 0,
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

    // Fetch all tracking deposits (skip returned ones)
    const allDeposits = await base44.asServiceRole.entities.DepositTracker.filter({
      status: 'tracking'
    });
    const deposits = allDeposits.filter(d => d.status !== 'returned');

    results.checked = deposits.length;
    console.log(`[DEPOSIT_REMINDERS] Checking ${deposits.length} active deposits`);

    // Bangkok midnight for consistent day calculation
    const now = new Date();
    const bangkokNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    const todayStr = bangkokNow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Cache users to avoid repeated lookups
    const userCache = {};

    for (const deposit of deposits) {
      try {
        if (!deposit.expected_return_date || !deposit.owner_email) continue;

        // Skip if already returned
        if (deposit.status === 'returned') {
          console.log(`[SKIP_RETURNED] ${deposit.owner_email} — deposit already returned`);
          continue;
        }

        // Calculate days difference using date strings (no timezone issues)
        const returnDateStr = deposit.expected_return_date.split('T')[0];
        const returnDate = new Date(returnDateStr + 'T00:00:00Z');
        const todayDate = new Date(todayStr + 'T00:00:00Z');
        const daysUntilReturn = Math.round((returnDate - todayDate) / (1000 * 60 * 60 * 24));

        // Determine which reminder to send (if any)
        let reminderType = null;
        let flagField = null;
        let notificationType = null;
        let subject = '';
        let urgency = '';

        if (daysUntilReturn === 30 && !deposit.reminder_30d_sent) {
          reminderType = '30d';
          flagField = 'reminder_30d_sent';
          notificationType = '30d_deposit';
          subject = 'Deposit Return in 30 Days';
          urgency = 'info';
        } else if (daysUntilReturn === 7 && !deposit.reminder_7d_sent) {
          reminderType = '7d';
          flagField = 'reminder_7d_sent';
          notificationType = '7d_deposit';
          subject = 'Deposit Return in 7 Days — Action Needed';
          urgency = 'warning';
        } else if (daysUntilReturn === 3 && !deposit.reminder_3d_sent) {
          reminderType = '3d';
          flagField = 'reminder_3d_sent';
          notificationType = '3d_deposit';
          subject = 'Deposit Return in 3 Days — Urgent';
          urgency = 'urgent';
        } else if (daysUntilReturn === 0 && !deposit.reminder_due_sent) {
          reminderType = 'due';
          flagField = 'reminder_due_sent';
          notificationType = 'overdue_deposit';
          subject = 'Deposit Should Be Returned Today';
          urgency = 'critical';
        } else if (daysUntilReturn < 0 && !deposit.reminder_overdue_sent) {
          reminderType = 'overdue';
          flagField = 'reminder_overdue_sent';
          notificationType = 'overdue_deposit';
          subject = `Deposit Overdue by ${Math.abs(daysUntilReturn)} Days — Take Action`;
          urgency = 'critical';
        }

        if (!reminderType) continue;

        // Get user (cached)
        if (!userCache[deposit.owner_email]) {
          const users = await base44.asServiceRole.entities.User.filter({ email: deposit.owner_email });
          userCache[deposit.owner_email] = users[0] || null;
        }
        const user = userCache[deposit.owner_email];
        if (!user) {
          results.errors.push(`User not found: ${deposit.owner_email}`);
          continue;
        }

        // Check notification preferences
        const prefs = user.notification_preferences || {};
        const prefKey = reminderType === 'overdue' || reminderType === 'due' ? 'deposit_overdue' :
                        reminderType === '3d' ? 'deposit_3d' :
                        reminderType === '7d' ? 'deposit_7d' : 'deposit_30d';
        if (prefs[prefKey] === false) {
          results.skipped_prefs++;
          console.log(`[SKIP] ${deposit.owner_email} has ${prefKey} disabled`);
          continue;
        }

        const emailBody = generateDepositEmailBody(deposit, daysUntilReturn, urgency, user.full_name);
        let sentChannel = null;

        // Send email notification via Resend (no unsubscribe footer)
        if (user.email_notifications !== false) {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'LeaseShield Notifications <notifications@leaseshield.asia>',
              to: [deposit.owner_email],
              subject: `🔔 ${subject}`,
              html: emailBody
            })
          });
          if (!emailRes.ok) {
            const errData = await emailRes.text();
            console.error(`[EMAIL_FAIL] ${deposit.owner_email}:`, errData);
          } else {
            sentChannel = 'Email';
            console.log(`[SENT] ${reminderType} email to ${deposit.owner_email}`);
          }
        }

        // Send LINE if user is on Protect/Secure tier
        const userTier = user.plan_tier || 'explorer';
        if (['protect', 'secure'].includes(userTier) && user.line_messaging_token && user.line_notifications) {
          const lineMsg = generateDepositLinePlainText(deposit, daysUntilReturn, urgency, user.language || 'en');
          try {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              internal_secret: Deno.env.get('INTERNAL_FUNCTION_SECRET'),
              userId: user.line_messaging_token,
              message: lineMsg
            });
            sentChannel = sentChannel ? 'Email+LINE' : 'LINE';
            console.log(`[SENT] ${reminderType} LINE to ${deposit.owner_email}`);
          } catch (lineErr) {
            console.error(`[LINE_FAIL] ${deposit.owner_email}:`, lineErr.message);
          }
        }

        if (!sentChannel) {
          console.log(`[SKIP] No channel available for ${deposit.owner_email}`);
          continue;
        }

        // Mark reminder as sent (dedup flag)
        await base44.asServiceRole.entities.DepositTracker.update(deposit.id, {
          [flagField]: true
        });

        // Log notification
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: deposit.owner_email,
          notification_type: notificationType,
          channel: sentChannel.includes('LINE') ? 'LINE' : 'Email',
          status: 'sent',
          related_entity_type: 'deposit',
          related_entity_id: deposit.id,
          message_preview: subject
        });

        // Create timeline event
        const timelineType = reminderType === 'overdue' ? 'notification_overdue_deposit' :
                             reminderType === 'due' ? 'notification_overdue_deposit' :
                             reminderType === '3d' ? 'notification_3d_deposit' :
                             reminderType === '7d' ? 'notification_7d_deposit' : 'notification_30d_deposit';

        await base44.asServiceRole.entities.TimelineEvent.create({
          owner_email: deposit.owner_email,
          property_address: deposit.property_address || '',
          lease_id: deposit.lease_id || '',
          event_type: timelineType,
          event_date: new Date().toISOString(),
          title: subject,
          description: `Automated reminder sent via ${sentChannel}`,
          source: 'notification'
        });

        results[`sent_${reminderType}`] = (results[`sent_${reminderType}`] || 0) + 1;

      } catch (err) {
        console.error(`[ERROR] Deposit ${deposit.id}:`, err.message);
        results.errors.push(`${deposit.id}: ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[DEPOSIT_REMINDERS] Complete in ${duration}ms. Sent: 30d=${results.sent_30d}, 7d=${results.sent_7d}, 3d=${results.sent_3d}, due=${results.sent_due}, overdue=${results.sent_overdue}`);

    return Response.json({ success: true, duration_ms: duration, results });

  } catch (error) {
    console.error('[DEPOSIT_REMINDERS] Fatal error:', error.message);
    return Response.json({ success: false, error: error.message, results }, { status: 500 });
  }
});

function generateDepositLinePlainText(deposit, daysUntil, urgency, language) {
  const amount = `฿${(deposit.deposit_amount || 0).toLocaleString()}`;
  const prop = deposit.property_address || 'N/A';
  const returnDate = deposit.expected_return_date?.split('T')[0] || 'N/A';

  if (daysUntil > 0) {
    return `🔔 Deposit Reminder\n\nYour deposit of ${amount} is due back in ${daysUntil} days.\n\n🏠 ${prop}\n📅 Return: ${returnDate}\n\n→ app.leaseshield.asia/PropertyTracker`;
  } else if (daysUntil === 0) {
    return `⚠️ Deposit Due Today!\n\nYour deposit of ${amount} should be returned TODAY.\n\n🏠 ${prop}\n\n→ app.leaseshield.asia/PropertyTracker`;
  } else {
    return `🚨 Deposit Overdue!\n\nYour deposit of ${amount} is ${Math.abs(daysUntil)} days overdue.\n\n🏠 ${prop}\n📅 Was due: ${returnDate}\n\n→ app.leaseshield.asia/PropertyTracker`;
  }
}

function generateDepositEmailBody(deposit, daysUntil, urgency, userName) {
  const amount = `฿${(deposit.deposit_amount || 0).toLocaleString()}`;
  const returnDate = deposit.expected_return_date ? new Date(deposit.expected_return_date).toLocaleDateString('en-US', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric'
  }) : 'N/A';

  let message = '';
  let actionItems = '';
  let urgencyColor = '#2196F3';

  if (urgency === 'info') {
    urgencyColor = '#2196F3';
    message = `Your security deposit of ${amount} should be returned in 30 days.`;
    actionItems = `
      <li>Start preparing move-out documentation</li>
      <li>Take photos of property condition</li>
      <li>Review your lease for deposit return terms</li>
      <li>Keep all receipts and communications</li>`;
  } else if (urgency === 'warning') {
    urgencyColor = '#FF9800';
    message = `Your security deposit of ${amount} should be returned in 7 days.`;
    actionItems = `
      <li>Complete move-out photos and videos</li>
      <li>Upload all evidence to your Evidence Vault</li>
      <li>Confirm landlord's contact information</li>
      <li>Review your deposit tracker for any issues</li>`;
  } else if (urgency === 'urgent') {
    urgencyColor = '#F44336';
    message = `Your security deposit of ${amount} should be returned in 3 days.`;
    actionItems = `
      <li><strong>Contact your landlord about return status</strong></li>
      <li>Verify bank account details are correct</li>
      <li>Complete final property documentation</li>
      <li>Keep all communications documented</li>`;
  } else {
    urgencyColor = '#D32F2F';
    if (daysUntil === 0) {
      message = `Your security deposit of ${amount} should be returned <strong>TODAY</strong>.`;
      actionItems = `
        <li>Check with your landlord about return status</li>
        <li>Verify bank account details are correct</li>
        <li>Keep all communications documented</li>
        <li>If not received, update deposit status in tracker</li>`;
    } else {
      message = `Your security deposit of ${amount} is now <strong>${Math.abs(daysUntil)} days OVERDUE</strong>.`;
      actionItems = `
        <li><strong>Contact your landlord immediately</strong></li>
        <li>Send a formal deposit return request letter</li>
        <li>Document all communications</li>
        <li>If no response, consider opening a Resolve case</li>`;
    }
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;background:#f9f9f9;">
  <div style="background:${urgencyColor};color:white;padding:24px;text-align:center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="width:48px;height:48px;margin-bottom:8px;" />
    <h1 style="margin:0;font-size:22px;">Deposit Reminder</h1>
  </div>
  <div style="padding:30px 24px;background:white;">
    <p>Hi ${userName || 'there'},</p>
    <p style="font-size:17px;font-weight:600;color:${urgencyColor};">${message}</p>
    <div style="background:#f5f5f5;padding:16px 20px;border-radius:8px;margin:20px 0;">
      <p style="margin:0;"><strong>Deposit Amount:</strong> ${amount}</p>
      <p style="margin:8px 0 0;"><strong>Expected Return:</strong> ${returnDate}</p>
      ${deposit.property_address ? `<p style="margin:8px 0 0;"><strong>Property:</strong> ${deposit.property_address}</p>` : ''}
    </div>
    <h3 style="margin-top:24px;">Action Items:</h3>
    <ul style="padding-left:20px;">${actionItems}</ul>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://app.leaseshield.asia/PropertyTracker" style="display:inline-block;background:#0C3B2E;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;">View Deposit Tracker</a>
    </div>
    ${urgency === 'critical' ? `
    <div style="background:#FFF3E0;border-left:4px solid #FF9800;padding:14px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;font-weight:600;">Need Help?</p>
      <p style="margin:8px 0 0;">If your deposit isn't returned, our Resolve service can help recover it professionally.</p>
      <a href="https://app.leaseshield.asia/Cases" style="color:#E65100;font-weight:600;">Open a Case →</a>
    </div>` : ''}
    <p style="margin-top:28px;color:#888;font-size:13px;">This is an automated reminder from your deposit tracker. Manage preferences in <a href="https://app.leaseshield.asia/Account" style="color:#0C3B2E;">Account Settings</a>.</p>
  </div>
  <div style="background:#f0f0f0;padding:16px;text-align:center;color:#999;font-size:12px;">
    <p style="margin:0;">LeaseShield — Protecting Your Rental Rights</p>
  </div>
</body></html>`;
}