
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
  
  // Assuming base44.user provides user information if available
  const user = base44.user;

  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [generatedDocId, setGeneratedDocId] = useState(null);
  const [copied, setCopied] = useState(false);
  // Initialize language state with user preference or default to 'en'
  const [language, setLanguage] = useState(user?.language || 'en');
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D'
  } : {
    bg: '#0C3B2E',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#e2e8f0',
    inputBg: '#FFFFFF'
  };

  const schema = TEMPLATE_SCHEMAS[templateId] || TEMPLATE_SCHEMAS.deposit_request;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const prompt = TEMPLATE_PROMPTS[templateId];
      const fieldValues = schema.fields.map(f => `${f.label}: ${formData[f.name] || 'N/A'}`).join('\n');
      
      // Step 1: Generate letter using AI
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompt}

Language: ${language === 'both' ? 'Generate both English and Thai versions' : language === 'en' ? 'English only' : 'Thai only'}

Input Data:
${fieldValues}

IMPORTANT: 
- This is documentation guidance, not legal advice
- Keep neutral tone for both parties
- Format professionally with proper headers and sections
- If bilingual, clearly separate English and Thai sections

Generate the letter now.`,
        response_json_schema: {
          type: "object",
          properties: {
            letter: { type: "string" }
          }
        }
      });

      setGeneratedLetter(result.letter);

      // Step 2: Save document to database
      const templateTitles = {
        deposit_request: 'Deposit Return Request',
        deposit_late: 'Late Deposit Return Reminder',
        repair_dispute: 'Repair Cost Dispute',
        pdpa_request: 'PDPA Data Request',
        pre_move_out: 'Pre-Move-Out Notice',
        handover_check: 'Handover Inspection Checklist',
        contract_clarification: 'Contract Clarification Request'
      };

      const doc = await base44.entities.Document.create({
        type: 'letter',
        label: templateTitles[templateId] || 'Generated Letter'
      });

      setGeneratedDocId(doc.id);
      
    } catch (err) {
      console.error('Failed to generate letter:', err);
      setError(err.message || 'Failed to generate letter. Please try again.');
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
    a.download = `${templateId}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
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
                  <CardTitle>Generated Letter</CardTitle>
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
