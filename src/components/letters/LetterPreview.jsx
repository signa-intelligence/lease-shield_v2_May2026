import React from "react";

/**
 * LetterPreview - Renders structured LetterDocument
 * Displays formatted letter with proper spacing, bullets, and signature
 * NO branding inside letter content
 */

export default function LetterPreview({ letterDoc, isDarkMode = false, className = "" }) {
  if (!letterDoc || !letterDoc.blocks) {
    return (
      <div className={`p-6 text-center ${className}`} style={{ color: '#94a3b8' }}>
        {isDarkMode ? 'ไม่มีเนื้อหาจดหมาย' : 'No letter content'}
      </div>
    );
  }

  const colors = isDarkMode ? {
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: 'rgba(255,255,255,0.1)'
  } : {
    text: '#1A1D1F',
    textSecondary: '#64748b',
    border: '#E5E7EB'
  };

  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'date':
        return (
          <div key={index} className="text-right mb-8" style={{ fontSize: '14px', color: colors.textSecondary }}>
            {block.value}
          </div>
        );

      case 'recipient':
        return (
          <div key={index} className="mb-6" style={{ fontSize: '14px', color: colors.text, lineHeight: '1.6' }}>
            {block.lines?.filter(Boolean).map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );

      case 'subject':
        return (
          <div key={index} className="mb-6" style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>
            {block.value}
          </div>
        );

      case 'paragraph':
        return (
          <p key={index} className="mb-6" style={{ fontSize: '14px', lineHeight: '1.8', color: colors.text, textAlign: 'justify' }}>
            {block.value}
          </p>
        );

      case 'bullets':
        return (
          <ul key={index} className="mb-6 space-y-3" style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
            {block.items?.filter(Boolean).map((item, i) => (
              <li key={i} style={{ fontSize: '14px', lineHeight: '1.8', color: colors.text }}>
                {item}
              </li>
            ))}
          </ul>
        );

      case 'closing':
        return (
          <p key={index} className="mb-6" style={{ fontSize: '14px', lineHeight: '1.8', color: colors.text }}>
            {block.value}
          </p>
        );

      case 'signature':
        return (
          <div key={index} className="mt-8" style={{ fontSize: '14px', color: colors.text, lineHeight: '1.6' }}>
            {block.lines?.filter(Boolean).map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={`p-6 md:p-8 ${className}`}
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      {letterDoc.blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}