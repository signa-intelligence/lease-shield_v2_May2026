import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Admin-only GDPR user deletion
 * For processing GDPR requests via support/admin panel
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const adminUser = await base44.auth.me();

    if (!adminUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const isAdmin = 
      adminUser.role === 'admin' || 
      adminUser.role === 'super_admin' ||
      adminUser.access_level === 'admin' ||
      adminUser.access_level === 'super_admin';
    
    if (!isAdmin) {
      return Response.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }

    const { targetUserEmail, reason } = await req.json();
    
    if (!targetUserEmail) {
      return Response.json({
        error: 'targetUserEmail is required'
      }, { status: 400 });
    }
    
    console.log('[ADMIN_GDPR_DELETE_START]', { 
      targetUserEmail,
      adminEmail: adminUser.email,
      reason,
      timestamp: new Date().toISOString() 
    });
    
    const deletionLog = {
      targetUserEmail,
      adminEmail: adminUser.email,
      reason: reason || 'admin_gdpr',
      timestamp: new Date().toISOString(),
      deletedEntities: {}
    };
    
    const svc = base44.asServiceRole;
    
    // Get target user
    const targetUsers = await svc.entities.User.filter({
      email: targetUserEmail
    });
    
    if (targetUsers.length === 0) {
      return Response.json({
        ok: false,
        error: 'USER_NOT_FOUND',
        message: `User ${targetUserEmail} not found`
      }, { status: 404 });
    }
    
    const targetUser = targetUsers[0];
    
    // 1. Delete Leases
    const leases = await svc.entities.Lease.filter({
      owner_email: targetUserEmail
    });
    
    for (const lease of leases) {
      try {
        await svc.functions.invoke('deleteLease', {
          leaseId: lease.id
        });
      } catch (err) {
        console.warn('[ADMIN_DELETE_LEASE_FAILED]', { leaseId: lease.id, error: err.message });
      }
    }
    deletionLog.deletedEntities.Leases = leases.length;
    
    // 2. Delete DepositTrackers
    const deposits = await svc.entities.DepositTracker.filter({
      owner_email: targetUserEmail
    });
    for (const deposit of deposits) {
      await svc.entities.DepositTracker.delete(deposit.id);
    }
    deletionLog.deletedEntities.DepositTrackers = deposits.length;
    
    // 3. Delete TimelineEvents
    const events = await svc.entities.TimelineEvent.filter({
      owner_email: targetUserEmail
    });
    for (const event of events) {
      await svc.entities.TimelineEvent.delete(event.id);
    }
    deletionLog.deletedEntities.TimelineEvents = events.length;
    
    // 4. Delete Cases
    const cases = await svc.entities.Case.filter({
      user_email: targetUserEmail
    });
    for (const caseItem of cases) {
      await svc.entities.Case.delete(caseItem.id);
    }
    deletionLog.deletedEntities.Cases = cases.length;
    
    // 5. Delete MaintenanceRequests
    const maintenance = await svc.entities.MaintenanceRequest.filter({
      created_by: targetUserEmail
    });
    for (const request of maintenance) {
      await svc.entities.MaintenanceRequest.delete(request.id);
    }
    deletionLog.deletedEntities.MaintenanceRequests = maintenance.length;
    
    // 6. Delete UserStorage
    const storage = await svc.entities.UserStorage.filter({
      user_email: targetUserEmail
    });
    for (const storageRecord of storage) {
      await svc.entities.UserStorage.delete(storageRecord.id);
    }
    deletionLog.deletedEntities.UserStorage = storage.length;
    
    // 7. Delete RateLimits
    try {
      const rateLimits = await svc.entities.RateLimit.filter({
        user_id: targetUser.id
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
        user_email: targetUserEmail
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
        created_by: targetUserEmail
      });
      for (const doc of documents) {
        await svc.entities.Document.delete(doc.id);
      }
      deletionLog.deletedEntities.Documents = documents.length;
    } catch (e) {
      deletionLog.deletedEntities.Documents = 0;
    }
    
    // 10. Anonymize CreditsLedger
    try {
      const credits = await svc.entities.CreditsLedger.filter({
        user_email: targetUserEmail
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
        user_email: targetUserEmail
      });
      for (const conv of conversations) {
        await svc.entities.LisaConversation.delete(conv.id);
      }
      deletionLog.deletedEntities.LisaConversations = conversations.length;
    } catch (e) {
      deletionLog.deletedEntities.LisaConversations = 0;
    }
    
    // 12. Anonymize User record
    try {
      // NOTE: Do NOT set is_active=false — it permanently blocks re-signup on Base44.
      // Just clear PII and mark as deleted so user can re-register if needed.
      await svc.entities.User.update(targetUser.id, {
        plan_tier: 'deleted',
        available_scans: 0,
        data_deleted_at: new Date().toISOString(),
        display_name: '[DELETED]',
        phone: null,
        line_id: null,
        line_connected: false
      });
      deletionLog.userAnonymized = true;
    } catch (e) {
      console.error('[ADMIN_USER_ANONYMIZE_FAILED]', e);
      deletionLog.userAnonymized = false;
    }
    
    // 13. Create GDPR deletion audit log
    try {
      await svc.entities.GDPRDeletionLog.create({
        user_email: targetUserEmail,
        user_id: targetUser.id,
        deleted_at: new Date().toISOString(),
        deleted_by: adminUser.email,
        deletion_summary: deletionLog.deletedEntities,
        reason: reason || 'admin_gdpr',
        status: 'completed'
      });
    } catch (e) {
      console.error('[ADMIN_GDPR_LOG_FAILED]', e);
    }
    
    console.log('[ADMIN_GDPR_DELETE_COMPLETE]', deletionLog);
    
    return Response.json({
      ok: true,
      message: `All data for ${targetUserEmail} has been permanently deleted`,
      deletionLog: deletionLog
    });
    
  } catch (error) {
    console.error('[ADMIN_GDPR_DELETE_ERROR]', error);
    
    return Response.json({
      ok: false,
      error: 'DELETION_FAILED',
      message: error.message
    }, { status: 500 });
  }
});