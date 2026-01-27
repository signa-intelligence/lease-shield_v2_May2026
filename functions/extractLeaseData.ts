import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole || base44;
    
    const body = await req.json();
    const { scanId, leaseId, userEmail } = body;
    
    // Get user email - prefer passed userEmail, fallback to auth.me()
    let actualUserEmail = userEmail;
    if (!actualUserEmail) {
      try {
        const user = await base44.auth.me();
        actualUserEmail = user?.email;
      } catch {
        actualUserEmail = null;
      }
    }
    console.log('[EXTRACT_USER_CONTEXT]', { passedUserEmail: userEmail, actualUserEmail });
    
    console.log('[EXTRACT_START]', { scanId, leaseId });
    
    // Get the scan record
    const scan = await svc.entities.LeaseScan.get(scanId);
    if (!scan || !scan.scan_full) {
      return Response.json({ ok: false, error: 'Scan not found' });
    }
    
    const scanFull = scan.scan_full;
    const clauses = scanFull.clauses || [];
    
    console.log('[EXTRACT_CLAUSES_FOUND]', { count: clauses.length });
    
    // DECLARE VARIABLES FIRST
    let depositAmount = null;
    let rentAmount = null;
    let startDate = null;
    let endDate = null;
    let propertyAddress = null;
    
    // FIRST: Try to extract from key_terms (most reliable)
    if (scanFull.key_terms) {
      console.log('[EXTRACT_CHECKING_KEY_TERMS]', { 
        hasKeyTerms: true,
        keys: Object.keys(scanFull.key_terms),
        property_address: scanFull.key_terms.property_address,
        security_deposit: scanFull.key_terms.security_deposit,
        monthly_rent: scanFull.key_terms.monthly_rent
      });
      
      // Check for lease_start_date, lease_end_date in key_terms
      if (scanFull.key_terms.lease_start_date) {
        startDate = scanFull.key_terms.lease_start_date;
        console.log('[EXTRACT_START_FROM_KEY_TERMS]', { startDate });
      }
      
      if (scanFull.key_terms.lease_end_date) {
        endDate = scanFull.key_terms.lease_end_date;
        console.log('[EXTRACT_END_FROM_KEY_TERMS]', { endDate });
      }
      
      // Extract property address
      if (scanFull.key_terms.property_address) {
        propertyAddress = scanFull.key_terms.property_address;
        console.log('[EXTRACT_PROPERTY_ADDRESS_KEY_TERMS]', { propertyAddress });
      }
      
      // Extract deposit
      if (scanFull.key_terms.security_deposit) {
        depositAmount = scanFull.key_terms.security_deposit;
        console.log('[EXTRACT_DEPOSIT_KEY_TERMS]', { depositAmount });
      }
      
      // Extract rent
      if (scanFull.key_terms.monthly_rent) {
        rentAmount = scanFull.key_terms.monthly_rent;
        console.log('[EXTRACT_RENT_KEY_TERMS]', { rentAmount });
      }
    }
    
    // Method 1: Check key_terms first (already done above, but fill any gaps)
    if (scanFull.key_terms) {
      if (!depositAmount) {
        depositAmount = scanFull.key_terms.security_deposit || 
                       scanFull.key_terms.deposit_amount ||
                       null;
      }
      if (!rentAmount) {
        rentAmount = scanFull.key_terms.monthly_rent ||
                    scanFull.key_terms.rent_amount ||
                    null;
      }
      if (!propertyAddress && scanFull.key_terms.property_address) {
        propertyAddress = scanFull.key_terms.property_address;
        console.log('[EXTRACT_PROPERTY_ADDRESS]', { propertyAddress });
      }
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
        
        // Find rent - check multiple clause names
        if (!rentAmount && (name.includes('Rent') || name.toLowerCase().includes('monthly'))) {
          // Try multiple patterns for rent amount
          const rentPatterns = [
            /monthly rent[:\s]+(?:THB|฿)\s*([\d,]+)/i,
            /rent[:\s]+(?:THB|฿)\s*([\d,]+)/i,
            /(?:THB|฿)\s*([\d,]+)\s*per month/i,
          ];
          
          for (const pattern of rentPatterns) {
            const match = text.match(pattern);
            if (match) {
              rentAmount = parseInt(match[1].replace(/,/g, ''));
              console.log('[EXTRACT_RENT_FOUND]', { raw: match[0], amount: rentAmount });
              break;
            }
          }
        }
        
        // Find dates - SEARCH FULL TEXT, NOT TRUNCATED
        if (!startDate && (name.includes('Term') || name.includes('Duration') || name.includes('Lease'))) {
          console.log('[EXTRACT_CHECKING_DATES_CLAUSE]', { 
            name, 
            textLength: text.length,
            textPreview: text.substring(0, 300) 
          });
          
          // Search patterns in FULL TEXT
          const fullText = text; // Don't truncate!
          
          // Try to find explicit dates
          const datePatterns = [
            /Commencement Date:\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i,
            /Start Date:\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i,
            /Expiration Date:\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i,
            /End Date:\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i,
          ];
          
          let foundStart = null;
          let foundEnd = null;
          
          // Check start date
          for (const pattern of [datePatterns[0], datePatterns[1]]) {
            const match = fullText.match(pattern);
            if (match) {
              const [_, day, month, year] = match;
              const monthNum = new Date(`${month} 1, 2000`).getMonth() + 1;
              foundStart = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              console.log('[EXTRACT_START_DATE_FOUND]', { raw: match[0], parsed: foundStart });
              break;
            }
          }
          
          // Check end date
          for (const pattern of [datePatterns[2], datePatterns[3]]) {
            const match = fullText.match(pattern);
            if (match) {
              const [_, day, month, year] = match;
              const monthNum = new Date(`${month} 1, 2000`).getMonth() + 1;
              foundEnd = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              console.log('[EXTRACT_END_DATE_FOUND]', { raw: match[0], parsed: foundEnd });
              break;
            }
          }
          
          if (foundStart && foundEnd) {
            startDate = foundStart;
            endDate = foundEnd;
          }
        }
      }
      
      // Log final extraction status
      console.log('[EXTRACT_DATES_FINAL]', { 
        startDate, 
        endDate,
        foundFromClauses: !!(startDate && endDate),
        willCalculate: !(startDate && endDate)
      });
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
      // Calculate dates - use lease end date if available, otherwise 1 year
      const today = new Date().toISOString().split('T')[0];
      let returnDate;
      if (endDate) {
        // Use lease end date + 30 days as expected return
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 30);
        returnDate = endDateObj.toISOString().split('T')[0];
      } else {
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        returnDate = oneYearLater.toISOString().split('T')[0];
      }
      
      if (!actualUserEmail) {
        console.error('[EXTRACT_NO_USER_EMAIL]', { 
          passedUserEmail: userEmail,
          authMeFailed: true
        });
        // FORCE STOP - cannot create without user email
        return Response.json({
          ok: false,
          error: 'USER_NOT_AUTHENTICATED',
          message: 'Cannot determine user email for deposit ownership'
        }, { status: 401 });
      }
      
      const depositData = {
        owner_email: actualUserEmail, // CRITICAL: Bind to actual user
        lease_id: leaseId,
        deposit_amount: depositAmount,
        deposit_paid_date: startDate || today,
        expected_return_date: returnDate,
        property_address: propertyAddress || 'N/A',
        status: 'tracking',
        rent_amount: rentAmount || 0,
        rent_due_day: 1,
        lease_start_date: startDate || null,
        lease_end_date: endDate || null
      };
      
      console.log('[EXTRACT_DEPOSIT_CREATED_BY]', { created_by: actualUserEmail, depositAmount });
      
      console.log('[EXTRACT_DEPOSIT_DATA]', depositData);
      
      try {
        results.deposit = await svc.entities.DepositTracker.create(depositData);
        console.log('[EXTRACT_DEPOSIT_CREATED]', { 
          success: true,
          id: results.deposit?.id,
          deposit_amount: results.deposit?.deposit_amount,
          rent_amount: results.deposit?.rent_amount,
          property_address: results.deposit?.property_address
        });
      } catch (depositError) {
        console.error('[EXTRACT_DEPOSIT_CREATE_FAILED]', {
          error: depositError.message,
          stack: depositError.stack,
          data: depositData
        });
        results.deposit = null;
      }
    }
    
    // ===== CREATE TIMELINE EVENTS =====
    console.log('[EXTRACT_CREATING_TIMELINE_EVENTS]');
    
    try {
      // 1. Lease scanned event
      await svc.entities.TimelineEvent.create({
        owner_email: actualUserEmail,
        lease_id: leaseId,
        event_type: 'lease_scanned',
        event_date: new Date().toISOString(),
        title: 'Lease scanned',
        description: propertyAddress || 'Lease document analyzed',
        property_address: propertyAddress || 'N/A',
        source: 'lease_scan',
        source_scan_id: scanId,
        is_estimated: false,
        needs_review: false
      });
      console.log('[EXTRACT_TIMELINE_SCANNED_CREATED]');
    } catch (err) {
      console.error('[EXTRACT_TIMELINE_SCANNED_FAILED]', { error: err.message });
    }
    
    try {
      // 2. Lease start event
      if (startDate) {
        await svc.entities.TimelineEvent.create({
          owner_email: actualUserEmail,
          lease_id: leaseId,
          event_type: 'lease_start',
          event_date: new Date(startDate).toISOString(),
          title: 'Lease starts',
          description: propertyAddress || 'Lease begins',
          property_address: propertyAddress || 'N/A',
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: false,
          needs_review: false
        });
        console.log('[EXTRACT_TIMELINE_START_CREATED]', { startDate });
      }
    } catch (err) {
      console.error('[EXTRACT_TIMELINE_START_FAILED]', { error: err.message });
    }
    
    try {
      // 3. Lease end event
      if (endDate) {
        await svc.entities.TimelineEvent.create({
          owner_email: actualUserEmail,
          lease_id: leaseId,
          event_type: 'lease_end',
          event_date: new Date(endDate).toISOString(),
          title: 'Lease ends',
          description: propertyAddress || 'Lease expires',
          property_address: propertyAddress || 'N/A',
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: false,
          needs_review: false
        });
        console.log('[EXTRACT_TIMELINE_END_CREATED]', { endDate });
      }
    } catch (err) {
      console.error('[EXTRACT_TIMELINE_END_FAILED]', { error: err.message });
    }
    
    try {
      // 4. Deposit due event
      if (depositAmount && startDate) {
        await svc.entities.TimelineEvent.create({
          owner_email: actualUserEmail,
          lease_id: leaseId,
          event_type: 'deposit_due',
          event_date: new Date(startDate).toISOString(),
          title: 'Deposit due',
          description: `฿${depositAmount.toLocaleString()}`,
          property_address: propertyAddress || 'N/A',
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: false,
          needs_review: false
        });
        console.log('[EXTRACT_TIMELINE_DEPOSIT_DUE_CREATED]', { depositAmount });
      }
    } catch (err) {
      console.error('[EXTRACT_TIMELINE_DEPOSIT_DUE_FAILED]', { error: err.message });
    }
    
    try {
      // 5. Deposit return event
      if (depositAmount && endDate) {
        const returnDate = new Date(endDate);
        returnDate.setDate(returnDate.getDate() + 30);
        
        await svc.entities.TimelineEvent.create({
          owner_email: actualUserEmail,
          lease_id: leaseId,
          event_type: 'deposit_return',
          event_date: returnDate.toISOString(),
          title: 'Deposit return expected',
          description: `฿${depositAmount.toLocaleString()}`,
          property_address: propertyAddress || 'N/A',
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: true,
          needs_review: true
        });
        console.log('[EXTRACT_TIMELINE_DEPOSIT_RETURN_CREATED]');
      }
    } catch (err) {
      console.error('[EXTRACT_TIMELINE_DEPOSIT_RETURN_FAILED]', { error: err.message });
    }
    
    try {
      // 6. First rent payment event
      if (rentAmount && startDate) {
        const firstRentDate = new Date(startDate);
        firstRentDate.setDate(1); // Rent due on 1st
        
        await svc.entities.TimelineEvent.create({
          owner_email: actualUserEmail,
          lease_id: leaseId,
          event_type: 'rent_due',
          event_date: firstRentDate.toISOString(),
          title: 'First rent payment due',
          description: `฿${rentAmount.toLocaleString()} monthly rent`,
          property_address: propertyAddress || 'N/A',
          source: 'lease_scan',
          source_scan_id: scanId,
          is_estimated: false,
          needs_review: false
        });
        console.log('[EXTRACT_TIMELINE_RENT_CREATED]', { rentAmount });
      }
    } catch (err) {
      console.error('[EXTRACT_TIMELINE_RENT_FAILED]', { error: err.message });
    }
    
    // Update lease with all extracted data
    const updateData = {};
    
    if (startDate) {
      updateData.start_date = startDate;
    }
    if (endDate) {
      updateData.end_date = endDate;
    }
    if (propertyAddress) {
      updateData.property_address = propertyAddress;
    }
    if (rentAmount) {
      updateData.rent_amount = rentAmount;
    }
    if (depositAmount) {
      updateData.deposit_amount = depositAmount;
    }
    
    console.log('[EXTRACT_LEASE_UPDATE_DATA]', updateData);
    
    if (Object.keys(updateData).length > 0) {
      results.lease = await svc.entities.Lease.update(leaseId, updateData);
      console.log('[EXTRACT_LEASE_UPDATED]', {
        leaseId,
        updatedFields: Object.keys(updateData),
        property_address: results.lease?.property_address,
        rent_amount: results.lease?.rent_amount,
        deposit_amount: results.lease?.deposit_amount
      });
      results.leaseUpdated = true;
    }
    
    // Create notification (optional - wrapped in try/catch to not break flow)
    if (endDate && actualUserEmail) {
      try {
        const notifDate = new Date(endDate);
        notifDate.setDate(notifDate.getDate() - 30); // 30 days before
        
        results.notification = await svc.entities.NotificationLog.create({
          user_email: actualUserEmail,  // REQUIRED field
          notification_type: '30d_notice',  // Must be valid enum value
          channel: 'Email',  // REQUIRED field
          status: 'sent',
          related_entity_type: 'lease',
          related_entity_id: leaseId,
          message_preview: `Your lease ends on ${endDate}`
        });
        console.log('[EXTRACT_NOTIFICATION_CREATED]');
      } catch (notifError) {
        console.error('[EXTRACT_NOTIFICATION_FAILED]', { error: notifError.message });
        // Don't fail the whole function for notification failure
      }
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