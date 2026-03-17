import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function verifyOmiseSignature(rawBody, signatureHeader) {
    const webhookSecret = Deno.env.get("OMISE_WEBHOOK_SECRET");
    if (!webhookSecret) {
        console.warn("OMISE_WEBHOOK_SECRET not set, skipping signature verification");
        return true;
    }
    if (!signatureHeader) {
        console.error("Missing Omise-Signature header");
        return false;
    }

    // Decode the base64 webhook secret
    const secretBytes = Uint8Array.from(atob(webhookSecret), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
        "raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const expectedHex = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0')).join('');

    // Omise may send multiple signatures comma-separated
    const signatures = signatureHeader.split(',');
    return signatures.some(sig => sig.trim() === expectedHex);
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Read raw body for signature verification
        const rawBody = await req.text();

        // Verify Omise webhook signature
        const signatureHeader = req.headers.get("omise-signature");
        const isValid = await verifyOmiseSignature(rawBody, signatureHeader);
        if (!isValid) {
            console.error("Invalid Omise webhook signature");
            return Response.json({ error: "Invalid signature" }, { status: 401 });
        }

        const body = JSON.parse(rawBody);
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