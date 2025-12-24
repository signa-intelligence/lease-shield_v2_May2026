import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Seed Template Assets for Download Store
 * Creates template records with DOCX URLs for user download
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const TEMPLATE_ASSETS = [
      {
        template_key: 'pre_signing_negotiation',
        title_en: 'Pre-Signing Negotiation Letter',
        title_th: 'จดหมายเจรจาก่อนลงนามสัญญา',
        description_en: 'Request clarification and amendments before signing your lease agreement.',
        description_th: 'ขอชี้แจงและแก้ไขเงื่อนไขก่อนลงนามสัญญาเช่า',
        category: 'pre_signing',
        cost_credits: 1,
        status: 'active',
        sort_order: 10,
        docx_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/templates/pre_signing_negotiation.docx',
        pdf_url: null,
        preview_image_url: null,
        seed_version: 'v1'
      },
      {
        template_key: 'deposit_return_request',
        title_en: 'Deposit Return Request',
        title_th: 'จดหมายเรียกคืนเงินมัดจำ',
        description_en: 'Formally request the return of your security deposit after lease termination.',
        description_th: 'เรียกคืนเงินมัดจำอย่างเป็นทางการหลังสิ้นสุดสัญญา',
        category: 'initial_resolution',
        cost_credits: 1,
        status: 'active',
        sort_order: 20,
        docx_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/templates/deposit_return_request.docx',
        pdf_url: null,
        preview_image_url: null,
        seed_version: 'v1'
      },
      {
        template_key: 'maintenance_request',
        title_en: 'Maintenance Request Letter',
        title_th: 'จดหมายแจ้งซ่อม',
        description_en: 'Document maintenance issues and request timely repairs from your landlord.',
        description_th: 'แจ้งปัญหาและขอให้เจ้าของที่พักดำเนินการซ่อมแซม',
        category: 'initial_resolution',
        cost_credits: 1,
        status: 'active',
        sort_order: 30,
        docx_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/templates/maintenance_request.docx',
        pdf_url: null,
        preview_image_url: null,
        seed_version: 'v1'
      },
      {
        template_key: 'early_termination_notice',
        title_en: 'Early Termination Notice',
        title_th: 'จดหมายแจ้งยกเลิกสัญญาก่อนกำหนด',
        description_en: 'Notify your landlord of your intention to terminate the lease early.',
        description_th: 'แจ้งเจ้าของที่พักเรื่องการยกเลิกสัญญาเช่าก่อนครบกำหนด',
        category: 'professional',
        cost_credits: 1,
        status: 'active',
        sort_order: 40,
        docx_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/templates/early_termination_notice.docx',
        pdf_url: null,
        preview_image_url: null,
        seed_version: 'v1'
      },
      {
        template_key: 'final_demand_deposit',
        title_en: 'Final Demand - Deposit Return',
        title_th: 'จดหมายเรียกร้องครั้งสุดท้าย - เงินมัดจำ',
        description_en: 'Final formal demand before escalating to legal action regarding deposit return.',
        description_th: 'เรียกร้องครั้งสุดท้ายก่อนดำเนินการทางกฎหมายเรื่องเงินมัดจำ',
        category: 'final',
        cost_credits: 1,
        status: 'active',
        sort_order: 50,
        docx_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/templates/final_demand_deposit.docx',
        pdf_url: null,
        preview_image_url: null,
        seed_version: 'v1'
      }
    ];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const template of TEMPLATE_ASSETS) {
      const existing = await base44.asServiceRole.entities.TemplateLibrary.filter({
        template_key: template.template_key
      });

      if (existing.length > 0) {
        // Update if seed_version changed
        const current = existing[0];
        if (current.seed_version !== template.seed_version) {
          await base44.asServiceRole.entities.TemplateLibrary.update(current.id, template);
          updated++;
          console.log(`✅ Updated: ${template.template_key}`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped: ${template.template_key} (already up to date)`);
        }
      } else {
        // Create new
        await base44.asServiceRole.entities.TemplateLibrary.create(template);
        created++;
        console.log(`✅ Created: ${template.template_key}`);
      }
    }

    return Response.json({
      ok: true,
      summary: {
        total: TEMPLATE_ASSETS.length,
        created,
        updated,
        skipped
      }
    });

  } catch (error) {
    console.error('Seed failed:', error);
    return Response.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
});