import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

async function sendViaResend({ to, subject, html, fromName = 'LeaseShield Ops' }) {
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
    throw new Error(`Resend error: ${result.message || JSON.stringify(result)}`);
  }
  return result;
}

/**
 * NOTIFICATION WORKFLOW: Send admin notification when new Resolve case is created
 * Called automatically after successful case creation with status='intake'
 * 
 * Sends via Resend API (bypasses Base44 unsubscribe blocklist):
 * 1. Email to all super_admin/admin users
 * 2. Confirmation email to tenant
 * 3. LINE message to super_admin users who have line_messaging_token set
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseNumber, tenantName, tenantEmail, landlordName, propertyAddress, disputeAmount, planTier, caseId, paymentType } = await req.json();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[ADMIN_NOTIFY] 🚨 New case intake notification (via Resend)');
    console.log('[ADMIN_NOTIFY] Case:', caseNumber);
    console.log('[ADMIN_NOTIFY] Tenant:', tenantEmail);
    console.log('[ADMIN_NOTIFY] Amount: ฿' + (disputeAmount || 'N/A'));
    console.log('[ADMIN_NOTIFY] Payment:', paymentType || 'paid');

    const notified = [];
    const errors = [];

    // Build admin email HTML
    const adminSubject = `🚨 New Resolve Case – ${caseNumber} from ${tenantName || tenantEmail}`;
    
    const adminHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #FEF2F2; border: 2px solid #EF4444; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
    <div style="font-size: 36px;">🚨</div>
    <h1 style="color: #DC2626; margin: 8px 0 4px 0; font-size: 20px;">New Resolve Case Submitted</h1>
    <p style="color: #7F1D1D; margin: 0; font-size: 14px;">Requires intake review</p>
  </div>

  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
    <h3 style="color: #0F172A; margin: 0 0 12px 0; font-size: 16px;">📋 Case Details</h3>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Case Number: <strong>${caseNumber}</strong></p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Status: <strong>INTAKE</strong> (awaiting first review)</p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Payment: <strong>${paymentType === 'free_entitlement' ? '🎁 FREE ENTITLEMENT' : '💳 Paid'}</strong></p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}</p>
  </div>

  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
    <h3 style="color: #0F172A; margin: 0 0 12px 0; font-size: 16px;">👤 Tenant Information</h3>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Name: <strong>${tenantName || 'N/A'}</strong></p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Email: <strong>${tenantEmail}</strong></p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Plan: <strong>${planTier?.toUpperCase() || 'FREE/PUBLIC'}</strong></p>
  </div>

  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
    <h3 style="color: #0F172A; margin: 0 0 12px 0; font-size: 16px;">🏠 Property & Landlord</h3>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Address: <strong>${propertyAddress || 'Not provided'}</strong></p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Landlord: <strong>${landlordName || 'Not provided'}</strong></p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Dispute Amount: <strong>฿${disputeAmount ? Number(disputeAmount).toLocaleString() : 'N/A'}</strong></p>
  </div>

  <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 12px; padding: 16px;">
    <h3 style="color: #9A3412; margin: 0 0 8px 0; font-size: 16px;">⚡ Next Steps</h3>
    <ol style="color: #9A3412; font-size: 14px; padding-left: 20px; margin: 0;">
      <li>Open Operations Console</li>
      <li>Review intake case</li>
      <li>Update status: intake → pending_review</li>
      <li>Assign to team member</li>
    </ol>
  </div>
</div>`;

    // Step 1: Get all admin/super_admin users
    let adminUsers = [];
    try {
      const allUsers = await base44.asServiceRole.entities.User.list();
      adminUsers = allUsers.filter(u => {
        const accessLevel = u.access_level?.toLowerCase();
        const role = u.role?.toLowerCase();
        return (
          accessLevel === 'super_admin' || accessLevel === 'admin' ||
          role === 'super_admin' || role === 'admin'
        ) && u.is_active !== false;
      });
      console.log('[ADMIN_NOTIFY] Found', adminUsers.length, 'admin users:', adminUsers.map(u => u.email));
    } catch (listErr) {
      console.error('[ADMIN_NOTIFY] ❌ Failed to list admin users:', listErr.message);
    }

    // Step 2: Send email to each admin user via Resend
    for (const admin of adminUsers) {
      if (admin.email === tenantEmail) continue;
      
      try {
        const result = await sendViaResend({
          to: admin.email,
          subject: adminSubject,
          html: adminHtml,
          fromName: 'LeaseShield Ops'
        });
        notified.push('email:' + admin.email);
        console.log('[ADMIN_NOTIFY] ✅ Resend email sent to:', admin.email, 'id:', result.id);
      } catch (emailErr) {
        console.error('[ADMIN_NOTIFY] ❌ Resend email to', admin.email, 'failed:', emailErr.message);
        errors.push({ channel: 'email', target: admin.email, error: emailErr.message });
      }
    }

    // Step 3: Send confirmation email to tenant via Resend
    try {
      const tenantHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ECFDF5, #D1FAE5); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
    <div style="font-size: 36px;">✅</div>
    <h1 style="color: #059669; margin: 8px 0; font-size: 20px;">Case ${caseNumber} Submitted</h1>
  </div>
  <p style="color: #334155; font-size: 15px;">Your Resolve case has been submitted and is now under review.</p>
  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin: 16px 0;">
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Dispute Amount: <strong>฿${disputeAmount ? Number(disputeAmount).toLocaleString() : 'N/A'}</strong></p>
    <p style="margin: 4px 0; color: #334155; font-size: 14px;">Payment: <strong>${paymentType === 'free_entitlement' ? 'Free Entitlement (Secure)' : 'Paid'}</strong></p>
  </div>
  <p style="color: #334155; font-size: 15px;">Our team will review your case within 2-3 business days. We'll contact you via LINE and email.</p>
  <p style="color: #334155; font-size: 15px;">— LeaseShield Team</p>
</div>`;

      const result = await sendViaResend({
        to: tenantEmail,
        subject: `✅ Case ${caseNumber} Submitted Successfully`,
        html: tenantHtml,
        fromName: 'LeaseShield'
      });
      notified.push('confirmation:' + tenantEmail);
      console.log('[ADMIN_NOTIFY] ✅ Resend confirmation sent to tenant:', tenantEmail, 'id:', result.id);
    } catch (confirmErr) {
      console.error('[ADMIN_NOTIFY] ⚠️ Resend confirmation to tenant failed:', confirmErr.message);
      errors.push({ channel: 'email', target: tenantEmail, error: confirmErr.message });
    }

    // Step 4: Send LINE message to admin users who have line_messaging_token
    const lineChannelToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    if (lineChannelToken) {
      const lineMessage = `🚨 New Resolve Case\n\n📋 ${caseNumber}\n👤 ${tenantName || tenantEmail}\n💰 ฿${disputeAmount ? Number(disputeAmount).toLocaleString() : 'N/A'}\n📍 ${propertyAddress || 'N/A'}\n💳 ${paymentType === 'free_entitlement' ? 'Free Entitlement' : 'Paid'}\n\n⚡ Check Ops Console`;

      for (const admin of adminUsers) {
        const lineUserId = admin.line_messaging_token;
        if (!lineUserId) continue;
        
        if (!lineUserId.startsWith('U') || lineUserId.length !== 33) {
          console.log('[ADMIN_NOTIFY] ⚠️ Skipping invalid LINE ID for', admin.email, ':', lineUserId);
          continue;
        }

        try {
          const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${lineChannelToken}`
            },
            body: JSON.stringify({
              to: lineUserId,
              messages: [{ type: 'text', text: lineMessage }]
            })
          });

          if (lineResponse.ok) {
            notified.push('line:' + admin.email);
            console.log('[ADMIN_NOTIFY] ✅ LINE message sent to:', admin.email);
          } else {
            const lineErr = await lineResponse.text();
            console.error('[ADMIN_NOTIFY] ❌ LINE to', admin.email, 'failed:', lineResponse.status, lineErr);
            errors.push({ channel: 'line', target: admin.email, error: lineErr });
          }
        } catch (lineErr) {
          console.error('[ADMIN_NOTIFY] ❌ LINE send to', admin.email, 'failed:', lineErr.message);
          errors.push({ channel: 'line', target: admin.email, error: lineErr.message });
        }
      }
    } else {
      console.log('[ADMIN_NOTIFY] ⚠️ LINE_CHANNEL_ACCESS_TOKEN not configured');
    }

    console.log('[ADMIN_NOTIFY] 📊 Summary: notified=' + notified.length + ', errors=' + errors.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return Response.json({
      success: true,
      notified,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Admin notification failed:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});