import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';
import { requireAuth, safeLog } from './authGuards.js';
import { handleCors, ensureAllowedOrigin, err } from './http.js';

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
  
  const pre = handleCors(req); if (pre) return pre;
  const { allowed, requestId } = ensureAllowedOrigin(req); if (!allowed) return err(req, 'CORS_FORBIDDEN', 'Origin not allowed', 403, requestId);
  try {
    // SECURITY FIX: Use centralized auth guard
    const { user, base44 } = await requireAuth(req);

    const { scanData, language = 'en', correlationId: clientCorrelationId } = await req.json();

    // PREMIUM GATE: restrict PDF generation for free tier
    const plan = (user.plan_tier || 'free').toLowerCase();
    if (plan === 'free') {
      return Response.json({ error: 'Upgrade required to generate PDF' }, { status: 403 });
    }
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

    // =====================================================================
    // DETAILED ISSUES (PRIMARY DATA SOURCE - flags array)
    // This is the main content that renders ALL issues with recommendations
    // =====================================================================
    const flags = Array.isArray(scanData.flags) ? scanData.flags : [];
    
    if (flags.length > 0) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Detailed Issues (${flags.length})`, 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');

      // Sort by severity: critical, high, medium, low
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sortedFlags = [...flags].sort((a, b) => 
        (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
      );

      sortedFlags.forEach((flag, idx) => {
        // Page break check - ensure enough space for issue block
        if (y > pageHeight - 80) { doc.addPage(); y = 20; }
        
        // Issue title
        doc.setFontSize(11); doc.setFont('helvetica','bold');
        const title = flag.title || flag.description?.substring(0, 60) || `Issue ${idx + 1}`;
        y = addText(`${idx + 1}. ${title}`, 20, 11, 'bold');

        // Severity badge
        doc.setFontSize(9); doc.setFont('helvetica','normal');
        const severityLabel = (flag.severity || 'medium').toUpperCase();
        y = addText(`Severity: ${severityLabel}`, 25, 9);
        
        // Category
        if (flag.category) {
          y = addText(`Category: ${flag.category}`, 25, 9);
        }

        // Description / Impact
        if (flag.description) {
          if (y > pageHeight - 30) { doc.addPage(); y = 20; }
          doc.setFont('helvetica','bold'); doc.text('Impact:', 25, y); y += 5;
          doc.setFont('helvetica','normal');
          y = addText(flag.description, 25, 9);
        }

        // Explanation (why this matters)
        if (flag.explanation) {
          if (y > pageHeight - 30) { doc.addPage(); y = 20; }
          doc.setFont('helvetica','bold'); doc.text('Why this matters:', 25, y); y += 5;
          doc.setFont('helvetica','normal');
          y = addText(flag.explanation, 25, 9);
        }

        // Recommendations (the detailed bullet points)
        if (flag.recommendation) {
          if (y > pageHeight - 40) { doc.addPage(); y = 20; }
          doc.setFont('helvetica','bold'); doc.text('Recommendations:', 25, y); y += 5;
          doc.setFont('helvetica','normal');
          
          // Parse recommendations - may be string with bullets or array
          const recText = String(flag.recommendation || '');
          const recLines = recText.split(/[\n•\-–]/g).map(s => s.trim()).filter(s => s.length > 0);
          
          recLines.forEach(line => {
            if (y > pageHeight - 15) { doc.addPage(); y = 20; }
            doc.text(`• ${line}`, 25, y);
            y += 5;
          });
        }

        // Evidence excerpt
        if (flag.evidence && flag.evidence.length > 10) {
          if (y > pageHeight - 25) { doc.addPage(); y = 20; }
          doc.setFont('helvetica','bold'); doc.text('Evidence:', 25, y); y += 5;
          doc.setFont('helvetica','normal');
          doc.setFontSize(8);
          const excerpt = flag.evidence.substring(0, 200) + (flag.evidence.length > 200 ? '...' : '');
          y = addText(excerpt, 25, 8);
          doc.setFontSize(9);
        }

        y += 10; // Space between issues
      });
    }

    // =====================================================================
    // TAXONOMY COVERAGE (if available)
    // =====================================================================
    const cov = scanData.coverage_summary;
    if (cov && typeof cov.total_categories === 'number') {
      if (y > pageHeight - 50) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.text('Coverage Summary', 20, y); y += 8;
      doc.setFontSize(10); doc.setFont('helvetica','normal');
      doc.text(`Total categories: ${cov.total_categories}`, 25, y); y += 6;
      doc.text(`Present: ${cov.present}`, 25, y); y += 6;
      doc.text(`Missing: ${cov.missing}`, 25, y); y += 10;
    }

    // =====================================================================
    // CLAUSE-BY-CLAUSE REVIEW (always render from canonical if provided)
    // =====================================================================
    const clauseReview = Array.isArray(scanData.clause_review) ? scanData.clause_review : [];
    const clauseLedger = Array.isArray(scanData.clause_ledger) ? scanData.clause_ledger : [];
    
    // Always render clause-by-clause even if flags exist (non-duplicative content)
    if (clauseReview.length > 0 && clauseLedger.length > 0) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Clause-by-Clause Review (${clauseReview.length} clauses)`, 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');

      const riskOrder = { high: 0, medium: 1, low: 2, none: 3 };
      const sortedReviews = [...clauseReview].sort((a, b) => 
        (riskOrder[a.risk_level] || 3) - (riskOrder[b.risk_level] || 3)
      );

      sortedReviews.forEach((review, idx) => {
        const ledgerItem = clauseLedger.find(c => c.clause_id === review.clause_id);
        
        if (y > pageHeight - 60) { doc.addPage(); y = 20; }
        
        doc.setFontSize(11); doc.setFont('helvetica','bold');
        const heading = ledgerItem?.heading || `Clause ${review.clause_id}`;
        y = addText(`${idx + 1}. ${heading}`, 20, 11, 'bold');

        doc.setFontSize(9); doc.setFont('helvetica','normal');
        const riskLabel = review.risk_level === 'none' ? 'NO RISK' : review.risk_level.toUpperCase() + ' RISK';
        y = addText(`Risk Level: ${riskLabel}`, 25, 9);

        if (review.risk_summary) {
          y = addText(review.risk_summary, 25, 9);
        }

        if (review.risk_level !== 'none') {
          if (review.tenant_view) {
            doc.setFont('helvetica','bold'); doc.text('Tenant Impact:', 25, y); y += 5;
            doc.setFont('helvetica','normal');
            y = addText(review.tenant_view, 25, 9);
          }
          if (review.landlord_view) {
            doc.setFont('helvetica','bold'); doc.text('Landlord View:', 25, y); y += 5;
            doc.setFont('helvetica','normal');
            y = addText(review.landlord_view, 25, 9);
          }
          if (review.lawyer_view) {
            doc.setFont('helvetica','bold'); doc.text('Thai Law Context:', 25, y); y += 5;
            doc.setFont('helvetica','normal');
            y = addText(review.lawyer_view, 25, 9);
          }
          if (review.recommended_change && review.recommended_change !== 'No change recommended') {
            doc.setFont('helvetica','bold'); doc.text('Recommended Change:', 25, y); y += 5;
            doc.setFont('helvetica','normal');
            y = addText(review.recommended_change, 25, 9);
          }
          if (review.negotiation_tip && review.negotiation_tip !== 'Accept as standard.') {
            doc.setFont('helvetica','bold'); doc.text('Negotiation Tip:', 25, y); y += 5;
            doc.setFont('helvetica','normal');
            y = addText(review.negotiation_tip, 25, 9);
          }
        }

        y += 8;
      });
    }
    
    // Missing Clauses (gap report from canonical catalog)
    const missingClauses = Array.isArray(scanData.missing_clauses) ? scanData.missing_clauses : [];
    if (missingClauses.length > 0) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Missing Standard Clauses (${missingClauses.length})`, 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      
      // Sort by priority: high, medium, low
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sortedMissing = [...missingClauses].sort((a, b) => 
        (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
      );

      sortedMissing.forEach((missing, idx) => {
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        doc.setFontSize(10); doc.setFont('helvetica','bold');
        y = addText(`${idx + 1}. ${missing.canonical_name} [${missing.priority?.toUpperCase() || 'LOW'}]`, 20, 10, 'bold');
        doc.setFontSize(9); doc.setFont('helvetica','normal');
        if (missing.why_it_matters) {
          y = addText(`Why it matters: ${missing.why_it_matters}`, 25, 9);
        }
        if (missing.suggested_addition_text) {
          y = addText(`Suggested: ${missing.suggested_addition_text}`, 25, 9);
        }
        y += 4;
      });
    }
    
    // Clause Coverage Summary (driven by canonical summary metrics)
    const canonicalSummary = scanData.coverage_summary || {};
    const mappingsCount = Array.isArray(scanData.mappings) ? scanData.mappings.length : 0;
    const missingCount = missingClauses.length;
    const totalCatalog = 92; // Canonical catalog size
    
    if (mappingsCount > 0 || missingCount > 0 || canonicalSummary.mapped_pct != null) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Clause Coverage Summary (92 Standard Categories)', 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const presentCount = canonicalSummary.mapped_count || (totalCatalog - missingCount);
      doc.text(`• Present in lease: ${presentCount} categories`, 25, y); y += 6;
      doc.text(`• Missing categories: ${missingCount}`, 25, y); y += 6;
      const pct = canonicalSummary.mapped_pct != null ? canonicalSummary.mapped_pct : Math.round((presentCount / totalCatalog) * 100);
      doc.text(`• Coverage: ${pct}%`, 25, y); y += 10;
      if (pct < 100) {
        doc.setTextColor(146,64,14); doc.setFont('helvetica','bold');
        doc.text('Warning: Rescan required – taxonomy coverage incomplete.', 25, y);
        doc.setTextColor(0,0,0); doc.setFont('helvetica','normal');
        y += 10;
      }
    }
    
    // Negotiation Plan Summary
    const riskClauses = Array.isArray(scanData.clause_review) 
      ? scanData.clause_review.filter(r => r.risk_level && r.risk_level !== 'none')
      : [];
    
    if (riskClauses.length > 0) {
      if (y > pageHeight - 80) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Negotiation Plan - Top Changes to Request', 20, y);
      y += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Sort by risk and take top 5
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const topRisks = [...riskClauses]
        .sort((a, b) => (riskOrder[a.risk_level] || 3) - (riskOrder[b.risk_level] || 3))
        .slice(0, 5);
      
      topRisks.forEach((risk, idx) => {
        if (y > pageHeight - 30) { doc.addPage(); y = 20; }
        doc.setFontSize(10); doc.setFont('helvetica','bold');
        y = addText(`${idx + 1}. [${risk.risk_level?.toUpperCase()}] ${risk.risk_summary?.substring(0, 80) || 'Issue identified'}`, 20, 10, 'bold');
        doc.setFontSize(9); doc.setFont('helvetica','normal');
        if (risk.recommended_change && risk.recommended_change !== 'No change recommended') {
          y = addText(`→ Request: ${risk.recommended_change}`, 25, 9);
        }
        if (risk.negotiation_tip && risk.negotiation_tip !== 'Accept as standard.') {
          y = addText(`💡 Tip: ${risk.negotiation_tip}`, 25, 9);
        }
        y += 4;
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
      return err(req, 'UNAUTHORIZED', 'Unauthorized', 401, correlationId.slice(-8));
    }
    
    // SECURITY FIX: Don't expose error details to client
    console.error('[PDF_ERROR]', { error: error.message, correlationId });
    
    return err(req, 'PDF_FAILED', 'PDF generation failed. Please try again.', 500, correlationId.slice(-8));
  }
});