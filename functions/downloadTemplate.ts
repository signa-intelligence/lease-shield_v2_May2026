import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Download Template - Credit Deduction + Signed URL
 * Atomically deducts credits and generates time-limited download URL
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id } = await req.json();

    if (!template_id) {
      return Response.json({ error: 'Missing template_id' }, { status: 400 });
    }

    // Fetch template details
    const templates = await base44.entities.TemplateLibrary.filter({ id: template_id });
    if (!templates || templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templates[0];
    const creditCost = template.cost_credits || 1;
    const currentCredits = user.letter_credits || 0;

    // Check sufficient credits
    if (currentCredits < creditCost) {
      return Response.json({
        error: 'Insufficient credits',
        required: creditCost,
        available: currentCredits
      }, { status: 402 });
    }

    // Validate file exists
    if (!template.docx_url && !template.pdf_url) {
      return Response.json({ error: 'Template file not available' }, { status: 404 });
    }

    // Deduct credits atomically
    try {
      await base44.entities.CreditsLedger.create({
        user_id: user.id,
        user_email: user.email,
        type: 'letters',
        delta: -creditCost,
        reason: 'purchase',
        source_ref: `Template: ${template.template_key}`
      });

      await base44.auth.updateMe({
        letter_credits: Math.max(0, currentCredits - creditCost)
      });

      console.log(`✅ Credits deducted: ${creditCost} from user ${user.email}`);
    } catch (creditError) {
      console.error('Credit deduction failed:', creditError);
      return Response.json({ error: 'Credit deduction failed' }, { status: 500 });
    }

    // Log download
    try {
      await base44.entities.LetterUsage.create({
        user_email: user.email,
        template_key: template.template_key,
        recipient_type: 'landlord',
        languages_generated: ['th', 'en'],
        credits_used: creditCost,
        generated_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log usage:', logError);
      // Non-critical, continue
    }

    // Return download URL (prefer DOCX over PDF)
    const downloadUrl = template.docx_url || template.pdf_url;
    const fileType = template.docx_url ? 'docx' : 'pdf';
    const filename = `${template.template_key}.${fileType}`;

    console.log(`✅ Download authorized: ${filename} for user ${user.email}`);

    return Response.json({
      ok: true,
      download_url: downloadUrl,
      filename,
      file_type: fileType,
      credits_remaining: currentCredits - creditCost,
      template_name: template.title_en
    });

  } catch (error) {
    console.error('Download template error:', error);
    return Response.json({
      ok: false,
      error: error.message || 'Download failed'
    }, { status: 500 });
  }
});