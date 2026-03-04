import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get("SK_TEST_secret_key"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, email, updates } = await req.json();

    if (action === 'check_subscription') {
      // Look up user and their Stripe subscription
      const allUsers = await base44.asServiceRole.entities.User.list();
      const targetUser = allUsers.find(u => u.email === email);
      if (!targetUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const subId = targetUser.stripe_subscription_id;
      if (!subId) {
        return Response.json({ error: 'No subscription ID on user', user_plan: targetUser.plan_tier });
      }

      try {
        const sub = await stripe.subscriptions.retrieve(subId);
        return Response.json({
          subscription_id: sub.id,
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          user_plan_tier: targetUser.plan_tier,
          user_subscription_status: targetUser.subscription_status,
          user_available_scans: targetUser.available_scans,
          user_letter_credits: targetUser.letter_credits
        });
      } catch (stripeErr) {
        return Response.json({ 
          error: 'Stripe error: ' + stripeErr.message,
          subscription_id: subId,
          user_plan_tier: targetUser.plan_tier 
        });
      }
    }

    if (action === 'restore_user') {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const targetUser = allUsers.find(u => u.email === email);
      if (!targetUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      await base44.asServiceRole.entities.User.update(targetUser.id, updates);
      const updated = await base44.asServiceRole.entities.User.get(targetUser.id);
      return Response.json({
        ok: true,
        email: updated.email,
        plan_tier: updated.plan_tier,
        subscription_status: updated.subscription_status,
        available_scans: updated.available_scans,
        letter_credits: updated.letter_credits
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});