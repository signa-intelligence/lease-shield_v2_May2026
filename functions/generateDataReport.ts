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
    const [leases, deposits, cases, documents, maintenance] = await Promise.all([
      base44.entities.Lease.filter({ created_by: user.email }),
      base44.entities.DepositTracker.filter({ created_by: user.email }),
      base44.entities.Case.filter({ user_email: user.email }),
      base44.entities.Document.filter({ created_by: user.email }),
      base44.entities.MaintenanceRequest.filter({ created_by: user.email })
    ]);

    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = 280;
    const lineHeight = 7;

    const checkNewPage = () => {
      if (yPos > pageHeight) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Title
    doc.setFontSize(24);
    doc.setTextColor(12, 59, 46);
    doc.text('Lease Shield Report', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
    doc.text(`User: ${user.full_name || user.email}`, 20, yPos + 5);
    yPos += 20;

    // Summary Stats
    doc.setFontSize(16);
    doc.setTextColor(12, 59, 46);
    doc.text('Summary', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Active Leases: ${leases.length}`, 30, yPos);
    yPos += lineHeight;
    doc.text(`Deposits Tracked: ${deposits.length}`, 30, yPos);
    yPos += lineHeight;
    doc.text(`Active Cases: ${cases.length}`, 30, yPos);
    yPos += lineHeight;
    doc.text(`Documents Stored: ${documents.length}`, 30, yPos);
    yPos += lineHeight;
    doc.text(`Maintenance Requests: ${maintenance.length}`, 30, yPos);
    yPos += 15;

    checkNewPage();

    // Leases
    if (leases.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(12, 59, 46);
      doc.text('Lease Agreements', 20, yPos);
      yPos += 10;

      leases.forEach((lease, idx) => {
        checkNewPage();
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${idx + 1}. ${lease.property_address || 'Lease Agreement'}`, 30, yPos);
        yPos += lineHeight;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        if (lease.start_date) doc.text(`Start: ${lease.start_date}`, 35, yPos);
        if (lease.end_date) doc.text(`End: ${lease.end_date}`, 100, yPos);
        yPos += lineHeight;
        if (lease.rent_amount) doc.text(`Rent: ฿${lease.rent_amount.toLocaleString()}`, 35, yPos);
        if (lease.deposit_amount) doc.text(`Deposit: ฿${lease.deposit_amount.toLocaleString()}`, 100, yPos);
        yPos += lineHeight + 3;
      });

      yPos += 10;
    }

    checkNewPage();

    // Deposits
    if (deposits.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(12, 59, 46);
      doc.text('Security Deposits', 20, yPos);
      yPos += 10;

      deposits.forEach((deposit, idx) => {
        checkNewPage();
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${idx + 1}. ฿${deposit.deposit_amount?.toLocaleString() || '0'}`, 30, yPos);
        yPos += lineHeight;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        if (deposit.property_address) doc.text(`Property: ${deposit.property_address}`, 35, yPos);
        yPos += lineHeight;
        if (deposit.expected_return_date) doc.text(`Expected Return: ${deposit.expected_return_date}`, 35, yPos);
        yPos += lineHeight;
        doc.text(`Status: ${deposit.status || 'tracking'}`, 35, yPos);
        yPos += lineHeight + 3;
      });

      yPos += 10;
    }

    checkNewPage();

    // Cases
    if (cases.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(12, 59, 46);
      doc.text('Dispute Cases', 20, yPos);
      yPos += 10;

      cases.forEach((caseItem, idx) => {
        checkNewPage();
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${idx + 1}. ${caseItem.case_number || 'Case'}`, 30, yPos);
        yPos += lineHeight;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        if (caseItem.type) doc.text(`Type: ${caseItem.type}`, 35, yPos);
        yPos += lineHeight;
        if (caseItem.dispute_amount) doc.text(`Amount: ฿${caseItem.dispute_amount.toLocaleString()}`, 35, yPos);
        yPos += lineHeight;
        doc.text(`Status: ${caseItem.status || 'open'}`, 35, yPos);
        yPos += lineHeight + 3;
      });

      yPos += 10;
    }

    checkNewPage();

    // Maintenance
    if (maintenance.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(12, 59, 46);
      doc.text('Maintenance Requests', 20, yPos);
      yPos += 10;

      maintenance.forEach((req, idx) => {
        checkNewPage();
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${idx + 1}. ${req.issue_title || 'Maintenance'}`, 30, yPos);
        yPos += lineHeight;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        if (req.category) doc.text(`Category: ${req.category}`, 35, yPos);
        yPos += lineHeight;
        if (req.status) doc.text(`Status: ${req.status}`, 35, yPos);
        yPos += lineHeight + 3;
      });
    }

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LeaseShield_Report_${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});