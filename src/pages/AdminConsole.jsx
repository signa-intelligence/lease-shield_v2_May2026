
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, FileText, Database, Shield, Mail, Trash2, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminConsole() {
  const [seeding, setSeeding] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin',
  });

  const { data: allLeases = [] } = useQuery({
    queryKey: ['allLeases'],
    queryFn: () => base44.entities.Lease.list(),
    enabled: user?.role === 'admin',
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ['allDocuments'],
    queryFn: () => base44.entities.Document.list(),
    enabled: user?.role === 'admin',
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    tableBg: '#2A2D30',
    tableRow: '#353A3D',
    leaseBg: '#353A3D'
  } : {
    bg: '#0C3B2E',
    cardBg: '#FFFFFF',
    textPrimary: '#ECEFED',
    textSecondary: '#D1FAE5',
    borderColor: 'rgba(236, 239, 237, 0.2)',
    tableBg: '#FFFFFF',
    tableRow: '#F8FAFC',
    leaseBg: '#F8FAFC'
  };

  const t = {
    en: {
      title: "Admin Console",
      subtitle: "System management and demo data tools",
      totalUsers: "Total Users",
      activeSubscribers: "Active Subscribers",
      leaseScans: "Lease Scans",
      documents: "Documents",
      demoDataSeeder: "Demo Data Seeder",
      demoDataDesc: "Create demo leases, deposit trackers, and cases for testing.",
      seedDemoData: "Seed Demo Data",
      seeding: "Seeding...",
      userManagement: "User Management",
      user: "User",
      email: "Email",
      plan: "Plan",
      status: "Status",
      role: "Role",
      joined: "Joined",
      actions: "Actions",
      admin: "Admin",
      active: "Active",
      secure: "Secure",
      recentLeases: "Recent Leases",
      noLeases: "No leases yet"
    },
    th: {
      title: "คอนโซลแอดมิน",
      subtitle: "เครื่องมือจัดการระบบและข้อมูลทดสอบ",
      totalUsers: "ผู้ใช้ทั้งหมด",
      activeSubscribers: "สมาชิกที่ใช้งาน",
      leaseScans: "การสแกนสัญญาเช่า",
      documents: "เอกสาร",
      demoDataSeeder: "สร้างข้อมูลทดสอบ",
      demoDataDesc: "สร้างสัญญาเช่า ตัวติดตามเงินมัดจำ และคดีสำหรับทดสอบ",
      seedDemoData: "สร้างข้อมูลทดสอบ",
      seeding: "กำลังสร้าง...",
      userManagement: "จัดการผู้ใช้",
      user: "ผู้ใช้",
      email: "อีเมล",
      plan: "แผน",
      status: "สถานะ",
      role: "บทบาท",
      joined: "เข้าร่วม",
      actions: "การดำเนินการ",
      admin: "แอดมิน",
      active: "ใช้งาน",
      secure: "Secure",
      recentLeases: "สัญญาเช่าล่าสุด",
      noLeases: "ยังไม่มีสัญญาเช่า"
    }
  };

  const strings = t[language];

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      await base44.functions.invoke('seedDemoData', {});
      queryClient.invalidateQueries();
      alert(language === 'th' ? 'สร้างข้อมูลทดสอบสำเร็จ!' : 'Demo data seeded successfully!');
    } catch (error) {
      console.error('Seeding failed:', error);
      alert(language === 'th' ? 'การสร้างข้อมูลล้มเหลว' : 'Seeding failed');
    } finally {
      setSeeding(false);
    }
  };

  const activeSubscribers = allUsers.filter(u => u.subscription_status === 'active').length;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.totalUsers}</p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{allUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.activeSubscribers}</p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{activeSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.leaseScans}</p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{allLeases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.documents}</p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{allDocuments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Data Seeder */}
        <Card className="border-none shadow-lg mb-8" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Database className="w-5 h-5 text-ls-forest" />
              {strings.demoDataSeeder}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="mb-4" style={{ color: colors.textSecondary }}>{strings.demoDataDesc}</p>
            <Button
              onClick={handleSeedDemoData}
              disabled={seeding}
              style={{
                backgroundColor: seeding ? '#9CA3AF' : '#0C3B2E',
                color: '#FFFFFF'
              }}
            >
              <Database className="w-4 h-4 mr-2" />
              {seeding ? strings.seeding : strings.seedDemoData}
            </Button>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="border-none shadow-lg mb-8" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Users className="w-5 h-5 text-ls-forest" />
              {strings.userManagement}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto" style={{ backgroundColor: colors.tableBg }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.borderColor}` }}>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.user}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.email}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.plan}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.status}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.role}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.joined}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u, index) => (
                    <tr 
                      key={u.id} 
                      style={{ 
                        borderBottom: `1px solid ${colors.borderColor}`,
                        backgroundColor: index % 2 === 0 ? colors.tableBg : colors.tableRow
                      }}
                    >
                      <td className="py-3 px-4 text-sm font-medium" style={{ color: colors.textPrimary }}>{u.full_name}</td>
                      <td className="py-3 px-4 text-sm" style={{ color: colors.textSecondary }}>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {u.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={
                          u.plan_tier === 'secure' ? 'bg-purple-100 text-purple-700' :
                          u.plan_tier === 'protect' ? 'bg-blue-100 text-blue-700' :
                          u.plan_tier === 'lite' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {u.plan_tier === 'secure' ? strings.secure :
                           u.plan_tier === 'protect' ? 'Protect' :
                           u.plan_tier === 'lite' ? 'Lite' :
                           'Free'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {u.subscription_status === 'active' && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            {strings.active}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'admin' && (
                          <Badge className="bg-ls-gold text-ls-charcoal">
                            <Crown className="w-3 h-3 mr-1" />
                            {strings.admin}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: colors.textSecondary }}>
                        {format(new Date(u.created_date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          style={{
                            backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                            color: colors.textPrimary,
                            borderColor: colors.borderColor
                          }}
                        >
                          {strings.actions}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Leases */}
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <FileText className="w-5 h-5 text-ls-forest" />
              {strings.recentLeases} ({allLeases.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {allLeases.length === 0 ? (
              <p className="text-center py-8" style={{ color: colors.textSecondary }}>{strings.noLeases}</p>
            ) : (
              <div className="space-y-3">
                {allLeases.slice(0, 10).map((lease) => (
                  <div key={lease.id} className="p-4 rounded-lg border" style={{
                    backgroundColor: colors.leaseBg,
                    borderColor: colors.borderColor
                  }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: colors.textPrimary }}>
                          {lease.property_address || (language === 'th' ? 'สัญญาเช่า' : 'Lease Agreement')}
                        </p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'โดย' : 'by'} {lease.created_by}
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                          {format(new Date(lease.created_date), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <Badge className={
                        lease.status === 'scanned' ? 'bg-blue-100 text-blue-800' :
                        lease.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }>
                        {lease.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
