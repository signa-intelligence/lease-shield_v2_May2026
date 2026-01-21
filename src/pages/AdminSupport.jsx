import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AuthGuard from '../components/shared/AuthGuard';
import PageHeader from '../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageCircle, Clock, CheckCircle, XCircle, AlertCircle, Paperclip } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: MessageCircle },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

function AdminSupportContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  // Fetch all tickets
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['adminTickets', statusFilter],
    queryFn: async () => {
      try {
        // Fetch ALL tickets - list() returns array directly
        const allTickets = await base44.asServiceRole.entities.SupportTicket.list({
          sort: [{ field: 'created_date', direction: 'desc' }],
          limit: 500
        });
        
        console.log('🎫 Admin fetched tickets:', allTickets?.length || 0, 'tickets');
        
        // Filter by status
        const filteredTickets = statusFilter === 'all' 
          ? allTickets
          : allTickets.filter(ticket => ticket.status === statusFilter);
        
        return filteredTickets;
      } catch (error) {
        console.error('❌ Error fetching tickets:', error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });
  
  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ ticket_id, message }) => {
      return await base44.functions.invoke('replyToSupportTicket', {
        ticket_id,
        message,
        is_admin: true
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Reply sent to user!' });
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message || 'Failed to send reply', variant: 'destructive' });
    }
  });
  
  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticket_id, status }) => {
      return await base44.functions.invoke('updateTicketStatus', {
        ticket_id,
        status
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Ticket status updated!' });
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message || 'Failed to update status', variant: 'destructive' });
    }
  });
  
  const handleReply = () => {
    if (!replyMessage.trim() || replyMessage.trim().length < 10) {
      toast({ title: 'Error', description: 'Reply must be at least 10 characters', variant: 'destructive' });
      return;
    }
    
    replyMutation.mutate({
      ticket_id: selectedTicket.id,
      message: replyMessage.trim()
    });
  };
  
  const handleStatusChange = (newStatus) => {
    if (window.confirm(`Change ticket status to "${newStatus}"?`)) {
      updateStatusMutation.mutate({
        ticket_id: selectedTicket.id,
        status: newStatus
      });
    }
  };
  
  // Calculate summary stats
  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    high_priority: tickets.filter(t => t.priority === 'high' && ['open', 'in_progress'].includes(t.status)).length
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader 
        title="Support"
        subtitle="Manage user requests"
      />
      
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Summary Cards */}
        {!selectedTicket && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open</p>
                    <p className="text-2xl font-bold">{stats.open}</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold">{stats.in_progress}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold">{stats.high_priority}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded mb-4">
            Error loading tickets: {error.message}
          </div>
        )}
        
        {/* Ticket List */}
        {!selectedTicket && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Tickets</CardTitle>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-2 border rounded text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No tickets found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map(ticket => {
                    const statusConfig = STATUS_CONFIG[ticket.status];
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div 
                        key={ticket.id}
                        className="border rounded p-4 hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{ticket.ticket_number}</h3>
                              {ticket.priority === 'high' && (
                                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                                  HIGH PRIORITY
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{ticket.subject}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              From: {ticket.user_email} ({ticket.user_plan_tier})
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                          <span>{new Date(ticket.created_date).toLocaleDateString()}</span>
                          <span>{ticket.messages?.length || 1} message(s)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Ticket Detail View */}
        {selectedTicket && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedTicket(null)}
                    className="mb-2"
                  >
                    ← Back to All Tickets
                  </Button>
                  <div className="flex items-center gap-3">
                    <CardTitle>{selectedTicket.ticket_number}</CardTitle>
                    {selectedTicket.priority === 'high' && (
                      <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{selectedTicket.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    From: {selectedTicket.user_email} • Plan: {selectedTicket.user_plan_tier}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`text-xs px-3 py-1 rounded ${STATUS_CONFIG[selectedTicket.status].color}`}>
                    {STATUS_CONFIG[selectedTicket.status].label}
                  </span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="p-1 border rounded text-xs"
                    disabled={updateStatusMutation.isPending}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Conversation Thread */}
              <div className="space-y-4 mb-6">
                {(selectedTicket.messages || []).map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded ${
                      msg.sender_type === 'admin' 
                        ? 'bg-green-50 border-l-4 border-green-500' 
                        : 'bg-gray-50 border-l-4 border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm">
                        {msg.sender_type === 'admin' ? '🛡️ You (Support Team)' : `👤 ${msg.sender_name}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    {msg.attachments?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {msg.attachments.map((file, fileIdx) => (
                          <a
                            key={fileIdx}
                            href={typeof file === 'string' ? file : file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>{typeof file === 'string' ? 'Attachment' : file.name}</span>
                            {file.size && <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Reply Form */}
              {selectedTicket.status !== 'closed' ? (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2">Reply to User</label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here... (minimum 10 characters)"
                    className="w-full p-2 border rounded min-h-[100px]"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                      {replyMessage.length}/1000 characters
                    </span>
                    <Button
                      onClick={handleReply}
                      disabled={replyMutation.isPending || replyMessage.trim().length < 10}
                      className="bg-[#0F4229] hover:bg-[#0F4229]/90"
                    >
                      {replyMutation.isPending ? 'Sending...' : 'Send Reply to User'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4 text-center text-gray-500">
                  <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">This ticket is closed.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function AdminSupport() {
  return (
    <AuthGuard>
      <AdminSupportContent />
    </AuthGuard>
  );
}