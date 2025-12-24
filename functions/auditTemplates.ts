import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Audit Templates - Find duplicates and missing preview data
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run audit
    if (!user || (user.role !== 'admin' && user.access_level !== 'admin' && user.access_level !== 'super_admin')) {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 403 });
    }

    console.log('🔍 Starting template audit...');

    // Fetch ALL templates (including inactive)
    const allTemplates = await base44.asServiceRole.entities.TemplateLibrary.list();
    console.log(`Found ${allTemplates.length} total templates`);

    // Group by template_key
    const byKey = {};
    const missingKey = [];
    const missingPreview = [];
    
    for (const t of allTemplates) {
      if (!t.template_key) {
        missingKey.push({
          id: t.id,
          title_en: t.title_en,
          status: t.status,
          created_date: t.created_date
        });
      } else {
        if (!byKey[t.template_key]) {
          byKey[t.template_key] = [];
        }
        byKey[t.template_key].push(t);
      }

      // Check for missing preview data
      if (!t.preview_headings && !t.preview_bullets && !t.preview_placeholders) {
        missingPreview.push({
          id: t.id,
          template_key: t.template_key,
          title_en: t.title_en,
          status: t.status
        });
      }
    }

    // Find duplicates
    const duplicates = [];
    for (const [key, templates] of Object.entries(byKey)) {
      if (templates.length > 1) {
        // Sort by updated_date (newest first)
        templates.sort((a, b) => {
          const dateA = new Date(a.updated_date || a.created_date || 0);
          const dateB = new Date(b.updated_date || b.created_date || 0);
          return dateB - dateA;
        });

        duplicates.push({
          template_key: key,
          count: templates.length,
          keep: {
            id: templates[0].id,
            title: templates[0].title_en,
            status: templates[0].status,
            updated: templates[0].updated_date
          },
          deactivate: templates.slice(1).map(t => ({
            id: t.id,
            status: t.status,
            updated: t.updated_date
          }))
        });
      }
    }

    return Response.json({
      success: true,
      total_templates: allTemplates.length,
      active: allTemplates.filter(t => t.status === 'active').length,
      inactive: allTemplates.filter(t => t.status === 'inactive').length,
      unique_keys: Object.keys(byKey).length,
      duplicates: {
        count: duplicates.length,
        details: duplicates
      },
      missing_key: {
        count: missingKey.length,
        details: missingKey
      },
      missing_preview: {
        count: missingPreview.length,
        details: missingPreview
      }
    });

  } catch (error) {
    console.error('Audit error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});