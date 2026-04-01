import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, full_name, current_usage_bytes, grace_period_ends, previous_tier } = await req.json();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const name = full_name || email.split('@')[0];
    const usageMB = ((current_usage_bytes || 0) / (1024 * 1024)).toFixed(1);
    const usageLabel = usageMB >= 1024 ? `${(usageMB / 1024).toFixed(2)}GB` : `${usageMB}MB`;
    const graceEndDate = grace_period_ends
      ? new Date(grace_period_ends).toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric' })
      : '30 days';
    const prevTierLabel = (previous_tier || 'paid').charAt(0).toUpperCase() + (previous_tier || 'paid').slice(1);

    const subject = '⚠️ Storage Limit Exceeded — Action Required';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;background:#f9f9f9;">
  <div style="background:#FF9800;color:white;padding:24px;text-align:center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="LeaseShield" style="width:48px;height:48px;margin-bottom:8px;" />
    <h1 style="margin:0;font-size:22px;">⚠️ Storage Limit Exceeded</h1>
  </div>
  <div style="padding:30px 24px;background:white;">
    <p>Hi ${name},</p>
    <p>Your account has been moved to the <strong>Explorer (free)</strong> plan from <strong>${prevTierLabel}</strong>. However, you currently have <strong>${usageLabel}</strong> of files stored, which exceeds the Explorer tier's 100MB limit.</p>

    <div style="background:#FFF3E0;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #FF9800;">
      <p style="margin:0;font-weight:600;">What happens now:</p>
      <p style="margin:10px 0 0 0;">✅ All your files remain accessible until <strong>${graceEndDate}</strong></p>
      <p style="margin:10px 0 0 0;">❌ New uploads are blocked until you're under the limit</p>
      <p style="margin:10px 0 0 0;">⚠️ After ${graceEndDate}, excess files may be archived</p>
    </div>

    <h3 style="margin-top:24px;">Your options:</h3>
    <ol style="padding-left:20px;">
      <li><strong>Upgrade</strong> to any paid plan to keep all files and resume uploading</li>
      <li><strong>Delete files</strong> in Evidence Vault to get under 100MB</li>
      <li><strong>Do nothing</strong> — files remain accessible during the grace period</li>
    </ol>

    <div style="text-align:center;margin:28px 0;">
      <a href="https://app.leaseshield.asia/Account?showPlans=true" style="display:inline-block;background:#0C3B2E;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;margin-right:8px;">Upgrade Now</a>
      <a href="https://app.leaseshield.asia/EvidenceVault" style="display:inline-block;background:#6B7280;color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;">Manage Files</a>
    </div>

    <p style="margin-top:28px;color:#888;font-size:13px;">This is a transactional notification about your account storage status.</p>
  </div>
  <div style="background:#f0f0f0;padding:16px;text-align:center;color:#999;font-size:12px;">
    <p style="margin:0;">LeaseShield — Protecting Your Rental Rights</p>
  </div>
</body></html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LeaseShield Notifications <notifications@leaseshield.asia>',
        to: [email],
        subject,
        html
      })
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('[STORAGE_WARNING] Resend failed:', errText);
      return Response.json({ success: false, error: errText }, { status: 500 });
    }

    console.log('[STORAGE_WARNING] ✅ Sent to:', email, 'usage:', usageLabel);
    return Response.json({ success: true });

  } catch (error) {
    console.error('[STORAGE_WARNING] Error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});