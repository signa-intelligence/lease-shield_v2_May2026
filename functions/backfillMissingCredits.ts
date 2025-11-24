import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  console.log('\n\n=== BACKFILL MISSING CREDITS - STARTING ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const currentUser = await base44.auth.me();
    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role?.toLowerCase()) && !['admin', 'super_admin'].includes(currentUser.access_level?.toLowerCase())) {
      console.error('❌ Unauthorized - requires admin/super_admin access');
      return Response.json({ error: 'Unauthorized - admin access required' }, { status: 403 });
    }
    
    console.log('✅ Admin authenticated:', currentUser.email);
    
    // Get request parameters
    const { dryRun = true, sessionIds = [] } = await req.json().catch(() => ({ dryRun: true, sessionIds: [] }));
    
    console.log('📋 Parameters:', { dryRun, sessionIds: sessionIds.length > 0 ? sessionIds : 'auto-detect' });
    
    const results = {
      mode: dryRun ? 'DRY RUN' : 'LIVE',
      processed: [],
      errors: [],
      summary: {
        paymentsFound: 0,
        creditsToBackfill: 0,
        usersAffected: 0
      }
    };
    
    // Step 1: Find recent ฿99 THB payments from today
    let paymentsToProcess = [];
    
    if (sessionIds.length > 0) {
      console.log('\n🔍 MANUAL MODE: Processing specific session IDs');
      for (const sessionId of sessionIds) {
        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items.data.price', 'customer']
          });
          paymentsToProcess.push(session);
          console.log(`✅ Retrieved session: ${sessionId}`);
        } catch (err) {
          console.error(`❌ Failed to retrieve session ${sessionId}:`, err.message);
          results.errors.push({ sessionId, error: err.message });
        }
      }
    } else {
      console.log('\n🔍 AUTO-DETECT MODE: Finding today\'s ฿99 THB payments');
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartUnix = Math.floor(todayStart.getTime() / 1000);
      
      console.log('Searching from:', new Date(todayStartUnix * 1000).toISOString());
      
      // Get all successful checkout sessions from today
      const sessions = await stripe.checkout.sessions.list({
        created: { gte: todayStartUnix },
        limit: 100,
        expand: ['data.line_items.data.price', 'data.customer']
      });
      
      console.log(`Found ${sessions.data.length} total sessions today`);
      
      // Filter for ฿99 THB credit purchases
      for (const session of sessions.data) {
        if (session.payment_status === 'paid' && 
            session.amount_total === 9900 && 
            session.currency === 'thb' &&
            session.mode === 'payment') {
          
          const metadata = session.metadata || {};
          const isCredits = metadata.type === 'credits' || session.line_items?.data?.some(item => 
            item.description?.toLowerCase().includes('credit') || 
            item.price?.product?.name?.toLowerCase().includes('credit')
          );
          
          if (isCredits) {
            paymentsToProcess.push(session);
            console.log(`✅ Found ฿99 credit payment: ${session.id} - Customer: ${session.customer_details?.email || session.customer}`);
          }
        }
      }
    }
    
    results.summary.paymentsFound = paymentsToProcess.length;
    console.log(`\n📊 Total ฿99 credit payments to process: ${paymentsToProcess.length}`);
    
    if (paymentsToProcess.length === 0) {
      console.log('ℹ️ No payments found to process');
      return Response.json(results, { status: 200 });
    }
    
    // Step 2: For each payment, check if credits were already added
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allPayments = await base44.asServiceRole.entities.Payment.list();
    
    const affectedUsers = new Set();
    
    for (const session of paymentsToProcess) {
      console.log(`\n🔍 Processing session: ${session.id}`);
      console.log('  Amount:', (session.amount_total / 100).toFixed(2), session.currency.toUpperCase());
      console.log('  Customer Email:', session.customer_details?.email);
      console.log('  Metadata:', JSON.stringify(session.metadata, null, 2));
      
      const metadata = session.metadata || {};
      const customerEmail = session.customer_details?.email || metadata.email;
      const creditsInMetadata = parseInt(metadata.credits) || 1;
      
      if (!customerEmail) {
        console.error('  ❌ No customer email found');
        results.errors.push({ sessionId: session.id, error: 'No customer email' });
        continue;
      }
      
      // Find user
      const user = allUsers.find(u => u.email === customerEmail);
      if (!user) {
        console.error(`  ❌ User not found: ${customerEmail}`);
        results.errors.push({ sessionId: session.id, error: 'User not found', email: customerEmail });
        continue;
      }
      
      console.log(`  ✅ User found: ${user.email} (ID: ${user.id})`);
      console.log(`  Current credits: ${user.letter_credits || 0}`);
      
      // Check if payment already recorded
      const existingPayment = allPayments.find(p => p.external_id === session.id);
      if (existingPayment) {
        console.log(`  ⚠️ Payment already recorded in DB - skipping`);
        results.processed.push({
          sessionId: session.id,
          email: customerEmail,
          action: 'skipped_duplicate',
          reason: 'Payment already in database'
        });
        continue;
      }
      
      console.log(`  ⚠️ Payment NOT in database - credits likely missing`);
      
      const currentCredits = user.letter_credits || 0;
      const newCredits = currentCredits + creditsInMetadata;
      
      affectedUsers.add(user.email);
      
      if (dryRun) {
        console.log(`  🔸 DRY RUN: Would add ${creditsInMetadata} credits (${currentCredits} → ${newCredits})`);
        results.processed.push({
          sessionId: session.id,
          userId: user.id,
          email: customerEmail,
          action: 'dry_run',
          creditsToAdd: creditsInMetadata,
          oldBalance: currentCredits,
          newBalance: newCredits
        });
      } else {
        console.log(`  ✅ LIVE: Adding ${creditsInMetadata} credits (${currentCredits} → ${newCredits})`);
        
        try {
          // Update user credits
          await base44.asServiceRole.entities.User.update(user.id, {
            letter_credits: newCredits,
            total_credits_purchased: (user.total_credits_purchased || 0) + creditsInMetadata
          });
          
          // Create payment record
          await base44.asServiceRole.entities.Payment.create({
            type: 'addon',
            amount: parseFloat((session.amount_total / 100).toFixed(2)),
            currency: 'THB',
            provider: 'stripe',
            status: 'paid',
            external_id: session.id,
            created_by: customerEmail
          });
          
          console.log(`  ✅ Credits backfilled successfully`);
          
          results.processed.push({
            sessionId: session.id,
            userId: user.id,
            email: customerEmail,
            action: 'backfilled',
            creditsAdded: creditsInMetadata,
            oldBalance: currentCredits,
            newBalance: newCredits
          });
        } catch (err) {
          console.error(`  ❌ Failed to backfill:`, err.message);
          results.errors.push({
            sessionId: session.id,
            email: customerEmail,
            error: err.message
          });
        }
      }
    }
    
    results.summary.creditsToBackfill = results.processed.reduce((sum, p) => sum + (p.creditsToAdd || p.creditsAdded || 0), 0);
    results.summary.usersAffected = affectedUsers.size;
    
    console.log('\n\n=== BACKFILL COMPLETE ===');
    console.log('Mode:', results.mode);
    console.log('Payments found:', results.summary.paymentsFound);
    console.log('Credits to backfill:', results.summary.creditsToBackfill);
    console.log('Users affected:', results.summary.usersAffected);
    console.log('Processed:', results.processed.length);
    console.log('Errors:', results.errors.length);
    
    return Response.json(results, { status: 200 });
    
  } catch (error) {
    console.error('\n❌ BACKFILL ERROR:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});