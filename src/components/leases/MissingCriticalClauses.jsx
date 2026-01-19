import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * MissingCriticalClauses - Collapsible view showing ONLY missing clauses
 * Displays 15 critical clause detection results
 */
export default function MissingCriticalClauses({ 
  missingCriticalClauses, 
  language = 'en',
  isDarkMode = false 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!missingCriticalClauses || !Array.isArray(missingCriticalClauses) || missingCriticalClauses.length === 0) {
    return null;
  }

  // Filter to ONLY missing clauses with HIGH confidence
  const missingClauses = missingCriticalClauses.filter(
    c => c.status === "MISSING" && c.confidence === "HIGH"
  );

  const missingCount = missingClauses.length;
  const totalCount = missingCriticalClauses.length;

  const t = {
    en: {
      allPresent: "All critical protections present",
      missingTitle: "Important clauses missing from your lease",
      of: "of",
      tip: "Consider negotiating these protections before signing"
    },
    th: {
      allPresent: "ข้อกำหนดสำคัญทั้งหมดมีอยู่ครบ",
      missingTitle: "ข้อกำหนดสำคัญที่ขาดหายไปในสัญญาเช่า",
      of: "จาก",
      tip: "พิจารณาเจรจาข้อกำหนดเหล่านี้ก่อนลงนาม"
    },
    zh: {
      allPresent: "所有关键保护条款均存在",
      missingTitle: "您的租约中缺失的重要条款",
      of: "共",
      tip: "建议在签约前协商这些保护条款"
    },
    ja: {
      allPresent: "すべての重要な保護条項が存在します",
      missingTitle: "契約書に欠けている重要な条項",
      of: "/",
      tip: "署名前にこれらの保護条項について交渉することを検討してください"
    },
    ko: {
      allPresent: "모든 중요 보호 조항이 존재합니다",
      missingTitle: "계약서에 누락된 중요 조항",
      of: "/",
      tip: "서명 전에 이러한 보호 조항에 대해 협상하는 것을 고려하세요"
    },
    ru: {
      allPresent: "Все критические защитные пункты присутствуют",
      missingTitle: "Важные пункты, отсутствующие в вашем договоре",
      of: "из",
      tip: "Рассмотрите возможность согласования этих защит до подписания"
    }
  };

  const strings = t[language] || t.en;

  const colors = isDarkMode ? {
    successBg: '#052E16',
    successBorder: '#059669',
    successText: '#34D399',
    warningBg: '#422006',
    warningBorder: '#F59E0B',
    warningText: '#FCD34D',
    cardBg: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB'
  } : {
    successBg: '#D1FAE5',
    successBorder: '#059669',
    successText: '#065F46',
    warningBg: '#FEF3C7',
    warningBorder: '#F59E0B',
    warningText: '#92400E',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#6B7280'
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
        <span style={{ fontSize: '24px' }}>✅</span>
        <p style={{ margin: '8px 0 0 0', color: colors.successText, fontWeight: 'bold' }}>
          {strings.allPresent}
        </p>
      </div>
    );
  }

  // Missing clauses - collapsible view
  return (
    <div style={{
      backgroundColor: colors.warningBg,
      border: `2px solid ${colors.warningBorder}`,
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px'
    }}>
      {/* Collapsible Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <h3 style={{ 
            margin: 0, 
            color: colors.warningText,
            fontSize: '15px',
            fontWeight: '700'
          }}>
            {strings.missingTitle} ({missingCount} {strings.of} {totalCount})
          </h3>
        </div>
        <ChevronDown 
          style={{ 
            width: '20px',
            height: '20px',
            color: colors.warningText,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </div>
      
      {/* Expandable Content - ONLY MISSING CLAUSES */}
      {isExpanded && (
        <div style={{ 
          marginTop: '16px',
          animation: 'fadeIn 0.2s ease'
        }}>
          {missingClauses.map(clause => (
            <div key={clause.id} style={{
              padding: '12px',
              backgroundColor: colors.cardBg,
              borderRadius: '8px',
              marginBottom: '8px',
              borderLeft: '4px solid #DC2626'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px' 
              }}>
                <span style={{ marginRight: '8px' }}>❌</span>
                <strong style={{ 
                  color: colors.textPrimary,
                  fontSize: '14px'
                }}>
                  {clause.name.replace(/^CAT-\d+:\s*/i, '')}
                </strong>
              </div>
              <p style={{ 
                margin: '4px 0 0 28px', 
                fontSize: '13px', 
                color: colors.textSecondary,
                lineHeight: '1.4'
              }}>
                {clause.evidence}
              </p>
            </div>
          ))}
          
          <p style={{
            marginTop: '12px',
            fontSize: '13px',
            color: colors.warningText,
            fontStyle: 'italic'
          }}>
            💡 {strings.tip}
          </p>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}