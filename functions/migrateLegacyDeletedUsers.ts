import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ONE-TIME MIGRATION: Cleanup legacy deleted users
 * 
 * Identifies users marked as deleted before lifecycle enforcement was implemented.
 * Normalizes their status to "deleted" and ensures they cannot access the app.
 * 
 * Patterns matched:
 * - status === "Deleted" (case-insensitive)
 * - status === "deleted"
 * - deleted_at is not null
 * - is_active === false AND has deletion indicators
 * 
 * Actions taken:
 * - Set status = "deleted"
 * - Ensure deleted_at timestamp exists
 * - Ensure deleted_by audit field exists
 * - Set is_active = false
 * 
 * Session revocation:
 * - AuthGuard will block on next request
 * - Updated user records prevent re-authentication
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ ADMIN-ONLY ACCESS
    const admin = await base44.auth.me();
    if (!admin || !['admin', 'super_admin'].includes(admin.access_level)) {
      return Response.json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Super Admin access required'
      }, { status: 403 });
    }
    
    console.log('🔧 [MIGRATION] Starting legacy deleted users migration...');
    console.log('🔐 [MIGRATION] Executed by:', admin.email);
    
    // ✅ STEP 1: Fetch ALL users (use service role to bypass RLS)
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    console.log('📊 [MIGRATION] Total users in database:', allUsers.length);
    
    // ✅ STEP 2: Identify legacy deleted users
    const legacyDeletedUsers = allUsers.filter(u => {
      // Pattern 1: status field explicitly set to "Deleted" or "deleted"
      if (u.status && typeof u.status === 'string') {
        const statusLower = u.status.toLowerCase();
        if (statusLower === 'deleted') {
          return true;
        }
      }
      
      // Pattern 2: deleted_at timestamp exists but status is not "deleted"
      if (u.deleted_at && u.status !== 'deleted') {
        return true;
      }
      
      // Pattern 3: is_active=false AND deleted_at exists (legacy soft delete)
      if (u.is_active === false && u.deleted_at) {
        return true;
      }
      
      return false;
    });
    
    console.log('🔍 [MIGRATION] Legacy deleted users found:', legacyDeletedUsers.length);
    
    if (legacyDeletedUsers.length === 0) {
      return Response.json({
        success: true,
        message: 'No legacy deleted users found. Migration not needed.',
        affected_count: 0,
        users: []
      });
    }
    
    // ✅ STEP 3: Log affected users (for audit)
    const affectedUsersList = legacyDeletedUsers.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      current_status: u.status,
      is_active: u.is_active,
      deleted_at: u.deleted_at,
      deleted_by: u.deleted_by
    }));
    
    console.log('📋 [MIGRATION] Affected users:', JSON.stringify(affectedUsersList, null, 2));
    
    // ✅ STEP 4: Migrate each user
    const migrationResults = [];
    const now = new Date().toISOString();
    
    for (const u of legacyDeletedUsers) {
      try {
        console.log(`🔄 [MIGRATION] Processing user: ${u.email}`);
        
        const updateData = {
          status: 'deleted',
          is_active: false,
          deleted_at: u.deleted_at || now,
          deleted_by: u.deleted_by || 'system_migration'
        };
        
        const updated = await base44.asServiceRole.entities.User.update(u.id, updateData);
        
        console.log(`✅ [MIGRATION] User normalized: ${u.email}`, {
          status: updated.status,
          deleted_at: updated.deleted_at,
          deleted_by: updated.deleted_by
        });
        
        migrationResults.push({
          id: u.id,
          email: u.email,
          success: true,
          before: {
            status: u.status,
            is_active: u.is_active,
            deleted_at: u.deleted_at
          },
          after: {
            status: updated.status,
            is_active: updated.is_active,
            deleted_at: updated.deleted_at,
            deleted_by: updated.deleted_by
          }
        });
        
      } catch (error) {
        console.error(`❌ [MIGRATION] Failed to migrate user ${u.email}:`, error);
        migrationResults.push({
          id: u.id,
          email: u.email,
          success: false,
          error: error.message
        });
      }
    }
    
    // ✅ STEP 5: Summary
    const successCount = migrationResults.filter(r => r.success).length;
    const failureCount = migrationResults.filter(r => !r.success).length;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [MIGRATION] COMPLETE');
    console.log(`   Total affected: ${legacyDeletedUsers.length}`);
    console.log(`   Successfully migrated: ${successCount}`);
    console.log(`   Failed: ${failureCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return Response.json({
      success: true,
      message: `Migration complete. ${successCount} users normalized.`,
      affected_count: legacyDeletedUsers.length,
      migrated_count: successCount,
      failed_count: failureCount,
      results: migrationResults,
      note: 'Affected users can no longer log in. AuthGuard will block access on next request.'
    });
    
  } catch (error) {
    console.error('❌ [MIGRATION] Critical error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});