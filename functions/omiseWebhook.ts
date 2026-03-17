import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const reqClone = req.clone();
        const base44 = createClientFromRequest(reqClone);

        const body = await req.json();
        const eventType = body.key;
        const charge = body.data;

        console.log(`Omise webhook received: ${eventType}, charge: ${charge?.id}`);
        console.log(`[OMISE_DEBUG] eventType=${eventType}, charge.status=${charge?.status}, metadata=`, JSON.stringify(charge?.metadata));

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

                // Send case confirmation email to user
                try {
                    const confirmedCase = await base44.asServiceRole.entities.Case.get(caseId);
                    await base44.asServiceRole.functions.invoke('sendCaseConfirmationEmail', {
                        caseNumber: confirmedCase.case_number,
                        userName: charge.metadata.user_email,
                        userEmail: charge.metadata.user_email,
                        disputeAmount: charge.amount / 100,
                        paymentType: 'promptpay'
                    });
                    console.log(`Case confirmation email sent to ${charge.metadata.user_email} for case ${caseId}`);
                } catch (confirmErr) {
                    console.error(`Case confirmation email failed (non-blocking):`, confirmErr.message);
                }

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
            } else if (charge.status === "failed") {
                console.log(`Payment FAILED for case ${caseId}`);

                try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: charge.metadata.user_email,
                        subject: 'Payment Failed – Please Try Again',
                        body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                            <h2 style="color:#DC2626;">❌ Payment Failed</h2>
                            <p>Your PromptPay payment for case <strong>${caseId}</strong> was not successful.</p>
                            <p>Please return to LeaseShield and try again.</p>
                            <p style="margin-top:24px;"><a href="https://leaseshield.asia/CaseDetails?id=${caseId}" style="background:#0C3B2E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Retry Payment</a></p>
                            <p style="color:#64748B;font-size:13px;margin-top:24px;">If you continue to experience issues, please contact us at support@leaseshield.asia</p>
                        </div>`,
                        from_name: 'LeaseShield'
                    });
                    console.log(`Payment failed email sent to ${charge.metadata.user_email}`);
                } catch (emailErr) {
                    console.error(`Payment failed email error (non-blocking):`, emailErr.message);
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