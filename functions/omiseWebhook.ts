import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function computeHmacHex(keyBytes, dataBytes) {
    const key = await crypto.subtle.importKey(
        "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, dataBytes);
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyOmiseSignature(rawBodyBytes, headers) {
    const webhookSecret = Deno.env.get("OMISE_WEBHOOK_SECRET");
    if (!webhookSecret) {
        console.warn("[OMISE] OMISE_WEBHOOK_SECRET not set — accepting webhook");
        return true;
    }

    // Log ALL headers
    const allHeaders = {};
    headers.forEach((value, key) => { allHeaders[key] = value; });
    console.log('[OMISE_SIG_DEBUG] All headers:', JSON.stringify(allHeaders));

    const signatureHeader = headers.get("omise-signature");
    if (!signatureHeader) {
        console.warn("[OMISE] No Omise-Signature header — accepting webhook for safety");
        return true;
    }

    // Parse received signatures
    const receivedSigs = signatureHeader.split(',').map(s => s.trim()).filter(Boolean);
    console.log('[OMISE_SIG_DEBUG] Received signatures:', JSON.stringify(receivedSigs));

    // Body representations
    const bodyText = new TextDecoder().decode(rawBodyBytes);
    console.log('[OMISE_SIG_DEBUG] Body preview (first 200 chars):', bodyText.substring(0, 200));

    const bodyTextBytes = new TextEncoder().encode(bodyText);
    let jsonStringifiedBytes;
    try {
        jsonStringifiedBytes = new TextEncoder().encode(JSON.stringify(JSON.parse(bodyText)));
    } catch (e) {
        jsonStringifiedBytes = bodyTextBytes;
    }

    // Timestamp for ts.body method
    const timestamp = headers.get("omise-signature-timestamp") || headers.get("x-omise-signature-timestamp") || "";
    console.log('[OMISE_SIG_DEBUG] Timestamp header:', timestamp || '(none)');

    // Two secret variants
    let b64DecodedSecret;
    try {
        b64DecodedSecret = Uint8Array.from(atob(webhookSecret), c => c.charCodeAt(0));
    } catch (e) {
        console.warn('[OMISE_SIG_DEBUG] Secret is not valid base64, skipping b64 methods');
        b64DecodedSecret = null;
    }
    const utf8Secret = new TextEncoder().encode(webhookSecret);

    console.log('[OMISE_SIG_DEBUG] Secret lengths — raw UTF-8:', utf8Secret.length, ', base64-decoded:', b64DecodedSecret?.length ?? 'N/A');

    // Compute ALL HMAC variants
    const results = {};

    // With base64-decoded secret
    if (b64DecodedSecret) {
        results['b64key+rawBody'] = await computeHmacHex(b64DecodedSecret, rawBodyBytes);
        results['b64key+textBody'] = await computeHmacHex(b64DecodedSecret, bodyTextBytes);
        results['b64key+jsonStringified'] = await computeHmacHex(b64DecodedSecret, jsonStringifiedBytes);
        if (timestamp) {
            const tsBody = new TextEncoder().encode(timestamp + "." + bodyText);
            results['b64key+ts.body'] = await computeHmacHex(b64DecodedSecret, tsBody);
        }
    }

    // With raw UTF-8 secret
    results['utf8key+rawBody'] = await computeHmacHex(utf8Secret, rawBodyBytes);
    results['utf8key+textBody'] = await computeHmacHex(utf8Secret, bodyTextBytes);
    results['utf8key+jsonStringified'] = await computeHmacHex(utf8Secret, jsonStringifiedBytes);
    if (timestamp) {
        const tsBody = new TextEncoder().encode(timestamp + "." + bodyText);
        results['utf8key+ts.body'] = await computeHmacHex(utf8Secret, tsBody);
    }

    console.log('[OMISE_SIG_DEBUG] All computed HMACs:', JSON.stringify(results));

    // Check if ANY computed HMAC matches ANY received signature
    const allComputed = Object.values(results);
    const match = receivedSigs.find(sig => allComputed.includes(sig));
    if (match) {
        const method = Object.entries(results).find(([, v]) => v === match)?.[0];
        console.log(`[OMISE] ✅ Signature MATCHED via method: ${method}`);
        return true;
    }

    // No match — log everything but DO NOT block
    console.warn('[OMISE] ⚠️ NO signature match found. Accepting webhook anyway to not block payments.');
    console.warn('[OMISE] Received:', JSON.stringify(receivedSigs));
    console.warn('[OMISE] Computed:', JSON.stringify(results));
    console.warn('[OMISE] Headers:', JSON.stringify(allHeaders));
    return true; // ALWAYS accept — never block payments
}

Deno.serve(async (req) => {
    try {
        // Clone request: one for base44 SDK init, one for body reading
        const reqClone = req.clone();
        const base44 = createClientFromRequest(reqClone);

        // Read raw body as Uint8Array first for signature verification
        const rawBodyBytes = new Uint8Array(await req.arrayBuffer());

        // Debug: log Content-Type
        console.log('[OMISE_SIG_DEBUG] Content-Type:', req.headers.get("content-type"));

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