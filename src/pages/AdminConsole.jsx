import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Users, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminConsole() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [error, setError] = useState(null);

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
      } else {
        setError('No data returned from seed function');
      }
    } catch (err) {
      console.error('Seed error:', err);
      
      // Extract detailed error info
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Console</h1>
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
              Create demo users with pre-analyzed leases, deposit trackers, and case data for testing.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="bg-blue-600 hover:bg-blue-700"
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
                    <p>✓ {seedResult.results?.users_created || 0} demo users created</p>
                    <p>✓ {seedResult.results?.leases_created || 0} leases with AI analysis</p>
                    <p>✓ {seedResult.results?.deposits_created || 0} deposit trackers</p>
                    <p>✓ {seedResult.results?.scans_created || 0} lease scans completed</p>
                    <p>✓ {seedResult.results?.cases_created || 0} resolve cases</p>
                  </div>
                  {seedResult.demo_credentials && (
                    <div className="mt-3 p-3 bg-white rounded border border-emerald-300">
                      <p className="font-semibold text-xs mb-2">Demo User Credentials:</p>
                      <p className="text-xs">EN: {seedResult.demo_credentials.en.email}</p>
                      <p className="text-xs">TH: {seedResult.demo_credentials.th.email}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
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