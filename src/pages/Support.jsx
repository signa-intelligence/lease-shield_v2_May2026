import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageCircle, Clock, CheckCircle, XCircle, Paperclip } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

const STATUS_BADGES = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: MessageCircle },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

export default function Support() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    category: 'other',
    description: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  // Fetch user's tickets
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['userTickets'],
    queryFn: async () => {
      try {
        // Fetch user's tickets using regular API (respects RLS)
        const userTickets = await base44.entities.SupportTicket.list();
        
        console.log('🎫 User fetched tickets:', userTickets?.length || 0);
        
        return userTickets || [];
      } catch (error) {
        console.error('❌ Error fetching tickets:', error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });
  
  // Submit ticket mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke('submitSupportTicket', data);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Support ticket submitted successfully!' });
      setFormData({ category: 'other', description: '' });
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['userTickets'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message || 'Failed to submit ticket', variant: 'destructive' });
    }
  });
  
  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ ticket_id, message }) => {
      return await base44.functions.invoke('replyToSupportTicket', {
        ticket_id,
        message,
        is_admin: false
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Reply sent successfully!' });
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['userTickets'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message || 'Failed to send reply', variant: 'destructive' });
    }
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast({ title: 'Error', description: 'Please enter a description', variant: 'destructive' });
      return;
    }
    
    if (formData.description.length < 20) {
      toast({ title: 'Error', description: 'Description must be at least 20 characters', variant: 'destructive' });
      return;
    }
    
    if (formData.description.length > 500) {
      toast({ title: 'Error', description: 'Description must not exceed 500 characters', variant: 'destructive' });
      return;
    }
    
    submitMutation.mutate({ ...formData, attachments });
  };
  
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 3) {
      toast({ title: 'Error', description: 'Maximum 3 files allowed', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({ title: 'Error', description: `Files must be under 5MB. ${oversizedFiles[0].name} is too large.`, variant: 'destructive' });
      e.target.value = '';
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast({ title: 'Error', description: `Invalid file type: ${invalidFiles[0].name}`, variant: 'destructive' });
      e.target.value = '';
      return;
    }
    
    setUploadingFiles(true);
    
    try {
      const uploadedAttachments = [];
      
      for (const file of files) {
        const response = await base44.integrations.Core.UploadFile({ file });
        const fileUrl = response.data?.file_url || response.file_url;
        
        if (!fileUrl) {
          throw new Error('Upload failed - no file URL returned');
        }
        
        uploadedAttachments.push({
          name: file.name,
          url: fileUrl,
          size: file.size,
          type: file.type
        });
      }
      
      setAttachments(uploadedAttachments);
      toast({ title: 'Success', description: `${uploadedAttachments.length} file(s) uploaded` });
    } catch (error) {
      console.error('File upload error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to upload files', 
        variant: 'destructive' 
      });
      e.target.value = '';
    } finally {
      setUploadingFiles(false);
    }
  };
  
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
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader 
        title="Support"
        subtitle="We're here to help"
      />
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded">
            Error loading tickets: {error.message}
          </div>
        )}
        
        {/* Submit Form */}
        {!selectedTicket && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Support Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="deposit">Deposit Issues</option>
                    <option value="billing">Billing & Subscription</option>
                    <option value="technical">Technical Support</option>
                    <option value="scan">Lease Scan Issues</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description * (20-500 characters)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Please describe your issue in detail..."
                    className="w-full p-2 border rounded min-h-[120px]"
                    maxLength={500}
                  />
                  <div className={`text-sm mt-1 ${
                    formData.description.length < 20 ? 'text-red-500' :
                    formData.description.length > 450 ? 'text-orange-500' :
                    'text-gray-500'
                  }`}>
                    {formData.description.length}/500 characters
                    {formData.description.length < 20 && formData.description.length > 0 && 
                      ` (minimum 20 required)`
                    }
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Attachments (Optional, max 3 files, 5MB each)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Accepted: Images (JPG, PNG, GIF), PDF, Word documents
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="w-full p-2 border rounded"
                    accept="image/*,.pdf,.doc,.docx"
                    disabled={uploadingFiles || submitMutation.isPending}
                  />
                  {uploadingFiles && (
                    <div className="mt-2 text-sm text-blue-600">
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Uploading files...
                    </div>
                  )}
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-600" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                            className="text-red-500 text-sm hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending || uploadingFiles}
                  className="w-full bg-[#0F4229] hover:bg-[#0F4229]/90"
                >
                  {submitMutation.isPending ? 'Submitting...' : uploadingFiles ? 'Uploading files...' : 'Submit Ticket'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        
        {/* My Tickets */}
        {!selectedTicket && (
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No support tickets yet.</p>
                  <p className="text-sm">Submit a ticket above if you need help.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map(ticket => {
                    const statusConfig = STATUS_BADGES[ticket.status];
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div 
                        key={ticket.id} 
                        className="border rounded p-4 hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{ticket.ticket_number}</h3>
                            <p className="text-sm text-gray-600">{ticket.subject}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                            {ticket.priority === 'high' && (
                              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                                High Priority
                              </span>
                            )}
                          </div>
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
                <div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedTicket(null)}
                    className="mb-2"
                  >
                    ← Back to Tickets
                  </Button>
                  <CardTitle>{selectedTicket.ticket_number}</CardTitle>
                  <p className="text-sm text-gray-600">{selectedTicket.subject}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded ${STATUS_BADGES[selectedTicket.status].color}`}>
                  {STATUS_BADGES[selectedTicket.status].label}
                </span>
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
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'bg-gray-50 border-l-4 border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm">
                        {msg.sender_type === 'admin' ? '🛡️ Support Team' : msg.sender_name}
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
                  <label className="block text-sm font-medium mb-2">Your Reply</label>
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
                      {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4 text-center text-gray-500">
                  <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">This ticket is closed and cannot accept new replies.</p>
                  <p className="text-xs mt-1">If you need further assistance, please submit a new ticket.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}