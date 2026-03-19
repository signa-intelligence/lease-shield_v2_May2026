import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.10.0';

/**
 * SYNC STRIPE USERS - Audit and fix users whose Stripe subscription
 * doesn't match their database tier.
 * 
 * Admin-only. Checks all users with stripe_customer_id against Stripe API.
 * 
 * Params:
 *   dryRun: boolean (default true) - if true, only reports mismatches without fixing
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { dryRun = true } = await req.json().catch(() => ({}));

    const stripeKey = Deno.env.get('SK_TEST_secret_key');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe key not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersWithStripe = allUsers.filter(u => u.stripe_customer_id);

    console.log(`[SYNC] Checking ${usersWithStripe.length} users with Stripe data (of ${allUsers.length} total)`);

    const results = {
      totalUsers: allUsers.length,
      usersWithStripe: usersWithStripe.length,
      checked: 0,
      mismatches: [],
      fixed: [],
      errors: [],
      alreadyCorrect: 0,
      noActiveSubscription: 0
    };

    // Tier credit mapping
    function getCreditsForTier(tier) {
      switch (tier) {
        case 'lite': return { scans: 6, letters: 3 };
        case 'protect': return { scans: 12, letters: 10 };
        case 'secure': return { scans: 999, letters: 50 };
        default: return { scans: 1, letters: 0 };
      }
    }

    for (const u of usersWithStripe) {
      results.checked++;
      try {
        const subs = await stripe.subscriptions.list({
          customer: u.stripe_customer_id,
          status: 'active',
          limit: 1
        });

        if (subs.data.length === 0) {
          results.noActiveSubscription++;
          // If user thinks they have a subscription but Stripe says no
          if (u.subscription_status === 'active' && u.plan_tier && u.plan_tier !== 'explorer') {
            results.mismatches.push({
              email: u.email,
              userId: u.id,
              currentTier: u.plan_tier,
              shouldBeTier: 'explorer',
              reason: 'No active Stripe subscription but DB shows active',
              stripeCustomerId: u.stripe_customer_id
            });
          }
          continue;
        }

        const sub = subs.data[0];
        const priceAmount = sub.items.data[0]?.price?.unit_amount || 0;
        const priceInterval = sub.items.data[0]?.price?.recurring?.interval || 'month';
        const subMetadata = sub.metadata || {};

        // Determine expected tier from subscription metadata or price amount
        let expectedTier = subMetadata.plan || 'explorer';
        
        // Fallback: determine from price amount if metadata missing
        if (!subMetadata.plan || expectedTier === 'explorer') {
          // Monthly prices in satang (THB * 100)
          if (priceInterval === 'month') {
            if (priceAmount <= 20000) expectedTier = 'lite';       // ≤200 THB
            else if (priceAmount <= 45000) expectedTier = 'protect'; // ≤450 THB
            else expectedTier = 'secure';                            // >450 THB
          } else if (priceInterval === 'year') {
            if (priceAmount <= 200000) expectedTier = 'lite';
            else if (priceAmount <= 400000) expectedTier = 'protect';
            else expectedTier = 'secure';
          }
        }

        if (u.plan_tier !== expectedTier) {
          const mismatch = {
            email: u.email,
            userId: u.id,
            currentTier: u.plan_tier || 'explorer',
            shouldBeTier: expectedTier,
            subscriptionId: sub.id,
            priceAmount: priceAmount / 100,
            priceInterval,
            stripeCustomerId: u.stripe_customer_id
          };
          results.mismatches.push(mismatch);

          if (!dryRun) {
            const credits = getCreditsForTier(expectedTier);
            await base44.asServiceRole.entities.User.update(u.id, {
              plan_tier: expectedTier,
              subscription_status: 'active',
              stripe_subscription_id: sub.id,
              available_scans: credits.scans,
              letter_credits: Math.max(u.letter_credits || 0, credits.letters),
              member_since: u.member_since || new Date().toISOString()
            });
            results.fixed.push({
              email: u.email,
              from: mismatch.currentTier,
              to: expectedTier,
              scans: credits.scans,
              letters: credits.letters
            });
            console.log(`[SYNC] ✅ FIXED: ${u.email} ${mismatch.currentTier} → ${expectedTier}`);
          }
        } else {
          results.alreadyCorrect++;
        }
      } catch (err) {
        results.errors.push({ email: u.email, error: err.message });
        console.error(`[SYNC] Error checking ${u.email}:`, err.message);
      }
    }

    console.log(`[SYNC] Complete: ${results.mismatches.length} mismatches, ${results.fixed.length} fixed, ${results.errors.length} errors`);

    return Response.json({
      dryRun,
      ...results,
      summary: dryRun 
        ? `Found ${results.mismatches.length} mismatches. Run with dryRun=false to fix.`
        : `Fixed ${results.fixed.length} of ${results.mismatches.length} mismatches.`
    });
  } catch (error) {
    console.error('[SYNC_ERROR]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});