import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * PDPA-compliant permanent account deletion.
 * Hard-deletes ALL user data from ALL entities, cancels Stripe subscription,
 * sends confirmation email, then marks User as permanently deleted.
 * 
 * Called from the Account page with user's own auth token.
 */

async function deleteAllRecords(svc, entityObj, filterObj, label) {
  let count = 0;
  try {
    const records = await entityObj.filter(filterObj);
    for (const record of records) {
      await entityObj.delete(record.id);
      count++;
    }
    console.log(`[HARD_DELETE] ✅ ${count} ${label}`);
  } catch (e) {
    console.error(`[HARD_DELETE] ❌ ${label}: ${e.message}`);
  }
  return count;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmText } = await req.json();
    
    if (confirmText !== 'DELETE') {
      return Response.json({
        ok: false,
        error: 'CONFIRMATION_REQUIRED',
        message: 'You must type DELETE to confirm permanent deletion'
      }, { status: 400 });
    }

    const userEmail = user.email;
    const userId = user.id;
    
    console.log('[PERMANENT_DELETE_START]', { 
      userEmail, userId,
      tier: user.plan_tier,
      timestamp: new Date().toISOString() 
    });

    const svc = base44.asServiceRole;
    const summary = {};

    // 1. Hard delete all user-owned entities
    summary.leases = await deleteAllRecords(svc, svc.entities.Lease, { owner_email: userEmail }, 'Leases');
    summary.leaseScans = await deleteAllRecords(svc, svc.entities.LeaseScan, { owner_email: userEmail }, 'LeaseScans');
    summary.deposits = await deleteAllRecords(svc, svc.entities.DepositTracker, { owner_email: userEmail }, 'Deposits');
    summary.timelineEvents = await deleteAllRecords(svc, svc.entities.TimelineEvent, { owner_email: userEmail }, 'TimelineEvents');
    summary.cases = await deleteAllRecords(svc, svc.entities.Case, { user_email: userEmail }, 'Cases');
    summary.maintenance = await deleteAllRecords(svc, svc.entities.MaintenanceRequest, { created_by: userEmail }, 'MaintenanceRequests');
    summary.documents = await deleteAllRecords(svc, svc.entities.Document, { created_by: userEmail }, 'Documents');
    summary.notifications = await deleteAllRecords(svc, svc.entities.NotificationLog, { user_email: userEmail }, 'NotificationLogs');
    summary.conversations = await deleteAllRecords(svc, svc.entities.LisaConversation, { user_email: userEmail }, 'LisaConversations');
    summary.recycleBin = await deleteAllRecords(svc, svc.entities.RecycleBin, { user_email: userEmail }, 'RecycleBin');
    summary.letterUsage = await deleteAllRecords(svc, svc.entities.LetterUsage, { user_email: userEmail }, 'LetterUsage');
    summary.letters = await deleteAllRecords(svc, svc.entities.Letter, { user_id: userId }, 'Letters');
    summary.referrals = await deleteAllRecords(svc, svc.entities.Referral, { referrer_email: userEmail }, 'Referrals');
    summary.rateLimits = await deleteAllRecords(svc, svc.entities.RateLimit, { user_id: userId }, 'RateLimits');
    summary.creditLedger = await deleteAllRecords(svc, svc.entities.CreditLedger, { user_email: userEmail }, 'CreditLedger');
    summary.creditsLedger = await deleteAllRecords(svc, svc.entities.CreditsLedger, { user_email: userEmail }, 'CreditsLedger');
    summary.auditLog = await deleteAllRecords(svc, svc.entities.AuditLog, { user_id: userId }, 'AuditLogs');
    summary.templateDownloads = await deleteAllRecords(svc, svc.entities.TemplateDownload, { user_email: userEmail }, 'TemplateDownloads');
    summary.evidenceFolders = await deleteAllRecords(svc, svc.entities.EvidenceFolder, { created_by: userEmail }, 'EvidenceFolders');
    summary.payments = await deleteAllRecords(svc, svc.entities.Payment, { created_by: userEmail }, 'Payments');

    // Also try UserStorage
    try {
      const storageRecords = await svc.entities.UserStorage.filter({ user_email: userEmail });
      for (const s of storageRecords) { await svc.entities.UserStorage.delete(s.id); }
      summary.userStorage = storageRecords.length;
    } catch (e) { summary.userStorage = 0; }

    // 2. Cancel Stripe subscription if active
    summary.stripeCancelled = false;
    try {
      const stripeSubId = user.stripe_subscription_id;
      if (stripeSubId) {
        const stripe = (await import('npm:stripe@14.21.0')).default;
        const stripeClient = stripe(Deno.env.get('SK_TEST_secret_key'));
        await stripeClient.subscriptions.cancel(stripeSubId);
        summary.stripeCancelled = true;
        console.log('[HARD_DELETE] ✅ Stripe subscription cancelled:', stripeSubId);
      }
    } catch (e) {
      console.error('[HARD_DELETE] Stripe cancel error (non-fatal):', e.message);
    }

    // 3. Send confirmation email BEFORE marking user deleted
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        const firstName = (user.full_name || userEmail.split('@')[0]).split(' ')[0];
        const totalItems = Object.values(summary).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
        
        const itemsList = Object.entries(summary)
          .filter(([_, v]) => typeof v === 'number' && v > 0)
          .map(([key, val]) => `<li>${key}: ${val} records</li>`)
          .join('');

        const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#374151;margin:0;padding:0"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:#DC2626;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0"><h1 style="margin:0;font-size:22px">Account Permanently Deleted</h1></div><div style="padding:30px;background:white;border:1px solid #e5e7eb;border-top:none"><p>Hi ${firstName},</p><p>Your LeaseShield account (<strong>${userEmail}</strong>) and all associated data have been <strong>permanently deleted</strong> as requested.</p><div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:15px;margin:15px 0;border-radius:4px"><strong>Data deleted (${totalItems} total records):</strong><ul style="margin:10px 0;padding-left:20px">${itemsList}</ul></div><p style="color:#DC2626"><strong>This action is permanent and cannot be undone.</strong></p><div style="background:#F3F4F6;padding:15px;margin:15px 0;border-radius:4px;font-size:13px"><strong>Note:</strong> Payment receipts may be retained for up to 7 years for legal and accounting compliance per Thai Revenue Code.</div><p>If you did not request this deletion, please contact us immediately at <a href="mailto:privacy@leaseshield.asia">privacy@leaseshield.asia</a></p><p style="color:#6b7280;font-size:14px">Thank you for using LeaseShield. We're sorry to see you go.</p></div><div style="text-align:center;padding:20px;color:#6b7280;font-size:12px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px"><p style="margin:0"><strong>LeaseShield</strong> – Protecting renters in Thailand</p></div></div></body></html>`;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'LeaseShield <hello@leaseshield.asia>',
            to: userEmail,
            reply_to: 'privacy@leaseshield.asia',
            subject: 'Your LeaseShield account has been permanently deleted',
            html: emailHtml
          })
        });
        console.log('[HARD_DELETE] ✅ Confirmation email sent');
      }
    } catch (emailErr) {
      console.error('[HARD_DELETE] Email error (non-fatal):', emailErr.message);
    }

    // 4. Create GDPR audit log (retained for compliance — not user data)
    try {
      await svc.entities.GDPRDeletionLog.create({
        user_email: userEmail,
        user_id: userId,
        deleted_at: new Date().toISOString(),
        deleted_by: 'self',
        deletion_summary: { ...summary, type: 'permanent_hard_delete' },
        reason: 'user_request',
        status: 'completed'
      });
    } catch (e) {
      console.error('[HARD_DELETE] Audit log error:', e.message);
    }

    // 5. Mark user as permanently deleted
    // We can't hard-delete the User entity (built-in), but we clear all PII and mark permanently deleted
    try {
      await base44.auth.updateMe({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        permanently_deleted: true,
        previous_plan_tier: user.plan_tier || 'explorer',
        explorer_benefits_used: true,
        plan_tier: 'deleted',
        subscription_status: 'deleted',
        is_active: false,
        // Clear all PII
        display_name: null,
        phone: null,
        line_id: null,
        line_messaging_token: null,
        line_connected: false,
        tenant_address: null,
        landlord_name: null,
        landlord_email: null,
        landlord_phone: null,
        referral_code: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        available_scans: 0,
        letter_credits: 0,
        one_time_scan_credits: 0,
      });
      console.log('[HARD_DELETE] ✅ User record cleared and marked permanently deleted');
    } catch (e) {
      console.error('[HARD_DELETE] ❌ User update failed:', e.message);
      return Response.json({ ok: false, error: 'Failed to finalize user deletion', message: e.message }, { status: 500 });
    }

    console.log('[PERMANENT_DELETE_COMPLETE]', { userEmail, summary });

    return Response.json({
      ok: true,
      message: 'Account and all data permanently deleted',
      summary
    });

  } catch (error) {
    console.error('[PERMANENT_DELETE_ERROR]', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});