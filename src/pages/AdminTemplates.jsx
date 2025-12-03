import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Edit2, Trash2, Upload, Loader2, CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff, Globe, Languages, File, FileDown, History, RotateCcw, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getLanguageLabel } from "../components/shared/languageRules";

export default function AdminTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [formData, setFormData] = useState({
    template_key: '',
    template_group_id: '',
    recipient_type: 'landlord',
    language_code: 'en',
    category: 'friendly',
    template_type: 'letter',
    title_en: '',
    title_th: '',
    description_en: '',
    description_th: '',
    credit_cost: 1,
    icon_name: 'FileText',
    is_active: true,
    file: null,
    subject_template: '',
    body_template: '',
    format: 'html',
    version: 1
  });
  const [previewFile, setPreviewFile] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['adminTemplates'],
    queryFn: () => base44.entities.TemplateLibrary.list('-created_date'),
    enabled: !!user && ['admin', 'super_admin'].includes(user.access_level),
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data) => base44.entities.TemplateLibrary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['customTemplates'] });
      setShowCreateDialog(false);
      resetForm();
      alert(language === 'th' ? 'สร้างเทมเพลตสำเร็จ' : 'Template created successfully');
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TemplateLibrary.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['customTemplates'] });
      setShowCreateDialog(false);
      setEditingTemplate(null);
      resetForm();
      alert(language === 'th' ? 'อัปเดตเทมเพลตสำเร็จ' : 'Template updated successfully');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.TemplateLibrary.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['customTemplates'] });
    },
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const isAdmin = ['admin', 'super_admin'].includes(user?.access_level);

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF'
  };

  const t = {
    en: {
      title: "Manage Letter Templates",
      subtitle: "Upload and manage templates for users",
      createTemplate: "Create Template",
      editTemplate: "Edit Template",
      category: "Category",
      templateType: "Template Type",
      titleEnglish: "Title (English)",
      titleThai: "Title (Thai)",
      descriptionEnglish: "Description (English)",
      descriptionThai: "Description (Thai)",
      creditCost: "Credit Cost",
      iconName: "Icon Name",
      selectFile: "Select Template File",
      replaceFile: "Replace File",
      uploading: "Uploading...",
      cancel: "Cancel",
      create: "Create",
      update: "Update",
      delete: "Delete",
      toggleActive: "Toggle Active",
      active: "Active",
      inactive: "Inactive",
      noTemplates: "No templates yet",
      createFirst: "Create your first template",
      back: "Back",
      preSigning: "Pre-Signing Negotiation",
      friendly: "Friendly Approach",
      professional: "Professional Escalation",
      final: "Final Measures",
      checklist: "Checklist",
      tenantLetters: "Tenant Letters",
      landlordLetters: "Landlord Letters",
      juristicLetters: "Juristic Letters",
      documentRequests: "Document Requests",
      paymentIssues: "Payment Issues",
      depositReturnProcesses: "Deposit Return Processes",
      letter: "Letter",
      checklistType: "Checklist",
      form: "Form",
      notice: "Notice",
      evidenceRequest: "Evidence Request",
      summaryReport: "Summary Report",
      paymentReminder: "Payment Reminder",
      legalAdvisoryNote: "Legal Advisory Note",
      fillAllFields: "Please fill in all required fields",
      confirmDelete: "Are you sure you want to delete this template?",
      templateKey: "Template Key",
      autoGenerated: "Auto-generated",
      filePreview: "File Preview",
      fileName: "File Name",
      fileSize: "File Size",
      lastModified: "Last Modified",
      versionHistory: "Version History",
      viewHistory: "View History",
      rollback: "Rollback",
      version: "Version",
      current: "Current",
      templateGroups: "Template Groups",
      languageVariants: "Language Variants",
      noFile: "No file uploaded yet"
    },
    th: {
      title: "จัดการเทมเพลตจดหมาย",
      subtitle: "อัปโหลดและจัดการเทมเพลตสำหรับผู้ใช้",
      createTemplate: "สร้างเทมเพลต",
      editTemplate: "แก้ไขเทมเพลต",
      category: "หมวดหมู่",
      templateType: "ประเภทเทมเพลต",
      titleEnglish: "ชื่อ (อังกฤษ)",
      titleThai: "ชื่อ (ไทย)",
      descriptionEnglish: "คำอธิบาย (อังกฤษ)",
      descriptionThai: "คำอธิบาย (ไทย)",
      creditCost: "ต้นทุนเครดิต",
      iconName: "ชื่อไอคอน",
      selectFile: "เลือกไฟล์เทมเพลต",
      replaceFile: "เปลี่ยนไฟล์",
      uploading: "กำลังอัปโหลด...",
      cancel: "ยกเลิก",
      create: "สร้าง",
      update: "อัปเดต",
      delete: "ลบ",
      toggleActive: "สลับสถานะ",
      active: "ใช้งาน",
      inactive: "ไม่ใช้งาน",
      noTemplates: "ยังไม่มีเทมเพลต",
      createFirst: "สร้างเทมเพลตแรกของคุณ",
      back: "กลับ",
      preSigning: "เจรจาก่อนลงนาม",
      friendly: "แนวทางเป็นมิตร",
      professional: "การยกระดับอย่างมืออาชีพ",
      final: "มาตรการสุดท้าย",
      checklist: "รายการตรวจสอบ",
      tenantLetters: "จดหมายผู้เช่า",
      landlordLetters: "จดหมายเจ้าของบ้าน",
      juristicLetters: "จดหมายนิติบุคคล",
      documentRequests: "คำขอเอกสาร",
      paymentIssues: "ปัญหาการชำระเงิน",
      depositReturnProcesses: "กระบวนการคืนเงินมัดจำ",
      letter: "จดหมาย",
      checklistType: "รายการตรวจสอบ",
      form: "แบบฟอร์ม",
      notice: "การแจ้งเตือน",
      evidenceRequest: "คำขอหลักฐาน",
      summaryReport: "รายงานสรุป",
      paymentReminder: "การแจ้งเตือนการชำระเงิน",
      legalAdvisoryNote: "บันทึกคำแนะนำทางกฎหมาย",
      fillAllFields: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
      confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบเทมเพลตนี้?",
      templateKey: "รหัสเทมเพลต",
      autoGenerated: "สร้างอัตโนมัติ",
      filePreview: "ตัวอย่างไฟล์",
      fileName: "ชื่อไฟล์",
      fileSize: "ขนาดไฟล์",
      lastModified: "แก้ไขล่าสุด",
      versionHistory: "ประวัติเวอร์ชัน",
      viewHistory: "ดูประวัติ",
      rollback: "ย้อนกลับ",
      version: "เวอร์ชัน",
      current: "ปัจจุบัน",
      templateGroups: "กลุ่มเทมเพลต",
      languageVariants: "รูปแบบภาษา",
      noFile: "ยังไม่มีไฟล์อัปโหลด"
    }
  };

  const strings = t[language] || t.en;

  const categoryLabels = {
    pre_signing: strings.preSigning,
    friendly: strings.friendly,
    professional: strings.professional,
    final: strings.final,
    checklist: strings.checklist,
    tenant_letters: strings.tenantLetters,
    landlord_letters: strings.landlordLetters,
    juristic_letters: strings.juristicLetters,
    document_requests: strings.documentRequests,
    payment_issues: strings.paymentIssues,
    deposit_return_processes: strings.depositReturnProcesses
  };

  const templateTypeLabels = {
    letter: strings.letter,
    checklist: strings.checklistType,
    form: strings.form,
    notice: strings.notice,
    evidence_request: strings.evidenceRequest,
    summary_report: strings.summaryReport,
    payment_reminder: strings.paymentReminder,
    legal_advisory_note: strings.legalAdvisoryNote
  };

  // Auto-generate template key based on recipient, category, type, language
  useEffect(() => {
    const { recipient_type, category, template_type, language_code } = formData;
    if (recipient_type && category && template_type && language_code && !editingTemplate) {
      const baseKey = `${recipient_type}_${category}_${template_type}_${language_code}`;
      
      // Find existing templates with same base to determine version
      const existingVersions = templates.filter(t => 
        t.template_key?.startsWith(baseKey)
      );
      const nextVersion = existingVersions.length + 1;
      
      const generatedKey = `${baseKey}_v${nextVersion}`;
      const groupId = `${recipient_type}_${category}_${template_type}`;
      
      setFormData(prev => ({
        ...prev,
        template_key: generatedKey,
        template_group_id: groupId,
        version: nextVersion
      }));
    }
  }, [formData.recipient_type, formData.category, formData.template_type, formData.language_code, editingTemplate, templates]);

  const resetForm = () => {
    setFormData({
      template_key: '',
      template_group_id: '',
      recipient_type: 'landlord',
      language_code: 'en',
      category: 'friendly',
      template_type: 'letter',
      title_en: '',
      title_th: '',
      description_en: '',
      description_th: '',
      credit_cost: 1,
      icon_name: 'FileText',
      is_active: true,
      file: null,
      subject_template: '',
      body_template: '',
      format: 'html',
      version: 1
    });
    setPreviewFile(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
      setPreviewFile({
        name: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified)
      });
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.title_en || !formData.title_th || !formData.file) {
      alert(strings.fillAllFields);
      return;
    }

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });

      const newVersionHistory = [{
        version: formData.version,
        file_url: file_url,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.email,
        file_name: formData.file.name,
        file_size: formData.file.size
      }];

      await createTemplateMutation.mutateAsync({
        template_key: formData.template_key,
        template_group_id: formData.template_group_id,
        recipient_type: formData.recipient_type,
        language_code: formData.language_code,
        category: formData.category,
        template_type: formData.template_type,
        version: formData.version,
        version_history: newVersionHistory,
        title_en: formData.title_en,
        title_th: formData.title_th,
        description_en: formData.description_en,
        description_th: formData.description_th,
        credit_cost: formData.credit_cost,
        icon_name: formData.icon_name,
        is_active: formData.is_active,
        file_url: file_url,
        file_name: formData.file.name,
        file_size: formData.file.size,
        file_last_modified: new Date().toISOString(),
        subject_template: formData.subject_template,
        body_template: formData.body_template,
        format: formData.format
      });
    } catch (error) {
      console.error('Failed to create template:', error);
      alert(language === 'th' ? 'สร้างเทมเพลตล้มเหลว' : 'Failed to create template');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.title_en || !formData.title_th) {
      alert(strings.fillAllFields);
      return;
    }

    setUploadingFile(true);
    try {
      let fileUrl = editingTemplate.file_url;
      let fileName = editingTemplate.file_name;
      let fileSize = editingTemplate.file_size;
      let newVersion = editingTemplate.version || 1;
      let versionHistory = editingTemplate.version_history || [];

      if (formData.file) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });
        fileUrl = file_url;
        fileName = formData.file.name;
        fileSize = formData.file.size;
        newVersion = (editingTemplate.version || 1) + 1;

        // Add to version history
        versionHistory = [
          ...versionHistory,
          {
            version: newVersion,
            file_url: file_url,
            uploaded_at: new Date().toISOString(),
            uploaded_by: user.email,
            file_name: formData.file.name,
            file_size: formData.file.size
          }
        ];
      }

      await updateTemplateMutation.mutateAsync({
        id: editingTemplate.id,
        data: {
          template_key: formData.template_key,
          template_group_id: formData.template_group_id,
          recipient_type: formData.recipient_type,
          language_code: formData.language_code,
          category: formData.category,
          template_type: formData.template_type,
          version: newVersion,
          version_history: versionHistory,
          title_en: formData.title_en,
          title_th: formData.title_th,
          description_en: formData.description_en,
          description_th: formData.description_th,
          credit_cost: formData.credit_cost,
          icon_name: formData.icon_name,
          is_active: formData.is_active,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_last_modified: formData.file ? new Date().toISOString() : editingTemplate.file_last_modified,
          subject_template: formData.subject_template,
          body_template: formData.body_template,
          format: formData.format
        }
      });
    } catch (error) {
      console.error('Failed to update template:', error);
      alert(language === 'th' ? 'อัปเดตเทมเพลตล้มเหลว' : 'Failed to update template');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_key: template.template_key || '',
      template_group_id: template.template_group_id || '',
      recipient_type: template.recipient_type || 'landlord',
      language_code: template.language_code || 'en',
      category: template.category,
      template_type: template.template_type || 'letter',
      title_en: template.title_en,
      title_th: template.title_th,
      description_en: template.description_en || '',
      description_th: template.description_th || '',
      credit_cost: template.credit_cost || 1,
      icon_name: template.icon_name || 'FileText',
      is_active: template.is_active !== false,
      file: null,
      subject_template: template.subject_template || '',
      body_template: template.body_template || '',
      format: template.format || 'html',
      version: template.version || 1
    });
    if (template.file_url) {
      setPreviewFile({
        name: template.file_name || template.file_url.split('/').pop(),
        size: template.file_size || 0,
        lastModified: template.file_last_modified ? new Date(template.file_last_modified) : null,
        url: template.file_url
      });
    }
    setShowCreateDialog(true);
  };

  const handleToggleActive = async (template) => {
    try {
      await updateTemplateMutation.mutateAsync({
        id: template.id,
        data: { is_active: !template.is_active }
      });
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(strings.confirmDelete)) return;

    try {
      await deleteTemplateMutation.mutateAsync(template.id);
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert(language === 'th' ? 'ลบเทมเพลตล้มเหลว' : 'Failed to delete template');
    }
  };

  const handleRollback = async (template, targetVersion) => {
    if (!confirm(`Rollback to version ${targetVersion.version}?`)) return;

    try {
      await updateTemplateMutation.mutateAsync({
        id: template.id,
        data: {
          file_url: targetVersion.file_url,
          file_name: targetVersion.file_name,
          file_size: targetVersion.file_size,
          version: targetVersion.version,
          file_last_modified: new Date().toISOString()
        }
      });
      setShowVersionHistory(null);
    } catch (error) {
      console.error('Failed to rollback:', error);
      alert('Rollback failed');
    }
  };

  // Group templates by template_group_id
  const groupedTemplates = templates.reduce((acc, template) => {
    const groupId = template.template_group_id || template.template_key || template.id;
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(template);
    return acc;
  }, {});

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>Access Denied</h2>
            <p style={{ color: colors.textSecondary }}>Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("AdminConsole"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.back}
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
              {strings.title}
            </h1>
            <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          </div>
          <Button
            onClick={() => {
              setEditingTemplate(null);
              resetForm();
              setShowCreateDialog(true);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {strings.createTemplate}
          </Button>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <DialogHeader style={{ flexShrink: 0 }}>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {editingTemplate ? strings.editTemplate : strings.createTemplate}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-2" style={{ minHeight: 0 }}>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column - Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label style={{ color: colors.textPrimary }}>
                      {strings.templateKey} 
                      <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">{strings.autoGenerated}</Badge>
                    </Label>
                    <Input
                      value={formData.template_key}
                      readOnly
                      className="mt-2 font-mono text-xs"
                      style={{ 
                        backgroundColor: isDarkMode ? '#1A1D1F' : '#F3F4F6', 
                        borderColor: colors.borderColor, 
                        color: colors.textSecondary,
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: colors.textPrimary }}>Recipient Type</Label>
                      <Select value={formData.recipient_type} onValueChange={(val) => setFormData({...formData, recipient_type: val})}>
                        <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.cardBg }}>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="landlord">Landlord</SelectItem>
                          <SelectItem value="juristic">Juristic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label style={{ color: colors.textPrimary }}>
                        <Globe className="w-4 h-4 inline mr-1" />
                        Language
                      </Label>
                      <Select value={formData.language_code} onValueChange={(val) => setFormData({...formData, language_code: val})}>
                        <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.cardBg }}>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                          <SelectItem value="th">🇹🇭 Thai</SelectItem>
                          <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                          <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                          <SelectItem value="ko">🇰🇷 Korean</SelectItem>
                          <SelectItem value="ru">🇷🇺 Russian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label style={{ color: colors.textPrimary }}>{strings.category}</Label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                      <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.cardBg }}>
                        <SelectItem value="pre_signing">{categoryLabels.pre_signing}</SelectItem>
                        <SelectItem value="friendly">{categoryLabels.friendly}</SelectItem>
                        <SelectItem value="professional">{categoryLabels.professional}</SelectItem>
                        <SelectItem value="final">{categoryLabels.final}</SelectItem>
                        <SelectItem value="checklist">{categoryLabels.checklist}</SelectItem>
                        <SelectItem value="tenant_letters">{categoryLabels.tenant_letters}</SelectItem>
                        <SelectItem value="landlord_letters">{categoryLabels.landlord_letters}</SelectItem>
                        <SelectItem value="juristic_letters">{categoryLabels.juristic_letters}</SelectItem>
                        <SelectItem value="document_requests">{categoryLabels.document_requests}</SelectItem>
                        <SelectItem value="payment_issues">{categoryLabels.payment_issues}</SelectItem>
                        <SelectItem value="deposit_return_processes">{categoryLabels.deposit_return_processes}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{ color: colors.textPrimary }}>{strings.templateType}</Label>
                    <Select value={formData.template_type} onValueChange={(val) => setFormData({...formData, template_type: val})}>
                      <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.cardBg }}>
                        <SelectItem value="letter">{templateTypeLabels.letter}</SelectItem>
                        <SelectItem value="checklist">{templateTypeLabels.checklist}</SelectItem>
                        <SelectItem value="form">{templateTypeLabels.form}</SelectItem>
                        <SelectItem value="notice">{templateTypeLabels.notice}</SelectItem>
                        <SelectItem value="evidence_request">{templateTypeLabels.evidence_request}</SelectItem>
                        <SelectItem value="summary_report">{templateTypeLabels.summary_report}</SelectItem>
                        <SelectItem value="payment_reminder">{templateTypeLabels.payment_reminder}</SelectItem>
                        <SelectItem value="legal_advisory_note">{templateTypeLabels.legal_advisory_note}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.titleEnglish}</Label>
                      <Input
                        value={formData.title_en}
                        onChange={(e) => setFormData({...formData, title_en: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.titleThai}</Label>
                      <Input
                        value={formData.title_th}
                        onChange={(e) => setFormData({...formData, title_th: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label style={{ color: colors.textPrimary }}>{strings.descriptionEnglish}</Label>
                    <Textarea
                      value={formData.description_en}
                      onChange={(e) => setFormData({...formData, description_en: e.target.value})}
                      className="mt-2"
                      rows={2}
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>

                  <div>
                    <Label style={{ color: colors.textPrimary }}>{strings.descriptionThai}</Label>
                    <Textarea
                      value={formData.description_th}
                      onChange={(e) => setFormData({...formData, description_th: e.target.value})}
                      className="mt-2"
                      rows={2}
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.creditCost}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.credit_cost}
                        onChange={(e) => setFormData({...formData, credit_cost: parseInt(e.target.value) || 1})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.iconName}</Label>
                      <Input
                        value={formData.icon_name}
                        onChange={(e) => setFormData({...formData, icon_name: e.target.value})}
                        placeholder="FileText"
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label style={{ color: colors.textPrimary }}>
                      {editingTemplate && formData.file ? strings.replaceFile : strings.selectFile}
                    </Label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="mt-2 w-full"
                      accept=".pdf,.doc,.docx,.html"
                      style={{ color: colors.textPrimary }}
                    />
                  </div>
                </div>

                {/* Right Column - File Preview */}
                <div>
                  <div className="sticky top-0">
                    <div className="p-4 rounded-lg border-2" style={{ 
                      backgroundColor: colors.inputBg, 
                      borderColor: colors.borderColor 
                    }}>
                      <div className="flex items-center gap-2 mb-4">
                        <File className="w-5 h-5" style={{ color: colors.textPrimary }} />
                        <h3 className="font-bold" style={{ color: colors.textPrimary }}>{strings.filePreview}</h3>
                      </div>

                      {previewFile ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.fileName}</p>
                            <p className="text-sm font-mono truncate" style={{ color: colors.textPrimary }}>{previewFile.name}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.fileSize}</p>
                            <p className="text-sm" style={{ color: colors.textPrimary }}>{formatFileSize(previewFile.size)}</p>
                          </div>
                          {previewFile.lastModified && (
                            <div>
                              <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{strings.lastModified}</p>
                              <p className="text-sm" style={{ color: colors.textPrimary }}>
                                {previewFile.lastModified.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {previewFile.url && (
                            <a
                              href={previewFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-semibold"
                            >
                              <FileDown className="w-4 h-4" />
                              Download Current Version
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto mb-2" style={{ color: colors.textSecondary, opacity: 0.3 }} />
                          <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.noFile}</p>
                        </div>
                      )}

                      {/* Version History */}
                      {editingTemplate && editingTemplate.version_history && editingTemplate.version_history.length > 0 && (
                        <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.borderColor }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <History className="w-4 h-4" style={{ color: colors.textPrimary }} />
                              <h4 className="font-bold text-sm" style={{ color: colors.textPrimary }}>{strings.versionHistory}</h4>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowVersionHistory(editingTemplate)}
                              className="text-xs"
                            >
                              {strings.viewHistory}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {editingTemplate.version_history.slice(-3).reverse().map((ver, idx) => (
                              <div key={idx} className="text-xs p-2 rounded" style={{ 
                                backgroundColor: colors.cardBg,
                                border: ver.version === editingTemplate.version ? `2px solid #10B981` : `1px solid ${colors.borderColor}`
                              }}>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold" style={{ color: colors.textPrimary }}>
                                    v{ver.version} {ver.version === editingTemplate.version && `(${strings.current})`}
                                  </span>
                                  <span style={{ color: colors.textSecondary }}>
                                    {formatFileSize(ver.file_size)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}`, paddingTop: '16px' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                disabled={uploadingFile}
              >
                {strings.cancel}
              </Button>
              <Button
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                disabled={uploadingFile}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.uploading}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {editingTemplate ? strings.update : strings.create}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Version History Modal */}
        <Dialog open={!!showVersionHistory} onOpenChange={(open) => !open && setShowVersionHistory(null)}>
          <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor, maxWidth: '600px' }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                <History className="w-5 h-5 inline mr-2" />
                {strings.versionHistory}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {showVersionHistory?.version_history?.slice().reverse().map((ver, idx) => (
                <div key={idx} className="p-4 rounded-lg border" style={{ 
                  backgroundColor: ver.version === showVersionHistory.version ? (isDarkMode ? '#1E3A2E' : '#F0FDF4') : colors.inputBg,
                  borderColor: ver.version === showVersionHistory.version ? '#10B981' : colors.borderColor
                }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold" style={{ color: colors.textPrimary }}>
                          {strings.version} {ver.version}
                        </h4>
                        {ver.version === showVersionHistory.version && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">{strings.current}</Badge>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        {new Date(ver.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                    {ver.version !== showVersionHistory.version && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRollback(showVersionHistory, ver)}
                        className="text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        {strings.rollback}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1 text-xs" style={{ color: colors.textSecondary }}>
                    <p>📄 {ver.file_name}</p>
                    <p>💾 {formatFileSize(ver.file_size)}</p>
                    <p>👤 {ver.uploaded_by}</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Grouped Template List */}
        {templates.length === 0 ? (
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.3 }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {strings.noTemplates}
              </h3>
              <p className="mb-4" style={{ color: colors.textSecondary }}>{strings.createFirst}</p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {strings.createTemplate}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
              <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                <CardTitle style={{ color: colors.textPrimary }}>
                  <Folder className="w-5 h-5 inline mr-2" />
                  {strings.templateGroups}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {Object.entries(groupedTemplates).map(([groupId, groupTemplates]) => {
                    const isExpanded = expandedGroups[groupId];
                    const mainTemplate = groupTemplates[0];
                    const languageCount = groupTemplates.length;

                    return (
                      <div key={groupId} className="border rounded-lg" style={{ borderColor: colors.borderColor }}>
                        <div
                          className="p-4 cursor-pointer hover:bg-opacity-80 transition-all"
                          style={{ backgroundColor: colors.inputBg }}
                          onClick={() => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                                    {mainTemplate.title_en}
                                  </h4>
                                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                                    {templateTypeLabels[mainTemplate.template_type] || mainTemplate.template_type}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {mainTemplate.recipient_type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                                  <Languages className="w-3 h-3" />
                                  <span>{languageCount} {strings.languageVariants}</span>
                                  <span>•</span>
                                  <span>{categoryLabels[mainTemplate.category]}</span>
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800">
                              {mainTemplate.credit_cost} credit{mainTemplate.credit_cost > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t" style={{ borderColor: colors.borderColor }}>
                            {groupTemplates.map((template, idx) => (
                              <div
                                key={template.id}
                                className="p-4 flex items-center justify-between hover:bg-opacity-50 transition-all"
                                style={{
                                  backgroundColor: idx % 2 === 0 ? colors.cardBg : colors.inputBg,
                                  borderBottom: idx < groupTemplates.length - 1 ? `1px solid ${colors.borderColor}` : 'none'
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {template.language_code.toUpperCase()}
                                  </Badge>
                                  <div>
                                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                      {language === 'th' && template.title_th ? template.title_th : template.title_en}
                                    </p>
                                    <p className="text-xs font-mono" style={{ color: colors.textSecondary }}>
                                      {template.template_key} • v{template.version || 1}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {template.is_active !== false ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {strings.active}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-slate-100 text-slate-800 flex items-center gap-1">
                                      <XCircle className="w-3 h-3" />
                                      {strings.inactive}
                                    </Badge>
                                  )}
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEdit(template)}
                                      className="h-7"
                                    >
                                      <Edit2 className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleToggleActive(template)}
                                      className="h-7"
                                    >
                                      {template.is_active !== false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDelete(template)}
                                      className="h-7 text-red-600 border-red-200"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}