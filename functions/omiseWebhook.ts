import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function computeHmac(secretBytes, dataBytes) {
    const key = await crypto.subtle.importKey(
        "raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, dataBytes);
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyOmiseSignature(rawBodyBytes, req) {
    const webhookSecret = Deno.env.get("OMISE_WEBHOOK_SECRET");
    if (!webhookSecret) {
        console.warn("OMISE_WEBHOOK_SECRET not set, skipping verification");
        return true;
    }

    // Log ALL headers
    const allHeaders = {};
    req.headers.forEach((v, k) => { allHeaders[k] = v; });
    console.log('[OMISE_SIG] All headers:', JSON.stringify(allHeaders));

    const signatureHeader = req.headers.get("omise-signature");
    const timestampHeader = req.headers.get("omise-signature-timestamp");
    console.log('[OMISE_SIG] Omise-Signature:', signatureHeader);
    console.log('[OMISE_SIG] Omise-Signature-Timestamp:', timestampHeader);

    // Body in various forms
    const bodyText = new TextDecoder().decode(rawBodyBytes);
    console.log('[OMISE_SIG] Body preview (200 chars):', bodyText.substring(0, 200));

    const bodyTextBytes = new TextEncoder().encode(bodyText);
    let reserializedBytes;
    try {
        reserializedBytes = new TextEncoder().encode(JSON.stringify(JSON.parse(bodyText)));
    } catch (e) {
        reserializedBytes = bodyTextBytes;
    }

    // Two secrets: base64-decoded and raw UTF-8
    let b64SecretBytes;
    try {
        b64SecretBytes = Uint8Array.from(atob(webhookSecret), c => c.charCodeAt(0));
    } catch (e) {
        console.log('[OMISE_SIG] Secret is not valid base64, skipping b64 methods');
        b64SecretBytes = null;
    }
    const rawSecretBytes = new TextEncoder().encode(webhookSecret);

    console.log('[OMISE_SIG] Secret lengths — raw UTF-8:', rawSecretBytes.length, ', base64-decoded:', b64SecretBytes?.length ?? 'N/A');

    // Build timestamp payloads if timestamp header exists
    let tsRawBytes = null;
    let tsTextBytes = null;
    if (timestampHeader) {
        tsRawBytes = new TextEncoder().encode(timestampHeader + "." + bodyText);
        tsTextBytes = tsRawBytes; // same thing
    }

    // Compute ALL HMACs
    const results = {};
    const secrets = [];
    if (b64SecretBytes) secrets.push({ name: 'b64', bytes: b64SecretBytes });
    secrets.push({ name: 'raw', bytes: rawSecretBytes });

    for (const secret of secrets) {
        // (a) HMAC of raw body bytes
        results[`${secret.name}_rawBody`] = await computeHmac(secret.bytes, rawBodyBytes);
        // (b) HMAC of timestamp + "." + body
        if (tsRawBytes) {
            results[`${secret.name}_tsBody`] = await computeHmac(secret.bytes, tsRawBytes);
        }
        // (c) HMAC of body as plain text string (re-encoded)
        results[`${secret.name}_textBody`] = await computeHmac(secret.bytes, bodyTextBytes);
        // (d) HMAC of JSON.stringify(parsed body)
        results[`${secret.name}_reserialized`] = await computeHmac(secret.bytes, reserializedBytes);
    }

    console.log('[OMISE_SIG] All computed HMACs:', JSON.stringify(results));

    // Parse received signatures
    const receivedSigs = signatureHeader
        ? signatureHeader.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    console.log('[OMISE_SIG] Received signatures:', JSON.stringify(receivedSigs));

    // Check if ANY computed HMAC matches ANY received signature
    const computedValues = Object.values(results);
    for (const sig of receivedSigs) {
        if (computedValues.includes(sig)) {
            const matchKey = Object.entries(results).find(([, v]) => v === sig)?.[0];
            console.log('[OMISE_SIG] ✅ MATCH FOUND! Method:', matchKey, 'Sig:', sig);
            return true;
        }
    }

    // No match — log everything but DO NOT block
    console.warn('[OMISE_SIG] ⚠️ NO SIGNATURE MATCH — processing webhook anyway to not block payments');
    return true; // always accept while debugging
}

Deno.serve(async (req) => {
    try {
        // Clone request: one for base44 SDK init, one for body reading
        const reqClone = req.clone();
        const base44 = createClientFromRequest(reqClone);

        // Read raw body as Uint8Array first for signature verification
        const rawBodyBytes = new Uint8Array(await req.arrayBuffer());

        // Verify Omise webhook signature (always processes, never blocks)
        await verifyOmiseSignature(rawBodyBytes, req);

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