import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins allowed
    const superAdmins = ['steve.l@signa-consultants.com', 'steve.d.lockhart@gmail.com'];
    if (!superAdmins.includes(currentUser.email.toLowerCase())) {
      return Response.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }

    // Fetch ALL users (including deleted to find duplicates)
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date');
    
    // Group by normalized email
    const emailGroups = {};
    allUsers.forEach(user => {
      const normalizedEmail = user.email.toLowerCase().trim();
      if (!emailGroups[normalizedEmail]) {
        emailGroups[normalizedEmail] = [];
      }
      emailGroups[normalizedEmail].push(user);
    });

    // Find duplicates
    const duplicates = Object.entries(emailGroups).filter(([email, users]) => users.length > 1);

    if (duplicates.length === 0) {
      return Response.json({
        success: true,
        message: 'No duplicates found',
        deduped: 0
      });
    }

    const dedupeLog = [];

    // Process each duplicate group
    for (const [email, users] of duplicates) {
      // Sort: active first, then by created_date (oldest first)
      users.sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        return new Date(a.created_date) - new Date(b.created_date);
      });

      const canonical = users[0]; // Keep the first one (active + oldest)
      const duplicatesToRemove = users.slice(1);

      dedupeLog.push({
        email,
        kept: canonical.id,
        removed: duplicatesToRemove.map(u => u.id)
      });

      // Reassign related records to canonical user
      for (const dup of duplicatesToRemove) {
        // Update Leases
        const leases = await base44.asServiceRole.entities.Lease.filter({ created_by: dup.email });
        for (const lease of leases) {
          await base44.asServiceRole.entities.Lease.update(lease.id, { created_by: canonical.email });
        }

        // Update Cases
        const cases = await base44.asServiceRole.entities.Case.filter({ created_by: dup.email });
        for (const caseItem of cases) {
          await base44.asServiceRole.entities.Case.update(caseItem.id, { 
            created_by: canonical.email,
            user_email: canonical.email 
          });
        }

        // Update DepositTrackers
        const deposits = await base44.asServiceRole.entities.DepositTracker.filter({ created_by: dup.email });
        for (const deposit of deposits) {
          await base44.asServiceRole.entities.DepositTracker.update(deposit.id, { created_by: canonical.email });
        }

        // Update Documents
        const documents = await base44.asServiceRole.entities.Document.filter({ created_by: dup.email });
        for (const doc of documents) {
          await base44.asServiceRole.entities.Document.update(doc.id, { created_by: canonical.email });
        }

        // Update MaintenanceRequests
        const maintenanceReqs = await base44.asServiceRole.entities.MaintenanceRequest.filter({ created_by: dup.email });
        for (const mr of maintenanceReqs) {
          await base44.asServiceRole.entities.MaintenanceRequest.update(mr.id, { created_by: canonical.email });
        }

        // Update SupportTickets
        const tickets = await base44.asServiceRole.entities.SupportTicket.filter({ created_by: dup.email });
        for (const ticket of tickets) {
          await base44.asServiceRole.entities.SupportTicket.update(ticket.id, { 
            created_by: canonical.email,
            user_email: canonical.email 
          });
        }

        // Delete duplicate user
        await base44.asServiceRole.entities.User.delete(dup.id);
      }
    }

    return Response.json({
      success: true,
      message: `Deduplicated ${duplicates.length} email(s)`,
      deduped: duplicates.length,
      log: dedupeLog
    });

  } catch (error) {
    console.error('Deduplication error:', error);
    return Response.json({ 
      error: error.message || 'Deduplication failed'
    }, { status: 500 });
  }
});