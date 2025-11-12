import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * FIX BROKEN MAINTENANCE REQUESTS
 * Sets created_by on all maintenance requests that have undefined created_by
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check if user is admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    console.log('🔧 === FIXING BROKEN MAINTENANCE REQUESTS ===');
    
    // Get all maintenance requests
    const allRequests = await base44.asServiceRole.entities.MaintenanceRequest.list();
    
    console.log(`📋 Found ${allRequests.length} total maintenance requests`);
    
    const brokenRequests = allRequests.filter(r => !r.created_by);
    
    console.log(`❌ Found ${brokenRequests.length} requests with undefined created_by`);
    
    if (brokenRequests.length === 0) {
      return Response.json({
        success: true,
        message: 'No broken requests found',
        fixed: 0
      });
    }

    const fixed = [];
    const errors = [];

    for (const request of brokenRequests) {
      try {
        // Try to infer created_by from communication_log
        let inferredEmail = null;
        
        if (request.communication_log && request.communication_log.length > 0) {
          const firstLog = request.communication_log[0];
          if (firstLog.sender === 'tenant' && firstLog.sender_email) {
            inferredEmail = firstLog.sender_email;
          }
        }

        if (!inferredEmail) {
          console.log(`⚠️ Cannot infer email for request ${request.id}`);
          errors.push({
            id: request.id,
            error: 'Cannot infer created_by - no tenant email in communication log'
          });
          continue;
        }

        console.log(`🔧 Fixing request ${request.id} - setting created_by: ${inferredEmail}`);
        
        await base44.asServiceRole.entities.MaintenanceRequest.update(request.id, {
          created_by: inferredEmail
        });

        fixed.push({
          id: request.id,
          created_by: inferredEmail
        });

        console.log(`✅ Fixed request ${request.id}`);

      } catch (error) {
        console.error(`❌ Failed to fix request ${request.id}:`, error);
        errors.push({
          id: request.id,
          error: error.message
        });
      }
    }

    console.log(`✅ Fixed ${fixed.length} requests`);
    console.log(`❌ Failed to fix ${errors.length} requests`);

    return Response.json({
      success: true,
      fixed: fixed,
      errors: errors,
      summary: {
        total: allRequests.length,
        broken: brokenRequests.length,
        fixed: fixed.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('❌ Critical error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});