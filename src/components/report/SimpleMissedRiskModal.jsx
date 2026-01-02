import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/shared/Toast';

const CATEGORIES = [
  'Deposit / Money',
  'Entry & Privacy',
  'Penalties / Fees',
  'Notice / Termination',
  'Utilities',
  'Other',
];

export default function SimpleMissedRiskModal({ open, onClose, leaseId, scanId, appLanguage, leaseLanguage }){
  const [category, setCategory] = React.useState('');
  const [clauseText, setClauseText] = React.useState('');
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const toast = useToast();

  React.useEffect(()=>{
    if (!open) return;
    const originalOverflow = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    return () => { if (typeof document !== 'undefined') document.body.style.overflow = originalOverflow; };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');
    if (!category) return;
    try {
      setSubmitting(true);
      const { data, status } = await base44.functions.invoke('submitRiskFeedback', {
        leaseId, scanId,
        payload: {
          category,
          clause_text: clauseText,
          note,
          app_language: appLanguage,
          lease_language_detected: leaseLanguage,
        }
      });
      if (status === 200 && data?.success){
        toast.success('Thanks — submitted.');
        onClose?.();
        setCategory(''); setClauseText(''); setNote('');
      } else {
        setError(data?.error || 'Submit failed. Please try again.');
      }
    } catch (e){
      setError(e?.message || 'Submit failed. Please try again.');
      try { await base44.functions.invoke('logAuditEvent', { event: 'ReportMissedRiskModalError', meta: { leaseId, scanId, message: e?.message, stack: (e?.stack||'').slice(0,400), stage: 'submit' } }); } catch(_) {}
      console.error('[ReportMissedRiskModalError]', { leaseId, scanId, error: e });
    } finally {
      setSubmitting(false);
    }
  };

  const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : true;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/40 flex items-end sm:items-center justify-center">
      <div className={`${isMobile ? 'rounded-t-2xl' : 'rounded-xl'} w-full max-w-lg bg-white p-4 max-h-[80vh] overflow-y-auto shadow-xl`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Report missed risk</h3>
          <button onClick={onClose} className="text-slate-600 text-sm">Close</button>
        </div>

        <p className="text-sm text-slate-600 mb-3">Paste the clause or describe it. We’ll use this to improve future scans.</p>

        <div className="mb-3">
          <label className="text-sm font-medium mb-2 block">What did we miss? <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c)=> (
              <button
                key={c}
                type="button"
                onClick={()=>setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-sm border ${category===c ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-800 border-slate-300'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="text-sm font-medium">Paste clause text (optional)</label>
          <Textarea className="mt-1" rows={4} value={clauseText} onChange={(e)=>setClauseText(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="text-sm font-medium">Note (optional)</label>
          <Textarea className="mt-1" rows={3} value={note} onChange={(e)=>setNote(e.target.value)} />
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!category || submitting} className="flex items-center gap-2" style={{background:'#0C3B2E', color:'#fff'}}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}