import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AcknowledgeMaintenance() {
  const [status, setStatus] = useState('loading'); // loading, success, error, already_acknowledged
  const [message, setMessage] = useState('');

  useEffect(() => {
    const acknowledgeRequest = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing acknowledgment link');
        return;
      }

      try {
        const { data } = await base44.functions.invoke('acknowledgeMaintenance', { token });

        if (data.success) {
          if (data.currentStatus && data.currentStatus !== 'reported') {
            setStatus('already_acknowledged');
            setMessage('This maintenance request has already been acknowledged.');
          } else {
            setStatus('success');
            setMessage('Thank you! The tenant has been notified that you received their maintenance request.');
          }
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to acknowledge request');
        }
      } catch (error) {
        console.error('Acknowledgment error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred. Please contact the tenant directly.');
      }
    };

    acknowledgeRequest();
  }, []);

  const colors = {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b'
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
      <Card className="max-w-md w-full border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Processing...
              </h2>
              <p style={{ color: colors.textSecondary }}>
                Please wait while we process your acknowledgment.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Acknowledged Successfully!
              </h2>
              <p style={{ color: colors.textSecondary }}>
                {message}
              </p>
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
                <p className="text-sm text-emerald-800">
                  You can now close this page. The tenant will be notified that you've received their request.
                </p>
              </div>
            </>
          )}

          {status === 'already_acknowledged' && (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Already Acknowledged
              </h2>
              <p style={{ color: colors.textSecondary }}>
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Unable to Process
              </h2>
              <p style={{ color: colors.textSecondary }}>
                {message}
              </p>
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                <p className="text-sm text-red-800">
                  Please contact the tenant directly if you need to confirm receipt of their maintenance request.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}