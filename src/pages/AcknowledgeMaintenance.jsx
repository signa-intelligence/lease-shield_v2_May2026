import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, AlertTriangle, Wrench, Clock, MessageSquare, Camera, Receipt, X, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AcknowledgeMaintenance() {
  const [loading, setLoading] = useState(true);
  const [maintenanceRequest, setMaintenanceRequest] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newStatus, setNewStatus] = useState('acknowledged');
  const [landlordResponse, setLandlordResponse] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState([]);
  const [billPhotos, setBillPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  const [user, setUser] = useState({ language: 'en' }); 

  useEffect(() => {
    loadMaintenanceRequest();
  }, []);

  const t = {
    en: {
      loading: "Loading...",
      error: "Error",
      updateSuccessful: "Update Successful!",
      tenantNotified: "The tenant has been notified of the status change.",
      status: "Status",
      completionPhotos: "completion photo(s) uploaded",
      billPhotos: "bill photo(s) uploaded",
      maintenanceRequest: "Maintenance Request",
      updateStatus: "Update the status of this request",
      description: "Description:",
      category: "Category:",
      priority: "Priority:",
      property: "Property:",
      reported: "Reported:",
      tenantPhotos: "Tenant Photos:",
      updateStatusDoc: "Update Status & Documentation",
      newStatus: "New Status:",
      response: "Response (Optional):",
      responsePlaceholder: "Add a note or estimated completion time...",
      actualCost: "Actual Cost (฿) (Optional):",
      actualCostPlaceholder: "e.g., 500",
      completionPhotosLabel: "Completion Photos (Optional):",
      completionPhotosDesc: "Upload photos showing the completed repair",
      billPhotosLabel: "Bill/Receipt Photos (Optional):",
      billPhotosDesc: "Upload photos of repair bills or receipts",
      addCompletionPhotos: "Add Completion Photos",
      addBillPhotos: "Add Bill Photos",
      uploading: "Uploading...",
      updateNotify: "Update Status & Notify Tenant",
      updating: "Updating...",
      invalidToken: "Invalid or missing token",
      requestNotFound: "Maintenance request not found",
      failedToLoad: "Failed to load request",
      uploadFailed: "Failed to upload photos. Please try again.",
      updateFailed: "Failed to update status"
    },
    th: {
      loading: "กำลังโหลด...",
      error: "ข้อผิดพลาด",
      updateSuccessful: "อัปเดตสำเร็จ!",
      tenantNotified: "ผู้เช่าได้รับแจ้งการเปลี่ยนสถานะแล้ว",
      status: "สถานะ",
      completionPhotos: "อัปโหลดรูปภาพการซ่อมเสร็จแล้ว",
      billPhotos: "อัปโหลดรูปภาพใบเสร็จแล้ว",
      maintenanceRequest: "คำขอซ่อมบำรุง",
      updateStatus: "อัปเดตสถานะของคำขอนี้",
      description: "รายละเอียด:",
      category: "ประเภท:",
      priority: "ความสำคัญ:",
      property: "ทรัพย์สิน:",
      reported: "รายงานเมื่อ:",
      tenantPhotos: "รูปภาพจากผู้เช่า:",
      updateStatusDoc: "อัปเดตสถานะและเอกสาร",
      newStatus: "สถานะใหม่:",
      response: "การตอบกลับ (ไม่บังคับ):",
      responsePlaceholder: "เพิ่มหมายเหตุหรือเวลาเสร็จโดยประมาณ...",
      actualCost: "ต้นทุนจริง (฿) (ไม่บังคับ):",
      actualCostPlaceholder: "เช่น 500",
      completionPhotosLabel: "รูปภาพการซ่อมเสร็จ (ไม่บังคับ):",
      completionPhotosDesc: "อัปโหลดรูปภาพแสดงการซ่อมเสร็จ",
      billPhotosLabel: "รูปภาพใบเสร็จ (ไม่บังคับ):",
      billPhotosDesc: "อัปโหลดรูปภาพใบเสร็จหรือบิลค่าซ่อม",
      addCompletionPhotos: "เพิ่มรูปภาพการซ่อมเสร็จ",
      addBillPhotos: "เพิ่มรูปภาพใบเสร็จ",
      uploading: "กำลังอัปโหลด...",
      updateNotify: "อัปเดตสถานะและแจ้งผู้เช่า",
      updating: "กำลังอัปเดต...",
      invalidToken: "โทเค็นไม่ถูกต้องหรือหายไป",
      requestNotFound: "ไม่พบคำขอซ่อมบำรุง",
      failedToLoad: "ไม่สามารถโหลดคำขอได้",
      uploadFailed: "อัปโหลดรูปภาพล้มเหลว กรุณาลองอีกครั้ง",
      updateFailed: "อัปเดตสถานะล้มเหลว"
    },
    zh: {
      loading: "加载中...",
      error: "错误",
      updateSuccessful: "更新成功！",
      tenantNotified: "租户已被通知状态变更。",
      status: "状态",
      completionPhotos: "已上传完成照片",
      billPhotos: "已上传账单照片",
      maintenanceRequest: "维护请求",
      updateStatus: "更新此请求的状态",
      description: "描述：",
      category: "类别：",
      priority: "优先级：",
      property: "物业：",
      reported: "报告于：",
      tenantPhotos: "租户照片：",
      updateStatusDoc: "更新状态和文档",
      newStatus: "新状态：",
      response: "回应（可选）：",
      responsePlaceholder: "添加备注或预计完成时间...",
      actualCost: "实际成本（฿）（可选）：",
      actualCostPlaceholder: "例如：500",
      completionPhotosLabel: "完成照片（可选）：",
      completionPhotosDesc: "上传显示已完成维修的照片",
      billPhotosLabel: "账单/收据照片（可选）：",
      billPhotosDesc: "上传维修账单或收据的照片",
      addCompletionPhotos: "添加完成照片",
      addBillPhotos: "添加账单照片",
      uploading: "上传中...",
      updateNotify: "更新状态并通知租户",
      updating: "更新中...",
      invalidToken: "无效或缺失的令牌",
      requestNotFound: "未找到维护请求",
      failedToLoad: "加载请求失败",
      uploadFailed: "上传照片失败。请重试。",
      updateFailed: "更新状态失败"
    },
    ja: {
      loading: "読み込み中...",
      error: "エラー",
      updateSuccessful: "更新成功！",
      tenantNotified: "テナントにステータス変更が通知されました。",
      status: "ステータス",
      completionPhotos: "完了写真をアップロード済み",
      billPhotos: "請求書写真をアップロード済み",
      maintenanceRequest: "メンテナンスリクエスト",
      updateStatus: "このリクエストのステータスを更新",
      description: "説明：",
      category: "カテゴリ：",
      priority: "優先度：",
      property: "物件：",
      reported: "報告日：",
      tenantPhotos: "テナント写真：",
      updateStatusDoc: "ステータスとドキュメントを更新",
      newStatus: "新しいステータス：",
      response: "回答（オプション）：",
      responsePlaceholder: "メモまたは完了予定時刻を追加...",
      actualCost: "実際のコスト（฿）（オプション）：",
      actualCostPlaceholder: "例：500",
      completionPhotosLabel: "完了写真（オプション）：",
      completionPhotosDesc: "完了した修理を示す写真をアップロード",
      billPhotosLabel: "請求書/領収書写真（オプション）：",
      billPhotosDesc: "修理請求書または領収書の写真をアップロード",
      addCompletionPhotos: "完了写真を追加",
      addBillPhotos: "請求書写真を追加",
      uploading: "アップロード中...",
      updateNotify: "ステータスを更新してテナントに通知",
      updating: "更新中...",
      invalidToken: "無効または欠落しているトークン",
      requestNotFound: "メンテナンスリクエストが見つかりません",
      failedToLoad: "リクエストの読み込みに失敗しました",
      uploadFailed: "写真のアップロードに失敗しました。もう一度お試しください。",
      updateFailed: "ステータスの更新に失敗しました"
    },
    ko: {
      loading: "로딩 중...",
      error: "오류",
      updateSuccessful: "업데이트 성공！",
      tenantNotified: "세입자에게 상태 변경이 통지되었습니다.",
      status: "상태",
      completionPhotos: "완료 사진 업로드됨",
      billPhotos: "청구서 사진 업로드됨",
      maintenanceRequest: "유지보수 요청",
      updateStatus: "이 요청의 상태 업데이트",
      description: "설명：",
      category: "카테고리：",
      priority: "우선순위：",
      property: "부동산：",
      reported: "보고일：",
      tenantPhotos: "세입자 사진：",
      updateStatusDoc: "상태 및 문서 업데이트",
      newStatus: "새 상태：",
      response: "응답（선택사항）：",
      responsePlaceholder: "메모 또는 예상 완료 시간 추가...",
      actualCost: "실제 비용（฿）（선택사항）：",
      actualCostPlaceholder: "예：500",
      completionPhotosLabel: "완료 사진（선택사항）：",
      completionPhotosDesc: "완료된 수리를 보여주는 사진 업로드",
      billPhotosLabel: "청구서/영수증 사진（선택사항）：",
      billPhotosDesc: "수리 청구서 또는 영수증 사진 업로드",
      addCompletionPhotos: "완료 사진 추가",
      addBillPhotos: "청구서 사진 추가",
      uploading: "업로드 중...",
      updateNotify: "상태 업데이트 및 세입자에게 알림",
      updating: "업데이트 중...",
      invalidToken: "유효하지 않거나 누락된 토큰",
      requestNotFound: "유지보수 요청을 찾을 수 없음",
      failedToLoad: "요청 로드 실패",
      uploadFailed: "사진 업로드 실패. 다시 시도하세요.",
      updateFailed: "상태 업데이트 실패"
    }
  };

  const language = user?.language || 'en';
  const strings = t[language] || t.en;

  const loadMaintenanceRequest = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setError(strings.invalidToken);
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('acknowledgeMaintenance', {
        token: token,
        action: 'view'
      });

      if (response.data?.maintenanceRequest) {
        setMaintenanceRequest(response.data.maintenanceRequest);
        if (response.data.maintenanceRequest.status === 'reported') {
          setNewStatus('acknowledged');
        } else {
          setNewStatus(response.data.maintenanceRequest.status);
        }
        setCompletionPhotos(response.data.maintenanceRequest.completion_photo_urls || []);
        setBillPhotos(response.data.maintenanceRequest.bill_photo_urls || []);
        setActualCost(response.data.maintenanceRequest.actual_cost?.toString() || '');
      } else {
        setError(strings.requestNotFound);
      }
    } catch (err) {
      console.error('Failed to load maintenance request:', err);
      setError(err.message || strings.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const photoUrls = uploadResults.map(result => result.file_url);
      
      if (type === 'completion') {
        setCompletionPhotos(prev => [...prev, ...photoUrls]);
      } else if (type === 'bill') {
        setBillPhotos(prev => [...prev, ...photoUrls]);
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert(strings.uploadFailed);
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index, type) => {
    if (type === 'completion') {
      setCompletionPhotos(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'bill') {
      setBillPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      const urlRole = new URLSearchParams(window.location.search).get('role') || 'landlord';
      const response = await base44.functions.invoke('acknowledgeMaintenance', {
        token: token,
        action: 'update',
        status: newStatus,
        message: landlordResponse || `Status updated to ${newStatus}`,
        role: urlRole,
        landlordResponse: landlordResponse,
        actualCost: actualCost ? parseFloat(actualCost) : undefined,
        completionPhotoUrls: completionPhotos,
        billPhotoUrls: billPhotos
      });

      if (response.data?.success) {
        setSuccess(true);
      } else {
        setError(strings.updateFailed);
      }
    } catch (err) {
      console.error('Failed to update:', err);
      setError(err.message || strings.updateFailed);
    } finally {
      setUpdating(false);
    }
  };

  const colors = {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-ls-forest" />
          <p className="text-lg" style={{ color: colors.textSecondary }}>{strings.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md w-full border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.error}</h2>
            <p style={{ color: colors.textSecondary }}>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md w-full border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {strings.updateSuccessful}
            </h2>
            <p className="mb-6" style={{ color: colors.textSecondary }}>
              {strings.tenantNotified}
            </p>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {strings.status}: <span className="text-ls-forest">{newStatus.toUpperCase()}</span>
              </p>
              {completionPhotos.length > 0 && (
                <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                  {completionPhotos.length} {strings.completionPhotos}
                </p>
              )}
              {billPhotos.length > 0 && (
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {billPhotos.length} {strings.billPhotos}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              {strings.maintenanceRequest}
            </h1>
          </div>
          <p style={{ color: colors.textSecondary }}>{strings.updateStatus}</p>
        </div>

        <Card className="border-none shadow-xl mb-6" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="text-xl" style={{ color: colors.textPrimary }}>
              {maintenanceRequest?.issue_title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.description}</p>
                <p style={{ color: colors.textPrimary }}>{maintenanceRequest?.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.category}</p>
                  <p style={{ color: colors.textPrimary }}>{maintenanceRequest?.category}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.priority}</p>
                  <p style={{ color: colors.textPrimary }} className="capitalize">{maintenanceRequest?.priority}</p>
                </div>
              </div>

              {maintenanceRequest?.property_address && (
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.property}</p>
                  <p style={{ color: colors.textPrimary }}>{maintenanceRequest.property_address}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.reported}</p>
                <p style={{ color: colors.textPrimary }}>
                  {maintenanceRequest?.reported_date && new Date(maintenanceRequest.reported_date).toLocaleDateString()}
                </p>
              </div>

              {maintenanceRequest?.photo_urls && maintenanceRequest.photo_urls.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>{strings.tenantPhotos}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {maintenanceRequest.photo_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        style={{ border: `1px solid ${colors.borderColor}` }}
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Clock className="w-5 h-5 text-ls-gold" />
              {strings.updateStatusDoc}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  {strings.newStatus}
                </Label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 border-2 rounded-lg"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                >
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  {strings.response}
                </Label>
                <Textarea
                  value={landlordResponse}
                  onChange={(e) => setLandlordResponse(e.target.value)}
                  placeholder={strings.responsePlaceholder}
                  rows={4}
                  className="w-full p-3 border-2 rounded-lg"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <Receipt className="w-4 h-4 inline mr-1" />
                  {strings.actualCost}
                </Label>
                <Input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder={strings.actualCostPlaceholder}
                  className="w-full p-3 border-2 rounded-lg"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <Camera className="w-4 h-4 inline mr-1" />
                  {strings.completionPhotosLabel}
                </Label>
                <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                  {strings.completionPhotosDesc}
                </p>

                {completionPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {completionPhotos.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Completion ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                          style={{ border: `1px solid ${colors.borderColor}` }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index, 'completion')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label
                  className="flex items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition-all border-2 border-dashed"
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0C3B2E';
                    e.currentTarget.style.backgroundColor = '#ECEFED';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoUpload(e, 'completion')}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                  {uploadingPhotos ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">{strings.uploading}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span className="font-medium">{strings.addCompletionPhotos}</span>
                    </>
                  )}
                </label>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  <Receipt className="w-4 h-4 inline mr-1" />
                  {strings.billPhotosLabel}
                </Label>
                <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                  {strings.billPhotosDesc}
                </p>

                {billPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {billPhotos.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Bill ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                          style={{ border: `1px solid ${colors.borderColor}` }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index, 'bill')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label
                  className="flex items-center justify-center gap-2 p-4 rounded-lg cursor-pointer transition-all border-2 border-dashed"
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C7A338';
                    e.currentTarget.style.backgroundColor = '#ECEFED';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoUpload(e, 'bill')}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                  {uploadingPhotos ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">{strings.uploading}</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-5 h-5" />
                      <span className="font-medium">{strings.addBillPhotos}</span>
                    </>
                  )}
                </label>
              </div>

              <Button
                onClick={handleUpdate}
                disabled={updating || uploadingPhotos}
                className="w-full bg-ls-forest hover:bg-ls-forest/90 text-white py-3 text-lg font-bold"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {strings.updating}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {strings.updateNotify}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}