import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.access_level !== 'admin' && user.access_level !== 'super_admin')) {
      return Response.json({ 
        ok: false, 
        message: 'Unauthorized - Admin only' 
      }, { status: 403 });
    }

    console.log('[TEMPLATE_REPAIR] Starting repair...', { admin: user.email });
    
    const templates = await base44.asServiceRole.entities.TemplateLibrary.list();
    
    let deletedCount = 0;
    let repairedCount = 0;
    const deleted = [];

    for (const template of templates) {
      try {
        // Extract nested content
        const previewContent = template.preview_content || {};
        const documentContent = template.document_content || {};
        
        const previewEn = typeof previewContent === 'object' ? (previewContent.en || '') : '';
        const previewTh = typeof previewContent === 'object' ? (previewContent.th || '') : '';
        const docEn = typeof documentContent === 'object' ? (documentContent.en || '') : '';
        const docTh = typeof documentContent === 'object' ? (documentContent.th || '') : '';

        // Check if content is missing
        const hasPreviewEn = previewEn.trim().length >= 50;
        const hasPreviewTh = previewTh.trim().length >= 50;
        const hasDocEn = docEn.trim().length >= 300;
        const hasDocTh = docTh.trim().length >= 300;

        const isMissingContent = !hasPreviewEn || !hasPreviewTh || !hasDocEn || !hasDocTh;
        const isInactive = template.status !== 'active' && template.is_active !== true;

        // Delete if inactive AND missing content
        if (isInactive && isMissingContent) {
          console.log('[TEMPLATE_REPAIR] Deleting inactive+empty:', template.template_key);
          await base44.asServiceRole.entities.TemplateLibrary.delete(template.id);
          deletedCount++;
          deleted.push(template.template_key);
        } else if (!isInactive) {
          // Recompute status fields for active templates
          const updateData = {
            has_english: hasPreviewEn && hasDocEn,
            has_thai: hasPreviewTh && hasDocTh
          };

          if (hasPreviewEn && hasDocEn && hasPreviewTh && hasDocTh) {
            updateData.content_status = 'ready';
          } else if (hasPreviewEn && hasDocEn && (!hasPreviewTh || !hasDocTh)) {
            updateData.content_status = 'missing_th';
          } else if (hasPreviewTh && hasDocTh && (!hasPreviewEn || !hasDocEn)) {
            updateData.content_status = 'missing_en';
          } else {
            updateData.content_status = 'missing_both';
          }

          await base44.asServiceRole.entities.TemplateLibrary.update(template.id, updateData);
          repairedCount++;
        }

      } catch (error) {
        console.error('[TEMPLATE_REPAIR] Error processing template:', template.template_key, error);
      }
    }

    console.log('[TEMPLATE_REPAIR] Complete:', {
      total: templates.length,
      deletedCount,
      repairedCount
    });

    return Response.json({
      ok: true,
      total: templates.length,
      deleted_count: deletedCount,
      repaired_count: repairedCount,
      deleted_keys: deleted
    });

  } catch (error) {
    console.error('[TEMPLATE_REPAIR] Fatal error:', error);
    return Response.json({
      ok: false,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});