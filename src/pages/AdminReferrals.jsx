import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReferralCard from '@/components/admin/ReferralCard';
import PageHeader from '@/components/shared/PageHeader';
import { createPageUrl } from '@/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminReferrals() {
  const [statusFilter, setStatusFilter] = React.useState('pending_review');
  const [riskFilter, setRiskFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('risk_score_desc');

  // Auth check - admin only
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.access_level === 'admin';

  // Fetch all referrals for analytics
  const { data: allReferrals } = useQuery({
    queryKey: ['allReferrals'],
    queryFn: () => base44.asServiceRole.entities.Referral.list(),
    enabled: isAdmin
  });

  // Fetch filtered referrals
  const { data: referrals, isLoading, refetch } = useQuery({
    queryKey: ['adminReferrals', statusFilter, riskFilter, sortBy],
    queryFn: async () => {
      let filter = {};
      
      if (statusFilter !== 'all') {
        filter.status = statusFilter;
      }
      
      let results = await base44.asServiceRole.entities.Referral.filter(filter);
      
      // Apply risk filter
      if (riskFilter === 'critical') {
        results = results.filter(r => (r.fraud_risk_score || 0) >= 50);
      } else if (riskFilter === 'high') {
        results = results.filter(r => (r.fraud_risk_score || 0) >= 30 && (r.fraud_risk_score || 0) < 50);
      } else if (riskFilter === 'flagged') {
        results = results.filter(r => r.flagged_for_review === true);
      }
      
      // Sort
      if (sortBy === 'risk_score_desc') {
        results.sort((a, b) => (b.fraud_risk_score || 0) - (a.fraud_risk_score || 0));
      } else if (sortBy === 'date_desc') {
        results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      } else if (sortBy === 'credit_desc') {
        results.sort((a, b) => (b.credit_thb || 0) - (a.credit_thb || 0));
      }
      
      return results;
    },
    enabled: isAdmin
  });

  // Calculate analytics
  const analytics = React.useMemo(() => {
    if (!allReferrals) return null;
    
    const converted = allReferrals.filter(r => r.status === 'converted');
    const pending = allReferrals.filter(r => r.status === 'pending_first_payment');
    const pendingReview = allReferrals.filter(r => r.status === 'pending_review');
    const fraudBlocked = allReferrals.filter(r => r.status === 'fraud_blocked');
    const refunded = allReferrals.filter(r => r.status === 'refunded');
    
    return {
      total: allReferrals.length,
      converted: converted.length,
      pending: pending.length,
      pendingReview: pendingReview.length,
      fraudBlocked: fraudBlocked.length,
      refunded: refunded.length,
      totalCreditsIssued: converted.reduce((sum, r) => sum + (r.credit_thb || 0), 0),
      averageRiskScore: allReferrals.length > 0 
        ? Math.round(allReferrals.reduce((sum, r) => sum + (r.fraud_risk_score || 0), 0) / allReferrals.length)
        : 0,
      conversionRate: allReferrals.length > 0
        ? Math.round((converted.length / allReferrals.length) * 100)
        : 0
    };
  }, [allReferrals]);

  const isDarkMode = user?.theme === 'dark';
  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)'
  } : {
    bg: '#F7F6F4',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)'
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Card style={{ backgroundColor: colors.cardBg, maxWidth: '400px' }}>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>Access Denied</h2>
            <p className="mb-4" style={{ color: colors.textSecondary }}>Admin access required to view this page.</p>
            <a href={createPageUrl('Dashboard')} className="text-blue-500 underline">Return to Dashboard</a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Referral Fraud Monitoring"
          subtitle="Monitor and manage referral fraud patterns"
          icon={Shield}
          backRoute={createPageUrl('AdminConsole')}
        />

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Total</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{analytics.total}</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" style={{ color: '#10B981' }} />
                  <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Conversion</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{analytics.conversionRate}%</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                  <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Credits</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>฿{analytics.totalCreditsIssued.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Pending</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{analytics.pendingReview}</p>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4" style={{ color: '#EF4444' }} />
                  <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Blocked</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{analytics.fraudBlocked}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
          <CardHeader>
            <CardTitle style={{ color: colors.textPrimary }}>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: colors.textSecondary }}>Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="pending_first_payment">Pending Payment</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="fraud_blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: colors.textSecondary }}>Risk Level</label>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="critical">Critical (50+)</SelectItem>
                    <SelectItem value="high">High (30-49)</SelectItem>
                    <SelectItem value="flagged">Any Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: colors.textSecondary }}>Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="risk_score_desc">Risk Score (High to Low)</SelectItem>
                    <SelectItem value="date_desc">Date (Newest First)</SelectItem>
                    <SelectItem value="credit_desc">Credit Amount (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : referrals?.length === 0 ? (
            <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: colors.textSecondary }} />
                <p className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>No referrals match filters</p>
                <p style={{ color: colors.textSecondary }}>Try adjusting your filter criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {referrals?.map(referral => (
                <ReferralCard
                  key={referral.id}
                  referral={referral}
                  onUpdate={refetch}
                  colors={colors}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}