
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, Plus, Crown, Calendar, DollarSign, Zap, FileText, Loader2, CheckCircle2, Eye, Download, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useFeatureAccess } from "@/components/shared/FeatureGate";
import LetterPreview from "../components/shared/LetterPreview";

const STATUS_CONFIG = {
  intake: { label: 'Intake', color: 'bg-slate-100 text-slate-800', icon: Calendar },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Calendar },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800', icon: Scale },
  waiting: { label: 'Waiting', color: 'bg-purple-100 text-purple-800', icon: Calendar },
  user_action: { label: 'Action Required', color: 'bg-red-100 text-red-800', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 }
};

export default function Cases() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { hasAccess: hasPriorityQueue } = useFeatureAccess('priority_queue');
  const { hasAccess: hasMemberPrice } = useFeatureAccess('resolve_member_price');
  
  const [expandedCase, setExpandedCase] = useState(null);
  const [previewLetter, setPreviewLetter] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      console.log('🔍 Current user email:', user.email);
    }
  }, [user]);

  const { data: cases = [], refetch: refetchCases, isLoading, error } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: async () => {
      console.log('📊 Fetching cases for user:', user?.email);
      const result = await base44.entities.Case.filter({ user_email: user?.email }, '-created_date');
      console.log('📊 Cases found:', result.length, result);
      return result;
    },
    enabled: !!user,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    console.log('📦 Cases data updated:', cases.length, 'cases');
  }, [cases]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success' && user) {
      console.log('💰 Payment success detected - refetching cases');
      console.log('👤 User email:', user.email);
      
      refetchCases().then((result) => {
        console.log('🔄 Immediate refetch result:', result.data?.length || 0, 'cases');
      });
      
      setTimeout(() => {
        console.log('⏱️ Refetch after 2s');
        refetchCases().then((result) => {
          console.log('🔄 2s refetch result:', result.data?.length || 0, 'cases');
        });
      }, 2000);
      
      setTimeout(() => {
        console.log('⏱️ Refetch after 5s');
        refetchCases().then((result) => {
          console.log('🔄 5s refetch result:', result.data?.length || 0, 'cases');
        });
      }, 5000);
      
      setTimeout(() => {
        console.log('⏱️ Final refetch after 10s');
        refetchCases().then((result) => {
          console.log('🔄 10s refetch result:', result.data?.length || 0, 'cases');
        });
      }, 10000);
      
      const newUrl = location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, user, refetchCases, location.pathname]);

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  if (isLoading) {
    console.log('⏳ Cases loading...');
  }
  if (error) {
    console.error('❌ Cases error:', error);
  }

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  const t = {
    en: {
      title: "My Cases",
      subtitle: "Track your dispute cases",
      openNewCase: "Open New Case",
      premiumBenefits: "Premium Case Benefits",
      memberRate: "Member rate on all services",
      priorityHandling: "Priority case handling",
      noCases: "No Cases Yet",
      noCasesDesc: "Open a case to get professional help with deposit recovery or lease disputes",
      caseNumber: "Case",
      opened: "Opened",
      disputeAmount: "Dispute Amount",
      features: "Features",
      fastTrack: "Fast Track",
      letterPack: "Letter Pack",
      memberRateBadge: "Member Rate",
      viewDetails: "View Details",
      generatedLetters: "Letters",
      showLetters: "Show Letters",
      hideLetters: "Hide Letters",
      preview: "Preview",
      download: "Download",
    },
    th: {
      title: "คดีของฉัน",
      subtitle: "ติดตามคดีพิพาทของคุณ",
      openNewCase: "เปิดคดีใหม่",
      premiumBenefits: "สิทธิประโยชน์แบบพรีเมียม",
      memberRate: "ราคาสมาชิกสำหรับบริการทั้งหมด",
      priorityHandling: "จัดการคดีแบบเร่งด่วน",
      noCases: "ยังไม่มีคดี",
      noCasesDesc: "เปิดคดีเพื่อรับความช่วยเหลือจากมืออาชีพในการเรียกคืนเงินมัดจำหรือข้อพิพาท",
      caseNumber: "คดี",
      opened: "เปิดเมื่อ",
      disputeAmount: "จำนวนเงินพิพาท",
      features: "ฟีเจอร์",
      fastTrack: "เร่งด่วน",
      letterPack: "แพ็กจดหมาย",
      memberRateBadge: "ราคาสมาชิก",
      viewDetails: "ดูรายละเอียด",
      generatedLetters: "จดหมาย",
      showLetters: "แสดงจดหมาย",
      hideLetters: "ซ่อนจดหมาย",
      preview: "ดูตัวอย่าง",
      download: "ดาวน์โหลด",
    }
  };

  const strings = t[language];

  const getLetterTitle = (subject) => {
    const titles = {
      lease_negotiation: language === 'th' ? 'จดหมายขอทบทวนสัญญาเช่า' : 'Lease Negotiation Request',
      deposit: language === 'th' ? 'จดหมายขอคืนเงินมัดจำ' : 'Deposit Return Request',
      damages: language === 'th' ? 'จดหมายโต้แย้งค่าเสียหาย' : 'Damage Claim Response',
      early_termination: language === 'th' ? 'จดหมายแจ้งยกเลิกก่อนกำหนด' : 'Early Termination Notice',
      deductions: language === 'th' ? 'ขอรายละเอียดการหักเงิน' : 'Request for Itemised Deductions'
    };
    return titles[subject] || subject;
  };

  const handleDownloadWord = (caseItem, subject) => {
    const urlKey = `${subject}_url`;
    const url = caseItem?.letters?.[urlKey];
    
    if (!url) {
      alert(language === 'th' 
        ? `ไม่พบไฟล์ Word สำหรับ ${getLetterTitle(subject)}` 
        : `No Word file found for ${getLetterTitle(subject)}`);
      return;
    }
    
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePreviewHtml = (caseItem, subject) => {
    const htmlKey = `${subject}_html_url`;
    const docKey = `${subject}_url`;
    
    const htmlUrl = caseItem?.letters?.[htmlKey];
    const docUrl = caseItem?.letters?.[docKey];
    
    if (!htmlUrl && !docUrl) {
      alert(language === 'th' 
        ? `ไม่พบไฟล์สำหรับ ${getLetterTitle(subject)}` 
        : `No file found for ${getLetterTitle(subject)}`);
      return;
    }
    
    setPreviewLetter({
      htmlUrl: htmlUrl,
      docUrl: docUrl,
      subject: subject
    });
  };

  const getLetterList = (caseItem) => {
    const letters = [];
    if (caseItem?.letters) {
      if (caseItem.letters.lease_negotiation_url) letters.push('lease_negotiation');
      if (caseItem.letters.deposit_url) letters.push('deposit');
      if (caseItem.letters.damages_url) letters.push('damages');
      if (caseItem.letters.deductions_url) letters.push('deductions');
      if (caseItem.letters.early_termination_url) letters.push('early_termination');
    }
    return letters;
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
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

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Scale className="w-7 h-7 md:w-8 md:h-8 text-ls-forest" />
            {strings.title}
          </h1>
          <p className="text-sm md:text-base" style={{ color: colors.textSecondary }}>
            {strings.subtitle}
          </p>
        </div>

        <Button
          onClick={() => navigate(createPageUrl("ResolveCase"))}
          className="w-full mb-6 bg-blue-600 hover:bg-blue-700 py-6 text-base font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          {strings.openNewCase}
        </Button>

        {/* Premium Benefits */}
        <Card className="mb-6 border-none shadow-lg bg-gradient-to-br from-purple-600 to-blue-600">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <Crown className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">{strings.premiumBenefits}</h3>
                <ul className="space-y-1 text-sm text-white/90">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{strings.memberRate}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{strings.priorityHandling}</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : cases.length === 0 ? (
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 md:p-12 text-center">
              <Scale className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.3 }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noCases}
              </h3>
              <p className="mb-6 max-w-md mx-auto" style={{ color: colors.textSecondary }}>
                {strings.noCasesDesc}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {cases.map((caseItem) => {
              const statusConfig = STATUS_CONFIG[caseItem.status] || STATUS_CONFIG.intake;
              const StatusIcon = statusConfig.icon;
              const availableLetters = getLetterList(caseItem);
              const hasLetters = availableLetters.length > 0;
              const isExpanded = expandedCase === caseItem.id;

              return (
                <Card
                  key={caseItem.id}
                  className="border-none shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: colors.cardBg }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div 
                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                        onClick={() => navigate(createPageUrl("CaseDetails") + `?caseId=${caseItem.id}`)}
                      >
                        <Scale className="w-5 h-5 text-ls-forest flex-shrink-0" />
                        <CardTitle className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                          {caseItem.case_number || `Case #${caseItem.id.slice(0, 8)}`}
                        </CardTitle>
                      </div>
                      <Badge className={`${statusConfig.color} border whitespace-nowrap`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm mt-2" style={{ color: colors.textSecondary }}>
                      {strings.opened} {format(new Date(caseItem.created_date), 'MMM d, yyyy')}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                        {strings.disputeAmount}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                        ฿{caseItem.dispute_amount?.toLocaleString() || '0'}
                      </p>
                    </div>

                    {(caseItem.fast_track || caseItem.letter_pack || caseItem.is_member_at_creation) && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                          {strings.features}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {caseItem.fast_track && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              {strings.fastTrack}
                            </Badge>
                          )}
                          {caseItem.letter_pack && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {strings.letterPack}
                            </Badge>
                          )}
                          {caseItem.is_member_at_creation && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {strings.memberRateBadge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {caseItem.summary && (
                      <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                        {caseItem.summary}
                      </p>
                    )}

                    {/* Generated Letters Section */}
                    {hasLetters && (
                      <div className="border-t pt-3" style={{ borderColor: colors.borderColor }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCase(isExpanded ? null : caseItem.id);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-opacity-80 transition-all"
                          style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" style={{ color: colors.textPrimary }} />
                            <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                              {strings.generatedLetters} ({availableLetters.length})
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" style={{ color: colors.textSecondary }} />
                          ) : (
                            <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2">
                            {availableLetters.map((subject) => (
                              <div
                                key={subject}
                                className="flex items-center justify-between p-3 rounded-lg"
                                style={{
                                  backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
                                  border: `1px solid ${colors.borderColor}`
                                }}
                              >
                                <div className="flex-1 min-w-0 mr-3">
                                  <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                                    {getLetterTitle(subject)}
                                  </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewHtml(caseItem, subject);
                                    }}
                                    className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all"
                                    style={{
                                      backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                                      color: colors.textPrimary,
                                      border: `1px solid ${colors.borderColor}`
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = isDarkMode ? '#4A4D50' : '#EEF2FF';
                                      e.target.style.borderColor = '#6366F1';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                                      e.target.style.borderColor = colors.borderColor;
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                    {strings.preview}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadWord(caseItem, subject);
                                    }}
                                    className="px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all"
                                    style={{
                                      backgroundColor: '#0C3B2E',
                                      color: '#FFFFFF'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                                  >
                                    <Download className="w-3 h-3" />
                                    {strings.download}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(createPageUrl("CaseDetails") + `?caseId=${caseItem.id}`);
                      }}
                    >
                      {strings.viewDetails}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
