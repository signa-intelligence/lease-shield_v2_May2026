import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) return null;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'LeaseShield <notifications@leaseshield.asia>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  });
  const result = await res.json();
  if (!res.ok) {
    console.error('[CASE_RESOLVE_NOTIFY] Resend error:', result);
    return null;
  }
  return result;
}

function buildResolutionHtml({ userName, caseNumber, settlementAmount, settlementMethod, notes, resolvedDate }) {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <div style="font-size: 32px;">✅</div>
    <h2 style="color: white; margin: 8px 0 0 0; font-size: 18px;">Your Case Has Been Resolved</h2>
  </div>
  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px; padding: 20px;">
    <p style="color: #334155; font-size: 14px;">Hi <strong>${userName}</strong>,</p>
    <p style="color: #334155; font-size: 14px;">Great news — your dispute case has been resolved!</p>

    <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 16px; border-radius: 4px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #065F46;">
        <tr><td style="padding: 4px 0; font-weight: 600;">Case:</td><td style="padding: 4px 0;">${caseNumber}</td></tr>
        ${settlementAmount ? `<tr><td style="padding: 4px 0; font-weight: 600;">Settlement:</td><td style="padding: 4px 0; font-weight: bold;">฿${Number(settlementAmount).toLocaleString()}</td></tr>` : ''}
        ${settlementMethod ? `<tr><td style="padding: 4px 0; font-weight: 600;">Method:</td><td style="padding: 4px 0;">${settlementMethod}</td></tr>` : ''}
        <tr><td style="padding: 4px 0; font-weight: 600;">Resolved:</td><td style="padding: 4px 0;">${resolvedDate}</td></tr>
      </table>
    </div>

    ${notes ? `<p style="color: #334155; font-size: 13px; background: #F1F5F9; padding: 12px; border-radius: 6px;">${notes}</p>` : ''}

    <a href="https://app.leaseshield.asia/Cases" style="display: inline-block; background: #0C3B2E; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 12px;">
      View Case Details →
    </a>

    <p style="color: #64748B; font-size: 13px; margin-top: 20px;">Thank you for trusting LeaseShield to help resolve your dispute.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 12px;">— The LeaseShield Team</p>
  </div>
</div>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const hasAccess = ['va', 'admin', 'super_admin'].includes(user.access_level) || ['va', 'admin', 'super_admin'].includes(user.role);
    if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { caseId, settlementAmount, settlementMethod, notes } = await req.json();
    if (!caseId) return Response.json({ error: 'Missing caseId' }, { status: 400 });

    // Get case data
    const allCases = await base44.entities.Case.list('-created_date', 200);
    const caseData = allCases.find(c => c.id === caseId);
    if (!caseData) return Response.json({ error: 'Case not found' }, { status: 404 });

    const tenantEmail = caseData.user_email;
    if (!tenantEmail) return Response.json({ error: 'No tenant email on case' }, { status: 400 });

    // Get tenant user for name
    const allUsers = await base44.asServiceRole.entities.User.list();
    const tenant = allUsers.find(u => u.email === tenantEmail);
    const tenantName = tenant?.full_name || tenantEmail;

    const resolvedDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric' });

    console.log('[CASE_RESOLVE_NOTIFY] Sending resolution notification to', tenantEmail, 'for case', caseData.case_number);

    const result = await sendEmail({
      to: tenantEmail,
      subject: `✅ Case ${caseData.case_number || ''} Resolved`,
      html: buildResolutionHtml({
        userName: tenantName,
        caseNumber: caseData.case_number || caseId.slice(0, 8),
        settlementAmount,
        settlementMethod,
        notes,
        resolvedDate
      })
    });

    console.log('[CASE_RESOLVE_NOTIFY] Email result:', result ? 'sent' : 'failed');

    return Response.json({ success: true, sent: !!result });

  } catch (error) {
    console.error('[CASE_RESOLVE_NOTIFY] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});