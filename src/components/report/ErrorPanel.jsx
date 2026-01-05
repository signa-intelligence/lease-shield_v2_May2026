import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, RefreshCw, ArrowLeft } from "lucide-react";

export default function ErrorPanel({ error, colors }) {
  const handleCopyError = () => {
    const errorText = `
ERROR REPORT
============
Step: ${error.step || 'Unknown'}
Message: ${error.message || 'Unknown error'}
Error Code: ${error.code || 'UNKNOWN'}
Request ID: ${error.requestId || 'N/A'}
Scan ID: ${error.scanId || 'N/A'}
Lease ID: ${error.leaseId || 'N/A'}
Elapsed: ${error.elapsedMs || 0}ms
Stack: ${error.stack || 'No stack trace'}

Debug Data:
${JSON.stringify(error.debugData || {}, null, 2)}
    `.trim();
    
    navigator.clipboard.writeText(errorText);
    alert('Error details copied to clipboard');
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-red-500 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <AlertCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 text-red-900">Report Load Failed</h2>
                <p className="text-red-700 font-semibold mb-1">
                  Step: {error.step || 'Unknown'}
                </p>
                <p className="text-red-600 mb-4">
                  {error.message || 'Unknown error occurred'}
                </p>
              </div>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto mb-4">
              <div className="mb-2 text-white font-bold">🔍 ERROR DIAGNOSTIC</div>
              <div>Request ID: {error.requestId || 'N/A'}</div>
              <div>Error Code: {error.code || 'UNKNOWN'}</div>
              <div>Scan ID: {error.scanId || 'N/A'}</div>
              <div>Lease ID: {error.leaseId || 'N/A'}</div>
              <div>Elapsed: {error.elapsedMs || 0}ms</div>
              {error.stack && (
                <div className="mt-2 text-red-400">
                  <div>Stack Trace:</div>
                  <pre className="text-xs mt-1 whitespace-pre-wrap">{error.stack.substring(0, 500)}</pre>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/uploadscan'}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scans
              </Button>
              <Button
                onClick={handleCopyError}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Error Details
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
                style={{ backgroundColor: '#0C3B2E', color: '#fff' }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}