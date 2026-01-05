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

    const body = await req.json();
    let { scanId, scanData, language = 'en', correlationId: clientCorrelationId } = body;

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
      hasScanData: !!scanData,
      hasScanId: !!scanId
    });

    // Resolve scanData from scanId if needed and validate structure
    let resolvedData = scanData;
    if (!resolvedData && scanId) {
      const scans = await base44.entities.LeaseScan.filter({ id: scanId });
      const scan = scans?.[0];
      if (!scan) {
        return Response.json({ error: 'SCAN_NOT_FOUND', message: `No LeaseScan found for ${scanId}` }, { status: 404 });
      }
      const canonical = scan?.scan_full?.canonical_report?.pdfPayload;
      if (canonical && Array.isArray(canonical.clause_ledger)) {
        resolvedData = canonical;
      } else if (Array.isArray(scan?.scan_full?.clause_ledger) && scan.scan_full.clause_ledger.length > 0) {
        const ledger = scan.scan_full.clause_ledger;
        // Prefer stored review, else synthesize 'none' coverage
        const reviewIn = Array.isArray(scan?.scan_full?.canonical_report?.clause_review)
          ? scan.scan_full.canonical_report.clause_review
          : [];
        const reviewMap = new Map(reviewIn.filter(r => r && r.clause_id).map(r => [r.clause_id, r]));
        const flags = Array.isArray(scan.flags) ? scan.flags : (Array.isArray(scan?.scan_full?.canonical_report?.issues) ? scan.scan_full.canonical_report.issues : []);
        const flagsByClause = new Map();
        flags.forEach(f => {
          const cid = f?.clause_id; if (!cid) return; const list = flagsByClause.get(cid) || []; list.push(f); flagsByClause.set(cid, list);
        });
        const fullReview = ledger.map(c => {
          const base = reviewMap.get(c.clause_id);
          if (base && base.risk_level) return base;
          const fl = (flagsByClause.get(c.clause_id) || [])[0];
          if (fl) {
            return {
              clause_id: c.clause_id,
              risk_level: fl.severity || 'medium',
              risk_summary: fl.description || fl.title || 'Review required'
            };
          }
          return { clause_id: c.clause_id, risk_level: 'none' };
        });
        const cov = {
          total_clauses: ledger.length,
          clauses_reviewed: fullReview.length,
          clauses_flagged: fullReview.filter(r => r.risk_level && r.risk_level !== 'none').length
        };
        resolvedData = {
          lease_address: scan?.scan_full?.key_terms?.property_address || scan.lease_id || 'Lease Agreement',
          generated_date: new Date().toISOString(),
          risk_score: scan.risk_score || 0,
          summary: scan.summary || `${flags.length} issues detected`,
          key_terms: scan?.scan_full?.key_terms || {},
          flags,
          clause_review: fullReview,
          clause_ledger: ledger,
          mappings: [],
          missing_clauses: [],
          coverage_summary: cov
        };
      }
    }

    if (!resolvedData) {
      return Response.json({
        error: 'MISSING_REPORT_DATA',
        message: 'Report data not available for PDF generation',
        missing_fields: scanId ? ['canonical_report.pdfPayload', 'scan_full.clause_ledger'] : ['scanData']
      }, { status: 400 });
    }

    // Validate minimum structure
    const missing = [];
    if (!Array.isArray(resolvedData.clause_ledger) || resolvedData.clause_ledger.length === 0) missing.push('clause_ledger');
    if (!Array.isArray(resolvedData.clause_review) || resolvedData.clause_review.length !== resolvedData.clause_ledger.length) missing.push('clause_review(full_coverage)');
    if (missing.length > 0) {
      return Response.json({ error: 'MISSING_REPORT_DATA', missing_fields: missing }, { status: 400 });
    }

    // Use resolvedData going forward
    scanData = resolvedData;

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

    // Key Lease Terms (safe guard)
    if (scanData.key_terms && Object.keys(scanData.key_terms || {}).length > 0) {
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
    // Renders ALL issues with full recommendations and evidence
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
        if (y > pageHeight - 90) { doc.addPage(); y = 20; }
        
        // Issue title
        doc.setFontSize(11); doc.setFont('helvetica','bold');
        const title = flag.title || flag.description?.substring(0, 60) || `Issue ${idx + 1}`;
        y = addText(`${idx + 1}. ${title}`, 20, 11, 'bold');

        // Severity badge + category on same line
        doc.setFontSize(9); doc.setFont('helvetica','normal');
        const severityLabel = (flag.severity || 'medium').toUpperCase();
        const catLabel = flag.category ? ` | Category: ${flag.category}` : '';
        y = addText(`Severity: ${severityLabel}${catLabel}`, 25, 9);

        // Description / Impact (always show)
        if (y > pageHeight - 30) { doc.addPage(); y = 20; }
        doc.setFont('helvetica','bold'); doc.text('Impact:', 25, y); y += 5;
        doc.setFont('helvetica','normal');
        const impact = flag.description || flag.impact || 'Review required';
        y = addText(impact, 25, 9);

        // Explanation (why this matters)
        if (flag.explanation) {
          if (y > pageHeight - 30) { doc.addPage(); y = 20; }
          doc.setFont('helvetica','bold'); doc.text('Why this matters:', 25, y); y += 5;
          doc.setFont('helvetica','normal');
          y = addText(flag.explanation, 25, 9);
        }

        // Recommendations (REQUIRED - minimum 2 specific bullets)
        const recText = flag.recommendation || flag.recommendations || '';
        const recLines = Array.isArray(recText) ? recText : String(recText).split(/[\n•\-–]/g).map(s => s.trim()).filter(s => s.length > 0);
        
        if (recLines.length === 0) {
          // Synthesize category-based recs
          const cat = flag.category || 'clause';
          recLines.push(`Request to narrow or clarify ${cat} terms to tenant-favorable language`);
          recLines.push(`Add explicit safeguard for ${cat} to prevent overbroad interpretation`);
        }
        
        if (y > pageHeight - 45) { doc.addPage(); y = 20; }
        doc.setFont('helvetica','bold'); doc.text('Recommendations:', 25, y); y += 5;
        doc.setFont('helvetica','normal');
        recLines.slice(0, 5).forEach(line => {
          if (y > pageHeight - 15) { doc.addPage(); y = 20; }
          doc.text(`• ${line}`, 25, y);
          y += 5;
        });

        // Evidence excerpt (REQUIRED - synthesize if missing)
        let evidence = flag.evidence || '';
        if (!evidence || evidence.length < 10) {
          evidence = `[Evidence not extracted for ${title}]`;
        }
        
        if (y > pageHeight - 25) { doc.addPage(); y = 20; }
        doc.setFont('helvetica','bold'); doc.text('Evidence:', 25, y); y += 5;
        doc.setFont('helvetica','normal');
        doc.setFontSize(8);
        const excerpt = evidence.substring(0, 240) + (evidence.length > 240 ? '...' : '');
        y = addText(excerpt, 25, 8);
        doc.setFontSize(9);

        y += 8; // Space between issues
      });
    } else {
      // No issues found
      if (y > pageHeight - 40) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Issues', 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No significant issues requiring attention were identified.', 25, y);
      y += 15;
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
    // CLAUSE-BY-CLAUSE REVIEW (render ALL clauses with pagination)
    // =====================================================================
    const clauseReview = Array.isArray(scanData.clause_review) ? scanData.clause_review : [];
    const clauseLedger = Array.isArray(scanData.clause_ledger) ? scanData.clause_ledger : [];

    const defaultRecsFor = (cat) => {
      const c = cat || 'clause';
      return [
        `Request to narrow or clarify ${c} terms to tenant-favorable language`,
        `Add explicit safeguard for ${c} to prevent overbroad interpretation`
      ];
    };

    if (clauseLedger.length > 0) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Clause-by-Clause Review (${clauseLedger.length} clauses)`, 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');

      clauseLedger.forEach((clause, idx) => {
        const review = clauseReview.find(r => r.clause_id === clause.clause_id) || {};
        if (y > pageHeight - 80) { doc.addPage(); y = 20; }

        // Heading
        doc.setFontSize(11); doc.setFont('helvetica','bold');
        const heading = clause.heading || `Clause ${clause.clause_id || idx+1}`;
        y = addText(`${idx + 1}. ${heading}`, 20, 11, 'bold');

        // Risk label
        doc.setFontSize(9); doc.setFont('helvetica','normal');
        const riskLevel = review.risk_level || 'none';
        const riskLabel = riskLevel === 'none' ? 'NO RISK' : riskLevel.toUpperCase() + ' RISK';
        y = addText(`Risk Level: ${riskLabel}`, 25, 9);

        // Snippet/evidence (REQUIRED - synthesize if missing)
        let snippet = (clause.full_text || '').substring(0, 240);
        if (!snippet || snippet.length < 10) {
          snippet = `[Snippet not extracted for ${heading}]`;
        }
        if (y > pageHeight - 25) { doc.addPage(); y = 20; }
        doc.setFont('helvetica','bold'); doc.text('Snippet:', 25, y); y += 5;
        doc.setFont('helvetica','normal');
        doc.setFontSize(8);
        y = addText(snippet, 25, 8);
        doc.setFontSize(9);

        // Rationale / impact
        const rationale = review.risk_summary || (riskLevel === 'none' ? 'Accept as standard.' : 'Review required');
        y = addText(rationale, 25, 9);

        // Recommendations (REQUIRED minimum 2 for risks)
        if (riskLevel !== 'none') {
          const recs = [];
          if (review.recommended_change && review.recommended_change !== 'No change recommended') recs.push(review.recommended_change);
          if (review.negotiation_tip && review.negotiation_tip !== 'Accept as standard.') recs.push(review.negotiation_tip);
          
          // Synthesize if missing
          const cat = (Array.isArray(review.mapped_catalog_ids) ? review.mapped_catalog_ids[0] : review.category) || 'clause';
          while (recs.length < 2) {
            defaultRecsFor(cat).forEach(r => { if (recs.length < 2) recs.push(r); });
          }
          
          if (y > pageHeight - 30) { doc.addPage(); y = 20; }
          doc.setFont('helvetica','bold'); doc.text('Recommendations:', 25, y); y += 5;
          doc.setFont('helvetica','normal');
          recs.forEach(line => {
            if (y > pageHeight - 15) { doc.addPage(); y = 20; }
            doc.text(`\u2022 ${line}`, 25, y);
            y += 5;
          });
        }

        y += 6;
      });
    } else {
      // Ledger missing
      if (y > pageHeight - 40) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Clause-by-Clause Review', 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Ledger not generated yet. Run backfill to generate full clause coverage.', 25, y);
      y += 15;
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
    
    // If structural validation failed earlier, it would have returned 400; otherwise generic failure
    return err(req, 'PDF_FAILED', 'PDF generation failed. Please try again.', 500, correlationId.slice(-8));
  }
});