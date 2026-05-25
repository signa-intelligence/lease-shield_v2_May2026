import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const OPS_EMAIL = "ops@leaseshield.asia";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId, caseNumber, messageText, senderEmail, senderRole, tenantEmail } = await req.json();

    if (!caseId || !messageText || !senderRole || !tenantEmail) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine recipient
    const recipientEmail = senderRole === "user" ? OPS_EMAIL : tenantEmail;
    const senderLabel = senderRole === "user" ? "Tenant" : "LeaseShield Case Officer";
    const subject = `New message on ${caseNumber || "your case"} — LeaseShield`;

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0C3B2E; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png" alt="Lease Shield" style="height:60px;margin-bottom:20px;">
          <h2 style="color: #FFFFFF; margin: 0;">New Case Message</h2>
          <p style="color: #C7A338; margin: 4px 0 0 0;">${caseNumber || "Case Update"}</p>
        </div>
        <div style="padding: 24px; background-color: #F8FAFC; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #475569; font-size: 14px; margin-bottom: 8px;">
            <strong>${senderLabel}</strong> (${senderEmail}) sent a message:
          </p>
          <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 12px 0;">
            <p style="color: #1A1D1F; font-size: 14px; white-space: pre-wrap; margin: 0;">${messageText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <a href="https://app.leaseshield.asia" style="display:inline-block;background-color:#0F4229;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:20px;">View Your Case</a>
          <p style="color: #64748B; font-size: 12px; margin-top: 16px;">
            Log in to LeaseShield to reply.
          </p>
          <p style="color:#888888;font-size:12px;margin-top:30px;">Lease Shield | support@leaseshield.asia | leaseshield.asia<br>This email was sent regarding your active case. Please do not reply to this email — log in to your account to respond.</p>
        </div>
      </div>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LeaseShield <notifications@leaseshield.asia>",
        to: [recipientEmail],
        subject: subject,
        html: body,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[sendCaseMessage] Resend error:", emailResult);
      return Response.json({ success: false, error: emailResult }, { status: 200 });
    }

    console.log("[sendCaseMessage] Email sent to:", recipientEmail, "id:", emailResult.id);
    return Response.json({ success: true, emailId: emailResult.id });
  } catch (error) {
    console.error("[sendCaseMessage] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});