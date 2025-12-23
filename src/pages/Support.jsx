import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, CheckCircle2, HelpCircle, Upload, ArrowRight, AlertCircle, Send } from "lucide-react";
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
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  const validationSchema = {
    subject: [
      (v) => validators.required(v, 'Subject'),
      (v) => validators.minLength(v, 5, 'Subject')
    ],
    description: [
      (v) => validators.required(v, 'Description'),
      (v) => validators.minLength(v, 20, 'Description'),
      (v) => validators.maxLength(v, 500, 'Description')
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
    mutationFn: async (data) => {
      const { data: response } = await base44.functions.invoke('createSupportTicket', data);
      return response;
    },
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

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);
    haptic.medium();

    try {
      const { data: response } = await base44.functions.invoke('replyToTicket', {
        ticketId: selectedTicket.id,
        message: replyMessage,
        attachments: []
      });

      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        setReplyMessage('');
        toast.success(language === 'th' ? 'ส่งข้อความสำเร็จ' : 'Reply sent');
        haptic.success();
        
        // Refresh selected ticket
        const updated = await base44.entities.SupportTicket.filter({ id: selectedTicket.id });
        setSelectedTicket(updated[0]);
      }
    } catch (error) {
      console.error('Reply failed:', error);
      toast.error(language === 'th' ? 'ส่งข้อความล้มเหลว' : 'Failed to send reply');
      haptic.error();
    } finally {
      setSendingReply(false);
    }
  };

  const handleTicketClick = async (ticket) => {
    haptic.light();
    setSelectedTicket(ticket);
    
    // Mark admin reply as read
    if (ticket.has_unread_admin_reply) {
      try {
        await base44.entities.SupportTicket.update(ticket.id, {
          has_unread_admin_reply: false
        });
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
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
      back: "Back",
      ticketDetails: "Ticket Details",
      conversation: "Conversation",
      yourMessage: "Your message",
      sendReply: "Send Reply",
      sending: "Sending...",
      ticketNumber: "Ticket #",
      openedOn: "Opened on",
      lastUpdate: "Last updated",
      closeTicket: "Close Ticket",
      newReply: "New Reply from Support",
      you: "You"
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
      back: "กลับ",
      ticketDetails: "รายละเอียดคำขอ",
      conversation: "การสนทนา",
      yourMessage: "ข้อความของคุณ",
      sendReply: "ส่งตอบกลับ",
      sending: "กำลังส่ง...",
      ticketNumber: "คำขอ #",
      openedOn: "เปิดเมื่อ",
      lastUpdate: "อัปเดตล่าสุด",
      closeTicket: "ปิดคำขอ",
      newReply: "ตอบกลับใหม่จากทีมสนับสนุน",
      you: "คุณ"
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
                      <option value="documents">Document & Template</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <MobileFormInput
                      label={strings.description}
                      multiline
                      rows={5}
                      value={formData.description}
                      onChange={(e) => {
                        const newValue = e.target.value.slice(0, 500);
                        handleChange('description', newValue);
                      }}
                      onBlur={() => handleBlur('description')}
                      placeholder={language === 'th' ? 'กรุณาระบุรายละเอียดให้มากที่สุด...' : 'Please provide as much detail as possible...'}
                      required
                      error={errors.description}
                      colors={colors}
                      maxLength={500}
                    />
                    <div className="text-xs text-right mt-1" style={{ color: colors.textSecondary }}>
                      {formData.description.length}/500
                    </div>
                  </div>
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
                        {uploading 
                          ? (language === 'th' ? 'กำลังอัปโหลด...' : language === 'zh' ? '上传中...' : language === 'ja' ? 'アップロード中...' : language === 'ko' ? '업로드 중...' : language === 'ru' ? 'Загрузка...' : 'Uploading...') 
                          : (language === 'th' ? 'อัปโหลดรูปภาพและไฟล์' : language === 'zh' ? '上传照片和文件' : language === 'ja' ? '写真とファイルをアップロード' : language === 'ko' ? '사진 및 파일 업로드' : language === 'ru' ? 'Загрузить фото и файлы' : 'Upload photos and files')}
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*,application/pdf,.pdf,.doc,.docx,.txt"
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
                      className="border-none shadow-md hover:shadow-xl transition-all duration-200 card-hover-lift cursor-pointer"
                      style={{ 
                        backgroundColor: colors.cardBg,
                        border: ticket.has_unread_admin_reply ? '2px solid #10B981' : 'none'
                      }}
                      onClick={() => handleTicketClick(ticket)}
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
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-base break-words" style={{ color: colors.textPrimary }}>
                                  {ticket.subject}
                                </p>
                                {ticket.has_unread_admin_reply && (
                                  <Badge className="bg-emerald-500 text-white text-xs animate-pulse">
                                    {language === 'th' ? 'ใหม่' : 'NEW'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                                {ticket.ticket_number} • {format(new Date(ticket.created_date), 'MMM d, yyyy')}
                              </p>
                              {ticket.messages && ticket.messages.length > 1 && (
                                <p className="text-xs" style={{ color: '#10B981' }}>
                                  💬 {ticket.messages.length} {language === 'th' ? 'ข้อความ' : 'messages'}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge className={`${statusConfig.color} text-xs flex-shrink-0`}>
                              {statusConfig.label}
                            </Badge>
                            <ArrowRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                          </div>
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

        {/* Ticket Detail Dialog */}
        {selectedTicket && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedTicket(null)}
          >
            <div
              className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl"
              style={{ backgroundColor: colors.cardBg }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b" style={{ borderBottomColor: colors.borderColor }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-5 h-5 text-ls-forest" />
                      <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>
                        {strings.ticketDetails}
                      </h3>
                    </div>
                    <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                      {strings.ticketNumber}{selectedTicket.ticket_number}
                    </p>
                    <p className="font-semibold" style={{ color: colors.textPrimary }}>
                      {selectedTicket.subject}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={STATUS_CONFIG[selectedTicket.status].color}>
                      {STATUS_CONFIG[selectedTicket.status].label}
                    </Badge>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      style={{ color: colors.textSecondary }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h4 className="font-semibold text-sm mb-4" style={{ color: colors.textPrimary }}>
                  {strings.conversation}
                </h4>
                {selectedTicket.messages?.map((msg, idx) => {
                  const isUser = msg.sender_type === 'user';
                  const isAdminReply = msg.sender_type === 'admin';
                  
                  return (
                    <div
                      key={idx}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[80%] p-4 rounded-2xl"
                        style={{
                          backgroundColor: isUser 
                            ? '#0C3B2E'
                            : (isAdminReply ? '#10B981' : (isDarkMode ? '#374151' : '#F3F4F6')),
                          color: (isUser || isAdminReply) ? '#FFFFFF' : colors.textPrimary
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs font-semibold" style={{ 
                            color: (isUser || isAdminReply) ? '#FFFFFF' : colors.textSecondary,
                            opacity: 0.9
                          }}>
                            {isUser ? strings.you : msg.sender_name}
                          </p>
                          <p className="text-xs" style={{ 
                            color: (isUser || isAdminReply) ? '#FFFFFF' : colors.textSecondary,
                            opacity: 0.7
                          }}>
                            {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <p className="text-xs mt-2" style={{ 
                            color: (isUser || isAdminReply) ? '#FFFFFF' : colors.textSecondary,
                            opacity: 0.8
                          }}>
                            📎 {msg.attachments.length} {language === 'th' ? 'ไฟล์' : 'file(s)'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-6 border-t" style={{ borderTopColor: colors.borderColor }}>
                  <div className="flex gap-3">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder={strings.yourMessage}
                      rows={3}
                      className="flex-1 p-3 rounded-lg border-2 resize-none"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary,
                        fontSize: '16px'
                      }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || sendingReply}
                      className="btn-interaction h-fit"
                      style={{
                        backgroundColor: (!replyMessage.trim() || sendingReply) ? '#9CA3AF' : '#0C3B2E',
                        color: '#FFFFFF',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: (!replyMessage.trim() || sendingReply) ? 'not-allowed' : 'pointer',
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Send className="w-4 h-4" />
                      <span className="font-semibold">
                        {sendingReply ? strings.sending : strings.sendReply}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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