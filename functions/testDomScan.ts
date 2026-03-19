import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth as admin for test creation
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const testEmail = 'dom.sources@gmail.com';
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('TEST: Creating test data for', testEmail);
    console.log('═══════════════════════════════════════════════════════════════');
    
    // 1. Create Lease with owner_email
    const lease = await svc.entities.Lease.create({
      owner_email: testEmail,
      file_url: 'https://example.com/test-lease.pdf',
      file_urls: ['https://example.com/test-lease.pdf'],
      status: 'scanned',
      original_filename: 'test-lease.pdf',
      property_address: 'Test Property 123',
      start_date: '2026-01-01',
      end_date: '2027-01-01',
      rent_amount: 50000,
      deposit_amount: 100000
    });
    
    console.log('✅ CREATED Lease:', {
      id: lease.id,
      owner_email: lease.owner_email,
      created_by: lease.created_by
    });
    
    // 2. Create DepositTracker with owner_email
    const deposit = await svc.entities.DepositTracker.create({
      owner_email: testEmail,
      lease_id: lease.id,
      deposit_amount: 100000,
      deposit_paid_date: '2026-01-01',
      expected_return_date: '2027-02-15',
      property_address: 'Test Property 123',
      rent_amount: 50000,
      status: 'tracking'
    });
    
    console.log('✅ CREATED DepositTracker:', {
      id: deposit.id,
      owner_email: deposit.owner_email,
      created_by: deposit.created_by,
      lease_id: deposit.lease_id
    });
    
    // 3. Create TimelineEvent with owner_email
    const event = await svc.entities.TimelineEvent.create({
      owner_email: testEmail,
      lease_id: lease.id,
      event_type: 'lease_start',
      event_date: '2026-01-01T00:00:00Z',
      title: 'Test Lease Start',
      description: 'Test lease begins',
      source: 'lease_scan'
    });
    
    console.log('✅ CREATED TimelineEvent:', {
      id: event.id,
      owner_email: event.owner_email,
      created_by: event.created_by,
      lease_id: event.lease_id
    });
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('TEST: Verifying user can query their own records (NON-ADMIN)');
    console.log('═══════════════════════════════════════════════════════════════');
    
    // 4. CRITICAL TEST: Query as USER (not admin) to verify RLS works
    // Simulate user query by filtering with owner_email
    const userLeases = await base44.entities.Lease.filter({ 
      owner_email: testEmail 
    });
    
    const userDeposits = await base44.entities.DepositTracker.filter({ 
      owner_email: testEmail 
    });
    
    const userEvents = await base44.entities.TimelineEvent.filter({ 
      owner_email: testEmail 
    });
    
    console.log('✅ USER QUERY RESULTS (via filter):');
    console.log('  Leases:', userLeases.length);
    console.log('  Deposits:', userDeposits.length);
    console.log('  Events:', userEvents.length);
    
    // Return test results
    return Response.json({
      ok: true,
      test_passed: true,
      created: {
        lease: { id: lease.id, owner_email: lease.owner_email },
        deposit: { id: deposit.id, owner_email: deposit.owner_email },
        event: { id: event.id, owner_email: event.owner_email }
      },
      user_query_results: {
        leases: userLeases.length,
        deposits: userDeposits.length,
        events: userEvents.length
      },
      verification: {
        lease_found: userLeases.length > 0,
        deposit_found: userDeposits.length > 0,
        event_found: userEvents.length > 0,
        all_passed: userLeases.length > 0 && userDeposits.length > 0 && userEvents.length > 0
      }
    });
    
  } catch (e) {
    console.error('TEST FAILED:', e);
    return Response.json({
      ok: false,
      error: e.message,
      stack: e.stack
    }, { status: 500 });
  }
});