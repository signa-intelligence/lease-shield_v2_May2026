import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data
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

    // === COVER PAGE ===
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

    // Quick Stats Box
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

    // === PERSONAL INFORMATION ===
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

    // === SUBSCRIPTION INFORMATION ===
    addSectionHeader('Subscription Details');
    addKeyValue('Current Plan', (user.plan_tier || 'free').toUpperCase());
    addKeyValue('Subscription Status', user.subscription_status || 'active');
    addKeyValue('Billing Interval', user.billing_interval || 'N/A');
    addKeyValue('Plan Renews On', user.plan_renews_at ? new Date(user.plan_renews_at).toLocaleDateString() : 'N/A');
    addKeyValue('Letter Credits Balance', user.letter_credits || 0);
    addKeyValue('Account Created', new Date(user.created_date).toLocaleDateString());
    yPos += 5;

    // === NOTIFICATION PREFERENCES ===
    addSectionHeader('Notification Preferences');
    addKeyValue('Email Notifications', user.email_notifications ? 'Enabled' : 'Disabled');
    addKeyValue('LINE Notifications', user.line_notifications ? 'Enabled' : 'Disabled');
    addKeyValue('LINE Connected', user.line_messaging_token ? 'Yes' : 'No');
    yPos += 5;

    // === CONTACT INFORMATION ===
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

    // === LEASE AGREEMENTS ===
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

    // === SECURITY DEPOSITS ===
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
        addKeyValue('Paid Date', deposit.deposit_pai