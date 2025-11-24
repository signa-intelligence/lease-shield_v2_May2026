import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * NOTIFICATION WORKFLOW: Send admin notification when new Resolve case is created
 * Called automatically after successful case creation with status='intake'
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate request
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseNumber, tenantName, tenantEmail, landlordName, propertyAddress, disputeAmount, planTier, caseId } = await req.json();

    console.log('[ADMIN_NOTIFY] New case intake notification:', {
      caseNumber,
      tenantEmail,
      disputeAmount
    });

    // Operations inbox email
    const opsEmail = 'support@leaseshield.asia';
    const subject = `🚨 New Resolve Case – ${caseNumber} from ${tenantName || tenantEmail}`;
    
    const body = `
🚨 NEW RESOLVE CASE SUBMITTED

📋 Case Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Case Number: ${caseNumber}
• Status: INTAKE (awaiting first review)
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

💰 Dispute Amount: ฿${disputeAmount ? disputeAmount.toLocaleString() : 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 View Case: https://app.leaseshield.asia/CaseDetails?caseId=${caseId}&from=ops

⚡ Next Steps:
1. Open Operations Console
2. Review intake case
3. Update status: intake → pending_review
4. Assign to team member
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Send to ops email
    await base44.integrations.Core.SendEmail({
      from_name: 'Lease Shield Ops',
      to: opsEmail,
      subject: subject,
      body: body
    });

    console.log('[ADMIN_NOTIFY] ✅ Notification sent to:', opsEmail);

    // Optional: Send to VA email if configured (you can add this to user settings or env var)
    // const vaEmail = Deno.env.get('VA_EMAIL');
    // if (vaEmail) {
    //   await base44.integrations.Core.SendEmail({
    //     from_name: 'Lease Shield Ops',
    //     to: vaEmail,
    //     subject: subject,
    //     body: body
    //   });
    // }

    return Response.json({
      success: true,
      notified: [opsEmail]
    });

  } catch (error) {
    console.error('❌ Admin notification failed:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});