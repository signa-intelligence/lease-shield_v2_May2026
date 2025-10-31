import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Home,
  Scale,
  ArrowRight
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  intake: {
    label: { en: 'Intake', th: 'รับเรื่อง', ja: '受付中' },
    icon: Clock,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  investigating: {
    label: { en: 'Investigating', th: 'กำลังตรวจสอบ', ja: '調査中' },
    icon: AlertCircle,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  negotiating: {
    label: { en: 'Negotiating', th: 'กำลังเจรจา', ja: '交渉中' },
    icon: Scale,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  resolved: {
    label: { en: 'Resolved', th: 'แก้ไขแล้ว', ja: '解決済み' },
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  closed: {
    label: { en: 'Closed', th: 'ปิดเคส', ja: '終了' },
    icon: CheckCircle2,
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
};

const t = {
  en: {
    title: 'Cases',
    description: 'Track and manage your deposit recovery cases',
    noCases: 'No cases yet',
    startCase: 'Open a case from your deposit tracker to get started',
    caseID: 'Case ID',
    property: 'Property',
    amount: 'Amount',
    viewDetails: 'View Details',
    created: 'Created',
    updated: 'Updated'
  },
  th: {
    title: 'คดี',
    description: 'ติดตามและจัดการคดีเรียกคืนเงินประกันของคุณ',
    noCases: 'ยังไม่มีคดี',
    startCase: 'เปิดคดีจากตัวติดตามเงินประกันของคุณเพื่อเริ่มต้น',
    caseID: 'รหัสคดี',
    property: 'ทรัพย์สิน',
    amount: 'จำนวนเงิน',
    viewDetails: 'ดูรายละเอียด',
    created: 'สร้างเมื่อ',
    updated: 'อัปเดตเมื่อ'
  },
  ja: {
    title: 'ケース',
    description: '敷金返還ケースの追跡と管理',
    noCases: 'まだケースがありません',
    startCase: '預金トラッカーからケースを開始してください',
    caseID: 'ケースID',
    property: '物件',
    amount: '金額',
    viewDetails: '詳細を見る',
    created: '作成日',
    updated: '更新日'
  }
};

export default function Cases() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: cases, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({}),
    initialData: []
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
    bg: '#0C3B2E',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#e2e8f0'
  };

  const strings = t[language];

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.intake;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            {strings.title}
          </h1>
          <p style={{ color: colors.textSecondary }}>
            {strings.description}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : cases.length === 0 ? (
          <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <CardContent className="py-12 text-center">
              <Scale className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: colors.textSecondary }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noCases}
              </h3>
              <p className="mb-6" style={{ color: colors.textSecondary }}>
                {strings.startCase}
              </p>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link to={createPageUrl('DepositTracker')}>
                  <Home className="w-4 h-4 mr-2" />
                  Go to Deposit Tracker
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {cases.map((caseItem) => {
              const statusConfig = getStatusConfig(caseItem.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card 
                  key={caseItem.id} 
                  className="hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
                >
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label[language]}
                          </Badge>
                          <span className="text-sm" style={{ color: colors.textSecondary }}>
                            {strings.caseID}: {caseItem.id.slice(0, 8)}
                          </span>
                        </div>
                        <CardTitle style={{ color: colors.textPrimary }}>
                          {caseItem.property_address || strings.property}
                        </CardTitle>
                        <CardDescription style={{ color: colors.textSecondary }}>
                          {caseItem.claim_description || caseItem.issue_type}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">
                          ¥{caseItem.deposit_amount?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          {strings.amount}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex gap-6 text-sm" style={{ color: colors.textSecondary }}>
                        <div>
                          <div className="font-medium" style={{ color: colors.textPrimary }}>{strings.created}</div>
                          <div>{new Date(caseItem.created_date).toLocaleDateString(language === 'ja' ? 'ja-JP' : language === 'th' ? 'th-TH' : 'en-US')}</div>
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: colors.textPrimary }}>{strings.updated}</div>
                          <div>{new Date(caseItem.updated_date).toLocaleDateString(language === 'ja' ? 'ja-JP' : language === 'th' ? 'th-TH' : 'en-US')}</div>
                        </div>
                      </div>
                      <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link to={`${createPageUrl('ResolveCase')}?caseId=${caseItem.id}`}>
                          {strings.viewDetails}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
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