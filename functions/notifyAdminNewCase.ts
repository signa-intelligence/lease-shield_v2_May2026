import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * NOTIFICATION WORKFLOW: Send admin notification when new Resolve case is created
 * Called automatically after successful case creation
 * 
 * Sends BOTH:
 * 1. Email notification to ADMIN_ALERT_EMAIL (or fallback to support@leaseshield.asia)
 * 2. LINE notification to LINE_SUPERADMIN_USER_ID (if configured)
 * 
 * Required Secrets:
 * - ADMIN_ALERT_EMAIL: Super admin email for case notifications (optional, defaults to support@leaseshield.asia)
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API token (required for LINE notifications)
 * - LINE_SUPERADMIN_USER_ID: Super admin's LINE user ID (required for LINE notifications)
 */

Deno.serve(async (req) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[ADMIN_NOTIFY] ════════════════════════════════════════`);
  console.log(`[ADMIN_NOTIFY] New case notification triggered at ${timestamp}`);
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate request
    const user = await base44.auth.me();
    if (!user) {
      console.error('[ADMIN_NOTIFY] ❌ Unauthorized - no user session');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      caseNumber, 
      tenantName, 
      tenantEmail, 
      landlordName, 
      propertyAddress, 
      disputeAmount, 
      planTier, 
      caseId,
      caseType,
      summary 
    } = await req.json();

    // Validate required fields
    if (!caseNumber || !caseId) {
      console.error('[ADMIN_NOTIFY] ❌ Missing required fields: caseNumber or caseId');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('[ADMIN_NOTIFY] Case details:', {
      caseNumber,
      caseId: caseId?.slice(0, 8) + '...',
      tenantEmail,
      disputeAmount,
      planTier
    });

    // Get configuration from environment
    const adminEmail = Deno.env.get('ADMIN_ALERT_EMAIL') || 'support@leaseshield.asia';
    const lineAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    const lineSuperAdminId = Deno.env.get('LINE_SUPERADMIN_USER_ID');
    const appUrl = Deno.env.get('APP_URL') || 'https://app.leaseshield.asia';
    
    const notificationResults = {
      email: { sent: false, error: null },
      line: { sent: false, error: null }
    };

    const caseUrl = `${appUrl}/CaseDetails?caseId=${caseId}&from=ops`;
    const opsConsoleUrl = `${appUrl}/OpsConsole`;
    const formattedTimestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const formattedAmount = disputeAmount ? `฿${Number(disputeAmount).toLocaleString()}` : 'N/A';
    const formattedPlan = planTier?.toUpperCase() || 'FREE';
    const formattedType = caseType?.replace(/_/g, ' ')?.toUpperCase() || 'DEPOSIT';

    // ════════════════════════════════════════════════════════════════
    // 1. SEND EMAIL NOTIFICATION
    // ════════════════════════════════════════════════════════════════
    console.log('[ADMIN_NOTIFY] 📧 Sending email to:', adminEmail);
    
    const emailSubject = `🚨 New Resolve Case Submitted – ${caseNumber}`;
    const emailBody = `
🚨 NEW RESOLVE CASE SUBMITTED
════════════════════════════════════════

📋 CASE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Case Number: ${caseNumber}
• Case ID: ${caseId}
• Type: ${formattedType}
• Status: AWAITING PAYMENT
• Created: ${formattedTimestamp} (Bangkok)

👤 TENANT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Name: ${tenantName || 'Not provided'}
• Email: ${tenantEmail || 'Not provided'}
• Plan: ${formattedPlan}

🏠 PROPERTY & LANDLORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Address: ${propertyAddress || 'Not provided'}
• Landlord: ${landlordName || 'Not provided'}

💰 DISPUTE AMOUNT: ${formattedAmount}

📝 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${summary ? summary.substring(0, 500) : 'No summary provided'}
${summary && summary.length > 500 ? '...' : ''}

════════════════════════════════════════
🔗 QUICK LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• View Case: ${caseUrl}
• Ops Console: ${opsConsoleUrl}

⚡ NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Wait for payment confirmation
2. Once paid, status changes to INTAKE
3. Review case and assign to team member
4. Update status: intake → pending_review
════════════════════════════════════════
    `.trim();

    try {
      await base44.integrations.Core.SendEmail({
        from_name: 'Lease Shield Ops',
        to: adminEmail,
        subject: emailSubject,
        body: emailBody
      });
      
      notificationResults.email.sent = true;
      console.log('[ADMIN_NOTIFY] ✅ Email notification sent successfully');
    } catch (emailError) {
      notificationResults.email.error = emailError.message;
      console.error('[ADMIN_NOTIFY] ❌ Email notification failed:', emailError.message);
    }

    // ════════════════════════════════════════════════════════════════
    // 2. SEND LINE NOTIFICATION TO SUPER ADMIN
    // ════════════════════════════════════════════════════════════════
    if (lineAccessToken && lineSuperAdminId) {
      console.log('[ADMIN_NOTIFY] 📱 Sending LINE notification to Super Admin');
      
      try {
        // Build LINE Flex Message for rich notification
        const flexMessage = {
          altText: `🚨 New Resolve Case – ${caseNumber}`,
          contents: {
            type: 'bubble',
            size: 'mega',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '🚨 NEW RESOLVE CASE',
                  weight: 'bold',
                  size: 'lg',
                  color: '#FFFFFF'
                },
                {
                  type: 'text',
                  text: caseNumber,
                  size: 'md',
                  color: '#FFFFFF',
                  margin: 'sm'
                }
              ],
              backgroundColor: '#DC2626',
              paddingAll: '16px'
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '👤 User:', size: 'sm', color: '#666666', flex: 2 },
                    { type: 'text', text: tenantName || tenantEmail || 'N/A', size: 'sm', color: '#111111', flex: 4, wrap: true }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '📋 Plan:', size: 'sm', color: '#666666', flex: 2 },
                    { type: 'text', text: formattedPlan, size: 'sm', color: '#111111', flex: 4 }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '📁 Type:', size: 'sm', color: '#666666', flex: 2 },
                    { type: 'text', text: formattedType, size: 'sm', color: '#111111', flex: 4 }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '💰 Amount:', size: 'sm', color: '#666666', flex: 2 },
                    { type: 'text', text: formattedAmount, size: 'sm', color: '#DC2626', weight: 'bold', flex: 4 }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '🕐 Created:', size: 'sm', color: '#666666', flex: 2 },
                    { type: 'text', text: formattedTimestamp, size: 'sm', color: '#111111', flex: 4, wrap: true }
                  ],
                  margin: 'md'
                },
                {
                  type: 'separator',
                  margin: 'lg'
                },
                {
                  type: 'text',
                  text: 'Status: AWAITING PAYMENT',
                  size: 'xs',
                  color: '#F59E0B',
                  weight: 'bold',
                  margin: 'lg',
                  align: 'center'
                }
              ],
              paddingAll: '16px'
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: 'Open Case',
                    uri: caseUrl
                  },
                  style: 'primary',
                  color: '#0C3B2E'
                },
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: 'Ops Console',
                    uri: opsConsoleUrl
                  },
                  style: 'secondary',
                  margin: 'sm'
                }
              ],
              paddingAll: '12px'
            }
          }
        };

        // Send LINE message directly via API
        const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineAccessToken}`
          },
          body: JSON.stringify({
            to: lineSuperAdminId,
            messages: [{
              type: 'flex',
              altText: flexMessage.altText,
              contents: flexMessage.contents
            }]
          })
        });

        if (!lineResponse.ok) {
          const lineError = await lineResponse.text();
          throw new Error(`LINE API error ${lineResponse.status}: ${lineError}`);
        }

        notificationResults.line.sent = true;
        console.log('[ADMIN_NOTIFY] ✅ LINE notification sent successfully');
      } catch (lineError) {
        notificationResults.line.error = lineError.message;
        console.error('[ADMIN_NOTIFY] ❌ LINE notification failed:', lineError.message);
      }
    } else {
      console.log('[ADMIN_NOTIFY] ⚠️ LINE notification skipped - missing LINE_CHANNEL_ACCESS_TOKEN or LINE_SUPERADMIN_USER_ID');
      notificationResults.line.error = 'LINE configuration not set';
    }

    // ════════════════════════════════════════════════════════════════
    // SUMMARY
    // ════════════════════════════════════════════════════════════════
    const successCount = [notificationResults.email.sent, notificationResults.line.sent].filter(Boolean).length;
    console.log(`[ADMIN_NOTIFY] ════════════════════════════════════════`);
    console.log(`[ADMIN_NOTIFY] Notification summary: ${successCount}/2 channels successful`);
    console.log(`[ADMIN_NOTIFY]   📧 Email: ${notificationResults.email.sent ? '✅ Sent' : '❌ ' + notificationResults.email.error}`);
    console.log(`[ADMIN_NOTIFY]   📱 LINE: ${notificationResults.line.sent ? '✅ Sent' : '❌ ' + notificationResults.line.error}`);
    console.log(`[ADMIN_NOTIFY] ════════════════════════════════════════\n`);

    return Response.json({
      success: true,
      caseNumber,
      caseId,
      notifications: notificationResults,
      notifiedChannels: successCount
    });

  } catch (error) {
    console.error('[ADMIN_NOTIFY] ❌ Fatal error:', error.message);
    console.error('[ADMIN_NOTIFY] Stack:', error.stack);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});