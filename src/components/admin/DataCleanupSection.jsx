import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, AlertTriangle, Eye, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DataCleanupSection({ language = 'en', colors, isDarkMode }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  const t = {
    en: {
      dangerZone: 'Danger Zone - Pre-Launch Cleanup',
      protectedAccounts: 'PROTECTED ACCOUNTS (will NOT be deleted):',
      deleteAllTestData: 'Delete all test data before launch. This removes:',
      previewButton: 'Preview What Will Be Deleted',
      deleteButton: 'Delete All Test Data',
      confirmButton: 'CONFIRM: Delete Everything',
      cancel: 'Cancel',
      deleting: 'Deleting...',
      previewResults: 'Preview Results:',
      wouldDelete: 'Would delete',
      totalItems: 'total items:',
      protectedAccounts2: 'Protected:',
      accountsPreserved: 'accounts will be preserved',
      warningFinal: 'FINAL WARNING: This will delete ALL user data and ALL test users (except the 7 protected accounts). This cannot be undone.',
      typeDelete: 'Type "DELETE" to confirm deletion:',
      confirmationFailed: 'Deletion cancelled - confirmation text did not match',
      cleanupComplete: 'Cleanup complete!'
    },
    th: {
      dangerZone: 'โซนอันตราย - ล้างข้อมูลก่อนเปิดตัว',
      protectedAccounts: 'บัญชีที่ป้องกัน (จะไม่ถูกลบ):',
      deleteAllTestData: 'ลบข้อมูลทดสอบทั้งหมดก่อนเปิดตัว สิ่งนี้จะลบ:',
      previewButton: 'ดูตัวอย่างสิ่งที่จะถูกลบ',
      deleteButton: 'ลบข้อมูลทดสอบทั้งหมด',
      confirmButton: 'ยืนยัน: ลบทุกอย่าง',
      cancel: 'ยกเลิก',
      deleting: 'กำลังลบ...',
      previewResults: 'ผลตัวอย่าง:',
      wouldDelete: 'จะลบ',
      totalItems: 'รายการทั้งหมด:',
      protectedAccounts2: 'ป้องกัน:',
      accountsPreserved: 'บัญชีจะถูกรักษาไว้',
      warningFinal: 'คำเตือนสุดท้าย: สิ่งนี้จะลบข้อมูลผู้ใช้ทั้งหมดและผู้ใช้ทดสอบทั้งหมด (ยกเว้น 7 บัญชีที่ป้องกัน) ไม่สามารถยกเลิกได้',
      typeDelete: 'พิมพ์ "DELETE" เพื่อยืนยันการลบ:',
      confirmationFailed: 'ยกเลิกการลบ - ข้อความยืนยันไม่ตรงกัน',
      cleanupComplete: 'ล้างข้อมูลเสร็จสิ้น!'
    }
  };
  
  const strings = t[language] || t.en;
  
  const handlePreview = async () => {
    setIsDeleting(true);
    
    try {
      const response = await base44.functions.invoke('cleanupTestData', { preview: true });
      
      if (response.data?.success) {
        setPreviewData(response.data);
      } else {
        alert(`❌ Preview failed: ${response.data?.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCleanup = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    if (!window.confirm(strings.warningFinal)) {
      setShowConfirm(false);
      return;
    }
    
    const confirmation = window.prompt(strings.typeDelete);
    if (confirmation !== 'DELETE') {
      alert(strings.confirmationFailed);
      setShowConfirm(false);
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await base44.functions.invoke('cleanupTestData', { preview: false });
      
      if (response.data?.success) {
        const result = response.data;
        const summary = `✅ ${strings.cleanupComplete}\n\n${language === 'th' ? 'ลบแล้ว' : 'Deleted'}:\n` +
          `- ${result.deleted.leases || 0} leases\n` +
          `- ${result.deleted.leaseScans || 0} lease scans\n` +
          `- ${result.deleted.deposits || 0} deposits\n` +
          `- ${result.deleted.cases || 0} cases\n` +
          `- ${result.deleted.documents || 0} documents\n` +
          `- ${result.deleted.timeline || 0} timeline events\n` +
          `- ${result.deleted.maintenance || 0} maintenance requests\n` +
          `- ${result.deleted.notifications || 0} notifications\n` +
          `- ${result.deleted.lisaConversations || 0} Lisa conversations\n` +
          `- ${result.deleted.lisaAnalytics || 0} Lisa analytics\n` +
          `- ${result.deleted.recycleBin || 0} recycle bin items\n` +
          `- ${result.deleted.users || 0} test user accounts\n\n` +
          `${language === 'th' ? 'ทั้งหมด' : 'Total'}: ${result.total_items_deleted} ${language === 'th' ? 'รายการ' : 'items deleted'}\n\n` +
          `${strings.protectedAccounts2} ${result.protected_accounts_preserved?.length || 0} ${strings.accountsPreserved}`;
        alert(summary);
        window.location.reload();
      } else {
        alert(`❌ Cleanup failed: ${response.data?.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };
  
  return (
    <Card className="mt-6 border-none shadow-lg" style={{ 
      backgroundColor: isDarkMode ? '#2A1F1F' : '#FEF2F2',
      border: '2px solid #EF4444'
    }}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-300">{strings.dangerZone}</h3>
        </div>
        
        <div className="p-4 rounded-lg mb-4" style={{
          backgroundColor: isDarkMode ? '#422006' : '#FFFBEB',
          border: '1px solid #F59E0B'
        }}>
          <p className="text-sm font-semibold mb-2" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
            ⚠️ {strings.protectedAccounts}
          </p>
          <ul className="text-xs space-y-1" style={{ color: isDarkMode ? '#FDE68A' : '#78350F' }}>
            <li>• steve.l@signa-consultants.com</li>
            <li>• steve.d.lockhart@gmail.com</li>
            <li>• shortyroc36@gmail.com</li>
            <li>• tamirbe@base44.com</li>
            <li>• dom.sources@gmail.com</li>
            <li>• support@leaseshield.asia</li>
            <li>• privacy@leaseshield.asia</li>
          </ul>
        </div>
        
        <p className="text-sm mb-4" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
          {strings.deleteAllTestData}
        </p>
        <ul className="text-sm mb-4 space-y-1" style={{ color: isDarkMode ? '#F87171' : '#B91C1C' }}>
          <li>• All leases, properties, deposits, cases, evidence</li>
          <li>• All timeline events, maintenance requests, notifications</li>
          <li>• All Lisa conversations and analytics</li>
          <li>• All recycle bin items</li>
          <li>• <strong>ALL user accounts EXCEPT the 7 protected accounts above</strong></li>
        </ul>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handlePreview}
            disabled={isDeleting}
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isDeleting && !showConfirm ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                {strings.previewButton}
              </>
            )}
          </Button>
          
          {!showConfirm ? (
            <Button
              onClick={handleCleanup}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {strings.deleteButton}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleCleanup}
                disabled={isDeleting}
                className="bg-red-700 hover:bg-red-800 font-bold"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.deleting}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {strings.confirmButton}
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                variant="outline"
              >
                {strings.cancel}
              </Button>
            </div>
          )}
        </div>
        
        {/* Preview Results */}
        {previewData && (
          <div className="mt-4 p-4 rounded-lg" style={{ 
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`
          }}>
            <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <CheckCircle className="w-4 h-4 text-blue-600" />
              {strings.previewResults}
            </h4>
            <div className="text-sm space-y-1">
              <p style={{ color: colors.textPrimary }}>
                {strings.wouldDelete} <strong>{previewData.total_items}</strong> {strings.totalItems}
              </p>
              <ul className="ml-4 space-y-1" style={{ color: colors.textSecondary }}>
                <li>• {previewData.would_delete.leases || 0} leases</li>
                <li>• {previewData.would_delete.leaseScans || 0} lease scans</li>
                <li>• {previewData.would_delete.deposits || 0} deposits</li>
                <li>• {previewData.would_delete.cases || 0} cases</li>
                <li>• {previewData.would_delete.documents || 0} documents</li>
                <li>• {previewData.would_delete.timeline || 0} timeline events</li>
                <li>• {previewData.would_delete.maintenance || 0} maintenance requests</li>
                <li>• {previewData.would_delete.notifications || 0} notifications</li>
                <li>• {previewData.would_delete.lisaConversations || 0} Lisa conversations</li>
                <li>• {previewData.would_delete.lisaAnalytics || 0} Lisa analytics</li>
                <li>• {previewData.would_delete.recycleBin || 0} recycle bin items</li>
                <li>• <strong className="text-red-700 dark:text-red-400">{previewData.would_delete.users || 0} test user accounts</strong></li>
              </ul>
              <p className="mt-2 font-semibold" style={{ color: '#10B981' }}>
                {strings.protectedAccounts2} {previewData.protected_found?.length || 0} {strings.accountsPreserved}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}