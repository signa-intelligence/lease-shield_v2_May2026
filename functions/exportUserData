import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data
    const [leases, scans, deposits, documents, cases, payments] = await Promise.all([
      base44.entities.Lease.filter({ created_by: user.email }),
      base44.entities.LeaseScan.list(),
      base44.entities.DepositTracker.filter({ created_by: user.email }),
      base44.entities.Document.filter({ created_by: user.email }),
      base44.entities.Case.filter({ created_by: user.email }),
      base44.entities.Payment.list()
    ]);

    // Filter scans to only include user's leases
    const userLeaseIds = leases.map(l => l.id);
    const userScans = scans.filter(s => userLeaseIds.includes(s.lease_id));

    // Filter payments
    const userCaseIds = cases.map(c => c.id);
    const userPayments = payments.filter(p => p.created_by === user.email);

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Helper to add section header
    const addSectionHeader = (title) => {
      checkPageBreak(15);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin, yPos);
      yPos += 10;
    };

    // Helper to add key-value pair
    const addKeyValue = (key, value) => {
      checkPageBreak(8);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`${key}:`, margin, yPos);
      doc.setFont(undefined, 'normal');
      const valueText = String(value || 'N/A');
      const splitValue = doc.splitTextToSize(valueText, contentWidth - 40);
      doc.text(splitValue, margin + 40, yPos);
      yPos += (splitValue.length * 5) + 3;
    };

    // Title Page
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Lease Shield', pageWidth / 2, 40, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Personal Data Export', pageWidth / 2, 50, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 60, { align: 'center' });
    doc.text(`Export Version: 1.0`, pageWidth / 2, 65, { align: 'center' });
    
    yPos = 80;

    // Personal Information
    addSectionHeader('Personal Information');
    addKeyValue('Name', user.full_name);
    addKeyValue('Email', user.email);
    addKeyValue('Phone', user.phone);
    addKeyValue('Country', user.country);
    addKeyValue('Language', user.language);
    addKeyValue('Plan', user.plan_tier?.toUpperCase());
    addKeyValue('Subscription Status', user.subscription_status);
    addKeyValue('Account Created', new Date(user.created_date).toLocaleDateString());
    yPos += 5;

    // Leases Summary
    addSectionHeader(`Leases (${leases.length})`);
    if (leases.length === 0) {
      doc.setFontSize(10);
      doc.text('No leases found', margin, yPos);
      yPos += 10;
    } else {
      leases.forEach((lease, idx) => {
        checkPageBreak(30);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Lease ${idx + 1}`, margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        addKeyValue('Property', lease.property_address);
        addKeyValue('Rent', `฿${lease.rent_amount?.toLocaleString() || 'N/A'}`);
        addKeyValue('Deposit', `฿${lease.deposit_amount?.toLocaleString() || 'N/A'}`);
        addKeyValue('Start Date', lease.start_date || 'N/A');
        addKeyValue('End Date', lease.end_date || 'N/A');
        addKeyValue('Status', lease.status);
        yPos += 3;
      });
    }

    // Deposits Summary
    addSectionHeader(`Security Deposits (${deposits.length})`);
    if (deposits.length === 0) {
      doc.setFontSize(10);
      doc.text('No deposits tracked', margin, yPos);
      yPos += 10;
    } else {
      deposits.forEach((deposit, idx) => {
        checkPageBreak(25);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Deposit ${idx + 1}`, margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        addKeyValue('Amount', `฿${deposit.deposit_amount?.toLocaleString()}`);
        addKeyValue('Property', deposit.property_address);
        addKeyValue('Paid Date', deposit.deposit_paid_date);
        addKeyValue('Expected Return', deposit.expected_return_date);
        addKeyValue('Status', deposit.status);
        yPos += 3;
      });
    }

    // Documents Summary
    addSectionHeader(`Documents (${documents.length})`);
    if (documents.length === 0) {
      doc.setFontSize(10);
      doc.text('No documents stored', margin, yPos);
      yPos += 10;
    } else {
      documents.forEach((docItem, idx) => {
        checkPageBreak(15);
        doc.setFontSize(9);
        addKeyValue(`Document ${idx + 1}`, `${docItem.type} - ${docItem.label || 'Untitled'}`);
      });
    }

    // Cases Summary
    if (cases.length > 0) {
      addSectionHeader(`Cases (${cases.length})`);
      cases.forEach((caseItem, idx) => {
        checkPageBreak(20);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Case ${idx + 1}`, margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        addKeyValue('Type', caseItem.type);
        addKeyValue('Status', caseItem.status);
        addKeyValue('Dispute Amount', `฿${caseItem.dispute_amount?.toLocaleString() || 'N/A'}`);
        addKeyValue('Created', new Date(caseItem.created_date).toLocaleDateString());
        yPos += 3;
      });
    }

    // Data Summary
    doc.addPage();
    yPos = margin;
    addSectionHeader('Data Summary');
    addKeyValue('Total Leases', leases.length);
    addKeyValue('Total Scans', userScans.length);
    addKeyValue('Total Deposits Tracked', deposits.length);
    addKeyValue('Total Documents', documents.length);
    addKeyValue('Total Cases', cases.length);
    addKeyValue('Total Payments', userPayments.length);

    // Rights Information
    yPos += 10;
    addSectionHeader('Your Rights Under PDPA');
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const rightsText = `This export includes all personal data we hold about you as required by Thailand's Personal Data Protection Act (PDPA).

Your Rights:
• Right to Access - You are viewing your data now
• Right to Rectification - Update data in Account Settings
• Right to Erasure - Contact privacy@leaseshield.asia
• Right to Data Portability - This PDF serves as portable data
• Right to Object - Opt-out via Account Settings
• Right to Withdraw Consent - Contact us anytime

Contact Information:
Email: privacy@leaseshield.asia
Data Protection Officer: dpo@leaseshield.asia

We will respond to all requests within 30 days as required by PDPA.`;

    const splitRights = doc.splitTextToSize(rightsText, contentWidth);
    splitRights.forEach(line => {
      checkPageBreak(6);
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Lease Shield - Fair. Transparent. Protected.', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Generate PDF as blob
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LeaseShield_Data_Export_${user.id}_${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('Data export error:', error);
    return Response.json({ 
      error: 'Failed to export data', 
      details: error.message 
    }, { status: 500 });
  }
});