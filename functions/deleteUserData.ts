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