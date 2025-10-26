import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Upload, FileText, Image, Video, Mail, File, Plus, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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

export default function Documents() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
            </div>
            <p className="text-slate-600">Organize your rental documents</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="type">Document Type</Label>
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
                    placeholder="e.g. Monthly rent receipt - January 2024"
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
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            className={filterType === 'all' ? 'bg-blue-600' : ''}
          >
            All ({documents.length})
          </Button>
          {DOC_TYPES.map((type) => {
            const count = documents.filter(doc => doc.type === type.value).length;
            return (
              <Button
                key={type.value}
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
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Documents Yet</h3>
              <p className="text-slate-600 mb-6">Upload receipts, photos, and other rental documents</p>
              <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-5 h-5 mr-2" />
                Upload Your First Document
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => {
              const typeInfo = getDocTypeInfo(doc.type);
              const TypeIcon = typeInfo.icon;
              
              return (
                <Card key={doc.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className={`h-2 ${typeInfo.color}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${typeInfo.color} bg-opacity-20`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Button variant="ghost" size="icon" className="text-blue-600">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                    
                    <Badge className={`${typeInfo.color} mb-3`}>
                      {typeInfo.label}
                    </Badge>
                    
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">
                      {doc.label || 'Untitled Document'}
                    </h3>
                    
                    <p className="text-xs text-slate-500">
                      Uploaded {format(new Date(doc.created_date), 'MMM d, yyyy')}
                    </p>
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