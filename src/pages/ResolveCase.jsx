import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale, Upload, AlertCircle, CheckCircle2, Crown, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFeatureAccess } from "../components/shared/FeatureGate";

export default function ResolveCase() {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { hasAccess: isMember } = useFeatureAccess('resolve_member_price');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    dispute_amount: '',
    summary: '',
    fast_track: false,
    letter_pack: false
  });

  const basePrice = isMember ? 1490 : 2490;
  const successFee = isMember ? 10 : 15;
  const fastTrackPrice = 300;
  const letterPackPrice = 900;

  const totalUpfront = basePrice + 
    (formData.fast_track ? fastTrackPrice : 0) +
    (formData.letter_pack ? letterPackPrice : 0);

  const createCaseMutation = useMutation({
    mutationFn: async (caseData) => {
      return await base44.entities.Case.create(caseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      alert('Case submitted successfully! We will contact you within 24 hours.');
      setFormData({
        dispute_amount: '',
        summary: '',
        fast_track: false,
        letter_pack: false
      });
      setFiles([]);
    },
  });

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      setFiles([...files, ...results.map(r => r.file_url)]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create case
    await createCaseMutation.mutateAsync({
      dispute_amount: parseFloat(formData.dispute_amount) || 0,
      summary: formData.summary,
      is_member_at_creation: isMember,
      success_fee_rate: successFee,
      fast_track: formData.fast_track,
      letter_pack: formData.letter_pack,
      status: 'intake'
    });

    // In production, redirect to payment
    alert(`Redirecting to payment: ฿${totalUpfront.toLocaleString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Resolve My Case</h1>
          </div>
          <p className="text-slate-600">Professional dispute resolution service</p>
        </div>

        {/* Pricing Banner */}
        <Card className="mb-6 border-none shadow-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">Transparent Pricing</h3>
                <p className="text-purple-100 text-sm">No hidden fees • Success-based model</p>
              </div>
              {isMember && (
                <Badge className="bg-white/20 text-white border-white/30">
                  <Crown className="w-3 h-3 mr-1" />
                  Member Rate
                </Badge>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-100 text-sm mb-1">Upfront Fee</p>
                <p className="text-3xl font-bold">฿{basePrice.toLocaleString()}</p>
                <p className="text-xs text-purple-100 mt-1">One-time case fee</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-100 text-sm mb-1">Success Fee</p>
                <p className="text-3xl font-bold">{successFee}%</p>
                <p className="text-xs text-purple-100 mt-1">Only if we win</p>
              </div>
            </div>
            {!isMember && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg">
                <p className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Members save ฿1,000 + get 5% lower success fee
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Form */}
        <Card className="border-none shadow-xl mb-6">
          <CardHeader className="border-b">
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="dispute_amount">Dispute Amount (฿)</Label>
                <Input
                  id="dispute_amount"
                  type="number"
                  required
                  value={formData.dispute_amount}
                  onChange={(e) => setFormData({...formData, dispute_amount: e.target.value})}
                  placeholder="e.g. 10000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Amount you're trying to recover
                </p>
              </div>

              <div>
                <Label htmlFor="summary">Case Summary</Label>
                <Textarea
                  id="summary"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder="Describe your dispute: What happened? What amount do you want back? What evidence do you have?"
                  rows={6}
                />
              </div>

              <div>
                <Label>Supporting Documents</Label>
                <div className="mt-2 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      {uploading ? 'Uploading...' : 'Click to upload lease, receipts, photos, emails'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG • Max 10MB each</p>
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-slate-700 flex-1 truncate">
                          Document {idx + 1} uploaded
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add-ons */}
              <div className="space-y-3">
                <Label>Optional Add-ons</Label>
                
                <div className="flex items-start space-x-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                  <Checkbox
                    id="fast_track"
                    checked={formData.fast_track}
                    onCheckedChange={(checked) => setFormData({...formData, fast_track: checked})}
                  />
                  <div className="flex-1">
                    <label htmlFor="fast_track" className="flex items-center gap-2 cursor-pointer">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-slate-900">Fast Track 24h</span>
                      <Badge variant="outline" className="ml-auto">+฿300</Badge>
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Priority queue - ops response within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                  <Checkbox
                    id="letter_pack"
                    checked={formData.letter_pack}
                    onCheckedChange={(checked) => setFormData({...formData, letter_pack: checked})}
                  />
                  <div className="flex-1">
                    <label htmlFor="letter_pack" className="flex items-center gap-2 cursor-pointer">
                      <Scale className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-slate-900">Legal Letter Pack</span>
                      <Badge variant="outline" className="ml-auto">+฿900</Badge>
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      3 formal demand letters drafted by legal team
                    </p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900">Total Upfront Payment</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ฿{totalUpfront.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  + {successFee}% success fee if case is won • Full refund if we can't help
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-6"
                disabled={createCaseMutation.isPending}
              >
                {createCaseMutation.isPending ? 'Submitting...' : `Proceed to Payment • ฿${totalUpfront.toLocaleString()}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">How Resolve Works</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Submit Case</h4>
                  <p className="text-sm text-slate-600">
                    Provide details and evidence. Our ops team reviews within 24-48 hours.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Strategy & Negotiation</h4>
                  <p className="text-sm text-slate-600">
                    We draft letters, negotiate with landlord, and guide you through the process.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Resolution</h4>
                  <p className="text-sm text-slate-600">
                    Success fee only applies if we recover your money. No win, no additional fee.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}