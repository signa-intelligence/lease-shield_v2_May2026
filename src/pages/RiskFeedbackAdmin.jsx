import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AuthGuard from '../components/shared/AuthGuard';
import { Button } from '@/components/ui/button';
import PageHeader from '../components/shared/PageHeader';
import { createPageUrl } from "@/utils";

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function RiskFeedbackAdminContent() {
  const { data: items = [] } = useQuery({ queryKey: ['riskFeedback'], queryFn: () => base44.entities.RiskFeedback.list() });
  const { data: taxonomy } = useQuery({ queryKey: ['taxonomyAdmin'], queryFn: async () => {
    const { data } = await base44.functions.invoke('getTaxonomy', {});
    return data.taxonomy;
  }});

  return (
    <div className="max-w-5xl mx-auto p-4">
      <PageHeader title="Risk Feedback" showBack backRoute={createPageUrl("AdminConsole")} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => download('risk_feedback.json', JSON.stringify(items, null, 2))}>Export JSON</Button>
          <Button variant="outline" onClick={() => {
            const header = ['id','lease_id','scan_id','user_id','feedback_type','category_id','suggested_severity','status'];
            const rows = items.map(x => header.map(h => JSON.stringify(x[h] ?? '')).join(','));
            const csv = [header.join(',')].concat(rows).join('\n');
            download('risk_feedback.csv', csv);
          }}>Export CSV</Button>
        </div>
      </div>
      <div className="grid gap-3">
        {items.map(fb => (
          <div key={fb.id} className="p-3 rounded border bg-white">
            <div className="text-sm text-gray-500">{fb.feedback_type} · {fb.status}</div>
            <div className="font-medium">{fb.category_id}</div>
            <div className="text-sm">Lease: {fb.lease_id} · Scan: {fb.scan_id}</div>
            {fb.clause_ref?.snippet && <div className="text-xs mt-1 bg-gray-50 p-2 rounded">{fb.clause_ref.snippet}</div>}
            {fb.note && <div className="text-xs mt-1">Note: {fb.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RiskFeedbackAdmin() {
  return (<AuthGuard><RiskFeedbackAdminContent /></AuthGuard>);
}