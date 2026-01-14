import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole || base44;
    
    const body = await req.json();
    const { scanId, leaseId } = body;
    
    console.log('[EXTRACT_START]', { scanId, leaseId });
    
    // Get the scan record
    const scan = await svc.entities.LeaseScan.get(scanId);
    if (!scan || !scan.scan_full) {
      return Response.json({ ok: false, error: 'Scan not found' });
    }
    
    const scanFull = scan.scan_full;
    const clauses = scanFull.clauses || [];
    
    console.log('[EXTRACT_CLAUSES_FOUND]', { count: clauses.length });
    
    // Extract deposit amount - look in multiple places
    let depositAmount = null;
    let rentAmount = null;
    let startDate = null;
    let endDate = null;
    
    // Method 1: Check key_terms first
    if (scanFull.key_terms) {
      depositAmount = scanFull.key_terms.security_deposit || 
                     scanFull.key_terms.deposit_amount ||
                     null;
      rentAmount = scanFull.key_terms.monthly_rent ||
                  scanFull.key_terms.rent_amount ||
                  null;
    }
    
    // Method 2: Parse from clauses if not in key_terms
    if (!depositAmount || !rentAmount) {
      for (const clause of clauses) {
        const text = clause.clause_text || '';
        const name = clause.canonical_name || '';
        
        // Find deposit
        if (!depositAmount && (name.includes('Deposit') || name.includes('Security'))) {
          const match = text.match(/(?:THB|฿)\s*([\d,]+)/);
          if (match) {
            depositAmount = parseInt(match[1].replace(/,/g, ''));
          }
        }
        
        // Find rent
        if (!rentAmount && name.includes('Rent')) {
          const match = text.match(/(?:THB|฿)\s*([\d,]+)/);
          if (match) {
            rentAmount = parseInt(match[1].replace(/,/g, ''));
          }
        }
        
        // Find dates
        if (name.includes('Term') || name.includes('Duration')) {
          // Look for "12 months" or "one year"
          const monthMatch = text.match(/(\d+)\s*months?/i);
          if (monthMatch) {
            const months = parseInt(monthMatch[1]);
            startDate = new Date().toISOString().split('T')[0];
            const end = new Date();
            end.setMonth(end.getMonth() + months);
            endDate = end.toISOString().split('T')[0];
          }
        }
      }
    }
    
    console.log('[EXTRACT_RESULTS]', { 
      depositAmount, 
      rentAmount, 
      startDate, 
      endDate 
    });
    
    // Create records ONLY if we have data
    const results = {
      deposit: null,
      lease: null,
      notification: null
    };
    
    // Create deposit record
    if (depositAmount) {
      // Calculate dates
      const today = new Date().toISOString().split('T')[0];
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      const returnDate = oneYearLater.toISOString().split('T')[0];
      
      results.deposit = await svc.entities.DepositTracker.create({
        lease_id: leaseId,
        deposit_amount: depositAmount,
        deposit_paid_date: today,
        expected_return_date: returnDate,
        status: 'tracking'
      });
      console.log('[EXTRACT_DEPOSIT_CREATED]', { id: results.deposit.id });
    }
    
    // Update lease dates
    if (startDate && endDate) {
      results.lease = await svc.entities.Lease.update(leaseId, {
        start_date: startDate,
        end_date: endDate
      });
      console.log('[EXTRACT_LEASE_UPDATED]');
    }
    
    // Create notification
    if (endDate) {
      const notifDate = new Date(endDate);
      notifDate.setDate(notifDate.getDate() - 30); // 30 days before
      
      results.notification = await svc.entities.NotificationLog.create({
        lease_id: leaseId,
        notification_type: 'lease_ending',
        scheduled_date: notifDate.toISOString(),
        status: 'pending',
        message: `Your lease ends on ${endDate}`
      });
      console.log('[EXTRACT_NOTIFICATION_CREATED]');
    }
    
    console.log('[EXTRACT_SUCCESS]', {
      depositCreated: !!results.deposit,
      leaseUpdated: !!results.lease,
      notificationCreated: !!results.notification
    });
    
    return Response.json({
      ok: true,
      extracted: {
        depositAmount,
        rentAmount,
        startDate,
        endDate
      },
      created: {
        deposit: !!results.deposit,
        lease: !!results.lease,
        notification: !!results.notification
      }
    });
    
  } catch (error) {
    console.error('[EXTRACT_ERROR]', { 
      error: error.message,
      stack: error.stack 
    });
    
    return Response.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
});