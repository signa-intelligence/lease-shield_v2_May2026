
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Clock, CheckCircle2, AlertTriangle, Home, Zap, Droplet, Hammer, Thermometer, Bug, Package, Loader2, Camera, X, Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
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
  const [editingRequest, setEditingRequest] = useState(null);
  const [deletingRequest, setDeletingRequest] = useState(null);
  const [formData, setFormData] = useState({
    issue_title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    property_address: '',
    reported_date: new Date().toISOString().split('T')[0],
    photo_urls: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
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
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (id) => base44.entities.MaintenanceRequest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setDeletingRequest(null);
    },
  });

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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.issue_title || formData.issue_title.trim().length === 0) {
      errors.issue_title = language === 'th' ? 'กรุณาระบุหัวข้อปัญหา' : 'Please enter issue title';
    } else if (formData.issue_title.length > 200) {
      errors.issue_title = language === 'th' ? 'หัวข้อยาวเกินไป (สูงสุด 200 ตัวอักษร)' : 'Title too long (max 200 characters)';
    }
    
    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = language === 'th' ? 'กรุณาอธิบายปัญหา' : 'Please describe the issue';
    } else if (formData.description.length > 2000) {
      errors.description = language === 'th' ? 'คำอธิบายยาวเกินไป (สูงสุด 2000 ตัวอักษร)' : 'Description too long (max 2000 characters)';
    }
    
    if (!formData.reported_date) {
      errors.reported_date = language === 'th' ? 'กรุณาระบุวันที่พบปัญหา' : 'Please enter reported date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    // Clear previous photo errors
    setFormErrors(prev => ({...prev, photos: undefined})); 

    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const photoUrls = uploadResults.map(result => result.file_url);
      
      setFormData(prev => ({
        ...prev,
        photo_urls: [...prev.photo_urls, ...photoUrls]
      }));
    } catch (error) {
      console.error('Photo upload failed:', error);
      setFormErrors(prev => ({
        ...prev,
        photos: language === 'th' 
          ? 'ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองอีกครั้ง' 
          : 'Failed to upload photos. Please try again.'
      }));
    } finally {
      setUploadingPhotos(false);
      // Reset the file input to allow uploading the same file again if needed
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      photo_urls: prev.photo_urls.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      issue_title: request.issue_title,
      description: request.description,
      category: request.category,
      priority: request.priority,
      property_address: request.property_address || '',
      reported_date: request.reported_date,
      photo_urls: request.photo_urls || []
    });
    setShowAddDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingRequest) return;
    
    try {
      await deleteRequestMutation.mutateAsync(deletingRequest.id);
    } catch (error) {
      console.error('Delete failed:', error);
      alert(language === 'th' 
        ? 'ไม่สามารถลบได้ กรุณาลองอีกครั้ง' 
        : 'Failed to delete. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const requestData = {
        issue_title: formData.issue_title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        property_address: formData.property_address.trim() || undefined,
        reported_date: formData.reported_date,
        status: editingRequest ? editingRequest.status : 'reported'
      };

      if (formData.photo_urls.length > 0) {
        requestData.photo_urls = formData.photo_urls;
      }

      if (editingRequest) {
        await updateRequestMutation.mutateAsync({
          id: editingRequest.id,
          data: requestData
        });
      } else {
        // Create new request
        const createdRequest = await createRequestMutation.mutateAsync(requestData);
        
        console.log('📧 Attempting to send maintenance notifications...');
        console.log('🔍 User data:', {
          email: user.email,
          landlord_email: user.landlord_email,
          juristic_email: user.juristic_email
        });
        
        // Send notifications after successful creation - with detailed error tracking
        try {
          const notificationResponse = await base44.functions.invoke('sendMaintenanceNotification', {
            maintenanceRequest: createdRequest
          });
          
          console.log('✅ Notification response:', notificationResponse.data);
          
          // Check if emails were actually sent
          const notifications = notificationResponse.data?.notifications || [];
          const landlordSent = notifications.find(n => n.recipient === 'landlord' && n.status === 'sent');
          const juristicSent = notifications.find(n => n.recipient === 'juristic' && n.status === 'sent');
          
          if (!user.landlord_email && !user.juristic_email) {
            console.warn('⚠️ No landlord or juristic email configured');
            if (language === 'th') {
              alert('⚠️ คำเตือน: ยังไม่ได้ตั้งค่าอีเมลเจ้าของบ้านหรือนิติบุคคล\nกรุณาไปที่หน้าบัญชีเพื่อเพิ่มข้อมูลติดต่อ');
            } else {
              alert('⚠️ Warning: No landlord or juristic email configured\nPlease add contact info in Account page');
            }
          } else {
            // Show success message with details
            let message = language === 'th' 
              ? '✅ คำขอซ่อมถูกส่งแล้ว\n\n' 
              : '✅ Maintenance request sent\n\n';
            
            if (user.landlord_email) {
              message += landlordSent 
                ? (language === 'th' ? '✓ ส่งอีเมลถึงเจ้าของบ้านแล้ว\n' : '✓ Landlord email sent\n')
                : (language === 'th' ? '✗ ส่งอีเมลถึงเจ้าของบ้านไม่สำเร็จ\n' : '✗ Landlord email failed\n');
            }
            
            if (user.juristic_email) {
              message += juristicSent 
                ? (language === 'th' ? '✓ ส่งอีเมลถึงนิติบุคคลแล้ว' : '✓ Juristic email sent')
                : (language === 'th' ? '✗ ส่งอีเมลถึงนิติบุคคลไม่สำเร็จ' : '✗ Juristic email failed');
            }
            
            alert(message);
          }
          
        } catch (notificationError) {
          console.error('❌ Failed to send notifications:', notificationError);
          alert(language === 'th' 
            ? '⚠️ คำขอซ่อมถูกบันทึกแล้ว แต่ไม่สามารถส่งการแจ้งเตือนได้' 
            : '⚠️ Request saved but failed to send notifications');
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setShowAddDialog(false);
      setEditingRequest(null);
      setFormData({
        issue_title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        property_address: '',
        reported_date: new Date().toISOString().split('T')[0],
        photo_urls: []
      });
      setFormErrors({});
    } catch (error) {
      console.error('Failed to save request:', error);
      setFormErrors({ 
        submit: language === 'th' 
          ? 'ไม่สามารถบันทึกรายการได้ กรุณาลองอีกครั้ง' 
          : 'Failed to save request. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const t = {
    en: {
      title: "Maintenance Tracker",
      subtitle: "Document and track all repair requests",
      reportIssue: "Report Issue",
      reportFirst: "Report First Request",
      dialogTitle: "New Maintenance Request",
      reportNewIssue: "New Maintenance Request",
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
      acknowledged: "Acknowledged",
      completed: "Mark Completed",
      inProgress: "Mark In Progress",
      estCost: "Est. Cost",
      filters: {
        all: "All",
        reported: "Reported",
        acknowledged: "Acknowledged",
        in_progress: "In Progress",
        completed: "Completed"
      },
      status: {
        reported: "Reported",
        acknowledged: "Acknowledged",
        in_progress: "In Progress",
        completed: "Completed",
        rejected: "Rejected"
      },
      categories: {
        plumbing: "Plumbing",
        electrical: "Electrical",
        structural: "Structural",
        appliance: "Appliance",
        hvac: "HVAC",
        pest: "Pest",
        other: "Other"
      },
      priorities: {
        low: "Low",
        medium: "Medium",
        high: "High",
        urgent: "Urgent"
      },
      addPhotos: "Add Photos",
      takePhoto: "Take Photo",
      uploadPhoto: "Upload Photo",
      photosOptional: "Photos (Optional)",
      photosHelp: "Add photos to document the issue",
      uploading: "Uploading...",
      photos: "photos",
      editRequest: "Edit Request",
      deleteRequest: "Delete Request",
      confirmDelete: "Are you sure?",
      confirmDeleteDesc: "This will permanently delete this maintenance request. This action cannot be undone.",
      cancelDelete: "Cancel",
      confirmDeleteBtn: "Delete",
      updateButton: "Update",
      issuePhotos: "Issue Photos:",
      completionPhotos: "Completion Photos:",
      billsReceipts: "Bills/Receipts:",
      landlordResponse: "Landlord Response:",
      cost: "Cost:"
    },
    th: {
      title: "ติดตามการซ่อมบำรุง",
      subtitle: "บันทึกและติดตามคำขอซ่อมทั้งหมด",
      reportIssue: "แจ้งปัญหา",
      reportFirst: "แจ้งปัญหาแรก",
      dialogTitle: "คำขอซ่อมบำรุงใหม่",
      reportNewIssue: "คำขอซ่อมบำรุงใหม่",
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
      acknowledged: "รับทราบแล้ว",
      completed: "ทำเครื่องหมายเสร็จสิ้น",
      inProgress: "ทำเครื่องหมายกำลังดำเนินการ",
      estCost: "ต้นทุนโดยประมาณ",
      filters: {
        all: "ทั้งหมด",
        reported: "แจ้งแล้ว",
        acknowledged: "รับทราบแล้ว",
        in_progress: "กำลังดำเนินการ",
        completed: "เสร็จสิ้น"
      },
      status: {
        reported: "แจ้งแล้ว",
        acknowledged: "รับทราบแล้ว",
        in_progress: "กำลังดำเนินการ",
        completed: "เสร็จสิ้น",
        rejected: "ถูกปฏิเสธ"
      },
      categories: {
        plumbing: "ประปา",
        electrical: "ไฟฟ้า",
        structural: "โครงสร้าง",
        appliance: "เครื่องใช้ไฟฟ้า",
        hvac: "เครื่องปรับอากาศ/ระบายอากาศ",
        pest: "สัตว์รบกวน",
        other: "อื่น ๆ"
      },
      priorities: {
        low: "ต่ำ",
        medium: "ปานกลาง",
        high: "สูง",
        urgent: "เร่งด่วน"
      },
      addPhotos: "เพิ่มรูปภาพ",
      takePhoto: "ถ่ายรูป",
      uploadPhoto: "อัปโหลดรูป",
      photosOptional: "รูปภาพ (ไม่บังคับ)",
      photosHelp: "เพิ่มรูปภาพเพื่อบันทึกปัญหา",
      uploading: "กำลังอัปโหลด...",
      photos: "รูป",
      editRequest: "แก้ไขคำขอ",
      deleteRequest: "ลบคำขอ",
      confirmDelete: "คุณแน่ใจหรือไม่?",
      confirmDeleteDesc: "การดำเนินการนี้จะลบคำขอซ่อมบำรุงนี้อย่างถาวร และไม่สามารถยกเลิกได้",
      cancelDelete: "ยกเลิก",
      confirmDeleteBtn: "ลบ",
      updateButton: "อัปเดต",
      issuePhotos: "รูปภาพปัญหา:",
      completionPhotos: "รูปงานเสร็จ:",
      billsReceipts: "ใบเสร็จ/บิล:",
      landlordResponse: "ข้อความจากเจ้าของบ้าน:",
      cost: "ค่าใช้จ่าย:"
    }
  };

  const strings = t[language];

  const getStatusColor = (status) => {
    const colors = {
      reported: "bg-blue-100 text-blue-800 border-blue-200",
      acknowledged: "bg-purple-100 text-purple-800 border-purple-200",
      in_progress: "bg-amber-100 text-amber-800 border-amber-200",
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
          
          {maintenanceRequests.length > 0 && (
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) {
                setEditingRequest(null); // Reset editing request when dialog closes
                setFormErrors({});
                setFormData({
                  issue_title: '',
                  description: '',
                  category: 'other',
                  priority: 'medium',
                  property_address: '',
                  reported_date: new Date().toISOString().split('T')[0],
                  photo_urls: []
                });
              }
            }}>
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
                    boxShadow: '0 4px 6px rgba(0,0=0,0.1)',
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
                  <DialogTitle style={{ color: colors.textPrimary }}>
                    {editingRequest ? strings.editRequest : strings.reportNewIssue}
                  </DialogTitle>
                </DialogHeader>
                
                {formErrors.submit && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                    <span className="mr-2">❌</span>{formErrors.submit}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="issue_title" className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.issueTitle} *
                    </label>
                    <input
                      id="issue_title"
                      type="text"
                      required
                      value={formData.issue_title}
                      onChange={(e) => {
                        setFormData({...formData, issue_title: e.target.value});
                        setFormErrors(prev => ({...prev, issue_title: null}));
                      }}
                      maxLength={200}
                      className={`w-full p-3 border-2 rounded-lg ${formErrors.issue_title ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: formErrors.issue_title ? '#EF4444' : colors.borderColor,
                        color: colors.textPrimary
                      }}
                      placeholder={language === 'th' ? 'เช่น: ก๊อกน้ำรั่ว' : 'e.g., Leaking faucet'}
                    />
                    {formErrors.issue_title && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.issue_title}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {formData.issue_title.length}/200
                    </p>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.description} *
                    </label>
                    <textarea
                      id="description"
                      required
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({...formData, description: e.target.value});
                        setFormErrors(prev => ({...prev, description: null}));
                      }}
                      maxLength={2000}
                      rows={4}
                      className={`w-full p-3 border-2 rounded-lg ${formErrors.description ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: formErrors.description ? '#EF4444' : colors.borderColor,
                        color: colors.textPrimary
                      }}
                      placeholder={language === 'th' ? 'อธิบายปัญหาโดยละเอียด...' : 'Describe the issue in detail...'}
                    />
                    {formErrors.description && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {formData.description.length}/2000
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="category" className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        {strings.category}
                      </label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full p-3 border-2 rounded-lg appearance-none"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary,
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1em 1em',
                        }}
                      >
                        <option value="plumbing">{strings.categories.plumbing}</option>
                        <option value="electrical">{strings.categories.electrical}</option>
                        <option value="structural">{strings.categories.structural}</option>
                        <option value="appliance">{strings.categories.appliance}</option>
                        <option value="hvac">{strings.categories.hvac}</option>
                        <option value="pest">{strings.categories.pest}</option>
                        <option value="other">{strings.categories.other}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        {strings.priority}
                      </label>
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        className="w-full p-3 border-2 rounded-lg appearance-none"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderColor: colors.borderColor,
                          color: colors.textPrimary,
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1em 1em',
                        }}
                      >
                        <option value="low">{strings.priorities.low}</option>
                        <option value="medium">{strings.priorities.medium}</option>
                        <option value="high">{strings.priorities.high}</option>
                        <option value="urgent">{strings.priorities.urgent}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="property_address" className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.propertyAddress}
                    </label>
                    <input
                      id="property_address"
                      type="text"
                      value={formData.property_address}
                      onChange={(e) => setFormData({...formData, property_address: e.target.value})}
                      className="w-full p-3 border-2 rounded-lg"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.borderColor,
                        color: colors.textPrimary
                      }}
                      placeholder={language === 'th' ? 'ที่อยู่ทรัพย์สิน' : 'Property address'}
                    />
                  </div>

                  <div>
                    <label htmlFor="reported_date" className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.reportedDate} *
                    </label>
                    <input
                      id="reported_date"
                      type="date"
                      required
                      value={formData.reported_date}
                      onChange={(e) => {
                        setFormData({...formData, reported_date: e.target.value});
                        setFormErrors(prev => ({...prev, reported_date: null}));
                      }}
                      className={`w-full p-3 border-2 rounded-lg ${formErrors.reported_date ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: formErrors.reported_date ? '#EF4444' : colors.borderColor,
                        color: colors.textPrimary
                      }}
                    />
                    {formErrors.reported_date && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.reported_date}</p>
                    )}
                  </div>

                  {/* Photo Upload Section */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.photosOptional}
                    </label>
                    <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                      {strings.photosHelp}
                    </p>

                    {/* Photo Preview Grid */}
                    {formData.photo_urls.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {formData.photo_urls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                              style={{ border: `1px solid ${colors.borderColor}` }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Buttons */}
                    <div className="flex gap-2">
                      {/* Take Photo Button */}
                      <label
                        className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg cursor-pointer transition-all text-center"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          border: `2px dashed ${colors.borderColor}`,
                          color: colors.textPrimary
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#0C3B2E';
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#3A3D40' : '#ECEFED';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.borderColor;
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploadingPhotos}
                        />
                        {uploadingPhotos ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">{strings.uploading}</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4" />
                            <span className="text-sm font-medium">{strings.takePhoto}</span>
                          </>
                        )}
                      </label>

                      {/* Upload Photo Button */}
                      <label
                        className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg cursor-pointer transition-all text-center"
                        style={{
                          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                          border: `2px dashed ${colors.borderColor}`,
                          color: colors.textPrimary
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#0C3B2E';
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#3A3D40' : '#ECEFED';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.borderColor;
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploadingPhotos}
                        />
                        {uploadingPhotos ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">{strings.uploading}</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{strings.uploadPhoto}</span>
                          </>
                        )}
                      </label>
                    </div>

                    {formData.photo_urls.length > 0 && (
                      <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                        {formData.photo_urls.length} {strings.photos}
                      </p>
                    )}

                    {formErrors.photos && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.photos}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || uploadingPhotos}
                    style={{
                      width: '100%',
                      backgroundColor: (submitting || uploadingPhotos) ? '#9CA3AF' : '#0C3B2E',
                      color: '#FFFFFF',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: (submitting || uploadingPhotos) ? 'not-allowed' : 'pointer',
                      opacity: (submitting || uploadingPhotos) ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        {editingRequest ? strings.updateButton : strings.submitButton}
                      </>
                    )}
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filter Tabs - Only show when there are requests */}
        {maintenanceRequests.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {['all', 'reported', 'acknowledged', 'in_progress', 'completed'].map((status) => (
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
        )}

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
            filteredRequests.map((request) => {
              const showInProgressButton = request.status === 'acknowledged';
              const showCompletedButton = request.status === 'acknowledged' || request.status === 'in_progress';
              const showDeleteIconOnly = showInProgressButton || showCompletedButton;

              return (
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

                  {request.photo_urls && request.photo_urls.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                        {strings.issuePhotos}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {request.photo_urls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Issue Photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-80"
                            style={{ border: `1px solid ${colors.borderColor}` }}
                            onClick={() => window.open(url, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {request.completion_photo_urls && request.completion_photo_urls.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: colors.textSecondary }}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {strings.completionPhotos}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {request.completion_photo_urls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Completion ${index + 1}`}
                            className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-80"
                            style={{ border: `2px solid #10B981` }}
                            onClick={() => window.open(url, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {request.bill_photo_urls && request.bill_photo_urls.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: colors.textSecondary }}>
                        <Package className="w-3 h-3 text-amber-600" />
                        {strings.billsReceipts}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {request.bill_photo_urls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Bill ${index + 1}`}
                            className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-80"
                            style={{ border: `2px solid #C7A338` }}
                            onClick={() => window.open(url, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {request.landlord_response && (
                    <div className="mb-3 p-3 rounded-lg" style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
                      border: `1px solid ${colors.borderColor}`
                    }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                        {strings.landlordResponse}
                      </p>
                      <p className="text-sm" style={{ color: colors.textPrimary }}>{request.landlord_response}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: colors.textSecondary }}>
                    <span>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {strings.reported}: {format(new Date(request.reported_date), 'MMM d, yyyy')}
                    </span>
                    {request.actual_cost && (
                      <span className="font-semibold" style={{ color: colors.textPrimary }}>
                        {strings.cost} ฿{request.actual_cost.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(request)}
                      style={{
                        flex: 1,
                        backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                        color: colors.textPrimary,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        border: `2px solid ${colors.borderColor}`,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#0C3B2E';
                        e.target.style.backgroundColor = '#0C3B2E';
                        e.target.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = colors.borderColor;
                        e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                        e.target.style.color = colors.textPrimary;
                      }}
                    >
                      <Pencil style={{ width: '14px', height: '14px' }} />
                      {language === 'th' ? 'แก้ไข' : 'Edit'}
                    </button>

                    {/* Show "In Progress" button only when status is "acknowledged" */}
                    {showInProgressButton && (
                      <button
                        onClick={() => updateRequestMutation.mutate({ 
                          id: request.id, 
                          data: { status: 'in_progress' } 
                        })}
                        style={{
                          flex: 1,
                          backgroundColor: '#3B82F6',
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
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2563EB'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#3B82F6'}
                      >
                        <Clock style={{ width: '14px', height: '14px' }} />
                        {strings.inProgress}
                      </button>
                    )}

                    {/* Show "Mark Completed" button when status is "acknowledged" or "in_progress" */}
                    {showCompletedButton && (
                      <button
                        onClick={() => updateRequestMutation.mutate({ 
                          id: request.id, 
                          data: { status: 'completed' } 
                        })}
                        style={{
                          flex: 1,
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

                    <button
                      onClick={() => setDeletingRequest(request)}
                      style={{
                        flex: showDeleteIconOnly ? 0 : 1,
                        minWidth: showDeleteIconOnly ? '44px' : 'auto',
                        backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                        color: '#EF4444',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        border: '2px solid #FCA5A5',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#EF4444';
                        e.target.style.color = '#FFFFFF';
                        e.target.style.borderColor = '#EF4444';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = isDarkMode ? '#3A2626' : '#FEE2E2';
                        e.target.style.color = '#EF4444';
                        e.target.style.borderColor = '#FCA5A5';
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      {showDeleteIconOnly ? '' : (language === 'th' ? 'ลบ' : 'Delete')}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )})
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingRequest} onOpenChange={(open) => !open && setDeletingRequest(null)}>
          <DialogContent style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor
          }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  {strings.confirmDelete}
                  <p className="text-sm font-normal mt-1" style={{ color: colors.textSecondary }}>
                    {strings.confirmDeleteDesc}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {deletingRequest && (
              <div className="p-4 rounded-lg" style={{
                backgroundColor: isDarkMode ? '#2A2D30' : '#F9FAFB',
                border: `1px solid ${colors.borderColor}`
              }}>
                <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  {deletingRequest.issue_title}
                </p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {deletingRequest.description}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setDeletingRequest(null)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: `2px solid ${colors.borderColor}`,
                  backgroundColor: colors.cardBg,
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = colors.cardBg;
                }}
              >
                {strings.cancelDelete}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteRequestMutation.isLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: 'none',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  cursor: deleteRequestMutation.isLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteRequestMutation.isLoading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => !deleteRequestMutation.isLoading && (e.target.style.backgroundColor = '#DC2626')}
                onMouseLeave={(e) => !deleteRequestMutation.isLoading && (e.target.style.backgroundColor = '#EF4444')}
              >
                {deleteRequestMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'th' ? 'กำลังลบ...' : 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {strings.confirmDeleteBtn}
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
