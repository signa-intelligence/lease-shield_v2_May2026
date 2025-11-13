import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, Users, TrendingUp, CreditCard, Crown, Shield, 
  Zap, ArrowLeft, Calendar, PieChart, BarChart3, Download,
  Target, Percent, Activity
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from "date-fns";

export default function RevenueAnalytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('6m');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAllUsers');
      return response.data?.users || [];
    },
    enabled: !!user && user.access_level === 'super_admin',
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['allPayments'],
    queryFn: async () => {
      return await base44.asServiceRole.entities.Payment.filter({});
    },
    enabled: !!user && user.access_level === 'super_admin',
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
  };

  const t = {
    en: {
      title: "Revenue Analytics",
      subtitle: "Business metrics and financial insights",
      back: "Back to Admin",
      totalRevenue: "Total Revenue",
      mrr: "Monthly Recurring Revenue",
      arr: "Annual Run Rate",
      avgRevPerUser: "Avg Revenue Per User",
      totalUsers: "Total Users",
      paidUsers: "Paid Users",
      freeUsers: "Free Users",
      conversionRate: "Conversion Rate",
      revenueByTier: "Revenue by Tier",
      usersByTier: "Users by Tier",
      revenueOverTime: "Revenue Over Time",
      newUsersOverTime: "New Users Over Time",
      creditPurchases: "Letter Credit Purchases",
      lifetimeValue: "Lifetime Value",
      churnRate: "Churn Rate",
      recentTransactions: "Recent Transactions",
      exportData: "Export Data",
      last30Days: "Last 30 Days",
      last3Months: "Last 3 Months",
      last6Months: "Last 6 Months",
      last12Months: "Last 12 Months",
      allTime: "All Time",
      subscriptions: "Subscriptions",
      oneTime: "One-Time Payments",
      credits: "Letter Credits",
      free: "Free",
      lite: "Lite",
      protect: "Protect",
      secure: "Secure",
    },
    th: {
      title: "วิเคราะห์รายได้",
      subtitle: "ตัวชี้วัดธุรกิจและข้อมูลทางการเงิน",
      back: "กลับไปที่แอดมิน",
      totalRevenue: "รายได้ทั้งหมด",
      mrr: "รายได้รายเดือนที่เกิดซ้ำ",
      arr: "อัตราการเติบโตรายปี",
      avgRevPerUser: "รายได้เฉลี่ยต่อผู้ใช้",
      totalUsers: "ผู้ใช้ทั้งหมด",
      paidUsers: "ผู้ใช้ที่จ่ายเงิน",
      freeUsers: "ผู้ใช้ฟรี",
      conversionRate: "อัตราการแปลง",
      revenueByTier: "รายได้ตามระดับ",
      usersByTier: "ผู้ใช้ตามระดับ",
      revenueOverTime: "รายได้ตามช่วงเวลา",
      newUsersOverTime: "ผู้ใช้ใหม่ตามช่วงเวลา",
      creditPurchases: "การซื้อเครดิตจดหมาย",
      lifetimeValue: "มูลค่าตลอดชีพ",
      churnRate: "อัตราการหยุดใช้",
      recentTransactions: "ธุรกรรมล่าสุด",
      exportData: "ส่งออกข้อมูล",
      last30Days: "30 วันที่แล้ว",
      last3Months: "3 เดือนที่แล้ว",
      last6Months: "6 เดือนที่แล้ว",
      last12Months: "12 เดือนที่แล้ว",
      allTime: "ตลอดเวลา",
      subscriptions: "การสมัครสมาชิก",
      oneTime: "การชำระครั้งเดียว",
      credits: "เครดิตจดหมาย",
      free: "ฟรี",
      lite: "ไลท์",
      protect: "โปรเทค",
      secure: "ซีเคียว",
    }
  };

  const strings = t[language];

  if (!user || user.access_level !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Card style={{ backgroundColor: colors.cardBg, maxWidth: '400px' }}>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Access Denied
            </h2>
            <p style={{ color: colors.textSecondary }}>
              This page is only accessible to Super Admins.
            </p>
            <Button 
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="mt-4"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics
  const paidUsers = allUsers.filter(u => u.plan_tier && u.plan_tier !== 'free');
  const freeUsers = allUsers.filter(u => !u.plan_tier || u.plan_tier === 'free');
  
  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const subscriptionPayments = paidPayments.filter(p => p.type === 'subscription');
  const creditPayments = paidPayments.filter(p => p.type === 'credits' || p.type === 'addon');
  
  const subscriptionRevenue = subscriptionPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const creditRevenue = creditPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Calculate MRR (Monthly Recurring Revenue)
  const monthlySubscribers = allUsers.filter(u => 
    u.plan_tier && u.plan_tier !== 'free' && u.billing_interval === 'monthly'
  );
  const annualSubscribers = allUsers.filter(u => 
    u.plan_tier && u.plan_tier !== 'free' && u.billing_interval === 'annual'
  );

  const tierPrices = {
    lite: { monthly: 390, annual: 3900 },
    protect: { monthly: 690, annual: 6900 },
    secure: { monthly: 1290, annual: 12900 }
  };

  let mrr = 0;
  monthlySubscribers.forEach(u => {
    if (tierPrices[u.plan_tier]) {
      mrr += tierPrices[u.plan_tier].monthly;
    }
  });
  annualSubscribers.forEach(u => {
    if (tierPrices[u.plan_tier]) {
      mrr += tierPrices[u.plan_tier].annual / 12;
    }
  });

  const arr = mrr * 12;
  const avgRevenuePerUser = paidUsers.length > 0 ? totalRevenue / paidUsers.length : 0;
  const conversionRate = allUsers.length > 0 ? (paidUsers.length / allUsers.length) * 100 : 0;

  // Users by tier
  const tierDistribution = {
    free: freeUsers.length,
    lite: allUsers.filter(u => u.plan_tier === 'lite').length,
    protect: allUsers.filter(u => u.plan_tier === 'protect').length,
    secure: allUsers.filter(u => u.plan_tier === 'secure').length,
  };

  // Revenue by tier
  const revenueByTier = {
    lite: 0,
    protect: 0,
    secure: 0,
  };

  allUsers.forEach(u => {
    if (u.plan_tier && tierPrices[u.plan_tier]) {
      const interval = u.billing_interval || 'monthly';
      revenueByTier[u.plan_tier] += tierPrices[u.plan_tier][interval];
    }
  });

  // Time-based data
  const getTimeRangeMonths = () => {
    switch(timeRange) {
      case '1m': return 1;
      case '3m': return 3;
      case '6m': return 6;
      case '12m': return 12;
      default: return 6;
    }
  };

  const months = getTimeRangeMonths();
  const monthlyData = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const monthRevenue = paidPayments
      .filter(p => {
        const pDate = new Date(p.created_date);
        return pDate >= monthStart && pDate <= monthEnd;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const newUsers = allUsers.filter(u => {
      const uDate = new Date(u.created_date);
      return uDate >= monthStart && uDate <= monthEnd;
    }).length;

    monthlyData.push({
      month: format(monthDate, 'MMM yy'),
      revenue: Math.round(monthRevenue),
      users: newUsers
    });
  }

  // Chart data
  const tierChartData = [
    { name: strings.free, value: tierDistribution.free, color: '#64748b' },
    { name: strings.lite, value: tierDistribution.lite, color: '#0C3B2E' },
    { name: strings.protect, value: tierDistribution.protect, color: '#C7A338' },
    { name: strings.secure, value: tierDistribution.secure, color: '#1A1D1F' },
  ];

  const revenueByTierData = [
    { name: strings.lite, value: revenueByTier.lite, color: '#0C3B2E' },
    { name: strings.protect, value: revenueByTier.protect, color: '#C7A338' },
    { name: strings.secure, value: revenueByTier.secure, color: '#1A1D1F' },
  ].filter(item => item.value > 0);

  // LTV calculation (simple version)
  const avgLifetimeMonths = 12; // Assume 12 months average
  const ltv = avgRevenuePerUser * avgLifetimeMonths;

  // Recent transactions
  const recentTransactions = paidPayments
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 10);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("AdminConsole"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.back}
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <DollarSign className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
            {strings.title}
          </h1>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: '1m', label: strings.last30Days },
            { key: '3m', label: strings.last3Months },
            { key: '6m', label: strings.last6Months },
            { key: '12m', label: strings.last12Months },
          ].map(range => (
            <Button
              key={range.key}
              variant={timeRange === range.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range.key)}
              style={{
                backgroundColor: timeRange === range.key ? '#0C3B2E' : 'transparent',
                color: timeRange === range.key ? '#FFFFFF' : colors.textPrimary,
              }}
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #10B981' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.totalRevenue}
                </p>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                ฿{totalRevenue.toLocaleString()}
              </p>
              <div className="mt-2 text-xs" style={{ color: colors.textSecondary }}>
                <Badge className="bg-emerald-100 text-emerald-800 mr-2">
                  {strings.subscriptions}: ฿{subscriptionRevenue.toLocaleString()}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  {strings.credits}: ฿{creditRevenue.toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #3B82F6' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.mrr}
                </p>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                ฿{Math.round(mrr).toLocaleString()}
              </p>
              <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                {strings.arr}: ฿{Math.round(arr).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #F59E0B' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.avgRevPerUser}
                </p>
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                ฿{Math.round(avgRevenuePerUser).toLocaleString()}
              </p>
              <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                {strings.lifetimeValue}: ฿{Math.round(ltv).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: colors.cardBg, borderLeft: '4px solid #8B5CF6' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.conversionRate}
                </p>
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {conversionRate.toFixed(1)}%
              </p>
              <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                {paidUsers.length} / {allUsers.length} {language === 'th' ? 'ผู้ใช้' : 'users'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.totalUsers}
                </p>
                <Users className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                {allUsers.length}
              </p>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.paidUsers}
                </p>
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {paidUsers.length}
              </p>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.freeUsers}
                </p>
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-3xl font-bold text-slate-600">
                {freeUsers.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Over Time */}
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <BarChart3 className="w-5 h-5" />
                {strings.revenueOverTime}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                  <XAxis dataKey="month" stroke={colors.textSecondary} />
                  <YAxis stroke={colors.textSecondary} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: colors.cardBg, 
                      border: `1px solid ${colors.borderColor}`,
                      color: colors.textPrimary 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* New Users Over Time */}
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Activity className="w-5 h-5" />
                {strings.newUsersOverTime}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                  <XAxis dataKey="month" stroke={colors.textSecondary} />
                  <YAxis stroke={colors.textSecondary} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: colors.cardBg, 
                      border: `1px solid ${colors.borderColor}`,
                      color: colors.textPrimary 
                    }} 
                  />
                  <Bar dataKey="users" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Users by Tier */}
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <PieChart className="w-5 h-5" />
                {strings.usersByTier}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={tierChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, value}) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: colors.cardBg, 
                      border: `1px solid ${colors.borderColor}`,
                      color: colors.textPrimary 
                    }} 
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Tier */}
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <DollarSign className="w-5 h-5" />
                {strings.revenueByTier}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={revenueByTierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, value}) => `${name}: ฿${value.toLocaleString()}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByTierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: colors.cardBg, 
                      border: `1px solid ${colors.borderColor}`,
                      color: colors.textPrimary 
                    }} 
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <CreditCard className="w-5 h-5" />
              {strings.recentTransactions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((payment, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: payment.type === 'subscription' ? '#10B981' : '#3B82F6',
                        color: '#FFFFFF'
                      }}
                    >
                      {payment.type === 'subscription' ? <Crown className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>
                        {payment.type === 'subscription' ? strings.subscriptions : payment.type === 'credits' ? strings.credits : strings.oneTime}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {new Date(payment.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">
                      ฿{payment.amount.toLocaleString()}
                    </p>
                    <Badge className={payment.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}