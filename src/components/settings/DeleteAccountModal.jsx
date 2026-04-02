import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Trash2, Loader2, ShieldOff } from "lucide-react";

export default function DeleteAccountModal({ open, onClose, user, colors, language, isDarkMode, toast, haptic }) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'deactivate' | 'permanent'
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [confirmUnderstand, setConfirmUnderstand] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setConfirmEmail('');
    setConfirmText('');
    setConfirmUnderstand(false);
    setMode('choose');
    onClose();
  };

  const handleDeactivate = async () => {
    if (confirmEmail !== user?.email || !confirmUnderstand) return;
    haptic.medium();
    setIsDeleting(true);
    try {
      const response = await base44.functions.invoke('deleteUserData', { confirmEmail });
      if (response.data?.ok) {
        haptic.success();
        handleClose();
        toast.success(language === 'th' ? 'บัญชีถูกปิดใช้งานแล้ว กำลังออกจากระบบ...' : 'Account deactivated. Logging out...');
        setTimeout(() => { base44.auth.logout(); window.location.href = '/'; }, 2000);
      } else {
        haptic.error();
        toast.error(language === 'th' ? `การลบล้มเหลว: ${response.data?.message || 'ข้อผิดพลาด'}` : `Failed: ${response.data?.message || 'Error'}`);
      }
    } catch (error) {
      console.error('[DEACTIVATE_ERROR]', error);
      haptic.error();
      toast.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาติดต่อฝ่ายสนับสนุน' : 'Error. Please contact support.');
    } finally { setIsDeleting(false); }
  };

  const handlePermanentDelete = async () => {
    if (confirmText !== 'DELETE' || !confirmUnderstand) return;
    haptic.heavy();
    setIsDeleting(true);
    try {
      const response = await base44.functions.invoke('permanentDeleteAccount', { confirmText: 'DELETE' });
      if (response.data?.ok) {
        haptic.success();
        handleClose();
        toast.success(language === 'th' ? 'บัญชีถูกลบถาวรแล้ว กำลังออกจากระบบ...' : 'Account permanently deleted. Logging out...');
        setTimeout(() => { base44.auth.logout(); window.location.href = '/'; }, 2000);
      } else {
        haptic.error();
        toast.error(language === 'th' ? `การลบล้มเหลว: ${response.data?.message || 'ข้อผิดพลาด'}` : `Failed: ${response.data?.message || 'Error'}`);
      }
    } catch (error) {
      console.error('[PERMANENT_DELETE_ERROR]', error);
      haptic.error();
      toast.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาติดต่อ privacy@leaseshield.asia' : 'Error. Contact privacy@leaseshield.asia');
    } finally { setIsDeleting(false); }
  };

  const canDeactivate = confirmEmail === user?.email && confirmUnderstand && !isDeleting;
  const canPermanentDelete = confirmText === 'DELETE' && confirmUnderstand && !isDeleting;

  const t = language === 'th' ? {
    chooseTitle: 'ลบหรือปิดใช้งานบัญชี',
    deactivateTitle: 'ปิดใช้งานบัญชี',
    permanentTitle: '⚠️ ลบบัญชีถาวร',
    deactivateOption: 'ปิดใช้งานบัญชี',
    deactivateDesc: 'ข้อมูลถูกเก็บถาวร สามารถกลับมาเข้าสู่ระบบเพื่อเปิดใช้งานได้',
    permanentOption: 'ลบบัญชีถาวร (PDPA)',
    permanentDesc: 'ลบข้อมูลทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้',
    typeEmail: 'พิมพ์อีเมลเพื่อยืนยัน:',
    typeDelete: 'พิมพ์ DELETE เพื่อยืนยัน:',
    understandDeactivate: 'ฉันเข้าใจว่าบัญชีจะถูกปิดใช้งาน',
    understandPermanent: 'ฉันเข้าใจว่าข้อมูลทั้งหมดจะถูกลบถาวรและไม่สามารถกู้คืนได้',
    cancel: 'ยกเลิก',
    back: 'ย้อนกลับ',
    deactivateBtn: 'ปิดใช้งานบัญชี',
    permanentBtn: 'ลบถาวร',
    deactivating: 'กำลังปิดใช้งาน...',
    deleting: 'กำลังลบข้อมูล...',
    warningArchive: 'ข้อมูลจะถูกเก็บถาวร • คุณสามารถกลับมาเข้าสู่ระบบได้ • สิทธิ์ฟรีจะไม่ถูกรีเซ็ต',
    warningPermanent: 'ข้อมูลทั้งหมดจะถูกลบถาวร • สัญญาเช่า คดี หลักฐาน เงินมัดจำ ทั้งหมดจะถูกลบ • ยกเลิก Stripe อัตโนมัติ • ไม่สามารถกู้คืนได้',
  } : {
    chooseTitle: 'Delete or Deactivate Account',
    deactivateTitle: 'Deactivate Account',
    permanentTitle: '⚠️ Permanently Delete Account',
    deactivateOption: 'Deactivate Account',
    deactivateDesc: 'Data archived. Sign back in anytime to reactivate.',
    permanentOption: 'Permanently Delete (PDPA)',
    permanentDesc: 'All data permanently erased. Cannot be undone.',
    typeEmail: 'Type your email to confirm:',
    typeDelete: 'Type DELETE to confirm:',
    understandDeactivate: 'I understand my account will be deactivated',
    understandPermanent: 'I understand ALL my data will be permanently deleted and CANNOT be recovered',
    cancel: 'Cancel',
    back: 'Back',
    deactivateBtn: 'Deactivate Account',
    permanentBtn: 'Delete Permanently',
    deactivating: 'Deactivating...',
    deleting: 'Deleting all data...',
    warningArchive: 'Data will be archived • You can sign back in • Free benefits won\'t reset',
    warningPermanent: 'ALL data permanently deleted • Leases, cases, evidence, deposits — everything • Stripe subscription cancelled • Cannot be recovered',
  };

  const renderChoose = () => (
    <div className="space-y-4 py-4">
      <button
        onClick={() => { setMode('deactivate'); setConfirmUnderstand(false); setConfirmEmail(''); }}
        className="w-full p-4 rounded-xl text-left transition-all"
        style={{ backgroundColor: isDarkMode ? '#374151' : '#F8FAFC', border: `2px solid ${colors.borderColor}` }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F59E0B'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.borderColor}
      >
        <div className="flex items-center gap-3 mb-2">
          <ShieldOff className="w-5 h-5" style={{ color: '#F59E0B' }} />
          <span className="font-bold text-base" style={{ color: colors.textPrimary }}>{t.deactivateOption}</span>
        </div>
        <p className="text-sm" style={{ color: colors.textSecondary }}>{t.deactivateDesc}</p>
      </button>

      <button
        onClick={() => { setMode('permanent'); setConfirmUnderstand(false); setConfirmText(''); }}
        className="w-full p-4 rounded-xl text-left transition-all"
        style={{ backgroundColor: isDarkMode ? '#2A1F1F' : '#FEF2F2', border: '2px solid #FCA5A5' }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#DC2626'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#FCA5A5'}
      >
        <div className="flex items-center gap-3 mb-2">
          <Trash2 className="w-5 h-5" style={{ color: '#DC2626' }} />
          <span className="font-bold text-base" style={{ color: '#DC2626' }}>{t.permanentOption}</span>
        </div>
        <p className="text-sm" style={{ color: colors.textSecondary }}>{t.permanentDesc}</p>
      </button>
    </div>
  );

  const renderDeactivate = () => (
    <div className="space-y-4 py-4">
      <div className="p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#2A2A1F' : '#FFFBEB', border: '2px solid #FDE68A' }}>
        <ul className="space-y-1.5 text-sm" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
          {t.warningArchive.split(' • ').map((item, i) => <li key={i} className="flex items-start gap-2"><span>•</span><span>{item}</span></li>)}
        </ul>
      </div>
      <div>
        <Label className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{t.typeEmail} <strong>{user?.email}</strong></Label>
        <Input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder={user?.email} className="mt-2" style={{ backgroundColor: colors.inputBg || colors.fieldBg, borderColor: colors.borderColor, color: colors.textPrimary, borderRadius: '8px', padding: '12px' }} />
      </div>
      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: colors.fieldBg || colors.inputBg, border: `1px solid ${colors.borderColor}` }}>
        <input type="checkbox" checked={confirmUnderstand} onChange={(e) => setConfirmUnderstand(e.target.checked)} style={{ width: '18px', height: '18px', marginTop: '2px' }} />
        <label className="text-sm" style={{ color: colors.textPrimary }}>{t.understandDeactivate}</label>
      </div>
    </div>
  );

  const renderPermanent = () => (
    <div className="space-y-4 py-4">
      <div className="p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#2A1F1F' : '#FEF2F2', border: '2px solid #FCA5A5' }}>
        <p className="font-bold mb-2 text-sm" style={{ color: '#DC2626' }}>⚠️ {language === 'th' ? 'คำเตือน: ไม่สามารถกู้คืนได้' : 'WARNING: This cannot be undone'}</p>
        <ul className="space-y-1.5 text-sm" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
          {t.warningPermanent.split(' • ').map((item, i) => <li key={i} className="flex items-start gap-2"><span>•</span><span>{item}</span></li>)}
        </ul>
      </div>
      <div>
        <Label className="text-sm font-semibold" style={{ color: '#DC2626' }}>{t.typeDelete}</Label>
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="DELETE" className="mt-2" style={{ backgroundColor: colors.inputBg || colors.fieldBg, borderColor: '#FCA5A5', color: colors.textPrimary, borderRadius: '8px', padding: '12px', fontSize: '16px', fontWeight: '700', letterSpacing: '2px' }} />
      </div>
      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#2A1F1F' : '#FEF2F2', border: '1px solid #FCA5A5' }}>
        <input type="checkbox" checked={confirmUnderstand} onChange={(e) => setConfirmUnderstand(e.target.checked)} style={{ width: '18px', height: '18px', marginTop: '2px' }} />
        <label className="text-sm font-semibold" style={{ color: '#DC2626' }}>{t.understandPermanent}</label>
      </div>
    </div>
  );

  const title = mode === 'choose' ? t.chooseTitle : mode === 'deactivate' ? t.deactivateTitle : t.permanentTitle;
  const titleColor = mode === 'permanent' ? '#DC2626' : mode === 'deactivate' ? '#F59E0B' : colors.textPrimary;
  const IconComp = mode === 'permanent' ? Trash2 : mode === 'deactivate' ? ShieldOff : AlertCircle;
  const iconBg = mode === 'permanent' ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' : mode === 'deactivate' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #6B7280 0%, #374151 100%)';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="modal-enter" style={{
        backgroundColor: colors.cardBg, borderColor: mode === 'permanent' ? '#DC2626' : colors.borderColor, color: colors.textPrimary,
        maxHeight: '90vh', width: '95vw', maxWidth: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <DialogHeader style={{ flexShrink: 0, paddingBottom: '12px' }}>
          <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl" style={{ color: titleColor }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
              <IconComp className="w-6 h-6 text-white" />
            </div>
            <div>{title}</div>
          </DialogTitle>
        </DialogHeader>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {mode === 'choose' && renderChoose()}
          {mode === 'deactivate' && renderDeactivate()}
          {mode === 'permanent' && renderPermanent()}
        </div>

        <div className="flex gap-3 pt-3" style={{ flexShrink: 0, borderTop: `1px solid ${colors.borderColor}`, paddingTop: '12px' }}>
          <button onClick={mode === 'choose' ? handleClose : () => { setMode('choose'); setConfirmUnderstand(false); setConfirmEmail(''); setConfirmText(''); }} disabled={isDeleting} className="btn-interaction" style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', border: `1px solid ${colors.borderColor}`, backgroundColor: 'transparent', color: colors.textPrimary, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.5 : 1, minHeight: '48px' }}>
            {mode === 'choose' ? t.cancel : t.back}
          </button>
          {mode === 'deactivate' && (
            <button onClick={handleDeactivate} disabled={!canDeactivate} className="btn-interaction" style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', border: 'none', backgroundColor: canDeactivate ? '#F59E0B' : '#9CA3AF', color: '#FFFFFF', cursor: canDeactivate ? 'pointer' : 'not-allowed', opacity: canDeactivate ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '48px' }}>
              {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>{t.deactivating}</span></> : <><ShieldOff className="w-4 h-4" /><span>{t.deactivateBtn}</span></>}
            </button>
          )}
          {mode === 'permanent' && (
            <button onClick={handlePermanentDelete} disabled={!canPermanentDelete} className="btn-interaction" style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', border: 'none', backgroundColor: canPermanentDelete ? '#DC2626' : '#9CA3AF', color: '#FFFFFF', cursor: canPermanentDelete ? 'pointer' : 'not-allowed', opacity: canPermanentDelete ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '48px' }}>
              {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>{t.deleting}</span></> : <><Trash2 className="w-4 h-4" /><span>{t.permanentBtn}</span></>}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}