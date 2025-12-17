import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak } from 'npm:docx@8.5.0';

/**
 * Lease Shield – Generate Editable DOCX from Multi-Language Letter
 * Generates a proper DOCX with Word-native formatting (no HTML conversion)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const args = await req.json();
    const {
      letterContent, // Object: { en: "...", th: "...", etc. }
      languagePack, // { primary: 'en', allLanguages: ['en', 'th'] }
      subject,
      tenant_name,
      landlord_name,
      property_address,
      recipientType = 'landlord'
    } = args;

    if (!letterContent || !languagePack) {
      return Response.json({ error: 'Missing letter content or language pack' }, { status: 400 });
    }

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const todayTh = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    const languageLabels = {
      en: 'English (EN)',
      th: 'ไทย (Thai / TH)',
      ja: '日本語 (Japanese / JA)',
      zh: '中文 (Chinese / ZH)',
      ko: '한국어 (Korean / KO)',
      ru: 'Русский (Russian / RU)'
    };

    // Helper: Convert plain text to Word paragraphs
    const textToParagraphs = (text) => {
      const paragraphs = [];
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.trim() === '') {
          // Empty line - add spacing
          paragraphs.push(new Paragraph({ text: '' }));
          continue;
        }

        // Check if numbered list (1. 2. 3. etc.)
        const numberedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          paragraphs.push(new Paragraph({
            text: numberedMatch[2],
            numbering: {
              reference: 'default-numbering',
              level: 0
            },
            spacing: { before: 100, after: 100 }
          }));
          continue;
        }

        // Check if bullet list (- or • or *)
        const bulletMatch = line.match(/^\s*[-•*]\s+(.*)$/);
        if (bulletMatch) {
          paragraphs.push(new Paragraph({
            text: bulletMatch[1],
            bullet: { level: 0 },
            spacing: { before: 100, after: 100 }
          }));
          continue;
        }

        // Regular paragraph
        paragraphs.push(new Paragraph({
          text: line.trim(),
          spacing: { before: 100, after: 100 }
        }));
      }

      return paragraphs;
    };

    // Build document sections
    const docSections = [];

    // Letter header - business letter format only
    docSections.push(
      new Paragraph({
        text: `${today} / ${todayTh}`,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `To: ${landlord_name || '[Landlord Name]'}`,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: `Property: ${property_address || '[Property Address]'}`,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: `From: ${tenant_name || user.full_name || '[Your Name]'}`,
        spacing: { after: 400 }
      })
    );

    // Add each language section with page break
    languagePack.allLanguages.forEach((langCode, index) => {
      const content = letterContent[langCode] || letterContent['en'] || '';
      
      // Language section header
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `📄 ${languageLabels[langCode] || langCode.toUpperCase()}`,
              bold: true,
              size: 24,
              color: '0C3B2E'
            })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 300 }
        })
      );

      // Add content paragraphs
      docSections.push(...textToParagraphs(content));

      // Add page break (except after last language)
      if (index < languagePack.allLanguages.length - 1) {
        docSections.push(new Paragraph({
          children: [new PageBreak()]
        }));
      }
    });

    // No footer - clean professional letter only

    // Create DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: docSections
      }],
      numbering: {
        config: [{
          reference: 'default-numbering',
          levels: [{
            level: 0,
            format: 'decimal',
            text: '%1.',
            alignment: AlignmentType.LEFT
          }]
        }]
      }
    });

    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc);

    // File naming
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const langSuffix = languagePack.allLanguages.join('_');
    const fileName = `${subject}_${recipientType}_${langSuffix}_${stamp}.docx`;

    // Upload to storage
    const docFile = new File([buffer], fileName, { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    const { file_url: docxUrl } = await base44.integrations.Core.UploadFile({ file: docFile });

    console.log(`✅ DOCX generated: ${fileName}`);
    console.log(`📦 Languages: ${languagePack.allLanguages.join(', ')}`);

    return Response.json({
      ok: true,
      docx_url: docxUrl,
      filename: fileName,
      languages: languagePack.allLanguages
    });

  } catch (error) {
    console.error('DOCX generation error:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});