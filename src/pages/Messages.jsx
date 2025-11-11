import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, Search, Users, Mail, Clock, Archive } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";

export default function Messages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('active');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: conversations = [], refetch } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.filter({
        participants: { $elemMatch: { email: user?.email } },
        status: filter
      }, '-last_message_at');
      return convos;
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    unreadBg: isDarkMode ? '#1E4435' : '#ECFDF5',
    hoverBg: isDarkMode ? '#353A3D' : '#F8FAFC'
  };

  const t = {
    en: {
      messages: "Messages",
      subtitle: "Communicate with landlords and juristic offices",
      newConversation: "New Message",
      search: "Search conversations...",
      active: "Active",
      archived: "Archived",
      noConversations: "No Conversations",
      noConversationsDesc: "Start a conversation with your landlord or juristic office",
      unread: "unread",
      you: "You",
      landlord: "Landlord",
      juristic: "Juristic",
      tenant: "Tenant"
    },
    th: {
      messages: "ข้อความ",
      subtitle: "สื่อสารกับเจ้าของบ้านและนิติบุคคล",
      newConversation: "ข้อความใหม่",
      search: "ค้นหาการสนทนา...",
      active: "ใช้งาน",
      archived: "เก็บถาวร",
      noConversations: "ไม่มีการสนทนา",
      noConversationsDesc: "เริ่มการสนทนากับเจ้าของบ้านหรือนิติบุคคลของคุณ",
      unread: "ยังไม่ได้อ่าน",
      you: "คุณ",
      landlord: "เจ้าของบ้าน",
      juristic: "นิติบุคคล",
      tenant: "ผู้เช่า"
    }
  };

  const strings = t[language];

  const filteredConversations = conversations.filter(conv => 
    conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnreadCount = (conversation) => {
    if (!conversation.unread_count || !user?.email) return 0;
    return conversation.unread_count[user.email] || 0;
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p.email !== user?.email);
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-ls-forest" />
            {strings.messages}
          </h1>
          <p className="text-sm md:text-base" style={{ color: colors.textSecondary }}>
            {strings.subtitle}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.textSecondary }} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={strings.search}
              className="pl-10"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.borderColor,
                color: colors.textPrimary
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
              className={filter === 'active' ? 'bg-ls-forest hover:bg-ls-forest/90' : ''}
            >
              {strings.active}
            </Button>
            <Button
              variant={filter === 'archived' ? 'default' : 'outline'}
              onClick={() => setFilter('archived')}
              className={filter === 'archived' ? 'bg-ls-forest hover:bg-ls-forest/90' : ''}
            >
              <Archive className="w-4 h-4 mr-2" />
              {strings.archived}
            </Button>
          </div>
        </div>

        <Button
          onClick={() => navigate(createPageUrl("NewConversation"))}
          className="w-full mb-6 bg-ls-forest hover:bg-ls-forest/90 py-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          {strings.newConversation}
        </Button>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{
                backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6'
              }}>
                <MessageCircle className="w-10 h-10" style={{ color: colors.textSecondary, opacity: 0.5 }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noConversations}
              </h3>
              <p style={{ color: colors.textSecondary }}>
                {strings.noConversationsDesc}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const otherParticipant = getOtherParticipant(conversation);
              const hasUnread = unreadCount > 0;

              return (
                <Card
                  key={conversation.id}
                  className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer"
                  style={{
                    backgroundColor: hasUnread ? colors.unreadBg : colors.cardBg,
                    borderLeft: hasUnread ? '4px solid #0C3B2E' : 'none'
                  }}
                  onClick={() => navigate(createPageUrl("Conversation") + `?id=${conversation.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#0C3B2E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold truncate" style={{ color: colors.textPrimary }}>
                            {otherParticipant?.name || strings[otherParticipant?.role] || strings.landlord}
                          </h3>
                          {hasUnread && (
                            <Badge className="bg-ls-forest text-white flex-shrink-0">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold mb-1 truncate" style={{ color: colors.textSecondary }}>
                          {conversation.subject}
                        </p>
                        <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                          {conversation.last_message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3" style={{ color: colors.textSecondary }} />
                          <p className="text-xs" style={{ color: colors.textSecondary }}>
                            {conversation.last_message_at 
                              ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
                              : format(new Date(conversation.created_date), 'MMM d, yyyy')
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}