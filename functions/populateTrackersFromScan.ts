import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Auto-populates Property Tracker, Deposit Tracker, and Timeline from lease scan
 * Called after successful scan completion
 */
Deno.serve(async (req) => {
  const correlationId = `populate-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${correlationId}] Unauthorized access attempt`);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanResult, leaseId, scanId } = await req.json();
    
    console.log(`[${correlationId}] Starting auto-population`, {
      userId: user.id,
      userEmail: user.email,
      leaseId,
      scanId,
      hasResult: !!scanResult
    });

    if (!scanResult || !leaseId) {
      return Response.json({ 
        error: 'Missing required data',
        details: 'scanResult and leaseId are required'
      }, { status: 400 });
    }

    const extractedData = {
      property_address: scanResult.property_address || '',
      start_date: scanResult.start_date || '',
      end_date: scanResult.end_date || '',
      rent_amount: scanResult.rent_amount || 0,
      deposit_amount: scanResult.deposit_amount || 0,
      notice_period_days: scanResult.notice_period_days || 0,
      rent_due_day: scanResult.rent_due_day || null
    };

    console.log(`[${correlationId}] Extracted data:`, extractedData);

    // Track which fields need review
    const needsReview = {
      rent_due_day: !extractedData.rent_due_day,
      deposit_due_date: false,
      expected_return_date: false
    };

    // ===== PREPARE DATA FOR REVIEW (DO NOT AUTO-SAVE) =====
    let depositTrackerData = null;
    
    try {
      // Check if deposit tracker already exists for this user
      const existingDeposits = await base44.entities.DepositTracker.filter({ 
        created_by: user.email 
      });
      const existingDeposit = existingDeposits.length > 0 ? existingDeposits[0] : null;
      
      // Compute deposit due date (default: lease start)
      const deposit_due_date = extractedData.start_date || new Date().toISOString().split('T')[0];
      const deposit_due_date_is_estimated = !scanResult.deposit_due_date;
      
      if (deposit_due_date_is_estimated) {
        needsReview.deposit_due_date = true;
      }
      
      // Compute expected return date (lease end + 30 days default)
      let expected_return_date = '';
      let expected_return_date_is_estimated = false;
      
      if (extractedData.end_date) {
        const endDate = new Date(extractedData.end_date);
        const returnDays = scanResult.deposit_return_days || 30;
        endDate.setDate(endDate.getDate() + returnDays);
        expected_return_date = endDate.toISOString().split('T')[0];
        expected_return_date_is_estimated = !scanResult.deposit_return_days;
        
        if (expected_return_date_is_estimated) {
          needsReview.expected_return_date = true;
        }
      }
      
      // Prepare field metadata for provenance tracking
      const fieldMetadata = {
        deposit_amount: {
          source: 'scan',
          confidence: extractedData.deposit_amount > 0 ? 0.9 : 0.5,
          last_updated_at: new Date().toISOString(),
          last_updated_by: user.email
        },
        property_address: {
          source: 'scan',
          confidence: extractedData.property_address ? 0.9 : 0.5,
          last_updated_at: new Date().toISOString(),
          last_updated_by: user.email
        },
        rent_amount: {
          source: 'scan',
          confidence: extractedData.rent_amount > 0 ? 0.9 : 0.5,
          last_updated_at: new Date().toISOString(),
          last_updated_by: user.email
        },
        rent_due_day: {
          source: extractedData.rent_due_day ? 'scan' : 'user',
          confidence: extractedData.rent_due_day ? 0.7 : 0.3,
          last_updated_at: new Date().toISOString(),
          last_updated_by: user.email
        }
      };

      depositTrackerData = {
        deposit_amount: extractedData.deposit_amount,
        deposit_paid_date: deposit_due_date,
        expected_return_date: expected_return_date || deposit_due_date,
        deposit_due_date,
        lease_start_date: extractedData.start_date,
        lease_end_date: extractedData.end_date,
        deposit_due_date_is_estimated,
        expected_return_date_is_estimated,
        property_address: extractedData.property_address,
        rent_amount: extractedData.rent_amount,
        rent_due_day: extractedData.rent_due_day,
        rent_due_day_needs_review: needsReview.rent_due_day,
        source_scan_id: scanId,
        auto_populated: true,
        user_reviewed: false,
        field_metadata: fieldMetadata,
        status: 'tracking',
        existingDepositId: existingDeposit?.id
      };
      
      console.log(`[${correlationId}] Prepared deposit data for review (not saved yet)`);
    } catch (error) {
      console.error(`[${correlationId}] Deposit tracker data preparation failed:`, error.message);
    }

    // ===== TIMELINE EVENTS PREPARATION (NOT CREATED YET) =====
    const timelineEventsData = [];
    
    try {
      // Check existing timeline events for this scan to avoid duplicates
      const existingEvents = await base44.entities.TimelineEvent.filter({
        source_scan_id: scanId
      });
      
      const eventExists = (eventType) => {
        return existingEvents.some(e => e.event_type === eventType);
      };
      
      // 1. Lease scanned event
      if (!eventExists('lease_scanned')) {
        timelineEventsData.push({
          event_type: 'lease_scanned',
          event_date: new Date().toISOString(),
          title: 'Lease scanned',
          description: extractedData.property_address,
          property_address: extractedData.property_address,
          lease_id: leaseId,
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: false,
          needs_review: false
        });
      }
      
      // 2. Lease start event
      if (extractedData.start_date && !eventExists('lease_start')) {
        timelineEventsData.push({
          event_type: 'lease_start',
          event_date: new Date(extractedData.start_date).toISOString(),
          title: 'Lease starts',
          description: extractedData.property_address,
          property_address: extractedData.property_address,
          lease_id: leaseId,
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: false,
          needs_review: false
        });
      }
      
      // 3. Lease end event
      if (extractedData.end_date && !eventExists('lease_end')) {
        timelineEventsData.push({
          event_type: 'lease_end',
          event_date: new Date(extractedData.end_date).toISOString(),
          title: 'Lease ends',
          description: extractedData.property_address,
          property_address: extractedData.property_address,
          lease_id: leaseId,
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: false,
          needs_review: false
        });
      }
      
      // 4. Deposit due event
      if (depositTrackerData?.deposit_due_date && !eventExists('deposit_due')) {
        timelineEventsData.push({
          event_type: 'deposit_due',
          event_date: new Date(depositTrackerData.deposit_due_date).toISOString(),
          title: 'Deposit due',
          description: `฿${extractedData.deposit_amount.toLocaleString()}`,
          property_address: extractedData.property_address,
          lease_id: leaseId,
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: depositTrackerData.deposit_due_date_is_estimated || false,
          needs_review: depositTrackerData.deposit_due_date_is_estimated || false
        });
      }
      
      // 5. Deposit return event
      if (depositTrackerData?.expected_return_date && !eventExists('deposit_return')) {
        timelineEventsData.push({
          event_type: 'deposit_return',
          event_date: new Date(depositTrackerData.expected_return_date).toISOString(),
          title: 'Deposit return expected',
          description: `฿${extractedData.deposit_amount.toLocaleString()}`,
          property_address: extractedData.property_address,
          lease_id: leaseId,
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: depositTrackerData.expected_return_date_is_estimated || false,
          needs_review: depositTrackerData.expected_return_date_is_estimated || false
        });
      }
      
      // 6. Notice deadline event
      if (extractedData.end_date && extractedData.notice_period_days > 0 && !eventExists('notice_deadline')) {
        const endDate = new Date(extractedData.end_date);
        const noticeDate = new Date(endDate);
        noticeDate.setDate(noticeDate.getDate() - extractedData.notice_period_days);
        
        timelineEventsData.push({
          event_type: 'notice_deadline',
          event_date: noticeDate.toISOString(),
          title: 'Notice deadline',
          description: `${extractedData.notice_period_days} days notice required`,
          property_address: extractedData.property_address,
          lease_id: leaseId,
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: false,
          needs_review: false
        });
      }
      
      // Timeline events prepared but not created yet (will be created on user confirmation)
      console.log(`[${correlationId}] Prepared ${timelineEventsData.length} timeline events for review`);
    } catch (error) {
      console.error(`[${correlationId}] Timeline events population failed:`, error.message);
    }

    // ===== RESPONSE WITH REVIEW DATA (NOT SAVED YET) =====
    return Response.json({
      success: true,
      review_mode: true,
      data_prepared: {
        deposit_tracker: depositTrackerData,
        timeline_events: timelineEventsData
      },
      review_required: {
        fields: Object.keys(needsReview).filter(key => needsReview[key]),
        summary: {
          property_address: extractedData.property_address,
          monthly_rent: extractedData.rent_amount,
          rent_due_day: extractedData.rent_due_day || 'Not specified',
          deposit_amount: extractedData.deposit_amount,
          lease_start: extractedData.start_date,
          lease_end: extractedData.end_date,
          notice_period_days: extractedData.notice_period_days || 'Not specified',
          deposit_due_date: depositTracker?.deposit_due_date,
          expected_return_date: depositTracker?.expected_return_date,
          notice_deadline: timelineEvents.find(e => e.event_type === 'notice_deadline')?.event_date
        },
        estimated_fields: {
          deposit_due_date: depositTracker?.deposit_due_date_is_estimated,
          expected_return_date: depositTracker?.expected_return_date_is_estimated,
          rent_due_day_missing: needsReview.rent_due_day
        }
      },
      correlationId
    });

  } catch (error) {
    console.error(`[${correlationId}] Auto-population error:`, {
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