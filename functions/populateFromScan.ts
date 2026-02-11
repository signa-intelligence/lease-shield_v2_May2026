// Auto-populate Property Tracker and Timeline from scan results
// Called after lease scan completes successfully

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function extractNumericValue(text) {
  if (!text) return null;
  // Extract numbers from strings like "THB 38,000" or "38000" or "38,000.00"
  const cleaned = String(text).replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) || num === 0 ? null : num;
}

function extractDate(text) {
  if (!text) return null;
  // Try to parse various date formats
  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/;
  const match = String(text).match(datePattern);
  if (!match) return null;
  
  try {
    const parsed = new Date(match[0]);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function extractDayOfMonth(text) {
  if (!text) return null;
  // Extract day number (1-31) from strings like "due on the 5th" or "day 15" or "วันที่ 5"
  const dayPattern = /(?:วันที่\s+)?(\d{1,2})(?:st|nd|rd|th)?(?:\s+(?:of|ของ))?/i;
  const match = String(text).match(dayPattern);
  if (!match) return null;
  
  const day = parseInt(match[1]);
  return (day >= 1 && day <= 31) ? day : null;
}

function extractAllNumericValues(text) {
  if (!text) return [];
  // Find ALL numbers in text
  const numbers = String(text).match(/\d+[,\d]*\.?\d*/g);
  if (!numbers) return [];
  
  return numbers
    .map(n => {
      const cleaned = n.replace(/,/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    })
    .filter(n => n !== null && n > 0);
}

function findClauseByName(clauses, names) {
  if (!Array.isArray(clauses)) return null;
  
  for (const name of names) {
    const found = clauses.find(c => 
      c.canonical_name?.toLowerCase().includes(name.toLowerCase()) ||
      c.title?.toLowerCase().includes(name.toLowerCase())
    );
    if (found) return found;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// ATOMIC LOCK - Prevents race condition when function is called twice
// ═══════════════════════════════════════════════════════════════════════
const creationLocks = new Map();

async function createDepositTrackerWithLock(svc, leaseId, depositData, executionId) {
  const lockKey = `deposit_${leaseId}`;
  
  console.log(`[${executionId}] 🔒 Attempting to acquire lock for ${lockKey}`);
  
  // Check if already being created by another execution
  if (creationLocks.has(lockKey)) {
    console.log(`[${executionId}] ⏳ Lock exists - another execution is creating tracker`);

    // Wait for other execution to finish (max 10 seconds)
    let waitCount = 0;
    while (creationLocks.has(lockKey) && waitCount < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }

    // Return existing tracker
    const existing = await svc.entities.DepositTracker.filter({ lease_id: leaseId });
    if (existing && existing.length > 0) {
      console.log(`[${executionId}] ✅ Returning tracker created by other execution: ${existing[0].id}`);
      return { created: false, tracker: existing[0] };
    }
    }

    // Acquire lock
    creationLocks.set(lockKey, Date.now());
    console.log(`[${executionId}] 🔒 Lock acquired for ${lockKey}`);

    try {
    // CRITICAL: Double-check AFTER acquiring lock
    console.log(`[${executionId}] 🔍 Double-checking for existing trackers...`);
    const existingAfterLock = await svc.entities.DepositTracker.filter({ lease_id: leaseId });
    
    if (existingAfterLock && existingAfterLock.length > 0) {
      console.log(`[${executionId}] ⛔ ABORT - Tracker found after lock: ${existingAfterLock[0].id}`);
      return { created: false, tracker: existingAfterLock[0] };
    }
    
    // Create new tracker
     console.log(`[${executionId}] ✅ No tracker exists - creating new one...`);
     const created = await base44.entities.DepositTracker.create(depositData);
     console.log(`[${executionId}] ✅ CREATED deposit tracker: ${created.id}`);
    
    return { created: true, tracker: created };
    
  } finally {
    // Release lock
    creationLocks.delete(lockKey);
    console.log(`[${executionId}] 🔓 Lock released for ${lockKey}`);
  }
}

Deno.serve(async (req) => {
  // Generate unique execution ID for tracing
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🔍 EXECUTION START [${executionId}]`);
    console.log('Function: populateFromScan.js');
    console.log('Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════════');
    
    const base44 = createClientFromRequest(req);
    
    const body = await req.json().catch(() => ({}));
    const { scanId, leaseId, scan_full, userEmail } = body;
    
    // Get user - prefer passed userEmail (from scanLease.js), fallback to auth.me()
    let user;
    if (userEmail) {
      // When called from scanLease.js, use the passed email directly
      user = { email: userEmail };
      console.log('[POPULATE_USER_CONTEXT] Using passed userEmail:', userEmail);
    } else {
      // Direct invocation - get from request context
      user = await base44.auth.me();
      if (!user) {
        return Response.json({
          ok: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }, { status: 401 });
      }
    }
    
    const svc = base44; // Use authenticated context, not service role
    
    console.log(`[${executionId}] Input params:`, { scanId, leaseId, hasScanFull: !!scan_full });
    
    console.log('[POPULATE_INPUT_PARAMS]', {
      scanId,
      leaseId,
      hasScanFull: !!scan_full,
      scanFullKeys: scan_full ? Object.keys(scan_full) : []
    });
    
    if (!scanId || !leaseId || !scan_full) {
      console.error('[POPULATE_MISSING_PARAMS]', { scanId, leaseId, hasScanFull: !!scan_full });
      return Response.json({
        ok: false,
        error: 'BAD_REQUEST',
        message: 'scanId, leaseId, and scan_full are required'
      }, { status: 400 });
    }
    
    const clauses = Array.isArray(scan_full.clauses) ? scan_full.clauses : [];
    const keyTerms = scan_full.key_terms || {};
    
    console.log('[POPULATE_DATA_AVAILABLE]', {
      scanId,
      leaseId,
      clausesCount: clauses.length,
      hasKeyTerms: !!keyTerms,
      keyTermsKeys: Object.keys(keyTerms),
      keyTermsValues: keyTerms
    });
    
    // ENHANCED: Extract from key_terms first (most reliable), then from clause text
    console.log('[EXTRACTION_START]', { 
      hasKeyTerms: !!keyTerms,
      keyTermsKeys: Object.keys(keyTerms),
      clausesCount: clauses.length 
    });
    
    let updates = {
      deposit: {},
      lease: {},
      timeline: []
    };
    
    // Extract DEPOSIT AMOUNT (multi-source with case normalization)
    let depositAmount = 
      keyTerms.deposit_amount || 
      keyTerms.security_deposit || 
      keyTerms.depositAmount ||
      keyTerms.securityDeposit;
    
    console.log('[EXTRACTING_DEPOSIT_AMOUNT]', {
      fromKeyTerms: depositAmount,
      allKeyTerms: keyTerms,
      hasDepositClause: !!findClauseByName(clauses, ['security deposit', 'deposit', 'advance payment', 'เงินมัดจำ'])
    });
    
    if (!depositAmount) {
      const depositClause = findClauseByName(clauses, ['security deposit', 'deposit', 'advance payment', 'เงินมัดจำ']);
      if (depositClause) {
        console.log('[DEPOSIT_CLAUSE_FOUND]', {
          clauseTitle: depositClause.canonical_name,
          clauseTextPreview: depositClause.clause_text?.substring(0, 200)
        });
        const amounts = extractAllNumericValues(depositClause.clause_text);
        console.log('[EXTRACTED_AMOUNTS]', amounts);
        // Take largest number (likely the deposit amount)
        depositAmount = amounts.length > 0 ? Math.max(...amounts) : null;
      } else {
        console.log('[DEPOSIT_CLAUSE_NOT_FOUND]', { availableClauses: clauses.map(c => c.canonical_name) });
      }
    }
    console.log('[DEPOSIT_AMOUNT_FINAL]', depositAmount);
    
    // Extract RENT AMOUNT (multi-source with case normalization)
    let rentAmount = 
      keyTerms.rent_amount || 
      keyTerms.monthly_rent ||
      keyTerms.rentAmount ||
      keyTerms.monthlyRent;
    
    console.log('[EXTRACTING_RENT_AMOUNT]', { 
      fromKeyTerms: rentAmount,
      allKeyTerms: keyTerms
    });
    
    if (!rentAmount) {
      const rentClause = findClauseByName(clauses, ['rent', 'monthly rent', 'rental payment', 'ค่าเช่า']);
      if (rentClause) {
        console.log('[RENT_CLAUSE_FOUND]', {
          clauseTitle: rentClause.canonical_name,
          clauseTextPreview: rentClause.clause_text?.substring(0, 200)
        });
        const amounts = extractAllNumericValues(rentClause.clause_text);
        console.log('[RENT_AMOUNTS_EXTRACTED]', amounts);
        // Take first substantial amount (likely the rent)
        rentAmount = amounts.find(a => a >= 1000) || amounts[0];
      }
    }
    console.log('[RENT_AMOUNT_FINAL]', rentAmount);
    
    // Extract RENT DUE DAY
    let rentDueDay = keyTerms.rent_due_day;
    if (!rentDueDay) {
      const rentClause = findClauseByName(clauses, ['rent', 'monthly rent', 'rental payment', 'ค่าเช่า']);
      if (rentClause) {
        rentDueDay = extractDayOfMonth(rentClause.clause_text);
      }
    }
    
    // Extract LEASE DATES with enhanced fallback logic
    console.log('[POPULATE_LEASE_DATES_START] ========================================', { 
      leaseId, 
      clausesCount: clauses.length,
      allClauseTitles: clauses.map(c => c.canonical_name || c.title)
    });
    
    let startDate = keyTerms.start_date || keyTerms.lease_start;
    let endDate = keyTerms.end_date || keyTerms.lease_end;
    console.log('[EXTRACTING_DATES_FROM_KEY_TERMS]', { 
      startFromKeyTerms: startDate, 
      endFromKeyTerms: endDate,
      allKeyTermsAvailable: keyTerms
    });
    
    if (!startDate || !endDate) {
      console.log('[SEARCHING_FOR_TERM_CLAUSE]', {
        searchingFor: ['term of lease', 'lease duration', 'lease period', 'ระยะเวลา', 'term', 'duration']
      });
      
      const termClause = findClauseByName(clauses, ['term of lease', 'lease duration', 'lease period', 'ระยะเวลา', 'term', 'duration']);
      console.log('[POPULATE_TERM_CLAUSE_SEARCH_RESULT]', { 
        found: !!termClause,
        clauseTitle: termClause?.canonical_name || termClause?.title,
        fullClauseText: termClause?.clause_text || 'NOT FOUND'
      });
      
      if (termClause) {
        console.log('[POPULATE_PARSING_DATES_FROM_CLAUSE]', {
          clauseText: termClause.clause_text,
          regexPatterns: ['\\d{1,2}[-\\/]\\d{1,2}[-\\/]\\d{2,4}', '(\\d+)\\s*(month|year|เดือน|ปี)']
        });
        
        // Try multiple date patterns
        const dates = termClause.clause_text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/g);
        console.log('[DATES_REGEX_MATCH_RESULT]', { 
          matchedDates: dates,
          datesCount: dates?.length || 0
        });
        
        if (dates && dates.length >= 2) {
          console.log('[PARSING_DATES_FROM_MATCHES]', { date0: dates[0], date1: dates[1] });
          try {
            if (!startDate) {
              startDate = new Date(dates[0]).toISOString().split('T')[0];
              console.log('[START_DATE_PARSED]', startDate);
            }
            if (!endDate) {
              endDate = new Date(dates[1]).toISOString().split('T')[0];
              console.log('[END_DATE_PARSED]', endDate);
            }
          } catch (e) {
            console.error('[DATE_PARSING_ERROR]', { error: e.message, dates });
          }
        } else {
          console.log('[INSUFFICIENT_DATE_MATCHES]', { foundCount: dates?.length || 0, needed: 2 });
        }
        
        // Fallback: Look for duration in months/years
        if (!startDate || !endDate) {
          console.log('[TRYING_DURATION_EXTRACTION]', { missingStart: !startDate, missingEnd: !endDate });
          const durationMatch = termClause.clause_text.match(/(\d+)\s*(month|year|เดือน|ปี)/i);
          console.log('[DURATION_REGEX_RESULT]', { match: durationMatch });
          
          if (durationMatch) {
            const duration = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            
            console.log('[DURATION_FOUND]', { duration, unit, willCalculateDates: true });
            
            // If we have start date, calculate end date
            if (startDate && !endDate) {
              const start = new Date(startDate);
              if (unit.includes('year') || unit.includes('ปี')) {
                start.setFullYear(start.getFullYear() + duration);
              } else {
                start.setMonth(start.getMonth() + duration);
              }
              endDate = start.toISOString().split('T')[0];
            }
            // If we have neither, estimate both from today
            if (!startDate && !endDate) {
              startDate = new Date().toISOString().split('T')[0];
              const calculatedEnd = new Date();
              if (unit.includes('year') || unit.includes('ปี')) {
                calculatedEnd.setFullYear(calculatedEnd.getFullYear() + duration);
              } else {
                calculatedEnd.setMonth(calculatedEnd.getMonth() + duration);
              }
              endDate = calculatedEnd.toISOString().split('T')[0];
              console.log('[DATES_CALCULATED_FROM_DURATION]', { startDate, endDate, duration, unit });
            }
          }
        }
      }
    }
    
    // Final fallback: If still no dates, use today + 12 months
    if (!startDate || !endDate) {
      console.log('[DATES_FALLBACK_TRIGGERED]', { 
        reason: 'No dates extracted from clause or key_terms',
        willUseDefault: true
      });
      if (!startDate) {
        startDate = new Date().toISOString().split('T')[0];
        console.log('[START_DATE_DEFAULTED_TO_TODAY]', startDate);
      }
      if (!endDate) {
        const defaultEnd = new Date(startDate);
        defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
        endDate = defaultEnd.toISOString().split('T')[0];
        console.log('[END_DATE_CALCULATED_AS_START_PLUS_1_YEAR]', endDate);
      }
    }
    
    // Extract NOTICE PERIOD
    let noticePeriodDays = keyTerms.notice_period_days;
    if (!noticePeriodDays) {
      const noticeClause = findClauseByName(clauses, ['notice', 'notice requirements', 'termination notice', 'การบอกกล่าว']);
      if (noticeClause) {
        const noticeDaysMatch = noticeClause.clause_text.match(/(\d+)\s*(?:days|วัน)/i);
        if (noticeDaysMatch) {
          noticePeriodDays = parseInt(noticeDaysMatch[1]);
        }
      }
    }
    
    console.log('[POPULATE_EXTRACTED_DATES] ========================================', { 
      startDate, 
      endDate,
      noticePeriodDays,
      allDatesValid: !!(startDate && endDate)
    });
    
    console.log('[EXTRACTION_RESULTS]', {
      depositAmount,
      rentAmount,
      rentDueDay,
      startDate,
      endDate,
      noticePeriodDays
    });
    
    // Build deposit data with REQUIRED FIELDS
    console.log('[DEPOSIT_AMOUNT_CHECK]', { 
      depositAmount, 
      isTruthy: !!depositAmount,
      type: typeof depositAmount
    });
    
    if (depositAmount) {
      console.log('[BUILDING_DEPOSIT_DATA] depositAmount found:', depositAmount);
      updates.deposit.deposit_amount = depositAmount;
      updates.deposit.auto_populated = true;
      updates.deposit.source_scan_id = scanId;
      updates.deposit.status = 'tracking';
      
      // Required field: deposit_paid_date (estimate as today if not found)
      updates.deposit.deposit_paid_date = startDate || new Date().toISOString().split('T')[0];
      updates.deposit.deposit_due_date_is_estimated = !startDate;
      
      // Required field: expected_return_date (estimate as lease end + 45 days)
      if (endDate) {
        const returnDate = new Date(endDate);
        returnDate.setDate(returnDate.getDate() + 45);
        updates.deposit.expected_return_date = returnDate.toISOString().split('T')[0];
        updates.deposit.expected_return_date_is_estimated = true;
      } else {
        // Fallback: 1 year from now
        const returnDate = new Date();
        returnDate.setFullYear(returnDate.getFullYear() + 1);
        updates.deposit.expected_return_date = returnDate.toISOString().split('T')[0];
        updates.deposit.expected_return_date_is_estimated = true;
      }
      console.log('[DEPOSIT_DATA_BUILT]', updates.deposit);
    } else {
      console.log('[NO_DEPOSIT_AMOUNT_FOUND] Skipping deposit data build');
    }
    
    // Add rent data to deposit record (rent is tracked on DepositTracker)
    if (rentAmount) {
      if (!updates.deposit) updates.deposit = {};
      updates.deposit.rent_amount = rentAmount;
      updates.deposit.rent_due_day = rentDueDay || 5; // Default to 5th if not found
      updates.deposit.rent_due_day_needs_review = !rentDueDay;
      updates.deposit.rent_alerts_enabled = false;
      updates.deposit.rent_alert_days_before = 3;
    }
    
    // Build lease updates - ALWAYS update if we have dates
    console.log('[BUILDING_LEASE_UPDATES]', { hasStartDate: !!startDate, hasEndDate: !!endDate });
    
    if (startDate) {
      updates.lease.start_date = startDate;
      console.log('[LEASE_UPDATE_ADD_START_DATE]', startDate);
    }
    if (endDate) {
      updates.lease.end_date = endDate;
      console.log('[LEASE_UPDATE_ADD_END_DATE]', endDate);
    }
    
    // Calculate notice deadline if we have end date
    const finalNoticePeriodDays = noticePeriodDays || 30; // Default to 30 days
    console.log('[CALCULATING_NOTICE_DEADLINE]', { 
      hasEndDate: !!endDate, 
      noticePeriodDays: finalNoticePeriodDays 
    });
    
    if (endDate) {
      const noticeDeadline = new Date(endDate);
      noticeDeadline.setDate(noticeDeadline.getDate() - finalNoticePeriodDays);
      updates.lease.notice_period_days = finalNoticePeriodDays;
      updates.lease.notice_deadline = noticeDeadline.toISOString().split('T')[0];
      updates.lease.notice_alerts_enabled = true;
      console.log('[NOTICE_DEADLINE_CALCULATED]', { 
        endDate, 
        noticePeriodDays: finalNoticePeriodDays,
        noticeDeadline: updates.lease.notice_deadline
      });
      
      // Add timeline event for notice deadline
      updates.timeline.push({
        event_type: 'notice_deadline',
        event_date: noticeDeadline.toISOString(),
        title: 'Notice Deadline',
        description: `Last day to notify landlord before lease ends`,
        source: 'lease_scan',
        source_scan_id: scanId,
        lease_id: leaseId
      });
      
      // Add timeline event for lease end
      updates.timeline.push({
        event_type: 'lease_end',
        event_date: new Date(endDate).toISOString(),
        title: 'Lease End Date',
        description: `Lease agreement ends`,
        source: 'lease_scan',
        source_scan_id: scanId,
        lease_id: leaseId
      });
    }
    
    if (startDate) {
      // Add timeline event for lease start
      updates.timeline.push({
        event_type: 'lease_start',
        event_date: new Date(startDate).toISOString(),
        title: 'Lease Start Date',
        description: `Lease agreement begins`,
        source: 'lease_scan',
        source_scan_id: scanId,
        lease_id: leaseId
      });
    }
    
    // Apply updates to database
    const results = {
      deposit: null,
      lease: null,
      timeline: null
    };
    
    // ═══════════════════════════════════════════════════════════════════════
    // DEPOSIT TRACKER - USE ATOMIC LOCK TO PREVENT RACE CONDITION
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`[${executionId}] ═══════════════════════════════════════════════`);
    console.log(`[${executionId}] DEPOSIT TRACKER CREATION WITH LOCK`);
    console.log(`[${executionId}] LeaseId: ${leaseId}`);
    console.log(`[${executionId}] ═══════════════════════════════════════════════`);
    
    if (updates.deposit && Object.keys(updates.deposit).length >= 3) {
      const depositData = {
        ...updates.deposit,
        lease_id: leaseId,
        owner_email: userEmail,
        created_by: userEmail
      };
      
      console.log(`[${executionId}] [DEPOSIT_CREATE_ATTEMPT]`, depositData);
      
      // Validate required fields
      if (!depositData.deposit_amount || !depositData.deposit_paid_date || !depositData.expected_return_date) {
        console.log(`[${executionId}] ⚠️ Missing required fields - skipping deposit creation`);
        console.log(`[${executionId}] [DEPOSIT_VALIDATION_FAILED]`, {
          hasAmount: !!depositData.deposit_amount,
          hasPaidDate: !!depositData.deposit_paid_date,
          hasReturnDate: !!depositData.expected_return_date
        });
      } else {
        // Use atomic lock mechanism
        const lockResult = await createDepositTrackerWithLock(svc, leaseId, depositData, executionId);
        results.deposit = lockResult.tracker;
        
        console.log(`[${executionId}] [DEPOSIT_CREATED]`, { id: results.deposit?.id, created: lockResult.created });
        
        if (lockResult.created) {
          console.log(`[${executionId}] ✅ NEW deposit tracker created`);
        } else {
          console.log(`[${executionId}] ℹ️ Used existing deposit tracker`);
        }
      }
    } else {
      console.log(`[${executionId}] ⚠️ Insufficient deposit data - skipping`);
      console.log(`[${executionId}] [DEPOSIT_DATA_INSUFFICIENT]`, {
        hasDepositObj: !!updates.deposit,
        keysCount: Object.keys(updates.deposit || {}).length,
        allKeys: Object.keys(updates.deposit || {})
      });
    }
    
    console.log(`[${executionId}] ═══════════════════════════════════════════════`);
    console.log(`[${executionId}] DEPOSIT TRACKER SECTION COMPLETE`);
    console.log(`[${executionId}] ═══════════════════════════════════════════════`);
    
    // Update lease record - FORCE UPDATE even if fields exist (scan data is authoritative)
    console.log('[CHECKING_LEASE_UPDATE_CONDITIONS]', {
      hasLeaseData: !!updates.lease,
      leaseKeysCount: Object.keys(updates.lease || {}).length,
      leaseData: updates.lease
    });
    
    if (updates.lease && Object.keys(updates.lease).length > 0) {
      console.log('[POPULATE_UPDATING_LEASE] ========================================', { 
        leaseId, 
        updateData: updates.lease,
        fieldsToUpdate: Object.keys(updates.lease)
      });
      try {
        // FORCE UPDATE: Scan data is authoritative, override existing values
        results.lease = await base44.entities.Lease.update(leaseId, updates.lease);
        console.log('[POPULATE_LEASE_UPDATED] ========================================', { 
          success: true,
          leaseId, 
          updatedFields: Object.keys(updates.lease),
          resultHasStartDate: !!results.lease?.start_date,
          resultHasEndDate: !!results.lease?.end_date,
          resultHasNoticeDeadline: !!results.lease?.notice_deadline,
          fullResult: results.lease
        });
      } catch (leaseErr) {
        console.error('[POPULATE_LEASE_UPDATE_ERROR] ========================================', { 
          error: leaseErr.message, 
          stack: leaseErr.stack,
          updateData: updates.lease,
          leaseId
        });
        throw leaseErr;
      }
    } else {
      console.log('[LEASE_UPDATE_SKIPPED] ========================================', { 
        reason: 'No lease data to update',
        hasLeaseData: !!updates.lease,
        keysCount: Object.keys(updates.lease || {}).length,
        leaseData: updates.lease
      });
    }
    
    // Create timeline events directly
    console.log('[CHECKING_TIMELINE_CONDITIONS]', {
      hasTimelineEvents: updates.timeline.length > 0,
      eventsCount: updates.timeline.length,
      events: updates.timeline
    });
    
    if (updates.timeline && updates.timeline.length > 0) {
      console.log('[CREATING_TIMELINE_EVENTS]', { eventsCount: updates.timeline.length });
      const createdEvents = [];
      
      for (const event of updates.timeline) {
        try {
          console.log('[CREATING_TIMELINE_EVENT]', event);
          const created = await base44.entities.TimelineEvent.create({
            ...event,
            needs_review: false,
            is_estimated: false,
            owner_email: userEmail,
            created_by: userEmail
          });
          createdEvents.push(created);
          console.log('[TIMELINE_EVENT_CREATED]', { eventId: created.id, eventType: event.event_type });
        } catch (timelineErr) {
          console.error('[TIMELINE_EVENT_CREATE_FAILED]', { 
            error: timelineErr.message, 
            event 
          });
          // Continue creating other events even if one fails
        }
      }
      
      results.timeline = createdEvents;
      console.log('[TIMELINE_EVENTS_CREATED]', { count: createdEvents.length });
    } else {
      console.log('[TIMELINE_EVENTS_SKIPPED]', { reason: 'No timeline events to create' });
    }
    
    console.log('[POPULATE_FROM_SCAN_SUCCESS] ========================================', {
      scanId,
      leaseId,
      depositCreated: !!results.deposit,
      depositId: results.deposit?.id,
      leaseUpdated: !!results.lease,
      timelineCreated: !!results.timeline,
      finalResults: results
    });
    
    return Response.json({
      ok: true,
      populated: {
        deposit: !!results.deposit,
        lease: !!results.lease,
        timeline: !!results.timeline
      },
      results
    });
    
  } catch (e) {
    console.error('[POPULATE_FROM_SCAN_CRITICAL_ERROR] ========================================', {
      error: e.message,
      stack: e.stack,
      name: e.name,
      fullError: String(e)
    });
    return Response.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: e.message,
      stack: e.stack
    }, { status: 500 });
  }
});