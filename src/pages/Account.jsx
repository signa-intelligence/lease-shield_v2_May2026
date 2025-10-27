
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

const PLAN_DETAILS = [
  {
    key: 'lite',
    label: 'Lite',
    price: '฿390',
    priceNum: 390,
    paymentLink: 'https://buy.stripe.com/YOUR_LITE_LINK',  // Get from Stripe Dashboard
    interval: '/month',
    benefits: [
      'Full AI Lease Reports',
      'Risk Score Analysis',
      'Email Alerts',
      'Basic Letter Templates',
      'Basic Document Storage'
    ],
    color: 'from-blue-500 to-blue-600',
    icon: Zap
  },
  {
    key: 'protect',
    label: 'Protect',
    price: '฿690',
    priceNum: 690,
    paymentLink: 'https://buy.stripe.com/YOUR_PROTECT_LINK',
    interval: '/month',
    benefits: [
      'Everything in Lite',
      'Deposit Shield Tracker',
      'Automated Reminders',
      'Full Letter Templates',
      'Evidence Vault',
      'LINE Notifications'
    ],
    color: 'from-emerald-500 to-emerald-600',
    icon: Shield,
    popular: true
  },
  {
    key: 'secure',
    label: 'Secure',
    price: '฿1,290',
    priceNum: 1290,
    paymentLink: 'https://buy.stripe.com/YOUR_SECURE_LINK',
    interval: '/month',
    benefits: [
      'Everything in Protect',
      'Priority Case Queue',
      'Priority AI Scanning',
      'Advanced Reminders',
      'Expanded Storage',
      'Premium Support'
    ],
    color: 'from-purple-500 to-purple-600',
    icon: Crown
  }
];

export default function Account() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

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

  const handleSubscribe = async (planKey) => {
    const plan = PLAN_DETAILS.find(p => p.key === planKey);
    if (!plan) {
      console.error('Plan not found for key:', planKey);
      alert('Selected plan not found. Please try again.');
      return;
    }

    // Ensure user data is available before proceeding
    if (!user || !user.email) {
      console.error('User email missing for checkout. User:', user);
      alert('Unable to initiate checkout: User email is incomplete. Please log in again.');
      return;
    }

    // Redirect to Stripe Payment Link with prefilled email
    const checkoutUrl = `${plan.paymentLink}?prefilled_email=${encodeURIComponent(user.email)}`;
    window.location.href = checkoutUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Account</h1>
          </div>
          <p className="text-slate-600">Manage your profile and subscription</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Profile Card */}
          <Card className="lg:col-span-2 border-none shadow-xl">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                {!isEditing && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <User className="w-5 h-5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Full Name</p>
                      <p className="font-semibold text-slate-900">{user?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-semibold text-slate-900">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="w-5 h-5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-semibold text-slate-900">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Globe className="w-5 h-5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Language</p>
                      <p className="font-semibold text-slate-900">
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
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Current Plan Summary */}
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <PlanBadge tier={user?.plan_tier} />
                <p className="text-3xl font-bold text-slate-900 mt-3">
                  {user?.plan_tier === 'free' ? 'Free' : 
                   PLAN_DETAILS.find(p => p.key === user?.plan_tier)?.price || '—'}
                </p>
                {user?.subscription_status === 'active' && user?.plan_renews_at && (
                  <p className="text-xs text-slate-500 mt-2">
                    Renews {new Date(user.plan_renews_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {user?.plan_tier !== 'free' && user?.subscription_status === 'active' ? (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      All features active
                    </p>
                  </div>
                  {(user?.plan_tier === 'protect' || user?.plan_tier === 'secure') && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-800 flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        LINE reminders enabled
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Upgrade Now
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Plans */}
        <div id="plans-section" className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLAN_DETAILS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = user?.plan_tier === plan.key;
              
              return (
                <Card 
                  key={plan.key} 
                  className={`border-none shadow-xl relative overflow-hidden ${
                    plan.popular ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      POPULAR
                    </div>
                  )}
                  <CardHeader className={`bg-gradient-to-r ${plan.color} text-white p-6`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-6 h-6" />
                      <CardTitle className="text-xl">{plan.label}</CardTitle>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-sm opacity-90">{plan.interval}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ul className="space-y-3 mb-6">
                      {plan.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrentPlan ? (
                      <Button disabled className="w-full" variant="outline">
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90`}
                        onClick={() => handleSubscribe(plan.key)}
                      >
                        Subscribe to {plan.label}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Logout */}
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
