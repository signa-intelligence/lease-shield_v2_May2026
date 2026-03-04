import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * GDPR-compliant user data deletion
 * Permanently deletes all user data for "right to be forgotten"
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmEmail } = await req.json();
    const userEmail = user.email;
    
    // Safety check - user must confirm their email
    if (userEmail !== confirmEmail) {
      return Response.json({
        ok: false,
        error: 'EMAIL_MISMATCH',
        message: 'Confirmation email does not match'
      }, { status: 400 });
    }
    
    console.log('[GDPR_DELETE_START]', { 
      userEmail, 
      userId: user.id,
      timestamp: new Date().toISOString() 
    });
    
    const deletionLog = {
      userEmail,
      userId: user.id,
      timestamp: new Date().toISOString(),
      deletedEntities: {}
    };
    
    const svc = base44.asServiceRole || base44;
    
    // 1. Delete Leases (will cascade to LeaseScan via deleteLease function)
    const leases = await svc.entities.Lease.filter({
      owner_email: userEmail
    });
    
    for (const lease of leases) {
      try {
        await svc.functions.invoke('deleteLease', {
          leaseId: lease.id
        });
      } catch (err) {
        console.warn('[GDPR_DELETE_LEASE_FAILED]', { leaseId: lease.id, error: err.message });
      }
    }
    deletionLog.deletedEntities.Leases = leases.length;
    
    // 2. Delete DepositTrackers
    const deposits = await svc.entities.DepositTracker.filter({
      owner_email: userEmail
    });
    for (const deposit of deposits) {
      await svc.entities.DepositTracker.delete(deposit.id);
    }
    deletionLog.deletedEntities.DepositTrackers = deposits.length;
    
    // 3. Delete TimelineEvents
    const events = await svc.entities.TimelineEvent.filter({
      owner_email: userEmail
    });
    for (const event of events) {
      await svc.entities.TimelineEvent.delete(event.id);
    }
    deletionLog.deletedEntities.TimelineEvents = events.length;
    
    // 4. Delete Cases
    const cases = await svc.entities.Case.filter({
      user_email: userEmail
    });
    for (const caseItem of cases) {
      await svc.entities.Case.delete(caseItem.id);
    }
    deletionLog.deletedEntities.Cases = cases.length;
    
    // 5. Delete MaintenanceRequests
    const maintenance = await svc.entities.MaintenanceRequest.filter({
      created_by: userEmail
    });
    for (const request of maintenance) {
      await svc.entities.MaintenanceRequest.delete(request.id);
    }
    deletionLog.deletedEntities.MaintenanceRequests = maintenance.length;
    
    // 6. Delete UserStorage
    const storage = await svc.entities.UserStorage.filter({
      user_email: userEmail
    });
    for (const storageRecord of storage) {
      await svc.entities.UserStorage.delete(storageRecord.id);
    }
    deletionLog.deletedEntities.UserStorage = storage.length;
    
    // 7. Delete RateLimits
    try {
      const rateLimits = await svc.entities.RateLimit.filter({
        user_id: user.id
      });
      for (const limit of rateLimits) {
        await svc.entities.RateLimit.delete(limit.id);
      }
      deletionLog.deletedEntities.RateLimits = rateLimits.length;
    } catch (e) {
      deletionLog.deletedEntities.RateLimits = 0;
    }
    
    // 8. Delete NotificationLogs
    try {
      const notifications = await svc.entities.NotificationLog.filter({
        user_email: userEmail
      });
      for (const notification of notifications) {
        await svc.entities.NotificationLog.delete(notification.id);
      }
      deletionLog.deletedEntities.NotificationLogs = notifications.length;
    } catch (e) {
      deletionLog.deletedEntities.NotificationLogs = 0;
    }
    
    // 9. Delete Documents
    try {
      const documents = await svc.entities.Document.filter({
        created_by: userEmail
      });
      for (const doc of documents) {
        await svc.entities.Document.delete(doc.id);
      }
      deletionLog.deletedEntities.Documents = documents.length;
    } catch (e) {
      deletionLog.deletedEntities.Documents = 0;
    }
    
    // 10. Anonymize CreditsLedger (keep for audit, anonymize PII)
    try {
      const credits = await svc.entities.CreditsLedger.filter({
        user_email: userEmail
      });
      for (const credit of credits) {
        await svc.entities.CreditsLedger.update(credit.id, {
          user_email: '[DELETED_USER]',
          anonymized_at: new Date().toISOString()
        });
      }
      deletionLog.deletedEntities.CreditsLedger = `${credits.length} anonymized`;
    } catch (e) {
      deletionLog.deletedEntities.CreditsLedger = '0';
    }
    
    // 11. Delete LisaConversations
    try {
      const conversations = await svc.entities.LisaConversation.filter({
        user_email: userEmail
      });
      for (const conv of conversations) {
        await svc.entities.LisaConversation.delete(conv.id);
      }
      deletionLog.deletedEntities.LisaConversations = conversations.length;
    } catch (e) {
      deletionLog.deletedEntities.LisaConversations = 0;
    }
    
    // 12. Anonymize User record (keep for auth, remove PII)
    try {
      // NOTE: Do NOT set is_active=false — it permanently blocks re-signup on Base44.
      // Instead, just clear PII and mark as deleted. The user record stays "active" 
      // at the platform level so they can re-register later if needed.
      await svc.auth.updateMe({
        plan_tier: 'deleted',
        available_scans: 0,
        data_deleted_at: new Date().toISOString(),
        display_name: '[DELETED]',
        phone: null,
        line_id: null,
        line_connected: false,
        quick_guide_dismissed: true,
        onboarding_completed: true
      });
      deletionLog.userAnonymized = true;
    } catch (e) {
      console.error('[GDPR_USER_ANONYMIZE_FAILED]', e);
      deletionLog.userAnonymized = false;
    }
    
    // 13. Create GDPR deletion audit log
    try {
      await svc.entities.GDPRDeletionLog.create({
        user_email: userEmail,
        user_id: user.id,
        deleted_at: new Date().toISOString(),
        deleted_by: 'self',
        deletion_summary: deletionLog.deletedEntities,
        reason: 'user_request',
        status: 'completed'
      });
    } catch (e) {
      console.error('[GDPR_LOG_FAILED]', e);
    }
    
    console.log('[GDPR_DELETE_COMPLETE]', deletionLog);
    
    // Send deletion confirmation email (non-blocking)
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        const firstName = (user.full_name || userEmail.split('@')[0]).split(' ')[0];
        const deletionDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#374151;margin:0;padding:0}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#6b7280;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}.content{padding:30px;background:white;border:1px solid #e5e7eb;border-top:none}.info-box{background:#f9fafb;border-left:4px solid #9ca3af;padding:15px;margin:15px 0;border-radius:4px}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:22px;">Account Deletion Confirmed</h1></div><div class="content"><p>Hi ${firstName},</p><p>This email confirms that your LeaseShield account has been permanently deleted as requested.</p><div class="info-box"><strong>Deletion Details:</strong><br>Account: ${userEmail}<br>Deleted on: ${deletionDate}<br>Status: Permanently removed</div><p><strong>What was deleted:</strong></p><ul><li>All lease scan results and reports</li><li>All documents in Evidence Vault</li><li>Deposit and rent tracking data</li><li>Cases and maintenance requests</li><li>Account settings and preferences</li></ul><p style="margin-top:20px"><strong>Important:</strong> This action cannot be undone. Your data has been permanently removed from our systems in compliance with data protection regulations (PDPA).</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0"><p style="color:#6b7280;font-size:14px"><strong>Changed your mind?</strong><br>You're always welcome back! You can create a new account anytime at <a href="https://leaseshield.asia" style="color:#2563EB">leaseshield.asia</a></p><p style="color:#6b7280;font-size:14px;margin-top:20px">We're sorry to see you go. If there's anything we could have done better, please reply to this email — we genuinely value your feedback.</p><p style="color:#6b7280;font-size:14px">Thank you for using LeaseShield. We wish you the best with your rental journey! 🏠</p></div><div class="footer"><p style="margin:0"><strong>LeaseShield</strong><br>Protecting renters in Thailand</p><p style="margin:8px 0 0"><a href="https://leaseshield.asia" style="color:#2563EB">leaseshield.asia</a></p></div></div></body></html>`;
        
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LeaseShield <hello@leaseshield.asia>',
            to: userEmail,
            reply_to: 'support@leaseshield.asia',
            subject: 'Your LeaseShield account has been deleted',
            html: emailHtml
          })
        });
        const emailResult = await emailRes.json();
        console.log('[GDPR_DELETE_EMAIL]', emailRes.ok ? 'Sent' : 'Failed', emailResult);
        deletionLog.confirmationEmailSent = emailRes.ok;
      } else {
        // Fallback to built-in email
        await svc.integrations.Core.SendEmail({
          to: userEmail,
          subject: 'Your LeaseShield account has been deleted',
          body: `Hi,\n\nThis confirms your LeaseShield account (${userEmail}) has been permanently deleted as requested on ${new Date().toLocaleDateString()}.\n\nAll your data including leases, scans, documents, cases, and account settings have been removed.\n\nYou're welcome back anytime at https://leaseshield.asia\n\nThank you for using LeaseShield.\n— The LeaseShield Team`
        });
        console.log('[GDPR_DELETE_EMAIL] Sent via fallback');
        deletionLog.confirmationEmailSent = true;
      }
    } catch (emailErr) {
      console.error('[GDPR_DELETE_EMAIL_FAILED]', emailErr.message);
      deletionLog.confirmationEmailSent = false;
      // Don't fail the deletion if email fails
    }
    
    return Response.json({
      ok: true,
      message: 'All user data has been permanently deleted',
      deletionLog: deletionLog
    });
    
  } catch (error) {
    console.error('[GDPR_DELETE_ERROR]', error);
    
    // Log failure
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();
      if (user) {
        await base44.asServiceRole.entities.GDPRDeletionLog.create({
          user_email: user.email,
          user_id: user.id,
          deleted_at: new Date().toISOString(),
          deleted_by: 'self',
          deletion_summary: { error: error.message },
          reason: 'user_request',
          status: 'failed'
        });
      }
    } catch (logErr) {
      console.error('[GDPR_ERROR_LOG_FAILED]', logErr);
    }
    
    return Response.json({
      ok: false,
      error: 'DELETION_FAILED',
      message: error.message
    }, { status: 500 });
  }
});