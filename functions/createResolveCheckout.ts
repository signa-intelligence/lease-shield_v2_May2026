import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user authentication
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, userEmail, priceType, amount } = await req.json();

    // Validate required fields
    if (!userId || !userEmail || !priceType || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a provisional case record
    const provisionalCase = await base44.entities.Case.create({
      user_email: userEmail,
      status: 'awaiting_payment',
      dispute_amount: 0,
      type: 'deposit'
    });

    console.log('✅ Provisional case created:', provisionalCase.id);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `Resolve Case Service - ${priceType === 'member' ? 'Member Rate' : 'Public Rate'}`,
              description: 'Professional case handling and legal support',
            },
            unit_amount: amount * 100, // Convert to smallest currency unit
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'resolve_case',
        userId: userId,
        userEmail: userEmail,
        priceType: priceType,
        amount: amount,
        caseId: provisionalCase.id
      },
      success_url: `${Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'}/ResolveCase?session_id={CHECKOUT_SESSION_ID}&caseId=${provisionalCase.id}`,
      cancel_url: `${Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'}/Cases`,
    });

    console.log('✅ Stripe checkout session created:', session.id);

    return Response.json({ 
      url: session.url,
      sessionId: session.id,
      caseId: provisionalCase.id
    });

  } catch (error) {
    console.error('❌ Error creating Resolve checkout:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});