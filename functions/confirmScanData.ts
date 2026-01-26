import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Confirms and saves reviewed scan data after user confirmation
 * Creates deposit tracker and timeline events
 */
Deno.serve(async (req) => {
  const correlationId = `confirm-scan-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      depositData, 
      timelineEvents,
      scanId,
      leaseId 
    } = await req.json();
    
    console.log(`[${correlationId}] Confirming scan data`, {
      userId: user.id,
      userEmail: user.email,
      scanId,
      leaseId
    });

    if (!depositData) {
      return Response.json({ 
        error: 'Missing deposit data'
      }, { status: 400 });
    }

    let createdDepositId = null;
    
    try {
      // Add review confirmation metadata
      const depositToSave = {
        ...depositData,
        lease_id: leaseId,
        user_reviewed: true,
        reviewed_at: new Date().toISOString(),
        audit_log: [{
          field: 'initial_review',
          old_value: 'unreviewed',
          new_value: 'reviewed',
          changed_by: user.email,
          timestamp: new Date().toISOString()
        }]
      };

      // Create or update deposit tracker
      if (depositData.existingDepositId) {
        const { existingDepositId, ...dataToUpdate } = depositToSave;
        await base44.entities.DepositTracker.update(
          existingDepositId,
          dataToUpdate
        );
        createdDepositId = existingDepositId;
        console.log(`[${correlationId}] Updated existing deposit tracker`);
      } else {
        const { existingDepositId, ...dataToCreate } = depositToSave;
        
        // SECURITY FIX: Create deposit using user context (NOT service role)
        // This ensures created_by is set to the authenticated user's email
        const created = await base44.entities.DepositTracker.create(dataToCreate);
        createdDepositId = created.id;
        
        // CRITICAL VALIDATION: Verify deposit was created under correct user
        if (created.created_by !== user.email) {
          console.error(`[${correlationId}] 🚨 SECURITY BREACH DETECTED`, {
            expected_user: user.email,
            actual_created_by: created.created_by,
            deposit_id: created.id,
            is_service_account: created.created_by?.includes('service+')
          });
          
          // Delete the incorrectly created deposit immediately
          await base44.entities.DepositTracker.delete(created.id);
          
          throw new Error(`SECURITY: Deposit created under wrong account (${created.created_by}). Expected: ${user.email}. Operation aborted.`);
        }
        
        console.log(`[${correlationId}] ✅ Created deposit tracker - ownership verified`, {
          deposit_id: created.id,
          created_by: created.created_by,
          user_email: user.email,
          ownership_match: true
        });
      }
    } catch (error) {
      console.error(`[${correlationId}] Deposit save failed:`, error.message);
      throw error;
    }

    // Create timeline events + RENT EVENTS
    let createdEventIds = [];
    
    try {
      const eventsToCreate = [...(timelineEvents || [])];
      
      // ✅ BUG FIX: Generate rent due events from lease start date onwards
      if (depositData?.rent_amount && depositData?.rent_due_day && depositData?.lease_start_date && depositData?.lease_end_date) {
        const leaseStart = new Date(depositData.lease_start_date);
        const leaseEnd = new Date(depositData.lease_end_date);
        const rentDueDay = parseInt(depositData.rent_due_day);
        
        console.log(`[${correlationId}] Generating rent events`, {
          leaseStart: leaseStart.toISOString(),
          leaseEnd: leaseEnd.toISOString(),
          rentDueDay,
          rentAmount: depositData.rent_amount
        });
        
        // Start from lease start month
        let currentDate = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), rentDueDay);
        
        // If rent due day already passed in first month, start from next month
        if (currentDate < leaseStart) {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        // Generate rent events for each month until lease end
        let rentEventCount = 0;
        while (currentDate <= leaseEnd) {
          eventsToCreate.push({
            event_type: 'rent_due',
            event_date: currentDate.toISOString(),
            title: 'Rent due',
            description: `฿${depositData.rent_amount.toLocaleString()}`,
            property_address: depositData.property_address,
            lease_id: leaseId,
            source: 'lease_scan',
            source_scan_id: scanId,
            is_estimated: false,
            needs_review: false
          });
          
          rentEventCount++;
          
          // Move to next month
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        console.log(`[${correlationId}] ✅ Generated ${rentEventCount} rent due events from ${leaseStart.toISOString().split('T')[0]} to ${leaseEnd.toISOString().split('T')[0]}`);
      } else {
        console.log(`[${correlationId}] ⚠️ Skipping rent event generation - missing data:`, {
          hasRentAmount: !!depositData?.rent_amount,
          hasRentDueDay: !!depositData?.rent_due_day,
          hasLeaseStart: !!depositData?.lease_start_date,
          hasLeaseEnd: !!depositData?.lease_end_date
        });
      }
      
      if (eventsToCreate.length > 0) {
        // SECURITY FIX: Create timeline events using user context
        const createPromises = eventsToCreate.map(event => 
          base44.entities.TimelineEvent.create(event)
        );
        const createdEvents = await Promise.all(createPromises);
        createdEventIds = createdEvents.map(e => e.id);
        
        // VALIDATION: Verify timeline events created under correct user
        const wrongOwnership = createdEvents.filter(e => e.created_by !== user.email);
        if (wrongOwnership.length > 0) {
          console.error(`[${correlationId}] 🚨 Timeline events created under wrong user`, {
            expected: user.email,
            wrong_events: wrongOwnership.map(e => ({ id: e.id, created_by: e.created_by }))
          });
        } else {
          console.log(`[${correlationId}] ✅ Created ${createdEventIds.length} timeline events - ownership verified`);
        }
      }
    } catch (error) {
      console.error(`[${correlationId}] Timeline events creation failed:`, error.message);
      // Non-critical - don't block
    }

    return Response.json({
      success: true,
      deposit_tracker_id: createdDepositId,
      timeline_events_created: createdEventIds.length,
      correlationId
    });

  } catch (error) {
    console.error(`[${correlationId}] Confirm scan data error:`, {
      error: error.message,
      stack: error.stack
    });
    
    return Response.json({
      success: false,
      error: error.message,
      correlationId
    }, { status: 500 });
  }
});