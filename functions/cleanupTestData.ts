import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('SK_TEST_secret_key'), {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  console.log('\n\n═══════════════════════════════════════');
  console.log('🧹 CLEANUP TEST DATA - PRODUCTION PREP');
  console.log('═══════════════════════════════════════');

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.access_level !== 'super_admin') {
      return Response.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { dryRun = true } = await req.json();
    console.log('🔍 Mode:', dryRun ? 'DRY RUN (no deletions)' : '⚠️ LIVE MODE (will delete)');

    const summary = {
      mode: dryRun ? 'DRY_RUN' : 'LIVE',
      protectedRecords: {
        payments: [],
        cases: [],
        users: [],
        letterUsage: [],
        evidence: []
      },
      toDelete: {
        cases: [],
        users: [],
        deposits: [],
        leases: [],
        documents: []
      },
      deleted: {
        cases: 0,
        users: 0,
        deposits: 0,
        leases: 0,
        documents: 0
      },
      errors: []
    };

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: IDENTIFY LAST 3 LIVE PAYMENTS + LINKED RECORDS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 STEP 1: Identifying last 3 LIVE payments...');
    
    const allPayments = await base44.asServiceRole.entities.Payment.list();
    const livePayments = allPayments
      .filter(p => p.status === 'paid' && p.provider === 'stripe')
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 3);

    console.log(`✅ Found ${livePayments.length} recent LIVE payments`);
    
    const protectedUserEmails = new Set();
    const protectedCaseIds = new Set();
    const protectedUserIds = new Set();

    for (const payment of livePayments) {
      summary.protectedRecords.payments.push({
        id: payment.id,
        type: payment.type,
        amount: payment.amount,
        email: payment.created_by,
        date: payment.created_date
      });
      
      protectedUserEmails.add(payment.created_by);
      console.log(`🛡️ Protected payment: ${payment.type} | ${payment.amount} THB | ${payment.created_by}`);
    }

    // Get all users for these emails
    const allUsers = await base44.asServiceRole.entities.User.list();
    const protectedUsers = allUsers.filter(u => protectedUserEmails.has(u.email));
    
    for (const u of protectedUsers) {
      protectedUserIds.add(u.id);
      summary.protectedRecords.users.push({
        id: u.id,
        email: u.email,
        plan: u.plan_tier,
        credits: u.letter_credits
      });
      console.log(`🛡️ Protected user: ${u.email} (${u.plan_tier})`);
    }

    // Get all cases for these users
    const allCases = await base44.asServiceRole.entities.Case.filter({});
    const protectedCases = allCases.filter(c => protectedUserEmails.has(c.user_email));
    
    for (const c of protectedCases) {
      protectedCaseIds.add(c.id);
      summary.protectedRecords.cases.push({
        id: c.id,
        case_number: c.case_number,
        user: c.user_email,
        status: c.status
      });
      console.log(`🛡️ Protected case: ${c.case_number} | ${c.user_email}`);
    }

    // Get letter usage for these users
    const allLetterUsage = await base44.asServiceRole.entities.LetterUsage.filter({});
    const protectedLetterUsage = allLetterUsage.filter(l => protectedUserEmails.has(l.user_email));
    summary.protectedRecords.letterUsage = protectedLetterUsage.map(l => ({
      id: l.id,
      user: l.user_email,
      template: l.template_key
    }));

    // Get evidence for protected cases
    const allDocs = await base44.asServiceRole.entities.Document.filter({});
    const protectedDocs = allDocs.filter(d => protectedUserEmails.has(d.created_by));
    summary.protectedRecords.evidence = protectedDocs.map(d => ({
      id: d.id,
      type: d.type,
      owner: d.created_by
    }));

    console.log(`\n📊 PROTECTION SUMMARY:`);
    console.log(`   Payments: ${summary.protectedRecords.payments.length}`);
    console.log(`   Users: ${summary.protectedRecords.users.length}`);
    console.log(`   Cases: ${summary.protectedRecords.cases.length}`);
    console.log(`   Letter Usage: ${summary.protectedRecords.letterUsage.length}`);
    console.log(`   Evidence: ${summary.protectedRecords.evidence.length}`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: IDENTIFY TEST DATA TO DELETE
    // ═══════════════════════════════════════════════════════════════
    console.log('\n\n🔍 STEP 2: Identifying test data to delete...');

    // Test users (exclude protected + admins)
    const testUsers = allUsers.filter(u => {
      if (protectedUserIds.has(u.id)) return false;
      if (u.access_level && u.access_level !== 'user') return false; // Keep admin/va
      
      const isTestEmail = u.email.includes('test') || 
                         u.email.includes('demo') || 
                         u.email.includes('dummy') ||
                         u.email.includes('@example.com');
      
      const hasNoActivity = !u.plan_tier || u.plan_tier === 'free';
      const hasNoCredits = !u.letter_credits || u.letter_credits === 0;
      
      return isTestEmail || (hasNoActivity && hasNoCredits);
    });

    summary.toDelete.users = testUsers.map(u => ({
      id: u.id,
      email: u.email,
      reason: u.email.includes('test') ? 'test_email' : 'no_activity'
    }));

    // Test cases (exclude protected)
    const testCases = allCases.filter(c => {
      if (protectedCaseIds.has(c.id)) return false;
      
      const isTestEmail = c.user_email?.includes('test') || 
                         c.user_email?.includes('demo');
      
      const noPayment = !c.stripe_session_id && !c.paid_at;
      const oldCase = new Date(c.created_date) < new Date('2024-11-01'); // Before recent real usage
      
      return isTestEmail || (noPayment && oldCase);
    });

    summary.toDelete.cases = testCases.map(c => ({
      id: c.id,
      case_number: c.case_number,
      user: c.user_email,
      reason: c.user_email?.includes('test') ? 'test_user' : 'no_payment_old'
    }));

    // Test deposits (exclude protected users)
    const allDeposits = await base44.asServiceRole.entities.DepositTracker.filter({});
    const testDeposits = allDeposits.filter(d => !protectedUserEmails.has(d.created_by));
    summary.toDelete.deposits = testDeposits.map(d => ({
      id: d.id,
      user: d.created_by,
      amount: d.deposit_amount
    }));

    // Test leases (exclude protected users)
    const allLeases = await base44.asServiceRole.entities.Lease.filter({});
    const testLeases = allLeases.filter(l => !protectedUserEmails.has(l.created_by));
    summary.toDelete.leases = testLeases.map(l => ({
      id: l.id,
      user: l.created_by,
      address: l.property_address
    }));

    // Test documents (exclude protected)
    const testDocs = allDocs.filter(d => {
      if (protectedUserEmails.has(d.created_by)) return false;
      
      const isTestOwner = d.created_by?.includes('test') || d.created_by?.includes('demo');
      return isTestOwner;
    });

    summary.toDelete.documents = testDocs.map(d => ({
      id: d.id,
      type: d.type,
      owner: d.created_by
    }));

    console.log(`\n🗑️ TEST DATA IDENTIFIED:`);
    console.log(`   Users to delete: ${summary.toDelete.users.length}`);
    console.log(`   Cases to delete: ${summary.toDelete.cases.length}`);
    console.log(`   Deposits to delete: ${summary.toDelete.deposits.length}`);
    console.log(`   Leases to delete: ${summary.toDelete.leases.length}`);
    console.log(`   Documents to delete: ${summary.toDelete.documents.length}`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: DELETE (if not dry run)
    // ═══════════════════════════════════════════════════════════════
    if (!dryRun) {
      console.log('\n\n⚠️ STEP 3: EXECUTING DELETIONS...');

      // Delete test cases
      for (const c of testCases) {
        try {
          await base44.asServiceRole.entities.Case.delete(c.id);
          summary.deleted.cases++;
        } catch (err) {
          summary.errors.push(`Failed to delete case ${c.id}: ${err.message}`);
        }
      }

      // Delete test deposits
      for (const d of testDeposits) {
        try {
          await base44.asServiceRole.entities.DepositTracker.delete(d.id);
          summary.deleted.deposits++;
        } catch (err) {
          summary.errors.push(`Failed to delete deposit ${d.id}: ${err.message}`);
        }
      }

      // Delete test leases
      for (const l of testLeases) {
        try {
          await base44.asServiceRole.entities.Lease.delete(l.id);
          summary.deleted.leases++;
        } catch (err) {
          summary.errors.push(`Failed to delete lease ${l.id}: ${err.message}`);
        }
      }

      // Delete test documents
      for (const d of testDocs) {
        try {
          await base44.asServiceRole.entities.Document.delete(d.id);
          summary.deleted.documents++;
        } catch (err) {
          summary.errors.push(`Failed to delete document ${d.id}: ${err.message}`);
        }
      }

      // Soft delete test users (keep for audit)
      for (const u of testUsers) {
        try {
          await base44.asServiceRole.entities.User.update(u.id, {
            is_active: false,
            deleted_at: new Date().toISOString()
          });
          summary.deleted.users++;
        } catch (err) {
          summary.errors.push(`Failed to soft-delete user ${u.id}: ${err.message}`);
        }
      }

      console.log('\n✅ DELETIONS COMPLETE');
      console.log(`   Cases deleted: ${summary.deleted.cases}`);
      console.log(`   Deposits deleted: ${summary.deleted.deposits}`);
      console.log(`   Leases deleted: ${summary.deleted.leases}`);
      console.log(`   Documents deleted: ${summary.deleted.documents}`);
      console.log(`   Users soft-deleted: ${summary.deleted.users}`);
    } else {
      console.log('\n⏭️ STEP 3: SKIPPED (dry run mode)');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: FINAL SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log('\n\n═══════════════════════════════════════');
    console.log('✅ CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`Mode: ${summary.mode}`);
    console.log(`Protected payments: ${summary.protectedRecords.payments.length}`);
    console.log(`Protected users: ${summary.protectedRecords.users.length}`);
    console.log(`Protected cases: ${summary.protectedRecords.cases.length}`);
    console.log(`Errors: ${summary.errors.length}`);
    console.log('═══════════════════════════════════════\n\n');

    return Response.json(summary, { status: 200 });

  } catch (error) {
    console.error('\n\n❌ CLEANUP FAILED:', error);
    console.error('Stack:', error.stack);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});