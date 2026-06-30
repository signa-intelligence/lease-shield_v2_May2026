import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Subscription renewal reminder system.
 * Checks all paid-tier users and sends reminders at:
 * - 7 days before renewal
 * - 1 day before renewal
 * - On renewal day (confirmation + flag reset for next cycle)
 * Uses boolean flags on User entity to prevent duplicate sends per cycle.
 * Designed to run daily at 10:15 AM Bangkok time via scheduled automation.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  const results = {
    checked: 0,
    sent_7day: 0,
    sent_1day: 0,
    sent_renewed: 0,
    skipped_free: 0,
    skipped_no_date: 0,
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
    const allUsers = await base44.asServiceRole.entities.User.filter({});
    results.checked = allUsers.length;

    // Bangkok date
    const now = new Date();
    const bangkokNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    const todayStr = bangkokNow.toISOString().split('T')[0];
    const todayDate = new Date(todayStr + 'T00:00:00Z');

    console.log(`[SUB_REMINDERS] Checking ${allUsers.length} users. Bangkok date: ${todayStr}`);

    const planNames = { lite: 'Lite', protect: 'Protect', secure: 'Secure' };
    const planPricesMonthly = { lite: 158, protect: 325, secure: 825 };
    const planPricesAnnual = { lite: 1896, protect: 3900, secure: 9900 };

    for (const user of allUsers) {
      try {
        const tier = (user.plan_tier || 'explorer').toLowerCase();

        // Skip free/explorer tier
        if (tier === 'explorer' || !user.plan_tier) {
          results.skipped_free++;
          continue;
        }

        // Skip deleted users
        if (user.is_deleted === true) continue;

        // Skip if no renewal date
        if (!user.subscription_renewal_date) {
          results.skipped_no_date++;
          continue;
        }

        // Skip if prefs disabled
        const prefs = user.notification_preferences || {};
        if (prefs.subscription_reminders === false) continue;

        const renewalDate = new Date(user.subscription_renewal_date);
        renewalDate.setUTCHours(0, 0, 0, 0);
        const daysUntilRenewal = Math.round((renewalDate - todayDate) / (1000 * 60 * 60 * 24));

        let reminderType = null;
        let subject = '';

        if (daysUntilRenewal === 7 && user.renewal_7d_sent !== true) {
          reminderType = '7day';
          subject = 'Subscription Renews in 7 Days';
        } else if (daysUntilRenewal === 1 && user.renewal_1d_sent !== true) {
          reminderType = '1day';
          subject = 'Subscription Renews Tomorrow';
        } else if (daysUntilRenewal <= 0 && user.renewal_today_sent !== true) {
          reminderType = 'renewed';
          subject = 'Subscription Renewed — Credits Refreshed';
        }

        if (!reminderType) continue;

        const planName = planNames[tier] || tier;
        const isAnnual = user.billing_cycle === 'annual';
        const amount = isAnnual ? (planPricesAnnual[tier] || 0) : (planPricesMonthly[tier] || 0);
        const renewalFormatted = renewalDate.toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });

        const emailBody = generateRenewalEmailBody(user, renewalFormatted, reminderType, planName, amount, isAnnual);

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LeaseShield Notifications <notifications@leaseshield.asia>',
            to: [user.email],
            subject: `📋 ${subject}`,
            html: emailBody
          })
        });
        if (!emailRes.ok) {
          const errData = await emailRes.text();
          throw new Error(`Resend failed: ${errData}`);
        }
        console.log(`[SENT] ${reminderType} renewal reminder to ${user.email}`);

        // Update flags
        const updateData = {};
        if (reminderType === '7day') updateData.renewal_7d_sent = true;
        if (reminderType === '1day') updateData.renewal_1d_sent = true;
        if (reminderType === 'renewed') {
          updateData.renewal_today_sent = true;
          // Reset all flags for next billing cycle
          updateData.renewal_7d_sent = false;
          updateData.renewal_1d_sent = false;
          // Also reset credit warning flags (credits refreshed)
          updateData.credit_low_warning_sent = false;
          updateData.credit_depleted_warning_sent = false;
        }
        await base44.asServiceRole.entities.User.update(user.id, updateData);

        // Log notification
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: user.email,
          notification_type: 'subscription_renewal',
          channel: 'Email',
          status: 'sent',
          related_entity_type: 'user',
          related_entity_id: user.id,
          message_preview: subject
        });

        // LINE for premium tiers
        if (['protect', 'secure'].includes(tier) && user.line_messaging_token && user.line_notifications) {
          try {
            const lineMsg = reminderType === 'renewed'
              ? `✅ Subscription Renewed!\n\nYour ${planName} plan has been renewed. Credits refreshed.\n\n→ app.leaseshield.asia/Account`
              : `📋 ${subject}\n\nPlan: ${planName}\nAmount: ฿${amount.toLocaleString()}\nDate: ${renewalFormatted}\n\n→ app.leaseshield.asia/Account`;
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: user.line_messaging_token,
              message: lineMsg
            });
          } catch (lineErr) {
            console.error(`[LINE_FAIL] ${user.email}:`, lineErr.message);
          }
        }

        results[`sent_${reminderType}`]++;

      } catch (err) {
        console.error(`[ERROR] User ${user.email}:`, err.message);
        results.errors.push(`${user.email}: ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[SUB_REMINDERS] Complete in ${duration}ms. 7day=${results.sent_7day}, 1day=${results.sent_1day}, renewed=${results.sent_renewed}`);
    return Response.json({ success: true, duration_ms: duration, results });

  } catch (error) {
    console.error('[SUB_REMINDERS] Fatal:', error.message);
    return Response.json({ success: false, error: error.message, results }, { status: 500 });
  }
});


function generateRenewalEmailBody(user, renewalFormatted, reminderType, planName, amount, isAnnual) {
  const userName = user.full_name || 'there';
  const amountStr = `฿${amount.toLocaleString()}`;
  const billingLabel = isAnnual ? '/year' : '/month';

  let urgencyColor, heading, message, content;

  if (reminderType === '7day') {
    urgencyColor = '#2196F3';
    heading = 'Subscription Renews Soon';
    message = `Your ${planName} plan renews in 7 days.`;
    content = `
      <div style="background:#E3F2FD;padding:16px 20px;border-radius:8px;margin:20px 0;">
        <p style="margin:0;"><strong>Renewal Date:</strong> ${renewalFormatted}</p>
        <p style="margin:8px 0 0;"><strong>Plan:</strong> ${planName}</p>
        <p style="margin:8px 0 0;"><strong>Amount:</strong> ${amountStr}${billingLabel}</p>
      </div>
      <p>Your payment method will be charged automatically. No action needed.</p>
      <div style="background:#FFF3E0;border-left:4px solid #FF9800;padding:14px;margin:20px 0;border-radius:4px;">
        <p style="margin:0;font-weight:600;">Want to make changes?</p>
        <p style="margin:8px 0 0;">Update your payment method or change plans anytime in Account Settings.</p>
      </div>`;
  } else if (reminderType === '1day') {
    urgencyColor = '#FF9800';
    heading = 'Subscription Renews Tomorrow';
    message = `Your ${planName} plan (${amountStr}${billingLabel}) renews <strong>tomorrow</strong>.`;
    content = `
      <div style="background:#FFF3E0;padding:16px 20px;border-radius:8px;margin:20px 0;border-left:4px solid #FF9800;">
        <p style="margin:0;"><strong>Renewal Date:</strong> ${renewalFormatted}</p>
        <p style="margin:8px 0 0;"><strong>Amount:</strong> ${amountStr}${billingLabel}</p>
      </div>
      <p>Make sure your payment method is up to date to avoid service interruption.</p>`;
  } else {
    urgencyColor = '#4CAF50';
    heading = '✅ Subscription Renewed';
    message = `Your ${planName} plan has been renewed successfully.`;
    content = `
      <div style="background:#E8F5E9;padding:16px 20px;border-radius:8px;margin:20px 0;">
        <p style="margin:0;font-weight:600;color:#2E7D32;">What's refreshed:</p>
        <ul style="padding-left:20px;margin:8px 0;">
          <li>Scan credits restored</li>
          <li>Letter credits restored</li>
          <li>All monthly limits reset</li>
        </ul>
      </div>
      <p>Thank you for being a LeaseShield ${planName} member! Your protection continues.</p>`;
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;background:#f9f9f9;">
  <div style="background:${urgencyColor};color:white;padding:24px;text-align:center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="width:48px;height:48px;margin-bottom:8px;" />
    <h1 style="margin:0;font-size:22px;">${heading}</h1>
  </div>
  <div style="padding:30px 24px;background:white;">
    <p>Hi ${userName},</p>
    <p style="font-size:17px;font-weight:600;color:${urgencyColor};">${message}</p>
    ${content}
    <div style="text-align:center;margin:28px 0;">
      <a href="https://app.leaseshield.asia/Account" style="display:inline-block;background:#0C3B2E;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;">View Account</a>
    </div>
    <p style="margin-top:28px;color:#888;font-size:13px;">Manage preferences in <a href="https://app.leaseshield.asia/Account" style="color:#0C3B2E;">Account Settings</a>.</p>
  </div>
  <div style="background:#f0f0f0;padding:16px;text-align:center;color:#999;font-size:12px;">
    <p style="margin:0;">LeaseShield — Protecting Your Rental Rights</p>
  </div>
</body></html>`;
}