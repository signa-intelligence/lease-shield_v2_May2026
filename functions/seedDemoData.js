import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    console.log('=== START: Seed Demo Data ===');
    
    // Step 1: Initialize base44
    console.log('Step 1: Initializing base44...');
    const base44 = createClientFromRequest(req);
    
    // Step 2: Get current user
    console.log('Step 2: Getting current user...');
    const currentUser = await base44.auth.me();
    console.log('Current user:', currentUser?.email, 'Role:', currentUser?.role);
    
    // Step 3: Check admin
    if (currentUser?.role !== 'admin') {
      console.log('ERROR: User is not admin');
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }
    
    console.log('Step 3: User is admin, proceeding...');
    
    // Step 4: Create first demo user
    console.log('Step 4: Creating first demo user...');
    const userEn = await base44.asServiceRole.entities.User.create({
      full_name: "Demo Tenant EN",
      email: `demo.en.${Date.now()}@leaseshield.asia`,
      country: "Thailand",
      language: "en",
      subscription_status: "active",
      plan_tier: "protect"
    });
    console.log('SUCCESS: Created EN user:', userEn.id);
    
    // Step 5: Create deposit for first user
    console.log('Step 5: Creating deposit for EN user...');
    const depositEn = await base44.asServiceRole.entities.DepositTracker.create({
      created_by: userEn.email,
      deposit_amount: 45000,
      deposit_paid_date: "2025-08-01",
      expected_return_date: "2026-08-01",
      status: "tracking",
      property_address: "Unit 123, Sample Condo, Sukhumvit",
      notes: "Seed: Demo deposit"
    });
    console.log('SUCCESS: Created deposit:', depositEn.id);
    
    // Step 6: Create simple lease
    console.log('Step 6: Creating lease...');
    const leaseEn = await base44.asServiceRole.entities.Lease.create({
      created_by: userEn.email,
      file_url: "inline://seed-demo-en",
      status: "uploaded",
      language_detected: "en",
      property_address: "Unit 123, Sample Condo, Sukhumvit",
      rent_amount: 15000,
      deposit_amount: 45000,
      start_date: "2025-08-01",
      end_date: "2026-08-01"
    });
    console.log('SUCCESS: Created lease:', leaseEn.id);
    
    console.log('=== SUCCESS: Basic seed complete ===');
    
    return Response.json({ 
      success: true, 
      message: "Basic demo data created successfully",
      results: {
        users_created: 1,
        deposits_created: 1,
        leases_created: 1,
        scans_created: 0,
        cases_created: 0
      },
      demo_user: {
        email: userEn.email,
        id: userEn.id
      }
    });

  } catch (error) {
    console.error('=== ERROR: Seed Demo Data Failed ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error object:', JSON.stringify(error, null, 2));
    
    return Response.json({ 
      error: error.message || 'Unknown error',
      errorName: error.name,
      details: error.stack,
      step: 'Check function logs in dashboard for full details'
    }, { status: 500 });
  }
});