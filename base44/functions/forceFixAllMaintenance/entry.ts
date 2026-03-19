import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * NUCLEAR FIX: Force-fix ALL maintenance requests with undefined created_by
 * Aggressively assigns created_by using multiple fallback strategies
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('💣 === NUCLEAR MAINTENANCE FIX START ===');
    
    // Get ALL maintenance requests
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

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`👥 Found ${allUsers.length} users in system`);

    const fixed = [];
    const errors = [];

    for (const request of brokenRequests) {
      try {
        let targetEmail = null;

        // Strategy 1: Check communication log for tenant email
        if (request.communication_log && request.communication_log.length > 0) {
          const firstLog = request.communication_log[0];
          if (firstLog.sender === 'tenant' && firstLog.sender_email) {
            targetEmail = firstLog.sender_email;
            console.log(`📧 Strategy 1: Found email in log: ${targetEmail}`);
          }
        }

        // Strategy 2: If no email found, check if request has property_address
        // Match it with any user who has same property_address in their deposits
        if (!targetEmail && request.property_address) {
          console.log(`🏠 Strategy 2: Searching by property address: ${request.property_address}`);
          const deposits = await base44.asServiceRole.entities.DepositTracker.list();
          const matchingDeposit = deposits.find(d => 
            d.property_address && 
            d.property_address.toLowerCase().includes(request.property_address.toLowerCase())
          );
          if (matchingDeposit && matchingDeposit.created_by) {
            targetEmail = matchingDeposit.created_by;
            console.log(`✅ Found matching deposit owner: ${targetEmail}`);
          }
        }

        // Strategy 3: Default to first non-admin user (steve.l@signa-consultants.com)
        if (!targetEmail) {
          console.log(`🔍 Strategy 3: Defaulting to first real user`);
          const realUser = allUsers.find(u => 
            u.email && 
            u.email !== 'hello@leaseshield.asia' &&
            u.email !== 'support@leaseshield.asia' &&
            u.email !== 'ops@leaseshield.asia'
          );
          if (realUser) {
            targetEmail = realUser.email;
            console.log(`✅ Defaulting to: ${targetEmail}`);
          }
        }

        // Strategy 4: Last resort - use steve.l@signa-consultants.com
        if (!targetEmail) {
          targetEmail = 'steve.l@signa-consultants.com';
          console.log(`⚠️ Strategy 4: Last resort - using steve.l@signa-consultants.com`);
        }

        console.log(`🔧 Fixing request ${request.id} - setting created_by: ${targetEmail}`);
        
        await base44.asServiceRole.entities.MaintenanceRequest.update(request.id, {
          created_by: targetEmail
        });

        fixed.push({
          id: request.id,
          created_by: targetEmail,
          issue_title: request.issue_title
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