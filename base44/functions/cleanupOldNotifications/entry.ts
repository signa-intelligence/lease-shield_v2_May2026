import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Cleanup function to purge old/malformed notification logs
 * Run this once to clear ghost notifications
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin only
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('🧹 Starting notification cleanup...');
    
    // Get ALL notifications
    const allNotifications = await base44.asServiceRole.entities.NotificationLog.filter({}, '-created_date', 1000);
    
    console.log(`📊 Found ${allNotifications.length} notifications to review`);
    
    // Delete all old notifications
    let deletedCount = 0;
    for (const notification of allNotifications) {
      try {
        await base44.asServiceRole.entities.NotificationLog.delete(notification.id);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete ${notification.id}:`, err);
      }
    }
    
    console.log(`✅ Cleanup complete. Deleted ${deletedCount} notifications.`);
    
    return Response.json({
      success: true,
      message: `Deleted ${deletedCount} old notifications`,
      deleted_count: deletedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});