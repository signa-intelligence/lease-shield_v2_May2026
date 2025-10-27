import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Database, Users, FileText, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminConsole() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleSeedData = async () => {
    if (!confirm("This will insert demo data into the database. Proceed?")) {
      return;
    }

    setSeeding(true);
    setError(null);
    setSeedResult(null);

    try {
      const response = await base44.functions.invoke('seedDemoData');
      setSeedResult(response.data);
    } catch (err) {
      setError(err.message || "Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Console</h1>
          </div>
          <p className="text-slate-600">Manage demo data and system settings</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {seedResult && (
          <Alert className="mb-6 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              <strong>Demo data seeded successfully!</strong>
              <div className="mt-2 text-sm">
                <p>• Users created: {seedResult.results.users_created}</p>
                <p>• Deposits created: {seedResult.results.deposits_created}</p>
                <p>• Leases scanned: {seedResult.results.leases_created}</p>
                <p>• Scans generated: {seedResult.results.scans_created}</p>
                <p>• Cases opened: {seedResult.results.cases_created}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              Demo Data Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">Seed Demo Data (One Click)</h3>
                <p className="text-sm text-slate-600 mb-4">
                  This will create complete demo data including:
                </p>
                <ul className="text-sm text-slate-600 mb-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>2 demo users (English and Thai)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Deposit trackers with different statuses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Sample leases with AI-powered risk analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Active and pending Resolve cases</span>
                  </li>
                </ul>
                <Button
                  onClick={handleSeedData}
                  disabled={seeding}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Seeding Data...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5 mr-2" />
                      Seed Demo Data
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-bold text-slate-900 mb-2">What Gets Created:</h3>
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 space-y-1">
                  <p>✓ 2 users (1 EN + 1 TH) with active subscriptions</p>
                  <p>✓ 2 deposit trackers (tracking deposits for return reminders)</p>
                  <p>✓ 2 lease agreements (with problematic clauses for testing)</p>
                  <p>✓ 2 AI-generated risk scans (showing how analysis works)</p>
                  <p>✓ 2 Resolve cases (1 active, 1 pending)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}