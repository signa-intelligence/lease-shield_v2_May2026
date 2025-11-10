
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Scale, 
  Calendar, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Clock,
  CheckCircle2,
  UserCheck,
  Zap,
  Crown,
  Mail,
  Loader2,
  ExternalLink,
  Download,
  Eye // Added Eye icon for Preview
} from "lucide-react";
import { format } from "date-fns";
import LetterPreview from "../components/shared/LetterPreview";

const STATUS_CONFIG = {
  intake: { label: 'Intake', color: 'bg-slate-100 text-slate-800', icon: Clock },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800', icon: Scale },
  waiting: { label: 'Waiting', color: 'bg-purple-100 text-purple-800', icon: Clock },
  user_action: { label: 'Action Required', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  closed: { label: 'Closed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 }
};

export default function CaseDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('caseId');
  const queryClient = useQueryClient();

  const [compilingPack, setCompilingPack] = useState(false);
  const [previewLetter, setPreviewLetter] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: caseItem, isLoading: caseLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const cases = await base44.entities.Case.list();
      return cases.find(c => c.id === caseId);
    },
    enabled: !!caseId,
  });

  const { data: lease } = useQuery({
    queryKey: ['lease', caseItem?.lease_id],
    queryFn: async () => {
      if (!caseItem?.lease_id) return null;
      const leases = await base44.entities.Lease.list();
      return leases.find(l => l.id === caseItem.lease_id);
    },
    enabled: !!caseItem?.lease_id,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
  };

  const handleCompilePack = async () => {
    setCompilingPack(true);
    try {
      const response = await base44.functions.invoke('compileLetterPack', {
        caseId: caseItem.id
      });

      if (response.data.success) {
        // Refresh case data to get the new pack URL
        queryClient.invalidateQueries({ queryKey: ['case', caseId] });
        alert(language === 'th' ? 'สร้าง Letter Pack สำเร็จ!' : 'Letter Pack compiled successfully!');
      }
    } catch (error) {
      console.error('Failed to compile letter pack:', error);
      alert(language === 'th' ? 'ไม่สามารถสร้าง Letter Pack ได้' : 'Failed to compile letter pack');
    } finally {
      setCompilingPack(false);
    }
  };

  // New function to handle Word document downloads
  const handleDownloadWord = (subject) => {
    const urlKey = `${subject}_url`;
    const url = caseItem?.letters?.[urlKey];
    
    if (!url) {
      alert(language === 'th' 
        ? `ไม่พบไฟล์ Word สำหรับ ${subject}` 
        : `No Word file found for ${subject}`);
      return;
    }
    
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePreviewHtml = (subject) => {
    const htmlKey = `${subject}_html_url`;
    const docKey = `${subject}_url`;
    
    const htmlUrl = caseItem?.letters?.[htmlKey];
    const docUrl = caseItem?.letters?.[docKey];
    
    if (!htmlUrl && !docUrl) {
      alert(language === 'th' 
        ? `ไม่พบไฟล์สำหรับ ${subject}` 
        : `No file found for ${subject}`);
      return;
    }
    
    setPreviewLetter({
      htmlUrl: htmlUrl,
      docUrl: docUrl,
      subject: subject
    });
  };

  const getLetterTitle = (subject) => {
    const titles = {
      lease_negotiation: language === 'th' ? 'จดหมายขอทบทวนสัญญาเช่า' : 'Lease Negotiation Request',
      deposit: language === 'th' ? 'จดหมายขอคืนเงินมัดจำ' : 'Deposit Return Request',
      damages: language === 'th' ? 'จดหมายโต้แย้งค่าเสียหาย' : 'Damage Claim Response',
      early_termination: language === 'th' ? 'จดหมายแจ้งยกเลิกก่อนกำหนด' : 'Early Termination Notice',
      v1: strings.initialNotice,
      v2: strings.followupLetter,
      v3: strings.finalSettlementOffer
    };
    return titles[subject] || subject;
  };

  const t = {
    en: {
      caseDetails: "Case Details",
      loading: "Loading...",
      notFound: "Case not found",
      backToCases: "Back to Cases",
      caseNumber: "Case #",
      opened: "Opened",
      status: "Status",
      disputeAmount: "Dispute Amount",
      caseSummary: "Case Summary",
      features: "Features",
      fastTrack: "Fast Track",
      letterPack: "Letter Pack",
      memberRate: "Member Rate",
      relatedLease: "Related Lease",
      viewLease: "View Lease",
      opsAssignment: "Ops Assignment",
      opsTeam: "Ops Team",
      unassigned: "Not yet assigned",
      timeline: "Case Timeline",
      caseOpened: "Case Opened",
      awaitingReview: "Awaiting team review",
      actions: "Actions",
      uploadDocument: "Upload Document",
      contactSupport: "Contact Support",
      caseHistory: "Case History",
      generatedLetters: "Generated Letters",
      initialNotice: "Initial Notice",
      clarificationDocumentation: "Clarification & Documentation",
      followupLetter: "Follow-up Letter",
      reconciliationPlan: "Reconciliation Plan",
      finalSettlementOffer: "Final Settlement Offer",
      beforeEscalation: "Before Escalation",
      view: "View",
      compilePack: "Compile Pack",
      compiling: "Compiling...",
      completeLetterPack: "📄 Complete Letter Pack",
      allLettersInOnePdf: "All letters in one PDF",
      download: "Download",
      downloadWord: "Download Word", // Added translation
      preview: "Preview",
    },
    th: {
      caseDetails: "รายละเอียดคดี",
      loading: "กำลังโหลด...",
      notFound: "ไม่พบคดี",
      backToCases: "กลับไปที่คดี",
      caseNumber: "คดีหมายเลข #",
      opened: "เปิด",
      status: "สถานะ",
      disputeAmount: "จำนวนเงินที่พิพาท",
      caseSummary: "สรุปคดี",
      features: "คุณสมบัติ",
      fastTrack: "Fast Track",
      letterPack: "ชุดจดหมาย",
      memberRate: "ราคาสมาชิก",
      relatedLease: "สัญญาเช่าที่เกี่ยวข้อง",
      viewLease: "ดูสัญญาเช่า",
      opsAssignment: "การมอบหมายทีม",
      opsTeam: "ทีมปฏิบัติการ",
      unassigned: "ยังไม่ได้มอบหมาย",
      timeline: "ไทม์ไลน์คดี",
      caseOpened: "เปิดคดี",
      awaitingReview: "รอการตรวจสอบจากทีม",
      actions: "การดำเนินการ",
      uploadDocument: "อัปโหลดเอกสาร",
      contactSupport: "ติดต่อฝ่ายสนับสนุน",
      caseHistory: "ประวัติคดี",
      generatedLetters: "จดหมายที่สร้าง",
      initialNotice: "จดหมายแจ้งเบื้องต้น",
      clarificationDocumentation: "ขอชี้แจงและเอกสาร",
      followupLetter: "จดหมายติดตาม",
      reconciliationPlan: "แผนการกระทบยอด",
      finalSettlementOffer: "จดหมายข้อเสนอสุดท้าย",
      beforeEscalation: "ก่อนการยกระดับ",
      view: "ดู",
      compilePack: "รวม PDF",
      compiling: "กำลังรวม...",
      completeLetterPack: "📄 Letter Pack ฉบับเต็ม",
      allLettersInOnePdf: "จดหมายทั้งหมดรวมใน PDF เดียว",
      download: "ดาวน์โหลด",
      downloadWord: "ดาวน์โหลด Word", // Added translation
      preview: "ดูตัวอย่าง",
    }
  };

  const strings = t[language];
  const statusConfig = caseItem ? STATUS_CONFIG[caseItem.status] || STATUS_CONFIG.intake : STATUS_CONFIG.intake;
  const StatusIcon = statusConfig.icon;

  if (caseLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: colors.textSecondary }} />
            <p className="text-lg" style={{ color: colors.textSecondary }}>{strings.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-5xl mx-auto">
          <Button variant="outline" onClick={() => navigate(createPageUrl("Cases"))} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.backToCases}
          </Button>
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{
              backgroundColor: isDarkMode ? '#3A3D40' : '#F3F4F6'
            }}>
              <Scale className="w-10 h-10" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {strings.notFound}
            </h2>
            <p className="mb-6" style={{ color: colors.textSecondary }}>
              {language === 'th' 
                ? 'ไม่พบคดีที่คุณกำลังมองหา' 
                : "The case you're looking for doesn't exist."}
            </p>
            <Button onClick={() => navigate(createPageUrl("Cases"))} className="bg-ls-forest hover:bg-ls-forest/90">
              {strings.backToCases}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        {/* Letter Preview Modal */}
        {previewLetter && (
          <LetterPreview
            open={!!previewLetter}
            onOpenChange={() => setPreviewLetter(null)}
            htmlUrl={previewLetter.htmlUrl}
            docUrl={previewLetter.docUrl}
            title={getLetterTitle(previewLetter.subject)}
          />
        )}

        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl("Cases"))}
          className="mb-4 md:mb-6"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.backToCases}
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {caseItem.case_number || `Case #${caseItem.id.slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <Calendar className="w-4 h-4" />
              {strings.opened} {format(new Date(caseItem.created_date), 'MMMM d, yyyy')}
            </div>
          </div>
          <Badge className={`${statusConfig.color} border flex items-center gap-2 text-sm px-4 py-2`}>
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Case Information */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Scale className="w-5 h-5 text-blue-600" />
              {strings.caseDetails}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Dispute Amount */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  {strings.disputeAmount}
                </p>
                <div className="flex items-baseline gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    ฿{caseItem.dispute_amount?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  {strings.features}
                </p>
                <div className="flex flex-wrap gap-2">
                  {caseItem.fast_track && (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      <Zap className="w-3 h-3 mr-1" />
                      {strings.fastTrack}
                    </Badge>
                  )}
                  {caseItem.letter_pack && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      <Mail className="w-3 h-3 mr-1" />
                      {strings.letterPack}
                    </Badge>
                  )}
                  {caseItem.is_member_at_creation && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <Crown className="w-3 h-3 mr-1" />
                      {strings.memberRate}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Case Summary */}
            {caseItem.summary && (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  {strings.caseSummary}
                </p>
                <div className="p-4 rounded-lg" style={{
                  backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                  border: `1px solid ${colors.borderColor}`
                }}>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: colors.textPrimary }}>
                    {caseItem.summary}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Lease */}
        {lease && (
          <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <FileText className="w-5 h-5 text-ls-forest" />
                {strings.relatedLease}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {lease.property_address || 'Lease Agreement'}
                  </p>
                  {lease.rent_amount && (
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      ฿{lease.rent_amount.toLocaleString()}/month
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(createPageUrl("LeaseDetails") + `?leaseId=${lease.id}`)}
                >
                  {strings.viewLease}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ops Assignment */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <UserCheck className="w-5 h-5 text-blue-600" />
              {strings.opsAssignment}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {caseItem.ops_assigned ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>
                    {strings.opsTeam}
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'ทีมของเราจะติดต่อคุณเร็วๆ นี้' : 'Our team will contact you soon'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: colors.textPrimary }}>
                    {strings.unassigned}
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {language === 'th' 
                      ? 'ทีมของเราจะตรวจสอบคดีของคุณภายใน 24-48 ชั่วโมง' 
                      : 'Our team will review your case within 24-48 hours'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Letters Section */}
        {caseItem.letters && (caseItem.letters.v1_url || caseItem.letters.v2_url || caseItem.letters.v3_url || caseItem.letter_pack_url || caseItem.letters.deposit_url || caseItem.letters.damages_url || caseItem.letters.early_termination_url || caseItem.letters.lease_negotiation_url) && (
          <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                  {strings.generatedLetters}
                </CardTitle>
                {/* Letter Pack Compile Button */}
                {!caseItem.letter_pack_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCompilePack}
                    disabled={compilingPack}
                    className="border-purple-600 text-purple-600"
                  >
                    {compilingPack ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {strings.compiling}
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3 mr-1" />
                        {strings.compilePack}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {/* Letter Pack - Full Compilation */}
              {caseItem.letter_pack_url && (
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-base" style={{ color: colors.textPrimary }}>
                          {strings.completeLetterPack}
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {strings.allLettersInOnePdf}
                        </p>
                      </div>
                    </div>
                    <a href={caseItem.letter_pack_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {strings.download}
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* Individual Letters - Phase 1 (Subject-based) */}
              <div className="space-y-3">
                {/* Lease Negotiation Letter - PRE-SIGNING */}
                {caseItem.letters.lease_negotiation_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg border-2" style={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FEF3C7',
                    borderColor: '#F59E0B',
                    border: `2px solid ${isDarkMode ? '#F59E0B' : '#FCD34D'}`
                  }}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-1 text-xs">
                          ⭐ PRE-SIGNING
                        </Badge>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {language === 'th' ? 'จดหมายขอทบทวนสัญญาเช่า' : 'Lease Negotiation Request'}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'สำหรับเจรจาก่อนลงนาม - ส่งหาเจ้าของบ้าน' : 'For negotiation before signing - Send to landlord'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreviewHtml('lease_negotiation')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderColor}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#FEF3C7';
                          e.target.style.borderColor = '#F59E0B';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                          e.target.style.borderColor = colors.borderColor;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        {strings.preview}
                      </button>
                      <button
                        onClick={() => handleDownloadWord('lease_negotiation')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: '#F59E0B',
                          color: '#FFFFFF'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#D97706'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#F59E0B'}
                      >
                        <Download className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>
                )}

                {/* Deposit Letter */}
                {caseItem.letters.deposit_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {language === 'th' ? 'จดหมายขอคืนเงินมัดจำ' : 'Deposit Return Request'}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'ขอชี้แจงและเอกสารประกอบ' : strings.clarificationDocumentation}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreviewHtml('deposit')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderColor}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#EEF2FF';
                          e.target.style.borderColor = '#6366F1';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                          e.target.style.borderColor = colors.borderColor;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        {strings.preview}
                      </button>
                      <button
                        onClick={() => handleDownloadWord('deposit')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                      >
                        <Download className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>
                )}

                {/* Damages Letter */}
                {caseItem.letters.damages_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {language === 'th' ? 'จดหมายโต้แย้งค่าเสียหาย' : 'Damage Claim Response'}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'ขอรายละเอียดการประเมิน' : 'Request itemised assessment'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreviewHtml('damages')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderColor}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#EEF2FF';
                          e.target.style.borderColor = '#6366F1';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                          e.target.style.borderColor = colors.borderColor;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        {strings.preview}
                      </button>
                      <button
                        onClick={() => handleDownloadWord('damages')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                      >
                        <Download className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>
                )}

                {/* Early Termination Letter */}
                {caseItem.letters.early_termination_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {language === 'th' ? 'จดหมายแจ้งยกเลิกก่อนกำหนด' : 'Early Termination Notice'}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'ขอประสานการยกเลิกสัญญา' : 'Request reconciliation'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreviewHtml('early_termination')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          color: colors.textPrimary,
                          border: `1px solid ${colors.borderColor}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#EEF2FF';
                          e.target.style.borderColor = '#6366F1';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                          e.target.style.borderColor = colors.borderColor;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        {strings.preview}
                      </button>
                      <button
                        onClick={() => handleDownloadWord('early_termination')}
                        className="px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                      >
                        <Download className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  </div>
                )}

                {/* Legacy Letters (v1, v2, v3) */}
                {caseItem.letters.v1_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.initialNotice}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.clarificationDocumentation}
                        </p>
                      </div>
                    </div>
                    <a href={caseItem.letters.v1_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {strings.view}
                      </Button>
                    </a>
                  </div>
                )}

                {caseItem.letters.v2_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.followupLetter}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.reconciliationPlan}
                        </p>
                      </div>
                    </div>
                    <a href={caseItem.letters.v2_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {strings.view}
                      </Button>
                    </a>
                  </div>
                )}

                {caseItem.letters.v3_url && (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{
                    backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                          {strings.finalSettlementOffer}
                        </p>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {strings.beforeEscalation}
                        </p>
                      </div>
                    </div>
                    <a href={caseItem.letters.v3_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {strings.view}
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Clock className="w-5 h-5 text-slate-600" />
              {strings.timeline}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-6">
                  <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {strings.caseOpened}
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {format(new Date(caseItem.created_date), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              {caseItem.status === 'active' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                      {strings.awaitingReview}
                    </p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {language === 'th' 
                        ? 'เราจะติดต่อคุณเร็วๆ นี้' 
                        : "We'll be in touch soon"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">{strings.actions}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("DocumentVault"))}
                className="justify-start h-auto py-4"
              >
                <FileText className="w-5 h-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <div className="font-semibold">{strings.uploadDocument}</div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'เพิ่มหลักฐาน' : 'Add evidence'}
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Support"))}
                className="justify-start h-auto py-4"
              >
                <Mail className="w-5 h-5 mr-3 text-emerald-600" />
                <div className="text-left">
                  <div className="font-semibold">{strings.contactSupport}</div>
                  <div className="text-xs" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'ติดต่อทีม' : 'Contact team'}
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
