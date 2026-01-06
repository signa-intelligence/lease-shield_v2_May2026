import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function MissingParams({ forensicData }) {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Missing Parameters</h2>
            <p className="mb-6 text-gray-600">
              Missing scanId. Expected URL: <code className="bg-gray-100 px-2 py-1 rounded">/reportfull?scanId=xxx</code>
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => (window.location.href = '/uploadscan')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scans
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Forensic Debug (Production) */}
        {forensicData && (
          <Card className="border-2 border-orange-300">
            <CardContent className="p-4">
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-auto">
                <div className="mb-2 text-white font-bold">🔍 DIAGNOSTIC INFO</div>
                <div>Current URL: {forensicData.href}</div>
                <div>Pathname: {forensicData.pathname}</div>
                <div>Search: {forensicData.search || '(empty)'}</div>
                <div className="mt-2 text-yellow-400">Parsed scanId: {forensicData.resolved.scanId || '(empty)'}</div>
                <div className="text-yellow-400">Parsed leaseId: {forensicData.resolved.leaseId || '(empty)'}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}