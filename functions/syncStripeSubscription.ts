import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2024-12-18.acacia'
});

// HARDCODED ANNUAL SECURE PRICE ID - SOURCE OF TRUTH
const STRIPE_PRICE_SECURE_ANNUAL = 'price_1SbtaWQwol6NhlUxAfPLTDeE';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();
    const targetUserId = userId || user.id;

    console.log('🔄 [SYNC_STRIPE] Starting sync for user:', targetUserId);

    // Fetch target user
    const targetUser = await base44.asServiceRole.entities.User.filter({ id: targetUserId });
    if (!targetUser || targetUser.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = targetUser[0];

    if (!userData.stripe_subscription_id) {
      console.log('⚠️ [SYNC_STRIPE] No Stripe subscription ID found');
      return Response.json({
        success: true,
        message: 'No active subscription',
        subscription: null
      });
    }

    // Fetch subscription from Stripe (SOURCE OF TRUTH)
    const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id);

    console.log('📊 [SYNC_STRIPE] Stripe subscription data:', {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      price_id: subscription.items.data[0]?.price?.id
    });

    // Update user with Stripe data
    await base44.asServiceRole.entities.User.update(targetUserId, {
      stripe_status: subscription.status,
      stripe_price_id: subscription.items.data[0]?.price?.id || null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      last_stripe_sync_at: new Date().toISOString()
    });

    console.log('✅ [SYNC_STRIPE] User updated with Stripe data');

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        price_id: subscription.items.data[0]?.price?.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    });

  } catch (error) {
    console.error('❌ [SYNC_STRIPE] Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});