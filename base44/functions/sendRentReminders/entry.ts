import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automated rent payment reminder system.
 * Checks all active DepositTrackers with rent_alerts_enabled=true.
 * Sends reminders at 3 days before, due date, and 3 days late milestones.
 * Uses monthly dedup via YYYY-MM flags to prevent duplicate sends within the same month.
 * Logs to NotificationLog and creates TimelineEvents.
 * Designed to run daily at 9:10 AM Bangkok time via scheduled automation.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  const results = {
    checked: 0,
    sent_3day: 0,
    sent_due: 0,
    sent_late: 0,
    skipped_prefs: 0,
    skipped_disabled: 0,
    errors: []
  };

  try {
    const base44 = createClientFromRequest(req);
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ success: false, error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    // Fetch all active deposits with rent tracking enabled
    const allDeposits = await base44.asServiceRole.entities.DepositTracker.filter({
      status: 'tracking'
    });

    // Filter to only those with rent_alerts_enabled and valid rent data
    const deposits = allDeposits.filter(d =>
      d.rent_alerts_enabled === true &&
      d.rent_amount > 0 &&
      d.rent_due_day >= 1 &&
      d.rent_due_day <= 31 &&
      d.owner_email
    );

    results.checked = deposits.length;
    results.skipped_disabled = allDeposits.length - deposits.length;
    console.log(`[RENT_REMINDERS] Checking ${deposits.length} deposits with rent alerts enabled (${results.skipped_disabled} disabled/incomplete)`);

    // Bangkok date for consistent day calculation
    const now = new Date();
    const bangkokNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    const todayStr = bangkokNow.toISOString().split('T')[0]; // YYYY-MM-DD
    const todayDate = new Date(todayStr + 'T00:00:00Z');
    const currentMonth = `${bangkokNow.getFullYear()}-${String(bangkokNow.getMonth() + 1).padStart(2, '0')}`;

    const userCache = {};

    for (const deposit of deposits) {
      try {
        const rentDay = deposit.rent_due_day;

        // Calculate this month's rent due date
        const thisMonthDue = new Date(Date.UTC(
          bangkokNow.getFullYear(),
          bangkokNow.getMonth(),
          Math.min(rentDay, new Date(bangkokNow.getFullYear(), bangkokNow.getMonth() + 1, 0).getDate())
        ));

        const daysUntilDue = Math.round((thisMonthDue - todayDate) / (1000 * 60 * 60 * 24));

        // Determine which reminder to send
        let reminderType = null;
        let flagField = null;
        let subject = '';
        let urgency = '';

        if (daysUntilDue === 3 && deposit.rent_reminder_3d_month !== currentMonth) {
          reminderType = '3day';
          flagField = 'rent_reminder_3d_month';
          subject = 'Rent Due in 3 Days';
          urgency = 'warning';
        } else if (daysUntilDue === 0 && deposit.rent_reminder_due_month !== currentMonth) {
          reminderType = 'due';
          flagField = 'rent_reminder_due_month';
          subject = 'Rent Due Today';
          urgency = 'urgent';
        } else if (daysUntilDue === -3 && deposit.rent_reminder_late_month !== currentMonth) {
          reminderType = 'late';
          flagField = 'rent_reminder_late_month';
          subject = 'Rent Payment Overdue — 3 Days Late';
          urgency = 'critical';
        }

        if (!reminderType) continue;

        // Check if this month's rent has already been paid via RentPayment entity
        try {
          const monthPayments = await base44.asServiceRole.entities.RentPayment.filter({
            deposit_tracker_id: deposit.id,
            month_key: currentMonth
          });
          const paidThisMonth = monthPayments.some(p => p.payment_status === 'paid');
          if (paidThisMonth) {
            console.log(`[SKIP_PAID] ${deposit.owner_email} - rent already paid for ${currentMonth}`);
            continue;
          }
        } catch (e) {
          // RentPayment entity may not exist for all deposits yet — continue with reminder
          console.log(`[RENT_PAYMENT_CHECK] ${deposit.id}: ${e.message}`);
        }

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
        if (prefs.rent_reminders === false) {
          results.skipped_prefs++;
          console.log(`[SKIP] ${deposit.owner_email} has rent_reminders disabled`);
          continue;
        }

        const dueDateFormatted = thisMonthDue.toLocaleDateString('en-US', {
          timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric'
        });
        const emailBody = generateRentEmailBody(deposit, dueDateFormatted, reminderType, urgency, user.full_name);
        let sentChannel = null;

        // Send email via Resend (no unsubscribe footer)
        if (user.email_notifications !== false) {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'LeaseShield Notifications <notifications@leaseshield.asia>',
              to: [deposit.owner_email],
              subject: `🏠 ${subject}`,
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
          const lineMsg = generateRentLinePlainText(deposit, dueDateFormatted, reminderType, user.language || 'en');
          try {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
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
          console.log(`[SKIP] No channel for ${deposit.owner_email}`);
          continue;
        }

        // Mark reminder as sent for this month (dedup)
        await base44.asServiceRole.entities.DepositTracker.update(deposit.id, {
          [flagField]: currentMonth
        });

        // Log notification
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: deposit.owner_email,
          notification_type: 'rent_reminder',
          channel: sentChannel.includes('LINE') ? 'LINE' : 'Email',
          status: 'sent',
          related_entity_type: 'deposit',
          related_entity_id: deposit.id,
          message_preview: subject
        });

        // Create timeline event
        await base44.asServiceRole.entities.TimelineEvent.create({
          owner_email: deposit.owner_email,
          property_address: deposit.property_address || '',
          lease_id: deposit.lease_id || '',
          event_type: 'notification_rent_reminder',
          event_date: new Date().toISOString(),
          title: subject,
          description: `Automated rent reminder sent via ${sentChannel}. Rent ฿${(deposit.rent_amount || 0).toLocaleString()} due ${dueDateFormatted}.`,
          source: 'notification'
        });

        results[`sent_${reminderType}`] = (results[`sent_${reminderType}`] || 0) + 1;

      } catch (err) {
        console.error(`[ERROR] Deposit ${deposit.id}:`, err.message);
        results.errors.push(`${deposit.id}: ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[RENT_REMINDERS] Complete in ${duration}ms. Sent: 3day=${results.sent_3day}, due=${results.sent_due}, late=${results.sent_late}`);

    return Response.json({ success: true, duration_ms: duration, results });

  } catch (error) {
    console.error('[RENT_REMINDERS] Fatal error:', error.message);
    return Response.json({ success: false, error: error.message, results }, { status: 500 });
  }
});

function generateRentLinePlainText(deposit, dueDateFormatted, reminderType, language) {
  const amount = `฿${(deposit.rent_amount || 0).toLocaleString()}`;
  const prop = deposit.property_address || 'N/A';

  if (reminderType === '3day') {
    return `🏠 Rent Due in 3 Days\n\nRent: ${amount}\nDue: ${dueDateFormatted}\n🏠 ${prop}\n\n→ app.leaseshield.asia/PropertyTracker`;
  } else if (reminderType === 'due') {
    return `⚠️ Rent Due TODAY\n\nRent: ${amount}\n🏠 ${prop}\n\nPay now to avoid late fees.\n\n→ app.leaseshield.asia/PropertyTracker`;
  } else {
    return `🚨 Rent 3 Days OVERDUE\n\nRent: ${amount}\n🏠 ${prop}\n\nPay immediately to avoid penalties.\n\n→ app.leaseshield.asia/PropertyTracker`;
  }
}

function generateRentEmailBody(deposit, dueDateFormatted, reminderType, urgency, userName) {
  const amount = `฿${(deposit.rent_amount || 0).toLocaleString()}`;

  let message = '';
  let actionItems = '';
  let urgencyColor = '#FF9800';

  if (reminderType === '3day') {
    urgencyColor = '#FF9800';
    message = `Your rent payment of <strong>${amount}</strong> is due in 3 days.`;
    actionItems = `
      <li>Confirm payment method with landlord</li>
      <li>Set aside funds if not already done</li>
      <li>Keep payment receipt/proof</li>`;
  } else if (reminderType === 'due') {
    urgencyColor = '#F44336';
    message = `Your rent payment of <strong>${amount}</strong> is due <strong>TODAY</strong>.`;
    actionItems = `
      <li><strong>Make payment as soon as possible</strong></li>
      <li>Get receipt or confirmation</li>
      <li>Document payment in Evidence Vault</li>`;
  } else {
    urgencyColor = '#D32F2F';
    message = `Your rent payment of <strong>${amount}</strong> is <strong>3 days OVERDUE</strong>.`;
    actionItems = `
      <li><strong>Pay immediately to avoid late fees</strong></li>
      <li>Contact landlord if there's an issue</li>
      <li>Document all communications</li>
      <li>Check lease for late fee terms</li>`;
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;background:#f9f9f9;">
  <div style="background:${urgencyColor};color:white;padding:24px;text-align:center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="width:48px;height:48px;margin-bottom:8px;" />
    <h1 style="margin:0;font-size:22px;">Rent Payment Reminder</h1>
  </div>
  <div style="padding:30px 24px;background:white;">
    <p>Hi ${userName || 'there'},</p>
    <p style="font-size:17px;font-weight:600;color:${urgencyColor};">${message}</p>
    <div style="background:#f5f5f5;padding:16px 20px;border-radius:8px;margin:20px 0;">
      <p style="margin:0;"><strong>Rent Amount:</strong> ${amount}</p>
      <p style="margin:8px 0 0;"><strong>Due Date:</strong> ${dueDateFormatted}</p>
      ${deposit.property_address ? `<p style="margin:8px 0 0;"><strong>Property:</strong> ${deposit.property_address}</p>` : ''}
    </div>
    <h3 style="margin-top:24px;">Action Items:</h3>
    <ul style="padding-left:20px;">${actionItems}</ul>
    ${reminderType === 'late' ? `
    <div style="background:#FFEBEE;border-left:4px solid #F44336;padding:14px;margin:20px 0;border-radius:4px;">
      <p style="margin:0;color:#C62828;font-weight:600;">⚠️ Late Payment Notice</p>
      <p style="margin:8px 0 0;">Check your lease for late fee terms. Paying immediately can help maintain a good landlord relationship.</p>
    </div>` : ''}
    <div style="text-align:center;margin:28px 0;">
      <a href="https://app.leaseshield.asia/PropertyTracker" style="display:inline-block;background:#0C3B2E;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;">View Property Tracker</a>
    </div>
    <p style="margin-top:28px;color:#888;font-size:13px;">This is an automated rent payment reminder. Manage preferences in <a href="https://app.leaseshield.asia/Account" style="color:#0C3B2E;">Account Settings</a>.</p>
  </div>
  <div style="background:#f0f0f0;padding:16px;text-align:center;color:#999;font-size:12px;">
    <p style="margin:0;">LeaseShield — Protecting Your Rental Rights</p>
  </div>
</body></html>`;
}