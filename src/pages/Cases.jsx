
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, AlertCircle, Clock, CheckCircle2, UserCheck, Plus, Zap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useFeatureAccess } from "../components/shared/FeatureGate";
import { useNavigate } from "react-router-dom";
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
  const { hasAccess: hasPriorityQueue } = useFeatureAccess('priority_queue');
  const { hasAccess: hasMemberPrice } = useFeatureAccess('resolve_member_price');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#0C3B2E', // This is a dark green. The original light background was bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F', // Changed to complement light background, original was white for dark mode context
    textSecondary: '#64748b', // Changed to complement light background, original was light green for dark mode context
    borderColor: '#e2e8f0' // Changed to complement light background, original was transparent white for dark mode context
  };


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
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Scale className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
            </div>
            <p className="text-slate-600" style={{ color: isDarkMode ? colors.textSecondary : '#64748B' }}>{strings.subtitle}</p>
          </div>
          
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg" onClick={() => navigate(createPageUrl("ResolveCase"))}>
            <Plus className="w-5 h-5 mr-2" />
            {strings.openNewCase}
          </Button>
        </div>

        {/* Premium Features Banner */}
        {(hasPriorityQueue || hasMemberPrice) && (
          <Card className="mb-6 border-none shadow-lg bg-gradient-to-r from-purple-500 to-purple-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{strings.premiumTitle}</h3>
                  <div className="flex gap-3 text-sm text-purple-50">
                    {hasMemberPrice && <span>• {strings.memberPricing}</span>}
                    {hasPriorityQueue && <span>• {strings.priorityHandling}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {cases.length === 0 ? (
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <CardContent className="p-12 text-center">
              <Scale className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{strings.noCases}</h3>
              <p className="mb-6" style={{ color: isDarkMode ? colors.textSecondary : '#64748B' }}>
                {strings.noCasesSub}
              </p>
              {hasMemberPrice && (
                <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-200">
                  <p className="text-sm text-emerald-800 font-medium">
                    ✓ {strings.memberBenefit}
                  </p>
                </div>
              )}
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate(createPageUrl("ResolveCase"))}>
                <Plus className="w-5 h-5 mr-2" />
                {strings.openFirstCase}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {cases.map((caseItem) => {
              const statusConfig = getStatusConfig(caseItem.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={caseItem.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                  <CardHeader className="border-b pb-4" style={{ borderColor: colors.borderColor }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl">
                          <Scale className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                            {strings.caseNumber}{caseItem.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-xs mt-1" style={{ color: isDarkMode ? colors.textSecondary : '#64748B' }}>
                            {strings.opened} {format(new Date(caseItem.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Badge className={`${statusConfig.color} border flex items-center gap-1 text-xs`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                        {caseItem.fast_track && hasPriorityQueue && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            {strings.fastTrack}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {caseItem.dispute_amount && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: isDarkMode ? colors.textSecondary : '#64748B' }}>{strings.disputeAmount}</p>
                          <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                            ฿{caseItem.dispute_amount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {caseItem.ops_assigned && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: isDarkMode ? colors.textSecondary : '#64748B' }}>{strings.assignedTo}</p>
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{strings.opsTeam}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-xs mb-2" style={{ color: isDarkMode ? colors.textSecondary : '#64748B' }}>{strings.features}</p>
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
                      <div className="p-3 bg-slate-50 rounded-xl mb-4" style={{ backgroundColor: isDarkMode ? colors.borderColor : '#F1F5F9' }}>
                        <p className="text-xs line-clamp-2" style={{ color: isDarkMode ? colors.textSecondary : '#475569' }}>{caseItem.summary}</p>
                      </div>
                    )}

                    {caseItem.success_fee_rate > 0 && (
                      <div className="p-3 bg-blue-50 rounded-xl mb-4 border border-blue-200">
                        <p className="text-xs text-blue-800">
                          {strings.successFee} <span className="font-bold">{caseItem.success_fee_rate}%</span>
                          {caseItem.is_member_at_creation && hasMemberPrice && (
                            <span className="ml-2 text-emerald-600 font-medium">
                              {strings.memberDiscount}
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 text-sm" size="sm">
                        {strings.viewDetails}
                      </Button>
                      {caseItem.status === 'user_action' && (
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm" size="sm">
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
