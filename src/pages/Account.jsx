import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Globe, Shield, LogOut, Save, Crown, Settings } from "lucide-react";
import { PlanBadge } from "../components/shared/FeatureGate";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Account</h1>
          </div>
          <p className="text-slate-600">Manage your profile and settings</p>
        </div>

        <div className="space-y-4">
          {/* Profile Card */}
          <Card className="border-none shadow-xl">
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

          {/* Subscription Card */}
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500 mb-2">Current Plan</p>
                  <PlanBadge tier={user?.plan_tier} />
                </div>
                {user?.subscription_status === 'active' && user?.plan_renews_at && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Renews</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {new Date(user.plan_renews_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              {user?.plan_tier === 'free' && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    Upgrade for Full Protection
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Unlock all features, priority support, and unlimited scans
                  </p>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700">
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
    </div>
  );
}