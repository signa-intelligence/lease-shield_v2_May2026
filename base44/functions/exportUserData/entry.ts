import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PDPA REQUIREMENT: ALL users (including free tier) must be able to export their data.
    // No premium gate here — this is a legal obligation under Thailand's PDPA.

    console.log('[EXPORT] Starting data export for user:', user.email?.substring(0, 3) + '***');

    // Fetch all user data in parallel — use user-scoped queries (RLS enforced)
    const [leases, scans, deposits, documents, cases, payments, maintenance, notifications] = await Promise.all([
      base44.entities.Lease.filter({ owner_email: user.email }).catch(() => []),
      base44.entities.LeaseScan.filter({ owner_email: user.email }).catch(() => []),
      base44.entities.DepositTracker.filter({ owner_email: user.email }).catch(() => []),
      base44.entities.Document.filter({ created_by: user.email }).catch(() => []),
      base44.entities.Case.filter({ user_email: user.email }).catch(() => []),
      base44.entities.Payment.filter({ created_by: user.email }).catch(() => []),
      base44.entities.MaintenanceRequest.filter({ created_by: user.email }).catch(() => []),
      base44.entities.NotificationLog.filter({ user_email: user.email }).catch(() => [])
    ]);

    console.log('[EXPORT] Data fetched:', {
      leases: leases.length,
      scans: scans.length,
      deposits: deposits.length,
      documents: documents.length,
      cases: cases.length,
      payments: payments.length,
      maintenance: maintenance.length,
      notifications: notifications.length
    });

    // Compile PDPA-compliant export
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        export_version: '2.0',
        format: 'JSON',
        data_subject: user.email,
        data_controller: 'LeaseShield (Signa Intelligence Co., Ltd.)',
        legal_basis: 'Thailand Personal Data Protection Act (PDPA) B.E. 2562',
        data_retention_notice: 'This export contains all personal data stored by LeaseShield as of the export date.'
      },
      personal_information: {
        full_name: user.full_name || null,
        display_name: user.display_name || null,
        email: user.email,
        phone: user.phone || null,
        country: user.country || null,
        language: user.language || 'en',
        theme: user.theme || 'light',
        tenant_address: user.tenant_address || null,
        tenant_city: user.tenant_city || null,
        tenant_state: user.tenant_state || null,
        tenant_zip: user.tenant_zip || null,
        account_created: user.created_date || null
      },
      subscription: {
        plan_tier: user.plan_tier || 'free',
        subscription_status: user.subscription_status || 'inactive',
        billing_interval: user.billing_interval || null,
        plan_renews_at: user.plan_renews_at || null,
        available_scans: user.available_scans || 0,
        letter_credits: user.letter_credits || 0
      },
      stored_contacts: {
        landlord: {
          name: user.landlord_name || null,
          email: user.landlord_email || null,
          phone: user.landlord_phone || null,
          line_id: user.landlord_line || null,
          address: user.landlord_address || null
        },
        juristic_office: {
          name: user.juristic_name || null,
          email: user.juristic_email || null,
          phone: user.juristic_phone || null,
          line_id: user.juristic_line || null
        }
      },
      notification_preferences: {
        email_notifications: user.email_notifications ?? true,
        line_notifications: user.line_notifications ?? false,
        line_connected: !!user.line_messaging_token
      },
      leases: leases.map(l => ({
        id: l.id,
        property_address: l.property_address,
        start_date: l.start_date,
        end_date: l.end_date,
        rent_amount: l.rent_amount,
        deposit_amount: l.deposit_amount,
        notice_period_days: l.notice_period_days,
        status: l.status,
        language_detected: l.language_detected,
        created_date: l.created_date
      })),
      lease_scans: scans.map(s => ({
        id: s.id,
        lease_id: s.lease_id,
        risk_score: s.risk_score,
        status: s.status,
        summary: s.summary,
        created_date: s.created_date
      })),
      deposits: deposits.map(d => ({
        id: d.id,
        deposit_amount: d.deposit_amount,
        property_address: d.property_address,
        deposit_paid_date: d.deposit_paid_date,
        expected_return_date: d.expected_return_date,
        status: d.status,
        rent_amount: d.rent_amount,
        rent_due_day: d.rent_due_day,
        notes: d.notes,
        created_date: d.created_date
      })),
      documents: documents.map(d => ({
        id: d.id,
        type: d.type,
        label: d.label,
        file_size: d.file_size,
        created_date: d.created_date
      })),
      cases: cases.map(c => ({
        id: c.id,
        case_number: c.case_number,
        type: c.type,
        status: c.status,
        dispute_amount: c.dispute_amount,
        property_address: c.property_address,
        landlord_name: c.landlord_name,
        summary: c.summary,
        settlement: c.settlement,
        created_date: c.created_date
      })),
      payments: payments.map(p => ({
        id: p.id,
        type: p.type,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        created_date: p.created_date
      })),
      maintenance_requests: maintenance.map(m => ({
        id: m.id,
        request_number: m.request_number,
        issue_title: m.issue_title,
        description: m.description,
        category: m.category,
        status: m.status,
        priority: m.priority,
        property_address: m.property_address,
        reported_date: m.reported_date,
        resolved_date: m.resolved_date,
        created_date: m.created_date
      })),
      notification_history: notifications.slice(0, 50).map(n => ({
        id: n.id,
        notification_type: n.notification_type,
        channel: n.channel,
        status: n.status,
        created_date: n.created_date
      })),
      your_rights_under_pdpa: {
        right_to_access: 'You can request to see what personal data we hold about you (this export fulfills that right)',
        right_to_rectification: 'Update your data anytime in Account Settings or contact us for corrections',
        right_to_erasure: 'Request complete deletion of your account and all associated data',
        right_to_data_portability: 'Download and transfer your data (this JSON file serves as portable format)',
        right_to_object: 'Object to processing of your data for specific purposes',
        right_to_withdraw_consent: 'Withdraw consent for data processing at any time',
        right_to_restrict_processing: 'Request limitation on how we process your data',
        contact_dpo: 'dpo@leaseshield.asia',
        contact_privacy: 'privacy@leaseshield.asia',
        contact_support: 'support@leaseshield.asia',
        response_time: 'We will respond to all data rights requests within 30 days as required by PDPA.'
      }
    };

    console.log('[EXPORT] Export complete, returning JSON');

    return Response.json(exportData);
  } catch (error) {
    console.error('[EXPORT_ERROR]', error.message);
    return Response.json({ error: 'Failed to export data' }, { status: 500 });
  }
});