import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * FORENSIC DIAGNOSTIC TOOL FOR SUPPORT TICKET SYSTEM
 * Tests every component and reports findings
 */

Deno.serve(async (req) => {
  const report = {
    timestamp: new Date().toISOString(),
    tests: {},
    issues: [],
    summary: {}
  };

  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    
    if (!caller || caller.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    console.log('🔍 STARTING FORENSIC ANALYSIS');

    // ═══════════════════════════════════════════════════════════════
    // TEST 1: DATABASE STATE - What tickets exist?
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 TEST 1: DATABASE STATE');
    try {
      const allTickets = await base44.asServiceRole.entities.SupportTicket.list();
      
      report.tests.database_state = {
        status: 'completed',
        total_tickets: allTickets.length,
        tickets: allTickets.map(t => ({
          id: t.id,
          ticket_number: t.ticket_number,
          created_by: t.created_by,
          user_email: t.user_email,
          created_date: t.created_date,
          status: t.status,
          subject: t.subject
        })),
        ticket_numbers_distribution: allTickets.reduce((acc, t) => {
          acc[t.ticket_number] = (acc[t.ticket_number] || 0) + 1;
          return acc;
        }, {})
      };

      console.log(`✅ Found ${allTickets.length} tickets in database`);
      console.log('📋 Ticket numbers:', Object.keys(report.tests.database_state.ticket_numbers_distribution));
      
      // Check for duplicate ticket numbers
      const duplicates = Object.entries(report.tests.database_state.ticket_numbers_distribution)
        .filter(([_, count]) => count > 1);
      
      if (duplicates.length > 0) {
        report.issues.push({
          severity: 'critical',
          issue: 'Duplicate ticket numbers detected',
          details: duplicates,
          root_cause: 'Ticket number generation logic is broken'
        });
      }
    } catch (err) {
      report.tests.database_state = { status: 'failed', error: err.message };
      report.issues.push({
        severity: 'critical',
        issue: 'Cannot query database',
        error: err.message
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 2: USER QUERY - Can users see their tickets?
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👤 TEST 2: USER TICKET QUERY');
    try {
      // Test with actual user email from database
      const testEmail = report.tests.database_state?.tickets?.[0]?.created_by || 'steve.l@signa-consultants.com';
      
      // Test as user (with RLS)
      const userTickets = await base44.entities.SupportTicket.filter({ created_by: testEmail });
      
      // Test as service role (without RLS)
      const serviceRoleTickets = await base44.asServiceRole.entities.SupportTicket.filter({ created_by: testEmail });
      
      report.tests.user_query = {
        status: 'completed',
        test_email: testEmail,
        user_query_count: userTickets.length,
        service_role_query_count: serviceRoleTickets.length,
        rls_blocking: userTickets.length !== serviceRoleTickets.length
      };

      console.log(`✅ User query: ${userTickets.length} tickets`);
      console.log(`✅ Service role query: ${serviceRoleTickets.length} tickets`);
      
      if (userTickets.length !== serviceRoleTickets.length) {
        report.issues.push({
          severity: 'critical',
          issue: 'RLS blocking user ticket access',
          details: {
            expected: serviceRoleTickets.length,
            actual: userTickets.length
          },
          root_cause: 'Row Level Security policy preventing users from seeing their own tickets'
        });
      }
    } catch (err) {
      report.tests.user_query = { status: 'failed', error: err.message };
      report.issues.push({
        severity: 'critical',
        issue: 'User query failed',
        error: err.message
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 3: ADMIN QUERY - Why showing 0 tickets?
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👨‍💼 TEST 3: ADMIN TICKET QUERY');
    try {
      const adminTickets1 = await base44.entities.SupportTicket.list();
      const adminTickets2 = await base44.asServiceRole.entities.SupportTicket.list();
      
      report.tests.admin_query = {
        status: 'completed',
        regular_query_count: adminTickets1.length,
        service_role_query_count: adminTickets2.length,
        using_correct_method: adminTickets2.length > 0
      };

      console.log(`✅ Admin regular query: ${adminTickets1.length} tickets`);
      console.log(`✅ Admin service role query: ${adminTickets2.length} tickets`);
      
      if (adminTickets1.length === 0 && adminTickets2.length > 0) {
        report.issues.push({
          severity: 'high',
          issue: 'Admin page using wrong query method',
          details: {
            current_method: 'base44.entities (returns 0)',
            correct_method: 'base44.asServiceRole.entities (returns ' + adminTickets2.length + ')'
          },
          root_cause: 'AdminSupport.js not using asServiceRole for data fetching'
        });
      }
    } catch (err) {
      report.tests.admin_query = { status: 'failed', error: err.message };
      report.issues.push({
        severity: 'critical',
        issue: 'Admin query failed',
        error: err.message
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 4: USER METADATA - Steve's email preferences
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📧 TEST 4: USER EMAIL PREFERENCES');
    try {
      const steve = await base44.asServiceRole.auth.admin.getUserByEmail('steve.l@signa-consultants.com');
      
      report.tests.user_metadata = {
        status: 'completed',
        steve_email: steve.email,
        steve_metadata: steve.user_metadata,
        has_unsubscribed: !!steve.user_metadata?.unsubscribed,
        has_email_preferences: !!steve.user_metadata?.email_preferences,
        email_preferences: steve.user_metadata?.email_preferences
      };

      console.log(`✅ Steve's metadata:`, JSON.stringify(steve.user_metadata, null, 2));
      
      if (steve.user_metadata?.unsubscribed === true) {
        report.issues.push({
          severity: 'high',
          issue: 'Steve globally unsubscribed',
          details: {
            unsubscribed: steve.user_metadata.unsubscribed,
            unsubscribed_at: steve.user_metadata.unsubscribed_at
          },
          root_cause: 'Legacy unsubscribe flag still set to true'
        });
      }
      
      if (steve.user_metadata?.email_preferences?.support_emails === false) {
        report.issues.push({
          severity: 'medium',
          issue: 'Steve opted out of support emails',
          details: steve.user_metadata.email_preferences,
          root_cause: 'User disabled support emails in preferences'
        });
      }
    } catch (err) {
      report.tests.user_metadata = { status: 'failed', error: err.message };
      report.issues.push({
        severity: 'high',
        issue: 'Cannot fetch user metadata',
        error: err.message
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 5: EMAIL SENDING - Test direct email
    // ═══════════════════════════════════════════════════════════════
    console.log('\n✉️ TEST 5: EMAIL FUNCTIONALITY');
    try {
      const testResult = await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Lease Shield Test',
        to: 'steve.l@signa-consultants.com',
        subject: '[DIAGNOSTIC] Email System Test',
        body: 'This is a diagnostic test email from the forensic analysis tool. If you receive this, email sending is working.'
      });
      
      report.tests.email_sending = {
        status: 'completed',
        test_sent: true,
        result: testResult
      };

      console.log(`✅ Test email sent to Steve`);
    } catch (err) {
      report.tests.email_sending = { status: 'failed', error: err.message };
      report.issues.push({
        severity: 'critical',
        issue: 'Email sending failed',
        error: err.message,
        root_cause: 'RESEND_API_KEY invalid or email service down'
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 6: TICKET NUMBER GENERATION - How are numbers assigned?
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🔢 TEST 6: TICKET NUMBER GENERATION');
    try {
      const allTickets = await base44.asServiceRole.entities.SupportTicket.list();
      const numbers = allTickets.map(t => t.ticket_number).filter(n => n);
      const uniqueNumbers = [...new Set(numbers)];
      
      report.tests.ticket_numbering = {
        status: 'completed',
        total_tickets: allTickets.length,
        total_numbers: numbers.length,
        unique_numbers: uniqueNumbers.length,
        all_numbers: numbers,
        duplicates: numbers.length - uniqueNumbers.length
      };

      console.log(`✅ Ticket numbers: ${uniqueNumbers.length} unique out of ${numbers.length} total`);
      
      if (numbers.length - uniqueNumbers.length > 0) {
        report.issues.push({
          severity: 'high',
          issue: 'Duplicate ticket numbers',
          details: {
            total: numbers.length,
            unique: uniqueNumbers.length,
            duplicates: numbers.length - uniqueNumbers.length
          },
          root_cause: 'Ticket number generation not atomic, race condition likely'
        });
      }
    } catch (err) {
      report.tests.ticket_numbering = { status: 'failed', error: err.message };
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 7: CREATE TEST TICKET - End-to-end test
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🧪 TEST 7: CREATE TEST TICKET');
    try {
      const testTicketResult = await base44.functions.invoke('createSupportTicket', {
        subject: '[DIAGNOSTIC] Test Ticket',
        description: 'This is a diagnostic test ticket created by the forensic analysis tool.',
        category: 'technical',
        priority: 'normal'
      });
      
      report.tests.create_ticket = {
        status: 'completed',
        success: testTicketResult.success,
        ticket: testTicketResult.ticket,
        skipped_email: testTicketResult.skipped_email
      };

      console.log(`✅ Test ticket created: ${testTicketResult.ticket?.ticket_number}`);
      
      if (testTicketResult.skipped_email) {
        report.issues.push({
          severity: 'medium',
          issue: 'Email skipped during ticket creation',
          details: testTicketResult,
          root_cause: 'User email preferences blocking confirmation email'
        });
      }
    } catch (err) {
      report.tests.create_ticket = { status: 'failed', error: err.message };
      report.issues.push({
        severity: 'critical',
        issue: 'Cannot create ticket',
        error: err.message
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    const criticalIssues = report.issues.filter(i => i.severity === 'critical');
    const highIssues = report.issues.filter(i => i.severity === 'high');
    const mediumIssues = report.issues.filter(i => i.severity === 'medium');

    report.summary = {
      total_issues: report.issues.length,
      critical: criticalIssues.length,
      high: highIssues.length,
      medium: mediumIssues.length,
      tests_passed: Object.values(report.tests).filter(t => t.status === 'completed').length,
      tests_failed: Object.values(report.tests).filter(t => t.status === 'failed').length
    };

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 FORENSIC ANALYSIS COMPLETE');
    console.log(`Total Issues: ${report.summary.total_issues}`);
    console.log(`  🔴 Critical: ${criticalIssues.length}`);
    console.log(`  🟠 High: ${highIssues.length}`);
    console.log(`  🟡 Medium: ${mediumIssues.length}`);
    console.log(`Tests: ${report.summary.tests_passed} passed, ${report.summary.tests_failed} failed`);
    console.log('═══════════════════════════════════════════════════════════════');

    return Response.json(report, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ FORENSIC ANALYSIS FAILED:', error);
    return Response.json({
      error: 'Forensic analysis failed',
      message: error.message,
      stack: error.stack,
      partial_report: report
    }, { status: 500 });
  }
});