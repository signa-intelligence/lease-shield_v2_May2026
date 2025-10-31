
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale, Shield, Clock, Mail, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useFeatureAccess } from "../components/shared/FeatureGate";

export default function ResolveCase() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dispute_amount: '',
    summary: '',
    fast_track: false,
    letter_pack: false
  });
  const [selectedLease, setSelectedLease] = useState(null);

  const queryClient = useQueryClient();
  const { hasAccess: isMember } = useFeatureAccess('resolve_member_price');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const createCaseMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      navigate(createPageUrl("Cases"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const caseData = {
      ...formData,
      dispute_amount: parseFloat(formData.dispute_amount),
      lease_id: selectedLease,
      status: 'intake',
      is_member_at_creation: isMember
    };

    createCaseMutation.mutate(caseData);
  };

  const language = user?.language || 'en';
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

  // Pricing based on membership
  const fastTrackPrice = isMember ? 300 : 500;
  const letterPackPrice = isMember ? 900 : 1500;
  const totalAddons = (formData.fast_track ? fastTrackPrice : 0) + (formData.letter_pack ? letterPackPrice : 0);

  const t = {
    en: {
      title: "Open Dispute Case",
      subtitle: "Get help resolving rental disputes with professional support",
      notAvailable: "Resolve Service Coming Soon",
      notAvailableDesc: "This feature is under development and will be available soon.",
      leaseLabel: "Related Lease (Optional)",
      selectLease: "Select a lease",
      amountLabel: "Dispute Amount (฿)",
      summaryLabel: "Case Summary",
      summaryPlaceholder: "Describe your dispute: What happened? What are you claiming? What evidence do you have?",
      addons: "Available Add-ons",
      fastTrack: "Fast Track",
      fastTrackDesc: "Priority review within 12 hours instead of standard 24-48 hours",
      letterPack: "Legal Letter Pack",
      letterPackDesc: "Professional escalation templates for serious disputes",
      memberPrice: "Member Price",
      publicPrice: "Public Price",
      totalCost: "Total Add-ons Cost",
      submitCase: "Submit Case",
      submitting: "Submitting..."
    },
    th: {
      title: "เปิดคดีข้อพิพาท",
      subtitle: "รับความช่วยเหลือในการแก้ไขข้อพิพาทการเช่าด้วยการสนับสนุนจากผู้เชี่ยวชาญ",
      notAvailable: "บริการ Resolve เร็วๆ นี้",
      notAvailableDesc: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนาและจะพร้อมใช้งานในเร็วๆ นี้",
      leaseLabel: "สัญญาเช่าที่เกี่ยวข้อง (ไม่บังคับ)",
      selectLease: "เลือกสัญญาเช่า",
      amountLabel: "จำนวนเงินที่พิพาท (฿)",
      summaryLabel: "สรุปคดี",
      summaryPlaceholder: "อธิบายข้อพิพาทของคุณ: เกิดอะไรขึ้น? คุณเรียกร้องอะไร? คุณมีหลักฐานอะไร?",
      addons: "บริการเสริมที่มี",
      fastTrack: "Fast Track",
      fastTrackDesc: "ตรวจสอบแบบเร่งด่วนภายใน 12 ชั่วโมงแทนที่จะเป็น 24-48 ชั่วโมงมาตรฐาน",
      letterPack: "ชุดจดหมายทางกฎหมาย",
      letterPackDesc: "เทมเพลตการยกระดับอย่างมืออาชีพสำหรับข้อพิพาทร้ายแรง",
      memberPrice: "ราคาสมาชิก",
      publicPrice: "ราคาทั่วไป",
      totalCost: "ค่าใช้จ่ายบริการเสริมทั้งหมด",
      submitCase: "ส่งคดี",
      submitting: "กำลังส่ง..."
    }
  };

  const strings = t[language];

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold text-ls-charcoal" style={{ color: isDarkMode ? colors.textPrimary : '#0C3B2E' }}>{strings.title}</h1>
          </div>
          <p className="text-slate-600" style={{ color: isDarkMode ? colors.textSecondary : '#4B5563' }}>{strings.subtitle}</p>
        </div>

        {/* Coming Soon Notice */}
        <Alert className="mb-6 bg-blue-50 border-blue-200" style={{ backgroundColor: isDarkMode ? '#2A2D30' : '#E0F2FE', borderColor: isDarkMode ? '#3A3D40' : '#BFDBFE' }}>
          <AlertCircle className="h-4 w-4 text-blue-600" style={{ color: isDarkMode ? '#60A5FA' : '#2563EB' }} />
          <AlertDescription className="text-blue-800" style={{ color: isDarkMode ? '#9CA3AF' : '#1E40AF' }}>
            <div className="font-semibold mb-1" style={{ color: isDarkMode ? colors.textPrimary : '#1E40AF' }}>{strings.notAvailable}</div>
            <p className="text-sm">{strings.notAvailableDesc}</p>
          </AlertDescription>
        </Alert>

        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
          <CardHeader className="border-b" style={{ backgroundColor: isDarkMode ? '#3A3D40' : '#ECEFED', borderColor: colors.borderColor }}>
            <CardTitle style={{ color: isDarkMode ? colors.textPrimary : '#0C3B2E' }}>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lease Selection */}
              <div>
                <Label htmlFor="lease" style={{ color: isDarkMode ? colors.textSecondary : '#334155' }}>{strings.leaseLabel}</Label>
                <select
                  id="lease"
                  value={selectedLease || ''}
                  onChange={(e) => setSelectedLease(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  style={{ backgroundColor: colors.inputBg, color: isDarkMode ? colors.textPrimary : '#334155', borderColor: isDarkMode ? colors.borderColor : '#CBD5E1' }}
                >
                  <option value="">{strings.selectLease}</option>
                  {leases.map((lease) => (
                    <option key={lease.id} value={lease.id}>
                      {lease.property_address || `Lease ${lease.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dispute Amount */}
              <div>
                <Label htmlFor="amount" style={{ color: isDarkMode ? colors.textSecondary : '#334155' }}>{strings.amountLabel}</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  value={formData.dispute_amount}
                  onChange={(e) => setFormData({...formData, dispute_amount: e.target.value})}
                  placeholder="10000"
                  style={{ backgroundColor: colors.inputBg, color: isDarkMode ? colors.textPrimary : '#334155', borderColor: isDarkMode ? colors.borderColor : '#CBD5E1' }}
                />
              </div>

              {/* Summary */}
              <div>
                <Label htmlFor="summary" style={{ color: isDarkMode ? colors.textSecondary : '#334155' }}>{strings.summaryLabel}</Label>
                <Textarea
                  id="summary"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder={strings.summaryPlaceholder}
                  rows={6}
                  style={{ backgroundColor: colors.inputBg, color: isDarkMode ? colors.textPrimary : '#334155', borderColor: isDarkMode ? colors.borderColor : '#CBD5E1' }}
                />
              </div>

              {/* Add-ons Section */}
              <div className="pt-4 border-t" style={{ borderColor: isDarkMode ? colors.borderColor : '#E2E8F0' }}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: isDarkMode ? colors.textPrimary : '#0C3B2E' }}>
                  <Zap className="w-5 h-5 text-ls-gold" />
                  {strings.addons}
                </h3>

                {/* Fast Track */}
                <Card className="mb-4 border-2 border-ls-forest/20 hover:border-ls-forest/40 transition-colors" style={{ backgroundColor: colors.cardBg, borderColor: isDarkMode ? (formData.fast_track ? '#14532d' : colors.borderColor) : (formData.fast_track ? '#A7F3D0' : '#D1FAE5'), transition: 'all 0.2s' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="fast_track"
                        checked={formData.fast_track}
                        onCheckedChange={(checked) => setFormData({...formData, fast_track: checked})}
                        className="mt-1"
                        style={{ borderColor: isDarkMode ? colors.borderColor : '#D1FAE5' }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-5 h-5 text-ls-forest" />
                          <Label htmlFor="fast_track" className="text-base font-bold cursor-pointer" style={{ color: isDarkMode ? colors.textPrimary : '#0C3B2E' }}>
                            {strings.fastTrack}
                          </Label>
                        </div>
                        <p className="text-sm text-slate-600 mb-3" style={{ color: isDarkMode ? colors.textSecondary : '#4B5563' }}>{strings.fastTrackDesc}</p>
                        <div className="flex gap-3">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200" style={{ backgroundColor: isDarkMode ? '#103E2E' : '#D1FAE5', color: isDarkMode ? '#6EE7B7' : '#047857', borderColor: isDarkMode ? '#226D4D' : '#A7F3D0' }}>
                            {strings.memberPrice}: ฿300
                          </Badge>
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F1F5F9', color: isDarkMode ? '#A8ABAD' : '#475569', borderColor: isDarkMode ? '#4A4F53' : '#E2E8F0' }}>
                            {strings.publicPrice}: ฿500
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-ls-forest" style={{ color: isDarkMode ? '#6EE7B7' : '#0C3B2E' }}>฿{fastTrackPrice}</p>
                        <p className="text-xs text-slate-500" style={{ color: isDarkMode ? colors.textSecondary : '#64748B' }}>{isMember ? strings.memberPrice : strings.publicPrice}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Letter Pack */}
                <Card className="mb-4 border-2 border-ls-gold/30 hover:border-ls-gold/60 transition-colors" style={{ backgroundColor: colors.cardBg, borderColor: isDarkMode ? (formData.letter_pack ? '#7F4F00' : colors.borderColor) : (formData.letter_pack ? '#FCD34D' : '#FEF3C7'), transition: 'all 0.2s' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="letter_pack"
                        checked={formData.letter_pack}
                        onCheckedChange={(checked) => setFormData({...formData, letter_pack: checked})}
                        className="mt-1"
                        style={{ borderColor: isDarkMode ? colors.borderColor : '#FEF3C7' }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-5 h-5 text-ls-gold" />
                          <Label htmlFor="letter_pack" className="text-base font-bold cursor-pointer" style={{ color: isDarkMode ? colors.textPrimary : '#0C3B2E' }}>
                            {strings.letterPack}
                          </Label>
                        </div>
                        <p className="text-sm text-slate-600 mb-3" style={{ color: isDarkMode ? colors.textSecondary : '#4B5563' }}>{strings.letterPackDesc}</p>
                        <div className="flex gap-3">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200" style={{ backgroundColor: isDarkMode ? '#103E2E' : '#D1FAE5', color: isDarkMode ? '#6EE7B7' : '#047857', borderColor: isDarkMode ? '#226D4D' : '#A7F3D0' }}>
                            {strings.memberPrice}: ฿900
                          </Badge>
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200" style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F1F5F9', color: isDarkMode ? '#A8ABAD' : '#475569', borderColor: isDarkMode ? '#4A4F53' : '#E2E8F0' }}>
                            {strings.publicPrice}: ฿1,500
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-ls-gold" style={{ color: isDarkMode ? '#FCD34D' : '#A16207' }}>฿{letterPackPrice}</p>
                        <p className="text-xs text-slate-500" style={{ color: isDarkMode ? colors.textSecondary : '#64748B' }}>{isMember ? strings.memberPrice : strings.publicPrice}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Cost */}
                {totalAddons > 0 && (
                  <div className="mt-4 p-4 bg-ls-forest/5 border-2 border-ls-forest/20 rounded-xl" style={{ backgroundColor: isDarkMode ? '#14532d' : '#D1FAE5', borderColor: isDarkMode ? '#226D4D' : '#A7F3D0' }}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ls-charcoal" style={{ color: isDarkMode ? colors.textPrimary : '#0C3B2E' }}>{strings.totalCost}:</span>
                      <span className="text-2xl font-bold text-ls-forest" style={{ color: isDarkMode ? '#6EE7B7' : '#0C3B2E' }}>฿{totalAddons.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createCaseMutation.isPending}
                style={{
                  width: '100%',
                  backgroundColor: createCaseMutation.isPending ? '#9CA3AF' : '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  cursor: createCaseMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: createCaseMutation.isPending ? 0.6 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!createCaseMutation.isPending) {
                    e.target.style.backgroundColor = '#0a2f25';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!createCaseMutation.isPending) {
                    e.target.style.backgroundColor = '#0C3B2E';
                  }
                }}
              >
                <Scale className="w-5 h-5" />
                {createCaseMutation.isPending ? strings.submitting : strings.submitCase}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
