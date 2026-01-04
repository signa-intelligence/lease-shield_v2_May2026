import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';
import { requireAuth, safeLog } from './authGuards.js';

// Risk theme mapping - consistent UI and PDF colors
function getRiskTheme(riskScore) {
  if (riskScore >= 70) {
    return {
      level: 'HIGH',
      color: [239, 68, 68], // Red RGB
      bgColor: [254, 226, 226],
      textColor: [127, 29, 29]
    };
  }
  if (riskScore >= 40) {
    return {
      level: 'MEDIUM',
      color: [245, 158, 11], // Amber RGB
      bgColor: [254, 243, 199],
      textColor: [146, 64, 14]
    };
  }
  return {
    level: 'LOW',
    color: [16, 185, 129], // Green RGB
    bgColor: [209, 250, 229],
    textColor: [6, 78, 59]
  };
}

Deno.serve(async (req) => {
  const correlationId = `pdf-gen-${Date.now()}`;
  
  try {
    // SECURITY FIX: Use centralized auth guard
    const { user, base44 } = await requireAuth(req);

    const { scanData, language = 'en', correlationId: clientCorrelationId } = await req.json();
    const trackingId = clientCorrelationId || correlationId;
    
    // SECURITY FIX: Redact PII from logs
    await safeLog('PDF_GENERATION_START', {
      userId: user.id,
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

    // Helper: render bullet list from array safely (strip leading symbols)
    const addList = (items, x = 25, fontSize = 9, max = 5) => {
      const arr = Array.isArray(items) ? items.slice(0, max) : [];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      arr.forEach((raw) => {
        const line = String(raw || '').replace(/^\s*[•\-–—!*→]+\s*/g, '').trim();
        if (!line) return;
        if (y > pageHeight - 15) { doc.addPage(); y = 20; }
        doc.text(`• ${line}`, x, y);
        y += fontSize * 0.6;
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

    // Risk Score with theme-based coloring
    const riskTheme = getRiskTheme(scanData.risk_score);
    doc.setFillColor(...riskTheme.color);
    doc.roundedRect(20, y, pageWidth - 40, 30, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Risk Assessment - ${riskTheme.level} RISK`, 25, y + 10);
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
        doc.text(`Monthly Rent: ${String.fromCharCode(3647)}${terms.rent_amount.toLocaleString('en-US')}`, 25, y);
        y += 6;
      }
      if (terms.deposit_amount) {
        doc.text(`Security Deposit: ${String.fromCharCode(3647)}${terms.deposit_amount.toLocaleString('en-US')}`, 25, y);
        y += 6;
      }
      if (terms.start_date && terms.end_date) {
        doc.text(`Lease Period: ${terms.start_date} to ${terms.end_date}`, 25, y);
        y += 6;
      }
      y += 10;
    }

    // Coverage Summary (Taxonomy 30 categories)
    const cov = scanData.coverage_summary;
    if (cov && typeof cov.total_categories === 'number') {
      if (y > pageHeight - 50) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.text('Coverage Summary (30 Categories)', 20, y); y += 8;
      doc.setFontSize(10); doc.setFont('helvetica','normal');
      doc.text(`Total categories: ${cov.total_categories}`, 25, y); y += 6;
      doc.text(`Present: ${cov.present}`, 25, y); y += 6;
      doc.text(`Missing: ${cov.missing}`, 25, y); y += 6;
      doc.text(`Unclear: ${cov.unclear}`, 25, y); y += 10;
    } else {
      if (y > pageHeight - 30) { doc.addPage(); y = 20; }
      doc.setFontSize(10); doc.setFont('helvetica','normal');
      doc.text('Re-scan required for full coverage (taxonomy missing).', 20, y); y += 10;
    }

    // Risk Categories (from taxonomy) - main body
    const taxonomy = Array.isArray(scanData.taxonomy_report) ? scanData.taxonomy_report : [];
    const riskyCats = taxonomy.filter(t => t.risk_level && t.risk_level !== 'NO_RISK' && t.status === 'PRESENT');
    if (riskyCats.length > 0) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.text(`Risk Categories (${riskyCats.length})`, 20, y); y += 10;
      doc.setFont('helvetica','normal');
      riskyCats.forEach((t, idx) => {
        if (y > pageHeight - 45) { doc.addPage(); y = 20; }
        doc.setFontSize(11); doc.setFont('helvetica','bold');
        y = addText(`${idx + 1}. ${t.category_name}`, 20, 11, 'bold');
        doc.setFontSize(9); doc.setFont('helvetica','normal');
        y = addText(`Status: ${t.status}  •  Risk: ${t.risk_level}  •  Confidence: ${t.confidence}`, 25, 9);
        if (t.explanation) { y = addText(`Why: ${t.explanation}`, 25, 9); }
        if (t.detected_text_excerpt && t.detected_text_excerpt !== 'NOT FOUND') {
          y = addText(`Excerpt: ${t.detected_text_excerpt}`, 25, 9);
        }
        y += 6;
      });
    }

    // Clause Reviews (one per clause)
    const clauses = Array.isArray(scanData.clause_reviews) ? scanData.clause_reviews : [];
    if (clauses.length > 0) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Clause Reviews (${clauses.length})`, 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');

      clauses.forEach((c, idx) => {
        if (y > pageHeight - 50) { doc.addPage(); y = 20; }
        // Header line: Clause number and title
        doc.setFontSize(11); doc.setFont('helvetica','bold');
        const title = c.clause_title ? ` — ${c.clause_title}` : '';
        y = addText(`${idx + 1}. Clause ${c.clause_number}${title}`, 20, 11, 'bold');

        // Risk level
        doc.setFontSize(9); doc.setFont('helvetica','normal');
        y = addText(`Risk: ${c.risk_level}`, 25, 9);

        if (c.risk_level === 'NO_RISK') {
          y = addText('No risk detected.', 25, 9);
          y += 4;
          return;
        }

        // Why this matters
        if (c.why_this_matters) {
          doc.setFont('helvetica','bold'); doc.text('Why this matters:', 25, y); y += 5;
          doc.setFont('helvetica','normal');
          y = addText(c.why_this_matters, 25, 9);
        }

        // Recommended action
        if (c.recommended_action) {
          doc.setFont('helvetica','bold'); doc.text('Recommended action:', 25, y); y += 5;
          doc.setFont('helvetica','normal');
          y = addText(c.recommended_action, 25, 9);
        }

        // Low confidence note
        if (typeof c.confidence === 'number' && c.confidence < 0.6) {
          y = addText('Note: Low confidence – manual review recommended.', 25, 9);
        }

        y += 6;
      });
    }

    // Taxonomy Appendix: all 30 categories
    if (Array.isArray(scanData.taxonomy_report) && scanData.taxonomy_report.length === 30) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setFont('helvetica','bold');
      doc.text(`Taxonomy Appendix (All 30 Categories)`, 20, y); y += 8;
      doc.setFontSize(9); doc.setFont('helvetica','normal');
      scanData.taxonomy_report.forEach((t, idx) => {
        if (y > pageHeight - 12) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. ${t.category_name} — Risk: ${t.risk_level} — Conf: ${t.confidence} — Status: ${t.status}`, 25, y);
        y += 6;
      });
      y += 6;
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

    // Footer with legal disclaimer on every page
    const disclaimer = "This report is an automated risk review, not legal advice. It highlights potential issues based on Thai law and common practice but does not guarantee the absence of risk.";
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(disclaimer, pageWidth / 2, pageHeight - 14, { align: 'center', maxWidth: pageWidth - 40 });
      doc.setTextColor(150, 150, 150);
      doc.text(`Lease Shield - Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
    }

    // Generate and upload PDF
    await safeLog('PDF_GENERATING', { correlationId: trackingId });
    const pdfBytes = doc.output('arraybuffer');
    
    await safeLog('PDF_BINARY_GENERATED', {
      sizeBytes: pdfBytes.byteLength,
      sizeMB: (pdfBytes.byteLength / 1024 / 1024).toFixed(2)
    });
    
    // Convert ArrayBuffer to File for upload
    const pdfFile = new File([pdfBytes], `LeaseShield-Report-${Date.now()}.pdf`, { 
      type: 'application/pdf' 
    });
    
    await safeLog('PDF_UPLOADING', {
      fileName: pdfFile.name,
      fileSize: pdfFile.size
    });
    
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ 
      file: pdfFile 
    });
    
    await safeLog('PDF_UPLOADED', { success: true });

    return Response.json({ 
      success: true, 
      pdf_url: uploadResult.file_url,
      correlationId: trackingId
    });

  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // SECURITY FIX: Don't expose error details to client
    console.error('[PDF_ERROR]', { error: error.message, correlationId });
    
    return Response.json({ 
      success: false, 
      error: 'PDF generation failed. Please try again.',
      correlationId
    }, { status: 500 });
  }
});