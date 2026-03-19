import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (message.length < 20) {
      return Response.json({ error: 'Message must be at least 20 characters' }, { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const htmlBody = `
      <h3>New FAQ Contact Form Submission</h3>
      <hr/>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Account Email:</strong> ${user.email}</p>
      <p><strong>Plan:</strong> ${user.plan_tier || 'explorer'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr/>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>
      <hr/>
      <p style="color: #666; font-size: 12px;">Sent via Lease Shield FAQ Contact Form</p>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lease Shield <noreply@leaseshield.asia>',
        to: ['ops@leaseshield.asia'],
        reply_to: email,
        subject: `FAQ Contact Form Submission — Lease Shield: ${subject}`,
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', resendResponse.status, errorData);
      return Response.json({ error: 'Failed to send email' }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('faqContactForm error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});