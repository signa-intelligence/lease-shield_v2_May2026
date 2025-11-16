import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";

// Emergency utility: force Steve back to super_admin.
// Call via GET in the browser once, then delete this function.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const targetEmail = "steve.l@signa-consultants.com";

    console.log("🔧 makeSteveSuperAdmin starting for:", targetEmail);

    // Get all users using service role
    const users = await base44.asServiceRole.entities.User.list();

    // Find Steve (case-insensitive)
    const me = users.find((u) => {
      return u.email && u.email.toLowerCase() === targetEmail.toLowerCase();
    });

    if (!me) {
      console.error("❌ User not found:", targetEmail);
      return Response.json(
        { success: false, error: "user_not_found", email: targetEmail },
        { status: 404 },
      );
    }

    // FORCE ROLE UPDATE
    await base44.asServiceRole.entities.User.update(me.id, {
      role: "super_admin",
    });

    console.log("✅ Super admin restored for:", me.email);

    return Response.json(
      {
        success: true,
        message: `Super admin restored for ${me.email}`,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("❌ makeSteveSuperAdmin error:", err && err.message);
    return Response.json(
      {
        success: false,
        error: (err && err.message) || "unknown_error",
      },
      { status: 500 },
    );
  }
});