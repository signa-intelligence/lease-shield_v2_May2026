import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search as SearchIcon,
  FileText,
  Shield,
  Scale,
  Wallet,
  Camera,
  ArrowLeft,
  Filter,
  X,
  Calendar,
  DollarSign,
  MapPin,
  Wrench,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Search() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }, '-created_date'),
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
    inputBg: isDarkMode ? '#353A3D' : '#FFFFFF',
    filterBg: isDarkMode ? '#353A3D' : '#F3F4F6'
  };

  const t = {
    en: {
      title: "Search Everything",
      subtitle: "Find leases, cases, deposits, documents, and more",
      back: "Back",
      searchPlaceholder: "Search by address, amount, case number, property...",
      filters: "Filters",
      clearFilters: "Clear All",
      type: "Type",
      status: "Status",
      dateRange: "Date Range",
      amountRange: "Amount Range",
      from: "From",
      to: "To",
      min: "Min",
      max: "Max",
      results: "results",
      noResults: "No results found",
      tryDifferent: "Try different search terms or filters",
      leases: "Leases",
      deposits: "Deposits",
      cases: "Cases",
      documents: "Documents",
      maintenance: "Maintenance",
      viewDetails: "View",
      amount: "Amount",
      property: "Property",
      caseNumber: "Case",
      created: "Created",
      uploadedOn: "Uploaded",
      reportedOn: "Reported",
      tracking: "Tracking",
      returned: "Returned",
      dispute: "Dispute",
      scanned: "Scanned",
      uploaded: "Uploaded",
      open: "Open",
      closed: "Closed",
      lease: "Lease",
      receipt: "Receipt",
      photo: "Photo",
      video: "Video",
      letter: "Letter",
      other: "Other",
      reported: "Reported",
      acknowledged: "Acknowledged",
      in_progress: "In Progress",
      completed: "Completed"
    },
    th: {
      title: "ค้นหาทุกอย่าง",
      subtitle: "ค้นหาสัญญาเช่า คดี เงินมัดจำ เอกสาร และอื่นๆ",
      back: "กลับ",
      searchPlaceholder: "ค้นหาด้วยที่อยู่ จำนวนเงิน เลขคดี ทรัพย์สิน...",
      filters: "ตัวกรอง",
      clearFilters: "ล้างทั้งหมด",
      type: "ประเภท",
      status: "สถานะ",
      dateRange: "ช่วงวันที่",
      amountRange: "ช่วงจำนวนเงิน",
      from: "จาก",
      to: "ถึง",
      min: "ต่ำสุด",
      max: "สูงสุด",
      results: "ผลลัพธ์",
      noResults: "ไม่พบผลลัพธ์",
      tryDifferent: "ลองใช้คำค้นหาหรือตัวกรองอื่น",
      leases: "สัญญาเช่า",
      deposits: "เงินมัดจำ",
      cases: "คดี",
      documents: "เอกสาร",
      maintenance: "การซ่อมบำรุง",
      viewDetails: "ดู",
      amount: "จำนวนเงิน",
      property: "ทรัพย์สิน",
      caseNumber: "คดี",
      created: "สร้าง",
      uploadedOn: "อัปโหลด",
      reportedOn: "รายงาน",
      tracking: "กำลังติดตาม",
      returned: "คืนแล้ว",
      dispute: "พิพาท",
      scanned: "สแกนแล้ว",
      uploaded: "อัปโหลดแล้ว",
      open: "เปิด",
      closed: "ปิด",
      lease: "สัญญาเช่า",
      receipt: "ใบเสร็จ",
      photo: "รูปภาพ",
      video: "วิดีโอ",
      letter: "จดหมาย",
      other: "อื่นๆ",
      reported: "รายงานแล้ว",
      acknowledged: "รับทราบแล้ว",
      in_progress: "กำลังดำเนินการ",
      completed: "เสร็จสิ้น"
    }
  };

  const strings = t[language];

  // Combine all data into searchable items
  const allItems = useMemo(() => {
    const items = [];

    // Leases
    leases.forEach(lease => {
      items.push({
        id: lease.id,
        type: 'lease',
        title: lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement'),
        subtitle: lease.start_date && lease.end_date 
          ? `${format(new Date(lease.start_date), 'MMM d, yyyy')} - ${format(new Date(lease.end_date), 'MMM d, yyyy')}`
          : '',
        amount: lease.rent_amount || lease.deposit_amount,
        status: lease.status,
        created_date: lease.created_date,
        searchText: `${lease.property_address || ''} ${lease.rent_amount || ''} ${lease.deposit_amount || ''}`.toLowerCase(),
        route: createPageUrl("UploadScan") + `?leaseId=${lease.id}`
      });
    });

    // Deposits
    deposits.forEach(deposit => {
      items.push({
        id: deposit.id,
        type: 'deposit',
        title: deposit.property_address || `฿${deposit.deposit_amount?.toLocaleString()}`,
        subtitle: deposit.expected_return_date 
          ? `${strings.to} ${format(new Date(deposit.expected_return_date), 'MMM d, yyyy')}`
          : '',
        amount: deposit.deposit_amount,
        status: deposit.status,
        created_date: deposit.created_date,
        searchText: `${deposit.property_address || ''} ${deposit.deposit_amount || ''} ${deposit.notes || ''}`.toLowerCase(),
        route: createPageUrl("DepositTracker")
      });
    });

    // Cases
    cases.forEach(caseItem => {
      items.push({
        id: caseItem.id,
        type: 'case',
        title: caseItem.case_number || `Case #${caseItem.id.slice(0, 8)}`,
        subtitle: caseItem.summary || caseItem.type,
        amount: caseItem.dispute_amount,
        status: caseItem.status,
        created_date: caseItem.created_date,
        searchText: `${caseItem.case_number || ''} ${caseItem.summary || ''} ${caseItem.dispute_amount || ''} ${caseItem.landlord_name || ''}`.toLowerCase(),
        route: createPageUrl("CaseDetails") + `?caseId=${caseItem.id}`
      });
    });

    // Documents
    documents.forEach(doc => {
      items.push({
        id: doc.id,
        type: 'document',
        title: doc.label || doc.type,
        subtitle: doc.type,
        status: doc.type,
        created_date: doc.created_date,
        searchText: `${doc.label || ''} ${doc.type || ''}`.toLowerCase(),
        route: createPageUrl("DocumentVault")
      });
    });

    // Maintenance
    maintenance.forEach(req => {
      items.push({
        id: req.id,
        type: 'maintenance',
        title: req.issue_title || 'Maintenance Request',
        subtitle: req.category,
        status: req.status,
        created_date: req.created_date,
        searchText: `${req.request_number || ''} ${req.issue_title || ''} ${req.description || ''} ${req.property_address || ''}`.toLowerCase(),
        route: createPageUrl("PropertyTracker")
      });
    });

    return items;
  }, [leases, deposits, cases, documents, maintenance, language]);

  // Filter and search logic
  const filteredResults = useMemo(() => {
    let results = [...allItems];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => item.searchText.includes(query));
    }

    // Type filter
    if (selectedTypes.length > 0) {
      results = results.filter(item => selectedTypes.includes(item.type));
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      results = results.filter(item => selectedStatuses.includes(item.status));
    }

    // Date range filter
    if (dateRange.from) {
      results = results.filter(item => new Date(item.created_date) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      results = results.filter(item => new Date(item.created_date) <= new Date(dateRange.to));
    }

    // Amount range filter
    if (amountRange.min) {
      results = results.filter(item => (item.amount || 0) >= parseFloat(amountRange.min));
    }
    if (amountRange.max) {
      results = results.filter(item => (item.amount || 0) <= parseFloat(amountRange.max));
    }

    // Sort by created_date descending
    return results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [allItems, searchQuery, selectedTypes, selectedStatuses, dateRange, amountRange]);

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setDateRange({ from: '', to: '' });
    setAmountRange({ min: '', max: '' });
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'lease': return FileText;
      case 'deposit': return Wallet;
      case 'case': return Scale;
      case 'document': return Camera;
      case 'maintenance': return Wrench;
      default: return FileText;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'lease': return '#3B82F6';
      case 'deposit': return '#C7A338';
      case 'case': return '#0C3B2E';
      case 'document': return '#8B5CF6';
      case 'maintenance': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const getStatusColor = (status, type) => {
    // Deposit statuses
    if (['tracking', 'returned', 'dispute'].includes(status)) {
      switch(status) {
        case 'tracking': return 'bg-blue-100 text-blue-800';
        case 'returned': return 'bg-emerald-100 text-emerald-800';
        case 'dispute': return 'bg-red-100 text-red-800';
      }
    }
    
    // Lease statuses
    if (['scanned', 'uploaded'].includes(status)) {
      switch(status) {
        case 'scanned': return 'bg-emerald-100 text-emerald-800';
        case 'uploaded': return 'bg-blue-100 text-blue-800';
      }
    }

    // Case statuses
    if (['intake', 'active', 'closed'].includes(status)) {
      switch(status) {
        case 'intake': return 'bg-amber-100 text-amber-800';
        case 'active': return 'bg-blue-100 text-blue-800';
        case 'closed': return 'bg-emerald-100 text-emerald-800';
      }
    }

    // Maintenance statuses
    if (['reported', 'acknowledged', 'in_progress', 'completed'].includes(status)) {
      switch(status) {
        case 'reported': return 'bg-blue-100 text-blue-800';
        case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
        case 'in_progress': return 'bg-purple-100 text-purple-800';
        case 'completed': return 'bg-emerald-100 text-emerald-800';
      }
    }

    return 'bg-slate-100 text-slate-800';
  };

  const activeFiltersCount = selectedTypes.length + selectedStatuses.length + 
    (dateRange.from ? 1 : 0) + (dateRange.to ? 1 : 0) + 
    (amountRange.min ? 1 : 0) + (amountRange.max ? 1 : 0);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.back}
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <SearchIcon className="w-7 h-7 md:w-8 md:h-8 text-ls-forest" />
            {strings.title}
          </h1>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-4">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={strings.searchPlaceholder}
                className="pl-12 pr-4 py-6 text-base"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" style={{ color: colors.textPrimary }} />
                <h3 className="font-bold" style={{ color: colors.textPrimary }}>{strings.filters}</h3>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-ls-forest text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-semibold flex items-center gap-1"
                  style={{ color: '#EF4444' }}
                >
                  <X className="w-4 h-4" />
                  {strings.clearFilters}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Type Filter */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>{strings.type}</p>
                <div className="flex flex-wrap gap-2">
                  {['lease', 'deposit', 'case', 'document', 'maintenance'].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: selectedTypes.includes(type) ? getTypeColor(type) : colors.filterBg,
                        color: selectedTypes.includes(type) ? '#FFFFFF' : colors.textPrimary,
                        border: `2px solid ${selectedTypes.includes(type) ? getTypeColor(type) : colors.borderColor}`
                      }}
                    >
                      {strings[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>{strings.status}</p>
                <div className="flex flex-wrap gap-2">
                  {['tracking', 'returned', 'dispute', 'scanned', 'uploaded', 'open', 'closed', 'reported', 'completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        selectedStatuses.includes(status) ? getStatusColor(status, null) : ''
                      }`}
                      style={{
                        backgroundColor: selectedStatuses.includes(status) ? undefined : colors.filterBg,
                        color: selectedStatuses.includes(status) ? undefined : colors.textPrimary,
                        border: `2px solid ${selectedStatuses.includes(status) ? 'transparent' : colors.borderColor}`
                      }}
                    >
                      {strings[status]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Amount Ranges */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>{strings.dateRange}</p>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                      placeholder={strings.from}
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                      placeholder={strings.to}
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>{strings.amountRange}</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={amountRange.min}
                      onChange={(e) => setAmountRange({...amountRange, min: e.target.value})}
                      placeholder={strings.min}
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                    <Input
                      type="number"
                      value={amountRange.max}
                      onChange={(e) => setAmountRange({...amountRange, max: e.target.value})}
                      placeholder={strings.max}
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
            {filteredResults.length} {strings.results}
          </p>
        </div>

        {filteredResults.length === 0 ? (
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-12 text-center">
              <SearchIcon className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.3 }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noResults}
              </h3>
              <p style={{ color: colors.textSecondary }}>{strings.tryDifferent}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredResults.map(item => {
              const Icon = getTypeIcon(item.type);
              const typeColor = getTypeColor(item.type);

              return (
                <Card
                  key={`${item.type}-${item.id}`}
                  className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => navigate(item.route)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${typeColor}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: typeColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-base truncate" style={{ color: colors.textPrimary }}>
                            {item.title}
                          </h3>
                          <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: colors.textSecondary }} />
                        </div>
                        {item.subtitle && (
                          <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                            {item.subtitle}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            style={{
                              backgroundColor: `${typeColor}20`,
                              color: typeColor,
                              border: `1px solid ${typeColor}40`,
                              fontSize: '11px'
                            }}
                          >
                            {strings[item.type]}
                          </Badge>
                          {item.status && (
                            <Badge className={`${getStatusColor(item.status, item.type)} text-xs`}>
                              {strings[item.status] || item.status}
                            </Badge>
                          )}
                          {item.amount && (
                            <span className="text-xs flex items-center gap-1" style={{ color: colors.textSecondary }}>
                              <DollarSign className="w-3 h-3" />
                              ฿{item.amount.toLocaleString()}
                            </span>
                          )}
                          <span className="text-xs flex items-center gap-1" style={{ color: colors.textSecondary }}>
                            <Calendar className="w-3 h-3" />
                            {format(new Date(item.created_date), 'MMM d, yyyy')}
                          </span>
                        </div>
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