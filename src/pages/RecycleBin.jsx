import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, AlertTriangle, Database, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToastProvider, useToast } from "../components/shared/Toast";
import { haptic } from "../components/shared/HapticFeedback";
import { format } from "date-fns";

function RecycleBinContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(null);

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
      storageNote: "Storage management features coming soon"
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
      storageNote: "คุณสมบัติการจัดการพื้นที่เร็วๆ นี้"
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
      
      // Update original record to undelete
      await base44.entities[entityName].update(item.original_id, {
        ...item.item_snapshot,
        is_deleted: false
      });
      
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              haptic.light();
              navigate(-1);
            }}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{strings.backToSettings}</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            {strings.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {strings.subtitle}
          </p>
        </div>

        {/* Storage Usage Section */}
        <Card className="mb-6 border-none shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                    {strings.storageUsage}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {totalSizeMB} MB {language === 'en' ? 'of deleted items' : 'ของรายการที่ลบ'}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
              {strings.storageNote}
            </p>
          </CardContent>
        </Card>

        {/* Deleted Items */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto" />
          </div>
        ) : deletedItems.length === 0 ? (
          <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-12 text-center">
              <Trash2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
                {strings.noItems}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {strings.noItemsDesc}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([type, items]) => {
              if (items.length === 0) return null;
              
              return (
                <div key={type}>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">
                    {typeLabels[type]} ({items.length})
                  </h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <Card key={item.id} className="border-none shadow-sm bg-white dark:bg-gray-800">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
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
                              <p className="font-medium text-gray-900 dark:text-gray-50 truncate">
                                {item.item_label || item.original_id}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => {
                                  haptic.light();
                                  restoreMutation.mutate(item);
                                }}
                                disabled={restoreMutation.isLoading}
                                className="px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  haptic.medium();
                                  setConfirmDelete(item);
                                }}
                                disabled={deleteMutation.isLoading}
                                className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirmation Modal */}
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
      </div>
    </div>
  );
}

export default function RecycleBin() {
  return (
    <ToastProvider>
      <RecycleBinContent />
    </ToastProvider>
  );
}