import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale, AlertCircle, Upload, CheckCircle2, Crown, Zap, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { useFeatureAccess } from "../components/shared/FeatureGate";

export default function ResolveCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    dispute_amount: '',
    summary: '',
    fast_track: false,
    letter_pack: false,
    files: []
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { hasAccess: hasMemberPrice } = useFeatureAccess('resolve_member_price');
  const isMember = user?.plan_tier && ['lite', 'protect', 'secure'].includes(user.plan_tier);
  
  const baseFee = isMember ? 1490 : 2490;
  const successFeeRate = isMember ? 10 : 15;

  const createCaseMutation = useMutation({
    mutationFn: async (data) => {
      const caseData = await base44.entities.Case.create({
        dispute_amount: parseFloat(data.dispute_amount),
        summary: data.summary,
        fast_track: data.fast_track,
        letter_pack: data.letter_pack,
        is_member_at_creation: isMember,
        success_fee_rate: successFeeRate,
        status: 'intake'
      });

      return caseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      navigate(createPageUrl("Account"));
    },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      setFormData({
        ...formData,
        files: [...formData.files, ...results.map(r => r.file_url)]
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCaseMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Open Dispute Case</h1>
          </div>
          <p className="text-slate-600">Get professional help resolving your rental dispute</p>
        </div>

        {/* Pricing Card */}
        <Card className="mb-6 border-none shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">Service Fees</h3>
                {isMember && (
                  <Badge className="bg-emerald-100 text-emerald-700 mb-3">
                    <Crown className="w-3 h-3 mr-1" />
                    Member Discount Applied
                  </Badge>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Base Fee:</span>
                <span className="text-2xl font-bold text-slate-900">
                  ฿{baseFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Success Fee:</span>
                <span className="font-semibold text-slate-900">{successFeeRate}% of recovered amount</span>
              </div>
            </div>

            {!isMember && (
              <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  Save ฿1,000 and get 10% success fee with a membership plan
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Form */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="amount">Dispute Amount (฿)</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  value={formData.dispute_amount}
                  onChange={(e) => setFormData({...formData, dispute_amount: e.target.value})}
                  placeholder="e.g. 10000"
                  className="text-lg"
                />
                <p className="text-xs text-slate-500 mt-1">
                  The amount you're disputing (e.g., withheld deposit, overcharges)
                </p>
              </div>

              <div>
                <Label htmlFor="summary">Case Summary</Label>
                <Textarea
                  id="summary"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder="Describe your issue in detail..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Include dates, amounts, and what you've tried so far
                </p>
              </div>

              <div>
                <Label>Supporting Documents</Label>
                <div className="mt-2 border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      {uploading ? 'Uploading...' : 'Click to upload evidence (lease, photos, receipts, etc.)'}
                    </p>
                  </label>
                  {formData.files.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-emerald-600 font-medium">
                        <CheckCircle2 className="w-4 h-4 inline mr-1" />
                        {formData.files.length} file(s) uploaded
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Add-ons */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-3">Optional Services</h4>
                
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200">
                  <Checkbox
                    id="fast_track"
                    checked={formData.fast_track}
                    onCheckedChange={(checked) => setFormData({...formData, fast_track: checked})}
                  />
                  <div className="flex-1">
                    <label htmlFor="fast_track" className="font-medium text-slate-900 cursor-pointer flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      Fast Track (+฿500)
                    </label>
                    <p className="text-xs text-slate-500">Priority handling, 24-48hr response time</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200">
                  <Checkbox
                    id="letter_pack"
                    checked={formData.letter_pack}
                    onCheckedChange={(checked) => setFormData({...formData, letter_pack: checked})}
                  />
                  <div className="flex-1">
                    <label htmlFor="letter_pack" className="font-medium text-slate-900 cursor-pointer flex items-center gap-2">
                      <Scale className="w-4 h-4 text-blue-600" />
                      Letter Pack (+฿300)
                    </label>
                    <p className="text-xs text-slate-500">Professional demand letters in EN & TH</p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Total Due Now:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ฿{(
                      baseFee + 
                      (formData.fast_track ? 500 : 0) + 
                      (formData.letter_pack ? 300 : 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  + {successFeeRate}% success fee on recovered amount
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                disabled={createCaseMutation.isPending}
              >
                {createCaseMutation.isPending ? 'Opening Case...' : 'Open Case & Proceed to Payment'}
              </Button>

              <p className="text-xs text-center text-slate-500">
                By opening a case, you agree to our <a href="#" className="text-blue-600 underline">Terms of Service</a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}