import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'));

// PRODUCTION USERS - DO NOT DELETE
const KEEP_USERS = [
  'steve.l@signa-consultants.com',
  'jay.p@signa-consultants.com',
  'steve.d.lockhart@gmail.com',
  'lstest1signa@gmail.com',
  'steve.d.lockhart+5@gmail.com',
  'signa.asset.management@gmail.com',
  'dom.sources@gmail.com',
  'shortyroc36@gmail.com',
  'tamirbe@base44.com'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // CRITICAL: Admin-only operation
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 403 });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧹 [CLEANUP] Starting test user cleanup');
    console.log('🔒 [CLEANUP] Keeping', KEEP_USERS.length, 'production users');

    // Step 1: Get all users from database
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log('📊 [CLEANUP] Total users in database:', allUsers.length);

    // Step 2: Filter to find users to delete
    const keepUserEmails = KEEP_USERS.map(e => e.toLowerCase());
    const usersToDelete = allUsers.filter(u => {
      const email = (u.email || '').toLowerCase();
      return !keepUserEmails.includes(email);
    });

    console.log('🗑️  [CLEANUP] Users to delete:', usersToDelete.length);
    console.log('✅ [CLEANUP] Users to keep:', allUsers.length - usersToDelete.length);

    const deletionResults = {
      totalUsers: allUsers.length,
      usersToKeep: allUsers.length - usersToDelete.length,
      usersToDelete: usersToDelete.length,
      deleted: [],
      errors: []
    };

    // Step 3: Delete each user
    for (const userToDelete of usersToDelete) {
      try {
        const email = userToDelete.email;
        const stripeCustomerId = userToDelete.stripe_customer_id;

        console.log(`\n🗑️  [CLEANUP] Deleting user: ${email}`);
        
        // Delete from Stripe if customer exists
        if (stripeCustomerId) {
          try {
            await stripe.customers.del(stripeCustomerId);
            console.log(`  ✅ Deleted Stripe customer: ${stripeCustomerId}`);
          } catch (stripeError) {
            console.log(`  ⚠️  Stripe deletion failed: ${stripeError.message}`);
          }
        }

        // Delete from database
        await base44.asServiceRole.entities.User.delete(userToDelete.id);
        console.log(`  ✅ Deleted user from database: ${userToDelete.id}`);

        deletionResults.deleted.push({
          id: userToDelete.id,
          email: email,
          stripe_customer_id: stripeCustomerId || null,
          full_name: userToDelete.full_name
        });

      } catch (error) {
        console.error(`  ❌ Error deleting user ${userToDelete.email}:`, error.message);
        deletionResults.errors.push({
          email: userToDelete.email,
          error: error.message
        });
      }
    }

    // Step 4: Verify remaining users
    const remainingUsers = await base44.asServiceRole.entities.User.list();
    const remainingEmails = remainingUsers.map(u => u.email.toLowerCase());
    const allKept = KEEP_USERS.every(email => 
      remainingEmails.includes(email.toLowerCase())
    );

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [CLEANUP] Cleanup complete!');
    console.log('📊 [CLEANUP] Final user count:', remainingUsers.length);
    console.log('📊 [CLEANUP] Successfully deleted:', deletionResults.deleted.length);
    console.log('📊 [CLEANUP] Errors:', deletionResults.errors.length);
    console.log('🔒 [CLEANUP] All production users preserved:', allKept ? 'YES' : 'NO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return Response.json({
      success: true,
      summary: {
        totalBeforeCleanup: deletionResults.totalUsers,
        usersDeleted: deletionResults.deleted.length,
        usersKept: remainingUsers.length,
        deletionErrors: deletionResults.errors.length,
        allProductionUsersPreserved: allKept
      },
      deletedUsers: deletionResults.deleted,
      errors: deletionResults.errors,
      remainingUsers: remainingUsers.map(u => ({
        email: u.email,
        full_name: u.full_name,
        plan_tier: u.plan_tier
      }))
    });

  } catch (error) {
    console.error('❌ [CLEANUP] Fatal error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});