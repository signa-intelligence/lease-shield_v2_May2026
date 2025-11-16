import { createClientFromRequest } from "npm:@base44/sdk@0.8.4";

// One-shot utility: promote Steve to super admin.
// Run once, confirm, then you can delete this function if you want.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const targetEmail = "steve.l@signa-consultants.com";

    console.log("makeSteveSuperAdmin starting for", targetEmail);

    // Fetch all users
    const users = await base44.asServiceRole.entities.User.list();
    console.log("Users found:", users.length);

    // Find Steve by email (case-insensitive)
    const me = users.find((u) => {
      if (!u.email) return false;
      return u.email.toLowerCase() === targetEmail.toLowerCase();
    });

    if (!me) {
      console.error("User not found for email:", targetEmail);
      return Response.json(
        {
          success: false,
          error: "user_not_found",
          email: targetEmail
        },
        { status: 404 }
      );
    }

    // Existing super admins (for info)
    const superAdmins = users.filter((u) => {
      return (
        u.role === "super_admin" ||
        u.is_super_admin === true ||
        u.admin_role === "super_admin"
      );
    });

    console.log(
      "Current super admins:",
      superAdmins.map((u) => u.email)
    );

    // Aggressive update payload to cover different schemas
    const updateData = {
      role: "super_admin",
      is_super_admin: true,
      is_admin: true,
      admin_role: "super_admin",
      can_access_admin: true
    };

    console.log("Updating user to super_admin:", me.email);
    await base44.asServiceRole.entities.User.update(me.id, updateData);

    console.log("Promotion complete for:", me.email);

    return Response.json(
      {
        success: true,
        updatedUserId: me.id,
        email: me.email,
        previousRole: me.role || null,
        superAdminCountBefore: superAdmins.length,
        appliedUpdate: updateData
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("makeSteveSuperAdmin error:", err);
    return Response.json(
      {
        success: false,
        error: String(err && err.message ? err.message : err)
      },
      { status: 500 }
    );
  }
});