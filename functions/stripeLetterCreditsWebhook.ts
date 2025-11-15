// ⚠️ DEPRECATED WEBHOOK - NO LONGER ACTIVE
// 
// This endpoint has been superseded by functions/stripeWebhook.js.
// All Stripe event processing (credits, subscriptions, renewals) now happens
// in the unified webhook to prevent double-processing and maintain consistency.
//
// This file remains present to avoid 500 errors on any legacy configured
// Stripe webhook endpoints, but it performs NO database updates and sends
// NO emails or notifications.
//
// To remove this safely:
// 1. Go to Stripe Dashboard → Webhooks
// 2. Remove any webhook pointing to this endpoint
// 3. Confirm only stripeWebhook.js endpoint is active
// 4. Then delete this file

Deno.serve(async (req) => {
  console.log('⚠️ DEPRECATED: stripeLetterCreditsWebhook called');
  console.log('⚠️ This endpoint is a no-op. Unified handler is stripeWebhook.js');
  console.log('⚠️ Please update Stripe webhook configuration to use stripeWebhook.js only');
  
  return Response.json({ 
    ok: true, 
    deprecated: true,
    message: 'This webhook is deprecated. Use stripeWebhook.js for all Stripe events.'
  }, { status: 200 });
});