
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Trash2, ExternalLink, Shield, Camera, FileVideo, Mail, HelpCircle } from "lucide-react";
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

  // Calculate storage limits
  const getBaseStorageFromPlan = (tier) => {
    const storageLimits = {
      free: 100, // MB
      lite: 1024, // 1 GB
      protect: 5120, // 5 GB
      secure: 20480 // 20 GB
    };
    return storageLimits[tier] || 100;
  };

  const { data: storageAddons = [] } = useQuery({
    queryKey: ['storageAddons'],
    queryFn: () => base44.entities.StorageAddon.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user,
  });

  const baseStorageMB = getBaseStorageFromPlan(user?.plan_tier || 'free');
  // storageAddons.addon_size_gb is in GB, convert to MB
  const addonStorageMB = storageAddons.reduce((total, addon) => total + (addon.addon_size_gb * 1024), 0);
  const totalStorageMB = baseStorageMB + addonStorageMB;
  const usedStorageMB = user?.storage_used_mb || 0;
  const availableStorageMB = totalStorageMB - usedStorageMB;
  const storagePercentage = (usedStorageMB / totalStorageMB) * 100;

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

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check storage before upload
    const totalSizeMB = Array.from(files).reduce((sum, file) => sum + (file.size / 1024 / 1024), 0);
    
    if (totalSizeMB > availableStorageMB) {
      const shortfall = (totalSizeMB - availableStorageMB).toFixed(2);
      alert(
        language === 'th'
          ? `พื้นที่จัดเก็บไม่เพียงพอ ต้องการเพิ่ม ${shortfall} MB\n\nกรุณาอัปเกรดในหน้าบัญชี`
          : `Insufficient storage. Need ${shortfall} MB more.\n\nPlease upgrade in Account page.`
      );
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const fileSizeMB = file.size / 1024 / 1024;
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        await createDocumentMutation.mutateAsync({
          type: uploadType,
          file_url,
          label: uploadLabel || file.name
        });

        // Update storage usage
        const newStorageUsed = (user?.storage_used_mb || 0) + fileSizeMB;
        await base44.auth.updateMe({ storage_used_mb: newStorageUsed });
      }
      // Invalidate current user query to reflect updated storage_used_mb
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (error) {
      console.error('Upload failed:', error);
      alert(language === 'th' ? 'การอัปโหลดล้มเหลว' : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

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
      used: "used",
      addStorage: "Add Storage →",
      uploadFailed: "Upload failed"
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
      used: "ใช้ไปแล้ว",
      addStorage: "เพิ่มพื้นที่ →",
      uploadFailed: "การอัปโหลดล้มเหลว"
    }
  };

  const strings = t[language];

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
          </div>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          
          {/* Storage indicator */}
          <div className="mt-3 p-3 rounded-lg" style={{ 
            backgroundColor: isDarkMode ? '#2A2D30' : '#F8FAFC',
            border: `2px solid ${storagePercentage >= 90 ? '#EF4444' : storagePercentage >= 75 ? '#F59E0B' : colors.borderColor}`
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {(usedStorageMB / 1024).toFixed(2)} GB / {(totalStorageMB / 1024).toFixed(1)} GB
              </span>
              <span className="text-xs font-semibold" style={{ 
                color: storagePercentage >= 90 ? '#EF4444' : storagePercentage >= 75 ? '#F59E0B' : '#10B981'
              }}>
                {storagePercentage.toFixed(0)}% {strings.used}
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDarkMode ? '#1A1D1F' : '#E5E7EB' }}>
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(storagePercentage, 100)}%`,
                  backgroundColor: storagePercentage >= 90 ? '#EF4444' : storagePercentage >= 75 ? '#F59E0B' : '#10B981'
                }}
              />
            </div>
            {storagePercentage >= 90 && (
              <button
                onClick={() => navigate(createPageUrl("Account"))}
                className="mt-2 text-xs font-semibold underline"
                style={{ color: '#EF4444' }}
              >
                {strings.addStorage}
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Upload Form - Left Side */}
          <Card className="border-none shadow-lg lg:col-span-1" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Upload className="w-5 h-5 text-ls-forest" />
                {strings.uploadFiles}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label style={{ color: colors.textPrimary }}>{strings.documentType}</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger style={{
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
                  <Label style={{ color: colors.textPrimary }}>{strings.customLabel}</Label>
                  <input
                    type="text"
                    value={uploadLabel}
                    onChange={(e) => setUploadLabel(e.target.value)}
                    placeholder="e.g., Move-in photos"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.borderColor}`,
                      outline: 'none'
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
                      padding: '24px',
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
                    <Upload className="w-8 h-8 mb-2" style={{ color: colors.textSecondary }} />
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {uploading ? strings.uploading : strings.selectFiles}
                    </span>
                    <span className="text-xs mt-1" style={{ color: colors.textSecondary }}>
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
              <div className="mt-6 p-4 rounded-xl border" style={{
                backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
                borderColor: 'rgba(12, 59, 46, 0.2)'
              }}>
                <button
                  onClick={() => navigate(createPageUrl("Templates"))}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-ls-forest" />
                    <div className="text-left">
                      <p className="font-bold text-sm" style={{ color: colors.textPrimary }}>{strings.viewTemplates}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{strings.templatesDesc}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-ls-forest" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Uploads - Right Side */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg mb-4" style={{ color: colors.textPrimary }}>{strings.recentUploads}</h3>
            {documents.length === 0 ? (
              <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.5 }} />
                  <h4 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.noDocuments}</h4>
                  <p className="mb-6" style={{ color: colors.textSecondary }}>{strings.noDocsSub}</p>
                  <Button
                    onClick={() => document.getElementById('file-upload').click()}
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
              <div className="grid md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const typeConfig = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.other;
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <Card key={doc.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300" style={{
                      backgroundColor: colors.cardBg
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg flex-shrink-0" style={{
                              backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED'
                            }}>
                              <TypeIcon className="w-5 h-5 text-ls-forest" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate" style={{ color: colors.textPrimary }}>
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

                        {/* Preview for images */}
                        {doc.type === 'photo' && doc.file_url && (
                          <div className="mb-3">
                            <img
                              src={doc.file_url}
                              alt={doc.label}
                              className="w-full h-32 object-cover rounded-lg"
                              style={{ border: `1px solid ${colors.borderColor}` }}
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
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
                                fontSize: '13px',
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
                              <ExternalLink style={{ width: '14px', height: '14px' }} />
                              {strings.viewFile}
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
                              fontSize: '13px',
                              border: '2px solid #EF4444',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
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
