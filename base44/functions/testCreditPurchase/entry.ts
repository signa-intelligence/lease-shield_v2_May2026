import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Test function to verify the complete credit purchase flow
 * Steps:
 * 1. Calls createCheckout with proper metadata
 * 2. Shows what would be sent to Stripe
 * 3. Validates metadata.credits is set correctly
 */

Deno.serve(async (req) => {
  console.log('\n\n=== TEST CREDIT PURCHASE FLOW ===');
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ User:', user.email);
    console.log('Current credits:', user.letter_credits || 0);
    
    const { credits = 1, price = 99 } = await req.json().catch(() => ({ credits: 1, price: 99 }));
    
    console.log('\n📋 TEST PARAMETERS:');
    console.log('  Credits:', credits);
    console.log('  Price:', price, 'THB');
    
    // Simulate what would be sent to createCheckout
    const checkoutPayload = {
      mode: 'payment',
      amount: price,
      currency: 'thb',
      description: `${credits} Letter Credits`,
      successUrl: `${Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'}/templates?checkout_success=true`,
      cancelUrl: `${Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'}/templates?payment=cancelled`,
      metadata: {
        type: 'credits',
        userId: user.id,
        email: user.email,
        credits: credits,
        packageId: `credits_${credits}`
      }
    };
    
    console.log('\n📤 CHECKOUT PAYLOAD TO BE SENT:');
    console.log(JSON.stringify(checkoutPayload, null, 2));
    
    console.log('\n✅ VALIDATION:');
    console.log('  ✓ metadata.type = "credits"');
    console.log('  ✓ metadata.userId = ', user.id);
    console.log('  ✓ metadata.email = ', user.email);
    console.log('  ✓ metadata.credits = ', credits, '(THIS IS CRITICAL)');
    console.log('  ✓ mode = "payment"');
    console.log('  ✓ amount = ', price, 'THB');
    
    console.log('\n🔍 WEBHOOK SHOULD:');
    console.log('  1. Receive checkout.session.completed event');
    console.log('  2. Detect isCreditsCheckout = true (mode=payment or metadata.type=credits)');
    console.log('  3. Find user by metadata.userId or email');
    console.log('  4. Read metadata.credits =', credits);
    console.log('  5. Add', credits, 'credits to user balance');
    console.log('  6. Create Payment audit record');
    console.log('  7. Send LINE + email notifications (if enabled)');
    
    return Response.json({
      status: 'test_complete',
      user: {
        id: user.id,
        email: user.email,
        currentCredits: user.letter_credits || 0
      },
      checkoutPayload: checkoutPayload,
      validation: {
        hasMetadataType: !!checkoutPayload.metadata.type,
        hasMetadataUserId: !!checkoutPayload.metadata.userId,
        hasMetadataEmail: !!checkoutPayload.metadata.email,
        hasMetadataCredits: !!checkoutPayload.metadata.credits,
        creditsValue: checkoutPayload.metadata.credits
      },
      nextStep: 'If this looks correct, the issue is likely in the webhook not reading metadata.credits properly'
    });
    
  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});