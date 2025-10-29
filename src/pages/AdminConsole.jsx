
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Users, AlertCircle, CheckCircle2, Loader2, Crown, Mail, Calendar, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminConsole() {
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const [users, leases, scans, deposits, cases, documents] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Lease.list(),
        base44.entities.LeaseScan.list(),
        base44.entities.DepositTracker.list(),
        base44.entities.Case.list(),
        base44.entities.Document.list()
      ]);
      return {
        total_users: users.length,
        total_leases: leases.length,
        total_scans: scans.length,
        total_deposits: deposits.length,
        total_cases: cases.length,
        total_documents: documents.length,
        active_subscribers: users.filter(u => u.subscription_status === 'active').length
      };
    },
    enabled: !!user && user.role === 'admin'
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user && user.role === 'admin'
  });

  const { data: allLeases = [] } = useQuery({
    queryKey: ['allLeases'],
    queryFn: () => base44.entities.Lease.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const { data: allDeposits = [] } = useQuery({
    queryKey: ['allDeposits'],
    queryFn: () => base44.entities.DepositTracker.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['allDocuments'],
    queryFn: () => base44.entities.Document.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const { data: allCases = [] } = useQuery({
    queryKey: ['allCases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
    enabled: !!user && user.role === 'admin'
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access Denied - Admin Only
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSeedDemo = async () => {
    if (!confirm('This will create demo users, leases, deposits, and cases. Continue?')) {
      return;
    }

    setSeeding(true);
    setError(null);
    setSeedResult(null);

    try {
      const response = await base44.functions.invoke('seedDemoData');
      console.log('Seed response:', response);
      
      if (response.data) {
        setSeedResult(response.data);
        queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        queryClient.invalidateQueries({ queryKey: ['allLeases'] });
        queryClient.invalidateQueries({ queryKey: ['allDeposits'] });
        queryClient.invalidateQueries({ queryKey: ['allDocuments'] });
        queryClient.invalidateQueries({ queryKey: ['allCases'] });
      } else {
        setError('No data returned from seed function');
      }
    } catch (err) {
      console.error('Seed error:', err);
      
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      const errorDetails = err.response?.data?.details || '';
      const errorStep = err.response?.data?.step || '';
      
      setError({
        message: errorMessage,
        details: errorDetails,
        step: errorStep,
        fullError: JSON.stringify(err.response?.data || err, null, 2)
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;
    updateUserMutation.mutate({ userId, data: { role: newRole } });
  };

  const handleUpdateUserPlan = async (userId, newPlan) => {
    if (!confirm(`Change user plan to ${newPlan}?`)) return;
    updateUserMutation.mutate({ 
      userId, 
      data: { 
        plan_tier: newPlan,
        subscription_status: newPlan === 'free' ? 'none' : 'active'
      } 
    });
  };

  const getPlanBadge = (tier) => {
    const configs = {
      free: { label: 'Free', color: 'bg-gray-100 text-gray-700' },
      lite: { label: 'Lite', color: 'bg-blue-100 text-blue-700' },
      protect: { label: 'Protect', color: 'bg-emerald-100 text-emerald-700' },
      secure: { label: 'Secure', color: 'bg-purple-100 text-purple-700' }
    };
    const config = configs[tier] || configs.free;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
      cancelled: { label: 'Cancelled', color: 'bg-amber-100 text-amber-700' },
      none: { label: 'None', color: 'bg-gray-100 text-gray-700' }
    };
    const config = configs[status] || configs.none;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold text-ls-charcoal">Admin Console</h1>
          </div>
          <p className="text-slate-600">System management and demo data tools</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.total_users || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Active Subscribers</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.active_subscribers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Lease Scans</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.total_scans || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Documents</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.total_documents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Data Seeder */}
        <Card className="border-none shadow-xl mb-6">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Demo Data Seeder
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-600 mb-4">
              Create demo leases, deposit trackers, and cases for testing.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                style={{
                  backgroundColor: seeding ? '#9CA3AF' : '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  cursor: seeding ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  opacity: seeding ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!seeding) e.currentTarget.style.backgroundColor = '#0a2f25';
                }}
                onMouseLeave={(e) => {
                  if (!seeding) e.currentTarget.style.backgroundColor = '#0C3B2E';
                }}
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Seeding Demo Data...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Seed Demo Data
                  </>
                )}
              </button>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">
                    {typeof error === 'string' ? error : error.message}
                  </div>
                  {error.step && (
                    <div className="text-xs mb-2">
                      <strong>Step:</strong> {error.step}
                    </div>
                  )}
                  {error.details && (
                    <details className="text-xs mt-2">
                      <summary className="cursor-pointer font-semibold">Error Details</summary>
                      <pre className="mt-2 p-2 bg-red-100 rounded overflow-x-auto">
                        {error.details}
                      </pre>
                    </details>
                  )}
                  {error.fullError && (
                    <details className="text-xs mt-2">
                      <summary className="cursor-pointer font-semibold">Full Error (Debug)</summary>
                      <pre className="mt-2 p-2 bg-red-100 rounded overflow-x-auto max-h-64">
                        {error.fullError}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {seedResult && (
              <Alert className="mt-4 bg-emerald-50 border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  <div className="font-semibold mb-2">Demo data seeded successfully!</div>
                  <div className="text-sm space-y-1">
                    <p>✓ {seedResult.results?.deposits_created || 0} deposit trackers</p>
                    <p>✓ {seedResult.results?.leases_created || 0} leases with AI analysis</p>
                    <p>✓ {seedResult.results?.scans_created || 0} lease scans completed</p>
                    <p>✓ {seedResult.results?.cases_created || 0} resolve cases</p>
                  </div>
                  {seedResult.demo_credentials?.note && (
                    <div className="mt-3 p-3 bg-white rounded border border-emerald-300">
                      <p className="text-xs text-slate-600">{seedResult.demo_credentials.note}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="border-none shadow-xl mb-6">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPlanBadge(u.plan_tier)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(u.subscription_status)}
                      </TableCell>
                      <TableCell>
                        {u.role === 'admin' ? (
                          <Badge className="bg-purple-100 text-purple-700">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(u.created_date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select 
                            value={u.plan_tier} 
                            onValueChange={(value) => handleUpdateUserPlan(u.id, value)}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="lite">Lite</SelectItem>
                              <SelectItem value="protect">Protect</SelectItem>
                              <SelectItem value="secure">Secure</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {u.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateUserRole(u.id, 'admin')}
                              className="h-8 text-xs"
                            >
                              Make Admin
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {allUsers.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No users found
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Data Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Leases - NOW CLICKABLE */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b">
              <CardTitle>Recent Leases ({allLeases.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allLeases.slice(0, 5).map((lease) => (
                  <button
                    key={lease.id}
                    onClick={() => {
                      // Navigate to UploadScan page (where leases are managed)
                      navigate(createPageUrl("UploadScan"));
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                  >
                    <p className="font-semibold text-sm">{lease.property_address || 'Lease Agreement'}</p>
                    <p className="text-xs text-slate-600">By: {lease.created_by}</p>
                    <p className="text-xs text-slate-500">{format(new Date(lease.created_date), 'MMM d, yyyy')}</p>
                  </button>
                ))}
                {allLeases.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No leases found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents - NOW CLICKABLE */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b">
              <CardTitle>Recent Documents ({allDocuments.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allDocuments.slice(0, 5).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      // Navigate to DocumentVault
                      navigate(createPageUrl("DocumentVault"));
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                  >
                    <p className="font-semibold text-sm">{doc.label || 'Document'}</p>
                    <p className="text-xs text-slate-600">Type: {doc.type}</p>
                    <p className="text-xs text-slate-500">By: {doc.created_by}</p>
                  </button>
                ))}
                {allDocuments.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No documents found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deposits - NOW CLICKABLE */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b">
              <CardTitle>Deposits Tracked ({allDeposits.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allDeposits.slice(0, 5).map((deposit) => (
                  <button
                    key={deposit.id}
                    onClick={() => {
                      // Navigate to DepositTracker
                      navigate(createPageUrl("DepositTracker"));
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                  >
                    <p className="font-semibold text-sm">฿{deposit.deposit_amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-600">{deposit.property_address || 'Property'}</p>
                    <p className="text-xs text-slate-500">Status: {deposit.status}</p>
                  </button>
                ))}
                {allDeposits.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No deposits found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cases - NOW CLICKABLE */}
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b">
              <CardTitle>Active Cases ({allCases.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allCases.slice(0, 5).map((caseItem) => (
                  <button
                    key={caseItem.id}
                    onClick={() => {
                      // Navigate to ResolveCase with case ID
                      navigate(createPageUrl("ResolveCase") + `?caseId=${caseItem.id}`);
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                  >
                    <p className="font-semibold text-sm">Case #{caseItem.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-600">Amount: ฿{caseItem.dispute_amount?.toLocaleString() || 'N/A'}</p>
                    <p className="text-xs text-slate-500">Status: {caseItem.status}</p>
                  </button>
                ))}
                {allCases.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No cases found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
