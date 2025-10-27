import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale, Upload, DollarSign, Zap, FileText, ArrowLeft, AlertCircle, Crown, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const PRICING = {
  resolve_member: {
    amount: 1490,
    priceId: 'price_1SM6woQwoI6NhlUxv0mreZbl',
    label: 'Member Rate'
  },
  resolve_public: {
    amount: 2490,
    priceId: 'price_1SM6w0QwoI6NhlUxZQgIEMGH',
    label: 'Public Rate'
  },
  fast_track_member: {
    amount: 300,
    priceId: 'price_1SM71EQwoI6NhlUxXJb2es44',
    label: 'Fast Track (Member)'
  },
  fast_track_public: {
    amount: 300,
    priceId: 'price_1SM6znQwoI6NhlUxOijFSG0w',
    label: 'Fast Track (Public)'
  },
  letter_pack_member: {
    amount: 900,
    priceId: 'price_1SM72qQwoI6NhlUxENRUSz3Q',
    label: 'Letter Pack (Member)'
  },
  letter_pack_public: {
    amount: 900,
    priceId: 'price_1SM72EQwoI6NhlUxAaEyx4Fl',
    label: 'Letter Pack (Public)'
  }
};

export default function ResolveCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isMember = user?.plan_tier && ['lite', 'protect', 'secure'].includes(user.plan_tier);
  const memberDiscountPercent = 5;

  const [formData, setFormData] = useState({
    dispute_amount: '',
    summary: '',
    fast_track: false,
    letter_pack: false
  });

  const calculateTotal = () => {
    let total = isMember ? PRICING.resolve_member.amount : PRICING.resolve_public.amount;
    
    if (formData.fast_track) {
      total += isMember ? PRICING.fast_track_member.amount : PRICING.fast_track_public.amount;
    }
    
    if (formData.letter_pack) {
      total += isMember ? PRICING.letter_pack_member.amount : PRICING.letter_pack_public.amount;
    }
    
    return total;
  };

  const getSuccessFeeRate = () => {
    if (isMember) return 10;
    return 15;
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
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

    try {
      // Create the case first
      const caseData = {
        dispute_amount: parseFloat(formData.dispute_amount),
        summary: formData.summary,
        fast_track: formData.fast_track,
        letter_pack: formData.letter_pack,
        is_member_at_creation: isMember,
        success_fee_rate: getSuccessFeeRate(),
        status: 'intake'
      };

      const newCase = await base44.entities.Case.create(caseData);

      // Create payment record
      const paymentData = {
        type: 'case',
        amount: calculateTotal(),
        currency: 'THB',
        provider: 'stripe',
        status: 'pending'
      };

      const payment = await base44.entities.Payment.create(paymentData);

      // Redirect to Stripe checkout
      const basePrice = isMember ? PRICING.resolve_member : PRICING.resolve_public;
      let checkoutUrl = `https://buy.stripe.com/test_${basePrice.priceId}?prefilled_email=${user.email}&client_reference_id=${newCase.id}`;
      
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('Failed to create case:', error);
      alert('Failed to create case. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Scale className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Open a Resolve Case</h1>
            </div>
            <p className="text-slate-600">Get professional help with your rental dispute</p>
          </div>
        </div>

        {/* Pricing Banner */}
        <Card className={`mb-6 border-none shadow-lg ${isMember ? 'bg-gradient-to-r from-emerald-500 to-emerald-700' : 'bg-gradient-to-r from-blue-600 to-blue-800'} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {isMember ? <Crown className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                  <h3 className="text-xl font-bold">
                    {isMember ? 'Member Pricing' : 'Standard Pricing'}
                  </h3>
                </div>
                <p className="text-sm opacity-90 mb-1">
                  Setup Fee: <span className="font-bold text-2xl">฿{isMember ? '1,490' : '2,490'}</span>
                </p>
                <p className="text-sm opacity-90">
                  Success Fee: <span className="font-bold">{getSuccessFeeRate()}%</span> of recovered amount
                </p>
                {isMember && (
                  <Badge className="mt-2 bg-white/20 text-white border-white/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Member discount active
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Form */}
        <Card className="border-none shadow-xl">
          <CardHeader className="border-b border-slate-100">
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
                  placeholder="10000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Amount you're seeking to recover
                </p>
              </div>

              <div>
                <Label htmlFor="summary">Case Summary</Label>
                <Textarea
                  id="summary"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder="Describe your situation: what happened, what you've tried, what you're seeking..."
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="files">Supporting Documents</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Upload lease, receipts, photos, correspondence, etc.
                </p>
                {files.length > 0 && (
                  <div className="mt-2">
                    <Badge variant="outline">{files.length} file(s) uploaded</Badge>
                  </div>
                )}
              </div>

              {/* Add-ons */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900">Add-ons (Optional)</h3>
                
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <Checkbox
                    id="fast_track"
                    checked={formData.fast_track}
                    onCheckedChange={(checked) => setFormData({...formData, fast_track: checked})}
                  />
                  <div className="flex-1">
                    <Label htmlFor="fast_track" className="flex items-center gap-2 cursor-pointer">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold">Fast Track 24h</span>
                      <Badge variant="outline" className="ml-auto">+฿300</Badge>
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      Priority queue with 24h first response time
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <Checkbox
                    id="letter_pack"
                    checked={formData.letter_pack}
                    onCheckedChange={(checked) => setFormData({...formData, letter_pack: checked})}
                  />
                  <div className="flex-1">
                    <Label htmlFor="letter_pack" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">Legal Letter Pack</span>
                      <Badge variant="outline" className="ml-auto">+฿900</Badge>
                    </Label>
                    <p className="text-xs text-slate-600 mt-1">
                      3 professional demand letters (EN/TH)
                    </p>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Setup Fee</span>
                  <span className="text-2xl font-bold text-slate-900">฿{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Success Fee ({getSuccessFeeRate()}%)</span>
                  <span>Due only if successful</span>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  By proceeding, you acknowledge this is a documentation service. We are not a law firm. 
                  For complex disputes, we may refer you to licensed attorneys.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={uploading}
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Proceed to Payment – ฿{calculateTotal().toLocaleString()}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}