import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, FileText, Shield, Wallet, Scale, Wrench, Filter } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DebouncedSearch from "../components/shared/DebouncedSearch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import AuthGuard from "../components/shared/AuthGuard";

function SearchContent() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: deposits = [], isLoading: depositsLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: maintenance = [], isLoading: maintenanceLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    inputBg: isDarkMode ? '#353A3D' : '#FFFFFF'
  };

  const strings = {
    en: {
      title: "Search",
      subtitle: "Find leases, deposits, cases, and documents",
      searchPlaceholder: "Search by property, amount, status...",
      filterAll: "All",
      filterLeases: "Leases",
      filterDeposits: "Deposits",
      filterCases: "Cases",
      filterDocuments: "Documents",
      filterMaintenance: "Maintenance",
      noResults: "No results found",
      tryDifferent: "Try a different search or filter",
      results: "results",
      lease: "Lease",
      deposit: "Deposit",
      case: "Case",
      document: "Document",
      maintenance: "Maintenance",
      scanned: "Scanned",
      uploaded: "Uploaded",
      tracking: "Tracking",
      returned: "Returned",
      open: "Open",
      closed: "Closed",
      reported: "Reported",
      completed: "Completed",
      back: "Back"
    },
    th: {
      title: "ค้นหา",
      subtitle: "ค้นหาสัญญาเช่า เงินมัดจำ คดี และเอกสาร",
      searchPlaceholder: "ค้นหาด้วยทรัพย์สิน จำนวน สถานะ...",
      filterAll: "ทั้งหมด",
      filterLeases: "สัญญาเช่า",
      filterDeposits: "เงินมัดจำ",
      filterCases: "คดี",
      filterDocuments: "เอกสาร",
      filterMaintenance: "การซ่อม",
      noResults: "ไม่พบผลลัพธ์",
      tryDifferent: "ลองค้นหาหรือกรองแบบอื่น",
      results: "ผลลัพธ์",
      lease: "สัญญาเช่า",
      deposit: "เงินมัดจำ",
      case: "คดี",
      document: "เอกสาร",
      maintenance: "การซ่อม",
      scanned: "สแกนแล้ว",
      uploaded: "อัปโหลดแล้ว",
      tracking: "ติดตาม",
      returned: "คืนแล้ว",
      open: "เปิด",
      closed: "ปิด",
      reported: "รายงาน",
      completed: "เสร็จสิ้น",
      back: "กลับ"
    },
    zh: {
      title: "搜索",
      subtitle: "查找租约、押金、案件和文档",
      searchPlaceholder: "按物业、金额、状态搜索...",
      filterAll: "全部",
      filterLeases: "租约",
      filterDeposits: "押金",
      filterCases: "案件",
      filterDocuments: "文档",
      filterMaintenance: "维护",
      noResults: "未找到结果",
      tryDifferent: "尝试不同的搜索或筛选",
      results: "结果",
      lease: "租约",
      deposit: "押金",
      case: "案件",
      document: "文档",
      maintenance: "维护",
      scanned: "已扫描",
      uploaded: "已上传",
      tracking: "追踪中",
      returned: "已退还",
      open: "打开",
      closed: "已关闭",
      reported: "已报告",
      completed: "已完成",
      back: "返回"
    },
    ja: {
      title: "検索",
      subtitle: "賃貸契約、敷金、ケース、ドキュメントを検索",
      searchPlaceholder: "物件、金額、ステータスで検索...",
      filterAll: "すべて",
      filterLeases: "賃貸契約",
      filterDeposits: "敷金",
      filterCases: "ケース",
      filterDocuments: "ドキュメント",
      filterMaintenance: "メンテナンス",
      noResults: "結果が見つかりません",
      tryDifferent: "別の検索またはフィルターを試してください",
      results: "結果",
      lease: "賃貸契約",
      deposit: "敷金",
      case: "ケース",
      document: "ドキュメント",
      maintenance: "メンテナンス",
      scanned: "スキャン済み",
      uploaded: "アップロード済み",
      tracking: "追跡中",
      returned: "返還済み",
      open: "開く",
      closed: "閉じた",
      reported: "報告済み",
      completed: "完了",
      back: "戻る"
    },
    ko: {
      title: "검색",
      subtitle: "임대 계약, 보증금, 사례, 문서 찾기",
      searchPlaceholder: "부동산, 금액, 상태로 검색...",
      filterAll: "전체",
      filterLeases: "임대 계약",
      filterDeposits: "보증금",
      filterCases: "사례",
      filterDocuments: "문서",
      filterMaintenance: "유지보수",
      noResults: "결과를 찾을 수 없음",
      tryDifferent: "다른 검색이나 필터를 시도해보세요",
      results: "결과",
      lease: "임대 계약",
      deposit: "보증금",
      case: "사례",
      document: "문서",
      maintenance: "유지보수",
      scanned: "스캔됨",
      uploaded: "업로드됨",
      tracking: "추적 중",
      returned: "반환됨",
      open: "열기",
      closed: "닫힘",
      reported: "보고됨",
      completed: "완료",
      back: "뒤로"
    },
    ru: {
      title: "Поиск",
      subtitle: "Найдите договоры, депозиты, дела и документы",
      searchPlaceholder: "Поиск по недвижимости, сумме, статусу...",
      filterAll: "Всё",
      filterLeases: "Договоры",
      filterDeposits: "Депозиты",
      filterCases: "Дела",
      filterDocuments: "Документы",
      filterMaintenance: "Обслуживание",
      noResults: "Результатов не найдено",
      tryDifferent: "Попробуйте другой поиск или фильтр",
      results: "результатов",
      lease: "Договор",
      deposit: "Депозит",
      case: "Дело",
      document: "Документ",
      maintenance: "Обслуживание",
      scanned: "Отсканировано",
      uploaded: "Загружено",
      tracking: "Отслеживание",
      returned: "Возвращено",
      open: "Открыто",
      closed: "Закрыто",
      reported: "Сообщено",
      completed: "Завершено",
      back: "Назад"
    }
  };

  const str = strings[language] || strings.en;

  // Memoized search results to avoid re-computation
  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const results = [];

    if (filterType === 'all' || filterType === 'leases') {
      leases.forEach(lease => {
        const matchScore = 
          (lease.property_address?.toLowerCase().includes(query) ? 3 : 0) +
          (lease.status?.toLowerCase().includes(query) ? 2 : 0) +
          (lease.rent_amount?.toString().includes(query) ? 1 : 0);

        if (matchScore > 0 || !query) {
          results.push({
            type: 'lease',
            id: lease.id,
            title: lease.property_address || str.lease,
            subtitle: `${str.scanned} ${format(new Date(lease.created_date), 'MMM d, yyyy')}`,
            status: lease.status,
            icon: FileText,
            color: '#3B82F6',
            route: createPageUrl("UploadScan") + `?leaseId=${lease.id}`,
            matchScore,
            data: lease
          });
        }
      });
    }

    if (filterType === 'all' || filterType === 'deposits') {
      deposits.forEach(deposit => {
        const matchScore = 
          (deposit.property_address?.toLowerCase().includes(query) ? 3 : 0) +
          (deposit.status?.toLowerCase().includes(query) ? 2 : 0) +
          (deposit.deposit_amount?.toString().includes(query) ? 2 : 0) +
          (deposit.notes?.toLowerCase().includes(query) ? 1 : 0);

        if (matchScore > 0 || !query) {
          results.push({
            type: 'deposit',
            id: deposit.id,
            title: `฿${deposit.deposit_amount?.toLocaleString()} - ${deposit.property_address || str.deposit}`,
            subtitle: `${str.tracking} - ${format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}`,
            status: deposit.status,
            icon: Wallet,
            color: '#C7A338',
            route: createPageUrl("DepositTracker"),
            matchScore,
            data: deposit
          });
        }
      });
    }

    if (filterType === 'all' || filterType === 'cases') {
      cases.forEach(caseItem => {
        const matchScore = 
          (caseItem.summary?.toLowerCase().includes(query) ? 3 : 0) +
          (caseItem.case_number?.toLowerCase().includes(query) ? 3 : 0) +
          (caseItem.status?.toLowerCase().includes(query) ? 2 : 0) +
          (caseItem.landlord_name?.toLowerCase().includes(query) ? 2 : 0) +
          (caseItem.dispute_amount?.toString().includes(query) ? 1 : 0);

        if (matchScore > 0 || !query) {
          results.push({
            type: 'case',
            id: caseItem.id,
            title: caseItem.case_number || str.case,
            subtitle: caseItem.summary || `฿${caseItem.dispute_amount?.toLocaleString()}`,
            status: caseItem.status,
            icon: Scale,
            color: '#1A1D1F',
            route: createPageUrl("CaseDetails") + `?caseId=${caseItem.id}`,
            matchScore,
            data: caseItem
          });
        }
      });
    }

    if (filterType === 'all' || filterType === 'documents') {
      documents.forEach(doc => {
        const matchScore = 
          (doc.label?.toLowerCase().includes(query) ? 3 : 0) +
          (doc.type?.toLowerCase().includes(query) ? 2 : 0);

        if (matchScore > 0 || !query) {
          results.push({
            type: 'document',
            id: doc.id,
            title: doc.label || doc.type,
            subtitle: format(new Date(doc.created_date), 'MMM d, yyyy'),
            status: doc.type,
            icon: FileText,
            color: '#8B5CF6',
            route: createPageUrl("EvidenceVault"),
            matchScore,
            data: doc
          });
        }
      });
    }

    if (filterType === 'all' || filterType === 'maintenance') {
      maintenance.forEach(req => {
        const matchScore = 
          (req.issue_title?.toLowerCase().includes(query) ? 3 : 0) +
          (req.property_address?.toLowerCase().includes(query) ? 2 : 0) +
          (req.status?.toLowerCase().includes(query) ? 2 : 0) +
          (req.category?.toLowerCase().includes(query) ? 1 : 0);

        if (matchScore > 0 || !query) {
          results.push({
            type: 'maintenance',
            id: req.id,
            title: req.issue_title || str.maintenance,
            subtitle: req.property_address || req.category,
            status: req.status,
            icon: Wrench,
            color: '#F59E0B',
            route: createPageUrl("PropertyTracker"),
            matchScore,
            data: req
          });
        }
      });
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [searchQuery, filterType, leases, deposits, cases, documents, maintenance, str]);

  const isLoading = leasesLoading || depositsLoading || casesLoading || documentsLoading || maintenanceLoading;

  const getStatusBadge = (status) => {
    const statusMap = {
      scanned: { bg: '#ECFDF5', text: '#059669', label: str.scanned },
      uploaded: { bg: '#FEF3C7', text: '#D97706', label: str.uploaded },
      tracking: { bg: '#DBEAFE', text: '#2563EB', label: str.tracking },
      returned: { bg: '#ECFDF5', text: '#059669', label: str.returned },
      open: { bg: '#FEE2E2', text: '#DC2626', label: str.open },
      closed: { bg: '#F3F4F6', text: '#6B7280', label: str.closed },
      reported: { bg: '#FEF3C7', text: '#D97706', label: str.reported },
      completed: { bg: '#ECFDF5', text: '#059669', label: str.completed }
    };

    const config = statusMap[status] || { bg: '#F3F4F6', text: '#6B7280', label: status };

    return (
      <Badge style={{ backgroundColor: config.bg, color: config.text }}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#0C3B2E',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SearchIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textPrimary }}>
                {str.title}
              </h1>
              <p style={{ color: colors.textSecondary }}>{str.subtitle}</p>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-4">
            <DebouncedSearch
              onSearch={setSearchQuery}
              placeholder={str.searchPlaceholder}
              colors={colors}
              language={language}
              delay={300}
              minChars={1}
            />
          </CardContent>
        </Card>

        <div className="mb-6 flex items-center gap-3">
          <Filter className="w-5 h-5" style={{ color: colors.textSecondary }} />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48" style={{ 
              backgroundColor: colors.inputBg, 
              borderColor: colors.borderColor,
              color: colors.textPrimary 
            }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: colors.cardBg }}>
              <SelectItem value="all">{str.filterAll}</SelectItem>
              <SelectItem value="leases">{str.filterLeases}</SelectItem>
              <SelectItem value="deposits">{str.filterDeposits}</SelectItem>
              <SelectItem value="cases">{str.filterCases}</SelectItem>
              <SelectItem value="documents">{str.filterDocuments}</SelectItem>
              <SelectItem value="maintenance">{str.filterMaintenance}</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || filterType !== 'all') && (
            <Badge className="flex items-center gap-1">
              {searchResults.length} {str.results}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <SkeletonLoader variant="card" count={5} colors={colors} />
        ) : searchResults.length === 0 ? (
          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-12 text-center">
              <SearchIcon className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {str.noResults}
              </h3>
              <p style={{ color: colors.textSecondary }}>{str.tryDifferent}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {searchResults.map((result) => {
              const Icon = result.icon;
              
              return (
                <Card
                  key={`${result.type}-${result.id}`}
                  className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => navigate(result.route)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${result.color}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: result.color }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-base" style={{ color: colors.textPrimary }}>
                            {result.title}
                          </h3>
                          {getStatusBadge(result.status)}
                        </div>
                        
                        <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                          {result.subtitle}
                        </p>
                        
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: result.color,
                            color: result.color
                          }}
                        >
                          {str[result.type]}
                        </Badge>
                      </div>
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

export default function Search() {
  return (
    <AuthGuard>
      <SearchContent />
    </AuthGuard>
  );
}