import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  const correlationId = `pdf-gen-${Date.now()}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${correlationId}] Unauthorized access attempt`);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanData, language = 'en', correlationId: clientCorrelationId } = await req.json();
    const trackingId = clientCorrelationId || correlationId;
    
    console.log(`[${trackingId}] PDF generation started`, {
      userId: user.id,
      userEmail: user.email,
      language,
      hasScanData: !!scanData
    });

    if (!scanData) {
      console.error(`[${trackingId}] Missing scan data in request`);
      return Response.json({ error: 'Missing scan data' }, { status: 400 });
    }

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
    addText(scanData.lease_address || 'Lease Agreement', 20, 16, 'bold');
    y += 5;

    // Generated Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date(scanData.generated_date).toLocaleDateString()}`, 20, y);
    y += 15;

    // Risk Score
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(20, y, pageWidth - 40, 30, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Assessment', 25, y + 10);
    doc.setFontSize(20);
    doc.text(`Score: ${scanData.risk_score}/100`, 25, y + 22);
    y += 40;

    doc.setTextColor(0, 0, 0);

    // Summary
    if (scanData.summary) {
      y += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      y = addText(scanData.summary, 20, 10);
      y += 10;
    }

    // Key Lease Terms
    if (Object.keys(scanData.key_terms).length > 0) {
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

      const terms = scanData.key_terms;
      if (terms.property_address) {
        doc.text(`Property: ${terms.property_address}`, 25, y);
        y += 6;
      }
      if (terms.rent_amount) {
        doc.text(`Monthly Rent: ฿${terms.rent_amount.toLocaleString()}`, 25, y);
        y += 6;
      }
      if (terms.deposit_amount) {
        doc.text(`Security Deposit: ฿${terms.deposit_amount.toLocaleString()}`, 25, y);
        y += 6;
      }
      if (terms.start_date && terms.end_date) {
        doc.text(`Lease Period: ${terms.start_date} to ${terms.end_date}`, 25, y);
        y += 6;
      }
      y += 10;
    }

    // Detailed Issues
    if (scanData.flags && scanData.flags.length > 0) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Detailed Issues (${scanData.flags.length})`, 20, y);
      y += 10;

      scanData.flags.forEach((flag, index) => {
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
    if (scanData.missing_items && scanData.missing_items.length > 0) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Missing Protections (${scanData.missing_items.length})`, 20, y);
      y += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      scanData.missing_items.forEach((item, index) => {
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

    // Generate and upload PDF
    console.log(`[${trackingId}] Generating PDF binary`);
    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    console.log(`[${trackingId}] PDF binary generated`, {
      sizeBytes: pdfBytes.byteLength,
      sizeMB: (pdfBytes.byteLength / 1024 / 1024).toFixed(2)
    });
    
    // Upload to storage
    console.log(`[${trackingId}] Uploading PDF to storage`);
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ 
      file: pdfBlob 
    });
    
    console.log(`[${trackingId}] PDF uploaded successfully`, {
      fileUrl: uploadResult.file_url
    });

    return Response.json({ 
      success: true, 
      pdf_url: uploadResult.file_url,
      correlationId: trackingId
    });

  } catch (error) {
    console.error(`[${correlationId}] PDF generation error:`, {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return Response.json({ 
      success: false, 
      error: error.message,
      correlationId
    }, { status: 500 });
  }
});