import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { buildLetterLanguagePack } from '../components/shared/languageRules.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      template_id,
      body_en,
      body_th,
      tenant_name,
      landlord_name,
      property_address,
      contract_ref,
      deposit_amount,
      recipientType,
      includeTenantCopy,
      includeThaiCopy,
      includeLandlordCopy
    } = body;

    // Check credits
    if ((user.letter_credits || 0) < 1) {
      return Response.json({ 
        ok: false, 
        error: 'Insufficient credits' 
      });
    }

    // Build language pack using existing logic
    const languagePack = buildLetterLanguagePack({
      recipientType: recipientType || 'landlord',
      tenantLanguage: user.language || 'en',
      landlordLanguage: user.landlord_language || 'th',
      includeTenantCopy: includeTenantCopy || false,
      includeThaiCopy: includeThaiCopy || false,
      includeLandlordCopy: includeLandlordCopy || false
    });

    // Prepare merge fields
    const today = new Date().toLocaleDateString('en-GB');
    const mergeFields = {
      '{{today_date}}': today,
      '{{tenant_full_name}}': tenant_name || '[Your Name]',
      '{{tenant_name}}': tenant_name || '[Your Name]',
      '{{landlord_name}}': landlord_name || '[Landlord Name]',
      '{{property_name}}': property_address || '[Property Address]',
      '{{property_address}}': property_address || '[Property Address]',
      '{{unit_number}}': '[Unit Number]',
      '{{landlord_address}}': '[Landlord Address]',
      '{{tenant_address}}': '[Your Address]',
      '{{contract_ref}}': contract_ref || '[Contract Reference]',
      '{{deposit_amount}}': deposit_amount || '[Deposit Amount]'
    };

    // Function to replace merge fields in template
    const applyMergeFields = (template) => {
      let result = template;
      for (const [placeholder, value] of Object.entries(mergeFields)) {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      }
      return result;
    };

    // Generate letter content for each language
    const letter_content = {};
    
    languagePack.allLanguages.forEach(langCode => {
      if (langCode === 'en') {
        letter_content.en = applyMergeFields(body_en);
      } else if (langCode === 'th') {
        letter_content.th = applyMergeFields(body_th);
      } else {
        // For other languages, use English as fallback
        letter_content[langCode] = applyMergeFields(body_en);
      }
    });

    // Deduct credit
    const newCreditBalance = user.letter_credits - 1;
    await base44.auth.updateMe({ letter_credits: newCreditBalance });

    return Response.json({
      ok: true,
      letter_content,
      language_pack: languagePack,
      credits_remaining: newCreditBalance,
      template_used: template_id
    });

  } catch (error) {
    console.error('Error generating letter from template:', error);
    return Response.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
});