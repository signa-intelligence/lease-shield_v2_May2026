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

Deno.serve(async (req) => {
  try {
    console.log('[POPULATE_FUNCTION_INVOKED] ========================================');
    
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole || base44;
    
    const body = await req.json().catch(() => ({}));
    const { scanId, leaseId, scan_full } = body;
    
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
    
    // Extract DEPOSIT AMOUNT (multi-source)
    let depositAmount = keyTerms.deposit_amount || keyTerms.security_deposit;
    console.log('[EXTRACTING_DEPOSIT_AMOUNT]', {
      fromKeyTerms: depositAmount,
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
    
    // Extract RENT AMOUNT (multi-source)
    let rentAmount = keyTerms.rent_amount || keyTerms.monthly_rent;
    console.log('[EXTRACTING_RENT_AMOUNT]', { fromKeyTerms: rentAmount });
    
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
    
    // Extract LEASE DATES
    let startDate = keyTerms.start_date || keyTerms.lease_start;
    let endDate = keyTerms.end_date || keyTerms.lease_end;
    console.log('[EXTRACTING_DATES]', { startFromKeyTerms: startDate, endFromKeyTerms: endDate });
    
    if (!startDate || !endDate) {
      const termClause = findClauseByName(clauses, ['term of lease', 'lease duration', 'lease period', 'ระยะเวลา']);
      if (termClause) {
        console.log('[TERM_CLAUSE_FOUND]', {
          clauseTitle: termClause.canonical_name,
          clauseTextPreview: termClause.clause_text?.substring(0, 200)
        });
        const dates = termClause.clause_text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/g);
        console.log('[DATES_EXTRACTED_FROM_TEXT]', dates);
        if (dates && dates.length >= 2) {
          try {
            if (!startDate) startDate = new Date(dates[0]).toISOString().split('T')[0];
            if (!endDate) endDate = new Date(dates[1]).toISOString().split('T')[0];
          } catch (e) {
            console.log('[DATE_PARSING_ERROR]', e.message);
          }
        }
      }
    }
    console.log('[DATES_FINAL]', { startDate, endDate });
    
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
    
    console.log('[EXTRACTION_RESULTS]', {
      depositAmount,
      rentAmount,
      rentDueDay,
      startDate,
      endDate,
      noticePeriodDays
    });
    
    // Build deposit data with REQUIRED FIELDS
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
    
    // Build lease updates
    if (startDate) updates.lease.start_date = startDate;
    if (endDate) updates.lease.end_date = endDate;
    if (noticePeriodDays) {
      updates.lease.notice_period_days = noticePeriodDays;
      if (endDate) {
        const noticeDeadline = new Date(endDate);
        noticeDeadline.setDate(noticeDeadline.getDate() - noticePeriodDays);
        updates.lease.notice_deadline = noticeDeadline.toISOString().split('T')[0];
        updates.lease.notice_alerts_enabled = true;
      }
    }
    
    // Apply updates to database
    const results = {
      deposit: null,
      lease: null,
      timeline: null
    };
    
    // Get existing deposit for this lease
    let depositTracker = null;
    const existingDeposits = await svc.entities.DepositTracker.filter({ lease_id: leaseId });
    if (existingDeposits && existingDeposits.length > 0) {
      depositTracker = existingDeposits[0];
    }
    
    // Create or update deposit tracker
    console.log('[CHECKING_DEPOSIT_UPDATE_CONDITIONS]', {
      hasDepositData: !!updates.deposit,
      depositKeysCount: Object.keys(updates.deposit || {}).length,
      depositData: updates.deposit
    });
    
    if (updates.deposit && Object.keys(updates.deposit).length > 3) {
      const depositData = {
        ...updates.deposit,
        lease_id: leaseId
      };
      
      console.log('[DEPOSIT_DATA_PREPARED_FOR_DB]', depositData);
      
      // Validate required fields before creating
      if (!depositData.deposit_amount || !depositData.deposit_paid_date || !depositData.expected_return_date) {
        console.error('[POPULATE_DEPOSIT_SKIPPED]', {
          reason: 'Missing required fields',
          has_amount: !!depositData.deposit_amount,
          has_paid_date: !!depositData.deposit_paid_date,
          has_return_date: !!depositData.expected_return_date,
          depositData
        });
      } else {
        if (depositTracker) {
          console.log('[EXISTING_DEPOSIT_FOUND]', { depositId: depositTracker.id });
          // Update existing - only populate empty fields
          const updateData = {};
          Object.keys(depositData).forEach(key => {
            if (!depositTracker[key] || depositTracker[key] === 0) {
              updateData[key] = depositData[key];
            }
          });
          
          if (Object.keys(updateData).length > 0) {
            console.log('[UPDATING_DEPOSIT_RECORD]', { depositId: depositTracker.id, updateData });
            try {
              results.deposit = await svc.entities.DepositTracker.update(depositTracker.id, updateData);
              console.log('[DEPOSIT_UPDATE_SUCCESS]', { depositId: depositTracker.id });
            } catch (updateErr) {
              console.error('[DEPOSIT_UPDATE_FAILED]', { error: updateErr.message, stack: updateErr.stack });
              throw updateErr;
            }
          }
        } else {
          console.log('[CREATING_NEW_DEPOSIT_RECORD]', depositData);
          try {
            results.deposit = await svc.entities.DepositTracker.create(depositData);
            console.log('[DEPOSIT_CREATE_SUCCESS]', { depositId: results.deposit?.id, createdData: results.deposit });
          } catch (createErr) {
            console.error('[DEPOSIT_CREATE_FAILED]', { error: createErr.message, stack: createErr.stack, depositData });
            throw createErr;
          }
        }
      }
    } else {
      console.log('[DEPOSIT_UPDATE_SKIPPED]', {
        reason: 'Insufficient deposit data',
        keysCount: Object.keys(updates.deposit || {}).length,
        depositData: updates.deposit
      });
    }
    
    // Update lease record
    console.log('[CHECKING_LEASE_UPDATE_CONDITIONS]', {
      hasLeaseData: !!updates.lease,
      leaseKeysCount: Object.keys(updates.lease || {}).length,
      leaseData: updates.lease
    });
    
    if (updates.lease && Object.keys(updates.lease).length > 0) {
      console.log('[FETCHING_EXISTING_LEASE]', { leaseId });
      const existingLease = await svc.entities.Lease.filter({ id: leaseId });
      if (existingLease && existingLease.length > 0) {
        const lease = existingLease[0];
        console.log('[EXISTING_LEASE_FOUND]', {
          leaseId: lease.id,
          hasStartDate: !!lease.start_date,
          hasEndDate: !!lease.end_date,
          hasNoticeDeadline: !!lease.notice_deadline
        });
        
        // Only populate empty fields
        const updateData = {};
        Object.keys(updates.lease).forEach(key => {
          if (!lease[key]) {
            updateData[key] = updates.lease[key];
          }
        });
        
        console.log('[LEASE_UPDATE_DATA]', updateData);
        
        if (Object.keys(updateData).length > 0) {
          console.log('[UPDATING_LEASE_RECORD]', { leaseId, updateData });
          try {
            results.lease = await svc.entities.Lease.update(leaseId, updateData);
            console.log('[LEASE_UPDATE_SUCCESS]', { leaseId });
          } catch (leaseErr) {
            console.error('[LEASE_UPDATE_FAILED]', { error: leaseErr.message, stack: leaseErr.stack });
            throw leaseErr;
          }
        } else {
          console.log('[LEASE_UPDATE_SKIPPED]', { reason: 'No empty fields to update' });
        }
      } else {
        console.error('[LEASE_NOT_FOUND]', { leaseId });
      }
    } else {
      console.log('[LEASE_UPDATE_SKIPPED]', { reason: 'No lease data to update' });
    }
    
    // Create timeline events
    if (updates.timeline && updates.timeline.length > 0) {
      const timelineResponse = await base44.functions.invoke('createTimelineEvents', {
        entityType: 'lease',
        entityId: leaseId,
        entityData: results.lease || {}
      });
      results.timeline = timelineResponse.data;
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
    console.error('[POPULATE_FROM_SCAN_ERROR]', e.message, e.stack);
    return Response.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: e.message
    }, { status: 500 });
  }
});