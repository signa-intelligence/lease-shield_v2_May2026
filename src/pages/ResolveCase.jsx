import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale, Upload, Zap, FileText, Shield, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFeatureAccess } from "../components/shared/FeatureGate";

export default function ResolveCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { hasAccess: hasMemberPrice } = useFeatureAccess('resolve_member_price');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    dispute_amount: '',
    summary: '',
    files: [],
    fast_track: false,
    letter_pack: false
  });

  const isMember = user?.plan_tier && user.plan_tier !== 'free';
  const baseFee = isMember ? 1490 : 2490;
  const fastTrackFee = 300;
  const letterPackFee = 900;
  
  const totalCost = baseFee + 
    (formData.fast_track ? fastTrackFee : 0) + 
    (formData.letter_pack ? letterPackFee : 0);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map(r => r.file_url);
      
      setFormData({
        ...formData,
        files: [...formData.files, ...fileUrls]
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Create the case
      const caseData = await base44.entities.Case.create({
        dispute_amount: parseFloat(formData.dispute_amount),
        summary: formData.summary,
        status: 'intake',
        is_member_at_creation: isMember,
        fast_track: formData.fast_track,
        letter_pack: formData.letter_pack,
        success_fee_rate: isMember ? 10 : 15
      });

      // Upload files as documents linked to case
      for (const fileUrl of formData.files) {
        await base44.entities.Document.create({
          type: 'other',
          file_url: fileUrl,
          label: `Case Evidence - ${caseData.id}`
        });
      }

      // Determine price ID based on membership and add-ons
      const basePriceId = isMember ? 
        'price_1SM6woQwoI6NhlUxv0mreZbl' : 
        'price_1SM6w0QwoI6NhlUxZQgIEMGH';

      // Create checkout session with line items
      const lineItems = [
        { priceId: basePriceId, quantity: 1 }
      ];

      if (formData.fast_track) {
        const fastTrackPriceId = isMember ? 
          'price_1SM71EQwoI6NhlUxXJb2es44' : 
          'price_1SM6znQwoI6NhlUxOijFSG0w';
        lineItems.push({ priceId: fastTrackPriceId, quantity: 1 });
      }

      if (formData.letter_pack) {
        const letterPackPriceId = isMember ? 
          'price_1SM72qQwoI6NhlUxENRUSz3Q' : 
          'price_1SM72EQwoI6NhlUxAaEyx4Fl';
        lineItems.push({ priceId: letterPackPriceId, quantity: 1 });
      }

      // Create checkout - need to modify createCheckout function to support multiple line items
      const { url } = await base44.functions.invoke('createCheckout', {
        priceId: basePriceId, // Will need to update function for multiple items
        mode: 'payment',
        metadata: {
          case_id: caseData.id,
          is_member: isMember.toString(),
          fast_track: formData.fast_track.toString(),
          letter_pack: formData.letter_pack.toString()
        }
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Case creation error:', error);
      alert('Failed to create case. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Cases"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Open New Case</h1>
            <p className="text-slate-600">Get professional help resolving your dispute</p>
          </div>
        </div>

        {/* Pricing Banner */}
        <Card className="mb-6 border-none shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-2">Resolve Pricing</h3>
                <div className="text-sm space-y-1">
                  <p>{isMember ? '✓ Member Rate' : '○ Public Rate'}: <span className="font-bold">฿{baseFee}</span> setup + {isMember ? '10%' : '15%'} success fee</p>
                  {!isMember && (
                    <p className="text-blue-100">Members save ฿1,000 + lower success fee</p>
                  )}
                </div>
              </div>
              {isMember && (
                <Badge className="bg-white/20 text-white border-white/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Member
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Case Form */}
        <Card className="border-none shadow-xl">
          <CardHeader className="border-b">
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="dispute_amount">Dispute Amount (฿) *</Label>
                <Input
                  id="dispute_amount"
                  type="number"
                  required
                  value={formData.dispute_amount}
                  onChange={(e) => setFormData({...formData, dispute_amount: e.target.value})}
                  placeholder="e.g. 10000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  How much money is in dispute?
                </p>
              </div>

              <div>
                <Label htmlFor="summary">Case Summary *</Label>
                <Textarea
                  id="summary"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder="Describe your dispute in detail..."
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="files">Evidence Files</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Upload receipts, photos, emails, or other evidence
                </p>
                {formData.files.length > 0 && (
                  <p className="text-sm text-emerald-600 mt-2">
                    ✓ {formData.files.length} file(s) uploaded
                  </p>
                )}
              </div>

              {/* Add-ons */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-bold text-slate-900">Add-Ons</h3>
                
                <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                  <Checkbox
                    id="fast_track"
                    checked={formData.fast_track}
                    onCheckedChange={(checked) => setFormData({...formData, fast_track: checked})}
                  />
                  <div className="flex-1">
                    <Label htmlFor="fast_track" className="flex items-center gap-2 cursor-pointer">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold">Fast Track 24h</span>
                      <Badge variant="outline">+฿300</Badge>
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Priority queue - initial review within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                  <Checkbox
                    id="letter_pack"
                    checked={formData.letter_pack}
                    onCheckedChange={(checked) => setFormData({...formData, letter_pack: checked})}
                  />
                  <div className="flex-1">
                    <Label htmlFor="letter_pack" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">Legal Letter Pack</span>
                      <Badge variant="outline">+฿900</Badge>
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Professional demand letters drafted by our team
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Cost */}
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700">Total Setup Cost</span>
                  <span className="text-3xl font-bold text-slate-900">฿{totalCost.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-600">
                  + {isMember ? '10%' : '15%'} success fee only if we recover your money
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                disabled={processing || uploading}
              >
                {processing ? 'Processing...' : `Proceed to Payment - ฿${totalCost.toLocaleString()}`}
              </Button>

              <p className="text-xs text-center text-slate-500">
                By submitting, you agree to our Terms of Service. We'll review your case within 48 hours {formData.fast_track && '(24h with Fast Track)'}.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}