import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Shield,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Download,
  Target,
  Award,
  Zap,
  BarChart3
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Analytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 3m, 6m, 1y, all

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date'),
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
    chartLine: '#0C3B2E',
    chartFill: isDarkMode ? '#0C3B2E40' : '#0C3B2E20',
    chartGrid: isDarkMode ? '#3A3D40' : '#E5E7EB'
  };

  const t = {
    en: {
      title: "Analytics & Insights",
      subtitle: "Track your rental protection journey",
      back: "Back",
      timeRange: "Time Range",
      last1Month: "Last Month",
      last3Months: "Last 3 Months",
      last6Months: "Last 6 Months",
      lastYear: "Last Year",
      allTime: "All Time",
      totalProtected: "Total Protected",
      totalDeposits: "Total Deposits",
      activeCases: "Active Cases",
      avgReturnTime: "Avg Return Time",
      days: "days",
      documentsStored: "Documents Stored",
      files: "files",
      depositTrend: "Deposit Tracking Trend",
      caseSuccessRate: "Case Success Rate",
      documentGrowth: "Document Upload Growth",
      monthlyActivity: "Monthly Activity",
      casesByType: "Cases by Type",
      casesByStatus: "Cases by Status",
      depositsByStatus: "Deposits by Status",
      keyMetrics: "Key Metrics",
      successRate: "Success Rate",
      resolved: "resolved",
      avgResolutionTime: "Avg Resolution Time",
      totalRecovered: "Total Recovered",
      protectionScore: "Protection Score",
      noDataYet: "Not enough data yet",
      uploadMore: "Upload more documents and track deposits to see insights",
      exportReport: "Export Report",
      exporting: "Exporting...",
      deposits: "Deposits",
      leases: "Leases",
      cases: "Cases",
      tracking: "Tracking",
      returned: "Returned",
      dispute: "Dispute",
      deposit: "Deposit",
      early_termination: "Early Term",
      damages: "Damages",
      other: "Other",
      intake: "Intake",
      active: "Active",
      closed: "Closed",
      month: "Month",
      achievements: "Achievements",
      firstLease: "First Lease Uploaded",
      firstDeposit: "Deposit Tracker Started",
      firstCase: "First Case Opened",
      documentCollector: "Document Collector",
      proactiveUser: "Proactive User",
    },
    th: {
      title: "การวิเคราะห์และข้อมูลเชิงลึก",
      subtitle: "ติดตามเส้นทางการป้องกันการเช่าของคุณ",
      back: "กลับ",
      timeRange: "ช่วงเวลา",
      last1Month: "เดือนที่แล้ว",
      last3Months: "3 เดือนที่แล้ว",
      last6Months: "6 เดือนที่แล้ว",
      lastYear: "ปีที่แล้ว",
      allTime: "ทั้งหมด",
      totalProtected: "การป้องกันทั้งหมด",
      totalDeposits: "เงินมัดจำทั้งหมด",
      activeCases: "คดีที่ใช้งาน",
      avgReturnTime: "เวลาคืนเฉลี่ย",
      days: "วัน",
      documentsStored: "เอกสารที่จัดเก็บ",
      files: "ไฟล์",
      depositTrend: "แนวโน้มการติดตามเงินมัดจำ",
      caseSuccessRate: "อัตราความสำเร็จของคดี",
      documentGrowth: "การเติบโตของเอกสาร",
      monthlyActivity: "กิจกรรมรายเดือน",
      casesByType: "คดีตามประเภท",
      casesByStatus: "คดีตามสถานะ",
      depositsByStatus: "เงินมัดจำตามสถานะ",
      keyMetrics: "ตัวชี้วัดหลัก",
      successRate: "อัตราความสำเร็จ",
      resolved: "แก้ไขแล้ว",
      avgResolutionTime: "เวลาแก้ไขเฉลี่ย",
      totalRecovered: "เงินที่กู้คืนได้",
      protectionScore: "คะแนนการป้องกัน",
      noDataYet: "ยังไม่มีข้อมูลเพียงพอ",
      uploadMore: "อัปโหลดเอกสารเพิ่มและติดตามเงินมัดจำเพื่อดูข้อมูลเชิงลึก",
      exportReport: "ส่งออกรายงาน",
      exporting: "กำลังส่งออก...",
      deposits: "เงินมัดจำ",
      leases: "สัญญาเช่า",
      cases: "คดี",
      tracking: "กำลังติดตาม",
      returned: "คืนแล้ว",
      dispute: "พิพาท",
      deposit: "เงินมัดจำ",
      early_termination: "ยกเลิกก่อน",
      damages: "ค่าเสียหาย",
      other: "อื่นๆ",
      intake: "รับเรื่อง",
      active: "ใช้งาน",
      closed: "ปิด",
      month: "เดือน",
      achievements: "ความสำเร็จ",
      firstLease: "อัปโหลดสัญญาแรก",
      firstDeposit: "เริ่มติดตามเงินมัดจำ",
      firstCase: "เปิดคดีแรก",
      documentCollector: "นักสะสมเอกสาร",
      proactiveUser: "ผู้ใช้งานเชิงรุก",
    }
  };

  const strings = t[language];

  // Calculate key metrics
  const totalDepositValue = deposits.reduce((sum, d) => sum + (d.deposit_amount || 0), 0);
  const activeCasesCount = cases.filter(c => c.status !== 'closed').length;
  
  const returnedDeposits = deposits.filter(d => d.status === 'returned');
  const avgReturnTime = returnedDeposits.length > 0
    ? Math.round(
        returnedDeposits.reduce((sum, d) => {
          const days = differenceInDays(
            new Date(d.updated_date || d.created_date),
            new Date(d.deposit_paid_date)
          );
          return sum + days;
        }, 0) / returnedDeposits.length
      )
    : 0;

  const resolvedCases = cases.filter(c => c.status === 'closed');
  const successRate = cases.length > 0 ? Math.round((resolvedCases.length / cases.length) * 100) : 0;
  const totalRecovered = resolvedCases.reduce((sum, c) => sum + (c.settlement?.amount || 0), 0);
  
  const avgResolutionTime = resolvedCases.length > 0
    ? Math.round(
        resolvedCases.reduce((sum, c) => {
          const created = new Date(c.created_date);
          const resolved = c.settlement?.date ? new Date(c.settlement.date) : new Date();
          return sum + differenceInDays(resolved, created);
        }, 0) / resolvedCases.length
      )
    : 0;

  // Filter data by time range
  const getFilteredDate = () => {
    const now = new Date();
    switch(timeRange) {
      case '1m': return subMonths(now, 1);
      case '3m': return subMonths(now, 3);
      case '6m': return subMonths(now, 6);
      case '1y': return subMonths(now, 12);
      default: return new Date('2020-01-01'); // all time
    }
  };

  const filterByDate = (items) => {
    const cutoffDate = getFilteredDate();
    return items.filter(item => new Date(item.created_date) >= cutoffDate);
  };

  // Monthly activity data
  const getMonthlyData = () => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: getFilteredDate(),
      end: now
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthDeposits = deposits.filter(d => {
        const date = new Date(d.created_date);
        return date >= monthStart && date <= monthEnd;
      });

      const monthCases = cases.filter(c => {
        const date = new Date(c.created_date);
        return date >= monthStart && date <= monthEnd;
      });

      const monthDocs = documents.filter(d => {
        const date = new Date(d.created_date);
        return date >= monthStart && date <= monthEnd;
      });

      return {
        month: format(month, 'MMM yyyy'),
        deposits: monthDeposits.length,
        cases: monthCases.length,
        documents: monthDocs.length,
        totalValue: monthDeposits.reduce((sum, d) => sum + (d.deposit_amount || 0), 0)
      };
    });
  };

  const monthlyData = getMonthlyData();

  // Cases by type
  const casesByType = [
    { name: strings.deposit, value: cases.filter(c => c.type === 'deposit').length, color: '#0C3B2E' },
    { name: strings.early_termination, value: cases.filter(c => c.type === 'early_termination').length, color: '#C7A338' },
    { name: strings.damages, value: cases.filter(c => c.type === 'damages').length, color: '#EF4444' },
    { name: strings.other, value: cases.filter(c => c.type === 'other').length, color: '#64748B' }
  ].filter(item => item.value > 0);

  // Cases by status
  const casesByStatus = [
    { name: strings.intake, value: cases.filter(c => ['intake', 'pending_review'].includes(c.status)).length, color: '#F59E0B' },
    { name: strings.active, value: cases.filter(c => ['under_review', 'ready_drafts', 'client_review', 'in_progress'].includes(c.status)).length, color: '#3B82F6' },
    { name: strings.closed, value: cases.filter(c => c.status === 'closed').length, color: '#10B981' }
  ].filter(item => item.value > 0);

  // Deposits by status
  const depositsByStatus = [
    { name: strings.tracking, value: deposits.filter(d => d.status === 'tracking').length, color: '#3B82F6' },
    { name: strings.returned, value: deposits.filter(d => d.status === 'returned').length, color: '#10B981' },
    { name: strings.dispute, value: deposits.filter(d => d.status === 'dispute').length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // Achievements
  const achievements = [
    {
      id: 'first_lease',
      label: strings.firstLease,
      icon: FileText,
      unlocked: leases.length > 0,
      color: '#3B82F6'
    },
    {
      id: 'first_deposit',
      label: strings.firstDeposit,
      icon: Shield,
      unlocked: deposits.length > 0,
      color: '#0C3B2E'
    },
    {
      id: 'first_case',
      label: strings.firstCase,
      icon: Target,
      unlocked: cases.length > 0,
      color: '#C7A338'
    },
    {
      id: 'doc_collector',
      label: strings.documentCollector,
      icon: Award,
      unlocked: documents.length >= 10,
      color: '#8B5CF6'
    },
    {
      id: 'proactive',
      label: strings.proactiveUser,
      icon: Zap,
      unlocked: leases.length > 0 && deposits.length > 0 && documents.length > 0,
      color: '#F59E0B'
    }
  ];

  const handleExportReport = async () => {
    const report = {
      generated_at: new Date().toISOString(),
      user: user?.email,
      summary: {
        total_deposits: deposits.length,
        total_deposit_value: totalDepositValue,
        active_cases: activeCasesCount,
        success_rate: successRate,
        total_recovered: totalRecovered,
        documents_stored: documents.length
      },
      deposits: deposits.map(d => ({
        amount: d.deposit_amount,
        property: d.property_address,
        status: d.status,
        paid_date: d.deposit_paid_date,
        expected_return: d.expected_return_date
      })),
      cases: cases.map(c => ({
        case_number: c.case_number,
        type: c.type,
        status: c.status,
        amount: c.dispute_amount,
        created: c.created_date
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lease_shield_analytics_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const hasData = deposits.length > 0 || cases.length > 0 || documents.length > 0;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.back}
        </Button>

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <BarChart3 className="w-7 h-7 md:w-8 md:h-8 text-ls-forest" />
              {strings.title}
            </h1>
            <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              disabled={!hasData}
            >
              <Download className="w-4 h-4 mr-2" />
              {strings.exportReport}
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {[
            { key: '1m', label: strings.last1Month },
            { key: '3m', label: strings.last3Months },
            { key: '6m', label: strings.last6Months },
            { key: '1y', label: strings.lastYear },
            { key: 'all', label: strings.allTime }
          ].map(range => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: `2px solid ${timeRange === range.key ? '#0C3B2E' : colors.borderColor}`,
                backgroundColor: timeRange === range.key ? '#0C3B2E' : colors.cardBg,
                color: timeRange === range.key ? '#FFFFFF' : colors.textPrimary,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {range.label}
            </button>
          ))}
        </div>

        {!hasData ? (
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.3 }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noDataYet}
              </h3>
              <p style={{ color: colors.textSecondary }}>{strings.uploadMore}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #0C3B2E' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-ls-forest" />
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.totalProtected}
                    </p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#0C3B2E' }}>
                    ฿{totalDepositValue.toLocaleString()}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {deposits.length} {strings.deposits.toLowerCase()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #C7A338' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-ls-gold" />
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.successRate}
                    </p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#C7A338' }}>
                    {successRate}%
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {resolvedCases.length} {strings.resolved}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #3B82F6' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.avgReturnTime}
                    </p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#3B82F6' }}>
                    {avgReturnTime}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {strings.days}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #10B981' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {strings.documentsStored}
                    </p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#10B981' }}>
                    {documents.length}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {strings.files}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Monthly Activity */}
              <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: colors.textPrimary }}>
                    <TrendingUp className="w-5 h-5 text-ls-forest" />
                    {strings.monthlyActivity}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0C3B2E" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0C3B2E" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C7A338" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#C7A338" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                      <XAxis dataKey="month" stroke={colors.textSecondary} style={{ fontSize: '12px' }} />
                      <YAxis stroke={colors.textSecondary} style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.cardBg,
                          border: `1px solid ${colors.borderColor}`,
                          borderRadius: '8px',
                          color: colors.textPrimary
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="deposits" stroke="#0C3B2E" fillOpacity={1} fill="url(#colorDeposits)" name={strings.deposits} />
                      <Area type="monotone" dataKey="cases" stroke="#C7A338" fillOpacity={1} fill="url(#colorCases)" name={strings.cases} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Document Growth */}
              <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: colors.textPrimary }}>
                    <FileText className="w-5 h-5 text-ls-gold" />
                    {strings.documentGrowth}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                      <XAxis dataKey="month" stroke={colors.textSecondary} style={{ fontSize: '12px' }} />
                      <YAxis stroke={colors.textSecondary} style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.cardBg,
                          border: `1px solid ${colors.borderColor}`,
                          borderRadius: '8px',
                          color: colors.textPrimary
                        }}
                      />
                      <Bar dataKey="documents" fill="#C7A338" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 - Pie Charts */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Deposits by Status */}
              {depositsByStatus.length > 0 && (
                <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                  <CardHeader>
                    <CardTitle className="text-base" style={{ color: colors.textPrimary }}>
                      {strings.depositsByStatus}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={depositsByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.value}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {depositsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.borderColor}`,
                            borderRadius: '8px',
                            color: colors.textPrimary
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {depositsByStatus.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: item.color }} />
                            <span style={{ color: colors.textPrimary }}>{item.name}</span>
                          </div>
                          <span style={{ color: colors.textSecondary }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cases by Type */}
              {casesByType.length > 0 && (
                <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                  <CardHeader>
                    <CardTitle className="text-base" style={{ color: colors.textPrimary }}>
                      {strings.casesByType}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={casesByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.value}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {casesByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.borderColor}`,
                            borderRadius: '8px',
                            color: colors.textPrimary
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {casesByType.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: item.color }} />
                            <span style={{ color: colors.textPrimary }}>{item.name}</span>
                          </div>
                          <span style={{ color: colors.textSecondary }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cases by Status */}
              {casesByStatus.length > 0 && (
                <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                  <CardHeader>
                    <CardTitle className="text-base" style={{ color: colors.textPrimary }}>
                      {strings.casesByStatus}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={casesByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.value}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {casesByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.borderColor}`,
                            borderRadius: '8px',
                            color: colors.textPrimary
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {casesByStatus.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: item.color }} />
                            <span style={{ color: colors.textPrimary }}>{item.name}</span>
                          </div>
                          <span style={{ color: colors.textSecondary }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Achievements */}
            <Card className="border-none shadow-xl mb-6" style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #2A2D30 0%, #1A1D1F 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
            }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg" style={{ color: colors.textPrimary }}>
                  <Award className="w-5 h-5 text-ls-gold" />
                  {strings.achievements}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {achievements.map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className="p-4 rounded-xl text-center transition-all"
                        style={{
                          backgroundColor: achievement.unlocked
                            ? `${achievement.color}15`
                            : colors.borderColor,
                          border: `2px solid ${achievement.unlocked ? achievement.color : colors.borderColor}`,
                          opacity: achievement.unlocked ? 1 : 0.5
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                          style={{
                            backgroundColor: achievement.unlocked ? achievement.color : colors.textSecondary
                          }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-xs font-semibold" style={{
                          color: achievement.unlocked ? colors.textPrimary : colors.textSecondary
                        }}>
                          {achievement.label}
                        </p>
                        {achievement.unlocked && (
                          <CheckCircle2 className="w-4 h-4 mx-auto mt-2" style={{ color: achievement.color }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Additional Metrics */}
            {cases.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>
                      {strings.avgResolutionTime}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#3B82F620' }}
                      >
                        <Clock className="w-10 h-10 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-4xl font-bold" style={{ color: '#3B82F6' }}>
                          {avgResolutionTime}
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {strings.days}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>
                      {strings.totalRecovered}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#10B98120' }}
                      >
                        <DollarSign className="w-10 h-10 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-4xl font-bold" style={{ color: '#10B981' }}>
                          ฿{totalRecovered.toLocaleString()}
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {resolvedCases.length} {strings.cases.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}