import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const OMISE_SECRET_KEY = Deno.env.get("OMISE_SECRET_KEY");
const OMISE_API_URL = "https://api.omise.co";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { case_id, amount } = await req.json();

        if (!case_id || !amount) {
            return Response.json({ error: "case_id and amount are required" }, { status: 400 });
        }

        // Verify the case exists and belongs to this user
        const caseRecord = await base44.entities.Case.get(case_id);
        if (!caseRecord) {
            return Response.json({ error: "Case not found" }, { status: 404 });
        }

        // Amount in satang (smallest THB unit) — 1 THB = 100 satang
        const amountSatang = Math.round(amount * 100);

        // Create a PromptPay source first
        const sourceRes = await fetch(`${OMISE_API_URL}/sources`, {
            method: "POST",
            headers: {
                "Authorization": "Basic " + btoa(OMISE_SECRET_KEY + ":"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "type": "promptpay",
                "amount": String(amountSatang),
                "currency": "thb",
            }),
        });

        const source = await sourceRes.json();
        if (source.object === "error") {
            console.error("Omise source error:", source);
            return Response.json({ error: source.message }, { status: 400 });
        }

        // Create a charge using the source
        const chargeRes = await fetch(`${OMISE_API_URL}/charges`, {
            method: "POST",
            headers: {
                "Authorization": "Basic " + btoa(OMISE_SECRET_KEY + ":"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "amount": String(amountSatang),
                "currency": "thb",
                "source": source.id,
                "expires_at": new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                "metadata[case_id]": case_id,
                "metadata[user_email]": user.email,
            }),
        });

        const charge = await chargeRes.json();
        if (charge.object === "error") {
            console.error("Omise charge error:", charge);
            return Response.json({ error: charge.message }, { status: 400 });
        }

        // Extract QR code image URL from the source scannable_code
        const qrCodeUrl = charge.source?.scannable_code?.image?.download_uri || null;

        // Save charge ID on the case
        await base44.asServiceRole.entities.Case.update(case_id, {
            omise_charge_id: charge.id,
        });

        console.log(`Omise PromptPay charge created: ${charge.id} for case ${case_id}, amount: ${amount} THB`);

        return Response.json({
            charge_id: charge.id,
            qr_code_url: qrCodeUrl,
            amount: amount,
            currency: "THB",
            expires_at: charge.expires_at || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            status: charge.status,
        });
    } catch (error) {
        console.error("createOmiseCharge error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});