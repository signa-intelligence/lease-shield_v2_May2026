
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Clock, CheckCircle2, AlertTriangle, Home, Zap, Droplet, Hammer, Thermometer, Bug, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function MaintenanceTracker() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    issue_title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    property_address: '',
    reported_date: new Date().toISOString().split('T')[0]
  });
  const [filter, setFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: maintenanceRequests = [] } = useQuery({
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
        reported_date: new Date().toISOString().split('T')[0]
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const requestData = {
      ...formData,
      status: 'reported'
    };
    createRequestMutation.mutate(requestData);
  };

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

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
      title: "Maintenance Tracker",
      subtitle: "Document and track all repair requests",
      reportIssue: "Report Issue",
      reportFirst: "Report First Request",
      dialogTitle: "New Maintenance Request",
      issueTitle: "Issue Title",
      description: "Description",
      category: "Category",
      priority: "Priority",
      propertyAddress: "Property Address",
      reportedDate: "Reported Date",
      submitButton: "Submit Request",
      noRequests: "No Maintenance Requests",
      noRequestsSub: "Track repair requests and communications",
      reported: "Reported",
      completed: "Mark Completed",
      estCost: "Est. Cost",
      filters: {
        all: "All",
        reported: "Reported",
        in_progress: "In Progress",
        completed: "Completed"
      },
      status: {
        reported: "Reported",
        landlord_notified: "Landlord Notified",
        in_progress: "In Progress",
        completed: "Completed",
        rejected: "Rejected"
      }
    },
    th: {
      title: "ติดตามการซ่อมบำรุง",
      subtitle: "บันทึกและติดตามคำขอซ่อมทั้งหมด",
      reportIssue: "แจ้งปัญหา",
      reportFirst: "แจ้งปัญหาแรก",
      dialogTitle: "คำขอซ่อมบำรุงใหม่",
      issueTitle: "หัวข้อปัญหา",
      description: "รายละเอียด",
      category: "หมวดหมู่",
      priority: "ลำดับความสำคัญ",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      reportedDate: "วันที่รายงาน",
      submitButton: "ส่งคำขอ",
      noRequests: "ไม่มีคำขอซ่อมบำรุง",
      noRequestsSub: "ติดตามคำขอซ่อมและการติดต่อสื่อสาร",
      reported: "รายงานแล้ว",
      completed: "ทำเครื่องหมายเสร็จสิ้น",
      estCost: "ต้นทุนโดยประมาณ",
      filters: {
        all: "ทั้งหมด",
        reported: "แจ้งแล้ว",
        in_progress: "กำลังดำเนินการ",
        completed: "เสร็จสิ้น"
      },
      status: {
        reported: "แจ้งแล้ว",
        landlord_notified: "แจ้งเจ้าของบ้าน",
        in_progress: "กำลังดำเนินการ",
        completed: "เสร็จสิ้น",
        rejected: "ถูกปฏิเสธ"
      }
    }
  };

  const strings = t[language];

  const getStatusColor = (status) => {
    const colors = {
      reported: "bg-blue-100 text-blue-800 border-blue-200",
      landlord_notified: "bg-amber-100 text-amber-800 border-amber-200",
      in_progress: "bg-purple-100 text-purple-800 border-purple-200",
      completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-amber-100 text-amber-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    return colors[priority] || "bg-slate-100 text-slate-800";
  };

  const getStatusLabel = (status) => {
    return strings.status[status] || status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getCategoryIcon = (category) => {
    const iconProps = { className: "w-5 h-5 flex-shrink-0", style: { color: colors.textSecondary } };
    switch (category) {
      case 'plumbing': return <Droplet {...iconProps} />;
      case 'electrical': return <Zap {...iconProps} />;
      case 'structural': return <Hammer {...iconProps} />;
      case 'appliance': return <Package {...iconProps} />;
      case 'hvac': return <Thermometer {...iconProps} />;
      case 'pest': return <Bug {...iconProps} />;
      case 'other': return <Wrench {...iconProps} />;
      default: return <Wrench {...iconProps} />;
    }
  };

  const filteredRequests = maintenanceRequests.filter(request => {
    if (filter === 'all') {
      return true;
    }
    return request.status === filter;
  });

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-ls-forest" />
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.title}</h1>
            </div>
            <p className="text-sm sm:text-base" style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <button 
                className="w-full sm:w-auto"
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
              >
                <Plus style={{ width: '18px', height: '18px' }} />
                <span className="text-sm sm:text-base">{strings.reportIssue}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto" style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
              margin: '16px'
            }}>
              <DialogHeader>
                <DialogTitle style={{ color: colors.textPrimary }}>{strings.dialogTitle}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title" style={{ color: colors.textPrimary }}>{strings.issueTitle}</Label>
                  <Input
                    id="title"
                    required
                    value={formData.issue_title}
                    onChange={(e) => setFormData({...formData, issue_title: e.target.value})}
                    placeholder="e.g., leaking roof"
                    style={{
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      borderColor: colors.borderColor
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="description" style={{ color: colors.textPrimary }}>{strings.description}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the issue..."
                    rows={3}
                    style={{
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      borderColor: colors.borderColor
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="category" style={{ color: colors.textPrimary }}>{strings.category}</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger style={{
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      borderColor: colors.borderColor
                    }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="structural">Structural</SelectItem>
                      <SelectItem value="appliance">Appliance</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="pest">Pest</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority" style={{ color: colors.textPrimary }}>{strings.priority}</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger style={{
                      backgroundColor: colors.inputBg,
                      color: colors.textPrimary,
                      borderColor: colors.borderColor
                    }}>
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
                <Button 
                  type="submit" 
                  disabled={createRequestMutation.isPending}
                  className="w-full"
                  style={{
                    backgroundColor: createRequestMutation.isPending ? '#9CA3AF' : '#0C3B2E',
                    color: '#FFFFFF',
                    opacity: createRequestMutation.isPending ? 0.6 : 1
                  }}
                >
                  {strings.submitButton}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Tabs - Horizontal scroll on mobile */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {['all', 'reported', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: filter === status ? '#0C3B2E' : colors.cardBg,
                  color: filter === status ? '#FFFFFF' : colors.textPrimary,
                  whiteSpace: 'nowrap'
                }}
              >
                {strings.filters[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Grid - Single column on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.length === 0 ? (
            <Card className="border-none shadow-xl md:col-span-2" style={{ backgroundColor: colors.cardBg }}>
              <CardContent className="p-8 sm:p-12 text-center">
                <Wrench className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.5 }} />
                <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>{strings.noRequests}</h3>
                <p className="mb-6 text-sm sm:text-base" style={{ color: colors.textSecondary }}>{strings.noRequestsSub}</p>
                <button 
                  onClick={() => setShowAddDialog(true)}
                  className="w-full sm:w-auto"
                  style={{
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                >
                  <Plus style={{ width: '18px', height: '18px' }} />
                  {strings.reportFirst}
                </button>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300" style={{
                backgroundColor: colors.cardBg
              }}>
                <CardHeader className="pb-3 sm:pb-4" style={{
                  borderBottom: `1px solid ${colors.borderColor}`
                }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getCategoryIcon(request.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg font-bold break-words mb-1" style={{ color: colors.textPrimary }}>
                          {request.issue_title}
                        </CardTitle>
                        {request.property_address && (
                          <p className="text-xs sm:text-sm break-words" style={{ color: colors.textSecondary }}>
                            {request.property_address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      <Badge className={`${getStatusColor(request.status)} text-xs whitespace-nowrap`}>
                        {getStatusLabel(request.status)}
                      </Badge>
                      <Badge className={`${getPriorityColor(request.priority)} text-xs whitespace-nowrap`}>
                        {request.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-4">
                  {request.description && (
                    <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{request.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: colors.textSecondary }}>
                    <span>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {strings.reported}: {format(new Date(request.reported_date), 'MMM d, yyyy')}
                    </span>
                    {request.estimated_cost && (
                      <span>{strings.estCost}: ฿{request.estimated_cost.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {request.status === 'reported' && (
                      <button
                        onClick={() => updateRequestMutation.mutate({ 
                          id: request.id, 
                          data: { status: 'completed' } 
                        })}
                        style={{
                          width: '100%',
                          backgroundColor: '#10B981',
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
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
                      >
                        <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                        {strings.completed}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
