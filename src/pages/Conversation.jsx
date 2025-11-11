import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Paperclip, FileText, Loader2, User, Mail } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MessageTemplateSelector from "../components/messages/MessageTemplateSelector";

export default function ConversationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => base44.entities.Conversation.filter({ id: conversationId }),
    enabled: !!conversationId,
    select: (data) => data[0],
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversationId }, 'created_date'),
    enabled: !!conversationId,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Mark messages as read
  useEffect(() => {
    if (!messages.length || !user?.email) return;

    const unreadMessages = messages.filter(m => 
      m.sender_email !== user.email && 
      (!m.read_by || !m.read_by.includes(user.email))
    );

    unreadMessages.forEach(async (msg) => {
      const readBy = msg.read_by || [];
      if (!readBy.includes(user.email)) {
        await base44.entities.Message.update(msg.id, {
          read_by: [...readBy, user.email]
        });
      }
    });

    // Update conversation unread count
    if (conversation && unreadMessages.length > 0) {
      const unreadCount = conversation.unread_count || {};
      unreadCount[user.email] = 0;
      base44.entities.Conversation.update(conversation.id, { unread_count: unreadCount });
    }
  }, [messages, user, conversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const message = await base44.entities.Message.create(data);
      
      // Update conversation
      const otherParticipants = conversation.participants.filter(p => p.email !== user.email);
      const newUnreadCount = conversation.unread_count || {};
      otherParticipants.forEach(p => {
        newUnreadCount[p.email] = (newUnreadCount[p.email] || 0) + 1;
      });

      await base44.entities.Conversation.update(conversationId, {
        last_message: data.content.substring(0, 100),
        last_message_at: new Date().toISOString(),
        unread_count: newUnreadCount
      });

      // Send notifications
      for (const participant of otherParticipants) {
        await base44.functions.invoke('sendMessageNotification', {
          recipientEmail: participant.email,
          recipientName: participant.name,
          senderName: user.full_name,
          subject: conversation.subject,
          messagePreview: data.content.substring(0, 100),
          conversationId: conversationId
        });
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageText('');
      setAttachments([]);
    },
  });

  const handleSend = () => {
    if (!messageText.trim()) return;

    const userParticipant = conversation.participants.find(p => p.email === user.email);

    sendMessageMutation.mutate({
      conversation_id: conversationId,
      sender_email: user.email,
      sender_name: user.full_name,
      sender_role: userParticipant?.role || 'tenant',
      content: messageText,
      attachments: attachments
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            url: file_url,
            name: file.name,
            type: file.type
          };
        })
      );
      setAttachments([...attachments, ...uploadedFiles]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    const content = language === 'th' ? template.content_th : template.content_en;
    setMessageText(content);
    setShowTemplates(false);
  };

  const language_str = user?.language || 'en';
  const isDark = user?.theme === 'dark';

  const otherParticipant = getOtherParticipant(conversation);

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Loader2 className="w-8 h-8 animate-spin text-ls-forest" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3" style={{
        backgroundColor: colors.cardBg,
        borderBottomColor: colors.borderColor
      }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(createPageUrl("Messages"))}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-bold" style={{ color: colors.textPrimary }}>
            {otherParticipant?.name || strings[otherParticipant?.role]}
          </h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {conversation.subject}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_email === user?.email;
          
          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isOwn && (
                  <div className="flex items-center gap-2 px-2">
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#C7A338',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                      {message.sender_name}
                    </p>
                  </div>
                )}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: isOwn ? '#0C3B2E' : (isDarkMode ? '#353A3D' : '#F3F4F6'),
                    color: isOwn ? '#FFFFFF' : colors.textPrimary
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  {message.attachments?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : (isDarkMode ? '#2A2D30' : '#FFFFFF')
                          }}
                        >
                          <Paperclip className="w-4 h-4" />
                          <span className="text-xs truncate">{att.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs px-2" style={{ color: colors.textSecondary }}>
                  {format(new Date(message.created_date), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="border-t p-4" style={{
        backgroundColor: colors.cardBg,
        borderTopColor: colors.borderColor
      }}>
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                  color: colors.textPrimary
                }}
              >
                <FileText className="w-3 h-3" />
                <span>{att.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowTemplates(true)}
            disabled={sendMessageMutation.isPending}
          >
            <FileText className="w-5 h-5" />
          </Button>
          <label>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="icon"
              disabled={uploading}
              asChild
            >
              <span>
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
              </span>
            </Button>
          </label>
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={language === 'th' ? 'พิมพ์ข้อความ...' : 'Type a message...'}
            className="flex-1 min-h-[44px] max-h-[120px]"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
              color: colors.textPrimary
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-ls-forest hover:bg-ls-forest/90"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      <MessageTemplateSelector
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}