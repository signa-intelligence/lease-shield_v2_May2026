import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, htmlBody, fromName } = await req.json();

    if (!to || !subject || !htmlBody) {
      return Response.json({ error: 'Missing required fields: to, subject, htmlBody' }, { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    console.log('📧 Sending external email via Resend...');
    console.log('To:', to);
    console.log('Subject:', subject);

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromName ? `${fromName} <notifications@leaseshield.asia>` : 'Lease Shield <notifications@leaseshield.asia>',
        to: [to],
        subject: subject,
        html: htmlBody,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error:', data);
      return Response.json({ 
        error: 'Failed to send email', 
        details: data 
      }, { status: response.status });
    }

    console.log('✅ Email sent successfully via Resend');
    console.log('Message ID:', data.id);

    return Response.json({
      success: true,
      messageId: data.id,
      to: to
    });

  } catch (error) {
    console.error('❌ Error sending external email:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});