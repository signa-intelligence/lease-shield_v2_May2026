
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Users, AlertCircle, CheckCircle2, Loader2, Crown, Mail, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
      const [users, leases, deposits, cases] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Lease.list(),
        base44.entities.DepositTracker.list(),
        base44.entities.Case.list()
      ]);
      return {
        total_users: users.length,
        total_leases: leases.length,
        total_deposits: deposits.length,
        total_cases: cases.length,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <p className="text-sm text-slate-600">Total Leases</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.total_leases || 0}</p>
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
              <Button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="bg-ls-forest hover:bg-emerald-900"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding Demo Data...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Seed Demo Data
                  </>
                )}
              </Button>
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

        {/* System Info */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>System Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-600">Deposits Tracked</p>
                <p className="text-xl font-bold text-slate-900">{stats?.total_deposits || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Cases</p>
                <p className="text-xl font-bold text-slate-900">{stats?.total_cases || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Leases Scanned</p>
                <p className="text-xl font-bold text-slate-900">{stats?.total_leases || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-xl font-bold text-slate-900">{stats?.total_users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
