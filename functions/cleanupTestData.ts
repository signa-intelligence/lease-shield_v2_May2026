import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('=== CLEANUP FUNCTION STARTED ===');
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    console.log('Cleanup requested by:', user?.email, 'Access level:', user?.access_level);
    
    if (!user || !['admin', 'super_admin'].includes(user.access_level)) {
      console.error('UNAUTHORIZED: User is not admin');
      return Response.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }
    
    // Parse request body safely
    let preview = false;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      if (bodyText) {
        const body = JSON.parse(bodyText);
        preview = body.preview === true;
      }
    } catch (parseError) {
      console.warn('Body parse warning (using defaults):', parseError.message);
      preview = false;
    }
    
    console.log('Mode:', preview ? 'PREVIEW' : 'DELETE');
    
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
      recycleBin: 0
    };
    
    // Helper function to safely delete entities
    const deleteEntitySafely = async (entityName, reportKey) => {
      try {
        console.log(`Processing ${entityName}...`);
        const items = await base44.asServiceRole.entities[entityName].list();
        const itemList = items || [];
        
        if (preview) {
          deletionReport[reportKey] = itemList.length;
          console.log(`  Preview: ${itemList.length} items would be deleted`);
          return;
        }
        
        for (const item of itemList) {
          await base44.asServiceRole.entities[entityName].delete(item.id);
          deletionReport[reportKey]++;
        }
        console.log(`  Deleted: ${deletionReport[reportKey]} items`);
      } catch (error) {
        console.error(`  Error with ${entityName}:`, error.message);
      }
    };
    
    // ========== DELETE USER CONTENT ==========
    // Note: User accounts are PRESERVED to maintain:
    // - Stripe payment records and subscription data
    // - Tax and audit trail requirements
    // - Revenue tracking and analytics integrity
    
    await deleteEntitySafely('Lease', 'leases');
    await deleteEntitySafely('LeaseScan', 'leaseScans');
    await deleteEntitySafely('DepositTracker', 'deposits');
    await deleteEntitySafely('Case', 'cases');
    await deleteEntitySafely('Document', 'documents');
    await deleteEntitySafely('TimelineEvent', 'timeline');
    await deleteEntitySafely('MaintenanceRequest', 'maintenance');
    await deleteEntitySafely('NotificationLog', 'notifications');
    await deleteEntitySafely('LisaConversation', 'lisaConversations');
    await deleteEntitySafely('LisaAnalytics', 'lisaAnalytics');
    await deleteEntitySafely('RecycleBin', 'recycleBin');
    
    const totalDeleted = Object.values(deletionReport).reduce((sum, count) => sum + count, 0);
    
    console.log('=== CLEANUP COMPLETE ===');
    console.log('Total items:', totalDeleted);
    
    if (preview) {
      return Response.json({
        success: true,
        preview: true,
        message: 'Preview mode - nothing deleted',
        would_delete: deletionReport,
        total_items: totalDeleted
      });
    }
    
    return Response.json({
      success: true,
      message: 'All test content deleted, user accounts preserved',
      deleted: deletionReport,
      total_items_deleted: totalDeleted
    });
    
  } catch (error) {
    console.error('=== CLEANUP ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack,
      details: error.toString()
    }, { status: 500 });
  }
});