
import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, AlertCircle, Clock, CheckCircle2, UserCheck, Plus, Zap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useFeatureAccess } from "../components/shared/FeatureGate";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

  const { data: cases = [], refetch: refetchCases } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Handle payment success - refetch cases
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success' && user) {
      console.log('Payment success detected - refetching cases immediately');
      
      // Force immediate refetch
      refetchCases();
      
      // Refetch again after delays to catch webhook processing
      setTimeout(() => {
        console.log('Refetch after 2s');
        refetchCases();
      }, 2000);
      
      setTimeout(() => {
        console.log('Refetch after 4s');
        refetchCases();
      }, 4000);
      
      setTimeout(() => {
        console.log('Final refetch after 6s');
        refetchCases();
      }, 6000);
      
      // Clean up URL
      const newUrl = location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, user, refetchCases, location.pathname]);

  const language = user?.language || 'en';

  const t = {
    en: {
      title: "My Cases",
      subtitle: "Track your dispute cases",
      openNewCase: "Open New Case",
      premiumTitle: "Premium Case Benefits",
      memberPricing: "Member pricing on success fees",
      priorityHandling: "Priority case handling",
      noCases: "No Cases Yet",
      noCasesSub: "Need help with a dispute? Our team is here to support you.",
      memberBenefit: "As a member, you get reduced success fees on all cases",
      openFirstCase: "Open Your First Case",
      caseNumber: "Case #",
      opened: "Opened",
      disputeAmount: "Dispute Amount",
      assignedTo: "Assigned To",
      opsTeam: "Ops Team",
      features: "Features",
      fastTrack: "Fast Track",
      letterPack: "Letter Pack",
      memberRate: "Member Rate",
      successFee: "Success fee:",
      memberDiscount: "(Member discount ✓)",
      viewDetails: "View Details",
      takeAction: "Take Action"
    },
    th: {
      title: "คดีของฉัน",
      subtitle: "ติดตามคดีข้อพิพาทของคุณ",
      openNewCase: "เปิดคดีใหม่",
      premiumTitle: "สิทธิประโยชน์คดีพรีเมียม",
      memberPricing: "ราคาสมาชิกสำหรับค่าธรรมเนียมความสำเร็จ",
      priorityHandling: "การจัดการคดีแบบเร่งด่วน",
      noCases: "ยังไม่มีคดี",
      noCasesSub: "ต้องการความช่วยเหลือเรื่องข้อพิพาท? ทีมของเราพร้อมสนับสนุนคุณ",
      memberBenefit: "ในฐานะสมาชิก คุณจะได้รับค่าธรรมเนียมความสำเร็จที่ลดลงสำหรับทุกคดี",
      openFirstCase: "เปิดคดีแรกของคุณ",
      caseNumber: "คดีหมายเลข #",
      opened: "เปิด",
      disputeAmount: "จำนวนเงินที่พิพาท",
      assignedTo: "มอบหมายให้",
      opsTeam: "ทีมปฏิบัติการ",
      features: "คุณสมบัติ",
      fastTrack: "Fast Track",
      letterPack: "ชุดจดหมาย",
      memberRate: "ราคาสมาชิก",
      successFee: "ค่าธรรมเนียมความสำเร็จ:",
      memberDiscount: "(ส่วนลดสมาชิก ✓)",
      viewDetails: "ดูรายละเอียด",
      takeAction: "ดำเนินการ"
    }
  };

  const strings = t[language];

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.intake;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{strings.title}</h1>
            </div>
            <p className="text-sm sm:text-base text-slate-600">{strings.subtitle}</p>
          </div>
          
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 shadow-lg w-full sm:w-auto" 
            onClick={() => navigate(createPageUrl("ResolveCase"))}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-sm sm:text-base">{strings.openNewCase}</span>
          </Button>
        </div>

        {/* Premium Features Banner */}
        {(hasPriorityQueue || hasMemberPrice) && (
          <Card className="mb-6 border-none shadow-lg bg-gradient-to-r from-purple-500 to-purple-700 text-white">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base sm:text-lg mb-1">{strings.premiumTitle}</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-purple-50">
                    {hasMemberPrice && <span>• {strings.memberPricing}</span>}
                    {hasPriorityQueue && <span>• {strings.priorityHandling}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {cases.length === 0 ? (
          <Card className="border-none shadow-xl">
            <CardContent className="p-8 sm:p-12 text-center">
              <Scale className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{strings.noCases}</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-6">
                {strings.noCasesSub}
              </p>
              {hasMemberPrice && (
                <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-200">
                  <p className="text-xs sm:text-sm text-emerald-800 font-medium">
                    ✓ {strings.memberBenefit}
                  </p>
                </div>
              )}
              <Button 
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" 
                onClick={() => navigate(createPageUrl("ResolveCase"))}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {strings.openFirstCase}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((caseItem) => {
              const statusConfig = getStatusConfig(caseItem.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={caseItem.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="border-b border-slate-100 pb-3 sm:pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="p-2 bg-blue-50 rounded-xl flex-shrink-0">
                          <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 break-words">
                            {strings.caseNumber}{caseItem.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-xs text-slate-500 mt-1">
                            {strings.opened} {format(new Date(caseItem.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end flex-shrink-0">
                        <Badge className={`${statusConfig.color} border flex items-center gap-1 text-xs whitespace-nowrap`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{statusConfig.label}</span>
                        </Badge>
                        {caseItem.fast_track && hasPriorityQueue && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs whitespace-nowrap">
                            <Zap className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">{strings.fastTrack}</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {caseItem.dispute_amount && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">{strings.disputeAmount}</p>
                          <p className="text-lg font-bold text-slate-900">
                            ฿{caseItem.dispute_amount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {caseItem.ops_assigned && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">{strings.assignedTo}</p>
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-semibold text-slate-900">{strings.opsTeam}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">{strings.features}</p>
                      <div className="flex gap-2 flex-wrap">
                        {caseItem.fast_track && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                            {strings.fastTrack}
                          </Badge>
                        )}
                        {caseItem.letter_pack && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            {strings.letterPack}
                          </Badge>
                        )}
                        {caseItem.is_member_at_creation && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs">
                            {strings.memberRate}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {caseItem.summary && (
                      <div className="p-3 bg-slate-50 rounded-xl mb-4">
                        <p className="text-xs text-slate-700 line-clamp-2">{caseItem.summary}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" className="flex-1 text-xs sm:text-sm" size="sm">
                        {strings.viewDetails}
                      </Button>
                      {caseItem.status === 'user_action' && (
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm" size="sm">
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
