import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Email validation
const isValidEmail = (s) => {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
};

// Subject content mapping
const SUBJECT_TITLES = {
  deposit: {
    en: "Request for clarification on refundable deposit",
    th: "ขอความชัดเจนเกี่ยวกับเงินประกันการเช่า"
  },
  damages: {
    en: "Request for itemised assessment of damages",
    th: "ขอรายละเอียดการประเมินความเสียหายแบบแยกรายการ"
  },
  early_termination: {
    en: "Request to reconcile early termination under the lease",
    th: "ขอประสานงานการยกเลิกสัญญาก่อนกำหนด"
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const args = await req.json();

    // Validate inputs
    if (!args.caseId) {
      return Response.json({ 
        ok: false,
        error: 'caseId is required' 
      }, { status: 400 });
    }

    if (!args.subject || !['deposit', 'damages', 'early_termination'].includes(args.subject)) {
      return Response.json({ 
        ok: false,
        error: 'Invalid subject. Use: deposit, damages, or early_termination' 
      }, { status: 400 });
    }

    // Fetch case
    const cases = await base44.asServiceRole.entities.Case.filter({ id: args.caseId });
    const caseData = cases[0];
    
    if (!caseData) {
      return Response.json({ 
        ok: false,
        error: `Case not found: ${args.caseId}` 
      }, { status: 404 });
    }

    // Get letter URL
    const letterUrl = caseData.letters?.[`${args.subject}_url`];
    
    if (!letterUrl) {
      return Response.json({ 
        ok: false,
        error: `No generated letter found for subject: ${args.subject}. Please generate the letter first.` 
      }, { status: 404 });
    }

    // Determine recipient email
    const recipientEmail = args.landlord_email?.trim() || 
                          caseData.landlord_email?.trim() || 
                          null;
    
    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      return Response.json({ 
        ok: false,
        error: 'Missing or invalid landlord email address' 
      }, { status: 400 });
    }

    // Get email subject
    const language = caseData.language || 'en';
    const subjectTitle = SUBJECT_TITLES[args.subject]?.[language] || SUBJECT_TITLES[args.subject]?.en;

    // Fetch HTML content if available
    let emailBody = `<p>Please find the attached letter regarding your property.</p><p><a href="${letterUrl}">View Letter</a></p>`;
    
    try {
      // Try to fetch HTML content from Document entity
      const documents = await base44.asServiceRole.entities.Document.filter({ file_url: letterUrl });
      if (documents.length > 0 && documents[0].html_content) {
        emailBody = documents[0].html_content;
      }
    } catch (e) {
      console.log('Could not fetch HTML content, using fallback:', e);
    }

    // Send email
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: "Lease Shield",
        to: recipientEmail,
        subject: `Lease Shield – ${subjectTitle}`,
        body: emailBody
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      return Response.json({ 
        ok: false,
        error: `Failed to send email: ${emailError.message}` 
      }, { status: 500 });
    }

    // Update case with send tracking
    const timeline = caseData.timeline || [];
    timeline.push({
      timestamp: new Date().toISOString(),
      event: 'letter_sent_to_landlord',
      actor: 'system',
      meta: {
        subject: args.subject,
        to: recipientEmail,
        url: letterUrl
      }
    });

    const letters = caseData.letters || {};
    letters.last_sent = {
      subject: args.subject,
      to: recipientEmail,
      cc: caseData.cc_emails || [],
      at: new Date().toISOString(),
      messageId: null // Base44 SendEmail doesn't return message ID
    };

    await base44.asServiceRole.entities.Case.update(args.caseId, {
      timeline,
      letters
    });

    return Response.json({ 
      ok: true,
      sent_to: recipientEmail,
      subject: args.subject,
      letter_url: letterUrl,
      sent_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Send letter error:', error);
    return Response.json({ 
      ok: false,
      error: error.message 
    }, { status: 500 });
  }
});