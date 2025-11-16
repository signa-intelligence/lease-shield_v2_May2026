import { createClient } from "npm:@base44/sdk@0.8.4";

// THIS VERSION USES SERVICE-ROLE CLIENT → FULL PERMISSIONS
// It bypasses all user restrictions and forces the update.

Deno.serve(async (req) => {
  try {
    const base44 = createClient({ role: "service" });

    const targetEmail = "steve.l@signa-consultants.com";
    console.log("🔧 Forcing super admin for:", targetEmail);

    // Fetch all users
    const users = await base44.entities.User.list();

    const me = users.find(
      (u) => u.email && u.email.toLowerCase() === targetEmail.toLowerCase()
    );

    if (!me) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // FORCE UPDATE
    await base44.entities.User.update(me.id, {
      role: "super_admin",
    });

    console.log("✅ ROLE UPDATED TO SUPER ADMIN:", me.email);

    return Response.json({
      success: true,
      message: `Super admin restored for: ${me.email}`,
    });

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});