import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * NOTIFICATION WORKFLOW: Send admin notification when new Resolve case is created
 * Called automatically after successful case creation with status='intake'
 * 
 * Sends:
 * 1. Email to support@leaseshield.asia
 * 2. Email to ADMIN_ALERT_EMAIL (if set)
 * 3. LINE message to LINE_SUPERADMIN_USER_ID (if set)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate request
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseNumber, tenantName, tenantEmail, landlordName, propertyAddress, disputeAmount, planTier, caseId, paymentType } = await req.json();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[ADMIN_NOTIFY] 🚨 New case intake notification');
    console.log('[ADMIN_NOTIFY] Case:', caseNumber);
    console.log('[ADMIN_NOTIFY] Tenant:', tenantEmail);
    console.log('[ADMIN_NOTIFY] Amount: ฿' + (disputeAmount || 'N/A'));
    console.log('[ADMIN_NOTIFY] Payment:', paymentType || 'paid');

    const notified = [];
    const errors = [];

    // Build email content
    const subject = `🚨 New Resolve Case – ${caseNumber} from ${tenantName || tenantEmail}`;
    
    const body = `
🚨 NEW RESOLVE CASE SUBMITTED

📋 Case Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Case Number: ${caseNumber}
• Status: INTAKE (awaiting first review)
• Payment: ${paymentType === 'free_entitlement' ? '🎁 FREE ENTITLEMENT' : '💳 Paid'}
• Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}

👤 Tenant Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Name: ${tenantName || 'N/A'}
• Email: ${tenantEmail}
• Plan: ${planTier?.toUpperCase() || 'FREE/PUBLIC'}

🏠 Property & Landlord:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Address: ${propertyAddress || 'Not provided'}
• Landlord: ${landlordName || 'Not provided'}

💰 Dispute Amount: ฿${disputeAmount ? Number(disputeAmount).toLocaleString() : 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 View Case: https://app.leaseshield.asia/CaseDetails?caseId=${caseId}&from=ops

⚡ Next Steps:
1. Open Operations Console
2. Review intake case
3. Update status: intake → pending_review
4. Assign to team member
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // 1. Send to ops email
    const opsEmail = 'support@leaseshield.asia';
    try {
      await base44.integrations.Core.SendEmail({
        from_name: 'Lease Shield Ops',
        to: opsEmail,
        subject: subject,
        body: body
      });
      notified.push(opsEmail);
      console.log('[ADMIN_NOTIFY] ✅ Email sent to:', opsEmail);
    } catch (emailErr) {
      console.error('[ADMIN_NOTIFY] ❌ Email to ops failed:', emailErr.message);
      errors.push({ channel: 'email', target: opsEmail, error: emailErr.message });
    }

    // 2. Send to admin alert email (if configured and different from ops)
    const adminAlertEmail = Deno.env.get('ADMIN_ALERT_EMAIL');
    if (adminAlertEmail && adminAlertEmail !== opsEmail) {
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Lease Shield Ops',
          to: adminAlertEmail,
          subject: subject,
          body: body
        });
        notified.push(adminAlertEmail);
        console.log('[ADMIN_NOTIFY] ✅ Email sent to admin:', adminAlertEmail);
      } catch (adminEmailErr) {
        console.error('[ADMIN_NOTIFY] ❌ Email to admin failed:', adminEmailErr.message);
        errors.push({ channel: 'email', target: adminAlertEmail, error: adminEmailErr.message });
      }
    }

    // 3. Send LINE message to SuperAdmin
    const lineSuperAdminId = Deno.env.get('LINE_SUPERADMIN_USER_ID');
    const lineChannelToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    if (lineSuperAdminId && lineChannelToken) {
      try {
        const lineMessage = `🚨 New Resolve Case\n\n📋 ${caseNumber}\n👤 ${tenantName || tenantEmail}\n💰 ฿${disputeAmount ? Number(disputeAmount).toLocaleString() : 'N/A'}\n📍 ${propertyAddress || 'N/A'}\n💳 ${paymentType === 'free_entitlement' ? 'Free Entitlement' : 'Paid'}\n\n⚡ Check Ops Console`;

        const linePayload = {
          to: lineSuperAdminId,
          messages: [{
            type: 'text',
            text: lineMessage
          }]
        };

        const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineChannelToken}`
          },
          body: JSON.stringify(linePayload)
        });

        if (lineResponse.ok) {
          notified.push('LINE:' + lineSuperAdminId.substring(0, 8) + '...');
          console.log('[ADMIN_NOTIFY] ✅ LINE message sent to SuperAdmin');
        } else {
          const lineErr = await lineResponse.text();
          console.error('[ADMIN_NOTIFY] ❌ LINE API error:', lineResponse.status, lineErr);
          errors.push({ channel: 'line', target: 'superadmin', error: lineErr });
        }
      } catch (lineErr) {
        console.error('[ADMIN_NOTIFY] ❌ LINE send failed:', lineErr.message);
        errors.push({ channel: 'line', target: 'superadmin', error: lineErr.message });
      }
    } else {
      console.log('[ADMIN_NOTIFY] ⚠️ LINE not configured (LINE_SUPERADMIN_USER_ID or LINE_CHANNEL_ACCESS_TOKEN missing)');
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