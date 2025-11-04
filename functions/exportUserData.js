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
    const [leases, scans, deposits, documents, cases, payments, maintenanceRequests] = await Promise.all([
      base44.entities.Lease.filter({ created_by: user.email }),
      base44.entities.LeaseScan.list(),
      base44.entities.DepositTracker.filter({ created_by: user.email }),
      base44.entities.Document.filter({ created_by: user.email }),
      base44.entities.Case.filter({ created_by: user.email }),
      base44.entities.Payment.filter({ created_by: user.email }),
      base44.entities.MaintenanceRequest.filter({ created_by: user.email })
    ]);

    // Filter scans to only include user's leases
    const userLeaseIds = leases.map(l => l.id);
    const userScans = scans.filter(s => userLeaseIds.includes(s.lease_id));

    // Create PDF
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    const checkNewPage = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Header
    doc.setFontSize(24);
    doc.setTextColor(12, 59, 46); // ls-forest
    doc.text('Lease Shield Data Export', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 5;
    doc.text(`User: ${user.full_name} (${user.email})`, margin, yPos);
    yPos += 15;

    // Personal Information
    checkNewPage(40);
    doc.setFontSize(16);
    doc.setTextColor(12, 59, 46);
    doc.text('Personal Information', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const personalInfo = [
      `Full Name: ${user.full_name}`,
      `Email: ${user.email}`,
      `Phone: ${user.phone || 'Not provided'}`,
      `Country: ${user.country || 'Not provided'}`,
      `Language: ${user.language || 'en'}`,
      `Plan: ${user.plan_tier || 'free'}`,
      `Subscription Status: ${user.subscription_status || 'none'}`,
      `Account Created: ${new Date(user.created_date).toLocaleDateString()}`
    ];

    personalInfo.forEach(line => {
      checkNewPage();
      doc.text(line, margin + 5, yPos);
      yPos += 7;
    });
    yPos += 10;

    // Leases Summary
    checkNewPage(40);
    doc.setFontSize(16);
    doc.setTextColor(12, 59, 46);
    doc.text(`Leases (${leases.length})`, margin, yPos);
    yPos += 10;

    if (leases.length > 0) {
      leases.forEach((lease, idx) => {
        checkNewPage(30);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${idx + 1}. ${lease.property_address || 'Lease Agreement'}`, margin + 5, yPos);
        yPos += 7;
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        if (lease.rent_amount) doc.text(`   Rent: ฿${lease.rent_amount.toLocaleString()}/month`, margin + 5, yPos);
        yPos += 5;
        if (lease.deposit_amount) doc.text(`   Deposit: ฿${lease.deposit_amount.toLocaleString()}`, margin + 5, yPos);
        yPos += 5;
        if (lease.start_date && lease.end_date) {
          doc.text(`   Period: ${new Date(lease.start_date).toLocaleDateString()} - ${new Date(lease.end_date).toLocaleDateString()}`, margin + 5, yPos);
          yPos += 5;
        }
        doc.text(`   Status: ${lease.status}`, margin + 5, yPos);
        yPos += 10;
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No leases recorded', margin + 5, yPos);
      yPos += 10;
    }

    // Deposits Summary
    checkNewPage(40);
    doc.setFontSize(16);
    doc.setTextColor(12, 59, 46);
    doc.text(`Deposit Trackers (${deposits.length})`, margin, yPos);
    yPos += 10;

    if (deposits.length > 0) {
      deposits.forEach((deposit, idx) => {
        checkNewPage(25);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${idx + 1}. ฿${deposit.deposit_amount.toLocaleString()} - ${deposit.property_address || 'Property'}`, margin + 5, yPos);
        yPos += 7;
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`   Paid: ${new Date(deposit.deposit_paid_date).toLocaleDateString()}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`   Expected Return: ${new Date(deposit.expected_return_date).toLocaleDateString()}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`   Status: ${deposit.status}`, margin + 5, yPos);
        yPos += 10;
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No deposits tracked', margin + 5, yPos);
      yPos += 10;
    }

    // Documents Summary
    checkNewPage(40);
    doc.setFontSize(16);
    doc.setTextColor(12, 59, 46);
    doc.text(`Documents (${documents.length})`, margin, yPos);
    yPos += 10;

    if (documents.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`You have ${documents.length} documents in your Evidence Vault`, margin + 5, yPos);
      yPos += 7;
      
      const docTypes = {};
      documents.forEach(d => {
        docTypes[d.type] = (docTypes[d.type] || 0) + 1;
      });
      
      Object.entries(docTypes).forEach(([type, count]) => {
        checkNewPage();
        doc.text(`   ${type}: ${count}`, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 10;
    }

    // Cases Summary
    checkNewPage(40);
    doc.setFontSize(16);
    doc.setTextColor(12, 59, 46);
    doc.text(`Dispute Cases (${cases.length})`, margin, yPos);
    yPos += 10;

    if (cases.length > 0) {
      cases.forEach((caseItem, idx) => {
        checkNewPage(25);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${idx + 1}. Case #${caseItem.id.slice(0, 8)}`, margin + 5, yPos);
        yPos += 7;
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`   Type: ${caseItem.type}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`   Status: ${caseItem.status}`, margin + 5, yPos);
        yPos += 5;
        if (caseItem.dispute_amount) {
          doc.text(`   Amount: ฿${caseItem.dispute_amount.toLocaleString()}`, margin + 5, yPos);
          yPos += 5;
        }
        doc.text(`   Created: ${new Date(caseItem.created_date).toLocaleDateString()}`, margin + 5, yPos);
        yPos += 10;
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('No dispute cases', margin + 5, yPos);
      yPos += 10;
    }

    // Maintenance Requests
    checkNewPage(40);
    doc.setFontSize(16);
    doc.setTextColor(12, 59, 46);
    doc.text(`Maintenance Requests (${maintenanceRequests.length})`, margin, yPos);
    yPos += 10;

    if (maintenanceRequests.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total maintenance requests logged: ${maintenanceRequests.length}`, margin + 5, yPos);
      yPos += 10;
    }

    // Data Rights Information
    checkNewPage(60);
    doc.setFontSize(16);
    doc.setTextColor(12, 59, 46);
    doc.text('Your Data Rights (PDPA)', margin, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const rights = [
      'Right to Access: You are viewing your data now',
      'Right to Rectification: Update data in Account Settings',
      'Right to Erasure: Contact privacy@leaseshield.asia to delete your account',
      'Right to Data Portability: This PDF can be saved and shared',
      'Right to Object: Opt-out of notifications in Account Settings',
      'Right to Withdraw Consent: Contact us at any time'
    ];

    rights.forEach(right => {
      checkNewPage();
      doc.text(`• ${right}`, margin + 5, yPos);
      yPos += 7;
    });

    yPos += 10;
    checkNewPage(20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('For questions, contact: privacy@leaseshield.asia', margin, yPos);

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="lease_shield_data_export_${new Date().toISOString().split('T')[0]}.pdf"`
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