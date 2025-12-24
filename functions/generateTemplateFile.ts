import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

/**
 * Generates a template file on-the-fly from stored content
 * Creates a simple formatted document and uploads to storage
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { template_id } = await req.json();

    if (!template_id) {
      return Response.json({ error: 'Missing template_id' }, { status: 400 });
    }

    // Fetch template
    const templates = await base44.asServiceRole.entities.TemplateLibrary.filter({ id: template_id });
    if (!templates || templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templates[0];

    // Generate simple text document content
    const title_en = template.title_en || 'Template';
    const title_th = template.title_th || 'เทมเพลต';
    const preview_en = template.preview_en || '';
    const preview_th = template.preview_th || '';

    // Create simple text content (we'll generate a basic text file)
    const content_en = `${title_en}\n\n${preview_en}\n\n---\n\nThis is a template document. Fill in the required fields and send to your landlord.\n`;
    const content_th = `${title_th}\n\n${preview_th}\n\n---\n\nนี่คือเอกสารเทมเพลต กรุณากรอกข้อมูลที่จำเป็นและส่งให้เจ้าของบ้าน\n`;

    // For now, create a simple text file (in production, this would be a proper DOCX)
    const combinedContent = `${content_en}\n\n========================================\n\n${content_th}`;
    const blob = new Blob([combinedContent], { type: 'text/plain' });
    const arrayBuffer = await blob.arrayBuffer();

    // Upload to Supabase storage
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Storage configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucketName = 'template-files';
    const filePath = `templates/${template.template_key}.txt`;

    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      return Response.json({ error: 'File upload failed', details: uploadError.message }, { status: 500 });
    }

    // Update template with file_path
    await base44.asServiceRole.entities.TemplateLibrary.update(template.id, {
      file_path: filePath
    });

    console.log(`✅ Generated and uploaded: ${filePath}`);

    return Response.json({
      ok: true,
      file_path: filePath,
      template_key: template.template_key
    });

  } catch (error) {
    console.error('Generate template error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});