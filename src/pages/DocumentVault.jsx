
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
  { value: 'lease', label: 'Lease Agreement', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  { value: 'receipt', label: 'Receipt', icon: FileText, color: 'bg-emerald-100 text-emerald-800' },
  { value: 'photo', label: 'Photo', icon: Image, color: 'bg-purple-100 text-purple-800' },
  { value: 'video', label: 'Video', icon: Video, color: 'bg-pink-100 text-pink-800' },
  { value: 'letter', label: 'Letter', icon: Mail, color: 'bg-amber-100 text-amber-800' },
  { value: 'other', label: 'Other', icon: File, color: 'bg-slate-100 text-slate-800' }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{strings.title}</h1>
            </div>
            <p className="text-slate-600">{strings.subtitle}</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                {strings.uploadDocument}
              </Button>
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
                <Button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700">
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Button */}
        <Card className="mb-6 border-none shadow-lg bg-gradient-to-r from-purple-500 to-purple-700 text-white cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate(createPageUrl("Templates"))}>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">{language === 'th' ? 'เทมเพลตจดหมายที่ปลอดภัยทางกฎหมาย' : 'Legal-safe Templates'}</h3>
                <p className="text-sm text-purple-100">{language === 'th' ? 'สร้างจดหมายมืออาชีพ' : 'Generate professional letters'}</p>
              </div>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/20">
              {language === 'th' ? 'ดูเทมเพลต' : 'View Templates'}
            </Button>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            className={filterType === 'all' ? 'bg-blue-600' : ''}
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
                className={filterType === type.value ? 'bg-blue-600' : ''}
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
              <h3 className="text-xl font-bold text-slate-900 mb-2">{strings.noDocuments}</h3>
              <p className="text-slate-600 mb-6">{language === 'th' ? 'เริ่มจัดระเบียบหลักฐานการเช่าของคุณ' : 'Start organizing your rental evidence'}</p>
              <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-5 h-5 mr-2" />
                {strings.uploadFirst}
              </Button>
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
                    <div className={`p-3 rounded-xl ${typeInfo.color} bg-opacity-20 mr-4`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 mb-1 truncate">
                        {doc.label || 'Untitled Document'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={`${typeInfo.color} text-xs`}>
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
                      <Button variant="ghost" size="icon" className="text-blue-600">
                        <ExternalLink className="w-5 h-5" />
                      </Button>
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
