
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, Trash2, ExternalLink, Shield, Camera, FileVideo, Mail, HelpCircle, CheckSquare, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const DOC_TYPE_CONFIG = {
  lease: { label: 'Lease', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  receipt: { label: 'Receipt', icon: FileText, color: 'bg-emerald-100 text-emerald-800' },
  photo: { label: 'Photo', icon: Camera, color: 'bg-purple-100 text-purple-800' },
  video: { label: 'Video', icon: FileVideo, color: 'bg-amber-100 text-amber-800' },
  letter: { label: 'Letter', icon: Mail, color: 'bg-indigo-100 text-indigo-800' },
  other: { label: 'Other', icon: HelpCircle, color: 'bg-slate-100 text-slate-800' }
};

export default function DocumentVault() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [uploadLabel, setUploadLabel] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createDocumentMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadLabel('');
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteBulkMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.Document.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocs([]);
    },
  });

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await createDocumentMutation.mutateAsync({
          type: uploadType,
          file_url,
          label: uploadLabel || file.name
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(doc => doc.id));
    }
  };

  const handleToggleSelect = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedDocs.length === 0) return;
    
    const confirmMessage = language === 'th' 
      ? `ลบไฟล์ ${selectedDocs.length} ไฟล์ใช่หรือไม่?`
      : `Delete ${selectedDocs.length} file(s)?`;
    
    if (confirm(confirmMessage)) {
      deleteBulkMutation.mutate(selectedDocs);
    }
  };

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    uploadBg: '#353A3D',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    inputBg: '#353A3D'
  } : {
    bg: '#ECEFED',
    cardBg: '#FFFFFF',
    uploadBg: '#F8FAFC',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    inputBg: '#FFFFFF'
  };

  const t = {
    en: {
      title: "Evidence Vault",
      subtitle: "Secure storage for all your rental documentation",
      uploadFiles: "Upload Files",
      documentType: "Document Type",
      customLabel: "Custom Label (optional)",
      selectFiles: "Select Files",
      uploading: "Uploading...",
      recentUploads: "Recent Uploads",
      viewTemplates: "View Templates",
      templatesDesc: "Professional letter templates",
      noDocuments: "No Documents Yet",
      noDocsSub: "Start building your evidence vault for better protection",
      uploadFirst: "Upload First Document",
      deleteConfirm: "Are you sure?",
      viewFile: "View File",
      selectAll: "Select All",
      deleteSelected: "Delete Selected",
      selected: "selected"
    },
    th: {
      title: "คลังหลักฐาน",
      subtitle: "จัดเก็บเอกสารการเช่าอย่างปลอดภัย",
      uploadFiles: "อัปโหลดไฟล์",
      documentType: "ประเภทเอกสาร",
      customLabel: "ป้ายกำกับที่กำหนดเอง (ไม่บังคับ)",
      selectFiles: "เลือกไฟล์",
      uploading: "กำลังอัปโหลด...",
      recentUploads: "อัปโหลดล่าสุด",
      viewTemplates: "ดูเทมเพลต",
      templatesDesc: "เทมเพลตจดหมายมืออาชีพ",
      noDocuments: "ยังไม่มีเอกสาร",
      noDocsSub: "เริ่มสร้างคลังหลักฐานเพื่อการป้องกันที่ดีขึ้น",
      uploadFirst: "อัปโหลดเอกสารแรก",
      deleteConfirm: "คุณแน่ใจหรือไม่?",
      viewFile: "ดูไฟล์",
      selectAll: "เลือกทั้งหมด",
      deleteSelected: "ลบที่เลือก",
      selected: "เลือกแล้ว"
    }
  };

  const strings = t[language];

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-ls-forest" />
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Upload Form - Left Side */}
          <Card className="border-none shadow-lg lg:col-span-1" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-ls-forest" />
                {strings.uploadFiles}
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label className="text-sm" style={{ color: colors.textPrimary }}>{strings.documentType}</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger className="mt-1 h-10" style={{
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      borderColor: colors.borderColor
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lease">Lease</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm" style={{ color: colors.textPrimary }}>{strings.customLabel}</Label>
                  <input
                    type="text"
                    value={uploadLabel}
                    onChange={(e) => setUploadLabel(e.target.value)}
                    placeholder="e.g., Move-in photos"
                    className="mt-1"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.borderColor}`,
                      outline: 'none',
                      height: '40px'
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="file-upload"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      border: `2px dashed ${colors.borderColor}`,
                      borderRadius: '12px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      backgroundColor: colors.uploadBg,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!uploading) e.target.style.borderColor = '#0C3B2E';
                    }}
                    onMouseLeave={(e) => {
                      if (!uploading) e.target.style.borderColor = colors.borderColor;
                    }}
                  >
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-2" style={{ color: colors.textSecondary }} />
                    <span className="text-sm font-medium text-center" style={{ color: colors.textPrimary }}>
                      {uploading ? strings.uploading : strings.selectFiles}
                    </span>
                    <span className="text-xs mt-1 text-center" style={{ color: colors.textSecondary }}>
                      PDF, Images, Videos
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
                </div>
              </div>

              {/* Templates Link */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl border" style={{
                backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
                borderColor: 'rgba(12, 59, 46, 0.2)'
              }}>
                <button
                  onClick={() => navigate(createPageUrl("Templates"))}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-ls-forest flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-xs sm:text-sm" style={{ color: colors.textPrimary }}>{strings.viewTemplates}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{strings.templatesDesc}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-ls-forest flex-shrink-0" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Uploads - Right Side */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 flex-wrap">
              <h3 className="font-bold text-base sm:text-lg" style={{ color: colors.textPrimary }}>{strings.recentUploads}</h3>
              {documents.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {selectedDocs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-medium" style={{ color: colors.textSecondary }}>
                        {selectedDocs.length} {strings.selected}
                      </span>
                      <Button
                        onClick={handleDeleteSelected}
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-xs h-8"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">{strings.deleteSelected}</span>
                        <span className="sm:hidden">Delete</span>
                      </Button>
                    </div>
                  )}
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm"
                    style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                      color: colors.textPrimary
                    }}
                  >
                    {selectedDocs.length === documents.length ? (
                      <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-ls-forest" />
                    ) : (
                      <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    <span className="font-medium">{strings.selectAll}</span>
                  </button>
                </div>
              )}
            </div>

            {documents.length === 0 ? (
              <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
                <CardContent className="p-8 sm:p-12 text-center">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" style={{ color: colors.textSecondary, opacity: 0.5 }} />
                  <h4 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.noDocuments}</h4>
                  <p className="mb-4 sm:mb-6 text-sm" style={{ color: colors.textSecondary }}>{strings.noDocsSub}</p>
                  <Button
                    onClick={() => document.getElementById('file-upload').click()}
                    className="text-sm"
                    style={{
                      backgroundColor: '#0C3B2E',
                      color: '#FFFFFF'
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {strings.uploadFirst}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {documents.map((doc) => {
                  const typeConfig = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.other;
                  const TypeIcon = typeConfig.icon;
                  const isSelected = selectedDocs.includes(doc.id);
                  
                  return (
                    <Card key={doc.id} className={`border-none shadow-md hover:shadow-lg transition-all duration-300 ${isSelected ? 'ring-2 ring-ls-forest' : ''}`} style={{
                      backgroundColor: colors.cardBg
                    }}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(doc.id)}
                            className="mt-1 flex-shrink-0"
                          />
                          <div className="flex items-start justify-between flex-1 min-w-0 gap-2">
                            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-lg flex-shrink-0" style={{
                                backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED'
                              }}>
                                <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-ls-forest" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs sm:text-sm truncate" style={{ color: colors.textPrimary }}>
                                  {doc.label}
                                </p>
                                <p className="text-xs" style={{ color: colors.textSecondary }}>
                                  {format(new Date(doc.created_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${typeConfig.color} text-xs flex-shrink-0`}>
                              {typeConfig.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Preview for images */}
                        {doc.type === 'photo' && doc.file_url && (
                          <div className="mb-2 sm:mb-3 ml-7 sm:ml-9">
                            <img
                              src={doc.file_url}
                              alt={doc.label}
                              className="w-full h-24 sm:h-32 object-cover rounded-lg"
                              style={{ border: `1px solid ${colors.borderColor}` }}
                            />
                          </div>
                        )}

                        <div className="flex gap-2 ml-7 sm:ml-9">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <button
                              style={{
                                width: '100%',
                                backgroundColor: '#0C3B2E',
                                color: '#FFFFFF',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                            >
                              <ExternalLink style={{ width: '12px', height: '12px' }} />
                              <span className="hidden sm:inline">{strings.viewFile}</span>
                              <span className="sm:hidden">View</span>
                            </button>
                          </a>
                          <button
                            onClick={() => {
                              if (confirm(strings.deleteConfirm)) {
                                deleteDocumentMutation.mutate(doc.id);
                              }
                            }}
                            style={{
                              backgroundColor: isDarkMode ? '#3A2626' : '#FFFFFF',
                              color: '#EF4444',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              border: '2px solid #EF4444',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#FEE2E2';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = isDarkMode ? '#3A2626' : '#FFFFFF';
                            }}
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
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
