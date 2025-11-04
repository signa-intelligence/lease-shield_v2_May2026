import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, CheckCircle2, HelpCircle, Upload, Shield, FileText, CreditCard, Wrench } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800', icon: MessageCircle },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 }
};

const CATEGORY_CONFIG = {
  technical: { label: 'Technical Issue', icon: Upload },
  billing: { label: 'Billing', icon: CreditCard },
  feature: { label: 'Feature Request', icon: HelpCircle },
  account: { label: 'Account', icon: Shield },
  other: { label: 'Other', icon: MessageCircle }
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

export default function SupportPage() {
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'technical',
    description: '',
    priority: 'medium'
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['supportTickets'],
    queryFn: () => base44.entities.SupportTicket.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
    initialData: []
  });

  const createTicketMutation = useMutation({
    mutationFn: (ticketData) => base44.entities.SupportTicket.create(ticketData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      setShowNewTicket(false);
      setNewTicket({ subject: '', category: 'technical', description: '', priority: 'medium' });
    }
  });

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    createTicketMutation.mutate({
      ...newTicket,
      status: 'open'
    });
  };

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  const strings = language === 'th' ? {
    title: 'ศูนย์ช่วยเหลือ',
    subtitle: 'เราพร้อมช่วยเหลือคุณ',
    newTicket: 'เปิดตั๋วใหม่',
    myTickets: 'ตั๋วของฉัน',
    noTickets: 'ยังไม่มีตั๋วช่วยเหลือ',
    subject: 'หัวข้อ',
    category: 'หมวดหมู่',
    description: 'รายละเอียด',
    priority: 'ความสำคัญ',
    submit: 'ส่ง',
    cancel: 'ยกเลิก',
    faq: 'คำถามที่พบบ่อย',
    status: 'สถานะ',
    created: 'สร้างเมื่อ',
    low: 'ต่ำ',
    medium: 'กลาง',
    high: 'สูง',
    technical: 'ปัญหาทางเทคนิค',
    billing: 'การเรียกเก็บเงิน',
    feature: 'ขอคุณสมบัติใหม่',
    account: 'บัญชี',
    other: 'อื่นๆ'
  } : {
    title: 'Help Center',
    subtitle: 'We\'re here to help',
    newTicket: 'New Support Ticket',
    myTickets: 'My Tickets',
    noTickets: 'No support tickets yet',
    subject: 'Subject',
    category: 'Category',
    description: 'Description',
    priority: 'Priority',
    submit: 'Submit',
    cancel: 'Cancel',
    faq: 'Frequently Asked Questions',
    status: 'Status',
    created: 'Created',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    technical: 'Technical Issue',
    billing: 'Billing',
    feature: 'Feature Request',
    account: 'Account',
    other: 'Other'
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
              <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
            </div>
            <Button
              onClick={() => setShowNewTicket(!showNewTicket)}
              style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {strings.newTicket}
            </Button>
          </div>
        </div>

        {showNewTicket && (
          <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
              <CardTitle style={{ color: colors.textPrimary }}>{strings.newTicket}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.subject}</Label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    required
                    style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  />
                </div>

                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.category}</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">{strings.technical}</SelectItem>
                      <SelectItem value="billing">{strings.billing}</SelectItem>
                      <SelectItem value="feature">{strings.feature}</SelectItem>
                      <SelectItem value="account">{strings.account}</SelectItem>
                      <SelectItem value="other">{strings.other}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.priority}</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                  >
                    <SelectTrigger style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{strings.low}</SelectItem>
                      <SelectItem value="medium">{strings.medium}</SelectItem>
                      <SelectItem value="high">{strings.high}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.description}</Label>
                  <Textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    required
                    rows={4}
                    style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#FFFFFF',
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}>
                    {strings.submit}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewTicket(false)}
                    style={{
                      borderColor: colors.borderColor,
                      color: colors.textPrimary
                    }}
                  >
                    {strings.cancel}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* FAQ Section */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <HelpCircle className="w-5 h-5 text-ls-forest" />
              {strings.faq}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {FAQ_ITEMS.map((faq, idx) => {
                const Icon = faq.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                      border: `1px solid ${colors.borderColor}`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#0C3B2E',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
                          {faq.question}
                        </h3>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* My Tickets */}
        <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <CardTitle style={{ color: colors.textPrimary }}>{strings.myTickets}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textSecondary }} />
                <p style={{ color: colors.textSecondary }}>{strings.noTickets}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const StatusIcon = STATUS_CONFIG[ticket.status]?.icon || Clock;
                  const CategoryIcon = CATEGORY_CONFIG[ticket.category]?.icon || MessageCircle;

                  return (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                        borderColor: colors.borderColor
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <CategoryIcon className="w-5 h-5 mt-1" style={{ color: '#0C3B2E' }} />
                          <div className="flex-1">
                            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                              {ticket.subject}
                            </h3>
                            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                              {ticket.description}
                            </p>
                          </div>
                        </div>
                        <Badge className={STATUS_CONFIG[ticket.status]?.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {STATUS_CONFIG[ticket.status]?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: colors.textSecondary }}>
                        <span>{strings.created}: {format(new Date(ticket.created_date), 'MMM d, yyyy')}</span>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_CONFIG[ticket.category]?.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            ticket.priority === 'high' ? 'border-red-500 text-red-700' :
                            ticket.priority === 'medium' ? 'border-amber-500 text-amber-700' :
                            'border-blue-500 text-blue-700'
                          }`}
                        >
                          {ticket.priority === 'high' ? strings.high :
                           ticket.priority === 'medium' ? strings.medium :
                           strings.low}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}