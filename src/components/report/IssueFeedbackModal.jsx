import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function IssueFeedbackModal({ open, onClose, issue, onSubmit, taxonomy }) {
  const [type, setType] = React.useState('WRONG_SEVERITY');
  const [severity, setSeverity] = React.useState('MEDIUM');
  const [note, setNote] = React.useState('');

  if (!open || !issue) return null;
  const clauseRef = (issue.clause_refs && issue.clause_refs[0]) || {};

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-2">Tell us what's wrong</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Feedback type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WRONG_SEVERITY">Wrong severity</SelectItem>
                <SelectItem value="NOT_APPLICABLE">Not applicable</SelectItem>
                <SelectItem value="WRONG_INTERPRETATION">Incorrect interpretation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === 'WRONG_SEVERITY' && (
            <div>
              <label className="text-sm font-medium">Correct severity</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="LOW">LOW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea className="mt-1" rows={3} value={note} onChange={e=>setNote(e.target.value)} />
          </div>
          <div className="text-xs p-2 rounded bg-gray-50">Clause: [{clauseRef.clause_id}] {clauseRef.snippet}</div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSubmit({
              feedback_type: type,
              suggested_severity: type === 'WRONG_SEVERITY' ? severity : null,
              note
            })}>Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );
}