import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.access_level !== 'admin' && user.access_level !== 'super_admin')) {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const templates = await base44.asServiceRole.entities.TemplateLibrary.list();
    
    let updated = 0;
    const updatedList = [];

    for (const template of templates) {
      const updateData = {};

      // Migrate existing preview_content to preview_content_en
      if (!template.preview_content_en && template.preview_content) {
        updateData.preview_content_en = template.preview_content;
      }

      // Migrate existing document_content to document_content_en
      if (!template.document_content_en && template.document_content) {
        updateData.document_content_en = template.document_content;
      }

      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.TemplateLibrary.update(template.id, updateData);
        updated++;
        updatedList.push(template.template_key);
      }
    }

    return Response.json({
      success: true,
      message: `Migrated ${updated} templates to language-specific fields`,
      updated_templates: updatedList,
      total_templates: templates.length
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});