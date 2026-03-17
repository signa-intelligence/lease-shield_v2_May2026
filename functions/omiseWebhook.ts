import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const reqClone = req.clone();
        const base44 = createClientFromRequest(reqClone);

        const body = await req.json();
        const eventType = body.key;
        const charge = body.data;

        console.log(`Omise webhook received: ${eventType}, charge: ${charge?.id}`);

        if (!charge || !charge.metadata?.case_id) {
            console.log("No case_id in charge metadata, skipping");
            return Response.json({ received: true });
        }

        const caseId = charge.metadata.case_id;

        if (eventType === "charge.complete" || (eventType === "charge.create" && charge.status === "successful")) {
            if (charge.status === "successful") {
                console.log(`Payment successful for case ${caseId}, updating to intake`);

                await base44.asServiceRole.entities.Case.update(caseId, {
                    status: "intake",
                    omise_charge_id: charge.id,
                    paid_at: new Date().toISOString(),
                    resolve_amount: charge.amount / 100,
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

                await base44.asServiceRole.entities.Payment.create({
                    type: "case",
                    currency: "THB",
                    amount: charge.amount / 100,
                    provider: "omise",
                    status: "paid",
                    external_id: charge.id,
                });

                console.log(`Case ${caseId} updated to intake, Payment record created`);

                // Send admin notification AFTER payment confirmed
                try {
                    const updatedCase = await base44.asServiceRole.entities.Case.get(caseId);
                    const users = await base44.asServiceRole.entities.User.filter({ email: updatedCase.user_email });
                    const caseUser = users[0];
                    await base44.asServiceRole.functions.invoke('notifyAdminNewCase', {
                        caseNumber: updatedCase.case_number,
                        tenantName: caseUser?.full_name || updatedCase.user_email,
                        tenantEmail: updatedCase.user_email,
                        landlordName: updatedCase.landlord_name,
                        propertyAddress: updatedCase.property_address,
                        disputeAmount: updatedCase.dispute_amount,
                        planTier: caseUser?.plan_tier,
                        caseId: caseId,
                        paymentType: 'promptpay'
                    });
                    console.log(`Admin notification sent for case ${caseId}`);
                } catch (notifyErr) {
                    console.error(`Admin notification failed (non-blocking):`, notifyErr.message);
                }
            } else {
                console.log(`Charge completed but status is ${charge.status} for case ${caseId}`);
            }
        } else if (eventType === "charge.expire") {
            console.log(`Payment expired for case ${caseId}`);

            const caseRecord = await base44.asServiceRole.entities.Case.get(caseId);
            if (caseRecord.status === "awaiting_payment") {
                await base44.asServiceRole.entities.Case.update(caseId, {
                    status: "awaiting_payment",
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