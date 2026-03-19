import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  console.log('\n\n=== DIAGNOSE LIVE PAYMENTS - STARTING ===');
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const currentUser = await base44.auth.me();
    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role?.toLowerCase()) && !['admin', 'super_admin'].includes(currentUser.access_level?.toLowerCase())) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    console.log('✅ Admin:', currentUser.email);
    
    const key = Deno.env.get('SK_TEST_secret_key');
    const isLiveMode = key?.startsWith('sk_live_');
    
    console.log('🔐 Stripe Mode:', isLiveMode ? 'LIVE' : 'TEST');
    
    // Get today's start timestamp
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartUnix = Math.floor(todayStart.getTime() / 1000);
    
    console.log('📅 Searching from:', new Date(todayStartUnix * 1000).toISOString());
    
    // Get all checkout sessions from today
    const sessions = await stripe.checkout.sessions.list({
      created: { gte: todayStartUnix },
      limit: 100,
      expand: ['data.line_items.data.price', 'data.customer']
    });
    
    console.log(`\n📊 Found ${sessions.data.length} total checkout sessions today`);
    
    // Filter for ฿99 THB payments
    const creditPayments = sessions.data.filter(s => 
      s.payment_status === 'paid' && 
      s.amount_total === 9900 && 
      s.currency === 'thb' &&
      s.mode === 'payment'
    );
    
    console.log(`\n💰 Found ${creditPayments.length} ฿99 THB credit payments`);
    
    const report = {
      mode: isLiveMode ? 'LIVE' : 'TEST',
      totalSessions: sessions.data.length,
      creditPayments: creditPayments.length,
      payments: []
    };
    
    // Get all users and payments from DB
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allPayments = await base44.asServiceRole.entities.Payment.list();
    
    for (const session of creditPayments) {
      const metadata = session.metadata || {};
      const customerEmail = session.customer_details?.email || metadata.email;
      
      console.log(`\n🔍 DIAGNOSING SESSION: ${session.id}`);
      console.log('   Created:', new Date(session.created * 1000).toISOString());
      console.log('   Amount:', (session.amount_total / 100).toFixed(2), session.currency.toUpperCase());
      console.log('   Customer Email:', customerEmail);
      console.log('   Metadata:', JSON.stringify(metadata, null, 2));
      
      // Find user
      const user = allUsers.find(u => u.email === customerEmail);
      
      // Check if payment was recorded in DB
      const paymentRecorded = allPayments.find(p => p.external_id === session.id);
      
      const diagnosis = {
        sessionId: session.id,
        created: new Date(session.created * 1000).toISOString(),
        amount: (session.amount_total / 100).toFixed(2),
        currency: session.currency.toUpperCase(),
        customerEmail: customerEmail,
        metadata: metadata,
        userFound: !!user,
        userEmail: user?.email || null,
        currentCredits: user?.letter_credits || null,
        paymentRecorded: !!paymentRecorded,
        paymentId: paymentRecorded?.id || null,
        lineItems: []
      };
      
      // Get line items
      try {
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items.data.price.product']
        });
        
        const items = fullSession.line_items?.data || [];
        for (const item of items) {
          diagnosis.lineItems.push({
            priceId: item.price?.id,
            productName: item.price?.product?.name || item.description,
            quantity: item.quantity,
            amount: item.amount_total / 100
          });
        }
      } catch (err) {
        console.error('   ⚠️ Failed to get line items:', err.message);
      }
      
      console.log('   Diagnosis:', {
        userFound: diagnosis.userFound,
        paymentRecorded: diagnosis.paymentRecorded,
        metadataCredits: metadata.credits,
        lineItems: diagnosis.lineItems.length
      });
      
      report.payments.push(diagnosis);
    }
    
    console.log('\n\n=== DIAGNOSIS COMPLETE ===');
    console.log('Total ฿99 payments:', creditPayments.length);
    console.log('Users found:', report.payments.filter(p => p.userFound).length);
    console.log('Payments recorded:', report.payments.filter(p => p.paymentRecorded).length);
    console.log('Missing in DB:', report.payments.filter(p => !p.paymentRecorded).length);
    
    return Response.json(report, { status: 200 });
    
  } catch (error) {
    console.error('❌ DIAGNOSIS ERROR:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});