import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) return null;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'LeaseShield Ops <notifications@leaseshield.asia>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  });
  const result = await res.json();
  if (!res.ok) {
    console.error('[CASE_ASSIGN_NOTIFY] Resend error:', result);
    return null;
  }
  return result;
}

async function sendLine(lineUserId, text) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !lineUserId) return false;
  if (!lineUserId.startsWith('U') || lineUserId.length !== 33) return false;

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }]
    })
  });
  return res.ok;
}

function buildAssigneeHtml({ assigneeName, caseNumber, caseId, tenantName, tenantEmail, propertyAddress, disputeAmount, caseType, isFastTrack, assignedBy }) {
  const urgency = isFastTrack ? 'FAST TRACK — 1 business day SLA' : 'Standard — 2-3 business days SLA';
  const urgencyColor = isFastTrack ? '#DC2626' : '#F59E0B';
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0C3B2E, #047857); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <div style="font-size: 32px;">🎯</div>
    <h2 style="color: white; margin: 8px 0 0 0; font-size: 18px;">Case Assigned to You</h2>
  </div>
  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px; padding: 20px;">
    <p style="color: #334155; font-size: 14px;">Hi <strong>${assigneeName}</strong>,</p>
    <p style="color: #334155; font-size: 14px;">A case has been assigned to you for review:</p>

    <div style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
        <tr><td style="padding: 6px 0; font-weight: 600;">Case:</td><td style="padding: 6px 0;">${caseNumber || 'N/A'}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600;">Tenant:</td><td style="padding: 6px 0;">${tenantName || tenantEmail || 'N/A'}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600;">Property:</td><td style="padding: 6px 0;">${propertyAddress || 'Not provided'}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600;">Dispute:</td><td style="padding: 6px 0;">฿${disputeAmount ? Number(disputeAmount).toLocaleString() : 'N/A'}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600;">Type:</td><td style="padding: 6px 0;">${(caseType || 'deposit').toUpperCase()}</td></tr>
      </table>
    </div>

    <div style="background: ${isFastTrack ? '#FEF2F2' : '#FFFBEB'}; border-left: 4px solid ${urgencyColor}; padding: 12px; border-radius: 4px; margin: 16px 0;">
      <p style="margin: 0; font-size: 13px; color: ${urgencyColor}; font-weight: 600;">⏱️ ${urgency}</p>
    </div>

    <a href="https://app.leaseshield.asia/OpsConsole" style="display: inline-block; background: #0C3B2E; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 12px;">
      Open Ops Console →
    </a>

    <p style="color: #94A3B8; font-size: 12px; margin-top: 16px;">Assigned by ${assignedBy} on ${timestamp}</p>
  </div>
</div>`;
}

function buildSuperAdminAlertHtml({ assigneeName, assigneeEmail, caseNumber, tenantEmail, disputeAmount, assignedBy }) {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px; padding: 16px;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #0369A1; font-weight: 600;">📋 Case Assignment Update</p>
    <p style="margin: 4px 0; font-size: 13px; color: #334155;">Case <strong>${caseNumber || 'N/A'}</strong> assigned to <strong>${assigneeName}</strong> (${assigneeEmail})</p>
    <p style="margin: 4px 0; font-size: 13px; color: #334155;">Tenant: ${tenantEmail} · Amount: ฿${disputeAmount ? Number(disputeAmount).toLocaleString() : 'N/A'}</p>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #94A3B8;">By ${assignedBy} on ${timestamp}</p>
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

    const { caseId, assigneeEmail } = await req.json();
    if (!caseId || !assigneeEmail) return Response.json({ error: 'Missing caseId or assigneeEmail' }, { status: 400 });

    // Get case data
    const cases = await base44.entities.Case.filter({ id: caseId });
    const caseData = cases?.[0];
    if (!caseData) {
      // Try direct list approach
      const allCases = await base44.entities.Case.list('-created_date', 200);
      const found = allCases.find(c => c.id === caseId);
      if (!found) return Response.json({ error: 'Case not found' }, { status: 404 });
      Object.assign(caseData || {}, found);
    }

    // Get all users for lookups
    const allUsers = await base44.asServiceRole.entities.User.list();
    const assignee = allUsers.find(u => u.email === assigneeEmail);
    if (!assignee) return Response.json({ error: 'Assignee not found' }, { status: 404 });

    const assigneeName = assignee.full_name || assignee.email;
    const isFastTrack = caseData?.fast_track || (caseData?.case_number?.charAt(1) === 'F');
    const notifications = [];

    console.log('[CASE_ASSIGN_NOTIFY] Sending notifications for case', caseData?.case_number, 'assigned to', assigneeEmail);

    // 1. Email to assigned admin/VA
    notifications.push(
      sendEmail({
        to: assigneeEmail,
        subject: `🎯 Case ${caseData?.case_number || caseId.slice(0, 8)} Assigned to You`,
        html: buildAssigneeHtml({
          assigneeName,
          caseNumber: caseData?.case_number,
          caseId,
          tenantName: caseData?.landlord_name, // The case creator
          tenantEmail: caseData?.user_email,
          propertyAddress: caseData?.property_address,
          disputeAmount: caseData?.dispute_amount,
          caseType: caseData?.type,
          isFastTrack,
          assignedBy: user.full_name || user.email
        })
      }).then(r => r ? `email:${assigneeEmail}` : null).catch(e => { console.error('[CASE_ASSIGN_NOTIFY] Email error:', e.message); return null; })
    );

    // 2. LINE to assigned admin/VA
    if (assignee.line_messaging_token) {
      const urgencyLabel = isFastTrack ? '⚡ FAST TRACK' : '📋 Standard';
      notifications.push(
        sendLine(assignee.line_messaging_token, [
          '🎯 Case Assigned to You',
          '',
          `📋 Case: ${caseData?.case_number || 'N/A'}`,
          `👤 Tenant: ${caseData?.user_email || 'N/A'}`,
          `💰 Amount: ฿${caseData?.dispute_amount ? Number(caseData.dispute_amount).toLocaleString() : 'N/A'}`,
          `⏱️ Priority: ${urgencyLabel}`,
          '',
          `Assigned by: ${user.full_name || user.email}`,
          '',
          'Open Ops Console to review →'
        ].join('\n')).then(ok => ok ? `line:${assigneeEmail}` : null).catch(() => null)
      );
    }

    // 3. Email super admins (except the person who assigned and the assignee)
    const superAdmins = allUsers.filter(u =>
      u.is_active !== false &&
      u.email !== user.email &&
      u.email !== assigneeEmail &&
      (u.access_level === 'super_admin' || u.role === 'super_admin')
    );

    for (const admin of superAdmins) {
      notifications.push(
        sendEmail({
          to: admin.email,
          subject: `📋 Case ${caseData?.case_number || ''} → ${assigneeName}`,
          html: buildSuperAdminAlertHtml({
            assigneeName,
            assigneeEmail,
            caseNumber: caseData?.case_number,
            tenantEmail: caseData?.user_email,
            disputeAmount: caseData?.dispute_amount,
            assignedBy: user.full_name || user.email
          })
        }).then(r => r ? `email:${admin.email}` : null).catch(() => null)
      );
    }

    const results = await Promise.allSettled(notifications);
    const sent = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
    console.log('[CASE_ASSIGN_NOTIFY] Sent:', sent);

    return Response.json({ success: true, notifications_sent: sent.length, sent });

  } catch (error) {
    console.error('[CASE_ASSIGN_NOTIFY] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});