import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Mail, Shield, Megaphone } from 'lucide-react';

export default function EmailPreferences() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(null);

  // Parse URL parameters for external access
  const urlParams = new URLSearchParams(window.location.search);
  const externalEmail = urlParams.get('email');
  const externalToken = urlParams.get('token');
  const statusParam = urlParams.get('status');
  const typeParam = urlParams.get('type');
  const errorParam = urlParams.get('error');

  useEffect(() => {
    if (statusParam === 'unsubscribed' && typeParam) {
      setStatus({
        type: 'success',
        message: `You have successfully unsubscribed from ${typeParam} emails.`
      });
    } else if (errorParam === 'critical') {
      setStatus({
        type: 'error',
        message: 'Critical notifications (rent, deposit, maintenance) cannot be disabled. These protect your rights.'
      });
    }
  }, [statusParam, typeParam, errorParam]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    enabled: !externalEmail, // Only if not external access
  });

  const [preferences, setPreferences] = useState({
    support_emails: true,
    notification_emails: true,
    marketing_emails: true,
  });

  useEffect(() => {
    if (user?.email_preferences) {
      setPreferences(user.email_preferences);
    }
  }, [user]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs) => {
      await base44.auth.updateMe({ email_preferences: newPrefs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setStatus({ type: 'success', message: 'Your preferences have been updated!' });
    },
    onError: (err) => {
      setStatus({ type: 'error', message: `Error: ${err.message}` });
    },
  });

  const handleToggle = (type) => {
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const isDarkMode = user?.theme === 'dark';
  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
  };

  if (!user && !externalEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ backgroundColor: colors.bg }}>
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>Please Log In</h2>
        <p className="text-center" style={{ color: colors.textSecondary }}>
          You need to be logged in to manage your email preferences.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            Email Preferences
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Manage which emails you receive from Lease Shield
          </p>
        </div>

        {status && (
          <div className={`p-4 rounded-lg mb-6 ${status.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
            <p className={`font-semibold ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {status.message}
            </p>
          </div>
        )}

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle style={{ color: colors.textPrimary }}>
              <Shield className="w-6 h-6 inline mr-2 text-ls-forest" />
              Critical Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="notification-emails" className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                  Rent, Deposit & Maintenance Alerts
                </Label>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  🔒 PROTECTED - These emails help you avoid losing money and protect your rights.
                </p>
              </div>
              <Switch
                id="notification-emails"
                checked={preferences.notification_emails}
                onCheckedChange={() => handleToggle('notification_emails')}
                disabled={true}
                className="opacity-50"
              />
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                ⚠️ Critical notifications cannot be disabled to ensure you never miss important deadlines or lose your deposit.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle style={{ color: colors.textPrimary }}>
              <Mail className="w-6 h-6 inline mr-2 text-blue-600" />
              Support & Transactional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="support-emails" className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                  Support Ticket Updates
                </Label>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Replies from our support team, ticket status updates
                </p>
              </div>
              <Switch
                id="support-emails"
                checked={preferences.support_emails}
                onCheckedChange={() => handleToggle('support_emails')}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader>
            <CardTitle style={{ color: colors.textPrimary }}>
              <Megaphone className="w-6 h-6 inline mr-2 text-purple-600" />
              Marketing & Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="marketing-emails" className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                  Newsletters & Promotions
                </Label>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Feature announcements, tips, special offers
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={preferences.marketing_emails}
                onCheckedChange={() => handleToggle('marketing_emails')}
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave} 
          disabled={updatePreferencesMutation.isPending} 
          className="w-full bg-ls-forest hover:bg-ls-forest/90 h-12 text-base"
        >
          {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>

        <p className="text-xs text-center mt-6" style={{ color: colors.textSecondary }}>
          Having trouble? Contact us at support@leaseshield.asia
        </p>
      </div>
    </div>
  );
}