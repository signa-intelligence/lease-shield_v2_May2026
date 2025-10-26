import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Globe, Shield, LogOut, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
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

  const getPlanColor = (tier) => {
    const colors = {
      free: "bg-gray-100 text-gray-800",
      lite: "bg-blue-100 text-blue-800",
      protect: "bg-emerald-100 text-emerald-800",
      secure: "bg-purple-100 text-purple-800"
    };
    return colors[tier] || colors.free;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          </div>
          <p className="text-slate-600">Manage your account settings</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Info Card */}
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">
                  Personal Information
                </CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    Edit Profile
                  </Button>
                ) : (
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <User className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Full Name</p>
                      <p className="font-semibold text-slate-900">{user?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-semibold text-slate-900">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <Phone className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="font-semibold text-slate-900">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <Globe className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Country</p>
                      <p className="font-semibold text-slate-900">{user?.country || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <Globe className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Language</p>
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
                    <Label htmlFor="language">Preferred Language</Label>
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
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Plan</p>
                  <Badge className={`${getPlanColor(user?.plan_tier)} text-lg px-4 py-2`}>
                    {user?.plan_tier?.toUpperCase()}
                  </Badge>
                </div>
                {user?.subscription_status === 'active' && user?.plan_renews_at && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">Renews On</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(user.plan_renews_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              {user?.plan_tier === 'free' && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="font-bold text-slate-900 mb-2">Upgrade for More Protection</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Get unlimited lease scans, priority support, and legal assistance
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logout Card */}
          <Card className="border-none shadow-xl">
            <CardContent className="p-6">
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => base44.auth.logout()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}