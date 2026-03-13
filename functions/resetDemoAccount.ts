import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const rid = `reset-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller || caller.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userEmail } = await req.json();
    if (!userEmail) {
      return Response.json({ error: 'Missing userEmail' }, { status: 400 });
    }

    console.log(`[${rid}] Starting full reset for: ${userEmail}`);
    const svc = base44.asServiceRole;

    // Find user
    const users = await svc.entities.User.filter({ email: userEmail });
    if (!users?.length) {
      return Response.json({ error: `User not found: ${userEmail}` }, { status: 404 });
    }
    const targetUser = users[0];
    console.log(`[${rid}] Found user: ${targetUser.id}, tier: ${targetUser.plan_tier}`);

    const log = {};

    // Helper: delete all matching records from an entity
    const deleteAll = async (entityName, entity, filters) => {
      let total = 0;
      for (const filter of filters) {
        try {
          const records = await entity.filter(filter);
          for (const r of records) {
            try { await entity.delete(r.id); total++; } catch (e) { console.warn(`[${rid}] Delete failed ${entityName}/${r.id}:`, e.message); }
          }
        } catch (e) {
          console.warn(`[${rid}] Filter failed on ${entityName}:`, e.message);
        }
      }
      log[entityName] = total;
      console.log(`[${rid}] Deleted ${total} ${entityName}`);
    };

    // 1. Leases
    await deleteAll('Lease', svc.entities.Lease, [
      { owner_email: userEmail },
      { created_by: userEmail }
    ]);

    // 2. LeaseScan
    await deleteAll('LeaseScan', svc.entities.LeaseScan, [
      { owner_email: userEmail },
      { created_by: userEmail }
    ]);

    // 3. DepositTracker
    await deleteAll('DepositTracker', svc.entities.DepositTracker, [
      { owner_email: userEmail }
    ]);

    // 4. Cases
    await deleteAll('Case', svc.entities.Case, [
      { user_email: userEmail },
      { created_by: userEmail }
    ]);

    // 5. MaintenanceRequest
    await deleteAll('MaintenanceRequest', svc.entities.MaintenanceRequest, [
      { created_by: userEmail }
    ]);

    // 6. Documents / Evidence
    await deleteAll('Document', svc.entities.Document, [
      { created_by: userEmail }
    ]);

    // 7. EvidenceFolder
    try {
      await deleteAll('EvidenceFolder', svc.entities.EvidenceFolder, [
        { created_by: userEmail }
      ]);
    } catch (e) { console.warn(`[${rid}] EvidenceFolder skip:`, e.message); }

    // 8. Letters
    await deleteAll('Letter', svc.entities.Letter, [
      { user_id: targetUser.id }
    ]);

    // 9. LetterUsage
    await deleteAll('LetterUsage', svc.entities.LetterUsage, [
      { user_email: userEmail }
    ]);

    // 10. TimelineEvent
    await deleteAll('TimelineEvent', svc.entities.TimelineEvent, [
      { owner_email: userEmail }
    ]);

    // 11. NotificationLog
    await deleteAll('NotificationLog', svc.entities.NotificationLog, [
      { user_email: userEmail }
    ]);

    // 12. Payment
    await deleteAll('Payment', svc.entities.Payment, [
      { created_by: userEmail }
    ]);

    // 13. Referral
    await deleteAll('Referral', svc.entities.Referral, [
      { referrer_email: userEmail },
      { referred_email: userEmail }
    ]);

    // 14. RecycleBin
    await deleteAll('RecycleBin', svc.entities.RecycleBin, [
      { user_email: userEmail }
    ]);

    // 15. CreditLedger
    await deleteAll('CreditLedger', svc.entities.CreditLedger, [
      { user_email: userEmail }
    ]);

    // 16. CreditsLedger
    await deleteAll('CreditsLedger', svc.entities.CreditsLedger, [
      { user_email: userEmail }
    ]);

    // 17. LisaConversation
    await deleteAll('LisaConversation', svc.entities.LisaConversation, [
      { user_email: userEmail }
    ]);

    // 18. UserStorage
    try {
      await deleteAll('UserStorage', svc.entities.UserStorage, [
        { created_by: userEmail }
      ]);
    } catch (e) { console.warn(`[${rid}] UserStorage skip:`, e.message); }

    // 19. AuditLog (clean up)
    await deleteAll('AuditLog', svc.entities.AuditLog, [
      { user_id: targetUser.id }
    ]);

    // 20. RateLimit
    await deleteAll('RateLimit', svc.entities.RateLimit, [
      { user_id: targetUser.id }
    ]);

    // 21. TemplateDownload
    try {
      await deleteAll('TemplateDownload', svc.entities.TemplateDownload, [
        { created_by: userEmail }
      ]);
    } catch (e) { console.warn(`[${rid}] TemplateDownload skip:`, e.message); }

    // Reset user credits to Secure tier defaults
    await svc.entities.User.update(targetUser.id, {
      available_scans: 50,
      letter_credits: 50,
      scans_used_this_month: 0,
      letters_used_this_month: 0,
      fasttrack_used_this_month: 0,
      usage_month: null,
      referral_credits_thb: 0,
      referral_credits_total_thb: 0,
      referral_count: 0
    });
    console.log(`[${rid}] Credits restored to Secure defaults (50 scans, 50 letters)`);

    const totalDeleted = Object.values(log).reduce((s, v) => s + v, 0);
    console.log(`[${rid}] RESET COMPLETE. Total records deleted: ${totalDeleted}`);
    console.log(`[${rid}] Deletion breakdown:`, log);

    return Response.json({
      success: true,
      userEmail,
      tier: targetUser.plan_tier,
      totalDeleted,
      deleted: log,
      creditsRestored: { available_scans: 50, letter_credits: 50 }
    });

  } catch (error) {
    console.error(`[${rid}] FATAL:`, error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});