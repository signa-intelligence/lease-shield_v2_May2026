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

  // Enforce uniqueness: Group templates by template_key
  const templatesByKey = templates.reduce((acc, t) => {
    const key = t.template_key || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  // Display only unique templates (first occurrence)
  const uniqueTemplates = Object.values(templatesByKey).map(group => {
    // Select canonical record: prefer complete, active, recent
    return group.sort((a, b) => {
      const aComplete = a.title_en && a.title_th;
      const bComplete = b.title_en && b.title_th;
      if (aComplete && !bComplete) return -1;
      if (!aComplete && bComplete) return 1;
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      return new Date(b.updated_date) - new Date(a.updated_date);
    })[0];
  });
  const [formData, setFormData] = useState({
    template_key: '',
    category: 'initial_resolution',
    title_en: '',
    title_th: '',
    description_en: '',
    description_th: '',
    credit_cost: 1,
    is_active: true,
    sort_order: 100
  });

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

  const categoryLabels = {
    pre_signing: strings.preSigning,
    friendly: strings.friendly,
    professional: strings.professional,
    final: strings.final
  };

  const resetForm = () => {
    setFormData({
      template_key: '',
      category: 'initial_resolution',
      title_en: '',
      title_th: '',
      description_en: '',
      description_th: '',
      credit_cost: 1,
      is_active: true,
      sort_order: 100
    });
  };



  const handleCreateTemplate = async () => {
    if (!formData.template_key || !formData.title_en || !formData.title_th) {
      alert(strings.fillAllFields);
      return;
    }

    // Check for duplicate template_key
    const existingTemplate = templates.find(t => t.template_key === formData.template_key);
    if (existingTemplate) {
      alert(language === 'th' 
        ? `ไม่สามารถสร้างได้: template_key "${formData.template_key}" มีอยู่แล้ว กรุณาแก้ไขแทน`
        : `Cannot create: template_key "${formData.template_key}" already exists. Please edit instead.`);
      return;
    }

    setUploadingFile(true);
    try {
      await createTemplateMutation.mutateAsync({
        template_key: formData.template_key,
        category: formData.category,
        title_en: formData.title_en,
        title_th: formData.title_th,
        description_en: formData.description_en,
        description_th: formData.description_th,
        credit_cost: formData.credit_cost,
        is_active: formData.is_active,
        sort_order: formData.sort_order
      });
    } catch (error) {
      console.error('Failed to create template:', error);
      alert(language === 'th' ? 'สร้างเทมเพลตล้มเหลว' : 'Failed to create template');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.template_key || !formData.title_en || !formData.title_th) {
      alert(strings.fillAllFields);
      return;
    }

    // Check for duplicate template_key (excluding current template)
    const existingTemplate = templates.find(t => t.template_key === formData.template_key && t.id !== editingTemplate.id);
    if (existingTemplate) {
      alert(language === 'th' 
        ? `ไม่สามารถอัปเดตได้: template_key "${formData.template_key}" ถูกใช้แล้ว`
        : `Cannot update: template_key "${formData.template_key}" is already in use.`);
      return;
    }

    setUploadingFile(true);
    try {
      await updateTemplateMutation.mutateAsync({
        id: editingTemplate.id,
        data: {
          template_key: formData.template_key,
          category: formData.category,
          title_en: formData.title_en,
          title_th: formData.title_th,
          description_en: formData.description_en,
          description_th: formData.description_th,
          credit_cost: formData.credit_cost,
          is_active: formData.is_active,
          sort_order: formData.sort_order
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
      category: template.category,
      title_en: template.title_en,
      title_th: template.title_th,
      description_en: template.description_en || '',
      description_th: template.description_th || '',
      credit_cost: template.credit_cost || 1,
      is_active: template.is_active !== false,
      sort_order: template.sort_order || 100
    });
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
                <Label style={{ color: colors.textPrimary }}>Template Key (UNIQUE Identifier) *</Label>
                <Input
                  value={formData.template_key}
                  onChange={(e) => setFormData({...formData, template_key: e.target.value})}
                  placeholder="e.g., deposit_return_request"
                  className="mt-2"
                  disabled={!!editingTemplate}
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                />
                {editingTemplate && (
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'ไม่สามารถเปลี่ยน template_key ได้' : 'Template key cannot be changed'}
                  </p>
                )}
              </div>



              <div>
                <Label style={{ color: colors.textPrimary }}>{strings.category} *</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.cardBg }}>
                    <SelectItem value="pre_signing_negotiation">Pre-Signing Negotiation</SelectItem>
                    <SelectItem value="initial_resolution">Initial Resolution</SelectItem>
                    <SelectItem value="professional_escalation">Professional Escalation</SelectItem>
                    <SelectItem value="final_measures">Final Measures</SelectItem>
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
                  <Label style={{ color: colors.textPrimary }}>Credit Cost *</Label>
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
                  <Label style={{ color: colors.textPrimary }}>Sort Order</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 100})}
                    placeholder="100"
                    className="mt-2"
                    style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
                  />
                </div>
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

        {uniqueTemplates.length === 0 ? (
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
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Template Key</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Title (EN)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Languages</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: colors.textSecondary }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueTemplates.map((template, idx) => (
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
                          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{template.title_en}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {template.title_en && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">EN</Badge>
                            )}
                            {template.title_th && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs">TH</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {template.category?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {template.is_active !== false ? (
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