
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Home, ChevronDown, ChevronUp, Wallet, Calendar, Bell, Plus,
  Edit2, Save, X, Wrench, AlertCircle, CheckCircle2, Clock,
  DollarSign, ArrowLeft, Shield, MessageSquare, User, Send, Camera, Loader2, Image
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PropertyTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState({
    deposit: true,
    rent: true,
    maintenance: true
  });
  const [editingDeposit, setEditingDeposit] = useState(false);
  const [editingRent, setEditingRent] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [chatMessages, setChatMessages] = useState({}); // {requestId: message}
  const [chatPhotos, setChatPhotos] = useState({}); // {requestId: [urls]}
  const [sendingChat, setSendingChat] = useState({}); // {requestId: boolean}
  const [uploadingChatPhoto, setUploadingChatPhoto] = useState({}); // {requestId: boolean}

  // NEW: Photo upload for creating maintenance request
  const [newRequestPhotos, setNewRequestPhotos] = useState([]);
  const [uploadingNewRequestPhoto, setUploadingNewRequestPhoto] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.DepositTracker.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const [depositForm, setDepositForm] = useState({
    deposit_amount: '',
    deposit_paid_date: '',
    expected_return_date: '',
    property_address: '',
    notes: ''
  });

  const [rentForm, setRentForm] = useState({
    rent_amount: '',
    rent_due_day: '',
    rent_alerts_enabled: false,
    rent_alert_days_before: 3
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    issue_title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    property_address: '',
    reported_date: new Date().toISOString().split('T')[0]
  });

  const createDepositMutation = useMutation({
    mutationFn: (data) => base44.entities.DepositTracker.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setEditingDeposit(false);
      setDepositForm({
        deposit_amount: '',
        deposit_paid_date: '',
        expected_return_date: '',
        property_address: '',
        notes: ''
      });
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositTracker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setEditingDeposit(false);
      setEditingRent(false);
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data) => {
      // ✅ Add initial log entry when tenant creates request
      const initialLog = [{
        date: new Date().toISOString(),
        sender: 'Tenant',
        message: `Issue reported: ${data.issue_title}`,
        photo_urls: data.photo_urls || []
      }];
      
      const requestData = {
        ...data,
        communication_log: initialLog,
        acknowledgment_token: crypto.randomUUID() // Generate secure token for landlord access
      };
      
      const request = await base44.entities.MaintenanceRequest.create(requestData);
      
      // Send notifications to landlord/juristic
      try {
        await base44.functions.invoke('sendMaintenanceNotification', {
          maintenanceId: request.id,
          notifyType: 'new_request'
        });
        console.log('✅ Maintenance notifications sent');
      } catch (err) {
        console.error('❌ Failed to send maintenance notifications:', err);
      }
      
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setShowAddMaintenance(false);
      setMaintenanceForm({
        issue_title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        property_address: '',
        reported_date: new Date().toISOString().split('T')[0]
      });
      setNewRequestPhotos([]); // Clear photos after successful creation
    },
  });

  const updateMaintenanceStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.MaintenanceRequest.update(id, { status });
      
      // Send notification to tenant about status change
      try {
        await base44.functions.invoke('sendMaintenanceNotification', {
          maintenanceId: id,
          notifyType: 'status_update'
        });
        console.log('✅ Status update notification sent');
      } catch (err) {
        console.error('❌ Failed to send status notification:', err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const language = user?.language || 'en';

  // NEW: Handle photo/video upload for new maintenance request
  const handleNewRequestPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingNewRequestPhoto(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const photoUrls = uploadResults.map(result => result.file_url);
      
      setNewRequestPhotos(prev => [...prev, ...photoUrls]);
    } catch (error) {
      console.error('Photo/video upload failed:', error);
      alert(language === 'th' ? 'อัปโหลดไม่สำเร็จ' : 'Upload failed');
    } finally {
      setUploadingNewRequestPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemoveNewRequestPhoto = (index) => {
    setNewRequestPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleChatPhotoUpload = async (e, requestId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingChatPhoto(prev => ({ ...prev, [requestId]: true }));
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const photoUrls = uploadResults.map(result => result.file_url);
      
      setChatPhotos(prev => ({
        ...prev,
        [requestId]: [...(prev[requestId] || []), ...photoUrls]
      }));
    } catch (error) {
      console.error('Photo/video upload failed:', error);
      alert(language === 'th' ? 'อัปโหลดไม่สำเร็จ' : 'Upload failed');
    } finally {
      setUploadingChatPhoto(prev => ({ ...prev, [requestId]: false }));
      e.target.value = '';
    }
  };

  const handleRemoveChatPhoto = (requestId, index) => {
    setChatPhotos(prev => ({
      ...prev,
      [requestId]: (prev[requestId] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSendChatMessage = async (requestId) => {
    const message = chatMessages[requestId]?.trim();
    if (!message && (!chatPhotos[requestId] || chatPhotos[requestId].length === 0)) return;

    setSendingChat(prev => ({ ...prev, [requestId]: true }));
    try {
      const response = await base44.functions.invoke('addMaintenanceComment', {
        maintenanceId: requestId,
        message: message || (language === 'th' ? '[ส่งรูปภาพ]' : '[Photo sent]'), // Message updated to reflect photo/video
        photoUrls: chatPhotos[requestId] || [],
        senderType: 'Tenant'
      });

      if (response.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        setChatMessages(prev => ({ ...prev, [requestId]: '' }));
        setChatPhotos(prev => ({ ...prev, [requestId]: [] }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(language === 'th' ? 'ส่งข้อความไม่สำเร็จ' : 'Failed to send message');
    } finally {
      setSendingChat(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#1A1D1F' : '#F8FAFC',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
    borderColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    inputBg: isDarkMode ? '#353A3D' : '#FFFFFF',
    sectionBg: isDarkMode ? '#353A3D' : '#F8FAFC'
  };

  const t = {
    en: {
      title: "Property Tracker",
      subtitle: "Manage your rental property in one place",
      depositSection: "Deposit & Returns",
      rentSection: "Rent Schedule",
      maintenanceSection: "Maintenance Requests",
      depositAmount: "Deposit Amount (฿)",
      paidDate: "Paid Date",
      expectedReturn: "Expected Return Date",
      propertyAddress: "Property Address",
      rentAmount: "Monthly Rent (฿)",
      rentDueDay: "Rent Due Day (1-31)",
      alertDaysBefore: "Alert Days Before",
      rentAlertsEnabled: "Enable Rent Alerts",
      notes: "Notes",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      addDeposit: "Add Deposit",
      addRent: "Add Rent Schedule",
      noDeposit: "No deposit tracked yet",
      addDepositDesc: "Start tracking your security deposit",
      noRent: "No rent schedule set",
      addRentDesc: "Set up monthly rent reminders",
      daysRemaining: "days remaining",
      overdue: "OVERDUE",
      addMaintenance: "New Request",
      issueTitle: "Issue Title",
      description: "Description",
      category: "Category",
      priority: "Priority",
      reportedDate: "Reported Date",
      noMaintenance: "No maintenance requests",
      status: "Status",
      back: "Back",
      chatLog: "Communication History",
      viewChat: "View Chat",
      hideChat: "Hide Chat",
      tenant: "Tenant",
      landlord: "Landlord/Juristic",
      typeMessage: "Type your message...",
      send: "Send",
      attachPhoto: "Attach Photo",
      uploading: "Uploading...",
      addPhotos: "Add Photos/Videos",
      photos: "files",
      takePhoto: "Take Photo/Video",
      uploadFromGallery: "Upload from Gallery"
    },
    th: {
      title: "ติดตามทรัพย์สิน",
      subtitle: "จัดการทรัพย์สินเช่าของคุณในที่เดียว",
      depositSection: "เงินมัดจำและการคืน",
      rentSection: "กำหนดการชำระค่าเช่า",
      maintenanceSection: "คำขอซ่อมบำรุง",
      depositAmount: "จำนวนเงินมัดจำ (฿)",
      paidDate: "วันที่จ่าย",
      expectedReturn: "วันที่คาดว่าจะได้รับคืน",
      propertyAddress: "ที่อยู่ทรัพย์สิน",
      rentAmount: "ค่าเช่ารายเดือน (฿)",
      rentDueDay: "วันที่ครบกำหนด (1-31)",
      alertDaysBefore: "แจ้งเตือนก่อน (วัน)",
      rentAlertsEnabled: "เปิดการแจ้งเตือนค่าเช่า",
      notes: "หมายเหตุ",
      save: "บันทึก",
      cancel: "ยกเลิก",
      edit: "แก้ไข",
      addDeposit: "เพิ่มเงินมัดจำ",
      addRent: "เพิ่มกำหนดค่าเช่า",
      noDeposit: "ยังไม่มีการติดตามเงินมัดจำ",
      addDepositDesc: "เริ่มติดตามเงินมัดจำของคุณ",
      noRent: "ยังไม่มีกำหนดการชำระค่าเช่า",
      addRentDesc: "ตั้งค่าการแจ้งเตือนค่าเช่ารายเดือน",
      daysRemaining: "วันคงเหลือ",
      overdue: "เกินกำหนด",
      addMaintenance: "คำขอใหม่",
      issueTitle: "หัวข้อปัญหา",
      description: "รายละเอียด",
      category: "ประเภท",
      priority: "ความสำคัญ",
      reportedDate: "วันที่รายงาน",
      noMaintenance: "ไม่มีคำขอซ่อมบำรุง",
      status: "สถานะ",
      back: "กลับ",
      chatLog: "ประวัติการสื่อสาร",
      viewChat: "ดูแชท",
      hideChat: "ซ่อนแชท",
      tenant: "ผู้เช่า",
      landlord: "เจ้าของบ้าน/นิติ",
      typeMessage: "พิมพ์ข้อความ...",
      send: "ส่ง",
      attachPhoto: "แนบรูป",
      uploading: "กำลังอัปโหลด...",
      addPhotos: "เพิ่มรูป/วิดีโอ",
      photos: "ไฟล์",
      takePhoto: "ถ่ายรูป/วิดีโอ",
      uploadFromGallery: "เลือกจากแกลเลอรี่"
    }
  };

  const strings = t[language];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleRequestChat = (requestId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const handleDepositSubmit = () => {
    const data = {
      deposit_amount: parseFloat(depositForm.deposit_amount),
      deposit_paid_date: depositForm.deposit_paid_date,
      expected_return_date: depositForm.expected_return_date,
      status: 'tracking'
    };

    if (depositForm.property_address) data.property_address = depositForm.property_address;
    if (depositForm.notes) data.notes = depositForm.notes;

    if (deposits.length > 0) {
      updateDepositMutation.mutate({ id: deposits[0].id, data });
    } else {
      createDepositMutation.mutate(data);
    }
  };

  const handleRentSubmit = () => {
    const data = {
      rent_amount: parseFloat(rentForm.rent_amount),
      rent_due_day: parseInt(rentForm.rent_due_day, 10),
      rent_alerts_enabled: rentForm.rent_alerts_enabled,
      rent_alert_days_before: parseInt(rentForm.rent_alert_days_before, 10)
    };

    if (deposits.length > 0) {
      updateDepositMutation.mutate({ id: deposits[0].id, data });
    } else {
      const minimalDeposit = {
        deposit_amount: 0,
        deposit_paid_date: new Date().toISOString().split('T')[0],
        expected_return_date: new Date().toISOString().split('T')[0],
        status: 'tracking',
        ...data
      };
      createDepositMutation.mutate(minimalDeposit);
    }
  };

  const handleMaintenanceSubmit = () => {
    const formDataWithPhotos = {
      ...maintenanceForm,
      photo_urls: newRequestPhotos
    };
    createMaintenanceMutation.mutate(formDataWithPhotos);
  };

  const deposit = deposits[0];
  const now = new Date();
  const daysRemaining = deposit?.expected_return_date
    ? differenceInDays(new Date(deposit.expected_return_date), now)
    : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isUrgent = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;

  const activeRequests = maintenanceRequests.filter(r => r.status !== 'completed' && r.status !== 'rejected');
  const completedRequests = maintenanceRequests.filter(r => r.status === 'completed' || r.status === 'rejected');

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {strings.back}
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Home className="w-7 h-7 md:w-8 md:h-8 text-ls-forest" />
            {strings.title}
          </h1>
          <p style={{ color: colors.textSecondary }}>{strings.subtitle}</p>
        </div>

        {/* DEPOSIT SECTION */}
        <Card className="mb-4 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('deposit')}
            style={{
              backgroundColor: colors.sectionBg,
              borderBottom: expandedSections.deposit ? `1px solid ${colors.borderColor}` : 'none'
            }}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Wallet className="w-5 h-5 text-ls-gold" />
                {strings.depositSection}
                {deposit && deposit.deposit_amount > 0 && (
                  <Badge className={isOverdue ? 'bg-red-100 text-red-800' : isUrgent ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}>
                    {isOverdue
                      ? `${strings.overdue} ${Math.abs(daysRemaining)} ${strings.daysRemaining}`
                      : daysRemaining !== null
                        ? `${daysRemaining} ${strings.daysRemaining}`
                        : 'Active'
                    }
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {deposit && deposit.deposit_amount > 0 && !editingDeposit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDepositForm({
                        deposit_amount: deposit.deposit_amount?.toString() || '',
                        deposit_paid_date: deposit.deposit_paid_date || '',
                        expected_return_date: deposit.expected_return_date || '',
                        property_address: deposit.property_address || '',
                        notes: deposit.notes || ''
                      });
                      setEditingDeposit(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                {expandedSections.deposit ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </CardHeader>

          {expandedSections.deposit && (
            <CardContent className="p-6">
              {(!deposit || deposit.deposit_amount === 0) && !editingDeposit ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary, opacity: 0.3 }} />
                  <p className="font-semibold mb-2" style={{ color: colors.textPrimary }}>{strings.noDeposit}</p>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{strings.addDepositDesc}</p>
                  <Button onClick={() => setEditingDeposit(true)} className="bg-ls-gold hover:bg-ls-gold/90 text-ls-charcoal">
                    <Plus className="w-4 h-4 mr-2" />
                    {strings.addDeposit}
                  </Button>
                </div>
              ) : editingDeposit ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.depositAmount}</Label>
                      <Input
                        type="number"
                        value={depositForm.deposit_amount}
                        onChange={(e) => setDepositForm({...depositForm, deposit_amount: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.propertyAddress}</Label>
                      <Input
                        value={depositForm.property_address}
                        onChange={(e) => setDepositForm({...depositForm, property_address: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.paidDate}</Label>
                      <Input
                        type="date"
                        value={depositForm.deposit_paid_date}
                        onChange={(e) => setDepositForm({...depositForm, deposit_paid_date: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.expectedReturn}</Label>
                      <Input
                        type="date"
                        value={depositForm.expected_return_date}
                        onChange={(e) => setDepositForm({...depositForm, expected_return_date: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label style={{ color: colors.textPrimary }}>{strings.notes}</Label>
                    <Textarea
                      value={depositForm.notes}
                      onChange={(e) => setDepositForm({...depositForm, notes: e.target.value})}
                      className="mt-2"
                      rows={2}
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingDeposit(false)}>
                      <X className="w-4 h-4 mr-2" />
                      {strings.cancel}
                    </Button>
                    <Button onClick={handleDepositSubmit} className="bg-ls-forest hover:bg-ls-forest/90">
                      <Save className="w-4 h-4 mr-2" />
                      {strings.save}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.sectionBg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-ls-gold" />
                      <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.depositAmount}</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      ฿{deposit.deposit_amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.sectionBg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-ls-forest" />
                      <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.expectedReturn}</p>
                    </div>
                    <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                      {deposit.expected_return_date ? format(new Date(deposit.expected_return_date), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* RENT SECTION */}
        <Card className="mb-4 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('rent')}
            style={{
              backgroundColor: colors.sectionBg,
              borderBottom: expandedSections.rent ? `1px solid ${colors.borderColor}` : 'none'
            }}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Calendar className="w-5 h-5 text-blue-600" />
                {strings.rentSection}
                {deposit?.rent_amount && deposit?.rent_due_day && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Day {deposit.rent_due_day} - ฿{deposit.rent_amount.toLocaleString()}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {deposit?.rent_amount && deposit?.rent_due_day && !editingRent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRentForm({
                        rent_amount: deposit.rent_amount?.toString() || '',
                        rent_due_day: deposit.rent_due_day?.toString() || '',
                        rent_alerts_enabled: deposit.rent_alerts_enabled || false,
                        rent_alert_days_before: deposit.rent_alert_days_before?.toString() || '3'
                      });
                      setEditingRent(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                {expandedSections.rent ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </CardHeader>

          {expandedSections.rent && (
            <CardContent className="p-6">
              {(!deposit?.rent_amount || !deposit?.rent_due_day) && !editingRent ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary, opacity: 0.3 }} />
                  <p className="font-semibold mb-2" style={{ color: colors.textPrimary }}>{strings.noRent}</p>
                  <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{strings.addRentDesc}</p>
                  <Button onClick={() => setEditingRent(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    {strings.addRent}
                  </Button>
                </div>
              ) : editingRent ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.rentAmount}</Label>
                      <Input
                        type="number"
                        value={rentForm.rent_amount}
                        onChange={(e) => setRentForm({...rentForm, rent_amount: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.rentDueDay}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="e.g., 5"
                        value={rentForm.rent_due_day}
                        onChange={(e) => setRentForm({...rentForm, rent_due_day: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.alertDaysBefore}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="14"
                        value={rentForm.rent_alert_days_before}
                        onChange={(e) => setRentForm({...rentForm, rent_alert_days_before: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={rentForm.rent_alerts_enabled}
                      onCheckedChange={(checked) => setRentForm({...rentForm, rent_alerts_enabled: checked})}
                    />
                    <Label style={{ color: colors.textPrimary }}>{strings.rentAlertsEnabled}</Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingRent(false)}>
                      <X className="w-4 h-4 mr-2" />
                      {strings.cancel}
                    </Button>
                    <Button onClick={handleRentSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Save className="w-4 h-4 mr-2" />
                      {strings.save}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.sectionBg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.rentAmount}</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      ฿{deposit.rent_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.sectionBg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.rentDueDay}</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      Day {deposit.rent_due_day}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.sectionBg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.alertDaysBefore}</p>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      {deposit.rent_alert_days_before || 3} days
                    </p>
                    {deposit.rent_alerts_enabled && (
                      <Badge className="bg-emerald-100 text-emerald-800 mt-2">
                        <Bell className="w-3 h-3 mr-1" />
                        Alerts ON
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* MAINTENANCE SECTION - UPDATED WITH PHOTO UPLOAD IN CREATION FORM */}
        <Card className="mb-4 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('maintenance')}
            style={{ 
              backgroundColor: colors.sectionBg,
              borderBottom: expandedSections.maintenance ? `1px solid ${colors.borderColor}` : 'none'
            }}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Wrench className="w-5 h-5 text-orange-600" />
                {strings.maintenanceSection}
                {activeRequests.length > 0 && (
                  <Badge className="bg-orange-100 text-orange-800">
                    {activeRequests.length} Active
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddMaintenance(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                {expandedSections.maintenance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </CardHeader>

          {expandedSections.maintenance && (
            <CardContent className="p-6">
              {showAddMaintenance && (
                <div className="mb-4 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: colors.borderColor, backgroundColor: colors.sectionBg }}>
                  <h3 className="font-bold mb-3" style={{ color: colors.textPrimary }}>{strings.addMaintenance}</h3>
                  <div className="space-y-3">
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.issueTitle}</Label>
                      <Input
                        value={maintenanceForm.issue_title}
                        onChange={(e) => setMaintenanceForm({...maintenanceForm, issue_title: e.target.value})}
                        className="mt-2"
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.description}</Label>
                      <Textarea
                        value={maintenanceForm.description}
                        onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                        className="mt-2"
                        rows={3}
                        style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
                      />
                    </div>
                    
                    {/* Photo/Video Upload Section - RESTORED TO WORKING VERSION */}
                    <div>
                      <Label style={{ color: colors.textPrimary }}>
                        <Camera className="w-4 h-4 inline mr-1" />
                        {strings.addPhotos}
                      </Label>
                      
                      {/* Photo/Video Preview Grid */}
                      {newRequestPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
                          {newRequestPhotos.map((url, index) => {
                            const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                            return (
                              <div key={index} className="relative group">
                                {isVideo ? (
                                  <video
                                    src={url}
                                    className="w-full h-20 object-cover rounded-lg"
                                    style={{ border: `1px solid ${colors.borderColor}` }}
                                    controls={false}
                                    muted
                                    loop
                                    playsInline
                                  />
                                ) : (
                                  <img
                                    src={url}
                                    alt={`File ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg"
                                    style={{ border: `1px solid ${colors.borderColor}` }}
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNewRequestPhoto(index)}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Upload Buttons - BACK TO ORIGINAL WORKING VERSION */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {/* Take Photo/Video Button - capture="user" */}
                        <label
                          className="flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*,video/*"
                            capture="user"
                            multiple
                            onChange={handleNewRequestPhotoUpload}
                            className="hidden"
                            disabled={uploadingNewRequestPhoto}
                          />
                          {uploadingNewRequestPhoto ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span className="font-medium text-sm">{strings.uploading}</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-5 h-5" />
                              <span className="font-medium text-sm">{strings.takePhoto}</span>
                            </>
                          )}
                        </label>

                        {/* Upload from Gallery Button - NO capture */}
                        <label
                          className="flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.borderColor,
                            color: colors.textPrimary
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleNewRequestPhotoUpload}
                            className="hidden"
                            disabled={uploadingNewRequestPhoto}
                          />
                          {uploadingNewRequestPhoto ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span className="font-medium text-sm">{strings.uploading}</span>
                            </>
                          ) : (
                            <>
                              <Image className="w-5 h-5" />
                              <span className="font-medium text-sm">{strings.uploadFromGallery}</span>
                            </>
                          )}
                        </label>
                      </div>

                      {newRequestPhotos.length > 0 && (
                        <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                          {newRequestPhotos.length} {strings.photos}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label style={{ color: colors.textPrimary }}>{strings.category}</Label>
                        <Select value={maintenanceForm.category} onValueChange={(value) => setMaintenanceForm({...maintenanceForm, category: value})}>
                          <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}>
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
                        <Label style={{ color: colors.textPrimary }}>{strings.priority}</Label>
                        <Select value={maintenanceForm.priority} onValueChange={(value) => setMaintenanceForm({...maintenanceForm, priority: value})}>
                          <SelectTrigger className="mt-2" style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}>
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
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => {
                        setShowAddMaintenance(false);
                        setNewRequestPhotos([]);
                      }}>
                        <X className="w-4 h-4 mr-2" />
                        {strings.cancel}
                      </Button>
                      <Button 
                        onClick={handleMaintenanceSubmit} 
                        disabled={uploadingNewRequestPhoto}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {strings.save}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {maintenanceRequests.length === 0 ? (
                <div className="text-center py-6">
                  <Wrench className="w-10 h-10 mx-auto mb-2" style={{ color: colors.textSecondary, opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.noMaintenance}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenanceRequests.map((request) => {
                    const chatLog = request.communication_log || [];
                    const isChatExpanded = expandedRequests[request.id];
                    
                    return (
                      <div key={request.id} className="rounded-lg border" style={{ borderColor: colors.borderColor, backgroundColor: colors.sectionBg }}>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold" style={{ color: colors.textPrimary }}>{request.issue_title}</h4>
                              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{request.description}</p>
                            </div>
                            <Select
                              value={request.status}
                              onValueChange={(value) => updateMaintenanceStatusMutation.mutate({ id: request.id, status: value })}
                            >
                              <SelectTrigger className={`${getStatusColor(request.status)} border-none w-32`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reported">Reported</SelectItem>
                                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-4 text-xs mb-3" style={{ color: colors.textSecondary }}>
                            <span>📅 {format(new Date(request.reported_date), 'MMM d, yyyy')}</span>
                            <span>🏷️ {request.category}</span>
                            <span>⚡ {request.priority}</span>
                            {chatLog.length > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {chatLog.length} updates
                              </span>
                            )}
                          </div>

                          {/* Chat Log Toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRequestChat(request.id)}
                            className="w-full justify-center text-xs mt-2"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {isChatExpanded ? strings.hideChat : strings.viewChat}
                            <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isChatExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        </div>

                        {/* Communication Log + Chat Input */}
                        {isChatExpanded && (
                          <div className="border-t" style={{ borderColor: colors.borderColor, backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF' }}>
                            {/* Chat Messages */}
                            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                              {chatLog.map((entry, index) => {
                                const isTenant = entry.sender?.toLowerCase().includes('tenant');
                                const isLandlord = entry.sender?.toLowerCase().includes('landlord') || entry.sender?.toLowerCase().includes('juristic');
                                
                                return (
                                  <div
                                    key={index}
                                    className="p-3 rounded-lg border-l-4"
                                    style={{
                                      backgroundColor: isTenant 
                                        ? (isDarkMode ? '#1E3A5F' : '#EFF6FF')
                                        : (isDarkMode ? '#1F2937' : '#FEF3C7'),
                                      borderLeftColor: isTenant ? '#3B82F6' : '#F59E0B'
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <div className="flex items-center gap-2">
                                        <User className="w-3 h-3" style={{ color: isTenant ? '#3B82F6' : '#F59E0B' }} />
                                        <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                                          {isTenant ? strings.tenant : isLandlord ? strings.landlord : entry.sender}
                                        </span>
                                      </div>
                                      <span className="text-xs" style={{ color: colors.textSecondary }}>
                                        {format(new Date(entry.date), 'MMM d, h:mm a')}
                                      </span>
                                    </div>
                                    <p className="text-sm mb-2" style={{ color: colors.textPrimary }}>
                                      {entry.message}
                                    </p>
                                    {entry.photo_urls && entry.photo_urls.length > 0 && (
                                      <div className="grid grid-cols-3 gap-1 mt-2">
                                        {entry.photo_urls.map((url, photoIndex) => {
                                          const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                                          return isVideo ? (
                                            <video
                                              key={photoIndex}
                                              src={url}
                                              className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                              onClick={() => window.open(url, '_blank')}
                                              controls
                                            />
                                          ) : (
                                            <img
                                              key={photoIndex}
                                              src={url}
                                              alt={`Media ${photoIndex + 1}`}
                                              className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                              onClick={() => window.open(url, '_blank')}
                                            />
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Chat Input with Working Camera */}
                            <div className="p-4 border-t" style={{ borderColor: colors.borderColor, backgroundColor: colors.sectionBg }}>
                              {/* Photo/Video Preview */}
                              {chatPhotos[request.id] && chatPhotos[request.id].length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                  {chatPhotos[request.id].map((url, index) => {
                                    const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                                    return (
                                      <div key={index} className="relative group">
                                        {isVideo ? (
                                          <video
                                            src={url}
                                            className="w-full h-16 object-cover rounded"
                                            controls={false}
                                            muted
                                            loop
                                            playsInline
                                          />
                                        ) : (
                                          <img
                                            src={url}
                                            alt={`Attachment ${index + 1}`}
                                            className="w-full h-16 object-cover rounded"
                                          />
                                        )}
                                        <button
                                          onClick={() => handleRemoveChatPhoto(request.id, index)}
                                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          style={{ transform: 'translate(25%, -25%)' }}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="flex gap-2">
                                {/* Take Photo/Video Button - FIXED */}
                                <label
                                  className="flex-shrink-0 cursor-pointer"
                                  style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    backgroundColor: uploadingChatPhoto[request.id] ? colors.borderColor : colors.inputBg,
                                    border: `2px solid ${colors.borderColor}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    capture="user"
                                    multiple
                                    onChange={(e) => handleChatPhotoUpload(e, request.id)}
                                    className="hidden"
                                    disabled={uploadingChatPhoto[request.id]}
                                  />
                                  {uploadingChatPhoto[request.id] ? (
                                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textSecondary }} />
                                  ) : (
                                    <Camera className="w-5 h-5" style={{ color: colors.textPrimary }} />
                                  )}
                                </label>

                                {/* Upload from Gallery Button - NO capture */}
                                <label
                                  className="flex-shrink-0 cursor-pointer"
                                  style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    backgroundColor: uploadingChatPhoto[request.id] ? colors.borderColor : colors.inputBg,
                                    border: `2px solid ${colors.borderColor}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={(e) => handleChatPhotoUpload(e, request.id)}
                                    className="hidden"
                                    disabled={uploadingChatPhoto[request.id]}
                                  />
                                  {uploadingChatPhoto[request.id] ? (
                                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.textSecondary }} />
                                  ) : (
                                    <Image className="w-5 h-5" style={{ color: colors.textPrimary }} />
                                  )}
                                </label>

                                {/* Message Input */}
                                <Input
                                  value={chatMessages[request.id] || ''}
                                  onChange={(e) => setChatMessages(prev => ({ ...prev, [request.id]: e.target.value }))}
                                  placeholder={strings.typeMessage}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendChatMessage(request.id);
                                    }
                                  }}
                                  className="flex-1"
                                  style={{
                                    backgroundColor: colors.inputBg,
                                    borderColor: colors.borderColor,
                                    color: colors.textPrimary
                                  }}
                                />

                                {/* Send Button */}
                                <Button
                                  onClick={() => handleSendChatMessage(request.id)}
                                  disabled={sendingChat[request.id] || (!chatMessages[request.id]?.trim() && (!chatPhotos[request.id] || chatPhotos[request.id].length === 0))}
                                  className="bg-ls-forest hover:bg-ls-forest/90"
                                  style={{
                                    opacity: (sendingChat[request.id] || (!chatMessages[request.id]?.trim() && (!chatPhotos[request.id] || chatPhotos[request.id].length === 0))) ? 0.5 : 1
                                  }}
                                >
                                  {sendingChat[request.id] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
