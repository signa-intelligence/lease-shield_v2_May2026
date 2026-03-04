import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Trash2, Loader2 } from "lucide-react";

export default function DeleteAccountModal({ open, onClose, user, colors, language, isDarkMode, toast, haptic }) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmUnderstand, setConfirmUnderstand] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setConfirmEmail('');
    setConfirmUnderstand(false);
    onClose();
  };

  const handleDelete = async () => {
    if (confirmEmail !== user?.email || !confirmUnderstand) {
      toast.error(language === 'th' ? 'กรุณายืนยันอีเมลและยอมรับข้อกำหนด' : 'Please confirm email and accept terms');
      return;
    }

    haptic.medium();
    setIsDeleting(true);

    try {
      const response = await base44.functions.invoke('deleteUserData', { confirmEmail });

      if (response.data?.ok) {
        haptic.success();
        handleClose();
        toast.success(language === 'th' ? 'บัญชีและข้อมูลทั้งหมดถูกลบแล้ว กำลังออกจากระบบ...' : 'Account deleted. Logging out...');
        setTimeout(async () => {
          await base44.auth.logout();
          window.location.href = '/';
        }, 2000);
      } else {
        haptic.error();
        toast.error(language === 'th' ? `การลบล้มเหลว: ${response.data?.message || 'ข้อผิดพลาด'}` : `Deletion failed: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[DELETE_ACCOUNT_ERROR]', error);
      haptic.error();
      toast.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาติดต่อฝ่ายสนับสนุน' : 'An error occurred. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = confirmEmail === user?.email && confirmUnderstand && !isDeleting;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="modal-enter" style={{
        backgroundColor: colors.cardBg, borderColor: '#DC2626', color: colors.textPrimary,
        maxHeight: '90vh', width: '95vw', maxWidth: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <DialogHeader style={{ flexShrink: 0, paddingBottom: '12px' }}>
          <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl" style={{ color: '#DC2626' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' }}>
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              {language === 'th' ? 'ลบบัญชีอย่างถาวร?' : language === 'zh' ? '永久删除账户？' : language === 'ja' ? 'アカウントを完全に削除しますか？' : language === 'ko' ? '계정을 영구 삭제하시겠습니까?' : language === 'ru' ? 'Удалить аккаунт навсегда?' : 'Delete Account Permanently?'}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          <div className="space-y-4 py-4">
            {/* Warning */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#2A1F1F' : '#FEF2F2', border: '2px solid #FCA5A5' }}>
              <p className="font-bold mb-3" style={{ color: '#DC2626', fontSize: '14px' }}>
                ⚠️ {language === 'th' ? 'การกระทำนี้ไม่สามารถยกเลิกได้' : language === 'zh' ? '此操作无法撤销' : language === 'ja' ? 'この操作は元に戻せません' : language === 'ko' ? '이 작업은 취소할 수 없습니다' : language === 'ru' ? 'Это действие необратимо' : 'This action cannot be undone'}
              </p>
              <ul className="space-y-1.5 text-sm" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
                <li className="flex items-start gap-2"><span>•</span><span>{language === 'th' ? 'เอกสาร สัญญาเช่า และการสแกนทั้งหมดจะถูกลบ' : 'All documents, leases, and scans will be deleted'}</span></li>
                <li className="flex items-start gap-2"><span>•</span><span>{language === 'th' ? 'คดีและหลักฐานทั้งหมดจะหายไป' : 'All cases and evidence will be lost'}</span></li>
                <li className="flex items-start gap-2"><span>•</span><span>{language === 'th' ? 'การสมัครสมาชิกจะถูกยกเลิก' : 'Your subscription will be cancelled'}</span></li>
                <li className="flex items-start gap-2"><span>•</span><span>{language === 'th' ? 'ไม่สามารถกู้คืนข้อมูลได้' : 'You cannot recover this data'}</span></li>
              </ul>
            </div>

            {/* Consider downgrade */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF', border: `1px solid ${isDarkMode ? '#2563EB33' : '#BFDBFE'}` }}>
              <p className="text-sm font-semibold mb-1" style={{ color: isDarkMode ? '#93C5FD' : '#1D4ED8' }}>
                💡 {language === 'th' ? 'ลองพิจารณาทางเลือกอื่น:' : 'Consider instead:'}
              </p>
              <p className="text-xs" style={{ color: isDarkMode ? '#BFDBFE' : '#2563EB' }}>
                {language === 'th' ? 'ลดระดับเป็น Explorer (ฟรี) เพื่อเก็บข้อมูลของคุณไว้โดยไม่ต้องจ่ายเงิน' : 'Downgrade to Explorer (free) to keep your data without paying.'}
              </p>
            </div>

            {/* Email confirmation */}
            <div>
              <Label className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'พิมพ์อีเมลของคุณเพื่อยืนยัน:' : 'Type your email to confirm:'} <strong>{user?.email}</strong>
              </Label>
              <Input
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={user?.email}
                className="mt-2"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary, borderRadius: '8px', padding: '12px', fontSize: '14px' }}
              />
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: colors.fieldBg || colors.inputBg, border: `1px solid ${colors.borderColor}` }}>
              <input type="checkbox" id="deleteUnderstand" checked={confirmUnderstand} onChange={(e) => setConfirmUnderstand(e.target.checked)} className="mt-1" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="deleteUnderstand" className="text-sm" style={{ color: colors.textPrimary, cursor: 'pointer' }}>
                {language === 'th' ? 'ฉันเข้าใจว่าการกระทำนี้เป็นการถาวรและไม่สามารถยกเลิกได้' : language === 'zh' ? '我理解此操作是永久性的且无法撤销' : language === 'ja' ? 'この操作は永続的で元に戻せないことを理解しています' : language === 'ko' ? '이 작업이 영구적이며 취소할 수 없음을 이해합니다' : language === 'ru' ? 'Я понимаю, что это действие необратимо' : 'I understand this action is permanent and cannot be undone'}
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}`, paddingTop: '12px' }}>
          <button onClick={handleClose} disabled={isDeleting} className="btn-interaction" style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', border: `1px solid ${colors.borderColor}`, backgroundColor: 'transparent', color: colors.textPrimary, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.5 : 1, minHeight: '48px' }}>
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button onClick={handleDelete} disabled={!canDelete} className="btn-interaction" style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', border: 'none', backgroundColor: canDelete ? '#DC2626' : '#9CA3AF', color: '#FFFFFF', cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '48px' }}>
            {isDeleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>{language === 'th' ? 'กำลังลบ...' : 'Deleting...'}</span></>
            ) : (
              <><Trash2 className="w-4 h-4" /><span>{language === 'th' ? 'ลบอย่างถาวร' : 'Delete Forever'}</span></>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}