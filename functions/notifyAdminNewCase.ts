import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * NOTIFICATION WORKFLOW: Send admin notification when new Resolve case is created
 * Called automatically after successful case creation with status='intake'
 * 
 * Sends:
 * 1. Email to all super_admin/admin users (via Base44 SendEmail - only works for registered app users)
 * 2. LINE message to super_admin users who have line_messaging_token set
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
🔗 View in Ops Console

⚡ Next Steps:
1. Open Operations Console
2. Review intake case
3. Update status: intake → pending_review
4. Assign to team member
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Step 1: Get all admin/super_admin users from the app
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

    // Step 2: Send email to each admin user (Base44 SendEmail only works for registered app users)
    for (const admin of adminUsers) {
      // Skip sending to the tenant themselves
      if (admin.email === tenantEmail) continue;
      
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Lease Shield Ops',
          to: admin.email,
          subject: subject,
          body: body
        });
        notified.push('email:' + admin.email);
        console.log('[ADMIN_NOTIFY] ✅ Email sent to:', admin.email);
      } catch (emailErr) {
        console.error('[ADMIN_NOTIFY] ❌ Email to', admin.email, 'failed:', emailErr.message);
        errors.push({ channel: 'email', target: admin.email, error: emailErr.message });
      }
    }

    // Also try sending to the submitting user as confirmation (the tenant)
    try {
      await base44.integrations.Core.SendEmail({
        from_name: 'Lease Shield',
        to: tenantEmail,
        subject: `✅ Case ${caseNumber} Submitted Successfully`,
        body: `Your Resolve case ${caseNumber} has been submitted and is now under review.\n\nDispute Amount: ฿${disputeAmount ? Number(disputeAmount).toLocaleString() : 'N/A'}\nPayment: ${paymentType === 'free_entitlement' ? 'Free Entitlement (Annual Secure)' : 'Paid'}\n\nOur team will review your case within 24 hours.\n\n— Lease Shield Team`
      });
      notified.push('confirmation:' + tenantEmail);
      console.log('[ADMIN_NOTIFY] ✅ Confirmation email sent to tenant:', tenantEmail);
    } catch (confirmErr) {
      console.error('[ADMIN_NOTIFY] ⚠️ Confirmation email to tenant failed (non-critical):', confirmErr.message);
    }

    // Step 3: Send LINE message to admin users who have line_messaging_token
    const lineChannelToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    
    if (lineChannelToken) {
      const lineMessage = `🚨 New Resolve Case\n\n📋 ${caseNumber}\n👤 ${tenantName || tenantEmail}\n💰 ฿${disputeAmount ? Number(disputeAmount).toLocaleString() : 'N/A'}\n📍 ${propertyAddress || 'N/A'}\n💳 ${paymentType === 'free_entitlement' ? 'Free Entitlement' : 'Paid'}\n\n⚡ Check Ops Console`;

      for (const admin of adminUsers) {
        const lineUserId = admin.line_messaging_token;
        if (!lineUserId) continue;
        
        // Validate LINE user ID format (should start with 'U' and be 33 chars)
        if (!lineUserId.startsWith('U') || lineUserId.length !== 33) {
          console.log('[ADMIN_NOTIFY] ⚠️ Skipping invalid LINE ID for', admin.email, ':', lineUserId);
          continue;
        }

        try {
          const linePayload = {
            to: lineUserId,
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