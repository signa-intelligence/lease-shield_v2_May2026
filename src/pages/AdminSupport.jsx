import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Clock, CheckCircle2, HelpCircle, Send, Paperclip, User, ArrowLeft, AlertCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import AuthGuard from "../components/shared/AuthGuard";
import { haptic } from "../components/shared/HapticFeedback";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import { ToastProvider, useToast } from "../components/shared/Toast";

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800', icon: MessageCircle },
  waiting_user: { label: 'Waiting for User', color: 'bg-purple-100 text-purple-800', icon: HelpCircle },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800', icon: CheckCircle2 }
};

function AdminSupportContent() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAuthorized = user && (
    ['admin', 'super_admin', 'va'].includes(user?.access_level) ||
    ['admin', 'super_admin', 'va'].includes(user?.role)
  );

  const { data: allTickets = [], isLoading } = useQuery({
    queryKey: ['adminTickets'],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.SupportTicket.list('-created_date');
      return Array.isArray(result) ? result : [];
    },
    enabled: isAuthorized,
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => base44.asServiceRole.entities.SupportTicket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    }
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
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>Access Denied</h2>
            <p style={{ color: colors.textSecondary }}>Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
        setReplyMessage('');
        toast.success('Reply sent to user');
        haptic.success();
        
        const updated = await base44.asServiceRole.entities.SupportTicket.filter({ id: selectedTicket.id });
        setSelectedTicket(updated[0]);
      }
    } catch (error) {
      console.error('Reply failed:', error);
      toast.error('Failed to send reply');
      haptic.error();
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;

    const updateData = { status: newStatus };
    
    if (newStatus === 'resolved') {
      updateData.resolved_date = new Date().toISOString();
    }
    
    if (newStatus === 'closed') {
      updateData.closed_date = new Date().toISOString();
    }

    if (newStatus === 'waiting_user') {
      updateData.last_response_by = 'admin';
    }

    await updateTicketMutation.mutateAsync({
      id: selectedTicket.id,
      data: updateData
    });

    const updated = await base44.asServiceRole.entities.SupportTicket.filter({ id: selectedTicket.id });
    setSelectedTicket(updated[0]);
    toast.success('Status updated');
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;

    await updateTicketMutation.mutateAsync({
      id: selectedTicket.id,
      data: { admin_notes: adminNotes }
    });

    toast.success('Notes saved');
  };

  const handleAssignToMe = async () => {
    if (!selectedTicket) return;

    await updateTicketMutation.mutateAsync({
      id: selectedTicket.id,
      data: { assigned_to: user.email }
    });

    const updated = await base44.asServiceRole.entities.SupportTicket.filter({ id: selectedTicket.id });
    setSelectedTicket(updated[0]);
    toast.success('Assigned to you');
  };

  // Check for ticketId in URL
  React.useEffect(() => {
    if (!allTickets || allTickets.length === 0) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const ticketIdFromUrl = urlParams.get('ticketId');

    if (ticketIdFromUrl) {
      const ticketToOpen = allTickets.find(t => t && t.id === ticketIdFromUrl);
      if (ticketToOpen) {
        setSelectedTicket(ticketToOpen);
        setAdminNotes(ticketToOpen.admin_notes || '');
      }
    }
  }, [allTickets]);

  const filteredTickets = filterStatus === 'all' 
    ? allTickets 
    : (allTickets || []).filter(t => t && t.status === filterStatus);

  const openTickets = (allTickets || []).filter(t => t && t.status === 'open');
  const inProgressTickets = (allTickets || []).filter(t => t && t.status === 'in_progress');
  const waitingUserTickets = (allTickets || []).filter(t => t && t.status === 'waiting_user');

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Support Tickets"
          subtitle="Manage user support requests and inquiries"
          icon={MessageCircle}
          iconColor="#0C3B2E"
          isDarkMode={isDarkMode}
          showBack={true}
          backRoute="/adminconsole"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {openTickets.length}
                </span>
              </div>
              <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Open</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <MessageCircle className="w-5 h-5 text-amber-600" />
                <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {inProgressTickets.length}
                </span>
              </div>
              <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>In Progress</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {waitingUserTickets.length}
                </span>
              </div>
              <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Waiting User</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {(allTickets || []).filter(t => t && (t.status === 'resolved' || t.status === 'closed')).length}
                </span>
              </div>
              <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets ({allTickets.length})</SelectItem>
              <SelectItem value="open">Open ({openTickets.length})</SelectItem>
              <SelectItem value="in_progress">In Progress ({inProgressTickets.length})</SelectItem>
              <SelectItem value="waiting_user">Waiting User ({waitingUserTickets.length})</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <SkeletonLoader variant="card" count={4} isDarkMode={isDarkMode} />
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No Tickets"
            description="No support tickets match this filter"
            isDarkMode={isDarkMode}
          />
        ) : (
          <div className="grid gap-4">
            {(filteredTickets || []).map((ticket) => {
              if (!ticket) return null;
              const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              const StatusIcon = statusConfig?.icon || Clock;
              const messageCount = ticket.messages?.length || 0;
              const lastMessage = ticket.messages?.[messageCount - 1];

              return (
                <Card
                  key={ticket.id}
                  className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  style={{ backgroundColor: colors.cardBg }}
                  onClick={() => {
                    haptic.light();
                    setSelectedTicket(ticket);
                    setAdminNotes(ticket.admin_notes || '');
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="p-2.5 rounded-lg"
                          style={{ backgroundColor: isDarkMode ? '#374151' : '#F3F6F5' }}
                        >
                          <StatusIcon className="w-5 h-5 text-ls-forest" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="font-bold text-base" style={{ color: colors.textPrimary }}>
                              {ticket.ticket_number}
                            </p>
                            <Badge className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                            {ticket.priority === 'urgent' && (
                              <Badge className="bg-red-100 text-red-800">
                                🔥 URGENT
                              </Badge>
                            )}
                            {ticket.priority === 'high' && (
                              <Badge className="bg-orange-100 text-orange-800">
                                ⚡ HIGH
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold mb-2 break-words" style={{ color: colors.textPrimary }}>
                            {ticket.subject}
                          </p>
                          <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: colors.textSecondary }}>
                            <span>👤 {ticket.created_by}</span>
                            <span>📂 {ticket.category}</span>
                            <span>💬 {messageCount} messages</span>
                            <span>🕐 {format(new Date(ticket.created_date), 'MMM d, h:mm a')}</span>
                          </div>
                          {lastMessage && lastMessage.sender_type === 'user' && ticket.status !== 'waiting_user' && (
                            <div className="mt-2 px-3 py-2 rounded-lg" style={{
                              backgroundColor: isDarkMode ? '#1E3A5F' : '#DBEAFE',
                              border: '1px solid #3B82F6'
                            }}>
                              <p className="text-xs font-semibold text-blue-700">
                                ⚠️ User replied {format(new Date(lastMessage.timestamp), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {ticket.assigned_to && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.assigned_to.split('@')[0]}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setSelectedTicket(null)}
          >
            <div
              className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl"
              style={{ backgroundColor: colors.cardBg }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b" style={{ borderBottomColor: colors.borderColor }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <ArrowLeft className="w-5 h-5" style={{ color: colors.textSecondary }} />
                      </button>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-xl" style={{ color: colors.textPrimary }}>
                            {selectedTicket.ticket_number}
                          </h3>
                          <Badge className={STATUS_CONFIG[selectedTicket.status].color}>
                            {STATUS_CONFIG[selectedTicket.status].label}
                          </Badge>
                        </div>
                        <p className="font-semibold text-base" style={{ color: colors.textPrimary }}>
                          {selectedTicket.subject}
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                          From: {selectedTicket.created_by} • {selectedTicket.user_plan_tier?.toUpperCase() || 'FREE'} • {selectedTicket.category}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="waiting_user">Waiting for User</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>

                      {!selectedTicket.assigned_to && (
                        <Button
                          onClick={handleAssignToMe}
                          variant="outline"
                          size="sm"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Assign to Me
                        </Button>
                      )}

                      {selectedTicket.assigned_to === user.email && (
                        <Badge className="bg-blue-100 text-blue-700">
                          Assigned to you
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content - 2 columns */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid md:grid-cols-3 gap-6 p-6">
                  {/* Left: Conversation */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="font-semibold" style={{ color: colors.textPrimary }}>Conversation</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {selectedTicket.messages?.map((msg, idx) => {
                        const isUser = msg.sender_type === 'user';
                        const isAdmin = msg.sender_type === 'admin';
                        
                        return (
                          <div key={idx} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                            <div
                              className="max-w-[80%] p-4 rounded-2xl"
                              style={{
                                backgroundColor: isAdmin 
                                  ? '#10B981'
                                  : (isUser ? '#0C3B2E' : (isDarkMode ? '#374151' : '#F3F4F6')),
                                color: (isUser || isAdmin) ? '#FFFFFF' : colors.textPrimary
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-xs font-semibold" style={{ 
                                  color: (isUser || isAdmin) ? '#FFFFFF' : colors.textSecondary,
                                  opacity: 0.9
                                }}>
                                  {msg.sender_name}
                                  {isAdmin && ' (Support Team)'}
                                </p>
                                <p className="text-xs" style={{ 
                                  color: (isUser || isAdmin) ? '#FFFFFF' : colors.textSecondary,
                                  opacity: 0.7
                                }}>
                                  {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                                </p>
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs hover:underline"
                                      style={{ color: (isUser || isAdmin) ? '#FFFFFF' : '#3B82F6' }}
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      Attachment {i + 1}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply Box */}
                    {selectedTicket.status !== 'closed' && (
                      <div className="border-t pt-4" style={{ borderTopColor: colors.borderColor }}>
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply to the user..."
                          rows={4}
                          className="w-full p-3 rounded-lg border-2 resize-none mb-3"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary,
                            fontSize: '16px'
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSendReply}
                            disabled={!replyMessage.trim() || sendingReply}
                            className="btn-interaction flex-1"
                            style={{
                              backgroundColor: (!replyMessage.trim() || sendingReply) ? '#9CA3AF' : '#10B981',
                              color: '#FFFFFF',
                              padding: '12px 20px',
                              borderRadius: '10px',
                              border: 'none',
                              cursor: (!replyMessage.trim() || sendingReply) ? 'not-allowed' : 'pointer',
                              minHeight: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              fontWeight: '600'
                            }}
                          >
                            <Send className="w-4 h-4" />
                            {sendingReply ? 'Sending...' : 'Send Reply to User'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Metadata & Notes */}
                  <div className="space-y-4">
                    <Card className="border-none" style={{ backgroundColor: isDarkMode ? '#374151' : '#F8FAFC' }}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Internal Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add internal notes (not visible to user)"
                          rows={4}
                          className="w-full p-2 rounded-lg border resize-none text-sm mb-2"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary
                          }}
                        />
                        <Button
                          onClick={handleSaveNotes}
                          size="sm"
                          className="w-full bg-slate-600 hover:bg-slate-700"
                        >
                          Save Notes
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-none" style={{ backgroundColor: isDarkMode ? '#374151' : '#F8FAFC' }}>
                      <CardContent className="p-4 space-y-2 text-sm">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Created</p>
                          <p style={{ color: colors.textPrimary }}>
                            {format(new Date(selectedTicket.created_date), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        {selectedTicket.last_response_at && (
                          <div>
                            <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Last Response</p>
                            <p style={{ color: colors.textPrimary }}>
                              {format(new Date(selectedTicket.last_response_at), 'MMM d, h:mm a')}
                            </p>
                            <p className="text-xs" style={{ color: colors.textSecondary }}>
                              by {selectedTicket.last_response_by}
                            </p>
                          </div>
                        )}
                        {selectedTicket.resolved_date && (
                          <div>
                            <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Resolved</p>
                            <p style={{ color: colors.textPrimary }}>
                              {format(new Date(selectedTicket.resolved_date), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSupport() {
  return (
    <AuthGuard>
      <ToastProvider>
        <AdminSupportContent />
      </ToastProvider>
    </AuthGuard>
  );
}