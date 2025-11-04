
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, CheckCircle2, HelpCircle, Upload, Shield, FileText, CreditCard, Wrench } from "lucide-react";
import { format } = "date-fns";

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800', icon: MessageCircle },
  waiting_user: { label: 'Waiting for You', color: 'bg-purple-100 text-purple-800', icon: HelpCircle },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800', icon: CheckCircle2 }
};

const FAQ_ITEMS = [
  {
    question: "How does the deposit protection work?",
    answer: "Deposit Shield tracks your security deposit with automated reminders 30 and 7 days before return. We help you document everything properly.",
    icon: Shield
  },
  {
    question: "What's included in the lease scan?",
    answer: "We analyze your lease for unfair clauses, excessive fees, unclear terms, and missing protections based on Thai rental standards.",
    icon: FileText
  },
  {
    question: "How do I upgrade my plan?",
    answer: "Go to Account → Choose Your Protection Level → Select a plan → Complete payment. Upgrade takes effect immediately.",
    icon: CreditCard
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime from Account settings. You'll keep access until the end of your billing period.",
    icon: HelpCircle
  },
  {
    question: "How do maintenance requests work?",
    answer: "Log each repair request with photos and dates. This creates a documented trail for any future disputes.",
    icon: Wrench
  }
];

export default function Support() {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'technical',
    attachments: []
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.SupportTicket.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setFormData({
        subject: '',
        description: '',
        category: 'technical',
        attachments: []
      });
    },
  });

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setFormData({ ...formData, attachments: [...formData.attachments, ...urls] });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createTicketMutation.mutate(formData);
  };

  const language = user?.language || 'en';

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
      faqTitle: "Frequently Asked Questions",
      recentTickets: "Recent Tickets"
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
      faqTitle: "คำถามที่พบบ่อย",
      recentTickets: "คำขอล่าสุด"
    }
  };

  const strings = t[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold text-ls-charcoal">{strings.title}</h1>
          </div>
          <p className="text-slate-600">{strings.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Side - Submit Form (2/5) */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-ls-forest" />
                  {strings.submitTicket}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">{strings.subject}</Label>
                    <Input
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">{strings.category}</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="scan">Lease Scan</SelectItem>
                        <SelectItem value="legal">Legal Question</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">{strings.description}</Label>
                    <Textarea
                      id="description"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Please provide as much detail as possible..."
                      rows={5}
                    />
                  </div>
                  <div>
                    <Label>{strings.attachments}</Label>
                    <label
                      htmlFor="file-upload"
                      className="mt-2 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-ls-forest transition-colors"
                    >
                      <Upload className="w-5 h-5 text-slate-500" />
                      <span className="text-sm text-slate-600">
                        {uploading ? 'Uploading...' : strings.uploadFiles}
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {formData.attachments.length > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        {formData.attachments.length} file(s) attached
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="w-full"
                    style={{
                      backgroundColor: createTicketMutation.isPending ? '#9CA3AF' : '#0C3B2E',
                      color: '#FFFFFF'
                    }}
                  >
                    {createTicketMutation.isPending ? 'Submitting...' : strings.submitButton}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section - Below form on left side */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-ls-forest" />
                  {strings.faqTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {FAQ_ITEMS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="p-3 bg-ls-stone rounded-lg border border-ls-forest/10">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg flex-shrink-0">
                          <Icon className="w-4 h-4 text-ls-forest" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-ls-charcoal mb-1">{item.question}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{item.answer}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Tickets List (3/5) */}
          <div className="lg:col-span-3">
            <h3 className="font-bold text-lg text-ls-charcoal mb-4">{strings.recentTickets}</h3>
            {tickets.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-ls-charcoal mb-2">{strings.noTickets}</h4>
                  <p className="text-slate-600">{strings.noTicketsSub}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card key={ticket.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-ls-stone rounded-lg flex-shrink-0">
                              <StatusIcon className="w-5 h-5 text-ls-forest" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base text-ls-charcoal mb-1">{ticket.subject}</p>
                              <p className="text-xs text-slate-500">
                                Opened {format(new Date(ticket.created_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${statusConfig.color} text-xs flex-shrink-0`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-700 line-clamp-2">{ticket.description}</p>
                        </div>
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <p className="text-xs text-slate-500 mt-2">
                            📎 {ticket.attachments.length} attachment(s)
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
