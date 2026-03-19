import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentIds } = await req.json();

    if (!documentIds || documentIds.length === 0) {
      return Response.json({ error: 'No documents selected' }, { status: 400 });
    }

    // Fetch selected documents
    const documents = await base44.entities.Document.filter({
      created_by: user.email
    });

    const selectedDocs = documents.filter(doc => documentIds.includes(doc.id));

    if (selectedDocs.length === 0) {
      return Response.json({ error: 'No valid documents found' }, { status: 404 });
    }

    // Create ZIP file
    const zip = new JSZip();
    const folder = zip.folder('LeaseShield_Documents');

    // Download and add each document to ZIP
    for (let i = 0; i < selectedDocs.length; i++) {
      const doc = selectedDocs[i];
      
      try {
        const fileResponse = await fetch(doc.file_url);
        if (!fileResponse.ok) continue;
        
        const fileBlob = await fileResponse.blob();
        const arrayBuffer = await fileBlob.arrayBuffer();
        
        // Generate filename
        const extension = doc.file_url.split('.').pop().split('?')[0];
        const filename = `${i + 1}_${doc.label || doc.type}_${doc.id.slice(0, 8)}.${extension}`;
        
        folder.file(filename, arrayBuffer);
      } catch (err) {
        console.error(`Failed to add document ${doc.id}:`, err);
      }
    }

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: 'uint8array' });

    return new Response(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="LeaseShield_Export_${new Date().toISOString().split('T')[0]}.zip"`
      }
    });

  } catch (error) {
    console.error('Bulk export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});