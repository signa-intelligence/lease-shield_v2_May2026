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

    console.log('[MIGRATE_NESTED] Starting migration from flat to nested fields...', { admin: user.email });
    
    const templates = await base44.asServiceRole.entities.TemplateLibrary.list();
    
    let migratedCount = 0;
    const migrationLog = [];

    for (const template of templates) {
      try {
        let needsMigration = false;
        const updateData = {};

        // Check if preview_content needs migration
        const currentPreview = template.preview_content;
        if (typeof currentPreview !== 'object' || currentPreview === null) {
          // Migrate from flat fields
          const previewEn = template.preview_content_en || template.preview_content || '';
          const previewTh = template.preview_content_th || '';
          
          updateData.preview_content = {
            en: typeof previewEn === 'string' ? previewEn : '',
            th: typeof previewTh === 'string' ? previewTh : ''
          };
          needsMigration = true;
        }

        // Check if document_content needs migration
        const currentDocument = template.document_content;
        if (typeof currentDocument !== 'object' || currentDocument === null) {
          // Migrate from flat fields
          const docEn = template.document_content_en || template.document_content || '';
          const docTh = template.document_content_th || '';
          
          updateData.document_content = {
            en: typeof docEn === 'string' ? docEn : '',
            th: typeof docTh === 'string' ? docTh : ''
          };
          needsMigration = true;
        }

        if (needsMigration) {
          await base44.asServiceRole.entities.TemplateLibrary.update(template.id, updateData);
          migratedCount++;
          migrationLog.push({
            template_key: template.template_key,
            migrated_fields: Object.keys(updateData)
          });
          console.log(`[MIGRATE_NESTED] Migrated: ${template.template_key}`);
        }

      } catch (error) {
        console.error('[MIGRATE_NESTED] Error migrating template:', template.template_key, error);
        migrationLog.push({
          template_key: template.template_key,
          error: error.message
        });
      }
    }

    console.log('[MIGRATE_NESTED] Complete:', {
      total: templates.length,
      migratedCount
    });

    return Response.json({
      ok: true,
      total: templates.length,
      migrated_count: migratedCount,
      migration_log: migrationLog,
      message: `Successfully migrated ${migratedCount} templates from flat to nested structure`
    });

  } catch (error) {
    console.error('[MIGRATE_NESTED] Fatal error:', error);
    return Response.json({
      ok: false,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});