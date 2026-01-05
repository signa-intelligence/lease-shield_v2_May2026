import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, RefreshCw, ArrowLeft, FileWarning, RotateCcw } from "lucide-react";

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

  // Categorize error for user-friendly messaging
  const getErrorCategory = () => {
    const code = error.code || '';
    if (code === 'NO_SOURCE_DATA' || code === 'REPORT_NOT_MATERIALIZED') {
      return 'data_missing';
    }
    if (code === 'SCAN_NOT_FOUND' || code === 'LEASE_NOT_FOUND') {
      return 'not_found';
    }
    if (code === 'MATERIALIZE_ERROR' || code === 'MATERIALIZE_FAILED') {
      return 'materialize_failed';
    }
    if (code === 'UNAUTHORIZED') {
      return 'auth';
    }
    return 'unknown';
  };

  const category = getErrorCategory();

  const userMessages = {
    data_missing: {
      title: 'Report Data Missing',
      description: 'The scan completed but the report data could not be generated. This may happen if the lease document was unreadable.',
      action: 'Please try scanning the lease again with a clearer image or PDF.'
    },
    not_found: {
      title: 'Scan Not Found',
      description: 'The requested scan or lease could not be found. It may have been deleted.',
      action: 'Return to your scans and try again.'
    },
    materialize_failed: {
      title: 'Report Generation Failed',
      description: 'We could not generate the report from the available scan data.',
      action: 'Try re-scanning the lease document.'
    },
    auth: {
      title: 'Authentication Required',
      description: 'Your session has expired or you need to log in.',
      action: 'Please log in and try again.'
    },
    unknown: {
      title: 'Report Load Failed',
      description: 'An unexpected error occurred while loading the report.',
      action: 'Please try again or contact support if the issue persists.'
    }
  };

  const msg = userMessages[category];

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: colors?.bg || '#F8FAFC' }}>
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="border-2 border-red-500 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              {category === 'data_missing' ? (
                <FileWarning className="w-12 h-12 text-orange-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2" style={{ color: category === 'data_missing' ? '#C2410C' : '#991B1B' }}>
                  {msg.title}
                </h2>
                <p className="text-gray-700 mb-2">
                  {msg.description}
                </p>
                <p className="text-gray-600 text-sm">
                  {msg.action}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/uploadscan'}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scans
              </Button>
              {(category === 'data_missing' || category === 'materialize_failed') && (
                <Button
                  onClick={() => window.location.href = '/uploadscan'}
                  className="flex-1"
                  style={{ backgroundColor: '#0C3B2E', color: '#fff' }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Re-scan Lease
                </Button>
              )}
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>

            {/* Technical Details (Collapsible) */}
            <details className="cursor-pointer">
              <summary className="text-sm font-semibold text-gray-600 mb-2">Technical Details</summary>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto mt-2">
                <div className="mb-2 text-white font-bold">🔍 ERROR DIAGNOSTIC</div>
                <div>Request ID: {error.requestId || 'N/A'}</div>
                <div>Error Code: {error.code || 'UNKNOWN'}</div>
                <div>Step: {error.step || 'Unknown'}</div>
                <div>Scan ID: {error.scanId || 'N/A'}</div>
                <div>Lease ID: {error.leaseId || 'N/A'}</div>
                <div>Elapsed: {error.elapsedMs || 0}ms</div>
                <div className="mt-2 text-yellow-400">Message: {error.message || 'Unknown'}</div>
                {error.debugData && Object.keys(error.debugData).length > 0 && (
                  <div className="mt-2 text-cyan-400">
                    <div>Debug Data:</div>
                    <pre className="text-xs mt-1 whitespace-pre-wrap">{JSON.stringify(error.debugData, null, 2)}</pre>
                  </div>
                )}
                {error.stack && (
                  <div className="mt-2 text-red-400">
                    <div>Stack Trace:</div>
                    <pre className="text-xs mt-1 whitespace-pre-wrap">{error.stack.substring(0, 500)}</pre>
                  </div>
                )}
              </div>
              <Button
                onClick={handleCopyError}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Error Details
              </Button>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}