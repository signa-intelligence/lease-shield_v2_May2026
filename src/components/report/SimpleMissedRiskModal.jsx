import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/shared/Toast';

export default function SimpleMissedRiskModal({ open, onClose, leaseId, scanId, appLanguage, leaseLanguage }){
  const [taxonomyCode, setTaxonomyCode] = React.useState('');
  const [clauseNo, setClauseNo] = React.useState('');
  const [clauses, setClauses] = React.useState([]);
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const toast = useToast();

  React.useEffect(()=>{
    if (!open) return;
    (async () => {
      try {
        const scans = await base44.entities.LeaseScan.list();
        const found = scans.find(s=> s.id === scanId);
        const cls = Array.isArray(found?.scan_full?.clauses) ? found.scan_full.clauses : [];
        setClauses(cls);
      } catch(_) {}
    })();
  }, [open, scanId]);

  React.useEffect(()=>{
    if (!open) return;
    const originalOverflow = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    return () => { if (typeof document !== 'undefined') document.body.style.overflow = originalOverflow; };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');
    if (!clauseNo || !taxonomyCode) { setError('Please select clause and taxonomy code'); return; }
    try {
      setSubmitting(true);
      const { data, status } = await base44.functions.invoke('submitRiskFeedback', {
        leaseId, scanId,
        payload: {
          taxonomy_code: taxonomyCode,
          clause_no: clauseNo,
          note,
          app_language: appLanguage,
          lease_language_detected: leaseLanguage,
        }
      });
      if (status === 200 && data?.success){
        toast.success('Thanks — submitted.');
        onClose?.();
        setTaxonomyCode(''); setClauseNo(''); setNote('');
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

        <div className="mb-3">
          <label className="text-sm font-medium">Clause number <span className="text-red-500">*</span></label>
          <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={clauseNo} onChange={(e)=>setClauseNo(e.target.value)}>
            <option value="" disabled>Select clause</option>
            {clauses.map((c)=> (
              <option key={c.clause_id} value={c.clause_id}>Clause {c.clause_id} {c.title ? `— ${c.title}` : ''}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="text-sm font-medium">Taxonomy code <span className="text-red-500">*</span></label>
          <input className="w-full border rounded-md px-3 py-2 text-sm mt-1" placeholder="e.g., PROC_IMMEDIATE_TERMINATION" value={taxonomyCode} onChange={(e)=>setTaxonomyCode(e.target.value)} />
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
          <Button onClick={handleSubmit} disabled={!clauseNo || !taxonomyCode || submitting} className="flex items-center gap-2" style={{background:'#0C3B2E', color:'#fff'}}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}