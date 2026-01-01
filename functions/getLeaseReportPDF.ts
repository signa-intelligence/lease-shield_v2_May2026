import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  const correlationId = `pdf-direct-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${correlationId}] Unauthorized access attempt`);
      return new Response('Unauthorized', { status: 401 });
    }

    // Get leaseId from query params
    const url = new URL(req.url);
    const leaseId = url.searchParams.get('leaseId');
    const language = url.searchParams.get('language') || 'en';
    
    console.log(`[${correlationId}] PDF endpoint hit`, {
      userId: user.id,
      userEmail: user.email,
      leaseId,
      language
    });

    if (!leaseId) {
      console.error(`[${correlationId}] Missing leaseId parameter`);
      return new Response('Missing leaseId parameter', { status: 400 });
    }

    // Fetch lease data
    const leases = await base44.entities.Lease.list();
    const lease = leases.find(l => l.id === leaseId);

    if (!lease) {
      console.error(`[${correlationId}] Lease not found`, { leaseId });
      return new Response('Lease not found', { status: 404 });
    }

    // Fetch scan data
    const scans = await base44.entities.LeaseScan.list();
    const scan = scans.find(s => s.lease_id === leaseId);

    if (!scan) {
      console.error(`[${correlationId}] Scan not found for lease`, { leaseId });
      return new Response('Scan data not found', { status: 404 });
    }

    console.log(`[${correlationId}] Data loaded, generating PDF`, {
      leaseAddress: lease.property_address,
      riskScore: scan.risk_score
    });

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    // Helper function to add text with wrapping
    const addText = (text, x, fontSize, fontStyle = 'normal', maxWidth = pageWidth - 40) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach(line => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, x, y);
        y += fontSize * 0.5;
      });
      
      return y;
    };

    // Header
    doc.setFillColor(12, 59, 46);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('LEASE SHIELD', 20, 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Full Lease Report', 20, 33);

    y = 50;
    doc.setTextColor(0, 0, 0);

    // Property Address
    addText(lease.property_address || 'Lease Agreement', 20, 16, 'bold');
    y += 5;

    // Generated Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
    y += 15;

    // Risk Score
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(20, y, pageWidth - 40, 30, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Assessment', 25, y + 10);
    doc.setFontSize(20);
    doc.text(`Score: ${scan.risk_score}/100`, 25, y + 22);
    y += 40;

    doc.setTextColor(0, 0, 0);

    // Summary
    if (scan.summary) {
      y += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      y = addText(scan.summary, 20, 10);
      y += 10;
    }

    // Key Lease Terms
    const keyTerms = scan.scan_full?.key_terms || {};
    if (Object.keys(keyTerms).length > 0) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Lease Terms', 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      if (keyTerms.property_address) {
        doc.text(`Property: ${keyTerms.property_address}`, 25, y);
        y += 6;
      }
      if (keyTerms.rent_amount) {
        doc.text(`Monthly Rent: ${String.fromCharCode(3647)}${keyTerms.rent_amount.toLocaleString('en-US')}`, 25, y);
        y += 6;
      }
      if (keyTerms.deposit_amount) {
        doc.text(`Security Deposit: ${String.fromCharCode(3647)}${keyTerms.deposit_amount.toLocaleString('en-US')}`, 25, y);
        y += 6;
      }
      if (keyTerms.start_date && keyTerms.end_date) {
        doc.text(`Lease Period: ${keyTerms.start_date} to ${keyTerms.end_date}`, 25, y);
        y += 6;
      }
      y += 10;
    }

    // Detailed Issues
    const flags = scan.scan_full?.flags || [];
    if (flags.length > 0) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Detailed Issues (${flags.length})`, 20, y);
      y += 10;

      flags.forEach((flag, index) => {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
        }

        // Issue title
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        y = addText(`${index + 1}. ${flag.title}`, 20, 11, 'bold');
        
        // Severity badge
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const severityColors = {
          critical: [239, 68, 68],
          high: [245, 158, 11],
          medium: [234, 179, 8],
          low: [16, 185, 129]
        };
        const color = severityColors[flag.severity] || [100, 100, 100];
        doc.setFillColor(...color);
        doc.roundedRect(25, y, 25, 5, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(flag.severity.toUpperCase(), 27, y + 3.5);
        y += 8;
        doc.setTextColor(0, 0, 0);

        // Explanation
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        y = addText(flag.explanation, 25, 9);
        y += 3;

        // Recommendation
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(34, 139, 34);
        y = addText(`→ ${flag.recommendation}`, 25, 9);
        doc.setTextColor(0, 0, 0);
        y += 8;
      });
    }

    // Missing Protections
    const missingItems = scan.scan_full?.missing_items || [];
    if (missingItems.length > 0) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Missing Protections (${missingItems.length})`, 20, y);
      y += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      missingItems.forEach((item) => {
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 20;
        }
        y = addText(`• ${item}`, 25, 9);
        y += 2;
      });
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Lease Shield - Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Generate PDF binary
    console.log(`[${correlationId}] Generating PDF binary`);
    const pdfBytes = doc.output('arraybuffer');
    
    console.log(`[${correlationId}] PDF generated successfully`, {
      sizeBytes: pdfBytes.byteLength,
      sizeMB: (pdfBytes.byteLength / 1024 / 1024).toFixed(2)
    });

    // Return PDF as binary with proper headers
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LeaseShield-Report-${leaseId.substring(0, 8)}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error(`[${correlationId}] PDF generation error:`, {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      correlationId
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});