import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { createPageUrl } from '@/utils';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';
      
      const params = new URLSearchParams(window.location.search);
      const scanId = params.get('scanId');
      const path = window.location.pathname + window.location.search;
      const diagnostics = JSON.stringify({ path, scanId, error: this.state.error?.toString(), stack: this.state.errorInfo?.componentStack }, null, 2);

      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F9FAFB' }}>
          <div className="max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              The app encountered an error. Please try reloading or return home.
            </p>
            <div className="mb-4 text-left bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-700"><strong>Path:</strong> {path}</p>
              {scanId && <p className="text-xs text-gray-700"><strong>Scan ID:</strong> {scanId}</p>}
            </div>
            {this.state.error && (
              <div className="mb-4 flex justify-center">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(diagnostics)}>
                  Copy diagnostics
                </Button>
              </div>
            )}
            {isDev && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-xs font-mono text-red-800 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs font-semibold text-red-700 cursor-pointer">Stack trace</summary>
                    <pre className="text-xs text-red-700 mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;