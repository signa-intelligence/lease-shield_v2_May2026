import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Normalize Template Data
 * Ensures all templates have required fields with sane defaults
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run normalization
    if (!user || (user.role !== 'admin' && user.access_level !== 'admin' && user.access_level !== 'super_admin')) {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 403 });
    }

    console.log('🔧 Starting template normalization...');

    // Fetch all templates
    const allTemplates = await base44.asServiceRole.entities.TemplateLibrary.list();
    console.log(`Found ${allTemplates.length} templates`);

    const updates = [];
    const issues = [];

    for (const template of allTemplates) {
      const updates_needed = {};
      let needs_update = false;

      // Ensure status field exists
      if (!template.status || (template.status !== 'active' && template.status !== 'inactive')) {
        updates_needed.status = 'active';
        needs_update = true;
      }

      // Ensure cost_credits exists
      if (typeof template.cost_credits !== 'number') {
        updates_needed.cost_credits = 1;
        needs_update = true;
      }

      // Ensure category exists
      if (!template.category) {
        updates_needed.category = 'initial_resolution';
        needs_update = true;
      }

      // Ensure sort_order exists
      if (typeof template.sort_order !== 'number') {
        updates_needed.sort_order = 100;
        needs_update = true;
      }

      // Migrate docx_url to file_path if needed
      if (!template.file_path && (template.docx_url || template.pdf_url)) {
        const url = template.docx_url || template.pdf_url;
        
        // Extract file path from URL if it's a Supabase URL
        if (url.includes('supabase.co/storage/v1/object/public/')) {
          const parts = url.split('/public/');
          if (parts[1]) {
            // Remove bucket name and app ID from path
            const pathParts = parts[1].split('/');
            if (pathParts.length >= 3) {
              updates_needed.file_path = pathParts.slice(2).join('/');
              needs_update = true;
            }
          }
        } else {
          issues.push({
            id: template.id,
            template_key: template.template_key,
            issue: 'Has docx_url but cannot extract file_path',
            url
          });
        }
      }

      if (needs_update) {
        try {
          await base44.asServiceRole.entities.TemplateLibrary.update(template.id, updates_needed);
          updates.push({
            id: template.id,
            template_key: template.template_key,
            updates: updates_needed
          });
          console.log(`✅ Updated template ${template.template_key || template.id}`);
        } catch (err) {
          console.error(`❌ Failed to update template ${template.id}:`, err);
          issues.push({
            id: template.id,
            template_key: template.template_key,
            error: err.message
          });
        }
      }
    }

    console.log(`🔧 Normalization complete: ${updates.length} updated, ${issues.length} issues`);

    return Response.json({
      success: true,
      total_templates: allTemplates.length,
      updates_applied: updates.length,
      issues_found: issues.length,
      updates,
      issues
    });

  } catch (error) {
    console.error('Normalization error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});