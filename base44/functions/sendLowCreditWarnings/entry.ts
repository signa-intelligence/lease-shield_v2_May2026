import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Low credit warning system.
 * Checks all active users' scan credits and sends warnings at two levels:
 * - "low": credits at or below tier threshold (but > 0)
 * - "depleted": credits at 0
 * Uses boolean flags on User entity to prevent duplicate sends per cycle.
 * Flags are reset when credits are refilled (subscription renewal, manual top-up, upgrade).
 * Designed to run daily at 10:00 AM Bangkok time via scheduled automation.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  const results = {
    checked: 0,
    sent_low: 0,
    sent_depleted: 0,
    skipped_secure: 0,
    skipped_prefs: 0,
    errors: []
  };

  try {
    const base44 = createClientFromRequest(req);

    // Fetch all users
    const allUsers = await base44.asServiceRole.entities.User.filter({});
    results.checked = allUsers.length;

    console.log(`[CREDIT_WARNINGS] Checking ${allUsers.length} users`);

    // Tier thresholds: low = warn at this level, total = monthly allocation
    const thresholds = {
      explorer: { low: 1, total: 1 },
      lite:     { low: 2, total: 6 },
      protect:  { low: 3, total: 12 }
    };

    for (const user of allUsers) {
      try {
        const tier = (user.plan_tier || 'explorer').toLowerCase();

        // Skip Secure tier (unlimited scans)
        if (tier === 'secure') {
          results.skipped_secure++;
          continue;
        }

        // Skip deleted/inactive users
        if (user.is_deleted === true) continue;

        // Skip if notification preferences disabled
        const prefs = user.notification_preferences || {};
        if (prefs.credit_warnings === false) {
          results.skipped_prefs++;
          continue;
        }

        // Calculate effective credits
        const availableScans = user.available_scans || 0;
        const oneTimeCredits = user.one_time_scan_credits || 0;
        const manualCredits = user.manual_tier_override ? (user.manual_scan_credits || 0) : 0;
        const totalCredits = availableScans + oneTimeCredits + manualCredits;

        const threshold = thresholds[tier] || thresholds.explorer;

        let warningType = null;
        let subject = '';

        // Check depleted first (higher priority)
        if (totalCredits === 0 && user.credit_depleted_warning_sent !== true) {
          warningType = 'depleted';
          subject = 'No Scan Credits Remaining — Action Needed';
        }
        // Then check low
        else if (totalCredits > 0 && totalCredits <= threshold.low && user.credit_low_warning_sent !== true) {
          warningType = 'low';
          subject = `Only ${totalCredits} Scan Credit${totalCredits === 1 ? '' : 's'} Remaining`;
        }

        if (!warningType) continue;

        // Build and send email
        const emailBody = generateCreditEmailBody(user, totalCredits, warningType, tier, threshold.total);

        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'LeaseShield Notifications',
          to: user.email,
          subject: `⚠️ ${subject}`,
          body: emailBody
        });
        console.log(`[SENT] ${warningType} credit warning to ${user.email} (${totalCredits} credits)`);

        // Mark flag to prevent re-send
        const updateData = {};
        if (warningType === 'depleted') updateData.credit_depleted_warning_sent = true;
        if (warningType === 'low') updateData.credit_low_warning_sent = true;
        await base44.asServiceRole.entities.User.update(user.id, updateData);

        // Log notification
        await base44.asServiceRole.entities.NotificationLog.create({
          user_email: user.email,
          notification_type: 'credit_warning',
          channel: 'Email',
          status: 'sent',
          related_entity_type: 'user',
          related_entity_id: user.id,
          message_preview: subject
        });

        // LINE for premium tiers
        if (['protect'].includes(tier) && user.line_messaging_token && user.line_notifications) {
          try {
            await base44.asServiceRole.functions.invoke('sendLineMessage', {
              userId: user.line_messaging_token,
              message: `⚠️ ${subject}\n\nYou have ${totalCredits} scan credit${totalCredits === 1 ? '' : 's'} left.\n\nTop up → app.leaseshield.asia/Account`
            });
          } catch (lineErr) {
            console.error(`[LINE_FAIL] ${user.email}:`, lineErr.message);
          }
        }

        results[`sent_${warningType}`]++;

      } catch (err) {
        console.error(`[ERROR] User ${user.email}:`, err.message);
        results.errors.push(`${user.email}: ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CREDIT_WARNINGS] Complete in ${duration}ms. low=${results.sent_low}, depleted=${results.sent_depleted}`);
    return Response.json({ success: true, duration_ms: duration, results });

  } catch (error) {
    console.error('[CREDIT_WARNINGS] Fatal:', error.message);
    return Response.json({ success: false, error: error.message, results }, { status: 500 });
  }
});


function generateCreditEmailBody(user, creditsRemaining, warningType, planTier, tierTotal) {
  const userName = user.full_name || 'there';
  const urgencyColor = warningType === 'depleted' ? '#F44336' : '#FF9800';

  const message = warningType === 'depleted'
    ? `You have used all your scan credits.`
    : `You have ${creditsRemaining} scan credit${creditsRemaining === 1 ? '' : 's'} remaining.`;

  let upgradeBlock = '';
  if (planTier === 'explorer') {
    upgradeBlock = `
      <div style="background:#E8F5E9;padding:16px 20px;border-radius:8px;margin:20px 0;">
        <h3 style="margin:0 0 8px;color:#2E7D32;">💡 Upgrade Options</h3>
        <ul style="padding-left:20px;margin:8px 0;">
          <li><strong>Lite (฿158/mo):</strong> 6 scans + deposit tracking</li>
          <li><strong>Protect (฿325/mo):</strong> 12 scans + full features</li>
          <li><strong>Secure (฿825/mo):</strong> Unlimited scans + priority support</li>
        </ul>
      </div>`;
  } else if (planTier === 'lite') {
    upgradeBlock = `
      <div style="background:#E8F5E9;padding:16px 20px;border-radius:8px;margin:20px 0;">
        <h3 style="margin:0 0 8px;color:#2E7D32;">💡 Upgrade for More Scans</h3>
        <ul style="padding-left:20px;margin:8px 0;">
          <li><strong>Protect (฿325/mo):</strong> 12 scans/month</li>
          <li><strong>Secure (฿825/mo):</strong> Unlimited scans</li>
        </ul>
      </div>`;
  } else if (planTier === 'protect') {
    upgradeBlock = `
      <div style="background:#E8F5E9;padding:16px 20px;border-radius:8px;margin:20px 0;">
        <h3 style="margin:0 0 8px;color:#2E7D32;">💡 Go Unlimited</h3>
        <p style="margin:8px 0;"><strong>Secure (฿825/mo):</strong> Unlimited scans, 20GB storage, priority support.</p>
      </div>`;
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;background:#f9f9f9;">
  <div style="background:${urgencyColor};color:white;padding:24px;text-align:center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="width:48px;height:48px;margin-bottom:8px;" />
    <h1 style="margin:0;font-size:22px;">${warningType === 'depleted' ? '⚠️ Credits Depleted' : '⚠️ Low Credits'}</h1>
  </div>
  <div style="padding:30px 24px;background:white;">
    <p>Hi ${userName},</p>
    <p style="font-size:17px;font-weight:600;color:${urgencyColor};">${message}</p>
    <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;text-align:center;">
      <div style="font-size:48px;font-weight:bold;color:${urgencyColor};margin-bottom:8px;">${creditsRemaining}</div>
      <div style="font-size:14px;color:#666;">scan credits remaining</div>
    </div>
    ${upgradeBlock}
    <div style="text-align:center;margin:28px 0;">
      <a href="https://app.leaseshield.asia/Account" style="display:inline-block;background:#0C3B2E;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;">${warningType === 'depleted' ? 'Upgrade Now' : 'View Account'}</a>
    </div>
    <p style="margin-top:28px;color:#888;font-size:13px;">Credits reset on your billing renewal date. Manage preferences in <a href="https://app.leaseshield.asia/Account" style="color:#0C3B2E;">Account Settings</a>.</p>
  </div>
  <div style="background:#f0f0f0;padding:16px;text-align:center;color:#999;font-size:12px;">
    <p style="margin:0;">LeaseShield — Protecting Your Rental Rights</p>
  </div>
</body></html>`;
}