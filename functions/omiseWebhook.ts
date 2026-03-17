import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function verifyOmiseSignature(rawBodyBytes, signatureHeader) {
    const webhookSecret = Deno.env.get("OMISE_WEBHOOK_SECRET");
    if (!webhookSecret) {
        console.warn("OMISE_WEBHOOK_SECRET not set, skipping signature verification");
        return true;
    }
    if (!signatureHeader) {
        console.error("Missing Omise-Signature header");
        return false;
    }

    // Debug: log body preview
    const bodyPreview = new TextDecoder().decode(rawBodyBytes).substring(0, 200);
    console.log('[OMISE_SIG_DEBUG] Body preview (first 200 chars):', bodyPreview);

    // Method 1: base64-decoded secret
    const secretBytes = Uint8Array.from(atob(webhookSecret), c => c.charCodeAt(0));
    console.log('[OMISE_SIG_DEBUG] Raw secret length:', webhookSecret.length, 'Base64-decoded key length:', secretBytes.length);
    const key = await crypto.subtle.importKey(
        "raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, rawBodyBytes);
    const expectedHex = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0')).join('');

    // Method 2: raw UTF-8 secret (no base64 decoding)
    const rawSecretBytes = new TextEncoder().encode(webhookSecret);
    console.log('[OMISE_SIG_DEBUG] Raw UTF-8 key length:', rawSecretBytes.length);
    const key2 = await crypto.subtle.importKey(
        "raw", rawSecretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signatureBytes2 = await crypto.subtle.sign("HMAC", key2, rawBodyBytes);
    const expectedHexRaw = Array.from(new Uint8Array(signatureBytes2))
        .map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('[OMISE_SIG_DEBUG] Received Omise-Signature:', signatureHeader);
    console.log('[OMISE_SIG_DEBUG] Computed HMAC (base64-decoded secret):', expectedHex);
    console.log('[OMISE_SIG_DEBUG] Computed HMAC (raw UTF-8 secret):', expectedHexRaw);

    // Omise may send multiple signatures comma-separated
    const signatures = signatureHeader.split(',');
    return signatures.some(sig => sig.trim() === expectedHex);
}

Deno.serve(async (req) => {
    try {
        // Clone request: one for base44 SDK init, one for body reading
        const reqClone = req.clone();
        const base44 = createClientFromRequest(reqClone);

        // Read raw body as Uint8Array first for signature verification
        const rawBodyBytes = new Uint8Array(await req.arrayBuffer());

        // Verify Omise webhook signature
        const signatureHeader = req.headers.get("omise-signature");
        const isValid = await verifyOmiseSignature(rawBodyBytes, signatureHeader);
        if (!isValid) {
            console.error("Invalid Omise webhook signature");
            return Response.json({ received: true, error: "invalid signature" }, { status: 200 });
        }

        // Decode bytes to text and parse JSON
        const body = JSON.parse(new TextDecoder().decode(rawBodyBytes));
        const eventType = body.key;
        const charge = body.data;

        console.log(`Omise webhook received: ${eventType}, charge: ${charge?.id}`);

        if (!charge || !charge.metadata?.case_id) {
            console.log("No case_id in charge metadata, skipping");
            return Response.json({ received: true });
        }

        const caseId = charge.metadata.case_id;

        if (eventType === "charge.complete") {
            if (charge.status === "successful") {
                console.log(`Payment successful for case ${caseId}, updating to intake`);

                await base44.asServiceRole.entities.Case.update(caseId, {
                    status: "intake",
                    omise_charge_id: charge.id,
                    paid_at: new Date().toISOString(),
                    resolve_amount: charge.amount / 100, // satang to THB
                    timeline: [{
                        timestamp: new Date().toISOString(),
                        event: "Payment received via PromptPay",
                        actor: "system",
                        meta: {
                            provider: "omise",
                            charge_id: charge.id,
                            amount: charge.amount / 100,
                            currency: "THB",
                        }
                    }],
                });

                // Create Payment record
                await base44.asServiceRole.entities.Payment.create({
                    type: "case",
                    currency: "THB",
                    amount: charge.amount / 100,
                    provider: "omise",
                    status: "paid",
                    external_id: charge.id,
                });

                console.log(`Case ${caseId} updated to intake, Payment record created`);
            } else {
                console.log(`Charge completed but status is ${charge.status} for case ${caseId}`);
            }
        } else if (eventType === "charge.expire") {
            console.log(`Payment expired for case ${caseId}`);

            // Only update if still awaiting payment
            const caseRecord = await base44.asServiceRole.entities.Case.get(caseId);
            if (caseRecord.status === "awaiting_payment") {
                await base44.asServiceRole.entities.Case.update(caseId, {
                    status: "awaiting_payment", // keep same status, clear charge
                    omise_charge_id: "",
                });
                console.log(`Cleared expired charge for case ${caseId}`);
            }
        }

        return Response.json({ received: true });
    } catch (error) {
        console.error("omiseWebhook error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});