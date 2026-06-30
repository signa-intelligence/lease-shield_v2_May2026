import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ADMIN FRAUD ALERT - Email notification for suspicious referral activity
 * 
 * Sends email to admin when high-risk referral patterns detected
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const headerSecret = req.headers.get('x-internal-secret');
    const reqBody = await req.json();
    const providedSecret = headerSecret || reqBody.internal_secret;
    const serviceAuth = req.headers.get('base44-service-authorization');
    if (!serviceAuth && (!expectedSecret || providedSecret !== expectedSecret)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const ADMIN_ALERT_EMAIL = Deno.env.get('ADMIN_ALERT_EMAIL') || 'steve.l@signa-consultants.com';

    if (!RESEND_API_KEY) {
      console.error('[FRAUD_ALERT] RESEND_API_KEY not set');
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { referralId, referrerEmail, riskScore, patterns } = reqBody;

    if (!referralId || !referrerEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedPatterns = typeof patterns === 'string' ? JSON.parse(patterns) : (patterns || []);
    const patternsList = parsedPatterns.map(p => 
      `- ${p.type}: ${p.message} (${p.severity} severity)`
    ).join('\n');

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #DC2626, #EF4444); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">⚠️ REFERRAL FRAUD ALERT</h2>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>A referral has been flagged for potential fraud and requires manual review.</p>
          
          <div style="background: #FEE2E2; padding: 16px; border-radius: 8px; border-left: 4px solid #DC2626; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Referral ID:</strong> ${referralId}</p>
            <p style="margin: 8px 0;"><strong>Referrer Email:</strong> ${referrerEmail}</p>
            <p style="margin: 8px 0;"><strong>Risk Score:</strong> ${riskScore}/100</p>
          </div>
          
          <div style="background: #FFFBEB; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <p style="margin: 0 0 12px 0; font-weight: bold;">Suspicious Patterns Detected:</p>
            <pre style="font-size: 12px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${patternsList || 'No specific patterns listed'}</pre>
          </div>
          
          <div style="background: #F0FDF4; padding: 16px; border-radius: 8px; border-left: 4px solid #10B981; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-weight: bold;">Action Required:</p>
            <p style="margin: 0;">Review this referral in the Admin Console and either:</p>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>Approve (issue credit)</li>
              <li>Block (mark as fraud)</li>
            </ul>
          </div>
          
          <p style="text-align: center; margin: 24px 0;">
            <a href="https://app.leaseshield.asia/adminconsole" 
               style="display: inline-block; padding: 12px 24px; background: #DC2626; color: white; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Review in Admin Console →
            </a>
          </p>
          
          <p style="margin-top: 24px; color: #666; font-size: 12px;">
            — Lease Shield Automated Fraud Detection
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lease Shield Security <no-reply@leaseshield.asia>',
        to: [ADMIN_ALERT_EMAIL],
        subject: `⚠️ Referral Fraud Alert - Risk Score ${riskScore}`,
        html: emailBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FRAUD_ALERT] Email send failed:', errorText);
      return Response.json({ error: 'Email send failed' }, { status: 500 });
    }

    console.log('[FRAUD_ALERT] ✅ Admin notified:', ADMIN_ALERT_EMAIL);

    return Response.json({ 
      ok: true,
      emailSent: true,
      recipient: ADMIN_ALERT_EMAIL
    });

  } catch (error) {
    console.error('[FRAUD_ALERT_ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});