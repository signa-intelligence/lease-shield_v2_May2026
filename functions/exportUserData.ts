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
      const splitValue =