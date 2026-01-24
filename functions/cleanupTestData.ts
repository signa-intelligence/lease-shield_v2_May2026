import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin'].includes(user.access_level)) {
      return Response.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }
    
    // CRITICAL: Protected accounts that must NOT be deleted
    const PROTECTED_ACCOUNTS = [
      'steve.l@signa-consultants.com',
      'steve.d.lockhart@gmail.com',
      'shortyroc36@gmail.com',
      'tamirbe@base44.com',
      'dom.sources@gmail.com',
      'support@leaseshield.asia',
      'privacy@leaseshield.asia'
    ];
    
    const body = await req.json();
    const preview = body.preview === true;
    
    const deletionReport = {
      leases: 0,
      leaseScans: 0,
      deposits: 0,
      cases: 0,
      documents: 0,
      timeline: 0,
      maintenance: 0,
      notifications: 0,
      lisaConversations: 0,
      lisaAnalytics: 0,
      recycleBin: 0,
      users: 0,
      protected_users_found: []
    };
    
    // ========== DELETE USER CONTENT ==========
    
    // Delete all Leases
    const leases = await base44.asServiceRole.entities.Lease.list();
    for (const lease of leases || []) {
      if (preview) {
        deletionReport.leases++;
      } else {
        await base44.asServiceRole.entities.Lease.delete(lease.id);
        deletionReport.leases++;
      }
    }
    
    // Delete all LeaseScans
    const leaseScans = await base44.asServiceRole.entities.LeaseScan.list();
    for (const scan of leaseScans || []) {
      if (preview) {
        deletionReport.leaseScans++;
      } else {
        await base44.asServiceRole.entities.LeaseScan.delete(scan.id);
        deletionReport.leaseScans++;
      }
    }
    
    // Delete all DepositTracker
    const deposits = await base44.asServiceRole.entities.DepositTracker.list();
    for (const deposit of deposits || []) {
      if (preview) {
        deletionReport.deposits++;
      } else {
        await base44.asServiceRole.entities.DepositTracker.delete(deposit.id);
        deletionReport.deposits++;
      }
    }
    
    // Delete all Cases
    const cases = await base44.asServiceRole.entities.Case.list();
    for (const caseItem of cases || []) {
      if (preview) {
        deletionReport.cases++;
      } else {
        await base44.asServiceRole.entities.Case.delete(caseItem.id);
        deletionReport.cases++;
      }
    }
    
    // Delete all Documents
    const documents = await base44.asServiceRole.entities.Document.list();
    for (const doc of documents || []) {
      if (preview) {
        deletionReport.documents++;
      } else {
        await base44.asServiceRole.entities.Document.delete(doc.id);
        deletionReport.documents++;
      }
    }
    
    // Delete all Timeline events
    const timeline = await base44.asServiceRole.entities.TimelineEvent.list();
    for (const event of timeline || []) {
      if (preview) {
        deletionReport.timeline++;
      } else {
        await base44.asServiceRole.entities.TimelineEvent.delete(event.id);
        deletionReport.timeline++;
      }
    }
    
    // Delete all Maintenance requests
    const maintenance = await base44.asServiceRole.entities.MaintenanceRequest.list();
    for (const request of maintenance || []) {
      if (preview) {
        deletionReport.maintenance++;
      } else {
        await base44.asServiceRole.entities.MaintenanceRequest.delete(request.id);
        deletionReport.maintenance++;
      }
    }
    
    // Delete all NotificationLog
    const notifications = await base44.asServiceRole.entities.NotificationLog.list();
    for (const notification of notifications || []) {
      if (preview) {
        deletionReport.notifications++;
      } else {
        await base44.asServiceRole.entities.NotificationLog.delete(notification.id);
        deletionReport.notifications++;
      }
    }
    
    // Delete all Lisa conversations
    const lisaConversations = await base44.asServiceRole.entities.LisaConversation.list();
    for (const conversation of lisaConversations || []) {
      if (preview) {
        deletionReport.lisaConversations++;
      } else {
        await base44.asServiceRole.entities.LisaConversation.delete(conversation.id);
        deletionReport.lisaConversations++;
      }
    }
    
    // Delete all Lisa analytics
    const lisaAnalytics = await base44.asServiceRole.entities.LisaAnalytics.list();
    for (const analytic of lisaAnalytics || []) {
      if (preview) {
        deletionReport.lisaAnalytics++;
      } else {
        await base44.asServiceRole.entities.LisaAnalytics.delete(analytic.id);
        deletionReport.lisaAnalytics++;
      }
    }
    
    // Delete all RecycleBin
    const recycleBin = await base44.asServiceRole.entities.RecycleBin.list();
    for (const item of recycleBin || []) {
      if (preview) {
        deletionReport.recycleBin++;
      } else {
        await base44.asServiceRole.entities.RecycleBin.delete(item.id);
        deletionReport.recycleBin++;
      }
    }
    
    // ========== DELETE TEST USERS ==========
    
    // Get all users
    const allUsersResponse = await base44.asServiceRole.auth.listUsers();
    const allUsers = allUsersResponse.users || [];
    
    for (const testUser of allUsers) {
      const userEmail = testUser.email.toLowerCase();
      
      // Check if this is a protected account
      if (PROTECTED_ACCOUNTS.map(e => e.toLowerCase()).includes(userEmail)) {
        deletionReport.protected_users_found.push(userEmail);
        continue; // Skip deletion
      }
      
      // This is a test user - delete it
      if (preview) {
        deletionReport.users++;
      } else {
        try {
          await base44.asServiceRole.auth.deleteUser(testUser.id);
          deletionReport.users++;
          console.log(`✅ Deleted test user: ${userEmail}`);
        } catch (error) {
          console.error(`❌ Failed to delete user ${userEmail}:`, error);
        }
      }
    }
    
    const totalDeleted = Object.entries(deletionReport)
      .filter(([key]) => !['protected_users_found'].includes(key))
      .reduce((sum, [_, count]) => sum + (typeof count === 'number' ? count : 0), 0);
    
    if (preview) {
      return Response.json({
        success: true,
        preview: true,
        message: 'Preview mode - nothing deleted',
        would_delete: deletionReport,
        total_items: totalDeleted,
        protected_accounts: PROTECTED_ACCOUNTS,
        protected_found: deletionReport.protected_users_found
      });
    }
    
    return Response.json({
      success: true,
      message: 'All test data and test users deleted',
      deleted: deletionReport,
      total_items_deleted: totalDeleted,
      protected_accounts_preserved: deletionReport.protected_users_found
    });
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});