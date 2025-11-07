import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, mode, amount, currency, description, successUrl, cancelUrl, metadata, promoCode } = await req.json();

    console.log('Creating checkout with:', { priceId, mode, amount, currency, promoCode, user: user.email });

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      console.log('Creating new Stripe customer for:', user.email);
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id
        }
      });
      customerId = customer.id;
      console.log('Created customer:', customerId);
      
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    // Get origin from request for fallback URLs
    const origin = new URL(req.url).origin.replace('/api/functions/createCheckout', '');
    const defaultSuccessUrl = `${origin}/account?success=true`;
    const defaultCancelUrl = `${origin}/account?canceled=true`;

    // Build session config based on mode
    const sessionConfig = {
      customer: customerId,
      mode: mode || 'subscription',
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: metadata || {},
      allow_promotion_codes: !promoCode, // Enable promo code field if no code provided
    };

    // If a promo code is provided, look it up and apply it
    if (promoCode) {
      try {
        console.log('Looking up promo code:', promoCode);
        const promoCodes = await stripe.promotionCodes.list({
          code: promoCode,
          active: true,
          limit: 1
        });

        if (promoCodes.data.length > 0) {
          console.log('Valid promo code found:', promoCodes.data[0].id);
          sessionConfig.discounts = [{
            promotion_code: promoCodes.data[0].id
          }];
        } else {
          console.log('Invalid or expired promo code:', promoCode);
          return Response.json({ 
            error: 'Invalid or expired promo code',
            code: 'invalid_promo_code'
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Error validating promo code:', error);
        return Response.json({ 
          error: 'Failed to validate promo code',
          code: 'promo_validation_error'
        }, { status: 400 });
      }
    }

    // Handle subscription vs one-time payment
    if (mode === 'payment' && amount) {
      console.log('Creating one-time payment session for amount:', amount);
      // One-time payment (for cases)
      sessionConfig.line_items = [
        {
          price_data: {
            currency: currency || 'thb',
            unit_amount: Math.round(amount * 100), // Convert to smallest currency unit
            product_data: {
              name: description || 'Lease Shield Resolve Service',
              description: description || 'Professional dispute resolution service',
            },
          },
          quantity: 1,
        },
      ];
    } else if (priceId) {
      console.log('Creating subscription session for price:', priceId);
      // Subscription payment
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    } else {
      console.error('Missing priceId or amount');
      return Response.json({ error: 'Missing priceId or amount' }, { status: 400 });
    }

    console.log('Session config:', JSON.stringify(sessionConfig, null, 2));

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Checkout session created:', session.id, 'URL:', session.url);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout creation error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param
    });
    return Response.json({ 
      error: error.message,
      details: error.raw?.message || error.message,
      type: error.type || 'unknown',
      code: error.code || 'unknown'
    }, { status: 500 });
  }
});