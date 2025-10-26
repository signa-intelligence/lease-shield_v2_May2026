import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, AlertCircle, Clock, CheckCircle2, UserCheck, Plus, Zap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useFeatureAccess } from "../components/shared/FeatureGate";

const STATUS_CONFIG = {
  intake: { label: 'Intake', color: 'bg-slate-100 text-slate-800', icon: Clock },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800', icon: Scale },
  waiting: { label: 'Waiting', color: 'bg-purple-100 text-purple-800', icon: Clock },
  user_action: { label: 'Action Required', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  closed: { label: 'Closed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 }
};

export default function ResolveCase() {
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

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.intake;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Scale className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Resolve</h1>
            </div>
            <p className="text-slate-600">Dispute resolution & cases</p>
          </div>
          
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Button>
        </div>

        {/* Premium Features Banner */}
        {(hasPriorityQueue || hasMemberPrice) && (
          <Card className="mb-6 border-none shadow-lg bg-gradient-to-r from-purple-500 to-purple-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-10 h-10" />
                <div className="flex-1">
                  <h3 className="font-bold mb-1">Premium Benefits Active</h3>
                  <div className="flex gap-3 text-xs text-purple-100">
                    {hasMemberPrice && <span>• Member pricing</span>}
                    {hasPriorityQueue && <span>• Priority handling</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {cases.length === 0 ? (
          <Card className="border-none shadow-xl">
            <CardContent className="p-12 text-center">
              <Scale className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Cases Yet</h3>
              <p className="text-slate-600 mb-6">
                Need help with a dispute? We're here to support you.
              </p>
              {hasMemberPrice && (
                <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-200">
                  <p className="text-sm text-emerald-800 font-medium">
                    ✓ You get reduced success fees on all cases
                  </p>
                </div>
              )}
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Open Your First Case
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cases.map((caseItem) => {
              const statusConfig = getStatusConfig(caseItem.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={caseItem.id} className="border-none shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Scale className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold text-slate-900">
                            Case #{caseItem.id.slice(0, 8)}
                          </h3>
                          <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {format(new Date(caseItem.created_date), 'MMM d, yyyy')}
                        </p>
                        {caseItem.dispute_amount && (
                          <p className="text-lg font-bold text-slate-900 mb-2">
                            ฿{caseItem.dispute_amount.toLocaleString()}
                          </p>
                        )}
                        <div className="flex gap-2 flex-wrap mb-3">
                          {caseItem.fast_track && hasPriorityQueue && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              Fast Track
                            </Badge>
                          )}
                          {caseItem.is_member_at_creation && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              Member Rate
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {caseItem.status === 'user_action' && (
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                        Take Action
                      </Button>
                    )}
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