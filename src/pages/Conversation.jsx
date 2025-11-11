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

function getOtherParticipant(conversation) {
  return conversation?.participants?.find(p => p.email !== window.currentUserEmail);
}

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

  // Store user email globally for helper function
  useEffect(() => {
    if (user?.email) {
      window.currentUserEmail = user.email;
    }
  }, [user]);

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
    refetchInterval: 3000,
  });

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

    if (conversation && unreadMessages.length > 0) {
      const unreadCount = conversation.unread_count || {};
      unreadCount[user.email] = 0;
      base44.entities.Conversation.update(conversation.id, { unread_count: unreadCount });
    }
  }, [messages, user, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const message = await base44.entities.Message.create(data);
      
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

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB'
  };

  const strings = {
    en: {
      landlord: "Landlord",
      juristic: "Juristic",
      tenant: "Tenant"
    },
    th: {
      landlord: "เจ้าของบ้าน",
      juristic: "นิติบุคคล",
      tenant: "ผู้เช่า"
    }
  }[language];

  const otherParticipant = getOtherParticipant(conversation);

  if (!conversation) {
    return (
      <div style={{ 
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg 
      }}>
        <Loader2 className="w-8 h-8 animate-spin text-ls-forest" />
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 144px)',
      backgroundColor: colors.bg
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${colors.borderColor}`,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: colors.cardBg,
        flexShrink: 0
      }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(createPageUrl("Messages"))}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div style={{ flex: 1 }}>
          <h2 className="font-bold" style={{ color: colors.textPrimary }}>
            {otherParticipant?.name || strings[otherParticipant?.role]}
          </h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {conversation.subject}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => {
          const isOwn = message.sender_email === user?.email;
          
          return (
            <div key={message.id} style={{ 
              display: 'flex',
              justifyContent: isOwn ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
                gap: '4px'
              }}>
                {!isOwn && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                  }}>
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
                    <p style={{ 
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.textSecondary 
                    }}>
                      {message.sender_name}
                    </p>
                  </div>
                )}
                <div style={{
                  borderRadius: '16px',
                  padding: '16px',
                  backgroundColor: isOwn ? '#0C3B2E' : (isDarkMode ? '#353A3D' : '#F3F4F6'),
                  color: isOwn ? '#FFFFFF' : colors.textPrimary
                }}>
                  <p style={{ 
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {message.content}
                  </p>
                  {message.attachments?.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {message.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px',
                            borderRadius: '8px',
                            backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : (isDarkMode ? '#2A2D30' : '#FFFFFF'),
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <Paperclip className="w-4 h-4" />
                          <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <p style={{ 
                  fontSize: '12px',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                  color: colors.textSecondary 
                }}>
                  {format(new Date(message.created_date), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div style={{
        borderTop: `1px solid ${colors.borderColor}`,
        padding: '16px',
        backgroundColor: colors.cardBg,
        flexShrink: 0
      }}>
        {attachments.length > 0 && (
          <div style={{ 
            marginBottom: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {attachments.map((att, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
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
        <div style={{ display: 'flex', gap: '8px' }}>
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