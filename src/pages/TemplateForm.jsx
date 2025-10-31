
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Download, Copy, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TEMPLATE_SCHEMAS = {
  deposit_request: {
    fields: [
      { name: 'tenant_name', label: 'Your Name', type: 'text', required: true },
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
      { name: 'property_address', label: 'Property Address', type: 'text', required: true },
      { name: 'lease_end_date', label: 'Lease End Date', type: 'date', required: true },
      { name: 'deposit_amount', label: 'Deposit Amount (฿)', type: 'number', required: true },
      { name: 'bank_details', label: 'Bank Account Details', type: 'textarea', required: false },
    ]
  },
  deposit_late: {
    fields: [
      { name: 'tenant_name', label: 'Your Name', type: 'text', required: true },
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
      { name: 'property_address', label: 'Property Address', type: 'text', required: true },
      { name: 'days_overdue', label: 'Days Overdue', type: 'number', required: true },
      { name: 'deposit_amount', label: 'Deposit Amount (฿)', type: 'number', required: true },
    ]
  },
  repair_dispute: {
    fields: [
      { name: 'tenant_name', label: 'Your Name', type: 'text', required: true },
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
      { name: 'property_address', label: 'Property Address', type: 'text', required: true },
      { name: 'itemized_costs', label: 'Disputed Charges (itemized)', type: 'textarea', required: true },
      { name: 'evidence_refs', label: 'Evidence References', type: 'textarea', required: false },
    ]
  },
  pdpa_request: {
    fields: [
      { name: 'name', label: 'Your Full Name', type: 'text', required: true },
      { name: 'id_number', label: 'ID Number (optional)', type: 'text', required: false },
      { name: 'lease_period', label: 'Lease Period', type: 'text', required: true },
      { name: 'requested_documents', label: 'Requested Documents', type: 'textarea', required: true },
    ]
  },
  pre_move_out: {
    fields: [
      { name: 'tenant_name', label: 'Your Name', type: 'text', required: true },
      { name: 'property_address', label: 'Property Address', type: 'text', required: true },
      { name: 'planned_move_out_date', label: 'Planned Move-Out Date', type: 'date', required: true },
    ]
  },
  handover_check: {
    fields: [
      { name: 'property_address', label: 'Property Address', type: 'text', required: true },
      { name: 'date', label: 'Inspection Date', type: 'date', required: true },
      { name: 'attendee_names', label: 'Attendees (tenant, landlord)', type: 'text', required: true },
    ]
  },
  contract_clarification: {
    fields: [
      { name: 'tenant_name', label: 'Your Name', type: 'text', required: true },
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
      { name: 'clauses_in_question', label: 'Clauses Needing Clarification', type: 'textarea', required: true },
    ]
  },
  lease_extension: {
    fields: [
      { name: 'tenant_name', label: 'Your Name', type: 'text', required: true },
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
      { name: 'property_address', label: 'Property Address', type: 'text', required: true },
      { name: 'current_end_date', label: 'Current Lease End Date', type: 'date', required: true },
      { name: 'proposed_new_end_date', label: 'Proposed New End Date', type: 'date', required: true },
      { name: 'reason', label: 'Reason for Extension', type: 'textarea', required: false },
    ]
  },
  lease_termination: {
    fields: [
      { name: 'tenant_name', label: 'Your Name', type: 'text', required: true },
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
      { name: 'property_address', label: 'Property Address', type: 'text', required: true },
      { name: 'lease_end_date', label: 'Lease End Date', type: 'date', required: true },
      { name: 'vacate_date', label: 'Planned Move-Out Date', type: 'date', required: true },
      { name: 'forwarding_address', label: 'Forwarding Address (for deposit return)', type: 'textarea', required: true },
      { name: 'reason', label: 'Reason for Termination', type: 'textarea', required: false },
    ]
  },
  noise_complaint: {
    fields: [
      { name: 'tenant_name', label: 'Your Name', type: 'text', required: true },
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
      { name: 'property_address', label: 'Property Address', type: 'text', required: true },
      { name: 'noise_source', label: 'Source of Noise', type: 'text', required: true },
      { name: 'dates_times', label: 'Dates and Times of Incidents', type: 'textarea', required: true },
      { name: 'impact', label: 'Impact on You', type: 'textarea', required: false },
    ]
  },
};

const TEMPLATE_PROMPTS = {
  deposit_request: `Draft a polite, neutral, **non-legal** deposit return request in EN and TH.
Include facts (dates, amounts), cite tenancy best practices, and ask for return within 7 days.
End with contact details. Keep it professional and concise.
Format with clear sections for English and Thai.`,

  deposit_late: `Write a courteous overdue reminder (EN and TH). Mention the days overdue,
request a timeline, ask for itemized deductions if any. Neutral tone.
Format with clear sections for English and Thai.`,

  repair_dispute: `Draft a neutral dispute letter in EN/TH contesting repair charges.
Include itemized costs and evidence references. Documentation tone; no legal advice.
Format with clear sections for English and Thai.`,

  pdpa_request: `Draft EN/TH request under PDPA to obtain personal data and copies of lease & receipts.
Cite PDPA generally without legal advice. Keep neutral and professional.
Format with clear sections for English and Thai.`,

  pre_move_out: `Prepare a clear pre-move-out notice in EN/TH confirming the move-out date,
scheduling inspection, and listing keys/cleaning expectations.
Format with clear sections for English and Thai.`,

  handover_check: `Generate a bilingual checklist with: rooms/items, condition notes, meter readings,
photo attachment slots, and signature lines. Format as a structured inspection form.
Include sections for both English and Thai.`,

  contract_clarification: `Draft EN/TH questions asking for clarification of specific lease clauses.
Neutral, documentation tone. No legal advice.
Format with clear sections for English and Thai.`
};

export default function TemplateForm() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('templateId') || 'deposit_request';

  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [letterSubject, setLetterSubject] = useState(''); // New state for letter subject
  const [generatedDocId, setGeneratedDocId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('both');
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  const schema = TEMPLATE_SCHEMAS[templateId] || TEMPLATE_SCHEMAS.deposit_request;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setGeneratedLetter('');
    setLetterSubject('');

    let llmPrompt = '';
    let llmSystemContext = '';
    let finalFormattingInstruction = '\n\nFormat: Professional letter with proper Thai/English formatting, date, addresses, formal greeting, body paragraphs, and signature block.';

    try {
      const fieldValues = schema.fields.map(f => `${f.label}: ${formData[f.name] || 'N/A'}`).join('\n');

      if (templateId === 'lease_extension') {
        llmSystemContext = language === 'th'
          ? 'คุณเป็นผู้เชี่ยวชาญด้านกฎหมายอสังหาริมทรัพย์ในประเทศไทย เขียนจดหมายขอต่อสัญญาเช่าอย่างเป็นทางการและสุภาพ'
          : 'You are a Thai real estate legal expert. Write a formal and polite lease extension request letter.';
        llmPrompt = language === 'th'
          ? `เขียนจดหมายขอต่อสัญญาเช่าอย่างเป็นทางการ:

ชื่อผู้เช่า: ${formData.tenant_name || 'N/A'}
ชื่อเจ้าของบ้าน: ${formData.landlord_name || 'N/A'}
ที่อยู่อาคาร: ${formData.property_address || 'N/A'}
วันที่สัญญาสิ้นสุดปัจจุบัน: ${formData.current_end_date || 'N/A'}
วันที่สิ้นสุดที่เสนอใหม่: ${formData.proposed_new_end_date || 'N/A'}
เหตุผลในการขอต่อ: ${formData.reason || 'ต้องการอยู่ต่อในทำเล'}

จดหมายควร:
- สุภาพและเป็นทางการ
- แสดงความขอบคุณสำหรับการให้เช่าปัจจุบัน
- ระบุวันที่ชัดเจน
- ระบุความตั้งใจในการดูแลรักษาทรัพย์สิน
- เสนอหารือเกี่ยวกับข้อกำหนดหากจำเป็น
- ลงท้ายด้วยข้อมูลติดต่อ`
          : `Write a formal lease extension request letter:

Tenant Name: ${formData.tenant_name || 'N/A'}
Landlord Name: ${formData.landlord_name || 'N/A'}
Property Address: ${formData.property_address || 'N/A'}
Current End Date: ${formData.current_end_date || 'N/A'}
Proposed New End Date: ${formData.proposed_new_end_date || 'N/A'}
Reason for Extension: ${formData.reason || 'Wish to continue residing at the property'}

The letter should:
- Be formal and polite
- Express appreciation for current tenancy
- Clearly state dates
- Mention commitment to property care
- Offer to discuss terms if needed
- End with contact information`;
      } else if (templateId === 'lease_termination') {
        llmSystemContext = language === 'th'
          ? 'คุณเป็นผู้เชี่ยวชาญด้านกฎหมายอสังหาริมทรัพย์ในประเทศไทย เขียนจดหมายแจ้งยกเลิกสัญญาเช่าอย่างเป็นทางการและสุภาพ'
          : 'You are a Thai real estate legal expert. Write a formal and polite lease termination notice.';
        llmPrompt = language === 'th'
          ? `เขียนจดหมายแจ้งยกเลิกสัญญาเช่าอย่างเป็นทางการ:

ชื่อผู้เช่า: ${formData.tenant_name || 'N/A'}
ชื่อเจ้าของบ้าน: ${formData.landlord_name || 'N/A'}
ที่อยู่อาคาร: ${formData.property_address || 'N/A'}
วันที่สัญญาสิ้นสุด: ${formData.lease_end_date || 'N/A'}
วันที่จะย้ายออก: ${formData.vacate_date || 'N/A'}
ที่อยู่สำหรับส่งเงินมัดจำ: ${formData.forwarding_address || 'N/A'}
เหตุผล: ${formData.reason || 'เหตุผลส่วนตัว'}

จดหมายควร:
- สุภาพและเป็นมืออาชีพ
- แจ้งเจตนาที่ชัดเจนในการยกเลิก
- ระบุวันที่ชัดเจน
- ขอนัดตรวจสอบทรัพย์สิน
- ระบุที่อยู่สำหรับคืนเงินมัดจำ
- แสดงความขอบคุณสำหรับการให้เช่า
- ลงท้ายด้วยข้อมูลติดต่อ`
          : `Write a formal lease termination notice:

Tenant Name: ${formData.tenant_name || 'N/A'}
Landlord Name: ${formData.landlord_name || 'N/A'}
Property Address: ${formData.property_address || 'N/A'}
Lease End Date: ${formData.lease_end_date || 'N/A'}
Move-Out Date: ${formData.vacate_date || 'N/A'}
Forwarding Address: ${formData.forwarding_address || 'N/A'}
Reason: ${formData.reason || 'Personal reasons'}

The letter should:
- Be formal and professional
- Clearly state intent to terminate
- Specify all relevant dates
- Request final inspection appointment
- Provide forwarding address for deposit return
- Express gratitude for tenancy
- End with contact information`;
      } else if (templateId === 'noise_complaint') {
        llmSystemContext = language === 'th'
          ? 'คุณเป็นผู้เชี่ยวชาญด้านกฎหมายอสังหาริมทรัพย์ในประเทศไทย เขียนจดหมายร้องเรียนเสียงรบกวนอย่างเป็นทางการและสุภาพ'
          : 'You are a Thai real estate legal expert. Write a formal and polite noise complaint letter.';
        llmPrompt = language === 'th'
          ? `เขียนจดหมายร้องเรียนเสียงรบกวนอย่างเป็นทางการ:

ชื่อผู้เช่า: ${formData.tenant_name || 'N/A'}
ชื่อเจ้าของบ้าน: ${formData.landlord_name || 'N/A'}
ที่อยู่อาคาร: ${formData.property_address || 'N/A'}
แหล่งที่มาของเสียง: ${formData.noise_source || 'N/A'}
วันที่และเวลาที่เกิดเหตุ: ${formData.dates_times || 'N/A'}
ผลกระทบ: ${formData.impact || 'รบกวนการนอนหลับและการทำงาน'}

จดหมายควร:
- สุภาพแต่มั่นคง
- อธิบายปัญหาอย่างชัดเจน
- ระบุวันที่และเวลาที่เฉพาะเจาะจง
- อธิบายผลกระทบต่อคุณภาพชีวิต
- อ้างถึงข้อตกลงสัญญาเช่าหากเกี่ยวข้อง
- ขอให้แก้ไขปัญหา
- เสนอให้หารือเพื่อหาทางออก
- ลงท้ายด้วยข้อมูลติดต่อ`
          : `Write a formal noise complaint letter:

Tenant Name: ${formData.tenant_name || 'N/A'}
Landlord Name: ${formData.landlord_name || 'N/A'}
Property Address: ${formData.property_address || 'N/A'}
Source of Noise: ${formData.noise_source || 'N/A'}
Dates and Times: ${formData.dates_times || 'N/A'}
Impact: ${formData.impact || 'Disturbing sleep and work'}

The letter should:
- Be polite but firm
- Clearly describe the problem
- Specify dates and times
- Explain impact on quality of life
- Reference lease agreement if relevant
- Request resolution
- Offer to discuss solutions
- End with contact information`;
      } else {
        // Existing templates logic
        llmPrompt = `${TEMPLATE_PROMPTS[templateId]}

Language: ${language === 'both' ? 'Generate both English and Thai versions' : language === 'en' ? 'English only' : 'Thai only'}

Input Data:
${fieldValues}

IMPORTANT:
- This is documentation guidance, not legal advice
- Keep neutral tone for both parties
- Format professionally with proper headers and sections
- If bilingual, clearly separate English and Thai sections

Generate the letter now.`;
        llmSystemContext = ''; // No specific system context for old templates
      }

      const fullPromptForLLM = `${llmSystemContext ? llmSystemContext + '\n\n' : ''}${llmPrompt}${finalFormattingInstruction}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: fullPromptForLLM,
        response_json_schema: {
          type: "object",
          properties: {
            letter_text: { type: "string" },
            subject: { type: "string" }
          },
          required: ["letter_text", "subject"]
        }
      });

      setGeneratedLetter(result.letter_text);
      setLetterSubject(result.subject);

      // Step 2: Save document to database
      const templateTitles = {
        deposit_request: 'Deposit Return Request',
        deposit_late: 'Late Deposit Return Reminder',
        repair_dispute: 'Repair Cost Dispute',
        pdpa_request: 'PDPA Data Request',
        pre_move_out: 'Pre-Move-Out Notice',
        handover_check: 'Handover Inspection Checklist',
        contract_clarification: 'Contract Clarification Request',
        lease_extension: 'Lease Extension Request',
        lease_termination: 'Lease Termination Notice',
        noise_complaint: 'Noise Complaint',
      };

      const doc = await base44.entities.Document.create({
        type: 'letter',
        label: result.subject || templateTitles[templateId] || 'Generated Letter'
      });

      setGeneratedDocId(doc.id);

    } catch (err) {
      console.error('Failed to generate letter:', err);
      setError(err.message || (language === 'th' ? 'การสร้างจดหมายล้มเหลว กรุณาลองอีกครั้ง' : 'Failed to generate letter. Please try again.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const defaultFilename = `${templateId}_${Date.now()}.txt`;
    a.download = letterSubject ? `${letterSubject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt` : defaultFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Templates"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Generate Letter</h1>
            <p className="text-slate-600">Fill in the details below</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!generatedLetter ? (
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b">
              <CardTitle>Letter Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">English + Thai</SelectItem>
                      <SelectItem value="en">English Only</SelectItem>
                      <SelectItem value="th">Thai Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {schema.fields.map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-red-600 ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        rows={4}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Letter...
                    </>
                  ) : (
                    'Generate Letter'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-none shadow-xl">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>{letterSubject || 'Generated Letter'}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6 font-serif whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {generatedLetter}
                </div>
              </CardContent>
            </Card>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setGeneratedLetter('');
                setLetterSubject('');
                setError(null);
              }}
            >
              Generate Another Letter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
