import React from 'react';
import { AlertCircle, Copy, RefreshCw, Home } from 'lucide-react';

/**
 * GlobalErrorBoundary - Catches all React errors and window-level errors
 * Renders a full-screen diagnostic panel in production (no silent failures)
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      windowError: null, // For window.onerror / unhandledrejection
    };
    
    this.handleWindowError = this.handleWindowError.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const payload = {
      type: 'react_error',
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      href: typeof window !== 'undefined' ? window.location.href : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      timestamp: new Date().toISOString(),
    };
    
    console.error('[GlobalErrorBoundary] React Error:', payload);
    this.setState({ error, errorInfo });
  }

  componentDidMount() {
    // Attach window-level error handlers
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleWindowError(event) {
    const payload = {
      type: 'window_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      errorStack: event.error?.stack,
      href: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    
    console.error('[GlobalErrorBoundary] Window Error:', payload);
    
    // Only show UI for fatal errors (not already caught by React)
    if (!this.state.hasError) {
      this.setState({
        hasError: true,
        windowError: payload,
      });
    }
  }

  handleUnhandledRejection(event) {
    const payload = {
      type: 'unhandled_rejection',
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      href: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    
    console.error('[GlobalErrorBoundary] Unhandled Rejection:', payload);
    
    // Only show UI for fatal errors (not already caught)
    if (!this.state.hasError) {
      this.setState({
        hasError: true,
        windowError: payload,
      });
    }
  }

  handleCopyDiagnostics = () => {
    const { error, errorInfo, windowError } = this.state;
    
    const diagnostics = {
      type: windowError?.type || 'react_error',
      name: error?.name || windowError?.type,
      message: error?.message || windowError?.message || windowError?.reason,
      stack: error?.stack || windowError?.errorStack || windowError?.stack,
      componentStack: errorInfo?.componentStack,
      filename: windowError?.filename,
      lineno: windowError?.lineno,
      colno: windowError?.colno,
      href: typeof window !== 'undefined' ? window.location.href : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      timestamp: new Date().toISOString(),
    };
    
    navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
    alert('Diagnostics copied to clipboard');
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, windowError } = this.state;
      
      // Determine error details
      const errorName = error?.name || windowError?.type || 'Error';
      const errorMessage = error?.message || windowError?.message || windowError?.reason || 'Unknown error';
      const errorStack = error?.stack || windowError?.errorStack || windowError?.stack || '';
      const componentStack = errorInfo?.componentStack || '';
      const href = typeof window !== 'undefined' ? window.location.href : 'N/A';
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A';
      const timestamp = new Date().toISOString();

      return (
        <div 
          style={{
            minHeight: '100vh',
            backgroundColor: '#1a1a2e',
            color: '#eee',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            overflow: 'auto',
          }}
        >
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <AlertCircle style={{ width: '48px', height: '48px', color: '#ff6b6b' }} />
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#ff6b6b' }}>
                  Application Error
                </h1>
                <p style={{ margin: '4px 0 0 0', color: '#aaa', fontSize: '14px' }}>
                  The app encountered a fatal error. Details below for debugging.
                </p>
              </div>
            </div>

            {/* Error Summary Card */}
            <div 
              style={{
                backgroundColor: '#2d2d44',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                border: '1px solid #ff6b6b33',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Error Name</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '600', color: '#ff6b6b' }}>
                  {errorName}
                </p>
              </div>
              <div>
                <span style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Message</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#eee', wordBreak: 'break-word' }}>
                  {errorMessage}
                </p>
              </div>
            </div>

            {/* Stack Trace */}
            {errorStack && (
              <div 
                style={{
                  backgroundColor: '#1e1e2e',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: '1px solid #333',
                }}
              >
                <span style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Stack Trace</span>
                <pre 
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '11px',
                    color: '#ffa07a',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '200px',
                    overflow: 'auto',
                    fontFamily: 'Monaco, Consolas, monospace',
                  }}
                >
                  {errorStack}
                </pre>
              </div>
            )}

            {/* Component Stack (React-specific) */}
            {componentStack && (
              <div 
                style={{
                  backgroundColor: '#1e1e2e',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                  border: '1px solid #333',
                }}
              >
                <span style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Component Stack</span>
                <pre 
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '11px',
                    color: '#87ceeb',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: '150px',
                    overflow: 'auto',
                    fontFamily: 'Monaco, Consolas, monospace',
                  }}
                >
                  {componentStack}
                </pre>
              </div>
            )}

            {/* Context Info */}
            <div 
              style={{
                backgroundColor: '#2d2d44',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                border: '1px solid #444',
              }}
            >
              <span style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Context</span>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#bbb' }}>
                <p style={{ margin: '4px 0' }}><strong>URL:</strong> {href}</p>
                <p style={{ margin: '4px 0' }}><strong>User Agent:</strong> {userAgent}</p>
                <p style={{ margin: '4px 0' }}><strong>Timestamp:</strong> {timestamp}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleCopyDiagnostics}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: '#4a4a6a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <Copy style={{ width: '16px', height: '16px' }} />
                Copy Diagnostics
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: '#0C3B2E',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Reload App
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: '#aaa',
                  border: '1px solid #555',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <Home style={{ width: '16px', height: '16px' }} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;