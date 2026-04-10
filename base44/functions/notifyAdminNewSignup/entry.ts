import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ADMIN_LINE_USER_ID = Deno.env.get('LINE_SUPERADMIN_USER_ID');
const ADMIN_EMAIL = Deno.env.get('ADMIN_ALERT_EMAIL') || 'hello@leaseshield.asia';
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, user_name, plan_tier, signup_source } = await req.json();

    console.log(`[ADMIN_NOTIFY] New signup: ${user_email}`);

    const signupTime = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Bangkok',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Send LINE notification
    if (ADMIN_LINE_USER_ID && LINE_CHANNEL_ACCESS_TOKEN) {
      try {
        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: ADMIN_LINE_USER_ID,
            messages: [{
              type: 'text',
              text: `🎉 NEW USER SIGNUP\n\n` +
                    `👤 ${user_name || 'Name not set'}\n` +
                    `📧 ${user_email}\n` +
                    `⭐ Plan: ${plan_tier || 'Explorer'}\n` +
                    `📍 Source: ${signup_source || 'Direct'}\n` +
                    `⏰ ${signupTime}`
            }]
          })
        });
        console.log('[ADMIN_NOTIFY] LINE notification sent');
      } catch (error) {
        console.error('[ADMIN_NOTIFY] LINE error:', error);
      }
    }

    // Send email notification
    if (RESEND_API_KEY && ADMIN_EMAIL) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Lease Shield <notifications@leaseshield.asia>',
            to: [ADMIN_EMAIL],
            subject: `New User Signup: ${user_email}`,
            html: `
              <h2>🎉 New User Signup</h2>
              <p><strong>Name:</strong> ${user_name || 'Not set'}</p>
              <p><strong>Email:</strong> ${user_email}</p>
              <p><strong>Plan:</strong> ${plan_tier || 'Explorer'}</p>
              <p><strong>Source:</strong> ${signup_source || 'Direct'}</p>
              <p><strong>Time:</strong> ${signupTime}</p>
            `
          })
        });
        console.log('[ADMIN_NOTIFY] Email notification sent');
      } catch (error) {
        console.error('[ADMIN_NOTIFY] Email error:', error);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_NOTIFY] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});