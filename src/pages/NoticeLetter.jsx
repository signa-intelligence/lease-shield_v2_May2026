import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Download, Copy, Send, FileText, CheckCircle2, Loader2, AlertCircle, Edit3 } from "lucide-react";
import { format } from "date-fns";
import { haptic } from "../components/shared/HapticFeedback";
import { useToast, ToastProvider } from "../components/shared/Toast";
import AuthGuard from "../components/shared/AuthGuard";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function NoticeLetterContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [leaseId, setLeaseId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatedLetters, setGeneratedLetters] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: lease, isLoading: leaseLoading } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: async () => {
      const leases = await base44.entities.Lease.filter({ id: leaseId });
      return leases[0];
    },
    enabled: !!leaseId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TemplateLibrary.filter({ 
      status: 'active',
      category: 'initial_resolution'
    }),
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const leaseIdParam = urlParams.get('leaseId');
    if (leaseIdParam) {
      setLeaseId(leaseIdParam);
    }
  }, []);

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    fieldBg: '#374151'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    fieldBg: '#F8FAFC'
  };

  const t = {
    en: {
      noticeLetterTitle: "Lease Termination Notice",
      generatingLetter: "Generating letter...",
      downloadLetter: "Download",
      copyToClipboard: "Copy",
      sendViaEmail: "Send via Email",
      changeTemplate: "Change Template",
      viewLeaseDetails: "View Lease Details",
      letterGenerated: "Letter Generated Successfully",
      letterCopied: "Letter copied to clipboard",
      letterSent: "Letter sent successfully",
      generateFailed: "Failed to generate letter",
      noLease: "No lease selected",
      selectLease: "Please select a lease from the dashboard",
      propertyAddress: "Property Address",
      noticeDeadline: "Notice Deadline",
      leaseEndDate: "Lease End Date",
      noticePeriod: "Notice Period",
      days: "days",
      generateLetter: "Generate Letter",
      editLetter: "Edit Letter",
      saveChanges: "Save Changes",
      cancelEdit: "Cancel",
      downloading: "Downloading...",
      sending: "Sending...",
      back: "Back to Dashboard",
      englishVersion: "English Version",
      thaiVersion: "Thai Version (ภาษาไทย)"
    },
    th: {
      noticeLetterTitle: "จดหมายแจ้งเลิกสัญญา",
      generatingLetter: "กำลังสร้างจดหมาย...",
      downloadLetter: "ดาวน์โหลด",
      copyToClipboard: "คัดลอก",
      sendViaEmail: "ส่งทางอีเมล",
      changeTemplate: "เปลี่ยนเทมเพลต",
      viewLeaseDetails: "ดูรายละเอียดสัญญา",
      letterGenerated: "สร้างจดหมายสำเร็จ",
      letterCopied: "คัดลอกจดหมายแล้ว",
      letterSent: "ส่งจดหมายแล้ว",
      generateFailed: "สร้างจดหมายไม่สำเร็จ",
      noLease: "ไม่มีสัญญาเช่าที่เลือก",
      selectLease: "กรุณาเลือกสัญญาจากแดชบอร์ด",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      noticeDeadline: "กำหนดแจ้ง",
      leaseEndDate: "วันสิ้นสุดสัญญา",
      noticePeriod: "ระยะแจ้ง",
      days: "วัน",
      generateLetter: "สร้างจดหมาย",
      editLetter: "แก้ไขจดหมาย",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      cancelEdit: "ยกเลิก",
      downloading: "กำลังดาวน์โหลด...",
      sending: "กำลังส่ง...",
      back: "กลับไปที่แดชบอร์ด",
      englishVersion: "English Version",
      thaiVersion: "Thai Version (ภาษาไทย)"
    }
  };

  const strings = t[language] || t.en;

  const handleGenerateLetter = async () => {
    if (!lease) return;

    setGeneratingLetter(true);
    haptic.medium();

    try {
      // Auto-select lease termination template
      const noticeTemplate = templates.find(t => 
        t.template_key === 'lease_termination_notice' || 
        t.template_key.includes('notice') ||
        t.template_key.includes('termination')
      ) || templates[0];

      if (!noticeTemplate) {
        throw new Error('No notice template found');
      }

      const response = await base44.functions.invoke('generateLetters', {
        template_key: noticeTemplate.template_key,
        merge_data: {
          tenant_name: user.full_name,
          tenant_address: lease.property_address || user.tenant_address,
          landlord_name: user.landlord_name || 'Landlord',
          landlord_email: user.landlord_email,
          property_address: lease.property_address,
          lease_start_date: lease.start_date ? format(new Date(lease.start_date), 'MMMM d, yyyy') : '',
          lease_end_date: lease.end_date ? format(new Date(lease.end_date), 'MMMM d, yyyy') : '',
          notice_deadline: lease.notice_deadline ? format(new Date(lease.notice_deadline), 'MMMM d, yyyy') : '',
          notice_period_days: lease.notice_period_days?.toString() || '30',
          current_date: format(new Date(), 'MMMM d, yyyy')
        },
        languages: ['en', 'th'],
        recipient_type: 'landlord'
      });

      if (response.data?.success && response.data?.letters) {
        setGeneratedLetters(response.data.letters);
        setEditedContent({
          en: response.data.letters.en?.html_content || '',
          th: response.data.letters.th?.html_content || ''
        });
        setShowSuccess(true);
        haptic.success();
      } else {
        throw new Error(response.data?.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Letter generation error:', error);
      toast.error(strings.generateFailed);
      haptic.error();
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleDownload = (lang) => {
    haptic.light();
    const content = editMode ? editedContent[lang] : generatedLetters[lang]?.html_content;
    if (!content) return;

    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notice_letter_${lang}_${format(new Date(), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    toast.success(language === 'th' ? 'ดาวน์โหลดแล้ว' : 'Downloaded');
  };

  const handleCopy = (lang) => {
    haptic.light();
    const content = editMode ? editedContent[lang] : generatedLetters[lang]?.html_content;
    if (!content) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    navigator.clipboard.writeText(textContent)
      .then(() => {
        toast.success(strings.letterCopied);
        haptic.success();
      })
      .catch(() => {
        toast.error(language === 'th' ? 'คัดลอกไม่สำเร็จ' : 'Copy failed');
      });
  };

  const handleSend = async (lang) => {
    if (!user.landlord_email) {
      toast.error(language === 'th' ? 'กรุณาใส่อีเมลเจ้าของบ้านในการตั้งค่าบัญชี' : 'Please add landlord email in Account settings');
      return;
    }

    haptic.medium();
    const content = editMode ? editedContent[lang] : generatedLetters[lang]?.html_content;

    try {
      await base44.integrations.Core.SendEmail({
        from_name: 'Lease Shield',
        to: user.landlord_email,
        subject: language === 'th' ? 'แจ้งเลิกสัญญาเช่า' : 'Lease Termination Notice',
        body: content
      });

      toast.success(strings.letterSent);
      haptic.success();
    } catch (error) {
      console.error('Send error:', error);
      toast.error(language === 'th' ? 'ส่งไม่สำเร็จ' : 'Send failed');
      haptic.error();
    }
  };

  if (!lease && !leaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {strings.noLease}
            </h2>
            <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
              {strings.selectLease}
            </p>
            <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
              {strings.back}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (leaseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              haptic.light();
              navigate(createPageUrl("Dashboard"));
            }}
            className="mb-4 flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: colors.textSecondary }}
          >
            <ArrowLeft className="w-4 h-4" />
            {strings.back}
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noticeLetterTitle}
              </h1>
              {lease && (
                <div className="flex flex-wrap gap-3 text-sm" style={{ color: colors.textSecondary }}>
                  {lease.property_address && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{strings.propertyAddress}:</span>
                      <span>{lease.property_address}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lease Info Summary Card */}
          {lease && (
            <Card className="mb-6" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {lease.notice_deadline && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                        {strings.noticeDeadline}
                      </p>
                      <p className="text-sm font-bold text-emerald-600">
                        {format(new Date(lease.notice_deadline), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {lease.end_date && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                        {strings.leaseEndDate}
                      </p>
                      <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                        {format(new Date(lease.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {lease.notice_period_days && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                        {strings.noticePeriod}
                      </p>
                      <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                        {lease.notice_period_days} {strings.days}
                      </p>
                    </div>
                  )}
                  {lease.start_date && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                        Lease Start
                      </p>
                      <p className="text-sm font-bold" style={{ color: colors.textSecondary }}>
                        {format(new Date(lease.start_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generate or Display Letter */}
        {!generatedLetters ? (
          <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-emerald-600" />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'พร้อมสร้างจดหมายแจ้งเจ้าของบ้าน' : 'Ready to Generate Notice Letter'}
              </h3>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'จดหมายจะถูกสร้างด้วยข้อมูลจากสัญญาเช่าของคุณโดยอัตโนมัติ'
                  : 'Letter will be auto-populated with your lease information'}
              </p>
              <Button
                onClick={handleGenerateLetter}
                disabled={generatingLetter}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {generatingLetter ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.generatingLetter}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    {strings.generateLetter}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* English Version */}
            {generatedLetters.en && (
              <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-100 text-blue-800">
                        {strings.englishVersion}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(!editMode)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {editMode ? strings.cancelEdit : strings.editLetter}
                    </Button>
                  </div>

                  {editMode ? (
                    <ReactQuill
                      value={editedContent.en}
                      onChange={(content) => setEditedContent({ ...editedContent, en: content })}
                      theme="snow"
                      className="mb-4"
                      style={{ 
                        backgroundColor: colors.fieldBg,
                        minHeight: '400px'
                      }}
                    />
                  ) : (
                    <div 
                      className="prose max-w-none mb-4 p-4 rounded-lg"
                      style={{ 
                        backgroundColor: colors.fieldBg,
                        color: colors.textPrimary,
                        minHeight: '300px'
                      }}
                      dangerouslySetInnerHTML={{ __html: generatedLetters.en.html_content }}
                    />
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleDownload('en')}
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {strings.downloadLetter}
                    </Button>
                    <Button
                      onClick={() => handleCopy('en')}
                      variant="outline"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {strings.copyToClipboard}
                    </Button>
                    {user.landlord_email && (
                      <Button
                        onClick={() => handleSend('en')}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {strings.sendViaEmail}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Thai Version */}
            {generatedLetters.th && (
              <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-purple-100 text-purple-800">
                      {strings.thaiVersion}
                    </Badge>
                  </div>

                  {editMode ? (
                    <ReactQuill
                      value={editedContent.th}
                      onChange={(content) => setEditedContent({ ...editedContent, th: content })}
                      theme="snow"
                      className="mb-4"
                      style={{ 
                        backgroundColor: colors.fieldBg,
                        minHeight: '400px'
                      }}
                    />
                  ) : (
                    <div 
                      className="prose max-w-none mb-4 p-4 rounded-lg"
                      style={{ 
                        backgroundColor: colors.fieldBg,
                        color: colors.textPrimary,
                        minHeight: '300px'
                      }}
                      dangerouslySetInnerHTML={{ __html: generatedLetters.th.html_content }}
                    />
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleDownload('th')}
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {strings.downloadLetter}
                    </Button>
                    <Button
                      onClick={() => handleCopy('th')}
                      variant="outline"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {strings.copyToClipboard}
                    </Button>
                    {user.landlord_email && (
                      <Button
                        onClick={() => handleSend('th')}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {strings.sendViaEmail}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Secondary Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  haptic.light();
                  navigate(createPageUrl("Templates"));
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                {strings.changeTemplate}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  haptic.light();
                  navigate(createPageUrl("UploadScan") + `?leaseId=${lease.id}`);
                }}
              >
                {strings.viewLeaseDetails}
              </Button>
            </div>
          </div>
        )}

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent style={{ backgroundColor: colors.cardBg }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                {strings.letterGenerated}
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {language === 'th'
                  ? 'จดหมายของคุณพร้อมแล้ว! คุณสามารถดาวน์โหลด คัดลอก หรือส่งทางอีเมลได้'
                  : 'Your notice letter is ready! You can download, copy, or send it via email.'}
              </p>
            </div>
            <Button onClick={() => setShowSuccess(false)} className="w-full">
              {language === 'th' ? 'ดำเนินการต่อ' : 'Continue'}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function NoticeLetter() {
  return (
    <AuthGuard>
      <ToastProvider>
        <NoticeLetterContent />
      </ToastProvider>
    </AuthGuard>
  );
}