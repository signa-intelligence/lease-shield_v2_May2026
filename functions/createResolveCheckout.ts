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

    const { userId, userEmail, caseId, priceType, amount } = await req.json();

    console.log('[CREATE_CHECKOUT] Request payload:', { userId, userEmail, caseId, priceType, amount });

    // Validate required fields
    if (!userId || !userEmail || !caseId || !priceType || !amount) {
      console.error('[CREATE_CHECKOUT] Missing required fields');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('[CREATE_CHECKOUT] Creating Stripe session for case:', caseId);

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
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'resolve_case',
        userId: userId,
        userEmail: userEmail,
        priceType: priceType,
        amount: amount.toString(),
        caseId: caseId
      },
      success_url: `${Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'}/Cases?resolve_success=true&caseId=${caseId}`,
      cancel_url: `${Deno.env.get('APP_URL') || 'https://app.leaseshield.asia'}/Cases?resolve_cancelled=true&caseId=${caseId}`,
    });

    console.log('[CREATE_CHECKOUT] ✅ Stripe session created:', session.id);
    console.log('[CREATE_CHECKOUT] Success URL:', session.success_url);
    console.log('[CREATE_CHECKOUT] Metadata:', session.metadata);

    return Response.json({ 
      url: session.url,
      sessionId: session.id,
      caseId: caseId
    });

  } catch (error) {
    console.error('❌ Error creating Resolve checkout:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});