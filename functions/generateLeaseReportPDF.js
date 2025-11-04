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

    const { scanId, leaseId } = await req.json();

    if (!scanId || !leaseId) {
      return Response.json({ error: 'Missing scanId or leaseId' }, { status: 400 });
    }

    // Fetch scan and lease data
    const [scans, leases] = await Promise.all([
      base44.entities.LeaseScan.list(),
      base44.entities.Lease.list()
    ]);

    const scan = scans.find(s => s.id === scanId);
    const lease = leases.find(l => l.id === leaseId);

    if (!scan || !lease) {
      return Response.json({ error: 'Scan or lease not found' }, { status: 404 });
    }

    // Verify user owns this lease
    if (lease.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

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

    // Title
    doc.setFontSize(20);
    doc.setTextColor(12, 59, 46); // ls-forest
    doc.text('Lease Shield - Full Report', margin, yPos);
    yPos += 10;

    // Property details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Property: ${lease.property_address || 'N/A'}`, margin, yPos);
    yPos += 7;
    doc.text(`Risk Score: ${scan.risk_score}/100`, margin, yPos);
    yPos += 7;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 15;

    // Summary
    checkNewPage(30);
    doc.setFontSize(14);
    doc.setTextColor(12, 59, 46);
    doc.text('Summary', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const summaryLines = doc.splitTextToSize(scan.summary || 'No summary available', 170);
    doc.text(summaryLines, margin, yPos);
    yPos += (summaryLines.length * 7) + 10;

    // Flags
    if (scan.scan_full?.flags && scan.scan_full.flags.length > 0) {
      checkNewPage(40);
      doc.setFontSize(14);
      doc.setTextColor(12, 59, 46);
      doc.text('Issues Found', margin, yPos);
      yPos += 10;

      scan.scan_full.flags.forEach((flag, idx) => {
        checkNewPage(30);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${idx + 1}. ${flag.title || flag.category}`, margin, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Severity: ${flag.severity}`, margin + 5, yPos);
        yPos += 7;

        if (flag.description) {
          const descLines = doc.splitTextToSize(flag.description, 165);
          doc.text(descLines, margin + 5, yPos);
          yPos += (descLines.length * 7) + 5;
        }

        if (flag.recommendation) {
          doc.setTextColor(0, 0, 139);
          doc.text('Recommendation:', margin + 5, yPos);
          yPos += 5;
          const recLines = doc.splitTextToSize(flag.recommendation, 165);
          doc.text(recLines, margin + 5, yPos);
          yPos += (recLines.length * 7) + 5;
        }

        yPos += 5;
      });
    }

    // Next Steps
    checkNewPage(60);
    doc.setFontSize(14);
    doc.setTextColor(12, 59, 46);
    doc.text("What's Next?", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const steps = [
      '1. Review all flagged issues carefully and understand your rights',
      '2. Document everything - photos, communications, and receipts',
      '3. Use our letter templates to communicate with your landlord',
      '4. If issues persist, open a dispute case for professional support'
    ];

    steps.forEach(step => {
      checkNewPage();
      const stepLines = doc.splitTextToSize(step, 170);
      doc.text(stepLines, margin, yPos);
      yPos += (stepLines.length * 7) + 3;
    });

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="lease-report-${lease.id.slice(0, 8)}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    }, { status: 500 });
  }
});