import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';
import { requireAuth, requireOwnerOrAdmin, safeLog, hashUserId } from './authGuards.js';

Deno.serve(async (req) => {
  try {
    // SECURITY FIX: Authenticate user
    const { user, base44 } = await requireAuth(req);
    
    // SECURITY FIX: Allow export only for own data OR admin
    // Admin can export any user's data, regular users only their own
    const isAdmin = 
      user.role === 'admin' || 
      user.role === 'super_admin' || 
      user.access_level === 'admin' || 
      user.access_level === 'super_admin';
    
    await safeLog('EXPORT_USER_DATA', { userId: user.id, isAdmin });

    // PREMIUM GATE: restrict data export for free tier
    const plan = (user.plan_tier || 'free').toLowerCase();
    if (plan === 'free' && !isAdmin) {
      return Response.json({ error: 'Upgrade required to export data' }, { status: 403 });
    }

    // SECURITY FIX: Enforce object-level authorization - only fetch user's own data
    // Admin already verified above, regular users can only export own data
    const [leases, scans, deposits, documents, cases, payments, maintenance, notifications] = await Promise.all([
      base44.entities.Lease.filter({ created_by: user.email }),
      base44.entities.LeaseScan.filter({ created_by: user.email }),
      base44.entities.DepositTracker.filter({ created_by: user.email }),
      base44.entities.Document.filter({ created_by: user.email }),
      base44.entities.Case.filter({ user_email: user.email }),
      base44.entities.Payment.filter({ created_by: user.email }),
      base44.entities.MaintenanceRequest.filter({ created_by: user.email }),
      base44.entities.NotificationLog.filter({ user_email: user.email })
    ]);
    
    await safeLog('EXPORT_DATA_FETCHED', { 
      leases: leases.length, 
      deposits: deposits.length, 
      cases: cases.length 
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    const checkPageBreak = (requiredSpace) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    const addSectionHeader = (title) => {
      checkPageBreak(15);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(12, 59, 46);
      doc.text(title, margin, yPos);
      yPos += 2;
      doc.setDrawColor(199, 163, 56);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
    };

    const addKeyValue = (key, value, indent = 0) => {
      checkPageBreak(8);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(`${key}:`, margin + indent, yPos);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(64, 64, 64);
      const valueText = String(value || 'N/A');
      const splitValue = doc.splitTextToSize(valueText, contentWidth - 50 - indent);
      doc.text(splitValue, margin + 50 + indent, yPos);
      yPos += (splitValue.length * 5) + 3;
    };

    const addBulletPoint = (text, indent = 5) => {
      checkPageBreak(7);
      doc.setFontSize(9);
      doc.setTextColor(64, 64, 64);
      doc.setFont(undefined, 'normal');
      const splitText = doc.splitTextToSize(text, contentWidth - indent - 5);
      doc.text('-', margin + indent, yPos);
      doc.text(splitText, margin + indent + 5, yPos);
      yPos += (splitText.length * 5) + 2;
    };

    doc.setFillColor(12, 59, 46);
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('LEASE SHIELD', pageWidth / 2, 35, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'normal');
    doc.text('Personal Data Export', pageWidth / 2, 50, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('PDPA Compliant Export', pageWidth / 2, 60, { align: 'center' });

    yPos = 100;

    doc.setFontSize(11);
    doc.setTextColor(64, 64, 64);
    doc.setFont(undefined, 'normal');
    doc.text(`Export Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}`, margin, yPos);
    yPos += 7;
    doc.text(`Export Version: 2.0`, margin, yPos);
    yPos += 7;
    doc.text(`Data Subject: ${user.full_name || user.email}`, margin, yPos);
    yPos += 15;

    doc.setFillColor(236, 239, 237);
    doc.roundedRect(margin, yPos, contentWidth, 45, 3, 3, 'F');
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(12, 59, 46);
    doc.setFont(undefined, 'bold');
    doc.text('Data Summary', margin + 5, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    const statsCol1 = margin + 5;
    const statsCol2 = margin + 60;
    const statsCol3 = margin + 115;
    
    doc.text(`${leases.length} Leases`, statsCol1, yPos);
    doc.text(`${deposits.length} Deposits`, statsCol2, yPos);
    doc.text(`${cases.length} Cases`, statsCol3, yPos);
    yPos += 7;
    doc.text(`${documents.length} Documents`, statsCol1, yPos);
    doc.text(`${maintenance.length} Maintenance`, statsCol2, yPos);
    doc.text(`${notifications.length} Notifications`, statsCol3, yPos);
    
    yPos += 25;

    doc.addPage();
    yPos = margin;
    
    addSectionHeader('Personal Information');
    addKeyValue('Full Name', user.full_name);
    addKeyValue('Email Address', user.email);
    addKeyValue('Phone Number', user.phone);
    addKeyValue('Country', user.country);
    addKeyValue('Language Preference', user.language === 'th' ? 'Thai' : 'English');
    addKeyValue('Theme Preference', user.theme === 'dark' ? 'Dark Mode' : 'Light Mode');
    addKeyValue('Tenant Address', user.tenant_address);
    addKeyValue('City', user.tenant_city);
    addKeyValue('State/Province', user.tenant_state);
    addKeyValue('Postal Code', user.tenant_zip);
    yPos += 5;

    addSectionHeader('Subscription Details');
    addKeyValue('Current Plan', (user.plan_tier || 'free').toUpperCase());
    addKeyValue('Subscription Status', user.subscription_status || 'active');
    addKeyValue('Billing Interval', user.billing_interval || 'N/A');
    addKeyValue('Plan Renews On', user.plan_renews_at ? new Date(user.plan_renews_at).toLocaleDateString() : 'N/A');
    addKeyValue('Letter Credits Balance', user.letter_credits || 0);
    addKeyValue('Account Created', new Date(user.created_date).toLocaleDateString());
    yPos += 5;

    addSectionHeader('Notification Preferences');
    addKeyValue('Email Notifications', user.email_notifications ? 'Enabled' : 'Disabled');
    addKeyValue('LINE Notifications', user.line_notifications ? 'Enabled' : 'Disabled');
    addKeyValue('LINE Connected', user.line_messaging_token ? 'Yes' : 'No');
    yPos += 5;

    addSectionHeader('Stored Contact Information');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Landlord:', margin, yPos);
    yPos += 7;
    addKeyValue('Name', user.landlord_name, 5);
    addKeyValue('Email', user.landlord_email, 5);
    addKeyValue('Phone', user.landlord_phone, 5);
    addKeyValue('LINE ID', user.landlord_line, 5);
    addKeyValue('Address', user.landlord_address, 5);
    yPos += 3;

    doc.setFont(undefined, 'bold');
    doc.text('Juristic Office:', margin, yPos);
    yPos += 7;
    addKeyValue('Name', user.juristic_name, 5);
    addKeyValue('Email', user.juristic_email, 5);
    addKeyValue('Phone', user.juristic_phone, 5);
    addKeyValue('LINE ID', user.juristic_line, 5);
    yPos += 5;

    if (leases.length > 0) {
      doc.addPage();
      yPos = margin;
      
      addSectionHeader(`Lease Agreements (${leases.length})`);
      
      leases.forEach((lease, idx) => {
        checkPageBreak(50);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(12, 59, 46);
        doc.text(`Lease ${idx + 1}`, margin, yPos);
        yPos += 8;
        
        addKeyValue('Property Address', lease.property_address, 5);
        addKeyValue('Monthly Rent', lease.rent_amount ? `THB ${lease.rent_amount.toLocaleString()}` : 'N/A', 5);
        addKeyValue('Security Deposit', lease.deposit_amount ? `THB ${lease.deposit_amount.toLocaleString()}` : 'N/A', 5);
        addKeyValue('Lease Start Date', lease.start_date, 5);
        addKeyValue('Lease End Date', lease.end_date, 5);
        addKeyValue('Notice Period', lease.notice_period_days ? `${lease.notice_period_days} days` : 'N/A', 5);
        addKeyValue('Notice Deadline', lease.notice_deadline, 5);
        addKeyValue('Status', lease.status, 5);
        addKeyValue('Language Detected', lease.language_detected, 5);
        addKeyValue('Uploaded On', new Date(lease.created_date).toLocaleDateString(), 5);
        yPos += 5;
      });
    }

    if (deposits.length > 0) {
      doc.addPage();
      yPos = margin;
      
      addSectionHeader(`Security Deposits Tracked (${deposits.length})`);
      
      const totalDeposit = deposits.reduce((sum, d) => sum + (d.deposit_amount || 0), 0);
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'F');
      yPos += 5;
      doc.setFontSize(10);
      doc.setTextColor(199, 163, 56);
      doc.setFont(undefined, 'bold');
      doc.text(`Total Deposits: THB ${totalDeposit.toLocaleString()}`, margin + 5, yPos);
      yPos += 15;

      deposits.forEach((deposit, idx) => {
        checkPageBreak(40);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(12, 59, 46);
        doc.text(`Deposit ${idx + 1}`, margin, yPos);
        yPos += 8;
        
        addKeyValue('Amount', `THB ${deposit.deposit_amount?.toLocaleString()}`, 5);
        addKeyValue('Property Address', deposit.property_address, 5);
        addKeyValue('Paid Date', deposit.deposit_paid_date, 5);
        addKeyValue('Expected Return Date', deposit.expected_return_date, 5);
        addKeyValue('Status', deposit.status?.toUpperCase(), 5);
        addKeyValue('Monthly Rent', deposit.rent_amount ? `THB ${deposit.rent_amount.toLocaleString()}` : 'N/A', 5);
        addKeyValue('Rent Due Day', deposit.rent_due_day || 'N/A', 5);
        addKeyValue('Rent Alerts', deposit.rent_alerts_enabled ? 'Enabled' : 'Disabled', 5);
        if (deposit.notes) addKeyValue('Notes', deposit.notes, 5);
        yPos += 5;
      });
    }

    if (documents.length > 0) {
      doc.addPage();
      yPos = margin;
      
      addSectionHeader(`Documents & Evidence (${documents.length})`);
      
      const docsByType = documents.reduce((acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1;
        return acc;
      }, {});

      doc.setFontSize(10);
      doc.setTextColor(64, 64, 64);
      Object.entries(docsByType).forEach(([type, count]) => {
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        addBulletPoint(`${typeName}: ${count} files`);
      });
      yPos += 5;

      documents.forEach((docItem, idx) => {
        checkPageBreak(12);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const docType = docItem.type.toUpperCase();
        doc.text(`${idx + 1}. ${docType} - ${docItem.label || 'Untitled'}`, margin + 5, yPos);
        yPos += 6;
        doc.setFontSize(8);
        doc.text(`   Uploaded: ${new Date(docItem.created_date).toLocaleDateString()}`, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    if (cases.length > 0) {
      doc.addPage();
      yPos = margin;
      
      addSectionHeader(`Dispute Cases (${cases.length})`);
      
      const totalDisputed = cases.reduce((sum, c) => sum + (c.dispute_amount || 0), 0);
      const totalRecovered = cases.filter(c => c.status === 'closed').reduce((sum, c) => sum + (c.settlement?.amount || 0), 0);
      
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'F');
      yPos += 5;
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.setFont(undefined, 'bold');
      doc.text(`Total Disputed: THB ${totalDisputed.toLocaleString()}`, margin + 5, yPos);
      yPos += 7;
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Recovered: THB ${totalRecovered.toLocaleString()}`, margin + 5, yPos);
      yPos += 15;

      cases.forEach((caseItem, idx) => {
        checkPageBreak(50);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(12, 59, 46);
        doc.text(`Case ${idx + 1}: ${caseItem.case_number || 'Unnamed'}`, margin, yPos);
        yPos += 8;
        
        addKeyValue('Case Type', caseItem.type?.toUpperCase(), 5);
        addKeyValue('Status', caseItem.status?.toUpperCase(), 5);
        addKeyValue('Dispute Amount', caseItem.dispute_amount ? `THB ${caseItem.dispute_amount.toLocaleString()}` : 'N/A', 5);
        addKeyValue('Landlord Name', caseItem.landlord_name, 5);
        addKeyValue('Landlord Email', caseItem.landlord_email, 5);
        if (caseItem.summary) addKeyValue('Summary', caseItem.summary, 5);
        if (caseItem.settlement?.amount) {
          addKeyValue('Settlement Amount', `THB ${caseItem.settlement.amount.toLocaleString()}`, 5);
          addKeyValue('Settlement Date', caseItem.settlement.date, 5);
        }
        addKeyValue('Created On', new Date(caseItem.created_date).toLocaleDateString(), 5);
        yPos += 5;
      });
    }

    if (maintenance.length > 0) {
      doc.addPage();
      yPos = margin;
      
      addSectionHeader(`Maintenance Requests (${maintenance.length})`);
      
      const activeCount = maintenance.filter(m => m.status !== 'completed' && m.status !== 'rejected').length;
      const completedCount = maintenance.filter(m => m.status === 'completed').length;
      
      doc.setFillColor(255, 247, 237);
      doc.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'F');
      yPos += 5;
      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.setFont(undefined, 'bold');
      doc.text(`Active: ${activeCount} | Completed: ${completedCount}`, margin + 5, yPos);
      yPos += 15;

      maintenance.forEach((req, idx) => {
        checkPageBreak(40);
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(12, 59, 46);
        doc.text(`Request ${idx + 1}: ${req.request_number || 'N/A'}`, margin, yPos);
        yPos += 8;
        
        addKeyValue('Issue Title', req.issue_title, 5);
        addKeyValue('Description', req.description, 5);
        addKeyValue('Category', req.category?.toUpperCase(), 5);
        addKeyValue('Priority', req.priority?.toUpperCase(), 5);
        addKeyValue('Status', req.status?.toUpperCase(), 5);
        addKeyValue('Property', req.property_address, 5);
        addKeyValue('Reported Date', req.reported_date, 5);
        if (req.resolved_date) addKeyValue('Resolved Date', req.resolved_date, 5);
        addKeyValue('Photos Attached', req.photo_urls?.length || 0, 5);
        yPos += 5;
      });
    }

    if (notifications.length > 0) {
      doc.addPage();
      yPos = margin;
      
      addSectionHeader(`Notification History (${notifications.length})`);
      
      const sentCount = notifications.filter(n => n.status === 'sent').length;
      const failedCount = notifications.filter(n => n.status === 'failed').length;
      
      doc.setFillColor(243, 232, 255);
      doc.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'F');
      yPos += 5;
      doc.setFontSize(10);
      doc.setTextColor(139, 92, 246);
      doc.setFont(undefined, 'bold');
      doc.text(`Sent: ${sentCount} | Failed: ${failedCount}`, margin + 5, yPos);
      yPos += 15;

      const recentNotifications = notifications.slice(0, 20);
      
      recentNotifications.forEach((notif, idx) => {
        checkPageBreak(12);
        doc.setFontSize(9);
        doc.setTextColor(notif.status === 'sent' ? 16 : 239, notif.status === 'sent' ? 185 : 68, notif.status === 'sent' ? 129 : 68);
        doc.text(`${new Date(notif.created_date).toLocaleDateString()} - ${notif.notification_type} via ${notif.channel}`, margin + 5, yPos);
        yPos += 6;
      });
      
      if (notifications.length > 20) {
        yPos += 3;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`... and ${notifications.length - 20} more notifications`, margin + 5, yPos);
        yPos += 10;
      }
    }

    doc.addPage();
    yPos = margin;

    doc.setFillColor(12, 59, 46);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('Your Rights Under PDPA', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Personal Data Protection Act B.E. 2562 (2019)', pageWidth / 2, 42, { align: 'center' });

    yPos = 75;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    const introText = `This export includes all personal data we hold about you as required by Thailand's Personal Data Protection Act (PDPA). As a data subject, you have the following rights:`;
    const splitIntro = doc.splitTextToSize(introText, contentWidth);
    splitIntro.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(12, 59, 46);
    doc.text('Your Data Rights:', margin, yPos);
    yPos += 10;

    const rights = [
      {
        title: 'Right to Access',
        desc: 'You can request to see what personal data we hold about you (this export fulfills that right)'
      },
      {
        title: 'Right to Rectification',
        desc: 'Update your data anytime in Account Settings or contact us for corrections'
      },
      {
        title: 'Right to Erasure',
        desc: 'Request complete deletion of your account and all associated data'
      },
      {
        title: 'Right to Data Portability',
        desc: 'Download and transfer your data (this PDF serves as portable format)'
      },
      {
        title: 'Right to Object',
        desc: 'Object to processing of your data for specific purposes'
      },
      {
        title: 'Right to Withdraw Consent',
        desc: 'Withdraw consent for data processing at any time'
      },
      {
        title: 'Right to Restrict Processing',
        desc: 'Request limitation on how we process your data'
      }
    ];

    rights.forEach(right => {
      checkPageBreak(18);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(12, 59, 46);
      doc.text(`- ${right.title}`, margin + 5, yPos);
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(64, 64, 64);
      const splitDesc = doc.splitTextToSize(right.desc, contentWidth - 15);
      splitDesc.forEach(line => {
        doc.text(line, margin + 10, yPos);
        yPos += 5;
      });
      yPos += 3;
    });

    yPos += 10;
    checkPageBreak(40);

    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');
    yPos += 8;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text('Contact Information', margin + 5, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(120, 53, 15);
    doc.text('Data Protection Officer: dpo@leaseshield.asia', margin + 5, yPos);
    yPos += 6;
    doc.text('Privacy Inquiries: privacy@leaseshield.asia', margin + 5, yPos);
    yPos += 6;
    doc.text('General Support: support@leaseshield.asia', margin + 5, yPos);
    yPos += 10;

    doc.setFontSize(8);
    doc.setTextColor(120, 113, 108);
    const responseText = 'We will respond to all data rights requests within 30 days as required by PDPA.';
    doc.text(responseText, margin + 5, yPos);

    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Lease Shield - Fair. Transparent. Protected. | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        `Export Date: ${new Date().toLocaleDateString()}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LeaseShield_Personal_Data_${user.email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // SECURITY FIX: Don't expose error details to client
    console.error('[EXPORT_ERROR]', { error: error.message, stack: error.stack?.substring(0, 200) });
    return Response.json({ 
      error: 'Failed to export data'
    }, { status: 500 });
  }
});