import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Edit2, Trash2, Upload, Loader2, CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff, Globe, Languages } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getLanguageLabel } from "../components/shared/languageRules";
import AuthGuard from "../components/shared/AuthGuard";

function AdminTemplatesContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    template_key: '',
    category: 'initial_resolution',
    title_en: '',
    title_th: '',
    description_en: '',
    description_th: '',
    cost_credits: 1,
    status: 'active',
    content_en: '',
    content_th: '',
    sort_order: 100
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  /**
   * ═══════════════════════════════════════════════════════════════════
   * SINGLE SOURCE OF TRUTH: TemplateLibrary Entity
   * ═══════════════════════════════════════════════════════════════════
   * 
   * This page directly reads/writes the TemplateLibrary entity.
   * No hardcoded arrays, no separate template stores.
   * 
   * User Templates page (pages/Templates.js) reads from the same entity.
   * 
   * Schema fields:
   * - template_key, category, title_en, title_th
   * - description_en, description_th
   * - content_en, content_th (flat fields for full template body)
   * - document_content (legacy nested object - read fallback, write to flat fields)
   * - cost_credits, status, sort_order
   * 
   * ═══════════════════════════════════════════════════════════════════
   */
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['templateLibrary'],
    queryFn: () => base44.entities.TemplateLibrary.list('sort_order'),
    enabled: !!user && ['admin', 'super_admin'].includes(user.access_level),
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data) => {
      // Check for duplicate template_key (case-insensitive)
      const existingTemplates = await base44.entities.TemplateLibrary.list();
      const duplicate = existingTemplates.find(
        t => t.template_key.toLowerCase() === data.template_key.toLowerCase()
      );
      
      if (duplicate) {
        throw new Error(`Template key "${data.template_key}" already exists — edit the existing template.`);
      }
      
      return base44.entities.TemplateLibrary.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateLibrary'] });
      setShowCreateDialog(false);
      resetForm();
      alert(language === 'th' ? 'สร้างเทมเพลตสำเร็จ' : 'Template created successfully');
    },
    onError: (error) => {
      alert((language === 'th' ? 'สร้างเทมเพลตล้มเหลว: ' : 'Failed to create template: ') + error.message);
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Check for duplicate template_key when updating (case-insensitive, exclude self)
      if (data.template_key) {
        const existingTemplates = await base44.entities.TemplateLibrary.list();
        const duplicate = existingTemplates.find(
          t => t.id !== id && t.template_key.toLowerCase() === data.template_key.toLowerCase()
        );
        
        if (duplicate) {
          throw new Error(`Template key "${data.template_key}" already exists — choose a different key.`);
        }
      }
      
      return base44.entities.TemplateLibrary.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateLibrary'] });
      setShowCreateDialog(false);
      setEditingTemplate(null);
      resetForm();
      alert(language === 'th' ? 'อัปเดตเทมเพลตสำเร็จ' : 'Template updated successfully');
    },
    onError: (error) => {
      alert((language === 'th' ? 'อัปเดตเทมเพลตล้มเหลว: ' : 'Failed to update template: ') + error.message);
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.TemplateLibrary.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateLibrary'] });
    },
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const isAdmin = ['admin', 'super_admin'].includes(user?.access_level);

  const categoryLabels = {
    checklists: language === 'th' ? 'รายการตรวจสอบ' : 'Checklists',
    pre_signing: language === 'th' ? 'เจรจาก่อนลงนาม' : 'Pre-Signing',
    initial_resolution: language === 'th' ? 'การแก้ไขเบื้องต้น' : 'Initial Resolution',
    professional: language === 'th' ? 'การยกระดับอย่างมืออาชีพ' : 'Professional',
    final: language === 'th' ? 'มาตรการสุดท้าย' : 'Final Measures'
  };

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
      titleEnglish: "Title (English)",
      titleThai: "Title (Thai)",
      descriptionEnglish: "Description (English)",
      descriptionThai: "Description (Thai)",
      creditCost: "Credit Cost",
      iconName: "Icon Name",
      selectFile: "Select Template File",
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
      fillAllFields: "Please fill in all required fields",
      confirmDelete: "Are you sure you want to delete this template?"
    },
    th: {
      title: "จัดการเทมเพลตจดหมาย",
      subtitle: "อัปโหลดและจัดการเทมเพลตสำหรับผู้ใช้",
      createTemplate: "สร้างเทมเพลต",
      editTemplate: "แก้ไขเทมเพลต",
      category: "หมวดหมู่",
      titleEnglish: "ชื่อ (อังกฤษ)",
      titleThai: "ชื่อ (ไทย)",
      descriptionEnglish: "คำอธิบาย (อังกฤษ)",
      descriptionThai: "คำอธิบาย (ไทย)",
      creditCost: "ต้นทุนเครดิต",
      iconName: "ชื่อไอคอน",
      selectFile: "เลือกไฟล์เทมเพลต",
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
      fillAllFields: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
      confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบเทมเพลตนี้?"
    }
  };

  const strings = t[language] || t.en;

  const resetForm = () => {
    setFormData({
      template_key: '',
      recipient_type: 'landlord',
      language_code: 'en',
      category: 'friendly',
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
      format: 'html'
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleCreateTemplate = async () => {
    // Validation: require all fields
    if (!formData.template_key || !formData.title_en || !formData.title_th) {
      alert(strings.fillAllFields);
      return;
    }

    // Content validation: if active, require non-empty EN + TH content
    if (formData.status === 'active') {
      if (!formData.content_en || formData.content_en.trim() === '') {
        alert(language === 'th' 
          ? '❌ เทมเพลตที่ใช้งานต้องมีเนื้อหาภาษาอังกฤษ' 
          : '❌ Active templates must have English content');
        return;
      }
      if (!formData.content_th || formData.content_th.trim() === '') {
        alert(language === 'th' 
          ? '❌ เทมเพลตที่ใช้งานต้องมีเนื้อหาภาษาไทย' 
          : '❌ Active templates must have Thai content');
        return;
      }
    }

    setUploadingFile(true);
    try {
      // ✅ SINGLE SOURCE OF TRUTH: Direct write to TemplateLibrary entity
      await createTemplateMutation.mutateAsync({
        template_key: formData.template_key,
        category: formData.category,
        title_en: formData.title_en,
        title_th: formData.title_th,
        description_en: formData.description_en,
        description_th: formData.description_th,
        cost_credits: formData.cost_credits,
        status: formData.status,
        content_en: formData.content_en,
        content_th: formData.content_th,
        sort_order: formData.sort_order
      });
    } catch (error) {
      console.error('Failed to create template:', error);
      // Error is already shown in onError
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.title_en || !formData.title_th) {
      alert(strings.fillAllFields);
      return;
    }

    // Content validation: if active, require non-empty EN + TH content
    if (formData.status === 'active') {
      if (!formData.content_en || formData.content_en.trim() === '') {
        alert(language === 'th' 
          ? '❌ เทมเพลตที่ใช้งานต้องมีเนื้อหาภาษาอังกฤษ' 
          : '❌ Active templates must have English content');
        return;
      }
      if (!formData.content_th || formData.content_th.trim() === '') {
        alert(language === 'th' 
          ? '❌ เทมเพลตที่ใช้งานต้องมีเนื้อหาภาษาไทย' 
          : '❌ Active templates must have Thai content');
        return;
      }
    }

    setUploadingFile(true);
    try {
      // ✅ SINGLE SOURCE OF TRUTH: Direct update to TemplateLibrary entity
      await updateTemplateMutation.mutateAsync({
        id: editingTemplate.id,
        data: {
          template_key: formData.template_key,
          category: formData.category,
          title_en: formData.title_en,
          title_th: formData.title_th,
          description_en: formData.description_en,
          description_th: formData.description_th,
          cost_credits: formData.cost_credits,
          status: formData.status,
          content_en: formData.content_en,
          content_th: formData.content_th,
          sort_order: formData.sort_order
        }
      });
    } catch (error) {
      console.error('Failed to update template:', error);
      // Error is already shown in onError
    } finally {
      setUploadingFile(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    
    // ✅ CONTENT FIELD BINDING: Handle both flat fields and nested document_content object
    const contentEn = template.content_en || template.document_content?.en || '';
    const contentTh = template.content_th || template.document_content?.th || '';
    
    console.log('📝 [ADMIN_TEMPLATES] Loading template for edit:', {
      template_key: template.template_key,
      content_en_length: contentEn.length,
      content_th_length: contentTh.length,
      has_document_content: !!template.document_content
    });
    
    setFormData({
      template_key: template.template_key || '',
      category: template.category,
      title_en: template.title_en,
      title_th: template.title_th,
      description_en: template.description_en || '',
      description_th: template.description_th || '',
      cost_credits: template.cost_credits || 1,
      status: template.status || 'active',
      content_en: contentEn,
      content_th: contentTh,
      sort_order: template.sort_order || 100
    });
    setShowCreateDialog(true);
  };

  const handleToggleActive = async (template) => {
    try {
      await updateTemplateMutation.mutateAsync({
        id: template.id,
        data: { status: template.status === 'active' ? 'inactive' : 'active' }
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
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
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

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {editingTemplate ? strings.editTemplate : strings.createTemplate}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label style={{ color: colors.textPrimary }}>Template Key *</Label>
                <Input
                  value={formData.template_key}
                  onChange={(e) => setFormData({...formData, template_key: e.target.value})}
                  placeholder="e.g., deposit_return_request"
                  className="mt-2"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                  disabled={!!editingTemplate}
                />
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  Lowercase, no spaces. Cannot be changed after creation.
                </p>
              </div>

              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.category}</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg }}>
                    <SelectItem value="checklists">{categoryLabels.checklists}</SelectItem>
                    <SelectItem value="pre_signing">{categoryLabels.pre_signing}</SelectItem>
                    <SelectItem value="initial_resolution">{categoryLabels.initial_resolution}</SelectItem>
                    <SelectItem value="professional">{categoryLabels.professional}</SelectItem>
                    <SelectItem value="final">{categoryLabels.final}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.titleEnglish} *</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData({...formData, title_en: e.target.value})}
                    className="mt-2"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.titleThai} *</Label>
                  <Input
                    value={formData.title_th}
                    onChange={(e) => setFormData({...formData, title_th: e.target.value})}
                    className="mt-2"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.creditCost}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.cost_credits}
                    onChange={(e) => setFormData({...formData, cost_credits: parseInt(e.target.value) || 1})}
                    className="mt-2"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                  />
                </div>
                <div>
                  <Label style={{ color: colors.textPrimary }}>Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 100})}
                    className="mt-2"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                  />
                </div>
              </div>

              <div>
                <Label style={{ color: colors.textPrimary }}>{'English Content * (use merge fields like {{tenant_name}})'}</Label>
                <Textarea
                  value={formData.content_en}
                  onChange={(e) => setFormData({...formData, content_en: e.target.value})}
                  className="mt-2 font-mono text-sm"
                  rows={8}
                  placeholder="Dear {{landlord_name}},..."
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
                {formData.status === 'active' && (!formData.content_en || formData.content_en.trim() === '') && (
                  <p className="text-xs mt-1 text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {language === 'th' ? 'จำเป็นสำหรับเทมเพลตที่ใช้งาน' : 'Required for active templates'}
                  </p>
                )}
              </div>

              <div>
                <Label style={{ color: colors.textPrimary }}>{'Thai Content * (use merge fields like {{tenant_name}})'}</Label>
                <Textarea
                  value={formData.content_th}
                  onChange={(e) => setFormData({...formData, content_th: e.target.value})}
                  className="mt-2 font-mono text-sm"
                  rows={8}
                  placeholder="เรียน {{landlord_name}},..."
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
                {formData.status === 'active' && (!formData.content_th || formData.content_th.trim() === '') && (
                  <p className="text-xs mt-1 text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {language === 'th' ? 'จำเป็นสำหรับเทมเพลตที่ใช้งาน' : 'Required for active templates'}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
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
          <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Key</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Title (EN)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template, idx) => (
                      <tr
                        key={template.id}
                        style={{
                          borderBottom: `1px solid ${colors.borderColor}`,
                          backgroundColor: idx % 2 === 0 ? colors.cardBg : (isDarkMode ? '#2A2D30' : '#F8FAFC')
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono" style={{ color: colors.textPrimary }}>{template.template_key}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[template.category] || template.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                         <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{template.title_en}</p>
                         <p className="text-xs" style={{ color: colors.textSecondary }}>{template.title_th}</p>
                         <div className="flex gap-2 mt-1">
                           {(template.content_en || template.document_content?.en) ? (
                             <Badge className="bg-blue-100 text-blue-700 text-xs">EN ✓</Badge>
                           ) : (
                             <Badge className="bg-red-100 text-red-700 text-xs">EN ✗</Badge>
                           )}
                           {(template.content_th || template.document_content?.th) ? (
                             <Badge className="bg-emerald-100 text-emerald-700 text-xs">TH ✓</Badge>
                           ) : (
                             <Badge className="bg-red-100 text-red-700 text-xs">TH ✗</Badge>
                           )}
                         </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-amber-100 text-amber-800">{template.cost_credits || 1}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {template.status === 'active' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              {strings.active}
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-800 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" />
                              {strings.inactive}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
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
                              {template.status === 'active' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function AdminTemplates() {
  return (
    <AuthGuard>
      <AdminTemplatesContent />
    </AuthGuard>
  );
}