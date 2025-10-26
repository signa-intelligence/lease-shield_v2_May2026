import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TemplateForm() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('templateId');
  
  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    landlord_name: '',
    property_address: '',
    issue_description: '',
    additional_details: ''
  });

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional, formal letter for a tenant in Thailand. 

Template type: ${templateId}
Landlord name: ${formData.landlord_name}
Property address: ${formData.property_address}
Issue: ${formData.issue_description}
Additional details: ${formData.additional_details}

Create a well-structured, polite but firm letter that clearly states the tenant's concerns and requests. Include:
- Proper formal greeting
- Clear statement of the issue
- Reference to relevant tenant rights or lease terms
- Specific request for action
- Professional closing
- Placeholder for tenant signature and date`,
        response_json_schema: {
          type: "object",
          properties: {
            letter: { type: "string" }
          }
        }
      });

      setGeneratedLetter(result.letter);
    } catch (error) {
      console.error('Failed to generate letter:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {!generatedLetter ? (
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b">
              <CardTitle>Letter Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <Label htmlFor="landlord">Landlord/Property Manager Name</Label>
                  <Input
                    id="landlord"
                    required
                    value={formData.landlord_name}
                    onChange={(e) => setFormData({...formData, landlord_name: e.target.value})}
                    placeholder="Mr. John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    required
                    value={formData.property_address}
                    onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                    placeholder="123 Main Street, Bangkok"
                  />
                </div>
                <div>
                  <Label htmlFor="issue">Issue Description</Label>
                  <Textarea
                    id="issue"
                    required
                    value={formData.issue_description}
                    onChange={(e) => setFormData({...formData, issue_description: e.target.value})}
                    placeholder="Briefly describe the issue..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="details">Additional Details (Optional)</Label>
                  <Textarea
                    id="details"
                    value={formData.additional_details}
                    onChange={(e) => setFormData({...formData, additional_details: e.target.value})}
                    placeholder="Any additional context or information..."
                    rows={3}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={generating}
                >
                  {generating ? 'Generating Letter...' : 'Generate Letter'}
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
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6 font-serif whitespace-pre-wrap">
                  {generatedLetter}
                </div>
              </CardContent>
            </Card>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setGeneratedLetter('')}
            >
              Generate Another Letter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}