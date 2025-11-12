import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * NUCLEAR FIX FOR BROKEN MAINTENANCE REQUESTS
 * Tries multiple strategies to find created_by
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check if user is admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    console.log('🔧 === NUCLEAR FIX: FIXING ALL BROKEN MAINTENANCE REQUESTS ===');
    
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

    // Get all users for matching
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`👥 Loaded ${allUsers.length} users for matching`);

    const fixed = [];
    const errors = [];

    for (const request of brokenRequests) {
      try {
        let inferredEmail = null;
        
        // STRATEGY 1: Check communication_log for tenant email
        if (request.communication_log && request.communication_log.length > 0) {
          const tenantLog = request.communication_log.find(log => 
            log.sender === 'tenant' && log.sender_email
          );
          if (tenantLog && tenantLog.sender_email) {
            inferredEmail = tenantLog.sender_email;
            console.log(`✅ Strategy 1 (comm log): Found email for ${request.id}: ${inferredEmail}`);
          }
        }

        // STRATEGY 2: Use acknowledgment_token to check which user has this property
        if (!inferredEmail && request.property_address) {
          // Find deposits with matching property address
          const deposits = await base44.asServiceRole.entities.DepositTracker.list();
          const matchingDeposit = deposits.find(d => 
            d.property_address && 
            request.property_address &&
            d.property_address.toLowerCase().trim() === request.property_address.toLowerCase().trim()
          );
          if (matchingDeposit && matchingDeposit.created_by) {
            inferredEmail = matchingDeposit.created_by;
            console.log(`✅ Strategy 2 (property match): Found email for ${request.id}: ${inferredEmail}`);
          }
        }

        // STRATEGY 3: If only one non-admin user exists, assume it's them
        if (!inferredEmail) {
          const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
          if (nonAdminUsers.length === 1) {
            inferredEmail = nonAdminUsers[0].email;
            console.log(`✅ Strategy 3 (single user): Found email for ${request.id}: ${inferredEmail}`);
          }
        }

        // STRATEGY 4: Default to steve.l@signa-consultants.com if exists
        if (!inferredEmail) {
          const defaultUser = allUsers.find(u => u.email === 'steve.l@signa-consultants.com');
          if (defaultUser) {
            inferredEmail = defaultUser.email;
            console.log(`✅ Strategy 4 (default user): Using steve.l@signa-consultants.com for ${request.id}`);
          }
        }

        if (!inferredEmail) {
          console.log(`⚠️ FAILED: Cannot infer email for request ${request.id}`);
          errors.push({
            id: request.id,
            error: 'Cannot infer created_by - all strategies failed',
            request_data: {
              has_comm_log: !!request.communication_log?.length,
              property_address: request.property_address || 'none',
              issue_title: request.issue_title
            }
          });
          continue;
        }

        console.log(`🔧 Fixing request ${request.id} - setting created_by: ${inferredEmail}`);
        
        await base44.asServiceRole.entities.MaintenanceRequest.update(request.id, {
          created_by: inferredEmail
        });

        fixed.push({
          id: request.id,
          created_by: inferredEmail,
          strategy: 'multiple strategies applied'
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