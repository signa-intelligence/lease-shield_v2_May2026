import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, Calendar, AlertCircle, Clock, CheckCircle2, XCircle, Upload } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STATUS_CONFIG = {
  reported: { label: 'Reported', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  landlord_notified: { label: 'Notified', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Wrench },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' }
};

export default function MaintenanceTracker() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    issue_title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    property_address: '',
    reported_date: new Date().toISOString().split('T')[0],
    estimated_cost: '',
    photo_urls: []
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

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
        estimated_cost: '',
        photo_urls: []
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setFormData({ ...formData, photo_urls: [...formData.photo_urls, ...urls] });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requestData = {
      ...formData,
      estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
    };
    createRequestMutation.mutate(requestData);
  };

  const language = user?.language || 'en';

  const t = {
    en: {
      title: "Maintenance Tracker",
      subtitle: "Document and track all repair requests",
      addRequest: "Add Request",
      dialogTitle: "New Maintenance Request",
      issueTitle: "Issue Title",
      description: "Description",
      category: "Category",
      priority: "Priority",
      propertyAddress: "Property Address",
      reportedDate: "Reported Date",
      estimatedCost: "Estimated Cost (฿)",
      uploadPhotos: "Upload Photos",
      submitButton: "Submit Request",
      noRequests: "No Maintenance Requests",
      noRequestsSub: "Start documenting repair requests to keep clear records",
      addFirstRequest: "Add First Request",
      reportedOn: "Reported",
      lastUpdated: "Updated",
      viewDetails: "View Details",
      updateStatus: "Update Status",
      markCompleted: "Mark Completed"
    },
    th: {
      title: "ติดตามการซ่อมบำรุง",
      subtitle: "บันทึกและติดตามคำขอซ่อมแซมทั้งหมด",
      addRequest: "เพิ่มคำขอ",
      dialogTitle: "คำขอซ่อมบำรุงใหม่",
      issueTitle: "หัวข้อปัญหา",
      description: "รายละเอียด",
      category: "หมวดหมู่",
      priority: "ความสำคัญ",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      reportedDate: "วันที่แจ้ง",
      estimatedCost: "ค่าใช้จ่ายโดยประมาณ (฿)",
      uploadPhotos: "อัปโหลดรูปภาพ",
      submitButton: "ส่งคำขอ",
      noRequests: "ไม่มีคำขอซ่อมบำรุง",
      noRequestsSub: "เริ่มบันทึกคำขอซ่อมแซมเพื่อเก็บบันทึกที่ชัดเจน",
      addFirstRequest: "เพิ่มคำขอแรก",
      reportedOn: "แจ้งเมื่อ",
      lastUpdated: "อัปเดต",
      viewDetails: "ดูรายละเอียด",
      updateStatus: "อัปเดตสถานะ",
      markCompleted: "ทำเครื่องหมายเสร็จสิ้น"
    }
  };

  const strings = t[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
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
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{strings.dialogTitle}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">{strings.issueTitle}</Label>
                  <Input
                    id="title"
                    required
                    value={formData.issue_title}
                    onChange={(e) => setFormData({ ...formData, issue_title: e.target.value })}
                    placeholder="e.g., Leaking faucet in bathroom"
                  />
                </div>
                <div>
                  <Label htmlFor="description">{strings.description}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the issue..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="category">{strings.category}</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="structural">Structural</SelectItem>
                        <SelectItem value="appliance">Appliance</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="pest">Pest Control</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">{strings.priority}</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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
                  <Label htmlFor="address">{strings.propertyAddress}</Label>
                  <Input
                    id="address"
                    value={formData.property_address}
                    onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                    placeholder="Property address"
                  />
                </div>
                <div>
                  <Label htmlFor="date">{strings.reportedDate}</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.reported_date}
                    onChange={(e) => setFormData({ ...formData, reported_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cost">{strings.estimatedCost}</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label htmlFor="photos">{strings.uploadPhotos}</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="photo-upload"
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-ls-forest transition-colors"
                    >
                      <Upload className="w-5 h-5 text-slate-500" />
                      <span className="text-sm text-slate-600">
                        {uploading ? 'Uploading...' : 'Click to upload photos'}
                      </span>
                      <input
                        id="photo-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {formData.photo_urls.length > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        {formData.photo_urls.length} photo(s) uploaded
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={createRequestMutation.isPending}
                  className="w-full"
                  style={{
                    backgroundColor: createRequestMutation.isPending ? '#9CA3AF' : '#0C3B2E',
                    color: '#FFFFFF'
                  }}
                >
                  {createRequestMutation.isPending ? 'Submitting...' : strings.submitButton}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Requests Grid - 2 columns on desktop */}
        <div className="grid md:grid-cols-2 gap-4">
          {requests.length === 0 ? (
            <Card className="border-none shadow-xl md:col-span-2">
              <CardContent className="p-12 text-center">
                <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-ls-charcoal mb-2">{strings.noRequests}</h3>
                <p className="text-slate-600 mb-6">{strings.noRequestsSub}</p>
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
                  {strings.addFirstRequest}
                </button>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.reported;
              const priorityConfig = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.medium;
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={request.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-ls-stone rounded-lg">
                          <StatusIcon className="w-5 h-5 text-ls-forest" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-bold text-slate-900 mb-1">
                            {request.issue_title}
                          </CardTitle>
                          {request.property_address && (
                            <p className="text-xs text-slate-600">{request.property_address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Badge className={`${statusConfig.color} border text-xs`}>
                        {statusConfig.label}
                      </Badge>
                      <Badge className={`${priorityConfig.color} text-xs`}>
                        {priorityConfig.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {request.category}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    {request.description && (
                      <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-700 line-clamp-2">{request.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                          <Calendar className="w-3 h-3" />
                          {strings.reportedOn}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {format(new Date(request.reported_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {request.estimated_cost && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Est. Cost</p>
                          <p className="text-sm font-semibold text-slate-900">
                            ฿{request.estimated_cost.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {request.photo_urls && request.photo_urls.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-2">Photos: {request.photo_urls.length}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {request.photo_urls.slice(0, 3).map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Issue ${idx + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-slate-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {request.status !== 'completed' && request.status !== 'rejected' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateRequestMutation.mutate({
                            id: request.id,
                            data: { status: 'completed', resolved_date: new Date().toISOString() }
                          })}
                          style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            color: '#10B981',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            border: '2px solid #10B981',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#D1FAE5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                        >
                          {strings.markCompleted}
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