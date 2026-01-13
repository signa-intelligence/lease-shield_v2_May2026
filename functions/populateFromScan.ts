// Auto-populate Property Tracker and Timeline from scan results
// Called after lease scan completes successfully

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function extractNumericValue(text) {
  if (!text) return null;
  // Extract numbers from strings like "THB 38,000" or "38000" or "38,000.00"
  const cleaned = String(text).replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
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
  // Extract day number (1-31) from strings like "due on the 5th" or "day 15"
  const dayPattern = /\b(\d{1,2})(st|nd|rd|th)?\b/;
  const match = String(text).match(dayPattern);
  if (!match) return null;
  
  const day = parseInt(match[1]);
  return (day >= 1 && day <= 31) ? day : null;
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
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole || base44;
    
    const body = await req.json().catch(() => ({}));
    const { scanId, leaseId, scan_full } = body;
    
    if (!scanId || !leaseId || !scan_full) {
      return Response.json({
        ok: false,
        error: 'BAD_REQUEST',
        message: 'scanId, leaseId, and scan_full are required'
      }, { status: 400 });
    }
    
    const clauses = Array.isArray(scan_full.clauses) ? scan_full.clauses : [];
    const keyTerms = scan_full.key_terms || {};
    
    console.log('[POPULATE_FROM_SCAN]', {
      scanId,
      leaseId,
      clausesCount: clauses.length,
      hasKeyTerms: !!keyTerms
    });
    
    // Extract data from clauses
    const rentClause = findClauseByName(clauses, ['rent', 'monthly rent', 'rental payment']);
    const depositClause = findClauseByName(clauses, ['security deposit', 'deposit', 'advance payment']);
    const termClause = findClauseByName(clauses, ['term of lease', 'lease duration', 'lease period']);
    const noticeClause = findClauseByName(clauses, ['notice', 'notice requirements', 'termination notice']);
    
    let updates = {
      deposit: null,
      lease: null,
      timeline: []
    };
    
    // Extract rent data
    if (rentClause) {
      const rentAmount = extractNumericValue(rentClause.clause_text) || 
                        extractNumericValue(keyTerms.rent_amount);
      const rentDueDay = extractDayOfMonth(rentClause.clause_text);
      
      if (rentAmount || rentDueDay) {
        updates.deposit = {
          rent_amount: rentAmount,
          rent_due_day: rentDueDay,
          rent_alerts_enabled: false,
          rent_alert_days_before: 3
        };
      }
    }
    
    // Extract deposit data
    if (depositClause) {
      const depositAmount = extractNumericValue(depositClause.clause_text) || 
                           extractNumericValue(keyTerms.deposit_amount);
      const depositPaidDate = extractDate(depositClause.clause_text) || 
                             extractDate(keyTerms.deposit_paid_date);
      
      if (depositAmount) {
        if (!updates.deposit) updates.deposit = {};
        updates.deposit.deposit_amount = depositAmount;
        if (depositPaidDate) {
          updates.deposit.deposit_paid_date = depositPaidDate;
        }
        updates.deposit.auto_populated = true;
        updates.deposit.source_scan_id = scanId;
      }
    }
    
    // Extract lease dates
    if (termClause) {
      const startDate = extractDate(termClause.clause_text) || 
                       extractDate(keyTerms.start_date);
      const endDate = extractDate(termClause.clause_text) || 
                     extractDate(keyTerms.end_date);
      
      if (startDate || endDate) {
        updates.lease = {
          start_date: startDate,
          end_date: endDate
        };
        
        // Calculate expected deposit return date (typically lease end date + 30-60 days)
        if (endDate && !updates.deposit?.expected_return_date) {
          const returnDate = new Date(endDate);
          returnDate.setDate(returnDate.getDate() + 45); // Default 45 days after lease ends
          if (!updates.deposit) updates.deposit = {};
          updates.deposit.expected_return_date = returnDate.toISOString().split('T')[0];
          updates.deposit.expected_return_date_is_estimated = true;
        }
      }
    }
    
    // Extract notice period
    if (noticeClause) {
      const noticeDaysMatch = noticeClause.clause_text.match(/(\d+)\s*days/i);
      if (noticeDaysMatch) {
        const noticeDays = parseInt(noticeDaysMatch[1]);
        if (!updates.lease) updates.lease = {};
        updates.lease.notice_period_days = noticeDays;
        
        // Calculate notice deadline if we have end date
        if (updates.lease.end_date) {
          const noticeDeadline = new Date(updates.lease.end_date);
          noticeDeadline.setDate(noticeDeadline.getDate() - noticeDays);
          updates.lease.notice_deadline = noticeDeadline.toISOString().split('T')[0];
          updates.lease.notice_alerts_enabled = true;
        }
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
    if (updates.deposit && Object.keys(updates.deposit).length > 0) {
      const depositData = {
        ...updates.deposit,
        lease_id: leaseId,
        status: 'tracking'
      };
      
      if (depositTracker) {
        // Update existing - only populate empty fields
        const updateData = {};
        Object.keys(depositData).forEach(key => {
          if (!depositTracker[key] || depositTracker[key] === 0) {
            updateData[key] = depositData[key];
          }
        });
        
        if (Object.keys(updateData).length > 0) {
          results.deposit = await svc.entities.DepositTracker.update(depositTracker.id, updateData);
        }
      } else {
        // Create new
        results.deposit = await svc.entities.DepositTracker.create(depositData);
      }
    }
    
    // Update lease record
    if (updates.lease && Object.keys(updates.lease).length > 0) {
      const existingLease = await svc.entities.Lease.filter({ id: leaseId });
      if (existingLease && existingLease.length > 0) {
        const lease = existingLease[0];
        
        // Only populate empty fields
        const updateData = {};
        Object.keys(updates.lease).forEach(key => {
          if (!lease[key]) {
            updateData[key] = updates.lease[key];
          }
        });
        
        if (Object.keys(updateData).length > 0) {
          results.lease = await svc.entities.Lease.update(leaseId, updateData);
        }
      }
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
    
    console.log('[POPULATE_FROM_SCAN_SUCCESS]', {
      scanId,
      leaseId,
      depositCreated: !!results.deposit,
      leaseUpdated: !!results.lease,
      timelineCreated: !!results.timeline
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