import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function ReferralCard({ referral, onUpdate, colors, isDarkMode }) {
  const [expanded, setExpanded] = React.useState(false);
  const [reviewNotes, setReviewNotes] = React.useState('');
  const queryClient = useQueryClient();

  const fraudPatterns = React.useMemo(() => {
    try {
      return JSON.parse(referral.fraud_patterns || '[]');
    } catch {
      return [];
    }
  }, [referral.fraud_patterns]);

  const riskScore = referral.fraud_risk_score || 0;

  const getRiskColor = (score) => {
    if (score >= 50) return { bg: '#FEE2E2', text: '#DC2626', label: 'CRITICAL' };
    if (score >= 30) return { bg: '#FED7AA', text: '#EA580C', label: 'HIGH' };
    if (score >= 15) return { bg: '#FEF3C7', text: '#CA8A04', label: 'MEDIUM' };
    return { bg: '#D1FAE5', text: '#059669', label: 'LOW' };
  };

  const riskStyle = getRiskColor(riskScore);

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('approveReferral', {
        referralId: referral.id,
        adminEmail: (await base44.auth.me()).email,
        notes: reviewNotes
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReferrals'] });
      queryClient.invalidateQueries({ queryKey: ['allReferrals'] });
      onUpdate();
      setReviewNotes('');
      alert('✅ Referral approved and credit issued');
    },
    onError: (error) => {
      alert(`❌ Error: ${error.message}`);
    }
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('blockReferral', {
        referralId: referral.id,
        adminEmail: (await base44.auth.me()).email,
        notes: reviewNotes
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReferrals'] });
      queryClient.invalidateQueries({ queryKey: ['allReferrals'] });
      onUpdate();
      setReviewNotes('');
      alert('✅ Referral blocked as fraud');
    },
    onError: (error) => {
      alert(`❌ Error: ${error.message}`);
    }
  });

  return (
    <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
      <CardHeader 
        className="cursor-pointer hover:bg-opacity-80 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div 
            className="px-3 py-1 rounded-lg font-bold text-sm"
            style={{ backgroundColor: riskStyle.bg, color: riskStyle.text }}
          >
            {riskStyle.label} {riskScore}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate" style={{ color: colors.textPrimary }}>
              {referral.referrer_email} → {referral.referred_email}
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              {referral.referred_plan && `${referral.referred_plan} plan • `}
              {new Date(referral.created_date).toLocaleDateString()}
              {referral.credit_thb && ` • ฿${referral.credit_thb}`}
            </p>
          </div>

          <Badge 
            variant={referral.status === 'converted' ? 'default' : 
                    referral.status === 'fraud_blocked' ? 'destructive' : 
                    referral.status === 'pending_review' ? 'secondary' : 'outline'}
          >
            {referral.status.replace(/_/g, ' ')}
          </Badge>

          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Fraud Patterns */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Fraud Patterns Detected ({fraudPatterns.length})
            </h3>
            {fraudPatterns.length === 0 ? (
              <p className="text-sm" style={{ color: colors.textSecondary }}>No fraud patterns detected</p>
            ) : (
              <div className="space-y-2">
                {fraudPatterns.map((pattern, idx) => {
                  const severityColors = {
                    high: { bg: '#FEE2E2', text: '#DC2626' },
                    medium: { bg: '#FED7AA', text: '#EA580C' },
                    low: { bg: '#FEF3C7', text: '#CA8A04' }
                  };
                  const severity = severityColors[pattern.severity] || severityColors.low;

                  return (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: isDarkMode ? '#374151' : '#F9FAFB' }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: severity.bg, color: severity.text }}
                        >
                          {pattern.severity.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm mb-1" style={{ color: colors.textPrimary }}>
                            {pattern.type.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <p className="text-xs" style={{ color: colors.textSecondary }}>
                            {pattern.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Referral Details */}
          <div>
            <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Referral Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold" style={{ color: colors.textSecondary }}>Referral Code:</span>
                <p style={{ color: colors.textPrimary }}>{referral.referral_code}</p>
              </div>
              <div>
                <span className="font-semibold" style={{ color: colors.textSecondary }}>Created:</span>
                <p style={{ color: colors.textPrimary }}>{new Date(referral.created_date).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-semibold" style={{ color: colors.textSecondary }}>Stripe Subscription:</span>
                <p style={{ color: colors.textPrimary }} className="truncate">{referral.stripe_subscription_id || 'N/A'}</p>
              </div>
              <div>
                <span className="font-semibold" style={{ color: colors.textSecondary }}>Converted At:</span>
                <p style={{ color: colors.textPrimary }}>
                  {referral.converted_at ? new Date(referral.converted_at).toLocaleString() : 'Not converted'}
                </p>
              </div>
              {referral.reviewed_by_admin && (
                <>
                  <div>
                    <span className="font-semibold" style={{ color: colors.textSecondary }}>Reviewed By:</span>
                    <p style={{ color: colors.textPrimary }}>{referral.reviewed_by_admin}</p>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: colors.textSecondary }}>Review Date:</span>
                    <p style={{ color: colors.textPrimary }}>{new Date(referral.review_date).toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold" style={{ color: colors.textSecondary }}>Review Notes:</span>
                    <p style={{ color: colors.textPrimary }}>{referral.review_notes}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          {referral.status === 'pending_review' && (
            <div>
              <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>Admin Actions</h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Review notes (required) - Document reason for approval or blocking"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => approveMutation.mutate()}
                    disabled={!reviewNotes || approveMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve & Issue Credit
                  </Button>
                  <Button
                    onClick={() => blockMutation.mutate()}
                    disabled={!reviewNotes || blockMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Block as Fraud
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}