import React from "react";
import { useSearchParams } from "react-router-dom";
import AuthGuard from "../components/shared/AuthGuard";
import MissingParams from "../components/report/MissingParams";
import ReportFullInner from "../components/report/ReportFullInner";

export default function ReportFull() {
  const [params] = useSearchParams();
  const scanId = (params.get('scanId') || params.get('scanid') || params.get('scan_id') || '').trim();
  const leaseId = (params.get('leaseId') || params.get('leaseid') || params.get('lease_id') || '').trim();

  const hasParams = Boolean(scanId && leaseId);

  return (
    <AuthGuard>
      {hasParams ? (
        <ReportFullInner scanId={scanId} leaseId={leaseId} />
      ) : (
        <MissingParams />
      )}
    </AuthGuard>
  );
}