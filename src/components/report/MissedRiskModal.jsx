import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

export default function MissedRiskModal({ open, onClose, onSubmit, taxonomy, clauses, leaseId, scanId }) {
  const [category, setCategory] = React.useState('');
  const [clauseId, setClauseId] = React.useState('');
  const [note, setNote] = React.useState('');
  const [localClauses, setLocalClauses] = React.useState([]);
  const [clausesLoading, setClausesLoading] = React.useState(false);
  const [catQuery, setCatQuery] = React.useState('');

  const cats = Array.isArray(taxonomy?.categories) ? taxonomy.categories : [];
  const effectiveClauses = Array.isArray(clauses) && clauses.length > 0 ? clauses : localClauses;

  React.useEffect(() => {
    const load = async () => {
      try{
        if (!open) return;
        if ((Array.isArray(clauses) && clauses.length>0) || !scanId) return;
        setClausesLoading(true);
        const scans = await base44.entities.LeaseScan.list();
        const found = scans.find(s=> s.id === scanId);
        const incoming = Array.isArray(found?.scan_full?.clauses) ? found.scan_full.clauses : [];
        setLocalClauses(incoming);
      } catch (error){
        try {
          await base44.functions.invoke('logAuditEvent', { event: 'ReportMissedRiskModalError', meta: { leaseId, scanId, message: error?.message, stack: (error?.stack||'').slice(0,400), stage: 'loadClauses' } });
        } catch(_) {}
        console.error('[ReportMissedRiskModalError]', { leaseId, scanId, message: error?.message, stage: 'loadClauses' });
      } finally {
        setClausesLoading(false);
      }
    };
    load();
  }, [open, scanId, clauses, leaseId]);

  // Prevent background scroll when modal open
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  const filteredCats = React.useMemo(()=>{
    try{
      const list = Array.isArray(cats) ? cats : [];
      const q = (catQuery||'').toLowerCase();
      return list.filter(c => !q || c?.name_en?.toLowerCase().includes(q) || c?.category_id?.toLowerCase().includes(q));
    } catch(error){
      console.error('[ReportMissedRiskModalError]', { leaseId, scanId, message: error?.message, stage: 'filterCats' });
      return [];
    }
  }, [cats, catQuery, leaseId, scanId]);

  const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9998] flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-xl p-4 max-h-[80vh] overflow-y-auto shadow-xl relative z-[9998]">
        <h3 className="text-lg font-semibold mb-2">Report a missed risk</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Category</label>
            <div className="mt-1">
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm mb-2"
                placeholder="Search categories..."
                value={catQuery}
                onChange={(e)=>setCatQuery(e.target.value)}
              />
              {/* Mobile: native select for reliability */}
              {isMobile ? (
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={category}
                  onChange={(e)=>setCategory(e.target.value)}
                  disabled={filteredCats.length===0}
                >
                  <option value="" disabled>{filteredCats.length===0 ? 'Loading categories…' : 'Select a category'}</option>
                  {filteredCats.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.name_en} ({c.category_id})</option>
                  ))}
                </select>
              ) : (
                <Select value={category} onValueChange={setCategory} disabled={filteredCats.length===0}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={filteredCats.length===0 ? 'Loading categories…' : 'Select a category'} /></SelectTrigger>
                  <SelectContent className="z-[9999] max-h-64" position="popper">
                    {filteredCats.map(c => (
                      <SelectItem key={c.category_id} value={c.category_id} className="whitespace-normal text-sm py-2">
                        {c.name_en} <span className="opacity-70">({c.category_id})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Clause</label>
            {/* Mobile fallback */}
            {isMobile ? (
              <select
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                value={clauseId}
                onChange={(e)=>setClauseId(e.target.value)}
                disabled={!category || clausesLoading || (effectiveClauses||[]).length===0}
              >
                <option value="" disabled>{!category ? 'Select a category first' : clausesLoading ? 'Loading clauses…' : (effectiveClauses||[]).length===0 ? 'No clauses available' : 'Select a clause'}</option>
                {(effectiveClauses||[]).map(c => (
                  <option key={c.clause_id} value={c.clause_id}>Clause {c.clause_id} — {(c.title||'').slice(0,60) || (c.raw_text||'').slice(0,60)}</option>
                ))}
              </select>
            ) : (
              <Select value={clauseId} onValueChange={setClauseId} disabled={!category || clausesLoading || (effectiveClauses||[]).length===0}>
                <SelectTrigger className="w-full mt-1"><SelectValue placeholder={!category ? 'Select a category first' : clausesLoading ? 'Loading clauses…' : (effectiveClauses||[]).length===0 ? 'No clauses available' : 'Select a clause'} /></SelectTrigger>
                <SelectContent className="z-[9999] max-h-64" position="popper">
                  {(effectiveClauses||[]).map(c => (
                    <SelectItem key={c.clause_id} value={c.clause_id} className="whitespace-normal text-sm py-2">
                      Clause {c.clause_id} — {c.title || (c.raw_text||'').slice(0,50)}{(c.raw_text||'').length>50?'…':''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea className="mt-1" rows={3} value={note} onChange={e=>setNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSubmit({ category_id: category, clause_id: clauseId || 'UNKNOWN', note })} disabled={!category || ((effectiveClauses||[]).length>0 && !clauseId)}>Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );
}