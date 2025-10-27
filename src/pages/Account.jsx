import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Globe, Shield, LogOut, Save, Crown, Settings, CheckCircle2, Bell, Zap } from "lucide-react";
import { PlanBadge } from "../components/shared/FeatureGate";
import NotificationSettings from "../components/settings/NotificationSettings";

const PLAN_DETAILS = [
  {
    key: 'lite',
    label: 'Lite',
    price: '฿390',
    priceNum: 390,
    priceId: 'price_1SM6qtQwoI6NhlUxgDDy2LuJ',
    interval: '/month',
    benefits: [
      'Full AI Lease Reports',
      'Risk Score Analysis',
      'Email Alerts',
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
    benefits: [
      'Everything in Lite',
      'Deposit Shield Tracker',
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
    benefits: [
      'Everything in Protect',
      'Priority Case Queue',
      'Priority AI Scanning',
      'Advanced Reminders',
      'Expanded Storage',
      'Premium Support'
    ],
    bgColor: '#1A1D1F',
    icon: Crown
  }
];

export default function Account() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    country: user?.country || '',
    language: user?.language || 'en'
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
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

  const currentPlanTier = user?.plan_tier || 'free';
  const isFree = currentPlanTier === 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-7 h-7 text-ls-forest" />
            <h1 className="text-2xl md:text-3xl font-bold text-ls-charcoal">My Account</h1>
          </div>
          <p className="text-slate-600">Manage your profile and subscription</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 border-none shadow-xl">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                {!isEditing && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="border-ls-forest text-ls-forest hover:bg-ls-forest hover:text-white">
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-ls-stone rounded-lg">
                    <User className="w-5 h-5 text-ls-forest" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Full Name</p>
                      <p className="font-semibold text-ls-charcoal">{user?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-ls-stone rounded-lg">
                    <Mail className="w-5 h-5 text-ls-forest" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-semibold text-ls-charcoal">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-ls-stone rounded-lg">
                    <Phone className="w-5 h-5 text-ls-forest" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-semibold text-ls-charcoal">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-ls-stone rounded-lg">
                    <Globe className="w-5 h-5 text-ls-forest" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Language</p>
                      <p className="font-semibold text-ls-charcoal">
                        {user?.language === 'th' ? 'ไทย (Thai)' : 'English'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+66 XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      placeholder="Thailand"
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
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
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-ls-forest hover:bg-emerald-900">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="border-ls-charcoal">
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="border-b pb-4">
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
                  <div style={{ padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px', border: '1px solid #FCD34D' }}>
                    <p style={{ fontSize: '14px', color: '#92400E', fontWeight: '600', marginBottom: '8px' }}>
                      Free Plan Includes:
                    </p>
                    <ul style={{ fontSize: '12px', color: '#B45309', lineHeight: '1.5' }}>
                      <li>• 1 Lease Scan</li>
                      <li>• Basic Risk Report</li>
                      <li>• Limited Features</li>
                    </ul>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#DBEAFE', borderRadius: '8px', border: '1px solid #93C5FD' }}>
                    <p style={{ fontSize: '14px', color: '#1E40AF', fontWeight: '600', marginBottom: '4px' }}>
                      🚀 Upgrade to get:
                    </p>
                    <ul style={{ fontSize: '12px', color: '#1E3A8A', lineHeight: '1.5' }}>
                      <li>• Unlimited AI Scans</li>
                      <li>• Deposit Shield Tracker</li>
                      <li>• Automated Reminders</li>
                      <li>• Letter Templates</li>
                      <li>• LINE Notifications</li>
                    </ul>
                  </div>
                  <button 
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'linear-gradient(to right, #C7A338, #d4af37)',
                      color: '#1A1D1F',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                    onMouseEnter={(e) => e.target.style.background = 'linear-gradient(to right, #d4af37, #C7A338)'}
                    onMouseLeave={(e) => e.target.style.background = 'linear-gradient(to right, #C7A338, #d4af37)'}
                  >
                    Upgrade Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      All features active
                    </p>
                  </div>
                  {(currentPlanTier === 'protect' || currentPlanTier === 'secure') && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-800 flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        LINE reminders enabled
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <NotificationSettings 
            user={user} 
            onUpdate={handleNotificationUpdate}
          />
        </div>

        <div id="plans-section" className="mb-6">
          <h2 className="text-2xl font-bold text-ls-charcoal mb-4">Choose Your Plan</h2>
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
                      color: '#1A1D1F',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      padding: '4px 12px',
                      borderBottomLeftRadius: '8px'
                    }}>
                      POPULAR
                    </div>
                  )}
                  
                  {/* Header with plan name and price */}
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
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#FFFFFF' }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: '14px', color: '#FFFFFF', opacity: 0.9 }}>
                        {plan.interval}
                      </span>
                    </div>
                  </div>

                  {/* Benefits list */}
                  <div style={{ padding: '24px' }}>
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
                          color: '#334155'
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
                    
                    {/* Subscribe button */}
                    {isCurrentPlan ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          border: '2px solid #D1D5DB',
                          backgroundColor: '#F3F4F6',
                          color: '#9CA3AF',
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
                        {subscribing ? 'Processing...' : `Subscribe to ${plan.label}`}
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