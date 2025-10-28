import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Upload, FileText, Image, Video, Mail, File, Plus, ExternalLink, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DOC_TYPES = [
  { value: 'lease', label: 'Lease Agreement', icon: FileText, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'receipt', label: 'Receipt', icon: FileText, color: 'bg-ls-gold/20 text-amber-800 border-amber-200' },
  { value: 'photo', label: 'Photo', icon: Image, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'video', label: 'Video', icon: Video, color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { value: 'letter', label: 'Letter', icon: Mail, color: 'bg-ls-forest/10 text-ls-forest border-ls-forest/20' },
  { value: 'other', label: 'Other', icon: File, color: 'bg-slate-100 text-slate-800 border-slate-200' }
];

export default function DocumentVault() {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'other',
    label: '',
    file: null
  });
  const [filterType, setFilterType] = useState('all');
  
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

  const t = {
    en: {
      title: "Evidence Vault",
      subtitle: "Photo and video logs with timestamps for property condition",
      uploadDocument: "Upload Evidence",
      noDocuments: "No evidence files yet",
      uploadFirst: "Upload First Evidence File",
      allEvidence: "All Evidence"
    },
    th: {
      title: "คลังหลักฐาน",
      subtitle: "บันทึกภาพและวิดีโอพร้อมเวลาสำหรับสภาพทรัพย์สิน",
      uploadDocument: "อัปโหลดหลักฐาน",
      noDocuments: "ยังไม่มีไฟล์หลักฐาน",
      uploadFirst: "อัปโหลดไฟล์หลักฐานแรก",
      allEvidence: "หลักฐานทั้งหมด"
    }
  };

  const language = user?.language || 'en';
  const strings = t[language];

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });
      
      await base44.entities.Document.create({
        type: formData.type,
        label: formData.label,
        file_url
      });

      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowAddDialog(false);
      setFormData({ type: 'other', label: '', file: null });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = filterType === 'all' 
    ? documents 
    : documents.filter(doc => doc.type === filterType);

  const getDocTypeInfo = (type) => {
    return DOC_TYPES.find(t => t.value === type) || DOC_TYPES[DOC_TYPES.length - 1];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-7 h-7 text-ls-forest" />
              <h1 className="text-2xl md:text-3xl font-bold text-ls-charcoal">{strings.title}</h1>
            </div>
            <p className="text-slate-600">{strings.subtitle}</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <button
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
              >
                <Plus className="w-4 h-4" />
                {strings.uploadDocument}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{strings.uploadDocument}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({...formData, label: e.target.value})}
                    placeholder="e.g. Rent receipt - Jan 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    required
                    onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={uploading}
                  style={{
                    width: '100%',
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    border: 'none',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !uploading && (e.target.style.backgroundColor = '#0a2f25')}
                  onMouseLeave={(e) => !uploading && (e.target.style.backgroundColor = '#0C3B2E')}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Button - Updated to lighter forest green */}
        <Card 
          className="mb-6 border-none shadow-lg cursor-pointer hover:shadow-xl transition-all" 
          onClick={() => navigate(createPageUrl("Templates"))}
          style={{
            background: 'linear-gradient(to right, #D1FAE5, #A7F3D0)',
            border: '1px solid #6EE7B7'
          }}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: '#0C3B2E'
                }}
              >
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-ls-forest">{language === 'th' ? 'เทมเพลตจดหมายที่ปลอดภัยทางกฎหมาย' : 'Legal-safe Templates'}</h3>
                <p className="text-sm text-emerald-700">{language === 'th' ? 'สร้างจดหมายมืออาชีพ' : 'Generate professional letters'}</p>
              </div>
            </div>
            <button 
              className="px-4 py-2 bg-white/60 border border-emerald-300 text-ls-forest hover:bg-white rounded-lg transition-colors font-semibold"
            >
              {language === 'th' ? 'ดูเทมเพลต' : 'View Templates'}
            </button>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            style={{
              backgroundColor: filterType === 'all' ? '#0C3B2E' : 'transparent',
              color: filterType === 'all' ? '#FFFFFF' : '#1A1D1F',
              borderColor: filterType === 'all' ? '#0C3B2E' : '#D1D5DB'
            }}
          >
            {strings.allEvidence} ({documents.length})
          </Button>
          {DOC_TYPES.map((type) => {
            const count = documents.filter(doc => doc.type === type.value).length;
            return (
              <Button
                key={type.value}
                size="sm"
                variant={filterType === type.value ? 'default' : 'outline'}
                onClick={() => setFilterType(type.value)}
                style={{
                  backgroundColor: filterType === type.value ? '#0C3B2E' : 'transparent',
                  color: filterType === type.value ? '#FFFFFF' : '#1A1D1F',
                  borderColor: filterType === type.value ? '#0C3B2E' : '#D1D5DB'
                }}
              >
                {type.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Documents Grid */}
        {filteredDocs.length === 0 ? (
          <Card className="border-none shadow-xl">
            <div className="p-12 text-center">
              <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-ls-charcoal mb-2">{strings.noDocuments}</h3>
              <p className="text-slate-600 mb-6">{language === 'th' ? 'เริ่มจัดระเบียบหลักฐานการเช่าของคุณ' : 'Start organizing your rental evidence'}</p>
              <button 
                onClick={() => setShowAddDialog(true)}
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
              >
                <Upload className="w-5 h-5" />
                {strings.uploadFirst}
              </button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDocs.map((doc) => {
              const typeInfo = getDocTypeInfo(doc.type);
              const TypeIcon = typeInfo.icon;
              
              return (
                <Card key={doc.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="flex items-center p-4">
                    <div className={`p-3 rounded-xl mr-4`} style={{
                      backgroundColor: typeInfo.value === 'lease' ? '#D1FAE5' :
                                     typeInfo.value === 'receipt' ? '#FEF3C7' :
                                     typeInfo.value === 'letter' ? '#ECEFED' :
                                     '#F3F4F6'
                    }}>
                      <TypeIcon className="w-5 h-5" style={{
                        color: typeInfo.value === 'lease' ? '#059669' :
                               typeInfo.value === 'receipt' ? '#D97706' :
                               typeInfo.value === 'letter' ? '#0C3B2E' :
                               '#6B7280'
                      }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-ls-charcoal mb-1 truncate">
                        {doc.label || 'Untitled Document'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {format(new Date(doc.created_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button
                        style={{
                          backgroundColor: 'transparent',
                          color: '#0C3B2E',
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#ECEFED'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}