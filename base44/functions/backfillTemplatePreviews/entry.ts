import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backfills preview_en and preview_th for all templates
 * Converts array-based previews into formatted text
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const templates = await base44.asServiceRole.entities.TemplateLibrary.list();
    console.log(`Processing ${templates.length} templates`);

    const updates = [];

    for (const template of templates) {
      const needsUpdate = !template.preview_en || !template.preview_th;
      
      if (!needsUpdate) {
        console.log(`✓ ${template.template_key}: already has previews`);
        continue;
      }

      // Build preview_en from arrays
      let preview_en = '';
      
      if (template.preview_headings?.length > 0) {
        preview_en += 'Main sections:\n';
        template.preview_headings.forEach(h => {
          preview_en += `§ ${h}\n`;
        });
        preview_en += '\n';
      }

      if (template.preview_bullets?.length > 0) {
        preview_en += 'Includes:\n';
        template.preview_bullets.forEach(b => {
          preview_en += `• ${b}\n`;
        });
        preview_en += '\n';
      }

      if (template.preview_placeholders?.length > 0) {
        preview_en += 'Fill-in fields:\n';
        preview_en += template.preview_placeholders.join(', ');
      }

      // Build preview_th (same structure, use Thai labels)
      let preview_th = '';
      
      if (template.preview_headings?.length > 0) {
        preview_th += 'ส่วนหลัก:\n';
        template.preview_headings.forEach(h => {
          preview_th += `§ ${h}\n`;
        });
        preview_th += '\n';
      }

      if (template.preview_bullets?.length > 0) {
        preview_th += 'รวมถึง:\n';
        template.preview_bullets.forEach(b => {
          preview_th += `• ${b}\n`;
        });
        preview_th += '\n';
      }

      if (template.preview_placeholders?.length > 0) {
        preview_th += 'ช่องกรอกข้อมูล:\n';
        preview_th += template.preview_placeholders.join(', ');
      }

      // Fallback: use preview_text or generic message
      if (!preview_en.trim()) {
        preview_en = template.preview_text || 
          'This template includes standard sections for professional communication with your landlord. Download to view full content.';
      }

      if (!preview_th.trim()) {
        preview_th = template.preview_text || 
          'เทมเพลตนี้รวมส่วนมาตรฐานสำหรับการสื่อสารกับเจ้าของบ้าน ดาวน์โหลดเพื่อดูเนื้อหาเต็ม';
      }

      await base44.asServiceRole.entities.TemplateLibrary.update(template.id, {
        preview_en: preview_en.trim(),
        preview_th: preview_th.trim()
      });

      updates.push({
        key: template.template_key,
        preview_en_length: preview_en.trim().length,
        preview_th_length: preview_th.trim().length
      });

      console.log(`✅ ${template.template_key}: backfilled`);
    }

    return Response.json({
      ok: true,
      total: templates.length,
      updated: updates.length,
      updates
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});