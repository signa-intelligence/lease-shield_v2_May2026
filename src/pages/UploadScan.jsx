import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle, Loader2, FileText, History, CheckCircle2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

import LeaseUploadZone from "../components/leases/LeaseUploadZone";

export default function UploadScan() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.Lease.filter({ created_by: user?.email }, '-created_date', 5),
    enabled: !!user,
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['scans'],
    queryFn: async () => {
      const allScans = await base44.entities.LeaseScan.list();
      return allScans.filter(s => leases.some(l => l.id === s.lease_id)).sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
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

  const handleFileSelect = (e) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);

    // Check if user is authenticated
    if (!user) {
      setError(language === 'th' ? 'กรุณาเข้าสู่ระบบเพื่อสแกนสัญญาเช่า' : 'Please login to scan your lease');
      return;
    }

    const files = e.dataTransfer ? Array.from(e.dataTransfer.files) : Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // Validate all files
    const invalidFiles = [];
    const validFiles = [];
    
    files.forEach((file) => {
      const isImage = file.type.includes('image');
      const isPDF = file.type.includes('pdf');
      
      if (!isPDF && !isImage) {
        invalidFiles.push(file.name);
      } else if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setError(
        language === 'th' 
          ? `ไฟล์ไม่ถูกต้อง: ${invalidFiles.join(', ')}` 
          : `Invalid files: ${invalidFiles.join(', ')}`
      );
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      setError(language === 'th' ? 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' : 'Please select at least one file');
      return;
    }

    setUploading(true);
    setProgress(`Uploading ${selectedFiles.length} file(s)...`);

    try {
      // Determine user's plan mode for AI analysis
      const planTier = user?.plan_tier || 'free';
      const analysisMode = planTier === 'secure' ? 'Secure' : planTier === 'protect' ? 'Protect' : 'Lite';

      // Step 1: Upload all files
      console.log(`Step 1: Uploading ${selectedFiles.length} files...`);
      const uploadPromises = selectedFiles.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const uploadResults = await Promise.all(uploadPromises);
      const fileUrls = uploadResults.map(result => result.file_url);
      console.log('All files uploaded:', fileUrls);
      
      // Step 2: Create lease record with all file URLs
      setProgress('Creating lease record...');
      console.log('Step 2: Creating lease...');
      const lease = await base44.entities.Lease.create({
        file_url: fileUrls[0], // Primary file
        file_urls: fileUrls, // All files
        status: 'uploaded'
      });
      console.log('Lease created:', lease.id);

      setAnalyzing(true);
      setUploading(false);
      setProgress(`Analyzing ${selectedFiles.length} page(s) with AI...`);
      
      // Step 3: Run AI pipeline - Extract and classify clauses with ALL files
      console.log('Step 3: Running AI analysis with mode:', analysisMode);
      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are "LeaseShield-Analyzer," a meticulous Thai/English bilingual reviewer for **Thailand leases** (default). Analyze the uploaded lease text and return structured JSON only (no extra prose).

IMPORTANT: You are analyzing a multi-page lease document with ${selectedFiles.length} page(s). Review ALL pages comprehensively and combine your analysis.

OPERATING MODE:
- ${analysisMode} ∈ {Lite | Protect | Secure}
- If the document appears **commercial** (keywords: CAM, service charge, fit-out, make-good, bank guarantee, signage, reinstatement, exclusivity), say so in \`key_terms.lease_type_detected\` and still honor ${analysisMode}.

NEUTRALITY & LANGUAGE:
- Remain neutral (not pro-tenant or pro-landlord).
- This is documentation guidance, **not legal advice**.
- If the contract text is primarily Thai, respond field labels/content primarily in Thai with brief English gloss; if English, the reverse.

THAILAND RENTAL STANDARDS (CRITICAL - USE THESE AS BASELINE):
- **Deposit**: 2 months rent is STANDARD and NORMAL in Thailand (not a problem)
- **Refund Timeline**: 30 days to refund security deposit is STANDARD and NORMAL in Thailand (not a problem)
- **Advance Rent**: 1 month advance rent is standard
- Only flag deposits if they exceed 2 months or refund timelines exceed 30 days
- Focus on genuinely problematic clauses, not normal Thai rental practices

SCOPE & RULES:
1) Work **only** with the text provided. If something is missing, set a clear string like "Not specified".
2) For every flag, include a **short exact quote** (<= 60 words) in \`evidence\`.
3) Thailand residential checklist (adapt if commercial):
   - Parties & capacity; property description; term & renewal; early break; notice windows; penalties.
   - Rent/payment mechanics; late interest reasonableness (NOT normal deposit amounts).
   - Deposit & advance: 
     • Flag ONLY if deposit > 2 months rent (2 months is normal)
     • Flag ONLY if refund timeline > 30 days (30 days is normal)
     • Flag ONLY if advance rent > 1 month
     • pre/post inspection forms; itemized deductions; receipts
     • utilities at actual cost (no markup)
     • no unilateral changes or excessive penalties.
   - Utilities/fees; repairs/maintenance (wear & tear vs damage); inspections/access; use restrictions; quiet enjoyment; guests/sublets.
   - Termination & liquidated damages proportionality.
   - Deposit return timeline & itemization; interest if stated.
   - Dispute resolution (Thai courts vs arbitration); fair venue; bilingual precedence.
   - PDPA touchpoints (ID/passport copies, CCTV, purpose/retention, notices/consents).
4) Commercial add-ons (only if commercial or ${analysisMode} == "Secure"):
   - Fit-out/hand-back; make-good scope; signage; exclusivity; co-tenancy
   - CAM/service-charge definition & audit rights; indexation/escalation math
   - Liability caps & carve-outs; indemnities; insurance evidence
   - Force majeure; rent-free/abatement triggers; lockout/step-in
   - Assignment/sublease consent standards; guarantees (bank vs cash)

RISK MODEL (for each flag):
- \`severity\` ∈ {low, medium, high, critical}
- Also compute \`impact_0_10\` and \`likelihood_0_10\` (integers 0..10) and sort flags by (impact*likelihood) desc.
- Keep final JSON concise and consistent.
- DO NOT flag normal Thai practices as problems (2 month deposit, 30 day refund)

TIERING RULES:
- Lite: return **max 5 flags**, **max 3** \`missing_items\`.
- Protect: return full set of flags and **up to 10** \`missing_items\`.
- Secure: full set (+ commercial checks if applicable).

Now analyze this lease thoroughly and return JSON only.`,
        file_urls: fileUrls, // Send ALL file URLs to AI
        response_json_schema: {
          type: "object",
          properties: {
            flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  category: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  impact_0_10: { type: "integer", minimum: 0, maximum: 10 },
                  likelihood_0_10: { type: "integer", minimum: 0, maximum: 10 },
                  evidence: { type: "string" },
                  explanation: { type: "string" },
                  recommendation: { type: "string" }
                },
                required: ["id","title","category","severity","evidence","explanation","recommendation"]
              }
            },
            missing_items: {
              type: "array",
              items: { type: "string" }
            },
            key_terms: {
              type: "object",
              properties: {
                lease_type_detected: { type: "string", enum: ["residential","commercial","assumed_residential","assumed_commercial"] },
                property_address: { type: "string" },
                deposit_amount: { type: "number" },
                rent_amount: { type: "number" },
                start_date: { type: "string" },
                end_date: { type: "string" },
                landlord_scale_assumption: { type: "string", enum: ["unknown","<5_units",">=5_units"] },
                language_detected: { type: "string", enum: ["en", "th", "mixed"] }
              }
            }
          },
          required: ["flags","missing_items","key_terms"]
        }
      });
      console.log('AI analysis complete:', analysisResult);

      // Step 4: Calculate risk score and summary with portfolio approach
      setProgress('Calculating risk score...');
      console.log('Step 4: Calculating risk score...');
      const scoreResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Given the JSON array "flags" (each with severity, category, impact_0_10, likelihood_0_10),
1) Compute a portfolio risk score (0..100):
   - For each flag, base = impact_0_10 * likelihood_0_10 (0..100).
   - Map severity: low=+0, medium=+5, high=+10, critical=+15 (cap each flag at 100).
   - Global risk_score = round( min(100, average(top 5 flags by base) ) ).
   - If impact/likelihood are missing, approximate from severity: low=2/2, medium=5/5, high=7/7, critical=9/9.
2) Create a <=180 char summary (plain language).
3) Return top 5 flags as objects {severity, category, description} where description = title (short): explanation (≤120 chars).

Return JSON only.
Flags JSON:
${JSON.stringify(analysisResult.flags)}`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_score: { type: "integer", minimum: 0, maximum: 100 },
            summary: { type: "string" },
            top_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" }
                },
                required: ["severity","category","description"]
              }
            }
          },
          required: ["risk_score","summary","top_flags"]
        }
      });
      console.log('Risk score calculated:', scoreResult);

      // Step 5: Update lease with extracted data
      setProgress('Saving analysis...');
      console.log('Step 5: Updating lease...');
      await base44.entities.Lease.update(lease.id, {
        status: 'scanned',
        property_address: analysisResult.key_terms?.property_address,
        start_date: analysisResult.key_terms?.start_date,
        end_date: analysisResult.key_terms?.end_date,
        rent_amount: analysisResult.key_terms?.rent_amount,
        deposit_amount: analysisResult.key_terms?.deposit_amount,
        language_detected: analysisResult.key_terms?.language_detected
      });

      // Step 6: Create scan record with preview and full data
      console.log('Step 6: Creating scan record...');
      const scan = await base44.entities.LeaseScan.create({
        lease_id: lease.id,
        risk_score: scoreResult.risk_score,
        flags: scoreResult.top_flags || [],
        summary: scoreResult.summary,
        scan_preview: scoreResult,
        scan_full: analysisResult,
        version: 'v2'
      });
      console.log('Scan created:', scan.id);

      queryClient.invalidateQueries({ queryKey: ['leases'] });
      setSelectedFiles([]);
      
      // Step 7: Navigate to preview with state
      console.log('Step 7: Navigating to preview...');
      navigate(createPageUrl("ScanPreview") + `?scanId=${scan.id}&leaseId=${lease.id}`);
      
    } catch (err) {
      console.error('Scan error:', err);
      setError(
        language === 'th' 
          ? `การวิเคราะห์สัญญาล้มเหลว: ${err.message || 'กรุณาลองอีกครั้ง'}` 
          : `Failed to analyze lease: ${err.message || 'Please try again'}`
      );
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setProgress('');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      uploaded: "bg-amber-100 text-amber-800",
      scanned: "bg-blue-100 text-blue-800",
      paid: "bg-emerald-100 text-emerald-800"
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const handleViewLease = async (lease) => {
    // Find the scan for this lease
    const scan = scans.find(s => s.lease_id === lease.id);
    
    if (scan) {
      // Navigate to scan preview with scan and lease IDs
      navigate(createPageUrl("ScanPreview") + `?scanId=${scan.id}&leaseId=${lease.id}`);
    } else {
      // If no scan found, just show an alert
      alert(language === 'th' ? 'ไม่พบผลการสแกนสำหรับสัญญาเช่านี้' : 'Scan results not found for this lease.');
    }
  };

  const t = {
    en: {
      title: "Lease Risk Scan",
      subtitle: "AI-powered lease analysis in seconds",
      uploading: "Uploading Files...",
      analyzing: "Analyzing Agreement...",
      analyzingDesc: "Our AI is reviewing all pages of your lease for potential issues",
      pleaseWait: "Please wait",
      recentScans: "Recent Scans",
      leaseAgreement: "Lease Agreement",
      viewResults: "View Results",
      loading: "Loading...",
      selectedFiles: "Selected Files",
      analyzeButton: "Analyze Lease",
      selectMore: "Select More Files"
    },
    th: {
      title: "สแกนความเสี่ยงสัญญาเช่า",
      subtitle: "วิเคราะห์สัญญาเช่าด้วย AI ในไม่กี่วินาที",
      uploading: "กำลังอัปโหลดไฟล์...",
      analyzing: "กำลังวิเคราะห์สัญญา...",
      analyzingDesc: "AI กำลังตรวจสอบทุกหน้าของสัญญาเพื่อหาประเด็นที่อาจเป็นปัญหา",
      pleaseWait: "กรุณารอสักครู่",
      recentScans: "การสแกนล่าสุด",
      leaseAgreement: "สัญญาเช่า",
      viewResults: "ดูผลลัพธ์",
      loading: "กำลังโหลด...",
      selectedFiles: "ไฟล์ที่เลือก",
      analyzeButton: "วิเคราะห์สัญญา",
      selectMore: "เลือกไฟล์เพิ่มเติม"
    }
  };

  const strings = t[language];

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-ls-forest mr-3" />
            <p className="text-slate-600">{strings.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-7 h-7 text-ls-forest" />
            <h1 className="text-2xl md:text-3xl font-bold text-ls-charcoal">
              {strings.title}
            </h1>
          </div>
          <p className="text-slate-600">
            {strings.subtitle}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">{error}</div>
              <div className="text-xs mt-2">
                Supported formats: PDF, JPG, PNG • Max size: 10MB per file
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-xl mb-6 overflow-hidden">
          <div className="p-6 md:p-8">
            {uploading || analyzing ? (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 animate-spin text-ls-forest mx-auto mb-4" />
                <h3 className="text-xl font-bold text-ls-charcoal mb-2">
                  {uploading ? strings.uploading : strings.analyzing}
                </h3>
                <p className="text-slate-600 mb-4">
                  {analyzing ? strings.analyzingDesc : strings.pleaseWait}
                </p>
                {progress && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{progress}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <LeaseUploadZone
                  onFileSelect={handleFileSelect}
                  dragActive={dragActive}
                  onDrag={handleDrag}
                />

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-bold text-ls-charcoal mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-ls-forest" />
                      {strings.selectedFiles} ({selectedFiles.length})
                    </h3>
                    <div className="grid gap-2 mb-4">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-ls-stone rounded-lg border border-ls-forest/20">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-ls-forest flex-shrink-0" />
                            <span className="text-sm font-medium text-ls-charcoal truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-slate-500 flex-shrink-0">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAnalyze}
                        style={{
                          flex: 1,
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF',
                          padding: '14px 24px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {strings.analyzeButton}
                      </button>
                      <button
                        onClick={() => document.querySelector('input[type="file"]').click()}
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: '#0C3B2E',
                          padding: '14px 24px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          border: '2px solid #0C3B2E',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#ECEFED';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        {strings.selectMore}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {leases.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-ls-forest" />
              <h2 className="text-lg font-bold text-ls-charcoal">
                {strings.recentScans}
              </h2>
            </div>
            <div className="space-y-3">
              {leases.map((lease) => (
                <Card key={lease.id} className="p-4 border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-ls-forest" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ls-charcoal truncate">
                          {lease.property_address || strings.leaseAgreement}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-500">
                            {format(new Date(lease.created_date), 'MMM d, yyyy')}
                          </p>
                          {lease.file_urls && lease.file_urls.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {lease.file_urls.length} pages
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(lease.status)}>
                        {lease.status}
                      </Badge>
                      {(lease.status === 'scanned' || lease.status === 'paid') && (
                        <button
                          onClick={() => handleViewLease(lease)}
                          style={{
                            backgroundColor: '#0C3B2E',
                            color: '#FFFFFF',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2f25'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#0C3B2E'}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {strings.viewResults}
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}