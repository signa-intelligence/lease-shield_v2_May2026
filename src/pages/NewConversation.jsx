import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageCircle, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NewConversation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    recipient_type: 'landlord',
    subject: '',
    message: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data) => {
      const recipientEmail = data.recipient_type === 'landlord' 
        ? user?.landlord_email 
        : user?.juristic_email;
      
      const recipientName = data.recipient_type === 'landlord'
        ? user?.landlord_name
        : user?.juristic_name;

      if (!recipientEmail) {
        throw new Error(language === 'th' 
          ? 'กรุณาเพิ่มข้อมูลติดต่อในหน้าบัญชีก่อน' 
          : 'Please add contact info in Account page first');
      }

      // Create conversation
      const conversation = await base44.entities.Conversation.create({
        participants: [
          {
            email: user.email,
            name: user.full_name,
            role: 'tenant'
          },
          {
            email: recipientEmail,
            name: recipientName || strings[data.recipient_type],
            role: data.recipient_type
          }
        ],
        subject: data.subject,
        last_message: data.message.substring(0, 100),
        last_message_at: new Date().toISOString(),
        unread_count: {
          [recipientEmail]: 1
        },
        status: 'active'
      });

      // Create first message
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_email: user.email,
        sender_name: user.full_name,
        sender_role: 'tenant',
        content: data.message,
        read_by: [user.email]
      });

      // Send notification
      await base44.functions.invoke('sendMessageNotification', {
        recipientEmail: recipientEmail,
        recipientName: recipientName,
        senderName: user.full_name,
        subject: data.subject,
        messagePreview: data.message.substring(0, 100),
        conversationId: conversation.id
      });

      return conversation;
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(createPageUrl("Conversation") + `?id=${conversation.id}`);
    },
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    inputBg: isDarkMode ? '#353A3D' : '#FFFFFF'
  };

  const t = {
    en: {
      newMessage: "New Message",
      back: "Back",
      recipient: "Send To",
      landlord: "Landlord",
      juristic: "Juristic Office",
      subject: "Subject",
      subjectPlaceholder: "What is this about?",
      message: "Message",
      messagePlaceholder: "Type your message...",
      send: "Send Message",
      sending: "Sending...",
      rentInquiry: "Rent Payment Inquiry",
      maintenanceRequest: "Maintenance Request",
      depositQuestion: "Deposit Question",
      leaseQuestion: "Lease Question",
      general: "General Message"
    },
    th: {
      newMessage: "ข้อความใหม่",
      back: "กลับ",
      recipient: "ส่งถึง",
      landlord: "เจ้าของบ้าน",
      juristic: "นิติบุคคล",
      subject: "หัวข้อ",
      subjectPlaceholder: "เกี่ยวกับอะไร?",
      message: "ข้อความ",
      messagePlaceholder: "พิมพ์ข้อความของคุณ...",
      send: "ส่งข้อความ",
      sending: "กำลังส่ง...",
      rentInquiry: "สอบถามการชำระค่าเช่า",
      maintenanceRequest: "แจ้งซ่อม",
      depositQuestion: "คำถามเกี่ยวกับเงินมัดจำ",
      leaseQuestion: "คำถามเกี่ยวกับสัญญาเช่า",
      general: "ข้อความทั่วไป"
    }
  };

  const strings = t[language];

  const handleSubmit = (e) => {
    e.preventDefault();
    createConversationMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Messages"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.back}
        </Button>

        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{
            backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
            borderBottom: `1px solid ${colors.borderColor}`
          }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <MessageCircle className="w-6 h-6 text-ls-forest" />
              {strings.newMessage}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="recipient_type" style={{ color: colors.textPrimary }}>
                  {strings.recipient}
                </Label>
                <Select
                  value={formData.recipient_type}
                  onValueChange={(value) => setFormData({...formData, recipient_type: value})}
                >
                  <SelectTrigger style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg }}>
                    <SelectItem value="landlord">{strings.landlord}</SelectItem>
                    <SelectItem value="juristic">{strings.juristic}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject" style={{ color: colors.textPrimary }}>
                  {strings.subject}
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder={strings.subjectPlaceholder}
                  required
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[strings.rentInquiry, strings.maintenanceRequest, strings.depositQuestion, strings.leaseQuestion].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setFormData({...formData, subject: suggestion})}
                      className="text-xs px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                        color: colors.textSecondary,
                        border: `1px solid ${colors.borderColor}`
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="message" style={{ color: colors.textPrimary }}>
                  {strings.message}
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder={strings.messagePlaceholder}
                  rows={6}
                  required
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.borderColor,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <Button
                type="submit"
                disabled={createConversationMutation.isPending}
                className="w-full bg-ls-forest hover:bg-ls-forest/90 py-6"
              >
                {createConversationMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {strings.sending}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {strings.send}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}