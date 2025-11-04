
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, Clock, CheckCircle2, AlertTriangle, Home, Zap, Droplet, Hammer, Thermometer, Bug, Package, Loader2, Camera, X, Image as ImageIcon } from "lucide-react"; // Added Loader2, Camera, X, ImageIcon
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
    // onSuccess removed here, logic moved to handleSubmit after mutateAsync
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
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
        status: 'reported'
      };

      // Only include photo_urls if there are photos
      if (formData.photo_urls.length > 0) {
        requestData.photo_urls = formData.photo_urls;
      }

      await createRequestMutation.mutateAsync(requestData);
      
      // On success actions
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setShowAddDialog(false);
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
      console.error('Failed to create request:', error);
      setFormErrors({ 
        submit: language === 'th' 
          ? 'ไม่สามารถสร้างรายการได้ กรุณาลองอีกครั้ง' 
          : 'Failed to create request. Please try again.' 
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
      photos: "photos"
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
      photos: "รูป"
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
          
          {maintenanceRequests.length > 0 && (
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) {
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
                  <DialogTitle style={{ color: colors.textPrimary }}>{strings.reportNewIssue}</DialogTitle>
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
                        {strings.submitButton}
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

                  {request.photo_urls && request.photo_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {request.photo_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Issue Photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md"
                          style={{ border: `1px solid ${colors.borderColor}` }}
                        />
                      ))}
                    </div>
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
