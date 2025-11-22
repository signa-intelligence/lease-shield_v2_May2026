import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Home, ChevronDown, ChevronUp, Wallet, Calendar, Bell, Plus,
  Edit2, Save, X, Wrench, CheckCircle2,
  DollarSign, ArrowLeft, Camera, Image as ImageIcon, Loader2, Trash2, Archive, Hash, Mic, Video
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { compressMultipleImages } from "../components/shared/ImageCompression";
import { haptic } from "../components/shared/HapticFeedback";
import UploadProgress from "../components/shared/UploadProgress";
import SwipeToDelete from "../components/shared/SwipeToDelete";
import MobileFormInput from "../components/shared/MobileFormInput";
import { useOptimisticUpdate } from "../components/shared/OptimisticUpdate";
import LazyImage from "../components/shared/LazyImage";
import PullToRefresh from "../components/shared/PullToRefresh";
import { ToastProvider, useToast } from "../components/shared/Toast";
import PageHeader from "../components/shared/PageHeader";
import DebouncedSearch from "../components/shared/DebouncedSearch";

// Maintenance Request Card Component (extracted to avoid hooks in loops)
function MaintenanceRequestCard({
  request,
  colors,
  isDarkMode,
  strings,
  language,
  getStatusColor,
  handleSwipeDelete,
  handleSwipeComplete,
  handleEditMaintenance,
  handleCloseMaintenance,
  handleDeleteMaintenance,
  expanded,
  onToggle
}) {

  return (
    <SwipeToDelete
      onDelete={() => handleSwipeDelete(request)}
      onComplete={() => handleSwipeComplete(request)}
      deleteLabel={strings.delete}
      completeLabel={strings.close}
      colors={colors}
    >
      <div 
        className="p-4 rounded-lg border-2 cursor-pointer transition-all"
        style={{ 
          borderColor: colors.borderColor, 
          backgroundColor: colors.cardBg 
        }}
        onClick={() => {
          haptic.light();
          onToggle();
        }}
      >
        {/* Collapsed header - always visible */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {request.request_number && (
                <Badge 
                  className="font-mono text-xs"
                  style={{
                    backgroundColor: isDarkMode ? colors.inputBg : '#F3F4F6',
                    color: colors.maintenanceAccent,
                    border: `1px solid ${colors.maintenanceAccent}`,
                    fontWeight: 'bold'
                  }}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {request.request_number}
                </Badge>
              )}
              <Badge className={getStatusColor(request.status)}>
                {request.status}
              </Badge>
              {request.priority && request.priority !== 'medium' && (
                <Badge className={
                  request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {request.priority}
                </Badge>
              )}
            </div>
            <h4 className="font-bold text-base sm:text-lg" style={{ color: colors.textPrimary }}>
              {request.issue_title}
            </h4>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: colors.textSecondary }} /> : <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: colors.textSecondary }} />}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.borderColor }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>{request.description}</p>

            {request.photo_urls && request.photo_urls.length > 0 && (
              <div className="mb-3">
                <div className="grid grid-cols-4 gap-2">
                  {request.photo_urls.map((url, index) => (
                    <LazyImage
                      key={index}
                      src={url}
                      alt={`Issue ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border cursor-pointer"
                      style={{ borderColor: colors.borderColor }}
                      loadingColor="#F59E0B"
                      onClick={() => { haptic.light(); window.open(url, '_blank')}}
                    />
                  ))}
                </div>
              </div>
            )}

            {request.voice_notes && request.voice_notes.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  🎤 {request.voice_notes.length} {strings.voiceNotesAdded}
                </p>
                <div className="space-y-1">
                  {request.voice_notes.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded text-xs"
                      style={{
                        backgroundColor: isDarkMode ? '#4C1D95' : '#F3E8FF',
                        border: '1px solid #8B5CF6',
                        color: colors.textPrimary,
                        textDecoration: 'none'
                      }}
                    >
                      <Mic className="w-3 h-3 text-purple-600" />
                      Voice Note {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {request.videos && request.videos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  🎥 {request.videos.length} {strings.videosAdded}
                </p>
                <div className="space-y-1">
                  {request.videos.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded text-xs"
                      style={{
                        backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
                        border: '1px solid #EF4444',
                        color: colors.textPrimary,
                        textDecoration: 'none'
                      }}
                    >
                      <Video className="w-3 h-3 text-red-600" />
                      Video {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {request.communication_log && request.communication_log.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  {strings.communicationLog}
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {request.communication_log.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg text-xs"
                      style={{
                        backgroundColor: log.sender === 'tenant' ? (isDarkMode ? '#1E3A5F' : '#EFF6FF') :
                                         log.sender === 'landlord' ? (isDarkMode ? '#3A2D1C' : '#FFF7ED') :
                                         log.sender === 'juristic' ? (isDarkMode ? '#2D1C3A' : '#FAF5FF') :
                                         (isDarkMode ? colors.fieldBg : '#F3F4F6'),
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

            <div className="flex items-center gap-4 text-xs mb-3" style={{ color: colors.textSecondary }}>
              <span>📅 {format(new Date(request.reported_date), 'MMM d, yyyy')}</span>
              <span>🏷️ {request.category}</span>
              <span>⚡ {request.priority}</span>
              {request.photo_urls && request.photo_urls.length > 0 && (
                <span>📸 {request.photo_urls.length}</span>
              )}
              {request.voice_notes && request.voice_notes.length > 0 && (
                <span>🎤 {request.voice_notes.length}</span>
              )}
              {request.videos && request.videos.length > 0 && (
                <span>🎥 {request.videos.length}</span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-3 border-t" style={{ borderColor: colors.borderColor }}>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.light();
                  handleEditMaintenance(request);
                }}
                style={{ minHeight: '36px' }}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                {strings.edit}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseMaintenance(request);
                }}
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                style={{ minHeight: '36px' }}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {strings.close}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMaintenance(request);
                }}
                className="text-red-600 border-red-600 hover:bg-red-50"
                style={{ minHeight: '36px' }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {strings.delete}
              </Button>
            </div>
          </div>
        )}
      </div>
    </SwipeToDelete>
  );
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CTA_COLOR,
  FEATURE_COLORS
} from "../components/shared/featureTheme";

function PropertyTrackerContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [expandedSections, setExpandedSections] = useState({
    deposit: true,
    rent: true,
    maintenance: true
  });
  const [editingDeposit, setEditingDeposit] = useState(false);
  const [editingRent, setEditingRent] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [deletingMaintenance, setDeletingMaintenance] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoUploadStage, setPhotoUploadStage] = useState('');
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [compressionStats, setCompressionStats] = useState(null);
  const [maintenanceSearchQuery, setMaintenanceSearchQuery] = useState('');
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState('all');
  const [expandedMaintenanceId, setExpandedMaintenanceId] = useState(null);

  // New state for voice/video
  const [voiceFiles, setVoiceFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalType, setUpgradeModalType] = useState(''); // 'voice' or 'video'

  // Section refs for scroll-to navigation
  const depositRef = useRef(null);
  const rentRef = useRef(null);
  const maintenanceRef = useRef(null);

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

  const optimistic = useOptimisticUpdate(['maintenance'], 'MaintenanceRequest');

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
      toast.success(language === 'th' ? 'บันทึกสำเร็จ' : 'Saved successfully');
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositTracker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setEditingDeposit(false);
      setEditingRent(false);
      toast.success(language === 'th' ? 'อัปเดตสำเร็จ' : 'Updated successfully');
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.MaintenanceRequest.create(data);
    },
    onMutate: async (newRequestData) => {
      haptic.medium();

      const tempId = `optimistic-${Date.now()}-${Math.random()}`;

      const optimisticItem = {
        ...newRequestData,
        id: tempId,
        status: newRequestData.status || 'reported',
        __optimistic: true,
      };

      optimistic.optimisticCreate(optimisticItem);
      return { optimisticItem };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setShowAddMaintenance(false);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setVoiceFiles([]);
      setVideoFiles([]);
      setCompressionStats(null);
      setMaintenanceForm({
        issue_title: '', description: '', category: 'other', priority: 'medium', property_address: '', reported_date: new Date().toISOString().split('T')[0]
      });
      haptic.success();

      console.log('📤 Sending maintenance notifications...');
      base44.functions.invoke('sendMaintenanceNotification', {
        maintenanceRequest: data
      }).then(notificationResponse => {
        if (notificationResponse.data?.success) {
          const sentCount = notificationResponse.data.notifications?.filter(n => n.status === 'sent').length || 0;
          if (sentCount > 0) {
            toast.success(
              language === 'th'
                ? `✅ คำขอส่งแล้ว! แจ้ง ${sentCount} ผู้รับ`
                : `✅ Request sent! Notified ${sentCount} recipient(s)`
            );
          }
        }
      }).catch(notifError => {
        console.error('❌ Failed to send notifications:', notifError);
      });
    },
    onError: (error, variables, context) => {
      console.error('❌ createMaintenanceMutation error:', error);
      optimistic.revert(context.optimisticItem.id);
      haptic.error();
      toast.error(language === 'th'
        ? 'ไม่สามารถสร้างคำขอได้'
        : 'Failed to create request');
    }
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceRequest.update(id, data),
    onMutate: async ({ id, data }) => {
      haptic.medium();
      optimistic.optimisticUpdate(id, data);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setEditingMaintenance(null);
      setShowAddMaintenance(false);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setVoiceFiles([]);
      setVideoFiles([]);
      setCompressionStats(null);
      setMaintenanceForm({
        issue_title: '', description: '', category: 'other', priority: 'medium', property_address: '', reported_date: new Date().toISOString().split('T')[0]
      });
      haptic.success();
      toast.success(language === 'th' ? 'อัปเดตสำเร็จ' : 'Updated successfully');
    },
    onError: (error, variables, context) => {
      console.error('❌ updateMaintenanceMutation error:', error);
      optimistic.revert(context.id);
      haptic.error();
      toast.error(language === 'th' ? 'อัปเดตไม่สำเร็จ' : 'Update failed');
    },
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: (id) => base44.entities.MaintenanceRequest.delete(id),
    onMutate: async (idToDelete) => {
      haptic.heavy();
      optimistic.optimisticDelete(idToDelete);
      return { idToDelete };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      haptic.success();
      toast.success(language === 'th' ? 'ลบสำเร็จ' : 'Deleted successfully');
    },
    onError: (error, variables, context) => {
      console.error('❌ deleteMaintenanceMutation error:', error);
      optimistic.revert(context.idToDelete);
      haptic.error();
      toast.error(language === 'th' ? 'ลบไม่สำเร็จ' : 'Delete failed');
    },
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const planTier = user?.plan_tier || 'free';
  const isFreeTier = planTier === 'free';
  const isProtectOrLite = planTier === 'protect' || planTier === 'lite';
  const isSecureTier = planTier === 'secure';

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    inputBg: '#374151',
    fieldBg: '#374151',
    hoverBg: '#3A3D40',
    depositAccent: FEATURE_COLORS.deposits.accent,
    rentAccent: FEATURE_COLORS.rent.accent,
    maintenanceAccent: FEATURE_COLORS.maintenance.accent
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    inputBg: '#FFFFFF',
    fieldBg: '#F8FAFC',
    hoverBg: '#F1F5F9',
    depositAccent: FEATURE_COLORS.deposits.accent,
    rentAccent: FEATURE_COLORS.rent.accent,
    maintenanceAccent: FEATURE_COLORS.maintenance.accent
  };

  const maintenanceTheme = { accent: FEATURE_COLORS.maintenance.accent };

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
      delete: "Delete",
      close: "Close",
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
      confirmDelete: "Are you sure you want to delete this request?",
      confirmClose: "Mark this request as completed and close it?",
      archived: "Archived",
      active: "Active",
      imagesOptimized: "Images Optimized",
      imagesOptimizedDesc: "images • Saved",
      processingError: "Processing error occurred",
      searchMaintenance: "Search by title or description...",
      filterByStatus: "Filter by status",
      allStatuses: "All Statuses",
      noResultsFound: "No requests found",
      tryDifferentSearch: "Try a different search term",
      uploadDepositTracker: "Upload deposit tracker",
      uploadRentSchedule: "Upload rent schedule",
      newMaintenanceRequest: "New maintenance request",
      addVoiceNote: "Add Voice Note",
      addVideo: "Add Video",
      voiceNotesAdded: "voice note(s)",
      videosAdded: "video(s)",
      protectRequired: "Protect required",
      secureRequired: "Secure required",
      upgradeToProtectVoice: "Upgrade to Protect to add voice notes",
      upgradeToProtectVoiceDesc: "Protect members can attach voice recordings to maintenance requests.",
      upgradeToSecureVideo: "Upgrade to Secure to add video evidence",
      upgradeToSecureVideoDesc: "Secure members can upload video for faster dispute resolution.",
      upgradeToProtect: "Upgrade to Protect",
      upgradeToSecure: "Upgrade to Secure",
      maxVoiceReached: "Maximum 3 voice notes per request",
      maxVideoReached: "Maximum 3 videos per request",
      fileTooLarge: "File too large",
      voiceMaxSize: "Voice notes must be under 5MB",
      videoMaxSize: "Videos must be under 80MB"
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
      delete: "ลบ",
      close: "ปิด",
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
      confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบคำขอนี้?",
      confirmClose: "ทำเครื่องหมายว่าเสร็จสิ้นและปิดคำขอนี้?",
      archived: "เก็บถาวร",
      active: "ใช้งาน",
      imagesOptimized: "ปรับขนาดไฟล์แล้ว",
      imagesOptimizedDesc: "รูป • ประหยัด",
      processingError: "เกิดข้อผิดพลาด",
      searchMaintenance: "ค้นหาด้วยหัวข้อหรือรายละเอียด...",
      filterByStatus: "กรองตามสถานะ",
      allStatuses: "ทุกสถานะ",
      noResultsFound: "ไม่พบคำขอ",
      tryDifferentSearch: "ลองค้นหาด้วยคำอื่น",
      uploadDepositTracker: "อัปโหลดเงินมัดจำ",
      uploadRentSchedule: "อัปโหลดกำหนดค่าเช่า",
      newMaintenanceRequest: "คำขอซ่อมบำรุงใหม่",
      addVoiceNote: "เพิ่มบันทึกเสียง",
      addVideo: "เพิ่มวิดีโอ",
      voiceNotesAdded: "บันทึกเสียง",
      videosAdded: "วิดีโอ",
      protectRequired: "ต้องการ Protect",
      secureRequired: "ต้องการ Secure",
      upgradeToProtectVoice: "อัปเกรดเป็น Protect เพื่อเพิ่มบันทึกเสียง",
      upgradeToProtectVoiceDesc: "สมาชิก Protect สามารถแนบบันทึกเสียงกับคำขอซ่อมบำรุงได้",
      upgradeToSecureVideo: "อัปเกรดเป็น Secure เพื่อเพิ่มวิดีโอหลักฐาน",
      upgradeToSecureVideoDesc: "สมาชิก Secure สามารถอัปโหลดวิดีโอเพื่อแก้ไขข้อพิพาทได้เร็วขึ้น",
      upgradeToProtect: "อัปเกรดเป็น Protect",
      upgradeToSecure: "อัปเกรดเป็น Secure",
      maxVoiceReached: "สูงสุด 3 บันทึกเสียงต่อคำขอ",
      maxVideoReached: "สูงสุด 3 วิดีโอต่อคำขอ",
      fileTooLarge: "ไฟล์ใหญ่เกินไป",
      voiceMaxSize: "บันทึกเสียงต้องน้อยกว่า 5MB",
      videoMaxSize: "วิดีโอต้องน้อยกว่า 80MB"
    },
    zh: {
      title: "物业追踪器",
      subtitle: "在一处管理您的租赁物业",
      depositSection: "押金与退还",
      rentSection: "租金时间表",
      maintenanceSection: "维护请求",
      depositAmount: "押金金额 (฿)",
      paidDate: "支付日期",
      expectedReturn: "预计退还日期",
      propertyAddress: "物业地址",
      rentAmount: "月租金 (฿)",
      rentDueDay: "租金到期日 (1-31)",
      alertDaysBefore: "提前提醒天数",
      rentAlertsEnabled: "启用租金提醒",
      notes: "备注",
      save: "保存",
      cancel: "取消",
      edit: "编辑",
      delete: "删除",
      close: "关闭",
      addDeposit: "添加押金",
      addRent: "添加租金时间表",
      noDeposit: "尚未追踪押金",
      addDepositDesc: "开始追踪您的押金",
      noRent: "尚未设置租金时间表",
      addRentDesc: "设置月度租金提醒",
      daysRemaining: "剩余天数",
      overdue: "逾期",
      addMaintenance: "新请求",
      issueTitle: "问题标题",
      description: "描述",
      category: "类别",
      priority: "优先级",
      reportedDate: "报告日期",
      noMaintenance: "无维护请求",
      status: "状态",
      back: "返回",
      addPhotos: "添加照片",
      takePhoto: "拍照",
      chooseFiles: "选择文件",
      uploadingPhotos: "上传照片中...",
      photosAdded: "已添加照片",
      removePhoto: "移除",
      communicationLog: "通信记录",
      confirmDelete: "您确定要删除此请求吗？",
      confirmClose: "标记此请求为已完成并关闭？",
      archived: "已归档",
      active: "活跃",
      imagesOptimized: "图片已优化",
      imagesOptimizedDesc: "图片 • 已保存",
      processingError: "处理错误",
      searchMaintenance: "按标题或描述搜索...",
      filterByStatus: "按状态筛选",
      allStatuses: "所有状态",
      noResultsFound: "未找到请求",
      tryDifferentSearch: "尝试不同的搜索词",
      uploadDepositTracker: "上传押金追踪器",
      uploadRentSchedule: "上传租金时间表",
      newMaintenanceRequest: "新维护请求",
      addVoiceNote: "添加语音备忘录",
      addVideo: "添加视频",
      voiceNotesAdded: "语音备忘录",
      videosAdded: "视频",
      protectRequired: "需要 Protect",
      secureRequired: "需要 Secure",
      upgradeToProtectVoice: "升级到 Protect 以添加语音备忘录",
      upgradeToProtectVoiceDesc: "Protect 会员可以将录音附加到维护请求中。",
      upgradeToSecureVideo: "升级到 Secure 以添加视频证据",
      upgradeToSecureVideoDesc: "Secure 会员可以上传视频以加快争议解决。",
      upgradeToProtect: "升级到 Protect",
      upgradeToSecure: "升级到 Secure",
      maxVoiceReached: "每个请求最多 3 个语音备忘录",
      maxVideoReached: "每个请求最多 3 个视频",
      fileTooLarge: "文件过大",
      voiceMaxSize: "语音备忘录必须小于 5MB",
      videoMaxSize: "视频必须小于 80MB"
    },
    ja: {
      title: "物件トラッカー",
      subtitle: "賃貸物件を一箇所で管理",
      depositSection: "敷金と返還",
      rentSection: "家賃スケジュール",
      maintenanceSection: "メンテナンスリクエスト",
      depositAmount: "敷金額 (฿)",
      paidDate: "支払日",
      expectedReturn: "返還予定日",
      propertyAddress: "物件住所",
      rentAmount: "月額家賃 (฿)",
      rentDueDay: "家賃支払日 (1-31)",
      alertDaysBefore: "事前アラート日数",
      rentAlertsEnabled: "家賃アラートを有効化",
      notes: "メモ",
      save: "保存",
      cancel: "キャンセル",
      edit: "編集",
      delete: "削除",
      close: "閉じる",
      addDeposit: "敷金を追加",
      addRent: "家賃スケジュールを追加",
      noDeposit: "まだ敷金を追跡していません",
      addDepositDesc: "敷金の追跡を開始",
      noRent: "家賃スケジュールが設定されていません",
      addRentDesc: "月次家賃リマインダーを設定",
      daysRemaining: "残り日数",
      overdue: "期限超過",
      addMaintenance: "新しいリクエスト",
      issueTitle: "問題タイトル",
      description: "説明",
      category: "カテゴリ",
      priority: "優先度",
      reportedDate: "報告日",
      noMaintenance: "メンテナンスリクエストなし",
      status: "ステータス",
      back: "戻る",
      addPhotos: "写真を追加",
      takePhoto: "写真を撮る",
      chooseFiles: "ファイルを選択",
      uploadingPhotos: "写真をアップロード中...",
      photosAdded: "追加された写真",
      removePhoto: "削除",
      communicationLog: "通信記録",
      confirmDelete: "このリクエストを削除してもよろしいですか？",
      confirmClose: "このリクエストを完了としてマークして閉じますか？",
      archived: "アーカイブ済み",
      active: "アクティブ",
      imagesOptimized: "画像を最適化しました",
      imagesOptimizedDesc: "画像 • 保存済み",
      processingError: "処理エラーが発生しました",
      searchMaintenance: "タイトルまたは説明で検索...",
      filterByStatus: "ステータスでフィルター",
      allStatuses: "すべてのステータス",
      noResultsFound: "リクエストが見つかりません",
      tryDifferentSearch: "別の検索語を試してください",
      uploadDepositTracker: "敷金トラッカーをアップロード",
      uploadRentSchedule: "家賃スケジュールをアップロード",
      newMaintenanceRequest: "新しいメンテナンスリクエスト",
      addVoiceNote: "音声メモを追加",
      addVideo: "動画を追加",
      voiceNotesAdded: "音声メモ",
      videosAdded: "動画",
      protectRequired: "Protectが必要",
      secureRequired: "Secureが必要",
      upgradeToProtectVoice: "音声メモを追加するにはProtectにアップグレード",
      upgradeToProtectVoiceDesc: "Protect 会員はメンテナンスリクエストに録音を添付できます。",
      upgradeToSecureVideo: "動画証拠を追加するにはSecureにアップグレード",
      upgradeToSecureVideoDesc: "Secure 会員は動画をアップロードして、紛争解決を迅速化できます。",
      upgradeToProtect: "Protectにアップグレード",
      upgradeToSecure: "Secureにアップグレード",
      maxVoiceReached: "1リクエストにつき最大3件の音声メモ",
      maxVideoReached: "1リクエストにつき最大3件の動画",
      fileTooLarge: "ファイルが大きすぎます",
      voiceMaxSize: "音声メモは5MB未満である必要があります",
      videoMaxSize: "動画は80MB未満である必要があります"
    },
    ko: {
      title: "부동산 추적기",
      subtitle: "한 곳에서 임대 부동산 관리",
      depositSection: "보증금 및 반환",
      rentSection: "임대료 일정",
      maintenanceSection: "유지보수 요청",
      depositAmount: "보증금 금액 (฿)",
      paidDate: "지불 날짜",
      expectedReturn: "예상 반환 날짜",
      propertyAddress: "부동산 주소",
      rentAmount: "월 임대료 (฿)",
      rentDueDay: "임대료 마감일 (1-31)",
      alertDaysBefore: "사전 알림 일수",
      rentAlertsEnabled: "임대료 알림 활성화",
      notes: "메모",
      save: "저장",
      cancel: "취소",
      edit: "편집",
      delete: "삭제",
      close: "닫기",
      addDeposit: "보증금 추가",
      addRent: "임대료 일정 추가",
      noDeposit: "아직 보증금을 추적하지 않음",
      addDepositDesc: "보증금 추적 시작",
      noRent: "임대료 일정이 설정되지 않음",
      addRentDesc: "월간 임대료 알림 설정",
      daysRemaining: "남은 일수",
      overdue: "기한 초과",
      addMaintenance: "새 요청",
      issueTitle: "문제 제목",
      description: "설명",
      category: "카테고리",
      priority: "우선순위",
      reportedDate: "보고 날짜",
      noMaintenance: "유지보수 요청 없음",
      status: "상태",
      back: "뒤로",
      addPhotos: "사진 추가",
      takePhoto: "사진 촬영",
      chooseFiles: "파일 선택",
      uploadingPhotos: "사진 업로드 중...",
      photosAdded: "추가된 사진",
      removePhoto: "제거",
      communicationLog: "통신 기록",
      confirmDelete: "이 요청을 삭제하시겠습니까?",
      confirmClose: "이 요청을 완료로 표시하고 닫으시겠습니까?",
      archived: "보관됨",
      active: "활성",
      imagesOptimized: "이미지 최적화됨",
      imagesOptimizedDesc: "이미지 • 저장됨",
      processingError: "처리 오류 발생",
      searchMaintenance: "제목 또는 설명으로 검색...",
      filterByStatus: "상태별 필터",
      allStatuses: "모든 상태",
      noResultsFound: "요청을 찾을 수 없음",
      tryDifferentSearch: "다른 검색어를 시도하세요",
      uploadDepositTracker: "보증금 추적기 업로드",
      uploadRentSchedule: "임대료 일정 업로드",
      newMaintenanceRequest: "새 유지보수 요청",
      addVoiceNote: "음성 메모 추가",
      addVideo: "동영상 추가",
      voiceNotesAdded: "음성 메모",
      videosAdded: "동영상",
      protectRequired: "Protect 필요",
      secureRequired: "Secure 필요",
      upgradeToProtectVoice: "음성 메모를 추가하려면 Protect로 업그레이드",
      upgradeToProtectVoiceDesc: "Protect 회원은 유지보수 요청에 음성 녹음을 첨부할 수 있습니다.",
      upgradeToSecureVideo: "동영상 증거를 추가하려면 Secure로 업그레이드",
      upgradeToSecureVideoDesc: "Secure 회원은 더 빠른 분쟁 해결을 위해 동영상을 업로드할 수 있습니다.",
      upgradeToProtect: "Protect로 업그레이드",
      upgradeToSecure: "Secure로 업그레이드",
      maxVoiceReached: "요청당 최대 3개의 음성 메모",
      maxVideoReached: "요청당 최대 3개의 동영상",
      fileTooLarge: "파일이 너무 큼",
      voiceMaxSize: "음성 메모는 5MB 미만이어야 합니다",
      videoMaxSize: "동영상은 80MB 미만이어야 합니다"
    }
  };

  const strings = t[language] || t.en;

  const handleRefresh = async () => {
    haptic.light();
    await queryClient.invalidateQueries({ queryKey: ['deposits'] });
    await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
  };

  // Handle hash-based section navigation
  useEffect(() => {
    if (!location.hash) return;

    const sectionMap = {
      '#rent': rentRef,
      '#maintenance': maintenanceRef,
      '#deposit': depositRef,
      '#deposits': depositRef
    };

    const targetRef = sectionMap[location.hash];
    if (targetRef?.current) {
      setTimeout(() => {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setExpandedSections(prev => {
          const newState = { ...prev };
          if (location.hash === '#rent') newState.rent = true;
          if (location.hash === '#maintenance') newState.maintenance = true;
          if (location.hash === '#deposit' || location.hash === '#deposits') newState.deposit = true;
          return newState;
        });
      }, 100);
    }
  }, [location.hash]);

  const filteredMaintenanceRequests = maintenanceRequests.filter(request => {
    const matchesSearch = maintenanceSearchQuery === '' ||
      request.issue_title?.toLowerCase().includes(maintenanceSearchQuery.toLowerCase()) ||
      request.description?.toLowerCase().includes(maintenanceSearchQuery.toLowerCase()) ||
      request.request_number?.toLowerCase().includes(maintenanceSearchQuery.toLowerCase());

    const matchesStatus = maintenanceStatusFilter === 'all' || request.status === maintenanceStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeRequests = filteredMaintenanceRequests.filter(r => r.status !== 'completed' && r.status !== 'rejected');
  const completedRequests = filteredMaintenanceRequests.filter(r => r.status === 'completed' || r.status === 'rejected');

  const generateRequestNumber = () => {
    if (maintenanceRequests.length === 0) {
      return 'MR-001';
    }

    const existingNumbers = maintenanceRequests
      .filter(r => !r.__optimistic)
      .map(r => r.request_number)
      .filter(num => num && typeof num === 'string' && num.startsWith('MR-'))
      .map(num => parseInt(num.split('-')[1]))
      .filter(num => !isNaN(num));

    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = maxNumber + 1;

    return `MR-${String(nextNumber).padStart(3, '0')}`;
  };

  const toggleSection = (section) => {
    haptic.light();
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleVoiceNoteClick = () => {
    if (isFreeTier) {
      setUpgradeModalType('voice');
      setShowUpgradeModal(true);
      return;
    }

    if (voiceFiles.length >= 3) {
      toast.error(strings.maxVoiceReached);
      return;
    }

    document.getElementById('voice-input').click();
  };

  const handleVideoClick = () => {
    if (isFreeTier || isProtectOrLite) {
      setUpgradeModalType('video');
      setShowUpgradeModal(true);
      return;
    }

    if (videoFiles.length >= 3) {
      toast.error(strings.maxVideoReached);
      return;
    }

    document.getElementById('video-input').click();
  };

  const handleVoiceSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      const isAudio = f.type.startsWith('audio/');
      const isUnder5MB = f.size <= 5 * 1024 * 1024;

      if (!isAudio) {
        toast.error(language === 'th' ? 'กรุณาเลือกไฟล์เสียงเท่านั้น' : 'Please select audio files only');
        return false;
      }

      if (!isUnder5MB) {
        toast.error(`${strings.fileTooLarge}: ${f.name} - ${strings.voiceMaxSize}`);
        return false;
      }

      return true;
    });

    const remaining = 3 - voiceFiles.length;
    const toAdd = validFiles.slice(0, remaining);

    setVoiceFiles(prev => [...prev, ...toAdd]);
    haptic.light();
  };

  const handleVideoSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      const isVideo = f.type.startsWith('video/');
      const isUnder80MB = f.size <= 80 * 1024 * 1024;

      if (!isVideo) {
        toast.error(language === 'th' ? 'กรุณาเลือกไฟล์วิดีโอเท่านั้น' : 'Please select video files only');
        return false;
      }

      if (!isUnder80MB) {
        toast.error(`${strings.fileTooLarge}: ${f.name} - ${strings.videoMaxSize}`);
        return false;
      }

      return true;
    });

    const remaining = 3 - videoFiles.length;
    const toAdd = validFiles.slice(0, remaining);

    setVideoFiles(prev => [...prev, ...toAdd]);
    haptic.light();
  };

  const handleRemoveVoice = (index) => {
    haptic.light();
    setVoiceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index) => {
    haptic.light();
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoSelection = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    haptic.light();

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const nonImageFiles = files.filter(f => !f.type.startsWith('image/'));

    let processedImageFiles = [];
    if (imageFiles.length > 0) {
      const { files: compressed, stats } = await compressMultipleImages(imageFiles);

      if (stats.compressedCount > 0) {
        setCompressionStats(stats);
      }
      processedImageFiles = compressed;
    }

    const filesToAdd = [...processedImageFiles, ...nonImageFiles];
    setPhotoFiles(prev => [...prev, ...filesToAdd]);

    filesToAdd.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      } else {
        setPhotoPreviews(prev => [...prev, URL.createObjectURL(file)]);
      }
    });
  };

  const handleRemovePhoto = (indexToRemove) => {
    haptic.light();
    const newPhotoFiles = photoFiles.filter((_, i) => {
      const isNewFile = photoPreviews[i] && (photoPreviews[i].startsWith('data:image') || photoPreviews[i].startsWith('blob:'));
      return !(i === indexToRemove && isNewFile);
    });
    setPhotoFiles(newPhotoFiles);

    setPhotoPreviews(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleDepositSubmit = () => {
    haptic.medium();
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
    haptic.medium();
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
      toast.error(language === 'th' ? 'กรุณาเข้าสู่ระบบใหม่' : 'Please log in again');
      return;
    }

    try {
      let photoUrls = [];
      let voiceUrls = [];
      let videoUrls = [];

      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        setPhotoUploadStage('compressing');
        setPhotoUploadProgress(10);
        haptic.medium();
        console.log('📸 Uploading', photoFiles.length, 'photos...');

        setPhotoUploadProgress(30);
        setPhotoUploadStage('uploading');

        const uploadPromises = photoFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );

        const uploadResults = await Promise.all(uploadPromises);
        photoUrls = uploadResults.map(result => result.file_url);
        setPhotoUploadProgress(80);
        console.log('✅ Photos uploaded:', photoUrls.length);

        setPhotoUploadStage('finalizing');
        setPhotoUploadProgress(100);
      }

      if (voiceFiles.length > 0) {
        setUploadingPhotos(true); // Indicate overall upload activity
        setPhotoUploadStage('uploading_voice'); // New stage for voice
        haptic.medium();
        console.log('🎤 Uploading', voiceFiles.length, 'voice notes...');
        const voicePromises = voiceFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );
        const voiceResults = await Promise.all(voicePromises);
        voiceUrls = voiceResults.map(result => result.file_url);
        console.log('✅ Voice notes uploaded:', voiceUrls.length);
      }

      if (videoFiles.length > 0) {
        setUploadingPhotos(true); // Indicate overall upload activity
        setPhotoUploadStage('uploading_video'); // New stage for video
        haptic.medium();
        console.log('🎥 Uploading', videoFiles.length, 'videos...');
        const videoPromises = videoFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );
        const videoResults = await Promise.all(videoPromises);
        videoUrls = videoResults.map(result => result.file_url);
        console.log('✅ Videos uploaded:', videoUrls.length);
      }


      const requestNumber = generateRequestNumber();
      console.log('🔢 Generated request number:', requestNumber);

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
          priority: maintenanceForm.priority,
          request_number: requestNumber
        }
      };

      const maintenanceData = {
        ...maintenanceForm,
        request_number: requestNumber,
        created_by: user.email,
        photo_urls: photoUrls,
        voice_notes: voiceUrls,
        videos: videoUrls,
        communication_log: [initialLogEntry]
      };

      console.log('📝 Creating maintenance request with number:', requestNumber);

      await createMaintenanceMutation.mutateAsync(maintenanceData);

      setUploadingPhotos(false);
      setPhotoUploadStage('');
      setPhotoUploadProgress(0);

    } catch (error) {
      console.error('❌ Failed to create maintenance request:', error);
      setUploadingPhotos(false);
      setPhotoUploadStage('');
      setPhotoUploadProgress(0);
      setCompressionStats(null);
      toast.error(strings.processingError);
    }
  };

  const handleEditMaintenance = (request) => {
    haptic.light();
    setEditingMaintenance(request);
    setShowAddMaintenance(true);
    setMaintenanceForm({
      issue_title: request.issue_title,
      description: request.description,
      category: request.category,
      priority: request.priority,
      property_address: request.property_address || '',
      reported_date: request.reported_date
    });
    setPhotoFiles([]);
    setPhotoPreviews(request.photo_urls || []);
    setVoiceFiles([]); // Clear new files, existing ones are in request.voice_notes
    setVideoFiles([]); // Clear new files, existing ones are in request.videos
    setCompressionStats(null);
  };

  const handleUpdateMaintenance = async () => {
    if (!editingMaintenance || !user?.email) return;

    try {
      let newUploadUrls = [];
      let newVoiceUrls = [];
      let newVideoUrls = [];

      let totalFilesToUpload = photoFiles.length + voiceFiles.length + videoFiles.length;
      let uploadedFileCount = 0;

      if (totalFilesToUpload > 0) {
        setUploadingPhotos(true);
        setPhotoUploadStage('compressing');
        setPhotoUploadProgress(10);
        haptic.medium();
      }


      if (photoFiles.length > 0) {
        console.log('📸 Uploading', photoFiles.length, 'new photos...');
        setPhotoUploadStage('uploading_photos');
        const uploadPromises = photoFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );
        newUploadUrls = await Promise.all(uploadPromises).then(results => results.map(result => result.file_url));
        uploadedFileCount += photoFiles.length;
        setPhotoUploadProgress((uploadedFileCount / totalFilesToUpload) * 100);
      }

      if (voiceFiles.length > 0) {
        console.log('🎤 Uploading', voiceFiles.length, 'new voice notes...');
        setPhotoUploadStage('uploading_voice');
        const voicePromises = voiceFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );
        newVoiceUrls = await Promise.all(voicePromises).then(results => results.map(result => result.file_url));
        uploadedFileCount += voiceFiles.length;
        setPhotoUploadProgress((uploadedFileCount / totalFilesToUpload) * 100);
      }

      if (videoFiles.length > 0) {
        console.log('🎥 Uploading', videoFiles.length, 'new videos...');
        setPhotoUploadStage('uploading_video');
        const videoPromises = videoFiles.map(file =>
          base44.integrations.Core.UploadFile({ file })
        );
        newVideoUrls = await Promise.all(videoPromises).then(results => results.map(result => result.file_url));
        uploadedFileCount += videoFiles.length;
        setPhotoUploadProgress((uploadedFileCount / totalFilesToUpload) * 100);
      }
      
      if (totalFilesToUpload > 0) {
        setPhotoUploadStage('finalizing');
        setPhotoUploadProgress(100);
      }


      const remainingOriginalPhotoUrls = photoPreviews.filter(p => !p.startsWith('data:image') && !p.startsWith('blob:'));
      const finalPhotoUrls = [...remainingOriginalPhotoUrls, ...newUploadUrls];
      const finalVoiceUrls = [...(editingMaintenance.voice_notes || []), ...newVoiceUrls];
      const finalVideoUrls = [...(editingMaintenance.videos || []), ...newVideoUrls];

      const updateLogEntry = {
        timestamp: new Date().toISOString(),
        message: `${language === 'th' ? 'คำขอซ่อมถูกอัปเดตโดย' : 'Maintenance request updated by'} ${user?.full_name || user?.email}`,
        sender: 'tenant',
        sender_name: user?.full_name || user?.email,
        sender_email: user?.email,
        action_type: 'updated',
        metadata: {
          issue_title: maintenanceForm.issue_title,
          category: maintenanceForm.category,
          priority: maintenanceForm.priority
        }
      };
      const updatedCommunicationLog = [...(editingMaintenance.communication_log || []), updateLogEntry];

      const updatedData = {
        ...maintenanceForm,
        photo_urls: finalPhotoUrls,
        voice_notes: finalVoiceUrls,
        videos: finalVideoUrls,
        communication_log: updatedCommunicationLog,
        created_by: user.email
      };

      await updateMaintenanceMutation.mutateAsync({
        id: editingMaintenance.id,
        data: updatedData
      });

      setUploadingPhotos(false);
      setPhotoUploadStage('');
      setPhotoUploadProgress(0);

    } catch (error) {
      console.error('❌ Failed to update maintenance request:', error);
      setUploadingPhotos(false);
      setPhotoUploadStage('');
      setPhotoUploadProgress(0);
      setCompressionStats(null);
      toast.error(strings.processingError);
    }
  };

  const handleCloseMaintenance = async (request) => {
    if (!confirm(strings.confirmClose)) return;

    try {
      const closeLogEntry = {
        timestamp: new Date().toISOString(),
        message: `${language === 'th' ? 'คำขอถูกปิดโดย' : 'Request closed by'} ${user?.full_name || user?.email}`,
        sender: 'tenant',
        sender_name: user?.full_name || user?.email,
        sender_email: user?.email,
        action_type: 'closed',
        metadata: {
          status: 'completed'
        }
      };
      const updatedCommunicationLog = [...(request.communication_log || []), closeLogEntry];

      await updateMaintenanceMutation.mutateAsync({
        id: request.id,
        data: {
          status: 'completed',
          resolved_date: new Date().toISOString().split('T')[0],
          communication_log: updatedCommunicationLog
        }
      });
    } catch (error) {
      console.error('❌ Failed to close maintenance request:', error);
      toast.error(strings.processingError);
    }
  };

  const handleDeleteMaintenance = (request) => {
    setDeletingMaintenance(request);
  };

  const confirmDeleteMaintenance = async () => {
    if (!deletingMaintenance) return;

    try {
      await deleteMaintenanceMutation.mutateAsync(deletingMaintenance.id);
      setDeletingMaintenance(null);
    } catch (error) {
      console.error('❌ Failed to delete maintenance request:', error);
      toast.error(strings.processingError);
      setDeletingMaintenance(null);
    }
  };

  const handleSwipeDelete = (request) => {
    handleDeleteMaintenance(request);
  };

  const handleSwipeComplete = (request) => {
    handleCloseMaintenance(request);
  };

  const deposit = deposits[0];
  const now = new Date();
  const daysRemaining = deposit?.expected_return_date
    ? differenceInDays(new Date(deposit.expected_return_date), now)
    : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isUrgent = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;

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

  const baseCtaStyle = {
    backgroundColor: CTA_COLOR,
    color: "#FFFFFF",
    borderRadius: "9999px",
    border: "none",
    padding: "10px 16px",
    fontWeight: 600,
    fontSize: "0.875rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    boxShadow: "0 10px 18px rgba(12,59,46,0.35)",
    transition: "transform 0.12s ease, box-shadow 0.12s ease, opacity 0.15s ease",
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} colors={colors}>
      <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto">

          <PageHeader
            title={strings.title}
            subtitle={strings.subtitle}
            icon={Wrench}
            iconColor={maintenanceTheme.accent}
            showBack={true}
            backLabel={strings.back}
            colors={colors}
            backTo={createPageUrl("Dashboard")}
          />

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:justify-end mb-6">
            <button
              type="button"
              onClick={() => {
                haptic.medium();
                setEditingDeposit(true);
                setExpandedSections(prev => ({ ...prev, deposit: true }));
              }}
              style={{ ...baseCtaStyle, width: '100%' }}
              className="md:w-auto"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 14px 24px rgba(12,59,46,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 10px 18px rgba(12,59,46,0.35)";
              }}
            >
              <Wallet className="w-4 h-4" />
              {strings.uploadDepositTracker}
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.medium();
                setEditingRent(true);
                setExpandedSections(prev => ({ ...prev, rent: true }));
                setTimeout(() => {
                  document.getElementById('rent-schedule-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
              style={{ ...baseCtaStyle, width: '100%' }}
              className="md:w-auto"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 14px 24px rgba(12,59,46,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 10px 18px rgba(12,59,46,0.35)";
              }}
            >
              <Calendar className="w-4 h-4" />
              {strings.uploadRentSchedule}
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.medium();
                setShowAddMaintenance(true);
                setEditingMaintenance(null);
                setCompressionStats(null);
                setMaintenanceForm({
                  issue_title: '',
                  description: '',
                  category: 'other',
                  priority: 'medium',
                  property_address: '',
                  reported_date: new Date().toISOString().split('T')[0]
                });
                setPhotoFiles([]);
                setPhotoPreviews([]);
                setVoiceFiles([]);
                setVideoFiles([]);
                setExpandedSections(prev => ({ ...prev, maintenance: true }));
              }}
              style={{ ...baseCtaStyle, width: '100%' }}
              className="md:w-auto"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 14px 24px rgba(12,59,46,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 10px 18px rgba(12,59,46,0.35)";
              }}
            >
              <Wrench className="w-4 h-4" />
              {strings.newMaintenanceRequest}
            </button>
          </div>

          <Card ref={depositRef} className="mb-8 border-none shadow-xl overflow-hidden" style={{ backgroundColor: colors.cardBg, borderLeft: `6px solid ${colors.depositAccent}` }}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection('deposit')}
              style={{
                background: isDarkMode
                  ? `linear-gradient(to right, ${colors.cardBg}, #3A3420)`
                  : `linear-gradient(to right, ${colors.cardBg}, #FEF3C7)`,
                borderBottom: expandedSections.deposit ? `1px solid ${colors.borderColor}` : 'none'
              }}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: colors.depositAccent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{strings.depositSection}</div>
                    {deposit && deposit.deposit_amount > 0 && (
                      <div className="text-sm font-normal flex items-center gap-2 mt-1">
                        <Badge className={isOverdue ? 'bg-red-100 text-red-800' : isUrgent ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}>
                          {isOverdue
                            ? `${Math.abs(daysRemaining)} ${strings.daysRemaining} ${strings.overdue}`
                            : daysRemaining !== null
                              ? `${daysRemaining} ${strings.daysRemaining}`
                              : 'Active'
                          }
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {deposit && deposit.deposit_amount > 0 && !editingDeposit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic.light();
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
                  <div className="rounded-xl border border-dashed p-4 sm:p-5" style={{ borderColor: colors.borderColor, backgroundColor: colors.fieldBg }}>
                    <h3 className="font-semibold text-sm sm:text-base mb-1" style={{ color: colors.textPrimary }}>No properties added yet</h3>
                    <p className="text-xs sm:text-sm mb-3" style={{ color: colors.textSecondary }}>
                      Add your first property to start tracking deposits, rent schedules and maintenance in one place.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          haptic.light();
                          setEditingDeposit(true);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm"
                        style={{ backgroundColor: "#0C3B2E", color: "#FFFFFF" }}
                      >
                        Add property
                      </button>
                      {isFreeTier && (
                        <button
                          type="button"
                          onClick={() => {
                            haptic.light();
                            navigate(createPageUrl("Account") + '#plans');
                          }}
                          className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border"
                          style={{ borderColor: "#0C3B2E", color: "#0C3B2E", backgroundColor: colors.cardBg }}
                        >
                          Upgrade for advanced tracking
                        </button>
                      )}
                    </div>
                  </div>
                ) : editingDeposit ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <MobileFormInput
                        label={strings.depositAmount}
                        type="number"
                        value={depositForm.deposit_amount}
                        onChange={(e) => setDepositForm({ ...depositForm, deposit_amount: e.target.value })}
                        icon={DollarSign}
                        colors={colors}
                        inputMode="decimal"
                        required
                      />
                      <MobileFormInput
                        label={strings.propertyAddress}
                        value={depositForm.property_address}
                        onChange={(e) => setDepositForm({ ...depositForm, property_address: e.target.value })}
                        icon={Home}
                        colors={colors}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <MobileFormInput
                        label={strings.paidDate}
                        type="date"
                        value={depositForm.deposit_paid_date}
                        onChange={(e) => setDepositForm({ ...depositForm, deposit_paid_date: e.target.value })}
                        icon={Calendar}
                        colors={colors}
                        required
                      />
                      <MobileFormInput
                        label={strings.expectedReturn}
                        type="date"
                        value={depositForm.expected_return_date}
                        onChange={(e) => setDepositForm({ ...depositForm, expected_return_date: e.target.value })}
                        icon={Calendar}
                        colors={colors}
                        required
                      />
                    </div>
                    <MobileFormInput
                      label={strings.notes}
                      value={depositForm.notes}
                      onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })}
                      multiline
                      rows={2}
                      colors={colors}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          haptic.light();
                          setEditingDeposit(false);
                        }}
                        style={{ minHeight: '44px' }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        {strings.cancel}
                      </Button>
                      <Button
                        onClick={handleDepositSubmit}
                        className="bg-ls-forest hover:bg-ls-forest/90"
                        style={{ minHeight: '44px' }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {strings.save}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-ls-gold" />
                        <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.depositAmount}</p>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                        ฿{deposit.deposit_amount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
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

          <Card id="rent-schedule-section" ref={rentRef} className="mb-8 border-none shadow-xl overflow-hidden" style={{ backgroundColor: colors.cardBg, borderLeft: `6px solid ${colors.rentAccent}` }}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection('rent')}
              style={{
                background: isDarkMode
                  ? `linear-gradient(to right, ${colors.cardBg}, rgba(245,158,11,0.15))`
                  : `linear-gradient(to right, ${colors.cardBg}, #FFF3E0)`,
                borderBottom: expandedSections.rent ? `1px solid ${colors.borderColor}` : 'none'
              }}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: colors.rentAccent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{strings.rentSection}</div>
                    {deposit?.rent_amount && deposit?.rent_due_day && (
                      <div className="text-sm font-normal mt-1">
                        <Badge style={{ backgroundColor: `${colors.rentAccent}20`, color: colors.rentAccent, border: `1px solid ${colors.rentAccent}` }}>
                          Day {deposit.rent_due_day} - ฿{deposit.rent_amount.toLocaleString()}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {deposit?.rent_amount && deposit?.rent_due_day && !editingRent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic.light();
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
                    <Button
                      onClick={() => {
                        haptic.light();
                        setEditingRent(true);
                      }}
                      className="text-white"
                      style={{ minHeight: '44px', backgroundColor: colors.rentAccent }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {strings.addRent}
                    </Button>
                  </div>
                ) : editingRent ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <MobileFormInput
                        label={strings.rentAmount}
                        type="number"
                        value={rentForm.rent_amount}
                        onChange={(e) => setRentForm({ ...rentForm, rent_amount: e.target.value })}
                        icon={DollarSign}
                        colors={colors}
                        inputMode="decimal"
                        required
                      />
                      <MobileFormInput
                        label={strings.rentDueDay}
                        type="number"
                        value={rentForm.rent_due_day}
                        onChange={(e) => setRentForm({ ...rentForm, rent_due_day: e.target.value })}
                        placeholder="e.g., 5"
                        icon={Calendar}
                        colors={colors}
                        inputMode="numeric"
                        min={1}
                        max={31}
                        required
                      />
                      <MobileFormInput
                        label={strings.alertDaysBefore}
                        type="number"
                        value={rentForm.rent_alert_days_before}
                        onChange={(e) => setRentForm({ ...rentForm, rent_alert_days_before: e.target.value })}
                        icon={Bell}
                        colors={colors}
                        inputMode="numeric"
                        min={1}
                        max={14}
                      />
                    </div>
                    <div className="flex items-center gap-2" style={{ minHeight: '44px' }}>
                      <Checkbox
                        checked={rentForm.rent_alerts_enabled}
                        onCheckedChange={(checked) => {
                          haptic.light();
                          setRentForm({ ...rentForm, rent_alerts_enabled: checked });
                        }}
                      />
                      <Label style={{ color: colors.textPrimary }}>{strings.rentAlertsEnabled}</Label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          haptic.light();
                          setEditingRent(false);
                        }}
                        style={{ minHeight: '44px' }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        {strings.cancel}
                      </Button>
                      <Button
                        onClick={handleRentSubmit}
                        className="text-white"
                        style={{ minHeight: '44px', backgroundColor: colors.rentAccent }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {strings.save}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4" style={{ color: colors.rentAccent }} />
                        <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.rentAmount}</p>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                        ฿{deposit.rent_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" style={{ color: colors.rentAccent }} />
                        <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{strings.rentDueDay}</p>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                        Day {deposit.rent_due_day}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.fieldBg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4" style={{ color: colors.rentAccent }} />
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

          <Card ref={maintenanceRef} className="mb-8 border-none shadow-xl overflow-hidden" style={{ backgroundColor: colors.cardBg, borderLeft: `6px solid ${colors.maintenanceAccent}` }}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection('maintenance')}
              style={{
                background: isDarkMode
                  ? `linear-gradient(to right, ${colors.cardBg}, rgba(249,168,37,0.15))`
                  : `linear-gradient(to right, ${colors.cardBg}, #FFF8E1)`,
                borderBottom: expandedSections.maintenance ? `1px solid ${colors.borderColor}` : 'none'
              }}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3" style={{ color: colors.textPrimary }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: colors.maintenanceAccent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{strings.maintenanceSection}</div>
                    {activeRequests.length > 0 && (
                      <div className="text-sm font-normal mt-1">
                        <Badge style={{ backgroundColor: `${colors.maintenanceAccent}20`, color: colors.maintenanceAccent, border: `1px solid ${colors.maintenanceAccent}` }}>
                          {activeRequests.length} {strings.active}
                        </Badge>
                        {completedRequests.length > 0 && (
                          <Badge className="bg-gray-100 text-gray-800 ml-2">
                            {completedRequests.length} {strings.archived}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.light();
                      setShowAddMaintenance(true);
                      setEditingMaintenance(null);
                      setCompressionStats(null);
                      setMaintenanceForm({
                        issue_title: '', description: '', category: 'other', priority: 'medium', property_address: '', reported_date: new Date().toISOString().split('T')[0]
                      });
                      setPhotoFiles([]);
                      setPhotoPreviews([]);
                      setVoiceFiles([]);
                      setVideoFiles([]);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {expandedSections.maintenance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </CardHeader>

            {expandedSections.maintenance && (
              <CardContent className="p-6">
                {maintenanceRequests.length > 0 && !showAddMaintenance && !editingMaintenance && (
                  <div className="mb-4 space-y-3">
                    <DebouncedSearch
                      onSearch={setMaintenanceSearchQuery}
                      placeholder={strings.searchMaintenance}
                      colors={colors}
                      language={language}
                    />

                    <div>
                      <Label className="text-xs font-semibold mb-2 block" style={{ color: colors.textSecondary }}>
                        {strings.filterByStatus}
                      </Label>
                      <Select
                        value={maintenanceStatusFilter}
                        onValueChange={(value) => {
                          haptic.light();
                          setMaintenanceStatusFilter(value);
                        }}
                      >
                        <SelectTrigger style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.cardBg }}>
                          <SelectItem value="all">{strings.allStatuses}</SelectItem>
                          <SelectItem value="reported">Reported</SelectItem>
                          <SelectItem value="acknowledged">Acknowledged</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {(showAddMaintenance || editingMaintenance) && (
                  <div className="mb-4 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: colors.borderColor, backgroundColor: colors.fieldBg }}>
                    <h3 className="font-bold mb-3" style={{ color: colors.textPrimary }}>
                      {editingMaintenance ? strings.edit : strings.addMaintenance}
                    </h3>

                    {uploadingPhotos && (
                      <div className="mb-4">
                        <UploadProgress
                          currentStage={photoUploadStage}
                          progress={photoUploadProgress}
                          fileCount={photoFiles.length + voiceFiles.length + videoFiles.length}
                          primaryColor={colors.textPrimary}
                          secondaryColor={colors.textSecondary}
                          language={language}
                        />
                      </div>
                    )}

                    {!uploadingPhotos && compressionStats && compressionStats.compressedCount > 0 && (
                      <div className="mb-4 p-3 rounded-lg border-2" style={{
                        backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF',
                        borderColor: '#3B82F6'
                      }}>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold mb-1" style={{ color: isDarkMode ? '#93C5FD' : '#1D4ED8' }}>
                              {strings.imagesOptimized}
                            </p>
                            <p className="text-xs" style={{ color: isDarkMode ? '#BFDBFE' : '#2563EB' }}>
                              {strings.imagesOptimizedDesc.split('•')[0].trim()} {compressionStats.compressedCount} {strings.imagesOptimizedDesc.split('•')[1].trim()} {compressionStats.savedMB} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <MobileFormInput
                        label={strings.issueTitle}
                        value={maintenanceForm.issue_title}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issue_title: e.target.value })}
                        icon={Wrench}
                        colors={colors}
                        required
                        autoFocus
                      />

                      <MobileFormInput
                        label={strings.description}
                        value={maintenanceForm.description}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                        multiline
                        rows={3}
                        colors={colors}
                      />

                      {/* NEW: Voice Note and Video Upload Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <input
                          id="voice-input"
                          type="file"
                          accept="audio/*"
                          multiple
                          onChange={handleVoiceSelection}
                          className="hidden"
                        />
                        <input
                          id="video-input"
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={handleVideoSelection}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={handleVoiceNoteClick}
                          disabled={isFreeTier}
                          className="btn-interaction"
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: `2px solid ${isFreeTier ? colors.borderColor : '#8B5CF6'}`,
                            backgroundColor: isFreeTier ? colors.fieldBg : (isDarkMode ? '#4C1D95' : '#F3E8FF'),
                            color: isFreeTier ? colors.textSecondary : '#8B5CF6',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: isFreeTier ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: isFreeTier ? 0.6 : 1,
                            transition: 'all 0.2s',
                            minHeight: '40px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isFreeTier) {
                              e.currentTarget.style.backgroundColor = '#8B5CF6';
                              e.currentTarget.style.color = '#FFFFFF';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isFreeTier) {
                              e.currentTarget.style.backgroundColor = isDarkMode ? '#4C1D95' : '#F3E8FF';
                              e.currentTarget.style.color = '#8B5CF6';
                            }
                          }}
                        >
                          <Mic className="w-4 h-4" />
                          {strings.addVoiceNote}
                          {isFreeTier && (
                            <span className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                              ({strings.protectRequired})
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleVideoClick}
                          disabled={isFreeTier || isProtectOrLite}
                          className="btn-interaction"
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: `2px solid ${(isFreeTier || isProtectOrLite) ? colors.borderColor : '#EF4444'}`,
                            backgroundColor: (isFreeTier || isProtectOrLite) ? colors.fieldBg : (isDarkMode ? '#7F1D1D' : '#FEE2E2'),
                            color: (isFreeTier || isProtectOrLite) ? colors.textSecondary : '#EF4444',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: (isFreeTier || isProtectOrLite) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: (isFreeTier || isProtectOrLite) ? 0.6 : 1,
                            transition: 'all 0.2s',
                            minHeight: '40px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isFreeTier && !isProtectOrLite) {
                              e.currentTarget.style.backgroundColor = '#EF4444';
                              e.currentTarget.style.color = '#FFFFFF';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isFreeTier && !isProtectOrLite) {
                              e.currentTarget.style.backgroundColor = isDarkMode ? '#7F1D1D' : '#FEE2E2';
                              e.currentTarget.style.color = '#EF4444';
                            }
                          }}
                        >
                          <Video className="w-4 h-4" />
                          {strings.addVideo}
                          {(isFreeTier || isProtectOrLite) && (
                            <span className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                              ({strings.secureRequired})
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Voice Notes Preview */}
                      {voiceFiles.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                            {voiceFiles.length} {strings.voiceNotesAdded}
                          </p>
                          <div className="space-y-2">
                            {voiceFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colors.inputBg, border: `1px solid ${colors.borderColor}` }}>
                                <Mic className="w-4 h-4 text-purple-600" />
                                <span className="text-xs flex-1" style={{ color: colors.textPrimary }}>{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVoice(index)}
                                  className="text-red-600"
                                  style={{ minWidth: '24px', minHeight: '24px' }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Videos Preview */}
                      {videoFiles.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                            {videoFiles.length} {strings.videosAdded}
                          </p>
                          <div className="space-y-2">
                            {videoFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colors.inputBg, border: `1px solid ${colors.borderColor}` }}>
                                <Video className="w-4 h-4 text-red-600" />
                                <span className="text-xs flex-1" style={{ color: colors.textPrimary }}>{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVideo(index)}
                                  className="text-red-600"
                                  style={{ minWidth: '24px', minHeight: '24px' }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
                              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all active:scale-95"
                                style={{
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.borderColor,
                                  color: colors.textPrimary,
                                  minHeight: '44px'
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
                              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all active:scale-95"
                                style={{
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.borderColor,
                                  color: colors.textPrimary,
                                  minHeight: '44px'
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
                                    <LazyImage
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg border-2"
                                      style={{ borderColor: colors.borderColor }}
                                      loadingColor="#F59E0B"
                                      onClick={() => { haptic.light(); window.open(preview, '_blank') }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePhoto(index)}
                                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                                      style={{ minWidth: '28px', minHeight: '28px' }}
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
                          <Select
                            value={maintenanceForm.category}
                            onValueChange={(value) => {
                              haptic.light();
                              setMaintenanceForm({ ...maintenanceForm, category: value });
                            }}
                          >
                            <SelectTrigger className="mt-2" style={{
                              backgroundColor: colors.inputBg,
                              borderColor: colors.borderColor,
                              minHeight: '44px',
                              fontSize: '16px'
                            }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent style={{ backgroundColor: colors.cardBg }}>
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
                          <Select
                            value={maintenanceForm.priority}
                            onValueChange={(value) => {
                              haptic.light();
                              setMaintenanceForm({ ...maintenanceForm, priority: value });
                            }}
                          >
                            <SelectTrigger className="mt-2" style={{
                              backgroundColor: colors.inputBg,
                              borderColor: colors.borderColor,
                              minHeight: '44px',
                              fontSize: '16px'
                            }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent style={{ backgroundColor: colors.cardBg }}>
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
                            haptic.light();
                            setShowAddMaintenance(false);
                            setEditingMaintenance(null);
                            setPhotoFiles([]);
                            setPhotoPreviews([]);
                            setVoiceFiles([]);
                            setVideoFiles([]);
                            setCompressionStats(null);
                            setMaintenanceForm({
                              issue_title: '', description: '', category: 'other', priority: 'medium', property_address: '', reported_date: new Date().toISOString().split('T')[0]
                            });
                          }}
                          disabled={uploadingPhotos}
                          style={{ minHeight: '44px' }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          {strings.cancel}
                        </Button>
                        <Button
                          onClick={editingMaintenance ? handleUpdateMaintenance : handleMaintenanceSubmit}
                          className="text-white"
                          disabled={uploadingPhotos}
                          style={{ minHeight: '44px', backgroundColor: colors.maintenanceAccent }}
                          onMouseEnter={(e) => !uploadingPhotos && (e.currentTarget.style.opacity = '0.9')}
                          onMouseLeave={(e) => !uploadingPhotos && (e.currentTarget.style.opacity = '1')}
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

                {maintenanceRequests.length === 0 && !showAddMaintenance && (
                  <div className="rounded-xl border border-dashed p-4 sm:p-5" style={{ borderColor: colors.borderColor, backgroundColor: colors.fieldBg }}>
                    <h3 className="font-semibold text-sm sm:text-base mb-1" style={{ color: colors.textPrimary }}>No maintenance requests yet</h3>
                    <p className="text-xs sm:text-sm mb-3" style={{ color: colors.textSecondary }}>
                      Log your first maintenance issue so you have a clear record with timestamps, photos and notifications.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          haptic.light();
                          setShowAddMaintenance(true);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm"
                        style={{ backgroundColor: "#0C3B2E", color: "#FFFFFF" }}
                      >
                        New maintenance request
                      </button>
                      {isFreeTier && (
                        <button
                          type="button"
                          onClick={() => {
                            haptic.light();
                            navigate(createPageUrl("Account") + '#plans');
                          }}
                          className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border"
                          style={{ borderColor: "#0C3B2E", color: "#0C3B2E", backgroundColor: colors.cardBg }}
                        >
                          Upgrade for full maintenance history
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {maintenanceRequests.length > 0 && filteredMaintenanceRequests.length === 0 && !showAddMaintenance && (
                  <div className="text-center py-8">
                    <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary, opacity: 0.3 }} />
                    <p className="font-semibold mb-2" style={{ color: colors.textPrimary }}>{strings.noResultsFound}</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.tryDifferentSearch}</p>
                  </div>
                )}

                {(activeRequests.length > 0 || completedRequests.length > 0) && (
                  <div className="space-y-4">
                    {activeRequests.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
                          <span className="mr-2 inline-block">🛠️</span> {strings.active} ({activeRequests.length})
                        </h4>
                        <div className="space-y-3">
                          {activeRequests.map((request) => (
                            <MaintenanceRequestCard
                              key={request.id}
                              request={request}
                              colors={colors}
                              isDarkMode={isDarkMode}
                              strings={strings}
                              language={language}
                              getStatusColor={getStatusColor}
                              handleSwipeDelete={handleSwipeDelete}
                              handleSwipeComplete={handleSwipeComplete}
                              handleEditMaintenance={handleEditMaintenance}
                              handleCloseMaintenance={handleCloseMaintenance}
                              handleDeleteMaintenance={handleDeleteMaintenance}
                              expanded={expandedMaintenanceId === request.id}
                              onToggle={() => setExpandedMaintenanceId(expandedMaintenanceId === request.id ? null : request.id)}
                            />
                          ))}

                        </div>
                      </div>
                    )}

                    {completedRequests.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: colors.textSecondary }}>
                          <Archive className="w-5 h-5" />
                          {strings.archived} ({completedRequests.length})
                        </h4>
                        <div className="space-y-2">
                          {completedRequests.map((request) => (
                            <SwipeToDelete
                              key={request.id}
                              onDelete={() => handleDeleteMaintenance(request)}
                              deleteLabel={strings.delete}
                              colors={colors}
                            >
                              <div className="p-3 rounded-lg border opacity-60" style={{ borderColor: colors.borderColor, backgroundColor: colors.fieldBg }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {request.request_number && (
                                        <Badge
                                          className="font-mono text-xs"
                                          style={{
                                            backgroundColor: isDarkMode ? colors.inputBg : '#F3F4F6',
                                            color: colors.textSecondary,
                                            border: `1px solid ${colors.borderColor}`
                                          }}
                                        >
                                          {request.request_number}
                                        </Badge>
                                      )}
                                      <Badge className={getStatusColor(request.status)} style={{ fontSize: '10px' }}>
                                        {request.status}
                                      </Badge>
                                    </div>
                                    <h4 className="font-semibold text-sm" style={{ color: colors.textPrimary }}>{request.issue_title}</h4>
                                    <div className="flex items-center gap-3 text-xs mt-1" style={{ color: colors.textSecondary }}>
                                      <span>📅 {format(new Date(request.reported_date), 'MMM d, yyyy')}</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMaintenance(request);
                                    }}
                                    className="text-red-600"
                                    style={{ minHeight: '36px' }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </SwipeToDelete>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Delete Maintenance Confirmation Dialog */}
          <Dialog open={!!deletingMaintenance} onOpenChange={() => setDeletingMaintenance(null)}>
            <DialogContent
              className="modal-enter"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.borderColor,
                maxWidth: '420px',
                width: '95vw'
              }}
            >
              <DialogHeader>
                <DialogTitle style={{ color: colors.textPrimary }}>
                  {language === 'th' ? 'ลบคำขอซ่อมบำรุง?' : language === 'zh' ? '删除维护请求？' : language === 'ja' ? 'メンテナンスリクエストを削除？' : language === 'ko' ? '유지보수 요청 삭제?' : 'Delete maintenance request?'}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                  {language === 'th' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบคำขอซ่อมบำรุงนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้' : language === 'zh' ? '您确定要删除此维护请求吗？此操作无法撤消。' : language === 'ja' ? 'このメンテナンスリクエストを削除してもよろしいですか？この操作は元に戻せません。' : language === 'ko' ? '이 유지보수 요청을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.' : "Are you sure you want to delete this maintenance request? This action can't be undone."}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      haptic.light();
                      setDeletingMaintenance(null);
                    }}
                    className="flex-1"
                    style={{ minHeight: '44px' }}
                  >
                    {strings.cancel}
                  </Button>
                  <Button
                    onClick={() => {
                      haptic.heavy();
                      confirmDeleteMaintenance();
                    }}
                    disabled={deleteMaintenanceMutation.isPending}
                    className="flex-1"
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      minHeight: '44px'
                    }}
                  >
                    {deleteMaintenanceMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'th' ? 'กำลังลบ...' : language === 'zh' ? '删除中...' : language === 'ja' ? '削除中...' : language === 'ko' ? '삭제 중...' : 'Deleting...'}
                      </>
                    ) : (
                      strings.delete
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Upgrade Modal */}
          <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
            <DialogContent
              className="modal-enter"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.borderColor,
                maxWidth: '500px',
                width: '95vw'
              }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-lg" style={{ color: colors.textPrimary }}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: upgradeModalType === 'voice' ? '#8B5CF6' : '#EF4444'
                    }}
                  >
                    {upgradeModalType === 'voice' ? (
                      <Mic className="w-6 h-6 text-white" />
                    ) : (
                      <Video className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    {upgradeModalType === 'voice' ? strings.upgradeToProtectVoice : strings.upgradeToSecureVideo}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                  {upgradeModalType === 'voice' ? strings.upgradeToProtectVoiceDesc : strings.upgradeToSecureVideoDesc}
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1"
                  >
                    {strings.cancel}
                  </Button>
                  <Link
                    to={createPageUrl("Account") + '?showPlans=true'}
                    className="flex-1"
                  >
                    <Button
                      onClick={() => haptic.medium()}
                      className="w-full"
                      style={{
                        backgroundColor: upgradeModalType === 'voice' ? '#8B5CF6' : '#0C3B2E',
                        color: '#FFFFFF'
                      }}
                    >
                      {upgradeModalType === 'voice' ? strings.upgradeToProtect : strings.upgradeToSecure}
                    </Button>
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PullToRefresh>
  );
}

export default function PropertyTracker() {
  return (
    <ToastProvider>
      <PropertyTrackerContent />
    </ToastProvider>
  );
}