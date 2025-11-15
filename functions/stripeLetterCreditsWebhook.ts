// ⚠️ DEPRECATED ENDPOINT - DO NOT USE
// All Stripe webhook events are now processed in functions/stripeWebhook.js
// This file is kept only to prevent 500 errors on old webhook URLs
// It performs NO database operations and awards NO credits

Deno.serve(async (req) => {
  console.log('⚠️⚠️⚠️ DEPRECATED ENDPOINT CALLED ⚠️⚠️⚠️');
  console.log('[Stripe] stripeLetterCreditsWebhook is deprecated and inactive.');
  console.log('[Stripe] All events are now handled by stripeWebhook.js');
  console.log('[Stripe] This endpoint returns 200 OK without processing anything.');
  console.log('[Stripe] Please update your Stripe webhook configuration to use the main webhook.');
  
  return Response.json({ 
    ok: true, 
    deprecated: true,
    message: 'This endpoint is deprecated. Use functions/stripeWebhook.js instead.'
  }, { status: 200 });
});