import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Export LetterDocument to DOCX
 * Converts structured letter to formatted Word document
 * NO branding inside document content
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const args = await req.json();
    const { letterDoc, filename = 'letter' } = args;

    if (!letterDoc || !letterDoc.blocks) {
      return Response.json({ error: 'Invalid letter document' }, { status: 400 });
    }

    // Convert LetterDocument to HTML (for DOCX conversion)
    let htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>';
    htmlContent += `
      body { 
        font-family: 'Calibri', 'Arial', sans-serif; 
        font-size: 11pt; 
        line-height: 1.6; 
        color: #000000;
        max-width: 650px;
        margin: 40px auto;
        padding: 20px;
      }
      .date { 
        text-align: right; 
        margin-bottom: 30px; 
        font-size: 10pt;
        color: #333333;
      }
      .recipient { 
        margin-bottom: 25px; 
        line-height: 1.4;
      }
      .subject { 
        font-weight: bold; 
        margin-bottom: 25px;
      }
      .paragraph { 
        margin-bottom: 20px; 
        text-align: justify;
      }
      .bullets { 
        margin: 20px 0; 
        padding-left: 20px;
      }
      .bullets li { 
        margin-bottom: 15px; 
        line-height: 1.7;
      }
      .closing { 
        margin-top: 25px; 
        margin-bottom: 20px;
      }
      .signature { 
        margin-top: 40px; 
        line-height: 1.4;
      }
    `;
    htmlContent += '</style></head><body>';

    // Render blocks
    letterDoc.blocks.forEach(block => {
      if (block.type === 'date') {
        htmlContent += `<div class="date">${block.value}</div>`;
      } else if (block.type === 'recipient') {
        htmlContent += '<div class="recipient">';
        block.lines?.forEach(line => {
          if (line) htmlContent += `${line}<br/>`;
        });
        htmlContent += '</div>';
      } else if (block.type === 'subject') {
        htmlContent += `<div class="subject">${block.value}</div>`;
      } else if (block.type === 'paragraph') {
        htmlContent += `<p class="paragraph">${block.value}</p>`;
      } else if (block.type === 'bullets') {
        htmlContent += '<ul class="bullets">';
        block.items?.forEach(item => {
          if (item) htmlContent += `<li>${item}</li>`;
        });
        htmlContent += '</ul>';
      } else if (block.type === 'closing') {
        htmlContent += `<p class="closing">${block.value}</p>`;
      } else if (block.type === 'signature') {
        htmlContent += '<div class="signature">';
        block.lines?.forEach(line => {
          if (line) htmlContent += `${line}<br/>`;
        });
        htmlContent += '</div>';
      }
    });

    htmlContent += '</body></html>';

    // Create DOCX-compatible file
    const docBlob = new Blob([htmlContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const docFile = new File([docBlob], `${filename}.docx`, { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });

    const { file_url } = await base44.integrations.Core.UploadFile({ file: docFile });

    console.log(`✅ DOCX exported: ${filename}.docx`);

    return Response.json({
      ok: true,
      file_url,
      filename: `${filename}.docx`
    });

  } catch (error) {
    console.error('DOCX export error:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});