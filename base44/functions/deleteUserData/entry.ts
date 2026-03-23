import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Soft-delete user account
 * Marks the account as inactive but retains email, tier, and usage data
 * so returning users don't get fresh Explorer benefits.
 * User data (leases, cases, etc.) is kept but hidden from active views.
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
    
    console.log('[SOFT_DELETE_START]', { 
      userEmail, 
      userId: user.id,
      currentTier: user.plan_tier,
      availableScans: user.available_scans,
      letterCredits: user.letter_credits,
      timestamp: new Date().toISOString() 
    });
    
    const svc = base44.asServiceRole || base44;
    
    // Determine if explorer benefits have been used
    // Explorer tier starts with 1 scan and 0 letters
    const explorerBenefitsUsed = (
      (user.available_scans !== undefined && user.available_scans < 1) ||
      (user.letter_credits !== undefined && user.letter_credits > 0) ||
      (user.plan_tier && user.plan_tier !== 'explorer' && user.plan_tier !== 'free')
    );
    
    // 1. Soft-delete: archive all user data (mark as archived, not hard delete)
    const archiveLog = {};
    
    // Archive Leases
    try {
      const leases = await svc.entities.Lease.filter({ owner_email: userEmail });
      for (const lease of leases) {
        await svc.entities.Lease.update(lease.id, { 
          status: 'archived',
          archived_at: new Date().toISOString(),
          archived_by: 'account_deletion'
        });
      }
      archiveLog.Leases = leases.length;
    } catch (e) { archiveLog.Leases = 0; }
    
    // Archive LeasScans
    try {
      const scans = await svc.entities.LeaseScan.filter({ owner_email: userEmail });
      for (const scan of scans) {
        await svc.entities.LeaseScan.update(scan.id, {
          is_archived: true,
          archived_at: new Date().toISOString(),
          status: 'archived'
        });
      }
      archiveLog.LeaseScans = scans.length;
    } catch (e) { archiveLog.LeaseScans = 0; }
    
    // Archive DepositTrackers
    try {
      const deposits = await svc.entities.DepositTracker.filter({ owner_email: userEmail });
      for (const deposit of deposits) {
        await svc.entities.DepositTracker.update(deposit.id, {
          is_archived: true,
          archived_at: new Date().toISOString(),
          status: 'archived'
        });
      }
      archiveLog.DepositTrackers = deposits.length;
    } catch (e) { archiveLog.DepositTrackers = 0; }
    
    // Archive TimelineEvents
    try {
      const events = await svc.entities.TimelineEvent.filter({ owner_email: userEmail });
      for (const event of events) {
        await svc.entities.TimelineEvent.update(event.id, {
          is_archived: true,
          archived_at: new Date().toISOString()
        });
      }
      archiveLog.TimelineEvents = events.length;
    } catch (e) { archiveLog.TimelineEvents = 0; }
    
    // Archive Cases
    try {
      const cases = await svc.entities.Case.filter({ user_email: userEmail });
      for (const caseItem of cases) {
        await svc.entities.Case.update(caseItem.id, {
          is_deleted: true,
          deleted_at: new Date().toISOString()
        });
      }
      archiveLog.Cases = cases.length;
    } catch (e) { archiveLog.Cases = 0; }
    
    // Archive MaintenanceRequests
    try {
      const maintenance = await svc.entities.MaintenanceRequest.filter({ created_by: userEmail });
      for (const request of maintenance) {
        await svc.entities.MaintenanceRequest.update(request.id, {
          is_archived: true,
          archived_at: new Date().toISOString()
        });
      }
      archiveLog.MaintenanceRequests = maintenance.length;
    } catch (e) { archiveLog.MaintenanceRequests = 0; }
    
    // Delete LisaConversations (no need to retain chat history)
    try {
      const conversations = await svc.entities.LisaConversation.filter({ user_email: userEmail });
      for (const conv of conversations) {
        await svc.entities.LisaConversation.delete(conv.id);
      }
      archiveLog.LisaConversations = conversations.length;
    } catch (e) { archiveLog.LisaConversations = 0; }
    
    // Delete NotificationLogs (transient data)
    try {
      const notifications = await svc.entities.NotificationLog.filter({ user_email: userEmail });
      for (const notification of notifications) {
        await svc.entities.NotificationLog.delete(notification.id);
      }
      archiveLog.NotificationLogs = notifications.length;
    } catch (e) { archiveLog.NotificationLogs = 0; }
    
    // 2. Soft-delete User: mark as deleted, preserve tier & usage, clear sensitive PII
    try {
      await svc.auth.updateMe({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        previous_plan_tier: user.plan_tier || 'explorer',
        explorer_benefits_used: explorerBenefitsUsed,
        // Clear sensitive PII but keep email (built-in, can't clear) and tier data
        display_name: null,
        phone: null,
        line_id: null,
        line_connected: false,
        quick_guide_dismissed: true,
        onboarding_completed: true
        // NOTE: We intentionally do NOT change plan_tier, available_scans, or letter_credits
        // so they are preserved for re-registration checks
      });
    } catch (e) {
      console.error('[SOFT_DELETE_USER_UPDATE_FAILED]', e);
    }
    
    // 3. Create GDPR audit log
    try {
      await svc.entities.GDPRDeletionLog.create({
        user_email: userEmail,
        user_id: user.id,
        deleted_at: new Date().toISOString(),
        deleted_by: 'self',
        deletion_summary: { ...archiveLog, type: 'soft_delete', explorer_benefits_used: explorerBenefitsUsed },
        reason: 'user_request',
        status: 'completed'
      });
    } catch (e) {
      console.error('[SOFT_DELETE_AUDIT_LOG_FAILED]', e);
    }
    
    console.log('[SOFT_DELETE_COMPLETE]', { 
      userEmail, 
      archiveLog, 
      explorerBenefitsUsed,
      preservedTier: user.plan_tier 
    });
    
    // Send deletion confirmation email (non-blocking)
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        const firstName = (user.full_name || userEmail.split('@')[0]).split(' ')[0];
        const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#374151;margin:0;padding:0}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#0C3B2E;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}.content{padding:30px;background:white;border:1px solid #e5e7eb;border-top:none}.info-box{background:#f9fafb;border-left:4px solid #0C3B2E;padding:15px;margin:15px 0;border-radius:4px}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:22px;">Account Deactivated</h1></div><div class="content"><p>Hi ${firstName},</p><p>Your LeaseShield account has been deactivated as requested. Your active data has been archived.</p><div class="info-box"><strong>What this means:</strong><br>• Your lease scans, cases, and documents have been archived<br>• Your email address is retained so you can return anytime<br>• If you sign back in, your account will be reactivated</div><p style="color:#6b7280;font-size:14px;margin-top:20px"><strong>Want to come back?</strong><br>Simply sign in again at <a href="https://leaseshield.asia" style="color:#0C3B2E;font-weight:600">leaseshield.asia</a> and your account will be restored.</p></div><div class="footer"><p style="margin:0"><strong>LeaseShield</strong><br>Protecting renters in Thailand</p></div></div></body></html>`;
        
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LeaseShield <hello@leaseshield.asia>',
            to: userEmail,
            reply_to: 'support@leaseshield.asia',
            subject: 'Your LeaseShield account has been deactivated',
            html: emailHtml
          })
        });
      }
    } catch (emailErr) {
      console.error('[SOFT_DELETE_EMAIL_FAILED]', emailErr.message);
    }
    
    return Response.json({
      ok: true,
      message: 'Account deactivated. Your data has been archived.',
      archiveLog
    });
    
  } catch (error) {
    console.error('[SOFT_DELETE_ERROR]', error);
    
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
      console.error('[SOFT_DELETE_LOG_FAILED]', logErr);
    }
    
    return Response.json({
      ok: false,
      error: 'DELETION_FAILED',
      message: error.message
    }, { status: 500 });
  }
});