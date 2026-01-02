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

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-2">Report a missed risk</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {cats.map(c => <SelectItem key={c.category_id} value={c.category_id}>{c.category_id} — {c.name_en}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Clause</label>
            <Select value={clauseId} onValueChange={setClauseId}>
              <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select a clause" /></SelectTrigger>
              <SelectContent>
                {(clauses||[]).map(c => <SelectItem key={c.clause_id} value={c.clause_id}>[{c.clause_id}] p{c.page_number||1}</SelectItem>)}
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