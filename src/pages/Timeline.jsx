import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Wallet,
  Scale,
  Wrench,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Filter,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3x3,
  TrendingUp
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  differenceInDays,
  parseISO,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay
} from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/shared/PageHeader";
import { FEATURE_COLORS } from "../components/shared/featureTheme";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import EmptyState from "../components/shared/EmptyState";
import ManualLeaseEvents from "../components/timeline/ManualLeaseEvents";

function TimelineContent() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedTypes, setSelectedTypes] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ owner_email: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: deposits = [], isLoading: depositsLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ owner_email: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: maintenance = [], isLoading: maintenanceLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: timelineEvents = [] } = useQuery({
    queryKey: ['timelineEvents'],
    queryFn: async () => {
      // CRITICAL FIX: Explicitly filter by owner_email (don't rely solely on RLS)
      const events = await base44.entities.TimelineEvent.filter({ owner_email: user?.email }, '-created_date');
      
      console.log('[TIMELINE_EVENTS]', {
        count: events.length,
        user: user?.email,
        sampleEvents: events.slice(0, 3).map(e => ({
          id: e.id,
          type: e.event_type,
          owner: e.owner_email
        }))
      });
      
      return events;
    },
    enabled: !!user,
  });

  // DEBUG: Log timeline events
  React.useEffect(() => {
    console.log('[TIMELINE_DEBUG]', {
      totalEvents: timelineEvents.length,
      events: timelineEvents.map(e => ({
        id: e.id,
        type: e.event_type,
        date: e.event_date,
        title: e.title
      }))
    });
  }, [timelineEvents]);

  const isLoading = leasesLoading || depositsLoading || casesLoading || maintenanceLoading;

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#111827' : '#F3F6F5',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#F9FAFB' : '#0F172A',
    textSecondary: isDarkMode ? '#D1D5DB' : '#475569',
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)',
    todayBg: isDarkMode ? '#1E3A5F' : '#EFF6FF',
    selectedBg: isDarkMode ? '#2D1C3A' : '#F5F3FF'
  };

  const t = {
    en: {
      title: "Timeline",
      subtitle: "Your complete rental journey in one place",
      back: "Back",
      today: "Today",
      calendar: "Calendar",
      list: "List",
      upcoming: "Upcoming",
      filters: "Filters",
      allTypes: "All Types",
      leaseEvents: "Lease Events",
      depositEvents: "Deposit Returns",
      rentPayments: "Rent Payments",
      caseEvents: "Cases",
      maintenanceEvents: "Maintenance",
      followups: "Follow-ups",
      noEvents: "No events found",
      noEventsDesc: "Try selecting different filters or date range",
      upcomingDeadlines: "Upcoming Deadlines",
      next30Days: "Next 30 Days",
      noUpcoming: "No upcoming deadlines",
      pastEvents: "Past Events",
      viewDetails: "View Details",
      dueIn: "Due in",
      days: "days",
      overdue: "Overdue",
      day: "day",
      leaseStart: "Lease Starts",
      leaseEnd: "Lease Ends",
      noticeDeadline: "Notice Deadline",
      depositReturn: "Deposit Return",
      caseCreated: "Case Opened",
      maintenanceReported: "Maintenance Reported",
      eventsOn: "Events on",
      rentDue: "Rent Due",
      paid: "Paid"
    },
    th: {
      title: "ไทม์ไลน์",
      subtitle: "การเดินทางการเช่าทั้งหมดของคุณในที่เดียว",
      back: "กลับ",
      today: "วันนี้",
      calendar: "ปฏิทิน",
      list: "รายการ",
      upcoming: "กำลังจะถึง",
      filters: "ตัวกรอง",
      allTypes: "ทุกประเภท",
      leaseEvents: "เหตุการณ์สัญญาเช่า",
      depositEvents: "การคืนเงินมัดจำ",
      rentPayments: "การชำระค่าเช่า",
      caseEvents: "คดี",
      maintenanceEvents: "การซ่อมบำรุง",
      followups: "การติดตาม",
      noEvents: "ไม่พบเหตุการณ์",
      noEventsDesc: "ลองเลือกตัวกรองหรือช่วงวันที่อื่น",
      upcomingDeadlines: "กำหนดเวลาที่กำลังจะถึง",
      next30Days: "30 วันข้างหน้า",
      noUpcoming: "ไม่มีกำหนดเวลาที่กำลังจะถึง",
      pastEvents: "เหตุการณ์ที่ผ่านมา",
      viewDetails: "ดูรายละเอียด",
      dueIn: "เหลืออีก",
      days: "วัน",
      overdue: "เกินกำหนด",
      day: "วัน",
      leaseStart: "สัญญาเช่าเริ่ม",
      leaseEnd: "สัญญาเช่าสิ้นสุด",
      noticeDeadline: "กำหนดแจ้งเจ้าของบ้าน",
      depositReturn: "คืนเงินมัดจำ",
      caseCreated: "เปิดคดี",
      maintenanceReported: "แจ้งซ่อมบำรุง",
      eventsOn: "เหตุการณ์ในวันที่"
    },
    zh: {
      title: "时间轴",
      subtitle: "您完整的租赁历程一览",
      back: "返回",
      today: "今天",
      calendar: "日历",
      list: "列表",
      upcoming: "即将到来",
      filters: "筛选",
      allTypes: "所有类型",
      leaseEvents: "租约事件",
      depositEvents: "押金退还",
      rentPayments: "租金支付",
      caseEvents: "案件",
      maintenanceEvents: "维护",
      followups: "跟进",
      noEvents: "未找到事件",
      noEventsDesc: "尝试选择不同的筛选或日期范围",
      upcomingDeadlines: "即将到来的截止日期",
      next30Days: "未来30天",
      noUpcoming: "没有即将到来的截止日期",
      pastEvents: "过去的事件",
      viewDetails: "查看详情",
      dueIn: "到期时间",
      days: "天",
      overdue: "逾期",
      day: "天",
      leaseStart: "租约开始",
      leaseEnd: "租约结束",
      noticeDeadline: "通知截止日期",
      depositReturn: "押金退还",
      caseCreated: "案件已开启",
      maintenanceReported: "已报告维护",
      eventsOn: "事件发生于"
    },
    ja: {
      title: "タイムライン",
      subtitle: "あなたの完全な賃貸の旅を一箇所で",
      back: "戻る",
      today: "今日",
      calendar: "カレンダー",
      list: "リスト",
      upcoming: "今後",
      filters: "フィルター",
      allTypes: "すべてのタイプ",
      leaseEvents: "賃貸契約イベント",
      depositEvents: "敷金返還",
      rentPayments: "家賃支払い",
      caseEvents: "ケース",
      maintenanceEvents: "メンテナンス",
      followups: "フォローアップ",
      noEvents: "イベントが見つかりません",
      noEventsDesc: "別のフィルターまたは日付範囲を選択してみてください",
      upcomingDeadlines: "今後の期限",
      next30Days: "今後30日",
      noUpcoming: "今後の期限はありません",
      pastEvents: "過去のイベント",
      viewDetails: "詳細を表示",
      dueIn: "期日まで",
      days: "日",
      overdue: "期限超過",
      day: "日",
      leaseStart: "賃貸契約開始",
      leaseEnd: "賃貸契約終了",
      noticeDeadline: "通知期限",
      depositReturn: "敷金返還",
      caseCreated: "ケース開設",
      maintenanceReported: "メンテナンス報告済み",
      eventsOn: "イベント日"
    },
    ko: {
      title: "타임라인",
      subtitle: "한 곳에서 완전한 임대 여정",
      back: "뒤로",
      today: "오늘",
      calendar: "달력",
      list: "목록",
      upcoming: "다가오는",
      filters: "필터",
      allTypes: "모든 유형",
      leaseEvents: "임대 계약 이벤트",
      depositEvents: "보증금 반환",
      rentPayments: "임대료 지불",
      caseEvents: "사례",
      maintenanceEvents: "유지보수",
      followups: "후속 조치",
      noEvents: "이벤트를 찾을 수 없음",
      noEventsDesc: "다른 필터 또는 날짜 범위를 선택해보세요",
      upcomingDeadlines: "다가오는 마감일",
      noUpcoming: "다가오는 마감일 없음",
      pastEvents: "과거 이벤트",
      viewDetails: "세부 정보 보기",
      dueIn: "만기까지",
      days: "일",
      overdue: "기한 초과",
      day: "일",
      leaseStart: "임대 계약 시작",
      leaseEnd: "임대 계약 종료",
      noticeDeadline: "통지 마감일",
      depositReturn: "보증금 반환",
      caseCreated: "사례 개설",
      maintenanceReported: "유지보수 보고됨",
      eventsOn: "이벤트 일자"
    },
    ru: {
      title: "Хронология",
      subtitle: "Вся история аренды в одном месте",
      back: "Назад",
      today: "Сегодня",
      calendar: "Календарь",
      list: "Список",
      upcoming: "Ближайшие",
      filters: "Фильтры",
      allTypes: "Все типы",
      leaseEvents: "События по договору",
      depositEvents: "Возврат депозита",
      rentPayments: "Платежи за аренду",
      caseEvents: "Спорные дела",
      maintenanceEvents: "Обслуживание",
      followups: "Напоминания",
      noEvents: "События не найдены",
      noEventsDesc: "Попробуйте изменить фильтры или диапазон дат",
      upcomingDeadlines: "Ближайшие сроки",
      noUpcoming: "Ближайших сроков нет",
      pastEvents: "Прошлые события",
      viewDetails: "Подробнее",
      dueIn: "Осталось",
      days: "дней",
      overdue: "Просрочено",
      day: "день",
      leaseStart: "Начало договора",
      leaseEnd: "Окончание договора",
      noticeDeadline: "Крайний срок уведомления",
      depositReturn: "Возврат депозита",
      caseCreated: "Дело открыто",
      maintenanceReported: "Сообщено об обслуживании",
      eventsOn: "События",
      next30Days: "Следующие 30 дней"
    }
  };

  const strings = t[language] || t.en;

  const allEvents = useMemo(() => {
    const events = [];
    const now = new Date();

    // Add timeline events from TimelineEvent entity
    timelineEvents.forEach(event => {
      const eventDate = parseISO(event.event_date);
      const isFollowup = event.event_type.includes('followup');
      
      const eventIcon = 
        event.event_type === 'lease_start' || event.event_type === 'lease_end' || event.event_type === 'lease_scanned' || event.event_type === 'notice_deadline' ? FileText :
        event.event_type === 'deposit_due' || event.event_type === 'deposit_return' ? Wallet :
        event.event_type === 'rent_due' ? CalendarIcon :
        event.event_type === 'case_created' || event.event_type === 'case_closed' || event.event_type === 'case_followup_due' ? Scale :
        event.event_type === 'maintenance_reported' || event.event_type === 'maintenance_closed' || event.event_type === 'maintenance_followup_due' ? Wrench :
        FileText;
      
      const eventColor = 
        event.event_type === 'lease_start' ? '#3B82F6' :
        event.event_type === 'lease_end' ? '#EF4444' :
        event.event_type === 'notice_deadline' ? '#F59E0B' :
        event.event_type === 'deposit_due' || event.event_type === 'deposit_return' ? '#C7A338' :
        event.event_type === 'rent_due' ? '#F59E0B' :
        event.event_type === 'lease_scanned' ? '#10B981' :
        event.event_type === 'case_created' || event.event_type === 'case_followup_due' ? '#8B5CF6' :
        event.event_type === 'case_closed' ? '#10B981' :
        event.event_type === 'maintenance_reported' || event.event_type === 'maintenance_followup_due' ? '#F59E0B' :
        event.event_type === 'maintenance_closed' ? '#10B981' :
        '#6B7280';

      const typeMapping = 
        event.event_type.includes('lease') ? 'lease' :
        event.event_type.includes('deposit') ? 'deposit' :
        event.event_type.includes('rent') ? 'rent' :
        event.event_type.includes('case') ? 'case' :
        event.event_type.includes('maintenance') ? 'maintenance' :
        isFollowup ? 'followup' :
        'other';

      events.push({
        id: event.id,
        type: typeMapping,
        subtype: event.event_type,
        title: event.title,
        description: event.description || event.property_address || '',
        date: eventDate,
        icon: eventIcon,
        color: eventColor,
        route: event.source === 'case' && event.source_id 
          ? createPageUrl("CaseDetails") + `?caseId=${event.source_id}`
          : event.source === 'maintenance' && event.source_id
            ? createPageUrl("PropertyTracker") + '#maintenance'
            : event.lease_id 
              ? createPageUrl("UploadScan") + `?leaseId=${event.lease_id}` 
              : createPageUrl("PropertyTracker"),
        isPast: isBefore(eventDate, now),
        needsReview: event.needs_review,
        isEstimated: event.is_estimated,
        isFollowup: isFollowup
      });
    });

    // Generate rent payment events from deposits with rent schedules
    deposits.forEach(deposit => {
      if (deposit.rent_amount && deposit.rent_due_day) {
        // Determine valid rent period boundaries
        const leaseStart = deposit.lease_start_date ? parseISO(deposit.lease_start_date) : null;
        const leaseEnd = deposit.lease_end_date ? parseISO(deposit.lease_end_date) : null;
        
        const currentMonth = startOfMonth(currentDate);
        const threeMonthsAgo = subMonths(currentMonth, 3);
        const twelveMonthsAhead = addMonths(currentMonth, 12);

        // Determine rent generation boundaries
        // If lease dates exist, use them; otherwise use 3 months ago to 12 months ahead
        const startBoundary = leaseStart && isAfter(leaseStart, threeMonthsAgo) ? startOfMonth(leaseStart) : threeMonthsAgo;
        const endBoundary = leaseEnd && isBefore(leaseEnd, twelveMonthsAhead) ? endOfMonth(leaseEnd) : twelveMonthsAhead;

        // Generate recurring rent events within valid period
        for (let month = startBoundary; month <= endBoundary; month = addMonths(month, 1)) {
          const rentDate = new Date(month);
          rentDate.setDate(deposit.rent_due_day);
          rentDate.setHours(12, 0, 0, 0);

          // Skip if rent date is before lease start or after lease end
          if (leaseStart && isBefore(rentDate, leaseStart)) continue;
          if (leaseEnd && isAfter(rentDate, leaseEnd)) continue;

          const rentLabel = language === 'th' 
            ? `ค่าเช่า - ฿${deposit.rent_amount.toLocaleString()}`
            : language === 'zh'
              ? `租金 - ฿${deposit.rent_amount.toLocaleString()}`
              : language === 'ja'
                ? `家賃 - ฿${deposit.rent_amount.toLocaleString()}`
                : language === 'ko'
                  ? `임대료 - ฿${deposit.rent_amount.toLocaleString()}`
                  : language === 'ru'
                    ? `Аренда - ฿${deposit.rent_amount.toLocaleString()}`
                    : `Rent Due - ฿${deposit.rent_amount.toLocaleString()}`;

          const daysUntil = differenceInDays(rentDate, now);
          const isOverdue = daysUntil < 0 && daysUntil > -7; // Only show overdue if within past week

          events.push({
            id: `rent-${deposit.id}-${format(rentDate, 'yyyy-MM')}`,
            type: 'rent',
            subtype: 'rent_due',
            title: rentLabel,
            description: deposit.property_address || '',
            date: rentDate,
            icon: CalendarIcon,
            color: '#C7A338',
            route: createPageUrl("PropertyTracker") + "#rent-schedule",
            isPast: isBefore(rentDate, now),
            urgent: daysUntil <= 7 && daysUntil >= 0,
            isOverdue: isOverdue,
            rentAmount: deposit.rent_amount
          });
        }
      }
    });

    leases.forEach(lease => {
      if (lease.start_date) {
        events.push({
          id: `lease-start-${lease.id}`,
          type: 'lease',
          subtype: 'start',
          title: strings.leaseStart,
          description: lease.property_address || '',
          date: parseISO(lease.start_date),
          icon: FileText,
          color: '#3B82F6',
          route: createPageUrl("UploadScan") + `?leaseId=${lease.id}`,
          isPast: isBefore(parseISO(lease.start_date), now)
        });
      }
      if (lease.end_date) {
        events.push({
          id: `lease-end-${lease.id}`,
          type: 'lease',
          subtype: 'end',
          title: strings.leaseEnd,
          description: lease.property_address || '',
          date: parseISO(lease.end_date),
          icon: FileText,
          color: '#EF4444',
          route: createPageUrl("UploadScan") + `?leaseId=${lease.id}`,
          isPast: isBefore(parseISO(lease.end_date), now)
        });
      }
      if (lease.notice_deadline) {
        events.push({
          id: `lease-notice-${lease.id}`,
          type: 'lease',
          subtype: 'notice',
          title: strings.noticeDeadline,
          description: lease.property_address || '',
          date: parseISO(lease.notice_deadline),
          icon: FileText,
          color: '#F59E0B',
          urgent: differenceInDays(parseISO(lease.notice_deadline), now) <= 7,
          route: createPageUrl("UploadScan") + `?leaseId=${lease.id}`,
          isPast: isBefore(parseISO(lease.notice_deadline), now)
        });
      }
    });

    deposits.forEach(deposit => {
      if (deposit.expected_return_date) {
        const daysUntil = differenceInDays(parseISO(deposit.expected_return_date), now);
        events.push({
          id: `deposit-return-${deposit.id}`,
          type: 'deposit',
          subtype: 'return',
          title: strings.depositReturn,
          description: deposit.property_address || `฿${deposit.deposit_amount?.toLocaleString()}`,
          date: parseISO(deposit.expected_return_date),
          icon: Wallet,
          color: '#C7A338',
          urgent: daysUntil <= 7 && daysUntil >= 0,
          route: createPageUrl("PropertyTracker"),
          isPast: isBefore(parseISO(deposit.expected_return_date), now)
        });
      }
    });

    cases.forEach(caseItem => {
      events.push({
        id: `case-${caseItem.id}`,
        type: 'case',
        subtype: 'created',
        title: strings.caseCreated,
        description: caseItem.case_number || caseItem.summary,
        date: parseISO(caseItem.created_date),
        icon: Scale,
        color: '#8B5CF6',
        route: createPageUrl("CaseDetails") + `?caseId=${caseItem.id}`,
        isPast: true
      });
    });

    maintenance.forEach(req => {
      events.push({
        id: `maintenance-${req.id}`,
            type: 'maintenance',
        subtype: 'reported',
        title: strings.maintenanceReported,
        description: req.issue_title || req.category,
        date: parseISO(req.reported_date || req.created_date),
        icon: Wrench,
        color: '#F59E0B',
        route: createPageUrl("PropertyTracker"),
        isPast: true
      });
    });

    return events.sort((a, b) => a.date - b.date);
  }, [leases, deposits, cases, maintenance, timelineEvents, strings]);

  const filteredEvents = useMemo(() => {
    if (selectedTypes.length === 0) return allEvents;
    return allEvents.filter(event => selectedTypes.includes(event.type));
  }, [allEvents, selectedTypes]);

  const monthEvents = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    return filteredEvents.filter(event =>
      isAfter(event.date, startOfDay(monthStart)) && isBefore(event.date, endOfDay(monthEnd))
    );
  }, [filteredEvents, currentDate]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const upcoming = filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      return eventDate >= now && eventDate <= thirtyDaysFromNow;
    }).slice(0, 10);

    console.log('[TIMELINE_UPCOMING]', {
      total: filteredEvents.length,
      upcoming: upcoming.length,
      filtered: upcoming.map(e => ({ date: e.date, title: e.title }))
    });

    return upcoming;
  }, [filteredEvents]);

  const pastEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter(event => isBefore(event.date, now))
      .reverse()
      .slice(0, 20);
  }, [filteredEvents]);

  const calendarDays = useMemo(() => {
    // Determine the first day of the calendar grid (start of the week of the first day of the month)
    const firstDayOfMonth = startOfMonth(currentDate);
    const startDay = startOfDay(new Date(firstDayOfMonth.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay()))); // Go back to the Sunday of the first week

    // Determine the last day of the calendar grid (end of the week of the last day of the month)
    const lastDayOfMonth = endOfMonth(currentDate);
    const endDay = endOfDay(new Date(lastDayOfMonth.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay())))); // Go forward to the Saturday of the last week

    const days = eachDayOfInterval({ start: startDay, end: endDay });

    return days.map(day => ({
      date: day,
      events: filteredEvents.filter(event => isSameDay(event.date, day)),
      isToday: isSameDay(day, new Date()),
      isCurrentMonth: isSameMonth(day, currentDate)
    }));
  }, [currentDate, filteredEvents]);


  const toggleType = (type) => {
    haptic.light();
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const EventCard = ({ event }) => {
    const Icon = event.icon;
    const now = new Date();
    const daysUntil = differenceInDays(event.date, now);
    const isOverdue = daysUntil < 0 && !event.isPast;
    const isUrgent = daysUntil <= 7 && daysUntil >= 0;
    const isFollowup = event.isFollowup || event.type === 'followup';

    return (
      <div
        className="p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg btn-interaction"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: event.urgent || isUrgent || isOverdue ? event.color : colors.borderColor,
          borderLeftWidth: '6px',
          borderLeftColor: event.color
        }}
        onClick={() => {
          haptic.light();
          navigate(event.route);
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${event.color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: event.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                {event.title}
                {isFollowup && (
                  <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs">
                    {language === 'th' ? 'ติดตาม' : language === 'ru' ? 'Напоминание' : 'Follow-up'}
                  </Badge>
                )}
                {event.needsReview && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    {language === 'th' ? 'ต้องตรวจสอบ' : language === 'ru' ? 'Проверить' : 'Review'}
                  </Badge>
                )}
              </h4>
              {(isOverdue || isUrgent) && (
                <Badge className={isOverdue ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                  {isOverdue
                    ? strings.overdue
                    : `${daysUntil} ${daysUntil === 1 ? strings.day : strings.days}`}
                </Badge>
              )}
            </div>
            <p className="text-xs mb-2 line-clamp-1" style={{ color: colors.textSecondary }}>
              {event.description}
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
              <CalendarIcon className="w-3 h-3" />
              <span>{format(event.date, 'MMM d, yyyy')}</span>
              {!event.isPast && daysUntil > 0 && (
                <span className="text-xs">• {strings.dueIn} {daysUntil} {daysUntil === 1 ? strings.day : strings.days}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getWeekdayLabel = (idx) => {
    const weekdays = {
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      th: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
      zh: ['日', '一', '二', '三', '四', '五', '六'],
      ja: ['日', '月', '火', '水', '木', '金', '土'],
      ko: ['일', '월', '화', '수', '목', '금', '토'],
      ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    };
    return weekdays[language]?.[idx] || weekdays['en'][idx];
  };

  return (
    <div className="min-h-screen p-4 md:p-6 page-transition" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={strings.title}
          subtitle={strings.subtitle}
          icon={CalendarIcon}
          iconColor={FEATURE_COLORS.leases.accent}
          showBack={true}
          backLabel={strings.back}
          onBack={() => navigate(createPageUrl("Dashboard"))}
          colors={colors}
          actions={
            <div className="flex flex-wrap items-center justify-between gap-4 w-full">
              <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: colors.cardBg, border: `2px solid ${colors.borderColor}` }}>
                <button
                  onClick={() => {
                    haptic.light();
                    setViewMode('upcoming');
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 btn-interaction"
                  style={{
                    backgroundColor: viewMode === 'upcoming' ? FEATURE_COLORS.leases.accent : 'transparent',
                    color: viewMode === 'upcoming' ? '#FFFFFF' : colors.textPrimary
                  }}
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">{strings.upcoming}</span>
                </button>
                <button
                  onClick={() => {
                    haptic.light();
                    setViewMode('calendar');
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 btn-interaction"
                  style={{
                    backgroundColor: viewMode === 'calendar' ? FEATURE_COLORS.leases.accent : 'transparent',
                    color: viewMode === 'calendar' ? '#FFFFFF' : colors.textPrimary
                  }}
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="hidden sm:inline">{strings.calendar}</span>
                </button>
                <button
                  onClick={() => {
                    haptic.light();
                    setViewMode('list');
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 btn-interaction"
                  style={{
                    backgroundColor: viewMode === 'list' ? FEATURE_COLORS.leases.accent : 'transparent',
                    color: viewMode === 'list' ? '#FFFFFF' : colors.textPrimary
                  }}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">{strings.list}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTypes([])}
                  className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: selectedTypes.length === 0 ? FEATURE_COLORS.leases.accent : colors.cardBg,
                    color: selectedTypes.length === 0 ? '#FFFFFF' : colors.textPrimary,
                    border: `2px solid ${selectedTypes.length === 0 ? FEATURE_COLORS.leases.accent : colors.borderColor}`
                  }}
                >
                  {strings.allTypes}
                </button>
                {[
                  { key: 'lease', label: strings.leaseEvents, color: FEATURE_COLORS.leases.accent },
                  { key: 'deposit', label: strings.depositEvents, color: FEATURE_COLORS.deposits.accent },
                  { key: 'rent', label: strings.rentPayments, color: '#C7A338' },
                  { key: 'case', label: strings.caseEvents, color: FEATURE_COLORS.cases.accent },
                  { key: 'maintenance', label: strings.maintenanceEvents, color: FEATURE_COLORS.maintenance.accent },
                  { key: 'followup', label: strings.followups, color: '#8B5CF6' }
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => toggleType(key)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: selectedTypes.includes(key) ? color : colors.cardBg,
                      color: selectedTypes.includes(key) ? '#FFFFFF' : colors.textPrimary,
                      border: `2px solid ${selectedTypes.includes(key) ? color : colors.borderColor}`
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        {viewMode === 'upcoming' && (
          <div className="space-y-6">
            {isLoading ? (
              <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
            ) : (
              <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <TrendingUp className="w-5 h-5" style={{ color: FEATURE_COLORS.leases.accent }} />
                    {strings.upcomingDeadlines}
                    <Badge className="bg-blue-100 text-blue-800">{strings.next30Days}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title={strings.noUpcoming}
                      description={strings.noEventsDesc}
                      isDarkMode={isDarkMode}
                      compact={true}
                    />
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {pastEvents.length > 0 && (
              <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <Clock className="w-5 h-5 text-ls-forest" />
                    {strings.pastEvents}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 opacity-70">
                    {pastEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {viewMode === 'calendar' && (
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle style={{ color: colors.textPrimary }}>
                  {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      haptic.light();
                      setCurrentDate(new Date());
                    }}
                    className="btn-interaction"
                  >
                    {strings.today}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      haptic.light();
                      setCurrentDate(subMonths(currentDate, 1));
                    }}
                    className="btn-interaction"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      haptic.light();
                      setCurrentDate(addMonths(currentDate, 1));
                    }}
                    className="btn-interaction"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="text-center text-xs font-bold py-2" style={{ color: colors.textSecondary }}>
                    {getWeekdayLabel(idx)}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((dayData, idx) => {
                  const hasEvents = dayData.events.length > 0;
                  const urgentEvent = dayData.events.find(e => e.urgent || (differenceInDays(e.date, new Date()) <= 7 && differenceInDays(e.date, new Date()) >= 0));

                  return (
                    <div
                      key={idx}
                      className="aspect-square p-2 rounded-lg transition-all cursor-pointer hover:shadow-md"
                      style={{
                        backgroundColor: dayData.isToday
                          ? colors.todayBg
                          : hasEvents
                            ? `${dayData.events[0].color}10`
                            : 'transparent',
                        border: dayData.isToday
                          ? '2px solid #0C3B2E'
                          : urgentEvent
                            ? `2px solid ${urgentEvent.color}`
                            : `1px solid ${colors.borderColor}`,
                        opacity: dayData.isCurrentMonth ? 1 : 0.4
                      }}
                      onClick={(e) => {
                        if (hasEvents) {
                          haptic.light();
                          e.stopPropagation();
                          // Stay in calendar - event details shown in section below
                        }
                      }}
                    >
                      <div className="text-xs font-bold mb-1" style={{ color: colors.textPrimary }}>
                        {format(dayData.date, 'd')}
                      </div>
                      {hasEvents && (
                        <div className="space-y-1">
                          {dayData.events.slice(0, 2).map((event, eventIdx) => (
                            <div
                              key={eventIdx}
                              className="w-full h-1 rounded-full"
                              style={{ backgroundColor: event.color }}
                            />
                          ))}
                          {dayData.events.length > 2 && (
                            <div className="text-[8px] font-bold text-center" style={{ color: colors.textSecondary }}>
                              +{dayData.events.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {monthEvents.length > 0 && (
                <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${colors.borderColor}` }}>
                  <h3 className="font-bold mb-4 text-sm" style={{ color: colors.textPrimary }}>
                    {strings.eventsOn} {format(currentDate, 'MMMM')} ({monthEvents.length})
                  </h3>
                  <div className="space-y-3">
                    {monthEvents.slice(0, 5).map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {viewMode === 'list' && (
          <div className="space-y-6">
            {upcomingEvents.length > 0 && (
              <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <TrendingUp className="w-5 h-5 text-ls-forest" />
                    {strings.upcomingDeadlines}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {pastEvents.length > 0 && (
              <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <Clock className="w-5 h-5 text-ls-forest" />
                    {strings.pastEvents}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 opacity-70">
                    {pastEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
              <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
                <CardContent className="p-0">
                  <EmptyState
                    icon={CalendarIcon}
                    title={strings.noEvents}
                    description={strings.noEventsDesc}
                    isDarkMode={isDarkMode}
                    compact={true}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Timeline() {
  return (
    <AuthGuard>
      <TimelineContent />
    </AuthGuard>
  );
}