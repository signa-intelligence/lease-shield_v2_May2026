import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Globe, Shield, LogOut, Save, Edit2, X, Moon, Sun, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    language: user?.language || 'en',
    theme: user?.theme || 'light',
    email_notifications: user?.email_notifications ?? true,
    line_notifications: user?.line_notifications ?? false
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        country: user.country || '',
        language: user.language || 'en',
        theme: user.theme || 'light',
        email_notifications: user.email_notifications ?? true,
        line_notifications: user.line_notifications ?? false
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

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D',
    fieldBg: '#353A3D'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF',
    fieldBg: '#F8FAFC'
  };

  const t = {
    en: {
      pageTitle: "My Profile",
      pageSubtitle: "Manage your account settings",
      personalInfo: "Personal Information",
      editProfile: "Edit Profile",
      cancel: "Cancel",
      fullName: "Full Name",
      email: "Email",
      phone: "Phone",
      phoneNotProvided: "Not provided",
      country: "Country",
      countryNotProvided: "Not provided",
      language: "Language",
      englishLang: "English",
      thaiLang: "ไทย (Thai)",
      chineseLang: "中文 (Chinese)",
      japaneseLang: "日本語 (Japanese)",
      koreanLang: "한국어 (Korean)",
      saveChanges: "Save Changes",
      saving: "Saving...",
      subscription: "Subscription",
      currentPlan: "Current Plan",
      renewsOn: "Renews On",
      upgradeBanner: "Upgrade for More Protection",
      upgradeBannerDesc: "Get unlimited lease scans, priority support, and legal assistance",
      viewPlans: "View Plans",
      appearance: "Appearance",
      theme: "Theme",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      notifications: "Notification Settings",
      emailNotifications: "Email Notifications",
      emailNotificationsDesc: "Receive alerts via email",
      lineNotifications: "LINE Notifications",
      lineNotificationsDesc: "Receive alerts via LINE (Connect LINE first)",
      logout: "Logout"
    },
    th: {
      pageTitle: "โปรไฟล์ของฉัน",
      pageSubtitle: "จัดการการตั้งค่าบัญชีของคุณ",
      personalInfo: "ข้อมูลส่วนตัว",
      editProfile: "แก้ไขโปรไฟล์",
      cancel: "ยกเลิก",
      fullName: "ชื่อ-นามสกุล",
      email: "อีเมล",
      phone: "เบอร์โทรศัพท์",
      phoneNotProvided: "ไม่ได้ระบุ",
      country: "ประเทศ",
      countryNotProvided: "ไม่ได้ระบุ",
      language: "ภาษา",
      englishLang: "English (อังกฤษ)",
      thaiLang: "ไทย (Thai)",
      chineseLang: "中文 (จีน)",
      japaneseLang: "日本語 (ญี่ปุ่น)",
      koreanLang: "한국어 (เกาหลี)",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      saving: "กำลังบันทึก...",
      subscription: "การสมัครสมาชิก",
      currentPlan: "แผนปัจจุบัน",
      renewsOn: "ต่ออายุในวันที่",
      upgradeBanner: "อัปเกรดเพื่อการปกป้องที่มากขึ้น",
      upgradeBannerDesc: "รับการสแกนสัญญาไม่จำกัด การสนับสนุนเร่งด่วน และความช่วยเหลือทางกฎหมาย",
      viewPlans: "ดูแผน",
      appearance: "รูปลักษณ์",
      theme: "ธีม",
      lightMode: "โหมดสว่าง",
      darkMode: "โหมดมืด",
      notifications: "การตั้งค่าการแจ้งเตือน",
      emailNotifications: "การแจ้งเตือนทางอีเมล",
      emailNotificationsDesc: "รับการแจ้งเตือนผ่านอีเมล",
      lineNotifications: "การแจ้งเตือน LINE",
      lineNotificationsDesc: "รับการแจ้งเตือนผ่าน LINE (เชื่อมต่อ LINE ก่อน)",
      logout: "ออกจากระบบ"
    },
    zh: {
      pageTitle: "我的个人资料",
      pageSubtitle: "管理您的账户设置",
      personalInfo: "个人信息",
      editProfile: "编辑个人资料",
      cancel: "取消",
      fullName: "全名",
      email: "电子邮件",
      phone: "电话",
      phoneNotProvided: "未提供",
      country: "国家",
      countryNotProvided: "未提供",
      language: "语言",
      englishLang: "English (英语)",
      thaiLang: "ไทย (泰语)",
      chineseLang: "中文 (Chinese)",
      japaneseLang: "日本語 (日语)",
      koreanLang: "한국어 (韩语)",
      saveChanges: "保存更改",
      saving: "保存中...",
      subscription: "订阅",
      currentPlan: "当前计划",
      renewsOn: "续订日期",
      upgradeBanner: "升级以获得更多保护",
      upgradeBannerDesc: "获得无限制租约扫描、优先支持和法律援助",
      viewPlans: "查看计划",
      appearance: "外观",
      theme: "主题",
      lightMode: "浅色模式",
      darkMode: "深色模式",
      notifications: "通知设置",
      emailNotifications: "电子邮件通知",
      emailNotificationsDesc: "通过电子邮件接收提醒",
      lineNotifications: "LINE通知",
      lineNotificationsDesc: "通过LINE接收提醒（需先连接LINE）",
      logout: "登出"
    },
    ja: {
      pageTitle: "マイプロフィール",
      pageSubtitle: "アカウント設定を管理",
      personalInfo: "個人情報",
      editProfile: "プロフィールを編集",
      cancel: "キャンセル",
      fullName: "フルネーム",
      email: "メールアドレス",
      phone: "電話番号",
      phoneNotProvided: "未提供",
      country: "国",
      countryNotProvided: "未提供",
      language: "言語",
      englishLang: "English (英語)",
      thaiLang: "ไทย (タイ語)",
      chineseLang: "中文 (中国語)",
      japaneseLang: "日本語 (Japanese)",
      koreanLang: "한국어 (韓国語)",
      saveChanges: "変更を保存",
      saving: "保存中...",
      subscription: "サブスクリプション",
      currentPlan: "現在のプラン",
      renewsOn: "更新日",
      upgradeBanner: "アップグレードしてより多くの保護を",
      upgradeBannerDesc: "無制限の賃貸契約スキャン、優先サポート、法的支援を取得",
      viewPlans: "プランを表示",
      appearance: "外観",
      theme: "テーマ",
      lightMode: "ライトモード",
      darkMode: "ダークモード",
      notifications: "通知設定",
      emailNotifications: "メール通知",
      emailNotificationsDesc: "メールでアラートを受け取る",
      lineNotifications: "LINE通知",
      lineNotificationsDesc: "LINEでアラートを受け取る（先にLINEを接続）",
      logout: "ログアウト"
    },
    ko: {
      pageTitle: "내 프로필",
      pageSubtitle: "계정 설정 관리",
      personalInfo: "개인 정보",
      editProfile: "프로필 편집",
      cancel: "취소",
      fullName: "전체 이름",
      email: "이메일",
      phone: "전화번호",
      phoneNotProvided: "제공되지 않음",
      country: "국가",
      countryNotProvided: "제공되지 않음",
      language: "언어",
      englishLang: "English (영어)",
      thaiLang: "ไทย (태국어)",
      chineseLang: "中文 (중국어)",
      japaneseLang: "日本語 (일본어)",
      koreanLang: "한국어 (Korean)",
      saveChanges: "변경 사항 저장",
      saving: "저장 중...",
      subscription: "구독",
      currentPlan: "현재 계획",
      renewsOn: "갱신 날짜",
      upgradeBanner: "더 많은 보호를 위해 업그레이드",
      upgradeBannerDesc: "무제한 임대 계약 스캔, 우선 지원 및 법률 지원 받기",
      viewPlans: "계획 보기",
      appearance: "외관",
      theme: "테마",
      lightMode: "라이트 모드",
      darkMode: "다크 모드",
      notifications: "알림 설정",
      emailNotifications: "이메일 알림",
      emailNotificationsDesc: "이메일로 알림 받기",
      lineNotifications: "LINE 알림",
      lineNotificationsDesc: "LINE으로 알림 받기（먼저 LINE 연결）",
      logout: "로그아웃"
    }
  };

  const strings = t[language] || t.en;

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.pageTitle}
            </h1>
          </div>
          <p style={{ color: colors.textSecondary }}>{strings.pageSubtitle}</p>
        </div>

        <div className="grid gap-6">
          {/* Personal Information Card */}
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader className="pb-4" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <User className="w-6 h-6 text-ls-forest" />
                  {strings.personalInfo}
                </CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    {strings.editProfile}
                  </Button>
                ) : (
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    {strings.cancel}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: colors.fieldBg }}>
                    <User className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    <div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.fullName}</p>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>{user?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: colors.fieldBg }}>
                    <Mail className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    <div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.email}</p>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: colors.fieldBg }}>
                    <Phone className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    <div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.phone}</p>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>
                        {user?.phone || strings.phoneNotProvided}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: colors.fieldBg }}>
                    <Globe className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    <div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.country}</p>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>
                        {user?.country || strings.countryNotProvided}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: colors.fieldBg }}>
                    <Globe className="w-5 h-5" style={{ color: colors.textSecondary }} />
                    <div>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.language}</p>
                      <p className="font-semibold" style={{ color: colors.textPrimary }}>
                        {user?.language === 'th' ? strings.thaiLang : 
                         user?.language === 'zh' ? strings.chineseLang :
                         user?.language === 'ja' ? strings.japaneseLang :
                         user?.language === 'ko' ? strings.koreanLang :
                         strings.englishLang}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name" style={{ color: colors.textPrimary }}>{strings.fullName}</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="mt-2"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" style={{ color: colors.textPrimary }}>{strings.phone}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+66 XX XXX XXXX"
                      className="mt-2"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" style={{ color: colors.textPrimary }}>{strings.country}</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      placeholder="Thailand"
                      className="mt-2"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="language" style={{ color: colors.textPrimary }}>{strings.language}</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                      <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.cardBg }}>
                        <SelectItem value="en">{strings.englishLang}</SelectItem>
                        <SelectItem value="th">{strings.thaiLang}</SelectItem>
                        <SelectItem value="zh">{strings.chineseLang}</SelectItem>
                        <SelectItem value="ja">{strings.japaneseLang}</SelectItem>
                        <SelectItem value="ko">{strings.koreanLang}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-ls-forest hover:bg-ls-forest/90"
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? strings.saving : strings.saveChanges}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader className="pb-4" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
              <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                {isDarkMode ? <Moon className="w-6 h-6 text-ls-forest" /> : <Sun className="w-6 h-6 text-ls-gold" />}
                {strings.appearance}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: colors.fieldBg }}>
                <div className="flex-1">
                  <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>{strings.theme}</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {isDarkMode ? strings.darkMode : strings.lightMode}
                  </p>
                </div>
                <Switch
                  checked={formData.theme === 'dark'}
                  onCheckedChange={(checked) => {
                    const newTheme = checked ? 'dark' : 'light';
                    setFormData({...formData, theme: newTheme});
                    updateProfileMutation.mutate({ theme: newTheme });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader className="pb-4" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
              <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Bell className="w-6 h-6 text-ls-forest" />
                {strings.notifications}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: colors.fieldBg }}>
                <div className="flex-1">
                  <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>{strings.emailNotifications}</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.emailNotificationsDesc}
                  </p>
                </div>
                <Switch
                  checked={formData.email_notifications}
                  onCheckedChange={(checked) => {
                    setFormData({...formData, email_notifications: checked});
                    updateProfileMutation.mutate({ email_notifications: checked });
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: colors.fieldBg }}>
                <div className="flex-1">
                  <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>{strings.lineNotifications}</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.lineNotificationsDesc}
                  </p>
                </div>
                <Switch
                  checked={formData.line_notifications}
                  onCheckedChange={(checked) => {
                    setFormData({...formData, line_notifications: checked});
                    updateProfileMutation.mutate({ line_notifications: checked });
                  }}
                  disabled={!user?.line_messaging_token}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader className="pb-4" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
              <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Shield className="w-6 h-6 text-ls-forest" />
                {strings.subscription}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>{strings.currentPlan}</p>
                  <Badge className={`${getPlanColor(user?.plan_tier)} text-lg px-4 py-2`}>
                    {user?.plan_tier?.toUpperCase() || 'FREE'}
                  </Badge>
                </div>
                {user?.subscription_status === 'active' && user?.plan_renews_at && (
                  <div className="text-right">
                    <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>{strings.renewsOn}</p>
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>
                      {new Date(user.plan_renews_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              {user?.plan_tier === 'free' && (
                <div className="rounded-xl p-6 border" style={{
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #F3E8FF 100%)',
                  borderColor: '#3B82F6'
                }}>
                  <h3 className="font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.upgradeBanner}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                    {strings.upgradeBannerDesc}
                  </p>
                  <Button 
                    className="bg-ls-forest hover:bg-ls-forest/90"
                    onClick={() => navigate(createPageUrl("Account"))}
                  >
                    {strings.viewPlans}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logout Card */}
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => base44.auth.logout()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {strings.logout}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}