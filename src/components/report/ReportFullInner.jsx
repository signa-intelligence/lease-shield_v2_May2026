/******************************************************************************
 * ⚠️ PRODUCTION CODE - FROZEN - DO NOT MODIFY ⚠️
 * 
 * Last Working State: February 22, 2026
 * Status: PRODUCTION READY - LAUNCHING TO CUSTOMERS
 * Version: 1.0.0
 * 
 * Features working:
 * - Tier-based clause display (Lite=5, Protect/Secure=all) ✅
 * - Preview mode upgrade prompts ✅
 * - Executive summary generation ✅
 * - Risk scoring and categorization ✅
 * - PDF export (paid tiers) ✅
 * - Multi-language support ✅
 * 
 * CRITICAL: Tier filtering logic determines user experience value
 * 
 * Change process: See CHANGE_REQUEST_TEMPLATE.md
 ******************************************************************************/

import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Wrench
} from "lucide-react";
import ErrorPanel from "./ErrorPanel";
import { severityPalette, highestSeverity } from "../shared/severityPalette";
import MissingCriticalClauses from "../leases/MissingCriticalClauses";


const SEVERITY_CONFIG = {
  none: { label: "NO RISK", icon: CheckCircle2, palette: severityPalette.none },
  low: { label: "Low", icon: Info, palette: severityPalette.low },
  medium: { label: "Medium", icon: AlertTriangle, palette: severityPalette.medium },
  high: { label: "High", icon: AlertTriangle, palette: severityPalette.high },
  critical: { label: "Critical", icon: AlertCircle, palette: severityPalette.critical }
};


// Single recommendation per clause — no padding, no generic defaults
function resolveRecommendation(recValue) {
  if (Array.isArray(recValue)) {
    return String(recValue[0] || '').trim();
  }
  return String(recValue || '').trim();
}

// Build detailed executive summary with next steps and timeline
function buildExecutiveSummary(riskScore, topRisks, clauses, existingSummary, language) {
  const score = riskScore || 0;
  const riskyClausesCount = (clauses || []).filter(c => c.risk_level && c.risk_level !== 'none').length;
  const criticalCount = (clauses || []).filter(c => c.risk_level === 'critical').length;
  const highCount = (clauses || []).filter(c => c.risk_level === 'high').length;
  const mediumCount = (clauses || []).filter(c => c.risk_level === 'medium').length;
  
  // For non-en/th languages (zh, ja, ko, ru), prefer the AI-generated summary
  // which is already in the user's language from the OpenAI prompt
  if (language !== 'en' && language !== 'th' && existingSummary && existingSummary.length > 50) {
    return existingSummary;
  }
  
  const isThaiLang = language === 'th';
  let summary = '';
  
  if (score >= 70) {
    if (isThaiLang) {
      summary = `สัญญาเช่าความเสี่ยงสูง (คะแนน: ${score}/100)\n\n`;
      summary += `สัญญาเช่านี้มีความเสี่ยงสูงและมีข้อที่ต้องพิจารณาอย่างรอบคอบก่อนลงนาม `;
      if (criticalCount > 0) summary += `ข้อวิกฤตอาจมีปัญหาทางกฎหมาย `;
      if (highCount > 0) summary += `ข้อเสี่ยงสูงอาจส่งผลกระทบต่อสิทธิของคุณ `;
      
      summary += `\n\nการวิเคราะห์โดยละเอียด:\nสัญญานี้มีข้อกำหนดหลายข้อที่เอื้อประโยชน์ต่อเจ้าของบ้านอย่างชัดเจน โดยลดการปกป้องสิทธิพื้นฐานของผู้เช่า ข้อวิกฤตอาจรวมถึงข้อจำกัดการใช้ทรัพย์สิน เงื่อนไขการคืนเงินมัดจำที่เข้มงวด หรือการระงับข้อพิพาทที่ไม่เป็นธรรม ข้อเหล่านี้อาจไม่สอดคล้องกับกฎหมายคุ้มครองผู้บริโภคหรือหลักความยุติธรรมพื้นฐาน\n\n`;
      
      summary += `ขั้นตอนถัดไปที่แนะนำ:\n`;
      summary += `1. ระบุข้อที่มีปัญหาทั้งหมดและบันทึกหลักฐานไว้\n`;
      summary += `2. ใช้ Letter Templates ของ Lease Shield เพื่อเจรจาแก้ไขข้อที่มีปัญหา\n`;
      summary += `3. บันทึกการสื่อสารทั้งหมดเป็นลายลักษณ์อักษร\n`;
      summary += `4. พิจารณาหาทรัพย์สินทางเลือกหากเจ้าของบ้านไม่ยอมแก้ไข\n\n`;
      
      summary += `ไทม์ไลน์:\n`;
      summary += `• ภายใน 24 ชั่วโมง: ทบทวนข้อวิกฤตและข้อเสี่ยงสูงทั้งหมด\n`;
      summary += `• ภายใน 48 ชั่วโมง: ใช้ Letter Templates เพื่อร่างข้อเสนอการแก้ไข\n`;
      summary += `• ภายใน 72 ชั่วโมง: นัดหมายเจรจากับเจ้าของบ้านหรือพิจารณาทางเลือกอื่น\n\n`;
      
      summary += `⚠️ คำแนะนำสำคัญ: อย่าลงนามในสัญญานี้ในรูปแบบปัจจุบัน ใช้ Letter Templates ของ Lease Shield เพื่อเจรจาแก้ไขข้อที่มีความเสี่ยงสูง`;
    } else {
      summary = `HIGH RISK LEASE AGREEMENT (Score: ${score}/100)\n\n`;
      summary += `This lease agreement is exceptionally HIGH RISK and contains clauses that require careful attention before signing. `;
      if (criticalCount > 0) {
        summary += `Critical clauses may be legally problematic or heavily favor the landlord while stripping the tenant of basic protections. `;
      }
      if (highCount > 0) {
        summary += `High-risk clauses could significantly impact your rights as a tenant. `;
      }
      if (topRisks && topRisks.length > 0) {
        summary += `\n\nKey concerns include: ${topRisks.slice(0, 3).map(r => typeof r === 'string' ? r : r.title).join('; ')}. `;
      }
      
      summary += `\n\nDetailed Analysis:\nThis lease contains several provisions that significantly favor the landlord, reducing fundamental tenant protections. Critical issues may include excessive property use restrictions, harsh deposit return conditions, or unfair dispute resolution clauses. These terms may not align with consumer protection laws or basic fairness principles.\n\n`;
      
      summary += `Recommended Next Steps:\n`;
      summary += `1. Identify all problematic clauses and document your concerns\n`;
      summary += `2. Use Lease Shield's Letter Templates to draft negotiation proposals\n`;
      summary += `3. Request written modifications to high-risk clauses before signing\n`;
      summary += `4. Consider alternative properties if landlord refuses to negotiate\n\n`;
      
      summary += `Timeline Recommendations:\n`;
      summary += `• Within 24 hours: Review all critical and high-risk clauses in detail\n`;
      summary += `• Within 48 hours: Use our Letter Templates to draft negotiation proposals\n`;
      summary += `• Within 72 hours: Schedule negotiation meeting with landlord or consider alternatives\n\n`;
      
      summary += `⚠️ RECOMMENDATION: Do NOT sign this lease in its current form. Use Lease Shield's Letter Templates to negotiate removal or modification of high-risk clauses before proceeding.`;
    }
  } else if (score >= 40) {
    if (isThaiLang) {
      summary = `สัญญาเช่าความเสี่ยงปานกลาง (คะแนน: ${score}/100)\n\n`;
      summary += `สัญญาเช่านี้มีข้อที่ควรตรวจสอบและอาจต้องเจรจา `;
      summary += `แม้ว่าจะไม่ถึงกับอันตรายในทันที แต่บางข้อกำหนดอาจส่งผลกระทบต่อสิทธิของคุณระหว่างการเช่า `;
      
      summary += `\n\nการวิเคราะห์เพิ่มเติม:\nสัญญานี้มีความสมดุลในระดับหนึ่ง แต่มีข้อที่อาจก่อให้เกิดปัญหาในอนาคต โดยเฉพาะในเรื่องการบำรุงรักษา ค่าธรรมเนียมเพิ่มเติม หรือเงื่อนไขการยกเลิกสัญญา การทำความเข้าใจข้อเหล่านี้อย่างละเอียดจะช่วยป้องกันข้อขัดแย้งในภายหลัง\n\n`;
      
      summary += `ขั้นตอนถัดไปที่แนะนำ:\n`;
      summary += `1. ทบทวนข้อที่ถูกทำเครื่องหมายทั้งหมดอย่างละเอียด\n`;
      summary += `2. ขอคำชี้แจงเป็นลายลักษณ์อักษรสำหรับข้อที่ไม่ชัดเจน\n`;
      summary += `3. พิจารณาเจรจาแก้ไขข้อที่เสี่ยงปานกลางถึงสูง\n`;
      summary += `4. บันทึกข้อตกลงทางวาจาทั้งหมดเป็นลายลักษณ์อักษร\n\n`;
      
      summary += `ไทม์ไลน์:\n`;
      summary += `• ภายใน 48 ชั่วโมง: ทบทวนข้อที่มีความเสี่ยงปานกลางถึงสูง\n`;
      summary += `• ภายใน 72 ชั่วโมง: ขอคำชี้แจงจากเจ้าของบ้านเป็นลายลักษณ์อักษร\n`;
      summary += `• ก่อนลงนาม: ทำข้อตกลงเป็นลายลักษณ์อักษรและบันทึกไว้\n\n`;
      
      summary += `คำแนะนำ: ตรวจสอบข้อที่ถูกทำเครื่องหมายอย่างละเอียดและพิจารณาเจรจาแก้ไขก่อนลงนาม บันทึกข้อตกลงทางวาจาทั้งหมดเป็นลายลักษณ์อักษร`;
    } else {
      summary = `MEDIUM RISK LEASE AGREEMENT (Score: ${score}/100)\n\n`;
      summary += `This lease agreement contains clauses that warrant review and possible negotiation. `;
      summary += `While not immediately dangerous, several provisions could impact your rights during the tenancy. `;
      if (topRisks && topRisks.length > 0) {
        summary += `\n\nAreas requiring attention: ${topRisks.slice(0, 3).map(r => typeof r === 'string' ? r : r.title).join('; ')}. `;
      }
      
      summary += `\n\nDetailed Analysis:\nThis lease shows moderate balance but includes provisions that may cause future issues, particularly regarding maintenance responsibilities, additional fees, or termination conditions. Understanding these clauses thoroughly will help prevent disputes later in the tenancy.\n\n`;
      
      summary += `Recommended Next Steps:\n`;
      summary += `1. Review all flagged clauses in detail\n`;
      summary += `2. Request written clarification for any unclear terms\n`;
      summary += `3. Consider negotiating modifications to medium and high-risk clauses\n`;
      summary += `4. Document all verbal agreements in writing\n\n`;
      
      summary += `Timeline Recommendations:\n`;
      summary += `• Within 48 hours: Review all medium and high-risk clauses\n`;
      summary += `• Within 72 hours: Request written clarifications from landlord\n`;
      summary += `• Before signing: Ensure all agreements are documented in writing\n\n`;
      
      summary += `RECOMMENDATION: Review the flagged clauses carefully and consider negotiating modifications before signing. Document all verbal agreements in writing.`;
    }
  } else {
    if (isThaiLang) {
      summary = `สัญญาเช่าความเสี่ยงต่ำ (คะแนน: ${score}/100)\n\n`;
      summary += `สัญญาเช่านี้ค่อนข้างสมดุลโดยมี ${riskyClausesCount || 'ไม่กี่'} ข้อที่ต้องให้ความสนใจ `;
      summary += `ข้อกำหนดโดยทั่วไปเป็นมาตรฐานสำหรับสัญญาเช่า `;
      
      summary += `\n\nการวิเคราะห์เพิ่มเติม:\nสัญญานี้แสดงให้เห็นถึงความสมดุลที่ดีระหว่างสิทธิของผู้เช่าและเจ้าของบ้าน ข้อกำหนดส่วนใหญ่เป็นไปตามแนวทางปฏิบัติมาตรฐานในอุตสาหกรรม อย่างไรก็ตาม ยังคงสำคัญที่จะต้องทำความเข้าใจภาระผูกพันของคุณอย่างครบถ้วน\n\n`;
      
      summary += `ขั้นตอนถัดไปที่แนะนำ:\n`;
      summary += `1. อ่านสัญญาทั้งหมดอย่างละเอียดเพื่อให้แน่ใจว่าคุณเข้าใจทุกข้อ\n`;
      summary += `2. บันทึกภาพหรือสำเนาเอกสารทั้งหมดไว้เป็นหลักฐาน\n`;
      summary += `3. ตรวจสอบสภาพทรัพย์สินและจัดทำรายการตรวจสอบก่อนเข้าอยู่\n`;
      summary += `4. เก็บบันทึกการสื่อสารทั้งหมดกับเจ้าของบ้านตลอดการเช่า\n\n`;
      
      summary += `ไทม์ไลน์:\n`;
      summary += `• ก่อนลงนาม: อ่านสัญญาทั้งหมดอย่างละเอียด\n`;
      summary += `• วันเข้าอยู่: ตรวจสอบสภาพและถ่ายรูปทุกห้อง\n`;
      summary += `• สัปดาห์แรก: ยืนยันรายการตรวจสอบกับเจ้าของบ้าน\n\n`;
      
      summary += `คำแนะนำ: ตรวจสอบทุกข้อเพื่อให้แน่ใจว่าคุณเข้าใจภาระผูกพันของคุณ เก็บสำเนาเอกสารทั้งหมดและบันทึกตลอดการเช่า`;
    } else {
      summary = `LOW RISK LEASE AGREEMENT (Score: ${score}/100)\n\n`;
      summary += `This lease agreement appears to be relatively balanced with ${riskyClausesCount || 'few'} clauses requiring attention. `;
      summary += `The terms are generally standard for rental agreements. `;
      
      summary += `\n\nDetailed Analysis:\nThis lease demonstrates good balance between tenant and landlord rights. Most terms follow industry-standard practices. However, it remains important to fully understand your obligations and ensure all agreed-upon terms are documented in writing.\n\n`;
      
      summary += `Recommended Next Steps:\n`;
      summary += `1. Read through the entire lease carefully to ensure you understand all terms\n`;
      summary += `2. Take photos or copies of all documents for your records\n`;
      summary += `3. Conduct move-in inspection and create detailed condition checklist\n`;
      summary += `4. Maintain records of all communications with landlord throughout tenancy\n\n`;
      
      summary += `Timeline Recommendations:\n`;
      summary += `• Before signing: Read entire lease thoroughly\n`;
      summary += `• Move-in day: Document property condition with photos of every room\n`;
      summary += `• First week: Confirm condition checklist with landlord\n\n`;
      
      summary += `RECOMMENDATION: Review all clauses to ensure you understand your obligations. Keep a copy of all documents and maintain records throughout your tenancy.`;
    }
  }
  
  return summary;
}


function getRiskLevel(score) {
  if ((score || 0) >= 70) return { level: "high", label: "HIGH RISK", color: "#EF4444", bg: "#FEE2E2" };
  if ((score || 0) >= 40) return { level: "medium", label: "MEDIUM RISK", color: "#F59E0B", bg: "#FEF3C7" };
  return { level: "low", label: "LOW RISK", color: "#10B981", bg: "#D1FAE5" };
}


function toSeverity(riskLevel) {
  const rl = String(riskLevel || "").toLowerCase();
  if (rl === "critical") return "critical";
  if (rl === "high") return "high";
  if (rl === "medium") return "medium";
  if (rl === "low") return "low";
  if (rl === "none" || rl === "no_risk") return "none";
  return "medium";
}


function safeArray(x) {
  return Array.isArray(x) ? x : [];
}


function deriveIssuesValidatedFromLedger(ledger) {
  const l = safeArray(ledger);
  const hasRiskItems = l.some((c) => Array.isArray(c?.risk_items) && c.risk_items.length > 0);


  if (hasRiskItems) {
    return l.flatMap((c) =>
      safeArray(c.risk_items).map((r) => ({
        clause_id: c.clause_id,
        clause_number: c.clause_number,
        page_number: c.page_number,
        risk_level: r.risk_level,
        taxonomy_code: r.taxonomy_code,
        title: r.title,
        rationale: r.rationale,
        recommended_actions: safeArray(r.recommended_actions),
        confidence: r.confidence
      }))
    );
  }


  // legacy-ish: one risk per clause
  return l
    .filter((c) => c?.risk_level && String(c.risk_level).toUpperCase() !== "NO_RISK")
    .map((c) => ({
      clause_id: c.clause_id,
      clause_number: c.clause_number,
      page_number: c.page_number,
      risk_level: c.risk_level,
      taxonomy_code: c.taxonomy_code || "Unclassified",
      title: c.title || c.heading || `Clause ${c.clause_number || ""}`.trim(),
      rationale: c.rationale || c.risk_summary || "",
      recommended_actions: safeArray(c.recommended_actions),
      confidence: c.confidence || "LOW"
    }));
}


/**
 * MATERIALIZE RESOLUTION:
 * Prefer scan_full.* (new), then scan_full.canonical_report.pdfPayload (legacy report),
 * then scan_full.canonical_report.* (legacy objects).
 *
 * Returns a "pdfPayload-like" object that this component already expects downstream.
 */
function resolvePdfPayload({ scanData, leaseData, requestId }) {
  const scanFull = scanData?.scan_full || {};
  const canonical = scanFull?.canonical_report || {};
  const canonicalPdf = canonical?.pdfPayload || null;


  // NEW PIPELINE (preferred)
  const clausesExtracted =
    scanFull?.clauses_extracted ??
    canonical?.clauses_extracted ??
    [];
  const clauseLedger =
    scanFull?.clause_ledger ??
    canonical?.clause_ledger ??
    [];
  let issuesValidated =
    scanFull?.issues_validated ??
    canonical?.issues_validated ??
    [];


  // If we have a canonical pdfPayload, we can build from it even if scan_full keys are missing.
  if ((!safeArray(clauseLedger).length || !safeArray(issuesValidated).length) && canonicalPdf) {
    const pdfLedger = safeArray(canonicalPdf.clause_ledger);
    const pdfFlags = safeArray(canonicalPdf.flags);


    // If ledger is missing, use the pdf ledger
    const resolvedLedger = safeArray(clauseLedger).length ? clauseLedger : pdfLedger;


    // issues_validated: if missing, derive from ledger risk_items or fallback to pdf flags
    let resolvedIssues = safeArray(issuesValidated);
    if (!resolvedIssues.length && safeArray(resolvedLedger).length) {
      resolvedIssues = deriveIssuesValidatedFromLedger(resolvedLedger);
    }
    if (!resolvedIssues.length && pdfFlags.length) {
      // map pdf flags to issues_validated-ish
      resolvedIssues = pdfFlags.map((f) => ({
        clause_id: f.clause_id,
        clause_number: null,
        page_number: null,
        risk_level: f.severity,
        taxonomy_code: f.category || "Unclassified",
        title: f.title || "Issue detected",
        rationale: f.description || f.explanation || "",
        recommended_actions: String(f.recommendation || "")
          .split(/[\n•\-–]/g)
          .map((s) => s.trim())
          .filter(Boolean),
        confidence: "LOW"
      }));
    }


    // Build a pdfPayload-like shape
    const nowIso = new Date().toISOString();
    return {
      lease_address:
        canonicalPdf.lease_address ||
        scanFull?.key_terms?.property_address ||
        leaseData?.property_address ||
        scanData?.lease_id ||
        "Lease Agreement",
      generated_date: canonicalPdf.generated_date || nowIso,
      risk_score: canonicalPdf.risk_score || scanData?.risk_score || 0,
      summary: canonicalPdf.summary || scanData?.summary || "",
      key_terms: canonicalPdf.key_terms || scanFull?.key_terms || {},
      // IMPORTANT: downstream code expects flags[]; we will rebuild flags from issues_validated
      // so risks + recs always exist.
      flags: [],
      clause_review: safeArray(canonicalPdf.clause_review),
      clause_ledger: resolvedLedger,
      mappings: safeArray(canonicalPdf.mappings),
      missing_clauses: safeArray(canonicalPdf.missing_clauses),
      coverage_summary: canonicalPdf.coverage_summary || {},
      fallback: true,
      fallback_reason: "client_materialize_from_canonical_pdf",
      materialized_at: nowIso,
      requestId,
      __resolved: {
        clauses_extracted: safeArray(clausesExtracted),
        clause_ledger: safeArray(resolvedLedger),
        issues_validated: safeArray(resolvedIssues),
        flags: scanFull?.flags || canonical?.flags || {},
        summaryObj: scanFull?.summary || canonical?.summary || null,
        usedCanonicalPdf: true
      }
    };
  }


  // If we have new pipeline objects, derive issues if needed
  if (!safeArray(issuesValidated).length && safeArray(clauseLedger).length) {
    issuesValidated = deriveIssuesValidatedFromLedger(clauseLedger);
  }


  const nowIso = new Date().toISOString();
  return {
    lease_address:
      scanFull?.key_terms?.property_address ||
      leaseData?.property_address ||
      scanData?.lease_id ||
      "Lease Agreement",
    generated_date: nowIso,
    risk_score: scanData?.risk_score || 0,
    summary: scanData?.summary || "",
    key_terms: scanFull?.key_terms || {},
    flags: [],
    clause_review: [],
    clause_ledger: safeArray(clauseLedger),
    mappings: [],
    missing_clauses: [],
    coverage_summary: {
      total_clauses: safeArray(clauseLedger).length,
      clauses_reviewed: 0,
      clauses_flagged: safeArray(issuesValidated).length
    },
    fallback: false,
    requestId,
    __resolved: {
      clauses_extracted: safeArray(clausesExtracted),
      clause_ledger: safeArray(clauseLedger),
      issues_validated: safeArray(issuesValidated),
      flags: scanFull?.flags || canonical?.flags || {},
      summaryObj: scanFull?.summary || canonical?.summary || null,
      usedCanonicalPdf: false
    }
  };
}


function issuesValidatedToFlags(issuesValidated, clauseLedger) {
  const ledger = safeArray(clauseLedger);
  const byId = new Map(ledger.map((c) => [c?.clause_id, c]));
  return safeArray(issuesValidated).map((i, idx) => {
    const sev = toSeverity(i?.risk_level);
    const clause = byId.get(i?.clause_id);
    const evidence =
      String(i?.rationale || "").slice(0, 240) ||
      String(clause?.text || clause?.full_text || "").slice(0, 240) ||
      `[Evidence not extracted for ${i?.title || `Issue ${idx + 1}`}]`;


    const recs = safeArray(i?.recommended_actions).filter(Boolean);
    const category = i?.taxonomy_code || "Other Risks";


    return {
      clause_id: i?.clause_id || `unknown-${Math.random().toString(36).slice(2, 9)}`,
      severity: sev === "no_risk" ? "none" : sev,
      category,
      title: i?.title || "Issue detected",
      description: i?.rationale || "Review required",
      explanation: "",
      recommendation: recs.join("\n"),
      evidence
    };
  });
}


export default function ReportFullInner({ scanId, leaseId, showDebug, forensicData, passedScanFull }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbValidation, setDbValidation] = useState(null);
  const [loadSteps, setLoadSteps] = useState([]);
  const [user, setUser] = useState(null);
  const [lease, setLease] = useState(null);
  const [scan, setScan] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [debugTraceModalOpen, setDebugTraceModalOpen] = useState(false);
  const [debugTraceData, setDebugTraceData] = useState(null);
  const [materializing, setMaterializing] = useState(false);
  const materializeAttempted = useRef(false);
  const [showSelfTest, setShowSelfTest] = useState(false);


  useEffect(() => {
    let cancelled = false;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const startTime = Date.now();
    const steps = [];
    const logStep = (step, data) => {
      const entry = { step, timestamp: Date.now() - startTime, ...(data || {}) };
      steps.push(entry);
      // eslint-disable-next-line no-console
      console.log(`[${requestId}] ${step}:`, data || {});
      if (!cancelled) setLoadSteps((prev) => [...prev, entry]);
    };


    const timeoutId = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error(`[${requestId}] WATCHDOG TIMEOUT at ${Date.now() - startTime}ms`);
      if (!cancelled) {
        setError({
          step: "WATCHDOG",
          code: "TIMEOUT",
          message: "Report load timed out.",
          requestId,
          scanId,
          leaseId,
          elapsedMs: Date.now() - startTime,
          debugData: { steps }
        });
        setLoading(false);
      }
    }, 20000);


    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        logStep("INIT", { scanId, leaseId, requestId });


        // STEP 1: user
        logStep("FETCH_USER_START");
        const userRes = await base44.auth.me();
        logStep("FETCH_USER_COMPLETE", { userId: userRes?.id });

        // ═══════════════════════════════════════════════════════════════════════
        // FORENSIC LOGS: TRACK FULL FLOW FROM USER TO LEASE QUERY
        // ═══════════════════════════════════════════════════════════════════════
        console.log('[REPORTFULL_USER]', userRes?.email);
        console.log('[REPORTFULL_QUERY]', { leaseId, filter: { owner_email: userRes.email } });

        // STEP 2: lease
        logStep("FETCH_LEASE_START", { leaseId });
        const leaseArr = await base44.entities.Lease.filter({ owner_email: userRes.email });
        
        console.log('[REPORTFULL_RESULT]', { 
          found: leaseArr.some(l => l.id === leaseId),
          leaseData: leaseArr.find(l => l.id === leaseId) || null,
          totalResults: leaseArr.length,
          leaseIds: leaseArr.map(l => l.id),
          targetLeaseId: leaseId,
          allLeaseEmails: leaseArr.map(l => ({ id: l.id, owner_email: l.owner_email, created_by: l.created_by }))
        });

        const leaseData = leaseArr?.find(l => l.id === leaseId) || null;
        logStep("FETCH_LEASE_COMPLETE", { found: !!leaseData });


        // STEP 3: scan
        logStep("FETCH_SCAN_START", { scanId });
        const scanArr = await base44.entities.LeaseScan.filter({ id: scanId });
        let scanData = scanArr?.[0] || null;
        logStep("FETCH_SCAN_COMPLETE", { found: !!scanData });


        // STEP 4: validate presence
        logStep("VALIDATE_RECORDS_START");
        const validation = {
          scanFound: !!scanData,
          leaseFound: !!leaseData,
          scanId,
          leaseId
        };


        if (!leaseData) {
          const err = new Error(`LEASE_NOT_FOUND: No lease record for ID ${leaseId}`);
          err.code = "LEASE_NOT_FOUND";
          err.step = "FETCH_LEASE";
          throw err;
        }
        if (!scanData) {
          const err = new Error(`SCAN_NOT_FOUND: No scan record for ID ${scanId}`);
          err.code = "SCAN_NOT_FOUND";
          err.step = "FETCH_SCAN";
          throw err;
        }


        // STEP 5: USE PASSED DATA OR FETCH FROM DB
        logStep("MATERIALIZE_START", { hasPassedData: !!passedScanFull });

        if (passedScanFull) {
          // FAST PATH: Use data passed from upload flow (no DB lag)
          logStep("USING_PASSED_DATA", { 
            clausesCount: passedScanFull.clauses?.length || 0,
            riskScore: passedScanFull.risk_score
          });

          validation.scanFullKeys = Object.keys(passedScanFull);
          validation.dataSource = 'passed_from_upload';

          if (!cancelled) {
            setDbValidation(validation);
            setUser(userRes);
            setLease(leaseData);
            setScan(scanData); // Keep original scan metadata
            setReportData(passedScanFull);
            setLoading(false);
            logStep('RENDER_SUCCESS_DIRECT', { totalElapsed: Date.now() - startTime });
          }
          return;
        }

        // FALLBACK PATH: Fetch from DB (for page refreshes, direct links, etc.)
        if (!cancelled) setMaterializing(true);
        logStep("REFETCH_SCAN_FOR_LATEST");

        let finalScanData = scanData;
        let scanFull = scanData?.scan_full ?? null;

        // Retry up to 5 times with increasing delays to get fresh data
        const maxRetries = 5;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const delay = attempt * 500;
          await new Promise(resolve => setTimeout(resolve, delay));

          const scanArrRefresh = await base44.entities.LeaseScan.filter({ id: scanId });
          const scanDataRefresh = scanArrRefresh?.[0] || null;

          const refreshedScanFull = scanDataRefresh?.scan_full ?? null;
          const hasNewFormat = refreshedScanFull && (
            Array.isArray(refreshedScanFull.clauses) && refreshedScanFull.clauses.length > 0 &&
            typeof refreshedScanFull.risk_score === 'number'
          );

          logStep(`REFETCH_ATTEMPT_${attempt}`, {
            found: !!scanDataRefresh,
            hasNewFormat,
            clausesCount: refreshedScanFull?.clauses?.length || 0,
            riskScore: refreshedScanFull?.risk_score,
            keys: refreshedScanFull ? Object.keys(refreshedScanFull) : []
          });

          if (hasNewFormat) {
            finalScanData = scanDataRefresh;
            scanFull = refreshedScanFull;
            logStep("REFETCH_SUCCESS", { attempt, clausesCount: scanFull.clauses.length, riskScore: scanFull.risk_score });
            break;
          }

          if (attempt === maxRetries) {
            logStep("REFETCH_EXHAUSTED", { 
              message: "Max retries reached, using whatever data we have",
              finalHasData: !!refreshedScanFull,
              finalClausesCount: refreshedScanFull?.clauses?.length || 0
            });
            if (scanDataRefresh) {
              finalScanData = scanDataRefresh;
              scanFull = refreshedScanFull;
            }
          }
        }

        const scanFullKeys = scanFull ? Object.keys(scanFull) : [];
        console.log('[MATERIALIZE] scan_full keys:', scanFullKeys);
        validation.scanFullKeys = scanFullKeys;
        validation.dataSource = 'db_refetch';

        const hasNewFormat = scanFull && (
          Array.isArray(scanFull.clauses) || 
          typeof scanFull.risk_score === 'number' ||
          scanFull.summary?.top_risks
        );

        logStep("FORMAT_CHECK", { hasNewFormat, scanFullKeys });

        if (!scanFull) {
          const err = new Error('NO_SOURCE_DATA');
          err.code = 'NO_SOURCE_DATA';
          err.step = 'MATERIALIZE';
          throw err;
        }
        if (!cancelled) setMaterializing(false);
        if (!cancelled) setDbValidation(validation);
        if (!cancelled) {
          setUser(userRes);
          setLease(leaseData);
          setScan(finalScanData);
          setReportData(scanFull);
          setLoading(false);
          logStep('RENDER_SUCCESS', { totalElapsed: Date.now() - startTime });
        }
        return;
      } catch (err) {
        logStep("ERROR_CAUGHT", {
          step: err?.step || "UNKNOWN",
          code: err?.code || "UNKNOWN",
          message: err?.message,
          elapsed: Date.now() - startTime
        });
        if (!cancelled) {
          setError({
            step: err?.step || "UNKNOWN",
            code: err?.code || "UNKNOWN",
            message: err?.message || "Failed to load report",
            stack: err?.stack,
            requestId,
            scanId,
            leaseId,
            elapsedMs: Date.now() - startTime,
            debugData: err?.debugData || {},
            steps
          });
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setMaterializing(false);
          setLoading(false);
        }
      }
    }


    loadData();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [scanId, leaseId]);


  // Compute colors and language (NO HOOKS BELOW)
  const isDarkMode = user?.theme === "dark";
  const language = user?.language || "en";
  const colors = isDarkMode
    ? { bg: "#1A1D1F", cardBg: "#2A2D30", textPrimary: "#ECEFED", textSecondary: "#A8ABAD", borderColor: "#3A3D40" }
    : { bg: "#F8FAFC", cardBg: "#FFFFFF", textPrimary: "#1A1D1F", textSecondary: "#64748b", borderColor: "#E5E7EB" };


  const loadingStrings = {
    en: { materializing: "Preparing report...", loading: "Loading report...", building: "Building report from scan data" },
    th: { materializing: "กำลังเตรียมรายงาน...", loading: "กำลังโหลดรายงาน...", building: "กำลังสร้างรายงานจากข้อมูลสแกน" },
    zh: { materializing: "正在准备报告...", loading: "正在加载报告...", building: "正在从扫描数据生成报告" },
    ja: { materializing: "レポートを準備中...", loading: "レポートを読み込み中...", building: "スキャンデータからレポートを作成中" },
    ko: { materializing: "보고서 준비 중...", loading: "보고서 로드 중...", building: "스캔 데이터에서 보고서 작성 중" },
    ru: { materializing: "Подготовка отчёта...", loading: "Загрузка отчёта...", building: "Формирование отчёта из данных сканирования" }
  };
  const ls = loadingStrings[language] || loadingStrings.en;

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "#0C3B2E" }} />
          <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            {materializing ? ls.materializing : ls.loading}
          </p>
          {materializing && (
            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <Wrench className="w-4 h-4" />
              <span>{ls.building}</span>
            </div>
          )}
        </div>
      </div>
    );
  }


  if (error) {
    return <ErrorPanel error={error} colors={colors} />;
  }


  if (!user || !lease || !scan || !reportData) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: colors.bg }}>
        <div className="max-w-4xl mx-auto">
          <Card style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {(t[language] || t.en).errorLoading}
              </h2>
              <p className="mb-6" style={{ color: colors.textSecondary }}>
                {(t[language] || t.en).failedLoad}
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {(t[language] || t.en).retry}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  const adminLike = ['admin','super_admin','va'].includes((user?.role || user?.access_level || '').toLowerCase());
  const riskLevel = getRiskLevel(reportData.risk_score);
  const totalClauses = (reportData.clause_ledger || []).length;
  const risksCount = (reportData.clause_review || []).filter((r) => r?.risk_level && r.risk_level !== "none").length;


  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const response = await base44.functions.invoke("generateLeaseReportPDF", { scanId });
      if (response?.data?.pdf_url) {
        // Mobile-friendly download
        const pdfUrl = response.data.pdf_url;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `Lease_Shield_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("PDF generation failed.");
      }
    } catch (err) {
      alert("PDF export failed: " + (err?.message || "Unknown error"));
    } finally {
      setExportingPdf(false);
    }
    };

    const handleExportPdfDebug = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const response = await base44.functions.invoke("generateLeaseReportPDF", { scanId, debug: true });
      const data = response?.data ?? {};
      if (data?.debug_trace) {
        setDebugTraceData(data.debug_trace);
        setDebugTraceModalOpen(true);
      }
      // Optionally open PDF if provided
      if (data?.pdf_url) {
        window.open(data.pdf_url, "_blank");
      }
    } catch (err) {
      alert("Debug export failed: " + (err?.message || "Unknown error"));
    } finally {
      setExportingPdf(false);
    }
    };


  const t = {
    en: {
      allIssues: "Issues Requiring Attention",
      clauseAnalysis: "Clause-by-Clause Analysis",
      noIssues: "No issues found",
      property: "Property",
      summary: "Summary",
      exportPdf: "Export PDF",
      exportReport: "Export Report",
      viewLease: "View Original Lease",
      clauseCoverage: "Clause Coverage",
      reportTitle: "Full Lease Analysis Report",
      whatThisMeans: "What This Means",
      recommendations: "Recommendation",
      back: "Back",
      generating: "Generating...",
      errorLoading: "Error Loading Report",
      failedLoad: "Failed to load report data.",
      retry: "Retry",
      addressNotSpecified: "Property address not specified",
      noClausesParsed: "No clauses parsed.",
      docTemplates: "Document Templates",
      docTemplatesDesc: "Access ready-made letter and document templates",
      viewTemplates: "View Templates",
      viewFullAnalysis: "View Full Clause-by-Clause Analysis",
      upgradeNow: "Upgrade Now",
      topRisks: "Top Risks Identified",
      showing: "Showing",
      of: "of",
      clauses: "clauses",
      exportUpgrade: "Export (Upgrade)"
    },
    th: {
      allIssues: "ปัญหาที่ต้องให้ความสนใจ",
      clauseAnalysis: "การวิเคราะห์ทีละข้อ",
      noIssues: "ไม่พบปัญหา",
      property: "ทรัพย์สิน",
      summary: "สรุป",
      exportPdf: "ส่งออก PDF",
      exportReport: "ส่งออกรายงาน",
      viewLease: "ดูสัญญาต้นฉบับ",
      clauseCoverage: "ความครอบคลุม",
      reportTitle: "รายงานวิเคราะห์สัญญาเช่าฉบับเต็ม",
      whatThisMeans: "ความหมาย",
      recommendations: "คำแนะนำ",
      back: "กลับ",
      generating: "กำลังสร้าง...",
      errorLoading: "เกิดข้อผิดพลาดในการโหลดรายงาน",
      failedLoad: "ไม่สามารถโหลดข้อมูลรายงานได้",
      retry: "ลองใหม่",
      addressNotSpecified: "ไม่ระบุที่อยู่",
      noClausesParsed: "ไม่พบข้อสัญญา",
      docTemplates: "เทมเพลตเอกสาร",
      docTemplatesDesc: "เข้าถึงเทมเพลตจดหมายและเอกสารสำเร็จรูป",
      viewTemplates: "ดูเทมเพลต",
      viewFullAnalysis: "ดูการวิเคราะห์ทีละข้อฉบับเต็ม",
      upgradeNow: "อัปเกรดเลย",
      topRisks: "ความเสี่ยงหลัก",
      showing: "แสดง",
      of: "จาก",
      clauses: "ข้อ",
      exportUpgrade: "ส่งออก (อัปเกรด)"
    },
    zh: {
      allIssues: "需要注意的问题",
      clauseAnalysis: "逐条分析",
      noIssues: "未发现问题",
      property: "物业",
      summary: "摘要",
      exportPdf: "导出 PDF",
      exportReport: "导出报告",
      viewLease: "查看原始租约",
      clauseCoverage: "条款覆盖",
      reportTitle: "完整租约分析报告",
      whatThisMeans: "含义说明",
      recommendations: "建议",
      back: "返回",
      generating: "生成中...",
      errorLoading: "加载报告出错",
      failedLoad: "加载报告数据失败",
      retry: "重试",
      addressNotSpecified: "未指定物业地址",
      noClausesParsed: "未解析到条款",
      docTemplates: "文档模板",
      docTemplatesDesc: "访问现成的信函和文档模板",
      viewTemplates: "查看模板",
      viewFullAnalysis: "查看完整逐条分析",
      upgradeNow: "立即升级",
      topRisks: "主要风险",
      showing: "显示",
      of: "/",
      clauses: "条",
      exportUpgrade: "导出（升级）"
    },
    ja: {
      allIssues: "注意が必要な問題",
      clauseAnalysis: "条項ごとの分析",
      noIssues: "問題は見つかりませんでした",
      property: "物件",
      summary: "概要",
      exportPdf: "PDF エクスポート",
      exportReport: "レポートをエクスポート",
      viewLease: "原本を表示",
      clauseCoverage: "条項カバレッジ",
      reportTitle: "賃貸契約分析レポート",
      whatThisMeans: "意味",
      recommendations: "推奨事項",
      back: "戻る",
      generating: "生成中...",
      errorLoading: "レポート読み込みエラー",
      failedLoad: "レポートデータの読み込みに失敗しました",
      retry: "再試行",
      addressNotSpecified: "住所未指定",
      noClausesParsed: "条項が解析されませんでした",
      docTemplates: "文書テンプレート",
      docTemplatesDesc: "既成のレターおよび文書テンプレートにアクセス",
      viewTemplates: "テンプレートを見る",
      viewFullAnalysis: "完全な条項分析を表示",
      upgradeNow: "今すぐアップグレード",
      topRisks: "主なリスク",
      showing: "表示",
      of: "/",
      clauses: "条項",
      exportUpgrade: "エクスポート（アップグレード）"
    },
    ko: {
      allIssues: "주의가 필요한 문제",
      clauseAnalysis: "조항별 분석",
      noIssues: "문제가 발견되지 않았습니다",
      property: "부동산",
      summary: "요약",
      exportPdf: "PDF 내보내기",
      exportReport: "보고서 내보내기",
      viewLease: "원본 계약서 보기",
      clauseCoverage: "조항 범위",
      reportTitle: "임대 계약 분석 보고서",
      whatThisMeans: "의미",
      recommendations: "권장 사항",
      back: "뒤로",
      generating: "생성 중...",
      errorLoading: "보고서 로드 오류",
      failedLoad: "보고서 데이터를 로드할 수 없습니다",
      retry: "재시도",
      addressNotSpecified: "주소 미지정",
      noClausesParsed: "조항이 분석되지 않았습니다",
      docTemplates: "문서 템플릿",
      docTemplatesDesc: "기성 편지 및 문서 템플릿에 액세스",
      viewTemplates: "템플릿 보기",
      viewFullAnalysis: "전체 조항별 분석 보기",
      upgradeNow: "지금 업그레이드",
      topRisks: "주요 위험",
      showing: "표시",
      of: "/",
      clauses: "조항",
      exportUpgrade: "내보내기 (업그레이드)"
    },
    ru: {
      allIssues: "Вопросы, требующие внимания",
      clauseAnalysis: "Постатейный анализ",
      noIssues: "Проблем не обнаружено",
      property: "Недвижимость",
      summary: "Резюме",
      exportPdf: "Экспорт PDF",
      exportReport: "Экспорт отчёта",
      viewLease: "Просмотреть оригинал",
      clauseCoverage: "Охват статей",
      reportTitle: "Полный анализ договора аренды",
      whatThisMeans: "Что это значит",
      recommendations: "Рекомендации",
      back: "Назад",
      generating: "Генерация...",
      errorLoading: "Ошибка загрузки отчёта",
      failedLoad: "Не удалось загрузить данные отчёта",
      retry: "Повторить",
      addressNotSpecified: "Адрес не указан",
      noClausesParsed: "Статьи не разобраны",
      docTemplates: "Шаблоны документов",
      docTemplatesDesc: "Готовые шаблоны писем и документов",
      viewTemplates: "Смотреть шаблоны",
      viewFullAnalysis: "Просмотреть полный постатейный анализ",
      upgradeNow: "Обновить сейчас",
      topRisks: "Основные риски",
      showing: "Показано",
      of: "из",
      clauses: "статей",
      exportUpgrade: "Экспорт (обновить)"
    }
  };


const strings = t[language] || t.en;

// Cloudflare SSoT view model
const sf = reportData || {};
console.log('DEBUG_REPORTDATA:', {
  reportData_keys: Object.keys(reportData || {}),
  reportData_preview: JSON.stringify(reportData).substring(0, 500)
});
const meta = sf.meta || {};

// Check if this is a preview mode scan (free tier)
// CRITICAL: Only use sf.preview_mode flag - the scan determines this based on user tier at scan time
const isPreviewMode = sf.preview_mode === true;
const upgradeMessage = sf.upgrade_message || 'Upgrade to see full clause-by-clause analysis';

console.log('[PREVIEW_MODE_CHECK]', { 
  sf_preview_mode: sf.preview_mode, 
  isPreviewMode,
  clausesCount: sf.clauses?.length || 0
});

// Map top_risks to display format (for Explorer tier preview mode)
const topRisksRaw = Array.isArray(sf.summary?.top_risks) ? sf.summary.top_risks : [];
const topRisks = topRisksRaw.map((risk, idx) => {
  if (typeof risk === 'string') {
    return { title: risk, severity: 'high', why: 'Risk identified in lease' };
  }
  return risk;
});

// Display top risks in preview mode (Explorer tier)
const topRisksSection = isPreviewMode && topRisks.length > 0 ? (
  <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: colors.borderColor, backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
    <h4 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>
      {strings.topRisks}
    </h4>
    <ul className="space-y-2">
      {topRisks.slice(0, 5).map((risk, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <span className="text-red-600 font-bold mt-0.5 flex-shrink-0">•</span>
          <span style={{ color: colors.textPrimary }}>
            {typeof risk === 'string' ? risk : risk.title || `Risk ${idx + 1}`}
          </span>
        </li>
      ))}
    </ul>
  </div>
) : null;

// Map clauses to normalize field names with 3 recommendations each
const clausesRaw = Array.isArray(sf.clauses) ? sf.clauses : [];
const allClauses = clausesRaw.map((c, idx) => {
  const riskLevel = c.risk_level || 'none';
  const recommendation = resolveRecommendation(c.recommendation || c.recommended_action || c.recommendations);
  
  return {
    clause_id: c.clause_id || c.catalog_id || `clause-${idx}`,
    original_clause_number: c.original_clause_number || String(idx + 1),
    original_clause_title: c.original_clause_title || c.canonical_name || c.title || `Clause ${idx + 1}`,
    title: c.original_clause_title || c.canonical_name || c.title || `Clause ${idx + 1}`,
    risk_level: riskLevel,
    plain_english: c.analysis || c.explanation || c.plain_english || c.risk_summary || '—',
    text: c.clause_text || c.text || c.full_text || '',
    recommendation
  };
});

// TIER-BASED FILTERING: Lite tier shows top 5 highest-risk clauses only
const userTier = user?.plan_tier || 'free';
const isLiteTier = userTier === 'lite';

// Sort clauses by risk level for Lite tier (CRITICAL > HIGH > MEDIUM > LOW)
const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
const sortedByRisk = [...allClauses].sort((a, b) => {
  const riskDiff = (riskOrder[a.risk_level] || 0) - (riskOrder[b.risk_level] || 0);
  if (riskDiff !== 0) return -riskDiff; // Descending
  return 0; // Stable sort for same risk level
});

// Lite tier: top 5 highest-risk clauses | Other tiers: all clauses
const clauses = isLiteTier ? sortedByRisk.slice(0, 5) : allClauses;
const hiddenClausesCount = isLiteTier ? Math.max(0, allClauses.length - 5) : 0;

console.log('[TIER_BASED_FILTERING]', {
  userTier,
  isLiteTier,
  totalClauses: allClauses.length,
  displayedClauses: clauses.length,
  hiddenClauses: hiddenClausesCount
});

// For preview mode, text_length will be 0 (no clauses) - that's expected, not an error
const textTooShort = !isPreviewMode && meta.text_length !== null && (meta.text_length || 0) < 500 && clauses.length > 0;

// Build detailed executive summary
let detailedSummary = buildExecutiveSummary(
  sf.risk_score, 
  topRisks, 
  clausesRaw, 
  sf.summary?.executive_summary,
  language
);

// Add Lite tier limitation notice to summary
if (isLiteTier && hiddenClausesCount > 0) {
  const liteNotice = language === 'th'
    ? `\n\n**หมายเหตุ:** รายงาน Lite tier นี้แสดงการวิเคราะห์ ${clauses.length} ข้อที่มีความเสี่ยงสูงสุด ตรวจพบเพิ่มเติมอีก ${hiddenClausesCount} ข้อ อัปเกรดเป็น Protect เพื่อดูการวิเคราะห์ครบทั้งหมด ${allClauses.length} ข้อ`
    : `\n\n**Note:** This Lite tier report shows analysis of the ${clauses.length} highest-risk clauses. ${hiddenClausesCount} additional clause${hiddenClausesCount !== 1 ? 's were' : ' was'} detected. Upgrade to Protect for complete analysis of all ${allClauses.length} clauses.`;
  
  detailedSummary += liteNotice;
}


  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{ backgroundColor: colors.bg, paddingBottom: "100px", fontFamily: "Noto Sans Thai, Inter, system-ui" }}
    >
      <div className="max-w-4xl mx-auto">
        {showDebug && (
          <Card className="mb-4 border-2 border-emerald-500" style={{ backgroundColor: "#D1FAE5" }}>
            <CardContent className="p-4">
              <h3 className="font-bold text-emerald-800 mb-2">Forensic Debug Panel</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs font-bold text-emerald-700 mb-1">URL INFO</div>
                  <div className="bg-white p-2 rounded text-xs font-mono">
                    <div>Path: {forensicData?.pathname || "N/A"}</div>
                    <div>Search: {forensicData?.search || "(empty)"}</div>
                    <div>Editor: {String(forensicData?.isEditorPreview)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700 mb-1">PARAMS RESOLVED</div>
                  <div className="bg-white p-2 rounded text-xs font-mono">
                    <div>scanId: {scanId}</div>
                    <div>leaseId: {leaseId}</div>
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-emerald-700 mb-1">DB VALIDATION</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                {dbValidation ? JSON.stringify(dbValidation, null, 2) : "Loading..."}
              </pre>
              <div className="text-xs font-bold text-emerald-700 mb-1 mt-3">REPORT DATA</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
{`Risk Score: ${reportData.risk_score}
Total Clauses: ${totalClauses}
Risks: ${risksCount}
Flags: ${(reportData.flags || []).length}
Has PDF Payload: ${!!(scan?.scan_full?.canonical_report?.pdfPayload)}
Materialized Status: ${scan?.scan_full?.materialized_status || "(none)"}`}
              </pre>
              <div className="text-xs font-bold text-emerald-700 mb-1 mt-3">LOAD STEPS</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                {loadSteps.map((s) => `[${s.timestamp}ms] ${s.step}`).join("\n")}
              </pre>
              {/* Diagnostics (Self-Test) */}
              {(() => {
                const selfTest = scan?.scan_full?.self_test;
                if (!selfTest) return null;
                return (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-700">Diagnostics (Self-Test)</div>
                      <Button variant="outline" size="sm" onClick={() => setShowSelfTest(!showSelfTest)}>
                        {showSelfTest ? "Hide" : "Show"}
                      </Button>
                    </div>
                    {!selfTest.overall_pass && (
                      <div className="mt-3 p-3 rounded-md border-2 border-red-500 bg-red-50 text-red-800 text-sm">
                        Scan diagnostics failed. This indicates missing coverage or mapping. Please rescan or contact support.
                      </div>
                    )}
                    {showSelfTest && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-2 rounded border bg-white">
                          <div className="font-semibold mb-1">Ledger Integrity</div>
                          <div>clauses_extracted_len: {selfTest.clause_ledger_integrity.clauses_extracted_len}</div>
                          <div>clause_ledger_len: {selfTest.clause_ledger_integrity.clause_ledger_len}</div>
                          <div>pass_same_length: {String(selfTest.clause_ledger_integrity.pass_same_length)}</div>
                        </div>
                        <div className="p-2 rounded border bg-white">
                          <div className="font-semibold mb-1">Multi-Risk Expansion</div>
                          <div>total_risk_items_from_ledger: {selfTest.multi_risk_expansion.total_risk_items_from_ledger}</div>
                          <div>issues_validated_len: {selfTest.multi_risk_expansion.issues_validated_len}</div>
                          <div>pass_equal_counts: {String(selfTest.multi_risk_expansion.pass_equal_counts)}</div>
                        </div>
                        <div className="p-2 rounded border bg-white">
                          <div className="font-semibold mb-1">Recommendations</div>
                          <div>issues_missing_actions: {selfTest.recommendations_guaranteed.issues_missing_actions.length}</div>
                          <div>pass_all_have_actions: {String(selfTest.recommendations_guaranteed.pass_all_have_actions)}</div>
                        </div>
                        <div className="p-2 rounded border bg-white">
                          <div className="font-semibold mb-1">Overall</div>
                          <div>overall_pass: {String(selfTest.overall_pass)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}




        {/* Existing JSX BELOW — unchanged */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {strings.back}
          </Button>
          <div className="flex items-center gap-2">
            {!isPreviewMode && (
              <Button onClick={handleExportPdf} disabled={exportingPdf} style={{ backgroundColor: "#0C3B2E", color: "#fff" }}>
                {exportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {strings.generating}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {strings.exportReport}
                  </>
                )}
              </Button>
            )}
            {isPreviewMode && (
              <Button 
                onClick={() => window.location.href = '/account#plans'}
                style={{ backgroundColor: "#0C3B2E", color: "#fff" }}
                title={strings.exportUpgrade}
              >
                <Download className="w-4 h-4 mr-2" />
                {strings.exportUpgrade}
              </Button>
            )}
          </div>
        </div>


        {debugTraceModalOpen && debugTraceData && (
          <Card className="mb-4" style={{ backgroundColor: colors.cardBg }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold" style={{ color: colors.textPrimary }}>PDF Export Debug Trace</h3>
                <Button variant="outline" size="sm" onClick={() => setDebugTraceModalOpen(false)}>Close</Button>
              </div>
              <pre className="text-xs overflow-auto max-h-72 p-3 rounded" style={{ backgroundColor: isDarkMode ? '#111827' : '#F3F4F6', color: colors.textPrimary }}>
        {JSON.stringify(debugTraceData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-xl mb-6 overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
          <CardHeader
            style={{
              backgroundColor: (() => {
                const sev = highestSeverity((reportData.flags || []).map((f) => f.severity));
                return SEVERITY_CONFIG[sev]?.palette?.border || "#0C3B2E";
              })()
            }}
          >
            <div className="text-white">
              <CardTitle className="text-2xl font-bold mb-3">{strings.reportTitle}</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  className="text-2xl px-4 py-2 font-bold"
                  style={{ backgroundColor: riskLevel.bg, color: riskLevel.color, border: `2px solid ${riskLevel.color}` }}
                >
                  {reportData.risk_score || 0}/100
                </Badge>
                <Badge className="text-lg px-4 py-2 font-bold" style={{ backgroundColor: "#FFFFFF", color: riskLevel.color }}>
                  {riskLevel.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Missing Critical Clauses - Phase 1 */}
            {reportData.missingCriticalClauses && reportData.missingCriticalClauses.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <MissingCriticalClauses
                  missingCriticalClauses={reportData.missingCriticalClauses}
                  language={language}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}
            {/* Error banner if extraction failed / empty - ONLY show for paid users (not preview mode) */}
            {!isPreviewMode && (clauses.length === 0 || textTooShort) && (
              <div className="mb-4 p-4 rounded-lg border-2" style={{ backgroundColor: isDarkMode ? '#3A2626' : '#FEF2F2', borderColor: '#EF4444' }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold" style={{ color: '#B91C1C' }}>Extraction failed / empty text</p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      text_length={meta.text_length || 0}, chunks={meta.chunks || 0}
                    </p>
                    {Array.isArray(sf.debug?.warnings) && sf.debug.warnings.length > 0 && (
                      <ul className="list-disc pl-6 mt-2 text-sm" style={{ color: colors.textSecondary }}>
                        {sf.debug.warnings.map((w, i) => (<li key={i}>{String(w)}</li>))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Property Address - Prominently displayed */}
            <div className="mb-6 p-4 rounded-lg border-2" style={{ 
              backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF',
              borderColor: '#3B82F6'
            }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                {strings.property}
              </span>
              <p className="text-xl font-bold mt-2" style={{ 
                color: colors.textPrimary,
                lineHeight: '1.5'
              }}>
                {/* Priority order for property address resolution */}
                {lease?.property_address || 
                 scan?.scan_preview?.property_address ||
                 scan?.scan_full?.key_terms?.property_address ||
                 reportData?.key_terms?.property_address || 
                 reportData?.lease_address || 
                 sf?.key_terms?.property_address ||
                 sf?.summary?.property_address ||
                 sf?.meta?.property_address || 
                 strings.addressNotSpecified}
              </p>
            </div>

            {/* Executive summary - Detailed multi-paragraph */}
            <div className="mb-6">
              <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                {strings.summary}:
              </span>
              <div className="mt-2 p-4 rounded-lg" style={{ 
                backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC',
                border: `1px solid ${colors.borderColor}`
              }}>
                {detailedSummary.split('\n').map((paragraph, idx) => (
                  <p key={idx} className={idx > 0 ? 'mt-3' : ''} style={{ 
                    color: paragraph.includes('RECOMMENDATION') || paragraph.includes('คำแนะนำ') || paragraph.includes('⚠️')
                      ? (sf.risk_score >= 70 ? '#B91C1C' : sf.risk_score >= 40 ? '#92400E' : '#065F46')
                      : colors.textPrimary,
                    fontWeight: paragraph.includes('RECOMMENDATION') || paragraph.includes('คำแนะนำ') || paragraph.includes('HIGH RISK') || paragraph.includes('ความเสี่ยงสูง') ? '600' : '400',
                    lineHeight: '1.6'
                  }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Document Templates Link */}
            <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: colors.borderColor, backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold" style={{ color: colors.textPrimary }}>
                    {strings.docTemplates}
                  </h4>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {strings.docTemplatesDesc}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentUrl = window.location.href;
                    sessionStorage.setItem('reportReturnUrl', currentUrl);
                    window.location.href = '/templates';
                  }}
                  style={{ borderColor: '#0C3B2E', color: '#0C3B2E' }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {strings.viewTemplates}
                </Button>
              </div>
            </div>

            {/* PREVIEW MODE: Show top 5 risks + upgrade CTA instead of full clauses */}
            {isPreviewMode && (
              <>
                {topRisksSection}
                <div className="mb-6 p-6 rounded-xl border-2" style={{
                  backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF',
                  borderColor: '#3B82F6'
                }}>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                      backgroundColor: '#3B82F6'
                    }}>
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {strings.viewFullAnalysis}
                    </h3>
                    <p className="mb-4" style={{ color: colors.textSecondary }}>
                      {upgradeMessage}
                    </p>
                    <Button
                      onClick={() => window.location.href = '/account#plans'}
                      style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
                      className="px-8 py-3"
                    >
                      {strings.upgradeNow}
                    </Button>
                    <p className="mt-3 text-xs" style={{ color: colors.textSecondary }}>
                      {language === 'th' 
                        ? 'เริ่มต้นเพียง ฿158/เดือน สำหรับ 6 สแกน/ปี'
                        : 'Starting at ฿158/month for 6 scans/year'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Clauses - Card-based layout with 3 recommendations (only for paid users) */}
            {!isPreviewMode && (
              <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>
                {strings.clauseAnalysis}
              </h3>
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                {isLiteTier && hiddenClausesCount > 0 ? (
                  <>
                    {strings.showing} <strong>{clauses.length}</strong> {strings.of} <strong>{allClauses.length}</strong> {strings.clauses}
                  </>
                ) : (
                  <>
                    {clauses.length} {strings.clauses}
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {clauses.map((c, i) => {
                // STANDARD COLOR SYSTEM - exact match with PDF
                const riskColors = {
                  critical: { bg: '#991B1B', border: '#991B1B', text: '#FFFFFF', badgeText: 'CRITICAL' },
                  high: { bg: '#DC2626', border: '#DC2626', text: '#FFFFFF', badgeText: 'HIGH' },
                  medium: { bg: '#F97316', border: '#F97316', text: '#1A1D1F', badgeText: 'MEDIUM' },
                  low: { bg: '#3B82F6', border: '#3B82F6', text: '#FFFFFF', badgeText: 'LOW' },
                  none: { bg: '#10B981', border: '#10B981', text: '#FFFFFF', badgeText: '✓ BALANCED' }
                };
                const colorSet = riskColors[c.risk_level] || riskColors.none;
                
                return (
                  <div 
                    key={c.clause_id || i} 
                    className="rounded-lg overflow-hidden"
                    style={{ 
                      backgroundColor: colorSet.bg,
                      border: `2px solid ${colorSet.border}`,
                    }}
                  >
                    {/* Header with colored background - match PDF */}
                    <div className="p-4 flex items-start justify-between gap-3" style={{ 
                      backgroundColor: colorSet.bg,
                      color: colorSet.text
                    }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold">#{c.original_clause_number}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: colorSet.text
                          }}>
                            {colorSet.badgeText}
                          </span>
                        </div>
                        <h4 className="font-bold" style={{ color: colorSet.text }}>
                          {c.original_clause_title || c.title}
                        </h4>
                      </div>
                    </div>
                    
                    {/* Plain English Explanation */}
                    <div className="p-4" style={{ 
                      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                      borderTop: `2px solid ${colorSet.border}`
                    }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                        {strings.whatThisMeans}
                      </div>
                      <p className="text-sm" style={{ color: colors.textPrimary, lineHeight: '1.6' }}>
                        {c.plain_english}
                      </p>
                    </div>
                    
                    {/* Single Recommendation */}
                    {c.risk_level !== 'none' && c.recommendation && (
                      <div className="p-4" style={{ 
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        borderTop: `1px solid ${colors.borderColor}`
                      }}>
                        <div className="text-xs font-semibold mb-3" style={{ color: colors.textSecondary }}>
                          {strings.recommendations}
                        </div>
                        <p className="text-sm" style={{ color: colors.textPrimary, lineHeight: '1.5' }}>
                          {c.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {clauses.length === 0 && !isPreviewMode && (
                <div className="p-8 text-center rounded-lg" style={{ backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }}>
                  <p style={{ color: colors.textSecondary }}>
                    {strings.noClausesParsed}
                  </p>
                </div>
              )}
            </div>

            {/* LITE TIER UPGRADE BANNER - Show if clauses are hidden */}
            {isLiteTier && hiddenClausesCount > 0 && (
              <div className="mt-6 p-6 rounded-xl border-2 shadow-lg" style={{
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #1E3A5F 0%, #2A4A6F 100%)'
                  : 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                borderColor: '#C7A338'
              }}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                    backgroundColor: '#C7A338'
                  }}>
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                    {`${strings.viewFullAnalysis} (${allClauses.length})`}
                  </h3>
                  <p className="mb-4" style={{ color: colors.textSecondary }}>
                    {`${strings.showing} 5 ${strings.of} ${allClauses.length} ${strings.clauses}. ${hiddenClausesCount} hidden.`}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-2 text-sm" style={{ color: colors.textPrimary }}>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{language === 'th' ? `การวิเคราะห์ครบทั้งหมด ${allClauses.length} ข้อ` : `Full analysis of all ${allClauses.length} clauses`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: colors.textPrimary }}>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{language === 'th' ? 'การแจ้งเตือน LINE' : 'LINE notifications'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: colors.textPrimary }}>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{language === 'th' ? 'การแจ้งเตือนหลายช่องทาง' : 'Multi-channel alerts'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: colors.textPrimary }}>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{language === 'th' ? '5GB พื้นที่เก็บข้อมูล' : '5GB storage'}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      console.log('[LITE_TIER_UPGRADE_CLICKED]', {
                        userId: user?.id,
                        source: 'clause_limit_banner',
                        hiddenClauses: hiddenClausesCount
                      });
                      window.location.href = '/account#plans';
                    }}
                    style={{ 
                      backgroundColor: '#0C3B2E', 
                      color: '#C7A338',
                      border: '2px solid #C7A338',
                      fontWeight: 'bold',
                      padding: '12px 32px',
                      fontSize: '16px'
                    }}
                    className="hover:bg-green-800 transition-all"
                  >
                    {language === 'th' ? 'อัปเกรดเป็น Protect ฿390/เดือน' : 'Upgrade to Protect for ฿390/month'}
                  </Button>
                  <p className="mt-3 text-xs" style={{ color: colors.textSecondary }}>
                    {language === 'th'
                      ? 'ดูความเสี่ยงทั้งหมดและรับการวิเคราะห์แบบเต็มรูปแบบ'
                      : 'See all risks and get complete analysis'}
                  </p>
                </div>
              </div>
            )}
              </>
            )}
          </CardContent>
        </Card>


        {/* The rest of your JSX is unchanged and will work with reportData.flags and reportData.clause_ledger */}
        {/* ... (KEEP YOUR EXISTING JSX BELOW EXACTLY AS YOU HAVE IT) ... */}


      </div>
    </div>
  );
}