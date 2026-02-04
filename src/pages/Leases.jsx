import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, AlertCircle, Loader2, Trash2 } from "lucide-react"; // Added Trash2
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import LeaseUploadZone from "../components/leases/LeaseUploadZone";
import LeaseAnalysisResults from "../components/leases/LeaseAnalysisResults";

// External scanning API base (set your domain here)
const EXTERNAL_API_BASE = 'https://<my-api-domain>';
// Try to retrieve Base44 JWT from common locations
const getAuthToken = () =>
  localStorage.getItem('base44_jwt') ||
  localStorage.getItem('jwt') ||
  localStorage.getItem('token');

export default function Leases() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentScan, setCurrentScan] = useState(null);
  const [error, setError] = useState(null);
  const [deletingLease, setDeletingLease] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
    loaderBg: '#353A3D',
    uploadZoneBg: '#2A2D30', // Changed from outline's '#ECEFED' to match Card background for dark theme consistently, or could use '#ECEFED' if it's meant to be brighter
    leaseCardBg: '#353A3D',
    leaseCardHover: '#3A3D40'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
    loaderBg: '#F8FAFC',
    uploadZoneBg: '#FFFFFF',
    leaseCardBg: '#FFFFFF',
    leaseCardHover: '#F9FAFB'
  };

  const t = {
    en: {
      myLeases: "My Leases",
      uploadAnalyze: "Upload and analyse your rental agreements",
      uploadingLease: "Uploading Lease...",
      analyzingAgreement: "Analysing Agreement...",
      systemReviewing: "Our system is reviewing your lease for potential issues",
      pleaseWait: "Please wait",
      previousLeases: "Previous Leases",
      leaseAgreement: "Lease Agreement",
      month: "month",
      language: "Language",
      pages: "pages",
      uploaded: "Uploaded",
      viewDetails: "View Details",
      uploadPDFImage: "Please upload a PDF, image, or Word document",
      failedAnalyse: "Failed to analyse lease. Please try again.",
      scanNotFound: "Scan results not found for this lease."
    },
    th: {
      myLeases: "สัญญาเช่าของฉัน",
      uploadAnalyze: "อัปโหลดและวิเคราะห์สัญญาเช่าของคุณ",
      uploadingLease: "กำลังอัปโหลดสัญญาเช่า...",
      analyzingAgreement: "กำลังวิเคราะห์สัญญา...",
      aiReviewing: "ระบบกำลังตรวจสอบสัญญาเช่าของคุณเพื่อหาปัญหาที่อาจเกิดขึ้น",
      pleaseWait: "กรุณารอสักครู่",
      previousLeases: "สัญญาเช่าก่อนหน้า",
      leaseAgreement: "สัญญาเช่า",
      month: "เดือน",
      language: "ภาษา",
      pages: "หน้า",
      uploaded: "อัปโหลดเมื่อ",
      viewDetails: "ดูรายละเอียด",
      uploadPDFImage: "กรุณาอัปโหลดไฟล์ PDF, รูปภาพ หรือเอกสาร Word",
      failedAnalyze: "ไม่สามารถวิเคราะห์สัญญาเช่าได้ กรุณาลองอีกครั้ง",
      scanNotFound: "ไม่พบผลการสแกนสำหรับสัญญาเช่านี้"
    }
  };

  const strings = t[language];

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: async () => {
      const allScans = await base44.entities.LeaseScan.list();
      return allScans.filter(s => leases.some(l => l.id === s.lease_id));
    },
    enabled: !!user && leases.length > 0,
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileSelect = async (e) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);

    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check if it's a Word document
    const isWordDoc = file.name.toLowerCase().endsWith('.doc') || 
                      file.name.toLowerCase().endsWith('.docx') ||
                      file.type.includes('msword') ||
                      file.type.includes('wordprocessingml');
    
    // Updated validation to include Word documents
    const isValidType = file.type.includes('pdf') || 
                        file.type.includes('image') || 
                        isWordDoc;
    
    if (!isValidType) {
      setError(strings.uploadPDFImage);
      return;
    }

    // Show warning for Word documents
    if (isWordDoc) {
      const proceed = confirm(
        language === 'th' 
          ? 'ไฟล์ Word อาจมีปัญหาในการวิเคราะห์\n\nเราแนะนำให้:\n1. แปลงเป็น PDF ก่อน หรือ\n2. ถ่ายภาพหน้าสัญญาแทน\n\nต้องการดำเนินการต่อหรือไม่?'
          : 'Word files may have analysis issues\n\nWe recommend:\n1. Convert to PDF first, or\n2. Take photos of lease pages\n\nProceed anyway?'
      );
      
      if (!proceed) {
        return;
      }
    }

    setUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const lease = await base44.entities.Lease.create({
        file_url,
        status: 'uploaded'
      });

      setAnalyzing(true);
      setUploading(false);

      // 1) Create a LeaseScan record to obtain scanId
      const newScan = await base44.entities.LeaseScan.create({ lease_id: lease.id });

      // 2) Kick off external scan job
      const token = getAuthToken();
      const startRes = await fetch(`${EXTERNAL_API_BASE}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ leaseId: lease.id, scanId: newScan.id, fileUrl: file_url, language })
      });

      const startBody = await startRes.json().catch(() => null);
      if (!startRes.ok) {
        const msg = startBody?.message || `External scan start failed (${startRes.status})`;
        throw new Error(`${startBody?.error_code || 'SCAN_START_ERROR'} [${startBody?.step || 'START'}]: ${msg}`);
      }
      const jobId = startBody?.jobId;
      if (!jobId) {
        throw new Error('SCAN_START_ERROR [START]: Missing jobId from external API');
      }

      // 3) Poll for job status with backoff (2s → exp to 30s, then 5s)
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let delay = 2000;
      let elapsed = 0;
      let final = null;

      while (true) {
        const statusRes = await fetch(`${EXTERNAL_API_BASE}/scan/${jobId}`, {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        const body = await statusRes.json().catch(() => ({}));
        if (!statusRes.ok) {
          // Persist debugLog if present and surface structured error
          if (body?.debugLog) {
            await base44.entities.LeaseScan.update(newScan.id, { scan_full: { debugLog: body.debugLog } });
          }
          const msg = body?.message || `Status check failed (${statusRes.status})`;
          throw new Error(`${body?.error_code || 'SCAN_STATUS_ERROR'} [${body?.step || 'POLL'}]: ${msg}`);
        }

        const status = body?.status || (body?.ok ? 'done' : 'pending');
        if (status === 'done' || body?.ok === true) {
          final = body?.result || body;
          break;
        }
        if (status === 'failed' || body?.ok === false) {
          if (body?.debugLog) {
            await base44.entities.LeaseScan.update(newScan.id, { scan_full: { debugLog: body.debugLog } });
          }
          const msg = `${body?.error_code || 'SCAN_ERROR'} [${body?.step || 'ANALYSIS'}]: ${body?.message || 'Scan failed'}`;
          throw new Error(msg);
        }

        await sleep(delay);
        elapsed += delay;
        delay = elapsed < 30000 ? Math.min(Math.round(delay * 1.5), 5000) : 5000;
      }

      // 4) Persist results into LeaseScan.scan_full
      const {
        clauses_extracted = [],
        clause_ledger = [],
        issues_validated = [],
        flags = [],
        summary = '',
        canonical_report = null,
        pipeline = [],
        debugLog = null,
        risk_score
      } = final || {};

      await base44.entities.LeaseScan.update(newScan.id, {
        flags,
        summary,
        risk_score: typeof risk_score === 'number' ? risk_score : 0,
        scan_full: {
          clauses_extracted,
          clause_ledger,
          issues_validated,
          flags,
          summary,
          canonical_report,
          pipeline,
          debugLog
        }
      });

      // Mark lease as scanned
      await base44.entities.Lease.update(lease.id, { status: 'scanned' });

      // 5) Load persisted scan for UI
      const refetched = await base44.entities.LeaseScan.filter({ id: newScan.id });
      const scan = refetched?.[0];
      setCurrentScan(scan);
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      
    } catch (err) {
    console.error('Lease analysis error:', err);
    const msg = err?.message || strings.failedAnalyse;
    setError(msg);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSaveScan = () => {
    setCurrentScan(null);
    queryClient.invalidateQueries({ queryKey: ['leases'] });
  };

  const handleViewDetails = (lease) => {
    // Find the scan for this lease
    const scan = scans.find(s => s.lease_id === lease.id);
    
    if (scan) {
      // Navigate to scan preview
      navigate(createPageUrl("ScanPreview") + `?scanId=${scan.id}&leaseId=${lease.id}`);
    } else {
      // If no scan found, alert user
      alert(strings.scanNotFound);
    }
  };

  const deleteLeaseWithScanMutation = useMutation({
    mutationFn: async (leaseId) => {
      // Call backend function for cascade deletion
      const response = await base44.functions.invoke('deleteLease', { leaseId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['timelineEvents'] });
      setDeletingLease(null);
    },
    onError: (error) => {
      const errorMsg = error?.message || (language === 'th' ? 'ไม่สามารถลบสัญญาเช่าได้' : 'Failed to delete lease');
      setError(errorMsg);
      setDeletingLease(null);
    }
  });

  const handleDeleteLease = (lease, e) => {
    e.stopPropagation();
    setDeletingLease(lease);
  };

  const confirmDeleteLease = () => {
    if (!deletingLease) return;
    deleteLeaseWithScanMutation.mutate(deletingLease.id);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      uploaded: "bg-amber-100 text-amber-800",
      scanned: "bg-blue-100 text-blue-800",
      paid: "bg-emerald-100 text-emerald-800"
    };
    return statusColors[status] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{strings.myLeases}</h1>
          </div>
          <p style={{ color: colors.textSecondary }}>{strings.uploadAnalyze}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 whitespace-pre-wrap"> {/* Added whitespace-pre-wrap */}
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!currentScan ? (
          <>
            <Card className="border-none shadow-xl mb-8 overflow-hidden" style={{ 
              backgroundColor: isDarkMode ? colors.cardBg : colors.uploadZoneBg,
              border: isDarkMode ? `1px solid ${colors.borderColor}` : 'none'
            }}>
              <div className="p-8">
                {uploading || analyzing ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {uploading ? strings.uploadingLease : strings.analyzingAgreement}
                    </h3>
                    <p style={{ color: colors.textSecondary }}>
                      {analyzing ? strings.systemReviewing : strings.pleaseWait}
                    </p>
                  </div>
                ) : (
                  <LeaseUploadZone
                    onFileSelect={handleFileSelect}
                    dragActive={dragActive}
                    onDrag={handleDrag}
                  />
                )}
              </div>
            </Card>

            {leases.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>{strings.previousLeases}</h2>
                <div className="grid gap-4">
                  {leases.map((lease) => (
                    <Card 
                      key={lease.id} 
                      className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer" 
                      style={{ 
                        backgroundColor: colors.leaseCardBg,
                        borderColor: colors.borderColor,
                        border: isDarkMode ? `1px solid ${colors.borderColor}` : 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.leaseCardHover;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.leaseCardBg;
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      onClick={() => handleViewDetails(lease)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold mb-1" style={{ color: colors.textPrimary }}>
                              {lease.property_address || strings.leaseAgreement}
                            </h3>
                            {lease.rent_amount && (
                              <p className="mb-2" style={{ color: colors.textSecondary }}>
                                ฿{lease.rent_amount.toLocaleString()}/{strings.month}
                              </p>
                            )}
                            <div className="flex gap-2 text-sm mb-2" style={{ color: colors.textSecondary }}>
                              {lease.language_detected && (
                                <span>• {strings.language}: {lease.language_detected.toUpperCase()}</span>
                              )}
                              {lease.file_urls && lease.file_urls.length > 1 && (
                                <span>• {lease.file_urls.length} {strings.pages}</span>
                              )}
                            </div>
                            <p className="text-xs" style={{ color: colors.textSecondary, opacity: 0.7 }}>
                              {strings.uploaded}: {format(new Date(lease.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={getStatusColor(lease.status)}>
                              {lease.status}
                            </Badge>
                            <div className="flex gap-2">
                              {(lease.status === 'scanned' || lease.status === 'paid') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(lease);
                                  }}
                                  style={{
                                    backgroundColor: '#3B82F6',
                                    color: '#FFFFFF',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    e.target.style.backgroundColor = '#2563EB';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.stopPropagation();
                                    e.target.style.backgroundColor = '#3B82F6';
                                  }}
                                >
                                  {strings.viewDetails}
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteLease(lease, e)}
                                disabled={deleteLeaseWithScanMutation.isPending}
                                style={{
                                  backgroundColor: isDarkMode ? '#3A2626' : '#FEE2E2',
                                  color: '#EF4444',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  border: 'none',
                                  cursor: deleteLeaseWithScanMutation.isPending ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  opacity: deleteLeaseWithScanMutation.isPending ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  if (!deleteLeaseWithScanMutation.isPending) {
                                    e.target.style.backgroundColor = '#DC2626';
                                    e.target.style.color = '#FFFFFF';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.stopPropagation();
                                  if (!deleteLeaseWithScanMutation.isPending) {
                                    e.target.style.backgroundColor = isDarkMode ? '#3A2626' : '#FEE2E2';
                                    e.target.style.color = '#EF4444';
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <LeaseAnalysisResults scan={currentScan} onSave={handleSaveScan} />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingLease} onOpenChange={() => setDeletingLease(null)}>
          <DialogContent
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
              maxWidth: '500px'
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'ลบสัญญาเช่าและข้อมูลที่เกี่ยวข้อง?' : 'Delete lease and related data?'}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: isDarkMode ? '#3A2626' : '#FEF2F2', border: '1px solid #EF4444' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#DC2626' }}>
                  {language === 'th' ? '⚠️ การดำเนินการนี้จะลบ:' : '⚠️ This will delete:'}
                </p>
                <ul className="text-sm space-y-1 ml-4" style={{ color: colors.textSecondary }}>
                  <li>• {language === 'th' ? 'สัญญาเช่าและการสแกน' : 'Lease and scan results'}</li>
                  <li>• {language === 'th' ? 'ข้อมูลเงินมัดจำและค่าเช่า' : 'Deposit and rent trackers'}</li>
                  <li>• {language === 'th' ? 'กิจกรรมทั้งหมดในไทม์ไลน์' : 'All timeline events'}</li>
                </ul>
              </div>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                {language === 'th' 
                  ? 'ข้อมูลจะถูกย้ายไปถังรีไซเคิล คุณแน่ใจหรือไม่?'
                  : 'Data will be moved to Recycle Bin. Are you sure?'}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeletingLease(null)}
                  className="flex-1"
                  style={{ minHeight: '44px' }}
                >
                  {language === 'th' ? 'ยกเลิก' : 'No'}
                </Button>
                <Button
                  onClick={confirmDeleteLease}
                  disabled={deleteLeaseWithScanMutation.isPending}
                  className="flex-1"
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    minHeight: '44px'
                  }}
                >
                  {deleteLeaseWithScanMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'th' ? 'กำลังลบ...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {language === 'th' ? 'ใช่ ลบทั้งหมด' : 'Yes, Delete All'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}