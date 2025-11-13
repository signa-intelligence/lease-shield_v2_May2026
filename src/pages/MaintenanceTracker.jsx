
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Camera, Image as ImageIcon, X, Loader2, ArrowLeft, Save, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ChatLog from "../components/maintenance/ChatLog";

export default function MaintenanceTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  
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

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceRequest.create(data),
    onSuccess: async (createdRequest) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setShowAddForm(false);
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

      // Send notifications
      try {
        const notificationResponse = await base44.functions.invoke('sendMaintenanceNotification', {
          maintenanceRequest: createdRequest
        });
        
        if (notificationResponse.data?.success) {
          const sentCount = notificationResponse.data.notifications?.filter(n => n.status === 'sent').length || 0;
          if (sentCount > 0) {
            alert(
              `${strings.requestSent} ${sentCount} ${strings.recipients}`
            );
          }
        }
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
      }
    },
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    inputBg: isDarkMode ? '#353A3D' : '#FFFFFF',
    sectionBg: isDarkMode ? '#353A3D' : '#F8FAFC'
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
      requestCreatedBy: "Request created by"
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
      requestCreatedBy: "คำขอซ่อมถูกสร้างโดย"
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
      requestCreatedBy: "请求创建者"
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
      requestCreatedBy: "リクエスト作成者"
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
      requestCreatedBy: "요청 생성자"
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
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let photoUrls = [];

      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        const uploadPromises = photoFiles.map(file => 
          base44.integrations.Core.UploadFile({ file })
        );
        const uploadResults = await Promise.all(uploadPromises);
        photoUrls = uploadResults.map(result => result.file_url);
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
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.back}
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Wrench className="w-7 h-7 md:w-8 md:h-8 text-orange-600" />
            {strings.title}
          </h1>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full mb-6 bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          {strings.addRequest}
        </Button>

        {showAddForm && (
          <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.issueTitle}</Label>
                  <Input
                    required
                    value={formData.issue_title}
                    onChange={(e) => setFormData({...formData, issue_title: e.target.value})}
                    className="mt-2"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                  />
                </div>

                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.description}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-2"
                    rows={4}
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                  />
                </div>

                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.addPhotos}</Label>
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label style={{ color: colors.textPrimary }}>{strings.category}</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="structural">Structural</SelectItem>
                        <SelectItem value="appliance">Appliance</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="pest">Pest</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{ color: colors.textPrimary }}>{strings.priority}</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setPhotoFiles([]);
                      setPhotoPreviews([]);
                    }}
                    disabled={uploadingPhotos}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {strings.cancel}
                  </Button>
                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700"
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

        {requests.length === 0 ? (
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-12 text-center">
              <Wrench className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.3 }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noRequests}
              </h3>
              <p style={{ color: colors.textSecondary }}>{strings.noRequestsDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2" style={{ color: colors.textPrimary }}>
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
        )}
      </div>
    </div>
  );
}
