import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

const ROLE_LABELS = {
  user: 'Regular User',
  va: 'Virtual Assistant (VA)',
  admin: 'Administrator',
  super_admin: 'Super Administrator'
};

const ROLE_PERMISSIONS = {
  user: ['View personal dashboard', 'Upload leases', 'Submit cases'],
  va: ['All User permissions', 'Access Ops Console', 'View assigned cases', 'Update case status'],
  admin: ['All VA permissions', 'Manage all cases', 'View analytics', 'Manage users'],
  super_admin: ['All Admin permissions', 'Change user roles', 'Access revenue data', 'System configuration']
};

async function sendEmailViaResend({ to, subject, html, fromName = 'LeaseShield' }) {
  if (!RESEND_API_KEY) {
    console.warn('[ROLE_NOTIFY] RESEND_API_KEY not configured, skipping email');
    return null;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${fromName} <notifications@leaseshield.asia>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  });
  const result = await res.json();
  if (!res.ok) {
    console.error('[ROLE_NOTIFY] Resend error:', result);
    return null;
  }
  return result;
}

async function sendLineMessage(lineUserId, text) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !lineUserId) return null;
  if (!lineUserId.startsWith('U') || lineUserId.length !== 33) return null;
  
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

function buildAdminAlertHtml({ targetName, targetEmail, oldRole, newRole, changedBy }) {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7C3AED, #6D28D9); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <div style="font-size: 32px;">🔐</div>
    <h2 style="color: white; margin: 8px 0 0 0; font-size: 18px;">User Role Changed</h2>
  </div>
  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px; padding: 20px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
      <tr><td style="padding: 8px 0; font-weight: 600;">User:</td><td style="padding: 8px 0;">${targetName} (${targetEmail})</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 600;">Previous Role:</td><td style="padding: 8px 0;">${ROLE_LABELS[oldRole] || oldRole}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 600;">New Role:</td><td style="padding: 8px 0; color: #7C3AED; font-weight: bold;">${ROLE_LABELS[newRole] || newRole}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 600;">Changed By:</td><td style="padding: 8px 0;">${changedBy}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: 600;">Date (BKK):</td><td style="padding: 8px 0;">${timestamp}</td></tr>
    </table>
    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
    <p style="font-size: 12px; color: #94A3B8; margin: 0;">Automated security notification from LeaseShield.</p>
  </div>
</div>`;
}

function buildUserConfirmationHtml({ userName, newRole }) {
  const permissions = ROLE_PERMISSIONS[newRole] || [];
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0C3B2E, #047857); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <div style="font-size: 32px;">🎉</div>
    <h2 style="color: white; margin: 8px 0 0 0; font-size: 18px;">Your Role Has Been Updated</h2>
  </div>
  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px; padding: 20px;">
    <p style="color: #334155; font-size: 14px;">Hi <strong>${userName}</strong>,</p>
    <p style="color: #334155; font-size: 14px;">Your LeaseShield account has been granted <strong style="color: #0C3B2E;">${ROLE_LABELS[newRole] || newRole}</strong> access.</p>
    <div style="background: #ECFDF5; padding: 16px; border-radius: 8px; border-left: 4px solid #10B981; margin: 16px 0;">
      <p style="font-weight: 600; color: #065F46; margin: 0 0 8px 0;">Your Permissions:</p>
      <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 13px;">
        ${permissions.map(p => `<li style="margin: 4px 0;">${p}</li>`).join('')}
      </ul>
    </div>
    <p style="color: #64748B; font-size: 13px;">If you didn't expect this change, please contact support immediately.</p>
    <p style="color: #334155; font-size: 14px; margin-top: 20px;">— The LeaseShield Team</p>
  </div>
</div>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = user.role === 'super_admin' || user.access_level === 'super_admin';
    if (!isSuperAdmin) {
      return Response.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return Response.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    const validRoles = ['user', 'admin', 'va', 'super_admin'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: `Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    if (userId === user.id) {
      return Response.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    // Get target user's current role BEFORE updating
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const oldRole = targetUser.access_level || targetUser.role || 'user';
    const targetName = targetUser.full_name || targetUser.email;
    const targetEmail = targetUser.email;

    console.log('[ADMIN_UPDATE_ROLE]', { targetUserId: userId, oldRole, newRole: role, by: user.email });

    // Update the role
    const updatedUser = await base44.asServiceRole.entities.User.update(userId, { access_level: role });

    console.log('[ADMIN_UPDATE_ROLE_SUCCESS]', { targetUserId: userId, newRole: role });

    // === NOTIFICATIONS (fire-and-forget, don't block response) ===
    const notifications = [];

    // 1. Notify all super admins via email
    const superAdmins = allUsers.filter(u =>
      u.id !== user.id && // Don't notify the person making the change
      u.is_active !== false &&
      (u.access_level === 'super_admin' || u.role === 'super_admin')
    );

    for (const admin of superAdmins) {
      notifications.push(
        sendEmailViaResend({
          to: admin.email,
          subject: `🔐 Role Changed: ${targetName} → ${ROLE_LABELS[role] || role}`,
          html: buildAdminAlertHtml({ targetName, targetEmail, oldRole, newRole: role, changedBy: user.email }),
          fromName: 'LeaseShield Security'
        }).then(r => r ? `email:${admin.email}` : null).catch(() => null)
      );

      // LINE notification to super admins
      const lineId = admin.line_messaging_token;
      if (lineId) {
        notifications.push(
          sendLineMessage(lineId, [
            '🔐 User Role Changed',
            '',
            `👤 User: ${targetName}`,
            `📧 Email: ${targetEmail}`,
            `🔄 ${ROLE_LABELS[oldRole] || oldRole} → ${ROLE_LABELS[role] || role}`,
            `👮 Changed by: ${user.email}`,
            `📅 ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}`
          ].join('\n')).then(ok => ok ? `line:${admin.email}` : null).catch(() => null)
        );
      }
    }

    // 2. Notify the promoted/demoted user via email
    notifications.push(
      sendEmailViaResend({
        to: targetEmail,
        subject: `🎉 Your LeaseShield Role Has Been Updated`,
        html: buildUserConfirmationHtml({ userName: targetName, newRole: role })
      }).then(r => r ? `email:${targetEmail}` : null).catch(() => null)
    );

    // Await all notifications (non-blocking for the response)
    const results = await Promise.allSettled(notifications);
    const sent = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
    console.log('[ROLE_NOTIFY] Notifications sent:', sent);

    return Response.json({ 
      success: true,
      message: `User role updated to ${role}`,
      user: updatedUser,
      notifications_sent: sent.length
    });

  } catch (error) {
    console.error('[ADMIN_UPDATE_ROLE_ERROR]', error.message);
    return Response.json({ error: error.message || 'Failed to update user role' }, { status: 500 });
  }
});