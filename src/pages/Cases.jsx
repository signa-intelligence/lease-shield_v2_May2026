
import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, Plus, Crown, Calendar, DollarSign, Zap, Mail, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useFeatureAccess } from "@/components/shared/FeatureGate";

const STATUS_CONFIG = {
  intake: { label: 'Intake', color: 'bg-slate-100 text-slate-800', icon: Clock },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800', icon: Scale },
  waiting: { label: 'Waiting', color: 'bg-purple-100 text-purple-800', icon: Clock },
  user_action: { label: 'Action Required', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  closed: { label: 'Closed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 }
};

export default function Cases() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { hasAccess: hasPriorityQueue } = useFeatureAccess('priority_queue');
  const { hasAccess: hasMemberPrice } = useFeatureAccess('resolve_member_price');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Debug: Log user email when it loads
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

  // Debug: Log cases when they change
  useEffect(() => {
    console.log('📦 Cases data updated:', cases.length, 'cases');
  }, [cases]);

  // Handle payment success - refetch cases
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success' && user) {
      console.log('💰 Payment success detected - refetching cases');
      console.log('👤 User email:', user.email);
      
      // Force immediate refetch
      refetchCases().then((result) => {
        console.log('🔄 Immediate refetch result:', result.data?.length || 0, 'cases');
      });
      
      // Refetch again after delays to catch webhook processing
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
      
      // Clean up URL
      const newUrl = location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, user, refetchCases, location.pathname]);

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  // Debug loading and error states
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
    borderColor: '#3A3D40',
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
  };

  const t = {
    en: {
      myCases: "My Cases",
      trackYourCases: "Track your dispute cases",
      openNewCase: "Open New Case",
      premiumBenefits: "Premium Case Benefits",
      memberPricing: "Member pricing on success fees",
      priorityHandling: "Priority case handling",
      caseNumber: "Case #",
      opened: "Opened",
      disputeAmount: "Dispute Amount",
      features: "Features",
      letterPack: "Letter Pack",
      fastTrack: "Fast Track",
      memberRate: "Member Rate",
      viewDetails: "View Details",
      takeAction: "Take Action",
      noCases: "No Cases Yet",
      noCasesDesc: "You haven't opened any dispute cases yet. When you need help resolving a deposit or rent dispute, we're here to help.",
      openFirstCase: "Open Your First Case"
    },
    th: {
      myCases: "คดีของฉัน",
      trackYourCases: "ติดตามคดีพิพาทของคุณ",
      openNewCase: "เปิดคดีใหม่",
      premiumBenefits: "สิทธิพิเศษสำหรับคดี",
      memberPricing: "ราคาสมาชิกสำหรับค่าธรรมเนียมความสำเร็จ",
      priorityHandling: "การจัดการคดีแบบเร่งด่วน",
      caseNumber: "คดีหมายเลข #",
      opened: "เปิด",
      disputeAmount: "จำนวนเงินที่พิพาท",
      features: "คุณสมบัติ",
      letterPack: "ชุดจดหมาย",
      fastTrack: "Fast Track",
      memberRate: "ราคาสมาชิก",
      viewDetails: "ดูรายละเอียด",
      takeAction: "ดำเนินการ",
      noCases: "ยังไม่มีคดี",
      noCasesDesc: "คุณยังไม่ได้เปิดคดีพิพาทใดๆ เมื่อคุณต้องการความช่วยเหลือในการแก้ไขข้อพิพาทเกี่ยวกับเงินประกันหรือค่าเช่า เราพร้อมช่วยเหลือคุณ",
      openFirstCase: "เปิดคดีแรกของคุณ"
    }
  };

  const strings = t[language];

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.intake;
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Scale className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
              {strings.myCases}
            </h1>
            <p className="text-sm md:text-base" style={{ color: colors.textSecondary }}>
              {strings.trackYourCases}
            </p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl("ResolveCase"))}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {strings.openNewCase}
          </Button>
        </div>

        {cases.length === 0 ? (
          <div className="text-center py-12 md:py-20">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{
              backgroundColor: isDarkMode ? '#3A3D40' : '#F3F4F6'
            }}>
              <Scale className="w-10 h-10 md:w-12 md:h-12" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {strings.noCases}
            </h2>
            <p className="mb-6 max-w-md mx-auto text-sm md:text-base px-4" style={{ color: colors.textSecondary }}>
              {strings.noCasesDesc}
            </p>
            <Button
              onClick={() => navigate(createPageUrl("ResolveCase"))}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              {strings.openFirstCase}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((caseItem) => {
              const statusConfig = getStatusConfig(caseItem.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={caseItem.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300" style={{ backgroundColor: colors.cardBg }}>
                  <CardHeader className="pb-3" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Scale className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <CardTitle className="text-base md:text-lg truncate" style={{ color: colors.textPrimary }}>
                          {strings.caseNumber}{caseItem.id.slice(0, 8)}
                        </CardTitle>
                      </div>
                      <Badge className={`${statusConfig.color} border text-xs flex items-center gap-1 flex-shrink-0`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: colors.textSecondary }}>
                      <Calendar className="w-3 h-3" />
                      {strings.opened} {format(new Date(caseItem.created_date), 'MMM d, yyyy')}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                        {strings.disputeAmount}
                      </p>
                      <p className="text-xl md:text-2xl font-bold flex items-baseline gap-1" style={{ color: colors.textPrimary }}>
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        ฿{caseItem.dispute_amount?.toLocaleString() || 'N/A'}
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
                              <Mail className="w-3 h-3 mr-1" />
                              {strings.letterPack}
                            </Badge>
                          )}
                          {caseItem.is_member_at_creation && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              {strings.memberRate}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {caseItem.summary && (
                      <div>
                        <p className="text-xs line-clamp-2" style={{ color: colors.textSecondary }}>
                          {caseItem.summary}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 text-xs sm:text-sm" 
                        size="sm"
                        onClick={() => navigate(createPageUrl("CaseDetails") + `?caseId=${caseItem.id}`)}
                      >
                        {strings.viewDetails}
                      </Button>
                      {caseItem.status === 'user_action' && (
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm" 
                          size="sm"
                          onClick={() => navigate(createPageUrl("CaseDetails") + `?caseId=${caseItem.id}`)}
                        >
                          {strings.takeAction}
                        </Button>
                      )}
                    </div>
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
