import React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

/**
 * MissingCriticalClauses - Displays detection results for 5 critical clauses
 * Shows which clauses are present/missing in the lease
 */
export default function MissingCriticalClauses({ 
  missingCriticalClauses, 
  language = 'en',
  isDarkMode = false 
}) {
  if (!missingCriticalClauses || !Array.isArray(missingCriticalClauses) || missingCriticalClauses.length === 0) {
    return null;
  }

  // Count high-confidence missing clauses
  const missingCount = missingCriticalClauses.filter(
    clause => clause.status === "MISSING" && clause.confidence === "HIGH"
  ).length;

  const t = {
    en: {
      missingProtections: "Missing Critical Protections",
      allPresent: "All critical clauses present",
      of5: "of 5",
      lowConfidence: "Low Confidence",
      reviewDetails: "Review lease details for specifics"
    },
    th: {
      missingProtections: "การป้องกันที่สำคัญที่ขาดหายไป",
      allPresent: "ข้อกำหนดสำคัญทั้งหมดมีอยู่",
      of5: "จาก 5",
      lowConfidence: "ความเชื่อมั่นต่ำ",
      reviewDetails: "ตรวจสอบรายละเอียดสัญญาเช่าสำหรับรายละเอียดเพิ่มเติม"
    },
    zh: {
      missingProtections: "缺失的关键保护条款",
      allPresent: "所有关键条款均存在",
      of5: "共 5 项",
      lowConfidence: "低置信度",
      reviewDetails: "查看租约详情了解具体内容"
    },
    ja: {
      missingProtections: "欠落している重要な保護条項",
      allPresent: "すべての重要な条項が存在します",
      of5: "/ 5",
      lowConfidence: "低い信頼度",
      reviewDetails: "詳細についてはリース詳細を確認してください"
    },
    ko: {
      missingProtections: "누락된 중요 보호 조항",
      allPresent: "모든 중요 조항이 존재합니다",
      of5: "/ 5",
      lowConfidence: "낮은 신뢰도",
      reviewDetails: "자세한 내용은 임대 계약 세부 정보를 확인하세요"
    },
    ru: {
      missingProtections: "Отсутствующие критические защиты",
      allPresent: "Все критические пункты присутствуют",
      of5: "из 5",
      lowConfidence: "Низкая уверенность",
      reviewDetails: "Просмотрите детали договора для подробностей"
    }
  };

  const strings = t[language] || t.en;

  const colors = isDarkMode ? {
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    warningBg: '#422006',
    warningBorder: '#F59E0B',
    successBg: '#052E16',
    successBorder: '#059669',
    itemBg: '#1F2937'
  } : {
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    warningBg: '#FEF3C7',
    warningBorder: '#F59E0B',
    successBg: '#D1FAE5',
    successBorder: '#059669',
    itemBg: '#FFFFFF'
  };

  // All present - show success state
  if (missingCount === 0) {
    return (
      <div style={{
        backgroundColor: colors.successBg,
        border: `2px solid ${colors.successBorder}`,
        borderRadius: '12px',
        padding: '16px',
        marginTop: '16px',
        textAlign: 'center'
      }}>
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: '#059669' }} />
        <p style={{ margin: '8px 0 0 0', color: '#065F46', fontWeight: 'bold' }}>
          {strings.allPresent}
        </p>
      </div>
    );
  }

  // Some missing - show warning state with details
  return (
    <div style={{
      backgroundColor: colors.warningBg,
      border: `2px solid ${colors.warningBorder}`,
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        gap: '8px'
      }}>
        <AlertTriangle className="w-5 h-5" style={{ color: '#D97706' }} />
        <h3 style={{ 
          margin: 0, 
          color: isDarkMode ? '#FCD34D' : '#92400E',
          fontSize: '14px',
          fontWeight: '700'
        }}>
          {strings.missingProtections} ({missingCount} {strings.of5})
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {missingCriticalClauses.map(clause => (
          <div key={clause.id} style={{
            padding: '12px',
            backgroundColor: colors.itemBg,
            borderRadius: '8px',
            borderLeft: clause.status === 'MISSING' ? '4px solid #DC2626' : '4px solid #059669'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
              <span>
                {clause.status === 'MISSING' ? '❌' : '✅'}
              </span>
              <strong style={{ 
                color: colors.textPrimary,
                fontSize: '13px'
              }}>
                {clause.id}: {clause.name}
              </strong>
              {clause.confidence === 'LOW' && (
                <span style={{
                  marginLeft: '4px',
                  fontSize: '10px',
                  color: '#6B7280',
                  backgroundColor: '#F3F4F6',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {strings.lowConfidence}
                </span>
              )}
            </div>
            <p style={{ 
              margin: '4px 0 0 28px', 
              fontSize: '12px', 
              color: colors.textSecondary,
              lineHeight: '1.4'
            }}>
              {clause.evidence}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}