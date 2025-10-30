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

  const language = user?.language || 'en';

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
      viewFile: "View File"
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
      viewFile: "ดูไฟล์"
    }
  };

  const strings = t[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-ls-forest" />
            <h1 className="text-3xl font-bold text-ls-charcoal">{strings.title}</h1>
          </div>
          <p className="text-slate-600">{strings.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Upload Form - Left Side */}
          <Card className="border-none shadow-lg lg:col-span-1">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-ls-charcoal mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-ls-forest" />
                {strings.uploadFiles}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>{strings.documentType}</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger>
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
                  <Label>{strings.customLabel}</Label>
                  <input
                    type="text"
                    value={uploadLabel}
                    onChange={(e) => setUploadLabel(e.target.value)}
                    placeholder="e.g., Move-in photos"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ls-forest"
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
                      border: '2px dashed #D1D5DB',
                      borderRadius: '12px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      backgroundColor: '#F9FAFB',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!uploading) e.target.style.borderColor = '#0C3B2E';
                    }}
                    onMouseLeave={(e) => {
                      if (!uploading) e.target.style.borderColor = '#D1D5DB';
                    }}
                  >
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-slate-700">
                      {uploading ? strings.uploading : strings.selectFiles}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
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
              <div className="mt-6 p-4 bg-ls-stone rounded-xl border border-ls-forest/20">
                <button
                  onClick={() => navigate(createPageUrl("Templates"))}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-ls-forest" />
                    <div className="text-left">
                      <p className="font-bold text-sm text-ls-charcoal">{strings.viewTemplates}</p>
                      <p className="text-xs text-slate-600">{strings.templatesDesc}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-ls-forest" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Uploads - Right Side */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg text-ls-charcoal mb-4">{strings.recentUploads}</h3>
            {documents.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-ls-charcoal mb-2">{strings.noDocuments}</h4>
                  <p className="text-slate-600 mb-6">{strings.noDocsSub}</p>
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
                    <Card key={doc.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-ls-stone rounded-lg flex-shrink-0">
                              <TypeIcon className="w-5 h-5 text-ls-forest" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-ls-charcoal truncate">
                                {doc.label}
                              </p>
                              <p className="text-xs text-slate-500">
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
                              className="w-full h-32 object-cover rounded-lg border border-slate-200"
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
                              backgroundColor: '#FFFFFF',
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
                              e.target.style.backgroundColor = '#FFFFFF';
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