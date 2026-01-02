import React from 'react';
import { base44 } from '@/api/base44Client';

export default class MissedRiskModalBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(){
    return { hasError: true };
  }
  async componentDidCatch(error, info){
    try {
      console.error('[ReportMissedRiskModalError]', {
        leaseId: this.props.leaseId,
        scanId: this.props.scanId,
        message: error?.message,
        stack: error?.stack,
        componentStack: info?.componentStack
      });
      await base44.functions.invoke('logAuditEvent', {
        event: 'ReportMissedRiskModalError',
        meta: {
          leaseId: this.props.leaseId,
          scanId: this.props.scanId,
          message: error?.message,
          stack: (error?.stack || '').slice(0, 500),
          componentStack: (info?.componentStack || '').slice(0, 500)
        }
      });
    } catch(e){
      // swallow
    }
  }
  render(){
    if (this.state.hasError){
      return (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 w-full max-w-sm text-center shadow-xl">
            <p className="font-semibold mb-2">Could not open missed risk form.</p>
            <p className="text-sm text-slate-600 mb-4">Please try again.</p>
            <button onClick={this.props.onClose} className="px-4 py-2 rounded-md text-white" style={{background:'#0C3B2E'}}>Close</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}