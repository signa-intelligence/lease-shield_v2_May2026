
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, Upload, Image as ImageIcon, MessageSquare, Calendar, DollarSign, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing', icon: '🚰' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'structural', label: 'Structural', icon: '🏗️' },
  { value: 'appliance', label: 'Appliance', icon: '🔧' },
  { value: 'hvac', label: 'HVAC', icon: '❄️' },
  { value: 'pest', label: 'Pest Control', icon: '🐛' },
  { value: 'other', label: 'Other', icon: '📋' }
];

export default function MaintenanceTracker() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [formData, setFormData] = useState({
    issue_title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    property_address: '',
    reported_date: new Date().toISOString().split('T')[0],
    estimated_cost: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';

  const { data: requests = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setShowAddDialog(false);
      setFormData({
        issue_title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        property_address: '',
        reported_date: new Date().toISOString().split('T')[0],
        estimated_cost: ''
      });
      setSelectedPhotos([]);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);

    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setSelectedPhotos([...selectedPhotos, ...urls]);
    } catch (error) {
      console.error('Photo upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const requestData = {
      ...formData,
      estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
      photo_urls: selectedPhotos,
      status: 'reported'
    };

    createRequestMutation.mutate(requestData);
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: "bg-amber-100 text-amber-800 border-amber-200",
      landlord_notified: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-purple-100 text-purple-800 border-purple-200",
      completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      reported: AlertCircle,
      landlord_notified: MessageSquare,
      in_progress: Clock,
      completed: CheckCircle2,
      rejected: XCircle
    };
    const Icon = icons[status] || AlertCircle;
    return <Icon className="w-5 h-5" />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-slate-100 text-slate-700",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      urgent: "bg-red-100 text-red-700"
    };
    return colors[priority] || "bg-slate-100 text-slate-700";
  };

  const t = {
    en: {
      title: "Maintenance Tracker",
      subtitle: "Record repair requests and communication with landlords",
      addRequest: "Report Issue",
      dialogTitle: "Report Maintenance Issue",
      issueTitle: "Issue Title",
      description: "Description",
      category: "Category",
      priority: "Priority",
      propertyAddress: "Property Address",
      reportedDate: "Reported Date",
      estimatedCost: "Estimated Cost (฿)",
      uploadPhotos: "Upload Photos",
      submit: "Submit Request",
      noRequests: "No Maintenance Requests",
      noRequestsDesc: "Report your first maintenance issue to start tracking",
      reportFirst: "Report First Issue",
      allRequests: "All Requests",
      active: "Active",
      completed: "Completed",
      photos: "photos"
    },
    th: {
      title: "ติดตามการซ่อมบำรุง",
      subtitle: "บันทึกคำขอซ่อมแซมและการสื่อสารกับเจ้าของบ้าน",
      addRequest: "แจ้งปัญหา",
      dialogTitle: "แจ้งปัญหาการซ่อมบำรุง",
      issueTitle: "หัวข้อปัญหา",
      description: "รายละเอียด",
      category: "หมวดหมู่",
      priority: "ความสำคัญ",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      reportedDate: "วันที่แจ้ง",
      estimatedCost: "ค่าใช้จ่ายโดยประมาณ (฿)",
      uploadPhotos: "อัปโหลดรูปภาพ",
      submit: "ส่งคำขอ",
      noRequests: "ไม่มีคำขอซ่อมบำรุง",
      noRequestsDesc: "แจ้งปัญหาการซ่อมบำรุงครั้งแรกเพื่อเริ่มติดตาม",
      reportFirst: "แจ้งปัญหาครั้งแรก",
      allRequests: "คำขอทั้งหมด",
      active: "กำลังดำเนินการ",
      completed: "เสร็จสิ้น",
      photos: "รูปภาพ"
    }
  };

  const strings = t[language];

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : filterStatus === 'active'
    ? requests.filter(r => !['completed', 'rejected'].includes(r.status))
    : requests.filter(r => r.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-8 h-8 text-ls-forest" />
              <h1 className="text-3xl font-bold text-ls-charcoal">{strings.title}</h1>
            </div>
            <p className="text-slate-600">{strings.subtitle}</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <button 
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
                <Plus style={{ width: '20px', height: '20px' }} />
                {strings.addRequest}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{strings.dialogTitle}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="issue_title">{strings.issueTitle}</Label>
                  <Input
                    id="issue_title"
                    required
                    value={formData.issue_title}
                    onChange={(e) => setFormData({...formData, issue_title: e.target.value})}
                    placeholder="e.g. Leaking faucet in kitchen"
                  />
                </div>
                <div>
                  <Label htmlFor="description">{strings.description}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Provide detailed description..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">{strings.category}</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">{strings.priority}</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="property_address">{strings.propertyAddress}</Label>
                  <Input
                    id="property_address"
                    value={formData.property_address}
                    onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                    placeholder="123 Main St, Bangkok"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reported_date">{strings.reportedDate}</Label>
                    <Input
                      id="reported_date"
                      type="date"
                      required
                      value={formData.reported_date}
                      onChange={(e) => setFormData({...formData, reported_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_cost">{strings.estimatedCost}</Label>
                    <Input
                      id="estimated_cost"
                      type="number"
                      value={formData.estimated_cost}
                      onChange={(e) => setFormData({...formData, estimated_cost: e.target.value})}
                      placeholder="5000"
                    />
                  </div>
                </div>
                <div>
                  <Label>{strings.uploadPhotos}</Label>
                  <div className="flex items-center gap-3">
                    <label 
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Choose Files</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {selectedPhotos.length > 0 && (
                      <span className="text-sm text-slate-600">
                        {selectedPhotos.length} {strings.photos}
                      </span>
                    )}
                  </div>
                  {selectedPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {selectedPhotos.map((url, idx) => (
                        <img key={idx} src={url} alt={`Photo ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
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
                    border: 'none',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !uploading && (e.target.style.backgroundColor = '#0a2f25')}
                  onMouseLeave={(e) => !uploading && (e.target.style.backgroundColor = '#0C3B2E')}
                >
                  {uploading ? 'Uploading...' : strings.submit}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Tabs - FIXED */}
        <div className="flex gap-3 mb-6">
          <Button
            size="sm"
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            style={{
              backgroundColor: filterStatus === 'all' ? '#0C3B2E' : 'transparent',
              color: filterStatus === 'all' ? '#FFFFFF' : '#1A1D1F',
              borderColor: filterStatus === 'all' ? '#0C3B2E' : '#D1D5DB'
            }}
          >
            {strings.allRequests} ({requests.length})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('active')}
            style={{
              backgroundColor: filterStatus === 'active' ? '#0C3B2E' : 'transparent',
              color: filterStatus === 'active' ? '#FFFFFF' : '#1A1D1F',
              borderColor: filterStatus === 'active' ? '#0C3B2E' : '#D1D5DB'
            }}
          >
            {strings.active} ({requests.filter(r => !['completed', 'rejected'].includes(r.status)).length})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('completed')}
            style={{
              backgroundColor: filterStatus === 'completed' ? '#0C3B2E' : 'transparent',
              color: filterStatus === 'completed' ? '#FFFFFF' : '#1A1D1F',
              borderColor: filterStatus === 'completed' ? '#0C3B2E' : '#D1D5DB'
            }}
          >
            {strings.completed} ({requests.filter(r => r.status === 'completed').length})
          </Button>
        </div>

        {/* Requests Grid */}
        <div className="grid gap-6">
          {filteredRequests.length === 0 ? (
            <Card className="border-none shadow-xl">
              <CardContent className="p-12 text-center">
                <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-ls-charcoal mb-2">{strings.noRequests}</h3>
                <p className="text-slate-600 mb-6">{strings.noRequestsDesc}</p>
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
                  <Plus style={{ width: '20px', height: '20px' }} />
                  {strings.reportFirst}
                </button>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              const category = CATEGORIES.find(c => c.value === request.category);
              
              return (
                <Card key={request.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl">{category?.icon || '📋'}</div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-slate-900 mb-2">
                            {request.issue_title}
                          </CardTitle>
                          {request.property_address && (
                            <p className="text-sm text-slate-600">{request.property_address}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority.toUpperCase()}
                        </Badge>
                        <Badge className={`${getStatusColor(request.status)} border`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {request.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    {request.description && (
                      <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-700">{request.description}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          Reported
                        </div>
                        <p className="font-semibold text-slate-900">
                          {format(new Date(request.reported_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {request.estimated_cost && (
                        <div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <DollarSign className="w-4 h-4" />
                            Estimated Cost
                          </div>
                          <p className="font-semibold text-slate-900">
                            ฿{request.estimated_cost.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {request.resolved_date && (
                        <div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Resolved
                          </div>
                          <p className="font-semibold text-slate-900">
                            {format(new Date(request.resolved_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>

                    {request.photo_urls && request.photo_urls.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                          <ImageIcon className="w-4 h-4" />
                          Photos ({request.photo_urls.length})
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {request.photo_urls.map((url, idx) => (
                            <img 
                              key={idx} 
                              src={url} 
                              alt={`Issue photo ${idx + 1}`} 
                              className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(url, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {request.status === 'reported' && (
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => updateRequestMutation.mutate({ 
                            id: request.id, 
                            data: { status: 'landlord_notified' } 
                          })}
                          style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            color: '#0C3B2E',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            border: '2px solid #0C3B2E',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#ECEFED'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                        >
                          <MessageSquare style={{ width: '16px', height: '16px' }} />
                          Mark as Notified
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
