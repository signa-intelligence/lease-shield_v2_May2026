import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Upload, CheckCircle2, Loader2, AlertCircle, HelpCircle } from "lucide-react";

const CATEGORIES = [
  { value: 'technical', label: { en: 'Technical Issue', th: 'ปัญหาทางเทคนิค' }, icon: '⚙️' },
  { value: 'billing', label: { en: 'Billing & Payments', th: 'การเรียกเก็บเงินและการชำระเงิน' }, icon: '💳' },
  { value: 'deposit', label: { en: 'Deposit Issue', th: 'ปัญหาเงินมัดจำ' }, icon: '💰' },
  { value: 'scan', label: { en: 'Lease Scan Problem', th: 'ปัญหาการสแกนสัญญา' }, icon: '📄' },
  { value: 'legal', label: { en: 'Legal Question', th: 'คำถามทางกฎหมาย' }, icon: '⚖️' },
  { value: 'other', label: { en: 'Other', th: 'อื่นๆ' }, icon: '💬' }
];

export default function Support() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'other'
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';

  // Auto-set priority based on plan tier
  const getPriority = () => {
    if (user?.plan_tier === 'secure') return 'urgent';
    if (user?.plan_tier === 'protect') return 'high';
    return 'normal';
  };

  const getResponseTime = () => {
    if (user?.plan_tier === 'secure') return language === 'th' ? '6 ชั่วโมง' : '6 hours';
    if (user?.plan_tier === 'protect') return language === 'th' ? '12 ชั่วโมง' : '12 hours';
    return language === 'th' ? '24-48 ชั่วโมง' : '24-48 hours';
  };

  const submitTicketMutation = useMutation({
    mutationFn: async (ticketData) => {
      // Create ticket record
      const ticket = await base44.entities.SupportTicket.create({
        ...ticketData,
        priority: getPriority(),
        attachments: attachments
      });

      // Send email notification
      const emailBody = `
New Support Request #${ticket.id.slice(0, 8)}

From: ${user.full_name} (${user.email})
Plan: ${user.plan_tier?.toUpperCase() || 'FREE'}
Priority: ${getPriority().toUpperCase()}

Category: ${ticketData.category}
Subject: ${ticketData.subject}

Description:
${ticketData.description}

${attachments.length > 0 ? `Attachments: ${attachments.length} file(s)` : 'No attachments'}

---
View ticket in admin console to respond.
      `;

      await base44.integrations.Core.SendEmail({
        to: 'support@leaseshield.asia',
        subject: `[Support] ${ticketData.category.toUpperCase()} - ${ticketData.subject}`,
        body: emailBody
      });

      // Send confirmation to user
      const userEmailBody = language === 'th' 
        ? `สวัสดี ${user.full_name},

เราได้รับคำขอสนับสนุนของคุณแล้ว

หมายเลขตั๋ว: #${ticket.id.slice(0, 8)}
หมวดหมู่: ${ticketData.category}
เรื่อง: ${ticketData.subject}

เวลาตอบกลับโดยประมาณ: ${getResponseTime()}

เราจะตอบกลับคุณทางอีเมลโดยเร็วที่สุด

ขอบคุณที่เลือกใช้ Lease Shield
— ทีม Lease Shield`
        : `Hi ${user.full_name},

We've received your support request.

Ticket #${ticket.id.slice(0, 8)}
Category: ${ticketData.category}
Subject: ${ticketData.subject}

Expected Response Time: ${getResponseTime()}

We'll get back to you via email as soon as possible.

Thank you for choosing Lease Shield.
— The Lease Shield Team`;

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: language === 'th' 
          ? `[Lease Shield] เราได้รับคำขอของคุณแล้ว #${ticket.id.slice(0, 8)}`
          : `[Lease Shield] We received your request #${ticket.id.slice(0, 8)}`,
        body: userEmailBody
      });

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      setSubmitted(true);
      setFormData({ subject: '', description: '', category: 'other' });
      setAttachments([]);
    },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);

    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setAttachments([...attachments, ...urls]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitTicketMutation.mutate(formData);
  };

  const t = {
    en: {
      title: "Support Request",
      subtitle: "Submit your question or issue, we'll respond via email",
      category: "Category",
      subject: "Subject",
      subjectPlaceholder: "Brief description of your issue",
      description: "Description",
      descriptionPlaceholder: "Please provide as much detail as possible...",
      attachments: "Attachments",
      attachmentsDesc: "Upload screenshots or relevant documents",
      chooseFiles: "Choose Files",
      filesAttached: "files attached",
      priority: "Priority",
      responseTime: "Expected Response Time",
      submit: "Submit Request",
      submitting: "Submitting...",
      successTitle: "Request Submitted!",
      successMessage: "We've received your support request. You'll receive a confirmation email shortly, and we'll respond within",
      anotherRequest: "Submit Another Request",
      legalDisclaimer: "Note: For legal advice, please consult a licensed attorney. We provide guidance on lease documentation only."
    },
    th: {
      title: "ขอความช่วยเหลือ",
      subtitle: "ส่งคำถามหรือปัญหาของคุณ เราจะตอบกลับทางอีเมล",
      category: "หมวดหมู่",
      subject: "หัวเรื่อง",
      subjectPlaceholder: "อธิบายปัญหาของคุณโดยสังเขป",
      description: "รายละเอียด",
      descriptionPlaceholder: "กรุณาให้รายละเอียดให้มากที่สุด...",
      attachments: "ไฟล์แนบ",
      attachmentsDesc: "อัปโหลดภาพหน้าจอหรือเอกสารที่เกี่ยวข้อง",
      chooseFiles: "เลือกไฟล์",
      filesAttached: "ไฟล์แนบ",
      priority: "ความสำคัญ",
      responseTime: "เวลาตอบกลับโดยประมาณ",
      submit: "ส่งคำขอ",
      submitting: "กำลังส่ง...",
      successTitle: "ส่งคำขอแล้ว!",
      successMessage: "เราได้รับคำขอของคุณแล้ว คุณจะได้รับอีเมลยืนยันเร็วๆ นี้ และเราจะตอบกลับภายใน",
      anotherRequest: "ส่งคำขออีกครั้ง",
      legalDisclaimer: "หมายเหตุ: สำหรับคำแนะนำทางกฎหมาย กรุณาปรึกษาทนายความที่มีใบอนุญาต เราให้คำแนะนำเกี่ยวกับเอกสารสัญญาเช่าเท่านั้น"
    }
  };

  const strings = t[language];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-ls-charcoal mb-3">
                {strings.successTitle}
              </h2>
              <p className="text-slate-600 mb-2">
                {strings.successMessage} <span className="font-semibold text-ls-forest">{getResponseTime()}</span>
              </p>
              <p className="text-sm text-slate-500 mb-8">
                support@leaseshield.asia
              </p>
              <Button 
                onClick={() => setSubmitted(false)}
                className="bg-ls-forest hover:bg-ls-forest/90"
              >
                {strings.anotherRequest}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#0C3B2E',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(12, 59, 46, 0.2)'
            }}>
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-ls-charcoal">{strings.title}</h1>
              <p className="text-slate-600">{strings.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Priority Badge */}
        {(user?.plan_tier === 'protect' || user?.plan_tier === 'secure') && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
            <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {language === 'th' 
                ? `การสนับสนุนแบบเร่งด่วน: เราจะตอบกลับภายใน ${getResponseTime()}` 
                : `Priority Support: We'll respond within ${getResponseTime()}`}
            </p>
          </div>
        )}

        <Card className="border-none shadow-xl">
          <CardHeader className="border-b" style={{ backgroundColor: '#ECEFED' }}>
            <CardTitle className="text-lg font-bold">
              {strings.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-sm font-semibold text-ls-charcoal mb-2">
                  {strings.category}
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject" className="text-sm font-semibold text-ls-charcoal mb-2">
                  {strings.subject}
                </Label>
                <Input
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder={strings.subjectPlaceholder}
                  style={{
                    border: '2px solid #ECEFED',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-ls-charcoal mb-2">
                  {strings.description}
                </Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={strings.descriptionPlaceholder}
                  rows={6}
                  style={{
                    border: '2px solid #ECEFED',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Attachments */}
              <div>
                <Label className="text-sm font-semibold text-ls-charcoal mb-2">
                  {strings.attachments}
                </Label>
                <p className="text-xs text-slate-500 mb-2">{strings.attachmentsDesc}</p>
                <div className="flex items-center gap-3">
                  <label 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">{strings.chooseFiles}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {attachments.length > 0 && (
                    <span className="text-sm text-slate-600">
                      {attachments.length} {strings.filesAttached}
                    </span>
                  )}
                </div>
                {attachments.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {attachments.map((url, idx) => (
                      <img key={idx} src={url} alt={`Attachment ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>

              {/* Expected Response Time */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">{strings.responseTime}</span>
                </div>
                <p className="text-sm text-blue-800">{getResponseTime()}</p>
              </div>

              {/* Legal Disclaimer */}
              {formData.category === 'legal' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">{strings.legalDisclaimer}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={uploading || submitTicketMutation.isPending}
                className="w-full"
                style={{
                  backgroundColor: (uploading || submitTicketMutation.isPending) ? '#9CA3AF' : '#0C3B2E',
                  color: '#FFFFFF',
                  opacity: (uploading || submitTicketMutation.isPending) ? 0.6 : 1,
                  padding: '14px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : submitTicketMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.submitting}
                  </>
                ) : (
                  strings.submit
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}