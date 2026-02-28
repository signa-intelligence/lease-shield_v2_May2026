import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, Camera, Image as ImageIcon, X, Loader2, ArrowLeft, Save, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ChatLog from "../components/maintenance/ChatLog";
import { getFeatureCardStyles } from "../components/shared/featureTheme";
import { haptic } from "../components/shared/HapticFeedback";
import MobileFormInput from "../components/shared/MobileFormInput";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import SkeletonLoader from "../components/shared/SkeletonLoader";

export default function MaintenanceTrackerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showAddRequest, setShowAddRequest] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPostUpgradeHint, setShowPostUpgradeHint] = useState(false);
  
  const [formData, setFormData] = useState({
    issue_title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    property_address: '',
    reported_date: new Date().toISOString().split('T')[0]
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: maintenanceRequests = [], isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceRequest.create(data),
    onSuccess: async (createdRequest) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setShowAddRequest(false);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setFormData({
        issue_title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        property_address: '',
        reported_date: new Date().toISOString().split('T')[0]
      });

      if (!user?.plan_tier || user.plan_tier === 'free') {
        setShowPostUpgradeHint(true);
      }

      haptic.success();

      try {
        const notificationResponse = await base44.functions.invoke('sendMaintenanceNotification', {
          maintenanceRequest: createdRequest
        });
        
        if (notificationResponse.data?.success) {
          const sentCount = notificationResponse.data.notifications?.filter(n => n.status === 'sent').length || 0;
          if (sentCount > 0) {
            toast.success(`${strings.requestSent} ${sentCount} ${strings.recipients}`);
          }
        }
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
      }
    },
    onError: () => {
      toast.error(strings.failedToCreate);
      haptic.error();
    }
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const theme = getFeatureCardStyles("maintenance", isDarkMode);

  const colors = {
    bg: isDarkMode ? '#111827' : '#F3F6F5',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#F9FAFB' : '#0F172A',
    textSecondary: isDarkMode ? '#D1D5DB' : '#475569',
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)',
    fieldBg: isDarkMode ? '#374151' : '#F8FAFC',
    sectionBg: isDarkMode ? '#374151' : '#F8FAFC'
  };

  const t = {
    en: {
      title: "Maintenance Tracker",
      subtitle: "Track repair requests and communicate with property management",
      addRequest: "New Request",
      issueTitle: "Issue Title",
      description: "Description",
      category: "Category",
      priority: "Priority",
      propertyAddress: "Property Address",
      reportedDate: "Reported Date",
      addPhotos: "Add Photos",
      takePhoto: "Take Photo",
      chooseFiles: "Choose Files",
      uploadingPhotos: "Uploading photos...",
      photosAdded: "photo(s) added",
      save: "Save & Send",
      cancel: "Cancel",
      noRequests: "No Maintenance Requests",
      noRequestsDesc: "Report issues to keep records and notify your landlord",
      status: "Status",
      back: "Back",
      viewChat: "View Chat",
      hideChat: "Hide Chat",
      requestSent: "Request sent to",
      recipients: "recipient(s)!",
      failedToCreate: "Failed to create request. Please try again.",
      requestCreatedBy: "Request created by",
      upgradeModalTitle: "Upgrade to Track Maintenance",
      upgradeModalDesc: "Maintenance Tracker is available on paid plans. Upgrade to unlock professional request tracking and landlord notifications.",
      viewPlans: "View Plans",
      upgradeHintText: "Get priority landlord alerts and full maintenance history with a paid plan.",
    },
    th: {
      title: "ติดตามการซ่อมบำรุง",
      subtitle: "ติดตามคำขอซ่อมและสื่อสารกับผู้จัดการทรัพย์สิน",
      addRequest: "คำขอใหม่",
      issueTitle: "หัวข้อปัญหา",
      description: "รายละเอียด",
      category: "ประเภท",
      priority: "ความสำคัญ",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      reportedDate: "วันที่รายงาน",
      addPhotos: "เพิ่มรูปภาพ",
      takePhoto: "ถ่ายรูป",
      chooseFiles: "เลือกไฟล์",
      uploadingPhotos: "กำลังอัปโหลดรูปภาพ...",
      photosAdded: "รูปภาพที่เพิ่ม",
      save: "บันทึกและส่ง",
      cancel: "ยกเลิก",
      noRequests: "ไม่มีคำขอซ่อมบำรุง",
      noRequestsDesc: "รายงานปัญหาเพื่อเก็บบันทึกและแจ้งเจ้าของบ้าน",
      status: "สถานะ",
      back: "กลับ",
      viewChat: "ดูแชท",
      hideChat: "ซ่อนแชท",
      requestSent: "คำขอซ่อมถูกส่งแล้ว!\n\nแจ้งไปยัง:",
      recipients: "ผู้รับ",
      failedToCreate: "ไม่สามารถสร้างคำขอได้ กรุณาลองอีกครั้ง",
      requestCreatedBy: "คำขอซ่อมถูกสร้างโดย",
      upgradeModalTitle: "อัปเกรดเพื่อติดตามการซ่อมบำรุง",
      upgradeModalDesc: "ระบบติดตามการซ่อมบำรุงใช้ได้กับแผนที่ชำระเงิน อัปเกรดเพื่อปลดล็อกระบบติดตามคำขอมืออาชีพและการแจ้งเตือนเจ้าของบ้าน",
      viewPlans: "ดูแผน",
      upgradeHintText: "รับการแจ้งเตือนเจ้าของบ้านแบบเร่งด่วนและประวัติการซ่อมบำรุงเต็มรูปแบบด้วยแผนที่ชำระเงิน",
    },
    zh: {
      title: "维护追踪器",
      subtitle: "追踪维修请求并与物业管理沟通",
      addRequest: "新请求",
      issueTitle: "问题标题",
      description: "描述",
      category: "类别",
      priority: "优先级",
      propertyAddress: "物业地址",
      reportedDate: "报告日期",
      addPhotos: "添加照片",
      takePhoto: "拍照",
      chooseFiles: "选择文件",
      uploadingPhotos: "上传照片中...",
      photosAdded: "已添加照片",
      save: "保存并发送",
      cancel: "取消",
      noRequests: "无维护请求",
      noRequestsDesc: "报告问题以保留记录并通知您的房东",
      status: "状态",
      back: "返回",
      viewChat: "查看聊天",
      hideChat: "隐藏聊天",
      requestSent: "请求已发送至",
      recipients: "收件人！",
      failedToCreate: "创建请求失败。请重试。",
      requestCreatedBy: "请求创建者",
      upgradeModalTitle: "升级以跟踪维护",
      upgradeModalDesc: "维护跟踪器在付费计划中可用。升级以解锁专业的请求跟踪和房东通知。",
      viewPlans: "查看计划",
      upgradeHintText: "通过付费计划获取优先房东警报和完整的维护历史记录。",
    },
    ja: {
      title: "メンテナンストラッカー",
      subtitle: "修理リクエストを追跡し、物件管理と連絡",
      addRequest: "新しいリクエスト",
      issueTitle: "問題タイトル",
      description: "説明",
      category: "カテゴリ",
      priority: "優先度",
      propertyAddress: "物件住所",
      reportedDate: "報告日",
      addPhotos: "写真を追加",
      takePhoto: "写真を撮る",
      chooseFiles: "ファイルを選択",
      uploadingPhotos: "写真をアップロード中...",
      photosAdded: "追加された写真",
      save: "保存して送信",
      cancel: "キャンセル",
      noRequests: "メンテナンスリクエストなし",
      noRequestsDesc: "記録を保持し家主に通知するために問題を報告",
      status: "ステータス",
      back: "戻る",
      viewChat: "チャットを表示",
      hideChat: "チャットを非表示",
      requestSent: "リクエストが送信されました",
      recipients: "受信者！",
      failedToCreate: "リクエストの作成に失敗しました。もう一度お試しください。",
      requestCreatedBy: "リクエスト作成者",
      upgradeModalTitle: "メンテナンス追跡にアップグレード",
      upgradeModalDesc: "メンテナンス追跡は有料プランで利用できます。アップグレードして、プロフェッショナルなリクエスト追跡と家主への通知を解除します。",
      viewPlans: "プランを見る",
      upgradeHintText: "有料プランで優先家主アラートと完全なメンテナンス履歴を入手してください。",
    },
    ko: {
      title: "유지보수 추적기",
      subtitle: "수리 요청을 추적하고 부동산 관리와 소통",
      addRequest: "새 요청",
      issueTitle: "문제 제목",
      description: "설명",
      category: "카테고리",
      priority: "우선순위",
      propertyAddress: "부동산 주소",
      reportedDate: "보고 날짜",
      addPhotos: "사진 추가",
      takePhoto: "사진 촬영",
      chooseFiles: "파일 선택",
      uploadingPhotos: "사진 업로드 중...",
      photosAdded: "추가된 사진",
      save: "저장 및 전송",
      cancel: "취소",
      noRequests: "유지보수 요청 없음",
      noRequestsDesc: "기록을 유지하고 집주인에게 알리기 위해 문제 보고",
      status: "상태",
      back: "뒤로",
      viewChat: "채팅 보기",
      hideChat: "채팅 숨기기",
      requestSent: "요청이 전송되었습니다",
      recipients: "수신자！",
      failedToCreate: "요청 생성 실패. 다시 시도하세요.",
      requestCreatedBy: "요청 생성자",
      upgradeModalTitle: "유지보수 추적을 위해 업그레이드",
      upgradeModalDesc: "유지보수 추적기는 유료 플랜에서 사용할 수 있습니다. 전문적인 요청 추적 및 집주인 알림을 잠금 해제하려면 업그레이드하십시오.",
      viewPlans: "플랜 보기",
      upgradeHintText: "유료 플랜으로 우선적인 집주인 알림과 전체 유지보수 내역을 받아보세요.",
    }
  };

  const strings = t[language] || t.en;

  const handlePhotoSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setPhotoFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    haptic.light();
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewRequestClick = () => {
    haptic.medium();
    if (!user || !user.plan_tier || user.plan_tier === 'free') {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddRequest(!showAddRequest);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let photoUrls = [];
      let totalUploadedBytes = 0;

      if (photoFiles.length > 0) {
        // Storage quota check before upload
        const totalSize = photoFiles.reduce((sum, f) => sum + (f.size || 0), 0);
        if (totalSize > 0) {
          try {
            const quotaRes = await base44.functions.invoke('checkStorageQuota', { fileSize: totalSize });
            const quota = quotaRes.data;
            if (quota && !quota.allowed && !quota.failOpen) {
              const msg = language === 'th'
                ? `พื้นที่จัดเก็บเต็ม คุณใช้ ${quota.usedMB || 0} MB จาก ${quota.limitMB || 0} MB\n\nอัปเกรดเพื่อเพิ่มพื้นที่`
                : `Storage limit reached. You're using ${quota.usedMB || 0} MB of ${quota.limitMB || 0} MB.\n\nUpgrade for more storage.`;
              toast.error(msg);
              return;
            }
          } catch (quotaErr) {
            console.warn('[MAINT] Quota check failed, continuing:', quotaErr?.message);
          }
        }

        setUploadingPhotos(true);
        const uploadPromises = photoFiles.map(file => 
          base44.integrations.Core.UploadFile({ file })
        );
        const uploadResults = await Promise.all(uploadPromises);
        photoUrls = uploadResults.map(result => result.file_url);
        totalUploadedBytes = totalSize;
      }

      const initialLogEntry = {
        timestamp: new Date().toISOString(),
        message: `${strings.requestCreatedBy} ${user?.full_name || user?.email}`,
        sender: 'tenant',
        sender_name: user?.full_name || user?.email,
        sender_email: user?.email,
        action_type: 'created',
        metadata: {
          issue_title: formData.issue_title,
          category: formData.category,
          priority: formData.priority
        }
      };

      const requestData = {
        ...formData,
        photo_urls: photoUrls,
        communication_log: [initialLogEntry]
      };

      await createRequestMutation.mutateAsync(requestData);

      // Update storage usage after successful upload
      if (totalUploadedBytes > 0) {
        base44.functions.invoke('updateStorageUsage', { bytesAdded: totalUploadedBytes }).catch(err =>
          console.warn('[MAINT] Storage update failed (non-blocking):', err?.message)
        );
      }

      setUploadingPhotos(false);
    } catch (error) {
      console.error('Failed to create request:', error);
      setUploadingPhotos(false);
      alert(strings.failedToCreate);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen p-4 md:p-6 pb-28 page-transition" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title={strings.title}
            subtitle={strings.subtitle}
            icon={Wrench}
            iconColor={theme.accent}
            showBack={true}
            isDarkMode={isDarkMode}
          />

        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="modal-enter" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>{strings.upgradeModalTitle}</DialogTitle>
              <DialogDescription style={{ color: colors.textSecondary }}>
                {strings.upgradeModalDesc}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  haptic.light();
                  setShowUpgradeModal(false);
                }}
                className="btn-interaction"
              >
                {strings.cancel}
              </Button>
              <Button
                onClick={() => {
                  haptic.medium();
                  setShowUpgradeModal(false);
                  navigate(createPageUrl("Account") + '#plans');
                }}
                className="btn-interaction"
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF'
                }}
              >
                {strings.viewPlans}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          onClick={handleNewRequestClick}
          className="w-full mb-6 ls-cta-primary btn-interaction"
        >
          <Plus className="w-5 h-5 mr-2" />
          {strings.addRequest}
        </Button>

        {showPostUpgradeHint && (!user?.plan_tier || user.plan_tier === 'free') && (
          <div
            style={{
              marginBottom: 16,
              padding: 10,
              borderRadius: 12,
              backgroundColor: isDarkMode ? 'rgba(12,59,46,0.12)' : 'rgba(12,59,46,0.06)',
              border: '1px dashed rgba(12,59,46,0.25)',
              fontSize: '0.8rem',
              color: colors.textPrimary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <span>
              <strong>Tip:</strong> {strings.upgradeHintText}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl('Account') + '#plans')}
              style={{
                backgroundColor: '#0C3B2E',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 'auto',
                padding: '4px 8px',
                borderColor: '#0C3B2E'
              }}
            >
              {strings.viewPlans}
            </Button>
          </div>
        )}

        {showAddRequest && (
          <Card 
            className="mb-6 border-none shadow-xl" 
            style={{ 
              background: theme.background,
              borderLeft: `4px solid ${theme.borderLeftColor}`
            }}
          >
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <MobileFormInput
                  label={strings.issueTitle}
                  value={formData.issue_title}
                  onChange={(e) => setFormData({...formData, issue_title: e.target.value})}
                  required
                  colors={colors}
                />

                <MobileFormInput
                  label={strings.description}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  multiline
                  rows={4}
                  colors={colors}
                />

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                    {strings.addPhotos}
                  </label>
                  <div className="mt-2 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          onChange={handlePhotoSelection}
                          className="hidden"
                        />
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#C7A338'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.borderColor}
                        >
                          <Camera className="w-4 h-4" />
                          <span className="text-sm font-semibold">{strings.takePhoto}</span>
                        </div>
                      </label>

                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoSelection}
                          className="hidden"
                        />
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#C7A338'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.borderColor}
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-sm font-semibold">{strings.chooseFiles}</span>
                        </div>
                      </label>
                    </div>

                    {photoPreviews.length > 0 && (
                      <div>
                        <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                          {photoPreviews.length} {strings.photosAdded}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {photoPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2"
                                style={{ borderColor: colors.borderColor }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.category}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: colors.fieldBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary,
                        fontSize: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${colors.borderColor}`,
                        minHeight: '48px'
                      }}
                    >
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="structural">Structural</option>
                      <option value="appliance">Appliance</option>
                      <option value="hvac">HVAC</option>
                      <option value="pest">Pest</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.priority}
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: colors.fieldBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary,
                        fontSize: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${colors.borderColor}`,
                        minHeight: '48px'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      haptic.light();
                      setShowAddRequest(false);
                      setPhotoFiles([]);
                      setPhotoPreviews([]);
                    }}
                    disabled={uploadingPhotos}
                    className="btn-interaction"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {strings.cancel}
                  </Button>
                  <Button
                    type="submit"
                    className="ls-cta-primary btn-interaction"
                    disabled={uploadingPhotos}
                  >
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {strings.uploadingPhotos}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {strings.save}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
        ) : maintenanceRequests.length === 0 ? (
          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-0">
              <EmptyState
                icon={Wrench}
                title={strings.noRequests}
                description={strings.noRequestsDesc}
                actionLabel={strings.addRequest}
                onAction={handleNewRequestClick}
                isDarkMode={isDarkMode}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {maintenanceRequests.length === 0 && (
              <div className="rounded-xl border border-dashed p-4 sm:p-5" style={{ borderColor: "#FCD34D", backgroundColor: "#FFFBEB" }}>
                <h3 className="font-semibold text-sm sm:text-base mb-1">No maintenance requests yet</h3>
                <p className="text-xs sm:text-sm text-gray-700 mb-3">
                  Log your first maintenance issue so you have a clear record with timestamps, photos and notifications.
                </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  haptic.medium();
                  handleNewRequestClick();
                }}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm"
                style={{ backgroundColor: "#0C3B2E", color: "#FFFFFF" }}
              >
                New maintenance request
              </button>
              {(!user?.plan_tier || user.plan_tier === 'free') && (
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    navigate(createPageUrl("Account") + '#plans');
                  }}
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border"
                  style={{ borderColor: "#0C3B2E", color: "#0C3B2E", backgroundColor: "#FFFFFF" }}
                >
                  Upgrade for full maintenance history
                </button>
                )}
                </div>
                </div>
                )}
          <div className="max-w-5xl mx-auto space-y-4">
            {maintenanceRequests.map((request) => (
              <Card 
                key={request.id} 
                className="border-none shadow-lg" 
                style={{ 
                  background: theme.background,
                  borderLeft: `4px solid ${theme.borderLeftColor}`
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2" style={{ color: theme.headerColor }}>
                        {request.issue_title}
                      </CardTitle>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {request.description}
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {request.photo_urls && request.photo_urls.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-4 gap-2">
                        {request.photo_urls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Issue ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border cursor-pointer"
                            style={{ borderColor: colors.borderColor }}
                            onClick={() => window.open(url, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs mb-3" style={{ color: colors.textSecondary }}>
                    <span>📅 {format(new Date(request.reported_date), 'MMM d, yyyy')}</span>
                    <span>🏷️ {request.category}</span>
                    <span>⚡ {request.priority}</span>
                  </div>

                  {request.communication_log && request.communication_log.length > 0 && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.borderColor }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                        className="mb-3"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {expandedRequest === request.id ? strings.hideChat : strings.viewChat} ({request.communication_log.length})
                      </Button>

                      {expandedRequest === request.id && (
                        <ChatLog 
                          communicationLog={request.communication_log}
                          language={language}
                          colors={colors}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
    </ToastProvider>
  );
}