import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function MissedRiskModal({ open, onClose, onSubmit, taxonomy, clauses }) {
  const [category, setCategory] = React.useState('');
  const [clauseId, setClauseId] = React.useState('');
  const [note, setNote] = React.useState('');

  if (!open) return null;
  const cats = taxonomy?.categories || [];

  // Prevent background scroll when modal open
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  // Local search for categories
  const [catQuery, setCatQuery] = React.useState('');
  const filteredCats = cats.filter(c => {
    const q = catQuery.toLowerCase();
    return !q || c.name_en?.toLowerCase().includes(q) || c.category_id?.toLowerCase().includes(q);
  });

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
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent className="z-[9999] max-h-64" position="popper">
                  {filteredCats.map(c => (
                    <SelectItem key={c.category_id} value={c.category_id} className="whitespace-normal text-sm py-2">
                      {c.name_en} <span className="opacity-70">({c.category_id})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Clause</label>
            <Select value={clauseId} onValueChange={setClauseId}>
              <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select a clause" /></SelectTrigger>
              <SelectContent className="z-[9999] max-h-64" position="popper">
                {(clauses||[]).map(c => (
                  <SelectItem key={c.clause_id} value={c.clause_id} className="whitespace-normal text-sm py-2">
                    Clause {c.clause_id} — {c.title || (c.raw_text||'').slice(0,50)}{(c.raw_text||'').length>50?'…':''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea className="mt-1" rows={3} value={note} onChange={e=>setNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSubmit({ category_id: category, clause_id: clauseId, note })} disabled={!category || !clauseId}>Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );
}