import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, AlertCircle, Clock, CheckCircle2, UserCheck, Plus, Zap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useFeatureAccess } from "../components/shared/FeatureGate";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_CONFIG = {
  intake: { label: 'Intake', color: 'bg-slate-100 text-slate-800', icon: Clock },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800', icon: Scale },
  waiting: { label: 'Waiting', color: 'bg-purple-100 text-purple-800', icon: Clock },
  user_action: { label: 'Action Required', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  closed: { label: 'Closed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 }
};

export default function Cases() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Scale className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900">My Cases</h1>
            </div>
            <p className="text-slate-600">Track your dispute cases</p>
          </div>
          
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg" onClick={() => navigate(createPageUrl("ResolveCase"))}>
            <Plus className="w-5 h-5 mr-2" />
            Open New Case
          </Button>
        </div>

        {/* Premium Features Banner */}
        {(hasPriorityQueue || hasMemberPrice) && (
          <Card className="mb-6 border-none shadow-lg bg-gradient-to-r from-purple-500 to-purple-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Premium Case Benefits</h3>
                  <div className="flex gap-3 text-sm text-purple-50">
                    {hasMemberPrice && <span>• Member pricing on success fees</span>}
                    {hasPriorityQueue && <span>• Priority case handling</span>}
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
                Need help with a dispute? Our team is here to support you.
              </p>
              {hasMemberPrice && (
                <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-200">
                  <p className="text-sm text-emerald-800 font-medium">
                    ✓ As a member, you get reduced success fees on all cases
                  </p>
                </div>
              )}
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate(createPageUrl("ResolveCase"))}>
                <Plus className="w-5 h-5 mr-2" />
                Open Your First Case
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {cases.map((caseItem) => {
              const statusConfig = getStatusConfig(caseItem.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={caseItem.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <Scale className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900">
                            Case #{caseItem.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-sm text-slate-500 mt-1">
                            Opened {format(new Date(caseItem.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={`${statusConfig.color} border flex items-center gap-1`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig.label}
                        </Badge>
                        {caseItem.fast_track && hasPriorityQueue && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            <Zap className="w-3 h-3 mr-1" />
                            Fast Track
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      {caseItem.dispute_amount && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Dispute Amount</p>
                          <p className="text-2xl font-bold text-slate-900">
                            ฿{caseItem.dispute_amount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {caseItem.ops_assigned && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Assigned To</p>
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                            <p className="font-semibold text-slate-900">Ops Team</p>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Features</p>
                        <div className="flex gap-2 flex-wrap">
                          {caseItem.fast_track && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              Fast Track
                            </Badge>
                          )}
                          {caseItem.letter_pack && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Letter Pack
                            </Badge>
                          )}
                          {caseItem.is_member_at_creation && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                              Member Rate
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {caseItem.summary && (
                      <div className="p-4 bg-slate-50 rounded-xl mb-4">
                        <p className="text-sm text-slate-700">{caseItem.summary}</p>
                      </div>
                    )}

                    {caseItem.success_fee_rate > 0 && (
                      <div className="p-4 bg-blue-50 rounded-xl mb-4 border border-blue-200">
                        <p className="text-sm text-blue-800">
                          Success fee: <span className="font-bold">{caseItem.success_fee_rate}%</span>
                          {caseItem.is_member_at_creation && hasMemberPrice && (
                            <span className="ml-2 text-emerald-600 font-medium">
                              (Member discount applied ✓)
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1">
                        View Details
                      </Button>
                      {caseItem.status === 'user_action' && (
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                          Take Action
                        </Button>
                      )}
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