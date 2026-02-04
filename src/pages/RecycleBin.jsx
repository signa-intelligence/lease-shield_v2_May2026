import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, AlertTriangle, Database, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { haptic } from "../components/shared/HapticFeedback";
import { format } from "date-fns";
import AuthGuard from "../components/shared/AuthGuard";
import SkeletonLoader from "../components/shared/SkeletonLoader";
import EmptyState from "../components/shared/EmptyState";
import PageHeader from "../components/shared/PageHeader";

function RecycleBinContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: deletedItems = [], isLoading } = useQuery({
    queryKey: ['recycleBin', user?.email],
    queryFn: () => base44.entities.RecycleBin.filter({ user_email: user?.email }, '-deleted_date'),
    enabled: !!user,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = {
    bg: isDarkMode ? '#111827' : '#F3F6F5',
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#F9FAFB' : '#0F172A',
    textSecondary: isDarkMode ? '#D1D5DB' : '#475569',
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)',
    fieldBg: isDarkMode ? '#374151' : '#F8FAFC'
  };

  const t = {
    en: {
      title: "Recycle Bin",
      subtitle: "Deleted items can be restored or permanently removed",
      backToSettings: "Back to Settings",
      storageUsage: "Storage Usage",
      deletedItems: "Deleted Items",
      noItems: "No deleted items",
      noItemsDesc: "Items you delete will appear here and can be restored for a limited time",
      cases: "Cases",
      maintenance: "Maintenance Requests",
      evidence: "Evidence & Documents",
      leases: "Leases",
      deposits: "Deposits",
      deletedOn: "Deleted",
      restore: "Restore",
      deletePermanently: "Delete Permanently",
      confirmTitle: "Delete Permanently?",
      confirmMessage: "This cannot be undone and the data will be erased completely.",
      cancel: "Cancel",
      confirmBtn: "Delete Forever",
      restoreSuccess: "Item restored successfully",
      deleteSuccess: "Item permanently deleted",
      error: "Operation failed",
      storageNote: "Storage management features coming soon",
      selectMode: "Select",
      doneSelecting: "Done",
      deleteSelected: "Delete Selected",
      selectAll: "Select All",
      deselectAll: "Deselect All",
      bulkDeleteConfirmTitle: "Permanently delete selected items?",
      bulkDeleteConfirmMessage: "These {count} items will be permanently erased and cannot be undone.",
      confirmBulkDelete: "Delete {count} Items Forever",
      itemsDeleted: "{count} items permanently deleted",
      restoreSelected: "Restore Selected",
      itemsRestored: "{count} items restored successfully"
    },
    th: {
      title: "ถังขยะ",
      subtitle: "รายการที่ลบสามารถกู้คืนหรือลบถาวร",
      backToSettings: "กลับไปที่การตั้งค่า",
      storageUsage: "การใช้พื้นที่",
      deletedItems: "รายการที่ลบ",
      noItems: "ไม่มีรายการที่ลบ",
      noItemsDesc: "รายการที่คุณลบจะปรากฏที่นี่และสามารถกู้คืนได้ในระยะเวลาจำกัด",
      cases: "คดี",
      maintenance: "คำขอซ่อมบำรุง",
      evidence: "หลักฐานและเอกสาร",
      leases: "สัญญาเช่า",
      deposits: "เงินมัดจำ",
      deletedOn: "ลบเมื่อ",
      restore: "กู้คืน",
      deletePermanently: "ลบถาวร",
      confirmTitle: "ลบถาวรหรือไม่?",
      confirmMessage: "การดำเนินการนี้ไม่สามารถยกเลิกได้ และข้อมูลจะถูกลบอย่างสมบูรณ์",
      cancel: "ยกเลิก",
      confirmBtn: "ลบตลอดไป",
      restoreSuccess: "กู้คืนรายการสำเร็จ",
      deleteSuccess: "ลบรายการถาวรสำเร็จ",
      error: "การดำเนินการล้มเหลว",
      storageNote: "คุณสมบัติการจัดการพื้นที่เร็วๆ นี้",
      selectMode: "เลือก",
      doneSelecting: "เสร็จสิ้น",
      deleteSelected: "ลบที่เลือก",
      selectAll: "เลือกทั้งหมด",
      deselectAll: "ยกเลิกการเลือกทั้งหมด",
      bulkDeleteConfirmTitle: "ลบรายการที่เลือกถาวรหรือไม่?",
      bulkDeleteConfirmMessage: "รายการ {count} รายการนี้จะถูกลบอย่างถาวรและไม่สามารถยกเลิกได้",
      confirmBulkDelete: "ลบ {count} รายการตลอดไป",
      itemsDeleted: "ลบ {count} รายการถาวรแล้ว",
      restoreSelected: "กู้คืนที่เลือก",
      itemsRestored: "กู้คืน {count} รายการสำเร็จ"
    }
  };

  const strings = t[language] || t.en;

  const restoreMutation = useMutation({
    mutationFn: async (item) => {
      // Restore original record
      const entityMap = {
        case: 'Case',
        maintenance: 'MaintenanceRequest',
        evidence: 'Document',
        lease: 'Lease',
        deposit: 'DepositTracker'
      };
      
      const entityName = entityMap[item.item_type];
      
      // For lease: update status back to active
      if (item.item_type === 'lease') {
        await base44.entities[entityName].update(item.original_id, {
          status: 'active',
          archived_at: null,
          archived_by: null
        });
      } else if (item.item_type === 'deposit' || item.item_type === 'maintenance') {
        // For deposit/maintenance: clear is_archived flag
        await base44.entities[entityName].update(item.original_id, {
          is_archived: false,
          archived_at: null
        });
      } else {
        // For case/evidence: use is_deleted flag
        await base44.entities[entityName].update(item.original_id, {
          is_deleted: false,
          deleted_at: null
        });
      }
      
      // Remove from recycle bin
      await base44.entities.RecycleBin.delete(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycleBin'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      toast.success(strings.restoreSuccess);
      haptic.success();
    },
    onError: () => {
      toast.error(strings.error);
      haptic.error();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (item) => {
      // Delete from original entity permanently
      const entityMap = {
        case: 'Case',
        maintenance: 'MaintenanceRequest',
        evidence: 'Document',
        lease: 'Lease',
        deposit: 'DepositTracker'
      };
      
      const entityName = entityMap[item.item_type];
      await base44.entities[entityName].delete(item.original_id);
      
      // Remove from recycle bin
      await base44.entities.RecycleBin.delete(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycleBin'] });
      toast.success(strings.deleteSuccess);
      haptic.medium();
      setConfirmDelete(null);
    },
    onError: () => {
      toast.error(strings.error);
      haptic.error();
      setConfirmDelete(null);
    }
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (items) => {
      const entityMap = {
        case: 'Case',
        maintenance: 'MaintenanceRequest',
        evidence: 'Document',
        lease: 'Lease',
        deposit: 'DepositTracker'
      };

      for (const item of items) {
        const entityName = entityMap[item.item_type];
        
        // Handle different entity types
        if (item.item_type === 'lease') {
          await base44.entities[entityName].update(item.original_id, {
            status: 'active',
            archived_at: null,
            archived_by: null
          });
        } else if (item.item_type === 'deposit' || item.item_type === 'maintenance') {
          await base44.entities[entityName].update(item.original_id, {
            is_archived: false,
            archived_at: null
          });
        } else {
          await base44.entities[entityName].update(item.original_id, {
            is_deleted: false,
            deleted_at: null
          });
        }
        
        await base44.entities.RecycleBin.delete(item.id);
      }
    },
    onSuccess: (_, items) => {
      queryClient.invalidateQueries({ queryKey: ['recycleBin'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      toast.success(strings.itemsRestored.replace('{count}', items.length));
      haptic.success();
      setSelectedItems([]);
    },
    onError: () => {
      toast.error(strings.error);
      haptic.error();
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (items) => {
      const entityMap = {
        case: 'Case',
        maintenance: 'MaintenanceRequest',
        evidence: 'Document',
        lease: 'Lease',
        deposit: 'DepositTracker'
      };

      for (const item of items) {
        const entityName = entityMap[item.item_type];
        await base44.entities[entityName].delete(item.original_id);
        await base44.entities.RecycleBin.delete(item.id);
      }
    },
    onSuccess: (_, items) => {
      queryClient.invalidateQueries({ queryKey: ['recycleBin'] });
      toast.success(strings.itemsDeleted.replace('{count}', items.length));
      haptic.medium();
      setSelectedItems([]);
      setConfirmBulkDelete(false);
    },
    onError: () => {
      toast.error(strings.error);
      haptic.error();
      setConfirmBulkDelete(false);
    }
  });

  const toggleSelectAll = () => {
    haptic.light();
    if (selectedItems.length === deletedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(deletedItems.map(i => i.id));
    }
  };

  const toggleItemSelection = (itemId) => {
    haptic.light();
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Group items by type
  const groupedItems = {
    case: deletedItems.filter(i => i.item_type === 'case'),
    maintenance: deletedItems.filter(i => i.item_type === 'maintenance'),
    evidence: deletedItems.filter(i => i.item_type === 'evidence'),
    lease: deletedItems.filter(i => i.item_type === 'lease'),
    deposit: deletedItems.filter(i => i.item_type === 'deposit')
  };

  const totalSize = deletedItems.reduce((sum, item) => sum + (item.size_bytes || 0), 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  const typeLabels = {
    case: strings.cases,
    maintenance: strings.maintenance,
    evidence: strings.evidence,
    lease: strings.leases,
    deposit: strings.deposits
  };

  const typeColors = {
    case: { bg: isDarkMode ? '#7C2D2D' : '#FEE2E2', text: isDarkMode ? '#FCA5A5' : '#991B1B' },
    maintenance: { bg: isDarkMode ? '#7C5D2D' : '#FEF3C7', text: isDarkMode ? '#FCD34D' : '#92400E' },
    evidence: { bg: isDarkMode ? '#2D4A7C' : '#DBEAFE', text: isDarkMode ? '#93C5FD' : '#1E40AF' },
    lease: { bg: isDarkMode ? '#2D7C4A' : '#D1FAE5', text: isDarkMode ? '#6EE7B7' : '#065F46' },
    deposit: { bg: isDarkMode ? '#5D2D7C' : '#EDE9FE', text: isDarkMode ? '#C4B5FD' : '#6B21A8' }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 page-transition" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          title={strings.title}
          subtitle={strings.subtitle}
          icon={Trash2}
          iconColor="#EF4444"
          showBack={true}
          backRoute={-1}
          isDarkMode={isDarkMode}
        />

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div />
            {deletedItems.length > 0 && (
              <button
                onClick={() => {
                  haptic.light();
                  if (selectedItems.length > 0) {
                    setSelectedItems([]);
                  }
                  // Don't reset selection when toggling off
                }}
                className="btn-interaction px-4 py-2 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor: selectedItems.length > 0 ? '#EF4444' : (isDarkMode ? '#374151' : '#F3F4F6'),
                  color: selectedItems.length > 0 ? '#FFFFFF' : 'inherit',
                  border: selectedItems.length > 0 ? '2px solid #EF4444' : '2px solid #E5E7EB'
                }}
              >
                {selectedItems.length > 0 ? strings.doneSelecting : strings.selectMode}
              </button>
            )}
          </div>
        </div>

        {/* Storage Usage Section */}
        <Card className="mb-6 border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                  boxShadow: '0 4px 12px rgba(139,92,246,0.25)'
                }}
              >
                <Database className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base" style={{ color: colors.textPrimary }}>
                  {strings.storageUsage}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {totalSizeMB} MB {language === 'en' ? 'of deleted items' : 'ของรายการที่ลบ'}
                </p>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: colors.textSecondary, opacity: 0.7 }}>
              {strings.storageNote}
            </p>
          </CardContent>
        </Card>

        {/* Bulk Action Toolbar */}
        {selectedItems.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border-2 bg-blue-50 dark:bg-blue-900/20" style={{ borderColor: '#3B82F6' }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="btn-interaction text-sm font-semibold text-blue-600 dark:text-blue-400"
                >
                  {selectedItems.length === deletedItems.length ? strings.deselectAll : strings.selectAll}
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedItems.length} {language === 'en' ? 'selected' : language === 'th' ? 'รายการที่เลือก' : 'выбрано'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const itemsToRestore = deletedItems.filter(i => selectedItems.includes(i.id));
                    bulkRestoreMutation.mutate(itemsToRestore);
                  }}
                  disabled={bulkRestoreMutation.isPending}
                  className="btn-interaction px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {strings.restoreSelected}
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  disabled={bulkDeleteMutation.isPending}
                  className="btn-interaction px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {strings.deleteSelected}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deleted Items */}
        {isLoading ? (
          <SkeletonLoader variant="card" count={3} isDarkMode={isDarkMode} />
        ) : deletedItems.length === 0 ? (
          <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-0">
              <EmptyState
                icon={Trash2}
                title={strings.noItems}
                description={strings.noItemsDesc}
                isDarkMode={isDarkMode}
                compact={true}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([type, items]) => {
              if (items.length === 0) return null;
              
              return (
                <div key={type}>
                  <h2 className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
                    {typeLabels[type]} ({items.length})
                  </h2>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const isSelected = selectedItems.includes(item.id);
                      
                      return (
                        <Card 
                          key={item.id} 
                          className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer"
                          style={{ 
                            backgroundColor: colors.cardBg,
                            opacity: selectedItems.length > 0 && !isSelected ? 0.6 : 1
                          }}
                          onClick={() => {
                            if (selectedItems.length > 0 || selectedItems.includes(item.id)) {
                              toggleItemSelection(item.id);
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {selectedItems.length > 0 && (
                                  <div
                                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 cursor-pointer mt-1"
                                    style={{
                                      backgroundColor: isSelected ? '#0C3B2E' : 'transparent',
                                      border: `2px solid ${isSelected ? '#0C3B2E' : '#D1D5DB'}`
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleItemSelection(item.id);
                                    }}
                                  >
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      style={{
                                        backgroundColor: typeColors[type].bg,
                                        color: typeColors[type].text
                                      }}
                                    >
                                      {typeLabels[type]}
                                    </Badge>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {strings.deletedOn} {format(new Date(item.deleted_date), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <p className="font-semibold truncate" style={{ color: colors.textPrimary }}>
                                    {item.item_label || item.original_id}
                                  </p>
                                </div>
                              </div>
                              {selectedItems.length === 0 && (
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      haptic.light();
                                      restoreMutation.mutate(item);
                                    }}
                                    disabled={restoreMutation.isLoading}
                                    className="px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      haptic.medium();
                                      setConfirmDelete(item);
                                    }}
                                    disabled={deleteMutation.isLoading}
                                    className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirmation Modal - Single Delete */}
        {confirmDelete && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                  {strings.confirmTitle}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {strings.confirmMessage}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    haptic.light();
                    setConfirmDelete(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 font-medium"
                >
                  {strings.cancel}
                </button>
                <button
                  onClick={() => {
                    haptic.heavy();
                    deleteMutation.mutate(confirmDelete);
                  }}
                  disabled={deleteMutation.isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {strings.confirmBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal - Bulk Delete */}
        {confirmBulkDelete && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmBulkDelete(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                  {strings.bulkDeleteConfirmTitle}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {strings.bulkDeleteConfirmMessage.replace('{count}', selectedItems.length)}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    haptic.light();
                    setConfirmBulkDelete(false);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-50 font-medium"
                >
                  {strings.cancel}
                </button>
                <button
                  onClick={() => {
                    haptic.heavy();
                    const itemsToDelete = deletedItems.filter(i => selectedItems.includes(i.id));
                    bulkDeleteMutation.mutate(itemsToDelete);
                  }}
                  disabled={bulkDeleteMutation.isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {strings.confirmBulkDelete.replace('{count}', selectedItems.length)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecycleBin() {
  return (
    <AuthGuard>
      <ToastProvider>
        <RecycleBinContent />
      </ToastProvider>
    </AuthGuard>
  );
}