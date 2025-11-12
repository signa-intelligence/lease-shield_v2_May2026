
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
  DollarSign, ArrowLeft, Shield, Camera, Image as ImageIcon, Loader2
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
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

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
    mutationFn: (data) => base44.entities.MaintenanceRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setShowAddMaintenance(false);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setMaintenanceForm({
        issue_title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        property_address: '',
        reported_date: new Date().toISOString().split('T')[0]
      });
    },
  });

  const language = user?.language || 'en';
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
      addPhotos: "Add Photos",
      takePhoto: "Take Photo",
      chooseFiles: "Choose Files",
      uploadingPhotos: "Uploading photos...",
      photosAdded: "photo(s) added",
      removePhoto: "Remove",
      communicationLog: "Communication Log",
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
      addPhotos: "เพิ่มรูปภาพ",
      takePhoto: "ถ่ายรูป",
      chooseFiles: "เลือกไฟล์",
      uploadingPhotos: "กำลังอัปโหลดรูปภาพ...",
      photosAdded: "รูปภาพที่เพิ่ม",
      removePhoto: "ลบ",
      communicationLog: "บันทึกการสื่อสาร",
    }
  };

  const strings = t[language];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePhotoSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setPhotoFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
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

  const handleMaintenanceSubmit = async () => {
    console.log('🔧 === MAINTENANCE REQUEST CREATION START ===');
    console.log('👤 Current user:', user?.email);
    
    if (!user?.email) {
      console.error('❌ No user email found!');
      alert('Error: Unable to identify user. Please try refreshing the page.');
      return;
    }
    
    try {
      let photoUrls = [];

      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        console.log('📸 Uploading', photoFiles.length, 'photos...');

        const uploadPromises = photoFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );

        const uploadResults = await Promise.all(uploadPromises);
        photoUrls = uploadResults.map(result => result.file_url);
        console.log('✅ Photos uploaded:', photoUrls.length);
      }

      const initialLogEntry = {
        timestamp: new Date().toISOString(),
        message: `${language === 'th' ? 'คำขอซ่อมถูกสร้างโดย' : 'Maintenance request created by'} ${user?.full_name || user?.email}`,
        sender: 'tenant',
        sender_name: user?.full_name || user?.email,
        sender_email: user?.email,
        action_type: 'created',
        metadata: {
          issue_title: maintenanceForm.issue_title,
          category: maintenanceForm.category,
          priority: maintenanceForm.priority
        }
      };

      // ========================================
      // CRITICAL FIX: Explicitly set created_by
      // ========================================
      const maintenanceData = {
        ...maintenanceForm,
        created_by: user.email,  // 🔥 EXPLICITLY SET THIS!
        photo_urls: photoUrls,
        communication_log: [initialLogEntry]
      };

      console.log('📝 Creating maintenance request with explicit created_by:', user.email);
      console.log('📦 Data to send:', { ...maintenanceData, photo_urls: photoUrls.length + ' photos' });
      
      const createdRequest = await createMaintenanceMutation.mutateAsync(maintenanceData);
      
      console.log('✅ Maintenance request created successfully!');
      console.log('🆔 Request ID:', createdRequest.id);
      console.log('📧 created_by field:', createdRequest.created_by);

      setUploadingPhotos(false);

      console.log('📤 Sending maintenance notifications...');
      try {
        const notificationResponse = await base44.functions.invoke('sendMaintenanceNotification', {
          maintenanceRequest: createdRequest
        });

        console.log('✅ Notification response:', notificationResponse.data);

        if (notificationResponse.data?.success) {
          const sentCount = notificationResponse.data.notifications?.filter(n => n.status === 'sent').length || 0;
          if (sentCount > 0) {
            alert(
              language === 'th'
                ? `✅ คำขอซ่อมถูกส่งแล้ว!\n\nแจ้งไปยัง: ${sentCount} ผู้รับ\n\nคุณจะได้รับการแจ้งเตือนเมื่อมีการตอบกลับ`
                : `✅ Maintenance request sent!\n\nNotified: ${sentCount} recipient(s)\n\nYou'll be notified when they respond`
            );
          }
        }
      } catch (notifError) {
        console.error('❌ Failed to send notifications:', notifError);
      }

    } catch (error) {
      console.error('❌ Failed to create maintenance request:', error);
      setUploadingPhotos(false);
      alert(language === 'th'
        ? 'ไม่สามารถสร้างคำขอซ่อมบำรุงได้ กรุณาลองอีกครั้ง'
        : 'Failed to create maintenance request. Please try again.');
    }
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

        {/* MAINTENANCE SECTION */}
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

                    <div>
                      <Label style={{ color: colors.textPrimary }}>{strings.addPhotos}</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex gap-2 flex-wrap">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              multiple
                              onChange={handlePhotoSelection}
                              className="hidden"
                            />
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all"
                              style={{
                                backgroundColor: colors.inputBg,
                                borderColor: colors.borderColor,
                                color: colors.textPrimary
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#C7A338'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.borderColor}
                            >
                              <Camera className="w-4 h-4" />
                              <span className="text-sm font-semibold">{strings.takePhoto}</span>
                            </div>
                          </label>

                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handlePhotoSelection}
                              className="hidden"
                            />
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all"
                              style={{
                                backgroundColor: colors.inputBg,
                                borderColor: colors.borderColor,
                                color: colors.textPrimary
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#C7A338'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.borderColor}
                            >
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-sm font-semibold">{strings.chooseFiles}</span>
                            </div>
                          </label>
                        </div>

                        {photoPreviews.length > 0 && (
                          <div>
                            <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                              {photoPreviews.length} {strings.photosAdded}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {photoPreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border-2"
                                    style={{ borderColor: colors.borderColor }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(index)}
                                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddMaintenance(false);
                          setPhotoFiles([]);
                          setPhotoPreviews([]);
                        }}
                        disabled={uploadingPhotos}
                      >
                        <X className="w-4 h-4 mr-2" />
                        {strings.cancel}
                      </Button>
                      <Button
                        onClick={handleMaintenanceSubmit}
                        className="bg-orange-600 hover:bg-orange-700"
                        disabled={uploadingPhotos}
                      >
                        {uploadingPhotos ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {strings.uploadingPhotos}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {strings.save}
                          </>
                        )}
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
                  {maintenanceRequests.map((request) => (
                    <div key={request.id} className="p-4 rounded-lg border" style={{ borderColor: colors.borderColor, backgroundColor: colors.sectionBg }}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold" style={{ color: colors.textPrimary }}>{request.issue_title}</h4>
                          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{request.description}</p>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>

                      {request.photo_urls && request.photo_urls.length > 0 && (
                        <div className="mt-3 mb-2">
                          <div className="grid grid-cols-4 gap-2">
                            {request.photo_urls.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Issue ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg border"
                                style={{ borderColor: colors.borderColor, cursor: 'pointer' }}
                                onClick={() => window.open(url, '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {request.communication_log && request.communication_log.length > 0 && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.borderColor }}>
                          <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                            {strings.communicationLog}
                          </p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {request.communication_log.map((log, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg text-xs"
                                style={{
                                  backgroundColor: log.sender === 'tenant' ? (isDarkMode ? '#1E3A5F' : '#EFF6FF') :
                                                   log.sender === 'landlord' ? (isDarkMode ? '#3A2D1C' : '#FFF7ED') :
                                                   log.sender === 'juristic' ? (isDarkMode ? '#2D1C3A' : '#FAF5FF') :
                                                   (isDarkMode ? '#2A2D30' : '#F3F4F6'),
                                  borderLeft: `3px solid ${
                                    log.sender === 'tenant' ? '#3B82F6' :
                                    log.sender === 'landlord' ? '#F59E0B' :
                                    log.sender === 'juristic' ? '#8B5CF6' :
                                    '#6B7280'
                                  }`
                                }}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="font-semibold" style={{ color: colors.textPrimary }}>
                                    {log.sender === 'tenant' ? '👤' : log.sender === 'landlord' ? '🏠' : log.sender === 'juristic' ? '🏢' : '⚙️'} {log.sender_name || log.sender}
                                  </span>
                                  <span style={{ color: colors.textSecondary, fontSize: '10px' }}>
                                    {new Date(log.timestamp).toLocaleString(language === 'th' ? 'th-TH' : 'en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p style={{ color: colors.textPrimary }}>{log.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs mt-3" style={{ color: colors.textSecondary }}>
                        <span>📅 {format(new Date(request.reported_date), 'MMM d, yyyy')}</span>
                        <span>🏷️ {request.category}</span>
                        <span>⚡ {request.priority}</span>
                        {request.photo_urls && request.photo_urls.length > 0 && (
                          <span>📸 {request.photo_urls.length} {strings.photosAdded}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
