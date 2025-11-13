
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  BarChart3,
  AlertTriangle,
  TrendingDown,
  Loader2
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { haptic } from "../components/shared/HapticFeedback";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";

function AnalyticsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [timeRange, setTimeRange] = useState('6m');
  const [exportingPdf, setExportingPdf] = useState(false);

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

  const { data: maintenanceRequests = [] } = useQuery({
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
      exportReport: "Export PDF Report",
      exportJson: "Export JSON",
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
      upcomingDeadlines: "Upcoming Deadlines",
      riskInsights: "Risk Insights",
      next30Days: "Next 30 Days",
      depositReturns: "Deposit Returns",
      leaseNotices: "Lease Notices",
      maintenanceActive: "Active Maintenance",
      requests: "requests",
      noUpcoming: "No upcoming deadlines",
      allOnTrack: "You're all on track!",
      refreshed: "Refreshed successfully",
      exportSuccess: "Report exported successfully",
      exportFailed: "Export failed",
      highRiskDeposits: "High Risk Deposits",
      overdueReturns: "Overdue Returns",
      urgentCases: "Urgent Cases",
      riskFactors: "Risk Factors",
      dueIn: "Due in",
      overdue: "Overdue by",
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
      exportReport: "ส่งออก PDF",
      exportJson: "ส่งออก JSON",
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
      upcomingDeadlines: "กำหนดเวลาที่ใกล้มาถึง",
      riskInsights: "ข้อมูลเชิงลึกความเสี่ยง",
      next30Days: "30 วันข้างหน้า",
      depositReturns: "การคืนเงินมัดจำ",
      leaseNotices: "การแจ้งสัญญาเช่า",
      maintenanceActive: "การซ่อมบำรุงที่ใช้งาน",
      requests: "คำขอ",
      noUpcoming: "ไม่มีกำหนดเวลาที่ใกล้มาถึง",
      allOnTrack: "คุณอยู่ในเส้นทางที่ถูกต้อง!",
      refreshed: "รีเฟรชสำเร็จ",
      exportSuccess: "ส่งออกรายงานสำเร็จ",
      exportFailed: "ส่งออกล้มเหลว",
      highRiskDeposits: "เงินมัดจำความเสี่ยงสูง",
      overdueReturns: "การคืนที่เกินกำหนด",
      urgentCases: "คดีเร่งด่วน",
      riskFactors: "ปัจจัยความเสี่ยง",
      dueIn: "ครบกำหนดใน",
      overdue: "เกินกำหนดไป",
    },
    zh: {
      title: "分析与洞察",
      subtitle: "追踪您的租赁保护历程",
      back: "返回",
      timeRange: "时间范围",
      last1Month: "上个月",
      last3Months: "最近3个月",
      last6Months: "最近6个月",
      lastYear: "去年",
      allTime: "所有时间",
      totalProtected: "总保护金额",
      totalDeposits: "总押金",
      activeCases: "活跃案件",
      avgReturnTime: "平均退还时间",
      days: "天",
      documentsStored: "存储的文档",
      files: "文件",
      depositTrend: "押金追踪趋势",
      caseSuccessRate: "案件成功率",
      documentGrowth: "文档上传增长",
      monthlyActivity: "月度活动",
      casesByType: "按类型的案件",
      casesByStatus: "按状态的案件",
      depositsByStatus: "按状态的押金",
      keyMetrics: "关键指标",
      successRate: "成功率",
      resolved: "已解决",
      avgResolutionTime: "平均解决时间",
      totalRecovered: "总回收金额",
      protectionScore: "保护分数",
      noDataYet: "数据还不够",
      uploadMore: "上传更多文档并追踪押金以查看洞察",
      exportReport: "导出PDF报告",
      exportJson: "导出JSON",
      exporting: "导出中...",
      deposits: "押金",
      leases: "租约",
      cases: "案件",
      tracking: "追踪中",
      returned: "已退还",
      dispute: "争议",
      deposit: "押金",
      early_termination: "提前终止",
      damages: "损害",
      other: "其他",
      intake: "接收",
      active: "活跃",
      closed: "已关闭",
      month: "月",
      achievements: "成就",
      firstLease: "上传第一份租约",
      firstDeposit: "开始押金追踪",
      firstCase: "开启第一个案件",
      documentCollector: "文档收集者",
      proactiveUser: "主动用户",
      upcomingDeadlines: "即将到来的截止日期",
      riskInsights: "风险洞察",
      next30Days: "未来30天",
      depositReturns: "押金退还",
      leaseNotices: "租约通知",
      maintenanceActive: "活跃维护",
      requests: "请求",
      noUpcoming: "没有即将到来的截止日期",
      allOnTrack: "您一切顺利！",
      refreshed: "刷新成功",
      exportSuccess: "报告导出成功",
      exportFailed: "导出失败",
      highRiskDeposits: "高风险押金",
      overdueReturns: "逾期退还",
      urgentCases: "紧急案件",
      riskFactors: "风险因素",
      dueIn: "到期于",
      overdue: "逾期",
    },
    ja: {
      title: "分析とインサイト",
      subtitle: "賃貸保護の旅を追跡",
      back: "戻る",
      timeRange: "時間範囲",
      last1Month: "先月",
      last3Months: "過去3ヶ月",
      last6Months: "過去6ヶ月",
      lastYear: "昨年",
      allTime: "全期間",
      totalProtected: "総保護額",
      totalDeposits: "総敷金",
      activeCases: "アクティブケース",
      avgReturnTime: "平均返還時間",
      days: "日",
      documentsStored: "保存されたドキュメント",
      files: "ファイル",
      depositTrend: "敷金追跡トレンド",
      caseSuccessRate: "ケース成功率",
      documentGrowth: "ドキュメントアップロード成長",
      monthlyActivity: "月間アクティビティ",
      casesByType: "タイプ別ケース",
      casesByStatus: "ステータス別ケース",
      depositsByStatus: "ステータス別敷金",
      keyMetrics: "主要指標",
      successRate: "成功率",
      resolved: "解決済み",
      avgResolutionTime: "平均解決時間",
      totalRecovered: "総回収額",
      protectionScore: "保護スコア",
      noDataYet: "まだ十分なデータがありません",
      uploadMore: "より多くのドキュメントをアップロードし、敷金を追跡してインサイトを確認",
      exportReport: "PDFレポートを輸出",
      exportJson: "JSONを輸出",
      exporting: "輸出中...",
      deposits: "敷金",
      leases: "賃貸契約",
      cases: "ケース",
      tracking: "追跡中",
      returned: "返還済み",
      dispute: "紛争",
      deposit: "敷金",
      early_termination: "早期終了",
      damages: "損害",
      other: "その他",
      intake: "受付",
      active: "アクティブ",
      closed: "クローズ",
      month: "月",
      achievements: "実績",
      firstLease: "最初の賃貸契約をアップロード",
      firstDeposit: "敷金追跡を開始",
      firstCase: "最初のケースを開設",
      documentCollector: "ドキュメント収集家",
      proactiveUser: "プロアクティブユーザー",
      upcomingDeadlines: "今後の期限",
      riskInsights: "リスクインサイト",
      next30Days: "今後30日",
      depositReturns: "敷金返還",
      leaseNotices: "賃貸契約通知",
      maintenanceActive: "アクティブメンテナンス",
      requests: "リクエスト",
      noUpcoming: "今後の期限はありません",
      allOnTrack: "順調です！",
      refreshed: "更新成功",
      exportSuccess: "レポート輸出成功",
      exportFailed: "輸出失敗",
      highRiskDeposits: "高リスク敷金",
      overdueReturns: "期限超過返還",
      urgentCases: "緊急ケース",
      riskFactors: "リスク要因",
      dueIn: "期日まで",
      overdue: "期限超過",
    },
    ko: {
      title: "분석 및 인사이트",
      subtitle: "임대 보호 여정 추적",
      back: "뒤로",
      timeRange: "시간 범위",
      last1Month: "지난 달",
      last3Months: "최근 3개월",
      last6Months: "최근 6개월",
      lastYear: "작년",
      allTime: "전체 기간",
      totalProtected: "총 보호 금액",
      totalDeposits: "총 보증금",
      activeCases: "활성 사례",
      avgReturnTime: "평균 반환 시간",
      days: "일",
      documentsStored: "저장된 문서",
      files: "파일",
      depositTrend: "보증금 추적 추세",
      caseSuccessRate: "사례 성공률",
      documentGrowth: "문서 업로드 증가",
      monthlyActivity: "월간 활동",
      casesByType: "유형별 사례",
      casesByStatus: "상태별 사례",
      depositsByStatus: "상태별 보증금",
      keyMetrics: "주요 지표",
      successRate: "성공률",
      resolved: "해결됨",
      avgResolutionTime: "평균 해결 시간",
      totalRecovered: "총 회수 금액",
      protectionScore: "보호 점수",
      noDataYet: "아직 충분한 데이터가 없음",
      uploadMore: "더 많은 문서를 업로드하고 보증금을 추적하여 인사이트 확인",
      exportReport: "PDF 보고서 내보내기",
      exportJson: "JSON 내보내기",
      exporting: "내보내는 중...",
      deposits: "보증금",
      leases: "임대 계약",
      cases: "사례",
      tracking: "추적 중",
      returned: "반환됨",
      dispute: "분쟁",
      deposit: "보증금",
      early_termination: "조기 종료",
      damages: "손해",
      other: "기타",
      intake: "접수",
      active: "활성",
      closed: "종료",
      month: "월",
      achievements: "성과",
      firstLease: "첫 임대 계약 업로드",
      firstDeposit: "보증금 추적 시작",
      firstCase: "첫 사례 개설",
      documentCollector: "문서 수집가",
      proactiveUser: "능동적 사용자",
      upcomingDeadlines: "다가오는 마감일",
      riskInsights: "위험 인사이트",
      next30Days: "향후 30일",
      depositReturns: "보증금 반환",
      leaseNotices: "임대 통지",
      maintenanceActive: "활성 유지보수",
      requests: "요청",
      noUpcoming: "다가오는 마감일 없음",
      allOnTrack: "모두 순조롭습니다！",
      refreshed: "새로고침 성공",
      exportSuccess: "보고서 내보내기 성공",
      exportFailed: "내보내기 실패",
      highRiskDeposits: "고위험 보증금",
      overdueReturns: "연체 반환",
      urgentCases: "긴급 사례",
      riskFactors: "위험 요인",
      dueIn: "만기까지",
      overdue: "연체",
    }
  };

  const strings = t[language] || t.en;

  const handleRefresh = async () => {
    haptic.light();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['deposits'] }),
      queryClient.invalidateQueries({ queryKey: ['cases'] }),
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
      queryClient.invalidateQueries({ queryKey: ['leases'] }),
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    ]);
    toast.success(strings.refreshed);
  };

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
      default: return new Date('2020-01-01');
    }
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

  // Upcoming deadlines in next 30 days
  const getUpcomingDeadlines = () => {
    const now = new Date();
    const next30Days = addDays(now, 30);
    
    const upcomingDeposits = deposits.filter(d => {
      if (!d.expected_return_date || d.status !== 'tracking') return false;
      const returnDate = new Date(d.expected_return_date);
      return returnDate >= now && returnDate <= next30Days;
    }).map(d => ({
      type: 'deposit',
      date: new Date(d.expected_return_date),
      title: `${strings.depositReturns}: ฿${d.deposit_amount.toLocaleString()}`,
      property: d.property_address,
      daysUntil: differenceInDays(new Date(d.expected_return_date), now)
    }));

    const upcomingNotices = leases.filter(l => {
      if (!l.notice_deadline || !l.notice_alerts_enabled) return false;
      const noticeDate = new Date(l.notice_deadline);
      return noticeDate >= now && noticeDate <= next30Days;
    }).map(l => ({
      type: 'notice',
      date: new Date(l.notice_deadline),
      title: strings.leaseNotices,
      property: l.property_address,
      daysUntil: differenceInDays(new Date(l.notice_deadline), now)
    }));

    return [...upcomingDeposits, ...upcomingNotices].sort((a, b) => a.date - b.date);
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  // Risk insights
  const getRiskInsights = () => {
    const now = new Date();
    const risks = [];

    // Overdue deposits
    const overdueDeposits = deposits.filter(d => {
      if (!d.expected_return_date || d.status !== 'tracking') return false;
      return differenceInDays(new Date(d.expected_return_date), now) < 0;
    });
    
    if (overdueDeposits.length > 0) {
      risks.push({
        severity: 'high',
        title: strings.overdueReturns,
        count: overdueDeposits.length,
        icon: AlertTriangle,
        color: '#EF4444'
      });
    }

    // Deposits due soon (within 7 days)
    const urgentDeposits = deposits.filter(d => {
      if (!d.expected_return_date || d.status !== 'tracking') return false;
      const daysUntil = differenceInDays(new Date(d.expected_return_date), now);
      return daysUntil >= 0 && daysUntil <= 7;
    });

    if (urgentDeposits.length > 0) {
      risks.push({
        severity: 'medium',
        title: strings.highRiskDeposits,
        count: urgentDeposits.length,
        icon: Shield,
        color: '#F59E0B'
      });
    }

    // Urgent cases
    const urgentCases = cases.filter(c => 
      c.status !== 'closed' && c.flags?.urgent
    );

    if (urgentCases.length > 0) {
      risks.push({
        severity: 'medium',
        title: strings.urgentCases,
        count: urgentCases.length,
        icon: Zap,
        color: '#8B5CF6'
      });
    }

    return risks;
  };

  const riskInsights = getRiskInsights();

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

  const handleExportPdf = async () => {
    haptic.medium();
    setExportingPdf(true);
    try {
      const response = await base44.functions.invoke('generateDataReport');
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LeaseShield_Analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      haptic.success();
      toast.success(strings.exportSuccess);
    } catch (error) {
      console.error('Export failed:', error);
      haptic.error();
      toast.error(strings.exportFailed);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportJson = () => {
    haptic.light();
    const report = {
      generated_at: new Date().toISOString(),
      user: user?.email,
      time_range: timeRange,
      summary: {
        total_deposits: deposits.length,
        total_deposit_value: totalDepositValue,
        active_cases: activeCasesCount,
        success_rate: successRate,
        total_recovered: totalRecovered,
        documents_stored: documents.length,
        avg_return_time: avgReturnTime,
        avg_resolution_time: avgResolutionTime
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
      })),
      monthly_data: monthlyData,
      risk_insights: riskInsights,
      upcoming_deadlines: upcomingDeadlines
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
    toast.success(strings.exportSuccess);
  };

  const hasData = deposits.length > 0 || cases.length > 0 || documents.length > 0;
  const activeMaintenanceCount = maintenanceRequests.filter(r => r.status !== 'completed' && r.status !== 'rejected').length;

  return (
    <PullToRefresh onRefresh={handleRefresh} colors={colors}>
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              haptic.light();
              navigate(createPageUrl("Dashboard"));
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.back}
          </Button>

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
                onClick={handleExportPdf}
                disabled={!hasData || exportingPdf}
              >
                {exportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.exporting}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {strings.exportReport}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                disabled={!hasData}
              >
                <Download className="w-4 h-4 mr-2" />
                {strings.exportJson}
              </Button>
            </div>
          </div>

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
                onClick={() => {
                  haptic.light();
                  setTimeRange(range.key);
                }}
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
              {/* Risk Insights & Upcoming Deadlines */}
              {(riskInsights.length > 0 || upcomingDeadlines.length > 0) && (
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  {riskInsights.length > 0 && (
                    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: colors.textPrimary }}>
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          {strings.riskInsights}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {riskInsights.map((risk, idx) => {
                            const Icon = risk.icon;
                            return (
                              <div
                                key={idx}
                                className="p-4 rounded-lg border-2"
                                style={{
                                  backgroundColor: isDarkMode ? `${risk.color}10` : `${risk.color}08`,
                                  borderColor: risk.color
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: risk.color }}
                                  >
                                    <Icon className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                                      {risk.title}
                                    </p>
                                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                                      {risk.count} {risk.count === 1 ? 'item' : 'items'}
                                    </p>
                                  </div>
                                  <Badge
                                    className="font-bold"
                                    style={{
                                      backgroundColor: risk.color,
                                      color: '#FFFFFF'
                                    }}
                                  >
                                    {risk.count}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg" style={{ color: colors.textPrimary }}>
                        <Calendar className="w-5 h-5 text-ls-forest" />
                        {strings.upcomingDeadlines}
                      </CardTitle>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {strings.next30Days}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {upcomingDeadlines.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle2 className="w-12 h-12 mx-auto mb-2" style={{ color: '#10B981', opacity: 0.5 }} />
                          <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                            {strings.noUpcoming}
                          </p>
                          <p className="text-xs" style={{ color: colors.textSecondary }}>
                            {strings.allOnTrack}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {upcomingDeadlines.map((deadline, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border"
                              style={{
                                backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                                borderColor: deadline.daysUntil <= 7 ? '#F59E0B' : colors.borderColor
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-bold text-sm mb-1" style={{ color: colors.textPrimary }}>
                                    {deadline.title}
                                  </p>
                                  {deadline.property && (
                                    <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                                      {deadline.property}
                                    </p>
                                  )}
                                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                                    {format(deadline.date, 'MMM d, yyyy')}
                                  </p>
                                </div>
                                <Badge
                                  className="text-xs font-bold whitespace-nowrap"
                                  style={{
                                    backgroundColor: deadline.daysUntil <= 7 ? '#F59E0B' : '#3B82F6',
                                    color: '#FFFFFF'
                                  }}
                                >
                                  {deadline.daysUntil} {strings.days}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

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
    </PullToRefresh>
  );
}

export default function Analytics() {
  return (
    <ToastProvider>
      <AnalyticsContent />
    </ToastProvider>
  );
}
