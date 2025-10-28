
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Globe, Shield, LogOut, Save, Crown, Settings, CheckCircle2, Bell, Zap, Lock, Download, FileText, AlertCircle, Loader2 } from "lucide-react";
import { PlanBadge } from "../components/shared/FeatureGate";
import NotificationSettings from "../components/settings/NotificationSettings";
import { createPageUrl } from "@/utils";

const PLAN_DETAILS = [
  {
    key: 'lite',
    label: 'Lite',
    price: '฿390',
    priceNum: 390,
    priceId: 'price_1SM6qtQwoI6NhlUxgDDy2LuJ',
    interval: '/month',
    tagline: 'Prevention starts here',
    description: 'Essential tools to prevent rental problems before they happen',
    benefits: [
      'Full AI Lease Risk Reports',
      'Risk Score Analysis (RED/AMBER/YELLOW/GREEN)',
      'Email Alerts for Issues',
      'Basic Letter Templates',
      'Basic Document Storage'
    ],
    bgColor: '#0C3B2E',
    icon: Zap
  },
  {
    key: 'protect',
    label: 'Protect',
    price: '฿690',
    priceNum: 690,
    priceId: 'price_1SM6rhQwoI6NhlUxZIN3WekE',
    interval: '/month',
    tagline: 'Complete prevention suite',
    description: 'Everything you need to maintain clear, legal, and evidence-based relationships',
    benefits: [
      'Everything in Lite',
      'Deposit Shield Tracker',
      'Rent Payment Alerts',
      'Maintenance Request Tracker',
      'Automated Reminders',
      'Full Letter Templates',
      'Evidence Vault',
      'LINE Notifications'
    ],
    bgColor: '#C7A338',
    icon: Shield,
    popular: true
  },
  {
    key: 'secure',
    label: 'Secure',
    price: '฿1,290',
    priceNum: 1290,
    priceId: 'price_1SM6t9QwoI6NhlUxy5Pl7Rrq',
    interval: '/month',
    tagline: 'Premium protection',
    description: 'Maximum prevention with priority support and advanced features',
    benefits: [
      'Everything in Protect',
      'Priority Case Queue',
      'Priority AI Scanning',
      'Advanced Reminders',
      'Expanded Storage',
      'Premium Support',
      'Legal Document Archive'
    ],
    bgColor: '#1A1D1F',
    icon: Crown
  }
];

export default function Account() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    language: user?.language || 'en'
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        country: user.country || '',
        language: user.language || 'en'
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleNotificationUpdate = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleSubscribe = async (planKey) => {
    const plan = PLAN_DETAILS.find(p => p.key === planKey);
    if (!plan) return;

    setSubscribing(true);
    try {
      const response = await base44.functions.invoke('createCheckout', {
        priceId: plan.priceId,
        mode: 'subscription'
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportUserData');
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lease_shield_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again or contact support.');
    } finally {
      setExporting(false);
    }
  };

  const currentPlanTier = user?.plan_tier || 'free';
  const isFree = currentPlanTier === 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#0C3B2E',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(12, 59, 46, 0.2)'
            }}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-ls-charcoal">My Account</h1>
              <p className="text-slate-600">Manage your profile and subscription</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Personal Information Card */}
          <Card className="lg:col-span-2 border-none shadow-xl" style={{
            backgroundColor: '#FFFFFF'
          }}>
            <CardHeader className="border-b pb-4" style={{
              backgroundColor: '#ECEFED'
            }}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-ls-forest" />
                  Personal Information
                </CardTitle>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '2px solid #0C3B2E',
                      backgroundColor: '#FFFFFF',
                      color: '#0C3B2E',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#C7A338';
                      e.target.style.borderColor = '#C7A338';
                      e.target.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#FFFFFF';
                      e.target.style.borderColor = '#0C3B2E';
                      e.target.style.color = '#0C3B2E';
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!isEditing ? (
                <div className="space-y-3">
                  {/* Name Display */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#ECEFED',
                    borderRadius: '12px',
                    borderLeft: '4px solid #0C3B2E'
                  }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#0C3B2E',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Full Name</p>
                        <p className="font-bold text-ls-charcoal text-lg">{user?.full_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Email Display */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#ECEFED',
                    borderRadius: '12px',
                    borderLeft: '4px solid #C7A338'
                  }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#C7A338',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Email</p>
                        <p className="font-bold text-ls-charcoal">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Phone Display */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#ECEFED',
                    borderRadius: '12px',
                    borderLeft: '4px solid #0C3B2E'
                  }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#0C3B2E',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Phone</p>
                        <p className="font-bold text-ls-charcoal">{user?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Language Display */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#ECEFED',
                    borderRadius: '12px',
                    borderLeft: '4px solid #1A1D1F'
                  }}>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#1A1D1F',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Language</p>
                        <p className="font-bold text-ls-charcoal">
                          {user?.language === 'th' ? 'ไทย (Thai)' : 'English'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <Label htmlFor="full_name" className="text-sm font-semibold text-ls-charcoal mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-ls-forest" />
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Your full name"
                      style={{
                        border: '2px solid #ECEFED',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Email Display (Read-only) */}
                  <div>
                    <Label className="text-sm font-semibold text-ls-charcoal mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-ls-gold" />
                      Email
                    </Label>
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: '#ECEFED',
                      borderRadius: '8px',
                      border: '2px solid #ECEFED',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span style={{ color: '#1A1D1F', fontSize: '14px' }}>{user?.email}</span>
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '11px',
                        color: '#64748b',
                        fontStyle: 'italic'
                      }}>
                        Cannot be changed
                      </span>
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold text-ls-charcoal mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-ls-forest" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+66 XX XXX XXXX"
                      style={{
                        border: '2px solid #ECEFED',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Country Input */}
                  <div>
                    <Label htmlFor="country" className="text-sm font-semibold text-ls-charcoal mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-ls-forest" />
                      Country
                    </Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      placeholder="Thailand"
                      style={{
                        border: '2px solid #ECEFED',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Language Select */}
                  <div>
                    <Label htmlFor="language" className="text-sm font-semibold text-ls-charcoal mb-2">Language</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="th">ไทย (Thai)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        border: 'none',
                        backgroundColor: '#0C3B2E',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(12, 59, 46, 0.3)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#C7A338';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 8px rgba(199, 163, 56, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#0C3B2E';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px rgba(12, 59, 46, 0.3)';
                      }}
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        border: '2px solid #ECEFED',
                        backgroundColor: '#FFFFFF',
                        color: '#1A1D1F',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#ECEFED';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Current Plan Card */}
          <Card className="border-none shadow-xl overflow-hidden" style={{
            backgroundColor: '#FFFFFF'
          }}>
            <CardHeader className="border-b pb-4" style={{
              backgroundColor: '#ECEFED'
            }}>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-ls-forest" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="mb-3">
                  <PlanBadge tier={currentPlanTier} />
                </div>
                <p className="text-3xl font-bold text-ls-charcoal">
                  {isFree ? 'Free' : PLAN_DETAILS.find(p => p.key === currentPlanTier)?.price || '—'}
                </p>
                {user?.subscription_status === 'active' && user?.plan_renews_at && (
                  <p className="text-xs text-slate-500 mt-2">
                    Renews {new Date(user.plan_renews_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {isFree ? (
                <div className="space-y-3">
                  <div style={{ padding: '12px', backgroundColor: '#ECEFED', borderRadius: '8px', borderLeft: '4px solid #C7A338' }}>
                    <p style={{ fontSize: '14px', color: '#1A1D1F', fontWeight: '600', marginBottom: '8px' }}>
                      Free Plan Includes:
                    </p>
                    <ul style={{ fontSize: '12px', color: '#1A1D1F', lineHeight: '1.5' }}>
                      <li>• 1 Lease Scan</li>
                      <li>• Basic Risk Report</li>
                      <li>• Limited Features</li>
                    </ul>
                  </div>
                  <button 
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#C7A338',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#C7A338'}
                  >
                    Upgrade Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div style={{ padding: '12px', backgroundColor: '#ECEFED', borderRadius: '8px', borderLeft: '4px solid #0C3B2E' }}>
                    <p className="text-sm text-ls-charcoal flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-ls-forest" />
                      All features active
                    </p>
                  </div>
                  {(currentPlanTier === 'protect' || currentPlanTier === 'secure') && (
                    <div style={{ padding: '12px', backgroundColor: '#ECEFED', borderRadius: '8px', borderLeft: '4px solid #C7A338' }}>
                      <p className="text-xs text-ls-charcoal flex items-center gap-1">
                        <Bell className="w-3 h-3 text-ls-gold" />
                        LINE reminders enabled
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Privacy & Rights Section */}
        <Card className="mb-6 border-none shadow-xl">
          <CardHeader className="border-b" style={{ backgroundColor: '#ECEFED' }}>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-ls-forest" />
              Data Privacy & Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Privacy Policy Link */}
              <div style={{
                padding: '16px',
                backgroundColor: '#ECEFED',
                borderRadius: '12px',
                borderLeft: '4px solid #0C3B2E'
              }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#0C3B2E',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-ls-charcoal">Privacy Policy</p>
                      <p className="text-sm text-slate-600">Learn how we protect your data</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(createPageUrl("PrivacyPolicy"), '_blank')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '2px solid #0C3B2E',
                      backgroundColor: '#FFFFFF',
                      color: '#0C3B2E',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#0C3B2E';
                      e.target.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#FFFFFF';
                      e.target.style.color = '#0C3B2E';
                    }}
                  >
                    View Policy
                  </button>
                </div>
              </div>

              {/* Export Data (PDPA Right to Portability) */}
              <div style={{
                padding: '16px',
                backgroundColor: '#ECEFED',
                borderRadius: '12px',
                borderLeft: '4px solid #C7A338'
              }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#C7A338',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Download className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-ls-charcoal">Export My Data</p>
                      <p className="text-sm text-slate-600">Download all your personal data (PDPA compliant)</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={exporting}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '2px solid #C7A338',
                      backgroundColor: exporting ? '#ECEFED' : '#FFFFFF',
                      color: exporting ? '#94a3b8' : '#C7A338',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: exporting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (!exporting) {
                        e.target.style.backgroundColor = '#C7A338';
                        e.target.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!exporting) {
                        e.target.style.backgroundColor = '#FFFFFF';
                        e.target.style.color = '#C7A338';
                      }
                    }}
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Delete Account Notice */}
              <div style={{
                padding: '16px',
                backgroundColor: '#FEE2E2',
                borderRadius: '12px',
                borderLeft: '4px solid #DC2626'
              }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 mb-1">Need to Delete Your Account?</p>
                    <p className="text-sm text-red-800 mb-2">
                      To exercise your right to erasure under PDPA, please contact us at <strong>privacy@leaseshield.asia</strong>
                    </p>
                    <p className="text-xs text-red-700">
                      We will securely delete all your data within 30 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <NotificationSettings 
            user={user} 
            onUpdate={handleNotificationUpdate}
          />
        </div>

        {/* Prevention-First Subscription Positioning Banner */}
        <div style={{
          background: 'linear-gradient(to right, #0C3B2E, #047857)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          <div className="text-center">
            <Shield className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Prevention-First Protection
            </h2>
            <p className="text-white/90 text-lg mb-2">
              Subscription-based protection for your lease, deposit, and documentation
            </p>
            <p className="text-white/80 text-sm max-w-2xl mx-auto">
              Lease Shield helps you maintain clear, legal, and evidence-based leasing relationships. 
              Prevent rental problems before they happen with automated alerts, risk analysis, and professional templates.
            </p>
          </div>
        </div>

        <div id="plans-section" className="mb-6">
          <h2 className="text-2xl font-bold text-ls-charcoal mb-2">Choose Your Protection Level</h2>
          <p className="text-slate-600 mb-6">All plans focus on prevention and maintaining clear records</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PLAN_DETAILS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlanTier === plan.key;
              
              return (
                <div 
                  key={plan.key}
                  style={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    border: plan.popular ? '2px solid #C7A338' : 'none',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  {plan.popular && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: '#C7A338',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '4px 12px',
                      borderBottomLeftRadius: '8px'
                    }}>
                      POPULAR
                    </div>
                  )}
                  
                  <div style={{
                    backgroundColor: plan.bgColor,
                    padding: '24px',
                    color: '#FFFFFF'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Icon style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>
                        {plan.label}
                      </h3>
                    </div>
                    <p style={{ fontSize: '14px', color: '#FFFFFF', opacity: 0.9, marginBottom: '12px' }}>
                      {plan.tagline}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#FFFFFF' }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: '14px', color: '#FFFFFF', opacity: 0.9 }}>
                        {plan.interval}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '24px' }}>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', minHeight: '40px' }}>
                      {plan.description}
                    </p>
                    <ul style={{ 
                      listStyle: 'none', 
                      padding: 0, 
                      margin: '0 0 24px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {plan.benefits.map((benefit, idx) => (
                        <li key={idx} style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '8px',
                          fontSize: '14px',
                          color: '#1A1D1F'
                        }}>
                          <CheckCircle2 style={{ 
                            width: '16px', 
                            height: '16px', 
                            color: '#0C3B2E',
                            flexShrink: 0,
                            marginTop: '2px'
                          }} />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {isCurrentPlan ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          border: '2px solid #ECEFED',
                          backgroundColor: '#ECEFED',
                          color: '#64748b',
                          cursor: 'not-allowed'
                        }}
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.key)}
                        disabled={subscribing}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          border: 'none',
                          backgroundColor: plan.bgColor,
                          color: '#FFFFFF',
                          cursor: subscribing ? 'not-allowed' : 'pointer',
                          opacity: subscribing ? 0.7 : 1,
                          transition: 'opacity 0.2s',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          if (!subscribing) e.target.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          if (!subscribing) e.target.style.opacity = '1';
                        }}
                      >
                        {subscribing ? 'Processing...' : `Start ${plan.label}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
