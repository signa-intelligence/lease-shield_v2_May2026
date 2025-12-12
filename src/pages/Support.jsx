import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, CheckCircle2, HelpCircle, Upload } from "lucide-react";
import { format } from "date-fns";
import AuthGuard from "../components/shared/AuthGuard";
import MobileFormInput from "../components/shared/MobileFormInput";
import { useFormValidation, validators } from "../components/shared/FormValidation";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { haptic } from "../components/shared/HapticFeedback";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import SkeletonLoader from "../components/shared/SkeletonLoader";

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800', icon: MessageCircle },
  waiting_user: { label: 'Waiting for You', color: 'bg-purple-100 text-purple-800', icon: HelpCircle },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800', icon: CheckCircle2 }
};

function SupportContent() {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  const validationSchema = {
    subject: [
      (v) => validators.required(v, 'Subject'),
      (v) => validators.minLength(v, 5, 'Subject')
    ],
    description: [
      (v) => validators.required(v, 'Description'),
      (v) => validators.minLength(v, 20, 'Description')
    ]
  };

  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValues
  } = useFormValidation(
    {
      subject: '',
      description: '',
      category: 'technical',
      attachments: []
    },
    validationSchema
  );

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.SupportTicket.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      reset();
      toast.success(language === 'th' ? 'ส่งคำขอสำเร็จ' : 'Ticket submitted successfully');
      haptic.success();
    },
    onError: () => {
      toast.error(language === 'th' ? 'การส่งล้มเหลว' : 'Failed to submit ticket');
      haptic.error();
    }
  });

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    haptic.light();
    
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setValues({ ...formData, attachments: [...formData.attachments, ...urls] });
      toast.success(language === 'th' ? `อัปโหลด ${files.length} ไฟล์สำเร็จ` : `${files.length} file(s) uploaded`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(language === 'th' ? 'การอัปโหลดล้มเหลว' : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      haptic.error();
      toast.error(language === 'th' ? 'กรุณากรอกข้อมูลให้ถูกต้อง' : 'Please fix form errors');
      return;
    }
    
    haptic.medium();
    createTicketMutation.mutate(formData);
  };

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    inputBg: isDarkMode ? '#353A3D' : '#FFFFFF',
  };

  const t = {
    en: {
      title: "Help & Support",
      subtitle: "We're here to help you protect your rights",
      submitTicket: "Submit Support Request",
      subject: "Subject",
      description: "Description",
      category: "Category",
      attachments: "Attachments",
      uploadFiles: "Upload Files",
      submitButton: "Submit Ticket",
      myTickets: "My Support Tickets",
      noTickets: "No Support Tickets",
      noTicketsSub: "Need help? Submit a support request and we'll get back to you.",
      recentTickets: "Recent Tickets",
      back: "Back"
    },
    th: {
      title: "ความช่วยเหลือและการสนับสนุน",
      subtitle: "เราพร้อมช่วยคุณปกป้องสิทธิ์ของคุณ",
      submitTicket: "ส่งคำขอสนับสนุน",
      subject: "หัวข้อ",
      description: "รายละเอียด",
      category: "หมวดหมู่",
      attachments: "ไฟล์แนบ",
      uploadFiles: "อัปโหลดไฟล์",
      submitButton: "ส่งคำขอ",
      myTickets: "คำขอสนับสนุนของฉัน",
      noTickets: "ไม่มีคำขอสนับสนุน",
      noTicketsSub: "ต้องการความช่วยเหลือ? ส่งคำขอสนับสนุนและเราจะติดต่อกลับ",
      recentTickets: "คำขอล่าสุด",
      back: "กลับ"
    },
    zh: {
      title: "帮助与支持",
      subtitle: "我们随时帮助您保护您的权利",
      submitTicket: "提交支持请求",
      subject: "主题",
      description: "描述",
      category: "类别",
      attachments: "附件",
      uploadFiles: "上传文件",
      submitButton: "提交工单",
      myTickets: "我的支持工单",
      noTickets: "没有支持工单",
      noTicketsSub: "需要帮助？提交支持请求，我们会回复您。",
      recentTickets: "最近的工单",
      back: "返回"
    },
    ja: {
      title: "ヘルプとサポート",
      subtitle: "あなたの権利を守るお手伝いをします",
      submitTicket: "サポートリクエストを送信",
      subject: "件名",
      description: "説明",
      category: "カテゴリー",
      attachments: "添付ファイル",
      uploadFiles: "ファイルをアップロード",
      submitButton: "チケットを送信",
      myTickets: "私のサポートチケット",
      noTickets: "サポートチケットなし",
      noTicketsSub: "助けが必要ですか？サポートリクエストを送信すれば、ご連絡します。",
      recentTickets: "最近のチケット",
      back: "戻る"
    },
    ko: {
      title: "도움말 및 지원",
      subtitle: "귀하의 권리를 보호하는 데 도움을 드립니다",
      submitTicket: "지원 요청 제출",
      subject: "제목",
      description: "설명",
      category: "카테고리",
      attachments: "첨부파일",
      uploadFiles: "파일 업로드",
      submitButton: "티켓 제출",
      myTickets: "내 지원 티켓",
      noTickets: "지원 티켓 없음",
      noTicketsSub: "도움이 필요하신가요? 지원 요청을 제출하시면 연락드리겠습니다.",
      recentTickets: "최근 티켓",
      back: "뒤로"
    }
  };

  const strings = t[language] || t.en;

  return (
    <div className="min-h-screen p-4 md:p-6 page-transition" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={strings.title}
          subtitle={strings.subtitle}
          icon={MessageCircle}
          iconColor="#0C3B2E"
          isDarkMode={isDarkMode}
          showBack={true}
          backLabel={strings.back}
        />

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Side - Submit Form (2/5) */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
              <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <MessageCircle className="w-5 h-5 text-ls-forest" />
                  {strings.submitTicket}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <MobileFormInput
                    label={strings.subject}
                    type="text"
                    value={formData.subject}
                    onChange={(e) => {
                      handleChange('subject', e.target.value);
                    }}
                    onBlur={() => handleBlur('subject')}
                    placeholder={language === 'th' ? 'สรุปปัญหาโดยย่อ' : 'Brief description of your issue'}
                    required
                    error={errors.subject}
                    colors={colors}
                  />

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.category}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
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
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="deposit">Deposit</option>
                      <option value="scan">Lease Scan</option>
                      <option value="legal">Legal Question</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <MobileFormInput
                    label={strings.description}
                    multiline
                    rows={5}
                    value={formData.description}
                    onChange={(e) => {
                      handleChange('description', e.target.value);
                    }}
                    onBlur={() => handleBlur('description')}
                    placeholder={language === 'th' ? 'กรุณาระบุรายละเอียดให้มากที่สุด...' : 'Please provide as much detail as possible...'}
                    required
                    error={errors.description}
                    colors={colors}
                  />
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.attachments}
                    </label>
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-ls-forest transition-all"
                      style={{
                        borderColor: colors.borderColor,
                        backgroundColor: colors.fieldBg,
                        minHeight: '80px'
                      }}
                    >
                      <Upload className="w-5 h-5" style={{ color: colors.textSecondary }} />
                      <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                        {uploading ? (language === 'th' ? 'กำลังอัปโหลด...' : 'Uploading...') : strings.uploadFiles}
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {formData.attachments.length > 0 && (
                      <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                        {formData.attachments.length} {language === 'th' ? 'ไฟล์แนบ' : 'file(s) attached'}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending || uploading}
                    className="w-full btn-interaction"
                    style={{
                      backgroundColor: (createTicketMutation.isPending || uploading) ? '#9CA3AF' : '#0C3B2E',
                      color: '#FFFFFF',
                      padding: '14px',
                      fontSize: '16px',
                      fontWeight: '700',
                      minHeight: '52px'
                    }}
                  >
                    {createTicketMutation.isPending ? (language === 'th' ? 'กำลังส่ง...' : 'Submitting...') : strings.submitButton}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Tickets List (3/5) */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>{strings.recentTickets}</h3>
            {ticketsLoading ? (
              <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
            ) : tickets.length === 0 ? (
              <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
                <CardContent className="p-0">
                  <EmptyState
                    icon={MessageCircle}
                    title={strings.noTickets}
                    description={strings.noTicketsSub}
                    isDarkMode={isDarkMode}
                    compact={true}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card 
                      key={ticket.id} 
                      className="border-none shadow-md hover:shadow-xl transition-all duration-200 card-hover-lift"
                      style={{ backgroundColor: colors.cardBg }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div 
                              className="p-2.5 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: isDarkMode ? '#374151' : '#F3F6F5' }}
                            >
                              <StatusIcon className="w-5 h-5 text-ls-forest" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base mb-1 break-words" style={{ color: colors.textPrimary }}>
                                {ticket.subject}
                              </p>
                              <p className="text-xs" style={{ color: colors.textSecondary }}>
                                {language === 'th' ? 'เปิดเมื่อ' : 'Opened'} {format(new Date(ticket.created_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${statusConfig.color} text-xs flex-shrink-0 ml-2`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                          <p className="text-sm line-clamp-2 break-words" style={{ color: colors.textSecondary }}>
                            {ticket.description}
                          </p>
                        </div>
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                            📎 {ticket.attachments.length} {language === 'th' ? 'ไฟล์แนบ' : 'attachment(s)'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Support() {
  return (
    <AuthGuard>
      <ToastProvider>
        <SupportContent />
      </ToastProvider>
    </AuthGuard>
  );
}